import crypto from "node:crypto";
import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { HELIX_AGENT_RUN_WRITE_SCOPE } from "@shared/contracts/helix-agent-api.v1";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  helixSharedLiveRoomChatBindingClaimRequestSchema,
  helixSharedLiveRoomChatBindingRevokeRequestSchema,
  helixSharedLiveRoomCreateRequestSchema,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomRunBindingRevokeRequestSchema,
  helixSharedLiveRoomRunBindingRequestSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  DefaultHelixAgentAccessTokenVerifier,
  requireHelixAgentApiScope,
  resolveHelixAgentApiPrincipal,
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { createRateLimiter } from "../middleware/rate-limit";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";
import { SharedLiveRoomBindingStore } from "../services/shared-live-room-control/binding-store";
import {
  getSharedLiveRoomBindingStore,
  getSharedLiveRoomControlService,
} from "../services/shared-live-room-control/default-service";
import { buildSharedLiveRoomExternalError } from "../services/shared-live-room-control/external-errors";
import {
  projectSharedLiveRoomChatBindingClaimReceipt,
  projectSharedLiveRoomChatBindingUnbindReceipt,
  projectSharedLiveRoomRunBindingReceipt,
  projectSharedLiveRoomRunUnbindReceipt,
} from "../services/shared-live-room-control/external-projections";
import {
  buildSharedLiveRoomControlActorFromAgentPrincipal,
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
} from "../services/shared-live-room-control/service";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import {
  containsSharedLiveRoomSensitiveText,
  containsSharedLiveRoomSensitiveValue,
} from "../services/shared-live-room-control/sensitive-text";
import { enforceHelixAgentTransportSecurity } from "./helix-agent-api";

type Authenticate = (req: Request) => Promise<HelixAgentApiPrincipal>;

type RoomBindingStore = Pick<
  SharedLiveRoomBindingStore,
  | "bindRunToRoom"
  | "claimPendingChatBinding"
  | "revokeRunRoomBindingForOwner"
  | "revokeClaimedRunChatBindingForOwner"
>;

export type HelixSharedLiveRoomRouterDependencies = {
  controlService?: SharedLiveRoomControlService;
  bindingStore?: RoomBindingStore;
  authenticate?: Authenticate;
  verifier?: HelixAgentAccessTokenVerifier;
  rateLimit?: boolean;
  enforceTransportSecurity?: boolean;
};

type RoomResponseLocals = {
  helixAgentPrincipal?: HelixAgentApiPrincipal;
  helixAgentRequestId?: string;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const requestIdFor = (req: Request): string => {
  const supplied = normalize(req.get("x-request-id")).slice(0, 160);
  return supplied && !containsSharedLiveRoomSensitiveText(supplied)
    ? supplied
    : `room_req_${crypto.randomUUID()}`;
};

const agentChatClaimPattern = /^agent_chat_claim_[A-Za-z0-9:._~-]+$/u;

const protectedRoomRequestValue = (req: Request): unknown => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? { ...(req.body as Record<string, unknown>) }
      : req.body;
  if (
    req.method === "POST" &&
    req.path === "/chat-bindings/claim" &&
    body &&
    typeof body === "object" &&
    !Array.isArray(body)
  ) {
    const claimHandle = (body as Record<string, unknown>).claim_handle;
    if (
      typeof claimHandle === "string" &&
      agentChatClaimPattern.test(claimHandle)
    ) {
      (body as Record<string, unknown>).claim_handle =
        "opaque_browser_chat_claim";
    }
  }
  return { body, query: req.query };
};

const idempotencyKey = (req: Request): string => {
  const value = normalize(req.get("idempotency-key"));
  if (!value) {
    throw new SharedLiveRoomControlError(
      400,
      "invalid_request",
      "The Idempotency-Key header is required for mutation requests.",
    );
  }
  return value;
};

const principalFrom = (locals: RoomResponseLocals): HelixAgentApiPrincipal => {
  if (!locals.helixAgentPrincipal) {
    throw new SharedLiveRoomControlError(
      401,
      "unauthorized",
      "A verified principal is required.",
    );
  }
  return locals.helixAgentPrincipal;
};

