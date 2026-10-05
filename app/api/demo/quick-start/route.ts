import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONFIG } from '@/lib/config';
import { calculateColorDifference } from '@/lib/color/deltaE';
import { generateCandidateCorrections } from '@/lib/calibration/optimizer';
import { getJevDecision } from '@/lib/jev/client';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Locate approved Master V3
    const master = await prisma.master.findUnique({
      where: {
        sku_version: {
          sku: CONFIG.demo.sku,
          version: CONFIG.demo.masterVersion,
        },
      },
    });

    if (!master) {
      return NextResponse.json(
        { success: false, error: 'Demo Master V3 not found. Please run seed script.' },
        { status: 404 }
      );
    }

    const masterLab = { l: master.l, a: master.a, b: master.b, gloss: master.gloss };
    const sampleLab = CONFIG.demo.sampleLab;

    const metrics = calculateColorDifference(
      masterLab,
      sampleLab,
      master.deltaETolerance,
      master.glossTolerance
    );

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const count = await prisma.batch.count();
    const batchNumber = `DEMO-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // 2. Create demo batch
    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        sku: master.sku,
        masterId: master.id,
        printerId: CONFIG.demo.printerId,
        status: 'ANALYZED',
        currentLoop: 1,
        maxLoops: CONFIG.maxCorrectionLoops,
        measurements: {
          create: {
            type: 'PRODUCTION_INITIAL',
            iteration: 1,
            l: sampleLab.l,
            a: sampleLab.a,
            b: sampleLab.b,
            gloss: sampleLab.gloss,
            deltaL: metrics.deltaL,
            deltaA: metrics.deltaA,
            deltaB: metrics.deltaB,
            deltaE76: metrics.deltaE76,
            deltaE00: metrics.deltaE00,
            deltaGloss: metrics.deltaGloss,
            pass: metrics.isOverallPass,
          },
        },
      },
    });

    // 3. Generate candidate corrections
    const optResult = generateCandidateCorrections(masterLab, sampleLab, {
      colorTolerance: master.deltaETolerance,
      glossTolerance: master.glossTolerance,
    });

    // Save corrections
    await Promise.all(
      optResult.candidates.map((c) =>
        prisma.correction.create({
          data: {
            batchId: batch.id,
            iteration: 1,
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

    // 4. Jev Decision Layer
    const structuredState = {
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
      correction_loop: 1,
      max_loops: 2,
    };

    const jevDecision = await getJevDecision(structuredState as any);

    await prisma.jevDecision.create({
      data: {
        batchId: batch.id,
        iteration: 1,
        decision: jevDecision.decision,
        confidence: jevDecision.confidence,
        probabilities: jevDecision.probabilities ? JSON.stringify(jevDecision.probabilities) : null,
        model: jevDecision.model,
        requiresHumanReview: jevDecision.requiresHumanReview,
        resolvableByPrinterAlone: jevDecision.resolvableByPrinterAlone,
        explanation: jevDecision.explanation,
        isFallback: jevDecision.isFallback,
      },
    });

    // Update batch to QC_REVIEW
    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: 'QC_REVIEW' },
    });

    await logAuditEvent({
      batchId: batch.id,
      event: 'DEMO_BATCH_INITIALIZED',
      actor: 'DEMO_RUNNER',
      metadata: {
        sku: master.sku,
        masterVersion: master.version,
        initialDeltaE00: metrics.deltaE00,
        bestCandidatePredictedDeltaE00: optResult.recommendedCandidate.predictedDeltaE00,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      redirectUrl: `/analysis/${batch.id}`,
    });
  } catch (err: any) {
    console.error('Error starting demo batch:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Demo start failed' },
      { status: 500 }
    );
  }
}
