import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "@shared/helix-brokerage-environment";
import type { HelixLiveEquityOrderIntent } from
  "@shared/trading/live-order-contract";
import { RobinhoodMcpClientError } from "./robinhood-read-adapter";

const MCP_TIMEOUT_MS = 20_000;
const MAX_PROVIDER_OUTPUT_BYTES = 256 * 1_024;
const SHA256 = (value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;

type ToolDescriptor = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  annotations?: { destructiveHint?: boolean; readOnlyHint?: boolean };
};

type McpClientLike = {
  callTool: (...args: unknown[]) => Promise<Record<string, unknown>>;
};

export type RobinhoodAgenticAccountDiscovery = (input: {
  accessToken: string;
}) => Promise<{ accountRef: string; providerContractHash: string }>;

export type RobinhoodEquityOrderReviewCall = (input: {
  accessToken: string;
  accountRef: string;
  intent: HelixLiveEquityOrderIntent;
}) => Promise<{
  rawReview: unknown;
  publicReview: unknown;
  warnings: string[];
  providerContractHash: string;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const normalized = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");

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
  const items = result.content.flatMap((entry: unknown) =>
    isRecord(entry) && entry.type === "text" && typeof entry.text === "string"
      ? [parseJsonText(entry.text)] : []);
  return items.length === 1 ? items[0] : { items };
};

const safePublicValue = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return "[depth-truncated]";
  if (value === null || typeof value === "boolean" ||
      typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value.slice(0, 2_000)
    .replace(/\b(?:\d[ -]?){8,17}\b/gu, "[redacted-number]")
    .replace(/\bbearer\s+[^\s]+/giu, "[redacted-bearer]");
  if (Array.isArray(value)) return value.slice(0, 100)
    .map((entry: unknown) => safePublicValue(entry, depth + 1));
  if (!isRecord(value)) return "[unsupported-value]";
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value).slice(0, 100)) {
    if (/(?:token|secret|password|authorization|cookie|account(?:number|id|url|ref)?|routing|taxid|ssn)/iu
      .test(normalized(key))) continue;
    output[key] = safePublicValue(entry, depth + 1);
  }
  return output;
};

const collectRecords = (value: unknown, output: Record<string, unknown>[], depth = 0): void => {
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

const readField = (record: Record<string, unknown>, aliases: ReadonlySet<string>): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.has(normalized(key))) return value;
  }
  return undefined;
};

export const extractUniqueRobinhoodAgenticAccountRef = (payload: unknown): string => {
  const records: Record<string, unknown>[] = [];
  collectRecords(payload, records);
  const allowedAliases = new Set(["agenticallowed"]);
  const refAliases = ["accountnumber", "accountref", "accountid", "reference", "id"];
  const refs = new Set<string>();
  for (const record of records) {
    const allowed = readField(record, allowedAliases);
    if (allowed !== true) continue;
    const ref = refAliases.reduce<unknown>((selected, alias) =>
      selected ?? readField(record, new Set([alias])), undefined);
    if (typeof ref === "string" && ref.trim() && ref.length <= 512) {
      refs.add(ref.trim());
    }
  }
  if (refs.size !== 1) {
    throw new RobinhoodMcpClientError(
      "contract",
      refs.size === 0
        ? "Robinhood did not identify a dedicated Agentic account."
        : "Robinhood returned more than one Agentic account.",
    );
  }
  return [...refs][0];
};

const decimal = (micros: number): string => {
  const whole = Math.floor(micros / 1_000_000);
  const fraction = String(micros % 1_000_000).padStart(6, "0").replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
};

const semanticAliases = {
  account: new Set(["account", "accountnumber", "accountid", "accountref"]),
  symbol: new Set(["symbol", "ticker", "stocksymbol"]),
  side: new Set(["side", "direction"]),
  orderType: new Set(["ordertype", "type"]),
  timeInForce: new Set(["timeinforce", "tif"]),
  quantity: new Set(["quantity", "assetquantity", "sharequantity", "shares"]),
  limitPrice: new Set(["limitprice", "price"]),
  extendedHours: new Set(["extendedhours", "extendedhourstrading"]),
} as const;

