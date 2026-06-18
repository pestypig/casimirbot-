import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  type HelixLiveEnvironmentToolName,
  type HelixLiveEnvironmentToolObservation,
} from "@shared/helix-live-agent-step";
import {
  validateStagePlayBadgeGraphV1,
  type StagePlayBadgeGraphV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import {
  buildStagePlayCheckpointRequestResultV1,
  type StagePlayCheckpointRequestResultReasonV1,
} from "@shared/contracts/stage-play-checkpoint-request-result.v1";
import type { StagePlayCheckpointRequestReasonV1 } from "@shared/contracts/stage-play-checkpoint-request.v1";
import type { HelixInterpretedEventKind } from "@shared/helix-interpreted-event-log";
import type {
  AskTurnTranscriptRowDraftV1,
  StagePlayLiveSourceImmersionStateV1,
  StagePlayLiveSourceMailInterpretationPayloadV1,
  StagePlayLiveSourceMailItemV1,
  StagePlayMicroReasonerPromptDelegationCandidateV1,
  StagePlayMicroReasonerPromptDelegationResultV1,
  StagePlayMicroReasonerPromptPresetDraftV1,
  StagePlayMicroReasonerPromptPresetV1,
  StagePlayMicroReasonerWakePromptContractV1,
  StagePlayMicroReasonerRoleV1,
  StagePlayMicroReasonerRunV1,
  StagePlayLiveSourceMailLoopReflectionV1,
  StagePlayProcessedMailPacketV1,
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_LOOP_REFLECTION_SCHEMA,
  STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  buildStagePlayLiveSourceInterpreterProfileV1,
  type StagePlayLiveSourceInterpreterProfileDomainV1,
  type StagePlayLiveSourceInterpreterProfileTextStyleV1,
  type StagePlayLiveSourceInterpreterProfileV1,
  type StagePlayLiveSourceInterpreterProfileVoiceStyleV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import type {
  HelixLiveEnvironmentCommentaryKind,
  HelixLiveEnvironmentCommentaryStatus,
  HelixLiveEnvironmentCommentarySubject,
} from "@shared/helix-live-environment-commentary";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
  WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA,
  normalizeAgentGoalActuatorV1,
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
  type AgentGoalSessionV1,
  type GoalContextProducerKindV1,
  type GoalContextUpdateKindV1,
  type WorkstationDispatchActionV1,
  type WorkstationGoalContextUpdateV1,
} from "@shared/contracts/workstation-goal-context.v1";
import {
  getActiveLiveAnswerEnvironmentForSource,
  getActiveLiveAnswerEnvironmentForThread,
  getLiveAnswerEnvironment,
} from "../situation-room/live-answer-environment-store";
import { queryEventWindow } from "../situation-room/event-window-query";
import { appendInterpretedEvent, listInterpretedEvents } from "../situation-room/interpreted-event-log-store";
import {
  listLiveEnvironmentCommentary,
  recordLiveEnvironmentCommentary,
} from "../situation-room/live-environment-commentary-store";
import { queryMinecraftNavigationState } from "../situation-room/minecraft-navigation-state-store";
import { buildStagePlayGraphFromWorld as buildStagePlayBadgeGraphFromLiveWindow } from "../stage-play/stage-play-badge-graph-builder";
import {
  buildStagePlayLiveAnswerLineValuesV1,
  buildStagePlayOutputLaneProjectionV1,
  checkpointOnlySkippedLineKeysForStagePlayProjection,
  reduceLiveAnswerEnvironmentFromStagePlayGraph,
} from "../stage-play/stage-play-output-lane-reducer";
import { ensureStagePlayLiveAnswerEnvironment } from "../stage-play/stage-play-live-answer-projector";
import {
  buildStagePlayBuilderCatalog,
  buildStagePlaySourceQuery,
  sourceIdsFromStagePlayDraft,
  validateStagePlayBuilderDraft,
} from "../stage-play/stage-play-builder-compiler";
import { planStagePlayJob } from "../stage-play/stage-play-job-planner";
import {
  applyStagePlayCheckpointQueueAction,
  enqueueStagePlayCheckpointRequestFromGraph,
  getStagePlayCheckpointQueue,
} from "../stage-play/stage-play-checkpoint-queue";
import {
  buildMailLoopTranscriptRows,
  readLiveSourceMailForAsk,
  recordLiveSourceMailDecisionForAsk,
} from "../stage-play/stage-play-visual-summary-mail-ingest";
import {
  configureStagePlayLiveSourceWatchJobPolicy,
  getLatestStagePlayLiveSourceImmersionState,
  getStagePlayLiveSourceImmersionState,
  getStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceWatchJobPolicies,
  listUnreadStagePlayLiveSourceMailItems,
  recordStagePlayLiveSourceImmersionState,
} from "../stage-play/stage-play-live-source-mailbox-store";
import {
  getLatestStagePlayLiveSourceNarrativeState,
  getStagePlayLiveSourceNarrativeState,
  recordStagePlayLiveSourceNarrativeState,
} from "../stage-play/stage-play-live-source-narrative-store";
import {
  getActiveInterpreterProfileForJob,
  getStagePlayLiveSourceInterpreterProfile,
  listStagePlayLiveSourceInterpreterProfiles,
  recordStagePlayLiveSourceInterpreterProfile,
  setInterpreterProfileStatus,
} from "../stage-play/stage-play-live-source-interpreter-profile-store";
import {
  compareMailToInterpreterProfile,
} from "../stage-play/stage-play-live-source-interpreter-profile-comparison";
import {
  compileInterpreterProfileFromNote,
  createInterpreterProfileNote,
  openInterpreterProfileNote,
} from "../stage-play/stage-play-live-source-interpreter-profile-notes";
import {
  buildStagePlayLiveSourceWatchJobPolicyDefaults,
  inferStagePlayLiveSourceInterpretationMode,
} from "../stage-play/stage-play-live-source-watch-policy-defaults";
import {
  queryStagePlayLiveSourceQuality,
  summarizeStagePlayLiveSourceCurrentState,
} from "../stage-play/stage-play-live-source-current-state";
import {
  requestVisualFrameActionReplay,
} from "../situation-room/visual-frame-action-replay-store";
import {
  extractStagePlayLiveSourceDelta,
} from "../stage-play/stage-play-live-source-delta-extractor";
import {
  validateStagePlayLiveSourcePredictionFromMail,
} from "../stage-play/stage-play-live-source-prediction-validator";
import {
  buildStagePlayProcessedMailPacket,
} from "../stage-play/stage-play-processed-mail-packet";
import {
  applyStagePlayMicroReasonerPromptPreset,
  ensureDefaultStagePlayMicroReasonerPromptPresets,
  getActiveStagePlayMicroReasonerPromptForRole,
  getActiveStagePlayMicroReasonerPromptPresetForSource,
  listStagePlayActiveMicroReasonerPromptsForSource,
  listStagePlayMicroReasonerPromptPresets,
  listStagePlayMicroReasonerPrompts,
  listStagePlayMicroReasonerPromptToolActivities,
  listStagePlayMicroReasonerRuns,
  listStagePlayProcessedMailPackets,
  recordStagePlayPromptDelegationRouterPreset,
  recordStagePlayCustomMicroReasonerPromptPreset,
  recordStagePlayMicroReasonerPrompt,
  recordStagePlayMicroReasonerPromptToolActivity,
} from "../stage-play/stage-play-processed-mail-packet-store";
import {
  applyStagePlayVisualObserverProfile,
  ensureDefaultStagePlayVisualObserverProfiles,
  getActiveStagePlayVisualObserverProfileForSource,
  getStagePlayVisualObserverProfile,
  listStagePlayVisualObserverProfiles,
  recordStagePlayVisualObserverProfile,
} from "../stage-play/stage-play-visual-observer-profile-store";
import {
  listStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeResults,
} from "../stage-play/stage-play-live-source-mail-wake-store";
import {
  ensureStagePlayAgentGoalSession,
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
  recordStagePlayGoalContextUpdate,
  syncStagePlayGoalContextFromMailbox,
} from "../stage-play/stage-play-goal-context-store";
import {
  recordInterimVoiceCalloutRequest,
} from "./interim-voice-callout-store";
import {
  getWorkstationReasoningTrace,
  listWorkstationReasoningTraces,
} from "./workstation-reasoning-trace-store";
import { mergeLiveSourceCausalTraces } from "../stage-play/stage-play-live-source-causal-trace";
import {
  recordVoiceSteeringEvent,
} from "./voice-steering-event-store";
import type {
  HelixVoiceSteeringDecisionV1,
  HelixVoiceSteeringEventV1,
} from "@shared/contracts/helix-voice-steering-event.v1";
import {
  resolveStagePlayLiveSourceMailboxThreadId,
} from "../stage-play/stage-play-live-source-mailbox-thread-resolver";
import { readSituationSourceCapabilities } from "../situation-room/situation-source-capability-store";
import {
  ensureLiveSituationRunForEnvironment,
} from "../situation-room/live-situation-run-store";
import { registerFieldWorkersForSituationRun } from "../situation-room/live-field-worker-registry";
import { listSituationConstructs } from "../situation-room/situation-construct-store";
import { queryLiveAnswersEvidence } from "../live-answers/live-answers-evidence-index";

type ExecuteLiveEnvironmentToolInput = {
  tool_name: HelixLiveEnvironmentToolName;
  args?: Record<string, unknown> | null;
  thread_id: string;
  environment_id?: string | null;
};

type StagePlayLiveAnswerProjectionReason =
  | "projected"
  | "no_active_environment"
  | "line_schema_mismatch"
  | "no_line_changes"
  | "graph_invalid"
  | "environment_not_active";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry))))
    : [];

const STAGE_PLAY_MICRO_REASONER_ROLES: StagePlayMicroReasonerRoleV1[] = [
  "claim_extractor",
  "observation_classifier",
  "effort_estimator",
  "axiom_extractor",
  "hypothesis_generator",
  "profile_comparator",
  "delta_extractor",
  "prediction_validator",
  "salience_scorer",
  "hypothesis_arbiter",
  "prompt_router",
  "packet_composer",
  "decision_selector",
  "voice_callout_drafter",
];

const readMicroReasonerRole = (value: unknown): StagePlayMicroReasonerRoleV1 | null => {
  const role = readString(value);
  return role && STAGE_PLAY_MICRO_REASONER_ROLES.includes(role as StagePlayMicroReasonerRoleV1)
    ? role as StagePlayMicroReasonerRoleV1
    : null;
};

const readMicroReasonerRoles = (value: unknown): StagePlayMicroReasonerRoleV1[] =>
  readStringArray(value).filter((role): role is StagePlayMicroReasonerRoleV1 =>
    STAGE_PLAY_MICRO_REASONER_ROLES.includes(role as StagePlayMicroReasonerRoleV1)
  );

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

type LiveSourceToolArtifactRefs = {
  processedPacketIds?: string[];
  decisionIds?: string[];
  voiceReceiptIds?: string[];
  wakeRequestId?: string | null;
  askTurnId?: string | null;
};

const readRouteMetadataRecord = (args: Record<string, unknown>): Record<string, unknown> | null =>
  readRecord(args.route_metadata) ?? readRecord(args.routeMetadata);

const liveSourceWakeRequestIdFromArgs = (args: Record<string, unknown>): string | null => {
  const routeMetadata = readRouteMetadataRecord(args);
  return (
    readString(args.wake_request_id) ??
    readString(args.wakeRequestId) ??
    readString(routeMetadata?.wakeRequestId) ??
    readString(routeMetadata?.wake_request_id)
  );
};

const liveSourceAskTurnIdFromArgs = (args: Record<string, unknown>): string | null => {
  const routeMetadata = readRouteMetadataRecord(args);
  return (
    readString(args.ask_turn_id) ??
    readString(args.askTurnId) ??
    readString(routeMetadata?.askTurnId) ??
    readString(routeMetadata?.ask_turn_id)
  );
};

const readRequestedTool = (
  value: unknown,
): Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["requestedTool"] | null => {
  const record = readRecord(value);
  const toolName = readString(record?.tool_name) ?? readString(record?.toolName);
  if (!record || !toolName) return null;
  return {
    toolName,
    args: readRecord(record.args) ?? {},
  };
};

const readOptionalNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readVoiceSteeringSource = (
  value: unknown,
): Parameters<typeof recordVoiceSteeringEvent>[0]["source"] | null => {
  const raw = readString(value);
  return raw === "voice_capture" || raw === "text_capture" || raw === "ui_button" ? raw : null;
};

const readVoiceSteeringTiming = (
  value: unknown,
): Parameters<typeof recordVoiceSteeringEvent>[0]["timing"] | null => {
  const raw = readString(value);
  return (
    raw === "during_reasoning" ||
    raw === "during_tool_call" ||
    raw === "between_steps" ||
    raw === "before_final_synthesis" ||
    raw === "idle"
  )
    ? raw
    : null;
};

const readVoiceSteeringClassification = (
  value: unknown,
): Parameters<typeof recordVoiceSteeringEvent>[0]["classification"] | null => {
  const raw = readString(value);
  return (
    raw === "on_topic_additive" ||
    raw === "constraint" ||
    raw === "correction" ||
    raw === "off_topic_new_goal" ||
    raw === "cancel_or_stop" ||
    raw === "ambient" ||
    raw === "unsafe_or_untrusted"
  )
    ? raw
    : null;
};

const readVoiceSteeringQueueDecision = (
  value: unknown,
): Parameters<typeof recordVoiceSteeringEvent>[0]["queueDecision"] | null => {
  const raw = readString(value);
  return (
    raw === "queued_for_safe_boundary" ||
    raw === "applied_to_next_step" ||
    raw === "deferred_to_new_turn" ||
    raw === "rejected_off_topic" ||
    raw === "cancel_requested" ||
    raw === "ambient_ignored"
  )
    ? raw
    : null;
};

const readInterpretationPayload = (
  value: unknown,
  fallbackSource?: Record<string, unknown>,
): StagePlayLiveSourceMailInterpretationPayloadV1 | null => {
  const record = readRecord(value) ?? fallbackSource ?? null;
  if (!record) return null;
  const coverageRecord = readRecord(record.mail_coverage ?? record.mailCoverage);
  const coverageMode = readString(coverageRecord?.mode);
  const mailCoverage = coverageRecord && (
    coverageMode === "latest_only" ||
    coverageMode === "chronological_batch" ||
    coverageMode === "micro_batch" ||
    coverageMode === "per_mail" ||
    coverageMode === "salience_window"
  )
    ? {
        readMailIds: readStringArray(coverageRecord.read_mail_ids ?? coverageRecord.readMailIds),
        interpretedMailIds: readStringArray(coverageRecord.interpreted_mail_ids ?? coverageRecord.interpretedMailIds),
        compressedMailIds: readStringArray(coverageRecord.compressed_mail_ids ?? coverageRecord.compressedMailIds),
        skippedMailIds: readStringArray(coverageRecord.skipped_mail_ids ?? coverageRecord.skippedMailIds),
        mode: coverageMode,
        reason: readString(coverageRecord.reason) ?? "Interpretation payload supplied mail coverage.",
      }
    : undefined;
  const payload: StagePlayLiveSourceMailInterpretationPayloadV1 = {
    currentSceneSummary:
      readString(record.current_scene_summary) ??
      readString(record.currentSceneSummary) ??
      undefined,
    runningStorySummary:
      readString(record.running_story_summary) ??
      readString(record.runningStorySummary) ??
      undefined,
    setting: readString(record.setting),
    activeWindowOrScene:
      readString(record.active_window_or_scene) ??
      readString(record.activeWindowOrScene),
    entities: readStringArray(record.entities),
    objects: readStringArray(record.objects),
    activities: readStringArray(record.activities),
    userRelevantMeaning:
      readString(record.user_relevant_meaning) ??
      readString(record.userRelevantMeaning) ??
      undefined,
    meaningfulChanges: readStringArray(record.meaningful_changes ?? record.meaningfulChanges),
    uncertainties: readStringArray(record.uncertainties),
    watchNextTargets: readStringArray(record.watch_next_targets ?? record.watchNextTargets),
    watchNextReason:
      readString(record.watch_next_reason) ??
      readString(record.watchNextReason) ??
      undefined,
    predictionText:
      readString(record.prediction_text) ??
      readString(record.predictionText),
    predictionHorizon:
      readString(record.prediction_horizon) ??
      readString(record.predictionHorizon),
    predictionConfidence:
      readOptionalNumber(record.prediction_confidence) ??
      readOptionalNumber(record.predictionConfidence),
    validationSignals: readStringArray(record.validation_signals ?? record.validationSignals),
    mailCoverage,
  };
  const hasPayload = Object.values(payload).some((entry) =>
    Array.isArray(entry) ? entry.length > 0 : entry !== undefined && entry !== null && entry !== ""
  );
  return hasPayload ? payload : null;
};

const readBooleanArg = (record: Record<string, unknown>, snakeKey: string, camelKey: string): boolean | null => {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === "boolean" ? value : null;
};

const readWatchJobOutputPolicy = (
  args: Record<string, unknown>,
  defaults: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"],
): Partial<StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"]> => {
  const nested = readRecord(args.output_policy ?? args.outputPolicy) ?? {};
  const allowVoiceCallout =
    readBooleanArg(nested, "allow_voice_callout", "allowVoiceCallout") ??
    readBooleanArg(args, "allow_voice_callout", "allowVoiceCallout") ??
    defaults.allowVoiceCallout;
  return {
    allowTextAnswer:
      readBooleanArg(nested, "allow_text_answer", "allowTextAnswer") ??
      readBooleanArg(args, "allow_text_answer", "allowTextAnswer") ??
      defaults.allowTextAnswer,
    allowVoiceCallout,
    voiceRequiresUrgency:
      readBooleanArg(nested, "voice_requires_urgency", "voiceRequiresUrgency") ??
      readBooleanArg(args, "voice_requires_urgency", "voiceRequiresUrgency") ??
      defaults.voiceRequiresUrgency,
    confirmationRequired:
      readBooleanArg(nested, "confirmation_required", "confirmationRequired") ??
      readBooleanArg(args, "confirmation_required", "confirmationRequired") ??
      defaults.confirmationRequired,
  };
};

const formatWatchJobOutputPolicy = (policy: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"]): string => {
  const text = policy.allowTextAnswer ? "text answer allowed" : "text answer disabled";
  const voice = policy.allowVoiceCallout ? "voice allowed" : "voice disabled";
  const confirmation = policy.confirmationRequired ? "confirmation required" : "no confirmation required";
  const urgency = policy.voiceRequiresUrgency ? "urgent voice only" : "voice urgency not required";
  return `${text}, ${voice}, ${confirmation}, ${urgency}.`;
};

const readWatchJobInterpretationMode = (
  value: unknown,
): StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"] | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return (
    normalized === "latest_scene_answer" ||
    normalized === "batch_interpretation" ||
    normalized === "salience_watch" ||
    normalized === "prediction_watch" ||
    normalized === "voice_commentary_watch" ||
    normalized === "voice_callout_watch"
  )
    ? normalized
    : null;
};

const readWatchJobMailProcessingMode = (
  value: unknown,
): StagePlayLiveSourceWatchJobPolicyV1["mailProcessingMode"] | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return (
    normalized === "latest_only" ||
    normalized === "chronological_batch" ||
    normalized === "micro_batch" ||
    normalized === "per_mail" ||
    normalized === "salience_window"
  )
    ? normalized
    : null;
};

const readWatchJobOutputCadence = (
  value: unknown,
): StagePlayLiveSourceWatchJobPolicyV1["outputCadence"] | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return (
    normalized === "every_batch" ||
    normalized === "only_salient" ||
    normalized === "voice_only_salient" ||
    normalized === "manual_only"
  )
    ? normalized
    : null;
};

