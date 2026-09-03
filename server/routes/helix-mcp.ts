import crypto from "node:crypto";
import express, {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  DefaultHelixAgentAccessTokenVerifier,
  resolveHelixAgentApiPrincipal,
  resolveHelixDesktopMcpPrincipal,
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { createHelixMcpServer } from "../mcp/helix-mcp-server";
import { createRateLimiter } from "../middleware/rate-limit";
import { HelixAgentApiService } from "../services/helix-agent-api/service";
import { sharedLiveRoomAgentApiService } from "../services/shared-live-room-control/agent-api-service";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import type { HelixLocalSupervisorCoordinationStore } from
  "../services/local-supervisor/local-supervisor-coordination";
import type { HelixReasoningTaskBindingStore } from
  "../services/local-supervisor/reasoning-task-binding-store";
import type { DesktopMcpTunnelTransitionStore } from
  "../services/local-supervisor/desktop-mcp-tunnel-transition-store";
import type { DesktopMcpTunnelTransitionExecutor } from
  "../mcp/helix-mcp-server";
import { appendMcpToolInvocationToOperatorActivity } from
  "../services/helix-ask/operator-activity-ingestion";
import { DESKTOP_MCP_TUNNEL_ACCOUNT_SESSION_HEADER } from
  "@shared/desktop-mcp-tunnel";
import { CASIMIR_DESKTOP_SESSION_HEADER } from
  "../security/desktop-session";
import {
  containsSharedLiveRoomSensitiveText,
  containsSharedLiveRoomSensitiveValue,
} from "../services/shared-live-room-control/sensitive-text";
import {
  createHelixAgentApiErrorHandler,
  enforceHelixAgentTransportSecurity,
} from "./helix-agent-api";

type McpLocals = {
  helixAgentPrincipal?: HelixAgentApiPrincipal;
  helixAgentRequestId?: string;
};

export type HelixMcpServerFactory = (input: {
  principal: HelixAgentApiPrincipal;
  service: HelixAgentApiService;
  localSupervisorCoordinationStore?: HelixLocalSupervisorCoordinationStore;
  reasoningTaskBindingStore?: HelixReasoningTaskBindingStore;
  desktopMcpTunnelTransitionStore?: DesktopMcpTunnelTransitionStore;
  desktopMcpTunnelTransitionExecutor?: DesktopMcpTunnelTransitionExecutor;
  mcpToolLifecycleObserver?: Parameters<
    typeof createHelixMcpServer
  >[0]["mcpToolLifecycleObserver"];
}) => McpServer;

type McpRouterDependencies = {
  service?: HelixAgentApiService;
  createServer?: HelixMcpServerFactory;
  authenticate?: (req: Request) => Promise<HelixAgentApiPrincipal>;
  authenticateDesktop?: (
    req: Request,
    allowedScopes: readonly string[],
  ) => Promise<HelixAgentApiPrincipal>;
  verifier?: HelixAgentAccessTokenVerifier;
  rateLimit?: boolean;
  enforceTransportSecurity?: boolean;
  resourceMetadataPath?: string;
  localSupervisorCoordinationStore?: HelixLocalSupervisorCoordinationStore;
  reasoningTaskBindingStore?: HelixReasoningTaskBindingStore;
  desktopMcpTunnelTransitionStore?: DesktopMcpTunnelTransitionStore;
  desktopMcpTunnelTransitionExecutor?: DesktopMcpTunnelTransitionExecutor;
  desktopDelegationScopes?: readonly string[];
};

const MCP_RESOURCE_METADATA_PATH =
  "/.well-known/oauth-protected-resource/mcp";

const jsonRpcMethodNotAllowed = (res: Response): void => {
  res.setHeader("Allow", "POST");
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message:
        "Method not allowed. This MCP resource uses stateless POST requests.",
    },
    id: null,
  });
};

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

const agentChatClaimPattern = /^agent_chat_claim_[A-Za-z0-9:._~-]+$/u;

