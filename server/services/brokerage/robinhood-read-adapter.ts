import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  HELIX_ROBINHOOD_PROVIDER_ID,
  HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS,
  HELIX_ROBINHOOD_READ_TOOL_CAPABILITY,
  HELIX_ROBINHOOD_TRADING_MCP_RESOURCE,
  helixBrokerageObservationSchema,
  type HelixBrokerageObservation,
  type HelixRobinhoodReadOnlyUpstreamTool,
} from "@shared/helix-brokerage-environment";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";
import {
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
  RobinhoodConnectionError,
} from "./robinhood-connection-store";

const MCP_TIMEOUT_MS = 20_000;
const MAX_ARGUMENT_BYTES = 24 * 1_024;
const MAX_OUTPUT_DEPTH = 7;
const MAX_OBJECT_KEYS = 100;
const MAX_ARRAY_ITEMS = 100;
const MAX_STRING_CHARS = 2_000;

const FORBIDDEN_PROVIDER_KEY = /(?:access.?token|refresh.?token|id.?token|secret|password|authorization|cookie|account.?(?:number|id|url|ref)|routing.?number|social.?security|tax.?id)/iu;
const BEARER_VALUE = /\bbearer\s+[a-z0-9._~+/=-]{12,}/giu;
const LONG_NUMBER = /\b(?:\d[ -]?){8,17}\b/gu;

type SanitizeState = {
  redactionCount: number;
  truncated: boolean;
};

export class RobinhoodMcpClientError extends Error {
  constructor(
    readonly kind: "unauthorized" | "contract" | "provider",
    message: string,
  ) {
    super(message);
    this.name = "RobinhoodMcpClientError";
  }
}

export type RobinhoodMcpReadCall = (input: {
  accessToken: string;
  toolName: HelixRobinhoodReadOnlyUpstreamTool;
  arguments: Record<string, unknown>;
}) => Promise<unknown>;

const sha256Json = (value: unknown): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex")}`;

const sanitizeString = (value: string, state: SanitizeState): string => {
  let next = value.replace(BEARER_VALUE, () => {
    state.redactionCount += 1;
    return "[redacted-bearer]";
  });
  next = next.replace(LONG_NUMBER, () => {
    state.redactionCount += 1;
    return "[redacted-number]";
  });
  if (next.length > MAX_STRING_CHARS) {
    state.truncated = true;
    return `${next.slice(0, MAX_STRING_CHARS)}…`;
  }
  return next;
};

const sanitizeProviderValue = (
  value: unknown,
  state: SanitizeState,
  depth = 0,
): unknown => {
  if (depth > MAX_OUTPUT_DEPTH) {
    state.truncated = true;
    return "[depth-truncated]";
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" && Number.isFinite(value)
  ) {
    return value;
  }
  if (typeof value === "string") return sanitizeString(value, state);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) state.truncated = true;
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeProviderValue(item, state, depth + 1));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_OBJECT_KEYS) state.truncated = true;
    const projected: Record<string, unknown> = {};
    for (const [key, item] of entries.slice(0, MAX_OBJECT_KEYS)) {
      if (FORBIDDEN_PROVIDER_KEY.test(key)) {
        state.redactionCount += 1;
        continue;
      }
      projected[key] = sanitizeProviderValue(item, state, depth + 1);
    }
    return projected;
  }
  state.redactionCount += 1;
  return "[unsupported-value]";
};

const parseJsonText = (value: string): unknown => {
  const trimmed = value.trim();
  const candidate = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "")
    : trimmed;
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return { provider_message: candidate };
  }
};

const resultPayload = (result: unknown): unknown => {
  if (!result || typeof result !== "object") return result;
  const record = result as Record<string, unknown>;
  if (record.structuredContent && typeof record.structuredContent === "object") {
    return record.structuredContent;
  }
  if (!Array.isArray(record.content)) return record;
  const textItems = record.content
    .filter((item): item is { type: "text"; text: string } =>
      Boolean(
        item && typeof item === "object" &&
        (item as { type?: unknown }).type === "text" &&
        typeof (item as { text?: unknown }).text === "string",
      ))
    .map((item) => parseJsonText(item.text));
  return textItems.length === 1 ? textItems[0] : { items: textItems };
};

