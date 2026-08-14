import type { HelixRobinhoodReadOnlyUpstreamTool } from
  "@shared/helix-brokerage-environment";
import {
  persistRobinhoodAgenticAccountSelectionForPrivateRoom,
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
} from "../brokerage/robinhood-connection-store";
import {
  executeRobinhoodPrivateRoomRead,
  RobinhoodMcpClientError,
  type RobinhoodMcpReadCall,
} from "../brokerage/robinhood-read-adapter";
import {
  discoverRobinhoodAgenticAccountOverMcp,
  type RobinhoodAgenticAccountDiscovery,
} from "../brokerage/robinhood-order-preview-adapter";

const REQUIRED_READS: ReadonlyArray<Readonly<{
  toolName: HelixRobinhoodReadOnlyUpstreamTool;
  arguments: (accountRef: string, quoteSymbol: string) => Record<string, unknown>;
}>> = [
  { toolName: "get_portfolio",
    arguments: (accountRef) => ({ account_number: accountRef }) },
  { toolName: "get_realized_pnl",
    arguments: (accountRef) => ({
      account_number: accountRef,
      asset_classes: ["equity"],
      span: "3month",
      display_currency: "USD",
      timezone: "America/New_York",
    }) },
  { toolName: "get_equity_positions",
    arguments: (accountRef) => ({ account_number: accountRef }) },
  { toolName: "get_equity_quotes",
    arguments: (_accountRef, quoteSymbol) => ({ symbols: [quoteSymbol] }) },
  { toolName: "get_equity_orders",
    arguments: (accountRef) => ({ account_number: accountRef }) },
];

export type RobinhoodReadAcceptanceReceipt = Readonly<{
  schema: "helix.robinhood_read_acceptance.v1";
  ok: true;
  connection_id: string;
  room_id: string;
  quote_probe_symbol: string;
  account_selection_status: "agentic_selected";
  receipts: ReadonlyArray<Readonly<{
    upstream_tool: HelixRobinhoodReadOnlyUpstreamTool;
    observation_id: string;
    output_hash: string;
    observed_at: string;
  }>>;
  provider_order_tool_calls_made: 0;
  live_order_execution_enabled: false;
  credential_included: false;
  account_numbers_included: false;
  raw_provider_payload_included: false;
}>;

export const runRobinhoodReadAcceptance = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  quoteProbeSymbol: string;
  now?: Date;
  discoverAgenticAccount?: RobinhoodAgenticAccountDiscovery;
  mcpCall?: RobinhoodMcpReadCall;
}): Promise<RobinhoodReadAcceptanceReceipt> => {
  const now = input.now ?? new Date();
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
    now,
  });
  const discover = input.discoverAgenticAccount ??
    discoverRobinhoodAgenticAccountOverMcp;
  let accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) {
    let discovered;
    try {
      discovered = await discover({ accessToken: lease.credentials.access_token });
    } catch (error) {
      if (!(error instanceof RobinhoodMcpClientError) ||
          error.kind !== "unauthorized") throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.market_data.read",
        forceRefresh: true,
        now,
      });
      discovered = await discover({ accessToken: lease.credentials.access_token });
    }
    accountRef = discovered.accountRef;
    await persistRobinhoodAgenticAccountSelectionForPrivateRoom({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      providerAccountRef: accountRef,
      now,
    });
  }

  const receipts: RobinhoodReadAcceptanceReceipt["receipts"][number][] = [];
  for (const definition of REQUIRED_READS) {
    const observation = await executeRobinhoodPrivateRoomRead({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      toolName: definition.toolName,
      arguments: definition.arguments(accountRef, input.quoteProbeSymbol),
      mcpCall: input.mcpCall,
      now,
    });
    receipts.push({
      upstream_tool: observation.upstream_tool,
      observation_id: observation.observation_id,
      output_hash: observation.output_hash,
      observed_at: observation.observed_at,
    });
  }
  return {
    schema: "helix.robinhood_read_acceptance.v1",
    ok: true,
    connection_id: input.connectionId,
    room_id: input.roomId,
    quote_probe_symbol: input.quoteProbeSymbol,
    account_selection_status: "agentic_selected",
    receipts,
    provider_order_tool_calls_made: 0,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
  };
};
