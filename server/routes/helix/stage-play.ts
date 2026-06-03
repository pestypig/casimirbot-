import { Router } from "express";
import type { Request, Response } from "express";
import { validateStagePlayBadgeGraphV1 } from "../../../shared/contracts/stage-play-badge-graph.v1";
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
  STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS,
  STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES,
  type StagePlayRawSessionBufferRawKindV1,
  type StagePlayRawSessionBufferRetentionPolicyV1,
} from "../../../shared/stage-play-raw-session-buffer";

const helixStagePlayRouter = Router();
const STAGE_PLAY_ROUTE_MAX_BODY_BYTES = 256 * 1024;

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

const isRawKind = (value: unknown): value is StagePlayRawSessionBufferRawKindV1 =>
  typeof value === "string" && STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS.includes(value as StagePlayRawSessionBufferRawKindV1);

const isRetentionPolicy = (value: unknown): value is StagePlayRawSessionBufferRetentionPolicyV1 =>
  typeof value === "string" && STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES.includes(value as StagePlayRawSessionBufferRetentionPolicyV1);

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];

const readOptionalNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && Number.isFinite(Number(value))
      ? Number(value)
      : null;

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
