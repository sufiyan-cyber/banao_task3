import { NextResponse } from 'next/server';
import { isJevConfigured } from '@/lib/jev/client';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jevAvailable = isJevConfigured();

  return NextResponse.json({
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'ShadePilot',
    jevAvailable,
    jevModel: process.env.TYPESAFE_MODEL || 'jev-latest',
    jevStatusText: jevAvailable
      ? 'Jev Active (Decision Layer)'
      : 'Jev unavailable — operating in rule-based review mode.',
    dbConnected: true,
    isDemoSimulation: CONFIG.isDemoSimulation,
    datasetNotice: CONFIG.datasetNotice,
    tolerances: {
      deltaE: CONFIG.colorToleranceDeltaE,
      gloss: CONFIG.glossTolerance,
      maxLoops: CONFIG.maxCorrectionLoops,
    },
  });
}
