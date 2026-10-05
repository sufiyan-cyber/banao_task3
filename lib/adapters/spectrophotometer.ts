import { LabColor } from '../color/lab';
import { CONFIG } from '../config';

export interface SpectrophotometerAdapter {
  name: string;
  isSimulated: boolean;
  measureSample(params?: { sku?: string; printerId?: string }): Promise<LabColor>;
  calibrate(): Promise<{ success: boolean; calibrationDate: string }>;
}

/**
 * Demo Spectrophotometer Adapter
 * Clearly labeled simulated adapter per PRD Section 32
 */
export class DemoSpectrophotometer implements SpectrophotometerAdapter {
  name = 'Demo Spectrophotometer (Benchtop Simulation)';
  isSimulated = true;

  async measureSample(params?: { sku?: string; printerId?: string }): Promise<LabColor> {
    // Return the predefined demo sample values from PRD Section 21
    if (params?.sku === CONFIG.demo.sku || !params?.sku) {
      return {
        l: CONFIG.demo.sampleLab.l,
        a: CONFIG.demo.sampleLab.a,
        b: CONFIG.demo.sampleLab.b,
        gloss: CONFIG.demo.sampleLab.gloss,
      };
    }

    // Default nominal measurement with subtle shift
    return {
      l: 68.5,
      a: 5.6,
      b: 18.2,
      gloss: 78.5,
    };
  }

  async calibrate(): Promise<{ success: boolean; calibrationDate: string }> {
    return {
      success: true,
      calibrationDate: new Date().toISOString(),
    };
  }
}

export const spectrophotometer = new DemoSpectrophotometer();
