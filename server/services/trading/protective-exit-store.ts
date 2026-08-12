import crypto from "node:crypto";
import {
  HELIX_PROTECTIVE_EXIT_SCHEMA,
  helixProtectiveExitApprovalSchema,
  helixProtectiveExitExecutionSchema,
  helixProtectiveExitIntentSchema,
  helixProtectiveExitPreviewSchema,
  type HelixProtectiveExitApproval,
  type HelixProtectiveExitExecution,
  type HelixProtectiveExitPreview,
} from "@shared/trading/protective-exit-contract";
import { helixLiveEquityOrderIntentSchema } from
  "@shared/trading/live-order-contract";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";
import {
  decryptProviderCredential,
  encryptProviderCredential,
} from "../brokerage/provider-credential-vault";
import {
  assertRobinhoodPrivateRoomReadCapability,
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
} from "../brokerage/robinhood-connection-store";
import {
  placeRobinhoodProtectiveExitOverMcp,
  reviewRobinhoodProtectiveExitOverMcp,
  type RobinhoodProtectiveExitPlacementCall,
  type RobinhoodProtectiveExitReviewCall,
} from "../brokerage/robinhood-protective-exit-adapter";
import { RobinhoodLiveOrderCallError } from
  "../brokerage/robinhood-live-order-adapter";
import {
  cancelRobinhoodEquityOrderOverMcp,
  type RobinhoodLiveCancellationCall,
} from "../brokerage/robinhood-live-cancel-adapter";
import {
  executeRobinhoodPrivateRoomRead,
  type RobinhoodMcpReadCall,
} from "../brokerage/robinhood-read-adapter";
import {
  readLiveAccountPreflight,
  type LiveAccountPreflightSnapshot,
} from "./live-account-preflight";
import { PaperTradingError } from "./paper-trading-errors";
import { readUsMarketClock } from "./us-market-clock";

const PREVIEW_LIFETIME_MS = 90_000;
const PLACEMENT_PREVIEW_MAX_AGE_MS = 30_000;
const SNAPSHOT_MAX_AGE_MS = 10_000;

type EntryRow = {
  execution_id: string;
  control_id: string;
  state: string;
  intent_json: unknown;
  proposal_hash: string;
};

type PreviewRow = {
  exit_preview_id: string;
  client_preview_id: string;
  entry_execution_id: string;
  control_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  intent_json: unknown;
  proposal_hash: string;
  provider_review_hash: string;
  provider_contract_hash: string;
  preflight_snapshot_hash: string;
  encrypted_provider_review: string;
  provider_warnings: unknown;
  approval_phrase: string;
  status: "reviewed" | "approved" | "expired" | "consumed" | "invalidated";
  reviewed_at: Date | string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
  exit_approval_id?: string | null;
};

type ApprovalRow = {
  exit_approval_id: string;
  exit_preview_id: string;
  entry_execution_id: string;
  owner_profile_id: string;
  proposal_hash: string;
  provider_review_hash: string;
  approved_at: Date | string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
};

type ExitExecutionRow = {
  exit_execution_id: string;
  exit_preview_id: string;
  exit_approval_id: string;
  entry_execution_id: string;
  control_id: string;
  client_order_id: string;
  state: HelixProtectiveExitExecution["state"];
  intent_json: unknown;
  proposal_hash: string;
  provider_review_hash: string;
  provider_result_hash: string | null;
  provider_order_ref_hash: string | null;
  encrypted_provider_result: string | null;
  ambiguity_reason: string | null;
  reserved_at: Date | string;
  provider_call_started_at: Date | string | null;
  submitted_at: Date | string | null;
  reconciled_at: Date | string | null;
};

const iso = (value: Date | string): string => new Date(value).toISOString();
const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);
const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;
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
const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry: unknown): entry is string => typeof entry === "string")
  : [];
const decimal = (micros: number): string => {
  const whole = Math.floor(micros / 1_000_000);
  const fraction = String(micros % 1_000_000).padStart(6, "0")
    .replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
};

