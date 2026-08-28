import crypto from "node:crypto";
import {
  HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_ACCEPTANCE_SCHEMA,
  HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_EVIDENCE_SCHEMA,
  helixBrokerageReactiveLiveShadowAcceptanceRequestSchema,
  helixBrokerageReactiveLiveShadowAcceptanceSchema,
  helixBrokerageReactiveLiveShadowEvidenceLedgerSchema,
  helixBrokerageReactiveLiveShadowPollReceiptSchema,
  helixBrokerageReactiveLiveShadowProjectionSchema,
  type HelixBrokerageReactiveLiveShadowAcceptance,
  type HelixBrokerageReactiveLiveShadowEvidenceLedger,
  type HelixBrokerageReactiveLiveShadowPollReceipt,
} from "@shared/trading/brokerage-reactive-live-shadow";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { PaperTradingError } from "./paper-trading-errors";

type SessionRow = { projection_json: unknown };
type PollRow = { receipt_json: unknown };
type ArchiveRow = { evidence_json: unknown };

const parseJson = <T>(value: unknown): T => {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
};

const hash = (value: unknown): string => `sha256:${crypto.createHash("sha256")
  .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

const safety = {
  owner_private_source: true as const,
  source_read_only: true as const,
  simulated: true as const,
  provider_order_tool_calls_made: 0 as const,
  provider_mutation_attempted: false as const,
  live_order_execution_enabled: false as const,
  credential_included: false as const,
  account_numbers_included: false as const,
  raw_provider_payload_included: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
};

const requireSessionWithClient = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  shadowSessionId: string;
}): Promise<HelixBrokerageReactiveLiveShadowEvidenceLedger> => {
  const { rows } = await input.client.query<SessionRow>(
    `SELECT projection_json
       FROM helix_brokerage_reactive_shadow_sessions
      WHERE shadow_session_id=$1 LIMIT 1;`,
    [input.shadowSessionId],
  );
  if (!rows[0]) {
    throw new PaperTradingError(
      "reactive_shadow_not_found", 404,
      "The brokerage live-input shadow session was not found.",
    );
  }
  const session = helixBrokerageReactiveLiveShadowProjectionSchema.parse(
    parseJson(rows[0].projection_json),
  );
  if (session.owner_profile_id !== input.ownerProfileId ||
      session.connection_id !== input.connectionId ||
      session.room_id !== input.roomId) {
    throw new PaperTradingError(
      "reactive_controller_identity_mismatch", 403,
      "The live-shadow evidence identity does not match the signed-in route.",
    );
  }
  const pollRows = await input.client.query<PollRow>(
    `SELECT receipt_json
       FROM helix_brokerage_reactive_shadow_polls
      WHERE shadow_session_id=$1 AND disposition <> 'in_flight'
      ORDER BY poll_sequence ASC;`,
    [input.shadowSessionId],
  );
  const receipts = pollRows.rows.map((row) =>
    helixBrokerageReactiveLiveShadowPollReceiptSchema.parse(
      parseJson(row.receipt_json),
    ));
  const receiptHashes = receipts.map((receipt) => hash(receipt));
  const regularMarketDates = [...new Set(receipts.flatMap((receipt) => {
    const observation = receipt.normalized_observation;
    return observation?.market_session === "regular"
      ? [observation.event_time.slice(0, 10)] : [];
  }))].sort();
  const sourceGapCount = receipts.filter((receipt) =>
    receipt.disposition === "source_failed" ||
    receipt.disposition === "normalization_failed" ||
    receipt.normalized_observation?.retention_gap_after_sequence !== null &&
      receipt.normalized_observation?.retention_gap_after_sequence !== undefined
  ).length;
  const watchdogReactionCount = receipts.filter((receipt) =>
    receipt.controller_run?.status === "watchdog_tripped" ||
    receipt.controller_receipt?.decision_receipt.watchdog.state === "tripped"
  ).length;
  const complete = session.status !== "active" &&
    !session.poll_in_flight && receipts.length === session.polls_attempted;
  const evidenceCore = {
    shadow_session: session,
    receipt_hashes: receiptHashes,
    regular_market_dates: regularMarketDates,
    source_gap_count: sourceGapCount,
    watchdog_reaction_count: watchdogReactionCount,
    complete,
  };
  return helixBrokerageReactiveLiveShadowEvidenceLedgerSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_EVIDENCE_SCHEMA,
    shadow_session: session,
    receipts,
    receipt_hashes: receiptHashes,
    evidence_hash: hash(evidenceCore),
    settled_poll_count: receipts.length,
    regular_market_dates: regularMarketDates,
    source_gap_count: sourceGapCount,
    watchdog_reaction_count: watchdogReactionCount,
    complete,
    restart_safe_persistence: true,
    maturity_authority: false,
    ...safety,
  });
};

export const readBrokerageReactiveLiveShadowEvidence = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  shadowSessionId: string;
}): Promise<HelixBrokerageReactiveLiveShadowEvidenceLedger> => {
  const client = await readSharedRealtimeRoomDatabase();
  return requireSessionWithClient({ client, ...input });
};

const latencySummary = (values: number[]) => ({
  samples: values.length,
  minimum_ms: values.length > 0 ? Math.min(...values) : null,
  maximum_ms: values.length > 0 ? Math.max(...values) : null,
  mean_ms: values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null,
});

const requireQualified = (
  ledgers: HelixBrokerageReactiveLiveShadowEvidenceLedger[],
): void => {
  const first = ledgers[0]!;
  const sameIdentity = ledgers.every((ledger) =>
    ledger.shadow_session.owner_profile_id === first.shadow_session.owner_profile_id &&
    ledger.shadow_session.connection_id === first.shadow_session.connection_id &&
    ledger.shadow_session.room_id === first.shadow_session.room_id &&
    ledger.shadow_session.environment_binding_id ===
      first.shadow_session.environment_binding_id &&
    ledger.shadow_session.controller_profile_id ===
      first.shadow_session.controller_profile_id &&
    ledger.shadow_session.strategy_artifact_hash ===
      first.shadow_session.strategy_artifact_hash &&
    ledger.shadow_session.symbol === first.shadow_session.symbol);
  const dates = new Set(ledgers.flatMap((ledger) => ledger.regular_market_dates));
  const complete = ledgers.every((ledger) =>
    ledger.complete && ledger.shadow_session.regular_session_observations > 0);
  const processed = ledgers.flatMap((ledger) => ledger.receipts)
    .filter((receipt) => receipt.disposition === "processed");
  if (!sameIdentity || !complete || dates.size < 2 || processed.length < 2) {
    throw new PaperTradingError(
      "reactive_shadow_acceptance_not_ready", 409,
      "R3 qualification requires complete identity-matched shadow evidence with processed regular-hours observations on at least two market dates.",
    );
  }
};

export const archiveBrokerageReactiveLiveShadowAcceptance = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  request: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveLiveShadowAcceptance> => {
  const request = helixBrokerageReactiveLiveShadowAcceptanceRequestSchema.parse(
    input.request,
  );
  const ids = [...request.shadow_session_ids].sort();
  const qualifiedAt = (input.now ?? new Date()).toISOString();
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const ledgers = await Promise.all(ids.map((shadowSessionId) =>
      requireSessionWithClient({
        client,
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        shadowSessionId,
      })));
    requireQualified(ledgers);
    const receipts = ledgers.flatMap((ledger) => ledger.receipts);
    const processed = receipts.filter((receipt) =>
      receipt.disposition === "processed");
    const regularMarketDates = [...new Set(ledgers.flatMap((ledger) =>
      ledger.regular_market_dates))].sort();
    const first = ledgers[0]!.shadow_session;
    const evidenceCore = {
      owner_profile_id: input.ownerProfileId,
      connection_id: input.connectionId,
      room_id: input.roomId,
      environment_binding_id: first.environment_binding_id,
      controller_profile_id: first.controller_profile_id,
      strategy_artifact_hash: first.strategy_artifact_hash,
      symbol: first.symbol,
      shadow_session_ids: ids,
      session_evidence_hashes: ledgers.map((ledger) => ledger.evidence_hash),
      regular_market_dates: regularMarketDates,
      settled_poll_count: receipts.length,
      processed_poll_count: processed.length,
      regular_session_observation_count: ledgers.reduce((sum, ledger) =>
        sum + ledger.shadow_session.regular_session_observations, 0),
      source_gap_count: ledgers.reduce((sum, ledger) =>
        sum + ledger.source_gap_count, 0),
      watchdog_reaction_count: ledgers.reduce((sum, ledger) =>
        sum + ledger.watchdog_reaction_count, 0),
    };
    const evidenceHash = hash(evidenceCore);
    const archiveId = `reactive_shadow_acceptance:${evidenceHash.slice(7)}`;
    const projection = helixBrokerageReactiveLiveShadowAcceptanceSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_ACCEPTANCE_SCHEMA,
      ok: true,
      archive_id: archiveId,
      evidence_hash: evidenceHash,
      status: "qualified",
      ...evidenceCore,
      terminal_session_count: ledgers.length,
      degraded_timing_observation_count: receipts.filter((receipt) =>
        receipt.degraded_timing_reasons.length > 0).length,
      poll_duration: latencySummary(receipts.map((receipt) =>
        receipt.poll_duration_ms)),
      provider_to_arrival: latencySummary(receipts.flatMap((receipt) =>
        receipt.provider_to_arrival_ms === null
          ? [] : [receipt.provider_to_arrival_ms])),
      arrival_to_decision: latencySummary(receipts.map((receipt) =>
        receipt.arrival_to_decision_ms)),
      end_to_end: latencySummary(receipts.flatMap((receipt) =>
        receipt.end_to_end_ms === null ? [] : [receipt.end_to_end_ms])),
      all_sessions_complete: true,
      multiple_regular_hours_sessions: true,
      latency_measured: true,
      restart_safe_persistence: true,
      ready_for_maturity_review: true,
      canonical_maturity_updated: false,
      maturity_authority: false,
      qualified_at: qualifiedAt,
      ...safety,
    });
    const { rows } = await client.query<ArchiveRow>(
      `INSERT INTO helix_brokerage_reactive_shadow_acceptance_archives(
         archive_id, owner_profile_id, connection_id, room_id,
         evidence_hash, evidence_json, status, qualified_at
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'qualified',$7)
       ON CONFLICT (owner_profile_id, connection_id, room_id, evidence_hash)
       DO NOTHING RETURNING evidence_json;`,
      [archiveId, input.ownerProfileId, input.connectionId, input.roomId,
        evidenceHash, JSON.stringify(projection), qualifiedAt],
    );
    if (rows[0]) return projection;
    const replay = await client.query<ArchiveRow>(
      `SELECT evidence_json
         FROM helix_brokerage_reactive_shadow_acceptance_archives
        WHERE owner_profile_id=$1 AND connection_id=$2 AND room_id=$3
          AND evidence_hash=$4 LIMIT 1;`,
      [input.ownerProfileId, input.connectionId, input.roomId, evidenceHash],
    );
    if (!replay.rows[0]) {
      throw new PaperTradingError(
        "reactive_shadow_evidence_incomplete", 503,
        "The immutable R3 qualification evidence could not be committed.",
      );
    }
    return helixBrokerageReactiveLiveShadowAcceptanceSchema.parse(
      parseJson(replay.rows[0].evidence_json),
    );
  });
};

export const getLatestBrokerageReactiveLiveShadowAcceptance = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}): Promise<HelixBrokerageReactiveLiveShadowAcceptance | null> => {
  const client = await readSharedRealtimeRoomDatabase();
  const { rows } = await client.query<ArchiveRow>(
    `SELECT evidence_json
       FROM helix_brokerage_reactive_shadow_acceptance_archives
      WHERE owner_profile_id=$1 AND connection_id=$2 AND room_id=$3
      ORDER BY qualified_at DESC, archive_id DESC LIMIT 1;`,
    [input.ownerProfileId, input.connectionId, input.roomId],
  );
  return rows[0]
    ? helixBrokerageReactiveLiveShadowAcceptanceSchema.parse(
      parseJson(rows[0].evidence_json),
    ) : null;
};
