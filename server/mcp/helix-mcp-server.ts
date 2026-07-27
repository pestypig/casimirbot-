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
import {
  HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY,
  HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA,
  HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
  helixSharedLiveRoomChatBindingClaimRequestSchema,
  helixSharedLiveRoomChatBindingRevokeRequestSchema,
  helixSharedLiveRoomCreateRequestSchema,
  helixSharedLiveRoomErrorSchema,
  helixSharedLiveRoomIdSchema,
  helixSharedLiveRoomRunBindingRequestSchema,
  helixSharedLiveRoomRunBindingRevokeRequestSchema,
  helixSharedLiveRoomSourceCreateRequestSchema,
  type HelixSharedLiveRoomChatBindingClaimRequest,
  type HelixSharedLiveRoomChatBindingRevokeRequest,
  type HelixSharedLiveRoomCreateRequest,
  type HelixSharedLiveRoomRunBindingRequest,
  type HelixSharedLiveRoomRunBindingRevokeRequest,
  type HelixSharedLiveRoomSourceCreateRequest,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { requireHelixAgentApiScope } from "../auth/helix-agent-principal";
import {
  buildHelixAgentApiError,
  HelixAgentApiService,
  HelixAgentApiServiceError,
} from "../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";
import { SharedLiveRoomBindingStore } from "../services/shared-live-room-control/binding-store";
import {
  getSharedLiveRoomBindingStore,
  getSharedLiveRoomControlService,
} from "../services/shared-live-room-control/default-service";
import { buildSharedLiveRoomExternalError } from "../services/shared-live-room-control/external-errors";
import { sharedLiveRoomAgentApiService } from "../services/shared-live-room-control/agent-api-service";
import {
  buildSharedLiveRoomControlActorFromAgentPrincipal,
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
} from "../services/shared-live-room-control/service";
import {
  projectSharedLiveRoomChatBindingClaimReceipt,
  projectSharedLiveRoomChatBindingUnbindReceipt,
  projectSharedLiveRoomRunBindingReceipt,
  projectSharedLiveRoomRunUnbindReceipt,
} from "../services/shared-live-room-control/external-projections";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";

type RecordLike = Record<string, unknown>;

const HELIX_ROOM_RUN_ATTACHMENT_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_AGENT_RUN_WRITE_SCOPE,
] as const;

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

type HelixRoomCreateToolArguments = {
  idempotency_key: string;
  request: HelixSharedLiveRoomCreateRequest;
};

type HelixRoomIdToolArguments = {
  room_id: string;
};

type HelixRoomSourceCreateToolArguments = HelixRoomIdToolArguments & {
  idempotency_key: string;
  request: HelixSharedLiveRoomSourceCreateRequest;
};

type HelixRoomRunBindToolArguments = {
  request: HelixSharedLiveRoomRunBindingRequest;
};

type HelixRoomChatBindingClaimToolArguments = {
  request: HelixSharedLiveRoomChatBindingClaimRequest;
};

type HelixRoomRunUnbindToolArguments =
  HelixSharedLiveRoomRunBindingRevokeRequest;

type HelixRoomChatBindingUnbindToolArguments =
  HelixSharedLiveRoomChatBindingRevokeRequest;

type HelixRoomCommandRequestToolArguments = HelixRoomIdToolArguments & {
  command: string;
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

const jsonObjectSchema = z.object({}).passthrough();
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

const roomReceiptAuthorityFields = {
  api_version: z.literal(HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION),
  ok: z.literal(true),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
};

const roomListOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_LIST_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_LIST_CAPABILITY),
    content_role: z.literal("room_control_observation_not_assistant_answer"),
    rooms: z.array(jsonObjectSchema),
  })
  .passthrough();

const roomInspectOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_INSPECT_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_INSPECT_CAPABILITY),
    content_role: z.literal("room_control_observation_not_assistant_answer"),
    room: jsonObjectSchema,
  })
  .passthrough();

const roomCreateReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CREATE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CREATE_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    room: jsonObjectSchema,
  })
  .passthrough();