const requirePathOnlyBindingRef = (
  req: Request,
  kind: "run" | "chat",
): string => {
  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : null;
  if (
    (body && Object.keys(body).length > 0) ||
    Object.keys(req.query).length > 0
  ) {
    throw new SharedLiveRoomControlError(
      400,
      "invalid_request",
      "Binding withdrawal accepts only the opaque binding reference in the request path.",
    );
  }
  const candidate = { binding_ref: req.params.bindingRef };
  return (
    kind === "run"
      ? helixSharedLiveRoomRunBindingRevokeRequestSchema
      : helixSharedLiveRoomChatBindingRevokeRequestSchema
  ).parse(candidate).binding_ref;
};

const ownerFrom = (principal: HelixAgentApiPrincipal) => ({
  tenantId: principal.tenantId,
  issuer: principal.issuer,
  subjectId: principal.subjectId,
  accountProfileId: principal.accountProfileId,
});

const requireCurrentRoomFeature = (principal: HelixAgentApiPrincipal): void => {
  const policy = principal.accountContext.account_policy;
  if (
    !policy ||
    !policy.feature_flags.includes("shared_realtime_rooms") ||
    policy.locked_features.includes("shared_realtime_rooms")
  ) {
    throw new SharedLiveRoomControlError(
      403,
      "account_policy_blocked",
      "Shared Live Rooms are locked by the active account policy.",
    );
  }
};

const requireAllScopes = (
  principal: HelixAgentApiPrincipal,
  requiredScopes: readonly string[],
): void => {
  const missing = Array.from(
    new Set(
      requiredScopes.filter((scope: string) => !principal.scopes.has(scope)),
    ),
  );
  if (missing.length === 0) return;
  throw new SharedLiveRoomControlError(
    403,
    "insufficient_scope",
    `The bearer token is missing the required ${missing.join(", ")} scope${
      missing.length === 1 ? "" : "s"
    }.`,
    false,
    {
      required_scope: missing[0],
      required_oauth_scopes: missing,
    },
  );
};

const responseHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
};

const asyncRoute =
  (
    handler: (
      req: Request,
      res: Response,
      locals: RoomResponseLocals,
    ) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, res.locals as RoomResponseLocals).catch(next);
  };

