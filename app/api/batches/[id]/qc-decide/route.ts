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
    const body = await req.json();
    const { action, candidateId, notes, actor = 'QC_OPERATOR_VANCE' } = body;

    if (!['APPROVE', 'REJECT', 'ESCALATE'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid QC decision action. Must be APPROVE, REJECT, or ESCALATE.' },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        master: true,
        corrections: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    if (action === 'APPROVE') {
      // Find candidate to apply (default to recommended)
      const selectedCorrection = candidateId
        ? batch.corrections.find((c) => c.id === candidateId)
        : batch.corrections.find((c) => c.isRecommended) || batch.corrections[0];

      if (!selectedCorrection) {
        return NextResponse.json(
          { success: false, error: 'No correction candidate available to approve.' },
          { status: 400 }
        );
      }

      // Generate revised printer reference profile
      const adjustments = {
        brown: selectedCorrection.brownDelta,
        yellow: selectedCorrection.yellowDelta,
        black: selectedCorrection.blackDelta,
        red: selectedCorrection.redDelta,
        blue: selectedCorrection.blueDelta,
        other: selectedCorrection.otherDelta,
      };

      const ref = await printerAdapter.deployRevisedProfile(
        batch.printerId,
        adjustments,
        batch.master.version
      );

      // Update correction status
      await prisma.correction.update({
        where: { id: selectedCorrection.id },
        data: { status: 'APPLIED', notes: notes || 'Approved by QC Operator' },
      });

      // Update batch status
      const updatedBatch = await prisma.batch.update({
        where: { id: batch.id },
        data: {
          status: 'QC_APPROVED',
          revisedPrinterReference: ref.referenceId,
        },
      });

      // Audit log
      await logAuditEvent({
        batchId: batch.id,
        event: 'QC_APPROVED',
        actor,
        metadata: {
          revisedReference: ref.referenceId,
          appliedAdjustments: adjustments,
          notes,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'APPROVE',
        batch: updatedBatch,
        printerReference: ref,
      });
    }

    if (action === 'REJECT') {
      const updatedBatch = await prisma.batch.update({
        where: { id: batch.id },
        data: { status: 'QC_REJECTED' },
      });

      await logAuditEvent({
        batchId: batch.id,
        event: 'QC_REJECTED',
        actor,
        metadata: { notes: notes || 'Rejected by QC Operator' },
      });

      return NextResponse.json({
        success: true,
        action: 'REJECT',
        batch: updatedBatch,
      });
    }

    // ESCALATE
    const updatedBatch = await prisma.batch.update({
      where: { id: batch.id },
      data: { status: 'ESCALATED' },
    });

    await logAuditEvent({
      batchId: batch.id,
      event: 'BATCH_ESCALATED',
      actor,
      metadata: {
        reason: notes || 'QC operator escalated to process engineering',
      },
    });

    return NextResponse.json({
      success: true,
      action: 'ESCALATE',
      batch: updatedBatch,
    });
  } catch (err: any) {
    console.error('Error in QC decision endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'QC decision failed' },
      { status: 500 }
    );
  }
}
