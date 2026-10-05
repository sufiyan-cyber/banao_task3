import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateColorDifference } from '@/lib/color/deltaE';
import { logAuditEvent } from '@/lib/audit/logger';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        master: true,
        measurements: {
          orderBy: { createdAt: 'asc' },
        },
        corrections: {
          orderBy: { rank: 'asc' },
        },
        jevDecisions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, batches });
  } catch (err: any) {
    console.error('Error fetching batches:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batches from database' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, masterId, printerId, sample, batchNumber } = body;

    // Safety Rule 10: Validate required measurement values
    if (
      !sku ||
      !masterId ||
      !printerId ||
      !sample ||
      typeof sample.l !== 'number' ||
      typeof sample.a !== 'number' ||
      typeof sample.b !== 'number' ||
      typeof sample.gloss !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid measurement data. L*, a*, b*, and gloss numeric values are mandatory.',
        },
        { status: 400 }
      );
    }

    // Safety Rule 8: Verify Master exists and is APPROVED
    const master = await prisma.master.findUnique({
      where: { id: masterId },
    });

    if (!master) {
      return NextResponse.json(
        { success: false, error: 'Specified master tile reference not found.' },
        { status: 404 }
      );
    }

    if (!master.approved) {
      return NextResponse.json(
        {
          success: false,
          error: `Safety Rule Violation: Master ${master.sku} ${master.version} is not approved for production use. Only approved master versions may be released.`,
        },
        { status: 403 }
      );
    }

    // Calculate initial color difference
    const masterLab = { l: master.l, a: master.a, b: master.b, gloss: master.gloss };
    const sampleLab = { l: sample.l, a: sample.a, b: sample.b, gloss: sample.gloss };
    const metrics = calculateColorDifference(masterLab, sampleLab, master.deltaETolerance, master.glossTolerance);

    // Generate unique batch number if not provided
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const count = await prisma.batch.count();
    const assignedBatchNum = batchNumber || `B${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // Create Batch in database
    const batch = await prisma.batch.create({
      data: {
        batchNumber: assignedBatchNum,
        sku,
        masterId: master.id,
        printerId,
        status: 'SAMPLE_ENTERED',
        currentLoop: 1,
        maxLoops: CONFIG.maxCorrectionLoops,
        measurements: {
          create: {
            type: 'PRODUCTION_INITIAL',
            iteration: 1,
            l: sample.l,
            a: sample.a,
            b: sample.b,
            gloss: sample.gloss,
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
      include: {
        master: true,
        measurements: true,
      },
    });

    // Audit log
    await logAuditEvent({
      batchId: batch.id,
      event: 'BATCH_CREATED',
      actor: 'QC_OPERATOR',
      metadata: {
        batchNumber: batch.batchNumber,
        sku,
        masterVersion: master.version,
        printerId,
        initialMetrics: metrics,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      batch,
      initialMetrics: metrics,
    });
  } catch (err: any) {
    console.error('Error creating batch:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create batch' },
      { status: 500 }
    );
  }
}
