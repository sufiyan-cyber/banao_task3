import React from 'react';
import { Sliders, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export interface DisplayCorrection {
  id?: string;
  rank: number;
  label?: string;
  isRecommended: boolean;
  brownDelta: number;
  yellowDelta: number;
  blackDelta: number;
  redDelta: number;
  blueDelta: number;
  otherDelta: number;
  predictedDeltaE00: number;
  predictedDeltaGloss: number;
  predictedGloss?: number | null;
  confidence: number;
  status: string;
  notes?: string | null;
}

interface CandidateCorrectionsTableProps {
  candidates: DisplayCorrection[];
  selectedId?: string;
  onSelect?: (candidate: DisplayCorrection) => void;
  colorTolerance?: number;
  glossTolerance?: number;
}

export function CandidateCorrectionsTable({
  candidates,
  selectedId,
  onSelect,
  colorTolerance = 1.0,
  glossTolerance = 2.0,
}: CandidateCorrectionsTableProps) {
  const formatAdj = (val: number) => {
    if (val === 0) return '0.0%';
    return val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
  };

  const getChannelColor = (val: number) => {
    if (val === 0) return 'text-slate-400';
    return val > 0 ? 'text-blue-700 font-bold' : 'text-slate-800 font-bold';
  };

  return (
    <div className="industrial-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-700" />
          <span>Printer Correction Candidates (6-Channel Calibration Model)</span>
        </div>
        <span className="text-xs text-slate-500 font-normal">
          Ranked by multi-objective optimization score
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
              <th className="py-2.5 px-3">Rank / Candidate</th>
              <th className="py-2.5 px-3 text-center">Brown</th>
              <th className="py-2.5 px-3 text-center">Yellow</th>
              <th className="py-2.5 px-3 text-center">Black</th>
              <th className="py-2.5 px-3 text-center">Red</th>
              <th className="py-2.5 px-3 text-center">Blue</th>
              <th className="py-2.5 px-3 text-center">Other</th>
              <th className="py-2.5 px-3 text-center">Pred. ΔE00</th>
              <th className="py-2.5 px-3 text-center">Pred. ΔGloss</th>
              <th className="py-2.5 px-3 text-center">Confidence</th>
              {onSelect && <th className="py-2.5 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {candidates.map((c) => {
              const isSelected = selectedId ? c.id === selectedId : c.isRecommended;
              const isPassColor = c.predictedDeltaE00 <= colorTolerance;
              const isPassGloss = Math.abs(c.predictedDeltaGloss) <= glossTolerance;

              return (
                <tr
                  key={c.id || c.rank}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onSelect && onSelect(c)}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                        {c.rank}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{c.label || `Candidate ${c.rank === 1 ? 'A' : c.rank === 2 ? 'B' : 'C'}`}</span>
                          {c.isRecommended && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Optimal
                            </span>
                          )}
                        </div>
                        {c.notes && <p className="text-[11px] text-slate-500 line-clamp-1">{c.notes}</p>}
                      </div>
                    </div>
                  </td>

                  {/* 6 Inkjet Channel Adjustments */}
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.brownDelta)}`}>
                    {formatAdj(c.brownDelta)}
                  </td>
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.yellowDelta)}`}>
                    {formatAdj(c.yellowDelta)}
                  </td>
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.blackDelta)}`}>
                    {formatAdj(c.blackDelta)}
                  </td>
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.redDelta)}`}>
                    {formatAdj(c.redDelta)}
                  </td>
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.blueDelta)}`}>
                    {formatAdj(c.blueDelta)}
                  </td>
                  <td className={`py-3 px-3 text-center font-mono text-xs ${getChannelColor(c.otherDelta)}`}>
                    {formatAdj(c.otherDelta)}
                  </td>

                  {/* Predicted ΔE00 */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono text-xs font-bold ${
                        isPassColor
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {c.predictedDeltaE00.toFixed(2)}
                    </span>
                  </td>

                  {/* Predicted ΔGloss */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono text-xs font-medium ${
                        isPassGloss
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {c.predictedDeltaGloss > 0 ? `+${c.predictedDeltaGloss.toFixed(1)}` : c.predictedDeltaGloss.toFixed(1)} GU
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="py-3 px-3 text-center font-mono text-xs font-bold text-slate-800">
                    {(c.confidence * 100).toFixed(0)}%
                  </td>

                  {/* Selection Button */}
                  {onSelect && (
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c);
                        }}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
