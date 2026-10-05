import React from 'react';
import { Activity, ShieldAlert, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface JevDecisionProps {
  decision?: {
    id?: string;
    decision: string; // APPROVE_RECOMMENDATION, REQUEST_REVIEW, ESCALATE
    confidence: number;
    explanation?: string | null;
    requiresHumanReview: boolean;
    resolvableByPrinterAlone: boolean;
    model: string;
    isFallback: boolean;
  } | null;
  isPrinterCorrectionSufficient?: boolean;
}

export function JevDecisionCard({ decision, isPrinterCorrectionSufficient = true }: JevDecisionProps) {
  if (!decision) {
    return (
      <div className="serif-card p-6 text-center text-[#6B6B6B] text-sm">
        <Activity className="w-5 h-5 mx-auto mb-2 text-[#B8860B] animate-pulse" />
        <span className="font-serif italic">Awaiting calibration & structured decision evaluation...</span>
      </div>
    );
  }

  const isFallback = decision.isFallback;
  const dec = decision.decision;

  const getDecisionBadge = () => {
    switch (dec) {
      case 'APPROVE_RECOMMENDATION':
        return {
          bg: 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]',
          icon: CheckCircle,
          label: 'APPROVE RECOMMENDATION (PENDING QC)',
        };
      case 'REQUEST_REVIEW':
        return {
          bg: 'bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]',
          icon: AlertTriangle,
          label: 'REQUEST QC OPERATOR REVIEW',
        };
      case 'ESCALATE':
        return {
          bg: 'bg-[#FCECEE] text-[#9B2226] border-[#F5C2C7]',
          icon: ShieldAlert,
          label: 'ESCALATE TO PROCESS ENGINEERING',
        };
      default:
        return {
          bg: 'bg-[#F5F3F0] text-[#1A1A1A] border-[#E8E4DF]',
          icon: Info,
          label: dec,
        };
    }
  };

  const badge = getDecisionBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="serif-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#B8860B]" />
          <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
            Jev Structured Decision Layer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="small-caps text-[10px] text-[#6B6B6B]">{decision.model}</span>
          {isFallback && (
            <span className="small-caps text-[9px] bg-[#FFF8E7] text-[#9D4E00] border border-[#F2D0A4] px-2 py-0.5 rounded font-semibold">
              Rule-Based Mode
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Fallback Banner if Jev unavailable */}
        {isFallback && (
          <div className="bg-[#FFF8E7] border border-[#F2D0A4] rounded-md p-3 flex items-center justify-between text-xs text-[#9D4E00]">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#B8860B] shrink-0" />
              <span className="font-medium">
                Jev unavailable — operating in rule-based review mode.
              </span>
            </div>
            <span className="small-caps text-[10px] text-[#B8860B] font-semibold">
              Deterministic Safety Engine
            </span>
          </div>
        )}

        {/* PRD Section 15: Warning if printer correction insufficient */}
        {(!isPrinterCorrectionSufficient || dec === 'ESCALATE') && (
          <div className="bg-[#FCECEE] border-l-4 border-l-[#9B2226] border border-[#F5C2C7] rounded-md p-4 text-xs text-[#9B2226] space-y-1.5">
            <div className="flex items-center gap-2 font-serif font-bold text-sm text-[#9B2226]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Printer correction insufficient — escalate for process investigation.</span>
            </div>
            <p className="leading-relaxed font-sans">
              The observed shade or gloss deviation cannot be reliably rectified by inkjet pigment channel adjustment alone without violating physical firing limits. Glaze viscosity, slip batch, or kiln thermal profile investigation is required.
            </p>
          </div>
        )}

        {/* Primary Decision Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF8F5] border border-[#E8E4DF] rounded-md">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-md border ${badge.bg}`}>
              <BadgeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="small-caps text-[9px] text-[#A39B8E] block">
                Structured Decision Output
              </span>
              <span className="font-serif font-bold text-sm text-[#1A1A1A] tracking-tight">
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 sm:border-l border-[#E8E4DF] pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="small-caps text-[9px] text-[#A39B8E] block">Confidence</span>
              <span className="font-serif font-bold text-base text-[#1A1A1A]">
                {(decision.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="small-caps text-[9px] text-[#A39B8E] block">Printer Sufficient?</span>
              <span className={`text-xs font-serif font-bold ${decision.resolvableByPrinterAlone ? 'text-[#2D6A4F]' : 'text-[#9B2226]'}`}>
                {decision.resolvableByPrinterAlone ? 'YES (Resolvable)' : 'NO (Insufficient)'}
              </span>
            </div>
            <div>
              <span className="small-caps text-[9px] text-[#A39B8E] block">Human QC Required?</span>
              <span className="text-xs font-serif font-bold text-[#B8860B]">
                {decision.requiresHumanReview ? 'YES (Mandatory)' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Explanation */}
        {decision.explanation && (
          <div className="text-xs text-[#1A1A1A] bg-white border border-[#E8E4DF] rounded-md p-3.5 leading-relaxed font-sans">
            <strong className="font-serif text-[#1A1A1A] font-semibold">Evaluation Rationale: </strong>
            <span className="italic text-[#6B6B6B]">&ldquo;{decision.explanation}&rdquo;</span>
          </div>
        )}

        {/* Architecture Separation Reminder */}
        <div className="text-[11px] text-[#A39B8E] border-t border-[#E8E4DF] pt-2.5 flex items-center justify-between font-sans">
          <span>
            <strong className="text-[#6B6B6B]">Architectural Principle:</strong> Calibration engine calculates adjustments; Jev evaluates decision state.
          </span>
          <span className="small-caps text-[9px]">Deterministic physical models</span>
        </div>
      </div>
    </div>
  );
}
