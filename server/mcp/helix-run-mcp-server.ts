import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  HELIX_AGENT_RUN_READ_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
  helixAgentCancelRequestSchema,
  helixAgentContinueRequestSchema,
  helixAgentEvidenceBundleSchema,
  helixAgentRunEventSchema,
  helixAgentRunSchema,
  helixAgentStartRequestSchema,
  type HelixAgentCancelRequest,
  type HelixAgentContinueRequest,
  type HelixAgentStartRequest,
} from "@shared/contracts/helix-agent-api.v1";
import { requireHelixAgentApiScope } from "../auth/helix-agent-scope";
import {
  buildHelixAgentApiError,
  HelixAgentApiServiceError,
} from "../services/helix-agent-api/errors";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";

type RecordLike = Record<string, unknown>;

type HelixRunStartToolArguments = {
  idempotency_key: string;
  request: HelixAgentStartRequest;
};

type HelixRunContinueToolArguments = {
  run_id: string;
  idempotency_key: string;
  request: HelixAgentContinueRequest;
};

type HelixRunCancelToolArguments = {
  run_id: string;
  idempotency_key: string;
  request: HelixAgentCancelRequest;
};

type HelixRunIdToolArguments = {
  run_id: string;
};

type HelixRunEventsToolArguments = HelixRunIdToolArguments & {
  after_seq: number;
  limit: number;
};

type McpOAuthSecurityScheme = {
  type: "oauth2";
  scopes: string[];
};

type RequiredOAuthScopes = string | readonly string[];

type McpToolDefinitionLike = RecordLike & {
  name: string;
  _meta?: RecordLike;
};

type McpListToolsResultLike = RecordLike & {
  tools: McpToolDefinitionLike[];
};

type McpLowLevelRequestHandler = (
  request: unknown,
  extra: unknown,
) => Promise<unknown> | unknown;

type McpSdkRequestHandlerInternals = {
  _requestHandlers: Map<string, McpLowLevelRequestHandler>;
};

const projectedRunSchema = helixAgentRunSchema.partial().passthrough();

const runMutationOutputSchema = (operation: "start" | "continue" | "cancel") =>
  z
    .object({
      operation: z.literal(operation),
      idempotency_replayed: z.boolean(),
      run: projectedRunSchema,
    })
    .strict();

const runInspectOutputSchema = z
  .object({
    operation: z.literal("inspect"),
    run: projectedRunSchema,
  })
  .strict();

const runEvidenceOutputSchema = z
  .object({
    operation: z.literal("fetch_evidence"),
    evidence: helixAgentEvidenceBundleSchema,
  })
  .strict();

const runEventsOutputSchema = z
  .object({
    operation: z.literal("list_events"),
    page: z
      .object({
        schema: z.literal("helix.agent_run.events_page.v1"),
        run_id: z.string(),
        events: z.array(helixAgentRunEventSchema),
        next_after_seq: z.number().int().min(0),
        has_more: z.boolean(),
      })
      .strict(),
  })
  .strict();

const oauthSecuritySchemes = (
  requiredScopes: RequiredOAuthScopes,
): McpOAuthSecurityScheme[] => [
  {
    type: "oauth2",
    scopes:
      typeof requiredScopes === "string"
        ? [requiredScopes]
        : Array.from(new Set(requiredScopes)),
  },
];

const oauthToolMeta = (requiredScopes: RequiredOAuthScopes): RecordLike => ({
  securitySchemes: oauthSecuritySchemes(requiredScopes),
});

const quoteAuthenticateParameter = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const normalizeRequiredScopes = (
  requiredScopes: RequiredOAuthScopes,
): string[] =>
  typeof requiredScopes === "string"
    ? [requiredScopes]
    : Array.from(new Set(requiredScopes));

const oauthScopeTokenPattern = /^[\x21\x23-\x5b\x5d-\x7e]+$/;

const dynamicRequiredOAuthScopes = (
  error: HelixAgentApiServiceError,
): string[] => {
  const candidates = error.details?.required_oauth_scopes;
  if (!Array.isArray(candidates)) return [];
  return Array.from(
    new Set(
      candidates.filter(
        (candidate: unknown): candidate is string =>
          typeof candidate === "string" &&
          candidate.length <= 240 &&
          oauthScopeTokenPattern.test(candidate),
      ),
    ),
  ).slice(0, 64);
};

const challengeScopesForError = (
  error: HelixAgentApiServiceError,
  fallbackScopes: RequiredOAuthScopes,
): RequiredOAuthScopes => {
  const requiredScopes = dynamicRequiredOAuthScopes(error);
  return requiredScopes.length > 0 ? requiredScopes : fallbackScopes;
};

