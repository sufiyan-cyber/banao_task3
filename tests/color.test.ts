import { describe, it, expect } from 'vitest';
import { calculateDeltaE00, calculateDeltaE76, calculateColorDifference, getDirectionalDiagnosis } from '../lib/color/deltaE';
import { labToHex } from '../lib/color/colorUtils';

describe('Color Science Engine', () => {
  it('computes 0 delta for identical colors', () => {
    const c = { l: 70, a: 5, b: 20, gloss: 80 };
    expect(calculateDeltaE00(c, c)).toBe(0);
    expect(calculateDeltaE76(c, c)).toBe(0);
  });

  it('computes PRD Section 6 example color metrics accurately', () => {
    const master = { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 };
    // Section 6: ΔL = -2.7, Δa = +0.8, Δb = -2.4, ΔGloss = -4.1
    const sample = { l: 67.3, a: 5.8, b: 17.6, gloss: 77.9 };

    const metrics = calculateColorDifference(master, sample);

    expect(metrics.deltaL).toBe(-2.7);
    expect(metrics.deltaA).toBe(0.8);
    expect(metrics.deltaB).toBe(-2.4);
    expect(metrics.deltaGloss).toBe(-4.1);

    // Delta E00 should be close to ~2.8 - 2.9 (as stated in PRD section 6)
    expect(metrics.deltaE00).toBeCloseTo(2.81, 1);
    expect(metrics.isOverallPass).toBe(false);
  });

  it('computes PRD Section 21 demo scenario color metrics', () => {
    const master = { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 };
    const sample = { l: 67.0, a: 6.0, b: 17.0, gloss: 77.0 };

    const metrics = calculateColorDifference(master, sample);
    expect(metrics.deltaL).toBe(-3.0);
    expect(metrics.deltaA).toBe(1.0);
    expect(metrics.deltaB).toBe(-3.0);
    expect(metrics.deltaE00).toBe(3.31);
    expect(metrics.deltaGloss).toBe(-5.0);
    expect(metrics.isOverallPass).toBe(false);
  });

  it('generates accurate directional shopfloor diagnosis', () => {
    const master = { l: 70.0, a: 5.0, b: 20.0, gloss: 82.0 };
    const sample = { l: 67.0, a: 6.0, b: 17.0, gloss: 77.0 };
    const metrics = calculateColorDifference(master, sample);
    const diagnosis = getDirectionalDiagnosis(metrics);

    expect(diagnosis.lightnessSummary).toContain('Darker');
    expect(diagnosis.aSummary).toContain('More Red');
    expect(diagnosis.bSummary).toContain('Less Yellow');
    expect(diagnosis.glossSummary).toContain('Lower Gloss');
    expect(diagnosis.severity).toBe('SIGNIFICANT_DEVIATION');
  });

  it('converts LAB to valid sRGB Hex strings', () => {
    const hexMaster = labToHex({ l: 70, a: 5, b: 20 });
    expect(hexMaster).toMatch(/^#[0-9A-F]{6}$/);

    const hexSample = labToHex({ l: 67, a: 6, b: 17 });
    expect(hexSample).toMatch(/^#[0-9A-F]{6}$/);
  });
});
