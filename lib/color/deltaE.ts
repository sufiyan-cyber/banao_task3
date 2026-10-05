import { LabColor, ColorDifferenceMetrics, DirectionalDiagnosis } from './lab';
import { CONFIG } from '../config';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * CIEDE2000 (ΔE00) Standard Perceptual Color Difference
 * Primary color metric per PRD Section 5.
 */
export function calculateDeltaE00(
  color1: LabColor,
  color2: LabColor,
  kL: number = 1.0,
  kC: number = 1.0,
  kH: number = 1.0
): number {
  const { l: L1, a: a1, b: b1 } = color1;
  const { l: L2, a: a2, b: b2 } = color2;

  // 1. Calculate C1, C2, and average C
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;

  // 2. Calculate G factor
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 6103515625))); // 25^7 = 6103515625

  // 3. Adjusted a', C', and h'
  const a1Prime = (1 + G) * a1;
  const a2Prime = (1 + G) * a2;

  const C1Prime = Math.hypot(a1Prime, b1);
  const C2Prime = Math.hypot(a2Prime, b2);

  let h1Prime = Math.atan2(b1, a1Prime) * RAD_TO_DEG;
  if (h1Prime < 0) h1Prime += 360;

  let h2Prime = Math.atan2(b2, a2Prime) * RAD_TO_DEG;
  if (h2Prime < 0) h2Prime += 360;

  // 4. Calculate ΔL', ΔC', Δh', and ΔH'
  const deltaLPrime = L2 - L1;
  const deltaCPrime = C2Prime - C1Prime;

  let deltahPrime = 0;
  if (C1Prime * C2Prime !== 0) {
    const diff = h2Prime - h1Prime;
    if (Math.abs(diff) <= 180) {
      deltahPrime = diff;
    } else if (diff > 180) {
      deltahPrime = diff - 360;
    } else {
      deltahPrime = diff + 360;
    }
  }

  const deltaHPrime =
    2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((deltahPrime / 2) * DEG_TO_RAD);

  // 5. Calculate average L', C', and h'
  const LbarPrime = (L1 + L2) / 2;
  const CbarPrime = (C1Prime + C2Prime) / 2;

  let hbarPrime = 0;
  if (C1Prime * C2Prime === 0) {
    hbarPrime = h1Prime + h2Prime;
  } else {
    const diff = Math.abs(h1Prime - h2Prime);
    const sum = h1Prime + h2Prime;
    if (diff <= 180) {
      hbarPrime = sum / 2;
    } else if (sum < 360) {
      hbarPrime = (sum + 360) / 2;
    } else {
      hbarPrime = (sum - 360) / 2;
    }
  }

  // 6. Calculate T
  const T =
    1 -
    0.17 * Math.cos((hbarPrime - 30) * DEG_TO_RAD) +
    0.24 * Math.cos(2 * hbarPrime * DEG_TO_RAD) +
    0.32 * Math.cos((3 * hbarPrime + 6) * DEG_TO_RAD) -
    0.2 * Math.cos((4 * hbarPrime - 63) * DEG_TO_RAD);

  // 7. Calculate Δθ and RC
  const deltaTheta =
    30 * Math.exp(-Math.pow((hbarPrime - 275) / 25, 2));
  const CbarPrime7 = Math.pow(CbarPrime, 7);
  const RC = 2 * Math.sqrt(CbarPrime7 / (CbarPrime7 + 6103515625));

  // 8. Weighting functions SL, SC, SH
  const LbarMinus50Sq = Math.pow(LbarPrime - 50, 2);
  const SL = 1 + (0.015 * LbarMinus50Sq) / Math.sqrt(20 + LbarMinus50Sq);
  const SC = 1 + 0.045 * CbarPrime;
  const SH = 1 + 0.015 * CbarPrime * T;

  // 9. Rotation factor RT
  const RT = -Math.sin(2 * deltaTheta * DEG_TO_RAD) * RC;

  // 10. Total CIEDE2000 ΔE00
  const dLTerm = deltaLPrime / (kL * SL);
  const dCTerm = deltaCPrime / (kC * SC);
  const dHTerm = deltaHPrime / (kH * SH);

  const deltaE00Sq =
    Math.pow(dLTerm, 2) +
    Math.pow(dCTerm, 2) +
    Math.pow(dHTerm, 2) +
    RT * dCTerm * dHTerm;

  return Math.sqrt(Math.max(0, deltaE00Sq));
}

/**
 * CIE 1976 Euclidean color difference (ΔE76)
 */
export function calculateDeltaE76(color1: LabColor, color2: LabColor): number {
  const dL = color2.l - color1.l;
  const da = color2.a - color1.a;
  const db = color2.b - color1.b;
  return Math.hypot(dL, da, db);
}

