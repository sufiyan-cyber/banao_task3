import React from 'react';
import { Cpu, AlertCircle } from 'lucide-react';

export function HardwareNoticeBanner() {
  return (
    <div className="bg-[#F5F3F0] border-b border-[#E8E4DF] text-[#6B6B6B] px-6 py-2 text-xs font-sans flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Cpu className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
        <span>
          <strong className="text-[#1A1A1A] font-medium">Prototype Verification Environment:</strong> Hardware adapters (Spectrophotometer & Inkjet Engine) are simulated. Calibration curves generated via synthetic response dataset.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="small-caps text-[10px] text-[#B8860B] bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
          Demo calibration data — synthetic
        </span>
      </div>
    </div>
  );
}
