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
  type HelixAgentAccessTokenVerifier,
} from "../auth/helix-agent-principal";
import { createHelixMcpServer } from "../mcp/helix-mcp-server";
import { createRateLimiter } from "../middleware/rate-limit";
import { HelixAgentApiService } from "../services/helix-agent-api/service";
import { sharedLiveRoomAgentApiService } from "../services/shared-live-room-control/agent-api-service";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import {
  containsSharedLiveRoomSensitiveText,
  containsSharedLiveRoomSensitiveValue,
} from "../services/shared-live-room-control/sensitive-text";
import {
  enforceHelixAgentTransportSecurity,
  handleHelixAgentApiError,
} from "./helix-agent-api";

type McpLocals = {
  helixAgentPrincipal?: HelixAgentApiPrincipal;
  helixAgentRequestId?: string;
};

export type HelixMcpServerFactory = (input: {
  principal: HelixAgentApiPrincipal;
  service: HelixAgentApiService;
}) => McpServer;

type McpRouterDependencies = {
  service?: HelixAgentApiService;
  createServer?: HelixMcpServerFactory;
  authenticate?: (req: Request) => Promise<HelixAgentApiPrincipal>;
  verifier?: HelixAgentAccessTokenVerifier;
  rateLimit?: boolean;
  enforceTransportSecurity?: boolean;
};

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

const protectedMcpEnvelopeValue = (value: unknown): unknown => {
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
  const authenticate =
    dependencies.authenticate ??
    ((req: Request) => resolveHelixAgentApiPrincipal(req, verifier));

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
      .catch(next);
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
      const server = createServer({
        principal,
        service,
      });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const close = (): void => {
        void transport.close();
        void server.close();
      };
      res.once("close", close);
      try {
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
      } catch {
        close();
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
  router.use(handleHelixAgentApiError);
  return router;
};
