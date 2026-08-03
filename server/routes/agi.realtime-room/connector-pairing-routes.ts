import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  HELIX_CONNECTOR_PAIRING_RECEIPT_SCHEMA,
  helixConnectorPairingCreateRequestSchema,
  type HelixConnectorPairingReceipt,
} from "@shared/helix-connector-pairing";
import {
  ConnectorBootstrapPairingError,
  createConnectorBootstrapPairing,
  listConnectorBootstrapPairings,
  revokeConnectorBootstrapPairing,
} from "../../services/environment-connectors/pairing";
import {
  buildSharedLiveRoomControlActorFromAccountContext,
  sharedLiveRoomActorAllowsSourceIngress,
} from "../../services/shared-live-room-control/service";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../../middleware/first-party-cookie-boundary";
import {
  readMembership,
  requireOwner,
  requireSharedRoomAccount,
  requireSharedRoomAccountContext,
} from "./http-context";
import {
  isRoomSourceIngressError,
} from "../../services/helix-ask/realtime-room/source-link-store";
import { isSharedRealtimeRoomDomainError } from "../../services/helix-ask/realtime-room/room-store";
import { redactSharedLiveRoomSensitiveText } from "../../services/shared-live-room-control/sensitive-text";

const pairingCookieBoundary = new FirstPartyCookieBoundary({
  codePrefix: "connector_pairing_cookie",
  ipMax: Number(process.env.HELIX_CONNECTOR_PAIRING_BROWSER_IP_RATE_LIMIT ?? "120"),
  accountMax: Number(
    process.env.HELIX_CONNECTOR_PAIRING_BROWSER_ACCOUNT_RATE_LIMIT ?? "90",
  ),
});

const receipt = (
  input: Partial<HelixConnectorPairingReceipt> & {
    ok: boolean;
    message: string;
  },
): HelixConnectorPairingReceipt => ({
  schema: HELIX_CONNECTOR_PAIRING_RECEIPT_SCHEMA,
  ok: input.ok,
  error: input.error ?? null,
  message: input.message,
  pairing: input.pairing ?? null,
  ...(input.pairings ? { pairings: input.pairings } : {}),
  ...(input.pairing_code !== undefined
    ? { pairing_code: input.pairing_code }
    : {}),
  ...(input.pairing_command !== undefined
    ? { pairing_command: input.pairing_command }
    : {}),
  pairing_code_shown_once: input.pairing_code_shown_once ?? false,
  credential_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sendError = (res: Response, error: unknown): void => {
  if (error instanceof ConnectorBootstrapPairingError) {
    res.status(error.statusCode).json(
      receipt({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    if (error.retryAfterMs !== null) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil(error.retryAfterMs / 1_000))),
      );
    }
    res.status(error.statusCode).json(
      receipt({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  if (isRoomSourceIngressError(error) || isSharedRealtimeRoomDomainError(error)) {
    res.status(error.statusCode).json(
      receipt({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  const safeMessage = redactSharedLiveRoomSensitiveText(
    error instanceof Error ? error.message : "unknown",
  ).text;
  console.warn("[connector-pairing] request failed", safeMessage);
  res.status(503).json(
    receipt({
      ok: false,
      error: "connector_pairing_unavailable",
      message: "Connector pairing is temporarily unavailable.",
    }),
  );
};

const route = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response, _next: NextFunction): void => {
  void handler(req, res).catch((error: unknown) => sendError(res, error));
};

const ownerContext = async (req: Request, res: Response) => {
  const context = await requireSharedRoomAccountContext(req);
  const actor = buildSharedLiveRoomControlActorFromAccountContext(context);
  if (!sharedLiveRoomActorAllowsSourceIngress(actor)) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_forbidden",
      403,
      "Environment connector pairing is not enabled for this room owner.",
    );
  }
  pairingCookieBoundary.enforceAccountRateLimit(res, context.profile_id!);
  const account = await requireSharedRoomAccount(req);
  requireOwner(await readMembership(req.params.roomId, account));
  return account;
};

const idempotencyKey = (req: Request): string => {
  const value = req.get("idempotency-key")?.trim() ?? "";
  if (value.length < 8 || value.length > 200) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "A caller-stable Idempotency-Key header containing 8-200 characters is required.",
    );
  }
  return value;
};

export const sharedRealtimeRoomConnectorPairingRouter = Router();

sharedRealtimeRoomConnectorPairingRouter.use(
  "/realtime/rooms/:roomId/connector-pairings",
  pairingCookieBoundary.noStore,
  pairingCookieBoundary.enforceIpRateLimit,
  pairingCookieBoundary.enforceSameOrigin,
  json({ limit: "32kb" }),
);

sharedRealtimeRoomConnectorPairingRouter.get(
  "/realtime/rooms/:roomId/connector-pairings",
  route(async (req, res) => {
    const account = await ownerContext(req, res);
    const pairings = await listConnectorBootstrapPairings({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
    });
    res.json(
      receipt({
        ok: true,
        message: "Connector pairing status listed.",
        pairings,
      }),
    );
  }),
);

sharedRealtimeRoomConnectorPairingRouter.post(
  "/realtime/rooms/:roomId/connector-pairings",
  route(async (req, res) => {
    const parsed = helixConnectorPairingCreateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        receipt({
          ok: false,
          error: "connector_pairing_invalid",
          message: "Connector pairing fields are invalid.",
        }),
      );
      return;
    }
    const account = await ownerContext(req, res);
    const created = await createConnectorBootstrapPairing({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      purpose: parsed.data.purpose,
      bindingId: parsed.data.binding_id,
      worldId: parsed.data.world_id,
      domainAdapter: parsed.data.domain_adapter,
      sourceLabel: parsed.data.source_label,
      credentialTtlMs: parsed.data.credential_ttl_ms,
      commandCredentialRequested: parsed.data.command_credential_requested,
      idempotencyKey: idempotencyKey(req),
    });
    res.status(201).json(
      receipt({
        ok: true,
        message: parsed.data.command_credential_requested
          ? "Command pairing code created. Run it in Minecraft as an operator; the separate command credential is delivered directly to the Fabric connector."
          : "Pairing code created. Run the command from the game server console or as a Minecraft operator before it expires.",
        pairing: created.pairing,
        pairing_code: created.pairingCode,
        pairing_command: `/helix pair ${created.pairingCode}`,
        pairing_code_shown_once: true,
      }),
    );
  }),
);

sharedRealtimeRoomConnectorPairingRouter.delete(
  "/realtime/rooms/:roomId/connector-pairings/:pairingId",
  route(async (req, res) => {
    const account = await ownerContext(req, res);
    const pairing = await revokeConnectorBootstrapPairing({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
      pairingId: req.params.pairingId,
    });
    res.json(
      receipt({
        ok: true,
        message: "Connector pairing code revoked.",
        pairing,
      }),
    );
  }),
);

sharedRealtimeRoomConnectorPairingRouter.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction): void =>
    sendError(res, error),
);
