import { JevStructuredState, JevDecisionResult } from './types';
import { CONFIG } from '../config';

/**
 * Deterministic Fallback Decision Engine
 * Used when TYPESAFE_API_KEY is missing, empty, or API is unreachable.
 *
 * Implements hard safety rules per PRD Section 26 & 37:
 * - Low model confidence -> REQUEST_REVIEW
 * - Out of bounds or printer correction insufficient -> ESCALATE
 * - Exceeded loop limit -> ESCALATE
 * - Normal bounded correction -> APPROVE_RECOMMENDATION (pending human QC approval)
 * - NEVER releases batch without QC approval!
 */
export function evaluateDeterministicRules(state: JevStructuredState): JevDecisionResult {
  const {
    within_printer_constraints,
    is_printer_correction_sufficient,
    model_confidence,
    correction_loop,
    max_loops,
    candidate_corrections,
  } = state;

  const bestCandidate = candidate_corrections[0];

  // Rule 6: Maximum correction loops exceeded -> ESCALATE
  if (correction_loop > max_loops) {
    return {
      decision: 'ESCALATE',
      confidence: 0.98,
      probabilities: { APPROVE_RECOMMENDATION: 0.02, REQUEST_REVIEW: 0.08, ESCALATE: 0.90 },
      resolvableByPrinterAlone: false,
      requiresHumanReview: true,
      explanation: `Maximum correction loop threshold (${max_loops} attempts) reached without reaching tolerance. Escalate to Plant Process Engineering for kiln/glaze inspection.`,
      isFallback: true,
      model: 'deterministic-rules-v1.0 (Fallback)',
      timestamp: new Date().toISOString(),
    };
  }

  // Rule 1 & PRD Section 15: Out of bounds or printer correction insufficient -> ESCALATE
  if (!within_printer_constraints || !is_printer_correction_sufficient) {
    return {
      decision: 'ESCALATE',
      confidence: 0.95,
      probabilities: { APPROVE_RECOMMENDATION: 0.03, REQUEST_REVIEW: 0.12, ESCALATE: 0.85 },
      resolvableByPrinterAlone: false,
      requiresHumanReview: true,
      explanation: 'Printer correction insufficient — required adjustments exceed channel limits or residual gloss/shade error cannot be resolved by inkjet printing alone. Escalate for process investigation.',
      isFallback: true,
      model: 'deterministic-rules-v1.0 (Fallback)',
      timestamp: new Date().toISOString(),
    };
  }

  // Rule 4: Low model confidence or high residual error -> REQUEST_REVIEW
  if (
    model_confidence < CONFIG.minModelConfidence ||
    (bestCandidate && bestCandidate.predicted_delta_e00 > 0.9)
  ) {
    return {
      decision: 'REQUEST_REVIEW',
      confidence: 0.88,
      probabilities: { APPROVE_RECOMMENDATION: 0.35, REQUEST_REVIEW: 0.60, ESCALATE: 0.05 },
      resolvableByPrinterAlone: true,
      requiresHumanReview: true,
      explanation: `Candidate correction brings shade within tolerance, but model confidence (${(model_confidence * 100).toFixed(0)}%) or predicted ΔE00 (${bestCandidate?.predicted_delta_e00}) warrants close QC scrutiny.`,
      isFallback: true,
      model: 'deterministic-rules-v1.0 (Fallback)',
      timestamp: new Date().toISOString(),
    };
  }

  // Standard case: High confidence, within bounds, predicted ΔE00 within tolerance
  return {
    decision: 'APPROVE_RECOMMENDATION',
    confidence: 0.94,
    probabilities: { APPROVE_RECOMMENDATION: 0.88, REQUEST_REVIEW: 0.10, ESCALATE: 0.02 },
    resolvableByPrinterAlone: true,
    requiresHumanReview: true, // Human QC approval remains strictly mandatory!
    explanation: `Candidate correction is within safe printer channel bounds (±5%), predicted ΔE00 is ${bestCandidate?.predicted_delta_e00} (<= ${CONFIG.colorToleranceDeltaE.toFixed(1)}), and model confidence is ${(model_confidence * 100).toFixed(0)}%. Ready for QC approval.`,
    isFallback: true,
    model: 'deterministic-rules-v1.0 (Fallback)',
    timestamp: new Date().toISOString(),
  };
}
