import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_PREDICTION_VALIDATION_SCHEMA,
  type StagePlayLiveSourceImmersionActivityV1,
  type StagePlayLiveSourceImmersionPredictionValidationResultV1,
  type StagePlayLiveSourceImmersionSalienceLevelV1,
  type StagePlayLiveSourceImmersionStateV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourcePredictionValidationRecommendedNextV1,
  type StagePlayLiveSourcePredictionValidationV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type { StagePlayLiveSourceDeltaExtractionResultV1 } from "./stage-play-live-source-delta-extractor";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsTerm = (text: string, term: string): boolean => {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(" ")) return text.includes(normalizedTerm);
  return new RegExp(`(?:^|\\s)${escapeRegExp(normalizedTerm)}(?:\\s|$)`).test(text);
};

const ACTIVITY_TERMS: Record<Exclude<StagePlayLiveSourceImmersionActivityV1, "unknown">, string[]> = {
  interior_base: ["interior", "base", "inside", "house", "building", "chest", "bed"],
  inventory_management: ["inventory", "chest", "hotbar", "item", "crafting", "storage"],
  outdoor_exploration: ["outdoor", "outside", "forest", "tree", "grass", "route", "terrain", "sky"],
  combat_or_damage: ["combat", "damage", "fire", "burning", "hostile", "mob", "sword", "creeper", "zombie", "attack"],
  mining_or_cave: ["cave", "mining", "mine", "stone", "ore", "lava", "torch", "underground", "dark"],
  building_or_crafting: ["building", "crafting", "placing", "structure", "construction"],
  scene_transition: ["transition", "changed", "moved", "returned", "switch", "opens", "closes"],
};

const activitySignal = (activity: StagePlayLiveSourceImmersionActivityV1): string | null =>
  activity === "unknown" ? null : `activity:${activity}`;

const activitySignalsForText = (text: string): string[] =>
  Object.entries(ACTIVITY_TERMS)
    .filter(([, terms]) => terms.some((term) => containsTerm(text, term)))
    .map(([activity]) => `activity:${activity}`);

const buildNewSignals = (input: {
  latestMailItems: StagePlayLiveSourceMailItemV1[];
  delta: StagePlayLiveSourceDeltaExtractionResultV1;
}): string[] => {
  const salienceSignal = `salience:${input.delta.salience.level}`;
  return uniqueStrings([
    activitySignal(input.delta.currentActivity),
    salienceSignal,
    ...input.delta.currentSceneFacts.map((fact) => `fact:${fact}`),
    ...input.delta.changedFacts.map((fact) => `changed:${fact}`),
    ...input.delta.watchTargets.map((target) => `watch:${target}`),
    ...input.delta.salience.reasons.map((reason) => `salience_reason:${reason}`),
    ...input.latestMailItems.flatMap((item) => [
      item.sourceRefs.frameRef ? `frame:${item.sourceRefs.frameRef}` : null,
      item.sourceRefs.evidenceRef ? `evidence:${item.sourceRefs.evidenceRef}` : null,
    ]),
  ]);
};

const scoreablePredictionText = (
  prediction: NonNullable<StagePlayLiveSourceImmersionStateV1["prediction"]>,
): string => normalizeText([
  prediction.text,
  ...prediction.watchTargets,
  ...prediction.validationSignals,
].join(" "));

const supportedSignalsFor = (input: {
  prediction: NonNullable<StagePlayLiveSourceImmersionStateV1["prediction"]>;
  combinedText: string;
  delta: StagePlayLiveSourceDeltaExtractionResultV1;
}): string[] => {
  const supported: string[] = [];
  for (const signal of input.prediction.validationSignals) {
    if (containsTerm(input.combinedText, signal)) supported.push(`validation_signal:${signal}`);
  }
  for (const target of input.prediction.watchTargets) {
    if (containsTerm(input.combinedText, target)) supported.push(`watch_target:${target}`);
  }
  const predictedText = scoreablePredictionText(input.prediction);
  const observedActivity = activitySignal(input.delta.currentActivity);
  if (observedActivity && activitySignalsForText(predictedText).includes(observedActivity)) {
    supported.push(observedActivity);
  }
  return uniqueStrings(supported);
};

const contradictedSignalsFor = (input: {
  prediction: NonNullable<StagePlayLiveSourceImmersionStateV1["prediction"]>;
  delta: StagePlayLiveSourceDeltaExtractionResultV1;
}): string[] => {
  const predictedActivities = activitySignalsForText(scoreablePredictionText(input.prediction));
  const observedActivity = activitySignal(input.delta.currentActivity);
  if (!observedActivity || predictedActivities.length === 0 || predictedActivities.includes(observedActivity)) return [];
  return [`predicted_activity_missed:${predictedActivities.join("|")}`, `observed_${observedActivity}`];
};

