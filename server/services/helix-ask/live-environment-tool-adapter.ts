import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  type HelixLiveEnvironmentToolName,
  type HelixLiveEnvironmentToolObservation,
} from "@shared/helix-live-agent-step";
import type { HelixInterpretedEventKind } from "@shared/helix-interpreted-event-log";
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
  buildStagePlayOutputLaneProjectionV1,
  reduceLiveAnswerEnvironmentFromStagePlayGraph,
} from "../stage-play/stage-play-output-lane-reducer";
import { ensureStagePlayLiveAnswerEnvironment } from "../stage-play/stage-play-live-answer-projector";
import {
  buildStagePlayBuilderCatalog,
  buildStagePlaySourceQuery,
  sourceIdsFromStagePlayDraft,
  validateStagePlayBuilderDraft,
} from "../stage-play/stage-play-builder-compiler";
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

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry))))
    : [];

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const evidenceRefsFrom = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return readStringArray(record.evidence_refs);
};

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
    if (hasSourceEvidence && (!draftValidation || draftValidation.ok)) {
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
    const liveAnswerLineReduction = environment && hasSourceEvidence && (!draftValidation || draftValidation.ok)
      ? reduceLiveAnswerEnvironmentFromStagePlayGraph({
          environment,
          graph,
          now: generatedAt,
        })
      : null;
    const projectedOutputLaneProjection = liveAnswerLineReduction?.projection ?? outputLaneProjection;
    const projectedLineKeys = liveAnswerLineReduction?.delta.changed_line_keys ?? [];
    const environmentLineKeys = new Set(environment?.lines.map((line) => line.key) ?? []);
    const skippedLineKeys = projectedOutputLaneProjection.lanes
      .filter((lane) => lane.lineUpdateAllowed && lane.lineKey !== "recommendation")
      .map((lane) => lane.lineKey)
      .filter((lineKey) => !environmentLineKeys.has(lineKey));
    const liveAnswerProjectionReason = liveAnswerLineReduction
      ? skippedLineKeys.length > 0
        ? "projected_with_skipped_lines"
        : "projected"
      : draftValidation && !draftValidation.ok
        ? "draft_validation_failed"
        : !environment
          ? "no_live_answer_environment"
          : environment.status !== "active"
            ? "environment_not_active"
            : !hasSourceEvidence
              ? "no_source_evidence"
            : skippedLineKeys.length > 0
              ? "line_schema_mismatch"
              : "no_line_changes";
    const observationPayload = {
      schema: "stage_play_reflection_result/v1",
      graph,
      outputLaneProjection: projectedOutputLaneProjection,
      liveAnswerProjection: {
        attempted: Boolean(environment),
        projected: Boolean(liveAnswerLineReduction),
        deltaId: liveAnswerLineReduction?.delta.delta_id ?? null,
        environmentId: liveAnswerLineReduction?.environment.environment_id ?? environment?.environment_id ?? null,
        changedLineKeys: projectedLineKeys,
        skippedLineKeys,
        reason: liveAnswerProjectionReason,
        environmentEnsure,
      },
      draftValidation,
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
      ok: draftValidation ? draftValidation.ok : true,
      summary: liveAnswerLineReduction
        ? `Built Stage Play graph and projected ${projectedLineKeys.length} Live Answer line(s).`
        : `Built Stage Play graph but did not project Live Answer lines: ${liveAnswerProjectionReason}.`,
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
