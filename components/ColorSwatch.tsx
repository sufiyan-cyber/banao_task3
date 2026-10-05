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
    <div className="industrial-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {isMaster ? (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              Approved Target
            </span>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Measured Sample
            </span>
          )}
        </div>

        {/* Tile Swatch Visualizer */}
        <div className="relative w-full h-32 rounded border border-slate-300 shadow-inner overflow-hidden flex items-end p-2.5 transition-transform hover:scale-[1.01]" style={{ backgroundColor: hex }}>
          {/* Subtle gloss reflection gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${(gloss / 100) * 0.35}) 0%, rgba(255,255,255,0) 60%)`,
            }}
          />

          <div className="relative z-10 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow">
            <span>{hex}</span>
            <span className="text-[10px] text-slate-300 font-normal">sRGB</span>
          </div>
        </div>
      </div>

      {/* LAB & Gloss Coordinate Readouts */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-50 rounded p-1.5 border border-slate-200/80">
          <div className="text-[10px] text-slate-500 font-mono">L*</div>
          <div className="text-sm font-bold text-slate-900 font-mono">{lab.l.toFixed(1)}</div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 border border-slate-200/80">
          <div className="text-[10px] text-slate-500 font-mono">a*</div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {lab.a >= 0 ? `+${lab.a.toFixed(1)}` : lab.a.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 border border-slate-200/80">
          <div className="text-[10px] text-slate-500 font-mono">b*</div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {lab.b >= 0 ? `+${lab.b.toFixed(1)}` : lab.b.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 border border-slate-200/80">
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>Gloss</span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">{gloss.toFixed(1)} GU</div>
        </div>
      </div>

      {subtitle && <p className="text-[11px] text-slate-500 mt-2 text-center">{subtitle}</p>}
    </div>
  );
}