export const callRobinhoodReadToolOverMcp: RobinhoodMcpReadCall = async (
  input,
) => {
  const client = new Client(
    { name: "casimirbot-robinhood-read-adapter", version: "1.0.0" },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(HELIX_ROBINHOOD_TRADING_MCP_RESOURCE),
    {
      requestInit: {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      },
      reconnectionOptions: {
        maxReconnectionDelay: 2_000,
        initialReconnectionDelay: 250,
        reconnectionDelayGrowFactor: 2,
        maxRetries: 1,
      },
    },
  );
  try {
    await client.connect(transport, { timeout: MCP_TIMEOUT_MS });
    let cursor: string | undefined;
    let admitted = false;
    for (let page = 0; page < 4 && !admitted; page += 1) {
      const catalog = await client.listTools(
        cursor ? { cursor } : undefined,
        { timeout: MCP_TIMEOUT_MS },
      );
      const descriptor = catalog.tools.find(
        (tool) => tool.name === input.toolName,
      );
      if (descriptor) {
        admitted = descriptor.annotations?.destructiveHint !== true;
        break;
      }
      cursor = catalog.nextCursor;
      if (!cursor) break;
    }
    if (!admitted) {
      throw new RobinhoodMcpClientError(
        "contract",
        "The upstream read tool is absent or marked destructive.",
      );
    }
    const result = await client.callTool(
      { name: input.toolName, arguments: input.arguments },
      undefined,
      { timeout: MCP_TIMEOUT_MS },
    );
    if ("isError" in result && result.isError === true) {
      throw new RobinhoodMcpClientError(
        "provider",
        "Robinhood returned a typed tool failure.",
      );
    }
    return result;
  } catch (error) {
    if (error instanceof RobinhoodMcpClientError) throw error;
    const name = error instanceof Error ? error.name.toLowerCase() : "";
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (name.includes("unauthorized") || message.includes("unauthorized")) {
      throw new RobinhoodMcpClientError(
        "unauthorized",
        "Robinhood rejected the access token.",
      );
    }
    throw new RobinhoodMcpClientError(
      "provider",
      "Robinhood MCP is temporarily unavailable.",
    );
  } finally {
    await client.close().catch(() => undefined);
  }
};

const writeAudit = async (input: {
  observationId: string;
  connectionId: string;
  ownerProfileId: string;
  roomId: string;
  toolName: HelixRobinhoodReadOnlyUpstreamTool;
  capabilityId: string;
  producerEpochRef: string;
  status: "succeeded" | "failed";
  inputHash: string;
  outputHash: string | null;
  redactionCount: number;
  truncated: boolean;
  errorCode: string | null;
  observedAt: string;
  normalizedData?: unknown;
}): Promise<void> => {
  await withSharedRealtimeRoomTransaction(async (db) => {
    await db.query(
    `
      INSERT INTO helix_brokerage_read_audit (
        observation_id, connection_id, owner_profile_id, room_id,
        provider, upstream_tool, capability_id, producer_epoch_ref,
        status, input_hash, output_hash, redaction_count, truncated,
        error_code, observed_at
      ) VALUES (
        $1, $2, $3, $4, 'robinhood', $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14
      );
    `,
    [
      input.observationId,
      input.connectionId,
      input.ownerProfileId,
      input.roomId,
      input.toolName,
      input.capabilityId,
      input.producerEpochRef,
      input.status,
      input.inputHash,
      input.outputHash,
      input.redactionCount,
      input.truncated,
      input.errorCode,
      input.observedAt,
    ],
    );
    if (input.status === "succeeded") {
      await db.query(
        `
          INSERT INTO helix_brokerage_observation_evidence (
            observation_id, normalized_data, output_hash, observed_at
          ) VALUES ($1, $2::jsonb, $3, $4);
        `,
        [
          input.observationId,
          JSON.stringify(input.normalizedData ?? null),
          input.outputHash,
          input.observedAt,
        ],
      );
    }
  });
};

