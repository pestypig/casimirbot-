import { Router, json, type Request, type Response } from "express";
import {
  authenticateEnvironmentActionConnector,
  isEnvironmentActionBrokerError,
  leasePendingEnvironmentActionControls,
  leasePendingEnvironmentActions,
  recordEnvironmentActionConnectorHeartbeat,
  recordEnvironmentActionConnectorManifest,
  submitEnvironmentActionControlResult,
  submitEnvironmentActionResult,
  submitEnvironmentActionWorkflowEvent,
} from "../services/environment-connectors/actions";
import { recordEnvironmentActionEventBatch } from "../services/environment-connectors/events";

const sendError = (res: Response, error: unknown): void => {
  if (isEnvironmentActionBrokerError(error)) {
    res.status(error.statusCode).json({
      schema: "helix.environment_action.connector_receipt.v1",
      ok: false,
      error: error.code,
      message: error.message,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    return;
  }
  console.warn(
    "[environment-action] connector request failed",
    error instanceof Error ? error.name : "unknown",
  );
  res.status(503).json({
    schema: "helix.environment_action.connector_receipt.v1",
    ok: false,
    error: "action_connector_unavailable",
    message: "The player-action connector lane is temporarily unavailable.",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

const route = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response): void => {
  void handler(req, res).catch((error: unknown) => sendError(res, error));
};

const noStore = (_req: Request, res: Response, next: () => void): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  next();
};

export const environmentActionRouter = Router();

environmentActionRouter.use(
  "/v1/authorities/:authorityId",
  noStore,
  json({ limit: "1mb" }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/manifest",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.manifest.write",
    });
    const recorded = await recordEnvironmentActionConnectorManifest({
      claim,
      manifest: req.body,
    });
    res.json({
      schema: "helix.environment_action.manifest_receipt.v1",
      ok: true,
      error: null,
      message: "Player-action connector manifest admitted.",
      manifest_id: recorded.manifestId,
      catalog_snapshot_id: recorded.catalogSnapshotId,
      manifest_hash: recorded.manifestHash,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/heartbeat",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.heartbeat.write",
    });
    const recorded = await recordEnvironmentActionConnectorHeartbeat({
      claim,
      heartbeat: req.body,
    });
    res.json({
      schema: "helix.environment_action.heartbeat_receipt.v1",
      ok: true,
      error: null,
      message: "Player-action connector heartbeat recorded.",
      heartbeat_id: recorded.heartbeatId,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.get(
  "/v1/authorities/:authorityId/requests/pending",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.poll",
    });
    const requests = await leasePendingEnvironmentActions({
      claim,
      limit: Number(req.query.limit ?? 4),
    });
    res.json({
      schema: "helix.environment_action.pending_requests.v1",
      ok: true,
      error: null,
      action_requests: requests,
      automatic_replay_allowed: false,
      host_access_allowed: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/requests/event",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.event.write",
    });
    const recorded = await submitEnvironmentActionWorkflowEvent({
      claim,
      event: req.body,
    });
    res.json({
      schema: "helix.environment_action.event_receipt.v1",
      ok: true,
      error: null,
      message: "Player workflow event recorded.",
      event_id: recorded.event.event_id,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/events/batch",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "environment.event.write",
    });
    const recorded = await recordEnvironmentActionEventBatch({
      claim,
      batch: req.body,
    });
    res.json({
      schema: "helix.environment_event_batch_receipt.v1",
      ok: true,
      error: null,
      message: "Typed environment events and their compact digest were recorded.",
      batch_id: recorded.batch.batch_id,
      digest_id: recorded.digest.digest_id,
      latest_event_sequence: recorded.digest.latest_event_sequence,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/requests/result",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.result.write",
    });
    const recorded = await submitEnvironmentActionResult({
      claim,
      result: req.body,
    });
    res.json({
      schema: "helix.environment_action.result_receipt.v1",
      ok: true,
      error: null,
      message: "Player-action result recorded for solver evidence re-entry.",
      observation: recorded.observation,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.get(
  "/v1/authorities/:authorityId/controls/pending",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.control.poll",
    });
    const controls = await leasePendingEnvironmentActionControls({
      claim,
      limit: Number(req.query.limit ?? 4),
    });
    res.json({
      schema: "helix.environment_action.pending_controls.v1",
      ok: true,
      error: null,
      control_requests: controls,
      emergency_stop_first: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentActionRouter.post(
  "/v1/authorities/:authorityId/controls/result",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentActionConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "action.control.write",
    });
    const recorded = await submitEnvironmentActionControlResult({
      claim,
      result: req.body,
    });
    res.json({
      schema: "helix.environment_action.control_result_receipt.v1",
      ok: true,
      error: null,
      message: "Player-action control result recorded.",
      controls_released: recorded.controlsReleased,
      observation: recorded.observation,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);