const propertyFor = (
  properties: Record<string, unknown>,
  aliases: ReadonlySet<string>,
): string | null => {
  const matches = Object.keys(properties).filter((key: string) =>
    aliases.has(normalized(key)));
  if (matches.length > 1) throw new RobinhoodMcpClientError(
    "contract", "Robinhood's order review schema is ambiguous.",
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
  throw new RobinhoodMcpClientError(
    "contract", "Robinhood's order review enum no longer admits the safe order value.",
  );
};

const scalar = (schema: unknown, value: string): string | number => {
  if (!isRecord(schema)) return value;
  const acceptsNumber = schema.type === "number" || schema.type === "integer" ||
    Array.isArray(schema.type) && schema.type.includes("number");
  if (!acceptsNumber) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new RobinhoodMcpClientError(
    "contract", "Robinhood's numeric order field is unsupported.",
  );
  return parsed;
};

export const buildRobinhoodEquityReviewArguments = (input: {
  inputSchema: unknown;
  accountRef: string;
  intent: HelixLiveEquityOrderIntent;
}): Record<string, unknown> => {
  if (!isRecord(input.inputSchema) || input.inputSchema.type !== "object" ||
      !isRecord(input.inputSchema.properties)) {
    throw new RobinhoodMcpClientError(
      "contract", "Robinhood's order review input schema is unsupported.",
    );
  }
  const properties = input.inputSchema.properties;
  const fields: Record<keyof typeof semanticAliases, string | null> = {
    account: propertyFor(properties, semanticAliases.account),
    symbol: propertyFor(properties, semanticAliases.symbol),
    side: propertyFor(properties, semanticAliases.side),
    orderType: propertyFor(properties, semanticAliases.orderType),
    timeInForce: propertyFor(properties, semanticAliases.timeInForce),
    quantity: propertyFor(properties, semanticAliases.quantity),
    limitPrice: propertyFor(properties, semanticAliases.limitPrice),
    extendedHours: propertyFor(properties, semanticAliases.extendedHours),
  };
  for (const requiredSemantic of ["symbol", "side", "orderType", "quantity", "limitPrice"] as const) {
    if (!fields[requiredSemantic]) throw new RobinhoodMcpClientError(
      "contract", `Robinhood's order review schema is missing ${requiredSemantic}.`,
    );
  }
  const required = Array.isArray(input.inputSchema.required)
    ? input.inputSchema.required.filter((entry: unknown): entry is string =>
      typeof entry === "string")
    : [];
  const recognized = new Set(Object.values(fields).filter(
    (field: string | null): field is string => Boolean(field),
  ));
  const unknownRequired = required.filter((field: string) => !recognized.has(field));
  if (unknownRequired.length) throw new RobinhoodMcpClientError(
    "contract", "Robinhood's order review schema contains an unreviewed required field.",
  );
  const output: Record<string, unknown> = {};
  const put = (field: string | null, value: unknown): void => {
    if (field) output[field] = value;
  };
  put(fields.account, input.accountRef);
  put(fields.symbol, input.intent.symbol);
  put(fields.side, enumValue(properties[fields.side!], ["buy"]));
  put(fields.orderType, enumValue(properties[fields.orderType!], ["limit"]));
  put(fields.timeInForce, enumValue(properties[fields.timeInForce!], ["gfd", "day"]));
  put(fields.quantity, scalar(properties[fields.quantity!], decimal(input.intent.quantity_micros)));
  put(fields.limitPrice, scalar(properties[fields.limitPrice!], decimal(input.intent.limit_price_micros)));
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
      const values = Array.isArray(value) ? value : [value];
      for (const entry of values) {
        if (typeof entry === "string" && entry.trim()) warnings.add(entry.trim().slice(0, 500));
        else if (isRecord(entry)) {
          const message = readField(entry, new Set(["message", "description", "text", "detail"]));
          if (typeof message === "string" && message.trim()) warnings.add(message.trim().slice(0, 500));
        }
      }
    }
  }
  return [...warnings].slice(0, 32);
};

