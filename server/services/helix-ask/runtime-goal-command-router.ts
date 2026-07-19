import crypto from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type {
  HelixRuntimeGoalDebugExport,
  HelixRuntimeGoalProgressSummary,
  HelixRuntimeGoalSession,
  HelixRuntimeGoalSourceBinding,
} from "@shared/helix-runtime-goal-session";
import { HELIX_RESEARCH_LIBRARY_DOC_VIEWER_PATH_PREFIX } from "@shared/helix-research-library";
import { selectHelixAgentRuntime } from "./agent-providers/runtime-select";
import {
  helixRuntimeGoalSessionStore,
  type GoalRuntimeSessionResult,
} from "./agent-providers/goal-runtime-session";
import { buildRuntimeGoalDebugSummary } from "./runtime-goal-debug-summary";

type RecordLike = Record<string, unknown>;

export type HelixRuntimeGoalCommandKind = "start" | "wake" | "stop";

export type HelixRuntimeGoalCommandRouteResult = {
  handled: boolean;
  statusCode: number;
  payload: RecordLike;
  transcriptEvents: RecordLike[];
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readQuestion = (body: RecordLike): string =>
  readString(body.raw_user_prompt) ||
  readString(body.prompt) ||
  readString(body.question) ||
  readString(body.transcript);

const readTurnId = (body: RecordLike): string =>
  readString(body.turn_id) || readString(body.turnId) || `ask:${crypto.randomUUID()}`;

const normalizeRuntime = (value: unknown): HelixAgentRuntimeId =>
  readString(value) === "codex" || readString(value) === "future"
    ? (readString(value) as HelixAgentRuntimeId)
    : "helix";

const parseGoalCommand = (question: string): { kind: HelixRuntimeGoalCommandKind; objective: string | null } | null => {
  const trimmed = question.trim();
  if (!/^\/goal(?:\s|$)/i.test(trimmed)) return null;
  const rest = trimmed.replace(/^\/goal/i, "").trim();
  if (!rest) return { kind: "wake", objective: null };
  if (/^(?:wake|resume|continue|manual[-_\s]?wake)\b/i.test(rest)) return { kind: "wake", objective: null };
  if (/^(?:stop|cancel|pause)\b/i.test(rest)) return { kind: "stop", objective: null };
  return { kind: "start", objective: rest };
};

const activeGoalSessions = (): HelixRuntimeGoalSession[] =>
  helixRuntimeGoalSessionStore
    .listGoalRuntimeSessions()
    .filter((session) => !["completed", "cancelled", "failed"].includes(session.status))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

const latestActiveGoalSession = (): HelixRuntimeGoalSession | null =>
  activeGoalSessions()[0] ?? null;

const latestGoalSession = (): HelixRuntimeGoalSession | null =>
  helixRuntimeGoalSessionStore
    .listGoalRuntimeSessions()
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0] ?? null;

const readWorkspaceSnapshot = (body: RecordLike): RecordLike =>
  readRecord(body.workspace_context_snapshot ?? body.workspaceContextSnapshot) ?? {};

const PRIVATE_RESEARCH_RUNTIME_GOAL_SOURCE_UNAVAILABLE_REASON =
  "private_research_runtime_goal_source_not_admitted";

const recordClaimsPrivateResearchDocument = (record: RecordLike | null): boolean => {
  if (!record) return false;
  const documentSourceKind = readString(
    record.document_source_kind ?? record.documentSourceKind,
  ).toLowerCase();
  const privateSource = record.private_source ?? record.privateSource;
  const docPaths = [
    record.doc_path,
    record.docPath,
    record.active_doc_path,
    record.activeDocPath,
    record.doc_context_path,
    record.docContextPath,
  ].map(readString).filter(Boolean);
  const documentRefs = [
    record.document_ref,
    record.documentRef,
    record.active_doc_ref,
    record.activeDocRef,
  ].map(readString).filter(Boolean);
  const sourceIds = [
    record.source_id,
    record.sourceId,
    record.active_doc_source_id,
    record.activeDocSourceId,
  ].map(readString).filter(Boolean);
  return (
    documentSourceKind === "research_library" ||
    privateSource === true ||
    readString(privateSource).toLowerCase() === "true" ||
    docPaths.some((value) => value.startsWith(HELIX_RESEARCH_LIBRARY_DOC_VIEWER_PATH_PREFIX)) ||
    documentRefs.some((value) => value.startsWith("private-research:")) ||
    sourceIds.some((value) => value.startsWith(
      `document_markdown:${HELIX_RESEARCH_LIBRARY_DOC_VIEWER_PATH_PREFIX}`,
    ))
  );
};