const buildWatchJobConfiguredTranscriptRows = (input: {
  policy: StagePlayLiveSourceWatchJobPolicyV1;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const rowBase = {
    source: {
      toolName: "live_env.configure_live_source_watch_job",
      artifactId: input.policy.policyId,
      artifactKind: input.policy.artifactId,
    },
    evidenceRefs: input.policy.evidenceRefs,
    authority: "tool_evidence" as const,
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  };
  return [
    {
      rowId: `ask_turn_watch_job_configured:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Watch job configured",
      body: `Watch policy armed: ${input.policy.policyId}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_watch_job_objective:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Objective",
      body: `Objective: ${input.policy.objectiveText}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_watch_job_source:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Source",
      body: `Source: ${input.policy.sourceIds.length > 0 ? input.policy.sourceIds.join(", ") : "all active live sources"}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_watch_job_policy:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Policy",
      body: `Policy: ${input.policy.interpretationMode ?? "latest_scene_answer"}; mail ${input.policy.mailProcessingMode ?? "latest_only"}; cadence ${input.policy.outputCadence ?? "every_batch"}; ${formatWatchJobOutputPolicy(input.policy.outputPolicy)}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_watch_job_loop_state:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Loop state",
      body: "Loop state: armed for next summary.",
      ...rowBase,
    },
  ];
};

const readInterpreterProfileDomain = (
  value: unknown,
  fallbackText = "",
): StagePlayLiveSourceInterpreterProfileDomainV1 => {
  const raw = readString(value);
  if (
    raw === "minecraft" ||
    raw === "browser" ||
    raw === "video" ||
    raw === "code_logs" ||
    raw === "desktop_app" ||
    raw === "custom"
  ) {
    return raw;
  }
  if (/\bminecraft|creeper|zombie|craft|inventory|biome|mob\b/i.test(fallbackText)) return "minecraft";
  if (/\bbrowser|tab|webpage|website|chrome|url\b/i.test(fallbackText)) return "browser";
  if (/\bvideo|scene|frame|clip|youtube\b/i.test(fallbackText)) return "video";
  if (/\blog|stack trace|exception|test failure|server\b/i.test(fallbackText)) return "code_logs";
  if (/\bdesktop|window|app|launcher|screen\b/i.test(fallbackText)) return "desktop_app";
  return "custom";
};

const readInterpreterProfileTextStyle = (
  value: unknown,
): StagePlayLiveSourceInterpreterProfileTextStyleV1 => {
  const raw = readString(value);
  return raw === "one_sentence" || raw === "brief_explanation" || raw === "structured"
    ? raw
    : "brief_explanation";
};

const readInterpreterProfileVoiceStyle = (
  value: unknown,
): StagePlayLiveSourceInterpreterProfileVoiceStyleV1 => {
  const raw = readString(value);
  return raw === "short_callout" || raw === "coach" || raw === "warning_only"
    ? raw
    : "short_callout";
};

const titleCaseWords = (value: string, limit = 4): string =>
  value
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, limit)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");

const inferInterpreterProfileTitle = (input: {
  title?: string | null;
  domain: StagePlayLiveSourceInterpreterProfileDomainV1;
  objectiveText: string;
}): string => {
  const explicit = readString(input.title);
  if (explicit) return clipText(explicit, 80);
  const objective = input.objectiveText;
  if (input.domain === "minecraft") {
    if (/\bsurvival|hazard|risk|mob|creeper|zombie\b/i.test(objective)) return "Minecraft Survival Coach";
    return "Minecraft Scene Interpreter";
  }
  if (input.domain === "browser") return "Browser Workflow Watcher";
  if (input.domain === "video") return "Video Scene Interpreter";
  if (input.domain === "code_logs") return "Code Log Failure Watcher";
  if (input.domain === "desktop_app") return "Desktop App Watcher";
  const titled = titleCaseWords(objective);
  return titled ? `${titled} Interpreter` : "Live Source Interpreter";
};

const buildInterpreterProfileConfiguredTranscriptRows = (input: {
  profile: StagePlayLiveSourceInterpreterProfileV1;
  linkedNote?: { noteId: string; title: string } | null;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? input.profile.updatedAt;
  const rowBase = {
    source: {
      toolName: "live_env.configure_interpreter_profile",
      artifactId: input.profile.profileId,
      artifactKind: input.profile.artifactId,
    },
    evidenceRefs: input.profile.evidenceRefs,
    authority: "tool_evidence" as const,
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  };
  const rows: AskTurnTranscriptRowDraftV1[] = [
    {
      rowId: `ask_turn_interpreter_profile_configured:${hashShort(input.profile.profileId)}`,
      rowKind: "interpreter_profile",
      title: "Interpreter profile configured",
      body: `${input.profile.title}: ${input.profile.profileId}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_objective:${hashShort(input.profile.profileId)}`,
      rowKind: "interpreter_profile",
      title: "Objective",
      body: `Objective: ${input.profile.objectiveText}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_guidelines:${hashShort(input.profile.profileId)}`,
      rowKind: "interpreter_profile",
      title: "Guidelines",
      body: `Guidelines: ${clipText(input.profile.interpretationGuidelines, 420)}`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_scope:${hashShort(input.profile.profileId)}`,
      rowKind: "interpreter_profile",
      title: "Scope",
      body: `Domain: ${input.profile.domain}; source kinds: ${input.profile.sourceKinds.join(", ")}; status: ${input.profile.status}.`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_criteria:${hashShort(input.profile.profileId)}`,
      rowKind: "interpreter_profile",
      title: "Criteria",
      body: `Salience: ${input.profile.salienceCriteria.join(" | ") || "none"}; suppress: ${input.profile.suppressCriteria.join(" | ") || "none"}.`,
      ...rowBase,
    },
  ];
  if (input.linkedNote) {
    rows.push({
      rowId: `ask_turn_interpreter_profile_note:${hashShort([input.profile.profileId, input.linkedNote.noteId])}`,
      rowKind: "profile_note_link",
      title: "Linked note",
      body: `Linked note: ${input.linkedNote.title} (${input.linkedNote.noteId}).`,
      ...rowBase,
      evidenceRefs: uniqueStrings([...input.profile.evidenceRefs, input.linkedNote.noteId]),
    });
  }
  return rows;
};

const buildInterpreterProfileComparisonTranscriptRows = (input: {
  comparison: ReturnType<typeof compareMailToInterpreterProfile>;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? input.comparison.createdAt;
  const rowBase = {
    source: {
      toolName: "live_env.compare_mail_to_interpreter_profile",
      artifactId: input.comparison.comparisonId,
      artifactKind: input.comparison.artifactId,
    },
    evidenceRefs: input.comparison.evidenceRefs,
    causalTrace: input.comparison.causalTrace,
    authority: "tool_evidence" as const,
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  };
  return [
    {
      rowId: `ask_turn_interpreter_profile_comparison:${hashShort(input.comparison.comparisonId)}`,
      rowKind: "profile_comparison",
      title: "Interpreter profile comparison",
      body: `Profile ${input.comparison.profileId} compared ${input.comparison.mailIds.length} mail item(s). Recommended: ${input.comparison.recommendedDecision}.`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_decision:${hashShort(input.comparison.comparisonId)}`,
      rowKind: "agent_decision",
      title: "Recommended decision",
      body: `Recommended decision: ${input.comparison.recommendedDecision}.`,
      ...rowBase,
    },
    {
      rowId: `ask_turn_interpreter_profile_matches:${hashShort(input.comparison.comparisonId)}`,
      rowKind: "profile_comparison",
      title: "Criteria matches",
      body: [
        input.comparison.matchedCriteria.length ? `salience=${input.comparison.matchedCriteria.join(", ")}` : null,
        input.comparison.riskMatches.length ? `risk=${input.comparison.riskMatches.join(", ")}` : null,
        input.comparison.opportunityMatches.length ? `opportunity=${input.comparison.opportunityMatches.join(", ")}` : null,
        input.comparison.voiceCalloutMatches.length ? `voice=${input.comparison.voiceCalloutMatches.join(", ")}` : null,
        input.comparison.suppressedCriteria.length ? `suppress=${input.comparison.suppressedCriteria.join(", ")}` : null,
      ].filter(Boolean).join("; ") || "No profile criteria matched deterministically.",
      ...rowBase,
    },
  ];
};

const rowKindForVoiceSteeringQueueDecision = (
  queueDecision: HelixVoiceSteeringEventV1["queueDecision"],
): AskTurnTranscriptRowDraftV1["rowKind"] => {
  switch (queueDecision) {
    case "queued_for_safe_boundary":
    case "applied_to_next_step":
      return "voice_steering_queued";
    case "deferred_to_new_turn":
      return "voice_steering_deferred";
    case "rejected_off_topic":
    case "ambient_ignored":
      return "voice_steering_rejected";
    case "cancel_requested":
      return "voice_steering_cancel_requested";
  }
};

const titleForVoiceSteeringQueueDecision = (
  queueDecision: HelixVoiceSteeringEventV1["queueDecision"],
): string => {
  switch (queueDecision) {
    case "queued_for_safe_boundary":
    case "applied_to_next_step":
      return "Voice steering queued";
    case "deferred_to_new_turn":
      return "Voice steering deferred";
    case "rejected_off_topic":
    case "ambient_ignored":
      return "Voice steering rejected";
    case "cancel_requested":
      return "Voice steering cancel requested";
  }
};

export const buildVoiceSteeringTranscriptRows = (input: {
  steeringEvent: HelixVoiceSteeringEventV1;
  decision?: HelixVoiceSteeringDecisionV1 | null;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? input.steeringEvent.capturedAt ?? new Date().toISOString();
  const steeringEvent = input.steeringEvent;
  const evidenceRefs = uniqueStrings([steeringEvent.steeringEventId, ...steeringEvent.evidenceRefs]);
  const source = {
    toolName: "live_env.record_voice_steering",
    artifactId: steeringEvent.steeringEventId,
    artifactKind: "helix.voice_steering_event.v1",
  };
  const base = {
    source,
    evidenceRefs,
    authority: "tool_evidence" as const,
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  };
  const rows: AskTurnTranscriptRowDraftV1[] = [
    {
      rowId: `voice_steering_received:${hashShort(steeringEvent.steeringEventId)}`,
      rowKind: "voice_steering_received",
      title: "Voice steering received",
      body: steeringEvent.transcriptText,
      ...base,
    },
    {
      rowId: `${rowKindForVoiceSteeringQueueDecision(steeringEvent.queueDecision)}:${hashShort(steeringEvent.steeringEventId)}`,
      rowKind: rowKindForVoiceSteeringQueueDecision(steeringEvent.queueDecision),
      title: titleForVoiceSteeringQueueDecision(steeringEvent.queueDecision),
      body: `${steeringEvent.classification}: ${steeringEvent.queueDecision}`,
      ...base,
    },
  ];
  if (input.decision) {
    rows.push({
      rowId: `voice_steering_applied:${hashShort(input.decision.decisionId)}`,
      rowKind: input.decision.decision === "steering_applied"
        ? "voice_steering_applied"
        : input.decision.decision === "steering_requires_new_turn" || input.decision.decision === "steering_deferred"
          ? "voice_steering_deferred"
          : input.decision.decision === "turn_cancel_requested"
            ? "voice_steering_cancel_requested"
            : "voice_steering_rejected",
      title: input.decision.decision === "steering_applied"
        ? "Voice steering applied"
        : input.decision.decision === "turn_cancel_requested"
          ? "Voice steering cancel requested"
          : input.decision.decision === "steering_requires_new_turn" || input.decision.decision === "steering_deferred"
            ? "Voice steering deferred"
            : "Voice steering rejected",
      body: input.decision.modelVisibleSummary ?? input.decision.decision,
      source: {
        toolName: "live_env.record_voice_steering",
        artifactId: input.decision.decisionId,
        artifactKind: "helix.voice_steering_decision.v1",
      },
      evidenceRefs: uniqueStrings([input.decision.decisionId, ...input.decision.evidenceRefs]),
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
  }
  return rows;
};

const buildSteeringAckTranscriptRows = (input: {
  requestId: string;
  receiptId: string;
  text: string;
  evidenceRefs: string[];
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => [{
  rowId: `steering_ack_receipt:${hashShort([input.requestId, input.receiptId])}`,
  rowKind: "steering_ack_receipt",
  title: "Steering acknowledgement receipt",
  body: input.text,
  source: {
    toolName: "live_env.request_interim_voice_callout",
    artifactId: input.receiptId,
    artifactKind: "helix.interim_voice_callout_receipt.v1",
  },
  evidenceRefs: uniqueStrings([input.requestId, input.receiptId, ...input.evidenceRefs]),
  authority: "tool_evidence",
  assistantAnswer: false,
  terminalEligible: false,
  createdAt: input.createdAt ?? new Date().toISOString(),
}];

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const AGENT_GOAL_FEED_KIND_ALIASES: Record<string, AgentGoalContextFeedKindV1> = {
  visual: "visual_summaries",
  visual_summary: "visual_summaries",
  visual_summaries: "visual_summaries",
  screen: "visual_summaries",
  audio: "audio_transcripts",
  audio_transcript: "audio_transcripts",
  audio_transcripts: "audio_transcripts",
  transcript: "audio_transcripts",
  translation: "translated_transcripts",
  translated_transcript: "translated_transcripts",
  translated_transcripts: "translated_transcripts",
  microdeck: "microdeck_outputs",
  micro_deck: "microdeck_outputs",
  microdeck_output: "microdeck_outputs",
  microdeck_outputs: "microdeck_outputs",
  live_answer: "live_answer_lines",
  live_answer_lines: "live_answer_lines",
  source_health: "source_health",
  health: "source_health",
  narrator: "narrator_events",
  narrator_event: "narrator_events",
  narrator_events: "narrator_events",
  narrator_binding: "narrator_events",
  narrator_bindings: "narrator_events",
  narrator_stream: "narrator_events",
  narrator_streams: "narrator_events",
  trace: "trace_memory",
  trace_memory: "trace_memory",
  packet: "packet_traces",
  packets: "packet_traces",
  packet_trace: "packet_traces",
  packet_traces: "packet_traces",
  per_packet_trace: "packet_traces",
  per_packet_traces: "packet_traces",
  route: "route_evidence",
  route_evidence: "route_evidence",
  automation: "automation_policies",
  automations: "automation_policies",
  automation_policy: "automation_policies",
  automation_policies: "automation_policies",
  watch_job: "automation_policies",
  watch_jobs: "automation_policies",
};

function normalizeAgentGoalFeedKind(value: unknown): AgentGoalContextFeedKindV1 | null {
  const key = readString(value)?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return key ? AGENT_GOAL_FEED_KIND_ALIASES[key] ?? null : null;
}

function readAgentGoalContextFeeds(value: unknown): AgentGoalSessionV1["contextFeeds"] | undefined {
  const entries = Array.isArray(value) ? value : [];
  const feeds = entries
    .map((entry, index): AgentGoalSessionV1["contextFeeds"][number] | null => {
      if (typeof entry === "string") {
        const sourceKind = normalizeAgentGoalFeedKind(entry);
        return sourceKind
          ? {
              feedId: `agent_goal_feed:${sourceKind}:${index + 1}`,
              sourceKind,
            }
          : null;
      }
      const record = readObject(entry);
      if (!record) return null;
      const sourceKind = normalizeAgentGoalFeedKind(
        record.sourceKind ?? record.source_kind ?? record.kind ?? record.feed_kind ?? record.feedKind,
      );
      if (!sourceKind) return null;
      const freshnessMs = readOptionalNumber(record.freshnessMs ?? record.freshness_ms);
      return {
        feedId:
          readString(record.feedId) ??
          readString(record.feed_id) ??
          `agent_goal_feed:${sourceKind}:${index + 1}`,
        sourceKind,
        ...(readString(record.query) ? { query: readString(record.query)! } : {}),
        ...(freshnessMs ? { freshnessMs } : {}),
        ...(readString(record.relevancePolicy ?? record.relevance_policy)
          ? { relevancePolicy: readString(record.relevancePolicy ?? record.relevance_policy)! }
          : {}),
      };
    })
    .filter((entry): entry is AgentGoalSessionV1["contextFeeds"][number] => Boolean(entry));
  return feeds.length > 0 ? feeds : undefined;
}

function readAgentGoalAllowedActuators(value: unknown): AgentGoalActuatorV1[] | undefined {
  const actuators = readStringArray(value)
    .map((entry) => normalizeAgentGoalActuatorV1(entry))
    .filter((entry): entry is AgentGoalActuatorV1 => Boolean(entry));
  return actuators.length > 0 ? Array.from(new Set(actuators)) : undefined;
}

function readAgentGoalCadence(args: Record<string, unknown>): AgentGoalSessionV1["cadence"] | undefined {
  const cadenceRecord = readObject(args.cadence);
  const kind = readString(cadenceRecord?.kind ?? args.cadence_kind ?? args.cadenceKind)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  if (kind === "manual") return { kind: "manual" };
  if (kind === "user_turn_only" || kind === "turn_only") return { kind: "user_turn_only" };
  if (kind === "interval") {
    const everyMs = readOptionalNumber(cadenceRecord?.everyMs ?? cadenceRecord?.every_ms ?? args.every_ms ?? args.everyMs);
    return { kind: "interval", everyMs: Math.max(1_000, Math.floor(everyMs ?? 30_000)) };
  }
  if (kind === "event_accumulation" || kind === "accumulate") {
    const minUpdates = readOptionalNumber(cadenceRecord?.minUpdates ?? cadenceRecord?.min_updates ?? args.min_updates ?? args.minUpdates);
    return { kind: "event_accumulation", minUpdates: Math.max(1, Math.floor(minUpdates ?? 2)) };
  }
  return undefined;
}

function readAgentGoalCheckpoint(args: Record<string, unknown>): Parameters<typeof ensureStagePlayAgentGoalSession>[0]["checkpoint"] | undefined {
  const checkpoint = readObject(args.checkpoint);
  const summary = readString(checkpoint?.summary ?? args.checkpoint_summary ?? args.checkpointSummary);
  const nextStep = readString(checkpoint?.nextStep ?? checkpoint?.next_step ?? args.next_step ?? args.nextStep);
  const allowedNextSteps = new Set<AgentGoalSessionV1["checkpoints"][number]["nextStep"]>([
    "continue",
    "ask_user",
    "repair",
    "report",
    "stop",
  ]);
  const normalizedNextStep = nextStep?.toLowerCase().replace(/[^a-z0-9]+/g, "_") as
    | AgentGoalSessionV1["checkpoints"][number]["nextStep"]
    | undefined;
  const evidenceRefs = uniqueStrings([
    ...readStringArray(checkpoint?.evidenceRefs ?? checkpoint?.evidence_refs),
    ...readStringArray(args.evidence_refs ?? args.evidenceRefs),
  ]);
  const actionsTaken = uniqueStrings([
    ...readStringArray(checkpoint?.actionsTaken ?? checkpoint?.actions_taken),
    ...readStringArray(args.actions_taken ?? args.actionsTaken),
  ]);
  return summary || evidenceRefs.length > 0 || actionsTaken.length > 0 || normalizedNextStep
    ? {
        summary,
        evidenceRefs,
        actionsTaken,
        nextStep: normalizedNextStep && allowedNextSteps.has(normalizedNextStep) ? normalizedNextStep : undefined,
      }
    : undefined;
}

function readAgentGoalFinalReportRequirements(args: Record<string, unknown>): AgentGoalSessionV1["authority"]["finalReportRequirements"] | undefined {
  const record = readObject(args.final_report_requirements ?? args.finalReportRequirements ?? args.authority);
  if (!record) return undefined;
  const allowedTerminalArtifactKinds = readStringArray(record.allowedTerminalArtifactKinds ?? record.allowed_terminal_artifact_kinds);
  const requiredEvidenceKinds = readStringArray(record.requiredEvidenceKinds ?? record.required_evidence_kinds);
  const prohibitedReportSources = readStringArray(record.prohibitedReportSources ?? record.prohibited_report_sources);
  return allowedTerminalArtifactKinds.length > 0 || requiredEvidenceKinds.length > 0 || prohibitedReportSources.length > 0
    ? {
        completedSolverPathRequired: true,
        evidenceReentryRequired: true,
        routeAuthorityRequired: true,
        terminalAuthoritySingleWriterRequired: true,
        allowedTerminalArtifactKinds: allowedTerminalArtifactKinds.length > 0
          ? allowedTerminalArtifactKinds
          : WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS.allowedTerminalArtifactKinds,
        requiredEvidenceKinds: requiredEvidenceKinds.length > 0
          ? requiredEvidenceKinds
          : WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS.requiredEvidenceKinds,
        prohibitedReportSources: prohibitedReportSources.length > 0
          ? prohibitedReportSources
          : WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS.prohibitedReportSources,
      }
    : undefined;
}

const readDelegationCandidatePrompts = (value: unknown): StagePlayMicroReasonerPromptDelegationCandidateV1[] => {
  const entries = Array.isArray(value) ? value : [];
  return entries
    .map((entry, index) => {
      const fallbackId = ["candidate_a", "candidate_b", "candidate_c"][index] ?? `candidate_${index + 1}`;
      if (typeof entry === "string") {
        return {
          candidateId: fallbackId,
          title: `Candidate ${index + 1}`,
          promptText: entry.trim(),
        };
      }
      const record = readRecord(entry);
      if (!record) return null;
      const promptText =
        readString(record.promptText) ??
        readString(record.prompt_text) ??
        readString(record.prompt) ??
        readString(record.template);
      if (!promptText) return null;
      return {
        candidateId: readString(record.candidateId) ?? readString(record.candidate_id) ?? readString(record.id) ?? fallbackId,
        title: readString(record.title) ?? readString(record.label) ?? `Candidate ${index + 1}`,
        promptText,
      };
    })
    .filter((entry): entry is StagePlayMicroReasonerPromptDelegationCandidateV1 => Boolean(entry));
};

const delegationCandidatesFromArgs = (args: Record<string, unknown>): StagePlayMicroReasonerPromptDelegationCandidateV1[] =>
  readDelegationCandidatePrompts(args.candidates)
    .concat(readDelegationCandidatePrompts(args.candidate_prompts))
    .concat(readDelegationCandidatePrompts(args.candidatePrompts))
    .slice(0, 3);

const rawDelegationCandidateCount = (args: Record<string, unknown>): number => {
  const raw =
    Array.isArray(args.candidates) ? args.candidates :
      Array.isArray(args.candidate_prompts) ? args.candidate_prompts :
        Array.isArray(args.candidatePrompts) ? args.candidatePrompts :
          [];
  return raw.length;
};

const wakePromptContractFromArgs = (
  args: Record<string, unknown>,
): StagePlayMicroReasonerWakePromptContractV1 | null => {
  const record =
    readRecord(args.wake_prompt_contract) ??
    readRecord(args.wakePromptContract) ??
    readRecord(args.contract);
  const promptText =
    readString(record?.promptText) ??
    readString(record?.prompt_text) ??
    readString(args.wake_contract_prompt) ??
    readString(args.wakeContractPrompt) ??
    readString(args.contract_prompt);
  if (!promptText) return null;
  const title =
    readString(record?.title) ??
    readString(args.wake_contract_title) ??
    readString(args.wakeContractTitle) ??
    "Wake-Bound Prompt Contract";
  return {
    contractId:
      readString(record?.contractId) ??
      readString(record?.contract_id) ??
      `stage_play_micro_reasoner_wake_prompt_contract:custom:${hashShort([title, promptText])}`,
    title,
    promptText,
    attachOnlyWhenWakeBound: true,
    includeSourceSummary:
      typeof record?.includeSourceSummary === "boolean"
        ? record.includeSourceSummary
        : typeof record?.include_source_summary === "boolean"
          ? record.include_source_summary
          : true,
    includeEvidenceRefs:
      typeof record?.includeEvidenceRefs === "boolean"
        ? record.includeEvidenceRefs
        : typeof record?.include_evidence_refs === "boolean"
          ? record.include_evidence_refs
          : true,
  };
};

const latestLiveSourceSummaryForDelegation = (args: Record<string, unknown>, sourceId: string | null): {
  summary: string;
  evidenceRefs: string[];
} => {
  const explicitSummary =
    readString(args.source_summary) ??
    readString(args.sourceSummary) ??
    readString(args.visual_summary) ??
    readString(args.visualSummary) ??
    readString(args.summary);
  const explicitRefs = uniqueStrings([
    ...readStringArray(args.evidence_refs),
    ...readStringArray(args.evidenceRefs),
  ]);
  if (explicitSummary) {
    return {
      summary: explicitSummary,
      evidenceRefs: explicitRefs,
    };
  }
  const latestMail = listStagePlayLiveSourceMailItems({ sourceId, limit: 1 }).at(-1);
  const summary = latestMail?.summary.text || latestMail?.summary.preview || "";
  return {
    summary,
    evidenceRefs: uniqueStrings([
      ...explicitRefs,
      latestMail?.mailId,
      ...(latestMail?.evidenceRefs ?? []),
    ]),
  };
};

const delegationTokens = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
      .filter((token) => ![
        "the",
        "and",
        "for",
        "with",
        "from",
        "that",
        "this",
        "what",
        "when",
        "where",
        "which",
        "should",
        "would",
        "could",
        "prompt",
        "source",
        "summary",
      ].includes(token)),
  );

const routeMicroReasonerPromptCandidates = (input: {
  candidates: StagePlayMicroReasonerPromptDelegationCandidateV1[];
  sourceSummary: string;
  threshold: number;
  allowNone: boolean;
  escalationMode: "suggest_only" | "handoff_to_helix_ask" | "handoff_only_if_confident";
  presetId?: string | null;
  presetTitle?: string | null;
  wakePromptContract?: StagePlayMicroReasonerWakePromptContractV1 | null;
  sourceId?: string | null;
  evidenceRefs: string[];
}): StagePlayMicroReasonerPromptDelegationResultV1 => {
  const summaryTokens = delegationTokens(input.sourceSummary);
  const scored = input.candidates.map((candidate) => {
    const candidateTokens = delegationTokens(`${candidate.title}\n${candidate.promptText}`);
    const overlap = Array.from(candidateTokens).filter((token) => summaryTokens.has(token));
    const denominator = Math.max(1, Math.min(candidateTokens.size, Math.max(3, summaryTokens.size)));
    const score = Math.max(0, Math.min(1, overlap.length / denominator));
    return {
      candidate,
      score,
      overlap,
    };
  }).sort((left, right) => right.score - left.score);
  const best = scored[0] ?? null;
  const selected =
    best && (!input.allowNone || best.score >= input.threshold)
      ? best
      : null;
  const confidence = selected ? selected.score : best?.score ?? 0;
  const confidenceLabel: StagePlayMicroReasonerPromptDelegationResultV1["confidenceLabel"] =
    confidence >= 0.7 ? "high" : confidence >= input.threshold ? "medium" : "low";
  const shouldHandoffToHelixAsk = Boolean(
    selected &&
      (
        input.escalationMode === "handoff_to_helix_ask" ||
        (input.escalationMode === "handoff_only_if_confident" && confidence >= input.threshold)
      ),
  );
  const selectedCandidateId = selected?.candidate.candidateId ?? null;
  const selectedPromptText = selected?.candidate.promptText ?? null;
  const createdAt = new Date().toISOString();
  const delegationId = `stage_play_micro_reasoner_prompt_delegation:${hashShort([
    input.sourceId,
    input.presetId,
    input.sourceSummary,
    input.candidates.map((candidate) => candidate.promptText),
    createdAt,
  ])}`;
  const reason = selected
    ? `Selected ${selected.candidate.title} because ${selected.overlap.length > 0 ? `it overlaps source cues: ${selected.overlap.slice(0, 6).join(", ")}` : "it is the strongest available candidate"}.`
    : best
      ? `No prompt met the delegation threshold; strongest candidate was ${best.candidate.title} at ${best.score.toFixed(2)}.`
      : "No candidate prompts were available for routing.";
  const wakePromptContract = selected && shouldHandoffToHelixAsk
    ? input.wakePromptContract ?? null
    : null;
  const appendedPrompt = selected && shouldHandoffToHelixAsk
    ? [
        selected.candidate.promptText,
        wakePromptContract
          ? [
              "",
              "Wake-bound contract:",
              wakePromptContract.promptText,
            ].join("\n")
          : "",
      ].filter((part) => part.trim().length > 0).join("\n")
    : null;
  return {
    artifactId: "stage_play_micro_reasoner_prompt_delegation_result",
    schema: "stage_play_micro_reasoner_prompt_delegation_result/v1",
    schemaVersion: "stage_play_micro_reasoner_prompt_delegation_result/v1",
    delegationId,
    sourceId: input.sourceId ?? null,
    presetId: input.presetId ?? null,
    presetTitle: input.presetTitle ?? null,
    sourceSummary: input.sourceSummary,
    candidates: input.candidates,
    selectedCandidateId,
    selectedPromptText,
    confidence,
    confidenceLabel,
    threshold: input.threshold,
    shouldHandoffToHelixAsk,
    reason,
    rejectedCandidates: scored
      .filter((entry) => entry.candidate.candidateId !== selectedCandidateId)
      .map((entry) => ({
        candidateId: entry.candidate.candidateId,
        reason: entry.overlap.length > 0
          ? `Matched ${entry.overlap.slice(0, 4).join(", ")} but scored below the selected prompt.`
          : "No strong source-summary overlap.",
        score: entry.score,
      })),
    helixAskHandoff: selected && shouldHandoffToHelixAsk
      ? {
          prompt: selected.candidate.promptText,
          sourceSummary: input.sourceSummary,
          evidenceRefs: input.evidenceRefs,
          selectedCandidateId: selected.candidate.candidateId,
          wakePromptContract,
          appendedPrompt,
        }
      : null,
    evidenceRefs: input.evidenceRefs,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
    ask_context_policy: "evidence_only",
  };
};

const scenarioTextFromDraftArgs = (args: Record<string, unknown>): string =>
  readString(args.scenario_text) ??
  readString(args.scenarioText) ??
  readString(args.scenario) ??
  readString(args.user_goal) ??
  readString(args.userGoal) ??
  readString(args.objective) ??
  readString(args.description) ??
  readString(args.summary) ??
  "";

const presetTextForDraftScoring = (preset: StagePlayMicroReasonerPromptPresetV1): string =>
  [
    preset.title,
    preset.description,
    preset.domain,
    preset.outputPolicy,
    preset.deckRunPlan,
    preset.sourceKinds.join(" "),
    preset.promptedRoles.join(" "),
    preset.delegationRouter?.candidates.map((candidate) => `${candidate.title} ${candidate.promptText}`).join(" "),
    preset.wakePromptContract?.title,
    preset.wakePromptContract?.promptText,
  ].filter(Boolean).join("\n");

const draftScorePreset = (scenarioText: string, preset: StagePlayMicroReasonerPromptPresetV1): {
  score: number;
  overlap: string[];
} => {
  const scenarioTokens = delegationTokens(scenarioText);
  const presetTokens = delegationTokens(presetTextForDraftScoring(preset));
  const overlap = Array.from(scenarioTokens).filter((token) => presetTokens.has(token));
  const denominator = Math.max(1, Math.min(Math.max(4, scenarioTokens.size), Math.max(4, presetTokens.size)));
  const score = Math.max(0, Math.min(1, overlap.length / denominator));
  return { score, overlap };
};

const synthesizeDraftCandidatePrompts = (
  scenarioText: string,
): StagePlayMicroReasonerPromptDelegationCandidateV1[] => {
  const clippedScenario = clipText(scenarioText, 220) || "the incoming live-source observation";
  return [
    {
      candidateId: "candidate_a",
      title: "Prepare Action Candidate",
      promptText: `Evaluate whether ${clippedScenario} contains enough evidence to prepare the next tool/action candidate. Return the candidate action, needed inputs, confidence, and blockers.`,
    },
    {
      candidateId: "candidate_b",
      title: "Append Wake Context",
      promptText: `Summarize the relevant live-source evidence for ${clippedScenario} as a concise wake-bound context pack. Include observed facts, uncertainty, and why the agent should consider it now.`,
    },
    {
      candidateId: "candidate_c",
      title: "Ask For Confirmation",
      promptText: `Determine whether ${clippedScenario} is too ambiguous or risky for automation. If so, draft the smallest confirmation question and list the missing evidence.`,
    },
  ];
};

const makeDraftTitle = (scenarioText: string, basePreset: StagePlayMicroReasonerPromptPresetV1): string => {
  const explicit = clipText(scenarioText, 52)
    .replace(/^(?:i\s+want|can\s+you|please|set\s+up|setup|create|draft)\s+/i, "")
    .trim();
  const base = explicit || basePreset.title.replace(/\s+Deck$/i, "");
  return `${base} MicroDeck Draft`;
};

const draftMicroReasonerPresetFromScenario = (input: {
  args: Record<string, unknown>;
  sourceIds: string[];
  presetId?: string | null;
  basePresetId?: string | null;
  now: string;
}): StagePlayMicroReasonerPromptPresetDraftV1 => {
  const scenarioText = scenarioTextFromDraftArgs(input.args);
  const presets = listStagePlayMicroReasonerPromptPresets({
    includePresets: true,
    active: true,
    limit: 100,
  });
  const requestedBasePresetId = input.basePresetId ?? input.presetId ?? null;
  const requestedBasePreset = requestedBasePresetId
    ? presets.find((preset) => preset.presetId === requestedBasePresetId) ?? null
    : null;
  const scored = presets
    .map((preset) => {
      const scoring = draftScorePreset(scenarioText, preset);
      return { preset, score: requestedBasePreset?.presetId === preset.presetId ? 1 : scoring.score, overlap: scoring.overlap };
    })
    .sort((left, right) => right.score - left.score);
  const recommended = requestedBasePreset
    ? { preset: requestedBasePreset, score: 1, overlap: ["operator_requested_base_preset"] }
    : scored[0] ?? {
        preset: getActiveStagePlayMicroReasonerPromptPresetForSource({}) as StagePlayMicroReasonerPromptPresetV1,
        score: 0,
        overlap: [],
      };
  const basePreset = recommended.preset;
  const suppliedCandidates = delegationCandidatesFromArgs(input.args);
  const candidatePrompts =
    suppliedCandidates.length > 0
      ? suppliedCandidates
      : basePreset.delegationRouter?.candidates?.length
        ? basePreset.delegationRouter.candidates.slice(0, 3)
        : synthesizeDraftCandidatePrompts(scenarioText);
  const confidenceThreshold = Math.max(0, Math.min(1, readNumber(
    input.args.confidence_threshold ?? input.args.confidenceThreshold,
    basePreset.delegationRouter?.confidenceThreshold ?? 0.45,
  )));
  const escalationMode =
    readString(input.args.escalation_mode) === "suggest_only" ||
    readString(input.args.escalationMode) === "suggest_only"
      ? "suggest_only"
      : readString(input.args.escalation_mode) === "handoff_to_helix_ask" ||
        readString(input.args.escalationMode) === "handoff_to_helix_ask"
        ? "handoff_to_helix_ask"
        : readString(input.args.escalation_mode) === "handoff_only_if_confident" ||
          readString(input.args.escalationMode) === "handoff_only_if_confident"
          ? "handoff_only_if_confident"
          : basePreset.delegationRouter?.escalationMode ?? "handoff_only_if_confident";
  const allowNone = typeof input.args.allow_none === "boolean"
    ? input.args.allow_none
    : typeof input.args.allowNone === "boolean"
      ? input.args.allowNone
      : basePreset.delegationRouter?.allowNone ?? true;
  const wakePromptContract = wakePromptContractFromArgs(input.args) ?? basePreset.wakePromptContract ?? null;
  const title = readString(input.args.title) ?? makeDraftTitle(scenarioText, basePreset);
  const description =
    readString(input.args.description) ??
    `Draft custom MicroDeck from ${basePreset.title} for: ${clipText(scenarioText, 180) || "the supplied automation scenario"}.`;
  const missingInformation = [
    scenarioText ? null : "scenario_text",
    candidatePrompts.length > 0 ? null : "candidate_prompts",
    input.sourceIds.length > 0 ? null : "source_ids",
  ].filter((entry): entry is string => Boolean(entry));
  const confidence = recommended.score;
  const confidenceLabel: StagePlayMicroReasonerPromptPresetDraftV1["confidenceLabel"] =
    confidence >= 0.7 ? "high" : confidence >= 0.35 ? "medium" : "low";
  const createArgs = {
    base_preset_id: basePreset.presetId,
    title,
    description,
    source_ids: input.sourceIds,
    candidate_prompts: candidatePrompts,
    confidence_threshold: confidenceThreshold,
    escalation_mode: escalationMode,
    allow_none: allowNone,
    ...(wakePromptContract ? { wake_prompt_contract: wakePromptContract } : {}),
  };
  const draftId = `stage_play_micro_reasoner_prompt_preset_draft:${hashShort([
    scenarioText,
    basePreset.presetId,
    candidatePrompts.map((candidate) => candidate.promptText),
    input.sourceIds,
    input.now,
  ])}`;
  return {
    artifactId: "stage_play_micro_reasoner_prompt_preset_draft",
    schema: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA,
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_DRAFT_SCHEMA,
    draftId,
    scenarioText,
    recommendedBasePresetId: basePreset.presetId,
    recommendedBasePresetTitle: basePreset.title,
    confidence,
    confidenceLabel,
    reason: recommended.overlap.length > 0
      ? `Recommended ${basePreset.title} from scenario overlap: ${recommended.overlap.slice(0, 8).join(", ")}.`
      : `Recommended ${basePreset.title} as the safest generic MicroDeck base.`,
    alternatives: scored
      .filter((entry) => entry.preset.presetId !== basePreset.presetId)
      .slice(0, 3)
      .map((entry) => ({
        presetId: entry.preset.presetId,
        title: entry.preset.title,
        score: entry.score,
        reason: entry.overlap.length > 0
          ? `Matched ${entry.overlap.slice(0, 6).join(", ")}.`
          : "No strong lexical overlap with the scenario.",
      })),
    draft: {
      title,
      description,
      basePresetId: basePreset.presetId,
      sourceKinds: basePreset.sourceKinds,
      candidatePrompts,
      confidenceThreshold,
      escalationMode,
      allowNone,
      wakePromptContract,
    },
    missingInformation,
    confirmationRequired: true,
    createToolCall: {
      toolName: "live_env.create_micro_reasoner_preset",
      args: createArgs,
    },
    applyAfterCreateSuggested: input.sourceIds.length > 0,
    sourceIds: input.sourceIds,
    evidenceRefs: uniqueStrings([draftId, basePreset.presetId, ...input.sourceIds]),
    createdAt: input.now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "micro_reasoner_evidence",
    ask_context_policy: "evidence_only",
  };
};

const clipText = (value: string | null | undefined, limit = 260): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const microReasonerTranscriptTitle = (role: StagePlayMicroReasonerRunV1["role"]): string => {
  switch (role) {
    case "claim_extractor":
      return "Claims extracted";
    case "observation_classifier":
      return "Observation classified";
    case "profile_comparator":
      return "Interpreter profile compared";
    case "delta_extractor":
      return "Delta extracted";
    case "prediction_validator":
      return "Prediction checked";
    case "salience_scorer":
      return "Salience scored";
    case "decision_selector":
      return "Decision selected";
    case "prompt_router":
      return "Prompt routed";
    case "voice_callout_drafter":
      return "Voice callout drafted";
    case "packet_composer":
      return "Packet composed";
    default:
      return "Micro-reasoner run";
  }
};

const buildMicroReasonerTranscriptRows = (input: {
  toolName: HelixLiveEnvironmentToolName;
  runs: StagePlayMicroReasonerRunV1[];
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return input.runs.slice(0, 12).map((run) => ({
    rowId: `micro_reasoner_run:${hashShort([run.runId, run.role])}`,
    rowKind: "micro_reasoner_run",
    title: microReasonerTranscriptTitle(run.role),
    body: [
      `Role: ${run.role}.`,
      run.selectedDecision ? `Decision: ${run.selectedDecision}.` : null,
      run.salienceLevel ? `Salience: ${run.salienceLevel}${run.voiceCandidate ? " / voice candidate" : ""}.` : null,
      run.recommendedNextTool ? `Next tool: ${run.recommendedNextTool}.` : null,
      run.confidence ? `Confidence: ${run.confidence}.` : null,
      `Mode: ${run.reasoningMode ?? "micro_live_interval"}; model ${run.modelUsed ?? "deterministic"}; latency ${run.latencyMs ?? 0}ms.`,
      run.outputPreview ? `Output: ${clipText(run.outputPreview, 220)}` : null,
      run.missingEvidence && run.missingEvidence.length > 0
        ? `Missing evidence: ${run.missingEvidence.join("; ")}.`
        : null,
    ].filter(Boolean).join("\n"),
    source: {
      toolName: input.toolName,
      artifactId: run.runId,
      artifactKind: run.artifactId,
    },
    evidenceRefs: uniqueStrings([run.runId, ...run.inputRefs, ...run.outputRefs]),
    causalTrace: run.causalTrace,
    authority: "tool_evidence",
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  }));
};

const buildProcessedMailTranscriptRows = (input: {
  toolName: HelixLiveEnvironmentToolName;
  packets: StagePlayProcessedMailPacketV1[];
  missingRawMailIds: string[];
  mailboxThreadId: string;
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
  microReasonerRunRefs: string[];
  resolutionStateSummary: string;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const packetRefs = input.packets.map((packet) => packet.packetId);
  const evidenceRefs = uniqueStrings([
    input.mailboxThreadId,
    ...packetRefs,
    ...input.missingRawMailIds,
    ...input.microReasonerRunRefs,
    ...input.packets.flatMap((packet) => packet.evidenceRefs),
  ]);
  const rows: AskTurnTranscriptRowDraftV1[] = [{
    rowId: `processed_mail_read:${hashShort([
      input.toolName,
      input.mailboxThreadId,
      packetRefs,
      input.missingRawMailIds,
    ])}`,
    rowKind: "processed_mail_read",
    title: "Processed mail read",
    body: input.packets.length > 0
      ? [
          `Read ${input.packets.length} processed live-source packet${input.packets.length === 1 ? "" : "s"}.`,
          input.missingRawMailIds.length > 0
            ? `${input.missingRawMailIds.length} raw mail item${input.missingRawMailIds.length === 1 ? "" : "s"} still need processing.`
            : "All selected raw mail has processed packet coverage.",
          input.resolutionStateSummary,
        ].join("\n")
      : [
          "No processed live-source packets are available yet.",
          input.missingRawMailIds.length > 0
            ? `Fallback: run live_env.process_live_source_mail for ${input.missingRawMailIds.length} raw mail item${input.missingRawMailIds.length === 1 ? "" : "s"}.`
            : "No raw mail fallback was identified.",
        ].join("\n"),
    source: {
      toolName: input.toolName,
      artifactKind: "stage_play_processed_live_source_mail_read_result",
    },
    evidenceRefs,
    authority: "tool_evidence",
    assistantAnswer: false,
    terminalEligible: false,
    createdAt,
  }];
  for (const packet of input.packets.slice(0, 6)) {
    const observedPreview = clipText([
      ...packet.observedFacts,
      ...packet.changedFacts.map((fact) => `Changed: ${fact}`),
    ].join(" "), 260);
    rows.push({
      rowId: `processed_mail_packet:${hashShort(packet.packetId)}`,
      rowKind: "processed_mail_packet",
      title: "Processed packet",
      body: [
        `Recommended: ${packet.recommendedNext}.`,
        `Salience: ${packet.salience.level}${packet.salience.voiceCandidate ? " / voice candidate" : ""}.`,
        `Mail coverage: ${packet.mailIds.length} mail item${packet.mailIds.length === 1 ? "" : "s"}.`,
        packet.salience.reasons.length > 0 ? `Reason: ${packet.salience.reasons.join("; ")}.` : null,
        observedPreview ? `Preview: ${observedPreview}` : null,
      ].filter(Boolean).join("\n"),
      source: {
        toolName: input.toolName,
        artifactId: packet.packetId,
        artifactKind: packet.artifactId,
      },
      evidenceRefs: uniqueStrings([packet.packetId, ...packet.mailIds, ...packet.evidenceRefs]),
      causalTrace: packet.causalTrace,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    });
  }
  rows.push(...buildMicroReasonerTranscriptRows({
    toolName: input.toolName,
    runs: input.microReasonerRuns ?? [],
    createdAt,
  }));
  return rows;
};

const wordsFromText = (value: string): string[] =>
  Array.from(new Set(value.toLowerCase().match(/\b[a-z0-9][a-z0-9-]{2,}\b/g) ?? []))
    .filter((word) => !new Set([
      "the", "and", "for", "with", "that", "this", "from", "into", "visual", "source", "summary",
      "mail", "latest", "shows", "showing", "appears", "near", "should", "next",
    ]).has(word));

const salienceHintFromText = (value: string): "low" | "medium" | "high" | "urgent" => {
  if (/\b(?:urgent|danger|dangerous|hostile|attack|attacking|fire|crash|blocked|failure|failed|security|risk)\b/i.test(value)) {
    return "urgent";
  }
  if (/\b(?:warning|changed|change|new|unexpected|error|missing|stale|recovered|important|salient)\b/i.test(value)) {
    return "high";
  }
  if (/\b(?:opened|closed|moved|selected|switched|visible|active|player|mob|document|browser|tab)\b/i.test(value)) {
    return "medium";
  }
  return "low";
};

const watchTargetsFromText = (value: string): string[] => {
  const targets = Array.from(new Set(
    Array.from(value.matchAll(/\b(?:window|screen|tab|menu|button|icon|app|grid|player|mob|document|editor|browser|error|warning|scene|source|content|audio|transcript)\b/gi))
      .map((match) => match[0].toLowerCase()),
  ));
  return targets.length > 0 ? targets.slice(0, 6) : ["next compact source summary"];
};

const resolvePredictionMailItems = (args: Record<string, unknown>, input: ExecuteLiveEnvironmentToolInput): StagePlayLiveSourceMailItemV1[] => {
  const requestedMailIds = readStringArray(args.mail_ids ?? args.mailIds);
  const explicitSourceId = readString(args.source_id) ?? readString(args.sourceId);
  const roomId = readString(args.room_id) ?? readString(args.roomId);
  const environmentId = readString(args.environment_id) ?? readString(args.environmentId) ?? input.environment_id ?? null;
  const limit = Math.max(1, Math.min(readNumber(args.limit, 3), 8));
  const byId = requestedMailIds
    .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
    .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item))
    .filter((item) => item.threadId === input.thread_id);
  if (byId.length > 0) return byId.slice(-limit);
  return listStagePlayLiveSourceMailItems({
    threadId: input.thread_id,
    roomId,
    environmentId,
    sourceId: explicitSourceId,
    limit,
  });
};

const resolveLatestNarrativeState = (args: Record<string, unknown>, input: ExecuteLiveEnvironmentToolInput) => {
  const narrativeStateId = readString(args.narrative_state_id) ?? readString(args.narrativeStateId);
  if (narrativeStateId) return getStagePlayLiveSourceNarrativeState(narrativeStateId);
  return getLatestStagePlayLiveSourceNarrativeState({
    threadId: input.thread_id,
    roomId: readString(args.room_id) ?? readString(args.roomId),
    environmentId: readString(args.environment_id) ?? readString(args.environmentId) ?? input.environment_id ?? null,
    sourceId: readString(args.source_id) ?? readString(args.sourceId),
  });
};

const resolveLatestImmersionState = (args: Record<string, unknown>, input: ExecuteLiveEnvironmentToolInput) => {
  const immersionStateId = readString(args.immersion_state_id) ?? readString(args.immersionStateId);
  if (immersionStateId) return getStagePlayLiveSourceImmersionState(immersionStateId);
  return getLatestStagePlayLiveSourceImmersionState({
    threadId: input.thread_id,
    roomId: readString(args.room_id) ?? readString(args.roomId),
    environmentId: readString(args.environment_id) ?? readString(args.environmentId) ?? input.environment_id ?? null,
    jobId: readString(args.job_id) ?? readString(args.jobId),
    policyId: readString(args.policy_id) ?? readString(args.policyId),
    profileId: readString(args.profile_id) ?? readString(args.profileId),
    sourceId: readString(args.source_id) ?? readString(args.sourceId),
  });
};

const resolveLiveSourceToolScope = (input: {
  args: Record<string, unknown>;
  threadId: string;
  effectiveThreadId: string;
  roomId?: string | null;
  environmentThreadId?: string | null;
  environmentId?: string | null;
  explicitSourceId?: string | null;
}) => {
  const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
    askThreadId: input.threadId,
    requestedThreadId: input.effectiveThreadId,
    uiThreadId: readString(input.args.ui_thread_id) ?? readString(input.args.uiThreadId),
    environmentThreadId: input.environmentThreadId ?? null,
    explicitMailboxThreadId:
      readString(input.args.mailbox_thread_id) ??
      readString(input.args.mailboxThreadId) ??
      readString(input.args.thread_id) ??
      readString(input.args.threadId),
    mailIds: readStringArray(input.args.mail_ids ?? input.args.mailIds),
  });
  const scopedInput: ExecuteLiveEnvironmentToolInput = {
    thread_id: mailboxThreadResolution.mailboxThreadId,
    environment_id: input.environmentId ?? null,
    tool_name: "live_env.read_live_source_mail",
    args: input.args,
  };
  const sourceId = readString(input.args.source_id) ?? readString(input.args.sourceId) ?? input.explicitSourceId ?? null;
  const sourceKind = readString(input.args.source_kind) ?? readString(input.args.sourceKind);
  return {
    mailboxThreadResolution,
    scopedInput,
    sourceId,
    sourceKind,
  };
};

const resolveImmersionMailItems = (input: {
  args: Record<string, unknown>;
  scopedInput: ExecuteLiveEnvironmentToolInput;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  defaultLimit?: number;
}): StagePlayLiveSourceMailItemV1[] => {
  const requestedMailIds = readStringArray(input.args.mail_ids ?? input.args.mailIds);
  const limit = Math.max(1, Math.min(readNumber(input.args.limit, input.defaultLimit ?? 12), 24));
  const byId = requestedMailIds
    .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
    .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item))
    .filter((item) => item.threadId === input.scopedInput.thread_id)
    .slice(-limit);
  if (byId.length > 0) return byId;
  const unread = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.scopedInput.thread_id,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? input.scopedInput.environment_id ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    includeDelivered: true,
    limit,
  });
  if (unread.length > 0) return unread;
  return listStagePlayLiveSourceMailItems({
    threadId: input.scopedInput.thread_id,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? input.scopedInput.environment_id ?? null,
    sourceId: input.sourceId ?? null,
    sourceKind: input.sourceKind ?? null,
    limit,
  });
};

const resolveActiveWatchJobAndPolicy = (input: {
  args: Record<string, unknown>;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
}) => {
  const explicitJobId = readString(input.args.job_id) ?? readString(input.args.jobId);
  const explicitPolicyId = readString(input.args.policy_id) ?? readString(input.args.policyId);
  const jobStates = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 50,
  });
  const policies = listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 50,
  });
  const activeJob =
    (explicitJobId ? jobStates.find((state) => state.jobId === explicitJobId) : null) ??
    jobStates.find((state) =>
      (state.status === "armed" || state.status === "checking" || state.status === "blocked") &&
      (!input.sourceId || state.sourceIds.includes(input.sourceId))
    ) ??
    jobStates.at(-1) ??
    null;
  const activePolicy =
    (explicitPolicyId ? policies.find((policy) => policy.policyId === explicitPolicyId) : null) ??
    (activeJob?.watchJobPolicyRef ? policies.find((policy) => policy.policyId === activeJob.watchJobPolicyRef) : null) ??
    policies.find((policy) => policy.status === "armed" && (!input.sourceId || policy.sourceIds.includes(input.sourceId))) ??
    policies.find((policy) => policy.status === "armed") ??
    policies.at(-1) ??
    null;
  const jobId =
    explicitJobId ??
    activeJob?.jobId ??
    activePolicy?.jobId ??
    `stage_play_live_source_job:${hashShort([input.threadId, input.roomId ?? null, input.environmentId ?? null, input.sourceId ?? "all_sources"])}`;
  return {
    activeJob,
    activePolicy,
    jobId,
    policies,
    jobStates,
  };
};

const resolveActiveInterpreterProfile = (input: {
  args: Record<string, unknown>;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceKind?: string | null;
}): StagePlayLiveSourceInterpreterProfileV1 | null => {
  const explicitProfileId = readString(input.args.profile_id) ?? readString(input.args.profileId);
  if (explicitProfileId) return getStagePlayLiveSourceInterpreterProfile(explicitProfileId);
  return getActiveInterpreterProfileForJob({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    policyId: input.policyId ?? null,
    sourceKind: input.sourceKind ?? null,
  }) ?? listStagePlayLiveSourceInterpreterProfiles({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    status: "active",
    limit: 1,
  }).at(-1) ?? null;
};

const buildImmersionPrediction = (input: {
  args: Record<string, unknown>;
  jobId: string;
  mailItems: StagePlayLiveSourceMailItemV1[];
  delta: ReturnType<typeof extractStagePlayLiveSourceDelta>;
}): NonNullable<StagePlayLiveSourceImmersionStateV1["prediction"]> => {
  const explicitText = readString(input.args.prediction_text) ?? readString(input.args.predictionText);
  const latestPreview = clipText(input.mailItems.at(-1)?.summary.text ?? input.mailItems.at(-1)?.summary.preview, 180);
  const watchTargets = readStringArray(input.args.watch_targets ?? input.args.watchTargets);
  const validationSignals = readStringArray(input.args.validation_signals ?? input.args.validationSignals);
  const predictionText = explicitText ??
    (input.delta.watchTargets.length > 0
      ? `Watch whether ${input.delta.watchTargets.slice(0, 3).join(", ")} changes in the next live-source window.`
      : latestPreview
        ? `Watch whether the current scene remains consistent with: ${latestPreview}`
        : "Watch the next compact source update for scene, activity, or salience changes.");
  return {
    predictionId: `stage_play_live_source_prediction:${hashShort([
      input.jobId,
      input.mailItems.map((item) => item.mailId),
      predictionText,
    ])}`,
    text: predictionText,
    horizonMs: Math.max(1_000, Math.min(readNumber(input.args.horizon_ms ?? input.args.horizonMs, 10_000), 300_000)),
    watchTargets: watchTargets.length > 0 ? watchTargets : input.delta.watchTargets,
    validationSignals: validationSignals.length > 0
      ? validationSignals
      : uniqueStrings([
          ...input.delta.watchTargets,
          ...input.delta.changedFacts,
          input.delta.currentActivity,
          input.delta.salience.level,
        ]),
    confidence: Math.max(0, Math.min(readNumber(input.args.prediction_confidence ?? input.args.predictionConfidence, 0.48), 1)),
  };
};

const buildImmediateLiveSourcePrediction = (input: {
  mailItems: StagePlayLiveSourceMailItemV1[];
  narrativeState: ReturnType<typeof getStagePlayLiveSourceNarrativeState>;
  policy?: StagePlayLiveSourceWatchJobPolicyV1 | null;
}) => {
  const latestSummary = clipText(input.mailItems.at(-1)?.summary.text ?? input.narrativeState?.currentSceneSummary ?? "", 360);
  const watchTargets = watchTargetsFromText([
    latestSummary,
    input.narrativeState?.watchNext.targets.join(" ") ?? "",
    input.policy?.importanceCriteria.join(" ") ?? "",
  ].join(" "));
  const salienceHint = salienceHintFromText([
    latestSummary,
    input.narrativeState?.meaningfulChanges.join(" ") ?? "",
    input.policy?.importanceCriteria.join(" ") ?? "",
  ].join(" "));
  const expectedChanges = [
    latestSummary
      ? `Next mail may confirm whether this remains stable: ${latestSummary}`
      : "Next mail may establish the first compact live-source state.",
    "A changed active window, visible warning, or new source content would invalidate the current projection.",
  ];
  const validationSignals = [
    "next mail summary repeats the same key objects",
    "next mail summary reports a changed active scene, warning, or new content",
    ...watchTargets.slice(0, 3).map((target) => `watch target changed: ${target}`),
  ];
  return {
    predictionHorizon: "next_mail" as const,
    expectedChanges,
    watchTargets,
    validationSignals,
    salienceHint,
  };
};

const compareLiveSourcePrediction = (input: {
  mailItems: StagePlayLiveSourceMailItemV1[];
  narrativeState: ReturnType<typeof getStagePlayLiveSourceNarrativeState>;
}) => {
  const latestSummary = input.mailItems.at(-1)?.summary.text ?? "";
  const priorText = input.narrativeState?.prediction?.text ?? input.narrativeState?.watchNext.reason ?? "";
  if (!priorText) {
    return {
      result: "no_prior_prediction" as const,
      meaningfulDifferences: latestSummary ? [`No prior prediction was available; latest mail says: ${clipText(latestSummary)}`] : [],
    };
  }
  const latestWords = new Set(wordsFromText(latestSummary));
  const priorWords = wordsFromText(priorText);
  const overlap = priorWords.filter((word) => latestWords.has(word));
  const meaningfulDifferences = wordsFromText(latestSummary)
    .filter((word) => !new Set(priorWords).has(word))
    .slice(0, 8)
    .map((word) => `new signal: ${word}`);
  const result = overlap.length >= Math.min(2, Math.max(1, priorWords.length))
    ? "supported"
    : meaningfulDifferences.length >= 3
      ? "contradicted"
      : "unresolved";
  return { result, meaningfulDifferences };
};

const evidenceRefsFrom = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return readStringArray(record.evidence_refs);
};

const readCheckpointRequestReason = (value: unknown): StagePlayCheckpointRequestReasonV1 | null => {
  const raw = readString(value);
  if (
    raw === "first_usable_observation" ||
    raw === "meaningful_perturbation" ||
    raw === "prediction_horizon_expired" ||
    raw === "prediction_validation_needed" ||
    raw === "user_requested_checkpoint" ||
    raw === "missing_evidence_resolved"
  ) {
    return raw;
  }
  return null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((entry): entry is string => Boolean(entry))));

