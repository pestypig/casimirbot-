import type {
  HelixLiveSituationPrediction,
  HelixLiveSituationPredictionStatus,
} from "@shared/helix-live-situation-prediction";

const predictionsByRun = new Map<string, HelixLiveSituationPrediction[]>();

export function recordLiveSituationPrediction(prediction: HelixLiveSituationPrediction): HelixLiveSituationPrediction {
  const existing = predictionsByRun.get(prediction.situation_run_id) ?? [];
  predictionsByRun.set(prediction.situation_run_id, [
    ...existing.filter((entry: HelixLiveSituationPrediction) => entry.prediction_id !== prediction.prediction_id),
    prediction,
  ].slice(-800));
  return prediction;
}

export function listLiveSituationPredictions(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  status?: HelixLiveSituationPredictionStatus | null;
  includeExpired?: boolean;
  limit?: number;
} = {}): HelixLiveSituationPrediction[] {
  const limit = Math.max(0, Math.min(800, Math.trunc(input.limit ?? 200)));
  const now = Date.now();
  return (Array.from(predictionsByRun.values()).flat() as HelixLiveSituationPrediction[])
    .filter((entry: HelixLiveSituationPrediction) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixLiveSituationPrediction) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixLiveSituationPrediction) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixLiveSituationPrediction) => !input.status || entry.status === input.status)
    .filter((entry: HelixLiveSituationPrediction) => input.includeExpired || Date.parse(entry.expires_at) > now)
    .sort((a: HelixLiveSituationPrediction, b: HelixLiveSituationPrediction) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function getLiveSituationPrediction(predictionId: string): HelixLiveSituationPrediction | null {
  return (Array.from(predictionsByRun.values()).flat() as HelixLiveSituationPrediction[])
    .find((entry: HelixLiveSituationPrediction) => entry.prediction_id === predictionId) ?? null;
}

export function updateLiveSituationPredictionStatus(
  predictionId: string,
  status: HelixLiveSituationPredictionStatus,
): HelixLiveSituationPrediction | null {
  const prediction = getLiveSituationPrediction(predictionId);
  if (!prediction) return null;
  return recordLiveSituationPrediction({ ...prediction, status });
}

export function resetLiveSituationPredictionsForTest(): void {
  predictionsByRun.clear();
}

