import crypto from "node:crypto";
import {
  STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA,
  STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
  type LiveSourceCausalTraceV1,
  type StagePlayLiveSourceImmersionStateV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourcePredictionValidationRecommendedNextV1,
  type StagePlayLiveSourcePredictionValidationV1,
  type StagePlayMicroReasonerRunV1,
  type StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import { compareMailToInterpreterProfile } from "./stage-play-live-source-interpreter-profile-comparison";
import { extractStagePlayLiveSourceDelta } from "./stage-play-live-source-delta-extractor";
import {
  getActiveStagePlayMicroReasonerPromptForRole,
  recordStagePlayMicroReasonerRun,
  recordStagePlayProcessedMailPacket,
} from "./stage-play-processed-mail-packet-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 260): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const tokenTags = (values: string[], terms: string[]): string[] => {
  const text = values.join("\n").toLowerCase();
  return uniqueStrings(terms.filter((term) => text.includes(term.toLowerCase())));
};

const sceneTagsFor = (facts: string[]): string[] =>
  tokenTags(facts, [
    "interior",
    "base",
    "outdoor",
    "forest",
    "cave",
    "mining",
    "inventory",
    "combat",
    "damage",
    "building",
    "crafting",
    "transition",
  ]);

const objectTagsFor = (mailItems: StagePlayLiveSourceMailItemV1[], facts: string[]): string[] =>
  tokenTags([
    ...mailItems.map((item) => item.summary.text || item.summary.preview),
    ...facts,
  ], [
    "player",
    "chest",
    "inventory",
    "crafting",
    "furnace",
    "torch",
    "sword",
    "pickaxe",
    "fire",
    "lava",
    "mob",
    "creeper",
    "zombie",
    "skeleton",
    "ore",
    "diamond",
    "tree",
  ]);

const recommendedNextFor = (input: {
  comparison?: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  validation: StagePlayLiveSourcePredictionValidationV1;
  immersionState: StagePlayLiveSourceImmersionStateV1;
}): StagePlayLiveSourcePredictionValidationRecommendedNextV1 => {
  if (input.comparison?.recommendedDecision === "request_voice_callout") return "request_voice_callout";
  if (input.comparison?.recommendedDecision === "request_more_evidence") return "request_more_evidence";
  if (input.comparison?.recommendedDecision === "request_stage_play_checkpoint") return "request_stage_play_checkpoint";
  if (
    input.immersionState.salience.voiceCandidate &&
    (input.immersionState.salience.level === "high" || input.immersionState.salience.level === "urgent")
  ) {
    return "request_voice_callout";
  }
  if (input.validation.recommendedNext !== "wait_for_next_summary") return input.validation.recommendedNext;
  if (input.comparison?.recommendedDecision === "record_interpretation") return "record_interpretation";
  if (input.comparison?.recommendedDecision === "draft_text_answer") return "draft_text_answer";
  return "wait_for_next_summary";
};

const makeRun = (input: {
  role: StagePlayMicroReasonerRunV1["role"];
  jobId: string;
  sourceId: string;
  mailIds: string[];
  inputRefs: string[];
  outputRefs: string[];
  inputPreview: string;
  outputPreview: string;
  now: string;
  causalTrace?: LiveSourceCausalTraceV1;
}): StagePlayMicroReasonerRunV1 => {
  const activePrompt = getActiveStagePlayMicroReasonerPromptForRole(input.role);
  return recordStagePlayMicroReasonerRun({
    artifactId: "stage_play_micro_reasoner_run",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA,
    runId: `stage_play_micro_reasoner_run:${hashShort([
      input.role,
      input.jobId,
      input.mailIds,
      input.outputRefs,
      input.now,
    ])}`,
    promptId: activePrompt?.promptId ?? null,
    role: input.role,
    jobId: input.jobId,
    sourceId: input.sourceId,
    mailIds: input.mailIds,
    inputRefs: uniqueStrings(input.inputRefs),
    outputRefs: uniqueStrings(input.outputRefs),
    inputPreview: clipText(input.inputPreview, 320),
    outputPreview: clipText(input.outputPreview, 320),
    status: "completed",
    modelUsed: "deterministic",
    latencyMs: 0,
    tokenEstimateIn: null,
    tokenEstimateOut: null,
    error: null,
    startedAt: input.now,
    completedAt: input.now,
    causalTrace: input.causalTrace,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
  });
};

