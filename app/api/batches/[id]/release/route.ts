import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        measurements: {
          where: { type: 'VERIFICATION_SAMPLE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Safety Rule 2 & 5: Batch can only be released if verification passed!
    if (batch.status !== 'VERIFIED_PASS') {
      return NextResponse.json(
        {
          success: false,
          error: `Safety Rule Violation: Cannot release batch in status '${batch.status}'. A successful verification pass (ΔE00 <= tolerance) is strictly mandatory before release.`,
        },
        { status: 400 }
      );
    }

    const latestVerification = batch.measurements[0];
    if (!latestVerification || !latestVerification.pass) {
      return NextResponse.json(
        {
          success: false,
          error: 'Safety Rule Violation: No passing verification measurement found for this batch.',
        },
        { status: 400 }
      );
    }

    const completedAt = new Date();
    const durationSeconds = Math.max(
      30,
      Math.round((completedAt.getTime() - new Date(batch.createdAt).getTime()) / 1000)
    );

    // Update batch to RELEASED
    const updatedBatch = await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status: 'RELEASED',
        completedAt,
      },
      include: {
        master: true,
        measurements: true,
        corrections: true,
        jevDecisions: true,
      },
    });

    // Audit log
    await logAuditEvent({
      batchId: batch.id,
      event: 'BATCH_RELEASED',
      actor: 'QC_LEAD_OPERATOR',
      metadata: {
        batchNumber: batch.batchNumber,
        finalDeltaE00: latestVerification.deltaE00,
        finalDeltaGloss: latestVerification.deltaGloss,
        durationSeconds,
        manualTimeBaselineMinutes: 390, // ~6.5 hours
        estimatedTimeSavedHours: Number(((390 * 60 - durationSeconds) / 3600).toFixed(1)),
      },
    });

    return NextResponse.json({
      success: true,
      batch: updatedBatch,
      summary: {
        manualProcessTime: '~6–7 hours',
        prototypeWorkflowTime: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        estimatedTimeSaved: `${((390 * 60 - durationSeconds) / 3600).toFixed(1)} hours`,
        finalDeltaE00: latestVerification.deltaE00,
        finalDeltaGloss: latestVerification.deltaGloss,
        status: 'APPROVED & RELEASED',
      },
    });
  } catch (err: any) {
    console.error('Error releasing batch:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Batch release failed' },
      { status: 500 }
    );
  }
}
