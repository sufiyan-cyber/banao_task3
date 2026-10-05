import { CandidateCorrection } from '../calibration/optimizer';

export type JevDecisionAction = 'APPROVE_RECOMMENDATION' | 'REQUEST_REVIEW' | 'ESCALATE';

export interface JevStructuredState {
  sku: string;
  printer: string;
  delta_l: number;
  delta_a: number;
  delta_b: number;
  delta_e00: number;
  delta_gloss: number;
  current_sample: {
    l: number;
    a: number;
    b: number;
    gloss: number;
  };
  master_target: {
    l: number;
    a: number;
    b: number;
    gloss: number;
  };
  candidate_corrections: {
    rank: number;
    label: string;
    brown: number;
    yellow: number;
    black: number;
    red: number;
    blue: number;
    other: number;
    predicted_delta_e00: number;
    predicted_delta_gloss: number;
    confidence: number;
  }[];
  model_confidence: number;
  within_printer_constraints: boolean;
  is_printer_correction_sufficient: boolean;
  correction_loop: number;
  max_loops: number;
}

export interface JevDecisionResult {
  decision: JevDecisionAction;
  confidence: number;
  probabilities?: {
    APPROVE_RECOMMENDATION?: number;
    REQUEST_REVIEW?: number;
    ESCALATE?: number;
  };
  resolvableByPrinterAlone: boolean;
  requiresHumanReview: boolean;
  explanation: string;
  isFallback: boolean;
  model: string;
  timestamp: string;
  rawResponse?: any;
}
