import { Router } from "express";
import type { Request, Response } from "express";
import { validateStagePlayBadgeGraphV1 } from "../../../shared/contracts/stage-play-badge-graph.v1";
import type {
  StagePlayLiveSourceMailInterpretationPayloadV1,
  StagePlayLiveSourceMailTranscriptEntryV1,
} from "../../../shared/contracts/stage-play-live-source-mail.v1";
import { buildStagePlayGraphFromWorld } from "../../services/stage-play/stage-play-badge-graph-builder";
import {
  buildStagePlayBuilderCatalog,
  buildStagePlaySourceQuery,
  validateStagePlayBuilderDraft,
} from "../../services/stage-play/stage-play-builder-compiler";
import {
  clearStagePlayRawSessionBuffer,
  getStagePlayRawSessionBufferEntry,
  listStagePlayRawSessionBufferEntries,
  recordStagePlayRawSessionBufferEntry,
  stagePlayRawSessionId,
} from "../../services/stage-play/stage-play-raw-session-buffer-store";
import {
  isStagePlaySourceRouteTarget,
  upsertStagePlaySourceRouteOverride,
} from "../../services/situation-room/stage-play-source-window";
import {
  projectStagePlayLiveAnswer,
  type StagePlayProjectLiveAnswerPreferredPreset,
} from "../../services/stage-play/stage-play-live-answer-projector";
import {
  applyStagePlayCheckpointQueueAction,
  getStagePlayCheckpointQueue,
  type StagePlayCheckpointQueueAction,
} from "../../services/stage-play/stage-play-checkpoint-queue";
import {
  configureStagePlayLiveSourceWatchJobPolicy,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceMailItems,
  listStagePlayLiveSourceWatchJobPolicies,
} from "../../services/stage-play/stage-play-live-source-mailbox-store";
import {
  getStagePlayLiveSourceNarrativeState,
  listStagePlayLiveSourceNarrativeStates,
} from "../../services/stage-play/stage-play-live-source-narrative-store";
import {
  listStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeResults,
  reconcileStagePlayMailWakeRequestsWithDecisions,
} from "../../services/stage-play/stage-play-live-source-mail-wake-store";
import { listStagePlayLiveSourceMailTranscriptEntries } from "../../services/stage-play/stage-play-live-source-mail-transcript-store";
import {
  listStagePlayLiveSourceInterpreterProfileComparisons,
  listStagePlayLiveSourceInterpreterProfiles,
} from "../../services/stage-play/stage-play-live-source-interpreter-profile-store";
import {
  listStagePlayMicroReasonerPrompts,
  listStagePlayMicroReasonerRuns,
  listStagePlayProcessedMailPackets,
} from "../../services/stage-play/stage-play-processed-mail-packet-store";
import {
  applyStagePlayVisualObserverProfile,
  ensureDefaultStagePlayVisualObserverProfiles,
  getActiveStagePlayVisualObserverProfileForSource,
  getStagePlayVisualObserverProfile,
  listStagePlayVisualObserverProfiles,
  recordStagePlayVisualObserverProfile,
} from "../../services/stage-play/stage-play-visual-observer-profile-store";
import {
  buildMailLoopTranscriptRows,
  readLiveSourceMailForAsk,
  recordLiveSourceMailDecisionForAsk,
} from "../../services/stage-play/stage-play-visual-summary-mail-ingest";
import { buildStagePlayLiveSourceWatchJobPolicyDefaults } from "../../services/stage-play/stage-play-live-source-watch-policy-defaults";
import {
  rememberStagePlayMailWakeAskBaseUrl,
  queueMailWakeForUnreadItems,
  runNextMailWakeRequest,
} from "../../services/stage-play/stage-play-live-source-mail-wake-runner";
import { resolveStagePlayLiveSourceMailboxThreadId } from "../../services/stage-play/stage-play-live-source-mailbox-thread-resolver";
import { runStagePlayLiveSourceMailWakeAdmissionCycle } from "../../services/stage-play/stage-play-live-source-mail-wake-service";
import {
  STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS,
  STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES,
  type StagePlayRawSessionBufferRawKindV1,
  type StagePlayRawSessionBufferRetentionPolicyV1,
} from "../../../shared/stage-play-raw-session-buffer";

const helixStagePlayRouter = Router();
const STAGE_PLAY_ROUTE_MAX_BODY_BYTES = 256 * 1024;
const DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID = "helix-ask:desktop";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const readHeaderValue = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || null;
};

const requestBaseUrl = (req: Request): string | null => {
  const forwardedProto = readHeaderValue(req.headers["x-forwarded-proto"]);
  const forwardedHost = readHeaderValue(req.headers["x-forwarded-host"]);
  const host = forwardedHost ?? readHeaderValue(req.headers.host);
  if (!host) return null;
  const protocol = forwardedProto ?? req.protocol ?? "http";
  return `${protocol}://${host}`.replace(/\/+$/, "");
};

const rememberStagePlayRequestBaseUrl = (req: Request): string | null => {
  const baseUrl = requestBaseUrl(req);
  rememberStagePlayMailWakeAskBaseUrl(baseUrl);
  return baseUrl;
};

type StagePlayRouteContextRole =
  | "tool_evidence"
  | "ui_request_not_instruction"
  | "audit_buffer_not_graph";

const stagePlayJsonError = (
  res: Response,
  status: number,
  input: {
    error: string;
    message?: string;
    schema?: string;
    contextRole?: StagePlayRouteContextRole;
    terminalEligible?: boolean;
    extra?: Record<string, unknown>;
  },
) => res.status(status).json({
  ok: false,
  ...(input.schema ? { schema: input.schema } : {}),
  error: input.error,
  ...(input.message ? { message: input.message } : {}),
  ...(input.extra ?? {}),
  assistant_answer: false,
  raw_content_included: false,
  context_role: input.contextRole ?? "tool_evidence",
  terminal_eligible: input.terminalEligible ?? false,
});

const stagePlayRouteError = (
  res: Response,
  input: {
    error: string;
    err: unknown;
    schema?: string;
    contextRole?: StagePlayRouteContextRole;
    status?: number;
    terminalEligible?: boolean;
    extra?: Record<string, unknown>;
  },
) => stagePlayJsonError(res, input.status ?? 500, {
  error: input.error,
  message: input.err instanceof Error ? input.err.message : String(input.err),
  schema: input.schema,
  contextRole: input.contextRole,
  terminalEligible: input.terminalEligible,
  extra: input.extra,
});

