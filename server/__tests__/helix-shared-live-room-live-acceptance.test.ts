import { describe, expect, it, vi } from "vitest";
import {
  HELIX_SHARED_LIVE_ROOM_MCP_TOOLS,
  runSharedLiveRoomLiveAcceptance,
  validateSharedLiveRoomToolCatalog,
  type FetchLike,
} from "../../scripts/lib/helix-shared-live-room-live-acceptance";

const PUBLIC_BASE_URL = "https://casimirbot.test";
const MCP_URL = `${PUBLIC_BASE_URL}/mcp`;
const AGENT_RUN_URL = `${PUBLIC_BASE_URL}/api/v1/agent-runs`;
const ROOM_URL = `${PUBLIC_BASE_URL}/api/v1/rooms`;
const PROTECTED_RESOURCE_URL = `${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource/mcp`;

type RoomToolName = (typeof HELIX_SHARED_LIVE_ROOM_MCP_TOOLS)[number];

type MutableJsonSchema = {
  type?: string;
  const?: unknown;
  properties?: Record<string, MutableJsonSchema>;
  required?: string[];
};

const jsonResponse = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

const ROOM_TOOL_METADATA: Record<
  RoomToolName,
  {
    scopes: string[];
    annotations: {
      readOnlyHint: boolean;
      destructiveHint: boolean;
      idempotentHint: boolean;
      openWorldHint: boolean;
    };
  }
