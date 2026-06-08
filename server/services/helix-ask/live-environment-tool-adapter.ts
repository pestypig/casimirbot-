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
  StagePlayLiveSourceMailInterpretationPayloadV1,
  StagePlayLiveSourceMailItemV1,
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
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
  getStagePlayLiveSourceMailItem,
  listStagePlayLiveSourceMailItems,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceWatchJobPolicies,
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
  recordInterimVoiceCalloutRequest,
} from "./interim-voice-callout-store";
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

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

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

const readOptionalNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

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
    normalized === "voice_callout_watch"
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
      body: `Policy: ${input.policy.interpretationMode ?? "latest_scene_answer"}; ${formatWatchJobOutputPolicy(input.policy.outputPolicy)}`,
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

const clipText = (value: string | null | undefined, limit = 260): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
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
  transcriptRows?: AskTurnTranscriptRowDraftV1[];
}): HelixLiveEnvironmentToolObservation => ({
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
  instruction_authority: "none",
  ask_instruction_authority: "none",
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  assistant_answer: false,
  raw_content_included: false,
  created_at: new Date().toISOString(),
});

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

  if (input.tool_name === "live_env.read_card") {
    const lineKeys = readStringArray(args.line_keys);
    const selectedLines = environment?.lines.filter((line) =>
      lineKeys.length === 0 || lineKeys.includes(line.key)
    ) ?? [];
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
            assistant_answer: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          }
        : null,
      evidenceRefs: selectedLines.flatMap((line) => line.evidence_refs),
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
      batchCap: 12,
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

  if (input.tool_name === "live_env.configure_live_source_watch_job") {
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
    const sourceIds = [
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ].filter((entry): entry is string => Boolean(entry));
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
    const decision = allowedDecisions.has(decisionRaw)
      ? decisionRaw as Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["decision"]
      : "wait_for_next_summary";
    const mailIds = readStringArray(args.mail_ids ?? args.mailIds);
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
      textAnswerDraft: readString(args.text_answer_draft) ?? readString(args.textAnswerDraft),
      textAnswerTerminalEligible: args.text_answer_terminal_eligible === true || args.textAnswerTerminalEligible === true,
      voiceCalloutDraft: readString(args.voice_callout_draft) ?? readString(args.voiceCalloutDraft),
      voiceEnabled: args.voice_enabled === true || args.voiceEnabled === true,
      voiceRequiresConfirmation: args.voice_requires_confirmation === true || args.voiceRequiresConfirmation === true,
      voiceAllowedNow: args.voice_allowed_now === true || args.voiceAllowedNow === true,
      voicePolicyReason: readString(args.voice_policy_reason) ?? readString(args.voicePolicyReason),
      requestedTool: readRequestedTool(args.requested_tool ?? args.requestedTool),
      interpretation: readInterpretationPayload(args.interpretation, args),
      nextLoopState,
      interpreterProfileRef:
        readString(args.interpreter_profile_ref) ??
        readString(args.interpreterProfileRef) ??
        readString(args.profile_id) ??
        readString(args.profileId),
      profileComparisonRefs: readStringArray(args.profile_comparison_refs ?? args.profileComparisonRefs),
      matchedCriteria: readStringArray(args.matched_criteria ?? args.matchedCriteria),
      suppressedCriteria: readStringArray(args.suppressed_criteria ?? args.suppressedCriteria),
      observedFacts: readStringArray(args.observed_facts ?? args.observedFacts),
      inferredMeaning: readStringArray(args.inferred_meaning ?? args.inferredMeaning),
      evidenceRefs: readStringArray(args.evidence_refs ?? args.evidenceRefs),
      modelReviewed: args.model_reviewed !== false && args.modelReviewed !== false,
    });
    const transcriptRows = buildMailLoopTranscriptRows({
      decision: recordedDecision,
    });
    const narrativeState = recordedDecision.narrativeStateRef
      ? getStagePlayLiveSourceNarrativeState(recordedDecision.narrativeStateRef)
      : null;
    const waitDecisionWithoutMail =
      mailIds.length === 0 && recordedDecision.decision === "wait_for_next_summary";
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
        narrativeState,
        narrative_state: narrativeState,
        causalTrace: recordedDecision.causalTrace,
        causal_trace: recordedDecision.causalTrace,
        transcriptRows,
        liveSourceMailOutputIntent: args.live_source_mail_output_intent ?? args.liveSourceMailOutputIntent ?? null,
        live_source_mail_output_intent: args.live_source_mail_output_intent ?? args.liveSourceMailOutputIntent ?? null,
        decisionValidationResult: readString(args.decision_validation_result) ?? readString(args.decisionValidationResult) ?? null,
        decision_validation_result: readString(args.decision_validation_result) ?? readString(args.decisionValidationResult) ?? null,
        readMailItemCount: typeof args.read_mail_item_count === "number" ? args.read_mail_item_count : args.readMailItemCount,
        read_mail_item_count: typeof args.read_mail_item_count === "number" ? args.read_mail_item_count : args.readMailItemCount,
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
    const result = readSituationSourceCapabilities({
      threadId: input.thread_id,
      roomId,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Read ${result.capabilities.length} source capability state(s).`,
      observation: result,
      evidenceRefs: result.capabilities.map((capability) => capability.source_id),
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
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        quality.qualityId,
        ...quality.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
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
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
      },
      evidenceRefs: [
        currentState.currentStateId,
        ...currentState.evidenceRefs,
        mailboxThreadResolution.mailboxThreadId,
      ],
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
