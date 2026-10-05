import { JevStructuredState, JevDecisionResult } from './types';
import { evaluateDeterministicRules } from './fallback';

export function isJevConfigured(): boolean {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Server-side Jev Decision Layer Client
 * Evaluates candidate corrections through TypeSafe API when available,
 * or safely falls back to deterministic rule engine.
 */
export async function getJevDecision(state: JevStructuredState): Promise<JevDecisionResult> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  const baseUrl = process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai';
  const model = process.env.TYPESAFE_MODEL || 'jev-latest';

  // If no API key configured, use deterministic fallback directly
  if (!apiKey) {
    return evaluateDeterministicRules(state);
  }

  try {
    const promptQuestions = [
      {
        id: 'q1_approval',
        question: 'Is the recommended correction acceptable within production ceramic printing tolerances?',
        options: ['APPROVE_RECOMMENDATION', 'REQUEST_REVIEW', 'ESCALATE'],
      },
      {
        id: 'q2_resolvable',
        question: 'Is the observed shade difference likely resolvable through inkjet printer adjustment alone?',
        options: ['YES', 'NO'],
      },
      {
        id: 'q3_review_needed',
        question: 'Does this case require human QC operator review before applying to the printer?',
        options: ['YES', 'NO'],
      },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${baseUrl}/v1/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        state,
        questions: promptQuestions,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Jev Client] API returned status ${response.status}. Using deterministic fallback.`);
      const fallbackResult = evaluateDeterministicRules(state);
      fallbackResult.explanation += ` (Jev API returned HTTP ${response.status} — operating in rule-based review mode)`;
      return fallbackResult;
    }

    const data = await response.json();

    // Map Jev API structured responses safely
    const decision = (data.decision || data.answers?.q1_approval || 'REQUEST_REVIEW') as JevDecisionResult['decision'];
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0.92;
    const resolvable = data.answers?.q2_resolvable !== 'NO';
    const humanReview = data.answers?.q3_review_needed !== 'NO';

    return {
      decision,
      confidence,
      probabilities: data.probabilities,
      resolvableByPrinterAlone: resolvable,
      requiresHumanReview: humanReview,
      explanation: data.explanation || `Jev model (${model}) evaluated structured printer state.`,
      isFallback: false,
      model,
      timestamp: new Date().toISOString(),
      rawResponse: data,
    };
  } catch (err: any) {
    console.warn(`[Jev Client] Connection error: ${err.message}. Safely falling back to deterministic rules.`);
    const fallbackResult = evaluateDeterministicRules(state);
    fallbackResult.explanation += ` (Jev service unreachable — operating in rule-based review mode)`;
    return fallbackResult;
  }
}