const insufficientScopeChallenge = (
  requiredScopes: RequiredOAuthScopes,
): string => {
  const scopes = normalizeRequiredScopes(requiredScopes);
  const scopeValue = scopes.join(" ");
  const resourceMetadataUrl =
    `${resolveCasimirPublicBaseUrl()}` +
    "/.well-known/oauth-protected-resource/mcp";
  return [
    "Bearer",
    `resource_metadata="${quoteAuthenticateParameter(resourceMetadataUrl)}"`,
    'error="insufficient_scope"',
    `error_description="${quoteAuthenticateParameter(
      `The bearer token is missing one or more required scopes: ${scopeValue}.`,
    )}"`,
    `scope="${quoteAuthenticateParameter(scopeValue)}"`,
  ].join(", ");
};

const installOAuthToolCatalogAugmentation = (
  server: McpServer,
  requiredScopesByTool: ReadonlyMap<string, RequiredOAuthScopes>,
): void => {
  /*
   * MCP SDK 1.29 serializes `_meta.securitySchemes` but currently omits the
   * top-level `securitySchemes` field required by OAuth-aware clients. Delegate
   * to the SDK's own list handler, then add the equivalent top-level field.
   * Tool execution, dispatch, and lifecycle remain owned by the SDK.
   */
  const lowLevelServer =
    server.server as unknown as McpSdkRequestHandlerInternals;
  const sdkHandler = lowLevelServer._requestHandlers?.get("tools/list");
  if (!sdkHandler) {
    throw new Error("mcp_sdk_tools_list_handler_unavailable");
  }
  server.server.setRequestHandler(
    ListToolsRequestSchema,
    async (request: unknown, extra: unknown) => {
      const result = (await sdkHandler(
        request,
        extra,
      )) as McpListToolsResultLike;
      return {
        ...result,
        tools: result.tools.map((tool: McpToolDefinitionLike) => {
          const requiredScopes = requiredScopesByTool.get(tool.name);
          if (!requiredScopes) return tool;
          const securitySchemes = oauthSecuritySchemes(requiredScopes);
          return {
            ...tool,
            securitySchemes,
            _meta: {
              ...(tool._meta ?? {}),
              securitySchemes,
            },
          };
        }),
      } as never;
    },
  );
};

const toolSuccess = (value: RecordLike) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(value),
    },
  ],
  structuredContent: value,
});

const toolError = (error: unknown, requiredScopes: RequiredOAuthScopes) => {
  const normalized =
    error instanceof HelixAgentApiServiceError
      ? error
      : new HelixAgentApiServiceError(
          500,
          "internal_error",
          "The Helix agent tool could not complete the request.",
          true,
        );
  const value = buildHelixAgentApiError({
    error: normalized,
    requestId: null,
  });
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
    structuredContent: value,
    ...(normalized.code === "insufficient_scope"
      ? {
          _meta: {
            "mcp/www_authenticate": [
              insufficientScopeChallenge(
                challengeScopesForError(normalized, requiredScopes),
              ),
            ],
          },
        }
      : {}),
  };
};

const callTool = async (
  requiredScopes: RequiredOAuthScopes,
  operation: () => Promise<RecordLike>,
) => {
  try {
    return toolSuccess(await operation());
  } catch (error) {
    return toolError(error, requiredScopes);
  }
};

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .describe(
    "Caller-stable idempotency key; JSON-RPC request IDs are not substitutes.",
  );

const runIdSchema = z
  .string()
  .trim()
  .regex(/^run_[A-Za-z0-9._:-]{8,200}$/)
  .describe("Opaque durable run ID returned by helix_run_start.");

export const HELIX_RUN_MCP_TOOL_SCOPES: ReadonlyMap<
  string,
  RequiredOAuthScopes
> = new Map([
  ["helix_run_start", HELIX_AGENT_RUN_WRITE_SCOPE],
  ["helix_run_continue", HELIX_AGENT_RUN_WRITE_SCOPE],
  ["helix_run_cancel", HELIX_AGENT_RUN_WRITE_SCOPE],
  ["helix_run_inspect", HELIX_AGENT_RUN_READ_SCOPE],
  ["helix_run_fetch_evidence", HELIX_AGENT_RUN_READ_SCOPE],
  ["helix_run_list_events", HELIX_AGENT_RUN_READ_SCOPE],
]);

export type HelixRunMcpServerInput = {
  principal: HelixAgentApiPrincipal;
  service: HelixRunMcpServicePort;
};