const bodyClaimsPrivateResearchVisibleDocument = (
  body: RecordLike,
  snapshot: RecordLike,
  visibleContext: RecordLike | null,
): boolean => {
  if (
    recordClaimsPrivateResearchDocument(body) ||
    recordClaimsPrivateResearchDocument(snapshot) ||
    recordClaimsPrivateResearchDocument(visibleContext)
  ) {
    return true;
  }
  const visibleTargets = [
    ...(Array.isArray(visibleContext?.chunks) ? visibleContext.chunks : []),
    ...(Array.isArray(visibleContext?.ui_text_regions) ? visibleContext.ui_text_regions : []),
    ...(Array.isArray(visibleContext?.uiTextRegions) ? visibleContext.uiTextRegions : []),
    ...(Array.isArray(visibleContext?.panel_text_regions) ? visibleContext.panel_text_regions : []),
    ...(Array.isArray(visibleContext?.panelTextRegions) ? visibleContext.panelTextRegions : []),
    ...(Array.isArray(visibleContext?.visible_ui_text_regions)
      ? visibleContext.visible_ui_text_regions
      : []),
    ...(Array.isArray(visibleContext?.visibleUiTextRegions)
      ? visibleContext.visibleUiTextRegions
      : []),
  ];
  return visibleTargets.some((target) => recordClaimsPrivateResearchDocument(readRecord(target)));
};

const readRuntimeGoalThreadId = (body: RecordLike): string => {
  const routeMetadata = readRecord(body.route_metadata ?? body.routeMetadata);
  const sourceTargetIntent = readRecord(
    routeMetadata?.source_target_intent ?? body.source_target_intent,
  );
  return (
    readString(body.thread_id ?? body.threadId) ||
    readString(routeMetadata?.mailboxThreadId ?? routeMetadata?.mailbox_thread_id) ||
    readString(sourceTargetIntent?.thread_id ?? sourceTargetIntent?.threadId) ||
    "helix-ask:desktop"
  );
};

export const readRuntimeGoalVisibleDocContext = (body: RecordLike): {
  docPath: string | null;
  visibleText: string | null;
  sourceHash: string | null;
  sourceId: string | null;
  sourceFreshnessMs: number | null;
  unavailableReason: string | null;
} => {
  const snapshot = readWorkspaceSnapshot(body);
  const visibleContext = readRecord(
    snapshot.active_doc_visible_translation_context ??
      snapshot.activeDocVisibleTranslationContext,
  );
  if (bodyClaimsPrivateResearchVisibleDocument(body, snapshot, visibleContext)) {
    return {
      docPath: null,
      visibleText: null,
      sourceHash: null,
      sourceId: null,
      sourceFreshnessMs: null,
      unavailableReason: PRIVATE_RESEARCH_RUNTIME_GOAL_SOURCE_UNAVAILABLE_REASON,
    };
  }
  const chunks = Array.isArray(visibleContext?.chunks) ? visibleContext.chunks : [];
  const visibleText = chunks
    .map((chunk) => readString(readRecord(chunk)?.visible_text ?? readRecord(chunk)?.visibleText))
    .filter(Boolean)
    .join("\n\n")
    .trim();
  const docPath =
    readString(visibleContext?.doc_path) ||
    readString(snapshot.active_doc_path) ||
    readString(snapshot.activeDocPath) ||
    readString(snapshot.doc_context_path) ||
    readString(snapshot.docContextPath) ||
    readString(body.doc_path) ||
    readString(body.docPath) ||
    null;
  const freshnessValue =
    body.source_freshness_ms ??
    body.sourceFreshnessMs ??
    snapshot.source_freshness_ms ??
    snapshot.sourceFreshnessMs;
  const sourceFreshnessMs = typeof freshnessValue === "number"
    ? freshnessValue
    : typeof freshnessValue === "string" && freshnessValue.trim()
      ? Number(freshnessValue)
      : null;
  const normalizedFreshness = Number.isFinite(sourceFreshnessMs) ? sourceFreshnessMs : null;
  const unavailableReason =
    docPath || visibleText
      ? null
      : readString(snapshot.doc_context_failure_reason) ||
        readString(snapshot.docContextFailureReason) ||
        "visible_source_unavailable";
  return {
    docPath,
    visibleText: visibleText || null,
    sourceHash: readString(visibleContext?.source_hash) || null,
    sourceId: readString(visibleContext?.source_id) || null,
    sourceFreshnessMs: normalizedFreshness,
    unavailableReason,
  };
};