const projectPreview = (
  row: PreviewRow,
  now = new Date(),
): HelixProtectiveExitPreview => {
  const expired = now.getTime() >= new Date(row.expires_at).getTime();
  const status = expired && ["reviewed", "approved"].includes(row.status)
    ? "expired" : row.status;
  return helixProtectiveExitPreviewSchema.parse({
    schema: HELIX_PROTECTIVE_EXIT_SCHEMA,
    ok: true,
    exit_preview_id: row.exit_preview_id,
    client_preview_id: row.client_preview_id,
    entry_execution_id: row.entry_execution_id,
    approval_id: row.exit_approval_id ?? null,
    connection_id: row.connection_id,
    room_id: row.room_id,
    status,
    intent: row.intent_json,
    proposal_hash: row.proposal_hash,
    provider_review_hash: row.provider_review_hash,
    provider_contract_hash: row.provider_contract_hash,
    preflight_snapshot_hash: row.preflight_snapshot_hash,
    provider_warnings: strings(row.provider_warnings),
    approval_phrase: row.approval_phrase,
    reviewed_at: iso(row.reviewed_at),
    expires_at: iso(row.expires_at),
    manual_approval_required: true,
    approval_consumed: row.consumed_at !== null,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

const projectExecution = (
  row: ExitExecutionRow,
): HelixProtectiveExitExecution => helixProtectiveExitExecutionSchema.parse({
  schema: HELIX_PROTECTIVE_EXIT_SCHEMA,
  ok: true,
  exit_execution_id: row.exit_execution_id,
  exit_preview_id: row.exit_preview_id,
  exit_approval_id: row.exit_approval_id,
  entry_execution_id: row.entry_execution_id,
  client_order_id: row.client_order_id,
  state: row.state,
  intent: row.intent_json,
  proposal_hash: row.proposal_hash,
  provider_review_hash: row.provider_review_hash,
  provider_result_hash: row.provider_result_hash,
  provider_order_ref_hash: row.provider_order_ref_hash,
  ambiguity_reason: row.ambiguity_reason,
  reserved_at: iso(row.reserved_at),
  provider_call_started_at: isoOrNull(row.provider_call_started_at),
  submitted_at: isoOrNull(row.submitted_at),
  reconciled_at: isoOrNull(row.reconciled_at),
  live_order_execution_enabled: true,
  unattended: false,
  explicit_approval_consumed: true,
  risk_reducing_only: true,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
});

const appendEvent = async (input: {
  client: Queryable;
  entryExecutionId: string;
  exitExecutionId?: string | null;
  controlId: string;
  ownerProfileId: string;
  eventType: string;
  detail?: Record<string, unknown>;
  now: Date;
}): Promise<void> => {
  await input.client.query(
    `INSERT INTO helix_live_protective_exit_events (
       event_id, exit_execution_id, entry_execution_id, control_id,
       owner_profile_id, event_type, detail_json, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8);`,
    [randomId("protective_exit_event"), input.exitExecutionId ?? null,
      input.entryExecutionId, input.controlId, input.ownerProfileId,
      input.eventType, JSON.stringify(input.detail ?? {}),
      input.now.toISOString()],
  );
};

const loadEntry = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  entryExecutionId: string;
  forUpdate?: boolean;
}): Promise<EntryRow | null> => {
  const { rows } = await input.client.query<EntryRow>(
    `SELECT execution_id, control_id, state, intent_json, proposal_hash
     FROM helix_live_equity_executions
     WHERE execution_id = $1 AND owner_profile_id = $2
       AND connection_id = $3 AND room_id = $4
     LIMIT 1 ${input.forUpdate ? "FOR UPDATE" : ""};`,
    [input.entryExecutionId, input.ownerProfileId,
      input.connectionId, input.roomId],
  );
  return rows[0] ?? null;
};

export const createProtectiveExitPreview = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  entryExecutionId: string;
  clientPreviewId: string;
  exitKind?: "protective_stop" | "market_close";
  now?: Date;
  preflight?: LiveAccountPreflightSnapshot;
  reviewExit?: RobinhoodProtectiveExitReviewCall;
}): Promise<HelixProtectiveExitPreview> => {
  const now = input.now ?? new Date();
  if (readUsMarketClock(now).session !== "regular") throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "Protective stop reviews are limited to the regular U.S. market session.",
  );
  const entry = await withSharedRealtimeRoomTransaction((client: Queryable) =>
    loadEntry({ client, ...input }));
  if (!entry || entry.state !== "reconciled_filled") {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "A uniquely reconciled filled live entry is required before reviewing its protective stop.",
    );
  }
  const entryIntent = helixLiveEquityOrderIntentSchema.parse(entry.intent_json);
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const preflight = input.preflight ?? await readLiveAccountPreflight({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    accountRef,
    intent: entryIntent,
    now,
    maxAgeMs: SNAPSHOT_MAX_AGE_MS,
  });
  const exitKind = input.exitKind ?? "protective_stop";
  if (!preflight.symbol_position_open || preflight.open_position_count !== 1 ||
      (exitKind === "protective_stop" &&
       preflight.bid_micros <= entryIntent.stop_price_micros)) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      exitKind === "protective_stop"
        ? "The live position is absent, ambiguous, or already at/below its intended stop; use a reviewed market close or Robinhood directly."
        : "The exact live position is absent or ambiguous; use Robinhood directly.",
    );
  }
  const intent = helixProtectiveExitIntentSchema.parse({
    asset_type: "equity",
    symbol: entryIntent.symbol,
    side: "sell",
    order_type: exitKind === "protective_stop" ? "stop" : "market",
    time_in_force: "gfd",
    extended_hours: false,
    quantity_micros: entryIntent.quantity_micros,
    ...(exitKind === "protective_stop"
      ? { stop_price_micros: entryIntent.stop_price_micros } : {}),
  });
  const proposalHash = hash("helix-protective-exit-proposal/v1", {
    owner_profile_id: input.ownerProfileId,
    connection_id: input.connectionId,
    room_id: input.roomId,
    entry_execution_id: entry.execution_id,
    entry_proposal_hash: entry.proposal_hash,
    preflight_snapshot_hash: preflight.snapshot_hash,
    intent,
  });
  const existing = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `SELECT p.*, a.exit_approval_id
       FROM helix_live_protective_exit_previews p
       LEFT JOIN helix_live_protective_exit_approvals a
         ON a.exit_preview_id = p.exit_preview_id
       WHERE p.owner_profile_id = $1 AND p.client_preview_id = $2 LIMIT 1;`,
      [input.ownerProfileId, input.clientPreviewId],
    );
    return rows[0] ?? null;
  });
  if (existing) {
    if (existing.proposal_hash !== proposalHash) throw new PaperTradingError(
      "paper_order_replay_conflict", 409,
      "This protective-exit preview identity was used for different evidence.",
    );
    return projectPreview(existing, now);
  }
  const active = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows: previews } = await client.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_live_protective_exit_previews
       WHERE entry_execution_id = $1 AND status IN ('reviewed','approved');`,
      [entry.execution_id],
    );
    const { rows: executions } = await client.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_live_protective_exit_executions
       WHERE entry_execution_id = $1
         AND state NOT IN ('reconciled_cancelled','reconciled_rejected');`,
      [entry.execution_id],
    );
    return Number(previews[0]?.count ?? 0) +
      Number(executions[0]?.count ?? 0);
  });
  if (active > 0) throw new PaperTradingError(
    "paper_order_replay_conflict", 409,
    "This filled entry already has an active or consumed protective-exit review.",
  );
  const reviewExit = input.reviewExit ?? reviewRobinhoodProtectiveExitOverMcp;
  const review = async () => reviewExit({
    accessToken: lease.credentials.access_token, accountRef, intent,
  });
  let reviewed: Awaited<ReturnType<RobinhoodProtectiveExitReviewCall>>;
  try {
    try { reviewed = await review(); } catch (error) {
      if (!(error instanceof RobinhoodLiveOrderCallError) ||
          error.kind !== "unauthorized" || error.callAttempted) throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.equity_orders.read",
        forceRefresh: true,
        now,
      });
      reviewed = await review();
    }
  } catch (error) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 502,
      error instanceof Error ? error.message :
        "Robinhood could not review the protective stop.",
    );
  }
  const exitPreviewId = randomId("protective_exit_preview");
  const reviewedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + PREVIEW_LIFETIME_MS).toISOString();
  const providerReviewHash = hash(
    "robinhood-protective-exit-review/v1", reviewed.rawReview,
  );
  const approvalPhrase = intent.order_type === "stop"
    ? `APPROVE PROTECTIVE SELL ${decimal(intent.quantity_micros)} ${intent.symbol} STOP ${decimal(intent.stop_price_micros)} ENTRY ${entry.execution_id} PREVIEW ${exitPreviewId}`
    : `APPROVE MARKET CLOSE ${decimal(intent.quantity_micros)} ${intent.symbol} ENTRY ${entry.execution_id} PREVIEW ${exitPreviewId}`;
  const encryptedReview = encryptProviderCredential(
    { schema: HELIX_PROTECTIVE_EXIT_SCHEMA, review: reviewed.rawReview },
    `robinhood-protective-exit-review\n${exitPreviewId}\n${input.ownerProfileId}`,
  );
  const warnings = [
    ...reviewed.warnings,
    intent.order_type === "stop"
      ? "A stop order becomes a market order when triggered; its execution price is not guaranteed."
      : "A market close prioritizes execution, not price; its execution price is not guaranteed.",
  ].slice(0, 32);
  const created = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `INSERT INTO helix_live_protective_exit_previews (
         exit_preview_id, client_preview_id, entry_execution_id, control_id,
         owner_profile_id, connection_id, room_id, intent_json, proposal_hash,
         provider_review_hash, provider_contract_hash, preflight_snapshot_hash,
         encrypted_provider_review, provider_warnings, approval_phrase,
         reviewed_at, expires_at, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14::jsonb,
         $15,$16,$17,$16,$16) RETURNING *;`,
      [exitPreviewId, input.clientPreviewId, entry.execution_id, entry.control_id,
        input.ownerProfileId, input.connectionId, input.roomId,
        JSON.stringify(intent), proposalHash, providerReviewHash,
        reviewed.providerContractHash, preflight.snapshot_hash,
        encryptedReview.encryptedValue, JSON.stringify(warnings), approvalPhrase,
        reviewedAt, expiresAt],
    );
    return rows[0];
  });
  return projectPreview(created, now);
};

