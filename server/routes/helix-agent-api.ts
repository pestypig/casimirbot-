import crypto from "node:crypto";
import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { ZodError } from "zod";
import {
  HELIX_AGENT_RUN_DEVELOPER_SCOPE,
  HELIX_AGENT_RUN_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
  helixAgentCancelRequestSchema,
  helixAgentContinueRequestSchema,
  helixAgentEventsQuerySchema,
  helixAgentStartRequestSchema,
} from "@shared/contracts/helix-agent-api.v1";
import {
  DefaultHelixAgentAccessTokenVerifier,
  requireHelixAgentApiScope,
  resolveHelixAgentApiPrincipal,
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { createRateLimiter } from "../middleware/rate-limit";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";
import {
  buildHelixAgentApiError,
  HelixAgentApiService,
  HelixAgentApiServiceError,
} from "../services/helix-agent-api/service";
import { sharedLiveRoomAgentApiService } from "../services/shared-live-room-control/agent-api-service";
import { HELIX_AGENT_DATABASE_OAUTH_SCOPES } from "../services/helix-agent-api/database-scope-policy";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import {
  containsSharedLiveRoomSensitiveText,
  containsSharedLiveRoomSensitiveValue,
} from "../services/shared-live-room-control/sensitive-text";
import {
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
} from "../security/desktop-session";

type Authenticate = (req: Request) => Promise<HelixAgentApiPrincipal>;

type RouterDependencies = {
  service?: HelixAgentApiService;
  authenticate?: Authenticate;
  verifier?: HelixAgentAccessTokenVerifier;
  rateLimit?: boolean;
  enforceTransportSecurity?: boolean;
};

type AgentResponseLocals = {
  helixAgentPrincipal?: HelixAgentApiPrincipal;
  helixAgentRequestId?: string;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const requestIdFor = (req: Request): string => {
  const supplied = normalize(req.get("x-request-id")).slice(0, 160);
  return supplied && !containsSharedLiveRoomSensitiveText(supplied)
    ? supplied
    : `agent_req_${crypto.randomUUID()}`;
};

const allowedOrigins = (): ReadonlySet<string> => {
  const values = (process.env.HELIX_AGENT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((entry: string): string => entry.trim())
    .filter(Boolean);
  try {
    values.push(new URL(resolveCasimirPublicBaseUrl()).origin);
  } catch {
    // The metadata/config error is returned separately on a real request.
  }
  if (process.env.NODE_ENV !== "production") {
    values.push(
      "http://localhost",
      "http://127.0.0.1",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
    );
  }
  return new Set(values);
};

const allowedHosts = (): ReadonlySet<string> => {
  const values = (process.env.HELIX_AGENT_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((entry: string): string => entry.trim().toLowerCase())
    .filter(Boolean);
  try {
    values.push(new URL(resolveCasimirPublicBaseUrl()).host.toLowerCase());
  } catch {
    // The metadata/config error is returned separately on a real request.
  }
  if (process.env.NODE_ENV !== "production") {
    values.push("localhost", "127.0.0.1", "localhost:5000", "127.0.0.1:5000");
  }
  return new Set(values);
};

const isDevelopmentLoopbackHost = (host: string): boolean => {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
};

const isDevelopmentLoopbackOrigin = (origin: string): boolean => {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      (parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]")
    );
  } catch {
    return false;
  }
};

const isLoopbackHost = (host: string): boolean => {
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
};

export const enforceHelixAgentTransportSecurity = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const host = normalize(req.get("host")).toLowerCase();
  const desktopSession = resolveDesktopSessionConfig(process.env);
  const authorizedDesktopLoopback =
    desktopSession.enabled &&
    isLoopbackHost(host) &&
    isDesktopSessionAuthorized(req.headers, desktopSession);
  if (
    !host ||
    (!allowedHosts().has(host) &&
      !isDevelopmentLoopbackHost(host) &&
      !authorizedDesktopLoopback)
  ) {
    next(
      new HelixAgentApiServiceError(
        403,
        "host_not_allowed",
        "The request Host is not admitted for the Helix agent resource.",
      ),
    );
    return;
  }
  const origin = normalize(req.get("origin"));
  if (
    origin &&
    !allowedOrigins().has(origin) &&
    !isDevelopmentLoopbackOrigin(origin) &&
    !(
      authorizedDesktopLoopback &&
      (() => {
        try {
          return new URL(origin).host.toLowerCase() === host;
        } catch {
          return false;
        }
      })()
    )
  ) {
    next(
      new HelixAgentApiServiceError(
        403,
        "origin_not_allowed",
        "The request Origin is not admitted for the Helix agent resource.",
      ),
    );
    return;
  }
  if (
    process.env.NODE_ENV === "production" &&
    !req.secure &&
    !authorizedDesktopLoopback
  ) {
    next(
      new HelixAgentApiServiceError(
        403,
        "https_required",
        "The Helix agent resource requires HTTPS.",
      ),
    );
    return;
  }
  next();
};

const runId = (req: Request): string => {
  const value = normalize(req.params.runId);
  if (!/^run_[A-Za-z0-9._:-]{8,200}$/.test(value)) {
    throw new HelixAgentApiServiceError(
      400,
      "invalid_request",
      "A valid opaque run ID is required.",
    );
  }
  return value;
};

const idempotencyKey = (req: Request): string => {
  const value = normalize(req.get("idempotency-key"));
  if (!value) {
    throw new HelixAgentApiServiceError(
      400,
      "invalid_request",
      "The Idempotency-Key header is required for mutation requests.",
    );
  }
  return value;
};

const asyncRoute =
  (
    handler: (
      req: Request,
      res: Response,
      locals: AgentResponseLocals,
    ) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, res.locals as AgentResponseLocals).catch(next);
  };