export const buildRuntimeGoalReadableSurfaceGatewayCall = (body: RecordLike): RecordLike => {
  const visible = readRuntimeGoalVisibleDocContext(body);
  return {
    capability_id: "docs-viewer.read_visible_surface",
    mode: "read",
    arguments: {
      surface: "visible_document_section",
      label: "Current visible document section",
      path: visible.docPath,
      source_doc_path: visible.docPath,
      text: visible.visibleText,
      visible_text: visible.visibleText,
      source_id: visible.sourceId,
      source_hash: visible.sourceHash,
      source_refs: visible.docPath ? [visible.docPath] : [],
      source_target_intent: {
        schema: "helix.runtime_goal.manual_wake_source_target.v1",
        source: "docs_viewer_visible_surface",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
  };
};

const buildGoalStartSourceBinding = (body: RecordLike): HelixRuntimeGoalSourceBinding | null => {
  const visible = readRuntimeGoalVisibleDocContext(body);
  const snapshot = readWorkspaceSnapshot(body);
  const activePanelId =
    readString(snapshot.activePanelId) ||
    readString(snapshot.active_panel_id) ||
    readString(snapshot.activePanel) ||
    null;
  if (!visible.docPath && !visible.sourceId && !activePanelId) return null;
  return {
    schema: "helix.runtime_goal.source_binding.v1",
    source_kind: visible.docPath ? "docs_viewer_visible_surface" : "workstation_panel",
    active_panel_id: activePanelId,
    doc_path: visible.docPath,
    source_id: visible.sourceId,
    source_hash: visible.sourceHash,
    source_freshness_ms: visible.sourceFreshnessMs,
    source_label: visible.docPath || activePanelId || visible.sourceId,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const renderGoalCommandAnswer = (
  command: HelixRuntimeGoalCommandKind,
  result: GoalRuntimeSessionResult,
): string => {
  if (!result.ok) {
    const reason = result.blocked_reason || result.session.status_reason || "goal_command_failed";
    if (reason === "goal_session_not_found") return "No active goal session was found.";
    return `Goal ${command} blocked: ${reason}.`;
  }
  if (command === "start") {
    return [
      "Goal is active.",
      "",
      `Goal: ${result.session.job_brief.user_goal_text || result.session.objective}`,
      `Goal id: ${result.session.goal_id}`,
      `Runtime: ${result.session.runtime_agent_provider}`,
      `Wake behavior: ${result.session.job_brief.expected_wake_behavior}`,
      `Report policy: ${result.session.report_policy}`,
      "Wake sources: manual `/goal wake`, admitted visible-source changes, and configured timer candidates.",
    ].join("\n");
  }
  if (command === "stop") {
    return `Goal stopped: ${result.session.goal_id}.`;
  }
  const progress = result.session.latest_progress_summary;
  if (progress) return renderGoalProgressAnswer(progress);
  const terminalText = readString(result.debug_export.terminal_presentation?.concise_text);
  if (terminalText) {
    return [
      `Goal: ${result.session.job_brief.user_goal_text || result.session.objective}`,
      `Runtime: ${result.session.runtime_agent_provider}`,
      "Observed source: not reported",
      "Evidence used: no governed observation was reported for this wake.",
      "",
      "Current summary:",
      terminalText,
      "",
      "Status: Waiting for the next /goal wake, admitted workstation wake, or configured timer candidate.",
    ].join("\n");
  }
  return `Goal wake completed for ${result.session.goal_id}.`;
};

const renderSourceLabel = (source: HelixRuntimeGoalSourceBinding | null): string =>
  source?.source_label || source?.doc_path || source?.active_panel_id || source?.source_id || "not reported";

const renderEvidenceLine = (progress: HelixRuntimeGoalProgressSummary): string => {
  const requested = progress.evidence_used.requested_tool_or_lane ?? "none";
  const observationCount = progress.evidence_used.observation_refs.length;
  const receiptCount = progress.evidence_used.receipt_refs.length;
  const candidateRef = progress.evidence_used.provider_terminal_candidate_ref;
  return [
    requested,
    `${observationCount} observation${observationCount === 1 ? "" : "s"}`,
    `${receiptCount} receipt${receiptCount === 1 ? "" : "s"}`,
    candidateRef ? `candidate ${candidateRef}` : null,
  ].filter(Boolean).join("; ");
};

const renderGoalProgressAnswer = (progress: HelixRuntimeGoalProgressSummary): string =>
  [
    `Goal: ${progress.job}`,
    `Runtime: ${progress.runtime_agent_provider}`,
    `Observed source: ${renderSourceLabel(progress.observed_source)}`,
    `Evidence used: ${renderEvidenceLine(progress)}`,
    "",
    "Current summary:",
    progress.current_summary || "No current progress summary was reported.",
    "",
    `Status: ${progress.next_wake_behavior}`,
  ].join("\n");

const terminalAuthorityFor = (
  result: GoalRuntimeSessionResult,
  route: "/ask/turn" | "/ask/turn/stream",
): RecordLike => ({
  schema: "helix.turn_terminal_authority.v1",
  thread_id: "helix-runtime-goal",
  turn_id: result.session.latest_turn_id ?? result.session.goal_id,
  route,
  terminal_kind: result.ok ? "answer" : "typed_failure",
  final_answer_source: "runtime_goal_command",
  terminal_artifact_kind: "runtime_goal_command_result",
  terminal_item_id: `${result.session.goal_id}:runtime_goal_command_terminal`,
  authority_origin: "runtime_goal_session_controller",
  server_authoritative: true,
  terminal_eligible: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildHelixRuntimeGoalCommandPayload = (input: {
  command: HelixRuntimeGoalCommandKind;
  question: string;
  turnId: string;
  result: GoalRuntimeSessionResult;
  route: "/ask/turn" | "/ask/turn/stream";
}): RecordLike => {
  const selectedFinalAnswer = renderGoalCommandAnswer(input.command, input.result);
  const debugExport = input.result.debug_export;
  const session = input.result.session;
  const runtimeGoalDebugSummary = buildRuntimeGoalDebugSummary(session, debugExport);
  return {
    ok: input.result.ok,
    schema: "helix.ask.runtime_goal_command_response.v1",
    turn_id: input.turnId,
    answer: selectedFinalAnswer,
    text: selectedFinalAnswer,
    assistant_answer: selectedFinalAnswer,
    selected_final_answer: selectedFinalAnswer,
    response_type: input.result.ok ? "final_answer" : "final_failure",
    final_status: input.result.ok ? "final_answer" : "final_failure",
    final_answer_source: "runtime_goal_command",
    terminal_artifact_kind: "runtime_goal_command_result",
    terminal_answer_authority: terminalAuthorityFor(input.result, input.route),
    terminal_presentation: {
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      concise_text: selectedFinalAnswer,
      terminal_artifact_kind: "runtime_goal_command_result",
      final_answer_source: "runtime_goal_command",
      terminal_authority_ref: `${input.result.session.goal_id}:runtime_goal_command_terminal`,
      selected_observation_refs: input.result.session.latest_observation_refs,
      presentation_policy: "runtime_goal_command_result",
      assistant_answer: selectedFinalAnswer,
      raw_content_included: false,
    },
    runtime_goal_command: {
      schema: "helix.runtime_goal.command_result.v1",
      command: input.command,
      prompt: input.question,
      goal_id: input.result.session.goal_id,
      blocked_reason: input.result.blocked_reason ?? null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    runtime_goal_session: session,
    runtime_goal_job_brief: session.job_brief,
    runtime_goal_wake_plan: session.latest_wake_plan,
    runtime_goal_progress_summary: session.latest_progress_summary,
    runtime_goal_source_binding: session.latest_source_binding,
    runtime_goal_observation_refs: session.latest_observation_refs,
    runtime_goal_terminal_authority_status: session.terminal_authority_status,
    runtime_goal_stage_play_projection: input.result.stage_play_projection,
    runtime_goal_debug_export: debugExport,
    runtime_goal_debug_summary: runtimeGoalDebugSummary,
    debug_export: {
      schema: "helix.ask.debug_export.v1",
      active_turn_id: input.turnId,
      active_prompt: input.question,
      selected_final_answer: selectedFinalAnswer,
      final_answer_source: "runtime_goal_command",
      terminal_artifact_kind: "runtime_goal_command_result",
      terminal_answer_authority: terminalAuthorityFor(input.result, input.route),
      runtime_goal_command: {
        command: input.command,
        goal_id: input.result.session.goal_id,
        blocked_reason: input.result.blocked_reason ?? null,
      },
      runtime_goal_session: session,
      runtime_goal_job_brief: session.job_brief,
      runtime_goal_wake_plan: session.latest_wake_plan,
      runtime_goal_progress_summary: session.latest_progress_summary,
      runtime_goal_source_binding: session.latest_source_binding,
      runtime_goal_observation_refs: session.latest_observation_refs,
      runtime_goal_terminal_authority_status: session.terminal_authority_status,
      runtime_goal_stage_play_projection: input.result.stage_play_projection,
      runtime_goal_debug_export: debugExport,
      runtime_goal_debug_summary: runtimeGoalDebugSummary,
      selected_observation_refs: session.latest_observation_refs,
      selected_receipt_refs: session.latest_receipt_refs,
      codex_no_tool_direct_answer: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    debug: {
      selected_final_answer: selectedFinalAnswer,
      final_answer_source: "runtime_goal_command",
      terminal_artifact_kind: "runtime_goal_command_result",
      runtime_goal_session: session,
      runtime_goal_job_brief: session.job_brief,
      runtime_goal_wake_plan: session.latest_wake_plan,
      runtime_goal_progress_summary: session.latest_progress_summary,
      runtime_goal_source_binding: session.latest_source_binding,
      runtime_goal_observation_refs: session.latest_observation_refs,
      runtime_goal_terminal_authority_status: session.terminal_authority_status,
      runtime_goal_stage_play_projection: input.result.stage_play_projection,
      runtime_goal_debug_export: debugExport,
      runtime_goal_debug_summary: runtimeGoalDebugSummary,
      selected_observation_refs: session.latest_observation_refs,
      selected_receipt_refs: session.latest_receipt_refs,
      codex_no_tool_direct_answer: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    blocked_reason: input.result.blocked_reason ?? null,
    raw_content_included: false,
  };
};

export const buildHelixRuntimeGoalTranscriptEvents = (input: {
  command: HelixRuntimeGoalCommandKind;
  question: string;
  turnId: string;
  payload: RecordLike;
  debugExport: HelixRuntimeGoalDebugExport;
}): RecordLike[] => {
  const latestEvent = input.debugExport.debug_events[input.debugExport.debug_events.length - 1] ?? null;
  return [
    {
      id: `${input.turnId}:runtime-goal-command`,
      turn_id: input.turnId,
      seq: 1,
      at_ms: Date.now(),
      role: "system",
      type: "runtime_goal_command",
      status: "completed",
      step_id: "runtime_goal_command_router",
      lane: "runtime_goal",
      text: `Runtime goal command routed: ${input.command}.`,
      source_event_type: "runtime_goal_command",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    {
      id: `${input.turnId}:runtime-goal-debug`,
      turn_id: input.turnId,
      seq: 2,
      at_ms: Date.now(),
      role: "tool",
      type: latestEvent?.stage ?? "runtime_goal_debug",
      status: latestEvent?.status ?? "completed",
      step_id: "runtime_goal_session_controller",
      lane: "runtime_goal",
      text: `Goal ${input.debugExport.goal_id}: ${latestEvent?.stage ?? "debug_export"}; terminal authority ${input.debugExport.terminal_authority_status}.`,
      source_event_type: "runtime_goal_debug",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    {
      id: `${input.turnId}:runtime-goal-final`,
      turn_id: input.turnId,
      seq: 3,
      at_ms: Date.now(),
      role: "agent",
      type: "terminal_answer",
      status: "completed",
      step_id: "runtime_goal_terminal_authority",
      lane: "terminal_authority",
      text: readString(input.payload.selected_final_answer),
      source_event_type: "terminal_answer",
      assistant_answer: false,
      terminal_eligible: true,
      raw_content_included: false,
    },
  ];
};

const attachTranscriptEventsToPayload = (input: {
  payload: RecordLike;
  transcriptEvents: RecordLike[];
}): RecordLike => {
  const debug = readRecord(input.payload.debug) ?? {};
  const debugExport = readRecord(input.payload.debug_export) ?? {};
  return {
    ...input.payload,
    turn_transcript_events: input.transcriptEvents,
    agent_runtime_transcript_events: input.transcriptEvents,
    runtime_goal_transcript_events: input.transcriptEvents,
    debug: {
      ...debug,
      turn_transcript_events: input.transcriptEvents,
      agent_runtime_transcript_events: input.transcriptEvents,
      runtime_goal_transcript_events: input.transcriptEvents,
    },
    debug_export: {
      ...debugExport,
      turn_transcript_events: input.transcriptEvents,
      agent_runtime_transcript_events: input.transcriptEvents,
      runtime_goal_transcript_events: input.transcriptEvents,
    },
  };
};

export const routeHelixRuntimeGoalCommand = async (input: {
  body: RecordLike;
  headers?: IncomingHttpHeaders;
  route?: "/ask/turn" | "/ask/turn/stream";
}): Promise<HelixRuntimeGoalCommandRouteResult> => {
  const question = readQuestion(input.body);
  const command = parseGoalCommand(question);
  if (!command) {
    return {
      handled: false,
      statusCode: 200,
      payload: {},
      transcriptEvents: [],
    };
  }
  const turnId = readTurnId(input.body);
  const runtimeAgentProvider = normalizeRuntime(
    selectHelixAgentRuntime({
      body: input.body,
      headers: input.headers ?? {},
    }),
  );

  let result: GoalRuntimeSessionResult;
  if (command.kind === "start") {
    result = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: command.objective ?? question,
      runtimeAgentProvider,
      goalId: readString(input.body.goal_id) || readString(input.body.goalId) || null,
      threadId: readRuntimeGoalThreadId(input.body),
      runtimeSessionId:
        readString(input.body.runtime_session_id) ||
        readString(input.body.runtimeSessionId) ||
        readString(input.body.session_id) ||
        readString(input.body.sessionId) ||
        null,
      sourceBinding: buildGoalStartSourceBinding(input.body),
      reportPolicy: "report_only_failure",
    });
  } else {
    const active = latestActiveGoalSession() ?? (command.kind === "wake" ? latestGoalSession() : null);
    if (!active) {
      const providerResult = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
        objective: "No active runtime goal session.",
        runtimeAgentProvider,
        goalId: `goal:missing:${crypto.randomUUID()}`,
        threadId: readRuntimeGoalThreadId(input.body),
        reportPolicy: "report_only_failure",
      });
      result = helixRuntimeGoalSessionStore.blockGoalRuntimeSession({
        goalId: providerResult.session.goal_id,
        reason: "goal_session_not_found",
      });
    } else if (command.kind === "stop") {
      result = helixRuntimeGoalSessionStore.stopGoalRuntimeSession({
        goalId: active.goal_id,
        status: "cancelled",
        reason: "user_cancel",
      });
    } else if (["completed", "cancelled", "failed"].includes(active.status)) {
      result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
        goalId: active.goal_id,
        wakeEventKind: "manual_resume",
        turnId,
        body: input.body,
      });
    } else {
      const visible = readRuntimeGoalVisibleDocContext(input.body);
      if (visible.unavailableReason) {
        result = helixRuntimeGoalSessionStore.blockGoalRuntimeSession({
          goalId: active.goal_id,
          reason: visible.unavailableReason,
        });
      } else {
        result = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
          goalId: active.goal_id,
          wakeEventKind: "manual_resume",
          turnId,
          body: {
            ...input.body,
            question:
              readString(input.body.question) ||
              `Wake goal ${active.goal_id}: summarize new visible document evidence for the objective "${active.objective}".`,
            source_freshness_ms: visible.sourceFreshnessMs,
            workstation_gateway_call: buildRuntimeGoalReadableSurfaceGatewayCall(input.body),
          },
        });
      }
    }
  }

  const payload = buildHelixRuntimeGoalCommandPayload({
    command: command.kind,
    question,
    turnId,
    result,
    route: input.route ?? "/ask/turn",
  });
  const transcriptEvents = buildHelixRuntimeGoalTranscriptEvents({
    command: command.kind,
    question,
    turnId,
    payload,
    debugExport: result.debug_export,
  });
  return {
    handled: true,
    statusCode: result.ok ? 200 : command.kind === "wake" && result.blocked_reason === "goal_session_not_found" ? 404 : 409,
    payload: attachTranscriptEventsToPayload({ payload, transcriptEvents }),
    transcriptEvents,
  };
};
