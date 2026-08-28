import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import {
  HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS,
} from "@shared/helix-brokerage-environment";
import { helixPaperTradeCandidateSchema } from
  "@shared/trading/risk-contract";
import {
  helixBrokerageReactiveDecisionReceiptSchema,
  helixBrokerageReactiveStrategyManifestSchema,
} from "@shared/trading/brokerage-reactive-simulation";
import {
  helixBrokerageReactiveControllerControlSchema,
  helixBrokerageReactiveControllerCycleRequestSchema,
  helixBrokerageReactiveControllerStartSchema,
} from "@shared/trading/brokerage-reactive-controller";
import {
  helixBrokerageReactiveLiveShadowControlSchema,
  helixBrokerageReactiveLiveShadowAcceptanceRequestSchema,
  helixBrokerageReactiveLiveShadowStartSchema,
} from "@shared/trading/brokerage-reactive-live-shadow";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../middleware/first-party-cookie-boundary";
import { resolveCasimirPublicBaseUrl } from
  "../services/public-base-url";
import {
  attachRobinhoodConnectionToPrivateRoom,
  completeRobinhoodOAuth,
  disconnectRobinhoodConnection,
  listPrivateRoomRobinhoodBindings,
  listRobinhoodConnections,
  revokeRobinhoodPrivateRoomBinding,
  RobinhoodConnectionError,
  startRobinhoodOAuth,
} from "../services/brokerage/robinhood-connection-store";
import {
  executeRobinhoodPrivateRoomRead,
} from "../services/brokerage/robinhood-read-adapter";
import {
  readHelixSessionCookie,
} from "../services/helix-account/session-cookie";
import {
  resolveWorkstationGatewayAccountContext,
} from "../services/helix-ask/workstation-tool-gateway/account-policy";
import {
  createPaperTradingAccount,
  evaluateAndRecordPaperTradeCandidate,
  getPaperTradingAccount,
  PaperTradingError,
  setPaperTradingKillSwitch,
} from "../services/trading/paper-trading-store";
import {
  cancelOpenPaperEntry,
  closePaperPosition,
  listPaperTradingLifecycle,
  processPaperQuoteObservation,
  submitAcceptedPaperEntry,
} from "../services/trading/paper-execution-store";
import {
  approveLiveEquityOrderPreview,
  createLiveEquityOrderPreview,
  listLiveEquityOrderPreviews,
} from "../services/trading/live-equity-order-preview-store";
import {
  cancelLiveEquityExecution,
  executeApprovedLiveEquityEntry,
  getOrCreateLiveTradingControl,
  listLiveEquityExecutions,
  reconcileLiveEquityExecution,
  recordLiveTradingOperatorPresence,
  setLiveTradingControl,
} from "../services/trading/live-equity-execution-store";
import {
  approveProtectiveExitPreview,
  cancelProtectiveExitExecution,
  createProtectiveExitPreview,
  executeApprovedProtectiveExit,
  listProtectiveExitExecutions,
  listProtectiveExitPreviews,
  reconcileProtectiveExitExecution,
} from "../services/trading/protective-exit-store";
import {
  getLatestRobinhoodLiveProviderContractPreflight,
  runRobinhoodLiveProviderContractPreflight,
} from "../services/trading/live-provider-contract-preflight-store";
import { readRobinhoodLiveAcceptanceReadiness } from
  "../services/trading/live-acceptance-readiness";
import {
  archiveRobinhoodLiveAcceptance,
  getLatestRobinhoodLiveAcceptanceArchive,
} from "../services/trading/live-acceptance-archive-store";
import { runRobinhoodReadAcceptance } from
  "../services/trading/robinhood-read-acceptance";
import { stagePaperObserverCanary } from
  "../services/trading/paper-observer-canary-stage";
import { admitBrokerageReactiveSimulationProposal } from
  "../services/trading/brokerage-reactive-simulation-arbiter";
