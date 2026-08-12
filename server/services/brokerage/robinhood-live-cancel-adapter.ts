import crypto from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "@shared/helix-brokerage-environment";
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

export type RobinhoodLiveCancellationResult = {
  rawResult: unknown;
  providerContractHash: string;
  providerResultHash: string;
};

export type RobinhoodLiveCancellationCall = (input: {
  accessToken: string;
  accountRef: string;
  providerOrderRef: string;
}) => Promise<RobinhoodLiveCancellationResult>;

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

const field = (
  properties: Record<string, unknown>,
  aliases: ReadonlySet<string>,
): string | null => {
  const matches = Object.keys(properties).filter((key: string) =>
    aliases.has(normalized(key)));
  if (matches.length > 1) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's cancellation schema is ambiguous.",
  );
  return matches[0] ?? null;
};

export const buildRobinhoodLiveCancellationArguments = (input: {
  inputSchema: unknown;
  accountRef: string;
  providerOrderRef: string;
}): Record<string, unknown> => {
  if (!isRecord(input.inputSchema) || input.inputSchema.type !== "object" ||
      !isRecord(input.inputSchema.properties)) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false, "Robinhood's cancellation input schema is unsupported.",
    );
  }
  const properties = input.inputSchema.properties;
  const fields = {
    account: field(properties, new Set([
      "account", "accountnumber", "accountid", "accountref",
    ])),
    order: field(properties, new Set([
      "order", "orderid", "ordernumber", "orderref", "equityorderid",
    ])),
  };
  if (!fields.order) throw new RobinhoodLiveOrderCallError(
    "contract", false, "Robinhood's cancellation schema is missing orderId.",
  );
  const required = Array.isArray(input.inputSchema.required)
    ? input.inputSchema.required.filter((entry: unknown): entry is string =>
      typeof entry === "string") : [];
  const recognized = new Set(Object.values(fields).filter(
    (entry: string | null): entry is string => Boolean(entry),
  ));
  if (required.some((entry: string) => !recognized.has(entry))) {
    throw new RobinhoodLiveOrderCallError(
      "contract", false,
      "Robinhood's cancellation schema contains an unreviewed required field.",
    );
  }
  return {
    ...(fields.account ? { [fields.account]: input.accountRef } : {}),
    [fields.order]: input.providerOrderRef,
  };
};

export const cancelRobinhoodEquityOrderOverMcp: RobinhoodLiveCancellationCall =
  async (input) => {
    const client = new Client(
      { name: "casimirbot-robinhood-live-canceller", version: "1.0.0" },
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
        tool.name === "cancel_equity_order");
      if (!descriptor || descriptor.annotations?.destructiveHint !== true) {
        throw new RobinhoodLiveOrderCallError(
          "contract", false,
          "Robinhood cancel_equity_order is absent or not explicitly marked destructive.",
        );
      }
      const args = buildRobinhoodLiveCancellationArguments({
        inputSchema: descriptor.inputSchema,
        accountRef: input.accountRef,
        providerOrderRef: input.providerOrderRef,
      });
      callAttempted = true;
      const result = await client.callTool(
        { name: "cancel_equity_order", arguments: args }, undefined,
        { timeout: MCP_TIMEOUT_MS },
      );
      if ("isError" in result && result.isError === true) {
        throw new RobinhoodLiveOrderCallError(
          "rejected", true,
          "Robinhood returned a typed cancellation rejection.",
        );
      }
      const rawResult = resultPayload(result);
      if (Buffer.byteLength(JSON.stringify(rawResult), "utf8") > MAX_RESULT_BYTES) {
        throw new RobinhoodLiveOrderCallError(
          "ambiguous", true,
          "Robinhood's cancellation result exceeded the safe persistence limit.",
        );
      }
      return {
        rawResult,
        providerContractHash: hash(descriptor.inputSchema ?? null),
        providerResultHash: hash(rawResult),
      };
    } catch (error) {
      if (error instanceof RobinhoodLiveOrderCallError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!callAttempted &&
          (message.includes("unauthorized") || message.includes("401"))) {
        throw new RobinhoodLiveOrderCallError(
          "unauthorized", false,
          "Robinhood rejected the access token before cancellation.",
        );
      }
      throw new RobinhoodLiveOrderCallError(
        callAttempted ? "ambiguous" : "contract",
        callAttempted,
        callAttempted
          ? "The Robinhood cancellation outcome is ambiguous and must not be retried."
          : "Robinhood cancellation admission failed before the provider call.",
      );
    } finally {
      await client.close().catch(() => undefined);
    }
  };
