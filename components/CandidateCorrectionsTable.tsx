import React from 'react';
import { Sliders, ShieldCheck } from 'lucide-react';

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
    if (val === 0) return 'text-[#A39B8E]';
    return val > 0 ? 'text-[#B8860B] font-bold' : 'text-[#1A1A1A] font-bold';
  };

  return (
    <div className="serif-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-[#B8860B]" />
          <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
            Printer Correction Candidates (6-Channel Calibration Model)
          </span>
        </div>
        <span className="small-caps text-[10px] text-[#6B6B6B]">
          Multi-objective optimization
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#E8E4DF] text-xs text-[#6B6B6B]">
              <th className="py-3 px-4 font-mono small-caps text-[10px]">Rank / Candidate</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Brown</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Yellow</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Black</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Red</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Blue</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Other</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Pred. ΔE00</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Pred. ΔGloss</th>
              <th className="py-3 px-3 text-center font-mono small-caps text-[10px]">Confidence</th>
              {onSelect && <th className="py-3 px-4 text-right font-mono small-caps text-[10px]">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E4DF] text-[#1A1A1A]">
            {candidates.map((c) => {
              const isSelected = selectedId ? c.id === selectedId : false;
              const isPassColor = c.predictedDeltaE00 <= colorTolerance;
              const isPassGloss = Math.abs(c.predictedDeltaGloss) <= glossTolerance;

              return (
                <tr
                  key={c.id || c.rank}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-l-4 border-l-[#B8860B]'
                      : 'hover:bg-[#FAF8F5]'
                  }`}
                  onClick={() => onSelect && onSelect(c)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E4DF] text-[#1A1A1A] flex items-center justify-center text-xs font-serif font-bold">
                        {c.rank}
                      </span>
                      <div>
                        <div className="font-serif font-semibold text-sm text-[#1A1A1A] flex items-center gap-2">
                          <span>
                            {c.label ||
                              (c.rank === 1
                                ? 'Candidate A — System Recommended'
                                : c.rank === 2
                                ? 'Candidate B — Gloss-Stabilizing'
                                : 'Candidate C — Color-Prioritized')}
                          </span>
                          {c.isRecommended && (
                            <span className="small-caps text-[9px] bg-[#FFF8E7] text-[#9D4E00] border border-[#F2D0A4] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                              <ShieldCheck className="w-2.5 h-2.5 text-[#B8860B]" />
                              System Recommended
                            </span>
                          )}
                        </div>
                        {c.notes && <p className="text-[11px] text-[#6B6B6B] line-clamp-1 italic">{c.notes}</p>}
                      </div>
                    </div>
                  </td>

                  {/* 6 Inkjet Channel Adjustments */}
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.brownDelta)}`}>
                    {formatAdj(c.brownDelta)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.yellowDelta)}`}>
                    {formatAdj(c.yellowDelta)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.blackDelta)}`}>
                    {formatAdj(c.blackDelta)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.redDelta)}`}>
                    {formatAdj(c.redDelta)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.blueDelta)}`}>
                    {formatAdj(c.blueDelta)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-mono text-xs ${getChannelColor(c.otherDelta)}`}>
                    {formatAdj(c.otherDelta)}
                  </td>

                  {/* Predicted ΔE00 */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                        isPassColor
                          ? 'bg-[#EBF5EE] text-[#2D6A4F] border border-[#B7E4C7]'
                          : 'bg-[#FCECEE] text-[#9B2226] border border-[#F5C2C7]'
                      }`}
                    >
                      {c.predictedDeltaE00.toFixed(2)}
                    </span>
                  </td>

                  {/* Predicted ΔGloss */}
                  <td className="py-3.5 px-3 text-center font-mono text-xs text-[#6B6B6B]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded ${
                        isPassGloss
                          ? 'text-[#1A1A1A]'
                          : 'bg-[#FFF8E7] text-[#9D4E00] border border-[#F2D0A4]'
                      }`}
                    >
                      {c.predictedDeltaGloss > 0 ? `+${c.predictedDeltaGloss.toFixed(1)}` : c.predictedDeltaGloss.toFixed(1)} GU
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-[#1A1A1A]">
                    {(c.confidence * 100).toFixed(0)}%
                  </td>

                  {/* Selection Button */}
                  {onSelect && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c);
                        }}
                        className={`text-xs px-3 py-1 rounded font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#B8860B] text-white shadow-sm font-semibold'
                            : 'bg-white border border-[#E8E4DF] text-[#1A1A1A] hover:border-[#B8860B] hover:text-[#B8860B]'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
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