import {
  controlBrokerageReactiveController,
  processBrokerageReactiveControllerObservation,
  readBrokerageReactiveController,
  startBrokerageReactiveController,
} from "../services/trading/brokerage-reactive-controller-store";
import {
  controlBrokerageReactiveLiveShadow,
  readBrokerageReactiveLiveShadow,
  runBrokerageReactiveLiveShadowPoll,
  startBrokerageReactiveLiveShadow,
} from "../services/trading/brokerage-reactive-live-shadow-store";
import {
  archiveBrokerageReactiveLiveShadowAcceptance,
  getLatestBrokerageReactiveLiveShadowAcceptance,
  readBrokerageReactiveLiveShadowEvidence,
} from
  "../services/trading/brokerage-reactive-live-shadow-evidence-store";

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);

const callbackQuerySchema = z
  .object({
    state: z.string().trim().min(16).max(512),
    code: z.string().trim().min(8).max(4_096),
  })
  .strict();

const roomBindingSchema = z
  .object({
    room_id: identifier,
    capability_ids: z.array(identifier).min(1).max(32).optional(),
  })
  .strict();

const readRequestSchema = z
  .object({
    tool_name: z.enum(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS),
    arguments: z.record(z.unknown()).optional(),
  })
  .strict();

const readAcceptanceSchema = z.object({
  quote_probe_symbol: z.string().trim().toUpperCase()
    .regex(/^[A-Z][A-Z0-9.-]{0,9}$/u),
}).strict();

const createPaperAccountSchema = z.object({
  starting_equity_cents: z.number().int().positive().max(100_000_000),
  trading_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
}).strict();

const paperRiskRequestSchema = z.object({
  account_id: identifier,
  candidate: helixPaperTradeCandidateSchema,
}).strict();

const paperObserverCanaryStageSchema = z.object({
  account_id: identifier,
  symbol: z.string().trim().toUpperCase()
    .regex(/^[A-Z][A-Z0-9.-]{0,9}$/u),
  notional_cents: z.number().int().min(100).max(2_500),
  quote_observation_id: identifier,
  earnings_observation_id: identifier,
  client_canary_id: z.string().trim().min(8).max(120)
    .regex(/^[a-zA-Z0-9._/-]+$/u),
}).strict();

const paperKillSwitchSchema = z.object({
  account_id: identifier,
  active: z.boolean(),
  reason: z.string().trim().min(1).max(500),
}).strict();

const paperEntrySubmitSchema = z.object({
  account_id: identifier,
  risk_decision_id: identifier,
  client_order_id: identifier,
}).strict();

const paperObservationProcessSchema = z.object({
  account_id: identifier,
  observation_id: identifier,
  symbol: z.string().trim().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u),
}).strict();

const paperCancelSchema = z.object({
  account_id: identifier,
  order_id: identifier,
}).strict();

const reactiveSimulationAdmissionSchema = z.object({
  manifest: helixBrokerageReactiveStrategyManifestSchema,
  decision_receipt: helixBrokerageReactiveDecisionReceiptSchema,
  earnings_observation_id: identifier,
}).strict();

const reactiveControllerStartSchema = helixBrokerageReactiveControllerStartSchema;
const reactiveControllerCycleSchema =
  helixBrokerageReactiveControllerCycleRequestSchema;
const reactiveControllerControlSchema =
  helixBrokerageReactiveControllerControlSchema;
const reactiveLiveShadowStartSchema =
  helixBrokerageReactiveLiveShadowStartSchema;
const reactiveLiveShadowControlSchema =
  helixBrokerageReactiveLiveShadowControlSchema;
const reactiveLiveShadowAcceptanceRequestSchema =
  helixBrokerageReactiveLiveShadowAcceptanceRequestSchema;

const paperCloseSchema = z.object({
  account_id: identifier,
  position_id: identifier,
  client_order_id: identifier,
  observation_id: identifier,
}).strict();

const livePreviewCreateSchema = z.object({
  account_id: identifier,
  risk_decision_id: identifier,
  client_preview_id: identifier,
}).strict();

const livePreviewApprovalSchema = z.object({
  approval_text: z.string().min(1).max(240),
}).strict();

const liveControlSchema = z.object({
  action: z.enum(["arm", "stop"]),
  confirmation_text: z.string().max(500),
  reason: z.string().trim().min(1).max(500),
}).strict();

const livePresenceSchema = z.object({
  control_id: identifier,
  attendance_id: identifier,
  action: z.enum(["start", "heartbeat", "end"]),
}).strict();

