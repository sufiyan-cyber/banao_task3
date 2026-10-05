import { describe, it, expect } from 'vitest';
import { generateCandidateCorrections } from '../lib/calibration/optimizer';
import { predictPrinterResponse } from '../lib/calibration/model';
import { evaluateDeterministicRules } from '../lib/jev/fallback';
import { SimulatedPrinter } from '../lib/adapters/printer';
import { CONFIG } from '../lib/config';

describe('Calibration & Optimization Engine', () => {
  const masterLab = { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 };
  const sampleLab = { l: 67.0, a: 6.0, b: 17.0, gloss: 77.0 };

  it('generates at least 3 ranked candidates with best candidate labeled recommended', () => {
    const res = generateCandidateCorrections(masterLab, sampleLab);

    expect(res.candidates.length).toBeGreaterThanOrEqual(3);
    expect(res.recommendedCandidate).toBeDefined();
    expect(res.recommendedCandidate.rank).toBe(1);
    expect(res.recommendedCandidate.isRecommended).toBe(true);

    // Recommended candidate matches PRD Demo Candidate A
    const best = res.recommendedCandidate;
    expect(best.adjustments.brown).toBeCloseTo(3.4, 1);
    expect(best.adjustments.yellow).toBeCloseTo(0.8, 1);
    expect(best.adjustments.black).toBeCloseTo(-0.2, 1);
    expect(best.predictedDeltaE00).toBeLessThan(1.0);
    expect(best.isWithinBounds).toBe(true);
  });

  it('enforces channel adjustment bounds (-5% to +5%)', () => {
    const extremeSample = { l: 40.0, a: 25.0, b: -10.0, gloss: 50.0 };
    const res = generateCandidateCorrections(masterLab, extremeSample);

    // All channels must remain clamped within safety limits
    for (const c of res.candidates) {
      for (const [ch, val] of Object.entries(c.adjustments)) {
        expect(val).toBeGreaterThanOrEqual(CONFIG.channelMinPercent);
        expect(val).toBeLessThanOrEqual(CONFIG.channelMaxPercent);
      }
    }
  });

  it('handles PRD Section 15 exception where printer correction is insufficient', () => {
    // Huge gloss deficit that inkjet color channels cannot compensate for
    const glossDeficitSample = { l: 69.0, a: 5.2, b: 19.5, gloss: 70.0 }; // ΔGloss = -12.0
    const res = generateCandidateCorrections(masterLab, glossDeficitSample);

    expect(res.isPrinterCorrectionSufficient).toBe(false);
    expect(res.statusMessage).toContain('Printer correction insufficient');
    expect(res.diagnosticAdvice).toBeDefined();
  });
});

describe('Jev Deterministic Fallback & Safety Rules', () => {
  it('approves recommendation pending QC when candidate is within bounds and tolerance', () => {
    const state = {
      sku: 'CER-1001',
      printer: 'PRINTER-UAE-01',
      delta_l: -3.0,
      delta_a: 1.0,
      delta_b: -3.0,
      delta_e00: 3.31,
      delta_gloss: -5.0,
      current_sample: { l: 67, a: 6, b: 17, gloss: 77 },
      master_target: { l: 70, a: 5, b: 20, gloss: 82 },
      candidate_corrections: [
        {
          rank: 1,
          label: 'Candidate A',
          brown: 3.4,
          yellow: 0.8,
          black: -0.2,
          red: 0.0,
          blue: 0.0,
          other: 0.0,
          predicted_delta_e00: 0.82,
          predicted_delta_gloss: -0.7,
          confidence: 0.94,
        },
      ],
      model_confidence: 0.94,
      within_printer_constraints: true,
      is_printer_correction_sufficient: true,
      correction_loop: 1,
      max_loops: 2,
    };

    const decision = evaluateDeterministicRules(state as any);
    expect(decision.decision).toBe('APPROVE_RECOMMENDATION');
    expect(decision.requiresHumanReview).toBe(true); // Mandatory QC in the loop!
    expect(decision.isFallback).toBe(true);
  });

  it('escalates immediately if printer correction is insufficient', () => {
    const state = {
      sku: 'CER-3008',
      printer: 'PRINTER-UAE-01',
      delta_l: 2.8,
      delta_a: 1.6,
      delta_b: -2.3,
      delta_e00: 3.82,
      delta_gloss: -9.0,
      current_sample: { l: 54.8, a: 1.8, b: -3.8, gloss: 36.0 },
      master_target: { l: 52.0, a: 0.2, b: -1.5, gloss: 45.0 },
      candidate_corrections: [],
      model_confidence: 0.95,
      within_printer_constraints: false,
      is_printer_correction_sufficient: false,
      correction_loop: 1,
      max_loops: 2,
    };

    const decision = evaluateDeterministicRules(state as any);
    expect(decision.decision).toBe('ESCALATE');
    expect(decision.resolvableByPrinterAlone).toBe(false);
  });

  it('escalates when max correction loops limit is exceeded', () => {
    const state = {
      sku: 'CER-1001',
      printer: 'PRINTER-UAE-01',
      delta_l: -1.5,
      delta_a: 0.5,
      delta_b: -1.0,
      delta_e00: 1.4,
      delta_gloss: -2.5,
      current_sample: { l: 68.5, a: 5.5, b: 19.0, gloss: 79.5 },
      master_target: { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 },
      candidate_corrections: [],
      model_confidence: 0.88,
      within_printer_constraints: true,
      is_printer_correction_sufficient: true,
      correction_loop: 3, // Exceeds max 2
      max_loops: 2,
    };

    const decision = evaluateDeterministicRules(state as any);
    expect(decision.decision).toBe('ESCALATE');
    expect(decision.explanation).toContain('Maximum correction loop threshold');
  });
});

describe('Batch Verification and Release Logic', () => {
  const printer = new SimulatedPrinter();
  const masterLab = { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 };
  const sampleLab = { l: 67.0, a: 6.0, b: 17.0, gloss: 77.0 };
  const goodCorrection = { brown: 3.4, yellow: 0.8, black: -0.2, red: 0, blue: 0, other: 0 };

  it('passes verification when fired sample reaches tolerance (PRD Section 29)', async () => {
    const ver = await printer.simulateVerification(masterLab, sampleLab, goodCorrection, 1);
    expect(ver.isPass).toBe(true);
    expect(ver.deltaE00).toBeLessThanOrEqual(CONFIG.colorToleranceDeltaE);
    expect(Math.abs(ver.deltaGloss)).toBeLessThanOrEqual(CONFIG.glossTolerance);
    expect(ver.mustEscalate).toBe(false);
  });

  it('does not release batch if verification fails', async () => {
    const zeroCorrection = { brown: 0, yellow: 0, black: 0, red: 0, blue: 0, other: 0 };
    const ver = await printer.simulateVerification(masterLab, sampleLab, zeroCorrection, 1);
    expect(ver.isPass).toBe(false);
    expect(ver.canRetry).toBe(true);
  });
});