export type HelixRunMcpServicePort = {
  startRun(input: {
    principal: HelixAgentApiPrincipal;
    idempotencyKey: string;
    request: HelixAgentStartRequest;
  }): Promise<{ body: unknown; idempotencyReplayed: boolean }>;
  continueRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    idempotencyKey: string;
    request: HelixAgentContinueRequest;
  }): Promise<{ body: unknown; idempotencyReplayed: boolean }>;
  cancelRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    idempotencyKey: string;
    request: HelixAgentCancelRequest;
  }): Promise<{ body: unknown; idempotencyReplayed: boolean }>;
  inspectRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
  }): Promise<unknown>;
  fetchEvidence(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
  }): Promise<unknown>;
  listEvents(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    afterSeq: number;
    limit: number;
  }): Promise<unknown>;
};

export const createHelixRunMcpServer = (
  input: HelixRunMcpServerInput,
): McpServer => {
  const service = input.service;
  const server = new McpServer(
    {
      name: "casimirbot-helix-agent",
      version: "1.0.0",
    },
    {
      instructions: [
        "Use the durable run_id returned by helix_run_start for all later calls.",
        "Mutations require a caller-stable idempotency_key and continuations require expected_version.",
        "completion_status and terminal_authority_status are separate. Evidence and MCP tool output are not assistant answers.",
        "Continue only while progress is possible and within the declared run budget.",
      ].join(" "),
    },
  );

  server.registerTool(
    "helix_run_start",
    {
      title: "Start a durable Helix agent run",
      description:
        "Creates a tenant/account-owned bounded run. It stores the objective and completion contract but does not itself claim the objective is solved.",
      inputSchema: z
        .object({
          idempotency_key: idempotencyKeySchema,
          request: helixAgentStartRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("start"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ idempotency_key, request }: HelixRunStartToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.startRun({
          principal: input.principal,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "start",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_continue",
    {
      title: "Continue a durable Helix agent run",
      description:
        "Runs one bounded continuation through the full Helix Ask solver and persists evidence and terminal-authority projection.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixAgentContinueRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("continue"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({
      run_id,
      idempotency_key,
      request,
    }: HelixRunContinueToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.continueRun({
          principal: input.principal,
          runId: run_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "continue",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_cancel",
    {
      title: "Cancel a durable Helix agent run",
      description:
        "Irreversibly closes a nonterminal run for further continuation while preserving its durable audit events.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixAgentCancelRequestSchema,
        })
        .strict(),
      outputSchema: runMutationOutputSchema("cancel"),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_WRITE_SCOPE),
    },
    async ({ run_id, idempotency_key, request }: HelixRunCancelToolArguments) =>
      callTool(HELIX_AGENT_RUN_WRITE_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_WRITE_SCOPE);
        const result = await service.cancelRun({
          principal: input.principal,
          runId: run_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "cancel",
          idempotency_replayed: result.idempotencyReplayed,
          run: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_run_inspect",
    {
      title: "Inspect a durable Helix agent run",
      description:
        "Returns the owner-scoped run snapshot, bounded status, completion status, and terminal-authority status.",
      inputSchema: z.object({ run_id: runIdSchema }).strict(),
      outputSchema: runInspectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id }: HelixRunIdToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "inspect",
          run: await service.inspectRun({
            principal: input.principal,
            runId: run_id,
          }),
        };
      }),
  );

  server.registerTool(
    "helix_run_fetch_evidence",
    {
      title: "Fetch a run evidence bundle",
      description:
        "Returns normalized evidence and receipt references. The bundle is supporting evidence, never terminal answer authority.",
      inputSchema: z.object({ run_id: runIdSchema }).strict(),
      outputSchema: runEvidenceOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id }: HelixRunIdToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "fetch_evidence",
          evidence: await service.fetchEvidence({
            principal: input.principal,
            runId: run_id,
          }),
        };
      }),
  );

  server.registerTool(
    "helix_run_list_events",
    {
      title: "List durable run events",
      description:
        "Returns a monotonically sequenced owner-scoped event page for polling and audit.",
      inputSchema: z
        .object({
          run_id: runIdSchema,
          after_seq: z.number().int().min(0).default(0),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .strict(),
      outputSchema: runEventsOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_AGENT_RUN_READ_SCOPE),
    },
    async ({ run_id, after_seq, limit }: HelixRunEventsToolArguments) =>
      callTool(HELIX_AGENT_RUN_READ_SCOPE, async () => {
        requireHelixAgentApiScope(input.principal, HELIX_AGENT_RUN_READ_SCOPE);
        return {
          operation: "list_events",
          page: await service.listEvents({
            principal: input.principal,
            runId: run_id,
            afterSeq: after_seq,
            limit,
          }),
        };
      }),
  );

  installOAuthToolCatalogAugmentation(server, HELIX_RUN_MCP_TOOL_SCOPES);
  return server;
};
