import { Router, json, type Request, type Response } from "express";
import {
  authenticateEnvironmentCommandConnector,
  isEnvironmentCommandBrokerError,
  leasePendingEnvironmentCommands,
  recordEnvironmentCommandCatalog,
  submitEnvironmentCommandResult,
} from "../services/environment-connectors/commands";

const sendError = (res: Response, error: unknown): void => {
  if (isEnvironmentCommandBrokerError(error)) {
    res.status(error.statusCode).json({
      schema: "helix.environment_command.connector_receipt.v1",
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
    "[environment-command] connector request failed",
    error instanceof Error ? error.name : "unknown",
  );
  res.status(503).json({
    schema: "helix.environment_command.connector_receipt.v1",
    ok: false,
    error: "command_connector_unavailable",
    message: "The environment command connector lane is temporarily unavailable.",
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

export const environmentCommandRouter = Router();

environmentCommandRouter.use(
  "/v1/authorities/:authorityId",
  noStore,
  json({ limit: "1mb" }),
);

environmentCommandRouter.post(
  "/v1/authorities/:authorityId/catalog",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentCommandConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "command.catalog.write",
    });
    const recorded = await recordEnvironmentCommandCatalog({
      claim,
      page: req.body,
    });
    res.json({
      schema: "helix.environment_command.catalog_receipt.v1",
      ok: true,
      error: null,
      message: "Live Minecraft command catalog recorded.",
      command_catalog_id: recorded.commandCatalogId,
      command_tree_hash: recorded.commandTreeHash,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentCommandRouter.get(
  "/v1/authorities/:authorityId/requests/pending",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentCommandConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "command.poll",
    });
    const requests = await leasePendingEnvironmentCommands({
      claim,
      limit: Number(req.query.limit ?? 4),
    });
    res.json({
      schema: "helix.environment_command.pending_requests.v1",
      ok: true,
      error: null,
      command_requests: requests,
      automatic_retry_allowed: false,
      host_access_allowed: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentCommandRouter.post(
  "/v1/authorities/:authorityId/requests/result",
  route(async (req, res) => {
    const claim = await authenticateEnvironmentCommandConnector({
      authorityId: req.params.authorityId,
      authorization: req.headers.authorization,
      requiredScope: "command.result.write",
    });
    const recorded = await submitEnvironmentCommandResult({
      claim,
      result: req.body,
    });
    res.json({
      schema: "helix.environment_command.result_receipt.v1",
      ok: true,
      error: null,
      message: "Minecraft command result recorded for solver evidence re-entry.",
      observation: recorded.observation,
      replayed: recorded.replayed,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);
