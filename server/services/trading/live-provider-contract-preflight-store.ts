import crypto from "node:crypto";
import {
  HELIX_LIVE_PROVIDER_CONTRACT_PREFLIGHT_SCHEMA,
  helixLiveProviderContractGateSchema,
  helixLiveProviderContractPreflightSchema,
  type HelixLiveProviderContractGate,
  type HelixLiveProviderContractPreflight,
} from "@shared/trading/live-provider-contract-preflight";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";
import {
  assertRobinhoodPrivateRoomReadCapability,
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
} from "../brokerage/robinhood-connection-store";
import {
  assessRobinhoodLiveProviderCatalog,
  listRobinhoodLiveProviderCatalogOverMcp,
  RobinhoodLiveCatalogError,
  type RobinhoodLiveCatalogCall,
} from "../brokerage/robinhood-live-contract-preflight";
import { PaperTradingError } from "./paper-trading-errors";

export const LIVE_PROVIDER_CONTRACT_ACCEPTANCE_MS = 24 * 60 * 60 * 1_000;

type AcceptanceRow = {
  acceptance_id: string;
  connection_id: string;
  room_id: string;
  provider_id: "robinhood";
  verdict: "pass" | "fail";
  catalog_hash: string;
  gates_json: unknown;
  checked_at: Date | string;
  expires_at: Date | string;
};

const iso = (value: Date | string): string => new Date(value).toISOString();

const project = (
  row: AcceptanceRow,
  now = new Date(),
): HelixLiveProviderContractPreflight =>
  helixLiveProviderContractPreflightSchema.parse({
    schema: HELIX_LIVE_PROVIDER_CONTRACT_PREFLIGHT_SCHEMA,
    ok: true,
    acceptance_id: row.acceptance_id,
    connection_id: row.connection_id,
    room_id: row.room_id,
    provider_id: row.provider_id,
    verdict: row.verdict,
    catalog_hash: row.catalog_hash,
    gates: helixLiveProviderContractGateSchema.array().parse(row.gates_json),
    checked_at: iso(row.checked_at),
    expires_at: iso(row.expires_at),
    fresh: now.getTime() >= new Date(row.checked_at).getTime() &&
      now.getTime() < new Date(row.expires_at).getTime(),
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    provider_order_tool_calls_made: 0,
    live_order_execution_enabled: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });

export const runRobinhoodLiveProviderContractPreflight = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
  catalogCall?: RobinhoodLiveCatalogCall;
}): Promise<HelixLiveProviderContractPreflight> => {
  const now = input.now ?? new Date();
  const catalogCall = input.catalogCall ?? listRobinhoodLiveProviderCatalogOverMcp;
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
    now,
  });
  let tools: Awaited<ReturnType<RobinhoodLiveCatalogCall>>;
  try {
    tools = await catalogCall({ accessToken: lease.credentials.access_token });
  } catch (error) {
    if (!(error instanceof RobinhoodLiveCatalogError) ||
        error.kind !== "unauthorized") throw new PaperTradingError(
      "paper_trading_unavailable", 502,
      error instanceof RobinhoodLiveCatalogError
        ? error.message
        : "Robinhood's MCP tool catalog could not be inspected.",
    );
    lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      capabilityId: "brokerage.robinhood.market_data.read",
      forceRefresh: true,
      now,
    });
    try {
      tools = await catalogCall({ accessToken: lease.credentials.access_token });
    } catch (retryError) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 502,
        retryError instanceof RobinhoodLiveCatalogError
          ? retryError.message
          : "Robinhood's MCP tool catalog could not be inspected after token refresh.",
      );
    }
  }
  const inspection = assessRobinhoodLiveProviderCatalog(tools);
  const gates: HelixLiveProviderContractGate[] = inspection.gates;
  const verdict = gates.every((gate) => gate.verdict === "pass")
    ? "pass" as const : "fail" as const;
  const acceptanceId = `live_provider_acceptance:${crypto.randomUUID()}`;
  const expiresAt = new Date(now.getTime() + LIVE_PROVIDER_CONTRACT_ACCEPTANCE_MS);
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<AcceptanceRow>(
      `INSERT INTO helix_live_provider_contract_acceptances (
         acceptance_id, owner_profile_id, connection_id, room_id, provider_id,
         verdict, catalog_hash, gates_json, checked_at, expires_at
       ) VALUES ($1,$2,$3,$4,'robinhood',$5,$6,$7::jsonb,$8,$9)
       RETURNING *;`,
      [acceptanceId, input.ownerProfileId, input.connectionId, input.roomId,
        verdict, inspection.catalogHash, JSON.stringify(gates),
        now.toISOString(), expiresAt.toISOString()],
    );
    return project(rows[0], now);
  });
};

export const getLatestRobinhoodLiveProviderContractPreflight = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
}): Promise<HelixLiveProviderContractPreflight | null> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<AcceptanceRow>(
      `SELECT * FROM helix_live_provider_contract_acceptances
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       ORDER BY checked_at DESC, acceptance_id DESC LIMIT 1;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return rows[0] ? project(rows[0], input.now) : null;
  });
};

export const hasFreshRobinhoodLiveProviderContractAcceptance = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now: Date;
}): Promise<boolean> => {
  const { rows } = await input.client.query<{ acceptance_id: string }>(
    `SELECT acceptance_id FROM (
       SELECT acceptance_id, verdict, checked_at, expires_at
       FROM helix_live_provider_contract_acceptances
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
         AND provider_id = 'robinhood'
       ORDER BY checked_at DESC, acceptance_id DESC LIMIT 1
     ) latest
     WHERE verdict = 'pass' AND checked_at <= $4 AND expires_at > $4;`,
    [input.ownerProfileId, input.connectionId, input.roomId,
      input.now.toISOString()],
  );
  return Boolean(rows[0]);
};
