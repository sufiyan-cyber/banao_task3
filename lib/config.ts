// ShadePilot Central Configuration
// Distinguishes demo defaults from production parameters to be validated with the client

export interface AppConfig {
  // Color & Gloss Tolerances
  colorToleranceDeltaE: number; // Max allowable ΔE00 for batch release
  glossTolerance: number;       // Max allowable |ΔGloss| for batch release
  
  // Correction Loop & Safety Limits
  maxCorrectionLoops: number;   // Maximum attempts before auto-escalating to process engineering
  minModelConfidence: number;   // Below this confidence, Jev/fallback flags human review
  
  // Printer Channel Bounds (Percentage adjustment limits)
  channelMinPercent: number;    // e.g. -5%
  channelMaxPercent: number;    // e.g. +5%
  
  // Channels used on the industrial ceramic printer
  printerChannels: readonly string[];
  
  // Predefined Demo Scenario Constants (PRD Section 21)
  demo: {
    sku: string;
    printerId: string;
    masterVersion: string;
    masterLab: { l: number; a: number; b: number; gloss: number };
    sampleLab: { l: number; a: number; b: number; gloss: number };
  };

  // Environment mode metadata
  isDemoSimulation: boolean;
  datasetNotice: string;
}

export const CONFIG: AppConfig = {
  // Demo defaults (To be calibrated on plant spectrophotometers/printers in production)
  colorToleranceDeltaE: 1.0,
  glossTolerance: 2.0,
  maxCorrectionLoops: 2,
  minModelConfidence: 0.85,
  channelMinPercent: -5.0,
  channelMaxPercent: 5.0,

  printerChannels: ['Brown', 'Yellow', 'Black', 'Red', 'Blue', 'Other'] as const,

  demo: {
    sku: 'CER-1001',
    printerId: 'PRINTER-UAE-01',
    masterVersion: 'V3',
    masterLab: {
      l: 70.0,
      a: 5.0,
      b: 20.0,
      gloss: 82.0,
    },
    sampleLab: {
      l: 67.0,
      a: 6.0,
      b: 17.0,
      gloss: 77.0,
    },
  },

  isDemoSimulation: true,
  datasetNotice: 'Demo calibration data — synthetic',
};
