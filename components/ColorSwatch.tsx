import React from 'react';
import { LabColor } from '@/lib/color/lab';
import { labToHex } from '@/lib/color/colorUtils';
import { Sparkles } from 'lucide-react';

interface ColorSwatchProps {
  label: string;
  lab: LabColor;
  subtitle?: string;
  isMaster?: boolean;
}

export function ColorSwatch({ label, lab, subtitle, isMaster = false }: ColorSwatchProps) {
  const hex = labToHex(lab);
  const gloss = lab.gloss ?? 80;

  return (
    <div className="serif-card p-5 flex flex-col justify-between border-t-2 border-t-[#B8860B]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="small-caps text-[11px] text-[#6B6B6B]">
            {label}
          </span>
          {isMaster ? (
            <span className="small-caps text-[9px] px-2 py-0.5 rounded bg-[#FAF8F5] text-[#B8860B] border border-[#B8860B]/30 font-semibold">
              Master Target
            </span>
          ) : (
            <span className="small-caps text-[9px] px-2 py-0.5 rounded bg-[#FAF8F5] text-[#6B6B6B] border border-[#E8E4DF]">
              Measured Tile
            </span>
          )}
        </div>

        {/* Ceramic Tile Swatch Surface */}
        <div
          className="relative w-full h-36 rounded-md border border-[#E8E4DF] shadow-inner overflow-hidden flex items-end p-3 transition-transform duration-200 hover:scale-[1.01]"
          style={{ backgroundColor: hex }}
        >
          {/* Subtle glaze reflection gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${(gloss / 100) * 0.35}) 0%, rgba(255,255,255,0) 65%)`,
            }}
          />

          <div className="relative z-10 bg-white/95 backdrop-blur-sm text-[#1A1A1A] px-2.5 py-1 rounded border border-[#E8E4DF] text-xs font-mono font-medium flex items-center gap-2 shadow-sm">
            <span className="font-bold text-[#1A1A1A]">{hex}</span>
            <span className="text-[10px] text-[#A39B8E] small-caps">sRGB</span>
          </div>
        </div>
      </div>

      {/* LAB & Gloss Coordinate Readouts with Playfair Typography */}
      <div className="mt-4 pt-4 border-t border-[#E8E4DF] grid grid-cols-4 gap-2.5 text-center">
        <div className="bg-[#FAF8F5] rounded p-2 border border-[#E8E4DF]">
          <div className="small-caps text-[9px] text-[#6B6B6B]">L*</div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">{lab.l.toFixed(1)}</div>
        </div>
        <div className="bg-[#FAF8F5] rounded p-2 border border-[#E8E4DF]">
          <div className="small-caps text-[9px] text-[#6B6B6B]">a*</div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">
            {lab.a >= 0 ? `+${lab.a.toFixed(1)}` : lab.a.toFixed(1)}
          </div>
        </div>
        <div className="bg-[#FAF8F5] rounded p-2 border border-[#E8E4DF]">
          <div className="small-caps text-[9px] text-[#6B6B6B]">b*</div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">
            {lab.b >= 0 ? `+${lab.b.toFixed(1)}` : lab.b.toFixed(1)}
          </div>
        </div>
        <div className="bg-[#FAF8F5] rounded p-2 border border-[#E8E4DF]">
          <div className="small-caps text-[9px] text-[#6B6B6B] flex items-center justify-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-[#B8860B]" />
            <span>Gloss</span>
          </div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">{gloss.toFixed(1)} GU</div>
        </div>
      </div>

      {subtitle && <p className="text-[11px] text-[#6B6B6B] mt-2.5 text-center italic">{subtitle}</p>}
    </div>
  );
}
