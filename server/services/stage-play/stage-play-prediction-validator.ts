import crypto from "node:crypto";
import type { StagePlayCompactObservationV1 } from "@shared/contracts/stage-play-compact-observation.v1";
import {
  buildStagePlayPredictionValidationV1,
  type StagePlayPredictionValidationOutcomeV1,
  type StagePlayPredictionValidationV1,
} from "@shared/contracts/stage-play-prediction-validation.v1";
import type {
  StagePlayPredictedMoveClassV1,
  StagePlayPredictionHypothesisV1,
} from "@shared/contracts/stage-play-prediction.v1";

export type ValidateStagePlayPredictionInput = {
  prediction: StagePlayPredictionHypothesisV1;
  observation: StagePlayCompactObservationV1;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const lower = (value: string | null | undefined): string => String(value ?? "").toLowerCase();

const slug = (value: string): string =>
  lower(value)
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "unknown";

const factText = (fact: StagePlayCompactObservationV1["sceneFacts"][number]): string =>
  lower([fact.factId, fact.factKind, fact.label, fact.summary].join(" "));

const moveClassPatterns: Record<StagePlayPredictedMoveClassV1, RegExp> = {
  delay: /\bdelay\b|stall|wait|buy time|hold position|postpone/,
  attack: /\battack\b|strike|fire|assault|engage/,
  retreat: /\bretreat\b|withdraw|fall back|evacuate/,
  reveal_information: /\breveal\b|disclose|expose|announce|confess|truth/,
  seek_confirmation: /\bconfirm\b|verify|check|proof|evidence/,
  negotiate: /\bnegotiate\b|parley|bargain|terms|concession/,
  deceive: /\bdeceive\b|mislead|bluff|feint|lie/,
  escalate: /\bescalate\b|provocation|attack|assault/,
  deescalate: /deescalate|de-escalate|avoid battle|stand down|calm/,
  unknown: /$a/,
};

const inferMoveSignals = (observation: StagePlayCompactObservationV1): string[] => {
  const signals: string[] = [];
  const blockedText = observation.sceneFacts
    .filter((fact) => fact.factKind === "blocked_affordance")
    .map(factText)
    .join(" ");
  for (const fact of observation.sceneFacts) {
    if (fact.factKind === "blocked_affordance") continue;
    const text = factText(fact);
    for (const [moveClass, pattern] of Object.entries(moveClassPatterns) as Array<[StagePlayPredictedMoveClassV1, RegExp]>) {
      if (moveClass === "unknown") continue;
      if (moveClass === "attack" && /attack|engage|fire|assault/.test(blockedText) && /attack|engage|fire|assault/.test(text)) continue;
      if (moveClass === "retreat" && /retreat|withdraw/.test(blockedText) && /retreat|withdraw/.test(text)) continue;
      if (moveClass === "reveal_information" && /reveal|secret|disclose|expose/.test(blockedText) && /reveal|secret|disclose|expose/.test(text)) continue;
      if (pattern.test(text)) signals.push(`move_class:${moveClass}`);
    }
  }
  return unique(signals);
};

const badgeIdForFact = (fact: StagePlayCompactObservationV1["sceneFacts"][number]): string => {
  if (/^(setting|actor|resource|hazard|affordance|blocked|goal|world_state|constraint)\./.test(fact.factId)) {
    return fact.factId.replace(/^objective\./, "goal.");
  }
  if (fact.factKind === "actor") return `actor.${slug(fact.label)}`;
  if (fact.factKind === "hazard") return `hazard.${slug(fact.label)}`;
  if (fact.factKind === "blocked_affordance") return `blocked.${slug(fact.label)}`;
  if (fact.factKind === "affordance") return `affordance.${slug(fact.label)}`;
  return `${fact.factKind}.${slug(fact.label)}`;
};

const inferObservationSignals = (observation: StagePlayCompactObservationV1): string[] => {
  const moveSignals = inferMoveSignals(observation);
  const actorSignals = observation.sceneFacts
    .filter((fact) => fact.factKind === "actor")
    .map((fact) => `actor:${badgeIdForFact(fact)}`);
  const blockedSignals = observation.sceneFacts
    .filter((fact) => fact.factKind === "blocked_affordance")
    .map((fact) => `blocked_move:${badgeIdForFact(fact)}`);
  const hazardSignals = observation.sceneFacts
    .filter((fact) => fact.factKind === "hazard")
    .map((fact) => `hazard:${badgeIdForFact(fact)}`);
  return unique([...moveSignals, ...actorSignals, ...blockedSignals, ...hazardSignals]);
};

const contradictoryMoveSignals = (
  prediction: StagePlayPredictionHypothesisV1,
  observedSignals: string[],
): string[] => {
  const observedMoveClasses = observedSignals
    .filter((signal) => signal.startsWith("move_class:"))
    .map((signal) => signal.replace("move_class:", ""));
  if (prediction.predictedMoveClass === "unknown" || observedMoveClasses.length === 0) return [];
  const compatible: Partial<Record<StagePlayPredictedMoveClassV1, string[]>> = {
    delay: ["delay", "seek_confirmation", "negotiate", "deescalate"],
    attack: ["attack", "escalate"],
    retreat: ["retreat", "deescalate"],
    reveal_information: ["reveal_information", "seek_confirmation", "escalate"],
    seek_confirmation: ["seek_confirmation", "delay", "negotiate"],
    negotiate: ["negotiate", "delay", "deescalate"],
    deceive: ["deceive", "delay", "escalate"],
    escalate: ["escalate", "attack", "reveal_information"],
    deescalate: ["deescalate", "delay", "retreat", "negotiate"],
  };
  const allowed = compatible[prediction.predictedMoveClass] ?? [prediction.predictedMoveClass];
  if (observedMoveClasses.some((moveClass) => allowed.includes(moveClass))) return [];
  return observedMoveClasses.map((moveClass) => `move_class:${moveClass}`);
};

const contradictedBlockedSignals = (
  prediction: StagePlayPredictionHypothesisV1,
  observedSignals: string[],
): string[] => {
  const observedMoveClasses = observedSignals
    .filter((signal) => signal.startsWith("move_class:"))
    .map((signal) => signal.replace("move_class:", ""));
  const contradicted: string[] = [];
  for (const blockedId of prediction.blockedMoveIds) {
    const blocked = lower(blockedId);
    if (/attack|engage/.test(blocked) && observedMoveClasses.includes("attack")) contradicted.push(`blocked_move:${blockedId}`);
    if (/retreat|withdraw/.test(blocked) && observedMoveClasses.includes("retreat")) contradicted.push(`blocked_move:${blockedId}`);
    if (/reveal|secret/.test(blocked) && observedMoveClasses.includes("reveal_information")) contradicted.push(`blocked_move:${blockedId}`);
  }
  return contradicted;
};

const hasLaterWindow = (prediction: StagePlayPredictionHypothesisV1, observation: StagePlayCompactObservationV1): boolean => {
  const predictionEnd = Date.parse(prediction.sourceObservationWindow.toTs);
  const validationEnd = Date.parse(observation.sourceWindow.toTs);
  if (!Number.isFinite(predictionEnd) || !Number.isFinite(validationEnd)) return true;
  return validationEnd > predictionEnd;
};

export function validateStagePlayPredictionAgainstObservation(
  input: ValidateStagePlayPredictionInput,
): StagePlayPredictionValidationV1 {
  const prediction = input.prediction;
  const observation = input.observation;
  const evidenceRefs = unique([
    observation.observationId,
    ...observation.sceneFacts.flatMap((fact) => fact.evidenceRefs),
  ]);

  if (observation.sourceWindow.sourceIds.length === 0 && evidenceRefs.length <= 1) {
    return buildStagePlayPredictionValidationV1({
      validationId: `stage_play_prediction_validation:${hashShort([prediction.predictionId, observation.observationId, "source_missing"])}`,
      predictionId: prediction.predictionId,
      graphId: prediction.graphId,
      validationWindow: {
        fromTs: observation.sourceWindow.fromTs,
        toTs: observation.sourceWindow.toTs,
        evidenceRefs,
      },
      outcome: "source_missing",
      matchedSignals: [],
      contradictedSignals: [],
      confidenceDelta: -0.2,
      explanation: "No scoreable source evidence was available in the validation window.",
    });
  }

  if (prediction.predictedMoveClass === "unknown" || prediction.scoreableSignals.length < 2) {
    return buildStagePlayPredictionValidationV1({
      validationId: `stage_play_prediction_validation:${hashShort([prediction.predictionId, observation.observationId, "too_vague"])}`,
      predictionId: prediction.predictionId,
      graphId: prediction.graphId,
      validationWindow: {
        fromTs: observation.sourceWindow.fromTs,
        toTs: observation.sourceWindow.toTs,
        evidenceRefs,
      },
      outcome: "too_vague_to_score",
      matchedSignals: [],
      contradictedSignals: [],
      confidenceDelta: -0.1,
      explanation: "The prediction did not name a specific enough move class and signal set to score.",
    });
  }

  if (!hasLaterWindow(prediction, observation)) {
    return buildStagePlayPredictionValidationV1({
      validationId: `stage_play_prediction_validation:${hashShort([prediction.predictionId, observation.observationId, "not_yet"])}`,
      predictionId: prediction.predictionId,
      graphId: prediction.graphId,
      validationWindow: {
        fromTs: observation.sourceWindow.fromTs,
        toTs: observation.sourceWindow.toTs,
        evidenceRefs,
      },
      outcome: "not_yet_observable",
      matchedSignals: [],
      contradictedSignals: [],
      confidenceDelta: 0,
      explanation: "The validation window has not advanced beyond the prediction source window.",
    });
  }

  const observedSignals = inferObservationSignals(observation);
  const predictedSignals = new Set(prediction.scoreableSignals);
  const matchedSignals = observedSignals.filter((signal) => predictedSignals.has(signal));
  const directMoveSignal = `move_class:${prediction.predictedMoveClass}`;
  if (observedSignals.includes(directMoveSignal) && !matchedSignals.includes(directMoveSignal)) {
    matchedSignals.unshift(directMoveSignal);
  }
  const contradictedSignals = unique([
    ...contradictoryMoveSignals(prediction, observedSignals),
    ...contradictedBlockedSignals(prediction, observedSignals),
  ]);
  const matchedMove = matchedSignals.some((signal) => signal === directMoveSignal);
  const matchedConstraint = matchedSignals.some((signal) => signal.startsWith("blocked_move:") || signal.startsWith("hazard:"));
  const matchedActor = matchedSignals.some((signal) => signal.startsWith("actor:"));

  let outcome: StagePlayPredictionValidationOutcomeV1;
  if (matchedMove && (matchedConstraint || matchedActor || matchedSignals.length >= 2) && contradictedSignals.length === 0) {
    outcome = "confirmed";
  } else if (matchedSignals.length > 0 && contradictedSignals.length <= matchedSignals.length) {
    outcome = "partially_confirmed";
  } else {
    outcome = "missed";
  }
  const confidenceDelta = outcome === "confirmed"
    ? 0.18
    : outcome === "partially_confirmed"
      ? 0.06
      : contradictedSignals.length > 0
        ? -0.22
        : -0.14;
  const explanation = outcome === "confirmed"
    ? "The later compact observation matched the predicted move class and at least one actor, hazard, or blocked-move signal."
    : outcome === "partially_confirmed"
      ? "The later compact observation matched part of the constrained action-space signal set."
      : "The later compact observation did not match the predicted constrained move class or contradicted a blocked move.";

  return buildStagePlayPredictionValidationV1({
    validationId: `stage_play_prediction_validation:${hashShort([
      prediction.predictionId,
      observation.observationId,
      outcome,
      matchedSignals,
      contradictedSignals,
    ])}`,
    predictionId: prediction.predictionId,
    graphId: prediction.graphId,
    validationWindow: {
      fromTs: observation.sourceWindow.fromTs,
      toTs: observation.sourceWindow.toTs,
      evidenceRefs,
    },
    outcome,
    matchedSignals: unique(matchedSignals),
    contradictedSignals,
    confidenceDelta,
    explanation,
  });
}