export const listProtectiveExitPreviews = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
}): Promise<{ schema: "helix.live_equity_protective_exit_preview_list.v1";
  ok: true; previews: HelixProtectiveExitPreview[] }> => {
  await assertRobinhoodPrivateRoomReadCapability({ ...input,
    capabilityId: "brokerage.robinhood.equity_orders.read" });
  const now = input.now ?? new Date();
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    await client.query(
      `UPDATE helix_live_protective_exit_previews SET status = 'expired',
         updated_at = $4 WHERE owner_profile_id = $1 AND connection_id = $2
         AND room_id = $3 AND status IN ('reviewed','approved')
         AND expires_at <= $4;`,
      [input.ownerProfileId, input.connectionId, input.roomId, now.toISOString()],
    );
    const { rows } = await client.query<PreviewRow>(
      `SELECT p.*, a.exit_approval_id
       FROM helix_live_protective_exit_previews p
       LEFT JOIN helix_live_protective_exit_approvals a
         ON a.exit_preview_id = p.exit_preview_id
       WHERE p.owner_profile_id = $1 AND p.connection_id = $2 AND p.room_id = $3
       ORDER BY p.reviewed_at DESC LIMIT 50;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return { schema: "helix.live_equity_protective_exit_preview_list.v1",
      ok: true, previews: rows.map((row) => projectPreview(row, now)) };
  });
};

export const approveProtectiveExitPreview = async (input: {
  ownerProfileId: string;
  sessionId: string;
  connectionId: string;
  roomId: string;
  exitPreviewId: string;
  approvalText: string;
  now?: Date;
}): Promise<HelixProtectiveExitApproval> => {
  await assertRobinhoodPrivateRoomReadCapability({ ...input,
    capabilityId: "brokerage.robinhood.equity_orders.read" });
  const now = input.now ?? new Date();
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `SELECT * FROM helix_live_protective_exit_previews
       WHERE exit_preview_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4 FOR UPDATE;`,
      [input.exitPreviewId, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    const preview = rows[0];
    if (!preview) throw new PaperTradingError(
      "paper_order_not_found", 404, "The protective-exit preview was not found.",
    );
    if (now.getTime() >= new Date(preview.expires_at).getTime()) {
      await client.query(
        `UPDATE helix_live_protective_exit_previews SET status = 'expired',
           updated_at = $2 WHERE exit_preview_id = $1;`,
        [preview.exit_preview_id, now.toISOString()],
      );
      throw new PaperTradingError(
        "paper_quote_evidence_stale", 409,
        "The protective stop review expired; request a fresh review.",
      );
    }
    if (preview.status !== "reviewed" ||
        input.approvalText !== preview.approval_phrase) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "The protective stop is no longer reviewable or its exact approval text does not match.",
      );
    }
    const entry = await loadEntry({ client, ...input,
      entryExecutionId: preview.entry_execution_id, forUpdate: true });
    if (!entry || entry.state !== "reconciled_filled") {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "The entry is no longer a reconciled open position.",
      );
    }
    const exitApprovalId = randomId("protective_exit_approval");
    const approvedAt = now.toISOString();
    await client.query(
      `INSERT INTO helix_live_protective_exit_approvals (
         exit_approval_id, exit_preview_id, entry_execution_id,
         owner_profile_id, session_hash, proposal_hash, provider_review_hash,
         approved_at, expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);`,
      [exitApprovalId, preview.exit_preview_id, preview.entry_execution_id,
        input.ownerProfileId,
        hash("helix-protective-exit-session/v1", input.sessionId),
        preview.proposal_hash, preview.provider_review_hash,
        approvedAt, iso(preview.expires_at)],
    );
    await client.query(
      `UPDATE helix_live_protective_exit_previews SET status = 'approved',
         updated_at = $2 WHERE exit_preview_id = $1;`,
      [preview.exit_preview_id, approvedAt],
    );
    return helixProtectiveExitApprovalSchema.parse({
      schema: HELIX_PROTECTIVE_EXIT_SCHEMA,
      ok: true,
      exit_approval_id: exitApprovalId,
      exit_preview_id: preview.exit_preview_id,
      entry_execution_id: preview.entry_execution_id,
      proposal_hash: preview.proposal_hash,
      provider_review_hash: preview.provider_review_hash,
      decision_source: "explicit_user",
      one_time: true,
      approved_at: approvedAt,
      expires_at: iso(preview.expires_at),
      consumed_at: null,
      live_order_execution_enabled: false,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
  });
};

export const executeApprovedProtectiveExit = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  exitApprovalId: string;
  clientOrderId: string;
  now?: Date;
  preflight?: LiveAccountPreflightSnapshot;
  placeExit?: RobinhoodProtectiveExitPlacementCall;
}): Promise<HelixProtectiveExitExecution> => {
  const now = input.now ?? new Date();
  if (readUsMarketClock(now).session !== "regular") throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "Protective stop placement is limited to the regular U.S. market session.",
  );
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const initial = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow & ApprovalRow & {
      entry_intent_json: unknown;
      entry_state: string;
      control_id: string;
    }>(
      `SELECT p.*, a.*, e.intent_json AS entry_intent_json,
              e.state AS entry_state, e.control_id
       FROM helix_live_protective_exit_approvals a
       JOIN helix_live_protective_exit_previews p
         ON p.exit_preview_id = a.exit_preview_id
       JOIN helix_live_equity_executions e
         ON e.execution_id = p.entry_execution_id
       WHERE a.exit_approval_id = $1 AND a.owner_profile_id = $2
         AND p.connection_id = $3 AND p.room_id = $4 LIMIT 1;`,
      [input.exitApprovalId, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    return rows[0];
  });
  if (!initial) throw new PaperTradingError(
    "paper_order_not_found", 404, "The protective-exit approval was not found.",
  );
  const entryIntent = helixLiveEquityOrderIntentSchema.parse(
    initial.entry_intent_json,
  );
  const preflight = input.preflight ?? await readLiveAccountPreflight({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    accountRef,
    intent: entryIntent,
    now,
    maxAgeMs: SNAPSHOT_MAX_AGE_MS,
  });
  if (!preflight.symbol_position_open || preflight.open_position_count !== 1) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The exact live position is no longer present; the protective stop was not placed.",
    );
  }
  const reserved = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow & ApprovalRow & {
      entry_state: string; control_id: string }>(
      `SELECT p.*, a.*, e.state AS entry_state, e.control_id
       FROM helix_live_protective_exit_approvals a
       JOIN helix_live_protective_exit_previews p
         ON p.exit_preview_id = a.exit_preview_id
       JOIN helix_live_equity_executions e
         ON e.execution_id = p.entry_execution_id
       WHERE a.exit_approval_id = $1 AND a.owner_profile_id = $2
         AND p.connection_id = $3 AND p.room_id = $4
       LIMIT 1 FOR UPDATE;`,
      [input.exitApprovalId, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    const row = rows[0];
    if (!row || row.status !== "approved" || row.consumed_at !== null ||
        row.entry_state !== "reconciled_filled" ||
        now.getTime() >= new Date(row.expires_at).getTime() ||
        now.getTime() - new Date(row.reviewed_at).getTime() >
          PLACEMENT_PREVIEW_MAX_AGE_MS) {
      throw new PaperTradingError(
        "paper_risk_decision_not_accepted", 409,
        "The protective stop approval, position, or live snapshot no longer admits placement.",
      );
    }
    const intent = helixProtectiveExitIntentSchema.parse(row.intent_json);
    const exitExecutionId = randomId("protective_exit_execution");
    const { rows: inserted } = await client.query<ExitExecutionRow>(
      `INSERT INTO helix_live_protective_exit_executions (
         exit_execution_id, exit_preview_id, exit_approval_id,
         entry_execution_id, control_id, owner_profile_id, connection_id,
         room_id, client_order_id, state, intent_json, proposal_hash,
         provider_review_hash, reserved_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'reserved',$10::jsonb,$11,$12,$13,$13)
       RETURNING *;`,
      [exitExecutionId, row.exit_preview_id, row.exit_approval_id,
        row.entry_execution_id, row.control_id, input.ownerProfileId,
        input.connectionId, input.roomId, input.clientOrderId,
        JSON.stringify(intent), row.proposal_hash, row.provider_review_hash,
        now.toISOString()],
    );
    await client.query(
      `UPDATE helix_live_protective_exit_approvals SET consumed_at = $2
       WHERE exit_approval_id = $1 AND consumed_at IS NULL;`,
      [row.exit_approval_id, now.toISOString()],
    );
    await client.query(
      `UPDATE helix_live_protective_exit_previews SET status = 'consumed',
         consumed_at = $2, updated_at = $2 WHERE exit_preview_id = $1;`,
      [row.exit_preview_id, now.toISOString()],
    );
    await appendEvent({ client, entryExecutionId: row.entry_execution_id,
      exitExecutionId, controlId: row.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: "protective_exit_reserved",
      detail: { preflight_snapshot_hash: preflight.snapshot_hash }, now });
    return { row: inserted[0], preview: row, intent };
  });
  const callStartedAt = new Date(Math.max(Date.now(), now.getTime()));
  await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    await client.query(
      `UPDATE helix_live_protective_exit_executions
       SET state = 'provider_call_started', provider_call_started_at = $2,
         updated_at = $2 WHERE exit_execution_id = $1 AND state = 'reserved';`,
      [reserved.row.exit_execution_id, callStartedAt.toISOString()],
    );
    await appendEvent({ client,
      entryExecutionId: reserved.row.entry_execution_id,
      exitExecutionId: reserved.row.exit_execution_id,
      controlId: reserved.row.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: "protective_exit_provider_call_started", now: callStartedAt });
  });
  const encryptedReview = decryptProviderCredential<{ review: unknown }>(
    reserved.preview.encrypted_provider_review,
    `robinhood-protective-exit-review\n${reserved.preview.exit_preview_id}\n${input.ownerProfileId}`,
  );
  const placeExit = input.placeExit ?? placeRobinhoodProtectiveExitOverMcp;
  const place = () => placeExit({
    accessToken: lease.credentials.access_token,
    accountRef,
    clientOrderId: input.clientOrderId,
    intent: reserved.intent,
    providerReview: encryptedReview.review,
  });
  try {
    let result: Awaited<ReturnType<RobinhoodProtectiveExitPlacementCall>>;
    try { result = await place(); } catch (error) {
      if (!(error instanceof RobinhoodLiveOrderCallError) ||
          error.kind !== "unauthorized" || error.callAttempted) throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.equity_orders.read",
        forceRefresh: true,
        now,
      });
      result = await place();
    }
    const submittedAt = new Date();
    const encryptedResult = encryptProviderCredential(
      { schema: HELIX_PROTECTIVE_EXIT_SCHEMA, result: result.rawResult,
        provider_order_ref: result.providerOrderRef },
      `robinhood-protective-exit-execution\n${reserved.row.exit_execution_id}\n${input.ownerProfileId}`,
    );
    return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
      const { rows } = await client.query<ExitExecutionRow>(
        `UPDATE helix_live_protective_exit_executions
         SET state = 'submitted', provider_contract_hash = $2,
           provider_result_hash = $3, provider_order_ref_hash = $4,
           encrypted_provider_result = $5, submitted_at = $6, updated_at = $6
         WHERE exit_execution_id = $1 RETURNING *;`,
        [reserved.row.exit_execution_id, result.providerContractHash,
          result.providerResultHash,
          hash("robinhood-provider-order-ref/v1", result.providerOrderRef),
          encryptedResult.encryptedValue, submittedAt.toISOString()],
      );
      await appendEvent({ client,
        entryExecutionId: reserved.row.entry_execution_id,
        exitExecutionId: reserved.row.exit_execution_id,
        controlId: reserved.row.control_id,
        ownerProfileId: input.ownerProfileId,
        eventType: "protective_exit_submission_acknowledged",
        detail: { provider_result_hash: result.providerResultHash },
        now: submittedAt });
      return projectExecution(rows[0]);
    });
  } catch (error) {
    const providerError = error instanceof RobinhoodLiveOrderCallError
      ? error : new RobinhoodLiveOrderCallError(
        "ambiguous", true,
        "The protective stop outcome is ambiguous and must be reconciled.",
      );
    const state = providerError.callAttempted && providerError.kind !== "rejected"
      ? "reconciliation_required" : "reconciled_rejected";
    return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
      const at = new Date();
      const { rows } = await client.query<ExitExecutionRow>(
        `UPDATE helix_live_protective_exit_executions SET state = $2,
           ambiguity_reason = $3,
           reconciled_at = CASE WHEN $2 = 'reconciled_rejected' THEN $4 ELSE NULL END,
           updated_at = $4 WHERE exit_execution_id = $1 RETURNING *;`,
        [reserved.row.exit_execution_id, state, providerError.message,
          at.toISOString()],
      );
      await appendEvent({ client,
        entryExecutionId: reserved.row.entry_execution_id,
        exitExecutionId: reserved.row.exit_execution_id,
        controlId: reserved.row.control_id,
        ownerProfileId: input.ownerProfileId,
        eventType: state === "reconciliation_required"
          ? "protective_exit_outcome_ambiguous" : "protective_exit_rejected",
        detail: { reason: providerError.message }, now: at });
      return projectExecution(rows[0]);
    });
  }
};

export const listProtectiveExitExecutions = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}): Promise<{ schema: "helix.live_equity_protective_exit_execution_list.v1";
  ok: true; executions: HelixProtectiveExitExecution[] }> => {
  await assertRobinhoodPrivateRoomReadCapability({ ...input,
    capabilityId: "brokerage.robinhood.equity_orders.read" });
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExitExecutionRow>(
      `SELECT * FROM helix_live_protective_exit_executions
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       ORDER BY reserved_at DESC LIMIT 50;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return { schema: "helix.live_equity_protective_exit_execution_list.v1",
      ok: true, executions: rows.map(projectExecution) };
  });
};

