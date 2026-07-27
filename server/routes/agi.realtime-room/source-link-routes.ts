import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import {
  HELIX_ROOM_SOURCE_BINDING_RECEIPT_SCHEMA,
  type HelixRoomSourceBinding,
  type HelixRoomSourceBindingReceipt,
} from "@shared/helix-room-source-ingress";
import { helixSharedLiveRoomSourceCreateRequestSchema } from "@shared/contracts/helix-shared-live-room-agent.v1";
import { getAccountSessionById } from "../../services/helix-account/account-session-store";
import {
  isRoomSourceIngressError,
  listSharedRealtimeRoomSourceBindings,
  RoomSourceIngressError,
  revokeSharedRealtimeRoomSourceBinding,
} from "../../services/helix-ask/realtime-room/source-link-store";
import {
  SharedLiveRoomControlError,
  buildSharedLiveRoomControlActorFromAccountContext,
} from "../../services/shared-live-room-control/service";
import {
  claimSharedLiveRoomSourceCredentialForBrowser,
  getSharedLiveRoomControlService,
  issueSharedLiveRoomSourceCredentialDeliveryHandle,
} from "../../services/shared-live-room-control/default-service";
import { SharedLiveRoomBindingStoreError } from "../../services/shared-live-room-control/binding-store";
import { isSharedRealtimeRoomDomainError } from "../../services/helix-ask/realtime-room/room-store";
import {
  readMembership,
  requireOwner,
  requireSharedRoomAccount,
  requireSharedRoomAccountContext,
  type SharedRoomRequestAccount,
} from "./http-context";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../../middleware/first-party-cookie-boundary";
import { redactSharedLiveRoomSensitiveText } from "../../services/shared-live-room-control/sensitive-text";

const createBindingSchema = helixSharedLiveRoomSourceCreateRequestSchema;

const rotateCredentialSchema = z
  .object({
    ttl_ms: z
      .number()
      .int()
      .positive()
      .max(30 * 24 * 60 * 60 * 1_000)
      .optional(),
  })
  .strict();

const claimCredentialSchema = z
  .object({
    claim_handle: z.string().trim().min(16).max(500),
  })
  .strict();

const sharedLiveRoomControlService = getSharedLiveRoomControlService();
const sourceCookieBoundary = new FirstPartyCookieBoundary({
  codePrefix: "room_source_cookie",
  ipMax: Number(process.env.HELIX_ROOM_SOURCE_BROWSER_IP_RATE_LIMIT ?? "300"),
  accountMax: Number(
    process.env.HELIX_ROOM_SOURCE_BROWSER_ACCOUNT_RATE_LIMIT ?? "240",
  ),
});

class SourceLinkRouteError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "SourceLinkRouteError";
  }
}

