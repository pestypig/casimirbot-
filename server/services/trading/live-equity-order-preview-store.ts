import crypto from "node:crypto";
import {
  HELIX_LIVE_EQUITY_ORDER_APPROVAL_SCHEMA,
  HELIX_LIVE_EQUITY_ORDER_PREVIEW_SCHEMA,
  helixLiveEquityOrderApprovalSchema,
  helixLiveEquityOrderIntentSchema,
  helixLiveEquityOrderPreviewSchema,
  type HelixLiveEquityOrderApproval,
  type HelixLiveEquityOrderIntent,
  type HelixLiveEquityOrderPreview,
} from "@shared/trading/live-order-contract";
import { helixPaperTradeCandidateSchema, helixTradingRiskDecisionSchema,
  helixTradingRiskPolicySchema } from "@shared/trading/risk-contract";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { encryptProviderCredential } from
  "../brokerage/provider-credential-vault";
import {
  assertRobinhoodPrivateRoomReadCapability,
  persistRobinhoodAgenticAccountSelectionForPrivateRoom,
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
  RobinhoodConnectionError,
} from "../brokerage/robinhood-connection-store";
import {
  discoverRobinhoodAgenticAccountOverMcp,
  reviewRobinhoodEquityOrderOverMcp,
  type RobinhoodAgenticAccountDiscovery,
  type RobinhoodEquityOrderReviewCall,
} from "../brokerage/robinhood-order-preview-adapter";
import { RobinhoodMcpClientError } from
  "../brokerage/robinhood-read-adapter";
import { readPaperQuoteEvidence } from "./paper-market-evidence";
import { PaperTradingError } from "./paper-trading-errors";
import { readUsMarketClock } from "./us-market-clock";

const PREVIEW_LIFETIME_MS = 90_000;
const MAX_RISK_DECISION_AGE_MS = 60_000;

type PreviewRow = {
  preview_id: string;
  client_preview_id: string;
  connection_id: string;
  room_id: string;
  paper_account_id: string;
  risk_decision_id: string;
  approval_id?: string | null;
  proposal_hash: string;
  provider_review_hash: string;
  provider_contract_hash: string;
  intent_json: unknown;
  provider_warnings: unknown;
  approval_phrase: string;
  status: "reviewed" | "approved" | "expired" | "consumed" | "invalidated";
  reviewed_at: Date | string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
};

