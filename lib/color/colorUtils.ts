import { LabColor } from './lab';

/**
 * Converts CIE L*a*b* to sRGB Hex string for accurate visual representation
 * Uses D65 standard illuminant reference white.
 */
export function labToHex(lab: LabColor): string {
  const { l, a, b } = lab;

  // LAB to XYZ
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const eps = 0.008856;
  const kappa = 903.3;

  const xr = Math.pow(fx, 3) > eps ? Math.pow(fx, 3) : (116 * fx - 16) / kappa;
  const yr = l > kappa * eps ? Math.pow((l + 16) / 116, 3) : l / kappa;
  const zr = Math.pow(fz, 3) > eps ? Math.pow(fz, 3) : (116 * fz - 16) / kappa;

  // Reference white D65
  const X = xr * 0.95047;
  const Y = yr * 1.0;
  const Z = zr * 1.08883;

  // XYZ to linear sRGB
  const rLin = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
  const gLin = X * -0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bLin = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;

  // Linear to gamma-corrected sRGB
  const toSRGB = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r = Math.round(toSRGB(rLin) * 255);
  const g = Math.round(toSRGB(gLin) * 255);
  const blue = Math.round(toSRGB(bLin) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(blue)}`.toUpperCase();
}