const summarizeGoalContextAuthority = (input: {
  updates: WorkstationGoalContextUpdateV1[];
  sessions: AgentGoalSessionV1[];
}) => {
  const dispatchActions = input.updates.flatMap((update) => update.suggestedDispatch);
  const dispatchCounts = new Map<string, number>();
  for (const action of dispatchActions) {
    dispatchCounts.set(action.kind, (dispatchCounts.get(action.kind) ?? 0) + 1);
  }
  const activeSessions = input.sessions.filter((session) =>
    session.status === "active" ||
    session.status === "blocked" ||
    session.status === "paused"
  );
  const allowedActuators = uniqueStrings(activeSessions.flatMap((session) => session.allowedActuators));
  const observationOnlyCount = input.updates.filter((update) =>
    update.authority.assistantAnswer === false &&
    update.authority.terminalEligible === false &&
    update.authority.rawContentIncluded === false
  ).length;
  const terminalAuthoritySessionCount = activeSessions.filter((session) =>
    session.authority.finalReportsRequireTerminalAuthority === true
  ).length;
  const dispatchCountsObject = Object.fromEntries(Array.from(dispatchCounts.entries()).sort(([left], [right]) => left.localeCompare(right)));
  const assistantAnswerCount = input.updates.filter((update) => update.authority.assistantAnswer !== false).length;
  const terminalEligibleCount = input.updates.filter((update) => update.authority.terminalEligible !== false).length;
  const rawContentIncludedCount = input.updates.filter((update) => update.authority.rawContentIncluded !== false).length;
  const postToolModelStepRequiredCount = input.updates.filter((update) => update.authority.postToolModelStepRequired === true).length;
  const narratorDispatchCount = (dispatchCounts.get("speak_narrator") ?? 0) + (dispatchCounts.get("bind_narrator_stream") ?? 0);
  const runningLoopDispatchCount = dispatchActions.filter((action) =>
    action.kind === "set_loop_state" && action.state === "running"
  ).length;
  return {
    schema: "helix.workstation_goal_context_authority_summary.v1",
    updateCount: input.updates.length,
    update_count: input.updates.length,
    observationOnlyUpdateCount: observationOnlyCount,
    observation_only_update_count: observationOnlyCount,
    assistantAnswerCount,
    assistant_answer_count: assistantAnswerCount,
    terminalEligibleCount,
    terminal_eligible_count: terminalEligibleCount,
    rawContentIncludedCount,
    raw_content_included_count: rawContentIncludedCount,
    postToolModelStepRequiredCount,
    post_tool_model_step_required_count: postToolModelStepRequiredCount,
    activeGoalSessionCount: activeSessions.length,
    active_goal_session_count: activeSessions.length,
    finalReportsRequireTerminalAuthorityCount: terminalAuthoritySessionCount,
    final_reports_require_terminal_authority_count: terminalAuthoritySessionCount,
    dispatchCounts: dispatchCountsObject,
    dispatch_counts: dispatchCountsObject,
    wakeInterruptCount: dispatchCounts.get("wake_agent") ?? 0,
    wake_interrupt_count: dispatchCounts.get("wake_agent") ?? 0,
    narratorDispatchCount,
    narrator_dispatch_count: narratorDispatchCount,
    runningLoopDispatchCount,
    running_loop_dispatch_count: runningLoopDispatchCount,
    allowedActuators,
    allowed_actuators: allowedActuators,
    answerAuthority: "completed_solver_path_required",
    answer_authority: "completed_solver_path_required",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    post_tool_model_step_required: true,
  };
};

const appendAgentGoalSessionCheckpoint = (input: {
  session: AgentGoalSessionV1 | null;
  threadId: string;
  roomId?: string | null;
  sourceRefs?: string[];
  loopRefs?: string[];
  evidenceRefs: string[];
  actionsTaken: string[];
  summary: string;
  nextStep?: AgentGoalSessionV1["checkpoints"][number]["nextStep"];
}): AgentGoalSessionV1 | null => {
  if (!input.session) return null;
  return ensureStagePlayAgentGoalSession({
    threadId: input.threadId,
    roomId: input.roomId ?? input.session.roomId ?? null,
    objectiveId: input.session.goalId,
    objectiveText: input.session.objective,
    sourceRefs: uniqueStrings([
      ...input.session.sourceRefs,
      ...(input.sourceRefs ?? []),
    ]),
    loopRefs: uniqueStrings([
      ...input.session.loopRefs,
      ...(input.loopRefs ?? []),
    ]),
    constructRefs: input.session.constructRefs,
    contextFeeds: input.session.contextFeeds,
    allowedActuators: input.session.allowedActuators,
    cadence: input.session.cadence,
    stopConditions: input.session.stopConditions,
    checkpoint: {
      summary: input.summary,
      evidenceRefs: input.evidenceRefs,
      actionsTaken: input.actionsTaken,
      nextStep: input.nextStep ?? "continue",
    },
  });
};

const compactGoalContextPreview = (value: string, limit = 260): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const goalContextFreshnessStatus = (
  value: string | null | undefined,
): "fresh" | "stale" | "blocked" | "unknown" => {
  if (value === "fresh" || value === "active" || value === "good") return "fresh";
  if (value === "stale") return "stale";
  if (
    value === "blocked" ||
    value === "configured_missing" ||
    value === "permission_required" ||
    value === "error" ||
    value === "stopped" ||
    value === "insufficient"
  ) return "blocked";
  return "unknown";
};

const recordLiveEnvironmentGoalContextUpdate = (input: {
  threadId: string;
  mailboxThreadId?: string | null;
  roomId?: string | null;
  producerKind: GoalContextProducerKindV1;
  updateKind: GoalContextUpdateKindV1;
  contentRef: string;
  preview: string;
  sourceRefs?: string[];
  loopRefs?: string[];
  evidenceRefs?: string[];
  receiptRefs?: string[];
  observedAtMs?: number | null;
  staleAfterMs?: number | null;
  freshnessStatus?: "fresh" | "stale" | "blocked" | "unknown";
  goalId?: string | null;
  goalRelevanceReason?: string | null;
  suggestedDispatch?: WorkstationDispatchActionV1[];
}): string => {
  const nowMs = Date.now();
  const mailboxThreadId = input.mailboxThreadId ?? input.threadId;
  const receiptRefs = uniqueStrings(input.receiptRefs ?? [input.contentRef]);
  const evidenceRefs = uniqueStrings([input.contentRef, ...(input.evidenceRefs ?? []), ...receiptRefs]);
  const dispatch: WorkstationDispatchActionV1[] = input.suggestedDispatch ?? [
    { kind: "log_receipt", receiptRef: receiptRefs[0] ?? input.contentRef },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
  ];
  const update = recordStagePlayGoalContextUpdate({
    schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
    updateId: `stage_play_goal_context_update:${input.producerKind}:${hashShort([
      mailboxThreadId,
      input.contentRef,
      nowMs,
    ], 18)}`,
    createdAtMs: nowMs,
    sourceRefs: uniqueStrings(input.sourceRefs ?? []),
    loopRefs: uniqueStrings([
      `thread:${mailboxThreadId}`,
      `stage_play_mail_loop:${mailboxThreadId}`,
      ...(input.loopRefs ?? []),
    ]),
    producerKind: input.producerKind,
    updateKind: input.updateKind,
    contentRef: input.contentRef,
    preview: compactGoalContextPreview(input.preview || "Live environment query produced goal-context evidence."),
    evidenceRefs: evidenceRefs.slice(0, 80),
    receiptRefs: receiptRefs.slice(0, 80),
    freshness: {
      observedAtMs: input.observedAtMs ?? nowMs,
      staleAfterMs: input.staleAfterMs ?? 60_000,
      status: input.freshnessStatus ?? "unknown",
    },
    goalRelevance: input.goalId
      ? {
          goalId: input.goalId,
          relevance: 0.7,
          reason: input.goalRelevanceReason ?? "Live environment query contributes to the active workstation goal.",
        }
      : null,
    suggestedDispatch: dispatch,
    authority: {
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    },
  });
  return update.updateId;
};

type WorkstationContextFeedQuerySpec = {
  feedKind: AgentGoalContextFeedKindV1;
  actuator: AgentGoalActuatorV1;
  label: string;
  producerKinds: GoalContextProducerKindV1[];
  updateKinds: GoalContextUpdateKindV1[];
};

const WORKSTATION_CONTEXT_FEED_QUERY_SPECS: Partial<Record<HelixLiveEnvironmentToolName, WorkstationContextFeedQuerySpec>> = {
  "live_env.query_visual_summaries": {
    feedKind: "visual_summaries",
    actuator: "query_visual_summaries",
    label: "visual summaries",
    producerKinds: ["visual_capture"],
    updateKinds: ["visual_observation", "classification", "summary"],
  },
  "live_env.query_audio_transcripts": {
    feedKind: "audio_transcripts",
    actuator: "query_audio_transcripts",
    label: "audio transcripts",
    producerKinds: ["audio_capture", "transcription_loop"],
    updateKinds: ["transcript_window"],
  },
  "live_env.query_translation_segments": {
    feedKind: "translated_transcripts",
    actuator: "query_translation_segments",
    label: "translation segments",
    producerKinds: ["translation_loop"],
    updateKinds: ["translated_transcript"],
  },
  "live_env.query_microdeck_outputs": {
    feedKind: "microdeck_outputs",
    actuator: "query_microdeck_outputs",
    label: "MicroDeck outputs",
    producerKinds: ["microdeck"],
    updateKinds: ["summary", "visual_observation", "classification", "translated_transcript", "route_evidence", "reflection"],
  },
  "live_env.query_live_answer_state": {
    feedKind: "live_answer_lines",
    actuator: "query_live_answer_state",
    label: "Live Answer state",
    producerKinds: ["live_answer"],
    updateKinds: ["summary", "preset_state", "source_status", "route_evidence"],
  },
  "live_env.query_route_evidence": {
    feedKind: "route_evidence",
    actuator: "query_route_evidence",
    label: "route evidence",
    producerKinds: ["route_watch", "automation"],
    updateKinds: ["route_evidence", "suggested_action", "source_status", "automation_status"],
  },
  "live_env.query_automation_policies": {
    feedKind: "automation_policies",
    actuator: "query_automation_policies",
    label: "automation policies",
    producerKinds: ["automation", "route_watch"],
    updateKinds: ["automation_status"],
  },
};

const readWorkstationContextFeedQuerySpec = (
  toolName: HelixLiveEnvironmentToolName,
): WorkstationContextFeedQuerySpec | null => WORKSTATION_CONTEXT_FEED_QUERY_SPECS[toolName] ?? null;

const goalSessionFeedAllowed = (
  session: AgentGoalSessionV1 | null,
  feedKind: WorkstationContextFeedQuerySpec["feedKind"],
): boolean => Boolean(session?.contextFeeds.some((feed) => feed.sourceKind === feedKind));

const goalSessionActuatorAllowed = (
  session: AgentGoalSessionV1 | null,
  actuator: AgentGoalActuatorV1,
): boolean => Boolean(session?.allowedActuators.includes(actuator));

type WorkstationControlSpec = {
  controlKind:
    | "change_preset"
    | "bind_source"
    | "unbind_source"
    | "set_loop_state"
    | "repair_source"
    | "update_live_answer"
    | "focus_process_graph";
  label: string;
  defaultPanelId: string;
};

const WORKSTATION_CONTROL_SPECS: Partial<Record<HelixLiveEnvironmentToolName, WorkstationControlSpec>> = {
  "live_env.change_workstation_preset": {
    controlKind: "change_preset",
    label: "change workstation preset",
    defaultPanelId: "stage-play-badge-graph",
  },
  "live_env.bind_workstation_source": {
    controlKind: "bind_source",
    label: "bind workstation source",
    defaultPanelId: "live-answer-environment",
  },
  "live_env.unbind_workstation_source": {
    controlKind: "unbind_source",
    label: "unbind workstation source",
    defaultPanelId: "live-answer-environment",
  },
  "live_env.set_workstation_loop_state": {
    controlKind: "set_loop_state",
    label: "set workstation loop state",
    defaultPanelId: "stage-play-badge-graph",
  },
  "live_env.repair_workstation_source": {
    controlKind: "repair_source",
    label: "repair workstation source",
    defaultPanelId: "stage-play-badge-graph",
  },
  "live_env.update_live_answer_projection": {
    controlKind: "update_live_answer",
    label: "update Live Answer projection",
    defaultPanelId: "live-answer-environment",
  },
  "live_env.focus_process_graph": {
    controlKind: "focus_process_graph",
    label: "focus process graph",
    defaultPanelId: "stage-play-badge-graph",
  },
};

const readWorkstationControlSpec = (
  toolName: HelixLiveEnvironmentToolName,
): WorkstationControlSpec | null => WORKSTATION_CONTROL_SPECS[toolName] ?? null;

const workstationControlActuator = (
  spec: WorkstationControlSpec,
  loopState: "paused" | "running" | "repaired" | null,
): AgentGoalActuatorV1 => {
  if (spec.controlKind !== "set_loop_state") return spec.controlKind;
  if (loopState === "paused") return "pause_loop";
  if (loopState === "running") return "resume_loop";
  if (loopState === "repaired") return "repair_source";
  return "set_loop_state";
};

const workstationControlFallbackActuator = (
  spec: WorkstationControlSpec,
  actuator: AgentGoalActuatorV1,
): AgentGoalActuatorV1 | null =>
  spec.controlKind === "set_loop_state" && actuator !== "set_loop_state" ? "set_loop_state" : null;

const workstationControlProducerKind = (
  spec: WorkstationControlSpec,
): GoalContextProducerKindV1 =>
  spec.controlKind === "update_live_answer" ? "live_answer" : "route_watch";

const workstationControlUpdateKind = (
  spec: WorkstationControlSpec,
): GoalContextUpdateKindV1 =>
  spec.controlKind === "update_live_answer" ? "summary" : "suggested_action";

const filterDeniedControlDispatch = (
  dispatch: WorkstationDispatchActionV1[],
  spec: WorkstationControlSpec,
): WorkstationDispatchActionV1[] =>
  dispatch.filter((action) => {
    if (action.kind === spec.controlKind) return false;
    if (spec.controlKind === "set_loop_state" && action.kind === "repair_loop") return false;
    if (spec.controlKind === "repair_source" && action.kind === "repair_loop") return false;
    return true;
  });

const normalizeLoopState = (value: unknown): "paused" | "running" | "repaired" => {
  const normalized = readString(value)?.toLowerCase();
  if (normalized === "pause" || normalized === "paused") return "paused";
  if (normalized === "resume" || normalized === "run" || normalized === "running") return "running";
  if (normalized === "repair" || normalized === "repaired") return "repaired";
  return "running";
};

const buildWorkstationControlDispatch = (input: {
  spec: WorkstationControlSpec;
  args: Record<string, unknown>;
}): {
  dispatch: WorkstationDispatchActionV1[];
  targetRef: string | null;
  sourceRef: string | null;
  presetId: string | null;
  loopRef: string | null;
  lineKey: string | null;
  panelId: string;
  nodeRef: string | null;
  loopState: "paused" | "running" | "repaired" | null;
} => {
  const targetRef =
    readString(input.args.target_ref) ??
    readString(input.args.targetRef) ??
    readString(input.args.target_id) ??
    readString(input.args.targetId) ??
    readString(input.args.panel_id) ??
    readString(input.args.panelId);
  const sourceRef =
    readString(input.args.source_ref) ??
    readString(input.args.sourceRef) ??
    readString(input.args.source_id) ??
    readString(input.args.sourceId);
  const presetId =
    readString(input.args.preset_id) ??
    readString(input.args.presetId) ??
    readString(input.args.preset);
  const loopRef =
    readString(input.args.loop_ref) ??
    readString(input.args.loopRef) ??
    readString(input.args.loop_id) ??
    readString(input.args.loopId);
  const lineKey =
    readString(input.args.line_key) ??
    readString(input.args.lineKey) ??
    readString(input.args.live_answer_line_key) ??
    readString(input.args.liveAnswerLineKey);
  const panelId =
    readString(input.args.panel_id) ??
    readString(input.args.panelId) ??
    input.spec.defaultPanelId;
  const nodeRef =
    readString(input.args.node_ref) ??
    readString(input.args.nodeRef) ??
    readString(input.args.node_id) ??
    readString(input.args.nodeId);
  const loopState = input.spec.controlKind === "repair_source"
    ? "repaired"
    : input.spec.controlKind === "set_loop_state"
      ? normalizeLoopState(input.args.state ?? input.args.loop_state ?? input.args.loopState)
      : null;
  const dispatch: WorkstationDispatchActionV1[] = [{ kind: "log_receipt" }, { kind: "update_panel", panelId }];
  if (input.spec.controlKind === "change_preset" && targetRef && presetId) {
    dispatch.push({ kind: "change_preset", targetRef, presetId });
  }
  if (input.spec.controlKind === "bind_source" && sourceRef && targetRef) {
    dispatch.push({ kind: "bind_source", sourceRef, targetRef });
  }
  if (input.spec.controlKind === "unbind_source" && sourceRef) {
    dispatch.push({ kind: "unbind_source", sourceRef, targetRef });
  }
  if (input.spec.controlKind === "set_loop_state" && loopRef && loopState) {
    dispatch.push({ kind: "set_loop_state", loopRef, state: loopState });
    if (loopState === "repaired") dispatch.push({ kind: "repair_loop", loopRef });
  }
  if (input.spec.controlKind === "repair_source" && loopRef) {
    dispatch.push({ kind: "set_loop_state", loopRef, state: "repaired" });
    dispatch.push({ kind: "repair_loop", loopRef });
  }
  if (input.spec.controlKind === "update_live_answer" && lineKey) {
    dispatch.push({ kind: "update_live_answer", lineKey });
  }
  if (input.spec.controlKind === "focus_process_graph") {
    dispatch.push({ kind: "focus_process_graph", nodeRef });
  }
  return {
    dispatch,
    targetRef,
    sourceRef,
    presetId,
    loopRef,
    lineKey,
    panelId,
    nodeRef,
    loopState,
  };
};

const missingWorkstationControlRequirements = (input: {
  spec: WorkstationControlSpec;
  targetRef: string | null;
  sourceRef: string | null;
  presetId: string | null;
  loopRef: string | null;
  lineKey: string | null;
}): string[] => {
  switch (input.spec.controlKind) {
    case "change_preset":
      return [
        ...(input.targetRef ? [] : ["target_ref"]),
        ...(input.presetId ? [] : ["preset_id"]),
      ];
    case "bind_source":
      return [
        ...(input.sourceRef ? [] : ["source_ref"]),
        ...(input.targetRef ? [] : ["target_ref"]),
      ];
    case "unbind_source":
      return input.sourceRef ? [] : ["source_ref"];
    case "set_loop_state":
      return input.loopRef ? [] : ["loop_ref"];
    case "repair_source":
      return input.loopRef ? [] : ["loop_ref"];
    case "update_live_answer":
      return input.lineKey ? [] : ["line_key"];
    case "focus_process_graph":
      return [];
    default:
      return [];
  }
};

type NarratorControlKind = "say" | "bind_stream";

const NARRATOR_SOURCE_KINDS = new Set([
  "helix_console",
  "live_answer",
  "situation_room",
  "docs_viewer",
  "image_lens",
  "workstation_panel",
]);

const NARRATOR_DELIVERY_MODES = new Set([
  "visible_only",
  "confirm_to_speak",
  "auto_speak",
]);

const NARRATOR_STREAM_KINDS = new Set([
  "transcript_stream",
  "translated_transcript",
  "translated_speech",
  "typed_commentary",
  "route_evidence",
  "source_health_status",
]);

const normalizeNarratorSourceKind = (value: unknown): string => {
  const raw = readString(value);
  return raw && NARRATOR_SOURCE_KINDS.has(raw) ? raw : "helix_console";
};

const normalizeNarratorDeliveryMode = (value: unknown, fallback: "visible_only" | "confirm_to_speak" | "auto_speak"): "visible_only" | "confirm_to_speak" | "auto_speak" => {
  const raw = readString(value);
  if (raw === "hidden") return "visible_only";
  return raw && NARRATOR_DELIVERY_MODES.has(raw) ? raw as "visible_only" | "confirm_to_speak" | "auto_speak" : fallback;
};

const normalizeNarratorStreamKind = (value: unknown): string | null => {
  const raw = readString(value);
  return raw && NARRATOR_STREAM_KINDS.has(raw) ? raw : null;
};

const narratorRequestPriority = (value: unknown): "low" | "normal" | "high" => {
  const raw = readString(value);
  return raw === "low" || raw === "normal" || raw === "high" ? raw : "normal";
};

const narratorVoicePolicy = (value: unknown): "muted" | "propose_only" | "confirm_speak_required" | "automatic_when_policy_allows" => {
  const raw = readString(value);
  if (
    raw === "muted" ||
    raw === "propose_only" ||
    raw === "confirm_speak_required" ||
    raw === "automatic_when_policy_allows"
  ) return raw;
  return "confirm_speak_required";
};

const buildNarratorDispatch = (input: {
  kind: NarratorControlKind;
  receiptRef: string;
  sourceRef: string;
  streamKind?: string | null;
  deliveryMode: "visible_only" | "confirm_to_speak" | "auto_speak";
}): WorkstationDispatchActionV1[] => [
  { kind: "log_receipt", receiptRef: input.receiptRef },
  { kind: "update_panel", panelId: "narrator" },
  ...(input.kind === "bind_stream" && input.streamKind
    ? [{
        kind: "bind_narrator_stream" as const,
        sourceRef: input.sourceRef,
        streamKind: input.streamKind as "transcript_stream" | "translated_transcript" | "translated_speech" | "typed_commentary" | "route_evidence" | "source_health_status",
        deliveryMode: input.deliveryMode,
      }]
    : []),
  {
    kind: "speak_narrator",
    mode: input.deliveryMode === "auto_speak"
      ? "auto"
      : input.deliveryMode === "confirm_to_speak"
        ? "confirm"
        : "visible_only",
  },
];

const narratorControlActuator = (kind: NarratorControlKind): AgentGoalActuatorV1 =>
  kind === "bind_stream" ? "narrator_bind_stream" : "narrator_say";

const filterDeniedNarratorDispatch = (dispatch: WorkstationDispatchActionV1[]): WorkstationDispatchActionV1[] =>
  dispatch.filter((action) => action.kind !== "speak_narrator" && action.kind !== "bind_narrator_stream");

const processLiveSourceMailItemsForTool = (input: {
  args: Record<string, unknown>;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  mailItems: StagePlayLiveSourceMailItemV1[];
}): {
  activePolicy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  activeProfile: StagePlayLiveSourceInterpreterProfileV1 | null;
  priorImmersionState: StagePlayLiveSourceImmersionStateV1 | null;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: ReturnType<typeof validateStagePlayLiveSourcePredictionFromMail>;
  processedPacket: StagePlayProcessedMailPacketV1;
} | null => {
  if (input.mailItems.length === 0) return null;
  const { activeJob, activePolicy, jobId } = resolveActiveWatchJobAndPolicy({
    args: input.args,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? input.mailItems[0]?.sourceId ?? null,
  });
  const priorImmersionState = getLatestStagePlayLiveSourceImmersionState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId,
    policyId: activePolicy?.policyId ?? null,
    sourceId: input.sourceId ?? input.mailItems[0]?.sourceId ?? null,
  }) ?? null;
  const activeProfile = resolveActiveInterpreterProfile({
    args: input.args,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId,
    policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
    sourceKind: input.sourceKind ?? input.mailItems[0]?.sourceKind ?? null,
  });
  const delta = extractStagePlayLiveSourceDelta({
    latestMailItems: input.mailItems,
    priorImmersionState,
    activeProfile,
  });
  const predictionValidation = validateStagePlayLiveSourcePredictionFromMail({
    jobId,
    priorImmersionState,
    latestMailItems: input.mailItems,
    delta,
  });
  const prediction = buildImmersionPrediction({
    args: input.args,
    jobId,
    mailItems: input.mailItems,
    delta,
  });
  const evidenceRefs = uniqueStrings([
    activeJob?.jobId,
    activePolicy?.policyId,
    activeProfile?.profileId,
    priorImmersionState?.immersionStateId,
    predictionValidation.validationId,
    ...input.mailItems.map((item) => item.mailId),
    ...input.mailItems.flatMap((item) => item.evidenceRefs),
    ...input.mailItems.flatMap((item) => [item.sourceRefs.frameRef, item.sourceRefs.evidenceRef, item.sourceRefs.observationRef]),
  ]);
  const causalTrace = mergeLiveSourceCausalTraces([
    priorImmersionState?.causalTrace,
    ...input.mailItems.map((item) => item.causalTrace),
    activeProfile?.causalTrace,
  ], {
    parentRefs: uniqueStrings([
      priorImmersionState?.immersionStateId,
      ...input.mailItems.map((item) => item.mailId),
      activePolicy?.policyId,
      activeProfile?.profileId,
    ]),
    causedBy: input.mailItems.map((item) => item.mailId),
    sourceIds: input.mailItems.map((item) => item.sourceId),
    jobId,
    policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
    profileId: activeProfile?.profileId ?? priorImmersionState?.profileId ?? null,
    evidenceRefs,
  });
  const immersionState = recordStagePlayLiveSourceImmersionState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId,
    policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
    profileId: activeProfile?.profileId ?? priorImmersionState?.profileId ?? null,
    sourceIds: uniqueStrings([
      input.sourceId,
      ...input.mailItems.map((item) => item.sourceId),
      ...(activeJob?.sourceIds ?? []),
      ...(activePolicy?.sourceIds ?? []),
      ...(priorImmersionState?.sourceIds ?? []),
    ]),
    latestMailIds: input.mailItems.map((item) => item.mailId),
    latestEvidenceRefs: uniqueStrings([
      ...input.mailItems.flatMap((item) => item.evidenceRefs),
      ...input.mailItems.flatMap((item) => [item.sourceRefs.frameRef, item.sourceRefs.evidenceRef, item.sourceRefs.observationRef]),
    ]),
    sourceIdentity: delta.sourceIdentity,
    stableFacts: delta.stableFacts,
    currentSceneFacts: delta.currentSceneFacts,
    changedFacts: delta.changedFacts,
    uncertainties: delta.uncertainties,
    currentActivity: delta.currentActivity,
    salience: delta.salience,
    prediction,
    lastValidation: {
      validationId: predictionValidation.validationId,
      priorPredictionId: predictionValidation.priorPredictionId,
      result: predictionValidation.result,
      evidenceSummary: predictionValidation.newSignals.slice(0, 6).join("; ") || "No validation signals were available.",
    },
    evidenceRefs,
    causalTrace,
  });
  const { packet } = buildStagePlayProcessedMailPacket({
    jobId,
    sourceId: input.sourceId ?? input.mailItems[0]?.sourceId ?? "unknown_source",
    mailItems: input.mailItems,
    priorImmersionState,
    immersionState,
    predictionValidation,
    activeProfile,
    causalTrace,
  });
  return {
    activePolicy,
    activeProfile,
    priorImmersionState,
    immersionState,
    predictionValidation,
    processedPacket: packet,
  };
};

const collectStagePlayGraphSourceRefs = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings([
    ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...graph.sourceWindow.latestObservationRefs,
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...(graph.sourceWindow.latestRawSessionBufferRefs ?? []),
    ...graph.sourceWindow.sources.flatMap((source) => source.evidenceRefs),
  ]);

const compactObservationRefsFromStagePlayGraph = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings([
    ...graph.badges
      .filter((badge) => badge.kind === "compact_observation")
      .flatMap((badge) => badge.evidenceRefs),
    ...graph.sourceWindow.latestObservationRefs,
  ]);

const priorAnswerSnapshotRefsFromStagePlayGraph = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings(graph.badges
    .filter((badge) => badge.kind === "answer_snapshot" && badge.output?.state === "model_reviewed")
    .flatMap((badge) => [badge.id, ...badge.evidenceRefs]));

const checkpointReceiptFailureObservation = (input: {
  threadId: string;
  environmentId?: string | null;
  toolName: HelixLiveEnvironmentToolName;
  missingField: string;
  evidenceRefs?: string[];
}): HelixLiveEnvironmentToolObservation =>
  makeObservation({
    threadId: input.threadId,
    environmentId: input.environmentId,
    toolName: input.toolName,
    ok: false,
    summary: `Checkpoint request could not run because ${input.missingField}.`,
    observation: {
      schema: "stage_play_checkpoint_request_failure/v1",
      missing_field: input.missingField,
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    },
    evidenceRefs: input.evidenceRefs ?? [],
  });

const visualStagePlaySourceStatuses = (graph: StagePlayBadgeGraphV1): Array<{
  sourceId: string;
  modality: string;
  status: string;
  selectedForStagePlay: boolean;
  routeTo: string;
  cadenceMs?: number | null;
  lastEventTs?: string | null;
  evidenceRefs: string[];
}> =>
  graph.sourceWindow.sources
    .filter((source) =>
      /(?:visual|screen|frame|tab)/i.test(`${source.modality}\n${source.sourceId}\n${source.contribution}`),
    )
    .map((source) => ({
      sourceId: source.sourceId,
      modality: source.modality,
      status: source.status,
      selectedForStagePlay: source.selectedForStagePlay,
      routeTo: source.routeTo,
      cadenceMs: source.cadenceMs ?? null,
      lastEventTs: source.lastEventTs ?? null,
      evidenceRefs: source.evidenceRefs,
    }));

const checkpointFreshnessFromStagePlayGraph = (graph: StagePlayBadgeGraphV1): {
  reason: string;
  modelReviewed: boolean;
  fresh: boolean;
  checkpointId: string | null;
} => {
  const checkpointBadge = graph.badges.find((badge) => badge.id === "helix_ask.checkpoint.latest") ?? null;
  const reasonCode = checkpointBadge?.reasonCodes.find((code) => /^checkpoint_freshness[:_]/.test(code));
  const reason = reasonCode
    ? reasonCode.replace(/^checkpoint_freshness[:_]/, "")
    : "no_checkpoint";
  const modelReviewed = checkpointBadge?.checkpoint?.modelReviewed === true;
  return {
    reason,
    modelReviewed,
    fresh: checkpointBadge?.status === "observed" && modelReviewed,
    checkpointId: checkpointBadge?.checkpoint?.askTurnId ?? null,
  };
};

const buildStagePlayToolReceiptDebug = (input: {
  toolName: HelixLiveEnvironmentToolName;
  graph: StagePlayBadgeGraphV1;
  outputProjectionKeys?: string[];
  skippedProjectionKeys?: string[];
  checkpointOnlySkipped?: string[];
  checkpointRequestId?: string | null;
}) => ({
  schema: "stage_play_tool_receipt_debug/v1",
  toolName: input.toolName,
  graphId: input.graph.graphId,
  sourceRefs: collectStagePlayGraphSourceRefs(input.graph),
  visualSourceStatus: visualStagePlaySourceStatuses(input.graph),
  outputProjectionKeys: uniqueStrings(input.outputProjectionKeys ?? []),
  skippedProjectionKeys: uniqueStrings(input.skippedProjectionKeys ?? []),
  checkpointOnlySkipped: uniqueStrings(input.checkpointOnlySkipped ?? []),
  checkpointFreshness: checkpointFreshnessFromStagePlayGraph(input.graph),
  checkpointRequestId: input.checkpointRequestId ?? input.graph.checkpointRequests[0]?.checkpointRequestId ?? null,
  assistant_answer: false,
  raw_content_included: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
});

const makeObservation = (input: {
  threadId: string;
  environmentId?: string | null;
  toolName: HelixLiveEnvironmentToolName;
  ok: boolean;
  summary: string;
  observation: unknown;
  evidenceRefs?: string[];
  producedRefs?: string[];
  artifactRefs?: LiveSourceToolArtifactRefs;
  forceNormalizedRefs?: boolean;
  transcriptRows?: AskTurnTranscriptRowDraftV1[];
}): HelixLiveEnvironmentToolObservation => {
  const producedRefs = uniqueStrings(input.producedRefs ?? []);
  const shouldIncludeNormalizedRefs = input.forceNormalizedRefs === true || producedRefs.length > 0 || Boolean(input.artifactRefs);
  const artifactRefs = shouldIncludeNormalizedRefs
    ? {
        processedPacketIds: uniqueStrings(input.artifactRefs?.processedPacketIds ?? []),
        decisionIds: uniqueStrings(input.artifactRefs?.decisionIds ?? []),
        voiceReceiptIds: uniqueStrings(input.artifactRefs?.voiceReceiptIds ?? []),
        wakeRequestId: input.artifactRefs?.wakeRequestId ?? null,
        askTurnId: input.artifactRefs?.askTurnId ?? null,
      }
    : null;
  return {
    schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_id: `live_env_tool_observation:${hashShort([
      input.threadId,
      input.environmentId ?? null,
      input.toolName,
      input.summary,
      input.evidenceRefs ?? [],
    ])}`,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    tool_name: input.toolName,
    ok: input.ok,
    summary: input.summary,
    observation: input.observation,
    ...(input.transcriptRows && input.transcriptRows.length > 0 ? { transcriptRows: input.transcriptRows } : {}),
    evidence_refs: Array.from(new Set(input.evidenceRefs ?? [])),
    ...(shouldIncludeNormalizedRefs ? { producedRefs } : {}),
    ...(artifactRefs ? { artifactRefs } : {}),
    instruction_authority: "none",
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    created_at: new Date().toISOString(),
  };
};

const eventKind = (value: unknown): HelixInterpretedEventKind => {
  const raw = readString(value);
  if (
    raw === "source_observation" ||
    raw === "visual_observation" ||
    raw === "visual_event_alignment" ||
    raw === "categorization" ||
    raw === "present_state_synthesis" ||
    raw === "line_tool_evaluation" ||
    raw === "synthetic_evidence" ||
    raw === "subgoal_update" ||
    raw === "mission_memory_update" ||
    raw === "live_environment_delta" ||
    raw === "user_steering" ||
    raw === "steering_applied" ||
    raw === "hypothesis_confidence_changed" ||
    raw === "clarification_need" ||
    raw === "clarification_question" ||
    raw === "utility_hypothesis" ||
    raw === "pattern_candidate" ||
    raw === "archive_summary" ||
    raw === "agentic_review" ||
    raw === "tool_trace" ||
    raw === "proof_recall" ||
    raw === "callout_proposal" ||
    raw === "callout_delivery" ||
    raw === "final_answer_snapshot"
  ) {
    return raw;
  }
  return "tool_trace";
};

const commentarySubject = (value: unknown): HelixLiveEnvironmentCommentarySubject => {
  const raw = readString(value);
  if (
    raw === "dottie_observer" ||
    raw === "minecraft_route" ||
    raw === "source_health" ||
    raw === "visual_source" ||
    raw === "workstation_pipeline" ||
    raw === "translation" ||
    raw === "browser_audio" ||
    raw === "terminal_authority"
  ) {
    return raw;
  }
  return "unknown";
};

const commentaryKind = (value: unknown): HelixLiveEnvironmentCommentaryKind => {
  const raw = readString(value);
  if (
    raw === "observation" ||
    raw === "prediction" ||
    raw === "missing_evidence" ||
    raw === "salience_candidate" ||
    raw === "tool_trace" ||
    raw === "field_evaluation" ||
    raw === "terminal_ready" ||
    raw === "terminal_blocked"
  ) {
    return raw;
  }
  const legacyKind = eventKind(value);
  if (legacyKind === "clarification_need") return "missing_evidence";
  if (legacyKind === "utility_hypothesis" || legacyKind === "pattern_candidate") return "salience_candidate";
  if (legacyKind === "line_tool_evaluation" || legacyKind === "agentic_review") return "field_evaluation";
  if (legacyKind === "final_answer_snapshot") return "terminal_ready";
  return "observation";
};

const commentaryStatus = (value: unknown): HelixLiveEnvironmentCommentaryStatus => {
  const raw = readString(value);
  if (
    raw === "candidate" ||
    raw === "observed" ||
    raw === "blocked" ||
    raw === "satisfied" ||
    raw === "needs_more_evidence" ||
    raw === "policy_pending" ||
    raw === "policy_approved"
  ) {
    return raw;
  }
  return "observed";
};

