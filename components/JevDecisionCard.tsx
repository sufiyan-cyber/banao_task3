import React from 'react';
import { Activity, ShieldAlert, CheckCircle, AlertTriangle, Info, Bot } from 'lucide-react';

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
      <div className="industrial-card p-4 text-center text-slate-500 text-sm">
        <Activity className="w-5 h-5 mx-auto mb-1 text-slate-400 animate-pulse" />
        Awaiting calibration & structured decision evaluation...
      </div>
    );
  }

  const isFallback = decision.isFallback;
  const dec = decision.decision;

  const getDecisionBadge = () => {
    switch (dec) {
      case 'APPROVE_RECOMMENDATION':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: CheckCircle,
          label: 'APPROVE RECOMMENDATION (PENDING QC)',
        };
      case 'REQUEST_REVIEW':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          label: 'REQUEST QC OPERATOR REVIEW',
        };
      case 'ESCALATE':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: ShieldAlert,
          label: 'ESCALATE TO PROCESS ENGINEERING',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: Info,
          label: dec,
        };
    }
  };

  const badge = getDecisionBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="industrial-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <span>Jev Structured Decision Layer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">{decision.model}</span>
          {isFallback && (
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded">
              Rule-Based Mode
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Fallback Banner if Jev unavailable */}
        {isFallback && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-semibold">
                Jev unavailable — operating in rule-based review mode.
              </span>
            </div>
            <span className="text-[10px] text-amber-700">Deterministic Safety Engine</span>
          </div>
        )}

        {/* PRD Section 15: Warning if printer correction insufficient */}
        {(!isPrinterCorrectionSufficient || dec === 'ESCALATE') && (
          <div className="bg-rose-50 border-l-4 border-l-rose-600 border border-rose-200 rounded p-3 text-xs text-rose-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Printer correction insufficient — escalate for process investigation.</span>
            </div>
            <p className="text-rose-800">
              The observed shade or gloss deviation cannot be reliably rectified by inkjet pigment channel adjustment alone without violating physical firing limits. Glaze viscosity, slip batch, or kiln thermal profile investigation is required.
            </p>
          </div>
        )}

        {/* Primary Decision Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-md border ${badge.bg}`}>
              <BadgeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Structured Decision</span>
              <span className="text-sm font-bold text-slate-900 tracking-tight">{badge.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {(decision.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Printer Sufficient?</span>
              <span className={`text-xs font-bold ${decision.resolvableByPrinterAlone ? 'text-emerald-700' : 'text-rose-700'}`}>
                {decision.resolvableByPrinterAlone ? 'YES (Resolvable)' : 'NO (Insufficient)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Human QC Required?</span>
              <span className="text-xs font-bold text-blue-700">
                {decision.requiresHumanReview ? 'YES (Mandatory)' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Explanation */}
        {decision.explanation && (
          <div className="text-xs text-slate-700 bg-white border border-slate-200 rounded p-2.5 leading-relaxed">
            <strong className="text-slate-900">Evaluation Rationale: </strong>
            {decision.explanation}
          </div>
        )}

        {/* Architecture Separation Reminder */}
        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
          <span>
            <strong>Architectural Rule:</strong> Calibration engine calculates adjustments; Jev evaluates decision state.
          </span>
          <span className="font-mono text-[10px]">No LLM hallucinated values</span>
        </div>
      </div>
    </div>
  );
}
