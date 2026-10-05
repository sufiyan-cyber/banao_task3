import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const masters = await prisma.master.findMany({
      orderBy: [{ sku: 'asc' }, { version: 'desc' }],
    });
    return NextResponse.json({ success: true, masters });
  } catch (err: any) {
    console.error('Error fetching masters:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch masters from database' },
      { status: 500 }
    );
  }
}
