import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { printerAdapter } from '@/lib/adapters/printer';
import { logAuditEvent } from '@/lib/audit/logger';

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
          where: { type: 'PRODUCTION_INITIAL' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        corrections: {
          where: { status: 'APPLIED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch || !batch.master) {
      return NextResponse.json(
        { success: false, error: 'Batch or master not found' },
        { status: 404 }
      );
    }

    // Safety rule: Human QC approval must happen before simulated printer update/verification
    if (batch.status !== 'QC_APPROVED' && batch.status !== 'VERIFIED_FAIL') {
      return NextResponse.json(
        {
          success: false,
          error: `Safety Rule Violation: Cannot run verification print in status '${batch.status}'. Mandatory Human QC approval is required before printer update.`,
        },
        { status: 400 }
      );
    }

    const initialSample = batch.measurements[0];
    const appliedCorrection = batch.corrections[0];

    if (!initialSample || !appliedCorrection) {
      return NextResponse.json(
        { success: false, error: 'Missing initial measurement or approved correction data' },
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
      l: initialSample.l,
      a: initialSample.a,
      b: initialSample.b,
      gloss: initialSample.gloss,
    };

    const adjustments = {
      brown: appliedCorrection.brownDelta,
      yellow: appliedCorrection.yellowDelta,
      black: appliedCorrection.blackDelta,
      red: appliedCorrection.redDelta,
      blue: appliedCorrection.blueDelta,
      other: appliedCorrection.otherDelta,
    };

    // Simulate verification print, kiln firing, and measurement
    const verResult = await printerAdapter.simulateVerification(
      masterLab,
      sampleLab,
      adjustments,
      batch.currentLoop
    );

    // Record verification measurement in database
    const savedMeasurement = await prisma.measurement.create({
      data: {
        batchId: batch.id,
        type: 'VERIFICATION_SAMPLE',
        iteration: batch.currentLoop,
        l: verResult.firedLab.l,
        a: verResult.firedLab.a,
        b: verResult.firedLab.b,
        gloss: verResult.firedLab.gloss || 80,
        deltaL: verResult.deltaL,
        deltaA: verResult.deltaA,
        deltaB: verResult.deltaB,
        deltaE00: verResult.deltaE00,
        deltaGloss: verResult.deltaGloss,
        pass: verResult.isPass,
      },
    });

    let newStatus = 'VERIFIED_PASS';
    if (!verResult.isPass) {
      if (verResult.mustEscalate) {
        newStatus = 'ESCALATED';
      } else {
        newStatus = 'VERIFIED_FAIL';
        // Increment loop for retry
        await prisma.batch.update({
          where: { id: batch.id },
          data: { currentLoop: batch.currentLoop + 1 },
        });
      }
    }

    const updatedBatch = await prisma.batch.update({
      where: { id: batch.id },
      data: { status: newStatus },
    });

    // Audit log
    await logAuditEvent({
      batchId: batch.id,
      event: verResult.isPass
        ? 'VERIFICATION_PASSED'
        : verResult.mustEscalate
        ? 'MAX_LOOPS_EXCEEDED_ESCALATED'
        : 'VERIFICATION_FAILED_RETRY_ALLOWED',
      actor: 'SIMULATED_PRINTER_ADAPTER',
      metadata: {
        verificationMeasurement: verResult.firedLab,
        finalDeltaE00: verResult.deltaE00,
        finalDeltaGloss: verResult.deltaGloss,
        isPass: verResult.isPass,
        loop: batch.currentLoop,
      },
    });

    return NextResponse.json({
      success: true,
      verificationResult: verResult,
      batch: updatedBatch,
      measurement: savedMeasurement,
    });
  } catch (err: any) {
    console.error('Error in verification endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
