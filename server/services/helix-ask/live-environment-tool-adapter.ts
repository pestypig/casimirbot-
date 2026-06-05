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
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_CONFIG_RESULT_SCHEMA,
} from "@shared/contracts/stage-play-live-source-mail.v1";
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
  listStagePlayLiveSourceWatchJobPolicies,
} from "../stage-play/stage-play-live-source-mailbox-store";
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

const readBooleanArg = (record: Record<string, unknown>, snakeKey: string, camelKey: string): boolean | null => {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === "boolean" ? value : null;
};

const readWatchJobOutputPolicy = (
  args: Record<string, unknown>,
  objectiveText: string,
): Partial<StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"]> => {
  const nested = readRecord(args.output_policy ?? args.outputPolicy) ?? {};
  const allowVoiceFromObjective = /\b(?:announce|voice|headphones|callout|tell me aloud)\b/i.test(objectiveText);
  const allowVoiceCallout =
    readBooleanArg(nested, "allow_voice_callout", "allowVoiceCallout") ??
    readBooleanArg(args, "allow_voice_callout", "allowVoiceCallout") ??
    allowVoiceFromObjective;
  return {
    allowTextAnswer:
      readBooleanArg(nested, "allow_text_answer", "allowTextAnswer") ??
      readBooleanArg(args, "allow_text_answer", "allowTextAnswer") ??
      true,
    allowVoiceCallout,
    voiceRequiresUrgency:
      readBooleanArg(nested, "voice_requires_urgency", "voiceRequiresUrgency") ??
      readBooleanArg(args, "voice_requires_urgency", "voiceRequiresUrgency") ??
      allowVoiceCallout,
    confirmationRequired:
      readBooleanArg(nested, "confirmation_required", "confirmationRequired") ??
      readBooleanArg(args, "confirmation_required", "confirmationRequired") ??
      false,
  };
};

const buildWatchJobConfiguredTranscriptRows = (input: {
  policy: StagePlayLiveSourceWatchJobPolicyV1;
  createdAt?: string;
}): AskTurnTranscriptRowDraftV1[] => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return [
    {
      rowId: `ask_turn_watch_job_configured:${hashShort(input.policy.policyId)}`,
      rowKind: "loop_state",
      title: "Watch job configured",
      body: `Armed watch policy: ${input.policy.objectiveText}`,
      source: {
        toolName: "live_env.configure_live_source_watch_job",
        artifactId: input.policy.policyId,
        artifactKind: input.policy.artifactId,
      },
      evidenceRefs: input.policy.evidenceRefs,
      authority: "tool_evidence",
      assistantAnswer: false,
      terminalEligible: false,
      createdAt,
    },
  ];
};

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

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
      limit: readNumber(args.limit, 3),
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
        ? `Read ${readResult.items.length} unread live-source mail item(s); decision required.`
        : "No unread live-source updates yet; loop is armed for the next source update.",
      observation: {
        ...readResult,
        askThreadId: input.thread_id,
        ask_thread_id: input.thread_id,
        mailboxThreadId: mailboxThreadResolution.mailboxThreadId,
        mailbox_thread_id: mailboxThreadResolution.mailboxThreadId,
        mailboxThreadResolution,
        mailbox_thread_resolution: mailboxThreadResolution,
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
    const sourceIds = [
      ...readStringArray(args.source_ids ?? args.sourceIds),
      readString(args.source_id) ?? readString(args.sourceId) ?? explicitSourceId,
    ].filter((entry): entry is string => Boolean(entry));
    const configured = configureStagePlayLiveSourceWatchJobPolicy({
      threadId: mailboxThreadResolution.mailboxThreadId,
      roomId,
      environmentId: environment?.environment_id ?? input.environment_id ?? null,
      sourceIds,
      objectiveText,
      decisionPolicyPrompt:
        readString(args.decision_policy_prompt) ??
        readString(args.decisionPolicyPrompt) ??
        objectiveText,
      outputPolicy: readWatchJobOutputPolicy(args, objectiveText),
      importanceCriteria: readStringArray(args.importance_criteria ?? args.importanceCriteria),
      suppressCriteria: readStringArray(args.suppress_criteria ?? args.suppressCriteria),
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
      nextLoopState,
      evidenceRefs: readStringArray(args.evidence_refs ?? args.evidenceRefs),
      modelReviewed: args.model_reviewed !== false && args.modelReviewed !== false,
    });
    const transcriptRows = buildMailLoopTranscriptRows({
      decision: recordedDecision,
    });
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
        transcriptRows,
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
