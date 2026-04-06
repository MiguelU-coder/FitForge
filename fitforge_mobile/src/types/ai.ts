// src/types/ai.ts

export type AiAction = 'INCREASE_WEIGHT' | 'MAINTAIN' | 'DELOAD' | 'CHANGE_REPS' | 'SUGGESTION' | 'UNKNOWN';

export interface WorkoutSuggestionData {
  message: string;
  suggestedWeight?: number;
  suggestedReps?: number;
  suggestedRir?: number;
  confidence: number;
  reasoning: string;
  action: AiAction;
}

export interface CoachResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  warnings: string[];
  motivation: string;
  llmProvider: string;
}

// Optional parsing utility if needed to clean data from python services
export function parseCoachResponse(json: any): CoachResponse {
  return {
    summary: json.summary || '',
    insights: Array.isArray(json.insights) ? json.insights.map(String) : [],
    recommendations: Array.isArray(json.recommendations) ? json.recommendations.map(String) : [],
    warnings: Array.isArray(json.warnings) ? json.warnings.map(String) : [],
    motivation: json.motivation || '',
    llmProvider: json.llm_provider || json.llmProvider || 'unknown',
  };
}

export function parseSuggestion(json: any): WorkoutSuggestionData {
  const actionStr = json.action?.toUpperCase();
  const validActions = ['INCREASE_WEIGHT', 'MAINTAIN', 'DELOAD', 'CHANGE_REPS', 'SUGGESTION'];
  const action: AiAction = validActions.includes(actionStr) ? actionStr : 'UNKNOWN';

  return {
    action,
    message: json.display_message || json.message || '',
    suggestedWeight: json.suggested_weight_kg ?? json.suggested_weight,
    suggestedReps: json.suggested_reps,
    suggestedRir: json.suggested_rir,
    confidence: json.confidence ?? 0.7,
    reasoning: json.reasoning || '',
  };
}
