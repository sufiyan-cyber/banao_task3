import React from 'react';
import { DirectionalDiagnosis, ColorDifferenceMetrics } from '@/lib/color/lab';
import { AlertTriangle, CheckCircle2, Info, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';

interface DirectionalDiagnosisCardProps {
  diagnosis: DirectionalDiagnosis;
  metrics: ColorDifferenceMetrics;
}

export function DirectionalDiagnosisCard({ diagnosis, metrics }: DirectionalDiagnosisCardProps) {
  const { isOverallPass, deltaE00, deltaGloss } = metrics;

  return (
    <div className="industrial-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2">
          {isOverallPass ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          )}
          <span>Directional Diagnosis (QC Shift Assessment)</span>
        </div>
        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            isOverallPass
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : diagnosis.severity === 'CRITICAL_DEVIATION'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {diagnosis.severity.replace('_', ' ')}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Narrative Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900 mb-0.5">Physical Deviation Diagnosis:</div>
            <div>{diagnosis.narrative}</div>
          </div>
        </div>

        {/* 4 Vector Axis Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lightness (L*)</span>
            <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span>{diagnosis.lightnessSummary}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">ΔL: {metrics.deltaL > 0 ? `+${metrics.deltaL}` : metrics.deltaL}</div>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Red-Green (a*)</span>
            <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span>{diagnosis.aSummary}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">Δa: {metrics.deltaA > 0 ? `+${metrics.deltaA}` : metrics.deltaA}</div>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Yellow-Blue (b*)</span>
            <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span>{diagnosis.bSummary}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">Δb: {metrics.deltaB > 0 ? `+${metrics.deltaB}` : metrics.deltaB}</div>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Surface Finish</span>
            <div className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span>{diagnosis.glossSummary}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-1">ΔGloss: {metrics.deltaGloss > 0 ? `+${metrics.deltaGloss}` : metrics.deltaGloss} GU</div>
          </div>
        </div>
      </div>
    </div>
  );
}