const estimateStagePlayBodyBytes = (req: Request, body: unknown): number => {
  const header = req.headers["content-length"];
  const contentLength = Array.isArray(header) ? Number(header[0]) : Number(header);
  if (Number.isFinite(contentLength) && contentLength >= 0) return contentLength;
  if (body === undefined || body === null) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const readStagePlayJsonBody = (
  req: Request,
  res: Response,
  contextRole: StagePlayRouteContextRole,
): Record<string, unknown> | null => {
  const rawBody = req.body;
  const sizeBytes = estimateStagePlayBodyBytes(req, rawBody);
  if (sizeBytes > STAGE_PLAY_ROUTE_MAX_BODY_BYTES) {
    stagePlayJsonError(res, 413, {
      error: "stage_play_request_body_too_large",
      message: `Stage Play route body exceeds ${STAGE_PLAY_ROUTE_MAX_BODY_BYTES} bytes.`,
      contextRole,
      extra: {
        limitBytes: STAGE_PLAY_ROUTE_MAX_BODY_BYTES,
        receivedBytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
      },
    });
    return null;
  }
  if (rawBody === undefined || rawBody === null) return {};
  if (typeof rawBody !== "object" || Array.isArray(rawBody)) {
    stagePlayJsonError(res, 400, {
      error: "invalid_stage_play_request_body",
      message: "Stage Play route body must be a JSON object.",
      contextRole,
    });
    return null;
  }
  return rawBody as Record<string, unknown>;
};

const readQueryString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readQueryBoolean = (value: unknown): boolean =>
  value === true ||
  (typeof value === "string" && value.trim().toLowerCase() === "true");

export const resolveStagePlayWakeManualRunForRoute = (
  body: Record<string, unknown>,
  query: Record<string, unknown>,
): boolean =>
  readQueryString(body.trigger) === "manual" ||
  readQueryBoolean(body.manualRun) ||
  readQueryBoolean(body.manual_run) ||
  readQueryString(query.trigger) === "manual" ||
  readQueryBoolean(query.manualRun) ||
  readQueryBoolean(query.manual_run);

helixStagePlayRouter.options("/graph", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/builder", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/draft/validate", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/raw-session-buffer", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/raw-session-buffer/clear", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/raw-session-buffer/:entryId", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/source-route", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/project-live-answer", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/checkpoint-queue", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/checkpoint-queue/action", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-visual-summaries", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/check", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/decision", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/wake", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/wake/run", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/wake/cycle", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/job", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/visual-observer-profile", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/visual-observer-profile/apply", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/visual-observer-profile/test", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

helixStagePlayRouter.options("/live-source-mail/transcript", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

const isRawKind = (value: unknown): value is StagePlayRawSessionBufferRawKindV1 =>
  typeof value === "string" && STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS.includes(value as StagePlayRawSessionBufferRawKindV1);

const isRetentionPolicy = (value: unknown): value is StagePlayRawSessionBufferRetentionPolicyV1 =>
  typeof value === "string" && STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES.includes(value as StagePlayRawSessionBufferRetentionPolicyV1);

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const stagePlayVisualSummaryText = (text: string): string =>
  text.trim().replace(/\s+/g, " ").slice(0, 1200);

const resolveMailboxThreadForRoute = (input: {
  threadId?: string | null;
  mailboxThreadId?: string | null;
  mailIds?: string[];
}) => resolveStagePlayLiveSourceMailboxThreadId({
  askThreadId: input.threadId ?? null,
  requestedThreadId: input.threadId ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID,
  explicitMailboxThreadId: input.mailboxThreadId ?? null,
  mailIds: input.mailIds ?? [],
});

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readRequestedTool = (
  value: unknown,
): Parameters<typeof recordLiveSourceMailDecisionForAsk>[0]["requestedTool"] | null => {
  const record = readRecord(value);
  const toolName = readQueryString(record?.toolName) ?? readQueryString(record?.tool_name);
  if (!record || !toolName) return null;
  return {
    toolName,
    args: readRecord(record.args) ?? {},
  };
};

const readOptionalNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && Number.isFinite(Number(value))
      ? Number(value)
      : null;

const readInterpretationPayload = (
  value: unknown,
  fallbackSource?: Record<string, unknown>,
): StagePlayLiveSourceMailInterpretationPayloadV1 | null => {
  const record = readRecord(value) ?? fallbackSource ?? null;
  if (!record) return null;
  const payload: StagePlayLiveSourceMailInterpretationPayloadV1 = {
    currentSceneSummary:
      readQueryString(record.currentSceneSummary) ??
      readQueryString(record.current_scene_summary) ??
      undefined,
    runningStorySummary:
      readQueryString(record.runningStorySummary) ??
      readQueryString(record.running_story_summary) ??
      undefined,
    setting: readQueryString(record.setting),
    activeWindowOrScene:
      readQueryString(record.activeWindowOrScene) ??
      readQueryString(record.active_window_or_scene),
    entities: readStringArray(record.entities),
    objects: readStringArray(record.objects),
    activities: readStringArray(record.activities),
    userRelevantMeaning:
      readQueryString(record.userRelevantMeaning) ??
      readQueryString(record.user_relevant_meaning) ??
      undefined,
    meaningfulChanges: readStringArray(record.meaningfulChanges ?? record.meaningful_changes),
    uncertainties: readStringArray(record.uncertainties),
    watchNextTargets: readStringArray(record.watchNextTargets ?? record.watch_next_targets),
    watchNextReason:
      readQueryString(record.watchNextReason) ??
      readQueryString(record.watch_next_reason) ??
      undefined,
    predictionText:
      readQueryString(record.predictionText) ??
      readQueryString(record.prediction_text),
    predictionHorizon:
      readQueryString(record.predictionHorizon) ??
      readQueryString(record.prediction_horizon),
    predictionConfidence: readOptionalNumber(record.predictionConfidence ?? record.prediction_confidence),
    validationSignals: readStringArray(record.validationSignals ?? record.validation_signals),
  };
  const hasPayload = Object.values(payload).some((entry) =>
    Array.isArray(entry) ? entry.length > 0 : entry !== undefined && entry !== null && entry !== ""
  );
  return hasPayload ? payload : null;
};

const readOptionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean"
    ? value
    : typeof value === "string" && /^(true|false)$/i.test(value.trim())
      ? value.trim().toLowerCase() === "true"
      : undefined;

const readPreferredPreset = (value: unknown): StagePlayProjectLiveAnswerPreferredPreset | undefined =>
  value === "minecraft_run_monitor" || value === "environment_run_monitor" || value === "custom"
    ? value
    : undefined;

const readCheckpointQueueAction = (value: unknown): StagePlayCheckpointQueueAction | null =>
  value === "run" ||
  value === "complete" ||
  value === "skip" ||
  value === "block" ||
  value === "supersede" ||
  value === "pause_job" ||
  value === "resume_job" ||
  value === "clear_queued" ||
  value === "end_live_job"
    ? value
    : null;

helixStagePlayRouter.get("/graph", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const graph = buildStagePlayGraphFromWorld({
      threadId: readQueryString(req.query.threadId) ?? "stage-play-panel",
      roomId: readQueryString(req.query.roomId),
      environmentId: readQueryString(req.query.environmentId),
      sourceId: readQueryString(req.query.sourceId),
      objective: readQueryString(req.query.objective),
    });
    const issues = validateStagePlayBadgeGraphV1(graph);

    if (issues.length > 0) {
      return res.status(500).json({
        ok: false,
        error: "stage-play-badge-graph-invalid",
        issues,
        assistant_answer: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        terminal_eligible: false,
      });
    }

    return res.json(graph);
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-badge-graph-failed",
      err,
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/raw-session-buffer", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const threadId = readQueryString(req.query.threadId) ?? "helix-ask:desktop";
    const roomId = readQueryString(req.query.roomId);
    const sourceId = readQueryString(req.query.sourceId);
    const sessionId = readQueryString(req.query.sessionId);
    const limit = readOptionalNumber(req.query.limit) ?? 50;
    const entries = listStagePlayRawSessionBufferEntries({
      sessionId,
      threadId,
      roomId: roomId ?? undefined,
      sourceId,
      limit,
    });

    return res.json({
      ok: true,
      schema: "stage_play_raw_session_buffer_list/v1",
      sessionId: stagePlayRawSessionId({ threadId, roomId, sessionId }),
      threadId,
      roomId,
      sourceId,
      entries,
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-raw-session-buffer-list-failed",
      err,
      contextRole: "audit_buffer_not_graph",
    });
  }
});

helixStagePlayRouter.get("/raw-session-buffer/:entryId", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const entry = getStagePlayRawSessionBufferEntry(req.params.entryId);
    if (!entry) {
      return stagePlayJsonError(res, 404, {
        error: "stage_play_raw_session_buffer_entry_not_found",
        contextRole: "audit_buffer_not_graph",
      });
    }
    return res.json({
      ok: true,
      schema: "stage_play_raw_session_buffer_read/v1",
      entry,
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-raw-session-buffer-read-failed",
      err,
      contextRole: "audit_buffer_not_graph",
    });
  }
});

