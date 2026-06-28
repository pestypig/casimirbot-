export type AskTurnLiveSourceMailReadDefaults = {
  limit: number;
  batchCap: number;
  reason: string;
};

export type AskTurnLiveSourceMailReadDefaultsDependencies = {
  hasLiveSourceMailInterpretationCue: (transcript: string) => boolean;
};

const readNumber = (value: string | number | undefined, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const readAskTurnPositiveIntegerEnv = (name: string, fallback: number, min: number, max: number): number =>
  clampNumber(Math.trunc(readNumber(process.env[name], fallback)), min, max);

export const createAskTurnLiveSourceMailReadDefaultsBuilder = (
  deps: AskTurnLiveSourceMailReadDefaultsDependencies,
) => (transcript: string): AskTurnLiveSourceMailReadDefaults => {
  const text = transcript.trim();
  const latestLimit = readAskTurnPositiveIntegerEnv("STAGE_PLAY_MAIL_READ_LATEST_SCENE_LIMIT", 1, 1, 12);
  const microBatchLimit = readAskTurnPositiveIntegerEnv("STAGE_PLAY_MAIL_READ_CURRENT_TURN_MICRO_BATCH_LIMIT", 4, 1, 12);
  const salienceLimit = readAskTurnPositiveIntegerEnv("STAGE_PLAY_MAIL_READ_SALIENCE_WINDOW_LIMIT", 5, 1, 12);
  const defaultLimit = readAskTurnPositiveIntegerEnv("STAGE_PLAY_MAIL_READ_DEFAULT_LIMIT", 3, 1, 12);
  const wantsLatestScene =
    /\b(?:what\s+does\s+the\s+latest|describe\s+(?:the\s+)?latest|latest\s+(?:mail|visual\s+update|source\s+update|scene)|one\s+sentence\s+(?:latest|visual|mail)|what\s+is\s+visible)\b/i.test(text) &&
    !deps.hasLiveSourceMailInterpretationCue(text);
  if (wantsLatestScene) {
    return { limit: latestLimit, batchCap: latestLimit, reason: "latest_scene_answer" };
  }
  const wantsSalienceWindow =
    /\b(?:only\s+(?:tell|announce|notify|call\s*out)|do\s+not\s+bother\s+me\s+unless|don'?t\s+bother\s+me\s+unless|important|urgent|danger|hostile|salient|voice\s+commentary|commentate)\b/i.test(text);
  if (wantsSalienceWindow) {
    return { limit: salienceLimit, batchCap: salienceLimit, reason: "salience_window" };
  }
  if (deps.hasLiveSourceMailInterpretationCue(text)) {
    return { limit: microBatchLimit, batchCap: microBatchLimit, reason: "current_turn_micro_batch" };
  }
  return { limit: defaultLimit, batchCap: defaultLimit, reason: "default_mail_read" };
};