const response = (
  input: Partial<HelixRoomSourceBindingReceipt> & {
    ok: boolean;
    message: string;
  },
): HelixRoomSourceBindingReceipt => ({
  schema: HELIX_ROOM_SOURCE_BINDING_RECEIPT_SCHEMA,
  ok: input.ok,
  error: input.error ?? null,
  message: input.message,
  binding: input.binding ?? null,
  ...(input.bindings ? { bindings: input.bindings } : {}),
  ...(input.token_value !== undefined
    ? { token_value: input.token_value }
    : {}),
  token_value_shown_once: input.token_value_shown_once ?? false,
  ...(input.plugin_config !== undefined
    ? { plugin_config: input.plugin_config }
    : {}),
  secret_stored_raw: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sendSourceLinkError = (res: Response, error: unknown): void => {
  if (error instanceof SourceLinkRouteError) {
    res.status(error.statusCode).json(
      response({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    const body = response({
      ok: false,
      error: error.code,
      message: error.message,
    });
    res
      .status(error.statusCode)
      .json(
        error.retryAfterMs === null
          ? body
          : { ...body, retry_after_ms: error.retryAfterMs },
      );
    return;
  }
  if (
    error instanceof SharedLiveRoomControlError ||
    error instanceof SharedLiveRoomBindingStoreError
  ) {
    res
      .status(
        error instanceof SharedLiveRoomControlError
          ? error.status
          : error.statusCode,
      )
      .json({
        schema: HELIX_ROOM_SOURCE_BINDING_RECEIPT_SCHEMA,
        ok: false,
        error: error.code,
        message: error.message,
        binding: null,
        token_value_shown_once: false,
        secret_stored_raw: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
    return;
  }
  if (isRoomSourceIngressError(error)) {
    res.status(error.statusCode).json(
      response({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  if (isSharedRealtimeRoomDomainError(error)) {
    res.status(error.statusCode).json(
      response({
        ok: false,
        error: error.code,
        message: error.message,
      }),
    );
    return;
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error.status === 400 || error.status === 413)
  ) {
    res.status(error.status).json(
      response({
        ok: false,
        error:
          error.status === 413
            ? "room_source_claim_payload_too_large"
            : "room_source_binding_invalid",
        message:
          error.status === 413
            ? "The credential claim payload exceeds 32kb."
            : "The credential claim JSON is invalid.",
      }),
    );
    return;
  }
  const safeMessage = redactSharedLiveRoomSensitiveText(
    error instanceof Error ? error.message : "unknown",
  ).text;
  console.warn("[room-source-binding] request failed", safeMessage);
  res.status(503).json(
    response({
      ok: false,
      error: "room_source_binding_unavailable",
      message: "Room source binding is temporarily unavailable.",
    }),
  );
};

const sourceLinkRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch((error: unknown) => {
      sendSourceLinkError(res, error);
    });
  };

const requireSourceLinkDeveloper = async (
  req: Request,
  res: Response,
): Promise<SharedRoomRequestAccount> => {
  const account = await requireSharedRoomAccount(req);
  const session = await getAccountSessionById(account.sessionId);
  if (
    !session ||
    session.account_policy.account_type !== "developer" ||
    !session.account_policy.feature_flags.includes("room_source_ingress") ||
    session.account_policy.locked_features.includes("room_source_ingress")
  ) {
    throw new RoomSourceIngressError(
      "room_source_binding_forbidden",
      403,
      "Room source ingress is available to developer room owners only.",
    );
  }
  sourceCookieBoundary.enforceAccountRateLimit(res, account.profileId);
  return account;
};

const requireSourceLinkDeveloperContext = async (
  req: Request,
  res: Response,
) => {
  const context = await requireSharedRoomAccountContext(req);
  if (
    context.account_policy.account_type !== "developer" ||
    !context.account_policy.feature_flags.includes("room_source_ingress") ||
    context.account_policy.locked_features.includes("room_source_ingress")
  ) {
    throw new RoomSourceIngressError(
      "room_source_binding_forbidden",
      403,
      "Room source ingress is available to developer room owners only.",
    );
  }
  sourceCookieBoundary.enforceAccountRateLimit(res, context.profile_id!);
  return context;
};

const requireManagingOwner = async (
  req: Request,
  res: Response,
): Promise<SharedRoomRequestAccount> => {
  const account = await requireSourceLinkDeveloper(req, res);
  const membership = await readMembership(req.params.roomId, account);
  requireOwner(membership);
  return account;
};

const requireSourceCreateIdempotencyKey = (req: Request): string => {
  const value = req.get("idempotency-key")?.trim() ?? "";
  if (value.length < 8 || value.length > 200) {
    throw new SourceLinkRouteError(
      "room_source_idempotency_key_required",
      400,
      "A caller-stable Idempotency-Key header containing 8-200 characters is required.",
    );
  }
  return value;
};

const pluginConfig = (binding: HelixRoomSourceBinding, tokenValue: string) => ({
  endpoint: binding.public_ingress_base_url,
  bearer_token: tokenValue,
  source_id: binding.source_id,
  room_id: binding.room_id,
  world_id: binding.world_id,
  domain_adapter: binding.domain_adapter,
  execution_enabled: false as const,
});

export const sharedRealtimeRoomSourceLinkRouter = Router();

sharedRealtimeRoomSourceLinkRouter.use(
  "/realtime/rooms/:roomId/source-bindings",
  sourceCookieBoundary.noStore,
  sourceCookieBoundary.enforceIpRateLimit,
  sourceCookieBoundary.enforceSameOrigin,
  json({ limit: "32kb" }),
);

sharedRealtimeRoomSourceLinkRouter.get(
  "/realtime/rooms/:roomId/source-bindings",
  sourceLinkRoute(async (req: Request, res: Response) => {
    const context = await requireSourceLinkDeveloperContext(req, res);
    const receipt = await sharedLiveRoomControlService.listSourceBindings({
      actor: buildSharedLiveRoomControlActorFromAccountContext(context),
      roomId: req.params.roomId,
    });
    res.json({
      ...receipt,
      message: "Room source bindings listed.",
    });
  }),
);

sharedRealtimeRoomSourceLinkRouter.post(
  "/realtime/rooms/:roomId/source-bindings",
  sourceLinkRoute(async (req: Request, res: Response) => {
    const context = await requireSourceLinkDeveloperContext(req, res);
    const parsed = createBindingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(
        response({
          ok: false,
          error: "room_source_binding_invalid",
          message: "Room source binding fields are invalid.",
        }),
      );
      return;
    }
    const idempotencyKey = requireSourceCreateIdempotencyKey(req);
    const created = await sharedLiveRoomControlService.createSourceBinding({
      actor: buildSharedLiveRoomControlActorFromAccountContext(context),
      roomId: req.params.roomId,
      idempotencyKey,
      request: parsed.data,
    });
    res.status(201).json({
      ...created.body,
      message:
        "Room source binding created. Claim its credential in this signed-in browser before the handle expires.",
    });
  }),
);

sharedRealtimeRoomSourceLinkRouter.post(
  "/realtime/rooms/:roomId/source-bindings/:bindingId/rotate",
  sourceLinkRoute(async (req: Request, res: Response) => {
    const account = await requireManagingOwner(req, res);
    const parsed = rotateCredentialSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(
        response({
          ok: false,
          error: "room_source_binding_invalid",
          message: "Credential rotation fields are invalid.",
        }),
      );
      return;
    }
    const bindings = await listSharedRealtimeRoomSourceBindings({
      roomId: req.params.roomId,
      ownerProfileId: account.profileId,
    });
    const binding = bindings.find(
      (candidate: HelixRoomSourceBinding) =>
        candidate.binding_id === req.params.bindingId,
    );
    if (!binding) {
      throw new RoomSourceIngressError(
        "room_source_binding_not_found",
        404,
        "Room source binding not found.",
      );
    }
    const delivery = await issueSharedLiveRoomSourceCredentialDeliveryHandle({
      binding,
      ownerProfileId: account.profileId,
      purpose: "rotate",
      credentialTtlMs: parsed.data.ttl_ms ?? 7 * 24 * 60 * 60 * 1_000,
    });
    res.json({
      schema: "helix.room_source_credential_delivery_receipt.v1",
      ok: true,
      error: null,
      message:
        "Credential rotation authorized. Claim the replacement in this signed-in browser before the handle expires.",
      binding,
      credential_delivery: delivery,
      token_value_shown_once: false,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

export const sharedRealtimeRoomSourceCredentialClaimRouter = Router();

sharedRealtimeRoomSourceCredentialClaimRouter.use(
  "/realtime/room-source-credential-deliveries/claim",
  sourceCookieBoundary.noStore,
  sourceCookieBoundary.enforceIpRateLimit,
  sourceCookieBoundary.enforceSameOrigin,
  json({ limit: "32kb" }),
);

sharedRealtimeRoomSourceCredentialClaimRouter.post(
  "/realtime/room-source-credential-deliveries/claim",
  sourceLinkRoute(async (req: Request, res: Response) => {
    const context = await requireSourceLinkDeveloperContext(req, res);
    const parsed = claimCredentialSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json(
        response({
          ok: false,
          error: "room_source_binding_invalid",
          message: "A valid credential-delivery handle is required.",
        }),
      );
      return;
    }
    const claimed = await claimSharedLiveRoomSourceCredentialForBrowser({
      accountContext: context,
      deliveryHandle: parsed.data.claim_handle,
    });
    res.json(
      response({
        ok: true,
        message:
          "Room source credential claimed. Copy it now; only its hash is retained.",
        binding: claimed.binding,
        token_value: claimed.tokenValue,
        token_value_shown_once: true,
        plugin_config: claimed.pluginConfig,
      }),
    );
  }),
);

sharedRealtimeRoomSourceCredentialClaimRouter.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    sendSourceLinkError(res, error);
  },
);

const revokeHandler = sourceLinkRoute(async (req: Request, res: Response) => {
  const account = await requireManagingOwner(req, res);
  const binding = await revokeSharedRealtimeRoomSourceBinding({
    roomId: req.params.roomId,
    bindingId: req.params.bindingId,
    ownerProfileId: account.profileId,
  });
  res.json(
    response({
      ok: true,
      message: "Room source binding revoked.",
      binding,
    }),
  );
});

sharedRealtimeRoomSourceLinkRouter.delete(
  "/realtime/rooms/:roomId/source-bindings/:bindingId",
  revokeHandler,
);

sharedRealtimeRoomSourceLinkRouter.post(
  "/realtime/rooms/:roomId/source-bindings/:bindingId/revoke",
  revokeHandler,
);

sharedRealtimeRoomSourceLinkRouter.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    sendSourceLinkError(res, error);
  },
);