export const protectedMcpEnvelopeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(protectedMcpEnvelopeValue);
  }
  const envelope = record(value);
  if (!envelope) return value;
  const output = { ...envelope };
  const params = record(envelope.params);
  if (
    envelope.method === "tools/call" &&
    params?.name === "helix_room_claim_chat_binding"
  ) {
    const args = record(params.arguments);
    const request = record(args?.request);
    const claimHandle = request?.claim_handle;
    if (
      typeof claimHandle === "string" &&
      agentChatClaimPattern.test(claimHandle)
    ) {
      output.params = {
        ...params,
        arguments: {
          ...args,
          request: {
            ...request,
            claim_handle: "opaque_browser_chat_claim",
          },
        },
      };
    }
  } else if (
    envelope.method === "tools/call" &&
    params?.name === "helix_reasoning_task_binding_claim"
  ) {
    const args = record(params.arguments);
    const claimHandle = args?.claim_handle;
    if (
      typeof claimHandle === "string" &&
      agentChatClaimPattern.test(claimHandle)
    ) {
      output.params = {
        ...params,
        arguments: {
          ...args,
          claim_handle: "opaque_reasoning_task_claim",
        },
      };
    }
  }
  return output;
};

export const createHelixMcpRouter = (
  dependencies: McpRouterDependencies = {},
): Router => {
  const router = Router();
  const service = dependencies.service ?? sharedLiveRoomAgentApiService;
  const createServer = dependencies.createServer ?? createHelixMcpServer;
  const verifier =
    dependencies.verifier ?? new DefaultHelixAgentAccessTokenVerifier();
  const authenticate = dependencies.authenticate ?? (async (req: Request) => {
    const nativeDesktopHeadersPresent = Boolean(
      (req.get(CASIMIR_DESKTOP_SESSION_HEADER) ?? "").trim() ||
      (req.get(DESKTOP_MCP_TUNNEL_ACCOUNT_SESSION_HEADER) ?? "").trim(),
    );
    if (
      (!(req.get("authorization") ?? "").trim() ||
        nativeDesktopHeadersPresent) &&
      dependencies.desktopDelegationScopes?.length
    ) {
      return dependencies.authenticateDesktop
        ? dependencies.authenticateDesktop(
            req,
            dependencies.desktopDelegationScopes,
          )
        : resolveHelixDesktopMcpPrincipal(
            req,
            dependencies.desktopDelegationScopes,
          );
    }
    return resolveHelixAgentApiPrincipal(req, verifier);
  });

  if (dependencies.rateLimit !== false) {
    router.use(
      createRateLimiter({
        windowMs: 60_000,
        max: Number(process.env.HELIX_MCP_IP_RATE_LIMIT ?? "120"),
        keyGenerator: (req: Request): string =>
          req.ip || req.socket.remoteAddress || "unknown",
      }),
    );
  }
  if (dependencies.enforceTransportSecurity !== false) {
    router.use(enforceHelixAgentTransportSecurity);
  }
  router.use(
    express.json({ limit: process.env.HELIX_MCP_BODY_LIMIT ?? "512kb" }),
  );
  router.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      if (
        error &&
        typeof error === "object" &&
        "type" in error &&
        (error as { type?: unknown }).type === "entity.parse.failed"
      ) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error.",
          },
          id: null,
        });
        return;
      }
      next(error);
    },
  );
  router.use((req: Request, res: Response, next: NextFunction): void => {
    const locals = res.locals as McpLocals;
    const suppliedRequestId = (req.get("x-request-id") ?? "")
      .trim()
      .slice(0, 160);
    locals.helixAgentRequestId =
      suppliedRequestId &&
      !containsSharedLiveRoomSensitiveText(suppliedRequestId)
        ? suppliedRequestId
        : `mcp_req_${crypto.randomUUID()}`;
    res.setHeader("X-Request-Id", locals.helixAgentRequestId);
    void authenticate(req)
      .then((principal: HelixAgentApiPrincipal): void => {
        locals.helixAgentPrincipal = principal;
        next();
      })
      .catch((error: unknown): void => {
        const rawMessage = error instanceof Error ? error.message : "unknown";
        const safeMessage = containsSharedLiveRoomSensitiveText(rawMessage)
          ? "redacted"
          : rawMessage.trim().slice(0, 240) || "unknown";
        console.warn(
          "[helix-mcp] authentication failed",
          locals.helixAgentRequestId ?? "unknown_request",
          error instanceof Error ? error.name : "unknown_error",
          safeMessage,
        );
        next(error);
      });
  });
  if (dependencies.rateLimit !== false) {
    router.use(
      createRateLimiter({
        windowMs: 60_000,
        max: Number(process.env.HELIX_MCP_PRINCIPAL_RATE_LIMIT ?? "240"),
        keyGenerator: (req: Request): string => {
          const principal = (req.res?.locals as McpLocals | undefined)
            ?.helixAgentPrincipal;
          return principal
            ? `${principal.tenantId}\n${principal.issuer}\n${principal.subjectId}`
            : "unverified";
        },
      }),
    );
  }

  router.post(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const principal = (res.locals as McpLocals).helixAgentPrincipal;
      if (!principal) {
        next(new Error("helix_agent_principal_missing"));
        return;
      }
      if (
        containsSharedLiveRoomSensitiveValue(
          protectedMcpEnvelopeValue(req.body),
        )
      ) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message:
              "Protected credential material is not accepted by this MCP resource.",
          },
          id: null,
        });
        return;
      }
      const envelope = record(req.body);
      if (envelope?.method === "server/discover") {
        // The installed SDK currently serves the initialization-era MCP
        // lifecycle. Newer clients probe the 2026-07-28 stateless lifecycle
        // first and fall back only when an unsupported RPC is reported as a
        // typed 404/-32601 response. Letting the older SDK see this method
        // turns the compatibility probe into an incorrect HTTP 500.
        const requestId =
          typeof envelope.id === "string" || typeof envelope.id === "number"
            ? envelope.id
            : null;
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Method not found",
          },
          id: requestId,
        });
        return;
      }
      let server: McpServer | null = null;
      let transport: StreamableHTTPServerTransport | null = null;
      const close = (): void => {
        if (transport) void transport.close();
        if (server) void server.close();
      };
      res.once("close", close);
      try {
        // Keep server construction inside the guarded transport boundary. A
        // surface-specific registration error must remain a typed MCP failure
        // with a safe operational receipt instead of escaping to Express as an
        // opaque 500.
        server = createServer({
          principal,
          service,
          localSupervisorCoordinationStore:
            dependencies.localSupervisorCoordinationStore,
          reasoningTaskBindingStore:
            dependencies.reasoningTaskBindingStore,
          desktopMcpTunnelTransitionStore:
            dependencies.desktopMcpTunnelTransitionStore,
          desktopMcpTunnelTransitionExecutor:
            dependencies.desktopMcpTunnelTransitionExecutor,
          mcpToolLifecycleObserver: async (observation) => {
            const requestId = (res.locals as McpLocals).helixAgentRequestId;
            if (!requestId) return;
            await appendMcpToolInvocationToOperatorActivity({
              owner: {
                tenantId: principal.tenantId,
                issuer: principal.issuer,
                subjectId: principal.subjectId,
                accountProfileId: principal.accountProfileId,
              },
              requestId,
              toolName: observation.toolName,
              outcome: observation.outcome,
              occurredAt: observation.occurredAt,
              observedAt: observation.observedAt,
              nodeRef:
                dependencies.localSupervisorCoordinationStore
                  ?.serviceInstanceRef,
              oauthClientRef:
                principal.oauthClientRef ?? principal.mcpClientRef ?? null,
              clientSessionRef: `mcp_client_session:${crypto
                .createHash("sha256")
                .update(principal.accountContext.session_id, "utf8")
                .digest("hex")
                .slice(0, 48)}`,
            });
          },
        });
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        await server.connect(transport);
        // Express globally gives Request.auth an application JWT shape, while
        // the MCP SDK reserves the same optional key for its AuthInfo shape.
        // This route authenticates into res.locals, so retain the request
        // object unchanged at the transport boundary.
        await transport.handleRequest(
          req as unknown as Parameters<
            StreamableHTTPServerTransport["handleRequest"]
          >[0],
          res,
          req.body,
        );
      } catch (error) {
        close();
        const rawMessage = error instanceof Error ? error.message : "unknown";
        const safeMessage = containsSharedLiveRoomSensitiveText(rawMessage)
          ? "redacted"
          : rawMessage.trim().slice(0, 240) || "unknown";
        console.warn(
          "[helix-mcp] request failed",
          (res.locals as McpLocals).helixAgentRequestId ?? "unknown_request",
          safeMessage,
        );
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal MCP server error.",
            },
            id: null,
          });
        }
      }
    },
  );
  router.get("/", (_req: Request, res: Response): void =>
    jsonRpcMethodNotAllowed(res),
  );
  router.delete("/", (_req: Request, res: Response): void =>
    jsonRpcMethodNotAllowed(res),
  );
  router.all("/", (_req: Request, res: Response): void =>
    jsonRpcMethodNotAllowed(res),
  );
  router.use(
    createHelixAgentApiErrorHandler({
      resourceMetadataPath:
        dependencies.resourceMetadataPath ?? MCP_RESOURCE_METADATA_PATH,
      // Keep transport discovery on the same loopback origin during local
      // Codex acceptance. The metadata document still advertises the
      // canonical deployed OAuth resource and issuer.
      useLoopbackRequestOrigin: true,
    }),
  );
  return router;
};
