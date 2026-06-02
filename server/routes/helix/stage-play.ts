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
  STAGE_PLAY_RAW_SESSION_BUFFER_RAW_KINDS,
  STAGE_PLAY_RAW_SESSION_BUFFER_RETENTION_POLICIES,
  type StagePlayRawSessionBufferRawKindV1,
  type StagePlayRawSessionBufferRetentionPolicyV1,
} from "../../../shared/stage-play-raw-session-buffer";

const helixStagePlayRouter = Router();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
        error: "stage-play-badge-graph-invalid",
        issues,
      });
    }

    return res.json(graph);
  } catch (err) {
    return res.status(500).json({
      error: "stage-play-badge-graph-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

helixStagePlayRouter.get("/raw-session-buffer", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
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
});

helixStagePlayRouter.get("/raw-session-buffer/:entryId", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const entry = getStagePlayRawSessionBufferEntry(req.params.entryId);
  if (!entry) {
    return res.status(404).json({
      ok: false,
      error: "stage_play_raw_session_buffer_entry_not_found",
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
    });
  }
  return res.json({
    ok: true,
    schema: "stage_play_raw_session_buffer_read/v1",
    entry,
    assistant_answer: false,
    context_role: "audit_buffer_not_graph",
  });
});

helixStagePlayRouter.post("/raw-session-buffer", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const threadId = readQueryString(body.threadId) ?? readQueryString(body.thread_id) ?? "helix-ask:desktop";
  const rawKind = isRawKind(body.rawKind ?? body.raw_kind) ? (body.rawKind ?? body.raw_kind) as StagePlayRawSessionBufferRawKindV1 : null;
  const rawRef = readQueryString(body.rawRef) ?? readQueryString(body.raw_ref);
  const sourceId = readQueryString(body.sourceId) ?? readQueryString(body.source_id);
  if (!rawKind || !rawRef || !sourceId) {
    return res.status(400).json({
      ok: false,
      error: "missing_raw_session_buffer_fields",
      assistant_answer: false,
      context_role: "audit_buffer_not_graph",
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
});

helixStagePlayRouter.post("/raw-session-buffer/clear", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
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
    return res.status(500).json({
      error: "stage-play-builder-context-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

helixStagePlayRouter.post("/draft/validate", (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  try {
    const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
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
    return res.status(500).json({
      error: "stage-play-draft-validation-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export { helixStagePlayRouter };
