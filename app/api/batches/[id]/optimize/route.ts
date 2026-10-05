import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCandidateCorrections } from '@/lib/calibration/optimizer';
import { getJevDecision } from '@/lib/jev/client';
import { logAuditEvent } from '@/lib/audit/logger';
import { calculateColorDifference } from '@/lib/color/deltaE';
import { JevStructuredState } from '@/lib/jev/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        master: true,
        measurements: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch || !batch.master) {
      return NextResponse.json(
        { success: false, error: 'Batch or master reference not found' },
        { status: 404 }
      );
    }

    const sample = batch.measurements[0];
    if (!sample) {
      return NextResponse.json(
        { success: false, error: 'No measurement found for this batch' },
        { status: 400 }
      );
    }

    const masterLab = {
      l: batch.master.l,
      a: batch.master.a,
      b: batch.master.b,
      gloss: batch.master.gloss,
    };

    const sampleLab = {
      l: sample.l,
      a: sample.a,
      b: sample.b,
      gloss: sample.gloss,
    };

    // 1. Color Science Metrics
    const metrics = calculateColorDifference(
      masterLab,
      sampleLab,
      batch.master.deltaETolerance,
      batch.master.glossTolerance
    );

    // 2. Optimization Engine generates at least 3 candidates
    const optResult = generateCandidateCorrections(masterLab, sampleLab, {
      colorTolerance: batch.master.deltaETolerance,
      glossTolerance: batch.master.glossTolerance,
    });

    // Clear previous pending corrections for this iteration if any
    await prisma.correction.deleteMany({
      where: {
        batchId: batch.id,
        iteration: batch.currentLoop,
      },
    });

    // Persist Candidates in DB
    const createdCorrections = await Promise.all(
      optResult.candidates.map((c) =>
        prisma.correction.create({
          data: {
            batchId: batch.id,
            iteration: batch.currentLoop,
            rank: c.rank,
            isRecommended: c.isRecommended,
            brownDelta: c.adjustments.brown,
            yellowDelta: c.adjustments.yellow,
            blackDelta: c.adjustments.black,
            redDelta: c.adjustments.red,
            blueDelta: c.adjustments.blue,
            otherDelta: c.adjustments.other,
            predictedDeltaE00: c.predictedDeltaE00,
            predictedDeltaGloss: c.predictedDeltaGloss,
            predictedGloss: c.predictedGloss,
            confidence: c.confidence,
            status: 'GENERATED',
            notes: c.notes,
          },
        })
      )
    );

    // 3. Prepare Structured State for Jev Decision Layer
    // CRITICAL: Jev receives ONLY structured state, never raw images or numeric generation
    const structuredState: JevStructuredState = {
      sku: batch.sku,
      printer: batch.printerId,
      delta_l: metrics.deltaL,
      delta_a: metrics.deltaA,
      delta_b: metrics.deltaB,
      delta_e00: metrics.deltaE00,
      delta_gloss: metrics.deltaGloss,
      current_sample: sampleLab,
      master_target: masterLab,
      candidate_corrections: optResult.candidates.map((c) => ({
        rank: c.rank,
        label: c.label,
        brown: c.adjustments.brown,
        yellow: c.adjustments.yellow,
        black: c.adjustments.black,
        red: c.adjustments.red,
        blue: c.adjustments.blue,
        other: c.adjustments.other,
        predicted_delta_e00: c.predictedDeltaE00,
        predicted_delta_gloss: c.predictedDeltaGloss,
        confidence: c.confidence,
      })),
      model_confidence: optResult.recommendedCandidate.confidence,
      within_printer_constraints: optResult.recommendedCandidate.isWithinBounds,
      is_printer_correction_sufficient: optResult.isPrinterCorrectionSufficient,
      correction_loop: batch.currentLoop,
      max_loops: batch.maxLoops,
    };

    // 4. Call Jev Decision Layer (or Fallback Engine)
    const jevDecision = await getJevDecision(structuredState);

    // Persist Jev Decision in DB
    const savedJev = await prisma.jevDecision.create({
      data: {
        batchId: batch.id,
        iteration: batch.currentLoop,
        decision: jevDecision.decision,
        confidence: jevDecision.confidence,
        probabilities: jevDecision.probabilities ? JSON.stringify(jevDecision.probabilities) : null,
        model: jevDecision.model,
        requiresHumanReview: jevDecision.requiresHumanReview,
        resolvableByPrinterAlone: jevDecision.resolvableByPrinterAlone,
        explanation: jevDecision.explanation,
        rawResponse: jevDecision.rawResponse ? JSON.stringify(jevDecision.rawResponse) : null,
        isFallback: jevDecision.isFallback,
      },
    });

    // Update batch status to QC_REVIEW (or ESCALATED if Jev or optimizer dictated escalation)
    const newStatus = jevDecision.decision === 'ESCALATE' ? 'ESCALATED' : 'QC_REVIEW';
    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: newStatus },
    });

    // 5. Audit Log
    await logAuditEvent({
      batchId: batch.id,
      event: 'CORRECTIONS_OPTIMIZED',
      actor: 'CALIBRATION_ENGINE',
      metadata: {
        recommendedCandidate: optResult.recommendedCandidate,
        candidateCount: optResult.candidates.length,
        jevDecision: jevDecision.decision,
        isFallback: jevDecision.isFallback,
        isSufficient: optResult.isPrinterCorrectionSufficient,
      },
    });

    return NextResponse.json({
      success: true,
      candidates: createdCorrections,
      recommendedCandidate: optResult.recommendedCandidate,
      jevDecision: savedJev,
      isPrinterCorrectionSufficient: optResult.isPrinterCorrectionSufficient,
      statusMessage: optResult.statusMessage,
      diagnosticAdvice: optResult.diagnosticAdvice,
    });
  } catch (err: any) {
    console.error('Error in optimization endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Optimization failed' },
      { status: 500 }
    );
  }
}
