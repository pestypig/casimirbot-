import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "@shared/helix-brokerage-environment";
import {
  HELIX_LIVE_PROVIDER_CONTRACT_GATE_IDS,
  helixLiveProviderContractGateSchema,
  type HelixLiveProviderContractGate,
} from "@shared/trading/live-provider-contract-preflight";
import type { HelixLiveEquityOrderIntent } from
  "@shared/trading/live-order-contract";
import type { HelixProtectiveExitIntent } from
  "@shared/trading/protective-exit-contract";
import { buildRobinhoodLiveCancellationArguments } from
  "./robinhood-live-cancel-adapter";
import {
  buildRobinhoodLivePlacementArguments,
  RobinhoodLiveOrderCallError,
} from "./robinhood-live-order-adapter";
import { buildRobinhoodEquityReviewArguments } from
  "./robinhood-order-preview-adapter";
import { buildRobinhoodProtectiveExitArguments } from
  "./robinhood-protective-exit-adapter";
import { RobinhoodMcpClientError } from "./robinhood-read-adapter";

const MCP_TIMEOUT_MS = 20_000;

export type RobinhoodLiveToolDescriptor = Readonly<{
  name: string;
  inputSchema?: unknown;
  annotations?: { destructiveHint?: boolean };
}>;

export type RobinhoodLiveCatalogInspection = Readonly<{
  catalogHash: `sha256:${string}`;
  gates: HelixLiveProviderContractGate[];
}>;

export type RobinhoodLiveCatalogCall = (input: {
  accessToken: string;
}) => Promise<readonly RobinhoodLiveToolDescriptor[]>;

export class RobinhoodLiveCatalogError extends Error {
  constructor(
    readonly kind: "unauthorized" | "provider",
    message: string,
  ) {
    super(message);
    this.name = "RobinhoodLiveCatalogError";
  }
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
  return value;
};