helixStagePlayRouter.post("/raw-session-buffer", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const body = readStagePlayJsonBody(req, res, "audit_buffer_not_graph");
    if (!body) return;
    const threadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? "helix-ask:desktop";
    const rawKind = isRawKind(body.rawKind ?? body.raw_kind) ? (body.rawKind ?? body.raw_kind) as StagePlayRawSessionBufferRawKindV1 : null;
    const rawRef = readQueryString(body.rawRef) ?? readQueryString(body.raw_ref);
    const sourceId = readQueryString(body.sourceId) ?? readQueryString(body.source_id);
    if (!rawKind || !rawRef || !sourceId) {
      return stagePlayJsonError(res, 400, {
        error: "missing_raw_session_buffer_fields",
        message: "rawKind, rawRef, and sourceId are required for Stage Play raw session buffer entries.",
        contextRole: "audit_buffer_not_graph",
      });
    }
    const entry = recordStagePlayRawSessionBufferEntry({
      sessionId: readQueryString(body.sessionId) ?? readQueryString(body.session_id),
      threadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id),
      sourceId,
      modality: readQueryString(body.modality) ?? "text_chat",
      sourceEventId: readQueryString(body.sourceEventId) ?? readQueryString(body.source_event_id),
      fromTs: readQueryString(body.fromTs) ?? readQueryString(body.from_ts),
      toTs: readQueryString(body.toTs) ?? readQueryString(body.to_ts),
      rawKind,
      rawRef,
      rawTextPreview: readQueryString(body.rawTextPreview) ?? readQueryString(body.raw_text_preview),
      retentionPolicy: isRetentionPolicy(body.retentionPolicy ?? body.retention_policy)
        ? (body.retentionPolicy ?? body.retention_policy) as StagePlayRawSessionBufferRetentionPolicyV1
        : "session_ttl",
      ttlMs: readOptionalNumber(body.ttlMs) ?? readOptionalNumber(body.ttl_ms),
      evidenceRefs: readStringArray(body.evidenceRefs ?? body.evidence_refs),
    });
    return res.status(200).json({
      ok: true,
      schema: "stage_play_raw_session_buffer_record/v1",
      entry,
      entryId: entry?.entryId ?? null,
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-raw-session-buffer-record-failed",
      err,
      contextRole: "audit_buffer_not_graph",
    });
  }
});

helixStagePlayRouter.post("/raw-session-buffer/clear", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const body = readStagePlayJsonBody(req, res, "audit_buffer_not_graph");
    if (!body) return;
    const threadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId);
    const roomId = readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId);
    const sessionId = readQueryString(body.sessionId) ?? readQueryString(body.session_id) ?? readQueryString(req.query.sessionId);
    const sourceId = readQueryString(body.sourceId) ?? readQueryString(body.source_id) ?? readQueryString(req.query.sourceId);
    const result = clearStagePlayRawSessionBuffer({ sessionId, threadId, roomId: roomId ?? undefined, sourceId });
    return res.json({
      ok: true,
      schema: "stage_play_raw_session_buffer_clear/v1",
      ...result,
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-raw-session-buffer-clear-failed",
      err,
      contextRole: "audit_buffer_not_graph",
    });
  }
});