const withMcp = async <T>(
  accessToken: string,
  fn: (client: McpClientLike, tools: ToolDescriptor[]) => Promise<T>,
): Promise<T> => {
  const client = new Client(
    { name: "casimirbot-robinhood-order-preview", version: "1.0.0" },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(HELIX_ROBINHOOD_TRADING_MCP_RESOURCE),
    { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } },
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
    return await fn(client as unknown as McpClientLike, tools);
  } catch (error) {
    if (error instanceof RobinhoodMcpClientError) throw error;
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unauthorized") || message.includes("401")) {
      throw new RobinhoodMcpClientError("unauthorized", "Robinhood rejected the access token.");
    }
    throw new RobinhoodMcpClientError("provider", "Robinhood MCP is temporarily unavailable.");
  } finally {
    await client.close().catch(() => undefined);
  }
};

export const discoverRobinhoodAgenticAccountOverMcp: RobinhoodAgenticAccountDiscovery =
  async ({ accessToken }) => withMcp(accessToken, async (
    client: McpClientLike,
    tools: ToolDescriptor[],
  ) => {
    const descriptor = tools.find((tool: ToolDescriptor) =>
      tool.name === "get_accounts");
    if (!descriptor || descriptor.annotations?.destructiveHint === true) {
      throw new RobinhoodMcpClientError("contract", "Robinhood get_accounts is unavailable or unsafe.");
    }
    const result = await client.callTool({ name: "get_accounts", arguments: {} }, undefined,
      { timeout: MCP_TIMEOUT_MS });
    if ("isError" in result && result.isError === true) throw new RobinhoodMcpClientError(
      "provider", "Robinhood could not identify the Agentic account.",
    );
    const payload = resultPayload(result);
    return {
      accountRef: extractUniqueRobinhoodAgenticAccountRef(payload),
      providerContractHash: SHA256(descriptor.inputSchema ?? null),
    };
  });

export const reviewRobinhoodEquityOrderOverMcp: RobinhoodEquityOrderReviewCall =
  async ({ accessToken, accountRef, intent }) =>
    withMcp(accessToken, async (
      client: McpClientLike,
      tools: ToolDescriptor[],
    ) => {
      const descriptor = tools.find((tool: ToolDescriptor) =>
        tool.name === "review_equity_order");
      if (!descriptor || descriptor.annotations?.destructiveHint === true) {
        throw new RobinhoodMcpClientError(
          "contract", "Robinhood review_equity_order is unavailable or marked destructive.",
        );
      }
      const args = buildRobinhoodEquityReviewArguments({
        inputSchema: descriptor.inputSchema,
        accountRef,
        intent,
      });
      const result = await client.callTool(
        { name: "review_equity_order", arguments: args }, undefined,
        { timeout: MCP_TIMEOUT_MS },
      );
      if ("isError" in result && result.isError === true) throw new RobinhoodMcpClientError(
        "provider", "Robinhood rejected the order review without placing an order.",
      );
      const rawReview = resultPayload(result);
      if (Buffer.byteLength(JSON.stringify(rawReview), "utf8") > MAX_PROVIDER_OUTPUT_BYTES) {
        throw new RobinhoodMcpClientError("contract", "Robinhood's order review exceeded the safe size limit.");
      }
      return {
        rawReview,
        publicReview: safePublicValue(rawReview),
        warnings: collectWarnings(rawReview),
        providerContractHash: SHA256(descriptor.inputSchema ?? null),
      };
    });
