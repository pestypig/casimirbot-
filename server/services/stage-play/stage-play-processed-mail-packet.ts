import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  STAGE_PLAY_MICRO_REASONER_RUN_SCHEMA,
  STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
  type LiveSourceCausalTraceV1,
  type StagePlayAxiomFrameV1,
  type StagePlayEffortEstimateV1,
  type StagePlayHypothesisArbiterV1,
  type StagePlayLiveSourceImmersionStateV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourcePredictionValidationRecommendedNextV1,
  type StagePlayLiveSourcePredictionValidationV1,
  type StagePlayMicroReasonerRunV1,
  type StagePlayProcessedMailPacketV1,
  type StagePlaySceneBeatHypothesisV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import { compareMailToInterpreterProfile } from "./stage-play-live-source-interpreter-profile-comparison";
import { extractStagePlayLiveSourceDelta } from "./stage-play-live-source-delta-extractor";
import {
  getActiveStagePlayMicroReasonerPromptForRole,
  getStagePlayMicroReasonerRun,
  getStagePlayProcessedMailPacket,
  recordStagePlayMicroReasonerRun,
  recordStagePlayProcessedMailPacket,
} from "./stage-play-processed-mail-packet-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export type StagePlayProcessedMailPacketTimingEntry = {
  stage: string;
  durationMs: number;
};

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

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const parseStructuredObserverOutput = (value: unknown): Record<string, unknown> | null => {
  const direct = readRecord(value);
  if (direct) return direct;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return readRecord(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
};

const readStructuredString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const readStructuredStringArray = (record: Record<string, unknown>, key: string): string[] => {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map((entry) => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") return JSON.stringify(entry);
    return String(entry ?? "");
  }));
};

const structuredObserverFactsFor = (input: {
  mailItems: StagePlayLiveSourceMailItemV1[];
}): {
  observedFacts: string[];
  inferredFacts: string[];
  changedFacts: string[];
  uncertainties: string[];
  sceneTags: string[];
  activityTags: string[];
  objectTags: string[];
  riskMatches: string[];
  opportunityMatches: string[];
  voiceCalloutMatches: string[];
  watchNext: string[];
} => {
  const records = input.mailItems
    .map((item) => ({
      mailId: item.mailId,
      record: parseStructuredObserverOutput(item.summary.text) ?? parseStructuredObserverOutput(item.summary.preview),
    }))
    .filter((entry): entry is { mailId: string; record: Record<string, unknown> } => Boolean(entry.record));
  const observedFacts: string[] = [];
  const inferredFacts: string[] = [];
  const changedFacts: string[] = [];
  const uncertainties: string[] = [];
  const sceneTags: string[] = [];
  const activityTags: string[] = [];
  const objectTags: string[] = [];
  const riskMatches: string[] = [];
  const opportunityMatches: string[] = [];
  const watchNext: string[] = [];

  for (const { mailId, record } of records) {
    for (const key of ["scene", "hud", "hotbar", "selected_item", "crosshair_target", "current_action"]) {
      const value = readStructuredString(record, key);
      if (value) observedFacts.push(`${mailId} ${key}: ${value}`);
    }
    for (const entity of readStructuredStringArray(record, "visible_entities")) {
      observedFacts.push(`${mailId} visible_entity: ${entity}`);
      objectTags.push(entity);
    }
    for (const change of readStructuredStringArray(record, "changed_since_last_frame")) {
      changedFacts.push(`${mailId}: ${change}`);
    }
    for (const risk of readStructuredStringArray(record, "risk_cues")) {
      riskMatches.push(risk);
    }
    for (const opportunity of readStructuredStringArray(record, "opportunity_cues")) {
      opportunityMatches.push(opportunity);
    }
    const prediction = readStructuredString(record, "next_10s_prediction");
    if (prediction) {
      inferredFacts.push(`${mailId} next_10s_prediction: ${prediction}`);
      watchNext.push(prediction);
    }
    const scene = readStructuredString(record, "scene");
    if (scene) sceneTags.push(...sceneTagsFor([scene]));
    const action = readStructuredString(record, "current_action");
    if (action) activityTags.push(action);
    for (const key of ["hud", "hotbar", "selected_item", "crosshair_target"]) {
      const value = readStructuredString(record, key);
      if (value && /\b(?:uncertain|not clear|unclear|not visible|unknown)\b/i.test(value)) {
        uncertainties.push(`${mailId} ${key}: ${value}`);
      }
    }
  }

  const voiceCalloutMatches = tokenTags(riskMatches, [
    "fire",
    "damage",
    "hostile",
    "mob",
    "creeper",
    "zombie",
    "skeleton",
    "lava",
    "low health",
    "danger",
  ]);
  return {
    observedFacts: uniqueStrings(observedFacts),
    inferredFacts: uniqueStrings(inferredFacts),
    changedFacts: uniqueStrings(changedFacts),
    uncertainties: uniqueStrings(uncertainties),
    sceneTags: uniqueStrings(sceneTags),
    activityTags: uniqueStrings(activityTags),
    objectTags: uniqueStrings(objectTags),
    riskMatches: uniqueStrings(riskMatches),
    opportunityMatches: uniqueStrings(opportunityMatches),
    voiceCalloutMatches,
    watchNext: uniqueStrings(watchNext),
  };
};