helixStagePlayRouter.post("/source-route", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const body = readStagePlayJsonBody(req, res, "ui_request_not_instruction");
    if (!body) return;
    const sourceId = readQueryString(body.sourceId) ?? readQueryString(body.source_id);
    const modality = readQueryString(body.modality);
    const routeTo = body.routeTo ?? body.route_to;
    if (!sourceId || !modality || !isStagePlaySourceRouteTarget(routeTo)) {
      return stagePlayJsonError(res, 400, {
        error: "invalid_stage_play_source_route",
        message: "sourceId, modality, and a valid routeTo are required.",
        contextRole: "ui_request_not_instruction",
      });
    }
    const override = upsertStagePlaySourceRouteOverride({
      threadId: readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId),
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      sourceId,
      modality,
      routeTo,
      selectedForStagePlay: readOptionalBoolean(body.selectedForStagePlay ?? body.selected_for_stage_play),
      evidenceRefs: readStringArray(body.evidenceRefs ?? body.evidence_refs),
    });
    return res.json({
      ok: true,
      schema: "stage_play_source_route_override_response/v1",
      override,
      assistant_answer: false,
      context_role: "ui_request_not_instruction",
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-source-route-failed",
      err,
      contextRole: "ui_request_not_instruction",
    });
  }
});