const bearerAuthParam = (name: string, value: string): string => {
  const safeValue = value
    .replace(/[^\x20-\x7e]/gu, " ")
    .replace(/(["\\])/g, "\\$1");
  return `${name}="${safeValue}"`;
};

const oauthErrorDescription = (value: string): string =>
  value.replace(/[^\x20-\x21\x23-\x5b\x5d-\x7e]/gu, " ").slice(0, 512);

const oauthScopeTokenPattern = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

const requiredOAuthScopes = (
  details: Record<string, unknown> | undefined,
): string[] => {
  const candidates: unknown[] = [];
  if (details) {
    candidates.push(details.required_scope);
    if (Array.isArray(details.required_oauth_scopes)) {
      candidates.push(...details.required_oauth_scopes);
    }
  }
  return Array.from(
    new Set(
      candidates.filter(
        (candidate: unknown): candidate is string =>
          typeof candidate === "string" &&
          oauthScopeTokenPattern.test(candidate),
      ),
    ),
  );
};

export const handleHelixSharedLiveRoomError = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const locals = res.locals as RoomResponseLocals;
  const normalized = buildSharedLiveRoomExternalError({
    error,
    requestId: locals.helixAgentRequestId,
  });
  responseHeaders(res);
  const authenticationFailure = normalized.status === 401;
  const scopeFailure =
    normalized.status === 403 && normalized.body.error === "insufficient_scope";
  if (authenticationFailure || scopeFailure) {
    const params: string[] = [];
    try {
      params.push(
        bearerAuthParam(
          "resource_metadata",
          `${resolveCasimirPublicBaseUrl()}` +
            "/.well-known/oauth-protected-resource/api/v1/rooms",
        ),
      );
    } catch {
      // Preserve the primary authentication/configuration failure.
    }
    params.push(
      bearerAuthParam(
        "error",
        authenticationFailure ? "invalid_token" : "insufficient_scope",
      ),
      bearerAuthParam(
        "error_description",
        oauthErrorDescription(normalized.body.message),
      ),
    );
    if (scopeFailure) {
      const scopes = requiredOAuthScopes(
        normalized.body.details as Record<string, unknown> | undefined,
      );
      if (scopes.length > 0) {
        params.push(bearerAuthParam("scope", scopes.join(" ")));
      }
    }
    res.setHeader("WWW-Authenticate", `Bearer ${params.join(", ")}`);
  }
  res.status(normalized.status).json(normalized.body);
};

export const createHelixSharedLiveRoomRouter = (
  dependencies: HelixSharedLiveRoomRouterDependencies = {},
): Router => {
  const router = Router();
  const controlService =
    dependencies.controlService ?? getSharedLiveRoomControlService();
  const bindingStore =
    dependencies.bindingStore ?? getSharedLiveRoomBindingStore();
  const verifier =
    dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  const authenticate =
    dependencies.authenticate ??
    ((req: Request) => resolveHelixAgentApiPrincipal(req, verifier));

  if (dependencies.rateLimit !== false) {
    router.use(
      createRateLimiter({
        windowMs: 60_000,
        max: Number(process.env.HELIX_ROOM_AGENT_IP_RATE_LIMIT ?? "120"),
        keyGenerator: (req: Request): string =>
          req.ip || req.socket.remoteAddress || "unknown",
      }),
    );
  }
  if (dependencies.enforceTransportSecurity !== false) {
    router.use(enforceHelixAgentTransportSecurity);
  }
  router.use(
    express.json({
      limit: process.env.HELIX_ROOM_AGENT_BODY_LIMIT ?? "256kb",
    }),
  );
  router.use((req: Request, res: Response, next: NextFunction): void => {
    const locals = res.locals as RoomResponseLocals;
    locals.helixAgentRequestId = requestIdFor(req);
    res.setHeader("X-Request-Id", locals.helixAgentRequestId);
    if (containsSharedLiveRoomSensitiveValue(protectedRoomRequestValue(req))) {
      next(
        new SharedLiveRoomControlError(
          400,
          "protected_sensitive_content_rejected",
          "Protected credential material is not accepted by this resource.",
        ),
      );
      return;
    }
    void authenticate(req)
      .then((principal: HelixAgentApiPrincipal): void => {
        locals.helixAgentPrincipal = principal;
        next();
      })
      .catch(next);
  });
  if (dependencies.rateLimit !== false) {
    router.use(
      createRateLimiter({
        windowMs: 60_000,
        max: Number(process.env.HELIX_ROOM_AGENT_PRINCIPAL_RATE_LIMIT ?? "240"),
        keyGenerator: (req: Request): string => {
          const principal = (req.res?.locals as RoomResponseLocals | undefined)
            ?.helixAgentPrincipal;
          return principal
            ? `${principal.tenantId}\n${principal.issuer}\n${principal.subjectId}`
            : "unverified";
        },
      }),
    );
  }

  router.get(
    "/",
    asyncRoute(
      async (
        _req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_SHARED_LIVE_ROOM_READ_SCOPE);
        const receipt = await controlService.listRooms({
          actor: buildSharedLiveRoomControlActorFromAgentPrincipal(principal),
        });
        responseHeaders(res);
        res.json(receipt);
      },
    ),
  );

  router.post(
    "/",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(
          principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        const request = helixSharedLiveRoomCreateRequestSchema.parse(req.body);
        const result = await controlService.createRoom({
          actor: buildSharedLiveRoomControlActorFromAgentPrincipal(principal),
          idempotencyKey: idempotencyKey(req),
          request,
        });
        responseHeaders(res);
        res.setHeader(
          "Location",
          `/api/v1/rooms/${encodeURIComponent(result.body.room.room_id)}`,
        );
        res.setHeader(
          "Idempotency-Replayed",
          String(result.idempotencyReplayed),
        );
        res.status(result.status).json(result.body);
      },
    ),
  );

  router.post(
    "/run-bindings",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireAllScopes(principal, [
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_AGENT_RUN_WRITE_SCOPE,
        ]);
        requireCurrentRoomFeature(principal);
        const request = helixSharedLiveRoomRunBindingRequestSchema.parse(
          req.body,
        );
        const binding = await bindingStore.bindRunToRoom({
          owner: ownerFrom(principal),
          runId: request.run_id,
          roomId: request.room_id,
        });
        responseHeaders(res);
        res.status(201).json(projectSharedLiveRoomRunBindingReceipt(binding));
      },
    ),
  );

  router.post(
    "/chat-bindings/claim",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireAllScopes(principal, [
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_AGENT_RUN_WRITE_SCOPE,
        ]);
        requireCurrentRoomFeature(principal);
        const request = helixSharedLiveRoomChatBindingClaimRequestSchema.parse(
          req.body,
        );
        const binding = await bindingStore.claimPendingChatBinding({
          owner: ownerFrom(principal),
          runId: request.run_id,
          claimHandle: request.claim_handle,
        });
        responseHeaders(res);
        res
          .status(201)
          .json(projectSharedLiveRoomChatBindingClaimReceipt(binding));
      },
    ),
  );

  router.delete(
    "/run-bindings/:bindingRef",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireAllScopes(principal, [
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_AGENT_RUN_WRITE_SCOPE,
        ]);
        const result = await bindingStore.revokeRunRoomBindingForOwner({
          owner: ownerFrom(principal),
          bindingRef: requirePathOnlyBindingRef(req, "run"),
        });
        responseHeaders(res);
        res.status(200).json(projectSharedLiveRoomRunUnbindReceipt(result));
      },
    ),
  );

  router.delete(
    "/chat-bindings/:bindingRef",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireAllScopes(principal, [
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
          HELIX_AGENT_RUN_WRITE_SCOPE,
        ]);
        const result = await bindingStore.revokeClaimedRunChatBindingForOwner({
          owner: ownerFrom(principal),
          bindingRef: requirePathOnlyBindingRef(req, "chat"),
        });
        responseHeaders(res);
        res
          .status(200)
          .json(projectSharedLiveRoomChatBindingUnbindReceipt(result));
      },
    ),
  );

  router.get(
    "/:roomId/sources",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(
          principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        const receipt = await controlService.listSourceBindings({
          actor: buildSharedLiveRoomControlActorFromAgentPrincipal(principal),
          roomId: helixSharedLiveRoomIdSchema.parse(req.params.roomId),
        });
        responseHeaders(res);
        res.json(receipt);
      },
    ),
  );

  router.post(
    "/:roomId/sources",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(
          principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        const request = helixSharedLiveRoomSourceCreateRequestSchema.parse(
          req.body,
        );
        const result = await controlService.createSourceBinding({
          actor: buildSharedLiveRoomControlActorFromAgentPrincipal(principal),
          roomId: helixSharedLiveRoomIdSchema.parse(req.params.roomId),
          idempotencyKey: idempotencyKey(req),
          request,
        });
        responseHeaders(res);
        res.setHeader(
          "Idempotency-Replayed",
          String(result.idempotencyReplayed),
        );
        res.status(result.status).json(result.body);
      },
    ),
  );

  router.post(
    "/:roomId/commands",
    asyncRoute(
      async (
        req: Request,
        _res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(
          principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        requireCurrentRoomFeature(principal);
        helixSharedLiveRoomIdSchema.parse(req.params.roomId);
        throw new SharedLiveRoomControlError(
          501,
          "command_execution_not_enabled",
          "Shared Live Room command execution is not enabled.",
          false,
          {
            execution_enabled: false,
            sensor_credentials_accepted: false,
          },
        );
      },
    ),
  );

  router.get(
    "/:roomId",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: RoomResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_SHARED_LIVE_ROOM_READ_SCOPE);
        const receipt = await controlService.inspectRoom({
          actor: buildSharedLiveRoomControlActorFromAgentPrincipal(principal),
          roomId: helixSharedLiveRoomIdSchema.parse(req.params.roomId),
        });
        responseHeaders(res);
        res.json(receipt);
      },
    ),
  );

  router.use(handleHelixSharedLiveRoomError);
  return router;
};
