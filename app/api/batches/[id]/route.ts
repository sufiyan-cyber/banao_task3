import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
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
          orderBy: { createdAt: 'asc' },
        },
        corrections: {
          orderBy: { rank: 'asc' },
        },
        jevDecisions: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    console.error('Error fetching batch:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch batch details' },
      { status: 500 }
    );
  }
}