const hash = (domain: string, value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256")
    .update(`${domain}\n${JSON.stringify(canonicalize(value))}`, "utf8")
    .digest("hex")}`;

const observedHint = (
  descriptor: RobinhoodLiveToolDescriptor,
): "true" | "false" | "absent" =>
  descriptor.annotations?.destructiveHint === true
    ? "true"
    : descriptor.annotations?.destructiveHint === false ? "false" : "absent";

const entryIntent: HelixLiveEquityOrderIntent = {
  asset_type: "equity",
  symbol: "TEST",
  side: "buy",
  order_type: "limit",
  time_in_force: "gfd",
  extended_hours: false,
  quantity_micros: 1_000_000,
  limit_price_micros: 10_000_000,
  stop_price_micros: 9_000_000,
  notional_cents: 1_000,
};

const stopIntent: HelixProtectiveExitIntent = {
  asset_type: "equity",
  symbol: "TEST",
  side: "sell",
  order_type: "stop",
  time_in_force: "gfd",
  extended_hours: false,
  quantity_micros: 1_000_000,
  stop_price_micros: 9_000_000,
};

const marketIntent: HelixProtectiveExitIntent = {
  asset_type: "equity",
  symbol: "TEST",
  side: "sell",
  order_type: "market",
  time_in_force: "gfd",
  extended_hours: false,
  quantity_micros: 1_000_000,
};

type GateDefinition = Readonly<{
  gateId: typeof HELIX_LIVE_PROVIDER_CONTRACT_GATE_IDS[number];
  toolName: "review_equity_order" | "place_equity_order" |
    "cancel_equity_order";
  destructive: boolean;
  build: (inputSchema: unknown) => unknown;
}>;

const definitions: readonly GateDefinition[] = [
  {
    gateId: "entry_review",
    toolName: "review_equity_order",
    destructive: false,
    build: (inputSchema) => buildRobinhoodEquityReviewArguments({
      inputSchema, accountRef: "contract-preflight-account", intent: entryIntent,
    }),
  },
  {
    gateId: "entry_placement",
    toolName: "place_equity_order",
    destructive: true,
    build: (inputSchema) => buildRobinhoodLivePlacementArguments({
      inputSchema,
      accountRef: "contract-preflight-account",
      clientOrderId: "contract-preflight-entry",
      intent: entryIntent,
      providerReview: { review_id: "contract-preflight-review" },
    }),
  },
  {
    gateId: "protective_stop_review",
    toolName: "review_equity_order",
    destructive: false,
    build: (inputSchema) => buildRobinhoodProtectiveExitArguments({
      inputSchema, accountRef: "contract-preflight-account", intent: stopIntent,
    }),
  },
  {
    gateId: "protective_stop_placement",
    toolName: "place_equity_order",
    destructive: true,
    build: (inputSchema) => buildRobinhoodProtectiveExitArguments({
      inputSchema,
      accountRef: "contract-preflight-account",
      intent: stopIntent,
      clientOrderId: "contract-preflight-stop",
      providerReview: { review_id: "contract-preflight-review" },
    }),
  },
  {
    gateId: "market_close_review",
    toolName: "review_equity_order",
    destructive: false,
    build: (inputSchema) => buildRobinhoodProtectiveExitArguments({
      inputSchema, accountRef: "contract-preflight-account", intent: marketIntent,
    }),
  },
  {
    gateId: "market_close_placement",
    toolName: "place_equity_order",
    destructive: true,
    build: (inputSchema) => buildRobinhoodProtectiveExitArguments({
      inputSchema,
      accountRef: "contract-preflight-account",
      intent: marketIntent,
      clientOrderId: "contract-preflight-market-close",
      providerReview: { review_id: "contract-preflight-review" },
    }),
  },
  {
    gateId: "equity_order_cancellation",
    toolName: "cancel_equity_order",
    destructive: true,
    build: (inputSchema) => buildRobinhoodLiveCancellationArguments({
      inputSchema,
      accountRef: "contract-preflight-account",
      providerOrderRef: "contract-preflight-order",
    }),
  },
];

const failureMessage = (error: unknown): string => {
  if (error instanceof RobinhoodLiveOrderCallError ||
      error instanceof RobinhoodMcpClientError) return error.message.slice(0, 500);
  return "The provider input schema is not admitted by the reviewed local adapter.";
};

export const assessRobinhoodLiveProviderCatalog = (
  tools: readonly RobinhoodLiveToolDescriptor[],
): RobinhoodLiveCatalogInspection => {
  const catalogHash = hash("robinhood-live-tool-catalog/v1", tools
    .map((tool) => ({
      name: tool.name,
      input_schema_hash: hash("robinhood-tool-input-schema/v1",
        tool.inputSchema ?? null),
      destructive_hint: observedHint(tool),
    }))
    .sort((left, right) => left.name.localeCompare(right.name)));
  const gates = definitions.map((definition): HelixLiveProviderContractGate => {
    const matches = tools.filter((tool) => tool.name === definition.toolName);
    const descriptor = matches.length === 1 ? matches[0] : null;
    const expected = definition.destructive ? "true" as const : "not_true" as const;
    if (!descriptor) return helixLiveProviderContractGateSchema.parse({
      gate_id: definition.gateId,
      tool_name: definition.toolName,
      verdict: "fail",
      reason_code: matches.length > 1 ? "duplicate_tool" : "tool_missing",
      message: matches.length > 1
        ? "The required Robinhood tool appears more than once in the catalog."
        : "The required Robinhood tool is absent from the catalog.",
      input_schema_hash: null,
      destructive_hint_expected: expected,
      destructive_hint_observed: "absent",
    });
    const hint = observedHint(descriptor);
    const schemaHash = hash("robinhood-tool-input-schema/v1",
      descriptor.inputSchema ?? null);
    try {
      definition.build(descriptor.inputSchema);
      return helixLiveProviderContractGateSchema.parse({
        gate_id: definition.gateId,
        tool_name: definition.toolName,
        verdict: "pass",
        reason_code: "contract_admitted",
        message: definition.destructive
          ? "The exact mutating tool name and schema are admitted by CasimirBot's local destructive-tool policy; the provider hint is informational only."
          : "The sanitized provider schema is admitted by the local adapter; the provider hint is informational only.",
        input_schema_hash: schemaHash,
        destructive_hint_expected: expected,
        destructive_hint_observed: hint,
      });
    } catch (error) {
      return helixLiveProviderContractGateSchema.parse({
        gate_id: definition.gateId,
        tool_name: definition.toolName,
        verdict: "fail",
        reason_code: "schema_not_admitted",
        message: failureMessage(error),
        input_schema_hash: schemaHash,
        destructive_hint_expected: expected,
        destructive_hint_observed: hint,
      });
    }
  });
  return { catalogHash, gates };
};

export const listRobinhoodLiveProviderCatalogOverMcp:
RobinhoodLiveCatalogCall = async (input) => {
  const client = new Client(
    { name: "casimirbot-robinhood-live-contract-preflight", version: "1.0.0" },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(HELIX_ROBINHOOD_TRADING_MCP_RESOURCE),
    { requestInit: { headers: { Authorization: `Bearer ${input.accessToken}` } } },
  );
  try {
    await client.connect(transport, { timeout: MCP_TIMEOUT_MS });
    const tools: RobinhoodLiveToolDescriptor[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 4; page += 1) {
      const catalog = await client.listTools(cursor ? { cursor } : undefined,
        { timeout: MCP_TIMEOUT_MS });
      tools.push(...catalog.tools as RobinhoodLiveToolDescriptor[]);
      cursor = catalog.nextCursor;
      if (!cursor) break;
    }
    return tools;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unauthorized") || message.includes("401")) {
      throw new RobinhoodLiveCatalogError(
        "unauthorized", "Robinhood rejected the access token during catalog inspection.",
      );
    }
    throw new RobinhoodLiveCatalogError(
      "provider", "Robinhood's MCP tool catalog could not be inspected.",
    );
  } finally {
    await client.close().catch(() => undefined);
  }
};