const liveContractPreflightSchema = z.object({
  confirmation_text: z.literal("CHECK ROBINHOOD LIVE CONTRACTS"),
}).strict();

const liveAcceptanceArchiveSchema = z.object({
  confirmation_text: z.string().trim().min(1).max(800),
}).strict();

const liveExecutionSchema = z.object({
  approval_id: identifier,
  client_order_id: identifier,
  placement_confirmation_text: z.string().trim().min(1).max(500),
}).strict();

const liveReconciliationSchema = z.object({
  confirmation_text: z.string().trim().min(1).max(500),
}).strict();

const liveCancellationSchema = z.object({
  confirmation_text: z.string().trim().min(1).max(500),
}).strict();

const protectiveExitPreviewCreateSchema = z.object({
  entry_execution_id: identifier,
  client_preview_id: identifier,
  exit_kind: z.enum(["protective_stop", "market_close"]).default("protective_stop"),
}).strict();

const protectiveExitApprovalSchema = z.object({
  approval_text: z.string().trim().min(1).max(500),
}).strict();

const protectiveExitExecutionSchema = z.object({
  exit_approval_id: identifier,
  client_order_id: identifier,
  placement_confirmation_text: z.string().trim().min(1).max(500),
}).strict();

const boundary = new FirstPartyCookieBoundary({
  codePrefix: "brokerage_connection_browser",
  ipMax: 90,
  accountMax: 30,
});

const robinhoodOAuthCallbackBaseUrl = (req: Request): string => {
  const configuredBaseUrl = resolveCasimirPublicBaseUrl();
  if (process.env.NODE_ENV === "production") return configuredBaseUrl;

  const suppliedOrigin = req.get("origin")?.trim();
  const requestHost = req.get("host")?.trim();
  if (
    !suppliedOrigin ||
    !requestHost ||
    requestHost.includes(",") ||
    /\s/.test(requestHost)
  ) {
    return configuredBaseUrl;
  }

  try {
    const supplied = new URL(suppliedOrigin);
    const expected = new URL(`${req.protocol}://${requestHost}`);
    const isExactLoopbackOrigin =
      supplied.origin === expected.origin &&
      supplied.protocol === "http:" &&
      (supplied.hostname === "127.0.0.1" ||
        supplied.hostname === "localhost") &&
      supplied.port.length > 0 &&
      !supplied.username &&
      !supplied.password &&
      supplied.pathname === "/" &&
      !supplied.search &&
      !supplied.hash;
    return isExactLoopbackOrigin ? supplied.origin : configuredBaseUrl;
  } catch {
    return configuredBaseUrl;
  }
};

const errorPayload = (input: {
  code: string;
  message: string;
}): Record<string, unknown> => ({
  schema: "helix.brokerage_connection.error.v1",
  ok: false,
  error: input.code,
  message: input.message,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sendError = (res: Response, error: unknown): void => {
  const parserError = error && typeof error === "object"
    ? error as { type?: unknown }
    : null;
  if (
    parserError?.type === "entity.parse.failed" ||
    parserError?.type === "entity.too.large"
  ) {
    const oversized = parserError.type === "entity.too.large";
    res.status(oversized ? 413 : 400).json(errorPayload({
      code: oversized
        ? "brokerage_payload_too_large"
        : "brokerage_payload_invalid",
      message: oversized
        ? "The brokerage request exceeds the route limit."
        : "The brokerage request contains malformed JSON.",
    }));
    return;
  }
  if (error instanceof RobinhoodConnectionError) {
    res.status(error.statusCode).json(errorPayload({
      code: error.code,
      message: error.message,
    }));
    return;
  }
  if (error instanceof PaperTradingError) {
    res.status(error.status).json(errorPayload({
      code: error.code,
      message: error.message,
    }));
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    if (error.retryAfterMs !== null) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil(error.retryAfterMs / 1_000))),
      );
    }
    res.status(error.statusCode).json(errorPayload({
      code: error.code,
      message: error.message,
    }));
    return;
  }
  console.warn(
    "[brokerage-connection] request failed",
    error instanceof Error ? error.name : "unknown",
  );
  res.status(503).json(errorPayload({
    code: "brokerage_unavailable",
    message: "The brokerage connection service is temporarily unavailable.",
  }));
};