const roomCreateOutputSchema = z
  .object({
    operation: z.literal("room.create"),
    idempotency_replayed: z.boolean(),
    receipt: roomCreateReceiptOutputSchema,
  })
  .strict();

const roomRunBindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_BIND_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_BIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    run_id: z.string(),
    room_id: z.string(),
    binding_status: z.literal("active"),
    version: z.number().int().positive(),
  })
  .strict();

const roomChatBindingClaimOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_CLAIM_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    run_id: z.string(),
    binding_status: z.literal("active"),
    context_snapshot_ref: z.string().nullable(),
    context_message_count: z.number().int().min(0),
    context_char_count: z.number().int().min(0),
  })
  .strict();

const roomRunUnbindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_RUN_UNBIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    binding_status: z.literal("revoked"),
    revocation_status: z.enum(["revoked", "already_revoked"]),
  })
  .strict();

const roomChatBindingUnbindOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(
      HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_RECEIPT_SCHEMA,
    ),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_CHAT_BINDING_UNBIND_CAPABILITY),
    content_role: z.literal("room_control_receipt_not_assistant_answer"),
    binding_ref: z.string(),
    binding_status: z.literal("revoked"),
    revocation_status: z.enum(["revoked", "already_revoked"]),
  })
  .strict();

const roomSourceListOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_LIST_CAPABILITY),
    content_role: z.literal("source_binding_observation_not_assistant_answer"),
    room_id: z.string(),
    bindings: z.array(jsonObjectSchema),
  })
  .passthrough();

const roomSourceCreateReceiptOutputSchema = z
  .object({
    ...roomReceiptAuthorityFields,
    schema: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_RECEIPT_SCHEMA),
    operation: z.literal(HELIX_SHARED_LIVE_ROOM_SOURCE_CREATE_CAPABILITY),
    content_role: z.literal("source_binding_receipt_not_assistant_answer"),
    room_id: z.string(),
    binding: jsonObjectSchema,
    credential_delivery: jsonObjectSchema,
    execution_enabled: z.literal(false),
    command_execution_enabled: z.literal(false),
  })
  .passthrough();