export const cancelProtectiveExitExecution = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  exitExecutionId: string;
  now?: Date;
  cancelOrder?: RobinhoodLiveCancellationCall;
}): Promise<HelixProtectiveExitExecution> => {
  const now = input.now ?? new Date();
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const reserved = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExitExecutionRow>(
      `SELECT * FROM helix_live_protective_exit_executions
       WHERE exit_execution_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4 LIMIT 1 FOR UPDATE;`,
      [input.exitExecutionId, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    const row = rows[0];
    if (!row) throw new PaperTradingError(
      "paper_order_not_found", 404,
      "The protective-stop execution was not found.",
    );
    if (!["submitted", "reconciliation_required", "reconciled_open"]
      .includes(row.state) || !row.encrypted_provider_result) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "Only an open protective stop with provider identity can be cancelled.",
      );
    }
    const { rows: prior } = await client.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_live_protective_exit_events
       WHERE exit_execution_id = $1 AND event_type = 'protective_exit_cancellation_reserved';`,
      [row.exit_execution_id],
    );
    if (Number(prior[0]?.count ?? 0) > 0) throw new PaperTradingError(
      "paper_order_replay_conflict", 409,
      "Protective-stop cancellation was already attempted once; reconcile it or use Robinhood directly.",
    );
    const envelope = decryptProviderCredential<{ provider_order_ref?: unknown }>(
      row.encrypted_provider_result,
      `robinhood-protective-exit-execution\n${row.exit_execution_id}\n${input.ownerProfileId}`,
    );
    if (typeof envelope.provider_order_ref !== "string" ||
        !envelope.provider_order_ref.trim()) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The encrypted protective-stop provider identity is invalid.",
    );
    await client.query(
      `UPDATE helix_live_protective_exit_executions
       SET state = 'reconciliation_required',
         ambiguity_reason = 'Protective-stop cancellation reserved; reconciliation required',
         updated_at = $2 WHERE exit_execution_id = $1;`,
      [row.exit_execution_id, now.toISOString()],
    );
    await appendEvent({ client, entryExecutionId: row.entry_execution_id,
      exitExecutionId: row.exit_execution_id, controlId: row.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: "protective_exit_cancellation_reserved", now });
    return { row, providerOrderRef: envelope.provider_order_ref.trim() };
  });
  const cancelOrder = input.cancelOrder ?? cancelRobinhoodEquityOrderOverMcp;
  const cancel = () => cancelOrder({
    accessToken: lease.credentials.access_token,
    accountRef,
    providerOrderRef: reserved.providerOrderRef,
  });
  let result: Awaited<ReturnType<RobinhoodLiveCancellationCall>> | null = null;
  let failure: RobinhoodLiveOrderCallError | null = null;
  try {
    try { result = await cancel(); } catch (error) {
      if (!(error instanceof RobinhoodLiveOrderCallError) ||
          error.kind !== "unauthorized" || error.callAttempted) throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.equity_orders.read",
        forceRefresh: true,
        now,
      });
      result = await cancel();
    }
  } catch (error) {
    failure = error instanceof RobinhoodLiveOrderCallError
      ? error : new RobinhoodLiveOrderCallError(
        "ambiguous", true,
        "The protective-stop cancellation outcome is ambiguous.",
      );
  }
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const at = new Date();
    const message = result
      ? "Robinhood acknowledged protective-stop cancellation; reconcile it"
      : failure?.callAttempted
        ? "Protective-stop cancellation outcome is ambiguous; reconcile it"
        : "Protective-stop cancellation admission failed; use Robinhood directly";
    const { rows } = await client.query<ExitExecutionRow>(
      `UPDATE helix_live_protective_exit_executions
       SET state = 'reconciliation_required', ambiguity_reason = $2,
         updated_at = $3 WHERE exit_execution_id = $1 RETURNING *;`,
      [reserved.row.exit_execution_id, message, at.toISOString()],
    );
    await appendEvent({ client,
      entryExecutionId: reserved.row.entry_execution_id,
      exitExecutionId: reserved.row.exit_execution_id,
      controlId: reserved.row.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: result ? "protective_exit_cancellation_acknowledged" :
        failure?.callAttempted ? "protective_exit_cancellation_ambiguous" :
          "protective_exit_cancellation_admission_failed",
      detail: result ? {
        provider_contract_hash: result.providerContractHash,
        provider_result_hash: result.providerResultHash,
      } : { reason: failure?.message ?? message }, now: at });
    return projectExecution(rows[0]);
  });
};

const normalized = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
const recordField = (
  record: Record<string, unknown>, aliases: ReadonlySet<string>,
): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.has(normalized(key))) return value;
  }
  return undefined;
};

export const reconcileProtectiveExitExecution = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  exitExecutionId: string;
  now?: Date;
  ordersData?: unknown;
  mcpCall?: RobinhoodMcpReadCall;
}): Promise<HelixProtectiveExitExecution> => {
  const now = input.now ?? new Date();
  const lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const current = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExitExecutionRow>(
      `SELECT * FROM helix_live_protective_exit_executions
       WHERE exit_execution_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4 LIMIT 1;`,
      [input.exitExecutionId, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    return rows[0] ?? null;
  });
  if (!current) throw new PaperTradingError(
    "paper_order_not_found", 404,
    "The protective-exit execution was not found.",
  );
  if (["reconciled_filled", "reconciled_cancelled", "reconciled_rejected"]
    .includes(current.state)) return projectExecution(current);
  const ordersData = input.ordersData ?? (await executeRobinhoodPrivateRoomRead({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    toolName: "get_equity_orders",
    arguments: { account_number: accountRef },
    now,
    mcpCall: input.mcpCall,
  })).data;
  const records: Record<string, unknown>[] = [];
  collectRecords(ordersData, records);
  const clientAliases = new Set(["clientorderid", "clientid", "idempotencykey"]);
  const providerAliases = new Set(["orderid", "ordernumber", "orderref", "id"]);
  const statusAliases = new Set(["status", "state", "orderstate"]);
  const matches = records.filter((record) => {
    const clientId = recordField(record, clientAliases);
    const providerRef = recordField(record, providerAliases);
    return clientId === current.client_order_id ||
      typeof providerRef === "string" && current.provider_order_ref_hash !== null &&
      hash("robinhood-provider-order-ref/v1", providerRef) ===
        current.provider_order_ref_hash;
  });
  let nextState: HelixProtectiveExitExecution["state"] =
    "reconciliation_required";
  let reason = "The protective stop is not uniquely present in order history.";
  if (matches.length === 1) {
    const status = recordField(matches[0], statusAliases);
    if (typeof status === "string") {
      const state = normalized(status);
      if (state === "filled") nextState = "reconciled_filled";
      else if (["cancelled", "canceled", "expired", "voided"].includes(state)) {
        nextState = "reconciled_cancelled";
      } else if (["rejected", "failed"].includes(state)) {
        nextState = "reconciled_rejected";
      } else nextState = "reconciled_open";
      reason = `Robinhood protective stop reconciled as ${state}.`;
    }
  }
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExitExecutionRow>(
      `UPDATE helix_live_protective_exit_executions SET state = $2,
         ambiguity_reason = $3,
         reconciled_at = CASE WHEN $2 <> 'reconciliation_required' THEN $4 ELSE NULL END,
         updated_at = $4 WHERE exit_execution_id = $1 RETURNING *;`,
      [current.exit_execution_id, nextState,
        nextState === "reconciliation_required" ? reason : null,
        now.toISOString()],
    );
    await appendEvent({ client,
      entryExecutionId: current.entry_execution_id,
      exitExecutionId: current.exit_execution_id,
      controlId: current.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: nextState === "reconciliation_required"
        ? "protective_exit_reconciliation_inconclusive"
        : "protective_exit_reconciled",
      detail: { state: nextState, reason }, now });
    return projectExecution(rows[0]);
  });
};