helixStagePlayRouter.post("/project-live-answer", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const result = projectStagePlayLiveAnswer({
      threadId: readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? undefined,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      sourceId: readQueryString(body.sourceId) ?? readQueryString(body.source_id) ?? readQueryString(req.query.sourceId),
      objective: readQueryString(body.objective) ?? readQueryString(req.query.objective),
      ensureStagePlayLineSchema: readOptionalBoolean(body.ensureStagePlayLineSchema ?? body.ensure_stage_play_line_schema) ?? false,
      createIfMissing: readOptionalBoolean(body.createIfMissing ?? body.create_if_missing) ?? false,
      preferredPreset: readPreferredPreset(body.preferredPreset ?? body.preferred_preset),
    });

    return res.status(result.reason === "graph_invalid" ? 422 : 200).json(result);
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-answer-projection-failed",
      err,
      schema: "stage_play_live_answer_projection_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/checkpoint-queue", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const queue = getStagePlayCheckpointQueue({
      jobId: readQueryString(req.query.jobId) ?? readQueryString(req.query.job_id),
      graphId: readQueryString(req.query.graphId) ?? readQueryString(req.query.graph_id),
      limit: readOptionalNumber(req.query.limit) ?? 10,
    });
    return res.json(queue);
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-checkpoint-queue-list-failed",
      err,
      schema: "stage_play_checkpoint_queue/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/checkpoint-queue/action", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const jobId = readQueryString(body.jobId) ?? readQueryString(body.job_id) ?? readQueryString(req.query.jobId);
    const action = readCheckpointQueueAction(body.action ?? req.query.action);
    if (!jobId || !action) {
      return stagePlayJsonError(res, 400, {
        schema: "stage_play_checkpoint_queue_action_response/v1",
        error: "invalid_stage_play_checkpoint_queue_action",
        message: "jobId and a valid checkpoint queue action are required.",
        contextRole: "tool_evidence",
      });
    }
    const result = applyStagePlayCheckpointQueueAction({
      jobId,
      action,
      checkpointRequestId: readQueryString(body.checkpointRequestId) ?? readQueryString(body.checkpoint_request_id),
    });
    return res.status(result.ok ? 200 : 409).json(result);
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-checkpoint-queue-action-failed",
      err,
      schema: "stage_play_checkpoint_queue_action_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/live-source-mail", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  rememberStagePlayRequestBaseUrl(req);

  try {
    const requestedThreadId = readQueryString(req.query.threadId) ?? readQueryString(req.query.thread_id) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId: readQueryString(req.query.mailboxThreadId) ?? readQueryString(req.query.mailbox_thread_id),
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const roomId = readQueryString(req.query.roomId) ?? readQueryString(req.query.room_id);
    const environmentId = readQueryString(req.query.environmentId) ?? readQueryString(req.query.environment_id);
    const sourceId = readQueryString(req.query.sourceId) ?? readQueryString(req.query.source_id);
    const status = readQueryString(req.query.status) as any;
    const limit = readOptionalNumber(req.query.limit) ?? 50;
    const decisions = listStagePlayMailDecisions({
      threadId,
      roomId,
      environmentId,
      limit: 20,
    });
    reconcileStagePlayMailWakeRequestsWithDecisions({
      threadId,
      roomId,
      environmentId,
      decisions,
    });
    const mailItems = listStagePlayLiveSourceMailItems({
      threadId,
      roomId,
      environmentId,
      sourceId,
      status,
      limit,
    });
    const mailIds = new Set(mailItems.map((item) => item.mailId));
    const processedMailPackets = listStagePlayProcessedMailPackets({
      sourceId,
      limit: 50,
    }).filter((packet) =>
      packet.mailIds.some((mailId) => mailIds.has(mailId))
    );
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId,
      limit: 100,
    }).filter((run) =>
      run.mailIds.some((mailId) => mailIds.has(mailId)) ||
      processedMailPackets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    ensureDefaultStagePlayVisualObserverProfiles();
    const visualObserverProfiles = listStagePlayVisualObserverProfiles({
      sourceId,
      includePresets: true,
      limit: 50,
    });
    const activeVisualObserverProfile = getActiveStagePlayVisualObserverProfileForSource({
      sourceId: sourceId ?? mailItems.find((item) => item.sourceKind === "visual_frame")?.sourceId ?? null,
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_list_response/v1",
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      mailItems,
      jobStates: listStagePlayLiveSourceJobStates({
        threadId,
        roomId,
        environmentId,
        limit: 10,
      }),
      watchJobPolicies: listStagePlayLiveSourceWatchJobPolicies({
        threadId,
        roomId,
        environmentId,
        limit: 10,
      }),
      interpreterProfiles: listStagePlayLiveSourceInterpreterProfiles({
        threadId,
        roomId,
        environmentId,
        includeArchived: true,
        limit: 20,
      }),
      interpreterProfileComparisons: listStagePlayLiveSourceInterpreterProfileComparisons({
        limit: 50,
      }).filter((comparison) =>
        comparison.mailIds.some((mailId) => mailIds.has(mailId))
      ),
      microReasonerPrompts: listStagePlayMicroReasonerPrompts({
        active: true,
        limit: 20,
      }),
      visualObserverProfiles,
      activeVisualObserverProfile,
      microReasonerRuns,
      processedMailPackets,
      decisions,
      narrativeStates: listStagePlayLiveSourceNarrativeStates({
        threadId,
        roomId,
        environmentId,
        limit: 20,
      }),
      wakeRequests: listStagePlayLiveSourceMailWakeRequests({
        threadId,
        roomId,
        environmentId,
        limit: 20,
      }),
      wakeResults: listStagePlayLiveSourceMailWakeResults({
        threadId,
        limit: 20,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-list-failed",
      err,
      schema: "stage_play_live_source_mail_list_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/live-source-visual-summaries", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const requestedThreadId = readQueryString(req.query.threadId) ?? readQueryString(req.query.thread_id) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId: readQueryString(req.query.mailboxThreadId) ?? readQueryString(req.query.mailbox_thread_id),
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const roomId = readQueryString(req.query.roomId) ?? readQueryString(req.query.room_id);
    const environmentId = readQueryString(req.query.environmentId) ?? readQueryString(req.query.environment_id);
    const sourceId = readQueryString(req.query.sourceId) ?? readQueryString(req.query.source_id);
    const status = readQueryString(req.query.status) as any;
    const limit = Math.min(Math.max(readOptionalNumber(req.query.limit) ?? 10, 1), 100);
    const mailItems = listStagePlayLiveSourceMailItems({
      threadId,
      roomId,
      environmentId,
      sourceId,
      status,
      limit,
    });
    const mailIds = new Set(mailItems.map((item) => item.mailId));
    const processedMailPackets = listStagePlayProcessedMailPackets({
      sourceId,
      limit: 100,
    }).filter((packet) =>
      packet.mailIds.some((mailId) => mailIds.has(mailId))
    );
    const processedPacketsByMailId = new Map<string, (typeof processedMailPackets)[number][]>();
    for (const packet of processedMailPackets) {
      for (const mailId of packet.mailIds) {
        const packets = processedPacketsByMailId.get(mailId) ?? [];
        packets.push(packet);
        processedPacketsByMailId.set(mailId, packets);
      }
    }
    const microReasonerRuns = listStagePlayMicroReasonerRuns({
      sourceId,
      limit: 100,
    }).filter((run) =>
      run.mailIds.some((mailId) => mailIds.has(mailId)) ||
      processedMailPackets.some((packet) => packet.microReasonerRunRefs.includes(run.runId))
    );
    const summaries = mailItems.map((item) => {
      const packets = processedPacketsByMailId.get(item.mailId) ?? [];
      const latestPacket = packets.at(-1) ?? null;
      return {
        summaryId: item.mailId,
        mailId: item.mailId,
        threadId: item.threadId,
        roomId: item.roomId ?? null,
        environmentId: item.environmentId ?? null,
        sourceId: item.sourceId,
        sourceKind: item.sourceKind,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        summaryText: stagePlayVisualSummaryText(item.summary.text),
        summaryPreview: stagePlayVisualSummaryText(item.summary.preview),
        confidence: item.summary.confidence ?? null,
        analysisState: item.summary.analysisState,
        priorMailId: item.priorContext.previousMailId ?? null,
        previousSummaryPreview: item.priorContext.previousSummaryPreview ?? null,
        deterministicChangeHint: item.hints.deterministicChangeHint,
        elapsedMsSincePrevious: item.hints.elapsedMsSincePrevious ?? null,
        sourceFreshness: item.hints.sourceFreshness,
        sourceRefs: item.sourceRefs,
        evidenceRefs: item.evidenceRefs,
        processedPacketRefs: packets.map((packet) => packet.packetId),
        processedPacket: latestPacket
          ? {
              packetId: latestPacket.packetId,
              jobId: latestPacket.jobId,
              observedFacts: latestPacket.observedFacts,
              changedFacts: latestPacket.changedFacts,
              inferredFacts: latestPacket.inferredFacts,
              uncertainties: latestPacket.uncertainties,
              salience: latestPacket.salience,
              recommendedNext: latestPacket.recommendedNext,
              watchNext: latestPacket.watchNext,
              predictionValidation: latestPacket.predictionValidation,
              resolutionState: latestPacket.resolutionState,
              evidenceRefs: latestPacket.evidenceRefs,
              createdAt: latestPacket.createdAt,
              assistant_answer: false,
              terminal_eligible: false,
              context_role: "tool_evidence",
            }
          : null,
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
        raw_content_included: false,
      };
    });
    const evidenceRefs = uniqueStrings([
      ...summaries.flatMap((summary) => [
        summary.mailId,
        ...summary.evidenceRefs,
        ...summary.processedPacketRefs,
        ...(summary.processedPacket?.evidenceRefs ?? []),
      ]),
      ...microReasonerRuns.map((run) => run.runId),
    ]);
    return res.json({
      ok: true,
      schema: "stage_play_live_source_visual_summary_feed/v1",
      generatedAt: new Date().toISOString(),
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      threadId,
      roomId,
      environmentId,
      sourceId,
      summaries,
      latestSummary: summaries.at(-1) ?? null,
      processedMailPackets: processedMailPackets.map((packet) => ({
        packetId: packet.packetId,
        jobId: packet.jobId,
        sourceId: packet.sourceId,
        mailIds: packet.mailIds,
        observedFacts: packet.observedFacts,
        changedFacts: packet.changedFacts,
        inferredFacts: packet.inferredFacts,
        uncertainties: packet.uncertainties,
        salience: packet.salience,
        recommendedNext: packet.recommendedNext,
        watchNext: packet.watchNext,
        predictionValidation: packet.predictionValidation,
        resolutionState: packet.resolutionState,
        evidenceRefs: packet.evidenceRefs,
        createdAt: packet.createdAt,
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
      })),
      microReasonerRuns,
      counts: {
        summaryCount: summaries.length,
        unreadCount: summaries.filter((summary) => summary.status === "unread").length,
        processedPacketCount: processedMailPackets.length,
        microReasonerRunCount: microReasonerRuns.length,
      },
      evidenceRefs,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-visual-summary-feed-failed",
      err,
      schema: "stage_play_live_source_visual_summary_feed/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/job", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const threadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? "helix-ask:desktop";
    const objectiveText =
      readQueryString(body.objectiveText) ??
      readQueryString(body.objective_text) ??
      readQueryString(body.objective) ??
      readQueryString(body.userPrompt) ??
      readQueryString(body.user_prompt);
    if (!objectiveText) {
      return stagePlayJsonError(res, 400, {
        schema: "stage_play_live_source_watch_job_policy_response/v1",
        error: "missing_objective_text",
        message: "objectiveText or objective is required.",
        contextRole: "tool_evidence",
      });
    }
    const policyDefaults = buildStagePlayLiveSourceWatchJobPolicyDefaults(objectiveText);
    const configured = configureStagePlayLiveSourceWatchJobPolicy({
      jobId: readQueryString(body.jobId) ?? readQueryString(body.job_id),
      threadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      sourceIds: readStringArray(body.sourceIds ?? body.source_ids),
      objectiveText: policyDefaults.objectiveText,
      decisionPolicyPrompt:
        readQueryString(body.decisionPolicyPrompt) ??
        readQueryString(body.decision_policy_prompt) ??
        policyDefaults.decisionPolicyPrompt,
      interpretationMode:
        readQueryString(body.interpretationMode) ??
        readQueryString(body.interpretation_mode) ??
        policyDefaults.interpretationMode,
      mailProcessingMode:
        readQueryString(body.mailProcessingMode) ??
        readQueryString(body.mail_processing_mode) ??
        policyDefaults.mailProcessingMode,
      outputCadence:
        readQueryString(body.outputCadence) ??
        readQueryString(body.output_cadence) ??
        policyDefaults.outputCadence,
      outputPolicy: {
        allowTextAnswer: readOptionalBoolean(body.allowTextAnswer ?? body.allow_text_answer) ?? policyDefaults.outputPolicy.allowTextAnswer,
        allowVoiceCallout: readOptionalBoolean(body.allowVoiceCallout ?? body.allow_voice_callout) ?? policyDefaults.outputPolicy.allowVoiceCallout,
        voiceRequiresUrgency: readOptionalBoolean(body.voiceRequiresUrgency ?? body.voice_requires_urgency) ?? policyDefaults.outputPolicy.voiceRequiresUrgency,
        confirmationRequired: readOptionalBoolean(body.confirmationRequired ?? body.confirmation_required) ?? policyDefaults.outputPolicy.confirmationRequired,
      },
      importanceCriteria: readStringArray(body.importanceCriteria ?? body.importance_criteria).length > 0
        ? readStringArray(body.importanceCriteria ?? body.importance_criteria)
        : policyDefaults.importanceCriteria,
      suppressCriteria: readStringArray(body.suppressCriteria ?? body.suppress_criteria).length > 0
        ? readStringArray(body.suppressCriteria ?? body.suppress_criteria)
        : policyDefaults.suppressCriteria,
      evidenceRefs: readStringArray(body.evidenceRefs ?? body.evidence_refs),
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_watch_job_policy_response/v1",
      policy: configured.policy,
      jobState: configured.jobState,
      watchJobPolicyRef: configured.policy.policyId,
      watch_job_policy_ref: configured.policy.policyId,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-watch-job-policy-failed",
      err,
      schema: "stage_play_live_source_watch_job_policy_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/visual-observer-profile", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    ensureDefaultStagePlayVisualObserverProfiles();
    const sourceId = readQueryString(req.query.sourceId) ?? readQueryString(req.query.source_id);
    const domain = readQueryString(req.query.domain);
    const profiles = listStagePlayVisualObserverProfiles({
      sourceId,
      domain,
      status: readQueryString(req.query.status),
      includePresets: req.query.includePresets !== "false",
      limit: 100,
    });
    const activeProfile = getActiveStagePlayVisualObserverProfileForSource({ sourceId, domain });
    return res.json({
      ok: true,
      schema: "stage_play_visual_observer_profile_list_response/v1",
      profiles,
      activeProfile,
      active_profile: activeProfile,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-visual-observer-profile-list-failed",
      err,
      schema: "stage_play_visual_observer_profile_list_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/visual-observer-profile", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const prompt = readQueryString(body.prompt);
    if (!prompt) {
      return stagePlayJsonError(res, 400, {
        schema: "stage_play_visual_observer_profile_config_result/v1",
        error: "missing_prompt",
        message: "prompt is required.",
        contextRole: "tool_evidence",
      });
    }
    const profile = recordStagePlayVisualObserverProfile({
      title: readQueryString(body.title),
      domain: readQueryString(body.domain),
      sourceIds: readStringArray(body.sourceIds ?? body.source_ids),
      prompt,
      outputMode: readQueryString(body.outputMode) ?? readQueryString(body.output_mode),
      cadenceHintMs: typeof body.cadenceHintMs === "number"
        ? body.cadenceHintMs
        : typeof body.cadence_hint_ms === "number"
          ? body.cadence_hint_ms
          : null,
      linkedInterpreterProfileId: readQueryString(body.linkedInterpreterProfileId) ?? readQueryString(body.linked_interpreter_profile_id),
      linkedWatchJobPolicyId: readQueryString(body.linkedWatchJobPolicyId) ?? readQueryString(body.linked_watch_job_policy_id),
    });
    return res.json({
      ok: true,
      schema: "stage_play_visual_observer_profile_config_result/v1",
      profile,
      profileCount: listStagePlayVisualObserverProfiles({ includePresets: true, limit: 250 }).length,
      activeForSourceIds: profile.sourceIds,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-visual-observer-profile-create-failed",
      err,
      schema: "stage_play_visual_observer_profile_config_result/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/visual-observer-profile/apply", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const profileId = readQueryString(body.profileId) ?? readQueryString(body.profile_id);
    const sourceIds = readStringArray(body.sourceIds ?? body.source_ids);
    if (!profileId || sourceIds.length === 0) {
      return stagePlayJsonError(res, 400, {
        schema: "stage_play_visual_observer_profile_apply_response/v1",
        error: "missing_profile_or_source",
        message: "profileId/profile_id and at least one source id are required.",
        contextRole: "tool_evidence",
      });
    }
    const profile = applyStagePlayVisualObserverProfile({ profileId, sourceIds });
    if (!profile) {
      return stagePlayJsonError(res, 404, {
        schema: "stage_play_visual_observer_profile_apply_response/v1",
        error: "visual_observer_profile_not_found",
        message: `Visual observer profile was not found: ${profileId}`,
        contextRole: "tool_evidence",
      });
    }
    return res.json({
      ok: true,
      schema: "stage_play_visual_observer_profile_apply_response/v1",
      profile,
      sourceIds,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-visual-observer-profile-apply-failed",
      err,
      schema: "stage_play_visual_observer_profile_apply_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/visual-observer-profile/test", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const profileId = readQueryString(body.profileId) ?? readQueryString(body.profile_id);
    const profile = profileId ? getStagePlayVisualObserverProfile(profileId) : null;
    if (!profile) {
      return stagePlayJsonError(res, 404, {
        schema: "stage_play_visual_observer_profile_test_result/v1",
        error: "visual_observer_profile_not_found",
        message: "profileId/profile_id is required for visual observer profile tests.",
        contextRole: "tool_evidence",
      });
    }
    const profileSummary = readQueryString(body.summary) ?? readQueryString(body.profileSummary) ?? "";
    const start = profileSummary.indexOf("{");
    const end = profileSummary.lastIndexOf("}");
    let parsedProfileOutput: Record<string, unknown> | null = null;
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(profileSummary.slice(start, end + 1));
        parsedProfileOutput = parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed as Record<string, unknown>
          : null;
      } catch {
        parsedProfileOutput = null;
      }
    }
    return res.json({
      ok: true,
      schema: "stage_play_visual_observer_profile_test_result/v1",
      profile,
      sourceId: readQueryString(body.sourceId) ?? readQueryString(body.source_id),
      genericSummary: readQueryString(body.genericSummary) ?? readQueryString(body.generic_summary),
      profileSummary: profileSummary || null,
      parsedProfileOutput,
      parseOk: Boolean(parsedProfileOutput),
      enqueuedAsMail: false,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-visual-observer-profile-test-failed",
      err,
      schema: "stage_play_visual_observer_profile_test_result/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/live-source-mail/transcript", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const requestedThreadId = readQueryString(req.query.threadId) ?? readQueryString(req.query.thread_id) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId: readQueryString(req.query.mailboxThreadId) ?? readQueryString(req.query.mailbox_thread_id),
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const roomId = readQueryString(req.query.roomId) ?? readQueryString(req.query.room_id);
    const environmentId = readQueryString(req.query.environmentId) ?? readQueryString(req.query.environment_id);
    const wakeRequestId = readQueryString(req.query.wakeRequestId) ?? readQueryString(req.query.wake_request_id);
    const askTurnId = readQueryString(req.query.askTurnId) ?? readQueryString(req.query.ask_turn_id);
    const limit = readOptionalNumber(req.query.limit) ?? 80;
    const entries: StagePlayLiveSourceMailTranscriptEntryV1[] = listStagePlayLiveSourceMailTranscriptEntries({
      threadId,
      roomId,
      environmentId,
      wakeRequestId,
      askTurnId,
      limit,
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_transcript_response/v1",
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      threadId,
      roomId,
      environmentId,
      entries,
      transcriptRows: entries.map((entry: StagePlayLiveSourceMailTranscriptEntryV1) => entry.row),
      transcriptEntryIds: entries.map((entry: StagePlayLiveSourceMailTranscriptEntryV1) => entry.entryId),
      evidenceRefs: uniqueStrings(entries.flatMap((entry: StagePlayLiveSourceMailTranscriptEntryV1) => [
        entry.entryId,
        ...entry.evidenceRefs,
      ])),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-transcript-list-failed",
      err,
      schema: "stage_play_live_source_mail_transcript_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/wake", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const requestedThreadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId:
        readQueryString(body.mailboxThreadId) ??
        readQueryString(body.mailbox_thread_id) ??
        readQueryString(req.query.mailboxThreadId) ??
        readQueryString(req.query.mailbox_thread_id),
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const wakeRequest = queueMailWakeForUnreadItems({
      threadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      sourceId: readQueryString(body.sourceId) ?? readQueryString(body.source_id) ?? readQueryString(req.query.sourceId),
      limit: readOptionalNumber(body.limit) ?? readOptionalNumber(req.query.limit) ?? 3,
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_wake_queue_response/v1",
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      wakeRequest,
      queued: Boolean(wakeRequest),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-wake-queue-failed",
      err,
      schema: "stage_play_live_source_mail_wake_queue_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/wake/run", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const routeBaseUrl = rememberStagePlayRequestBaseUrl(req);

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const result = await runNextMailWakeRequest({
      threadId: resolveMailboxThreadForRoute({
        threadId: readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID,
        mailboxThreadId:
          readQueryString(body.mailboxThreadId) ??
          readQueryString(body.mailbox_thread_id) ??
          readQueryString(req.query.mailboxThreadId) ??
          readQueryString(req.query.mailbox_thread_id),
      }).mailboxThreadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      jobId: readQueryString(body.jobId) ?? readQueryString(body.job_id) ?? readQueryString(req.query.jobId),
      baseUrl: readQueryString(body.baseUrl) ?? readQueryString(body.base_url) ?? routeBaseUrl ?? undefined,
      manualRun: true,
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_wake_run_response/v1",
      result,
      ran: Boolean(result),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-wake-run-failed",
      err,
      schema: "stage_play_live_source_mail_wake_run_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/wake/cycle", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const routeBaseUrl = rememberStagePlayRequestBaseUrl(req);

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const cycle = await runStagePlayLiveSourceMailWakeAdmissionCycle({
      threadId: resolveMailboxThreadForRoute({
        threadId: readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID,
        mailboxThreadId:
          readQueryString(body.mailboxThreadId) ??
          readQueryString(body.mailbox_thread_id) ??
          readQueryString(req.query.mailboxThreadId) ??
          readQueryString(req.query.mailbox_thread_id),
      }).mailboxThreadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      jobId: readQueryString(body.jobId) ?? readQueryString(body.job_id) ?? readQueryString(req.query.jobId),
      baseUrl: readQueryString(body.baseUrl) ?? readQueryString(body.base_url) ?? routeBaseUrl ?? undefined,
      manualRun: resolveStagePlayWakeManualRunForRoute(body, req.query as Record<string, unknown>),
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_wake_cycle_response/v1",
      cycle,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-wake-cycle-failed",
      err,
      schema: "stage_play_live_source_mail_wake_cycle_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/check", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const requestedThreadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId:
        readQueryString(body.mailboxThreadId) ??
        readQueryString(body.mailbox_thread_id) ??
        readQueryString(req.query.mailboxThreadId) ??
        readQueryString(req.query.mailbox_thread_id),
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const readResult = readLiveSourceMailForAsk({
      threadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      sourceId: readQueryString(body.sourceId) ?? readQueryString(body.source_id) ?? readQueryString(req.query.sourceId),
      sourceKind: readQueryString(body.sourceKind) ?? readQueryString(body.source_kind) ?? readQueryString(req.query.sourceKind) ?? readQueryString(req.query.source_kind),
      limit: readOptionalNumber(body.limit) ?? readOptionalNumber(req.query.limit) ?? 3,
      includeRead: readOptionalBoolean(body.includeRead ?? body.include_read) ?? false,
      voicePolicy: {
        voiceEnabled: readOptionalBoolean(body.voiceEnabled ?? body.voice_enabled) ?? false,
        requiresConfirmation: readOptionalBoolean(body.voiceRequiresConfirmation ?? body.voice_requires_confirmation) ?? false,
        allowedNow: readOptionalBoolean(body.voiceAllowedNow ?? body.voice_allowed_now) ?? false,
        reason: readQueryString(body.voicePolicyReason) ?? readQueryString(body.voice_policy_reason),
      },
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_check_response/v1",
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      readResult,
      transcriptRows: buildMailLoopTranscriptRows({
        mailItems: readResult.items,
        readResult,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-check-failed",
      err,
      schema: "stage_play_live_source_mail_check_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/live-source-mail/decision", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "tool_evidence");
    if (!body) return;
    const requestedThreadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? readQueryString(req.query.threadId) ?? DEFAULT_STAGE_PLAY_MAILBOX_THREAD_ID;
    const mailIds = readStringArray(body.mailIds ?? body.mail_ids);
    const mailboxThreadResolution = resolveMailboxThreadForRoute({
      threadId: requestedThreadId,
      mailboxThreadId:
        readQueryString(body.mailboxThreadId) ??
        readQueryString(body.mailbox_thread_id) ??
        readQueryString(req.query.mailboxThreadId) ??
        readQueryString(req.query.mailbox_thread_id),
      mailIds,
    });
    const threadId = mailboxThreadResolution.mailboxThreadId;
    const decisionValue = readQueryString(body.decision) ?? "wait_for_next_summary";
    const decision = (
      [
        "wait_for_next_summary",
        "record_interpretation",
        "draft_text_answer",
        "request_voice_callout",
        "request_more_evidence",
        "request_stage_play_checkpoint",
        "fail_closed",
      ] as const
    ).includes(decisionValue as any)
      ? decisionValue as any
      : "wait_for_next_summary";
    const decisionReceipt = recordLiveSourceMailDecisionForAsk({
      threadId,
      roomId: readQueryString(body.roomId) ?? readQueryString(body.room_id) ?? readQueryString(req.query.roomId),
      environmentId: readQueryString(body.environmentId) ?? readQueryString(body.environment_id) ?? readQueryString(req.query.environmentId),
      mailIds,
      decision,
      rationalePreview:
        readQueryString(body.rationalePreview) ??
        readQueryString(body.rationale_preview) ??
        readQueryString(body.reason) ??
        `Recorded ${decision}.`,
      textAnswerDraft: readQueryString(body.textAnswerDraft) ?? readQueryString(body.text_answer_draft),
      textAnswerTerminalEligible: readOptionalBoolean(body.textAnswerTerminalEligible ?? body.text_answer_terminal_eligible) ?? false,
      voiceCalloutDraft: readQueryString(body.voiceCalloutDraft) ?? readQueryString(body.voice_callout_draft),
      voiceEnabled: readOptionalBoolean(body.voiceEnabled ?? body.voice_enabled) ?? false,
      voiceRequiresConfirmation: readOptionalBoolean(body.voiceRequiresConfirmation ?? body.voice_requires_confirmation) ?? false,
      voiceAllowedNow: readOptionalBoolean(body.voiceAllowedNow ?? body.voice_allowed_now) ?? false,
      voicePolicyReason: readQueryString(body.voicePolicyReason) ?? readQueryString(body.voice_policy_reason),
      requestedTool: readRequestedTool(body.requestedTool ?? body.requested_tool),
      interpretation: readInterpretationPayload(body.interpretation, body),
      nextLoopState: (readQueryString(body.nextLoopState) ?? readQueryString(body.next_loop_state)) as any,
      evidenceRefs: readStringArray(body.evidenceRefs ?? body.evidence_refs),
    });
    return res.json({
      ok: true,
      schema: "stage_play_live_source_mail_decision_response/v1",
      requestedThreadId,
      mailboxThreadId: threadId,
      mailboxThreadResolution,
      decision: decisionReceipt,
      narrativeState: decisionReceipt.narrativeStateRef
        ? getStagePlayLiveSourceNarrativeState(decisionReceipt.narrativeStateRef)
        : null,
      transcriptRows: buildMailLoopTranscriptRows({
        decision: decisionReceipt,
      }),
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-live-source-mail-decision-failed",
      err,
      schema: "stage_play_live_source_mail_decision_response/v1",
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.get("/builder", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const threadId = readQueryString(req.query.threadId) ?? "stage-play-panel";
    const environmentId = readQueryString(req.query.environmentId);
    const sourceId = readQueryString(req.query.sourceId);
    const catalog = buildStagePlayBuilderCatalog({ threadId, environmentId, sourceId });
    const sourceQuery = buildStagePlaySourceQuery({ threadId, environmentId, sourceId });

    return res.json({
      artifactId: "stage_play_builder_context",
      schemaVersion: "stage_play_builder_context/v1",
      generatedAt: new Date().toISOString(),
      catalog,
      sourceQuery,
      authority: catalog.authority,
    });
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-builder-context-failed",
      err,
      contextRole: "tool_evidence",
    });
  }
});

helixStagePlayRouter.post("/draft/validate", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = readStagePlayJsonBody(req, res, "ui_request_not_instruction");
    if (!body) return;
    const threadId = readQueryString(body.threadId) ?? readQueryString(req.query.threadId) ?? "stage-play-panel";
    const environmentId = readQueryString(body.environmentId) ?? readQueryString(req.query.environmentId);
    const sourceId = readQueryString(body.sourceId) ?? readQueryString(req.query.sourceId);
    const validation = validateStagePlayBuilderDraft({
      threadId,
      environmentId,
      sourceId,
      draft: body.draft ?? body,
    });

    return res.status(validation.ok ? 200 : 422).json(validation);
  } catch (err) {
    return stagePlayRouteError(res, {
      error: "stage-play-draft-validation-failed",
      err,
      contextRole: "ui_request_not_instruction",
    });
  }
});

export { helixStagePlayRouter };