export const executeRobinhoodPrivateRoomRead = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  toolName: HelixRobinhoodReadOnlyUpstreamTool;
  arguments?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
  mcpCall?: RobinhoodMcpReadCall;
  now?: Date;
}): Promise<HelixBrokerageObservation> => {
  if (!HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS.includes(input.toolName)) {
    throw new RobinhoodConnectionError(
      "brokerage_capability_denied",
      403,
      "Only reviewed Robinhood read tools are admitted.",
    );
  }
  const args = input.arguments ?? {};
  if (
    !args ||
    typeof args !== "object" ||
    Array.isArray(args) ||
    Buffer.byteLength(JSON.stringify(args), "utf8") > MAX_ARGUMENT_BYTES
  ) {
    throw new RobinhoodConnectionError(
      "brokerage_capability_denied",
      400,
      "Robinhood read arguments are invalid or exceed the bounded request size.",
    );
  }
  const capabilityId = HELIX_ROBINHOOD_READ_TOOL_CAPABILITY[input.toolName];
  const observationId = `brokerage_observation:${crypto.randomUUID()}`;
  const inputHash = sha256Json(args);
  const now = input.now ?? new Date();
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId,
    fetchImpl: input.fetchImpl,
    now,
  });
  const call = input.mcpCall ?? callRobinhoodReadToolOverMcp;
  let providerResult: unknown;
  try {
    try {
      providerResult = await call({
        accessToken: lease.credentials.access_token,
        toolName: input.toolName,
        arguments: args,
      });
    } catch (error) {
      if (!(error instanceof RobinhoodMcpClientError) ||
          error.kind !== "unauthorized") {
        throw error;
      }
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId,
        fetchImpl: input.fetchImpl,
        forceRefresh: true,
        now,
      });
      providerResult = await call({
        accessToken: lease.credentials.access_token,
        toolName: input.toolName,
        arguments: args,
      });
    }
  } catch (error) {
    const errorCode = error instanceof RobinhoodMcpClientError &&
      error.kind === "contract"
      ? "brokerage_provider_contract_changed"
      : "brokerage_read_failed";
    await writeAudit({
      observationId,
      connectionId: input.connectionId,
      ownerProfileId: input.ownerProfileId,
      roomId: input.roomId,
      toolName: input.toolName,
      capabilityId,
      producerEpochRef: lease.producerEpochRef,
      status: "failed",
      inputHash,
      outputHash: null,
      redactionCount: 0,
      truncated: false,
      errorCode,
      observedAt: now.toISOString(),
    });
    throw new RobinhoodConnectionError(
      errorCode,
      502,
      errorCode === "brokerage_provider_contract_changed"
        ? "Robinhood's MCP tool contract changed and requires review."
        : "The Robinhood read request failed without changing the account.",
    );
  }
  const sanitizeState: SanitizeState = {
    redactionCount: 0,
    truncated: false,
  };
  const data = sanitizeProviderValue(
    resultPayload(providerResult),
    sanitizeState,
  );
  const outputHash = sha256Json(data);
  await writeAudit({
    observationId,
    connectionId: input.connectionId,
    ownerProfileId: input.ownerProfileId,
    roomId: input.roomId,
    toolName: input.toolName,
    capabilityId,
    producerEpochRef: lease.producerEpochRef,
    status: "succeeded",
    inputHash,
    outputHash,
    redactionCount: sanitizeState.redactionCount,
    truncated: sanitizeState.truncated,
    errorCode: null,
    observedAt: now.toISOString(),
    normalizedData: data,
  });
  return helixBrokerageObservationSchema.parse({
    schema: HELIX_BROKERAGE_OBSERVATION_SCHEMA,
    ok: true,
    observation_id: observationId,
    connection_id: input.connectionId,
    room_id: input.roomId,
    provider: HELIX_ROBINHOOD_PROVIDER_ID,
    environment_domain: "brokerage",
    upstream_tool: input.toolName,
    capability_id: capabilityId,
    producer_epoch_ref: lease.producerEpochRef,
    observed_at: now.toISOString(),
    freshness_state: "fresh",
    data,
    input_hash: inputHash,
    output_hash: outputHash,
    redaction_count: sanitizeState.redactionCount,
    truncated: sanitizeState.truncated,
    read_only: true,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};
