import React from 'react';
import { AlertCircle, ShieldAlert, Cpu } from 'lucide-react';

export function HardwareNoticeBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>
          <strong>Prototype Simulation Mode:</strong> Hardware adapters (Spectrophotometer / Inkjet Printer) are simulated.
          Calibration responses use synthetic dataset.
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-amber-800">
        <span className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-mono">
          Demo calibration data — synthetic
        </span>
      </div>
    </div>
  );
}