const route = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response, _next: NextFunction): void => {
  void handler(req, res).catch((error) => sendError(res, error));
};

const requireProfileConnectionAccount = async (req: Request) => {
  const sessionId = readHelixSessionCookie(req.headers.cookie);
  const context = await resolveWorkstationGatewayAccountContext(sessionId);
  if (
    !context.trusted_account_session ||
    !context.session_id ||
    !context.profile_id ||
    !context.account_session
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_auth_required",
      401,
      "Sign in before connecting Robinhood.",
    );
  }
  if (
    !context.account_policy.feature_flags.includes("profile_connections") ||
    context.account_policy.locked_features.includes("profile_connections")
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_account_policy_locked",
      403,
      "Profile connections are locked by the current account policy.",
    );
  }
  return context;
};

const requireDeveloperBrokerageAccount = async (req: Request) => {
  const context = await requireProfileConnectionAccount(req);
  if (
    context.account_policy.account_type !== "developer" ||
    !context.account_policy.feature_flags.includes("brokerage_environment") ||
    context.account_policy.locked_features.includes("brokerage_environment")
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_account_policy_locked",
      403,
      "The brokerage environment is currently available only to developer accounts.",
    );
  }
  return context;
};

export const brokerageConnectionsRouter = Router();

// This router is mounted at /api/agi alongside unrelated adapter, room, and
// environment routes. Keep the cookie/CSRF boundary scoped to the brokerage
// surface so it cannot intercept a later sibling route before Express reaches
// that route's own admission policy.
brokerageConnectionsRouter.use("/brokerage-connections", boundary.noStore);
brokerageConnectionsRouter.use(
  "/brokerage-connections",
  boundary.enforceIpRateLimit,
);
brokerageConnectionsRouter.use(
  "/brokerage-connections",
  boundary.enforceSameOrigin,
);
brokerageConnectionsRouter.use(
  "/brokerage-connections",
  json({ limit: "24kb" }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections",
  route(async (req, res) => {
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listRobinhoodConnections(context.profile_id!));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-executions/:executionId/reconcile",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const executionId = identifier.safeParse(req.params.executionId);
    const body = liveReconciliationSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !executionId.success ||
        !body.success || body.data.confirmation_text !==
          `RECONCILE ROBINHOOD ORDER ${executionId.success ? executionId.data : ""}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact live-order reconciliation confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await reconcileLiveEquityExecution({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      executionId: executionId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-executions/:executionId/cancel",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const executionId = identifier.safeParse(req.params.executionId);
    const body = liveCancellationSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !executionId.success ||
        !body.success || body.data.confirmation_text !==
          `CANCEL ROBINHOOD ORDER ${executionId.success ? executionId.data : ""}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact live-order cancellation confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await cancelLiveEquityExecution({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      executionId: executionId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-previews",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = protectiveExitPreviewCreateSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The protective-exit preview request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await createProtectiveExitPreview({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      entryExecutionId: body.data.entry_execution_id,
      clientPreviewId: body.data.client_preview_id,
      exitKind: body.data.exit_kind,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-previews",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) throw new PaperTradingError(
      "paper_trading_unavailable", 400,
      "The protective-exit preview list request is invalid.",
    );
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listProtectiveExitPreviews({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-previews/:exitPreviewId/approve",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const exitPreviewId = identifier.safeParse(req.params.exitPreviewId);
    const body = protectiveExitApprovalSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success ||
        !exitPreviewId.success || !body.success) throw new PaperTradingError(
      "paper_trading_unavailable", 400,
      "The protective-exit approval request is invalid.",
    );
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await approveProtectiveExitPreview({
      ownerProfileId: context.profile_id!,
      sessionId: context.session_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      exitPreviewId: exitPreviewId.data,
      approvalText: body.data.approval_text,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-executions",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = protectiveExitExecutionSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success ||
        body.data.placement_confirmation_text !==
          `PLACE APPROVED EXIT ${body.success ? body.data.exit_approval_id : ""}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact approved-exit placement confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await executeApprovedProtectiveExit({
      ownerProfileId: context.profile_id!,
      sessionId: context.session_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      exitApprovalId: body.data.exit_approval_id,
      clientOrderId: body.data.client_order_id,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-executions",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) throw new PaperTradingError(
      "paper_trading_unavailable", 400,
      "The protective-exit execution list request is invalid.",
    );
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listProtectiveExitExecutions({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-executions/:exitExecutionId/reconcile",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const exitExecutionId = identifier.safeParse(req.params.exitExecutionId);
    const body = liveReconciliationSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !exitExecutionId.success ||
        !body.success || body.data.confirmation_text !==
          `RECONCILE LIVE EXIT ${exitExecutionId.success ? exitExecutionId.data : ""}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact live-exit reconciliation confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await reconcileProtectiveExitExecution({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      exitExecutionId: exitExecutionId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/protective-exit-executions/:exitExecutionId/cancel",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const exitExecutionId = identifier.safeParse(req.params.exitExecutionId);
    const body = liveCancellationSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !exitExecutionId.success ||
        !body.success || body.data.confirmation_text !==
          `CANCEL LIVE EXIT ${exitExecutionId.success ? exitExecutionId.data : ""}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact live-exit cancellation confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await cancelProtectiveExitExecution({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      exitExecutionId: exitExecutionId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/robinhood/oauth/start",
  route(async (req, res) => {
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await startRobinhoodOAuth({
      ownerProfileId: context.profile_id!,
      publicBaseUrl: robinhoodOAuthCallbackBaseUrl(req),
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-acceptance-readiness",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live acceptance-readiness request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await readRobinhoodLiveAcceptanceReadiness({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-acceptance-archives/latest",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live-acceptance archive request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const archive = await getLatestRobinhoodLiveAcceptanceArchive({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!archive) {
      res.status(404).json(errorPayload({
        code: "live_acceptance_archive_not_found",
        message: "No completed Robinhood live-acceptance archive is recorded.",
      }));
      return;
    }
    res.json(archive);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-acceptance-archives",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = liveAcceptanceArchiveSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live-acceptance archive request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await archiveRobinhoodLiveAcceptance({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      confirmationText: body.data.confirmation_text,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-contract-preflight",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live provider contract preflight request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const receipt = await getLatestRobinhoodLiveProviderContractPreflight({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!receipt) {
      res.status(404).json(errorPayload({
        code: "live_provider_contract_preflight_not_found",
        message: "No Robinhood live provider contract preflight has been recorded.",
      }));
      return;
    }
    res.json(receipt);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-contract-preflight",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = liveContractPreflightSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live provider contract preflight confirmation is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await runRobinhoodLiveProviderContractPreflight({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-control",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live trading control request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await getOrCreateLiveTradingControl({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-control",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = liveControlSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live trading control action is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await setLiveTradingControl({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      action: body.data.action,
      confirmationText: body.data.confirmation_text,
      reason: body.data.reason,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-presence",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = livePresenceSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The attended live-session heartbeat is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await recordLiveTradingOperatorPresence({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      controlId: body.data.control_id,
      attendanceId: body.data.attendance_id,
      action: body.data.action,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-executions",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = liveExecutionSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success ||
        body.data.placement_confirmation_text !==
          `PLACE APPROVED ORDER ${body.data.approval_id}`) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The exact approved-order placement confirmation is required.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await executeApprovedLiveEquityEntry({
      ownerProfileId: context.profile_id!,
      sessionId: context.session_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      approvalId: body.data.approval_id,
      clientOrderId: body.data.client_order_id,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-executions",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live execution journal request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listLiveEquityExecutions({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/robinhood/oauth/callback",
  route(async (req, res) => {
    const parsed = callbackQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new RobinhoodConnectionError(
        "brokerage_oauth_state_invalid",
        400,
        "The Robinhood authorization callback is incomplete.",
      );
    }
    const connection = await completeRobinhoodOAuth({
      state: parsed.data.state,
      code: parsed.data.code,
    });
    if (req.get("accept")?.toLowerCase().includes("text/html")) {
      res.status(200).type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Robinhood connected</title></head>
<body style="font-family:system-ui;background:#020617;color:#e2e8f0;padding:2rem"><main style="max-width:34rem;margin:auto"><h1>Robinhood connected</h1><p>The read-only CasimirBot connection is ready. Return to Account &amp; Sessions; this window can be closed.</p><p>No order authority was enabled.</p></main></body></html>`);
      return;
    }
    res.json({
      schema: "helix.brokerage_oauth_completion_receipt.v1",
      ok: true,
      connection,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

brokerageConnectionsRouter.delete(
  "/brokerage-connections/:connectionId",
  route(async (req, res) => {
    const parsed = identifier.safeParse(req.params.connectionId);
    if (!parsed.success) {
      throw new RobinhoodConnectionError(
        "brokerage_connection_not_found",
        404,
        "Robinhood connection not found.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    await disconnectRobinhoodConnection({
      ownerProfileId: context.profile_id!,
      connectionId: parsed.data,
    });
    res.json({
      schema: "helix.brokerage_disconnect_receipt.v1",
      ok: true,
      disconnected: true,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/room-bindings",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const body = roomBindingSchema.safeParse(req.body);
    if (!connectionId.success || !body.success) {
      throw new RobinhoodConnectionError(
        "brokerage_capability_denied",
        400,
        "The private-room brokerage binding request is invalid.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await attachRobinhoodConnectionToPrivateRoom({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: body.data.room_id,
      capabilityIds: body.data.capability_ids,
    }));
  }),
);

brokerageConnectionsRouter.delete(
  "/brokerage-connections/:connectionId/room-bindings/:roomId",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new RobinhoodConnectionError(
        "brokerage_room_binding_not_found",
        404,
        "The Robinhood room grant was not found.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    await revokeRobinhoodPrivateRoomBinding({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    res.json({
      schema: "helix.brokerage_room_binding_revocation.v1",
      ok: true,
      revoked: true,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/read",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = readRequestSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new RobinhoodConnectionError(
        "brokerage_capability_denied",
        400,
        "The governed Robinhood read request is invalid.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await executeRobinhoodPrivateRoomRead({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      toolName: body.data.tool_name,
      arguments: body.data.arguments,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/read-acceptance",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = readAcceptanceSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new RobinhoodConnectionError(
        "brokerage_capability_denied",
        400,
        "The Robinhood read-acceptance request is invalid.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await runRobinhoodReadAcceptance({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      quoteProbeSymbol: body.data.quote_probe_symbol,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-account",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = createPaperAccountSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper account request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await createPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      startingEquityCents: body.data.starting_equity_cents,
      tradingDay: body.data.trading_day,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-account",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper account request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper trading account was not found.",
      );
    }
    res.json(account);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-observer-canaries/stage",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperObserverCanaryStageSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper observer canary request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await stagePaperObserverCanary({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      accountId: body.data.account_id,
      symbol: body.data.symbol,
      notionalCents: body.data.notional_cents,
      quoteObservationId: body.data.quote_observation_id,
      earningsObservationId: body.data.earnings_observation_id,
      clientCanaryId: body.data.client_canary_id,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-risk-decisions",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperRiskRequestSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success ||
        body.data.candidate.connection_id !== connectionId.data ||
        body.data.candidate.room_id !== roomId.data) {
      throw new PaperTradingError(
        "paper_candidate_identity_mismatch", 400,
        "The paper candidate request identities do not match.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await evaluateAndRecordPaperTradeCandidate({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      candidate: body.data.candidate,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-kill-switch",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperKillSwitchSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper kill-switch request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await setPaperTradingKillSwitch({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      connectionId: connectionId.data,
      roomId: roomId.data,
      active: body.data.active,
      reason: body.data.reason,
    });
    res.json(account);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/proposals/admit",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = reactiveSimulationAdmissionSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success ||
        body.data.manifest.connection_id !== connectionId.data ||
        body.data.manifest.room_id !== roomId.data) {
      throw new PaperTradingError(
        "paper_candidate_identity_mismatch", 400,
        "The reactive simulation admission identities do not match.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    if (body.data.manifest.owner_profile_id !== context.profile_id) {
      throw new PaperTradingError(
        "paper_candidate_identity_mismatch", 403,
        "The reactive simulation manifest owner is not the signed-in developer.",
      );
    }
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !==
        body.data.manifest.paper_account_id) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The reactive simulation account does not belong to this connection and room.",
      );
    }
    res.status(201).json(await admitBrokerageReactiveSimulationProposal({
      manifest: body.data.manifest,
      decisionReceipt: body.data.decision_receipt,
      earningsObservationId: body.data.earnings_observation_id,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = reactiveControllerStartSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success ||
        body.data.manifest.connection_id !== connectionId.data ||
        body.data.manifest.room_id !== roomId.data) {
      throw new PaperTradingError(
        "reactive_controller_identity_mismatch", 400,
        "The reactive controller start request is invalid for this route.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await startBrokerageReactiveController({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      request: body.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const controllerRunId = identifier.safeParse(req.params.controllerRunId);
    if (!connectionId.success || !roomId.success || !controllerRunId.success) {
      throw new PaperTradingError(
        "reactive_controller_identity_mismatch", 400,
        "The reactive controller status route identity is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await readBrokerageReactiveController({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      controllerRunId: controllerRunId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId/observations/process",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const controllerRunId = identifier.safeParse(req.params.controllerRunId);
    const body = reactiveControllerCycleSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success ||
        !controllerRunId.success || !body.success) {
      throw new PaperTradingError(
        "reactive_controller_identity_mismatch", 400,
        "The reactive controller observation request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await processBrokerageReactiveControllerObservation({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      controllerRunId: controllerRunId.data,
      request: body.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId/control",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const controllerRunId = identifier.safeParse(req.params.controllerRunId);
    const body = reactiveControllerControlSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success ||
        !controllerRunId.success || !body.success) {
      throw new PaperTradingError(
        "reactive_controller_identity_mismatch", 400,
        "The reactive controller control request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await controlBrokerageReactiveController({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      controllerRunId: controllerRunId.data,
      control: body.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId/live-shadow",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const controllerRunId = identifier.safeParse(req.params.controllerRunId);
    const body = reactiveLiveShadowStartSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success ||
        !controllerRunId.success || !body.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The owner-private live-input shadow request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await startBrokerageReactiveLiveShadow({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      controllerRunId: controllerRunId.data,
      request: body.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow/:shadowSessionId",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const shadowSessionId = identifier.safeParse(req.params.shadowSessionId);
    if (!connectionId.success || !roomId.success || !shadowSessionId.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The live-input shadow status identity is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await readBrokerageReactiveLiveShadow({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      shadowSessionId: shadowSessionId.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow/:shadowSessionId/evidence",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const shadowSessionId = identifier.safeParse(req.params.shadowSessionId);
    if (!connectionId.success || !roomId.success || !shadowSessionId.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The live-input shadow evidence identity is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await readBrokerageReactiveLiveShadowEvidence({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      shadowSessionId: shadowSessionId.data,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow-acceptance-archives/latest",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The R3 acceptance archive identity is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const archive = await getLatestBrokerageReactiveLiveShadowAcceptance({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!archive) {
      throw new PaperTradingError(
        "reactive_shadow_evidence_incomplete", 404,
        "No qualified R3 live-shadow acceptance archive is recorded.",
      );
    }
    res.json(archive);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow-acceptance-archives",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = reactiveLiveShadowAcceptanceRequestSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The R3 acceptance evidence request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await archiveBrokerageReactiveLiveShadowAcceptance({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      request: body.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow/:shadowSessionId/poll",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const shadowSessionId = identifier.safeParse(req.params.shadowSessionId);
    if (!connectionId.success || !roomId.success || !shadowSessionId.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The live-input shadow poll identity is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const shadow = await readBrokerageReactiveLiveShadow({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      shadowSessionId: shadowSessionId.data,
    });
    if (shadow.status !== "active") {
      throw new PaperTradingError(
        "reactive_controller_not_active", 409,
        "The live-input shadow session is not active.",
      );
    }
    const receipt = await runBrokerageReactiveLiveShadowPoll({
      shadowSessionId: shadowSessionId.data,
    });
    if (!receipt) {
      throw new PaperTradingError(
        "reactive_controller_effect_unresolved", 409,
        "The finite poll is not due or another poll is already in flight.",
      );
    }
    res.status(201).json(receipt);
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/live-shadow/:shadowSessionId/control",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const shadowSessionId = identifier.safeParse(req.params.shadowSessionId);
    const body = reactiveLiveShadowControlSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success ||
        !shadowSessionId.success || !body.success) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 400,
        "The live-input shadow control request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await controlBrokerageReactiveLiveShadow({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      shadowSessionId: shadowSessionId.data,
      control: body.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-orders/entries",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperEntrySubmitSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper entry request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !== body.data.account_id) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper account does not belong to this connection and room.",
      );
    }
    res.status(201).json(await submitAcceptedPaperEntry({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      riskDecisionId: body.data.risk_decision_id,
      clientOrderId: body.data.client_order_id,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-observations/process",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperObservationProcessSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper quote-processing request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !== body.data.account_id) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper account does not belong to this connection and room.",
      );
    }
    res.json(await processPaperQuoteObservation({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      observationId: body.data.observation_id,
      symbol: body.data.symbol,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-orders/cancel",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperCancelSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper cancellation request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !== body.data.account_id) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper account does not belong to this connection and room.",
      );
    }
    res.json(await cancelOpenPaperEntry({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      orderId: body.data.order_id,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-positions/close",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = paperCloseSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper position-close request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !== body.data.account_id) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper account does not belong to this connection and room.",
      );
    }
    res.json(await closePaperPosition({
      ownerProfileId: context.profile_id!,
      accountId: body.data.account_id,
      positionId: body.data.position_id,
      clientOrderId: body.data.client_order_id,
      observationId: body.data.observation_id,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/paper-lifecycle",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const accountId = identifier.safeParse(req.query.account_id);
    if (!connectionId.success || !roomId.success || !accountId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The paper lifecycle request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    const account = await getPaperTradingAccount({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    });
    if (!account || account.account_id !== accountId.data) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The paper account does not belong to this connection and room.",
      );
    }
    res.json(await listPaperTradingLifecycle({
      ownerProfileId: context.profile_id!,
      accountId: accountId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-previews",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const body = livePreviewCreateSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live equity preview request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await createLiveEquityOrderPreview({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      accountId: body.data.account_id,
      riskDecisionId: body.data.risk_decision_id,
      clientPreviewId: body.data.client_preview_id,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-previews",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    if (!connectionId.success || !roomId.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live equity preview list request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listLiveEquityOrderPreviews({
      ownerProfileId: context.profile_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.post(
  "/brokerage-connections/:connectionId/rooms/:roomId/live-equity-previews/:previewId/approve",
  route(async (req, res) => {
    const connectionId = identifier.safeParse(req.params.connectionId);
    const roomId = identifier.safeParse(req.params.roomId);
    const previewId = identifier.safeParse(req.params.previewId);
    const body = livePreviewApprovalSchema.safeParse(req.body);
    if (!connectionId.success || !roomId.success || !previewId.success ||
        !body.success) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 400,
        "The live equity approval request is invalid.",
      );
    }
    const context = await requireDeveloperBrokerageAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.status(201).json(await approveLiveEquityOrderPreview({
      ownerProfileId: context.profile_id!,
      sessionId: context.session_id!,
      connectionId: connectionId.data,
      roomId: roomId.data,
      previewId: previewId.data,
      approvalText: body.data.approval_text,
    }));
  }),
);

brokerageConnectionsRouter.get(
  "/brokerage-connections/rooms/:roomId",
  route(async (req, res) => {
    const roomId = identifier.safeParse(req.params.roomId);
    if (!roomId.success) {
      throw new RobinhoodConnectionError(
        "brokerage_room_forbidden",
        403,
        "The brokerage room identity is invalid.",
      );
    }
    const context = await requireProfileConnectionAccount(req);
    boundary.enforceAccountRateLimit(res, context.profile_id!);
    res.json(await listPrivateRoomRobinhoodBindings({
      ownerProfileId: context.profile_id!,
      roomId: roomId.data,
    }));
  }),
);

brokerageConnectionsRouter.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => sendError(res, error),
);