const principalFrom = (locals: AgentResponseLocals): HelixAgentApiPrincipal => {
  if (!locals.helixAgentPrincipal) {
    throw new HelixAgentApiServiceError(
      401,
      "unauthorized",
      "A verified principal is required.",
    );
  }
  return locals.helixAgentPrincipal;
};

const responseHeaders = (res: Response, version?: number): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  if (version) res.setHeader("ETag", `W/"agent-run-${version}"`);
};

const DEFAULT_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource";

const resourceMetadataUrl = (
  resourceMetadataPath = DEFAULT_RESOURCE_METADATA_PATH,
): string => `${resolveCasimirPublicBaseUrl()}${resourceMetadataPath}`;

const bearerAuthParam = (name: string, value: string): string => {
  const safeValue = value
    .replace(/[^\x20-\x7e]/gu, " ")
    .replace(/(["\\])/g, "\\$1");
  return `${name}="${safeValue}"`;
};

const oauthErrorDescription = (value: string): string =>
  value.replace(/[^\x20-\x21\x23-\x5b\x5d-\x7e]/gu, " ").slice(0, 512);

const oauthScopeTokenPattern = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

const requiredOAuthScopes = (error: HelixAgentApiServiceError): string[] => {
  const candidates: unknown[] = [];
  if (error.details) {
    candidates.push(error.details.required_scope);
    const required = error.details.required_oauth_scopes;
    if (Array.isArray(required)) candidates.push(...required);
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

const bearerChallengeFor = (
  error: HelixAgentApiServiceError,
  resourceMetadataPath = DEFAULT_RESOURCE_METADATA_PATH,
): string | null => {
  const isAuthenticationFailure = error.status === 401;
  const isScopeFailure =
    error.status === 403 && error.code === "insufficient_scope";
  if (!isAuthenticationFailure && !isScopeFailure) return null;

  const params: string[] = [];
  try {
    params.push(
      bearerAuthParam(
        "resource_metadata",
        resourceMetadataUrl(resourceMetadataPath),
      ),
    );
  } catch {
    // Preserve the primary authentication/configuration error.
  }
  params.push(
    bearerAuthParam(
      "error",
      isAuthenticationFailure ? "invalid_token" : "insufficient_scope",
    ),
    bearerAuthParam("error_description", oauthErrorDescription(error.message)),
  );
  if (isScopeFailure) {
    const scopes = requiredOAuthScopes(error);
    if (scopes.length > 0) {
      params.push(bearerAuthParam("scope", scopes.join(" ")));
    }
  }
  return `Bearer ${params.join(", ")}`;
};

export const createHelixAgentApiErrorHandler = (options: {
  resourceMetadataPath?: string;
} = {}) => (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
  const locals = res.locals as AgentResponseLocals;
  let normalized: HelixAgentApiServiceError;
  if (error instanceof HelixAgentApiServiceError) {
    normalized = error;
  } else if (error instanceof ZodError) {
    normalized = new HelixAgentApiServiceError(
      400,
      "invalid_request",
      "The request does not match the Helix agent API v1 schema.",
      false,
      { issues: error.issues },
    );
  } else if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.too.large"
  ) {
    normalized = new HelixAgentApiServiceError(
      413,
      "invalid_request",
      "The request body exceeds the Helix agent API limit.",
    );
  } else if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.parse.failed"
  ) {
    normalized = new HelixAgentApiServiceError(
      400,
      "invalid_request",
      "The request body is not valid JSON.",
    );
  } else {
    normalized = new HelixAgentApiServiceError(
      500,
      "internal_error",
      "The Helix agent API could not complete the request.",
      true,
    );
  }
  responseHeaders(res);
  const bearerChallenge = bearerChallengeFor(
    normalized,
    options.resourceMetadataPath,
  );
  if (bearerChallenge) res.setHeader("WWW-Authenticate", bearerChallenge);
  res.status(normalized.status).json(
    buildHelixAgentApiError({
      error: normalized,
      requestId: locals.helixAgentRequestId,
    }),
  );
};

export const handleHelixAgentApiError = createHelixAgentApiErrorHandler();

export const createHelixAgentApiRouter = (
  dependencies: RouterDependencies = {},
): Router => {
  const router = Router();
  const service = dependencies.service ?? sharedLiveRoomAgentApiService;
  const verifier =
    dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  const authenticate =
    dependencies.authenticate ??
    ((req: Request) => resolveHelixAgentApiPrincipal(req, verifier));

  if (dependencies.rateLimit !== false) {
    router.use(
      createRateLimiter({
        windowMs: 60_000,
        max: Number(process.env.HELIX_AGENT_IP_RATE_LIMIT ?? "120"),
        keyGenerator: (req: Request): string =>
          req.ip || req.socket.remoteAddress || "unknown",
      }),
    );
  }
  if (dependencies.enforceTransportSecurity !== false) {
    router.use(enforceHelixAgentTransportSecurity);
  }
  router.use(
    express.json({ limit: process.env.HELIX_AGENT_BODY_LIMIT ?? "512kb" }),
  );
  router.use((req: Request, res: Response, next: NextFunction): void => {
    const locals = res.locals as AgentResponseLocals;
    locals.helixAgentRequestId = requestIdFor(req);
    res.setHeader("X-Request-Id", locals.helixAgentRequestId);
    if (
      containsSharedLiveRoomSensitiveValue({
        body: req.body,
        query: req.query,
      })
    ) {
      next(
        new HelixAgentApiServiceError(
          400,
          "invalid_request",
          "Protected credential material is not accepted by this resource.",
          false,
          { failure_code: "protected_sensitive_content_rejected" },
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
        max: Number(process.env.HELIX_AGENT_PRINCIPAL_RATE_LIMIT ?? "240"),
        keyGenerator: (_req: Request): string => {
          const principal = (
            _req.res?.locals as AgentResponseLocals | undefined
          )?.helixAgentPrincipal;
          return principal
            ? `${principal.tenantId}\n${principal.issuer}\n${principal.subjectId}`
            : "unverified";
        },
      }),
    );
  }

  router.post(
    "/",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const request = helixAgentStartRequestSchema.parse(req.body);
        const result = await service.startRun({
          principal,
          idempotencyKey: idempotencyKey(req),
          request,
        });
        responseHeaders(res, result.body.version);
        res.setHeader(
          "Idempotency-Replayed",
          String(result.idempotencyReplayed),
        );
        res.setHeader(
          "Location",
          `/api/v1/agent-runs/${encodeURIComponent(result.body.run_id)}`,
        );
        res.status(result.status).json(result.body);
      },
    ),
  );

  router.get(
    "/:runId",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_READ_SCOPE);
        const result = await service.inspectRun({
          principal,
          runId: runId(req),
        });
        responseHeaders(res, result.version);
        res.json(result);
      },
    ),
  );

  router.post(
    "/:runId/continue",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const request = helixAgentContinueRequestSchema.parse(req.body);
        const result = await service.continueRun({
          principal,
          runId: runId(req),
          idempotencyKey: idempotencyKey(req),
          request,
        });
        responseHeaders(res, result.body.version);
        res.setHeader(
          "Idempotency-Replayed",
          String(result.idempotencyReplayed),
        );
        res.status(result.status).json(result.body);
      },
    ),
  );

  router.post(
    "/:runId/cancel",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const request = helixAgentCancelRequestSchema.parse(req.body);
        const result = await service.cancelRun({
          principal,
          runId: runId(req),
          idempotencyKey: idempotencyKey(req),
          request,
        });
        responseHeaders(res, result.body.version);
        res.setHeader(
          "Idempotency-Replayed",
          String(result.idempotencyReplayed),
        );
        res.status(result.status).json(result.body);
      },
    ),
  );

  router.get(
    "/:runId/events",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_READ_SCOPE);
        const query = helixAgentEventsQuerySchema.parse(req.query);
        const result = await service.listEvents({
          principal,
          runId: runId(req),
          afterSeq: query.after_seq,
          limit: query.limit,
        });
        responseHeaders(res);
        res.json(result);
      },
    ),
  );

  router.get(
    "/:runId/evidence",
    asyncRoute(
      async (
        req: Request,
        res: Response,
        locals: AgentResponseLocals,
      ): Promise<void> => {
        const principal = principalFrom(locals);
        requireHelixAgentApiScope(principal, HELIX_AGENT_RUN_READ_SCOPE);
        const result = await service.fetchEvidence({
          principal,
          runId: runId(req),
        });
        responseHeaders(res);
        res.json(result);
      },
    ),
  );

  router.use(handleHelixAgentApiError);
  return router;
};

