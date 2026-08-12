import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "@shared/helix-brokerage-environment";
import type { HelixProtectiveExitIntent } from
  "@shared/trading/protective-exit-contract";
import { RobinhoodLiveOrderCallError } from "./robinhood-live-order-adapter";

const MCP_TIMEOUT_MS = 20_000;
const MAX_RESULT_BYTES = 256 * 1_024;
const normalized = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const hash = (value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;

type ToolDescriptor = {
  name: string;
  inputSchema?: unknown;
  annotations?: { destructiveHint?: boolean };
};

type McpClientLike = {
  callTool: (...args: unknown[]) => Promise<Record<string, unknown>>;
};

export type RobinhoodProtectiveExitReviewCall = (input: {
  accessToken: string;
  accountRef: string;
  intent: HelixProtectiveExitIntent;
}) => Promise<{
  rawReview: unknown;
  warnings: string[];
  providerContractHash: string;
}>;

export type RobinhoodProtectiveExitPlacementCall = (input: {
  accessToken: string;
  accountRef: string;
  clientOrderId: string;
  intent: HelixProtectiveExitIntent;
  providerReview: unknown;
}) => Promise<{
  rawResult: unknown;
  providerContractHash: string;
  providerResultHash: string;
  providerOrderRef: string;
}>;

const parseJsonText = (value: string): unknown => {
  const candidate = value.trim().replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "");
  try { return JSON.parse(candidate) as unknown; } catch {
    return { provider_message: candidate.slice(0, 2_000) };
  }
};

const resultPayload = (result: unknown): unknown => {
  if (!isRecord(result)) return result;
  if (isRecord(result.structuredContent)) return result.structuredContent;
  if (!Array.isArray(result.content)) return result;
  const values = result.content.flatMap((entry: unknown) =>
    isRecord(entry) && entry.type === "text" && typeof entry.text === "string"
      ? [parseJsonText(entry.text)] : []);
  return values.length === 1 ? values[0] : { items: values };
};

const collectRecords = (
  value: unknown,
  output: Record<string, unknown>[],
  depth = 0,
): void => {
  if (depth > 7 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry: unknown) => collectRecords(entry, output, depth + 1));
    return;
  }
  const record = value as Record<string, unknown>;
  output.push(record);
  Object.values(record).forEach((entry: unknown) =>
    collectRecords(entry, output, depth + 1));
};

const uniqueValue = (
  source: unknown,
  aliases: ReadonlySet<string>,
): string | null => {
  const records: Record<string, unknown>[] = [];
  collectRecords(source, records);
  const values = new Set<string>();
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (aliases.has(normalized(key)) && typeof value === "string" &&
          value.trim() && value.length <= 1_024) values.add(value.trim());
    }
  }
  return values.size === 1 ? [...values][0] : null;
};

const field = (
  properties: Record<string, unknown>,
  aliases: ReadonlySet<string>,
): string | null => {
  const matches = Object.keys(properties).filter((key: string) =>
    aliases.has(normalized(key)));
  if (matches.length > 1) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's protective-exit schema is ambiguous.",
  );
  return matches[0] ?? null;
};

const enumValue = (schema: unknown, desired: readonly string[]): string => {
  if (!isRecord(schema) || !Array.isArray(schema.enum)) return desired[0];
  for (const candidate of desired) {
    const match = schema.enum.find((entry: unknown) =>
      typeof entry === "string" && normalized(entry) === normalized(candidate));
    if (typeof match === "string") return match;
  }
  throw new RobinhoodLiveOrderCallError(
    "contract", false,
    "Robinhood's protective-exit enum does not admit a sell stop order.",
  );
};

const decimal = (micros: number): string => {
  const whole = Math.floor(micros / 1_000_000);
  const fraction = String(micros % 1_000_000).padStart(6, "0")
    .replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
};

const scalar = (schema: unknown, value: string): string | number => {
  if (!isRecord(schema) ||
      schema.type !== "number" && schema.type !== "integer") return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's numeric protective-exit field is unsupported.",
  );
  return parsed;
};

