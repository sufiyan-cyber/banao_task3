import React from 'react';
import { DirectionalDiagnosis, ColorDifferenceMetrics } from '@/lib/color/lab';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface DirectionalDiagnosisCardProps {
  diagnosis: DirectionalDiagnosis;
  metrics: ColorDifferenceMetrics;
}

export function DirectionalDiagnosisCard({ diagnosis, metrics }: DirectionalDiagnosisCardProps) {
  const { isOverallPass } = metrics;

  return (
    <div className="serif-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2.5">
          {isOverallPass ? (
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#B8860B]" />
          )}
          <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
            Directional Diagnosis (QC Shift Assessment)
          </span>
        </div>
        <span
          className={`small-caps text-[10px] px-2.5 py-0.5 rounded border ${
            isOverallPass
              ? 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]'
              : diagnosis.severity === 'CRITICAL_DEVIATION'
              ? 'bg-[#FCECEE] text-[#9B2226] border-[#F5C2C7]'
              : 'bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]'
          }`}
        >
          {diagnosis.severity.replace('_', ' ')}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Narrative Box with Editorial Quote Styling */}
        <div className="p-4 bg-[#FAF8F5] border border-[#E8E4DF] rounded-md text-sm text-[#1A1A1A] leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5" />
          <div>
            <div className="small-caps text-[10px] text-[#A39B8E] mb-1">
              Physical Deviation Assessment
            </div>
            <div className="font-serif text-[#1A1A1A] text-sm italic">
              &ldquo;{diagnosis.narrative}&rdquo;
            </div>
          </div>
        </div>

        {/* 4 Vector Axis Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-[#E8E4DF] rounded-md">
            <span className="small-caps text-[9px] text-[#A39B8E] block mb-1">Lightness (L*)</span>
            <div className="font-serif text-sm font-semibold text-[#1A1A1A]">
              {diagnosis.lightnessSummary}
            </div>
            <div className="text-[11px] font-mono text-[#6B6B6B] mt-1">
              ΔL: {metrics.deltaL > 0 ? `+${metrics.deltaL}` : metrics.deltaL}
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E4DF] rounded-md">
            <span className="small-caps text-[9px] text-[#A39B8E] block mb-1">Red-Green (a*)</span>
            <div className="font-serif text-sm font-semibold text-[#1A1A1A]">
              {diagnosis.aSummary}
            </div>
            <div className="text-[11px] font-mono text-[#6B6B6B] mt-1">
              Δa: {metrics.deltaA > 0 ? `+${metrics.deltaA}` : metrics.deltaA}
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E4DF] rounded-md">
            <span className="small-caps text-[9px] text-[#A39B8E] block mb-1">Yellow-Blue (b*)</span>
            <div className="font-serif text-sm font-semibold text-[#1A1A1A]">
              {diagnosis.bSummary}
            </div>
            <div className="text-[11px] font-mono text-[#6B6B6B] mt-1">
              Δb: {metrics.deltaB > 0 ? `+${metrics.deltaB}` : metrics.deltaB}
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E4DF] rounded-md">
            <span className="small-caps text-[9px] text-[#A39B8E] block mb-1">Surface Finish</span>
            <div className="font-serif text-sm font-semibold text-[#1A1A1A]">
              {diagnosis.glossSummary}
            </div>
            <div className="text-[11px] font-mono text-[#6B6B6B] mt-1">
              ΔGloss: {metrics.deltaGloss > 0 ? `+${metrics.deltaGloss}` : metrics.deltaGloss} GU
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
