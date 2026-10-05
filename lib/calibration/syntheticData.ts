import { INK_RESPONSE_MATRIX, ChannelAdjustments } from './model';

export interface SyntheticObservation {
  printerId: string;
  skuFamily: string;
  brownDelta: number;
  yellowDelta: number;
  blackDelta: number;
  redDelta: number;
  blueDelta: number;
  otherDelta: number;
  resultL: number;
  resultA: number;
  resultB: number;
  resultGloss: number;
  isSynthetic: boolean;
  datasetTag: string;
}

/**
 * Generates synthetic calibration data representing industrial ceramic inkjet responses.
 *
 * Clearly labeled per PRD Section 7 & 22:
 * "Demo calibration data — synthetic"
 */
export function generateSyntheticCalibrationObservations(
  count: number = 600,
  printerId: string = 'PRINTER-UAE-01',
  skuFamily: string = 'CER-1000-GLAZED'
): SyntheticObservation[] {
  const observations: SyntheticObservation[] = [];
  const baseL = 70.0;
  const baseA = 5.0;
  const baseB = 20.0;
  const baseGloss = 82.0;

  // Predictable pseudo-random generation with deterministic seed
  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  function randomRange(min: number, max: number) {
    return Number((min + random() * (max - min)).toFixed(1));
  }

  for (let i = 0; i < count; i++) {
    // Generate realistic channel adjustments within [-5.0%, +5.0%]
    // Mostly 1-3 active channels per test tile
    const activeChannelCount = Math.floor(random() * 3) + 1;
    const channels: (keyof ChannelAdjustments)[] = ['brown', 'yellow', 'black', 'red', 'blue', 'other'];
    const adj: ChannelAdjustments = {
      brown: 0,
      yellow: 0,
      black: 0,
      red: 0,
      blue: 0,
      other: 0,
    };

    // Pick active channels
    const shuffled = [...channels].sort(() => random() - 0.5);
    for (let c = 0; c < activeChannelCount; c++) {
      adj[shuffled[c]] = randomRange(-4.5, 4.5);
    }

    // Forward physics
    let dL = 0;
    let da = 0;
    let db = 0;
    let dGloss = 0;

    for (const ch of channels) {
      const v = adj[ch];
      const m = INK_RESPONSE_MATRIX[ch];
      dL += m.dL * v;
      da += m.da * v;
      db += m.db * v;
      dGloss += m.dGloss * v;
    }

    // Add small measurement noise (±0.08 LAB, ±0.15 Gloss)
    const noiseL = (random() - 0.5) * 0.16;
    const noiseA = (random() - 0.5) * 0.16;
    const noiseB = (random() - 0.5) * 0.16;
    const noiseGloss = (random() - 0.5) * 0.3;

    observations.push({
      printerId,
      skuFamily,
      brownDelta: adj.brown,
      yellowDelta: adj.yellow,
      blackDelta: adj.black,
      redDelta: adj.red,
      blueDelta: adj.blue,
      otherDelta: adj.other,
      resultL: Number((baseL + dL + noiseL).toFixed(2)),
      resultA: Number((baseA + da + noiseA).toFixed(2)),
      resultB: Number((baseB + db + noiseB).toFixed(2)),
      resultGloss: Number((baseGloss + dGloss + noiseGloss).toFixed(2)),
      isSynthetic: true,
      datasetTag: 'Demo calibration data — synthetic',
    });
  }

  return observations;
}
