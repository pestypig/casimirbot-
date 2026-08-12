import { z } from "zod";

export const HELIX_BROKERAGE_CONNECTION_SCHEMA =
  "helix.brokerage_connection.v1" as const;
export const HELIX_BROKERAGE_ROOM_BINDING_SCHEMA =
  "helix.brokerage_room_binding.v1" as const;
export const HELIX_BROKERAGE_CONNECTION_LIST_SCHEMA =
  "helix.brokerage_connection_list.v1" as const;
export const HELIX_BROKERAGE_ROOM_BINDING_LIST_SCHEMA =
  "helix.brokerage_room_binding_list.v1" as const;
export const HELIX_BROKERAGE_OAUTH_START_RECEIPT_SCHEMA =
  "helix.brokerage_oauth_start_receipt.v1" as const;
export const HELIX_BROKERAGE_OBSERVATION_SCHEMA =
  "helix.brokerage_observation.v1" as const;

export const HELIX_ROBINHOOD_PROVIDER_ID = "robinhood" as const;
export const HELIX_ROBINHOOD_TRADING_MCP_RESOURCE =
  "https://agent.robinhood.com/mcp/trading" as const;

export const HELIX_ROBINHOOD_READ_CAPABILITY_IDS = [
  "brokerage.robinhood.portfolio.read",
  "brokerage.robinhood.pnl.read",
  "brokerage.robinhood.watchlists.read",
  "brokerage.robinhood.market_data.read",
  "brokerage.robinhood.equity_positions.read",
  "brokerage.robinhood.equity_orders.read",
  "brokerage.robinhood.scans.read",
] as const;

export type HelixRobinhoodReadCapabilityId =
  (typeof HELIX_ROBINHOOD_READ_CAPABILITY_IDS)[number];

/**
 * This upstream allowlist deliberately omits get_accounts because Robinhood
 * documents that it can expose full account numbers. It also omits every
 * option, order review, order placement, cancellation, scanner mutation, and
 * watchlist mutation tool. The first brokerage slice does not execute these
 * tools; this list freezes the only read tools a later adapter may normalize.
 */
export const HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS = [
  "search",
  "get_portfolio",
  "get_realized_pnl",
  "get_pnl_trade_history",
  "get_watchlists",
  "get_watchlist_items",
  "get_popular_watchlists",
  "get_equity_historicals",
  "get_equity_fundamentals",
  "get_financials",
  "get_equity_price_book",
  "get_equity_technical_indicators",
  "get_earnings_results",
  "get_earnings_calendar",
  "get_indexes",
  "get_index_quotes",
  "get_equity_positions",
  "get_equity_tax_lots",
  "get_equity_quotes",
  "get_equity_orders",
  "get_equity_tradability",
  "get_scans",
  "get_scanner_filter_specs",
  "run_scan",
] as const;

export type HelixRobinhoodReadOnlyUpstreamTool =
  (typeof HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS)[number];

export const HELIX_ROBINHOOD_READ_TOOL_CAPABILITY = {
  search: "brokerage.robinhood.market_data.read",
  get_portfolio: "brokerage.robinhood.portfolio.read",
  get_realized_pnl: "brokerage.robinhood.pnl.read",
  get_pnl_trade_history: "brokerage.robinhood.pnl.read",
  get_watchlists: "brokerage.robinhood.watchlists.read",
  get_watchlist_items: "brokerage.robinhood.watchlists.read",
  get_popular_watchlists: "brokerage.robinhood.watchlists.read",
  get_equity_historicals: "brokerage.robinhood.market_data.read",
  get_equity_fundamentals: "brokerage.robinhood.market_data.read",
  get_financials: "brokerage.robinhood.market_data.read",
  get_equity_price_book: "brokerage.robinhood.market_data.read",
  get_equity_technical_indicators: "brokerage.robinhood.market_data.read",
  get_earnings_results: "brokerage.robinhood.market_data.read",
  get_earnings_calendar: "brokerage.robinhood.market_data.read",
  get_indexes: "brokerage.robinhood.market_data.read",
  get_index_quotes: "brokerage.robinhood.market_data.read",
  get_equity_positions: "brokerage.robinhood.equity_positions.read",
  get_equity_tax_lots: "brokerage.robinhood.equity_positions.read",
  get_equity_quotes: "brokerage.robinhood.market_data.read",
  get_equity_orders: "brokerage.robinhood.equity_orders.read",
  get_equity_tradability: "brokerage.robinhood.market_data.read",
  get_scans: "brokerage.robinhood.scans.read",
  get_scanner_filter_specs: "brokerage.robinhood.scans.read",
  run_scan: "brokerage.robinhood.scans.read",
} as const satisfies Record<
  HelixRobinhoodReadOnlyUpstreamTool,
  HelixRobinhoodReadCapabilityId