> = {
  helix_room_list: {
    scopes: ["helix.rooms.read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_inspect: {
    scopes: ["helix.rooms.read"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_create: {
    scopes: ["helix.rooms.manage"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_bind_run: {
    scopes: ["helix.rooms.manage", "helix.agent_runs.write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_claim_chat_binding: {
    scopes: ["helix.rooms.manage", "helix.agent_runs.write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  helix_room_unbind_run: {
    scopes: ["helix.rooms.manage", "helix.agent_runs.write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_unbind_chat: {
    scopes: ["helix.rooms.manage", "helix.agent_runs.write"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_command_request: {
    scopes: ["helix.rooms.manage"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_source_list: {
    scopes: ["helix.room_sources.manage"],
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  helix_room_source_create: {
    scopes: ["helix.room_sources.manage"],
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
};

const INPUT_PROPERTIES: Record<RoomToolName, string[]> = {
  helix_room_list: [],
  helix_room_inspect: ["room_id"],
  helix_room_create: ["idempotency_key", "request"],
  helix_room_bind_run: ["request"],
  helix_room_claim_chat_binding: ["request"],
  helix_room_unbind_run: ["binding_ref"],
  helix_room_unbind_chat: ["binding_ref"],
  helix_room_command_request: ["command", "room_id"],
  helix_room_source_list: ["room_id"],
  helix_room_source_create: ["idempotency_key", "request", "room_id"],
};

const INPUT_TYPES: Record<
  RoomToolName,
  Record<string, "integer" | "object" | "string">
> = {
  helix_room_list: {},
  helix_room_inspect: { room_id: "string" },
  helix_room_create: {
    idempotency_key: "string",
    request: "object",
  },
  helix_room_bind_run: { request: "object" },
  helix_room_claim_chat_binding: { request: "object" },
  helix_room_unbind_run: { binding_ref: "string" },
  helix_room_unbind_chat: { binding_ref: "string" },
  helix_room_command_request: {
    command: "string",
    room_id: "string",
  },
  helix_room_source_list: { room_id: "string" },
  helix_room_source_create: {
    idempotency_key: "string",
    request: "object",
    room_id: "string",
  },
};

const NESTED_INPUTS: Partial<
  Record<
    RoomToolName,
    Record<
      string,
      {
        properties: Record<string, "integer" | "string">;
        required: string[];
      }
    >
  >
> = {
  helix_room_create: {
    request: {
      properties: { title: "string" },
      required: [],
    },
  },
  helix_room_bind_run: {
    request: {
      properties: { room_id: "string", run_id: "string" },
      required: ["room_id", "run_id"],
    },
  },
  helix_room_claim_chat_binding: {
    request: {
      properties: { claim_handle: "string", run_id: "string" },
      required: ["claim_handle", "run_id"],
    },
  },
  helix_room_source_create: {
    request: {
      properties: {
        domain_adapter: "string",
        source_label: "string",
        ttl_ms: "integer",
        world_id: "string",
      },
      required: [],
    },
  },
};

const AUTHORITY_OUTPUT_FIELDS = [
  "answer_authority",
  "api_version",
  "assistant_answer",
  "content_role",
  "ok",
  "operation",
  "raw_content_included",
  "reentry_required",
  "schema",
  "terminal_eligible",
];

const OUTPUT_REQUIRED: Record<RoomToolName, string[]> = {
  helix_room_list: [...AUTHORITY_OUTPUT_FIELDS, "rooms"],
  helix_room_inspect: [...AUTHORITY_OUTPUT_FIELDS, "room"],
  helix_room_create: ["idempotency_replayed", "operation", "receipt"],
  helix_room_bind_run: [
    ...AUTHORITY_OUTPUT_FIELDS,
    "binding_ref",
    "binding_status",
    "room_id",
    "run_id",
    "version",
  ],
  helix_room_claim_chat_binding: [
    ...AUTHORITY_OUTPUT_FIELDS,
    "binding_ref",
    "binding_status",
    "context_char_count",
    "context_message_count",
    "context_snapshot_ref",
    "run_id",
  ],
  helix_room_unbind_run: [
    ...AUTHORITY_OUTPUT_FIELDS,
    "binding_ref",
    "binding_status",
    "revocation_status",
  ],
  helix_room_unbind_chat: [
    ...AUTHORITY_OUTPUT_FIELDS,
    "binding_ref",
    "binding_status",
    "revocation_status",
  ],
  helix_room_command_request: [
    "api_version",
    "error",
    "message",
    "request_id",
    "retryable",
    "schema",
  ],
  helix_room_source_list: [...AUTHORITY_OUTPUT_FIELDS, "bindings", "room_id"],
  helix_room_source_create: ["idempotency_replayed", "operation", "receipt"],
};

const NONTERMINAL_LITERALS = {
  answer_authority: false,
  api_version: "v1",
  assistant_answer: false,
  ok: true,
  raw_content_included: false,
  reentry_required: true,
  terminal_eligible: false,
};

const OUTPUT_LITERALS: Record<
  RoomToolName,
  Record<string, string | boolean>
> = {
  helix_room_list: {
    ...NONTERMINAL_LITERALS,
    content_role: "room_control_observation_not_assistant_answer",
    operation: "room.list",
    schema: "helix.shared_live_room.list_receipt.v1",
  },
  helix_room_inspect: {
    ...NONTERMINAL_LITERALS,
    content_role: "room_control_observation_not_assistant_answer",
    operation: "room.inspect",
    schema: "helix.shared_live_room.inspect_receipt.v1",
  },
  helix_room_create: { operation: "room.create" },
  helix_room_bind_run: {
    ...NONTERMINAL_LITERALS,
    binding_status: "active",
    content_role: "room_control_receipt_not_assistant_answer",
    operation: "room.run.bind",
    schema: "helix.shared_live_room.run_bind_receipt.v1",
  },
  helix_room_claim_chat_binding: {
    ...NONTERMINAL_LITERALS,
    binding_status: "active",
    content_role: "room_control_receipt_not_assistant_answer",
    operation: "room.chat_binding.claim",
    schema: "helix.shared_live_room.chat_binding_claim_receipt.v1",
  },
  helix_room_unbind_run: {
    ...NONTERMINAL_LITERALS,
    binding_status: "revoked",
    content_role: "room_control_receipt_not_assistant_answer",
    operation: "room.run.unbind",
    schema: "helix.shared_live_room.run_unbind_receipt.v1",
  },
  helix_room_unbind_chat: {
    ...NONTERMINAL_LITERALS,
    binding_status: "revoked",
    content_role: "room_control_receipt_not_assistant_answer",
    operation: "room.chat_binding.unbind",
    schema: "helix.shared_live_room.chat_binding_unbind_receipt.v1",
  },
  helix_room_command_request: {
    api_version: "v1",
    schema: "helix.shared_live_room.error.v1",
  },
  helix_room_source_list: {
    ...NONTERMINAL_LITERALS,
    content_role: "source_binding_observation_not_assistant_answer",
    operation: "room.source.list",
    schema: "helix.shared_live_room.source_list_receipt.v1",
  },
  helix_room_source_create: { operation: "room.source.create" },
};

const NESTED_OUTPUTS: Partial<
  Record<
    RoomToolName,
    Record<
      string,
      {
        required: string[];
        literals: Record<string, string | boolean>;
      }
    >
  >
> = {
  helix_room_create: {
    receipt: {
      required: [...AUTHORITY_OUTPUT_FIELDS, "room"],
      literals: {
        ...NONTERMINAL_LITERALS,
        content_role: "room_control_receipt_not_assistant_answer",
        operation: "room.create",
        schema: "helix.shared_live_room.create_receipt.v1",
      },
    },
  },
  helix_room_source_create: {
    receipt: {
      required: [
        ...AUTHORITY_OUTPUT_FIELDS,
        "binding",
        "command_execution_enabled",
        "credential_delivery",
        "execution_enabled",
        "room_id",
      ],
      literals: {
        ...NONTERMINAL_LITERALS,
        command_execution_enabled: false,
        content_role: "source_binding_receipt_not_assistant_answer",
        execution_enabled: false,
        operation: "room.source.create",
        schema: "helix.shared_live_room.source_create_receipt.v1",
      },
    },
  },
};

const schemaForLiteral = (value: string | boolean) => ({
  type: typeof value,
  const: value,
});

const inputPropertySchema = (name: RoomToolName, property: string) => {
  const type = INPUT_TYPES[name][property];
  const nested = NESTED_INPUTS[name]?.[property];
  if (!nested) return { type };
  return {
    type,
    properties: Object.fromEntries(
      Object.entries(nested.properties).map(([key, nestedType]) => [
        key,
        { type: nestedType },
      ]),
    ),
    required: nested.required,
    additionalProperties: false,
  };
};

const outputPropertySchema = (name: RoomToolName, property: string) => {
  const literal = OUTPUT_LITERALS[name][property];
  if (literal !== undefined) return schemaForLiteral(literal);
  const nested = NESTED_OUTPUTS[name]?.[property];
  if (!nested) return {};
  return {
    type: "object",
    properties: Object.fromEntries([
      ...nested.required.map((nestedProperty) => [nestedProperty, {}]),
      ...Object.entries(nested.literals).map(
        ([nestedProperty, nestedLiteral]) => [
          nestedProperty,
          schemaForLiteral(nestedLiteral),
        ],
      ),
    ]),
    required: nested.required,
    additionalProperties: true,
  };
};

const validRoomTool = (name: RoomToolName) => ({
  name,
  title: `Title for ${name}`,
  description: `Description for ${name}`,
  inputSchema: {
    type: "object",
    properties: Object.fromEntries(
      INPUT_PROPERTIES[name].map((property) => [
        property,
        inputPropertySchema(name, property),
      ]),
    ),
    required: INPUT_PROPERTIES[name],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: Object.fromEntries(
      OUTPUT_REQUIRED[name].map((property) => [
        property,
        outputPropertySchema(name, property),
      ]),
    ),
    required: OUTPUT_REQUIRED[name],
    additionalProperties: true,
  },
  annotations: ROOM_TOOL_METADATA[name].annotations,
  securitySchemes: [
    {
      type: "oauth2",
      scopes: ROOM_TOOL_METADATA[name].scopes,
    },
  ],
});

const nonterminalProjection = (extra: Record<string, unknown> = {}) => ({
  ...extra,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const roomReceipt = (
  schema: string,
  operation: string,
  extra: Record<string, unknown> = {},
) =>
  nonterminalProjection({
    ...extra,
    schema,
    api_version: "v1",
    ok: true,
    operation,
    content_role:
      operation === "room.list" || operation === "room.inspect"
        ? "room_control_observation_not_assistant_answer"
        : operation === "room.source.list"
          ? "source_binding_observation_not_assistant_answer"
          : operation === "room.source.create"
            ? "source_binding_receipt_not_assistant_answer"
            : "room_control_receipt_not_assistant_answer",
    reentry_required: true,
  });

const agentRunProjection = (extra: Record<string, unknown> = {}) =>
  nonterminalProjection({
    ...extra,
    schema: "helix.agent_run.v1",
    api_version: "v1",
  });

const disabledCommandError = () => ({
  schema: "helix.shared_live_room.error.v1",
  api_version: "v1",
  error: "command_execution_not_enabled",
  message: "Shared Live Room command execution is not enabled.",
  request_id: null,
  retryable: false,
  details: {
    execution_enabled: false,
    sensor_credentials_accepted: false,
  },
});

const mcpToolResponse = (
  request: Record<string, unknown>,
  structuredContent: Record<string, unknown>,
  isError = false,
): Response =>
  jsonResponse({
    jsonrpc: "2.0",
    id: request.id,
    result: {
      structuredContent,
      isError,
    },
  });

type AmbiguousRecoveryScenario = "binding" | "run";

const ambiguousRecoveryFixture = (
  scenario: AmbiguousRecoveryScenario,
): {
  fetchImpl: FetchLike;
  runPosts: Array<{
    body: Record<string, unknown> | null;
    idempotencyKey: string | null;
  }>;
  bindingPosts: Array<Record<string, unknown> | null>;
  bindingDeletes: () => number;
} => {
  const accessToken = "unit-room-ambiguous-recovery-token";
  const roomId = "shared_realtime_room:ambiguous";
  const encodedRoomId = encodeURIComponent(roomId);
  const runId = "run_ambiguous0001";
  const bindingRef = "agent_room_binding:ambiguous0001";
  const encodedBindingRef = encodeURIComponent(bindingRef);
  const runPosts: Array<{
    body: Record<string, unknown> | null;
    idempotencyKey: string | null;
  }> = [];
  const bindingPosts: Array<Record<string, unknown> | null> = [];
  let bindingDeleteCount = 0;

  const fetchImpl: FetchLike = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : null;

    if (url === `${PUBLIC_BASE_URL}/agent-access.json`) {
      return jsonResponse({
        metadata_kind: "casimirbot.agent_access",
        mcp: { url: MCP_URL },
        rest: {
          base_url: AGENT_RUN_URL,
          room_base_url: ROOM_URL,
        },
      });
    }
    if (url === PROTECTED_RESOURCE_URL) {
      return jsonResponse({
        resource: MCP_URL,
        authorization_servers: ["https://identity.test"],
        scopes_supported: [
          "helix.agent_runs.read",
          "helix.agent_runs.write",
          "helix.rooms.read",
          "helix.rooms.manage",
          "helix.room_sources.manage",
        ],
      });
    }
    if (url === MCP_URL && method === "POST") {
      const request = body ?? {};
      if (!headers.has("Authorization")) {
        return jsonResponse(
          {
            error: "unauthorized",
            message: "A bearer token is required.",
          },
          401,
          {
            "WWW-Authenticate":
              `Bearer resource_metadata="${PROTECTED_RESOURCE_URL}", ` +
              'error="invalid_token"',
          },
        );
      }
      expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
      if (request.method === "initialize") {
        return jsonResponse({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2025-06-18",
            capabilities: { tools: {} },
            serverInfo: {
              name: "casimirbot-helix-agent",
              version: "1.0.0",
            },
          },
        });
      }
      if (request.method === "tools/list") {
        return jsonResponse({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: HELIX_SHARED_LIVE_ROOM_MCP_TOOLS.map(validRoomTool),
          },
        });
      }
      const params = request.params as
        | { name?: RoomToolName; arguments?: Record<string, unknown> }
        | undefined;
      switch (params?.name) {
        case "helix_room_list":
          return mcpToolResponse(
            request,
            roomReceipt("helix.shared_live_room.list_receipt.v1", "room.list", {
              rooms: [],
            }),
          );
        case "helix_room_create":
          return mcpToolResponse(request, {
            operation: "room.create",
            receipt: roomReceipt(
              "helix.shared_live_room.create_receipt.v1",
              "room.create",
              { room: { room_id: roomId } },
            ),
            idempotency_replayed: true,
          });
        case "helix_room_inspect":
          return mcpToolResponse(
            request,
            roomReceipt(
              "helix.shared_live_room.inspect_receipt.v1",
              "room.inspect",
              { room: { room_id: roomId } },
            ),
          );
        default:
          throw new Error(
            `Unexpected MCP tool in ambiguity fixture: ${String(params?.name)}`,
          );
      }
    }

    expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
    if (url === ROOM_URL && method === "GET") {
      return jsonResponse(
        roomReceipt("helix.shared_live_room.list_receipt.v1", "room.list", {
          rooms: [],
        }),
      );
    }
    if (url === ROOM_URL && method === "POST") {
      return jsonResponse(
        roomReceipt("helix.shared_live_room.create_receipt.v1", "room.create", {
          room: { room_id: roomId },
        }),
        200,
        { "Idempotency-Replayed": "false" },
      );
    }
    if (url === `${ROOM_URL}/${encodedRoomId}` && method === "GET") {
      return jsonResponse(
        roomReceipt(
          "helix.shared_live_room.inspect_receipt.v1",
          "room.inspect",
          { room: { room_id: roomId } },
        ),
      );
    }
    if (url === AGENT_RUN_URL && method === "POST") {
      runPosts.push({
        body,
        idempotencyKey: headers.get("Idempotency-Key"),
      });
      if (
        scenario === "run" &&
        (runPosts.length === 1 || runPosts.length === 2)
      ) {
        throw new Error("simulated lost committed run-create response");
      }
      return jsonResponse(
        agentRunProjection({
          run_id: runId,
          lifecycle_status: "running",
          version: 1,
        }),
        201,
        {
          "Idempotency-Replayed": scenario === "run" ? "true" : "false",
        },
      );
    }
    if (url === `${ROOM_URL}/run-bindings` && method === "POST") {
      bindingPosts.push(body);
      if (
        scenario === "binding" &&
        (bindingPosts.length === 1 || bindingPosts.length === 2)
      ) {
        throw new Error("simulated lost committed run-binding response");
      }
      return jsonResponse(
        roomReceipt(
          "helix.shared_live_room.run_bind_receipt.v1",
          "room.run.bind",
          {
            binding_ref: bindingRef,
            binding_status: "active",
            room_id: roomId,
            run_id: runId,
            version: 1,
          },
        ),
      );
    }
    if (
      url === `${ROOM_URL}/run-bindings/${encodedBindingRef}` &&
      method === "DELETE"
    ) {
      bindingDeleteCount += 1;
      return jsonResponse(
        roomReceipt(
          "helix.shared_live_room.run_unbind_receipt.v1",
          "room.run.unbind",
          {
            binding_ref: bindingRef,
            binding_status: "revoked",
            revocation_status: "revoked",
          },
        ),
      );
    }
    if (url === `${AGENT_RUN_URL}/${runId}` && method === "GET") {
      return jsonResponse(
        agentRunProjection({
          run_id: runId,
          lifecycle_status: "completed",
          version: 2,
        }),
      );
    }
    throw new Error(`Unexpected ambiguity-fixture request: ${method} ${url}`);
  };

  return {
    fetchImpl,
    runPosts,
    bindingPosts,
    bindingDeletes: () => bindingDeleteCount,
  };
};

describe("Shared Live Room live acceptance dry-run", () => {
  it("makes zero network requests and reports OAuth configuration as a boolean", async () => {
    const fetchImpl = vi.fn<Parameters<FetchLike>, ReturnType<FetchLike>>(
      async () => {
        throw new Error("Dry-run must not call fetch.");
      },
    );

    const withoutOAuth = await runSharedLiveRoomLiveAcceptance({
      env: {
        HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: PUBLIC_BASE_URL,
      },
      fetchImpl,
      now: () => new Date("2026-07-27T12:00:00.000Z"),
    });
    const withOAuth = await runSharedLiveRoomLiveAcceptance({
      env: {
        HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: PUBLIC_BASE_URL,
        HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN: "dry-run-token",
      },
      fetchImpl,
      now: () => new Date("2026-07-27T12:00:00.000Z"),
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(withoutOAuth.configuration.oauth_configured).toBe(false);
    expect(withOAuth.configuration.oauth_configured).toBe(true);
    expect(typeof withOAuth.configuration.oauth_configured).toBe("boolean");
    expect(withOAuth).toMatchObject({
      status: "partial",
      configuration: {
        network_enabled: false,
        mutation_enabled: false,
      },
      sections: {
        public_discovery: { status: "skipped" },
        oauth_challenge: { status: "skipped" },
        authenticated_catalog: { status: "skipped" },
        read_parity: { status: "skipped" },
        mutation_lifecycle: { status: "skipped" },
        cleanup: { status: "skipped" },
      },
    });
  });
});

describe("Shared Live Room MCP catalog validation", () => {
  it("accepts the exact ten-tool contract and rejects bad scopes and annotations", () => {
    const tools = HELIX_SHARED_LIVE_ROOM_MCP_TOOLS.map(validRoomTool);

    expect(tools).toHaveLength(10);
    expect(validateSharedLiveRoomToolCatalog(tools)).toEqual([]);

    const damaged = structuredClone(tools);
    damaged[0].annotations.openWorldHint = true;
    damaged[1].inputSchema.required = [];
    damaged[2].outputSchema.required = damaged[2].outputSchema.required.filter(
      (property) => property !== "receipt",
    );
    damaged.at(-1)!.securitySchemes[0].scopes = [];

    expect(validateSharedLiveRoomToolCatalog(damaged)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool: "helix_room_list",
          code: "invalid_annotations",
        }),
        expect.objectContaining({
          tool: "helix_room_source_create",
          code: "invalid_oauth_scopes",
        }),
        expect.objectContaining({
          tool: "helix_room_inspect",
          code: "invalid_input_schema",
        }),
        expect.objectContaining({
          tool: "helix_room_create",
          code: "invalid_output_schema",
        }),
      ]),
    );
  });

  it("rejects nested request drift, extra required outputs, and forged receipt literals", () => {
    const damaged = structuredClone(
      HELIX_SHARED_LIVE_ROOM_MCP_TOOLS.map(validRoomTool),
    );
    const create = damaged.find((tool) => tool.name === "helix_room_create")!;
    const bind = damaged.find((tool) => tool.name === "helix_room_bind_run")!;
    const claim = damaged.find(
      (tool) => tool.name === "helix_room_claim_chat_binding",
    )!;
    const createInput = create.inputSchema as MutableJsonSchema;
    const bindOutput = bind.outputSchema as MutableJsonSchema;
    const claimOutput = claim.outputSchema as MutableJsonSchema;

    createInput.properties!.request.properties!.title.type = "number";
    bindOutput.required!.push("unexpected_terminal_field");
    bindOutput.properties!.unexpected_terminal_field = {};
    claimOutput.properties!.operation.const = "room.chat_binding.answer";

    expect(validateSharedLiveRoomToolCatalog(damaged)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool: "helix_room_create",
          code: "invalid_input_schema",
        }),
        expect.objectContaining({
          tool: "helix_room_bind_run",
          code: "invalid_output_schema",
        }),
        expect.objectContaining({
          tool: "helix_room_claim_chat_binding",
          code: "invalid_output_schema",
        }),
      ]),
    );
  });
});

describe("Shared Live Room live acceptance secret handling", () => {
  it("redacts access tokens, JWTs, source claims, and chat claims from network failures", async () => {
    const accessToken = "unit-room-access-token-secret";
    const jwt = "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ1bml0LXVzZXIifQ.signature123";
    const sourceClaim = "helix_room_src_unit-source-claim";
    const sourceClaimHandle = "room_source_claim_unit-handle";
    const chatClaim = "agent_chat_claim_unit-chat-handle";
    const genericBearer = "opaque-generic-bearer-secret";
    const camelBearer = "opaque-camel-bearer-secret";
    const password = "opaque-password-secret";
    const privateKey = "opaque-private-key-secret";
    const failureMessage = [
      accessToken,
      jwt,
      sourceClaim,
      sourceClaimHandle,
      chatClaim,
      `bearer_token=${genericBearer}`,
    ].join(" ");
    const fetchImpl = vi.fn<Parameters<FetchLike>, ReturnType<FetchLike>>(
      async (input) => {
        if (String(input) === `${PUBLIC_BASE_URL}/agent-access.json`) {
          return jsonResponse({
            metadata_kind: "unexpected",
            bearer_token: genericBearer,
            sourceBearer: camelBearer,
            password,
            privateKey,
            credential: sourceClaim,
          });
        }
        throw new Error(`simulated transport failure: ${failureMessage}`);
      },
    );

    const report = await runSharedLiveRoomLiveAcceptance({
      env: {
        HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: PUBLIC_BASE_URL,
        HELIX_SHARED_ROOM_ACCEPTANCE_NETWORK: "1",
        HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN: accessToken,
      },
      fetchImpl,
      now: () => new Date("2026-07-27T12:30:00.000Z"),
      randomId: () => "redaction-test",
    });
    const serialized = JSON.stringify(report);

    expect(report.status).toBe("fail");
    expect(report.configuration.oauth_configured).toBe(true);
    for (const secret of [
      accessToken,
      jwt,
      sourceClaim,
      sourceClaimHandle,
      chatClaim,
      genericBearer,
      camelBearer,
      password,
      privateKey,
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).toContain("[REDACTED]");
  });
});

describe("Shared Live Room mocked mutation lifecycle", () => {
  it.each([
    {
      scenario: "run" as const,
      recoveryCheckId: "ambiguous_run_outcome_recovered",
    },
    {
      scenario: "binding" as const,
      recoveryCheckId: "ambiguous_binding_outcome_recovered",
    },
  ])(
    "recovers a lost committed $scenario response on the second exact retry",
    async ({ scenario, recoveryCheckId }) => {
      const fixture = ambiguousRecoveryFixture(scenario);
      const report = await runSharedLiveRoomLiveAcceptance({
        env: {
          HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: PUBLIC_BASE_URL,
          HELIX_SHARED_ROOM_ACCEPTANCE_NETWORK: "1",
          HELIX_SHARED_ROOM_ACCEPTANCE_ALLOW_MUTATION: "1",
          HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN:
            "unit-room-ambiguous-recovery-token",
        },
        fetchImpl: fixture.fetchImpl,
        now: () => new Date("2026-07-27T12:45:00.000Z"),
        randomId: () => `ambiguous-${scenario}`,
      });
      const recoveryCheck = report.sections.cleanup.checks.find(
        (check) => check.id === recoveryCheckId,
      );

      expect(report.sections.mutation_lifecycle.status).toBe("fail");
      expect(report.sections.cleanup.status).toBe("pass");
      expect(recoveryCheck).toMatchObject({
        status: "pass",
        evidence: {
          attempts: 2,
        },
      });
      expect(
        report.sections.cleanup.checks.find(
          (check) => check.id === "bounded_run_cleanup",
        ),
      ).toMatchObject({
        status: "pass",
        evidence: { lifecycle_status: "completed" },
      });

      if (scenario === "run") {
        expect(fixture.runPosts).toHaveLength(3);
        expect(
          new Set(fixture.runPosts.map((entry) => entry.idempotencyKey)).size,
        ).toBe(1);
        expect(fixture.runPosts[0].idempotencyKey).toBeTruthy();
        expect(fixture.runPosts.map((entry) => entry.body)).toEqual([
          fixture.runPosts[0].body,
          fixture.runPosts[0].body,
          fixture.runPosts[0].body,
        ]);
        expect(recoveryCheck).toMatchObject({
          evidence: { idempotency_replayed: true },
        });
        expect(fixture.bindingPosts).toHaveLength(0);
        expect(fixture.bindingDeletes()).toBe(0);
      } else {
        expect(fixture.runPosts).toHaveLength(1);
        expect(fixture.bindingPosts).toHaveLength(3);
        expect(fixture.bindingPosts).toEqual([
          fixture.bindingPosts[0],
          fixture.bindingPosts[0],
          fixture.bindingPosts[0],
        ]);
        expect(fixture.bindingDeletes()).toBe(1);
        expect(
          report.sections.cleanup.checks.find(
            (check) => check.id === "run_room_binding_cleanup",
          ),
        ).toMatchObject({
          status: "pass",
          evidence: { attempts: 1 },
        });
      }
    },
  );

  it("covers cross-transport create, withdraw, rebind, disabled command, and cleanup", async () => {
    const accessToken = "unit-room-lifecycle-token";
    const roomId = "shared_realtime_room:unit";
    const encodedRoomId = encodeURIComponent(roomId);
    const runId = "run_unit0001";
    const firstBindingRef = "agent_room_binding:first0001";
    const replacementBindingRef = "agent_room_binding:replacement0001";
    const encodedFirstBindingRef = encodeURIComponent(firstBindingRef);
    const encodedReplacementBindingRef = encodeURIComponent(
      replacementBindingRef,
    );
    let bindToolCalls = 0;
    let cleanupDeleteCalls = 0;
    let cancelCalls = 0;
    const fetchImpl = vi.fn<Parameters<FetchLike>, ReturnType<FetchLike>>(
      async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        const headers = new Headers(init?.headers);
        const body = init?.body
          ? (JSON.parse(String(init.body)) as Record<string, unknown>)
          : null;

        if (url === `${PUBLIC_BASE_URL}/agent-access.json`) {
          return jsonResponse({
            metadata_kind: "casimirbot.agent_access",
            mcp: { url: MCP_URL },
            rest: {
              base_url: AGENT_RUN_URL,
              room_base_url: ROOM_URL,
            },
          });
        }
        if (url === PROTECTED_RESOURCE_URL) {
          return jsonResponse({
            resource: MCP_URL,
            authorization_servers: ["https://identity.test"],
            scopes_supported: [
              "helix.agent_runs.read",
              "helix.agent_runs.write",
              "helix.rooms.read",
              "helix.rooms.manage",
              "helix.room_sources.manage",
            ],
          });
        }
        if (url === MCP_URL && method === "POST") {
          const request = body ?? {};
          if (!headers.has("Authorization")) {
            return jsonResponse(
              {
                error: "unauthorized",
                message: "A bearer token is required.",
              },
              401,
              {
                "WWW-Authenticate":
                  `Bearer resource_metadata="${PROTECTED_RESOURCE_URL}", ` +
                  'error="invalid_token"',
              },
            );
          }
          expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
          if (request.method === "initialize") {
            return jsonResponse({
              jsonrpc: "2.0",
              id: request.id,
              result: {
                protocolVersion: "2025-06-18",
                capabilities: { tools: {} },
                serverInfo: {
                  name: "casimirbot-helix-agent",
                  version: "1.0.0",
                },
              },
            });
          }
          if (request.method === "tools/list") {
            return jsonResponse({
              jsonrpc: "2.0",
              id: request.id,
              result: {
                tools: HELIX_SHARED_LIVE_ROOM_MCP_TOOLS.map(validRoomTool),
              },
            });
          }
          const params = request.params as
            | { name?: RoomToolName; arguments?: Record<string, unknown> }
            | undefined;
          switch (params?.name) {
            case "helix_room_list":
              return mcpToolResponse(
                request,
                roomReceipt(
                  "helix.shared_live_room.list_receipt.v1",
                  "room.list",
                  { rooms: [] },
                ),
              );
            case "helix_room_create":
              return mcpToolResponse(request, {
                operation: "room.create",
                receipt: roomReceipt(
                  "helix.shared_live_room.create_receipt.v1",
                  "room.create",
                  { room: { room_id: roomId } },
                ),
                idempotency_replayed: true,
              });
            case "helix_room_inspect":
              return mcpToolResponse(
                request,
                roomReceipt(
                  "helix.shared_live_room.inspect_receipt.v1",
                  "room.inspect",
                  { room: { room_id: roomId } },
                ),
              );
            case "helix_room_unbind_run":
              expect(params.arguments).toEqual({
                binding_ref: firstBindingRef,
              });
              return mcpToolResponse(
                request,
                roomReceipt(
                  "helix.shared_live_room.run_unbind_receipt.v1",
                  "room.run.unbind",
                  {
                    binding_ref: firstBindingRef,
                    binding_status: "revoked",
                    revocation_status: "revoked",
                  },
                ),
              );
            case "helix_room_bind_run":
              expect(params.arguments).toEqual({
                request: { run_id: runId, room_id: roomId },
              });
              bindToolCalls += 1;
              return mcpToolResponse(
                request,
                roomReceipt(
                  "helix.shared_live_room.run_bind_receipt.v1",
                  "room.run.bind",
                  {
                    binding_ref:
                      bindToolCalls === 1
                        ? firstBindingRef
                        : replacementBindingRef,
                    binding_status: "active",
                    room_id: roomId,
                    run_id: runId,
                    version: bindToolCalls,
                  },
                ),
              );
            case "helix_room_source_list":
              return mcpToolResponse(
                request,
                roomReceipt(
                  "helix.shared_live_room.source_list_receipt.v1",
                  "room.source.list",
                  { room_id: roomId, bindings: [] },
                ),
              );
            case "helix_room_command_request":
              return mcpToolResponse(request, disabledCommandError(), true);
            default:
              throw new Error(`Unexpected MCP tool: ${String(params?.name)}`);
          }
        }

        expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
        if (url === ROOM_URL && method === "GET") {
          return jsonResponse(
            roomReceipt("helix.shared_live_room.list_receipt.v1", "room.list", {
              rooms: [],
            }),
          );
        }
        if (url === ROOM_URL && method === "POST") {
          expect(headers.get("Idempotency-Key")).toBe(
            "shared-live-room-release-acceptance-v1",
          );
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.create_receipt.v1",
              "room.create",
              { room: { room_id: roomId } },
            ),
            200,
            {
              "Idempotency-Replayed": "false",
            },
          );
        }
        if (url === `${ROOM_URL}/${encodedRoomId}` && method === "GET") {
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.inspect_receipt.v1",
              "room.inspect",
              { room: { room_id: roomId } },
            ),
          );
        }
        if (url === AGENT_RUN_URL && method === "POST") {
          expect(headers.has("Idempotency-Key")).toBe(true);
          return jsonResponse(agentRunProjection({ run_id: runId }), 200, {
            "Idempotency-Replayed": "false",
          });
        }
        if (url === `${ROOM_URL}/run-bindings` && method === "POST") {
          expect(body).toEqual({ run_id: runId, room_id: roomId });
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.run_bind_receipt.v1",
              "room.run.bind",
              {
                binding_ref: firstBindingRef,
                binding_status: "active",
                room_id: roomId,
                run_id: runId,
                version: 1,
              },
            ),
          );
        }
        if (
          url === `${ROOM_URL}/run-bindings/${encodedFirstBindingRef}` &&
          method === "DELETE"
        ) {
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.run_unbind_receipt.v1",
              "room.run.unbind",
              {
                binding_ref: firstBindingRef,
                binding_status: "revoked",
                revocation_status: "already_revoked",
              },
            ),
          );
        }
        if (
          url === `${ROOM_URL}/run-bindings/${encodedReplacementBindingRef}` &&
          method === "DELETE"
        ) {
          cleanupDeleteCalls += 1;
          if (cleanupDeleteCalls === 1) {
            throw new Error("simulated lost cleanup response after commit");
          }
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.run_unbind_receipt.v1",
              "room.run.unbind",
              {
                binding_ref: replacementBindingRef,
                binding_status: "revoked",
                revocation_status: "already_revoked",
              },
            ),
          );
        }
        if (
          url === `${ROOM_URL}/${encodedRoomId}/sources` &&
          method === "GET"
        ) {
          return jsonResponse(
            roomReceipt(
              "helix.shared_live_room.source_list_receipt.v1",
              "room.source.list",
              { room_id: roomId, bindings: [] },
            ),
          );
        }
        if (
          url === `${ROOM_URL}/${encodedRoomId}/commands` &&
          method === "POST"
        ) {
          return jsonResponse(disabledCommandError(), 501);
        }
        if (url === `${AGENT_RUN_URL}/${runId}` && method === "GET") {
          return jsonResponse(
            agentRunProjection({
              run_id: runId,
              lifecycle_status: "running",
              version: 2,
            }),
          );
        }
        if (url === `${AGENT_RUN_URL}/${runId}/cancel` && method === "POST") {
          cancelCalls += 1;
          if (cancelCalls === 1) {
            throw new Error(
              "simulated lost cancellation response after commit",
            );
          }
          expect(body).toEqual({
            expected_version: 2,
            reason: "shared_live_room_acceptance_cleanup",
          });
          return jsonResponse(
            agentRunProjection({
              run_id: runId,
              lifecycle_status: "cancelled",
            }),
          );
        }
        throw new Error(`Unexpected request: ${method} ${url}`);
      },
    );

    const report = await runSharedLiveRoomLiveAcceptance({
      env: {
        HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL: PUBLIC_BASE_URL,
        HELIX_SHARED_ROOM_ACCEPTANCE_NETWORK: "1",
        HELIX_SHARED_ROOM_ACCEPTANCE_ALLOW_MUTATION: "1",
        HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN: accessToken,
      },
      fetchImpl,
      now: () => new Date("2026-07-27T13:00:00.000Z"),
      randomId: () => "unit-lifecycle",
    });

    expect(report.status).toBe("partial");
    expect(report.sections.public_discovery.status).toBe("pass");
    expect(report.sections.oauth_challenge.status).toBe("pass");
    expect(report.sections.authenticated_catalog.status).toBe("pass");
    expect(report.sections.read_parity.status).toBe("pass");
    expect(report.sections.mutation_lifecycle.status).toBe("pass");
    expect(report.sections.cleanup.status).toBe("pass");
    expect(
      report.sections.mutation_lifecycle.checks.map((check) => [
        check.id,
        check.status,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ["cross_transport_room_create_replay", "pass"],
        ["cross_transport_withdrawal_replay", "pass"],
        ["fresh_replacement_binding", "pass"],
        ["command_lane_disabled", "pass"],
      ]),
    );
    expect(
      report.sections.cleanup.checks.map((check) => [check.id, check.status]),
    ).toEqual(
      expect.arrayContaining([
        ["run_room_binding_cleanup", "pass"],
        ["bounded_run_cleanup", "pass"],
        ["stable_room_retained", "pass"],
      ]),
    );
    expect(report.retained_resources.stable_acceptance_room).toBe(true);
    expect(cleanupDeleteCalls).toBe(2);
    expect(cancelCalls).toBe(2);
    expect(JSON.stringify(report)).not.toContain(accessToken);
  });
});