const schemaFields = (inputSchema: unknown) => {
  if (!isRecord(inputSchema) || inputSchema.type !== "object" ||
      !isRecord(inputSchema.properties)) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's protective-exit input schema is unsupported.",
  );
  const properties = inputSchema.properties;
  const fields = {
    account: field(properties, new Set([
      "account", "accountnumber", "accountid", "accountref",
    ])),
    clientOrderId: field(properties, new Set([
      "clientorderid", "clientid", "idempotencykey",
    ])),
    review: field(properties, new Set([
      "reviewid", "reviewtoken", "previewid", "previewtoken", "orderreviewid",
    ])),
    symbol: field(properties, new Set(["symbol", "ticker", "stocksymbol"])),
    side: field(properties, new Set(["side", "direction"])),
    orderType: field(properties, new Set(["ordertype", "type"])),
    timeInForce: field(properties, new Set(["timeinforce", "tif"])),
    quantity: field(properties, new Set([
      "quantity", "assetquantity", "sharequantity", "shares",
    ])),
    stopPrice: field(properties, new Set([
      "stopprice", "triggerprice", "stoptriggerprice",
    ])),
    extendedHours: field(properties, new Set([
      "extendedhours", "extendedhourstrading",
    ])),
  };
  const required = Array.isArray(inputSchema.required)
    ? inputSchema.required.filter((entry: unknown): entry is string =>
      typeof entry === "string") : [];
  const recognized = new Set(Object.values(fields).filter(
    (entry: string | null): entry is string => Boolean(entry),
  ));
  if (required.some((entry: string) => !recognized.has(entry))) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's protective-exit schema contains an unreviewed required field.",
    );
  }
  for (const requiredField of [
    "account", "symbol", "side", "orderType", "quantity",
  ] as const) {
    if (!fields[requiredField]) throw new RobinhoodLiveOrderCallError(
      "contract", false,
      `Robinhood's protective-exit schema is missing ${requiredField}.`,
    );
  }
  return { properties, fields };
};

export const buildRobinhoodProtectiveExitArguments = (input: {
  inputSchema: unknown;
  accountRef: string;
  intent: HelixProtectiveExitIntent;
  clientOrderId?: string;
  providerReview?: unknown;
}): Record<string, unknown> => {
  const { properties, fields } = schemaFields(input.inputSchema);
  if (input.intent.order_type === "stop" && !fields.stopPrice) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's protective-exit schema is missing stopPrice.",
    );
  }
  const required = isRecord(input.inputSchema) &&
      Array.isArray(input.inputSchema.required)
    ? input.inputSchema.required.filter((entry: unknown): entry is string =>
      typeof entry === "string") : [];
  if ((!input.clientOrderId && fields.clientOrderId &&
       required.includes(fields.clientOrderId)) ||
      (input.providerReview === undefined && fields.review &&
       required.includes(fields.review))) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's review schema requires placement-only identity fields.",
    );
  }
  if (input.intent.order_type === "market" && fields.stopPrice &&
      required.includes(fields.stopPrice)) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's market-close schema unexpectedly requires a stop price.",
    );
  }
  if (input.clientOrderId && !fields.clientOrderId) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's protective-exit placement schema lacks idempotency identity.",
    );
  }
  const reviewRef = fields.review && input.providerReview !== undefined
    ? uniqueValue(input.providerReview, new Set([
      "reviewid", "reviewtoken", "previewid", "previewtoken", "orderreviewid",
    ])) : null;
  if (fields.review && input.providerReview !== undefined && !reviewRef) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "The encrypted protective-exit review has no unambiguous placement reference.",
    );
  }
  const output: Record<string, unknown> = {};
  const put = (name: string | null, value: unknown): void => {
    if (name) output[name] = value;
  };
  put(fields.account, input.accountRef);
  put(fields.clientOrderId, input.clientOrderId);
  put(fields.review, reviewRef);
  put(fields.symbol, input.intent.symbol);
  put(fields.side, enumValue(properties[fields.side!], ["sell"]));
  put(fields.orderType, enumValue(properties[fields.orderType!],
    input.intent.order_type === "stop"
      ? ["stop", "stop_market"] : ["market"]));
  put(fields.timeInForce, enumValue(properties[fields.timeInForce!], ["gfd", "day"]));
  put(fields.quantity, scalar(properties[fields.quantity!],
    decimal(input.intent.quantity_micros)));
  if (input.intent.order_type === "stop") {
    put(fields.stopPrice, scalar(properties[fields.stopPrice!],
      decimal(input.intent.stop_price_micros)));
  }
  put(fields.extendedHours, false);
  return output;
};

const collectWarnings = (payload: unknown): string[] => {
  const records: Record<string, unknown>[] = [];
  collectRecords(payload, records);
  const warnings = new Set<string>();
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (!/(warning|alert)/iu.test(key)) continue;
      for (const entry of Array.isArray(value) ? value : [value]) {
        if (typeof entry === "string" && entry.trim()) {
          warnings.add(entry.trim().slice(0, 500));
        }
      }
    }
  }
  return [...warnings].slice(0, 32);
};