export function buildStagePlayProcessedMailPacket(input: {
  jobId: string;
  sourceId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
  causalTrace?: LiveSourceCausalTraceV1;
  now?: string;
}): {
  packet: StagePlayProcessedMailPacketV1;
  comparison: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
} {
  const now = input.now ?? new Date().toISOString();
  const mailIds = input.mailItems.map((item) => item.mailId);
  const sourceId = input.sourceId || input.mailItems[0]?.sourceId || "unknown_source";
  const visualEvidenceRefs = uniqueStrings(input.mailItems.flatMap((item) => [
    item.sourceRefs.evidenceRef,
    item.sourceRefs.frameRef,
    ...item.evidenceRefs,
  ]));
  const delta = extractStagePlayLiveSourceDelta({
    latestMailItems: input.mailItems,
    priorImmersionState: input.priorImmersionState ?? null,
    activeProfile: input.activeProfile ?? null,
  });
  const comparison = input.activeProfile
    ? compareMailToInterpreterProfile({
        profile: input.activeProfile,
        mailItems: input.mailItems,
        jobId: input.jobId,
        policyId: input.immersionState.policyId ?? null,
        createdAt: now,
      })
    : null;
  const observedFacts = uniqueStrings([
    ...input.mailItems.map((item) => `${item.mailId}: ${clipText(item.summary.text || item.summary.preview, 240)}`),
    ...input.immersionState.currentSceneFacts,
  ]);
  const inferredFacts = uniqueStrings([
    ...input.immersionState.changedFacts.map((fact) => `Changed: ${fact}`),
    ...input.immersionState.salience.reasons.map((reason) => `Salience: ${reason}`),
    ...(comparison?.inferredMeaning ?? []),
  ]);
  const recommendedNext = recommendedNextFor({
    comparison,
    validation: input.predictionValidation,
    immersionState: input.immersionState,
  });
  const calloutDraft = recommendedNext === "request_voice_callout"
    ? input.immersionState.salience.reasons[0] ??
      comparison?.voiceCalloutMatches[0] ??
      "High-salience live-source update detected."
    : null;
  const microReasonerRuns = [
    makeRun({
      role: "claim_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: mailIds,
      outputRefs: observedFacts,
      inputPreview: input.mailItems.map((item) => item.summary.preview).join(" | "),
      outputPreview: observedFacts.slice(0, 4).join(" | "),
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "observation_classifier",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([...observedFacts, ...inferredFacts, ...input.immersionState.stableFacts]),
      outputRefs: uniqueStrings([
        ...input.immersionState.stableFacts,
        ...input.immersionState.changedFacts,
        ...input.immersionState.uncertainties,
      ]),
      inputPreview: `observed ${observedFacts.length}; inferred ${inferredFacts.length}; prior stable ${input.immersionState.stableFacts.length}`,
      outputPreview: `stable ${input.immersionState.stableFacts.slice(0, 2).join(" | ") || "none"}; changed ${input.immersionState.changedFacts.slice(0, 2).join(" | ") || "none"}`,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "delta_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.priorImmersionState?.immersionStateId, ...mailIds]),
      outputRefs: uniqueStrings([input.immersionState.immersionStateId, ...input.immersionState.changedFacts]),
      inputPreview: input.priorImmersionState?.immersionStateId ?? "no prior immersion state",
      outputPreview: input.immersionState.changedFacts.join(" | ") || "no changed facts",
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "prediction_validator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.priorImmersionState?.prediction?.predictionId, ...mailIds]),
      outputRefs: [input.predictionValidation.validationId],
      inputPreview: input.priorImmersionState?.prediction?.text ?? "no prior prediction",
      outputPreview: `${input.predictionValidation.result}; recommended ${input.predictionValidation.recommendedNext}`,
      now,
      causalTrace: input.causalTrace,
    }),
    ...(comparison ? [makeRun({
      role: "profile_comparator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([input.activeProfile?.profileId, ...mailIds]),
      outputRefs: [comparison.comparisonId],
      inputPreview: input.activeProfile?.title ?? "active profile",
      outputPreview: `matched ${comparison.matchedCriteria.length}; voice ${comparison.voiceCalloutMatches.length}; recommended ${comparison.recommendedDecision}`,
      now,
      causalTrace: input.causalTrace,
    })] : []),
    makeRun({
      role: "salience_scorer",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        ...input.immersionState.changedFacts,
        ...(comparison?.riskMatches ?? []),
        ...(comparison?.opportunityMatches ?? []),
        ...(comparison?.voiceCalloutMatches ?? []),
        input.predictionValidation.validationId,
      ]),
      outputRefs: uniqueStrings([
        input.immersionState.salience.level,
        ...input.immersionState.salience.reasons,
        recommendedNext,
        calloutDraft,
      ]),
      inputPreview: `changed ${input.immersionState.changedFacts.length}; risks ${comparison?.riskMatches.length ?? 0}; validation ${input.predictionValidation.result}`,
      outputPreview: `${input.immersionState.salience.level}; voice ${input.immersionState.salience.voiceCandidate ? "candidate" : "no"}; recommended ${recommendedNext}${calloutDraft ? `; ${calloutDraft}` : ""}`,
      now,
      causalTrace: input.causalTrace,
    }),
  ];
  const packetId = `stage_play_processed_mail_packet:${hashShort([
    input.jobId,
    sourceId,
    mailIds,
    input.immersionState.immersionStateId,
    input.predictionValidation.validationId,
    comparison?.comparisonId ?? null,
    now,
  ])}`;
  const packet = recordStagePlayProcessedMailPacket({
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: input.jobId,
    sourceId,
    mailIds,
    visualEvidenceRefs,
    observedFacts,
    inferredFacts,
    uncertainties: uniqueStrings(input.immersionState.uncertainties),
    stableFactsUsed: input.immersionState.stableFacts,
    changedFacts: input.immersionState.changedFacts,
    sceneTags: sceneTagsFor(input.immersionState.currentSceneFacts),
    activityTags: uniqueStrings([input.immersionState.currentActivity]),
    objectTags: objectTagsFor(input.mailItems, input.immersionState.currentSceneFacts),
    profileRef: input.activeProfile?.profileId ?? null,
    matchedCriteria: comparison?.matchedCriteria ?? [],
    suppressedCriteria: comparison?.suppressedCriteria ?? [],
    riskMatches: comparison?.riskMatches ?? [],
    opportunityMatches: comparison?.opportunityMatches ?? [],
    voiceCalloutMatches: comparison?.voiceCalloutMatches ?? [],
    priorPredictionRef: input.priorImmersionState?.prediction?.predictionId ?? null,
    predictionValidation: {
      result: input.predictionValidation.result,
      supportedSignals: input.predictionValidation.supportedSignals,
      contradictedSignals: input.predictionValidation.contradictedSignals,
      newSignals: input.predictionValidation.newSignals,
    },
    salience: {
      level: input.immersionState.salience.level,
      reasons: input.immersionState.salience.reasons,
      voiceCandidate: input.immersionState.salience.voiceCandidate,
      calloutDraft,
    },
    recommendedNext,
    watchNext: delta.watchTargets,
    resolutionState: recommendedNext === "request_voice_callout"
      ? "voice_candidate_prepared"
      : "processed_packet_ready",
    microReasonerRunRefs: microReasonerRuns.map((run) => run.runId),
    evidenceRefs: uniqueStrings([
      packetId,
      ...mailIds,
      ...visualEvidenceRefs,
      input.immersionState.immersionStateId,
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      input.activeProfile?.profileId,
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    causalTrace: input.causalTrace,
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
  });
  const composerRun = makeRun({
    role: "packet_composer",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: packet.evidenceRefs.filter((ref) => ref !== packet.packetId),
    outputRefs: [packet.packetId],
    inputPreview: microReasonerRuns.map((run) => run.outputPreview).join(" | "),
    outputPreview: `${packet.recommendedNext}; ${packet.salience.level}; ${packet.observedFacts.slice(0, 2).join(" | ")}`,
    now,
    causalTrace: input.causalTrace,
  });
  const finalPacket = recordStagePlayProcessedMailPacket({
    ...packet,
    microReasonerRunRefs: uniqueStrings([...packet.microReasonerRunRefs, composerRun.runId]),
    evidenceRefs: uniqueStrings([...packet.evidenceRefs, composerRun.runId]),
  });
  return {
    packet: finalPacket,
    comparison,
    microReasonerRuns: [...microReasonerRuns, composerRun],
  };
}