const resultForSignals = (input: {
  priorPrediction: StagePlayLiveSourceImmersionStateV1["prediction"];
  supportedSignals: string[];
  contradictedSignals: string[];
}): StagePlayLiveSourceImmersionPredictionValidationResultV1 => {
  if (!input.priorPrediction) return "no_prior_prediction";
  if (input.supportedSignals.length > 0 && input.contradictedSignals.length === 0) return "supported";
  if (input.supportedSignals.length > 0 && input.contradictedSignals.length > 0) return "partially_supported";
  if (input.supportedSignals.length === 0 && input.contradictedSignals.length > 0) return "contradicted";
  return "unresolved";
};

const recommendedNextFor = (input: {
  result: StagePlayLiveSourceImmersionPredictionValidationResultV1;
  salienceHint: StagePlayLiveSourceImmersionSalienceLevelV1;
  voiceCandidate: boolean;
  newMailCount: number;
}): StagePlayLiveSourcePredictionValidationRecommendedNextV1 => {
  if (input.voiceCandidate && (input.salienceHint === "urgent" || input.salienceHint === "high")) {
    return "request_voice_callout";
  }
  if (input.result === "contradicted" || input.result === "partially_supported") return "record_interpretation";
  if (input.result === "no_prior_prediction") {
    return input.newMailCount > 0 ? "record_interpretation" : "wait_for_next_summary";
  }
  if (input.salienceHint === "urgent" || input.salienceHint === "high" || input.salienceHint === "medium") {
    return "record_interpretation";
  }
  if (input.result === "unresolved") return "request_more_evidence";
  return "wait_for_next_summary";
};

export function validateStagePlayLiveSourcePredictionFromMail(input: {
  jobId: string;
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  latestMailItems: StagePlayLiveSourceMailItemV1[];
  delta: StagePlayLiveSourceDeltaExtractionResultV1;
  createdAt?: string;
}): StagePlayLiveSourcePredictionValidationV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const priorPrediction = input.priorImmersionState?.prediction ?? null;
  const newMailIds = uniqueStrings(input.latestMailItems.map((item) => item.mailId));
  const combinedText = normalizeText([
    ...input.latestMailItems.map((item) => item.summary.text || item.summary.preview),
    ...input.delta.currentSceneFacts,
    ...input.delta.changedFacts,
    ...input.delta.salience.reasons,
    ...input.delta.watchTargets,
    input.delta.currentActivity,
  ].join("\n"));
  const supportedSignals = priorPrediction
    ? supportedSignalsFor({ prediction: priorPrediction, combinedText, delta: input.delta })
    : [];
  const contradictedSignals = priorPrediction
    ? contradictedSignalsFor({ prediction: priorPrediction, delta: input.delta })
    : [];
  const result = resultForSignals({
    priorPrediction,
    supportedSignals,
    contradictedSignals,
  });
  const newSignals = buildNewSignals({
    latestMailItems: input.latestMailItems,
    delta: input.delta,
  });
  const validationId = `stage_play_live_source_prediction_validation:${hashShort([
    input.jobId,
    priorPrediction?.predictionId ?? null,
    newMailIds,
    result,
    supportedSignals,
    contradictedSignals,
    createdAt,
  ])}`;
  return {
    artifactId: "stage_play_live_source_prediction_validation",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_PREDICTION_VALIDATION_SCHEMA,
    validationId,
    jobId: input.jobId,
    priorPredictionId: priorPrediction?.predictionId ?? null,
    newMailIds,
    result,
    supportedSignals,
    contradictedSignals,
    newSignals,
    salienceHint: input.delta.salience.level,
    recommendedNext: recommendedNextFor({
      result,
      salienceHint: input.delta.salience.level,
      voiceCandidate: input.delta.salience.voiceCandidate,
      newMailCount: newMailIds.length,
    }),
    evidenceRefs: uniqueStrings([
      validationId,
      input.jobId,
      input.priorImmersionState?.immersionStateId,
      priorPrediction?.predictionId,
      ...newMailIds,
      ...input.latestMailItems.flatMap((item) => item.evidenceRefs),
      ...input.latestMailItems.map((item) => item.sourceRefs.evidenceRef),
    ]),
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
  };
}