const withMcp = async <T>(input: {
  accessToken: string;
  name: string;
  operation: (client: McpClientLike, tools: ToolDescriptor[]) => Promise<T>;
}): Promise<T> => {
  const client = new Client(
    { name: input.name, version: "1.0.0" }, { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(HELIX_ROBINHOOD_TRADING_MCP_RESOURCE),
    { requestInit: { headers: { Authorization: `Bearer ${input.accessToken}` } } },
  );
  try {
    await client.connect(transport, { timeout: MCP_TIMEOUT_MS });
    const tools: ToolDescriptor[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 4; page += 1) {
      const catalog = await client.listTools(cursor ? { cursor } : undefined,
        { timeout: MCP_TIMEOUT_MS });
      tools.push(...catalog.tools as ToolDescriptor[]);
      cursor = catalog.nextCursor;
      if (!cursor) break;
    }
    return await input.operation(client as unknown as McpClientLike, tools);
  } finally {
    await client.close().catch(() => undefined);
  }
};

const providerFailure = (error: unknown, callAttempted: boolean): never => {
  if (error instanceof RobinhoodLiveOrderCallError) throw error;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (!callAttempted &&
      (message.includes("unauthorized") || message.includes("401"))) {
    throw new RobinhoodLiveOrderCallError(
      "unauthorized", false,
      "Robinhood rejected the access token before the protective-exit call.",
    );
  }
  throw new RobinhoodLiveOrderCallError(
    callAttempted ? "ambiguous" : "contract", callAttempted,
    callAttempted
      ? "The Robinhood protective-exit outcome is ambiguous and must not be retried."
      : "Robinhood protective-exit admission failed before the provider call.",
  );
};

export const reviewRobinhoodProtectiveExitOverMcp:
RobinhoodProtectiveExitReviewCall = async (input) => {
  try {
    return await withMcp({
      accessToken: input.accessToken,
      name: "casimirbot-robinhood-protective-exit-review",
      operation: async (client, tools) => {
        const descriptor = tools.find((tool) =>
          tool.name === "review_equity_order");
        if (!descriptor || descriptor.annotations?.destructiveHint === true) {
          throw new RobinhoodLiveOrderCallError(
            "contract", false,
            "Robinhood review_equity_order is unavailable or unsafe.",
          );
        }
        const args = buildRobinhoodProtectiveExitArguments({
          inputSchema: descriptor.inputSchema,
          accountRef: input.accountRef,
          intent: input.intent,
        });
        const result = await client.callTool(
          { name: "review_equity_order", arguments: args }, undefined,
          { timeout: MCP_TIMEOUT_MS },
        );
        if ("isError" in result && result.isError === true) {
          throw new RobinhoodLiveOrderCallError(
            "rejected", false,
            "Robinhood rejected the protective stop review without placing it.",
          );
        }
        const rawReview = resultPayload(result);
        if (Buffer.byteLength(JSON.stringify(rawReview), "utf8") >
            MAX_RESULT_BYTES) throw new RobinhoodLiveOrderCallError(
          "contract", false, "Robinhood's protective stop review is too large.",
        );
        return {
          rawReview,
          warnings: collectWarnings(rawReview),
          providerContractHash: hash(descriptor.inputSchema ?? null),
        };
      },
    });
  } catch (error) { return providerFailure(error, false); }
};

export const placeRobinhoodProtectiveExitOverMcp:
RobinhoodProtectiveExitPlacementCall = async (input) => {
  let callAttempted = false;
  try {
    return await withMcp({
      accessToken: input.accessToken,
      name: "casimirbot-robinhood-protective-exit-placement",
      operation: async (client, tools) => {
        const descriptor = tools.find((tool) =>
          tool.name === "place_equity_order");
        if (!descriptor || descriptor.annotations?.destructiveHint !== true) {
          throw new RobinhoodLiveOrderCallError(
            "contract", false,
            "Robinhood place_equity_order is absent or not explicitly destructive.",
          );
        }
        const args = buildRobinhoodProtectiveExitArguments({
          inputSchema: descriptor.inputSchema,
          accountRef: input.accountRef,
          intent: input.intent,
          clientOrderId: input.clientOrderId,
          providerReview: input.providerReview,
        });
        callAttempted = true;
        const result = await client.callTool(
          { name: "place_equity_order", arguments: args }, undefined,
          { timeout: MCP_TIMEOUT_MS },
        );
        if ("isError" in result && result.isError === true) {
          throw new RobinhoodLiveOrderCallError(
            "rejected", true,
            "Robinhood rejected the approved protective stop order.",
          );
        }
        const rawResult = resultPayload(result);
        if (Buffer.byteLength(JSON.stringify(rawResult), "utf8") >
            MAX_RESULT_BYTES) throw new RobinhoodLiveOrderCallError(
          "ambiguous", true, "Robinhood's protective stop result is too large.",
        );
        const providerOrderRef = uniqueValue(rawResult, new Set([
          "orderid", "ordernumber", "orderref", "id",
        ]));
        if (!providerOrderRef) throw new RobinhoodLiveOrderCallError(
          "ambiguous", true,
          "Robinhood returned no unique protective-stop order identity.",
        );
        return {
          rawResult,
          providerContractHash: hash(descriptor.inputSchema ?? null),
          providerResultHash: hash(rawResult),
          providerOrderRef,
        };
      },
    });
  } catch (error) { return providerFailure(error, callAttempted); }
};
