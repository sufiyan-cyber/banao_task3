export interface LabColor {
  l: number; // Lightness [0, 100]
  a: number; // Red-Green axis [-128, 127]
  b: number; // Yellow-Blue axis [-128, 127]
  gloss?: number; // Gloss units (GU) [0, 100]
}

export interface ColorDifferenceMetrics {
  deltaL: number;
  deltaA: number;
  deltaB: number;
  deltaE76: number;
  deltaE00: number;
  deltaGloss: number;
  sampleGloss: number;
  masterGloss: number;
  isColorInTolerance: boolean;
  isGlossInTolerance: boolean;
  isOverallPass: boolean;
}

export interface DirectionalDiagnosis {
  lightnessSummary: string; // e.g., "Darker ↓" or "Lighter ↑" or "On Target"
  aSummary: string;         // e.g., "More Red →" or "More Green ←" or "On Target"
  bSummary: string;         // e.g., "Less Yellow ↓" or "More Yellow ↑" or "On Target"
  glossSummary: string;     // e.g., "Lower Gloss ↓" or "Higher Gloss ↑" or "On Target"
  narrative: string;        // e.g. "Tile is darker, slightly redder and less yellow than the approved master."
  severity: 'IN_TOLERANCE' | 'MINOR_DEVIATION' | 'SIGNIFICANT_DEVIATION' | 'CRITICAL_DEVIATION';
}