export function executeLiveEnvironmentTool(
  input: ExecuteLiveEnvironmentToolInput,
): HelixLiveEnvironmentToolObservation {
  const args = input.args ?? {};
  const explicitSourceId = readString(args.source_id) ?? readString(args.sourceId);
  let environment =
    (input.environment_id ? getLiveAnswerEnvironment(input.environment_id) : null) ??
    (explicitSourceId ? getActiveLiveAnswerEnvironmentForSource(explicitSourceId) : null) ??
    getActiveLiveAnswerEnvironmentForThread(input.thread_id) ??
    getActiveLiveAnswerEnvironmentForThread("helix-ask:desktop");
  const effectiveThreadId = environment?.thread_id ?? input.thread_id;
  const roomId = readString(args.room_id) ?? environment?.room_id ?? null;

  if (input.tool_name === "live_env.narrator_say" || input.tool_name === "live_env.narrator_bind_stream") {
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const narratorKind: NarratorControlKind = input.tool_name === "live_env.narrator_bind_stream" ? "bind_stream" : "say";
    const text = readString(args.text) ?? readString(args.message) ?? readString(args.utterance);
    const sourceRef =
      readString(args.source_ref) ??
      readString(args.sourceRef) ??
      readString(args.source_id) ??
      readString(args.sourceId) ??
      (narratorKind === "say" ? "helix_ask:narrator.say" : null);
    const sourceKind = normalizeNarratorSourceKind(args.source_kind ?? args.sourceKind);
    const streamKind = normalizeNarratorStreamKind(args.stream_kind ?? args.streamKind);
    const deliveryMode = normalizeNarratorDeliveryMode(
      args.delivery_mode ?? args.deliveryMode,
      narratorKind === "say" ? "confirm_to_speak" : "visible_only",
    );
    const evidenceRefs = uniqueStrings([
      ...readStringArray(args.evidence_refs),
      ...readStringArray(args.evidenceRefs),
      sourceRef,
    ]);
    const missingRequirements = narratorKind === "say"
      ? (text ? [] : ["text"])
      : [
          ...(sourceRef ? [] : ["source_ref"]),
          ...(streamKind ? [] : ["stream_kind"]),
        ];
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const actuator = narratorControlActuator(narratorKind);
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: input.thread_id,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const actuatorAllowed = !goalId || Boolean(goalSession?.allowedActuators.includes(actuator));
    const authorizationMissing = goalId
      ? goalSession
        ? actuatorAllowed
          ? []
          : [`allowed_actuator:${actuator}`]
        : ["goal_session"]
      : [];
    const effectiveMissingRequirements = [...missingRequirements, ...authorizationMissing];
    const ok = effectiveMissingRequirements.length === 0;
    const requestId = `helix_narrator_${narratorKind}_request:${hashShort([
      input.thread_id,
      input.tool_name,
      text,
      sourceRef,
      sourceKind,
      streamKind,
      deliveryMode,
      evidenceRefs,
    ])}`;
    const rawDispatch = buildNarratorDispatch({
      kind: narratorKind,
      receiptRef: requestId,
      sourceRef: sourceRef ?? "narrator:source_missing",
      streamKind,
      deliveryMode,
    });
    const dispatch = ok ? rawDispatch : filterDeniedNarratorDispatch(rawDispatch);
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: input.thread_id,
      roomId,
      producerKind: "narrator",
      updateKind: "suggested_action",
      contentRef: requestId,
      preview: ok
        ? narratorKind === "say"
          ? "Prepared narrator say request as governed non-terminal speech evidence."
          : `Prepared narrator stream binding for ${streamKind}.`
        : `Blocked narrator ${narratorKind} request; missing ${effectiveMissingRequirements.join(", ")}.`,
      sourceRefs: uniqueStrings([sourceRef, sourceKind, streamKind]),
      loopRefs: uniqueStrings([`narrator:${narratorKind}`, `thread:${input.thread_id}`]),
      evidenceRefs: uniqueStrings([requestId, ...evidenceRefs]),
      receiptRefs: [requestId],
      freshnessStatus: ok ? "fresh" : "blocked",
      goalId,
      goalRelevanceReason: narratorKind === "say"
        ? "Narrator speech request was prepared for the active workstation goal."
        : "Narrator stream binding was prepared for the active workstation goal.",
      suggestedDispatch: dispatch,
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: input.thread_id,
          roomId,
          sourceRefs: uniqueStrings([sourceRef, sourceKind, streamKind]),
          loopRefs: uniqueStrings([`narrator:${narratorKind}`, `thread:${input.thread_id}`]),
          evidenceRefs: uniqueStrings([goalContextUpdateId, requestId, ...evidenceRefs]).slice(0, 80),
          actionsTaken: uniqueStrings([actuator, input.tool_name]),
          summary: narratorKind === "say"
            ? "Prepared narrator say request for this goal session."
            : `Prepared narrator ${streamKind ?? "stream"} binding for this goal session.`,
          nextStep: "continue",
        })
      : goalSession;
    const common = {
      requestId,
      request_id: requestId,
      status: ok ? "prepared" : "blocked",
      missingRequirements: effectiveMissingRequirements,
      missing_requirements: effectiveMissingRequirements,
      goalId,
      goal_id: goalId,
      goalSessionFound: goalId ? Boolean(goalSession) : null,
      goal_session_found: goalId ? Boolean(goalSession) : null,
      requiredActuator: actuator,
      required_actuator: actuator,
      actuatorAllowed,
      actuator_allowed: actuatorAllowed,
      agentGoalSession: checkpointedGoalSession,
      agent_goal_session: checkpointedGoalSession,
      sourceRef,
      source_ref: sourceRef,
      deliveryMode,
      delivery_mode: deliveryMode,
      evidenceRefs,
      evidence_refs: evidenceRefs,
      dispatch,
      suggestedDispatch: dispatch,
      suggested_dispatch: dispatch,
      goalContextUpdateId,
      goal_context_update_id: goalContextUpdateId,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? narratorKind === "say"
          ? "Prepared narrator say request as non-terminal tool evidence."
          : "Prepared narrator stream binding request as non-terminal tool evidence."
        : `Cannot prepare narrator ${narratorKind} request; missing ${effectiveMissingRequirements.join(", ")}.`,
      observation: narratorKind === "say"
        ? {
            schema: WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA,
            schemaVersion: WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA,
            ...common,
            text: text ?? "",
            sourceKind,
            source_kind: sourceKind,
            sourceId: sourceRef ?? "helix_ask:narrator.say",
            source_id: sourceRef ?? "helix_ask:narrator.say",
            priority: narratorRequestPriority(args.priority),
            language: readString(args.language) ?? undefined,
            dedupeKey: readString(args.dedupe_key ?? args.dedupeKey) ?? undefined,
          }
        : {
            schema: WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
            schemaVersion: WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
            ...common,
            streamKind,
            stream_kind: streamKind,
            presetId: readString(args.preset_id ?? args.presetId) ?? null,
            preset_id: readString(args.preset_id ?? args.presetId) ?? null,
            voicePolicy: narratorVoicePolicy(args.voice_policy ?? args.voicePolicy),
            voice_policy: narratorVoicePolicy(args.voice_policy ?? args.voicePolicy),
            evidenceThreshold: readString(args.evidence_threshold ?? args.evidenceThreshold) ?? undefined,
            evidence_threshold: readString(args.evidence_threshold ?? args.evidenceThreshold) ?? undefined,
          },
      evidenceRefs: uniqueStrings([goalContextUpdateId, requestId, ...evidenceRefs]),
      producedRefs: [requestId, goalContextUpdateId],
      forceNormalizedRefs: true,
    });
  }

  const workstationControlSpec = readWorkstationControlSpec(input.tool_name);
  if (workstationControlSpec) {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const controlDispatch = buildWorkstationControlDispatch({
      spec: workstationControlSpec,
      args,
    });
    const missingRequirements = missingWorkstationControlRequirements({
      spec: workstationControlSpec,
      targetRef: controlDispatch.targetRef,
      sourceRef: controlDispatch.sourceRef,
      presetId: controlDispatch.presetId,
      loopRef: controlDispatch.loopRef,
      lineKey: controlDispatch.lineKey,
    });
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const actuator = workstationControlActuator(workstationControlSpec, controlDispatch.loopState);
    const fallbackActuator = workstationControlFallbackActuator(workstationControlSpec, actuator);
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const actuatorAllowed = !goalId || Boolean(
      goalSession?.allowedActuators.includes(actuator) ||
      (fallbackActuator && goalSession?.allowedActuators.includes(fallbackActuator))
    );
    const authorizationMissing = goalId
      ? goalSession
        ? actuatorAllowed
          ? []
          : [`allowed_actuator:${actuator}`]
        : ["goal_session"]
      : [];
    const effectiveMissingRequirements = [...missingRequirements, ...authorizationMissing];
    const ok = effectiveMissingRequirements.length === 0;
    const reason = readString(args.reason) ?? readString(args.summary) ?? null;
    const receiptId = `stage_play_workstation_control_receipt:${workstationControlSpec.controlKind}:${hashShort([
      input.thread_id,
      input.tool_name,
      controlDispatch.targetRef,
      controlDispatch.sourceRef,
      controlDispatch.presetId,
      controlDispatch.loopRef,
      controlDispatch.loopState,
      controlDispatch.lineKey,
      controlDispatch.nodeRef,
      reason,
    ])}`;
    const rawDispatch = ok ? controlDispatch.dispatch : filterDeniedControlDispatch(controlDispatch.dispatch, workstationControlSpec);
    const dispatch = rawDispatch.map((action) =>
      action.kind === "log_receipt" && !action.receiptRef
        ? { ...action, receiptRef: receiptId }
        : action
    );
    const sourceRefs = uniqueStrings([
      scope.sourceId,
      controlDispatch.sourceRef,
      controlDispatch.targetRef,
      controlDispatch.nodeRef,
      controlDispatch.lineKey ? `live_answer_line:${controlDispatch.lineKey}` : null,
    ]);
    const loopRefs = uniqueStrings([
      scope.mailboxThreadResolution.mailboxThreadId,
      controlDispatch.loopRef,
      `workstation_control:${workstationControlSpec.controlKind}`,
    ]);
    const evidenceRefs = uniqueStrings([
      receiptId,
      ...sourceRefs,
      ...loopRefs,
      ...readStringArray(args.evidence_refs),
      ...readStringArray(args.evidenceRefs),
    ]);
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: workstationControlProducerKind(workstationControlSpec),
      updateKind: workstationControlUpdateKind(workstationControlSpec),
      contentRef: receiptId,
      preview: ok
        ? `Prepared workstation control dispatch: ${workstationControlSpec.label}.`
        : `Blocked workstation control dispatch: ${workstationControlSpec.label} is missing ${effectiveMissingRequirements.join(", ")}.`,
      sourceRefs,
      loopRefs,
      evidenceRefs,
      receiptRefs: [receiptId],
      freshnessStatus: ok ? "fresh" : "blocked",
      suggestedDispatch: dispatch,
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          roomId,
          sourceRefs,
          loopRefs,
          evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]).slice(0, 80),
          actionsTaken: uniqueStrings([actuator, fallbackActuator, input.tool_name]),
          summary: `Prepared ${workstationControlSpec.label} control dispatch for this goal session.`,
          nextStep: "continue",
        })
      : goalSession;
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? `Prepared ${workstationControlSpec.label} dispatch as non-terminal workstation control evidence.`
        : `Cannot prepare ${workstationControlSpec.label}; missing ${effectiveMissingRequirements.join(", ")}.`,
      observation: {
        schema: "stage_play_workstation_control_receipt/v1",
        receiptId,
        receipt_id: receiptId,
        controlKind: workstationControlSpec.controlKind,
        control_kind: workstationControlSpec.controlKind,
        label: workstationControlSpec.label,
        ok,
        status: ok ? "prepared" : "blocked",
        missingRequirements: effectiveMissingRequirements,
        missing_requirements: effectiveMissingRequirements,
        goalId,
        goal_id: goalId,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        requiredActuator: actuator,
        required_actuator: actuator,
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        agentGoalSession: checkpointedGoalSession,
        agent_goal_session: checkpointedGoalSession,
        targetRef: controlDispatch.targetRef,
        target_ref: controlDispatch.targetRef,
        sourceRef: controlDispatch.sourceRef,
        source_ref: controlDispatch.sourceRef,
        presetId: controlDispatch.presetId,
        preset_id: controlDispatch.presetId,
        loopRef: controlDispatch.loopRef,
        loop_ref: controlDispatch.loopRef,
        lineKey: controlDispatch.lineKey,
        line_key: controlDispatch.lineKey,
        panelId: controlDispatch.panelId,
        panel_id: controlDispatch.panelId,
        nodeRef: controlDispatch.nodeRef,
        node_ref: controlDispatch.nodeRef,
        loopState: controlDispatch.loopState,
        loop_state: controlDispatch.loopState,
        reason,
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution: scope.mailboxThreadResolution,
        mailbox_thread_resolution: scope.mailboxThreadResolution,
        dispatch,
        suggestedDispatch: dispatch,
        suggested_dispatch: dispatch,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]),
      producedRefs: [receiptId, goalContextUpdateId],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.read_card") {
    const lineKeys = readStringArray(args.line_keys);
    const selectedLines = environment?.lines.filter((line) =>
      lineKeys.length === 0 || lineKeys.includes(line.key)
    ) ?? [];
    const resultId = `live_answer_card_read:${hashShort([
      input.thread_id,
      environment?.environment_id ?? input.environment_id ?? null,
      selectedLines.map((line) => [line.key, line.updated_at, line.evidence_refs]),
    ])}`;
    const selectedLineKeys = selectedLines.map((line) => line.key);
    const observedAtMs = Date.parse(environment?.updated_at ?? "");
    const evidenceRefs = uniqueStrings([
      resultId,
      environment?.environment_id,
      ...(environment?.evidence_refs ?? []),
      ...selectedLines.flatMap((line) => line.evidence_refs),
    ]);
    const goalContextUpdateId = environment
      ? recordLiveEnvironmentGoalContextUpdate({
          threadId: input.thread_id,
          mailboxThreadId: environment.thread_id ?? input.thread_id,
          roomId,
          producerKind: "live_answer",
          updateKind: "summary",
          contentRef: resultId,
          preview: selectedLines.length > 0
            ? `Read ${selectedLines.length} Live Answer projection line(s): ${selectedLines.map((line) => line.label).join(", ")}.`
            : "Read Live Answer card; no selected projection lines matched the query.",
          sourceRefs: uniqueStrings([
            environment.environment_id,
            ...environment.source_ids,
            ...selectedLineKeys.map((lineKey) => `live_answer_line:${lineKey}`),
          ]),
          loopRefs: uniqueStrings([
            environment.environment_id,
            `live_answer_environment:${environment.environment_id}`,
            `live_answer_card_read:${input.thread_id}`,
          ]),
          evidenceRefs,
          receiptRefs: [resultId],
          observedAtMs: Number.isFinite(observedAtMs) ? observedAtMs : Date.now(),
          staleAfterMs: 45_000,
          freshnessStatus: selectedLines.length > 0 ? "fresh" : "unknown",
          suggestedDispatch: [
            { kind: "log_receipt", receiptRef: resultId },
            ...selectedLineKeys.map((lineKey): WorkstationDispatchActionV1 => ({ kind: "update_live_answer", lineKey })),
            { kind: "update_panel", panelId: "live-answer-environment" },
            { kind: "update_panel", panelId: "stage-play-badge-graph" },
          ],
        })
      : null;
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: Boolean(environment),
      summary: environment
        ? `Read ${selectedLines.length} live card line(s); line text is UI projection only.`
        : "No live answer environment was found for the requested card.",
      observation: environment
        ? {
            schema: "helix.live_environment_card_read.v1",
            environment_id: environment.environment_id,
            thread_id: environment.thread_id,
            room_id: environment.room_id ?? null,
            lines: selectedLines.map((line) => ({
              key: line.key,
              label: line.label,
              value: line.value,
              confidence: line.confidence ?? null,
              evidence_refs: line.evidence_refs,
              ui_summary_only: true,
              assistant_answer: false,
            })),
            goalContextUpdateId,
            goal_context_update_id: goalContextUpdateId,
            assistant_answer: false,
            terminal_eligible: false,
            post_tool_model_step_required: true,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          }
        : null,
      evidenceRefs: uniqueStrings([
        ...(goalContextUpdateId ? [goalContextUpdateId] : []),
        ...evidenceRefs,
      ]),
      producedRefs: uniqueStrings([
        ...(goalContextUpdateId ? [goalContextUpdateId] : []),
        resultId,
      ]),
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.query_event_log") {
    const events = listInterpretedEvents({
      threadId: input.thread_id,
      roomId,
      limit: readNumber(args.limit, 50),
    });
    const typedCommentary = args.include_typed_commentary === true
      ? listLiveEnvironmentCommentary({
          threadId: input.thread_id,
          roomId,
          environmentId: input.environment_id,
          subject: readString(args.commentary_subject),
          kind: readString(args.commentary_kind),
          limit: readNumber(args.limit, 50),
        })
      : [];
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: args.include_typed_commentary === true
        ? `Retrieved ${events.length} compact interpreted event(s) and ${typedCommentary.length} typed commentary record(s).`
        : `Retrieved ${events.length} compact interpreted event(s).`,
      observation: {
        schema: "helix.interpreted_log_read.v1",
        thread_id: input.thread_id,
        room_id: roomId,
        events,
        interpreted_events: events,
        typed_commentary: typedCommentary,
        raw_logs_included: false,
        deterministic_content_role: "evidence_not_assistant_answer",
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        assistant_answer: false,
      },
      evidenceRefs: [
        ...events.flatMap((event) => [event.event_id, ...event.evidence_refs]),
        ...typedCommentary.flatMap((commentary) => [commentary.commentary_id, ...commentary.evidence_refs]),
      ],
    });
  }

  if (input.tool_name === "live_env.query_world_events") {
    const result = queryEventWindow({
      thread_id: input.thread_id,
      room_id: roomId,
      source_id: readString(args.source_id),
      world_id: readString(args.world_id),
      actor_id: readString(args.actor_id),
      event_types: readStringArray(args.event_types),
      from_ts: readString(args.from_ts),
      to_ts: readString(args.to_ts),
      limit: readNumber(args.limit, 50),
      include_raw_events: false,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Retrieved ${result.returned_count} compact world event(s).`,
      observation: result,
      evidenceRefs: result.events.flatMap((event) => [event.journal_event_id, ...event.evidence_refs]),
    });
  }

  if (input.tool_name === "live_env.query_navigation_state") {
    const result = queryMinecraftNavigationState({
      roomId,
      worldId: readString(args.world_id),
      actorLabel: readString(args.actor_label),
      limit: readNumber(args.limit, 6),
    });
    const state = result.navigation_state ?? null;
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: state
        ? `Navigation state route_status=${state.route_status}; policy_surface_status=${state.policy_surface_status}.`
        : "No compact Minecraft navigation state is available.",
      observation: result,
      evidenceRefs: state?.evidence_refs ?? result.latest_solver_observations.flatMap(evidenceRefsFrom),
    });
  }

  if (input.tool_name === "live_env.describe_stage_builder") {
    const catalog = buildStagePlayBuilderCatalog({
      threadId: input.thread_id,
      environmentId: input.environment_id ?? null,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Described Stage Builder grammar with ${catalog.nodeKinds.length} node kind(s), ${catalog.edgeRelations.length} edge relation(s), and ${catalog.sourceClasses.length} source class(es).`,
      observation: catalog,
      evidenceRefs: [],
    });
  }

  if (input.tool_name === "live_env.query_stage_sources") {
    const sources = buildStagePlaySourceQuery({
      threadId: input.thread_id,
      environmentId: input.environment_id ?? null,
      sourceId: readString(args.source_id),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Found ${sources.sourceHandles.length} Stage Builder source handle(s).`,
      observation: sources,
      evidenceRefs: sources.sourceHandles.flatMap((source) => source.latestEvidenceRefs),
    });
  }

  if (input.tool_name === "live_env.draft_stage_play_graph" || input.tool_name === "live_env.validate_stage_play_graph") {
    const validation = validateStagePlayBuilderDraft({
      threadId: input.thread_id,
      environmentId: input.environment_id ?? null,
      draft: args.draft ?? args,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: validation.ok,
      summary: validation.ok
        ? `Accepted Stage Play graph draft ${validation.draftId ?? "draft"} with ${validation.resolvedSourceIds.length} resolved source handle(s).`
        : `Rejected Stage Play graph draft with ${validation.issues.length} issue(s).`,
      observation: validation,
      evidenceRefs: validation.evidenceRefs,
    });
  }

  if (input.tool_name === "live_env.plan_stage_play_job") {
    const plan = planStagePlayJob({
      threadId: effectiveThreadId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId: explicitSourceId,
      objective: readString(args.objective) ?? readString(args.user_intent) ?? readString(args.intent),
    });
    const needed = plan.requiredSources
      .filter((source) => source.required)
      .map((source) => source.label);
    const optional = plan.requiredSources
      .filter((source) => !source.required)
      .map((source) => source.label);
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Planned ${plan.domain} Stage Play job with ${plan.nodeChain.length} node(s); needed: ${needed.join(", ") || "none"}; optional: ${optional.join(", ") || "none"}.`,
      observation: plan,
      evidenceRefs: [],
    });
  }

  if (input.tool_name === "live_env.request_stage_play_checkpoint") {
    const draftSourceId = sourceIdsFromStagePlayDraft({
      draft: args.draft,
      threadId: effectiveThreadId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
    })[0] ?? null;
    const sourceId = explicitSourceId ?? draftSourceId;
    const graph = buildStagePlayBadgeGraphFromLiveWindow({
      threadId: effectiveThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId,
      objective: readString(args.objective) ?? environment?.objective ?? null,
    });
    const graphIssues = validateStagePlayBadgeGraphV1(graph);
    const graphValid = graphIssues.length === 0;
    const generatedAt = new Date().toISOString();
    const jobId =
      readString(args.job_id) ??
      readString(args.jobId) ??
      graph.checkpointRequests[0]?.jobId ??
      `stage_play_job:${hashShort([
        effectiveThreadId,
        roomId,
        environment?.environment_id ?? input.environment_id ?? null,
        sourceId,
      ])}`;
    const sourceRefs = uniqueStrings([
      ...readStringArray(args.source_refs ?? args.sourceRefs),
      ...collectStagePlayGraphSourceRefs(graph),
    ]);
    const compactObservationRefs = uniqueStrings([
      ...readStringArray(args.compact_observation_refs ?? args.compactObservationRefs),
      ...compactObservationRefsFromStagePlayGraph(graph),
    ]);
    const perturbationRefs = uniqueStrings([
      ...readStringArray(args.perturbation_refs ?? args.perturbationRefs),
      ...graph.perturbations.map((entry) => entry.perturbationId),
    ]);
    const priorAnswerSnapshotRefs = uniqueStrings([
      ...readStringArray(args.prior_answer_snapshot_refs ?? args.priorAnswerSnapshotRefs),
      ...priorAnswerSnapshotRefsFromStagePlayGraph(graph),
    ]);
    if (!graph.graphId) {
      return checkpointReceiptFailureObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        missingField: "missing graph id",
        evidenceRefs: sourceRefs,
      });
    }
    if (graph.sourceWindow.sources.length === 0 && sourceRefs.length === 0) {
      return checkpointReceiptFailureObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        missingField: "missing active Stage Play graph",
      });
    }
    if (compactObservationRefs.length === 0) {
      return checkpointReceiptFailureObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        missingField: "no compact observation refs",
        evidenceRefs: sourceRefs,
      });
    }
    const checkpointRequest = enqueueStagePlayCheckpointRequestFromGraph({
      jobId,
      graph,
      objective: readString(args.objective) ?? environment?.objective ?? null,
      userPromptRef: readString(args.user_prompt_ref) ?? readString(args.userPromptRef),
      reason: readCheckpointRequestReason(args.reason) ?? "user_requested_checkpoint",
      perturbationRefs,
      now: generatedAt,
      userTyping: args.user_typing === true || args.userTyping === true,
      manualAskTurnActive: args.manual_ask_turn_active === true || args.manualAskTurnActive === true,
    });
    const explicitCheckpointRequestId =
      readString(args.checkpoint_request_id) ??
      readString(args.checkpointRequestId) ??
      checkpointRequest.checkpointRequestId;
    const queueStateBeforeRun = getStagePlayCheckpointQueue({ jobId, limit: 10 });
    const queuedRequest = queueStateBeforeRun.requests.find((request) =>
      request.checkpointRequestId === explicitCheckpointRequestId
    ) ?? checkpointRequest;
    const jobState = queueStateBeforeRun.jobState;
    const lastCheckpointAtMs = typeof jobState?.lastCheckpointAt === "string"
      ? Date.parse(jobState.lastCheckpointAt)
      : Number.NaN;
    const nowMs = Date.parse(generatedAt);
    const throttled =
      Number.isFinite(lastCheckpointAtMs) &&
      Number.isFinite(nowMs) &&
      nowMs - lastCheckpointAtMs < checkpointRequest.checkpointPolicy.minMsSinceLastCheckpoint;
    const manualPriority = Boolean(jobState?.userTyping || jobState?.manualAskTurnActive);
    const blockedMissingEvidence = !graphValid;
    const reason: StagePlayCheckpointRequestResultReasonV1 =
      blockedMissingEvidence
        ? "blocked_missing_evidence"
        : throttled
          ? "throttled"
          : manualPriority
            ? "manual_user_priority"
            : "queued";
    if (queuedRequest.status === "superseded") {
      return checkpointReceiptFailureObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        missingField: "checkpoint request superseded",
        evidenceRefs: [queuedRequest.checkpointRequestId, graph.graphId, ...sourceRefs],
      });
    }
    if (manualPriority) {
      return checkpointReceiptFailureObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        missingField: "manual user priority is active",
        evidenceRefs: [queuedRequest.checkpointRequestId, graph.graphId, ...sourceRefs],
      });
    }
    const readyToRun = reason === "queued" && queuedRequest.status === "queued";
    const runAction = readyToRun
      ? applyStagePlayCheckpointQueueAction({
          jobId,
          action: "run",
          checkpointRequestId: queuedRequest.checkpointRequestId,
          now: generatedAt,
        })
      : null;
    const resolvedCheckpointRequest = runAction?.request ?? queuedRequest;
    const queueState = getStagePlayCheckpointQueue({ jobId, limit: 10 });
    const ranCheckpoint = runAction?.ok === true && resolvedCheckpointRequest.status === "running";
    const result = {
      ...buildStagePlayCheckpointRequestResultV1({
        checkpointRequest: resolvedCheckpointRequest,
        queueState,
        readyToRun: readyToRun || ranCheckpoint,
        reason,
      }),
      filledArgs: {
        thread_id: effectiveThreadId,
        room_id: roomId,
        environment_id: environment?.environment_id ?? input.environment_id ?? null,
        graph_id: graph.graphId,
        checkpoint_request_id: resolvedCheckpointRequest.checkpointRequestId,
        objective: resolvedCheckpointRequest.objective,
        source_refs: sourceRefs,
        compact_observation_refs: compactObservationRefs,
        perturbation_refs: perturbationRefs,
        prior_answer_snapshot_refs: priorAnswerSnapshotRefs,
      },
      queueAction: runAction,
      debugReceipt: buildStagePlayToolReceiptDebug({
        toolName: input.tool_name,
        graph,
        checkpointRequestId: resolvedCheckpointRequest.checkpointRequestId,
      }),
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId: environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: graphValid,
      summary: ranCheckpoint
        ? `Stage Play checkpoint request ${resolvedCheckpointRequest.checkpointRequestId} is running.`
        : readyToRun
          ? `Queued Stage Play checkpoint request ${resolvedCheckpointRequest.checkpointRequestId}.`
        : `Queued Stage Play checkpoint request ${checkpointRequest.checkpointRequestId}; not ready to run: ${reason}.`,
      observation: result,
      evidenceRefs: [
        resolvedCheckpointRequest.checkpointRequestId,
        graph.graphId,
        ...resolvedCheckpointRequest.currentGraphRefs,
        ...resolvedCheckpointRequest.compactObservationRefs,
        ...resolvedCheckpointRequest.perturbationRefs,
        ...resolvedCheckpointRequest.priorAnswerSnapshotRefs,
        ...sourceRefs,
        ...graph.sourceWindow.latestObservationRefs,
        ...graph.sourceWindow.latestSnapshotRefs,
        ...graph.sourceWindow.latestNavigationRefs,
      ],
    });
  }

  if (input.tool_name === "live_env.reflect_stage_play_context") {
    // Stage Play Badge Graph is an evidence-only reflection surface.
    // It may summarize admitted live-world state, expose setting/actors/props/resources/hazards,
    // derive affordances and blocked affordances, compose procedural intent modules, and suggest
    // candidate checks or user-visible guidance.
    //
    // It may not answer for the assistant, create a terminal response, grant execution permission,
    // execute world actions, mutate game/client/server state, include raw chunk payloads, raw NBT,
    // raw logs, or convert UI labels into instructions.
    //
    // makeObservation preserves this structurally:
    // assistant_answer:false, raw_content_included:false, instruction_authority:"none",
    // ask_instruction_authority:"none", context_role:"tool_evidence",
    // ask_context_policy:"evidence_only". The graph authority also preserves
    // raw_payload_included:false, terminal_eligible:false, and agent_executable:false.
    //
    // The graph is the set designer, not the actor: it paints the stage, labels the trapdoors,
    // and points at the papier-mache dragon. The agent still decides what line to speak.
    const draftSourceId = sourceIdsFromStagePlayDraft({
      draft: args.draft,
      threadId: effectiveThreadId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
    })[0] ?? null;
    const sourceId = explicitSourceId ?? draftSourceId;
    const graph = buildStagePlayBadgeGraphFromLiveWindow({
      threadId: effectiveThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId,
      objective: readString(args.objective),
    });
    const draftValidation = args.draft
      ? validateStagePlayBuilderDraft({
          threadId: input.thread_id,
          environmentId: input.environment_id ?? null,
          draft: args.draft,
        })
      : null;
    const generatedAt = new Date().toISOString();
    const outputLaneProjection = buildStagePlayOutputLaneProjectionV1({
      graph,
      generatedAt,
    });
    const graphValidationIssues = validateStagePlayBadgeGraphV1(graph);
    const graphValid = graphValidationIssues.length === 0;
    const graphSourceEvidenceRefs = [
      ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
      ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
      ...graph.sourceWindow.latestObservationRefs,
      ...graph.sourceWindow.latestSnapshotRefs,
      ...graph.sourceWindow.latestDeltaOverlayRefs,
      ...graph.sourceWindow.latestNavigationRefs,
    ];
    const hasSourceEvidence = graphSourceEvidenceRefs.length > 0;
    let environmentEnsure: {
      created: boolean;
      repairedLineSchema: boolean;
      missingBefore: string[];
      addedLineKeys: string[];
    } | null = null;
    if (graphValid && hasSourceEvidence && (!draftValidation || draftValidation.ok)) {
      const selectedSourceIds = Array.from(new Set([
        sourceId,
        ...graph.sourceWindow.sources
          .filter((source) => source.selectedForStagePlay || source.evidenceRefs.length > 0)
          .map((source) => source.sourceId),
        ...(environment?.source_ids ?? []),
      ].filter((entry): entry is string => Boolean(entry))));
      const ensured = ensureStagePlayLiveAnswerEnvironment({
        threadId: effectiveThreadId,
        roomId,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        objective: readString(args.objective),
        sourceIds: selectedSourceIds,
        graphId: graph.graphId,
        now: generatedAt,
      });
      environment = ensured.environment;
      environmentEnsure = {
        created: ensured.created,
        repairedLineSchema: ensured.repairedLineSchema,
        missingBefore: ensured.missingBefore,
        addedLineKeys: ensured.addedLineKeys,
      };
    }
    const liveAnswerLineReduction = graphValid && environment && hasSourceEvidence && (!draftValidation || draftValidation.ok)
      ? reduceLiveAnswerEnvironmentFromStagePlayGraph({
          environment,
          graph,
          now: generatedAt,
        })
      : null;
    const projectedOutputLaneProjection = liveAnswerLineReduction?.projection ?? outputLaneProjection;
    const projectedLineValues = liveAnswerLineReduction
      ? buildStagePlayLiveAnswerLineValuesV1(
          projectedOutputLaneProjection,
          liveAnswerLineReduction.environment,
        )
      : {};
    const projectedLineKeys = Object.keys(projectedLineValues);
    const changedLineKeys = liveAnswerLineReduction?.delta.changed_line_keys
      .filter((lineKey) => Object.prototype.hasOwnProperty.call(projectedLineValues, lineKey)) ?? [];
    const checkpointOnlySkipped = checkpointOnlySkippedLineKeysForStagePlayProjection(projectedOutputLaneProjection);
    const environmentLineKeys = new Set(environment?.lines.map((line) => line.key) ?? []);
    const skippedLineKeys = projectedOutputLaneProjection.lanes
      .filter((lane) => lane.lineUpdateAllowed)
      .map((lane) => lane.lineKey)
      .filter((lineKey) => !environmentLineKeys.has(lineKey));
    const liveAnswerProjectionReason: StagePlayLiveAnswerProjectionReason = liveAnswerLineReduction
      ? "projected"
      : !graphValid || (draftValidation && !draftValidation.ok)
        ? "graph_invalid"
        : !environment
          ? "no_active_environment"
          : environment.status !== "active"
            ? "environment_not_active"
            : skippedLineKeys.length > 0
              ? "line_schema_mismatch"
              : "no_line_changes";
    const observationPayload = {
      schema: "stage_play_reflection_result/v1",
      graph,
      outputLaneProjection: projectedOutputLaneProjection,
      liveAnswerProjection: {
        attempted: true,
        projected: Boolean(liveAnswerLineReduction),
        deltaId: liveAnswerLineReduction?.delta.delta_id ?? null,
        environmentId: liveAnswerLineReduction?.environment.environment_id ?? environment?.environment_id ?? null,
        changedLineKeys,
        projectedLineKeys,
        skippedLineKeys,
        checkpointOnlySkipped,
        reason: liveAnswerProjectionReason,
        environmentEnsure,
      },
      draftValidation,
      debugReceipt: buildStagePlayToolReceiptDebug({
        toolName: input.tool_name,
        graph,
        outputProjectionKeys: projectedLineKeys,
        skippedProjectionKeys: skippedLineKeys,
        checkpointOnlySkipped,
      }),
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      terminal_eligible: false,
      post_tool_model_step_required: true,
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId: liveAnswerLineReduction?.environment.environment_id ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: graphValid && (draftValidation ? draftValidation.ok : true),
      summary: liveAnswerLineReduction
        ? `Built Stage Play graph and projected ${projectedLineKeys.length} Live Interpretation lane(s).`
        : `Built Stage Play graph but did not project Live Interpretation lanes: ${liveAnswerProjectionReason}.`,
      observation: observationPayload,
      evidenceRefs: [
        ...(draftValidation?.evidenceRefs ?? []),
        projectedOutputLaneProjection.graphId,
        ...projectedOutputLaneProjection.evidenceRefs,
        ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
        ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
        ...graph.sourceWindow.latestObservationRefs,
        ...graph.sourceWindow.latestSnapshotRefs,
        ...graph.sourceWindow.latestDeltaOverlayRefs,
        ...graph.sourceWindow.latestNavigationRefs,
        ...graph.badges.flatMap((badge) => badge.evidenceRefs),
        ...graph.recommendedActions.flatMap((action) => action.evidenceRefs),
        ...(liveAnswerLineReduction
          ? [
              liveAnswerLineReduction.delta.delta_id,
              liveAnswerLineReduction.environment.environment_id,
            ]
          : []),
      ],
    });
  }

  if (input.tool_name === "live_env.route_micro_reasoner_prompt") {
    ensureDefaultStagePlayMicroReasonerPromptPresets();
    const sourceIds = uniqueStrings([
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ]);
    const sourceId = sourceIds[0] ?? explicitSourceId ?? null;
    const presetId = readString(args.preset_id) ?? readString(args.presetId);
    const activePreset = getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId, presetId });
    const router = activePreset?.delegationRouter ?? null;
    const candidateCount = rawDelegationCandidateCount(args);
    if (candidateCount > 3) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: "MicroDeck prompt routing accepts at most three candidate prompts.",
        observation: {
          schema: "stage_play_micro_reasoner_prompt_delegation_result/v1",
          routed: false,
          reason: "too_many_candidate_prompts",
          candidateCount,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "micro_reasoner_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([activePreset?.presetId, ...sourceIds]),
      });
    }
    const candidates = delegationCandidatesFromArgs(args);
    const effectiveCandidates = candidates.length > 0
      ? candidates
      : (router?.candidates ?? []);
    const sourceSummary = latestLiveSourceSummaryForDelegation(args, sourceId);
    const threshold = Math.max(0, Math.min(1, readNumber(
      args.confidence_threshold ?? args.confidenceThreshold,
      router?.confidenceThreshold ?? 0.45,
    )));
    const escalationMode =
      readString(args.escalation_mode) === "suggest_only" ||
      readString(args.escalationMode) === "suggest_only"
        ? "suggest_only"
        : readString(args.escalation_mode) === "handoff_to_helix_ask" ||
          readString(args.escalationMode) === "handoff_to_helix_ask"
          ? "handoff_to_helix_ask"
          : router?.escalationMode ?? "handoff_only_if_confident";
    const result = routeMicroReasonerPromptCandidates({
      candidates: effectiveCandidates,
      sourceSummary: sourceSummary.summary,
      threshold,
      allowNone: typeof args.allow_none === "boolean"
        ? args.allow_none
        : typeof args.allowNone === "boolean"
          ? args.allowNone
          : router?.allowNone ?? true,
      escalationMode,
      presetId: activePreset?.presetId ?? presetId ?? null,
      presetTitle: activePreset?.title ?? null,
      wakePromptContract: activePreset?.wakePromptContract ?? null,
      sourceId,
      evidenceRefs: uniqueStrings([
        activePreset?.presetId,
        ...sourceSummary.evidenceRefs,
        ...sourceIds,
      ]),
    });
    recordStagePlayMicroReasonerPromptToolActivity({
      activityId: `stage_play_micro_reasoner_prompt_tool_activity:${hashShort([result.delegationId, input.thread_id])}`,
      toolName: input.tool_name,
      action: "route",
      status: "completed",
      summary: result.reason,
      sourceIds,
      presetId: activePreset?.presetId ?? presetId ?? null,
      promptId: activePreset?.rolePromptIds.prompt_router ?? null,
      createdAt: result.createdAt,
      updatedAt: result.createdAt,
      evidenceRefs: uniqueStrings([result.delegationId, ...result.evidenceRefs]),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: result.selectedCandidateId
        ? `MicroDeck routed live-source summary to ${result.selectedCandidateId}.`
        : "MicroDeck did not find a candidate prompt above threshold.",
      observation: result,
      evidenceRefs: uniqueStrings([result.delegationId, ...result.evidenceRefs]),
      producedRefs: [result.delegationId],
    });
  }

  if (
    input.tool_name === "live_env.query_micro_reasoner_presets" ||
    input.tool_name === "live_env.draft_micro_reasoner_preset" ||
    input.tool_name === "live_env.apply_micro_reasoner_preset" ||
    input.tool_name === "live_env.create_micro_reasoner_preset"
  ) {
    ensureDefaultStagePlayMicroReasonerPromptPresets();
    const sourceIds = uniqueStrings([
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ]);
    const sourceId = sourceIds[0] ?? explicitSourceId ?? null;
    const sourceKind = readString(args.source_kind) ?? readString(args.sourceKind);
    const presetId = readString(args.preset_id) ?? readString(args.presetId);
    const basePresetId = readString(args.base_preset_id) ?? readString(args.basePresetId);
    const activityAction =
      input.tool_name === "live_env.apply_micro_reasoner_preset"
        ? "apply"
        : input.tool_name === "live_env.draft_micro_reasoner_preset"
          ? "draft"
        : input.tool_name === "live_env.create_micro_reasoner_preset"
          ? "create"
          : "query";
    const activityId = `stage_play_micro_reasoner_prompt_tool_activity:${hashShort([
      input.thread_id,
      input.environment_id ?? null,
      input.tool_name,
      sourceIds,
      presetId ?? basePresetId ?? null,
      Date.now(),
    ])}`;
    const now = new Date().toISOString();
    recordStagePlayMicroReasonerPromptToolActivity({
      activityId,
      toolName: input.tool_name,
      action: activityAction,
      status: "running",
      summary: `${input.tool_name} started.`,
      sourceIds,
      presetId: presetId ?? basePresetId ?? null,
      promptId: null,
      createdAt: now,
      updatedAt: now,
      evidenceRefs: uniqueStrings([presetId, basePresetId, ...sourceIds]),
    });

    if (input.tool_name === "live_env.draft_micro_reasoner_preset") {
      const draft = draftMicroReasonerPresetFromScenario({
        args,
        sourceIds,
        presetId,
        basePresetId,
        now,
      });
      const summary = `Drafted MicroDeck preset from ${draft.recommendedBasePresetTitle}.`;
      recordStagePlayMicroReasonerPromptToolActivity({
        activityId,
        toolName: input.tool_name,
        action: "draft",
        status: "completed",
        summary,
        sourceIds,
        presetId: draft.recommendedBasePresetId,
        promptId: null,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        evidenceRefs: uniqueStrings([draft.draftId, draft.recommendedBasePresetId, ...sourceIds]),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: true,
        summary,
        observation: draft,
        evidenceRefs: uniqueStrings([draft.draftId, draft.recommendedBasePresetId, ...draft.evidenceRefs, activityId]),
        producedRefs: [draft.draftId],
      });
    }

    if (input.tool_name === "live_env.apply_micro_reasoner_preset") {
      if (!presetId || sourceIds.length === 0) {
        recordStagePlayMicroReasonerPromptToolActivity({
          activityId,
          toolName: input.tool_name,
          action: "apply",
          status: "failed",
          summary: "MicroDeck preset apply requires preset_id/presetId and at least one source id.",
          sourceIds,
          presetId,
          promptId: null,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          evidenceRefs: uniqueStrings([presetId, ...sourceIds]),
        });
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: "MicroDeck preset apply requires a preset and source.",
          observation: {
            schema: "stage_play_micro_reasoner_prompt_preset_apply_response/v1",
            applied: false,
            reason: "missing_preset_or_source",
            presetId,
            sourceIds,
            source_ids: sourceIds,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: uniqueStrings([presetId, ...sourceIds, activityId]),
        });
      }
      const preset = applyStagePlayMicroReasonerPromptPreset({ presetId, sourceIds, sourceKind });
      const prompts = preset
        ? listStagePlayActiveMicroReasonerPromptsForSource({
            sourceId,
            sourceKind,
            presetId: preset.presetId,
          })
        : [];
      const summary = preset
        ? `Applied MicroDeck preset ${preset.title} to ${sourceIds.length} source(s).`
        : `MicroDeck preset was not found: ${presetId}.`;
      recordStagePlayMicroReasonerPromptToolActivity({
        activityId,
        toolName: input.tool_name,
        action: "apply",
        status: preset ? "completed" : "failed",
        summary,
        sourceIds,
        presetId,
        promptId: null,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        evidenceRefs: uniqueStrings([presetId, ...sourceIds, ...prompts.map((prompt) => prompt.promptId)]),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: Boolean(preset),
        summary,
        observation: {
          schema: "stage_play_micro_reasoner_prompt_preset_apply_response/v1",
          applied: Boolean(preset),
          reason: preset ? "applied" : "micro_reasoner_prompt_preset_not_found",
          preset,
          prompts,
          microReasonerPrompts: prompts,
          sourceIds,
          source_ids: sourceIds,
          toolActivities: listStagePlayMicroReasonerPromptToolActivities({ sourceId, limit: 10 }),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([presetId, ...sourceIds, ...prompts.map((prompt) => prompt.promptId), activityId]),
        producedRefs: preset ? uniqueStrings([preset.presetId]) : [],
      });
    }

    if (input.tool_name === "live_env.create_micro_reasoner_preset") {
      const candidateCount = rawDelegationCandidateCount(args);
      if (candidateCount > 0) {
        if (candidateCount > 3) {
          recordStagePlayMicroReasonerPromptToolActivity({
            activityId,
            toolName: input.tool_name,
            action: "create",
            status: "failed",
            summary: "Custom MicroDeck prompt-router presets accept at most three candidate prompts.",
            sourceIds,
            presetId: basePresetId ?? presetId,
            promptId: null,
            createdAt: now,
            updatedAt: new Date().toISOString(),
            evidenceRefs: uniqueStrings([basePresetId, presetId, ...sourceIds]),
          });
          return makeObservation({
            threadId: input.thread_id,
            environmentId: environment?.environment_id ?? input.environment_id,
            toolName: input.tool_name,
            ok: false,
            summary: "Custom MicroDeck prompt-router presets accept at most three candidate prompts.",
            observation: {
              schema: "stage_play_micro_reasoner_prompt_preset_create_response/v1",
              created: false,
              reason: "too_many_candidate_prompts",
              candidateCount,
              maxCandidatePrompts: 3,
              sourceIds,
              source_ids: sourceIds,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
              context_role: "tool_evidence",
              ask_context_policy: "evidence_only",
            },
            evidenceRefs: uniqueStrings([basePresetId, presetId, ...sourceIds, activityId]),
          });
        }
        const routerPreset = recordStagePlayPromptDelegationRouterPreset({
          title: readString(args.title),
          description: readString(args.description),
          candidates: delegationCandidatesFromArgs(args),
          sourceIds,
          confidenceThreshold: readNumber(args.confidence_threshold ?? args.confidenceThreshold, Number.NaN),
          escalationMode:
            readString(args.escalation_mode) === "suggest_only" ||
            readString(args.escalationMode) === "suggest_only"
              ? "suggest_only"
              : readString(args.escalation_mode) === "handoff_to_helix_ask" ||
                readString(args.escalationMode) === "handoff_to_helix_ask"
                ? "handoff_to_helix_ask"
                : "handoff_only_if_confident",
          allowNone: typeof args.allow_none === "boolean"
            ? args.allow_none
            : typeof args.allowNone === "boolean"
              ? args.allowNone
              : true,
          wakePromptContract: wakePromptContractFromArgs(args),
          now,
        });
        const prompts = routerPreset
          ? listStagePlayActiveMicroReasonerPromptsForSource({
              sourceId,
              presetId: routerPreset.presetId,
            })
          : [];
        const summary = routerPreset
          ? `Created custom MicroDeck prompt-router preset ${routerPreset.title}.`
          : "Custom MicroDeck prompt-router preset could not be created from the supplied candidates.";
        recordStagePlayMicroReasonerPromptToolActivity({
          activityId,
          toolName: input.tool_name,
          action: "create",
          status: routerPreset ? "completed" : "failed",
          summary,
          sourceIds,
          presetId: routerPreset?.presetId ?? basePresetId ?? presetId,
          promptId: routerPreset?.rolePromptIds.prompt_router ?? null,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          evidenceRefs: uniqueStrings([
            routerPreset?.presetId,
            routerPreset?.rolePromptIds.prompt_router,
            ...sourceIds,
            ...prompts.map((prompt) => prompt.promptId),
          ]),
        });
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: Boolean(routerPreset),
          summary,
          observation: {
            schema: "stage_play_micro_reasoner_prompt_preset_create_response/v1",
            created: Boolean(routerPreset),
            reason: routerPreset ? "created_prompt_delegation_router" : "custom_micro_reasoner_preset_not_created",
            preset: routerPreset,
            prompts,
            microReasonerPrompts: prompts,
            sourceIds,
            source_ids: sourceIds,
            toolActivities: listStagePlayMicroReasonerPromptToolActivities({ sourceId, limit: 10 }),
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: uniqueStrings([
            routerPreset?.presetId,
            routerPreset?.rolePromptIds.prompt_router,
            ...sourceIds,
            ...prompts.map((prompt) => prompt.promptId),
            activityId,
          ]),
          producedRefs: routerPreset ? uniqueStrings([routerPreset.presetId]) : [],
        });
      }
      const role = readMicroReasonerRole(args.role);
      const template = readString(args.template) ?? readString(args.prompt);
      if (!role || !template) {
        recordStagePlayMicroReasonerPromptToolActivity({
          activityId,
          toolName: input.tool_name,
          action: "create",
          status: "failed",
          summary: "Custom MicroDeck creation requires a valid role and template/prompt.",
          sourceIds,
          presetId: basePresetId ?? presetId,
          promptId: null,
          createdAt: now,
          updatedAt: new Date().toISOString(),
          evidenceRefs: uniqueStrings([basePresetId, presetId, ...sourceIds]),
        });
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: "Custom MicroDeck creation requires a valid role and prompt template.",
          observation: {
            schema: "stage_play_micro_reasoner_prompt_preset_create_response/v1",
            created: false,
            reason: !role ? "missing_or_invalid_role" : "missing_template",
            sourceIds,
            source_ids: sourceIds,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: uniqueStrings([basePresetId, presetId, ...sourceIds, activityId]),
        });
      }
      const result = recordStagePlayCustomMicroReasonerPromptPreset({
        title: readString(args.title),
        description: readString(args.description),
        basePresetId: basePresetId ?? presetId,
        role,
        template,
        sourceIds,
        promptedRoles: readMicroReasonerRoles(args.prompted_roles ?? args.promptedRoles),
      });
      const prompts = result
        ? listStagePlayActiveMicroReasonerPromptsForSource({
            sourceId,
            presetId: result.preset.presetId,
          })
        : [];
      const summary = result
        ? `Created custom MicroDeck preset ${result.preset.title}.`
        : "Custom MicroDeck preset could not be created from the supplied prompt.";
      recordStagePlayMicroReasonerPromptToolActivity({
        activityId,
        toolName: input.tool_name,
        action: "create",
        status: result ? "completed" : "failed",
        summary,
        sourceIds,
        presetId: result?.preset.presetId ?? basePresetId ?? presetId,
        promptId: result?.prompt.promptId ?? null,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        evidenceRefs: uniqueStrings([
          result?.preset.presetId,
          result?.prompt.promptId,
          ...sourceIds,
          ...prompts.map((prompt) => prompt.promptId),
        ]),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: Boolean(result),
        summary,
        observation: {
          schema: "stage_play_micro_reasoner_prompt_preset_create_response/v1",
          created: Boolean(result),
          reason: result ? "created" : "custom_micro_reasoner_preset_not_created",
          preset: result?.preset ?? null,
          prompt: result?.prompt ?? null,
          prompts,
          microReasonerPrompts: prompts,
          sourceIds,
          source_ids: sourceIds,
          toolActivities: listStagePlayMicroReasonerPromptToolActivities({ sourceId, limit: 10 }),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([
          result?.preset.presetId,
          result?.prompt.promptId,
          ...sourceIds,
          ...prompts.map((prompt) => prompt.promptId),
          activityId,
        ]),
        producedRefs: result ? uniqueStrings([result.preset.presetId, result.prompt.promptId]) : [],
      });
    }

    const presets = listStagePlayMicroReasonerPromptPresets({
      sourceId,
      sourceKind,
      includePresets: args.include_presets !== false && args.includePresets !== false,
      active: true,
      limit: readNumber(args.limit, 100),
    });
    const activePreset = getActiveStagePlayMicroReasonerPromptPresetForSource({
      sourceId,
      sourceKind,
      presetId,
    });
    const prompts = listStagePlayActiveMicroReasonerPromptsForSource({
      sourceId,
      sourceKind,
      presetId: activePreset?.presetId ?? presetId,
    });
    const summary = `Found ${presets.length} MicroDeck preset(s) and ${prompts.length} prompt(s).`;
    recordStagePlayMicroReasonerPromptToolActivity({
      activityId,
      toolName: input.tool_name,
      action: "query",
      status: "completed",
      summary,
      sourceIds,
      presetId: activePreset?.presetId ?? presetId,
      promptId: null,
      createdAt: now,
      updatedAt: new Date().toISOString(),
      evidenceRefs: uniqueStrings([
        activePreset?.presetId,
        ...presets.map((preset) => preset.presetId),
        ...prompts.map((prompt) => prompt.promptId),
        ...sourceIds,
      ]),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary,
      observation: {
        schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
        presets,
        activePreset,
        active_preset: activePreset,
        prompts,
        microReasonerPrompts: prompts,
        sourceId,
        source_id: sourceId,
        sourceKind,
        source_kind: sourceKind,
        sourceIds,
        source_ids: sourceIds,
        toolActivities: listStagePlayMicroReasonerPromptToolActivities({ sourceId, limit: 10 }),
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([
        activePreset?.presetId,
        ...presets.map((preset) => preset.presetId),
        ...prompts.map((prompt) => prompt.promptId),
        ...sourceIds,
        activityId,
      ]),
    });
  }

  if (
    input.tool_name === "live_env.query_micro_reasoner_prompts" ||
    input.tool_name === "live_env.update_micro_reasoner_prompt" ||
    input.tool_name === "live_env.test_micro_reasoner_prompt"
  ) {
    const role = readString(args.role) as any;
    const prompts = listStagePlayMicroReasonerPrompts({
      active: input.tool_name === "live_env.query_micro_reasoner_prompts" ? true : undefined,
      role,
      limit: readNumber(args.limit, 20),
    });
    if (input.tool_name === "live_env.update_micro_reasoner_prompt") {
      const existingPrompt = (readString(args.prompt_id) ?? readString(args.promptId))
        ? prompts.find((prompt) => prompt.promptId === (readString(args.prompt_id) ?? readString(args.promptId))) ?? null
        : role
          ? getActiveStagePlayMicroReasonerPromptForRole(role)
          : null;
      const template = readString(args.template);
      if (!existingPrompt || !template) {
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: "Micro-reasoner prompt update requires an existing prompt role/id and a replacement template.",
          observation: {
            schema: "stage_play_micro_reasoner_prompt_update_result/v1",
            updated: false,
            reason: !existingPrompt ? "prompt_not_found" : "missing_template",
            prompts,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: prompts.map((prompt) => prompt.promptId),
        });
      }
      const now = new Date().toISOString();
      const forked = args.activate === false || args.active === false
        ? null
        : recordStagePlayMicroReasonerPrompt({
            ...existingPrompt,
            promptId: `stage_play_micro_reasoner_prompt:${existingPrompt.role}:v${existingPrompt.version + 1}:${hashShort([template, now])}`,
            version: existingPrompt.version + 1,
            template,
            title: readString(args.title) ?? existingPrompt.title,
            active: true,
            updatedAt: now,
            createdAt: now,
          });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: Boolean(forked),
        summary: forked
          ? `Activated micro-reasoner prompt ${forked.title} v${forked.version}.`
          : "Prompt update was not activated.",
        observation: {
          schema: "stage_play_micro_reasoner_prompt_update_result/v1",
          updated: Boolean(forked),
          prompt: forked,
          previousPrompt: existingPrompt,
          previous_prompt: existingPrompt,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([forked?.promptId, existingPrompt.promptId]),
      });
    }
    if (input.tool_name === "live_env.test_micro_reasoner_prompt") {
      const scope = resolveLiveSourceToolScope({
        args,
        threadId: input.thread_id,
        effectiveThreadId,
        roomId,
        environmentThreadId: environment?.thread_id ?? null,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        explicitSourceId,
      });
      const mailItems = resolveImmersionMailItems({
        args,
        scopedInput: scope.scopedInput,
        roomId,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        sourceId: scope.sourceId,
        sourceKind: scope.sourceKind,
        defaultLimit: readNumber(args.limit, 5),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: true,
        summary: `Prepared prompt test context for ${mailItems.length} recent mail item(s); no prompt was activated.`,
        observation: {
          schema: "stage_play_micro_reasoner_prompt_test_result/v1",
          prompt: role ? getActiveStagePlayMicroReasonerPromptForRole(role) : prompts.at(-1) ?? null,
          mailItems,
          mail_items: mailItems,
          activated: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([
          ...(role ? [getActiveStagePlayMicroReasonerPromptForRole(role)?.promptId] : prompts.map((prompt) => prompt.promptId)),
          ...mailItems.map((item) => item.mailId),
          ...mailItems.flatMap((item) => item.evidenceRefs),
        ]),
      });
    }
    return makeObservation({
      threadId: input.thread_id,
      environmentId: environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Found ${prompts.length} active micro-reasoner prompt(s).`,
      observation: {
        schema: "stage_play_micro_reasoner_prompt_query_result/v1",
        prompts,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: prompts.map((prompt) => prompt.promptId),
    });
  }

  if (
    input.tool_name === "live_env.configure_visual_observer_profile" ||
    input.tool_name === "live_env.apply_visual_observer_profile" ||
    input.tool_name === "live_env.query_visual_observer_profiles" ||
    input.tool_name === "live_env.test_visual_observer_profile" ||
    input.tool_name === "live_env.compare_visual_observer_profiles" ||
    input.tool_name === "live_env.request_visual_action_replay"
  ) {
    ensureDefaultStagePlayVisualObserverProfiles();
    const sourceIds = uniqueStrings([
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ]);
    const sourceId = sourceIds[0] ?? explicitSourceId ?? null;
    const profileId = readString(args.profile_id) ?? readString(args.profileId);
    const domain = readString(args.domain);
    const parseSummary = (value: unknown): Record<string, unknown> | null => {
      const record = readRecord(value);
      if (record) return record;
      const text = readString(value);
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

    if (input.tool_name === "live_env.configure_visual_observer_profile") {
      const prompt = readString(args.prompt) ?? readString(args.interpretation_guidelines ?? args.interpretationGuidelines);
      if (!prompt) {
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: "Visual observer profile configuration requires a prompt.",
          observation: {
            schema: "stage_play_visual_observer_profile_config_result/v1",
            configured: false,
            reason: "missing_prompt",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: sourceIds,
        });
      }
      const profile = recordStagePlayVisualObserverProfile({
        title: readString(args.title),
        domain,
        subjectCategory: readString(args.subject_category) ?? readString(args.subjectCategory),
        subject: readString(args.subject),
        sourceIds,
        prompt,
        outputMode: readString(args.output_mode) ?? readString(args.outputMode),
        cadenceHintMs: readOptionalNumber(args.cadence_hint_ms ?? args.cadenceHintMs),
        linkedInterpreterProfileId:
          readString(args.linked_interpreter_profile_id) ?? readString(args.linkedInterpreterProfileId),
        linkedWatchJobPolicyId:
          readString(args.linked_watch_job_policy_id) ?? readString(args.linkedWatchJobPolicyId),
        linkedNoteId: readString(args.linked_note_id) ?? readString(args.linkedNoteId),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: true,
        summary: `Configured visual observer profile ${profile.title}.`,
        observation: {
          schema: "stage_play_visual_observer_profile_config_result/v1",
          profile,
          policy: profile,
          profileCount: listStagePlayVisualObserverProfiles({ includePresets: true, limit: 250 }).length,
          profile_count: listStagePlayVisualObserverProfiles({ includePresets: true, limit: 250 }).length,
          watchJobPolicyRef: profile.linkedWatchJobPolicyId ?? null,
          visualObserverProfileRef: profile.profileId,
          visual_observer_profile_ref: profile.profileId,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([profile.profileId, ...profile.sourceIds]),
      });
    }

    if (input.tool_name === "live_env.apply_visual_observer_profile") {
      const profile = profileId ? applyStagePlayVisualObserverProfile({ profileId, sourceIds }) : null;
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: Boolean(profile),
        summary: profile
          ? `Applied visual observer profile ${profile.title} to ${sourceIds.length} source(s).`
          : "Visual observer profile apply failed: profile id and source ids are required.",
        observation: {
          schema: "stage_play_visual_observer_profile_apply_response/v1",
          profile,
          sourceIds,
          source_ids: sourceIds,
          applied: Boolean(profile),
          reason: profile ? "applied" : "missing_or_unknown_profile",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([profile?.profileId, ...sourceIds]),
      });
    }

    if (input.tool_name === "live_env.request_visual_action_replay") {
      const shadeProfileIds = uniqueStrings([
        ...readStringArray(args.shade_profile_ids ?? args.shadeProfileIds ?? args.profile_ids ?? args.profileIds),
        profileId,
      ]);
      const frameHistoryIds = readStringArray(args.frame_history_ids ?? args.frameHistoryIds ?? args.history_ids ?? args.historyIds);
      const frameIds = readStringArray(args.frame_ids ?? args.frameIds);
      if (!sourceId || shadeProfileIds.length === 0) {
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: "Visual action replay request requires a visual source id and at least one shade profile id.",
          observation: {
            schema: "helix.visual_frame_action_replay_request_response.v1",
            replay_request: null,
            requested: false,
            reason: "missing_source_or_shade_profile",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: uniqueStrings([sourceId, ...shadeProfileIds]),
        });
      }
      const replay = requestVisualFrameActionReplay({
        thread_id: input.thread_id,
        room_id: roomId,
        environment_id: environment?.environment_id ?? input.environment_id,
        source_id: sourceId,
        frame_history_ids: frameHistoryIds,
        frame_ids: frameIds,
        from_ts: readString(args.from_ts ?? args.fromTs),
        to_ts: readString(args.to_ts ?? args.toTs),
        summary_query: readString(args.summary_query ?? args.summaryQuery),
        shade_profile_ids: shadeProfileIds,
        max_frames: readOptionalNumber(args.max_frames ?? args.maxFrames),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: true,
        summary: `Requested visual action replay for ${sourceId}; waiting for the browser panel to provide matching local frames.`,
        observation: {
          schema: "helix.visual_frame_action_replay_request_response.v1",
          replay_request: replay,
          requested: true,
          client_mediated: true,
          raw_frames_server_persisted: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([
          replay.replay_request_id,
          replay.source_id,
          ...replay.requested_frame_history_ids,
          ...replay.requested_frame_ids,
          ...replay.shade_profile_ids,
        ]),
      });
    }

    if (input.tool_name === "live_env.test_visual_observer_profile" || input.tool_name === "live_env.compare_visual_observer_profiles") {
      const selectedProfile =
        (profileId ? getStagePlayVisualObserverProfile(profileId) : null) ??
        getActiveStagePlayVisualObserverProfileForSource({ sourceId, domain }) ??
        null;
      const genericSummary = readString(args.generic_summary) ?? readString(args.genericSummary);
      const profileSummary =
        readString(args.profile_summary) ??
        readString(args.profileSummary) ??
        readString(args.summary);
      const parsedProfileOutput = parseSummary(args.profile_output ?? args.profileOutput ?? profileSummary);
      const parsedGenericOutput = parseSummary(args.generic_output ?? args.genericOutput ?? genericSummary);
      const ok = Boolean(selectedProfile);
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok,
        summary: ok
          ? `${input.tool_name === "live_env.compare_visual_observer_profiles" ? "Compared" : "Prepared test for"} visual observer profile ${selectedProfile.title}; no mail was enqueued.`
          : "No visual observer profile was available for the requested test.",
        observation: {
          schema: "stage_play_visual_observer_profile_test_result/v1",
          profile: selectedProfile,
          sourceId,
          source_id: sourceId,
          genericSummary: genericSummary ?? null,
          generic_summary: genericSummary ?? null,
          profileSummary: profileSummary ?? null,
          profile_summary: profileSummary ?? null,
          parsedGenericOutput,
          parsed_generic_output: parsedGenericOutput,
          parsedProfileOutput,
          parsed_profile_output: parsedProfileOutput,
          parseOk: Boolean(parsedProfileOutput),
          parse_ok: Boolean(parsedProfileOutput),
          enqueuedAsMail: false,
          enqueued_as_mail: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([selectedProfile?.profileId, sourceId]),
      });
    }

    const profiles = listStagePlayVisualObserverProfiles({
      sourceId,
      domain,
      status: readString(args.status),
      includePresets: args.include_presets !== false && args.includePresets !== false,
      limit: readNumber(args.limit, 100),
    });
    const activeProfile = getActiveStagePlayVisualObserverProfileForSource({ sourceId, domain });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Found ${profiles.length} visual observer profile(s).`,
      observation: {
        schema: "stage_play_visual_observer_profile_list_response/v1",
        profiles,
        activeProfile,
        active_profile: activeProfile,
        sourceId,
        source_id: sourceId,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([
        activeProfile?.profileId,
        ...profiles.map((profile) => profile.profileId),
        sourceId,
      ]),
    });
  }

  if (
    input.tool_name === "live_env.process_live_source_mail" ||
    input.tool_name === "live_env.read_processed_live_source_mail"
  ) {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const mailItems = resolveImmersionMailItems({
      args,
      scopedInput: {
        ...scope.scopedInput,
        environment_id: environmentId,
      },
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      defaultLimit: 12,
    });
    const existingPackets = listStagePlayProcessedMailPackets({
      sourceId: scope.sourceId,
      limit: 50,
    }).filter((packet) =>
      packet.mailIds.some((mailId) => mailItems.some((item) => item.mailId === mailId))
    );
    const coveredMailIds = new Set(existingPackets.flatMap((packet) => packet.mailIds));
    const missingRawMailItems = mailItems.filter((item) => !coveredMailIds.has(item.mailId));
    const autoProcessMissing =
      args.auto_process_missing === false ||
      args.autoProcessMissing === false ||
      args.process_missing === false ||
      args.processMissing === false ||
      args.read_only === true ||
      args.readOnly === true
        ? false
        : true;
    const shouldProcess =
      input.tool_name === "live_env.process_live_source_mail" ||
      (autoProcessMissing && missingRawMailItems.length > 0);
    const generated = shouldProcess
      ? processLiveSourceMailItemsForTool({
          args,
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          roomId,
          environmentId,
          sourceId: scope.sourceId ?? mailItems[0]?.sourceId ?? null,
          sourceKind: scope.sourceKind ?? mailItems[0]?.sourceKind ?? null,
          mailItems,
        })
      : null;
    const packets = uniqueStrings([
      ...existingPackets.map((packet) => packet.packetId),
      generated?.processedPacket.packetId,
    ])
      .map((packetId) =>
        [generated?.processedPacket, ...existingPackets].find((packet) => packet?.packetId === packetId) ?? null
      )
      .filter((packet): packet is StagePlayProcessedMailPacketV1 => Boolean(packet));
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId: scope.sourceId,
      limit: 100,
    }).filter((run) =>
      packets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    const missingRawMailIds = mailItems
      .filter((item) => !packets.some((packet) => packet.mailIds.includes(item.mailId)))
      .map((item) => item.mailId);
    const resolutionStateSummary = packets.length > 0
      ? packets.map((packet) => `${packet.packetId}: ${packet.resolutionState}; ${packet.recommendedNext}; ${packet.salience.level}`).join(" | ")
      : "No processed packets are available yet.";
    const microReasonerRunRefs = uniqueStrings(microReasonerRuns.map((run) => run.runId));
    const transcriptRows = buildProcessedMailTranscriptRows({
      toolName: input.tool_name,
      packets,
      missingRawMailIds,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      microReasonerRuns,
      microReasonerRunRefs,
      resolutionStateSummary,
    });
    const goalContextUpdates = packets.length > 0
      ? syncStagePlayGoalContextFromMailbox({
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          roomId,
          mailItems,
          processedMailPackets: packets,
          microReasonerRuns,
        }).filter((update) =>
          packets.some((packet) => update.contentRef === packet.packetId || packet.mailIds.includes(update.contentRef))
        )
      : [];
    const goalContextUpdateIds = goalContextUpdates.map((update) => update.updateId);
    const processedPacketIds = packets.map((packet) => packet.packetId);
    const wakeRequestId = liveSourceWakeRequestIdFromArgs(args);
    const askTurnId = liveSourceAskTurnIdFromArgs(args);
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok: packets.length > 0,
      summary: packets.length > 0
        ? `Read ${packets.length} processed live-source packet(s); ${missingRawMailIds.length} raw mail item(s) still missing packet coverage.`
        : "No processed live-source packets were available; raw mail fallback may be required.",
      observation: {
        schema: "stage_play_processed_live_source_mail_read_result/v1",
        packets,
        missingRawMailIds,
        missing_raw_mail_ids: missingRawMailIds,
        resolutionStateSummary,
        resolution_state_summary: resolutionStateSummary,
        microReasonerRuns,
        micro_reasoner_runs: microReasonerRuns,
        microReasonerRunRefs,
        micro_reasoner_run_refs: microReasonerRunRefs,
        processedPacketRefs: packets.map((packet) => packet.packetId),
        processed_packet_refs: packets.map((packet) => packet.packetId),
        goalContextUpdates,
        goal_context_updates: goalContextUpdates,
        goalContextUpdateRefs: goalContextUpdateIds,
        goal_context_update_refs: goalContextUpdateIds,
        transcriptRows,
        transcript_rows: transcriptRows,
        autoProcessMissing,
        auto_process_missing: autoProcessMissing,
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution: scope.mailboxThreadResolution,
        mailbox_thread_resolution: scope.mailboxThreadResolution,
        fallbackTool: missingRawMailIds.length > 0
          ? "live_env.process_live_source_mail"
          : null,
        fallback_tool: missingRawMailIds.length > 0
          ? "live_env.process_live_source_mail"
          : null,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([
        scope.mailboxThreadResolution.mailboxThreadId,
        ...goalContextUpdateIds,
        ...packets.flatMap((packet) => packet.evidenceRefs),
        ...microReasonerRuns.map((run) => run.runId),
        ...mailItems.map((item) => item.mailId),
      ]),
      producedRefs: uniqueStrings([...processedPacketIds, ...goalContextUpdateIds]),
      artifactRefs: {
        processedPacketIds,
        goalContextUpdateIds,
        wakeRequestId,
        askTurnId,
      },
      forceNormalizedRefs: true,
      transcriptRows,
    });
  }

  if (
    input.tool_name === "live_env.query_workstation_goal_context" ||
    input.tool_name === "live_env.start_agent_goal_session"
  ) {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const sourceRef =
      readString(args.source_ref) ??
      readString(args.sourceRef) ??
      scope.sourceId ??
      null;
    const objectiveText =
      readString(args.objective) ??
      readString(args.objective_text) ??
      readString(args.objectiveText) ??
      environment?.objective ??
      null;

    if (input.tool_name === "live_env.start_agent_goal_session") {
      const session = ensureStagePlayAgentGoalSession({
        threadId: scope.mailboxThreadResolution.mailboxThreadId,
        roomId,
        objectiveId: readString(args.goal_id) ?? readString(args.goalId),
        objectiveText,
        sourceRefs: uniqueStrings([
          sourceRef,
          ...readStringArray(args.source_refs ?? args.sourceRefs ?? args.source_ids ?? args.sourceIds),
        ]),
        loopRefs: uniqueStrings([
          `thread:${scope.mailboxThreadResolution.mailboxThreadId}`,
          `stage_play_mail_loop:${scope.mailboxThreadResolution.mailboxThreadId}`,
          ...readStringArray(args.loop_refs ?? args.loopRefs),
        ]),
        constructRefs: readStringArray(args.construct_refs ?? args.constructRefs),
        contextFeeds: readAgentGoalContextFeeds(args.context_feeds ?? args.contextFeeds),
        allowedActuators: readAgentGoalAllowedActuators(args.allowed_actuators ?? args.allowedActuators),
        cadence: readAgentGoalCadence(args),
        stopConditions: readStringArray(args.stop_conditions ?? args.stopConditions),
        finalReportRequirements: readAgentGoalFinalReportRequirements(args),
        checkpoint: readAgentGoalCheckpoint(args),
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId,
        toolName: input.tool_name,
        ok: Boolean(session),
        summary: session
          ? `Started or updated workstation goal session ${session.goalId}.`
          : "A workstation goal session requires an objective before it can be started.",
        observation: {
          schema: "stage_play_agent_goal_session_tool_result/v1",
          session,
          mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
          mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
          mailboxThreadResolution: scope.mailboxThreadResolution,
          mailbox_thread_resolution: scope.mailboxThreadResolution,
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([
          session?.goalId,
          scope.mailboxThreadResolution.mailboxThreadId,
          sourceRef,
          ...(session?.sourceRefs ?? []),
          ...(session?.loopRefs ?? []),
        ]),
        producedRefs: session ? [session.goalId] : [],
        forceNormalizedRefs: true,
      });
    }

    const mailLimit = Math.max(1, Math.min(readNumber(args.mail_limit ?? args.mailLimit, 24), 80));
    const updateLimit = Math.max(1, Math.min(readNumber(args.limit, 40), 120));
    const mailItems = listStagePlayLiveSourceMailItems({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      limit: mailLimit,
    });
    const mailIds = new Set(mailItems.map((item) => item.mailId));
    const processedMailPackets = listStagePlayProcessedMailPackets({
      sourceId: scope.sourceId,
      limit: 80,
    }).filter((packet) =>
      mailIds.size === 0 ||
      packet.mailIds.some((mailId) => mailIds.has(mailId))
    );
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId: scope.sourceId,
      limit: 120,
    }).filter((run) =>
      run.mailIds.some((mailId) => mailIds.has(mailId)) ||
      processedMailPackets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    const decisions = listStagePlayMailDecisions({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 40,
    });
    const wakeRequests = listStagePlayLiveSourceMailWakeRequests({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 40,
    });
    const wakeResults = listStagePlayLiveSourceMailWakeResults({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      limit: 40,
    });
    syncStagePlayGoalContextFromMailbox({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      mailItems,
      processedMailPackets,
      microReasonerRuns,
      decisions,
      wakeRequests,
      wakeResults,
    });
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const goalContextUpdates = listStagePlayGoalContextUpdates({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      sourceRef,
      loopRef: readString(args.loop_ref) ?? readString(args.loopRef),
      contentRef: readString(args.content_ref) ?? readString(args.contentRef),
      goalId,
      producerKind: readString(args.producer_kind) ?? readString(args.producerKind),
      updateKind: readString(args.update_kind) ?? readString(args.updateKind),
      limit: updateLimit,
    });
    const agentGoalSessions = listStagePlayAgentGoalSessions({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      goalId,
      sourceRef,
      status: readString(args.status),
      limit: Math.min(updateLimit, 50),
    });
    const authoritySummary = summarizeGoalContextAuthority({
      updates: goalContextUpdates,
      sessions: agentGoalSessions,
    });
    const evidenceRefs = uniqueStrings([
      scope.mailboxThreadResolution.mailboxThreadId,
      ...mailItems.map((item) => item.mailId),
      ...processedMailPackets.map((packet) => packet.packetId),
      ...microReasonerRuns.map((run) => run.runId),
      ...goalContextUpdates.flatMap((update) => [
        update.updateId,
        update.contentRef,
        ...update.evidenceRefs,
        ...update.receiptRefs,
      ]),
      ...agentGoalSessions.map((session) => session.goalId),
    ]);
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok: true,
      summary: `Read ${goalContextUpdates.length} workstation goal-context update(s) and ${agentGoalSessions.length} goal session(s).`,
      observation: {
        schema: "stage_play_workstation_goal_context_read_result/v1",
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution: scope.mailboxThreadResolution,
        mailbox_thread_resolution: scope.mailboxThreadResolution,
        goalContextUpdates,
        goal_context_updates: goalContextUpdates,
        agentGoalSessions,
        agent_goal_sessions: agentGoalSessions,
        authoritySummary,
        authority_summary: authoritySummary,
        syncedWindow: {
          mailItemCount: mailItems.length,
          processedPacketCount: processedMailPackets.length,
          microReasonerRunCount: microReasonerRuns.length,
        },
        synced_window: {
          mail_item_count: mailItems.length,
          processed_packet_count: processedMailPackets.length,
          micro_reasoner_run_count: microReasonerRuns.length,
        },
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs,
      producedRefs: [
        ...goalContextUpdates.map((update) => update.updateId),
        ...agentGoalSessions.map((session) => session.goalId),
      ],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.query_packet_traces") {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const sourceRef =
      readString(args.source_ref) ??
      readString(args.sourceRef) ??
      readString(args.source_id) ??
      readString(args.sourceId) ??
      scope.sourceId ??
      null;
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const packetId = readString(args.packet_id) ?? readString(args.packetId);
    const limit = Math.max(1, Math.min(readNumber(args.limit, 12), 50));
    const mailLimit = Math.max(1, Math.min(readNumber(args.mail_limit ?? args.mailLimit, 40), 120));
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const feedAllowed = !goalId || goalSessionFeedAllowed(goalSession, "packet_traces");
    const actuatorAllowed = !goalId || goalSessionActuatorAllowed(goalSession, "query_packet_traces");
    const missingRequirements = goalId
      ? goalSession
        ? [
            ...(feedAllowed ? [] : ["context_feed:packet_traces"]),
            ...(actuatorAllowed ? [] : ["allowed_actuator:query_packet_traces"]),
          ]
        : ["goal_session"]
      : [];
    const ok = missingRequirements.length === 0;
    const mailItems = listStagePlayLiveSourceMailItems({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      limit: mailLimit,
    });
    const mailIds = new Set(mailItems.map((item) => item.mailId));
    const processedMailPackets = listStagePlayProcessedMailPackets({
      sourceId: scope.sourceId,
      limit: 160,
    })
      .filter((packet) =>
        (!packetId || packet.packetId === packetId) &&
        (mailIds.size === 0 || packet.mailIds.some((mailId) => mailIds.has(mailId)))
      )
      .slice(-limit);
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId: scope.sourceId,
      limit: 200,
    }).filter((run) =>
      run.mailIds.some((mailId) => mailIds.has(mailId)) ||
      processedMailPackets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    const decisions = listStagePlayMailDecisions({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 80,
    });
    const wakeRequests = listStagePlayLiveSourceMailWakeRequests({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 80,
    });
    const wakeResults = listStagePlayLiveSourceMailWakeResults({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      limit: 80,
    });
    syncStagePlayGoalContextFromMailbox({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      mailItems,
      processedMailPackets,
      microReasonerRuns,
      decisions,
      wakeRequests,
      wakeResults,
    });
    const goalContextUpdates = ok
      ? processedMailPackets.flatMap((packet) =>
          listStagePlayGoalContextUpdates({
            threadId: scope.mailboxThreadResolution.mailboxThreadId,
            contentRef: packet.packetId,
            limit: 8,
          })
        )
      : [];
    const packetTraces = ok
      ? processedMailPackets.map((packet) => {
          const causalTrace = mergeLiveSourceCausalTraces([packet.causalTrace], {
            producedRefs: [packet.packetId],
            causedBy: packet.mailIds,
            sourceIds: [packet.sourceId],
            jobId: packet.jobId,
            evidenceRefs: uniqueStrings([
              packet.packetId,
              ...packet.evidenceRefs,
              ...packet.visualEvidenceRefs,
              ...packet.microReasonerRunRefs,
            ]),
          });
          const packetDecisions = decisions.filter((decision) =>
            decision.mailIds.some((mailId) => packet.mailIds.includes(mailId))
          );
          const packetWakeRequests = wakeRequests.filter((wake) => wake.packetIds?.includes(packet.packetId));
          const packetWakeResults = wakeResults.filter((result) => result.packetIds?.includes(packet.packetId));
          return {
            packetId: packet.packetId,
            packet_id: packet.packetId,
            sourceId: packet.sourceId,
            source_id: packet.sourceId,
            jobId: packet.jobId,
            job_id: packet.jobId,
            mailIds: packet.mailIds,
            mail_ids: packet.mailIds,
            microReasonerRunRefs: packet.microReasonerRunRefs,
            micro_reasoner_run_refs: packet.microReasonerRunRefs,
            recommendedNext: packet.recommendedNext,
            recommended_next: packet.recommendedNext,
            resolutionState: packet.resolutionState,
            resolution_state: packet.resolutionState,
            salienceLevel: packet.salience.level,
            salience_level: packet.salience.level,
            causalTrace,
            causal_trace: causalTrace,
            decisionRefs: packetDecisions.map((decision) => decision.decisionId),
            decision_refs: packetDecisions.map((decision) => decision.decisionId),
            wakeRequestRefs: packetWakeRequests.map((wake) => wake.wakeRequestId),
            wake_request_refs: packetWakeRequests.map((wake) => wake.wakeRequestId),
            wakeResultRefs: packetWakeResults.map((result) => result.wakeResultId),
            wake_result_refs: packetWakeResults.map((result) => result.wakeResultId),
            goalContextUpdateRefs: goalContextUpdates
              .filter((update) => update.contentRef === packet.packetId)
              .map((update) => update.updateId),
            goal_context_update_refs: goalContextUpdates
              .filter((update) => update.contentRef === packet.packetId)
              .map((update) => update.updateId),
            evidenceRefs: uniqueStrings([
              packet.packetId,
              ...packet.evidenceRefs,
              ...packet.visualEvidenceRefs,
              ...packet.microReasonerRunRefs,
              ...packetDecisions.map((decision) => decision.decisionId),
              ...packetWakeRequests.map((wake) => wake.wakeRequestId),
              ...packetWakeResults.map((result) => result.wakeResultId),
            ]),
            evidence_refs: uniqueStrings([
              packet.packetId,
              ...packet.evidenceRefs,
              ...packet.visualEvidenceRefs,
              ...packet.microReasonerRunRefs,
              ...packetDecisions.map((decision) => decision.decisionId),
              ...packetWakeRequests.map((wake) => wake.wakeRequestId),
              ...packetWakeResults.map((result) => result.wakeResultId),
            ]),
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          };
        })
      : [];
    const resultId = `stage_play_packet_trace_query:${hashShort([
      input.thread_id,
      sourceRef,
      goalId,
      packetId,
      processedMailPackets.map((packet) => packet.packetId),
    ])}`;
    const evidenceRefs = uniqueStrings([
      resultId,
      scope.mailboxThreadResolution.mailboxThreadId,
      ...packetTraces.flatMap((trace) => trace.evidenceRefs),
      ...goalContextUpdates.flatMap((update) => [update.updateId, update.contentRef, ...update.evidenceRefs, ...update.receiptRefs]),
    ]);
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
      contentRef: resultId,
      preview: ok
        ? packetTraces.length > 0
          ? `Queried ${packetTraces.length} packet trace(s) for workstation packet debugging.`
          : "No packet traces are currently available for this workstation scope."
        : `Blocked packet trace query; missing ${missingRequirements.join(", ")}.`,
      sourceRefs: uniqueStrings([
        sourceRef,
        scope.sourceId,
        ...processedMailPackets.map((packet) => packet.sourceId),
      ]),
      loopRefs: uniqueStrings([
        `packet_trace_query:${scope.mailboxThreadResolution.mailboxThreadId}`,
        ...processedMailPackets.flatMap((packet) => [
          packet.packetId,
          packet.jobId,
          packet.causalTrace?.traceId,
          packet.causalTrace?.cycleId,
        ]),
      ]),
      evidenceRefs,
      receiptRefs: [resultId],
      freshnessStatus: ok ? (packetTraces.length > 0 ? "fresh" : "unknown") : "blocked",
      goalId,
      goalRelevanceReason: "The agent queried per-packet traffic as goal-context evidence.",
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: resultId },
        ...(goalId && ok ? [{ kind: "append_goal_context" as const, goalId }] : []),
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        { kind: "update_panel", panelId: "live-answer-environment" },
      ],
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          roomId,
          sourceRefs: uniqueStrings([sourceRef, scope.sourceId, ...processedMailPackets.map((packet) => packet.sourceId)]),
          loopRefs: uniqueStrings([
            `packet_trace_query:${scope.mailboxThreadResolution.mailboxThreadId}`,
            ...processedMailPackets.flatMap((packet) => [packet.packetId, packet.jobId, packet.causalTrace?.traceId]),
          ]),
          evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]).slice(0, 80),
          actionsTaken: ["query_packet_traces", input.tool_name],
          summary: `Queried packet traces and read ${packetTraces.length} packet trace(s) for this goal session.`,
          nextStep: packetTraces.length > 0 ? "continue" : "ask_user",
        })
      : goalSession;
    const authoritySummary = summarizeGoalContextAuthority({
      updates: goalContextUpdates,
      sessions: checkpointedGoalSession ? [checkpointedGoalSession] : [],
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? `Read ${packetTraces.length} packet trace(s).`
        : `Cannot read packet traces; missing ${missingRequirements.join(", ")}.`,
      observation: {
        schema: "stage_play_packet_trace_query_result/v1",
        resultId,
        result_id: resultId,
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution: scope.mailboxThreadResolution,
        mailbox_thread_resolution: scope.mailboxThreadResolution,
        sourceRef,
        source_ref: sourceRef,
        goalId,
        goal_id: goalId,
        packetId,
        packet_id: packetId,
        status: ok ? "read" : "blocked",
        missingRequirements,
        missing_requirements: missingRequirements,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        feedAllowed,
        feed_allowed: feedAllowed,
        requiredFeed: "packet_traces",
        required_feed: "packet_traces",
        requiredActuator: "query_packet_traces",
        required_actuator: "query_packet_traces",
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        agentGoalSession: checkpointedGoalSession,
        agent_goal_session: checkpointedGoalSession,
        packetTraces,
        packet_traces: packetTraces,
        goalContextUpdates,
        goal_context_updates: goalContextUpdates,
        authoritySummary,
        authority_summary: authoritySummary,
        traceCount: packetTraces.length,
        trace_count: packetTraces.length,
        syncedWindow: {
          mailItemCount: mailItems.length,
          processedPacketCount: processedMailPackets.length,
          microReasonerRunCount: microReasonerRuns.length,
        },
        synced_window: {
          mail_item_count: mailItems.length,
          processed_packet_count: processedMailPackets.length,
          micro_reasoner_run_count: microReasonerRuns.length,
        },
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]),
      producedRefs: [goalContextUpdateId, resultId, ...processedMailPackets.map((packet) => packet.packetId)],
      artifactRefs: {
        processedPacketIds: processedMailPackets.map((packet) => packet.packetId),
      },
      forceNormalizedRefs: true,
    });
  }

  const feedQuerySpec = readWorkstationContextFeedQuerySpec(input.tool_name);
  if (feedQuerySpec) {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const sourceRef =
      readString(args.source_ref) ??
      readString(args.sourceRef) ??
      readString(args.source_id) ??
      readString(args.sourceId) ??
      scope.sourceId ??
      null;
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const limit = Math.max(1, Math.min(readNumber(args.limit, 24), 80));
    const mailLimit = Math.max(1, Math.min(readNumber(args.mail_limit ?? args.mailLimit, 32), 100));
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const feedAllowed = !goalId || goalSessionFeedAllowed(goalSession, feedQuerySpec.feedKind);
    const actuatorAllowed = !goalId || goalSessionActuatorAllowed(goalSession, feedQuerySpec.actuator);
    const feedMissingRequirements = goalId
      ? goalSession
        ? [
            ...(feedAllowed ? [] : [`context_feed:${feedQuerySpec.feedKind}`]),
            ...(actuatorAllowed ? [] : [`allowed_actuator:${feedQuerySpec.actuator}`]),
          ]
        : ["goal_session"]
      : [];
    const ok = feedMissingRequirements.length === 0;
    const mailItems = listStagePlayLiveSourceMailItems({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      limit: mailLimit,
    });
    const mailIds = new Set(mailItems.map((item) => item.mailId));
    const processedMailPackets = listStagePlayProcessedMailPackets({
      sourceId: scope.sourceId,
      limit: 120,
    }).filter((packet) =>
      mailIds.size === 0 ||
      packet.mailIds.some((mailId) => mailIds.has(mailId))
    );
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId: scope.sourceId,
      limit: 160,
    }).filter((run) =>
      run.mailIds.some((mailId) => mailIds.has(mailId)) ||
      processedMailPackets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    const decisions = listStagePlayMailDecisions({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 60,
    });
    const wakeRequests = listStagePlayLiveSourceMailWakeRequests({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 60,
    });
    const wakeResults = listStagePlayLiveSourceMailWakeResults({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      limit: 60,
    });
    syncStagePlayGoalContextFromMailbox({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      mailItems,
      processedMailPackets,
      microReasonerRuns,
      decisions,
      wakeRequests,
      wakeResults,
    });
    const goalContextUpdates = listStagePlayGoalContextUpdates({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      sourceRef,
      goalId: goalSession ? null : goalId,
      limit: 200,
    })
      .filter((update) =>
        feedQuerySpec.producerKinds.includes(update.producerKind) ||
        feedQuerySpec.updateKinds.includes(update.updateKind)
      )
      .slice(0, ok ? limit : 0);
    const resultId = `stage_play_context_feed_query:${feedQuerySpec.feedKind}:${hashShort([
      input.thread_id,
      sourceRef,
      goalId,
      goalContextUpdates.map((update) => update.updateId),
    ])}`;
    const evidenceRefs = uniqueStrings([
      resultId,
      ...goalContextUpdates.flatMap((update) => [
        update.updateId,
        update.contentRef,
        ...update.evidenceRefs,
        ...update.receiptRefs,
      ]),
    ]);
    const dispatch: WorkstationDispatchActionV1[] = [
      { kind: "log_receipt", receiptRef: resultId },
      ...(goalId && ok ? [{ kind: "append_goal_context" as const, goalId }] : []),
      { kind: "update_panel", panelId: "stage-play-badge-graph" },
      { kind: "update_panel", panelId: "live-answer-environment" },
    ];
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: "route_watch",
      updateKind: "route_evidence",
      contentRef: resultId,
      preview: ok
        ? goalContextUpdates.length > 0
          ? `Queried ${goalContextUpdates.length} ${feedQuerySpec.label} update(s) from workstation goal context.`
          : `No ${feedQuerySpec.label} updates are currently available for this workstation scope.`
        : `Blocked ${feedQuerySpec.label} feed query; missing ${feedMissingRequirements.join(", ")}.`,
      sourceRefs: uniqueStrings([
        sourceRef,
        scope.sourceId,
        ...goalContextUpdates.flatMap((update) => update.sourceRefs),
      ]),
      loopRefs: uniqueStrings([
        ...goalContextUpdates.flatMap((update) => update.loopRefs),
        `workstation_context_feed:${feedQuerySpec.feedKind}`,
      ]),
      evidenceRefs,
      receiptRefs: [resultId],
      freshnessStatus: ok ? (goalContextUpdates.length > 0 ? "fresh" : "unknown") : "blocked",
      goalId,
      goalRelevanceReason: `The agent queried ${feedQuerySpec.label} as a feed-specific goal-context input.`,
      suggestedDispatch: dispatch,
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: scope.mailboxThreadResolution.mailboxThreadId,
          roomId,
          sourceRefs: uniqueStrings([
            sourceRef,
            scope.sourceId,
            ...goalContextUpdates.flatMap((update) => update.sourceRefs),
          ]),
          loopRefs: uniqueStrings([
            ...goalContextUpdates.flatMap((update) => update.loopRefs),
            `workstation_context_feed:${feedQuerySpec.feedKind}`,
          ]),
          evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]).slice(0, 80),
          actionsTaken: [feedQuerySpec.actuator, input.tool_name],
          summary: `Queried ${feedQuerySpec.label} feed and read ${goalContextUpdates.length} update(s) for this goal session.`,
          nextStep: goalContextUpdates.length > 0 ? "continue" : "ask_user",
        })
      : goalSession;
    const authoritySummary = summarizeGoalContextAuthority({
      updates: goalContextUpdates,
      sessions: checkpointedGoalSession ? [checkpointedGoalSession] : [],
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? `Read ${goalContextUpdates.length} ${feedQuerySpec.label} goal-context update(s).`
        : `Cannot read ${feedQuerySpec.label}; missing ${feedMissingRequirements.join(", ")}.`,
      observation: {
        schema: "stage_play_workstation_context_feed_query_result/v1",
        resultId,
        result_id: resultId,
        feedKind: feedQuerySpec.feedKind,
        feed_kind: feedQuerySpec.feedKind,
        label: feedQuerySpec.label,
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution: scope.mailboxThreadResolution,
        mailbox_thread_resolution: scope.mailboxThreadResolution,
        sourceRef,
        source_ref: sourceRef,
        goalId,
        goal_id: goalId,
        status: ok ? "read" : "blocked",
        missingRequirements: feedMissingRequirements,
        missing_requirements: feedMissingRequirements,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        feedAllowed,
        feed_allowed: feedAllowed,
        requiredActuator: feedQuerySpec.actuator,
        required_actuator: feedQuerySpec.actuator,
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        agentGoalSession: checkpointedGoalSession,
        agent_goal_session: checkpointedGoalSession,
        goalContextUpdates,
        goal_context_updates: goalContextUpdates,
        authoritySummary,
        authority_summary: authoritySummary,
        updateCount: goalContextUpdates.length,
        update_count: goalContextUpdates.length,
        syncedWindow: {
          mailItemCount: mailItems.length,
          processedPacketCount: processedMailPackets.length,
          microReasonerRunCount: microReasonerRuns.length,
        },
        synced_window: {
          mail_item_count: mailItems.length,
          processed_packet_count: processedMailPackets.length,
          micro_reasoner_run_count: microReasonerRuns.length,
        },
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([goalContextUpdateId, ...evidenceRefs]),
      producedRefs: [goalContextUpdateId, resultId, ...goalContextUpdates.map((update) => update.updateId)],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.query_trace_memory") {
    const limit = Math.max(1, Math.min(readNumber(args.limit, 12), 50));
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: input.thread_id,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const feedAllowed = !goalId || goalSessionFeedAllowed(goalSession, "trace_memory");
    const actuatorAllowed = !goalId || goalSessionActuatorAllowed(goalSession, "query_trace_memory");
    const feedMissingRequirements = goalId
      ? goalSession
        ? [
            ...(feedAllowed ? [] : ["context_feed:trace_memory"]),
            ...(actuatorAllowed ? [] : ["allowed_actuator:query_trace_memory"]),
          ]
        : ["goal_session"]
      : [];
    const ok = feedMissingRequirements.length === 0;
    const traceId =
      readString(args.trace_id) ??
      readString(args.traceId) ??
      readString(args.target_trace_id) ??
      readString(args.targetTraceId);
    const turnId = readString(args.turn_id) ?? readString(args.turnId);
    const traceById = traceId ? getWorkstationReasoningTrace(traceId) : null;
    const traces = ok ? (traceId
      ? (traceById ? [traceById] : [])
      : listWorkstationReasoningTraces({ threadId: input.thread_id, limit })
          .filter((trace) => !turnId || trace.turn_id === turnId)
          .slice(-limit)) : [];
    const selectedTrace = traces.at(-1) ?? null;
    const traceRefs = traces.map((trace) => trace.trace_id);
    const evidenceRefs = uniqueStrings([
      ...traceRefs,
      ...(selectedTrace?.evidence_refs ?? []),
      ...(selectedTrace?.tool_receipt_ids ?? []),
      ...(selectedTrace?.lifecycle_event_refs ?? []),
    ]);
    const resultId = `helix_workstation_reasoning_trace_query:${hashShort([
      input.thread_id,
      traceId ?? null,
      turnId ?? null,
      traceRefs,
    ])}`;
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: input.thread_id,
      roomId,
      producerKind: "trace_memory",
      updateKind: "route_evidence",
      contentRef: resultId,
      preview: ok
        ? selectedTrace
          ? `Trace memory selected ${selectedTrace.trace_id}; proof ${selectedTrace.proof_status}, scope ${selectedTrace.scope_match}.`
          : "Trace memory query found no workstation reasoning traces for this scope."
        : `Blocked trace memory query; missing ${feedMissingRequirements.join(", ")}.`,
      sourceRefs: uniqueStrings([
        input.thread_id,
        selectedTrace?.source_family,
        ...traceRefs,
      ]),
      loopRefs: uniqueStrings([
        resultId,
        ...traces.map((trace) => trace.turn_id),
        ...traces.flatMap((trace) => trace.lifecycle_event_refs),
      ]),
      evidenceRefs,
      receiptRefs: [resultId, ...traceRefs],
      freshnessStatus: ok ? (traces.length > 0 ? "fresh" : "unknown") : "blocked",
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: resultId },
        ...(ok ? [{ kind: "append_goal_context" as const, goalId: goalId ?? `trace_memory:${input.thread_id}` }] : []),
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: input.thread_id,
          roomId,
          sourceRefs: uniqueStrings([
            input.thread_id,
            selectedTrace?.source_family,
            ...traceRefs,
          ]),
          loopRefs: uniqueStrings([
            resultId,
            ...traces.map((trace) => trace.turn_id),
            ...traces.flatMap((trace) => trace.lifecycle_event_refs),
          ]),
          evidenceRefs: uniqueStrings([goalContextUpdateId, resultId, ...evidenceRefs]).slice(0, 80),
          actionsTaken: ["query_trace_memory", input.tool_name],
          summary: `Queried trace memory and read ${traces.length} compact trace(s) for this goal session.`,
          nextStep: traces.length > 0 ? "continue" : "ask_user",
        })
      : goalSession;
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? selectedTrace
          ? `Read ${traces.length} compact workstation reasoning trace(s); selected ${selectedTrace.trace_id}.`
          : "No compact workstation reasoning traces were found for this scope."
        : `Cannot read trace memory; missing ${feedMissingRequirements.join(", ")}.`,
      observation: {
        schema: "helix.workstation_reasoning_trace_query_result.v1",
        resultId,
        result_id: resultId,
        thread_id: input.thread_id,
        trace_id: traceId ?? null,
        turn_id: turnId ?? null,
        traces,
        selectedTrace,
        selected_trace: selectedTrace,
        trace_count: traces.length,
        goalId,
        goal_id: goalId,
        status: ok ? "read" : "blocked",
        missingRequirements: feedMissingRequirements,
        missing_requirements: feedMissingRequirements,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        feedAllowed,
        feed_allowed: feedAllowed,
        requiredActuator: "query_trace_memory",
        required_actuator: "query_trace_memory",
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        agentGoalSession: checkpointedGoalSession,
        agent_goal_session: checkpointedGoalSession,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: uniqueStrings([goalContextUpdateId, resultId, ...evidenceRefs]),
      producedRefs: [resultId, goalContextUpdateId, ...traceRefs],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.reflect_live_source_mail_loop") {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const expectedCadenceMs = readNumber(args.expected_cadence_ms ?? args.expectedCadenceMs, Number.NaN);
    const currentState = summarizeStagePlayLiveSourceCurrentState({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      expectedCadenceMs: Number.isFinite(expectedCadenceMs) ? expectedCadenceMs : null,
      limit: 8,
    });
    const quality = queryStagePlayLiveSourceQuality({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      expectedCadenceMs: Number.isFinite(expectedCadenceMs) ? expectedCadenceMs : null,
    });
    const mailIdsFromArgs = readStringArray(args.mail_ids ?? args.mailIds);
    const latestMailItems = listStagePlayLiveSourceMailItems({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      limit: 24,
    });
    const windowMailIds = uniqueStrings([
      ...mailIdsFromArgs,
      ...currentState.latestMailItems.map((item) => item.mailId),
      ...latestMailItems.slice(-8).map((item) => item.mailId),
    ]);
    const processedPackets = listStagePlayProcessedMailPackets({
      sourceId: scope.sourceId,
      limit: 50,
    }).filter((packet) =>
      windowMailIds.length === 0 ||
      packet.mailIds.some((mailId) => windowMailIds.includes(mailId))
    );
    const processedPacketRefs = processedPackets.map((packet) => packet.packetId);
    const processedMailIds = new Set(processedPackets.flatMap((packet) => packet.mailIds));
    const missingMailCoverage = windowMailIds.filter((mailId) => !processedMailIds.has(mailId));
    const microReasonerRunRefs = uniqueStrings(processedPackets.flatMap((packet) => packet.microReasonerRunRefs));
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId: scope.sourceId,
      limit: 200,
    }).filter((run) => microReasonerRunRefs.includes(run.runId));
    const decisions = listStagePlayMailDecisions({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 20,
    }).filter((decision) =>
      processedPackets.length === 0 ||
      decision.mailIds.some((mailId) => processedPackets.some((packet) => packet.mailIds.includes(mailId)))
    );
    const decisionRefs = decisions.map((decision) => decision.decisionId);
    const graph = buildStagePlayBadgeGraphFromLiveWindow({
      threadId: effectiveThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      objective: readString(args.objective),
    });
    const outputLaneProjection = buildStagePlayOutputLaneProjectionV1({
      graph,
      generatedAt: new Date().toISOString(),
    });
    const liveAnswerProjectionRefs = uniqueStrings([
      outputLaneProjection.graphId,
      ...outputLaneProjection.lanes.map((lane) => lane.lineKey),
      environment?.environment_id,
    ]);
    const activeJobRefs = uniqueStrings([
      ...currentState.activeWatchJobs.map((job) => job.jobId),
      ...processedPackets.map((packet) => packet.jobId),
    ]);
    const activePolicyRefs = uniqueStrings([
      ...currentState.activeWatchJobs.map((job) => job.policyId),
    ]);
    const profileRefs = uniqueStrings([
      ...processedPackets.map((packet) => packet.profileRef ?? null),
    ]);
    const loopHealthRef = `stage_play_live_source_loop_health:${hashShort([
      quality.qualityId,
      currentState.currentStateId,
      processedPacketRefs,
      microReasonerRunRefs,
    ])}`;
    const evidenceRefs = uniqueStrings([
      scope.mailboxThreadResolution.mailboxThreadId,
      currentState.currentStateId,
      quality.qualityId,
      loopHealthRef,
      graph.graphId,
      outputLaneProjection.graphId,
      environment?.environment_id,
      ...currentState.evidenceRefs,
      ...quality.evidenceRefs,
      ...processedPackets.flatMap((packet) => [packet.packetId, ...packet.evidenceRefs]),
      ...microReasonerRuns.flatMap((run) => [run.runId, ...(run.evidenceRefs ?? [])]),
      ...decisions.flatMap((decision) => [decision.decisionId, ...(decision.evidenceRefs ?? [])]),
      ...latestMailItems.flatMap((item) => [item.mailId, ...(item.evidenceRefs ?? [])]),
      ...outputLaneProjection.evidenceRefs,
      ...collectStagePlayGraphSourceRefs(graph),
    ]);
    const reflectionId = `stage_play_live_source_mail_loop_reflection:${hashShort([
      scope.mailboxThreadResolution.mailboxThreadId,
      currentState.currentStateId,
      processedPacketRefs,
      microReasonerRunRefs,
      graph.graphId,
    ])}`;
    const causalGraph: StagePlayLiveSourceMailLoopReflectionV1["causalGraph"] = [
      ...processedPackets.flatMap((packet) =>
        packet.mailIds.map((mailId) => ({
          fromRef: mailId,
          toRef: packet.packetId,
          relation: "processed_into_packet" as const,
          note: "Compact live-source mail was represented by this processed packet.",
        }))
      ),
      ...processedPackets.flatMap((packet) =>
        packet.microReasonerRunRefs.map((runId) => ({
          fromRef: packet.packetId,
          toRef: runId,
          relation: "reasoned_by_microdeck" as const,
          note: "The packet retained this MicroDeck run as bounded evidence.",
        }))
      ),
      ...processedPackets.map((packet) => ({
        fromRef: packet.packetId,
        toRef: currentState.currentStateId,
        relation: "updated_current_state" as const,
        note: "Processed packet facts are part of the current live-source state window.",
      })),
      {
        fromRef: graph.graphId,
        toRef: outputLaneProjection.graphId,
        relation: "projected_to_live_answer" as const,
        note: "Stage Play graph evidence was reduced into Live Interpretation projection lanes.",
      },
      ...decisions.flatMap((decision) =>
        decision.mailIds.map((mailId) => ({
          fromRef: mailId,
          toRef: decision.decisionId,
          relation: "recorded_decision" as const,
          note: "A mailbox decision receipt was recorded for this mail window.",
        }))
      ),
      ...processedPackets.map((packet) => ({
        fromRef: packet.packetId,
        toRef: reflectionId,
        relation: "eligible_for_terminal_context" as const,
        note: "The packet may support model synthesis only after this reflection re-enters the solver.",
      })),
      ...missingMailCoverage.map((mailId) => ({
        fromRef: mailId,
        toRef: reflectionId,
        relation: "excluded_from_answer_context" as const,
        note: "No processed packet currently covers this mail item in the inspected window.",
      })),
    ];
    const missingEvidence = uniqueStrings([
      ...(processedPackets.length === 0 ? ["stage_play_processed_mail_packet"] : []),
      ...(microReasonerRuns.length === 0 ? ["stage_play_micro_reasoner_run"] : []),
      ...missingMailCoverage.map((mailId) => `processed_packet_for:${mailId}`),
    ]);
    const whatEnteredAnswerContext = uniqueStrings([
      ...processedPackets.slice(-3).map((packet) =>
        `processed packet ${packet.packetId}: ${clipText([
          ...packet.observedFacts.slice(0, 2),
          ...packet.changedFacts.slice(0, 2),
        ].join(" | "), 240)}`
      ),
      ...microReasonerRuns.slice(-4).map((run) =>
        `MicroDeck ${run.role} run ${run.runId}: ${clipText(run.outputPreview, 180)}`
      ),
      ...currentState.whatAskCanSafelySay.slice(0, 4),
    ]);
    const reflection: StagePlayLiveSourceMailLoopReflectionV1 = {
      artifactId: "stage_play_live_source_mail_loop_reflection",
      schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_LOOP_REFLECTION_SCHEMA,
      reflectionId,
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      askThreadId: input.thread_id,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceIds: currentState.sourceIds,
      jobRefs: activeJobRefs,
      policyRefs: activePolicyRefs,
      profileRefs,
      inspectionWindow: {
        mailIds: windowMailIds,
        processedPacketRefs,
        microReasonerRunRefs,
        currentStateRef: currentState.currentStateId,
        loopHealthRef,
        stagePlayGraphRef: graph.graphId,
        liveAnswerProjectionRefs,
        decisionRefs,
        voiceReceiptRefs: [],
      },
      causalGraph,
      stageSummaries: {
        sourceCapture: currentState.latestMailItems.length > 0
          ? currentState.latestMailItems.slice(-4).map((item) => `${item.mailId}: ${clipText(item.preview, 180)}`)
          : ["No compact live-source mail items are currently visible in the inspected window."],
        processedMail: processedPackets.length > 0
          ? processedPackets.slice(-4).map((packet) =>
              `${packet.packetId}: ${packet.resolutionState}; next ${packet.recommendedNext}; salience ${packet.salience.level}`
            )
          : ["No processed packet currently covers the inspected mail window."],
        microDeck: microReasonerRuns.length > 0
          ? microReasonerRuns.slice(-6).map((run) =>
              `${run.role}: ${run.status}; ${clipText(run.outputPreview, 180)}`
            )
          : ["No MicroDeck run refs are attached to the inspected processed packets."],
        stagePlayProjection: [
          `graph ${graph.graphId}`,
          `projection lanes ${outputLaneProjection.lanes.length}`,
          environment ? `live answer environment ${environment.environment_id}` : "no active live answer environment was resolved",
        ],
        liveAnswerReadiness: [
          `source quality ${quality.quality}`,
          `freshness ${quality.freshness}`,
          `pending unread ${currentState.pending.unreadMailCount}`,
          `next useful tool ${currentState.nextUsefulTool ?? "none"}`,
        ],
        terminalReadiness: missingEvidence.length === 0
          ? ["Reflection has processed packet, MicroDeck, current-state, loop-health, and Stage Play graph refs for model re-entry."]
          : [`Reflection is incomplete: missing ${missingEvidence.join(", ")}.`],
      },
      whatEnteredAnswerContext,
      whatDidNotEnterAnswerContext: missingMailCoverage.length > 0
        ? missingMailCoverage.map((mailId) => `${mailId}: no processed packet coverage in the inspected window`)
        : [],
      missingEvidence,
      limitations: uniqueStrings([
        ...currentState.limitations,
        ...quality.limitations,
        ...(missingMailCoverage.length > 0 ? ["Some live-source mail exists only as compact mail, not processed packet evidence."] : []),
      ]),
      whatAskCanSafelySay: currentState.whatAskCanSafelySay,
      nextUsefulTool: missingEvidence.length > 0
        ? "live_env.read_processed_live_source_mail"
        : currentState.nextUsefulTool,
      evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([
        currentState.causalTrace,
        quality.causalTrace,
        ...processedPackets.map((packet) => packet.causalTrace),
        ...microReasonerRuns.map((run) => run.causalTrace),
        ...decisions.map((decision) => decision.causalTrace),
      ], {
        parentRefs: evidenceRefs,
        producedRefs: [reflectionId],
        sourceIds: currentState.sourceIds,
        jobId: activeJobRefs.at(-1) ?? null,
        policyId: activePolicyRefs.at(-1) ?? null,
        profileId: profileRefs.at(-1) ?? null,
        evidenceRefs,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok: true,
      summary: `Reflected live-source mail-loop causality across ${processedPackets.length} packet(s), ${microReasonerRuns.length} MicroDeck run(s), and Stage Play graph ${graph.graphId}.`,
      observation: reflection,
      evidenceRefs,
      producedRefs: [reflectionId],
      artifactRefs: {
        processedPacketIds: processedPacketRefs,
        decisionIds: decisionRefs,
      },
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.check_live_source_mail" || input.tool_name === "live_env.read_live_source_mail") {
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId),
      mailIds: readStringArray(args.mail_ids ?? args.mailIds),
    });
    const readResult = readLiveSourceMailForAsk({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId: explicitSourceId,
      sourceKind: readString(args.source_kind) ?? readString(args.sourceKind),
      mailIds: readStringArray(args.mail_ids ?? args.mailIds),
      limit: readNumber(args.limit, input.tool_name === "live_env.read_live_source_mail" ? 12 : 3),
      sameSourceBatch: input.tool_name === "live_env.read_live_source_mail",
      batchCap: readNumber(args.batch_cap ?? args.batchCap, 12),
      includeRead: args.include_read === true || args.includeRead === true,
      voicePolicy: {
        voiceEnabled: args.voice_enabled === true || args.voiceEnabled === true,
        requiresConfirmation: args.voice_requires_confirmation === true || args.voiceRequiresConfirmation === true,
        allowedNow: args.voice_allowed_now === true || args.voiceAllowedNow === true,
        reason: readString(args.voice_policy_reason) ?? readString(args.voicePolicyReason),
      },
    });
    const transcriptRows = buildMailLoopTranscriptRows({
      mailItems: readResult.items,
      readResult,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: readResult.environmentId ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: readResult.items.length > 0
        ? readResult.readWindow && readResult.readWindow.remainingUnreadCount > 0
          ? `Read ${readResult.items.length} unread live-source mail item(s); ${readResult.readWindow.remainingUnreadCount} same-source unread item(s) remain queued; decision required.`
          : `Read ${readResult.items.length} unread live-source mail item(s); decision required.`
        : "No unread live-source updates yet; loop is armed for the next source update.",
      observation: {
        ...readResult,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
        causalTrace: readResult.causalTrace,
        causal_trace: readResult.causalTrace,
        transcriptRows,
        loopState: readResult.items.length > 0 ? "continue_with_unread_mail" : "armed_for_next_summary",
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        ...readResult.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
    });
  }

  if (
    input.tool_name === "live_env.update_live_source_immersion_state" ||
    input.tool_name === "live_env.validate_live_source_prediction"
  ) {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const { activeJob, activePolicy, jobId } = resolveActiveWatchJobAndPolicy({
      args,
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
    });
    const priorImmersionState = resolveLatestImmersionState(args, {
      ...scope.scopedInput,
      environment_id: environmentId,
    });
    const activeProfile = resolveActiveInterpreterProfile({
      args,
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      jobId,
      policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
      sourceKind: scope.sourceKind,
    });
    const mailItems = resolveImmersionMailItems({
      args,
      scopedInput: {
        ...scope.scopedInput,
        environment_id: environmentId,
      },
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      defaultLimit: input.tool_name === "live_env.update_live_source_immersion_state" ? 12 : 8,
    });
    const delta = extractStagePlayLiveSourceDelta({
      latestMailItems: mailItems,
      priorImmersionState,
      activeProfile,
    });
    const evidenceRefs = uniqueStrings([
      scope.mailboxThreadResolution.mailboxThreadId,
      activeJob?.jobId,
      activePolicy?.policyId,
      activeProfile?.profileId,
      priorImmersionState?.immersionStateId,
      ...mailItems.map((item) => item.mailId),
      ...mailItems.flatMap((item) => item.evidenceRefs),
      ...mailItems.flatMap((item) => [item.sourceRefs.frameRef, item.sourceRefs.evidenceRef, item.sourceRefs.observationRef]),
    ]);

    if (input.tool_name === "live_env.validate_live_source_prediction") {
      const validation = validateStagePlayLiveSourcePredictionFromMail({
        jobId,
        priorImmersionState,
        latestMailItems: mailItems,
        delta,
      });
      return makeObservation({
        threadId: input.thread_id,
        environmentId,
        toolName: input.tool_name,
        ok: true,
        summary: `Prediction validation ${validation.result}; recommended next ${validation.recommendedNext}.`,
        observation: {
          schema: "stage_play_live_source_prediction_validation_tool_result/v1",
          validation,
          validationId: validation.validationId,
          validation_id: validation.validationId,
          priorPredictionId: validation.priorPredictionId,
          prior_prediction_id: validation.priorPredictionId,
          result: validation.result,
          supportedSignals: validation.supportedSignals,
          supported_signals: validation.supportedSignals,
          contradictedSignals: validation.contradictedSignals,
          contradicted_signals: validation.contradictedSignals,
          newSignals: validation.newSignals,
          new_signals: validation.newSignals,
          salienceHint: validation.salienceHint,
          salience_hint: validation.salienceHint,
          recommendedNext: validation.recommendedNext,
          recommended_next: validation.recommendedNext,
          mailIds: validation.newMailIds,
          mail_ids: validation.newMailIds,
          mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
          mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
          priorImmersionStateRef: priorImmersionState?.immersionStateId ?? null,
          prior_immersion_state_ref: priorImmersionState?.immersionStateId ?? null,
          delta,
          evidenceRefs: validation.evidenceRefs,
          evidence_refs: validation.evidenceRefs,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([...validation.evidenceRefs, ...evidenceRefs]),
      });
    }

    const prediction = buildImmersionPrediction({
      args,
      jobId,
      mailItems,
      delta,
    });
    const updated = recordStagePlayLiveSourceImmersionState({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      jobId,
      policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
      profileId: activeProfile?.profileId ?? priorImmersionState?.profileId ?? null,
      sourceIds: uniqueStrings([
        scope.sourceId,
        ...mailItems.map((item) => item.sourceId),
        ...(activeJob?.sourceIds ?? []),
        ...(activePolicy?.sourceIds ?? []),
        ...(priorImmersionState?.sourceIds ?? []),
      ]),
      latestMailIds: mailItems.map((item) => item.mailId),
      latestEvidenceRefs: uniqueStrings([
        ...mailItems.flatMap((item) => item.evidenceRefs),
        ...mailItems.flatMap((item) => [item.sourceRefs.frameRef, item.sourceRefs.evidenceRef, item.sourceRefs.observationRef]),
      ]),
      sourceIdentity: delta.sourceIdentity,
      stableFacts: delta.stableFacts,
      currentSceneFacts: delta.currentSceneFacts,
      changedFacts: delta.changedFacts,
      uncertainties: delta.uncertainties,
      currentActivity: delta.currentActivity,
      salience: delta.salience,
      prediction,
      evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([
        priorImmersionState?.causalTrace,
        ...mailItems.map((item) => item.causalTrace),
        activeProfile?.causalTrace,
      ], {
        parentRefs: uniqueStrings([
          priorImmersionState?.immersionStateId,
          ...mailItems.map((item) => item.mailId),
          activePolicy?.policyId,
          activeProfile?.profileId,
        ]),
        causedBy: mailItems.map((item) => item.mailId),
        sourceIds: mailItems.map((item) => item.sourceId),
        jobId,
        policyId: activePolicy?.policyId ?? priorImmersionState?.policyId ?? null,
        profileId: activeProfile?.profileId ?? priorImmersionState?.profileId ?? null,
        evidenceRefs,
      }),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok: true,
      summary: `Updated immersion state ${updated.immersionStateId}; activity ${updated.currentActivity}; salience ${updated.salience.level}.`,
      observation: {
        schema: "stage_play_live_source_immersion_update_tool_result/v1",
        immersionState: updated,
        immersion_state: updated,
        immersionStateId: updated.immersionStateId,
        immersion_state_id: updated.immersionStateId,
        sourceIdentity: updated.sourceIdentity,
        source_identity: updated.sourceIdentity,
        stableFacts: updated.stableFacts,
        stable_facts: updated.stableFacts,
        currentSceneFacts: updated.currentSceneFacts,
        current_scene_facts: updated.currentSceneFacts,
        changedFacts: updated.changedFacts,
        changed_facts: updated.changedFacts,
        deltas: updated.changedFacts,
        salience: updated.salience,
        currentActivity: updated.currentActivity,
        current_activity: updated.currentActivity,
        watchTargets: delta.watchTargets,
        watch_targets: delta.watchTargets,
        prediction: updated.prediction,
        priorImmersionStateRef: priorImmersionState?.immersionStateId ?? null,
        prior_immersion_state_ref: priorImmersionState?.immersionStateId ?? null,
        currentPolicyRef: activePolicy?.policyId ?? null,
        current_policy_ref: activePolicy?.policyId ?? null,
        currentProfileRef: activeProfile?.profileId ?? null,
        current_profile_ref: activeProfile?.profileId ?? null,
        mailIds: mailItems.map((item) => item.mailId),
        mail_ids: mailItems.map((item) => item.mailId),
        mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
        delta,
        causalTrace: updated.causalTrace,
        causal_trace: updated.causalTrace,
        evidenceRefs: updated.evidenceRefs,
        evidence_refs: updated.evidenceRefs,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: updated.evidenceRefs,
    });
  }

  if (input.tool_name === "live_env.query_live_source_loop_health") {
    const scope = resolveLiveSourceToolScope({
      args,
      threadId: input.thread_id,
      effectiveThreadId,
      roomId,
      environmentThreadId: environment?.thread_id ?? null,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      explicitSourceId,
    });
    const environmentId = environment?.environment_id ?? input.environment_id ?? null;
    const expectedCadenceMs = readNumber(args.expected_cadence_ms ?? args.expectedCadenceMs, Number.NaN);
    const quality = queryStagePlayLiveSourceQuality({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      expectedCadenceMs: Number.isFinite(expectedCadenceMs) ? expectedCadenceMs : null,
    });
    const currentState = summarizeStagePlayLiveSourceCurrentState({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      expectedCadenceMs: Number.isFinite(expectedCadenceMs) ? expectedCadenceMs : null,
      limit: 6,
    });
    const { activeJob, activePolicy } = resolveActiveWatchJobAndPolicy({
      args,
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
    });
    const activeProfile = resolveActiveInterpreterProfile({
      args,
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      jobId: activeJob?.jobId ?? activePolicy?.jobId ?? null,
      policyId: activePolicy?.policyId ?? null,
      sourceKind: scope.sourceKind,
    });
    const latestImmersionState = getLatestStagePlayLiveSourceImmersionState({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      jobId: activeJob?.jobId ?? activePolicy?.jobId ?? null,
      policyId: activePolicy?.policyId ?? null,
      profileId: activeProfile?.profileId ?? null,
      sourceId: scope.sourceId,
    }) ?? getLatestStagePlayLiveSourceImmersionState({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
    });
    const deliveredCount = listStagePlayLiveSourceMailItems({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      sourceId: scope.sourceId,
      sourceKind: scope.sourceKind,
      status: "delivered_to_ask",
      limit: 250,
    }).length;
    const wakes = listStagePlayLiveSourceMailWakeRequests({
      threadId: scope.mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId,
      limit: 100,
    }).filter((wake) => !scope.sourceId || wake.sourceIds.includes(scope.sourceId));
    const queuedWakeCount = wakes.filter((wake) => wake.status === "queued").length;
    const runningWakeCount = wakes.filter((wake) => wake.status === "running").length;
    const deferredWakeCount = wakes.filter((wake) => wake.status === "deferred_for_pressure").length;
    const latestWake = wakes.at(-1) ?? null;
    const health =
      !activePolicy
        ? "missing_policy"
        : !activeProfile
          ? "missing_profile"
          : quality.freshness === "stale" || quality.quality === "stale"
            ? "stale_source"
            : deferredWakeCount > 0
              ? "deferred_for_pressure"
              : runningWakeCount > 0 || queuedWakeCount > 0 || quality.backlog.unreadMailCount > 0
                ? "catching_up"
                : quality.quality === "good"
                  ? "green"
                  : "blocked";
    const nextUsefulTool =
      !activePolicy
        ? "live_env.configure_route_watch"
        : !activeProfile
          ? "live_env.configure_interpreter_profile"
          : latestImmersionState?.prediction && quality.backlog.unreadMailCount > 0
            ? "live_env.validate_live_source_prediction"
            : quality.backlog.unreadMailCount > 0
              ? "live_env.update_live_source_immersion_state"
              : currentState.nextUsefulTool;
    const evidenceRefs = uniqueStrings([
      quality.qualityId,
      currentState.currentStateId,
      activeJob?.jobId,
      activePolicy?.policyId,
      activeProfile?.profileId,
      latestImmersionState?.immersionStateId,
      latestImmersionState?.prediction?.predictionId,
      latestImmersionState?.lastValidation?.validationId,
      latestWake?.wakeRequestId,
      ...quality.evidenceRefs,
    ]);
    const loopHealth = {
      schema: "stage_play_live_source_loop_health/v1",
      sourceQuality: quality,
      source_quality: quality,
      captureCadence: quality.cadence.cadenceActualMs,
      capture_cadence: quality.cadence.cadenceActualMs,
      expectedCadence: quality.cadence.expectedCadenceMs,
      expected_cadence: quality.cadence.expectedCadenceMs,
      latestMailAgeMs: quality.cadence.latestSummaryAgeMs,
      latest_mail_age_ms: quality.cadence.latestSummaryAgeMs,
      unreadCount: quality.backlog.unreadMailCount,
      unread_count: quality.backlog.unreadMailCount,
      deliveredCount,
      delivered_count: deliveredCount,
      queuedWakeCount,
      queued_wake_count: queuedWakeCount,
      runningWakeCount,
      running_wake_count: runningWakeCount,
      deferredWakeCount,
      deferred_wake_count: deferredWakeCount,
      pressureReason: quality.pressure.reason,
      pressure_reason: quality.pressure.reason,
      currentPolicyRef: activePolicy?.policyId ?? null,
      current_policy_ref: activePolicy?.policyId ?? null,
      currentProfileRef: activeProfile?.profileId ?? null,
      current_profile_ref: activeProfile?.profileId ?? null,
      latestImmersionStateRef: latestImmersionState?.immersionStateId ?? null,
      latest_immersion_state_ref: latestImmersionState?.immersionStateId ?? null,
      latestPredictionRef: latestImmersionState?.prediction?.predictionId ?? null,
      latest_prediction_ref: latestImmersionState?.prediction?.predictionId ?? null,
      latestValidationRef: latestImmersionState?.lastValidation?.validationId ?? null,
      latest_validation_ref: latestImmersionState?.lastValidation?.validationId ?? null,
      nextUsefulTool,
      next_useful_tool: nextUsefulTool,
      health,
      currentState,
      current_state: currentState,
      latestWakeRef: latestWake?.wakeRequestId ?? null,
      latest_wake_ref: latestWake?.wakeRequestId ?? null,
      mailboxThreadId: scope.mailboxThreadResolution.mailboxThreadId,
      mailbox_thread_id: scope.mailboxThreadResolution.mailboxThreadId,
      evidenceRefs,
      evidence_refs: evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([
        quality.causalTrace,
        currentState.causalTrace,
        latestImmersionState?.causalTrace,
        latestWake?.causalTrace,
      ], {
        parentRefs: evidenceRefs,
        sourceIds: currentState.sourceIds,
        jobId: activeJob?.jobId ?? activePolicy?.jobId ?? latestImmersionState?.jobId ?? null,
        policyId: activePolicy?.policyId ?? latestImmersionState?.policyId ?? null,
        profileId: activeProfile?.profileId ?? latestImmersionState?.profileId ?? null,
        evidenceRefs,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId,
      toolName: input.tool_name,
      ok: true,
      summary: `Live-source loop health is ${health}; next useful tool ${nextUsefulTool ?? "none"}.`,
      observation: loopHealth,
      evidenceRefs,
    });
  }

  if (
    input.tool_name === "live_env.predict_live_source_immediate" ||
    input.tool_name === "live_env.compare_live_source_prediction" ||
    input.tool_name === "live_env.project_live_source_narrative"
  ) {
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId) ??
        readString(args.thread_id) ??
        readString(args.threadId),
      mailIds: readStringArray(args.mail_ids ?? args.mailIds),
    });
    const scopedInput: ExecuteLiveEnvironmentToolInput = {
      ...input,
      thread_id: mailboxThreadResolution.mailboxThreadId,
      environment_id: environment?.environment_id ?? input.environment_id ?? null,
    };
    const mailItems = resolvePredictionMailItems(args, scopedInput);
    const narrativeState = resolveLatestNarrativeState(args, scopedInput);
    const policy =
      readString(args.policy_id) || readString(args.policyId)
        ? listStagePlayLiveSourceWatchJobPolicies({
            threadId: scopedInput.thread_id,
            roomId,
            environmentId: scopedInput.environment_id ?? null,
            limit: 50,
          }).find((entry) => entry.policyId === (readString(args.policy_id) ?? readString(args.policyId))) ?? null
        : listStagePlayLiveSourceWatchJobPolicies({
            threadId: scopedInput.thread_id,
            roomId,
            environmentId: scopedInput.environment_id ?? null,
            limit: 1,
          }).at(-1) ?? null;
    const prediction = buildImmediateLiveSourcePrediction({
      mailItems,
      narrativeState,
      policy,
    });
    const evidenceRefs = Array.from(new Set([
      ...mailItems.map((item) => item.mailId),
      ...mailItems.flatMap((item) => item.evidenceRefs),
      narrativeState?.narrativeStateId,
      ...(narrativeState?.evidenceRefs ?? []),
      policy?.policyId,
      ...(policy?.evidenceRefs ?? []),
      mailboxThreadResolution.mailboxThreadId,
    ].filter((entry): entry is string => Boolean(entry))));

    if (input.tool_name === "live_env.predict_live_source_immediate") {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: scopedInput.environment_id,
        toolName: input.tool_name,
        ok: mailItems.length > 0 || Boolean(narrativeState),
        summary: mailItems.length > 0 || narrativeState
          ? `Prepared next-mail live-source prediction with ${prediction.salienceHint} salience.`
          : "No live-source mail or narrative state was available for immediate prediction.",
        observation: {
          schema: "helix.live_source_immediate_prediction.v1",
          predictionHorizon: prediction.predictionHorizon,
          prediction_horizon: prediction.predictionHorizon,
          expectedChanges: prediction.expectedChanges,
          expected_changes: prediction.expectedChanges,
          watchTargets: prediction.watchTargets,
          watch_targets: prediction.watchTargets,
          validationSignals: prediction.validationSignals,
          validation_signals: prediction.validationSignals,
          salienceHint: prediction.salienceHint,
          salience_hint: prediction.salienceHint,
          evidenceRefs,
          evidence_refs: evidenceRefs,
          mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
          mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs,
      });
    }

    if (input.tool_name === "live_env.compare_live_source_prediction") {
      const comparison = compareLiveSourcePrediction({
        mailItems,
        narrativeState,
      });
      const salienceHint = salienceHintFromText([
        mailItems.at(-1)?.summary.text ?? "",
        comparison.meaningfulDifferences.join(" "),
      ].join(" "));
      const wakeRecommendation =
        comparison.result === "no_prior_prediction"
          ? "record_interpretation"
          : salienceHint === "urgent"
            ? "request_voice_callout"
            : comparison.result === "contradicted"
              ? "record_interpretation"
              : comparison.result === "supported"
                ? "wait"
                : "record_interpretation";
      return makeObservation({
        threadId: input.thread_id,
        environmentId: scopedInput.environment_id,
        toolName: input.tool_name,
        ok: true,
        summary: `Compared live-source mail against prior prediction: ${comparison.result}; recommendation ${wakeRecommendation}.`,
        observation: {
          schema: "helix.live_source_prediction_comparison.v1",
          result: comparison.result,
          meaningfulDifferences: comparison.meaningfulDifferences,
          meaningful_differences: comparison.meaningfulDifferences,
          salienceHint,
          salience_hint: salienceHint,
          wakeRecommendation,
          wake_recommendation: wakeRecommendation,
          evidenceRefs,
          evidence_refs: evidenceRefs,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs,
      });
    }

    const latestSummary =
      readString(args.current_scene_summary) ??
      readString(args.currentSceneSummary) ??
      mailItems.at(-1)?.summary.text ??
      narrativeState?.currentSceneSummary ??
      "No compact live-source mail summary was available.";
    const projectionJobId =
      readString(args.job_id) ??
      readString(args.jobId) ??
      narrativeState?.jobId ??
      policy?.jobId ??
      listStagePlayMailDecisions({
        threadId: scopedInput.thread_id,
        roomId,
        environmentId: scopedInput.environment_id ?? null,
        limit: 1,
      }).at(-1)?.activeJobId ??
      `stage_play_live_source_job:${hashShort([scopedInput.thread_id, mailItems.at(-1)?.sourceId ?? "source"])}`;
    const projectionPolicyId =
      readString(args.policy_id) ??
      readString(args.policyId) ??
      policy?.policyId ??
      narrativeState?.policyId ??
      null;
    const projected = recordStagePlayLiveSourceNarrativeState({
      threadId: scopedInput.thread_id,
      roomId,
      environmentId: scopedInput.environment_id ?? null,
      jobId: projectionJobId,
      policyId: projectionPolicyId,
      sourceIds: mailItems.length > 0 ? mailItems.map((item) => item.sourceId) : narrativeState?.sourceIds ?? [],
      mailBatchRefs: mailItems.map((item) => item.mailId),
      sourceEvidenceRefs: mailItems.flatMap((item) => item.evidenceRefs),
      currentSceneSummary: clipText(latestSummary, 520),
      runningStorySummary:
        readString(args.running_story_summary) ??
        readString(args.runningStorySummary) ??
        narrativeState?.runningStorySummary ??
        `Latest live-source projection: ${clipText(latestSummary, 420)}`,
      interpretedSituation: {
        userRelevantMeaning:
          readString(args.user_relevant_meaning) ??
          readString(args.userRelevantMeaning) ??
          `The live-source projection expects the next update to validate or revise: ${clipText(latestSummary, 360)}`,
        objects: prediction.watchTargets,
        activities: ["live-source narrative projection"],
      },
      meaningfulChanges:
        readStringArray(args.meaningful_changes ?? args.meaningfulChanges).length > 0
          ? readStringArray(args.meaningful_changes ?? args.meaningfulChanges)
          : [`Projection updated from latest mail: ${clipText(latestSummary, 220)}`],
      uncertainties:
        readStringArray(args.uncertainties).length > 0
          ? readStringArray(args.uncertainties)
          : ["Projection is based on compact live-source mail and should be checked against the next mail batch."],
      watchNext: {
        targets: readStringArray(args.watch_next_targets ?? args.watchNextTargets).length > 0
          ? readStringArray(args.watch_next_targets ?? args.watchNextTargets)
          : prediction.watchTargets,
        reason:
          readString(args.watch_next_reason) ??
          readString(args.watchNextReason) ??
          "Watch the next compact source update for prediction support, contradiction, or urgent salience.",
      },
      prediction: {
        text:
          readString(args.prediction_text) ??
          readString(args.predictionText) ??
          prediction.expectedChanges[0],
        horizon:
          readString(args.prediction_horizon) === "next_2_to_5_mail_batches" ||
          readString(args.prediction_horizon) === "until_source_changes" ||
          readString(args.prediction_horizon) === "unknown"
            ? readString(args.prediction_horizon) as "next_2_to_5_mail_batches" | "until_source_changes" | "unknown"
            : "next_mail",
        confidence: Math.max(0, Math.min(readNumber(args.prediction_confidence ?? args.predictionConfidence, 0.45), 1)),
        validationSignals: prediction.validationSignals,
      },
      evidenceRefs,
      causalTrace: mergeLiveSourceCausalTraces([
        ...mailItems.map((item) => item.causalTrace),
        narrativeState?.causalTrace,
      ], {
        parentRefs: uniqueStrings([
          narrativeState?.narrativeStateId,
          ...mailItems.map((item) => item.mailId),
        ]),
        causedBy: mailItems.map((item) => item.mailId),
        sourceIds: mailItems.map((item) => item.sourceId),
        jobId: projectionJobId,
        policyId: projectionPolicyId,
        evidenceRefs,
      }),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: scopedInput.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Projected live-source narrative state ${projected.narrativeStateId}.`,
      observation: {
        schema: "helix.live_source_narrative_projection.v1",
        narrativeStateId: projected.narrativeStateId,
        narrative_state_id: projected.narrativeStateId,
        runningStorySummary: projected.runningStorySummary,
        running_story_summary: projected.runningStorySummary,
        userRelevantMeaning: projected.interpretedSituation.userRelevantMeaning,
        user_relevant_meaning: projected.interpretedSituation.userRelevantMeaning,
        meaningfulChanges: projected.meaningfulChanges,
        meaningful_changes: projected.meaningfulChanges,
        uncertainties: projected.uncertainties,
        watchNext: projected.watchNext,
        watch_next: projected.watchNext,
        prediction: projected.prediction,
        evidenceRefs: projected.evidenceRefs,
        evidence_refs: projected.evidenceRefs,
        causalTrace: projected.causalTrace,
        causal_trace: projected.causalTrace,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: projected.evidenceRefs,
    });
  }

  if (input.tool_name === "live_env.configure_route_watch" || input.tool_name === "live_env.configure_live_source_watch_job") {
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId),
    });
    const objectiveText =
      readString(args.objective_text) ??
      readString(args.objectiveText) ??
      readString(args.objective) ??
      readString(args.user_prompt) ??
      readString(args.userPrompt) ??
      "Watch the live source and record decisions when source mail arrives.";
    const policyDefaults = buildStagePlayLiveSourceWatchJobPolicyDefaults(objectiveText);
    const explicitInterpretationMode =
      readWatchJobInterpretationMode(args.interpretation_mode) ??
      readWatchJobInterpretationMode(args.interpretationMode);
    const explicitMailProcessingMode =
      readWatchJobMailProcessingMode(args.mail_processing_mode) ??
      readWatchJobMailProcessingMode(args.mailProcessingMode);
    const explicitOutputCadence =
      readWatchJobOutputCadence(args.output_cadence) ??
      readWatchJobOutputCadence(args.outputCadence);
    const sourceIds = [
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ].filter((entry): entry is string => Boolean(entry));
    const goalId =
      readString(args.goal_id) ??
      readString(args.goalId) ??
      readString(args.agent_goal_id) ??
      readString(args.agentGoalId);
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: mailboxThreadResolution.mailboxThreadId,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const actuatorAllowed = !goalId || goalSessionActuatorAllowed(goalSession, "configure_route_watch");
    const missingRequirements = goalId
      ? goalSession
        ? actuatorAllowed
          ? []
          : ["allowed_actuator:configure_route_watch"]
        : ["goal_session"]
      : [];
    if (missingRequirements.length > 0) {
      const blockedReceiptId = `stage_play_live_source_watch_job_policy_config_blocked:${hashShort([
        input.thread_id,
        mailboxThreadResolution.mailboxThreadId,
        goalId,
        sourceIds,
        policyDefaults.objectiveText,
        missingRequirements,
      ])}`;
      const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
        threadId: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        roomId,
        producerKind: "automation",
        updateKind: "automation_status",
        contentRef: blockedReceiptId,
        preview: `Blocked live-source watch job configuration; missing ${missingRequirements.join(", ")}.`,
        sourceRefs: uniqueStrings([
          ...sourceIds,
          mailboxThreadResolution.mailboxThreadId,
        ]),
        loopRefs: uniqueStrings([
          `watch_job_config:${mailboxThreadResolution.mailboxThreadId}`,
          `route_watch:${goalId ?? input.thread_id}`,
        ]),
        evidenceRefs: uniqueStrings([
          blockedReceiptId,
          mailboxThreadResolution.mailboxThreadId,
          ...sourceIds,
        ]),
        receiptRefs: [blockedReceiptId],
        freshnessStatus: "blocked",
        staleAfterMs: 120_000,
        goalId,
        goalRelevanceReason: goalId
          ? "Watch-job automation policy requires explicit goal actuator authorization."
          : null,
        suggestedDispatch: [
          { kind: "log_receipt", receiptRef: blockedReceiptId },
          { kind: "update_panel", panelId: "stage-play-badge-graph" },
        ],
      });
      const result = {
        artifactId: "stage_play_live_source_watch_job_policy_config_result",
        schema: STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
        schemaVersion: STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
        policy: null,
        jobState: null,
        transcriptRows: [],
        policyCount: 0,
        watchJobPolicyRef: null,
        watch_job_policy_ref: null,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
        goalId,
        goal_id: goalId,
        status: "blocked",
        missingRequirements,
        missing_requirements: missingRequirements,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        requiredActuator: "configure_route_watch",
        required_actuator: "configure_route_watch",
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      };
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: `Cannot configure live-source watch job; missing ${missingRequirements.join(", ")}.`,
        observation: result,
        evidenceRefs: [blockedReceiptId, goalContextUpdateId, mailboxThreadResolution.mailboxThreadId, ...sourceIds],
        producedRefs: [blockedReceiptId, goalContextUpdateId],
        forceNormalizedRefs: true,
      });
    }
    const configured = configureStagePlayLiveSourceWatchJobPolicy({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceIds,
      objectiveText: policyDefaults.objectiveText,
      decisionPolicyPrompt:
        readString(args.decision_policy_prompt) ??
        readString(args.decisionPolicyPrompt) ??
        policyDefaults.decisionPolicyPrompt,
      interpretationMode:
        explicitInterpretationMode ??
        policyDefaults.interpretationMode ??
        inferStagePlayLiveSourceInterpretationMode({
          objectiveText: policyDefaults.objectiveText,
          decisionPolicyPrompt: policyDefaults.decisionPolicyPrompt,
          outputPolicy: policyDefaults.outputPolicy,
        }),
      mailProcessingMode:
        explicitMailProcessingMode ??
        policyDefaults.mailProcessingMode,
      outputCadence:
        explicitOutputCadence ??
        policyDefaults.outputCadence,
      outputPolicy: readWatchJobOutputPolicy(args, policyDefaults.outputPolicy),
      importanceCriteria: readStringArray(args.importance_criteria ?? args.importanceCriteria).length > 0
        ? readStringArray(args.importance_criteria ?? args.importanceCriteria)
        : policyDefaults.importanceCriteria,
      suppressCriteria: readStringArray(args.suppress_criteria ?? args.suppressCriteria).length > 0
        ? readStringArray(args.suppress_criteria ?? args.suppressCriteria)
        : policyDefaults.suppressCriteria,
      priorDecisionRefs: readStringArray(args.prior_decision_refs ?? args.priorDecisionRefs),
      priorAnswerRefs: readStringArray(args.prior_answer_refs ?? args.priorAnswerRefs),
      evidenceRefs: readStringArray(args.evidence_refs ?? args.evidenceRefs).concat(sourceIds),
    });
    const policies = listStagePlayLiveSourceWatchJobPolicies({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      limit: 100,
    });
    const transcriptRows = buildWatchJobConfiguredTranscriptRows({
      policy: configured.policy,
    });
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: "automation",
      updateKind: "automation_status",
      contentRef: configured.policy.policyId,
      preview: `Configured live-source watch job for ${policyDefaults.objectiveText}; loop is armed for the next source summary.`,
      sourceRefs: uniqueStrings([
        ...configured.policy.sourceIds,
        ...sourceIds,
        configured.policy.environmentId,
        mailboxThreadResolution.mailboxThreadId,
      ]),
      loopRefs: uniqueStrings([
        configured.jobState.jobId,
        configured.policy.policyId,
        `watch_job:${configured.jobState.jobId}`,
        `watch_policy:${configured.policy.policyId}`,
      ]),
      evidenceRefs: uniqueStrings([
        configured.policy.policyId,
        configured.jobState.jobId,
        mailboxThreadResolution.mailboxThreadId,
        ...configured.policy.evidenceRefs,
      ]),
      receiptRefs: [configured.policy.policyId],
      freshnessStatus: "fresh",
      staleAfterMs: 120_000,
      goalId,
      goalRelevanceReason: goalId
        ? "Watch-job automation policy contributes deterministic route-watch context for this agent goal."
        : null,
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: configured.policy.policyId },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        { kind: "set_loop_state", loopRef: configured.jobState.jobId, state: "running" },
      ],
    });
    const checkpointedGoalSession = goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: mailboxThreadResolution.mailboxThreadId,
          roomId,
          sourceRefs: uniqueStrings([
            ...configured.policy.sourceIds,
            ...sourceIds,
            configured.policy.environmentId,
            mailboxThreadResolution.mailboxThreadId,
          ]),
          loopRefs: uniqueStrings([
            configured.jobState.jobId,
            configured.policy.policyId,
            `watch_job:${configured.jobState.jobId}`,
            `watch_policy:${configured.policy.policyId}`,
          ]),
          evidenceRefs: uniqueStrings([
            goalContextUpdateId,
            configured.policy.policyId,
            configured.jobState.jobId,
            mailboxThreadResolution.mailboxThreadId,
            ...configured.policy.evidenceRefs,
          ]).slice(0, 80),
          actionsTaken: ["configure_route_watch", input.tool_name],
          summary: "Configured route-watch automation for this goal session.",
          nextStep: "continue",
        })
      : goalSession;
    const result = {
      artifactId: "stage_play_live_source_watch_job_policy_config_result",
      schema: STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
      schemaVersion: STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
      policy: configured.policy,
      jobState: configured.jobState,
      transcriptRows,
      policyCount: policies.length,
      watchJobPolicyRef: configured.policy.policyId,
      watch_job_policy_ref: configured.policy.policyId,
      askThreadId: input.thread_id,
      ask_thread_id: input.thread_id,
      mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
      mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
      mailboxThreadResolution,
      mailbox_thread_resolution: mailboxThreadResolution,
      goalId,
      goal_id: goalId,
      status: "configured",
      missingRequirements,
      missing_requirements: missingRequirements,
      goalSessionFound: goalId ? Boolean(goalSession) : null,
      goal_session_found: goalId ? Boolean(goalSession) : null,
      requiredActuator: "configure_route_watch",
      required_actuator: "configure_route_watch",
      actuatorAllowed,
      actuator_allowed: actuatorAllowed,
      agentGoalSession: checkpointedGoalSession,
      agent_goal_session: checkpointedGoalSession,
      goalContextUpdateId,
      goal_context_update_id: goalContextUpdateId,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId: configured.policy.environmentId ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Configured live-source watch job policy ${configured.policy.policyId}; no mail was read.`,
      observation: result,
      evidenceRefs: [
        configured.policy.policyId,
        configured.jobState.jobId,
        mailboxThreadResolution.mailboxThreadId,
        ...configured.policy.evidenceRefs,
      ],
      producedRefs: [
        configured.policy.policyId,
        configured.jobState.jobId,
        goalContextUpdateId,
      ],
    });
  }

  if (input.tool_name === "live_env.configure_interpreter_profile") {
    const objectiveText =
      readString(args.objective_text) ??
      readString(args.objectiveText) ??
      readString(args.objective) ??
      "Interpret live-source observations according to this profile.";
    const interpretationGuidelines =
      readString(args.interpretation_guidelines) ??
      readString(args.interpretationGuidelines) ??
      readString(args.guidelines) ??
      "Preserve observed facts, separate inference from observation, and cite evidence refs.";
    const domain = readInterpreterProfileDomain(
      args.domain,
      `${objectiveText}\n${interpretationGuidelines}`,
    );
    const sourceIds = uniqueStrings([
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ]);
    const sourceKinds = readStringArray(args.source_kinds ?? args.sourceKinds);
    const normalizedSourceKinds = sourceKinds.length > 0
      ? sourceKinds
      : domain === "code_logs"
        ? ["screen_summary", "custom"]
        : ["visual_frame"];
    const jobId =
      readString(args.job_id) ??
      readString(args.jobId) ??
      null;
    const policyId =
      readString(args.policy_id) ??
      readString(args.policyId) ??
      null;
    const now = new Date().toISOString();
    const title = inferInterpreterProfileTitle({
      title: readString(args.title),
      domain,
      objectiveText,
    });
    const profileActionRaw =
      readString(args.profile_action) ??
      readString(args.profileAction) ??
      readString(args.action);
    const profileAction = profileActionRaw && new Set([
      "select",
      "apply",
      "activate",
      "pause",
      "archive",
      "open_note",
      "compile_note",
    ]).has(profileActionRaw)
      ? profileActionRaw
      : null;
    const requestedProfileId =
      readString(args.profile_id) ??
      readString(args.profileId);
    if (profileAction) {
      const profiles = listStagePlayLiveSourceInterpreterProfiles({
        threadId: input.thread_id,
        roomId,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        includeArchived: true,
        limit: 250,
      });
      const requestedTitle =
        readString(args.profile_title) ??
        readString(args.profileTitle) ??
        readString(args.title);
      const profile =
        (requestedProfileId ? getStagePlayLiveSourceInterpreterProfile(requestedProfileId) : null) ??
        (requestedTitle
          ? profiles.find((entry) => entry.title.toLowerCase() === requestedTitle.toLowerCase()) ??
            profiles.find((entry) => requestedTitle.toLowerCase().includes(entry.title.toLowerCase()) || entry.title.toLowerCase().includes(requestedTitle.toLowerCase()))
          : null) ??
        getActiveInterpreterProfileForJob({
          threadId: input.thread_id,
          roomId,
          environmentId: environment?.environment_id ?? input.environment_id ?? null,
          jobId,
          policyId,
          domain,
        }) ??
        profiles.at(-1) ??
        null;
      const now = new Date().toISOString();
      if (!profile) {
        return makeObservation({
          threadId: input.thread_id,
          environmentId: environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: false,
          summary: `Interpreter profile ${profileAction} could not run: no matching profile was found.`,
          observation: {
            schema: "stage_play_interpreter_profile_action_result/v1",
            ok: false,
            profileAction,
            profile_action: profileAction,
            requestedProfileId,
            requested_profile_id: requestedProfileId,
            requestedTitle,
            requested_title: requestedTitle,
            missingFields: ["profile_id or active interpreter profile"],
            missing_fields: ["profile_id or active interpreter profile"],
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          evidenceRefs: uniqueStrings([requestedProfileId, requestedTitle]),
        });
      }
      if (profileAction === "pause" || profileAction === "archive" || profileAction === "select" || profileAction === "apply" || profileAction === "activate") {
        const status = profileAction === "pause"
          ? "paused"
          : profileAction === "archive"
            ? "archived"
            : "active";
        const updated = setInterpreterProfileStatus({
          profileId: profile.profileId,
          status,
          updatedAt: now,
        }) ?? profile;
        const transcriptRows: AskTurnTranscriptRowDraftV1[] = [{
          rowId: `ask_turn_interpreter_profile_action:${hashShort([updated.profileId, profileAction, now])}`,
          rowKind: "interpreter_profile",
          title: profileAction === "pause"
            ? "Interpreter profile paused"
            : profileAction === "archive"
              ? "Interpreter profile archived"
              : "Interpreter profile applied",
          body: `${updated.title}: ${updated.status}.`,
          source: {
            toolName: "live_env.configure_interpreter_profile",
            artifactId: updated.profileId,
            artifactKind: updated.artifactId,
          },
          evidenceRefs: updated.evidenceRefs,
          authority: "tool_evidence",
          assistantAnswer: false,
          terminalEligible: false,
          createdAt: now,
        }];
        return makeObservation({
          threadId: input.thread_id,
          environmentId: updated.environmentId ?? environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: true,
          summary: `Interpreter profile ${updated.profileId} ${profileAction === "pause" || profileAction === "archive" ? status : "applied"}; no live-source mail was read.`,
          observation: {
            schema: "stage_play_interpreter_profile_action_result/v1",
            ok: true,
            profileAction,
            profile_action: profileAction,
            profile: updated,
            transcriptRows,
            post_tool_model_step_required: true,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          transcriptRows,
          evidenceRefs: uniqueStrings([updated.profileId, ...updated.evidenceRefs]),
        });
      }
      if (profileAction === "open_note") {
        const requestedNoteId =
          readString(args.note_id) ??
          readString(args.noteId) ??
          readString(args.linked_note_id) ??
          readString(args.linkedNoteId);
        const note =
          openInterpreterProfileNote({ noteId: requestedNoteId, profileId: profile.profileId }) ??
          createInterpreterProfileNote({ profileId: profile.profileId, noteId: requestedNoteId, now });
        const transcriptRows: AskTurnTranscriptRowDraftV1[] = [{
          rowId: `ask_turn_interpreter_profile_note_opened:${hashShort([profile.profileId, note.noteId, now])}`,
          rowKind: "profile_note_link",
          title: "Profile note opened",
          body: `Linked note: ${note.title} (${note.noteId}).`,
          source: {
            toolName: "live_env.configure_interpreter_profile",
            artifactId: note.noteId,
            artifactKind: note.artifactId,
          },
          evidenceRefs: uniqueStrings([profile.profileId, note.noteId]),
          authority: "tool_evidence",
          assistantAnswer: false,
          terminalEligible: false,
          createdAt: now,
        }];
        return makeObservation({
          threadId: input.thread_id,
          environmentId: profile.environmentId ?? environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: true,
          summary: `Opened interpreter profile note ${note.noteId} for ${profile.profileId}.`,
          observation: {
            schema: "stage_play_interpreter_profile_action_result/v1",
            ok: true,
            profileAction,
            profile_action: profileAction,
            profile,
            note,
            linkedNote: { noteId: note.noteId, title: note.title },
            linked_note: { noteId: note.noteId, title: note.title },
            transcriptRows,
            post_tool_model_step_required: true,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          transcriptRows,
          evidenceRefs: uniqueStrings([profile.profileId, note.noteId, ...profile.evidenceRefs]),
        });
      }
      if (profileAction === "compile_note") {
        const noteId =
          readString(args.note_id) ??
          readString(args.noteId) ??
          readString(args.linked_note_id) ??
          readString(args.linkedNoteId) ??
          profile.linkedNoteId;
        const result = noteId
          ? compileInterpreterProfileFromNote({ noteId, updatedAt: now })
          : null;
        const compiledProfile = result?.profile ?? null;
        const transcriptRows: AskTurnTranscriptRowDraftV1[] = [{
          rowId: `ask_turn_interpreter_profile_note_compiled:${hashShort([profile.profileId, noteId ?? "missing", now])}`,
          rowKind: result?.ok ? "profile_compiled" : "blocked",
          title: result?.ok ? "Profile compiled" : "Profile compile blocked",
          body: result?.ok && compiledProfile
            ? `Compiled ${result.note.title} into ${compiledProfile.title}.`
            : `Could not compile interpreter profile note: ${result?.issues.join("; ") || "missing linked note"}.`,
          source: {
            toolName: "live_env.configure_interpreter_profile",
            artifactId: noteId ?? profile.profileId,
            artifactKind: "stage_play_live_source_interpreter_profile_note",
          },
          evidenceRefs: uniqueStrings([profile.profileId, noteId]),
          authority: "tool_evidence",
          assistantAnswer: false,
          terminalEligible: false,
          createdAt: now,
        }];
        return makeObservation({
          threadId: input.thread_id,
          environmentId: compiledProfile?.environmentId ?? profile.environmentId ?? environment?.environment_id ?? input.environment_id,
          toolName: input.tool_name,
          ok: result?.ok === true,
          summary: result?.ok && compiledProfile
            ? `Compiled interpreter profile note ${result.note.noteId} into ${compiledProfile.profileId}.`
            : `Interpreter profile note compile failed: ${result?.issues.join("; ") || "missing linked note"}.`,
          observation: {
            schema: "stage_play_interpreter_profile_action_result/v1",
            ok: result?.ok === true,
            profileAction,
            profile_action: profileAction,
            profile: compiledProfile ?? profile,
            note: result?.note ?? null,
            issues: result?.issues ?? ["missing linked note"],
            transcriptRows,
            post_tool_model_step_required: true,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          },
          transcriptRows,
          evidenceRefs: uniqueStrings([profile.profileId, compiledProfile?.profileId, noteId]),
        });
      }
    }
    const requestedLinkedNoteId =
      readString(args.linked_note_id) ??
      readString(args.linkedNoteId);
    const createLinkedNote =
      readBooleanArg(args, "create_linked_note", "createLinkedNote") === true ||
      Boolean(requestedLinkedNoteId);
    const requestedLinkedNoteTitle =
      readString(args.linked_note_title) ??
      readString(args.linkedNoteTitle);
    const evidenceRefs = uniqueStrings([
      ...readStringArray(args.evidence_refs ?? args.evidenceRefs),
      ...sourceIds,
      jobId,
      policyId,
      requestedLinkedNoteId,
    ]);
    let profile = recordStagePlayLiveSourceInterpreterProfile(
      buildStagePlayLiveSourceInterpreterProfileV1({
        profileId: `stage_play_live_source_interpreter_profile:${hashShort([
          input.thread_id,
          roomId,
          environment?.environment_id ?? input.environment_id ?? null,
          jobId,
          policyId,
          domain,
          title,
          objectiveText,
          interpretationGuidelines,
          now,
        ])}`,
        title,
        threadId: input.thread_id,
        roomId,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        jobId,
        policyId,
        sourceKinds: normalizedSourceKinds,
        domain,
        objectiveText,
        interpretationGuidelines,
        lenses: readStringArray(args.lenses),
        salienceCriteria: readStringArray(args.salience_criteria ?? args.salienceCriteria),
        suppressCriteria: readStringArray(args.suppress_criteria ?? args.suppressCriteria),
        riskCriteria: readStringArray(args.risk_criteria ?? args.riskCriteria),
        opportunityCriteria: readStringArray(args.opportunity_criteria ?? args.opportunityCriteria),
        voiceCalloutCriteria: readStringArray(args.voice_callout_criteria ?? args.voiceCalloutCriteria),
        evidenceRules: {
          preserveRawObservation: true,
          distinguishObservedVsInferred: true,
          requireEvidenceRefs: true,
          askWhenUncertain:
            readBooleanArg(args, "ask_when_uncertain", "askWhenUncertain") ?? true,
        },
        outputStyle: {
          textAnswerStyle: readInterpreterProfileTextStyle(
            args.text_answer_style ?? args.textAnswerStyle,
          ),
          voiceStyle: readInterpreterProfileVoiceStyle(
            args.voice_style ?? args.voiceStyle,
          ),
        },
        linkedNoteId: requestedLinkedNoteId ?? null,
        linkedNoteTitle: requestedLinkedNoteTitle ?? null,
        status: "active",
        evidenceRefs,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const note = createLinkedNote
      ? createInterpreterProfileNote({
          profileId: profile.profileId,
          noteId: requestedLinkedNoteId,
          title: requestedLinkedNoteTitle,
          now,
        })
      : null;
    if (note) {
      profile = {
        ...profile,
        linkedNoteId: note.noteId,
        linkedNoteTitle: note.title,
        evidenceRefs: uniqueStrings([...profile.evidenceRefs, note.noteId]),
      };
      profile = recordStagePlayLiveSourceInterpreterProfile(profile);
    }
    const linkedNote = note
      ? {
          noteId: note.noteId,
          title: note.title,
        }
      : null;
    const profileCount = listStagePlayLiveSourceInterpreterProfiles({
      threadId: input.thread_id,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      jobId,
      domain,
      includeArchived: true,
      limit: 250,
    }).length;
    const transcriptRows = buildInterpreterProfileConfiguredTranscriptRows({
      profile,
      linkedNote,
      createdAt: now,
    });
    const result = {
      schema: "stage_play_interpreter_profile_config_result/v1",
      schemaVersion: "stage_play_interpreter_profile_config_result/v1",
      artifactId: "stage_play_interpreter_profile_config_result",
      profile,
      linkedNote,
      linked_note: linkedNote,
      transcriptRows,
      profileCount,
      profile_count: profileCount,
      interpreterProfileRef: profile.profileId,
      interpreter_profile_ref: profile.profileId,
      sourceIds,
      source_ids: sourceIds,
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    return makeObservation({
      threadId: input.thread_id,
      environmentId: profile.environmentId ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Configured interpreter profile ${profile.profileId}; no live-source mail was read.`,
      observation: result,
      transcriptRows,
      evidenceRefs: uniqueStrings([
        profile.profileId,
        linkedNote?.noteId,
        ...profile.evidenceRefs,
      ]),
    });
  }

  if (input.tool_name === "live_env.compare_mail_to_interpreter_profile") {
    const profileId =
      readString(args.profile_id) ??
      readString(args.profileId);
    const jobId =
      readString(args.job_id) ??
      readString(args.jobId) ??
      null;
    const policyId =
      readString(args.policy_id) ??
      readString(args.policyId) ??
      null;
    const profile =
      (profileId ? getStagePlayLiveSourceInterpreterProfile(profileId) : null) ??
      getActiveInterpreterProfileForJob({
        threadId: input.thread_id,
        roomId,
        environmentId: environment?.environment_id ?? input.environment_id ?? null,
        jobId,
        policyId,
      });
    const mailIds = readStringArray(args.mail_ids ?? args.mailIds);
    const mailItems = mailIds
      .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
      .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item));
    const missingFields = [
      profile ? null : "profile_id or active interpreter profile",
      mailIds.length > 0 ? null : "mail_ids",
      mailIds.length === mailItems.length ? null : "one or more mail_ids could not be loaded",
    ].filter((entry): entry is string => Boolean(entry));
    if (!profile || missingFields.length > 0) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: environment?.environment_id ?? input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: `Interpreter profile comparison could not run: missing ${missingFields.join(", ")}.`,
        observation: {
          schema: "stage_play_interpreter_profile_comparison_result/v1",
          ok: false,
          missingFields,
          missing_fields: missingFields,
          requestedProfileId: profileId,
          requested_profile_id: profileId,
          mailIds,
          mail_ids: mailIds,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: uniqueStrings([profileId, ...mailIds]),
      });
    }
    const narrativeStateRef =
      readString(args.narrative_state_ref) ??
      readString(args.narrativeStateRef) ??
      readString(args.narrative_state_id) ??
      readString(args.narrativeStateId);
    const comparison = compareMailToInterpreterProfile({
      profile,
      mailItems,
      narrativeStateRef,
      jobId,
      policyId,
    });
    const transcriptRows = buildInterpreterProfileComparisonTranscriptRows({
      comparison,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: profile.environmentId ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Compared ${comparison.mailIds.length} live-source mail item(s) to interpreter profile ${comparison.profileId}; recommended ${comparison.recommendedDecision}.`,
      observation: {
        ...comparison,
        causal_trace: comparison.causalTrace,
        transcriptRows,
        post_tool_model_step_required: true,
        ask_context_policy: "evidence_only",
      },
      transcriptRows,
      evidenceRefs: comparison.evidenceRefs,
    });
  }

  if (input.tool_name === "live_env.record_live_source_mail_decision") {
    const hasExplicitDecision = Object.prototype.hasOwnProperty.call(args, "decision");
    const decisionRaw = readString(args.decision) ?? "wait_for_next_summary";
    const allowedDecisions = new Set([
      "wait_for_next_summary",
      "record_interpretation",
      "draft_text_answer",
      "request_voice_callout",
      "request_more_evidence",
      "request_stage_play_checkpoint",
      "fail_closed",
    ]);
    let decision = allowedDecisions.has(decisionRaw)
      ? decisionRaw as Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["decision"]
      : "wait_for_next_summary";
    const hasExplicitMailIds =
      Object.prototype.hasOwnProperty.call(args, "mail_ids") ||
      Object.prototype.hasOwnProperty.call(args, "mailIds");
    const suppliedProcessedPacketIds = readStringArray(args.processed_packet_ids ?? args.processedPacketIds);
    const hasExplicitProcessedPacketIds =
      Object.prototype.hasOwnProperty.call(args, "processed_packet_ids") ||
      Object.prototype.hasOwnProperty.call(args, "processedPacketIds");
    const suppliedMailIds = readStringArray(args.mail_ids ?? args.mailIds);
    const activeJobStatesForDecision = listStagePlayLiveSourceJobStates({ threadId: input.thread_id, limit: 100 });
    const activeJobIdsForDecision = new Set(activeJobStatesForDecision.map((state) => state.jobId));
    const allProcessedPacketsForDecision =
      suppliedProcessedPacketIds.length > 0 || hasExplicitProcessedPacketIds
        ? listStagePlayProcessedMailPackets({ limit: 100 })
        : [];
    const suppliedProcessedPacketsForDecision = suppliedProcessedPacketIds.length > 0
      ? allProcessedPacketsForDecision.filter((packet) => suppliedProcessedPacketIds.includes(packet.packetId))
      : [];
    const recentProcessedPacketsForDecision =
      hasExplicitMailIds ||
      suppliedMailIds.length > 0 ||
      suppliedProcessedPacketIds.length > 0 ||
      hasExplicitProcessedPacketIds
      ? []
      : listStagePlayProcessedMailPackets({ limit: 25 });
    const activeJobMatchedProcessedPacketsForDecision = recentProcessedPacketsForDecision
      .filter((packet) => activeJobIdsForDecision.size === 0 || activeJobIdsForDecision.has(packet.jobId));
    const recoveredProcessedPacketsForDecision = hasExplicitMailIds || suppliedMailIds.length > 0
      ? []
      : suppliedProcessedPacketsForDecision.length > 0
        ? suppliedProcessedPacketsForDecision
        : (activeJobMatchedProcessedPacketsForDecision.length > 0
            ? activeJobMatchedProcessedPacketsForDecision
            : recentProcessedPacketsForDecision
          ).slice(-1);
    const mailIds = suppliedMailIds.length > 0
      ? suppliedMailIds
      : uniqueStrings(recoveredProcessedPacketsForDecision.flatMap((packet) => packet.mailIds));
    const processedPacketsForMailIds = mailIds.length > 0
      ? (
          allProcessedPacketsForDecision.length > 0
            ? allProcessedPacketsForDecision
            : listStagePlayProcessedMailPackets({ limit: 100 })
        )
          .filter((packet) => packet.mailIds.some((mailId) => mailIds.includes(mailId)))
      : suppliedProcessedPacketsForDecision;
    const latestProcessedPacket = processedPacketsForMailIds.at(-1) ?? null;
    const processedPacketEvidenceRefs = uniqueStrings(processedPacketsForMailIds.flatMap((packet) => packet.evidenceRefs));
    const processedPacketRefs = processedPacketsForMailIds.map((packet) => packet.packetId);
    const processedPacketMicroReasonerRefs = uniqueStrings(processedPacketsForMailIds.flatMap((packet) => packet.microReasonerRunRefs));
    const suppliedMicroReasonerRefs = readStringArray(args.micro_reasoner_refs ?? args.microReasonerRefs);
    const microReasonerRefs = uniqueStrings([
      ...suppliedMicroReasonerRefs,
      ...processedPacketMicroReasonerRefs,
    ]);
    const microReasonerRuns = microReasonerRefs.length > 0
      ? listStagePlayMicroReasonerRuns({ limit: 200 })
          .filter((run) => microReasonerRefs.includes(run.runId))
      : [];
    const decisionSelectorRun = microReasonerRuns
      .filter((run) => run.role === "decision_selector")
      .at(-1) ?? null;
    const outputIntentRecord = readRecord(args.live_source_mail_output_intent ?? args.liveSourceMailOutputIntent);
    const outputIntentWantsInterpretation =
      outputIntentRecord?.wantsInterpretation === true ||
      outputIntentRecord?.wants_interpretation === true;
    const outputIntentWantsVoiceCallout =
      outputIntentRecord?.wantsVoiceCallout === true ||
      outputIntentRecord?.wants_voice_callout === true;
    const outputIntentWantsTextAnswer =
      outputIntentRecord?.wantsTextAnswer === true ||
      outputIntentRecord?.wants_text_answer === true;
    const outputIntentWantsInterpretationOnly =
      outputIntentWantsInterpretation && !outputIntentWantsVoiceCallout;
    const processedPacketRecommendedNext = latestProcessedPacket?.recommendedNext ?? null;
    const processedPacketProfileRef = latestProcessedPacket?.profileRef ?? null;
    const processedPacketSalience = latestProcessedPacket?.salience ?? null;
    const processedPacketVoiceCandidate =
      processedPacketSalience?.voiceCandidate === true ||
      processedPacketRecommendedNext === "request_voice_callout";
    const suppliedVoiceEnabled =
      args.voice_enabled === true ||
      args.voiceEnabled === true;
    const suppliedVoiceAllowedNow =
      args.voice_allowed_now === true ||
      args.voiceAllowedNow === true;
    const processedPacketCalloutDraft =
      readString(processedPacketSalience?.calloutDraft) ??
      latestProcessedPacket?.observedFacts.find((fact) => /\b(?:fire|damage|hostile|mob|lava|combat|danger)\b/i.test(fact)) ??
      null;
    const processedPacketJobId = latestProcessedPacket?.jobId ?? null;
    const processedPacketJobState = processedPacketJobId
      ? activeJobStatesForDecision.find((state) => state.jobId === processedPacketJobId) ?? null
      : null;
    const processedPacketPolicy =
      processedPacketJobState?.watchJobPolicyRef
        ? listStagePlayLiveSourceWatchJobPolicies({ threadId: input.thread_id, limit: 100 })
            .find((policy) => policy.policyId === processedPacketJobState.watchJobPolicyRef) ?? null
        : processedPacketJobId
          ? listStagePlayLiveSourceWatchJobPolicies({ threadId: input.thread_id, jobId: processedPacketJobId, limit: 1 }).at(-1) ?? null
          : null;
    const processedPolicyWantsTextForEveryMailBatch = (() => {
      if (!processedPacketPolicy) return false;
      if (processedPacketPolicy.interpretationMode) {
        return processedPacketPolicy.interpretationMode === "latest_scene_answer";
      }
      const policyText = [
        processedPacketPolicy.objectiveText,
        processedPacketPolicy.decisionPolicyPrompt,
        ...(processedPacketPolicy.importanceCriteria ?? []),
      ].join("\n");
      return (
        /\beach\s+(?:new\s+)?(?:visual-summary\s+)?mail\s+batch\b/i.test(policyText) ||
        /\bany\s+new\s+visual-summary\s+mail\s+batch\b/i.test(policyText) ||
        /\brecord\s+draft_text_answer\b/i.test(policyText)
      );
    })();
    const processedPolicyAllowsVoice = processedPacketPolicy?.outputPolicy.allowVoiceCallout === true;
    const processedPolicyRequiresConfirmation = processedPacketPolicy?.outputPolicy.confirmationRequired === true;
    const effectiveVoiceEnabled =
      suppliedVoiceEnabled ||
      processedPolicyAllowsVoice ||
      outputIntentWantsVoiceCallout;
    const effectiveVoiceAllowedNow =
      suppliedVoiceAllowedNow ||
      (
        effectiveVoiceEnabled &&
        !processedPolicyRequiresConfirmation &&
        (outputIntentWantsVoiceCallout || processedPolicyAllowsVoice)
      );
    if (!hasExplicitDecision && mailIds.length > 0 && processedPacketsForMailIds.length > 0) {
      if (
        decisionSelectorRun?.selectedDecision &&
        decision === "wait_for_next_summary" &&
        decisionSelectorRun.selectedDecision !== "wait_for_next_summary" &&
        (!outputIntentWantsInterpretationOnly || processedPolicyAllowsVoice)
      ) {
        decision = decisionSelectorRun.selectedDecision as Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["decision"];
      } else if (
        decision === "wait_for_next_summary" &&
        (
          processedPolicyWantsTextForEveryMailBatch ||
          outputIntentWantsTextAnswer ||
          processedPacketRecommendedNext === "draft_text_answer"
        )
      ) {
        decision = "draft_text_answer";
      } else if (decision === "request_voice_callout" && outputIntentWantsInterpretationOnly && !processedPolicyAllowsVoice) {
        decision = "record_interpretation";
      } else if (decision === "wait_for_next_summary" && outputIntentWantsInterpretationOnly && !processedPolicyAllowsVoice) {
        decision = "record_interpretation";
      } else if (
        processedPacketVoiceCandidate &&
        (!outputIntentWantsInterpretationOnly || processedPolicyAllowsVoice) &&
        (
          outputIntentWantsVoiceCallout ||
          effectiveVoiceEnabled ||
          effectiveVoiceAllowedNow ||
          processedPacketRecommendedNext === "request_voice_callout"
        )
      ) {
        decision = "request_voice_callout";
      } else if (decision === "wait_for_next_summary" && (outputIntentWantsInterpretation || processedPacketRecommendedNext === "record_interpretation")) {
        decision = "record_interpretation";
      } else if (decision === "wait_for_next_summary" && (
        processedPacketRecommendedNext === "request_more_evidence" ||
        processedPacketRecommendedNext === "request_stage_play_checkpoint" ||
        processedPacketRecommendedNext === "fail_closed"
      )) {
        decision = processedPacketRecommendedNext;
      }
    }
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId),
      mailIds,
    });
    const nextLoopStateRaw = readString(args.next_loop_state) ?? readString(args.nextLoopState);
    const allowedLoopStates = new Set([
      "armed_for_next_summary",
      "continue_with_unread_mail",
      "paused_by_user",
      "blocked_missing_source",
      "blocked_voice_policy",
      "blocked_tool_error",
      "ended",
    ]);
    const nextLoopState = nextLoopStateRaw && allowedLoopStates.has(nextLoopStateRaw)
      ? nextLoopStateRaw as Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["nextLoopState"]
      : null;
    const mailCoverageRaw =
      args.mail_coverage && typeof args.mail_coverage === "object" && !Array.isArray(args.mail_coverage)
        ? args.mail_coverage as Record<string, unknown>
        : args.mailCoverage && typeof args.mailCoverage === "object" && !Array.isArray(args.mailCoverage)
          ? args.mailCoverage as Record<string, unknown>
          : null;
    const mailCoverage = mailCoverageRaw
      ? {
          readMailIds: readStringArray(mailCoverageRaw.read_mail_ids ?? mailCoverageRaw.readMailIds),
          interpretedMailIds: readStringArray(mailCoverageRaw.interpreted_mail_ids ?? mailCoverageRaw.interpretedMailIds),
          compressedMailIds: readStringArray(mailCoverageRaw.compressed_mail_ids ?? mailCoverageRaw.compressedMailIds),
          skippedMailIds: readStringArray(mailCoverageRaw.skipped_mail_ids ?? mailCoverageRaw.skippedMailIds),
          mode: readString(mailCoverageRaw.mode) as NonNullable<Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["mailCoverage"]>["mode"] | undefined,
          reason: readString(mailCoverageRaw.reason) ?? "Model supplied mail coverage for this decision.",
        }
      : null;
    const defaultDecisionMailCoverage: Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["mailCoverage"] | null =
      decision === "record_interpretation" && mailIds.length > 0
        ? {
            readMailIds: mailIds,
            interpretedMailIds: mailIds,
            compressedMailIds: mailIds.length > 1 ? mailIds : [],
            skippedMailIds: [],
            mode: mailIds.length > 8 ? "micro_batch" : "chronological_batch",
            reason: "Interpretation decision preserves mail as a time-aware observation batch.",
          }
        : null;
    const defaultProcessedTextAnswerDraft =
      latestProcessedPacket && decision === "draft_text_answer"
        ? `The processed visual mail shows ${latestProcessedPacket.observedFacts.slice(0, 2).join("; ") || latestProcessedPacket.changedFacts.slice(0, 2).join("; ") || "a compact live-source observation"}.`
        : null;
    const defaultProcessedInterpretation =
      latestProcessedPacket && decision === "record_interpretation"
        ? {
            currentSceneSummary:
              latestProcessedPacket.observedFacts.slice(0, 3).join("; ") ||
              "Processed live-source packet contains compact observations.",
            runningStorySummary: uniqueStrings([
              ...latestProcessedPacket.observedFacts,
              ...latestProcessedPacket.changedFacts,
            ]).slice(0, 5).join("; ") || "Processed live-source packet updated the running scene state.",
            setting: null,
            activeWindowOrScene: null,
            entities: [],
            objects: latestProcessedPacket.objectTags,
            activities: latestProcessedPacket.activityTags,
            userRelevantMeaning:
              uniqueStrings([
                ...latestProcessedPacket.changedFacts,
                ...latestProcessedPacket.inferredFacts,
                ...latestProcessedPacket.observedFacts,
              ]).slice(0, 3).join("; ") ||
              "The processed mail packet requires interpretation from the current observation window.",
            meaningfulChanges: latestProcessedPacket.changedFacts,
            uncertainties: latestProcessedPacket.uncertainties,
            watchNextTargets: latestProcessedPacket.watchNext,
            watchNextReason: latestProcessedPacket.watchNext.length > 0
              ? `Watch next for ${latestProcessedPacket.watchNext.slice(0, 3).join(", ")}.`
              : "Watch for meaningful changes in the next source update.",
            predictionText: latestProcessedPacket.predictionValidation
              ? `Prior prediction validation: ${latestProcessedPacket.predictionValidation.result}.`
              : null,
            predictionHorizon: "next_mail",
            predictionConfidence: null,
            validationSignals: latestProcessedPacket.predictionValidation?.newSignals ?? [],
          }
        : null;
    const evidenceRefs = uniqueStrings([
      ...readStringArray(args.evidence_refs ?? args.evidenceRefs),
      ...processedPacketEvidenceRefs,
      ...processedPacketRefs,
      ...microReasonerRefs,
      ...mailIds,
    ]);
    const processedVoiceReasonCodes = uniqueStrings([
      ...(processedPacketSalience?.reasons ?? []),
      ...(processedPacketCalloutDraft && /\b(?:fire|damage|burning)\b/i.test(processedPacketCalloutDraft)
        ? ["minecraft_fire_or_damage_cue"]
        : []),
      ...(processedPacketVoiceCandidate ? ["processed_packet_voice_candidate"] : []),
    ]);
    const defaultProcessedRequestedTool =
      decision === "request_voice_callout" && processedPacketCalloutDraft
        ? {
            toolName: "live_env.request_interim_voice_callout",
            args: {
              kind: "tool_result",
              text: processedPacketCalloutDraft,
              max_chars: 140,
              evidence_refs: evidenceRefs,
              reason_codes: processedVoiceReasonCodes.length > 0
                ? processedVoiceReasonCodes
                : ["processed_packet_voice_callout_requested"],
            },
          }
        : null;
    const suppliedReadMailItemCount =
      typeof args.read_mail_item_count === "number"
        ? args.read_mail_item_count
        : typeof args.readMailItemCount === "number"
          ? args.readMailItemCount
          : null;
    const effectiveReadMailItemCount = Math.max(
      suppliedReadMailItemCount ?? 0,
      mailIds.length,
      processedPacketsForMailIds.flatMap((packet) => packet.mailIds).length,
    );
    const suppliedInterpretation = readInterpretationPayload(args.interpretation, args);
    const recordedDecision = recordLiveSourceMailDecisionForAsk({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      mailIds,
      decision,
      rationalePreview:
        readString(args.rationale_preview) ??
        readString(args.rationalePreview) ??
        readString(args.reason) ??
        `Agent recorded ${decision}.`,
      textAnswerDraft: readString(args.text_answer_draft) ?? readString(args.textAnswerDraft) ?? defaultProcessedTextAnswerDraft,
      textAnswerTerminalEligible: args.text_answer_terminal_eligible === true || args.textAnswerTerminalEligible === true,
      voiceCalloutDraft:
        readString(args.voice_callout_draft) ??
        readString(args.voiceCalloutDraft) ??
        (decision === "request_voice_callout" ? processedPacketCalloutDraft : null),
      voiceEnabled: effectiveVoiceEnabled,
      voiceRequiresConfirmation:
        args.voice_requires_confirmation === true ||
        args.voiceRequiresConfirmation === true ||
        (decision === "request_voice_callout" && processedPolicyRequiresConfirmation),
      voiceAllowedNow: effectiveVoiceAllowedNow,
      voicePolicyReason:
        readString(args.voice_policy_reason) ??
        readString(args.voicePolicyReason) ??
        (processedPolicyAllowsVoice ? "active_watch_policy_allows_voice_callout" : null),
      requestedTool: readRequestedTool(args.requested_tool ?? args.requestedTool) ?? defaultProcessedRequestedTool,
      interpretation: suppliedInterpretation ?? defaultProcessedInterpretation,
      nextLoopState,
      interpreterProfileRef:
        readString(args.interpreter_profile_ref) ??
        readString(args.interpreterProfileRef) ??
        readString(args.profile_id) ??
        readString(args.profileId) ??
        processedPacketProfileRef,
      profileComparisonRefs: readStringArray(args.profile_comparison_refs ?? args.profileComparisonRefs),
      matchedCriteria: readStringArray(args.matched_criteria ?? args.matchedCriteria),
      suppressedCriteria: readStringArray(args.suppressed_criteria ?? args.suppressedCriteria),
      observedFacts: readStringArray(args.observed_facts ?? args.observedFacts),
      inferredMeaning: readStringArray(args.inferred_meaning ?? args.inferredMeaning),
      mailCoverage: mailCoverage && mailCoverage.mode
        ? {
            readMailIds: mailCoverage.readMailIds,
            interpretedMailIds: mailCoverage.interpretedMailIds,
            compressedMailIds: mailCoverage.compressedMailIds,
            skippedMailIds: mailCoverage.skippedMailIds,
            mode: mailCoverage.mode,
            reason: mailCoverage.reason,
          }
        : defaultDecisionMailCoverage,
      evidenceRefs,
      modelReviewed: args.model_reviewed !== false && args.modelReviewed !== false,
    });
    const transcriptRows = [
      ...buildMicroReasonerTranscriptRows({
        toolName: input.tool_name,
        runs: microReasonerRuns.filter((run) =>
          run.role === "decision_selector" ||
          run.role === "voice_callout_drafter" ||
          run.role === "salience_scorer"
        ),
      }),
      ...buildMailLoopTranscriptRows({
        decision: recordedDecision,
      }),
    ];
    const narrativeState = recordedDecision.narrativeStateRef
      ? getStagePlayLiveSourceNarrativeState(recordedDecision.narrativeStateRef)
      : null;
    const waitDecisionWithoutMail =
      mailIds.length === 0 && recordedDecision.decision === "wait_for_next_summary";
    const wakeRequestId = liveSourceWakeRequestIdFromArgs(args);
    const askTurnId = liveSourceAskTurnIdFromArgs(args);
    return makeObservation({
      threadId: input.thread_id,
      environmentId: recordedDecision.environmentId ?? environment?.environment_id ?? input.environment_id,
      toolName: input.tool_name,
      ok: mailIds.length > 0 || waitDecisionWithoutMail,
      summary: mailIds.length > 0
        ? `Recorded live-source mail decision ${recordedDecision.decision}; loop state ${recordedDecision.nextLoopState}.`
        : waitDecisionWithoutMail
        ? "Recorded wait_for_next_summary; no unread live-source updates. Standing by for the next source update."
        : "Live-source mail decision could not link to mail ids.",
      observation: {
        ...recordedDecision,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
        narrativeStateRef: recordedDecision.narrativeStateRef ?? narrativeState?.narrativeStateId ?? null,
        narrative_state_ref: recordedDecision.narrativeStateRef ?? narrativeState?.narrativeStateId ?? null,
        narrativeStateId: recordedDecision.narrativeStateRef ?? narrativeState?.narrativeStateId ?? null,
        narrative_state_id: recordedDecision.narrativeStateRef ?? narrativeState?.narrativeStateId ?? null,
        interpreterProfileRef: recordedDecision.interpreterProfileRef ?? processedPacketProfileRef ?? null,
        interpreter_profile_ref: recordedDecision.interpreterProfileRef ?? processedPacketProfileRef ?? null,
        narrativeState,
        narrative_state: narrativeState,
        causalTrace: recordedDecision.causalTrace,
        causal_trace: recordedDecision.causalTrace,
        transcriptRows,
        liveSourceMailOutputIntent: args.live_source_mail_output_intent ?? args.liveSourceMailOutputIntent ?? null,
        live_source_mail_output_intent: args.live_source_mail_output_intent ?? args.liveSourceMailOutputIntent ?? null,
        decisionValidationResult:
          decision === "request_voice_callout"
            ? "forced_request_voice_callout_for_read_mail_voice_intent"
            : readString(args.decision_validation_result) ?? readString(args.decisionValidationResult) ?? null,
        decision_validation_result:
          decision === "request_voice_callout"
            ? "forced_request_voice_callout_for_read_mail_voice_intent"
            : readString(args.decision_validation_result) ?? readString(args.decisionValidationResult) ?? null,
        processedPacketRefs,
        processed_packet_refs: processedPacketRefs,
        microReasonerRefs,
        micro_reasoner_refs: microReasonerRefs,
        microReasonerRuns,
        micro_reasoner_runs: microReasonerRuns,
        decisionSource: microReasonerRefs.length > 0 ? "micro_reasoner_pipeline" : "ask_agent_or_manual",
        decision_source: microReasonerRefs.length > 0 ? "micro_reasoner_pipeline" : "ask_agent_or_manual",
        readMailItemCount: effectiveReadMailItemCount,
        read_mail_item_count: effectiveReadMailItemCount,
        post_tool_model_step_required: recordedDecision.decision !== "wait_for_next_summary",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        recordedDecision.decisionId,
        ...recordedDecision.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
      producedRefs: [recordedDecision.decisionId],
      artifactRefs: {
        processedPacketIds: processedPacketRefs,
        decisionIds: [recordedDecision.decisionId],
        wakeRequestId,
        askTurnId,
      },
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.request_interim_voice_callout") {
    const turnId =
      readString(args.turn_id) ??
      readString(args.turnId) ??
      `live_env_turn:${hashShort([input.thread_id, input.environment_id ?? null, args.evidence_refs ?? [], Date.now()])}`;
    const result = recordInterimVoiceCalloutRequest({
      turnId,
      threadId: input.thread_id,
      source: readString(args.source) ?? "ask_tool_loop",
      kind: readString(args.kind) ?? "tool_progress",
      text: readString(args.text) ?? readString(args.message),
      maxChars: readNumber(args.max_chars ?? args.maxChars, 220),
      timingHintMs: readNumber(args.timing_hint_ms ?? args.timingHintMs, NaN),
      voicePlaybackKind: readString(args.voice_playback_kind) ?? readString(args.voicePlaybackKind),
      requiresConfirmation:
        readBooleanArg(args, "requires_confirmation", "requiresConfirmation") ?? false,
      evidenceRefs: readStringArray(args.evidence_refs),
      reasonCodes: readStringArray(args.reason_codes ?? args.reasonCodes),
    });
    const ok =
      result.receipt.status === "awaiting_client_playback" ||
      result.receipt.status === "queued" ||
      result.receipt.status === "queued_for_retry" ||
      result.receipt.status === "delivered";
    const transcriptRows = result.request.kind === "steering_ack"
      ? buildSteeringAckTranscriptRows({
          requestId: result.request.requestId,
          receiptId: result.receipt.receiptId,
          text: result.request.text,
          evidenceRefs: result.receipt.evidenceRefs,
        })
      : [];
    const wakeRequestId = liveSourceWakeRequestIdFromArgs(args);
    const askTurnId = liveSourceAskTurnIdFromArgs(args);
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? result.receipt.status === "queued_for_retry"
          ? `Queued interim voice callout ${result.request.requestId} for retry.`
          : result.receipt.status === "awaiting_client_playback" || result.receipt.status === "queued"
            ? `Accepted interim voice callout ${result.request.requestId} for client playback handoff.`
            : `Delivered interim voice callout ${result.request.requestId}.`
        : `Interim voice callout blocked: ${result.receipt.status}.`,
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        request: result.request,
        receipt: result.receipt,
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        transcriptRows,
      },
      transcriptRows,
      evidenceRefs: [result.request.requestId, result.receipt.receiptId, ...result.receipt.evidenceRefs],
      producedRefs: [result.request.requestId, result.receipt.receiptId],
      artifactRefs: {
        voiceReceiptIds: [result.receipt.receiptId],
        wakeRequestId,
        askTurnId,
      },
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.record_voice_steering") {
    const transcriptText = readString(args.transcript_text) ?? readString(args.transcriptText);
    const turnId = readString(args.turn_id) ?? readString(args.turnId);
    if (!turnId) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: "Voice steering could not be recorded because turn_id is required.",
        observation: {
          schema: "helix.voice_steering_tool_result.v1",
          error: "missing_turn_id",
          post_tool_model_step_required: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: readStringArray(args.evidence_refs),
      });
    }
    if (!transcriptText) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: "Voice steering could not be recorded because transcript_text is required.",
        observation: {
          schema: "helix.voice_steering_tool_result.v1",
          error: "missing_transcript_text",
          post_tool_model_step_required: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
        },
        evidenceRefs: readStringArray(args.evidence_refs),
      });
    }
    const steeringEvent = recordVoiceSteeringEvent({
      threadId: readString(args.thread_id) ?? readString(args.threadId) ?? input.thread_id,
      turnId,
      expectedTurnId: readString(args.expected_turn_id) ?? readString(args.expectedTurnId),
      source: readVoiceSteeringSource(args.source),
      transcriptText,
      timing: readVoiceSteeringTiming(args.timing),
      classification: readVoiceSteeringClassification(args.classification),
      queueDecision: readVoiceSteeringQueueDecision(args.queue_decision ?? args.queueDecision),
      activeGoalText: readString(args.active_goal_text) ?? readString(args.activeGoalText),
      capturedAt: readString(args.captured_at) ?? readString(args.capturedAt),
      evidenceRefs: readStringArray(args.evidence_refs),
      reasonCodes: readStringArray(args.reason_codes ?? args.reasonCodes),
    });
    const transcriptRows = buildVoiceSteeringTranscriptRows({ steeringEvent });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary:
        steeringEvent.queueDecision === "queued_for_safe_boundary"
          ? `Queued voice steering ${steeringEvent.steeringEventId} for the next safe boundary.`
          : `Recorded voice steering ${steeringEvent.steeringEventId} as ${steeringEvent.queueDecision}.`,
      observation: {
        schema: "helix.voice_steering_tool_result.v1",
        steeringEvent,
        queuedForSafeBoundary: steeringEvent.queueDecision === "queued_for_safe_boundary",
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        transcriptRows,
      },
      transcriptRows,
      evidenceRefs: [steeringEvent.steeringEventId, ...steeringEvent.evidenceRefs],
    });
  }

  if (input.tool_name === "live_env.query_source_health") {
    const goalId = readString(args.goal_id) ?? readString(args.goalId);
    const goalSession = goalId
      ? listStagePlayAgentGoalSessions({
          threadId: input.thread_id,
          goalId,
          limit: 1,
        })[0] ?? null
      : null;
    const feedAllowed = !goalId || goalSessionFeedAllowed(goalSession, "source_health");
    const actuatorAllowed = !goalId || goalSessionActuatorAllowed(goalSession, "query_source_health");
    const feedMissingRequirements = goalId
      ? goalSession
        ? [
            ...(feedAllowed ? [] : ["context_feed:source_health"]),
            ...(actuatorAllowed ? [] : ["allowed_actuator:query_source_health"]),
          ]
        : ["goal_session"]
      : [];
    const ok = feedMissingRequirements.length === 0;
    const result = readSituationSourceCapabilities({
      threadId: input.thread_id,
      roomId,
    });
    const sourceRefs = result.capabilities.map((capability) => capability.source_id);
    const visibleResult = ok ? result : { ...result, capabilities: [] };
    const blockedCapabilities = result.capabilities.filter((capability) => capability.status !== "active");
    const contentRef = `stage_play_source_health:${hashShort([
      input.thread_id,
      roomId ?? null,
      sourceRefs,
      result.capabilities.map((capability) => capability.status),
    ])}`;
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: input.thread_id,
      roomId,
      producerKind: "source_health",
      updateKind: "source_status",
      contentRef,
      preview: ok
        ? result.capabilities.length > 0
          ? `Source health read ${result.capabilities.length} capability state(s): ${result.capabilities
              .slice(0, 4)
              .map((capability) => `${capability.modality} ${capability.status}`)
              .join("; ")}.`
          : "Source health read found no registered source capability state."
        : `Blocked source health query; missing ${feedMissingRequirements.join(", ")}.`,
      sourceRefs: ok ? sourceRefs : [input.thread_id],
      loopRefs: ok ? sourceRefs.map((sourceRef) => `source_health:${sourceRef}`) : [`source_health:${input.thread_id}`],
      evidenceRefs: ok ? sourceRefs : [contentRef, input.thread_id],
      receiptRefs: [contentRef],
      freshnessStatus: ok ? (blockedCapabilities.length > 0 ? "blocked" : "fresh") : "blocked",
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: contentRef },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        ...(ok ? blockedCapabilities.slice(0, 2).map((capability): WorkstationDispatchActionV1 => ({
          kind: "repair_loop",
          loopRef: `source_health:${capability.source_id}`,
        })) : []),
      ],
    });
    const checkpointedGoalSession = ok && goalSession
      ? appendAgentGoalSessionCheckpoint({
          session: goalSession,
          threadId: input.thread_id,
          roomId,
          sourceRefs: uniqueStrings(sourceRefs.length > 0 ? sourceRefs : [input.thread_id]),
          loopRefs: uniqueStrings(
            sourceRefs.length > 0
              ? sourceRefs.map((sourceRef) => `source_health:${sourceRef}`)
              : [`source_health:${input.thread_id}`],
          ),
          evidenceRefs: uniqueStrings([goalContextUpdateId, contentRef, ...sourceRefs]).slice(0, 80),
          actionsTaken: ["query_source_health", input.tool_name],
          summary: `Queried source health and read ${visibleResult.capabilities.length} capability state(s) for this goal session.`,
          nextStep: blockedCapabilities.length > 0 ? "repair" : "continue",
        })
      : goalSession;
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok,
      summary: ok
        ? `Read ${result.capabilities.length} source capability state(s).`
        : `Cannot read source health; missing ${feedMissingRequirements.join(", ")}.`,
      observation: {
        ...visibleResult,
        goalId,
        goal_id: goalId,
        status: ok ? "read" : "blocked",
        missingRequirements: feedMissingRequirements,
        missing_requirements: feedMissingRequirements,
        goalSessionFound: goalId ? Boolean(goalSession) : null,
        goal_session_found: goalId ? Boolean(goalSession) : null,
        feedAllowed,
        feed_allowed: feedAllowed,
        requiredActuator: "query_source_health",
        required_actuator: "query_source_health",
        actuatorAllowed,
        actuator_allowed: actuatorAllowed,
        agentGoalSession: checkpointedGoalSession,
        agent_goal_session: checkpointedGoalSession,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        post_tool_model_step_required: true,
        terminal_eligible: false,
      },
      evidenceRefs: uniqueStrings([goalContextUpdateId, ...sourceRefs]),
      producedRefs: [goalContextUpdateId],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.query_live_source_quality") {
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId) ??
        readString(args.thread_id) ??
        readString(args.threadId),
      mailIds: readStringArray(args.mail_ids ?? args.mailIds),
    });
    const quality = queryStagePlayLiveSourceQuality({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId: explicitSourceId,
      sourceKind: readString(args.source_kind) ?? readString(args.sourceKind),
      expectedCadenceMs: readNumber(args.expected_cadence_ms ?? args.expectedCadenceMs, 0) || null,
    });
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: "source_health",
      updateKind: "source_status",
      contentRef: quality.qualityId,
      preview: `Live source quality is ${quality.quality}; freshness is ${quality.freshness}. ${quality.limitations[0] ?? ""}`,
      sourceRefs: uniqueStrings([
        quality.sourceId,
        ...quality.evidenceRefs.filter((ref) => ref.startsWith("visual_source:") || ref.startsWith("missing:")),
      ]),
      loopRefs: uniqueStrings([
        `live_source_quality:${quality.sourceId ?? "all"}`,
        quality.latestRefs.wakeRequestId,
        quality.latestRefs.decisionId,
        quality.latestRefs.narrativeStateId,
      ]),
      evidenceRefs: quality.evidenceRefs,
      receiptRefs: [quality.qualityId],
      observedAtMs: Date.parse(quality.createdAt),
      freshnessStatus: goalContextFreshnessStatus(quality.freshness),
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: quality.qualityId },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        ...(quality.quality === "stale" || quality.quality === "degraded" || quality.quality === "insufficient"
          ? [{ kind: "repair_loop", loopRef: `live_source_quality:${quality.sourceId ?? "all"}` } as WorkstationDispatchActionV1]
          : []),
      ],
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Live source quality is ${quality.quality}; freshness is ${quality.freshness}.`,
      observation: {
        ...quality,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
        post_tool_model_step_required: true,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        goalContextUpdateId,
        quality.qualityId,
        ...quality.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
      producedRefs: [goalContextUpdateId],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.summarize_live_source_current_state") {
    const mailboxThreadResolution = resolveStagePlayLiveSourceMailboxThreadId({
      askThreadId: input.thread_id,
      requestedThreadId: effectiveThreadId,
      uiThreadId: readString(args.ui_thread_id) ?? readString(args.uiThreadId),
      environmentThreadId: environment?.thread_id ?? null,
      explicitMailboxThreadId:
        readString(args.mailbox_thread_id) ??
        readString(args.mailboxThreadId) ??
        readString(args.thread_id) ??
        readString(args.threadId),
      mailIds: readStringArray(args.mail_ids ?? args.mailIds),
    });
    const currentState = summarizeStagePlayLiveSourceCurrentState({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceId: explicitSourceId,
      sourceKind: readString(args.source_kind) ?? readString(args.sourceKind),
      expectedCadenceMs: readNumber(args.expected_cadence_ms ?? args.expectedCadenceMs, 0) || null,
      limit: readNumber(args.limit, 6),
    });
    const goalContextUpdateId = recordLiveEnvironmentGoalContextUpdate({
      threadId: input.thread_id,
      mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      producerKind: "live_answer",
      updateKind: "summary",
      contentRef: currentState.currentStateId,
      preview: currentState.whatAskCanSafelySay[0] ??
        `Current live-source state has quality ${currentState.quality.quality} and ${currentState.latestMailItems.length} compact mail item(s).`,
      sourceRefs: currentState.sourceIds,
      loopRefs: uniqueStrings([
        currentState.currentStateId,
        ...currentState.activeWatchJobs.flatMap((job) => [job.jobId, job.policyId]),
        currentState.latestDecision?.decisionId,
        currentState.latestNarrativeState?.narrativeStateId,
      ]),
      evidenceRefs: currentState.evidenceRefs,
      receiptRefs: [currentState.currentStateId, currentState.quality.qualityId],
      observedAtMs: Date.parse(currentState.createdAt),
      freshnessStatus: goalContextFreshnessStatus(currentState.quality.freshness),
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: currentState.currentStateId },
        { kind: "update_live_answer", lineKey: "live_source_current_state" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary:
        currentState.latestMailItems.length > 0
          ? `Summarized current live-source state from ${currentState.latestMailItems.length} compact mail item(s); quality ${currentState.quality.quality}.`
          : `Summarized current live-source state; no compact mail is available and quality is ${currentState.quality.quality}.`,
      observation: {
        ...currentState,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
        post_tool_model_step_required: true,
        goalContextUpdateId,
        goal_context_update_id: goalContextUpdateId,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        goalContextUpdateId,
        currentState.currentStateId,
        ...currentState.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
      producedRefs: [goalContextUpdateId],
      forceNormalizedRefs: true,
    });
  }

  if (input.tool_name === "live_env.query_constructs") {
    const constructs = listSituationConstructs({
      threadId: input.thread_id,
      roomId,
      type: readString(args.type),
      status: readString(args.status),
      limit: readNumber(args.limit, 50),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Retrieved ${constructs.length} Situation Room construct record(s).`,
      observation: {
        schema: "helix.situation_construct_query_result.v1",
        thread_id: input.thread_id,
        room_id: roomId,
        type: readString(args.type),
        status: readString(args.status),
        constructs,
        count: constructs.length,
        assistant_answer: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: constructs.flatMap((construct) => [
        construct.construct_id,
        ...construct.source_ids,
        ...construct.artifact_refs,
        ...construct.receipt_refs,
        ...construct.commentary_refs,
        ...construct.evidence_refs,
      ]),
    });
  }

  if (input.tool_name === "live_env.query_job_evidence") {
    const result = queryLiveAnswersEvidence({
      query: readString(args.query),
      contractId: readString(args.contract_id),
      threadId: input.thread_id,
      limit: readNumber(args.limit, 50),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Retrieved live job evidence with ${result.evidence_refs.length} evidence ref(s).`,
      observation: result,
      evidenceRefs: result.evidence_refs,
    });
  }

  if (input.tool_name === "live_env.record_commentary") {
    const commentary = recordLiveEnvironmentCommentary({
      thread_id: input.thread_id,
      room_id: roomId,
      environment_id: input.environment_id,
      subject: commentarySubject(args.subject),
      kind: commentaryKind(args.kind),
      status: commentaryStatus(args.status),
      compact_summary: readString(args.summary) ?? readString(args.reason) ?? "Live environment evidence item recorded.",
      evidence_refs: readStringArray(args.evidence_refs),
      related_artifact_ids: readStringArray(args.related_artifact_ids),
      related_worker_ids: readStringArray(args.related_worker_ids),
      related_perturbation_ids: readStringArray(args.related_perturbation_ids),
      missing_evidence: readStringArray(args.missing_evidence),
      confidence: typeof args.confidence === "number" ? args.confidence : null,
      model_invoked: args.model_invoked === true,
      derived_by_deterministic_reducer: args.model_invoked !== true,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `${input.tool_name} recorded ${commentary.commentary_id}.`,
      observation: commentary,
      evidenceRefs: [commentary.commentary_id, ...commentary.evidence_refs],
    });
  }

  if (input.tool_name === "live_env.request_probe") {
    const event = appendInterpretedEvent({
      thread_id: input.thread_id,
      room_id: roomId,
      source_family: "live_environment",
      kind: "tool_trace",
      title: readString(args.title) ?? "Live probe requested",
      summary: readString(args.summary) ?? readString(args.reason) ?? "Live environment evidence item recorded.",
      confidence: typeof args.confidence === "number" ? args.confidence : null,
      evidence_refs: readStringArray(args.evidence_refs),
      related_artifact_ids: readStringArray(args.related_artifact_ids),
      model_invoked: args.model_invoked === true,
      deterministic: args.model_invoked !== true,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `${input.tool_name} recorded ${event.event_id}.`,
      observation: event,
      evidenceRefs: [event.event_id, ...event.evidence_refs],
    });
  }

  if (input.tool_name === "live_env.spawn_field_worker") {
    if (!environment) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: "No live answer environment was found; field worker spawn was not attempted.",
        observation: null,
        evidenceRefs: [],
      });
    }
    const run = ensureLiveSituationRunForEnvironment({
      environment,
      pipelineId: readString(args.pipeline_id),
    });
    const workers = registerFieldWorkersForSituationRun({ run, environment });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Registered ${workers.length} bounded field worker(s) for live environment.`,
      observation: {
        schema: "helix.live_field_worker_spawn_receipt.v1",
        situation_run_id: run.situation_run_id,
        worker_ids: workers.map((worker) => worker.worker_id),
        assistant_answer: false,
        raw_content_included: false,
      },
      evidenceRefs: [run.situation_run_id, ...workers.map((worker) => worker.worker_id)],
    });
  }

  const evidenceRefs = readStringArray(args.evidence_refs);
  const missingEvidence = readStringArray(args.missing_evidence);
  const satisfied = evidenceRefs.length > 0 && missingEvidence.length === 0;
  return makeObservation({
    threadId: input.thread_id,
    environmentId: input.environment_id,
    toolName: input.tool_name,
    ok: true,
    summary: satisfied
      ? "Live environment goal satisfaction has enough compact evidence."
      : "Live environment goal satisfaction needs more evidence.",
    observation: {
      schema: "helix.live_environment_goal_satisfaction.v1",
      status: satisfied ? "satisfied" : "needs_more_evidence",
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence.length > 0 ? missingEvidence : ["No evidence refs were supplied to the live goal check."],
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    },
    evidenceRefs,
  });
}