const roomSourceCreateOutputSchema = z
  .object({
    operation: z.literal("room.source.create"),
    idempotency_replayed: z.boolean(),
    receipt: roomSourceCreateReceiptOutputSchema,
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

const roomToolError = (error: unknown, requiredScopes: RequiredOAuthScopes) => {
  const value = buildSharedLiveRoomExternalError({
    error,
    requestId: null,
  }).body;
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
    structuredContent: value as unknown as RecordLike,
    ...(value.error === "insufficient_scope"
      ? {
          _meta: {
            "mcp/www_authenticate": [
              insufficientScopeChallenge(requiredScopes),
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

const callRoomTool = async (
  requiredScopes: RequiredOAuthScopes,
  operation: () => Promise<RecordLike>,
) => {
  try {
    return toolSuccess(await operation());
  } catch (error) {
    return roomToolError(error, requiredScopes);
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

export const createHelixMcpServer = (input: {
  principal: HelixAgentApiPrincipal;
  service?: HelixAgentApiService;
  roomControlService?: SharedLiveRoomControlService;
  roomBindingStore?: Pick<
    SharedLiveRoomBindingStore,
    | "bindRunToRoom"
    | "claimPendingChatBinding"
    | "revokeRunRoomBindingForOwner"
    | "revokeClaimedRunChatBindingForOwner"
  >;
}): McpServer => {
  const service = input.service ?? sharedLiveRoomAgentApiService;
  const roomControlService =
    input.roomControlService ?? getSharedLiveRoomControlService();
  const roomBindingStore =
    input.roomBindingStore ?? getSharedLiveRoomBindingStore();
  const roomActor = buildSharedLiveRoomControlActorFromAgentPrincipal(
    input.principal,
  );
  const roomOwner = {
    tenantId: input.principal.tenantId,
    issuer: input.principal.issuer,
    subjectId: input.principal.subjectId,
    accountProfileId: input.principal.accountProfileId,
  };
  const requireCurrentRoomFeature = (): void => {
    const policy = input.principal.accountContext.account_policy;
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
  const requireAllAgentScopes = (requiredScopes: readonly string[]): void => {
    const missing = Array.from(
      new Set(
        requiredScopes.filter(
          (scope: string) => !input.principal.scopes.has(scope),
        ),
      ),
    );
    if (missing.length === 0) return;
    throw new HelixAgentApiServiceError(
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
        "Room and source receipts are non-authoritative; source creation returns only an opaque secure-delivery handle, never a source bearer.",
        "Shared Live Room command execution is disabled and sensor credentials are never action credentials.",
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

  server.registerTool(
    "helix_room_list",
    {
      title: "List Shared Live Rooms",
      description:
        "Lists only rooms visible to the verified linked Helix account. The receipt is an observation and never an assistant answer.",
      inputSchema: z.object({}).strict(),
      outputSchema: roomListOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async () =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        return (await roomControlService.listRooms({
          actor: roomActor,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_inspect",
    {
      title: "Inspect a Shared Live Room",
      description:
        "Inspects one opaque room ID after current account membership and policy checks.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
        })
        .strict(),
      outputSchema: roomInspectOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_READ_SCOPE),
    },
    async ({ room_id }: HelixRoomIdToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_READ_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        );
        return (await roomControlService.inspectRoom({
          actor: roomActor,
          roomId: room_id,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_create",
    {
      title: "Create a Shared Live Room",
      description:
        "Idempotently creates a room owned by the verified linked Helix account. Caller-provided identity fields are not accepted.",
      inputSchema: z
        .object({
          idempotency_key: idempotencyKeySchema,
          request: helixSharedLiveRoomCreateRequestSchema,
        })
        .strict(),
      outputSchema: roomCreateOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({ idempotency_key, request }: HelixRoomCreateToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        const result = await roomControlService.createRoom({
          actor: roomActor,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "room.create",
          idempotency_replayed: result.idempotencyReplayed,
          receipt: result.body,
        };
      }),
  );

  server.registerTool(
    "helix_room_bind_run",
    {
      title: "Bind a durable agent run to a Shared Live Room",
      description:
        "Creates the exact owner-scoped run-to-room binding. A run cannot be rebound to a different room.",
      inputSchema: z
        .object({
          request: helixSharedLiveRoomRunBindingRequestSchema,
        })
        .strict(),
      outputSchema: roomRunBindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ request }: HelixRoomRunBindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        requireCurrentRoomFeature();
        const binding = await roomBindingStore.bindRunToRoom({
          owner: roomOwner,
          runId: request.run_id,
          roomId: request.room_id,
        });
        return projectSharedLiveRoomRunBindingReceipt(
          binding,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_claim_chat_binding",
    {
      title: "Claim a browser-authorized chat binding",
      description:
        "Consumes one opaque browser-issued claim handle for the exact verified account and run. It never enumerates chat sessions or returns a chat ID.",
      inputSchema: z
        .object({
          request: helixSharedLiveRoomChatBindingClaimRequestSchema,
        })
        .strict(),
      outputSchema: roomChatBindingClaimOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ request }: HelixRoomChatBindingClaimToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        requireCurrentRoomFeature();
        const binding = await roomBindingStore.claimPendingChatBinding({
          owner: roomOwner,
          runId: request.run_id,
          claimHandle: request.claim_handle,
        });
        return projectSharedLiveRoomChatBindingClaimReceipt(
          binding,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_unbind_run",
    {
      title: "Withdraw a run-to-room binding",
      description:
        "Revokes one exact owner-scoped run-to-room binding by opaque binding reference. Repeating the same withdrawal returns an already-revoked receipt.",
      inputSchema: helixSharedLiveRoomRunBindingRevokeRequestSchema,
      outputSchema: roomRunUnbindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ binding_ref }: HelixRoomRunUnbindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        const result = await roomBindingStore.revokeRunRoomBindingForOwner({
          owner: roomOwner,
          bindingRef: binding_ref,
        });
        return projectSharedLiveRoomRunUnbindReceipt(
          result,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_unbind_chat",
    {
      title: "Withdraw a claimed run-to-chat binding",
      description:
        "Revokes one exact owner-scoped claimed run-to-chat binding by opaque binding reference. It never returns the chat ID or stored context.",
      inputSchema: helixSharedLiveRoomChatBindingRevokeRequestSchema,
      outputSchema: roomChatBindingUnbindOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_ROOM_RUN_ATTACHMENT_SCOPES),
    },
    async ({ binding_ref }: HelixRoomChatBindingUnbindToolArguments) =>
      callRoomTool(HELIX_ROOM_RUN_ATTACHMENT_SCOPES, async () => {
        requireAllAgentScopes(HELIX_ROOM_RUN_ATTACHMENT_SCOPES);
        const result =
          await roomBindingStore.revokeClaimedRunChatBindingForOwner({
            owner: roomOwner,
            bindingRef: binding_ref,
          });
        return projectSharedLiveRoomChatBindingUnbindReceipt(
          result,
        ) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_command_request",
    {
      title: "Request a Shared Live Room command (disabled)",
      description:
        "Command execution is not enabled. This tool always returns command_execution_not_enabled and never accepts sensor credentials for actions.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          command: z.string().trim().min(1).max(2_048),
        })
        .strict(),
      outputSchema: helixSharedLiveRoomErrorSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE),
    },
    async ({
      room_id: _roomId,
      command: _command,
    }: HelixRoomCommandRequestToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
        );
        requireCurrentRoomFeature();
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
      }),
  );

  server.registerTool(
    "helix_room_source_list",
    {
      title: "List room source bindings",
      description:
        "Lists bounded non-authoritative source-binding projections for a developer-owned room. Credentials are never included.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
        })
        .strict(),
      outputSchema: roomSourceListOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async ({ room_id }: HelixRoomIdToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        return (await roomControlService.listSourceBindings({
          actor: roomActor,
          roomId: room_id,
        })) as unknown as RecordLike;
      }),
  );

  server.registerTool(
    "helix_room_source_create",
    {
      title: "Create a deferred room source binding",
      description:
        "Idempotently creates source identity and returns only an opaque short-lived secure-delivery handle. It never returns the source bearer or plugin configuration.",
      inputSchema: z
        .object({
          room_id: helixSharedLiveRoomIdSchema,
          idempotency_key: idempotencyKeySchema,
          request: helixSharedLiveRoomSourceCreateRequestSchema,
        })
        .strict(),
      outputSchema: roomSourceCreateOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: oauthToolMeta(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE),
    },
    async ({
      room_id,
      idempotency_key,
      request,
    }: HelixRoomSourceCreateToolArguments) =>
      callRoomTool(HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE, async () => {
        requireHelixAgentApiScope(
          input.principal,
          HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE,
        );
        const result = await roomControlService.createSourceBinding({
          actor: roomActor,
          roomId: room_id,
          idempotencyKey: idempotency_key,
          request,
        });
        return {
          operation: "room.source.create",
          idempotency_replayed: result.idempotencyReplayed,
          receipt: result.body,
        };
      }),
  );

  installOAuthToolCatalogAugmentation(
    server,
    new Map<string, RequiredOAuthScopes>([
      ["helix_run_start", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_continue", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_cancel", HELIX_AGENT_RUN_WRITE_SCOPE],
      ["helix_run_inspect", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_fetch_evidence", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_run_list_events", HELIX_AGENT_RUN_READ_SCOPE],
      ["helix_room_list", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_inspect", HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      ["helix_room_create", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_bind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_claim_chat_binding", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_run", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_unbind_chat", HELIX_ROOM_RUN_ATTACHMENT_SCOPES],
      ["helix_room_command_request", HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE],
      ["helix_room_source_list", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
      ["helix_room_source_create", HELIX_SHARED_LIVE_ROOM_SOURCE_MANAGE_SCOPE],
    ]),
  );
  return server;
};