type RiskRow = {
  decision_id: string;
  account_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  verdict: string;
  source_observation_ids: unknown;
  candidate_json: unknown;
  decision_json: unknown;
  evaluated_at: Date | string;
  policy_json: unknown;
  policy_hash: string;
  account_equity_cents: number | string;
  buying_power_cents: number | string;
  kill_switch_active: boolean;
  status: string;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort((left: [string, unknown], right: [string, unknown]) =>
        left[0].localeCompare(right[0]))
      .map((entry: [string, unknown]) =>
        [entry[0], canonicalize(entry[1])]),
  );
  return value;
};
const hash = (domain: string, value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256")
    .update(`${domain}\n${JSON.stringify(canonicalize(value))}`, "utf8")
    .digest("hex")}`;
const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;
const iso = (value: Date | string): string => new Date(value).toISOString();
const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry: unknown): entry is string => typeof entry === "string") : [];
const quantityForNotional = (notionalCents: number, priceMicros: number): number => {
  const result = (BigInt(notionalCents) * BigInt(10_000_000_000)) /
    BigInt(priceMicros);
  const parsed = Number(result);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "The accepted risk decision does not produce a supported fractional quantity.",
  );
  return parsed;
};

const projectPreview = (row: PreviewRow, now = new Date()): HelixLiveEquityOrderPreview => {
  const expired = now.getTime() >= new Date(row.expires_at).getTime();
  const status = expired && (row.status === "reviewed" || row.status === "approved")
    ? "expired" : row.status;
  return helixLiveEquityOrderPreviewSchema.parse({
    schema: HELIX_LIVE_EQUITY_ORDER_PREVIEW_SCHEMA,
    ok: true,
    preview_id: row.preview_id,
    client_preview_id: row.client_preview_id,
    connection_id: row.connection_id,
    room_id: row.room_id,
    paper_account_id: row.paper_account_id,
    risk_decision_id: row.risk_decision_id,
    approval_id: row.approval_id ?? null,
    status,
    intent: row.intent_json,
    proposal_hash: row.proposal_hash,
    provider_review_hash: row.provider_review_hash,
    provider_contract_hash: row.provider_contract_hash,
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

const providerError = (error: unknown): never => {
  if (error instanceof RobinhoodMcpClientError) {
    throw new RobinhoodConnectionError(
      error.kind === "contract"
        ? "brokerage_provider_contract_changed"
        : "brokerage_read_failed",
      502,
      error.kind === "contract"
        ? error.message
        : "Robinhood could not create a non-executing order review.",
    );
  }
  throw error;
};

const loadRiskRow = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  accountId: string;
  riskDecisionId: string;
}): Promise<RiskRow> => {
  const { rows } = await input.client.query<RiskRow>(
    `SELECT d.*, a.policy_json, a.policy_hash, a.account_equity_cents,
            a.buying_power_cents, a.kill_switch_active, a.status
     FROM helix_paper_risk_decisions d
     JOIN helix_paper_trading_accounts a ON a.account_id = d.account_id
     WHERE d.decision_id = $1 AND d.account_id = $2
       AND d.owner_profile_id = $3 AND d.connection_id = $4 AND d.room_id = $5
     LIMIT 1;`,
    [input.riskDecisionId, input.accountId, input.ownerProfileId,
      input.connectionId, input.roomId],
  );
  const row = rows[0];
  if (!row || row.status !== "active") throw new PaperTradingError(
    "paper_risk_decision_not_accepted", 409,
    "A current accepted risk decision from this private room is required.",
  );
  return row;
};

export const createLiveEquityOrderPreview = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  accountId: string;
  riskDecisionId: string;
  clientPreviewId: string;
  now?: Date;
  discoverAgenticAccount?: RobinhoodAgenticAccountDiscovery;
  reviewEquityOrder?: RobinhoodEquityOrderReviewCall;
}): Promise<HelixLiveEquityOrderPreview> => {
  const now = input.now ?? new Date();
  const riskRow = await withSharedRealtimeRoomTransaction((client: Queryable) =>
    loadRiskRow({ client, ...input }));
  const candidate = helixPaperTradeCandidateSchema.parse(riskRow.candidate_json);
  const decision = helixTradingRiskDecisionSchema.parse(riskRow.decision_json);
  const policy = helixTradingRiskPolicySchema.parse(riskRow.policy_json);
  if (riskRow.verdict !== "accepted" || decision.verdict !== "accepted" ||
      riskRow.kill_switch_active || policy.require_manual_live_approval !== true ||
      policy.allow_options || policy.allow_margin || policy.allow_extended_hours ||
      !policy.long_equities_only || !policy.limit_orders_only) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The risk decision or policy is not eligible for a live-order preview.",
    );
  }
  if (now.getTime() - Date.parse(decision.evaluated_at) > MAX_RISK_DECISION_AGE_MS ||
      Date.parse(decision.evaluated_at) > now.getTime() + policy.max_future_quote_skew_ms) {
    throw new PaperTradingError(
      "paper_quote_evidence_stale", 409,
      "The risk decision expired before the provider review was requested.",
    );
  }
  const observationId = strings(riskRow.source_observation_ids)[0];
  if (!observationId) throw new PaperTradingError(
    "paper_source_observation_invalid", 409,
    "The risk decision has no stored Robinhood quote evidence.",
  );
  const quote = await readPaperQuoteEvidence({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    observationId,
    symbol: candidate.symbol,
    now,
    maxAgeMs: policy.max_quote_age_ms,
    maxFutureSkewMs: policy.max_future_quote_skew_ms,
  });
  if (readUsMarketClock(now).session !== "regular") throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "Live-order previews are limited to the regular U.S. equity session.",
  );
  const intent = helixLiveEquityOrderIntentSchema.parse({
    asset_type: "equity",
    symbol: candidate.symbol,
    side: "buy",
    order_type: "limit",
    time_in_force: "gfd",
    extended_hours: false,
    quantity_micros: quantityForNotional(
      candidate.notional_cents, candidate.entry_limit_micros,
    ),
    limit_price_micros: candidate.entry_limit_micros,
    stop_price_micros: candidate.stop_price_micros,
    notional_cents: candidate.notional_cents,
  });
  const proposalHash = hash("helix-live-equity-order-proposal/v1", {
    owner_profile_id: input.ownerProfileId,
    connection_id: input.connectionId,
    room_id: input.roomId,
    paper_account_id: input.accountId,
    risk_decision_id: input.riskDecisionId,
    risk_input_hash: decision.input_hash,
    policy_hash: riskRow.policy_hash,
    quote_output_hash: quote.outputHash,
    intent,
  });
  const existing = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `SELECT p.*, a.approval_id
       FROM helix_live_equity_order_previews p
       LEFT JOIN helix_live_equity_order_approvals a
         ON a.preview_id = p.preview_id
       WHERE p.owner_profile_id = $1
         AND (p.client_preview_id = $2 OR p.risk_decision_id = $3)
       LIMIT 1;`,
      [input.ownerProfileId, input.clientPreviewId, input.riskDecisionId],
    );
    return rows[0] ?? null;
  });
  if (existing) {
    if (existing.proposal_hash !== proposalHash) throw new PaperTradingError(
      "paper_order_replay_conflict", 409,
      "This live preview identity was already used for a different proposal.",
    );
    return projectPreview(existing, now);
  }

  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
    now,
  });
  const withAccessTokenRefresh = async <T>(
    operation: (accessToken: string) => Promise<T>,
  ): Promise<T> => {
    try {
      return await operation(lease.credentials.access_token);
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
      return operation(lease.credentials.access_token);
    }
  };
  let accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) {
    try {
      const discover = input.discoverAgenticAccount ??
        discoverRobinhoodAgenticAccountOverMcp;
      const found = await withAccessTokenRefresh((accessToken) =>
        discover({ accessToken }));
      accountRef = found.accountRef;
      lease = await persistRobinhoodAgenticAccountSelectionForPrivateRoom({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        providerAccountRef: accountRef,
        now,
      });
    } catch (error) { providerError(error); }
  }
  let review: Awaited<ReturnType<RobinhoodEquityOrderReviewCall>>;
  try {
    const reviewOrder = input.reviewEquityOrder ?? reviewRobinhoodEquityOrderOverMcp;
    review = await withAccessTokenRefresh((accessToken) => reviewOrder({
      accessToken, accountRef: accountRef!, intent,
    }));
  } catch (error) { return providerError(error); }
  const providerReviewHash = hash("robinhood-equity-order-review/v1", review.rawReview);
  const previewId = randomId("live_equity_preview");
  const reviewedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + PREVIEW_LIFETIME_MS).toISOString();
  const approvalPhrase = `APPROVE ${intent.side.toUpperCase()} ${
    (intent.quantity_micros / 1_000_000).toFixed(6).replace(/\.?0+$/u, "")
  } ${intent.symbol} LIMIT ${
    (intent.limit_price_micros / 1_000_000).toFixed(6).replace(/\.?0+$/u, "")
  } PREVIEW ${previewId}`;
  const encryptedReview = encryptProviderCredential(
    { schema: "helix.robinhood_equity_order_review.v1", review: review.rawReview },
    `robinhood-order-review\n${previewId}\n${input.ownerProfileId}`,
  );
  const created = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `INSERT INTO helix_live_equity_order_previews (
         preview_id, client_preview_id, owner_profile_id, connection_id,
         room_id, paper_account_id, risk_decision_id, source_observation_id,
         proposal_hash, provider_review_hash, provider_contract_hash,
         intent_json, provider_review_public_json, encrypted_provider_review,
         provider_warnings, approval_phrase, reviewed_at, expires_at,
         created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,
         $14,$15::jsonb,$16,$17,$18,$17,$17)
       RETURNING *;`,
      [previewId, input.clientPreviewId, input.ownerProfileId,
        input.connectionId, input.roomId, input.accountId, input.riskDecisionId,
        observationId, proposalHash, providerReviewHash,
        review.providerContractHash, JSON.stringify(intent),
        JSON.stringify(review.publicReview), encryptedReview.encryptedValue,
        JSON.stringify(review.warnings), approvalPhrase, reviewedAt, expiresAt],
    );
    return rows[0];
  });
  return projectPreview(created, now);
};

export const approveLiveEquityOrderPreview = async (input: {
  ownerProfileId: string;
  sessionId: string;
  connectionId: string;
  roomId: string;
  previewId: string;
  approvalText: string;
  now?: Date;
}): Promise<HelixLiveEquityOrderApproval> => {
  const now = input.now ?? new Date();
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const sessionHash = hash("helix-live-equity-order-session/v1", input.sessionId);
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<PreviewRow>(
      `SELECT * FROM helix_live_equity_order_previews
       WHERE preview_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4
       FOR UPDATE;`,
      [input.previewId, input.ownerProfileId, input.connectionId, input.roomId],
    );
    const preview = rows[0];
    if (!preview) throw new PaperTradingError(
      "paper_order_not_found", 404, "The live-order preview was not found.",
    );
    if (now.getTime() >= new Date(preview.expires_at).getTime()) {
      await client.query(
        `UPDATE helix_live_equity_order_previews
         SET status = 'expired', updated_at = $2 WHERE preview_id = $1;`,
        [preview.preview_id, now.toISOString()],
      );
      throw new PaperTradingError(
        "paper_quote_evidence_stale", 409,
        "The Robinhood order review expired; request a fresh preview.",
      );
    }
    if (preview.status !== "reviewed") throw new PaperTradingError(
      "paper_order_replay_conflict", 409,
      "This live-order preview is no longer eligible for approval.",
    );
    if (input.approvalText !== preview.approval_phrase) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The approval text must exactly match the current provider-reviewed order.",
    );
    const risk = await loadRiskRow({ client, ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId, roomId: input.roomId,
      accountId: preview.paper_account_id,
      riskDecisionId: preview.risk_decision_id });
    if (risk.kill_switch_active || risk.verdict !== "accepted") throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The kill switch or risk state changed after review; request a fresh preview.",
    );
    const approvalId = randomId("live_equity_approval");
    const approvedAt = now.toISOString();
    await client.query(
      `INSERT INTO helix_live_equity_order_approvals (
         approval_id, preview_id, owner_profile_id, session_hash,
         proposal_hash, provider_review_hash, approved_at, expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`,
      [approvalId, preview.preview_id, input.ownerProfileId, sessionHash,
        preview.proposal_hash, preview.provider_review_hash,
        approvedAt, iso(preview.expires_at)],
    );
    await client.query(
      `UPDATE helix_live_equity_order_previews
       SET status = 'approved', updated_at = $2 WHERE preview_id = $1;`,
      [preview.preview_id, approvedAt],
    );
    return helixLiveEquityOrderApprovalSchema.parse({
      schema: HELIX_LIVE_EQUITY_ORDER_APPROVAL_SCHEMA,
      ok: true,
      approval_id: approvalId,
      preview_id: preview.preview_id,
      proposal_hash: preview.proposal_hash,
      provider_review_hash: preview.provider_review_hash,
      status: "approved",
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

export const listLiveEquityOrderPreviews = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
}): Promise<{ schema: "helix.live_equity_order_preview_list.v1"; ok: true;
  previews: HelixLiveEquityOrderPreview[]; live_order_execution_enabled: false }> => {
  const now = input.now ?? new Date();
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    await client.query(
      `UPDATE helix_live_equity_order_previews SET status = 'expired', updated_at = $4
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
         AND status IN ('reviewed','approved') AND expires_at <= $4;`,
      [input.ownerProfileId, input.connectionId, input.roomId, now.toISOString()],
    );
    const { rows } = await client.query<PreviewRow>(
      `SELECT p.*, a.approval_id
       FROM helix_live_equity_order_previews p
       LEFT JOIN helix_live_equity_order_approvals a
         ON a.preview_id = p.preview_id
       WHERE p.owner_profile_id = $1 AND p.connection_id = $2
         AND p.room_id = $3
       ORDER BY p.reviewed_at DESC LIMIT 20;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return {
      schema: "helix.live_equity_order_preview_list.v1",
      ok: true,
      previews: rows.map((row: PreviewRow) => projectPreview(row, now)),
      live_order_execution_enabled: false,
    };
  });
};
