import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "@shared/helix-brokerage-environment";
import type { HelixLiveEquityOrderIntent } from
  "@shared/trading/live-order-contract";

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

export class RobinhoodLiveOrderCallError extends Error {
  constructor(
    readonly kind: "contract" | "rejected" | "ambiguous" | "unauthorized",
    readonly callAttempted: boolean,
    message: string,
  ) {
    super(message);
    this.name = "RobinhoodLiveOrderCallError";
  }
}

export type RobinhoodLivePlacementResult = {
  rawResult: unknown;
  providerContractHash: string;
  providerResultHash: string;
  providerOrderRef: string;
};

export type RobinhoodLivePlacementCall = (input: {
  accessToken: string;
  accountRef: string;
  clientOrderId: string;
  intent: HelixLiveEquityOrderIntent;
  providerReview: unknown;
}) => Promise<RobinhoodLivePlacementResult>;

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

const decimal = (micros: number): string => {
  const whole = Math.floor(micros / 1_000_000);
  const fraction = String(micros % 1_000_000).padStart(6, "0")
    .replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
};

const field = (
  properties: Record<string, unknown>,
  aliases: ReadonlySet<string>,
): string | null => {
  const matches = Object.keys(properties).filter((key: string) =>
    aliases.has(normalized(key)));
  if (matches.length > 1) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's placement schema is ambiguous.",
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
    "Robinhood's placement enum no longer admits the reviewed safe value.",
  );
};

const scalar = (schema: unknown, value: string): string | number => {
  if (!isRecord(schema) ||
      schema.type !== "number" && schema.type !== "integer") return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's numeric placement field is unsupported.",
  );
  return parsed;
};

export const buildRobinhoodLivePlacementArguments = (input: {
  inputSchema: unknown;
  accountRef: string;
  clientOrderId: string;
  intent: HelixLiveEquityOrderIntent;
  providerReview: unknown;
}): Record<string, unknown> => {
  if (!isRecord(input.inputSchema) || input.inputSchema.type !== "object" ||
      !isRecord(input.inputSchema.properties)) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false, "Robinhood's placement input schema is unsupported.",
    );
  }
  const properties = input.inputSchema.properties;
  const fields = {
    account: field(properties, new Set(["account", "accountnumber", "accountid", "accountref"])),
    clientOrderId: field(properties, new Set(["clientorderid", "clientid", "idempotencykey"])),
    review: field(properties, new Set(["reviewid", "reviewtoken", "previewid", "previewtoken", "orderreviewid"])),
    symbol: field(properties, new Set(["symbol", "ticker", "stocksymbol"])),
    side: field(properties, new Set(["side", "direction"])),
    orderType: field(properties, new Set(["ordertype", "type"])),
    timeInForce: field(properties, new Set(["timeinforce", "tif"])),
    quantity: field(properties, new Set(["quantity", "assetquantity", "sharequantity", "shares"])),
    limitPrice: field(properties, new Set(["limitprice", "price"])),
    extendedHours: field(properties, new Set(["extendedhours", "extendedhourstrading"])),
  };
  const required = Array.isArray(input.inputSchema.required)
    ? input.inputSchema.required.filter((entry: unknown): entry is string =>
      typeof entry === "string") : [];
  const recognized = new Set(Object.values(fields).filter(
    (entry: string | null): entry is string => Boolean(entry),
  ));
  if (required.some((entry: string) => !recognized.has(entry))) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's placement schema contains an unreviewed required field.",
    );
  }
  for (const requiredField of ["account", "clientOrderId", "symbol", "side",
    "orderType", "quantity", "limitPrice"] as const) {
    if (!fields[requiredField]) throw new RobinhoodLiveOrderCallError(
      "contract", false,
      `Robinhood's placement schema is missing ${requiredField}.`,
    );
  }
  const reviewRef = fields.review ? uniqueValue(input.providerReview,
    new Set(["reviewid", "reviewtoken", "previewid", "previewtoken", "orderreviewid"])) : null;
  if (fields.review && !reviewRef) throw new RobinhoodLiveOrderCallError(
    "contract", false,
    "The encrypted Robinhood review does not contain one unambiguous placement reference.",
  );
  const output: Record<string, unknown> = {};
  const put = (name: string | null, value: unknown): void => {
    if (name) output[name] = value;
  };
  put(fields.account, input.accountRef);
  put(fields.clientOrderId, input.clientOrderId);
  put(fields.review, reviewRef);
  put(fields.symbol, input.intent.symbol);
  put(fields.side, enumValue(properties[fields.side!], ["buy"]));
  put(fields.orderType, enumValue(properties[fields.orderType!], ["limit"]));
  put(fields.timeInForce, enumValue(properties[fields.timeInForce!], ["gfd", "day"]));
  put(fields.quantity, scalar(properties[fields.quantity!],
    decimal(input.intent.quantity_micros)));
  put(fields.limitPrice, scalar(properties[fields.limitPrice!],
    decimal(input.intent.limit_price_micros)));
  put(fields.extendedHours, false);
  return output;
};

const extractProviderOrderRef = (payload: unknown): string => {
  const ref = uniqueValue(payload, new Set([
    "orderid", "ordernumber", "orderref", "id",
  ]));
  if (!ref) throw new RobinhoodLiveOrderCallError(
    "ambiguous", true,
    "Robinhood returned success without one reconcilable provider order identity.",
  );
  return ref;
};

export const placeRobinhoodEquityOrderOverMcp: RobinhoodLivePlacementCall =
  async (input) => {
    const client = new Client(
      { name: "casimirbot-robinhood-live-executor", version: "1.0.0" },
      { capabilities: {} },
    );
    const transport = new StreamableHTTPClientTransport(
      new URL(HELIX_ROBINHOOD_TRADING_MCP_RESOURCE),
      { requestInit: { headers: { Authorization: `Bearer ${input.accessToken}` } } },
    );
    let callAttempted = false;
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
      const descriptor = tools.find((tool: ToolDescriptor) =>
        tool.name === "place_equity_order");
      if (!descriptor || descriptor.annotations?.destructiveHint !== true) {
        throw new RobinhoodLiveOrderCallError(
          "contract", false,
          "Robinhood place_equity_order is absent or not explicitly marked destructive.",
        );
      }
      const args = buildRobinhoodLivePlacementArguments({
        inputSchema: descriptor.inputSchema,
        accountRef: input.accountRef,
        clientOrderId: input.clientOrderId,
        intent: input.intent,
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
          "Robinhood returned a typed order rejection.",
        );
      }
      const rawResult = resultPayload(result);
      if (Buffer.byteLength(JSON.stringify(rawResult), "utf8") > MAX_RESULT_BYTES) {
        throw new RobinhoodLiveOrderCallError(
          "ambiguous", true,
          "Robinhood's placement result exceeded the safe persistence limit.",
        );
      }
      return {
        rawResult,
        providerContractHash: hash(descriptor.inputSchema ?? null),
        providerResultHash: hash(rawResult),
        providerOrderRef: extractProviderOrderRef(rawResult),
      };
    } catch (error) {
      if (error instanceof RobinhoodLiveOrderCallError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!callAttempted && (message.includes("unauthorized") || message.includes("401"))) {
        throw new RobinhoodLiveOrderCallError(
          "unauthorized", false, "Robinhood rejected the access token before placement.",
        );
      }
      throw new RobinhoodLiveOrderCallError(
        callAttempted ? "ambiguous" : "contract",
        callAttempted,
        callAttempted
          ? "The Robinhood placement outcome is ambiguous and must not be retried."
          : "Robinhood placement admission failed before the provider call.",
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  };
