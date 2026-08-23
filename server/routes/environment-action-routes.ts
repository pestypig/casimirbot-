import { Router, json, type Request, type Response } from "express";
import {
  authenticateEnvironmentActionConnector,
  EnvironmentActionBrokerError,
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
import { environmentDurableGoalStore } from "../services/environment-connectors/goals";
import {
  bridgeMinecraftPlayerSituationDigestToLiveMail,
} from "../services/environment-connectors/live-mail/minecraft-situation-digest-mail-bridge";
import { readEnvironmentAdapterProfileById } from "../services/situation-room/environment-adapter-registry";

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
  const diagnostic = error instanceof Error
    ? `${error.name}: ${error.message}`
      .replace(/helix_[A-Za-z0-9_-]+/g, "[redacted]")
      .slice(0, 1_000)
    : "unknown";
  console.warn(
    "[environment-action] connector request failed",
    diagnostic,
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
    const sourceAdapter = readEnvironmentAdapterProfileById(
      claim.sourceAdapterProfileId,
    );
    if (!sourceAdapter) {
      throw new EnvironmentActionBrokerError(
        "action_connector_unavailable",
        503,
        "The paired source adapter profile is unavailable for semantic wake admission.",
      );
    }
    const semanticWakeBridge = bridgeMinecraftPlayerSituationDigestToLiveMail({
      digest: recorded.digest,
      claim,
      subjectIdentity: {
        participantId: claim.participantId,
        subjectBindingId: claim.subjectBindingId,
        selectedPlayerRef: claim.subjectBindingId,
        selectedPlayerNativeId: claim.subjectNativeId,
      },
      freshnessCeilingMs:
        sourceAdapter.profile.freshness.observation_max_age_ms,
    });
    const recoveryEvent = recorded.batch.events.find((event) =>
      [
        "actor.died",
        "actor.left",
        "workflow.manual_override_detected",
        "workflow.manual_override",
        "workflow.emergency_stopped",
      ].includes(event.event_type),
    );
    const recoveryReason = recoveryEvent?.event_type === "actor.died"
      ? "death"
      : recoveryEvent?.event_type === "actor.left"
        ? "disconnect"
        : recoveryEvent?.event_type === "workflow.emergency_stopped"
          ? "emergency_stop"
          : recoveryEvent
            ? "manual_override"
            : null;
    const durableGoalRecoveries = recoveryEvent && recoveryReason
      ? await environmentDurableGoalStore.recordRecoveryFromEnvironmentEvent({
          roomId: recorded.batch.room_id,
          sourceId: recorded.batch.source_id,
          worldId: recorded.batch.world_id,
          producerEpochRef: recorded.batch.producer_epoch_ref,
          subjectBindingId: claim.subjectBindingId,
          eventRef: recoveryEvent.event_id,
          reason: recoveryReason,
          occurredAt: recoveryEvent.occurred_at,
        })
      : [];
    res.json({
      schema: "helix.environment_event_batch_receipt.v1",
      ok: true,
      error: null,
      message: "Typed environment events and their compact digest were recorded.",
      batch_id: recorded.batch.batch_id,
      digest_id: recorded.digest.digest_id,
      latest_event_sequence: recorded.digest.latest_event_sequence,
      replayed: recorded.replayed,
      semantic_wake_bridge: semanticWakeBridge,
      durable_goal_recovery_refs: durableGoalRecoveries.map(
        (goal) => goal.event_refs.at(-1),
      ).filter(Boolean),
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
