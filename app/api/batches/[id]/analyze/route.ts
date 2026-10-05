import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateColorDifference, getDirectionalDiagnosis } from '@/lib/color/deltaE';
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
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!batch || !batch.master) {
      return NextResponse.json(
        { success: false, error: 'Batch or associated master not found' },
        { status: 404 }
      );
    }

    const sampleMeas = batch.measurements[0];
    if (!sampleMeas) {
      return NextResponse.json(
        { success: false, error: 'No measurement data recorded for this batch' },
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
      l: sampleMeas.l,
      a: sampleMeas.a,
      b: sampleMeas.b,
      gloss: sampleMeas.gloss,
    };

    const metrics = calculateColorDifference(
      masterLab,
      sampleLab,
      batch.master.deltaETolerance,
      batch.master.glossTolerance
    );

    const diagnosis = getDirectionalDiagnosis(metrics);

    // Update batch status if needed
    if (batch.status === 'SAMPLE_ENTERED') {
      await prisma.batch.update({
        where: { id: batch.id },
        data: { status: 'ANALYZED' },
      });
    }

    await logAuditEvent({
      batchId: batch.id,
      event: 'SAMPLE_ANALYZED',
      actor: 'QC_OPERATOR',
      metadata: {
        deltaE00: metrics.deltaE00,
        deltaGloss: metrics.deltaGloss,
        narrative: diagnosis.narrative,
      },
    });

    return NextResponse.json({
      success: true,
      master: batch.master,
      sample: sampleMeas,
      metrics,
      diagnosis,
    });
  } catch (err: any) {
    console.error('Error analyzing sample:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