export const createHelixAgentProtectedResourceMetadataRouter = (
  dependencies: Pick<RouterDependencies, "verifier"> & {
    resourcePaths?: readonly string[];
    scopes?: readonly string[];
    additionalResourcePaths?: readonly string[];
    additionalScopes?: readonly string[];
  } = {},
): Router => {
  const router = Router();
  const verifier =
    dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  const resourcePaths = dependencies.resourcePaths
    ? Array.from(dependencies.resourcePaths)
    : [
        "/.well-known/oauth-protected-resource",
        "/.well-known/oauth-protected-resource/mcp",
        "/.well-known/oauth-protected-resource/api/v1/agent-runs",
        ...(dependencies.additionalResourcePaths ?? []),
      ];
  const scopes = dependencies.scopes ?? [
    HELIX_AGENT_RUN_READ_SCOPE,
    HELIX_AGENT_RUN_WRITE_SCOPE,
    HELIX_AGENT_RUN_DEVELOPER_SCOPE,
    ...HELIX_AGENT_DATABASE_OAUTH_SCOPES,
    ...(dependencies.additionalScopes ?? []),
  ];
  router.get(
    resourcePaths,
    (_req: Request, res: Response, next: NextFunction): void => {
      try {
        const base = resolveCasimirPublicBaseUrl();
        responseHeaders(res);
        res.json({
          resource: verifier.audience(),
          authorization_servers: [verifier.authorizationServer()],
          scopes_supported: Array.from(new Set(scopes)),
          bearer_methods_supported: ["header"],
          resource_documentation: `${base}/docs/architecture/helix-agent-api-v1.md`,
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.use(handleHelixAgentApiError);
  return router;
};