/**
 * Complete color and gloss difference analysis
 */
export function calculateColorDifference(
  master: LabColor,
  sample: LabColor,
  deltaETolerance: number = CONFIG.colorToleranceDeltaE,
  glossTolerance: number = CONFIG.glossTolerance
): ColorDifferenceMetrics {
  const deltaL = Number((sample.l - master.l).toFixed(2));
  const deltaA = Number((sample.a - master.a).toFixed(2));
  const deltaB = Number((sample.b - master.b).toFixed(2));
  const deltaE76 = Number(calculateDeltaE76(master, sample).toFixed(2));
  const deltaE00 = Number(calculateDeltaE00(master, sample).toFixed(2));

  const sampleGloss = sample.gloss ?? 0;
  const masterGloss = master.gloss ?? 0;
  const deltaGloss = Number((sampleGloss - masterGloss).toFixed(2));

  const isColorInTolerance = deltaE00 <= deltaETolerance;
  const isGlossInTolerance = Math.abs(deltaGloss) <= glossTolerance;
  const isOverallPass = isColorInTolerance && isGlossInTolerance;

  return {
    deltaL,
    deltaA,
    deltaB,
    deltaE76,
    deltaE00,
    deltaGloss,
    sampleGloss,
    masterGloss,
    isColorInTolerance,
    isGlossInTolerance,
    isOverallPass,
  };
}

/**
 * Directional Diagnosis (PRD Section 6)
 * Produces intuitive shopfloor language for the QC operator
 */
export function getDirectionalDiagnosis(metrics: ColorDifferenceMetrics): DirectionalDiagnosis {
  const { deltaL, deltaA, deltaB, deltaGloss, deltaE00, isOverallPass } = metrics;

  // Lightness diagnosis
  let lightnessSummary = 'On Target (L*)';
  if (deltaL <= -0.5) lightnessSummary = `Darker (ΔL ${deltaL > 0 ? '+' : ''}${deltaL}) ↓`;
  else if (deltaL >= 0.5) lightnessSummary = `Lighter (ΔL +${deltaL}) ↑`;

  // a* (Red-Green) diagnosis
  let aSummary = 'On Target (a*)';
  if (deltaA >= 0.4) aSummary = `More Red (Δa +${deltaA}) →`;
  else if (deltaA <= -0.4) aSummary = `More Green (Δa ${deltaA}) ←`;

  // b* (Yellow-Blue) diagnosis
  let bSummary = 'On Target (b*)';
  if (deltaB <= -0.4) bSummary = `Less Yellow (Δb ${deltaB}) ↓`;
  else if (deltaB >= 0.4) bSummary = `More Yellow (Δb +${deltaB}) ↑`;

  // Gloss diagnosis
  let glossSummary = 'On Target (Gloss)';
  if (deltaGloss <= -1.0) glossSummary = `Lower Gloss (ΔGloss ${deltaGloss}) ↓`;
  else if (deltaGloss >= 1.0) glossSummary = `Higher Gloss (ΔGloss +${deltaGloss}) ↑`;

  // Narrative synthesis
  let narrative = '';
  if (isOverallPass) {
    narrative = 'Current sample is within approved production tolerances for shade (ΔE00) and surface gloss.';
  } else {
    const parts: string[] = [];
    if (deltaL <= -0.5) parts.push('darker');
    else if (deltaL >= 0.5) parts.push('lighter');

    if (deltaA >= 0.4) parts.push('redder');
    else if (deltaA <= -0.4) parts.push('greener');

    if (deltaB <= -0.4) parts.push('less yellow (bluer)');
    else if (deltaB >= 0.4) parts.push('more yellow');

    const colorDesc = parts.length > 0 ? parts.join(', ') : 'chromatic shift detected';

    let glossDesc = '';
    if (deltaGloss <= -1.5) glossDesc = ' with noticeably lower surface gloss';
    else if (deltaGloss >= 1.5) glossDesc = ' with elevated surface gloss';

    narrative = `Tile is ${colorDesc}${glossDesc} compared to the approved master reference (ΔE00: ${deltaE00}).`;
  }

  let severity: DirectionalDiagnosis['severity'] = 'IN_TOLERANCE';
  if (!isOverallPass) {
    if (deltaE00 <= 2.0) severity = 'MINOR_DEVIATION';
    else if (deltaE00 <= 4.0) severity = 'SIGNIFICANT_DEVIATION';
    else severity = 'CRITICAL_DEVIATION';
  }

  return {
    lightnessSummary,
    aSummary,
    bSummary,
    glossSummary,
    narrative,
    severity,
  };
}