>;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestampSchema = z.string().datetime({ offset: true });
const capabilitySchema = z.enum(HELIX_ROBINHOOD_READ_CAPABILITY_IDS);

const nonAuthoritativeProjectionFields = {
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
};

export const helixBrokerageConnectionSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_CONNECTION_SCHEMA),
    connection_id: identifierSchema,
    provider: z.literal(HELIX_ROBINHOOD_PROVIDER_ID),
    environment_domain: z.literal("brokerage"),
    status: z.enum(["connected", "suspended", "error", "revoked"]),
    account_selection_status: z.enum(["pending", "agentic_selected"]),
    provider_account_label: z.string().trim().min(1).max(120).nullable(),
    capability_ids: z.array(capabilitySchema).max(
      HELIX_ROBINHOOD_READ_CAPABILITY_IDS.length,
    ),
    read_only: z.literal(true),
    upstream_tool_execution_enabled: z.literal(false),
    live_order_execution_enabled: z.literal(false),
    connected_at: timestampSchema,
    credential_expires_at: timestampSchema.nullable(),
    updated_at: timestampSchema,
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export type HelixBrokerageConnection = z.infer<
  typeof helixBrokerageConnectionSchema
>;

export const helixBrokerageRoomBindingSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_ROOM_BINDING_SCHEMA),
    binding_id: identifierSchema,
    connection_id: identifierSchema,
    room_id: identifierSchema,
    provider: z.literal(HELIX_ROBINHOOD_PROVIDER_ID),
    environment_domain: z.literal("brokerage"),
    status: z.enum(["active", "suspended", "revoked"]),
    privacy_state: z.enum(["owner_private", "privacy_invalidated"]),
    capability_ids: z.array(capabilitySchema).max(
      HELIX_ROBINHOOD_READ_CAPABILITY_IDS.length,
    ),
    read_only: z.literal(true),
    upstream_tool_execution_enabled: z.literal(false),
    live_order_execution_enabled: z.literal(false),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export type HelixBrokerageRoomBinding = z.infer<
  typeof helixBrokerageRoomBindingSchema
>;

export const helixBrokerageConnectionListSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_CONNECTION_LIST_SCHEMA),
    ok: z.literal(true),
    connections: z.array(helixBrokerageConnectionSchema).max(16),
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export const helixBrokerageRoomBindingListSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_ROOM_BINDING_LIST_SCHEMA),
    ok: z.literal(true),
    room_id: identifierSchema,
    bindings: z.array(helixBrokerageRoomBindingSchema).max(16),
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export const helixBrokerageOAuthStartReceiptSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_OAUTH_START_RECEIPT_SCHEMA),
    ok: z.literal(true),
    provider: z.literal(HELIX_ROBINHOOD_PROVIDER_ID),
    authorization_url: z.string().url(),
    expires_at: timestampSchema,
    browser_navigation_required: z.literal(true),
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export type HelixBrokerageOAuthStartReceipt = z.infer<
  typeof helixBrokerageOAuthStartReceiptSchema
>;

export const helixBrokerageObservationSchema = z
  .object({
    schema: z.literal(HELIX_BROKERAGE_OBSERVATION_SCHEMA),
    ok: z.literal(true),
    observation_id: identifierSchema,
    connection_id: identifierSchema,
    room_id: identifierSchema,
    provider: z.literal(HELIX_ROBINHOOD_PROVIDER_ID),
    environment_domain: z.literal("brokerage"),
    upstream_tool: z.enum(HELIX_ROBINHOOD_READ_ONLY_UPSTREAM_TOOLS),
    capability_id: capabilitySchema,
    producer_epoch_ref: identifierSchema,
    observed_at: timestampSchema,
    freshness_state: z.literal("fresh"),
    data: z.unknown(),
    input_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    output_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
    redaction_count: z.number().int().nonnegative(),
    truncated: z.boolean(),
    read_only: z.literal(true),
    live_order_execution_enabled: z.literal(false),
    ...nonAuthoritativeProjectionFields,
  })
  .strict();

export type HelixBrokerageObservation = z.infer<
  typeof helixBrokerageObservationSchema
>;