const recommendedNextFor = (input: {
  comparison?: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
  validation: StagePlayLiveSourcePredictionValidationV1;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  structuredRiskMatches?: string[];
  structuredVoiceCalloutMatches?: string[];
}): StagePlayLiveSourcePredictionValidationRecommendedNextV1 => {
  if (input.comparison?.recommendedDecision === "request_voice_callout") return "request_voice_callout";
  if (input.comparison?.recommendedDecision === "request_more_evidence") return "request_more_evidence";
  if (input.comparison?.recommendedDecision === "request_stage_play_checkpoint") return "request_stage_play_checkpoint";
  if ((input.structuredVoiceCalloutMatches?.length ?? 0) > 0) return "request_voice_callout";
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

const evidenceMatching = (values: string[], pattern: RegExp, limit = 4): string[] =>
  values.filter((value) => pattern.test(value)).slice(0, limit);

const estimateEffort = (input: {
  observedFacts: string[];
  inferredFacts: string[];
  changedFacts: string[];
  structured: ReturnType<typeof structuredObserverFactsFor>;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
}): StagePlayEffortEstimateV1 => {
  const facts = uniqueStrings([
    ...input.observedFacts,
    ...input.changedFacts,
    ...input.structured.riskMatches,
    ...input.structured.opportunityMatches,
    input.immersionState.currentActivity,
  ]);
  const text = facts.join("\n").toLowerCase();
  const matches = (pattern: RegExp) => evidenceMatching(facts, pattern);
  const effort =
    /\b(?:fire|damage|low health|hostile|mob|creeper|zombie|skeleton|combat|recover|retreat)\b/i.test(text)
      ? "combat_or_recovery"
      : /\b(?:cave|underground|mining|mine|dark|ore|lava)\b/i.test(text)
        ? "cave_exploration"
        : /\b(?:tree|forest|outdoor|surface|plains|sky|daylight|night)\b/i.test(text)
          ? "surface_exploration"
          : /\b(?:travel|navigation|route|moving|walking|bridge|path)\b/i.test(text)
            ? "travel_or_navigation"
            : /\b(?:chest|inventory|storage|sort|ui|menu)\b/i.test(text)
              ? "inventory_management"
              : /\b(?:craft|furnace|building|build|place block|workbench)\b/i.test(text)
          ? "building_or_crafting"
              : "unknown";
  const evidenceFor = matches(
    effort === "combat_or_recovery" ? /\b(?:fire|damage|low health|hostile|mob|creeper|zombie|skeleton|combat|recover|retreat)\b/i :
      effort === "inventory_management" ? /\b(?:chest|inventory|storage|sort|ui|menu)\b/i :
      effort === "building_or_crafting" ? /\b(?:craft|furnace|building|build|place block|workbench)\b/i :
      effort === "cave_exploration" ? /\b(?:cave|underground|mining|mine|dark|ore|lava)\b/i :
      effort === "surface_exploration" ? /\b(?:tree|forest|outdoor|surface|plains|sky|daylight|night)\b/i :
      /\b(?:travel|navigation|route|moving|walking|bridge|path)\b/i,
  );
  const nextLikelyEfforts = effort === "inventory_management"
    ? ["continue_inventory_management", "exit_to_explore", "craft_or_equip"]
    : effort === "cave_exploration"
      ? ["continue_cave_exploration", "place_torches_or_check_mobs", "mine_or_collect_resource"]
      : effort === "combat_or_recovery"
        ? ["recover_or_retreat", "continue_combat", "seek_safety"]
        : effort === "building_or_crafting"
          ? ["continue_building_or_crafting", "collect_missing_materials"]
          : effort === "surface_exploration"
            ? ["continue_surface_exploration", "return_to_base", "collect_surface_resources"]
            : ["continue_current_activity", "wait_for_clearer_evidence"];
  return {
    currentEffort: effort,
    evidenceFor: evidenceFor.length > 0 ? evidenceFor : facts.slice(0, 2),
    evidenceAgainst: input.structured.uncertainties.slice(0, 3),
    confidence: effort === "unknown" ? 0.38 : Math.min(0.86, 0.55 + evidenceFor.length * 0.08),
    nextLikelyEfforts,
  };
};

const extractAxioms = (input: {
  effort: StagePlayEffortEstimateV1;
  observedFacts: string[];
  structured: ReturnType<typeof structuredObserverFactsFor>;
  immersionState: StagePlayLiveSourceImmersionStateV1;
}): StagePlayAxiomFrameV1 => {
  const facts = uniqueStrings([
    ...input.observedFacts,
    ...input.immersionState.currentSceneFacts,
    ...input.structured.riskMatches,
    ...input.structured.opportunityMatches,
  ]);
  const text = facts.join("\n").toLowerCase();
  const axioms = uniqueStrings([
    input.effort.currentEffort !== "unknown" ? `current effort: ${input.effort.currentEffort}` : null,
    /\b(?:base|interior|chest)\b/i.test(text) ? "location/interface: base or inventory context visible" : null,
    /\b(?:cave|underground|dark|mining|lava)\b/i.test(text) ? "location: cave or underground exploration context" : null,
    /\b(?:outdoor|forest|surface|sky|tree)\b/i.test(text) ? "location: surface/outdoor context" : null,
    /\b(?:fire|damage|low health|lava|hostile|mob|creeper|zombie|skeleton)\b/i.test(text) ? "hazard: immediate risk cue present" : null,
    /\b(?:pickaxe|sword|torch|hotbar|selected_item|selected item)\b/i.test(text) ? "gear/interface: selected item or hotbar evidence present" : null,
    /\b(?:ore|diamond|resource)\b/i.test(text) ? "opportunity: resource cue present" : null,
  ]);
  const missingAxioms = uniqueStrings([
    /\b(?:health|hud)\b/i.test(text) && !/\b(?:uncertain|unknown|not visible)\b/i.test(text) ? null : "exact health/hunger state",
    /\b(?:armor)\b/i.test(text) ? null : "armor/protection state",
    /\b(?:torch|light|dark|night)\b/i.test(text) ? null : "lighting and safe-route margin",
    /\b(?:inventory|hotbar|selected_item|selected item|pickaxe|sword)\b/i.test(text) ? null : "full inventory/tool durability",
  ]);
  return {
    axioms: axioms.length > 0 ? axioms : ["current visible state is too sparse for strong action constraints"],
    missingAxioms,
    predictionRelevantVariables: uniqueStrings([
      "currentEffort",
      "location",
      "health/hunger",
      "selected item",
      "nearby hazards",
      "nearby opportunities",
      "next 10s scene transition",
    ]),
  };
};

const generateHypotheses = (input: {
  effort: StagePlayEffortEstimateV1;
  axioms: StagePlayAxiomFrameV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  structured: ReturnType<typeof structuredObserverFactsFor>;
}): StagePlaySceneBeatHypothesisV1[] => {
  const effort = input.effort.currentEffort;
  const base: StagePlaySceneBeatHypothesisV1[] =
    effort === "inventory_management"
      ? [
          {
            label: "continue_inventory_management",
            prediction: "Player remains in inventory/chest/base management for the next observation window.",
            confidence: 0.5,
            validationSignals: ["chest or inventory UI remains visible", "hotbar/inventory stays central"],
            whatWouldContradictIt: ["outdoor or cave movement replaces inventory UI"],
          },
          {
            label: "exit_to_explore",
            prediction: "Player leaves the base/interface context and resumes movement or exploration.",
            confidence: 0.32,
            validationSignals: ["door/outdoor/cave view appears", "movement action replaces inventory interaction"],
            whatWouldContradictIt: ["stable inventory or chest UI persists"],
          },
        ]
      : effort === "cave_exploration"
        ? [
            {
              label: "continue_cave_exploration",
              prediction: "Player continues through the cave while watching light, mobs, and terrain hazards.",
              confidence: 0.52,
              validationSignals: ["cave/underground view persists", "darkness, ore, lava, or mining cues remain"],
              whatWouldContradictIt: ["surface/base scene appears"],
            },
            {
              label: "resource_or_hazard_contact",
              prediction: "A resource or hazard becomes the next operational focus.",
              confidence: 0.38,
              validationSignals: ["ore, lava, mob, fire, or damage cue becomes prominent"],
              whatWouldContradictIt: ["routine safe traversal with no new cues"],
            },
          ]
        : effort === "combat_or_recovery"
          ? [
              {
                label: "recover_or_create_distance",
                prediction: "Player likely needs to recover, retreat, or create distance from the hazard.",
                confidence: 0.62,
                validationSignals: ["fire, damage, low health, hostile mob, or retreat movement continues"],
                whatWouldContradictIt: ["hazard disappears and health/risk indicators stabilize"],
              },
              {
                label: "continue_engagement",
                prediction: "Player may continue combat or hazard navigation if tool/weapon control is maintained.",
                confidence: 0.28,
                validationSignals: ["weapon selected", "hostile entity remains visible", "forward movement continues"],
                whatWouldContradictIt: ["pause, retreat, shelter, or inventory recovery action appears"],
              },
            ]
          : [
              {
                label: "continue_current_activity",
                prediction: "Player continues the current visible effort unless a new scene transition appears.",
                confidence: 0.44,
                validationSignals: input.effort.nextLikelyEfforts.slice(0, 3),
                whatWouldContradictIt: ["clear scene transition", "new hazard", "new UI or route state"],
              },
              {
                label: "state_shift_pending",
                prediction: "The next frame may clarify whether the player is changing goals.",
                confidence: 0.32,
                validationSignals: ["new changed_since_last_frame cue", "new selected item or location"],
                whatWouldContradictIt: ["same scene and same activity repeat"],
              },
            ];
  const validationHypothesis = input.predictionValidation.result !== "no_prior_prediction"
    ? [{
        label: `prior_prediction_${input.predictionValidation.result}`,
        prediction: `Prior prediction is ${input.predictionValidation.result}; watch validation signals before changing the objective.`,
        confidence: input.predictionValidation.result === "supported" ? 0.56 : 0.42,
        validationSignals: uniqueStrings([
          ...input.predictionValidation.supportedSignals,
          ...input.predictionValidation.newSignals,
        ]).slice(0, 5),
        whatWouldContradictIt: input.predictionValidation.contradictedSignals.slice(0, 5),
      }]
    : [];
  return [...base, ...validationHypothesis].slice(0, 4);
};

const arbitrateHypotheses = (input: {
  baselineRecommendedNext: StagePlayLiveSourcePredictionValidationRecommendedNextV1;
  effort: StagePlayEffortEstimateV1;
  axioms: StagePlayAxiomFrameV1;
  hypotheses: StagePlaySceneBeatHypothesisV1[];
  validation: StagePlayLiveSourcePredictionValidationV1;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  calloutDraft: string | null;
  comparison?: StagePlayLiveSourceInterpreterProfileComparisonV1 | null;
}): StagePlayHypothesisArbiterV1 => {
  const urgentVoice =
    input.baselineRecommendedNext === "request_voice_callout" ||
    (
      input.immersionState.salience.voiceCandidate &&
      (input.immersionState.salience.level === "high" || input.immersionState.salience.level === "urgent")
    );
  const recommendation: StagePlayLiveSourcePredictionValidationRecommendedNextV1 = urgentVoice
    ? "request_voice_callout"
    : input.validation.result === "contradicted" || input.validation.result === "partially_supported"
      ? "record_interpretation"
      : input.baselineRecommendedNext;
  const missingEvidence = uniqueStrings([
    ...input.axioms.missingAxioms.slice(0, 4),
    input.comparison ? null : "active_interpreter_profile_comparison",
    input.validation.result === "no_prior_prediction" ? "prior_prediction_for_validation" : null,
  ]);
  const selectedHypothesis = input.hypotheses
    .slice()
    .sort((left, right) => right.confidence - left.confidence)[0]?.label ?? null;
  const reason = urgentVoice
    ? "urgent/high-salience risk or voice policy match requires a decision receipt before any voice tool"
    : recommendation === "wait_for_next_summary"
      ? `routine ${input.effort.currentEffort} evidence does not justify waking Ask`
      : input.validation.result === "contradicted" || input.validation.result === "partially_supported"
        ? `prediction ${input.validation.result}; record interpretation to update the continuing effort`
        : `${input.effort.currentEffort} evidence supports ${recommendation}`;
  const wakeAsk =
    urgentVoice ||
    recommendation === "request_more_evidence" ||
    recommendation === "request_stage_play_checkpoint" ||
    recommendation === "draft_text_answer";
  return {
    recommendedNext: recommendation,
    wakeAsk,
    reason,
    confidence: urgentVoice || missingEvidence.length === 0 ? "high" : missingEvidence.length <= 2 ? "medium" : "low",
    selectedHypothesis,
    voiceCandidate: urgentVoice,
    calloutDraft: urgentVoice ? input.calloutDraft : null,
    missingEvidence,
  };
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
  selectedDecision?: StagePlayMicroReasonerRunV1["selectedDecision"];
  salienceLevel?: StagePlayMicroReasonerRunV1["salienceLevel"];
  voiceCandidate?: StagePlayMicroReasonerRunV1["voiceCandidate"];
  recommendedNextTool?: string | null;
  confidence?: StagePlayMicroReasonerRunV1["confidence"];
  latencyBudgetMs?: number | null;
  tokenBudget?: number | null;
  missingEvidence?: string[];
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
    reasoningMode: "micro_live_interval",
    selectedDecision: input.selectedDecision ?? null,
    salienceLevel: input.salienceLevel ?? null,
    voiceCandidate: input.voiceCandidate ?? null,
    recommendedNextTool: input.recommendedNextTool ?? null,
    confidence: input.confidence ?? null,
    latencyBudgetMs: input.latencyBudgetMs ?? 250,
    tokenBudget: input.tokenBudget ?? null,
    missingEvidence: uniqueStrings(input.missingEvidence ?? []),
    modelUsed: "deterministic",
    latencyMs: 0,
    tokenEstimateIn: input.tokenBudget ?? null,
    tokenEstimateOut: null,
    error: null,
    startedAt: input.now,
    completedAt: input.now,
    causalTrace: input.causalTrace,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
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
  timing: StagePlayProcessedMailPacketTimingEntry[];
} {
  const now = input.now ?? new Date().toISOString();
  const timing: StagePlayProcessedMailPacketTimingEntry[] = [];
  const timed = <T>(stage: string, fn: () => T): T => {
    const start = performance.now();
    try {
      return fn();
    } finally {
      timing.push({
        stage,
        durationMs: performance.now() - start,
      });
    }
  };
  const mailIds = input.mailItems.map((item) => item.mailId);
  const sourceId = input.sourceId || input.mailItems[0]?.sourceId || "unknown_source";
  const packetId = `stage_play_processed_mail_packet:${hashShort([
    input.jobId,
    sourceId,
    mailIds,
    input.activeProfile?.profileId ?? null,
    input.activeProfile?.updatedAt ?? null,
  ])}`;
  const existingPacket = getStagePlayProcessedMailPacket(packetId);
  if (existingPacket) {
    return {
      packet: existingPacket,
      comparison: null,
      microReasonerRuns: existingPacket.microReasonerRunRefs
        .map((runId) => getStagePlayMicroReasonerRun(runId))
        .filter((run): run is StagePlayMicroReasonerRunV1 => Boolean(run)),
      timing: [{
        stage: "processed_packet_reused",
        durationMs: 0,
      }],
    };
  }
  const visualEvidenceRefs = uniqueStrings(input.mailItems.flatMap((item) => [
    item.sourceRefs.evidenceRef,
    item.sourceRefs.frameRef,
    ...item.evidenceRefs,
  ]));
  const delta = timed("delta_extractor", () => extractStagePlayLiveSourceDelta({
    latestMailItems: input.mailItems,
    priorImmersionState: input.priorImmersionState ?? null,
    activeProfile: input.activeProfile ?? null,
  }));
  const comparison = timed("profile_comparator", () => input.activeProfile
    ? compareMailToInterpreterProfile({
        profile: input.activeProfile,
        mailItems: input.mailItems,
        jobId: input.jobId,
        policyId: input.immersionState.policyId ?? null,
        createdAt: now,
      })
    : null);
  const structured = timed("structured_observer_parser", () => structuredObserverFactsFor({ mailItems: input.mailItems }));
  const observedFacts = timed("observed_fact_assembly", () => uniqueStrings([
    ...structured.observedFacts,
    ...input.mailItems.map((item) => `${item.mailId}: ${clipText(item.summary.text || item.summary.preview, 240)}`),
    ...input.immersionState.currentSceneFacts,
  ]));
  const inferredFacts = timed("inferred_fact_assembly", () => uniqueStrings([
    ...structured.inferredFacts,
    ...input.immersionState.changedFacts.map((fact) => `Changed: ${fact}`),
    ...input.immersionState.salience.reasons.map((reason) => `Salience: ${reason}`),
    ...(comparison?.inferredMeaning ?? []),
  ]));
  const baselineRecommendedNext = timed("baseline_decision_selector", () => recommendedNextFor({
    comparison,
    validation: input.predictionValidation,
    immersionState: input.immersionState,
    structuredRiskMatches: structured.riskMatches,
    structuredVoiceCalloutMatches: structured.voiceCalloutMatches,
  }));
  const calloutDraft = baselineRecommendedNext === "request_voice_callout"
    ? input.immersionState.salience.reasons[0] ??
      structured.voiceCalloutMatches[0] ??
      structured.riskMatches[0] ??
      comparison?.voiceCalloutMatches[0] ??
      "High-salience live-source update detected."
    : null;
  const effortEstimate = timed("effort_estimator", () => estimateEffort({
    observedFacts,
    inferredFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    structured,
    immersionState: input.immersionState,
    priorImmersionState: input.priorImmersionState ?? null,
  }));
  const axioms = timed("axiom_extractor", () => extractAxioms({
    effort: effortEstimate,
    observedFacts,
    structured,
    immersionState: input.immersionState,
  }));
  const hypotheses = timed("hypothesis_generator", () => generateHypotheses({
    effort: effortEstimate,
    axioms,
    predictionValidation: input.predictionValidation,
    structured,
  }));
  const arbiter = timed("hypothesis_arbiter", () => arbitrateHypotheses({
    baselineRecommendedNext,
    effort: effortEstimate,
    axioms,
    hypotheses,
    validation: input.predictionValidation,
    immersionState: input.immersionState,
    calloutDraft,
    comparison,
  }));
  const recommendedNext = arbiter.recommendedNext;
  const microReasonerRuns = timed("micro_reasoner_run_composition", () => [
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
        ...structured.changedFacts,
        ...structured.uncertainties,
      ]),
      inputPreview: `observed ${observedFacts.length}; inferred ${inferredFacts.length}; prior stable ${input.immersionState.stableFacts.length}`,
      outputPreview: `stable ${input.immersionState.stableFacts.slice(0, 2).join(" | ") || "none"}; changed ${uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]).slice(0, 2).join(" | ") || "none"}`,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "effort_estimator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([...observedFacts, ...inferredFacts, ...structured.changedFacts]),
      outputRefs: uniqueStrings([
        effortEstimate.currentEffort,
        ...effortEstimate.evidenceFor,
        ...effortEstimate.nextLikelyEfforts,
      ]),
      inputPreview: `observed ${observedFacts.length}; changed ${structured.changedFacts.length}; activity ${input.immersionState.currentActivity || "unknown"}`,
      outputPreview: `${effortEstimate.currentEffort}; confidence ${effortEstimate.confidence.toFixed(2)}; next ${effortEstimate.nextLikelyEfforts.slice(0, 3).join(" | ")}`,
      salienceLevel: input.immersionState.salience.level,
      confidence: effortEstimate.confidence >= 0.7 ? "high" : effortEstimate.confidence >= 0.5 ? "medium" : "low",
      latencyBudgetMs: 120,
      tokenBudget: 120,
      missingEvidence: effortEstimate.evidenceAgainst,
      now,
      causalTrace: input.causalTrace,
    }),
    makeRun({
      role: "axiom_extractor",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([effortEstimate.currentEffort, ...observedFacts, ...input.immersionState.currentSceneFacts]),
      outputRefs: uniqueStrings([...axioms.axioms, ...axioms.predictionRelevantVariables]),
      inputPreview: `${effortEstimate.currentEffort}; observed ${observedFacts.length}; profile ${input.activeProfile?.profileId ?? "none"}`,
      outputPreview: `${axioms.axioms.slice(0, 3).join(" | ") || "no strong axioms"}; missing ${axioms.missingAxioms.slice(0, 3).join(" | ") || "none"}`,
      confidence: axioms.missingAxioms.length <= 2 ? "high" : "medium",
      latencyBudgetMs: 120,
      tokenBudget: 140,
      missingEvidence: axioms.missingAxioms,
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
    makeRun({
      role: "hypothesis_generator",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        effortEstimate.currentEffort,
        ...axioms.axioms,
        input.predictionValidation.validationId,
        input.priorImmersionState?.prediction?.predictionId,
      ]),
      outputRefs: hypotheses.map((hypothesis) => hypothesis.label),
      inputPreview: `${effortEstimate.currentEffort}; axioms ${axioms.axioms.length}; validation ${input.predictionValidation.result}`,
      outputPreview: hypotheses.map((hypothesis) => `${hypothesis.label}:${hypothesis.confidence.toFixed(2)}`).join(" | "),
      confidence: hypotheses.length >= 2 ? "medium" : "low",
      latencyBudgetMs: 140,
      tokenBudget: 180,
      missingEvidence: hypotheses.length >= 2 ? [] : ["multiple_scene_beat_hypotheses"],
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
        ...structured.changedFacts,
        ...structured.riskMatches,
        ...structured.opportunityMatches,
        ...structured.voiceCalloutMatches,
        ...(comparison?.riskMatches ?? []),
        ...(comparison?.opportunityMatches ?? []),
        ...(comparison?.voiceCalloutMatches ?? []),
        input.predictionValidation.validationId,
      ]),
      outputRefs: uniqueStrings([
        input.immersionState.salience.level,
        ...input.immersionState.salience.reasons,
        ...structured.riskMatches,
        ...structured.voiceCalloutMatches,
        baselineRecommendedNext,
        calloutDraft,
      ]),
      inputPreview: `changed ${uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]).length}; risks ${uniqueStrings([...(comparison?.riskMatches ?? []), ...structured.riskMatches]).length}; validation ${input.predictionValidation.result}`,
      outputPreview: `${input.immersionState.salience.level}; voice ${input.immersionState.salience.voiceCandidate ? "candidate" : "no"}; recommended ${baselineRecommendedNext}${calloutDraft ? `; ${calloutDraft}` : ""}`,
      now,
      causalTrace: input.causalTrace,
    }),
  ]);
  const arbiterRun = makeRun({
    role: "hypothesis_arbiter",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: uniqueStrings([
      baselineRecommendedNext,
      effortEstimate.currentEffort,
      ...axioms.axioms,
      ...hypotheses.map((hypothesis) => hypothesis.label),
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    outputRefs: uniqueStrings([
      arbiter.recommendedNext,
      arbiter.wakeAsk ? "wake_ask" : "local_wait",
      arbiter.selectedHypothesis,
      arbiter.voiceCandidate ? "voice_candidate" : "no_voice_candidate",
      ...arbiter.missingEvidence,
    ]),
    inputPreview: `baseline ${baselineRecommendedNext}; effort ${effortEstimate.currentEffort}; hypotheses ${hypotheses.length}; salience ${input.immersionState.salience.level}`,
    outputPreview: `${arbiter.recommendedNext}; wake ${arbiter.wakeAsk ? "yes" : "no"}; ${arbiter.reason}`,
    selectedDecision: arbiter.recommendedNext,
    salienceLevel: input.immersionState.salience.level,
    voiceCandidate: arbiter.voiceCandidate,
    recommendedNextTool: arbiter.wakeAsk ? "live_env.record_live_source_mail_decision" : null,
    confidence: arbiter.confidence,
    latencyBudgetMs: 150,
    tokenBudget: 160,
    missingEvidence: arbiter.missingEvidence,
    now,
    causalTrace: input.causalTrace,
  });
  microReasonerRuns.push(arbiterRun);
  const decisionSelectorMissingEvidence = uniqueStrings([
    ...arbiter.missingEvidence,
    visualEvidenceRefs.length === 0 ? "visual_evidence_ref" : null,
  ]);
  const decisionSelectorRun = makeRun({
    role: "decision_selector",
    jobId: input.jobId,
    sourceId,
    mailIds,
    inputRefs: uniqueStrings([
      recommendedNext,
      input.immersionState.salience.level,
      input.predictionValidation.validationId,
      comparison?.comparisonId,
      arbiterRun.runId,
      ...visualEvidenceRefs,
      ...microReasonerRuns.map((run) => run.runId),
    ]),
    outputRefs: uniqueStrings([
      recommendedNext,
      recommendedNext === "wait_for_next_summary" ? "no_operator_action_required" : "decision_receipt_required",
      recommendedNext === "request_voice_callout" ? "voice_decision_before_voice_tool" : null,
      ...decisionSelectorMissingEvidence,
    ]),
    inputPreview: `packet candidate: ${recommendedNext}; salience ${input.immersionState.salience.level}; voice ${input.immersionState.salience.voiceCandidate ? "candidate" : "no"}`,
    outputPreview: `${recommendedNext}; next tool ${recommendedNext === "wait_for_next_summary" ? "none" : "live_env.record_live_source_mail_decision"}; confidence ${
      arbiter.confidence
    }`,
    selectedDecision: recommendedNext,
    salienceLevel: input.immersionState.salience.level,
    voiceCandidate: input.immersionState.salience.voiceCandidate || recommendedNext === "request_voice_callout",
    recommendedNextTool: recommendedNext === "wait_for_next_summary"
      ? null
      : "live_env.record_live_source_mail_decision",
    confidence: decisionSelectorMissingEvidence.length > 0 ? "medium" : "high",
    latencyBudgetMs: 150,
    tokenBudget: 160,
    missingEvidence: decisionSelectorMissingEvidence,
    now,
    causalTrace: input.causalTrace,
  });
  microReasonerRuns.push(decisionSelectorRun);
  if (recommendedNext === "request_voice_callout") {
    microReasonerRuns.push(makeRun({
      role: "voice_callout_drafter",
      jobId: input.jobId,
      sourceId,
      mailIds,
      inputRefs: uniqueStrings([
        decisionSelectorRun.runId,
        ...input.immersionState.salience.reasons,
        ...structured.voiceCalloutMatches,
        ...(comparison?.voiceCalloutMatches ?? []),
      ]),
      outputRefs: uniqueStrings([
        calloutDraft,
        ...input.immersionState.salience.reasons,
        ...structured.voiceCalloutMatches,
        ...(comparison?.voiceCalloutMatches ?? []),
      ]),
      inputPreview: `voice candidate: ${input.immersionState.salience.level}; ${input.immersionState.salience.reasons.slice(0, 2).join(" | ") || "no salience reason"}`,
      outputPreview: calloutDraft ?? "voice callout draft unavailable",
      selectedDecision: recommendedNext,
      salienceLevel: input.immersionState.salience.level,
      voiceCandidate: true,
      recommendedNextTool: "live_env.request_interim_voice_callout",
      confidence: calloutDraft ? "high" : "low",
      latencyBudgetMs: 150,
      tokenBudget: 120,
      missingEvidence: calloutDraft ? [] : ["voice_callout_draft"],
      now,
      causalTrace: input.causalTrace,
    }));
  }
  const packet = timed("processed_packet_record", () => recordStagePlayProcessedMailPacket({
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: input.jobId,
    sourceId,
    mailIds,
    visualEvidenceRefs,
    observedFacts,
    inferredFacts,
    uncertainties: uniqueStrings([...input.immersionState.uncertainties, ...structured.uncertainties]),
    stableFactsUsed: input.immersionState.stableFacts,
    changedFacts: uniqueStrings([...input.immersionState.changedFacts, ...structured.changedFacts]),
    sceneTags: uniqueStrings([...sceneTagsFor(input.immersionState.currentSceneFacts), ...structured.sceneTags]),
    activityTags: uniqueStrings([input.immersionState.currentActivity, ...structured.activityTags]),
    objectTags: uniqueStrings([...objectTagsFor(input.mailItems, input.immersionState.currentSceneFacts), ...structured.objectTags]),
    profileRef: input.activeProfile?.profileId ?? null,
    matchedCriteria: comparison?.matchedCriteria ?? [],
    suppressedCriteria: comparison?.suppressedCriteria ?? [],
    riskMatches: uniqueStrings([...(comparison?.riskMatches ?? []), ...structured.riskMatches]),
    opportunityMatches: uniqueStrings([...(comparison?.opportunityMatches ?? []), ...structured.opportunityMatches]),
    voiceCalloutMatches: uniqueStrings([...(comparison?.voiceCalloutMatches ?? []), ...structured.voiceCalloutMatches]),
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
    effortEstimate,
    axioms,
    hypotheses,
    arbiter,
    recommendedNext,
    watchNext: uniqueStrings([...delta.watchTargets, ...structured.watchNext]),
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
  }));
  const composerRun = timed("packet_composer", () => makeRun({
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
  }));
  const finalPacket = timed("final_packet_record", () => recordStagePlayProcessedMailPacket({
    ...packet,
    microReasonerRunRefs: uniqueStrings([...packet.microReasonerRunRefs, composerRun.runId]),
    evidenceRefs: uniqueStrings([...packet.evidenceRefs, composerRun.runId]),
  }));
  return {
    packet: finalPacket,
    comparison,
    microReasonerRuns: [...microReasonerRuns, composerRun],
    timing,
  };
}
