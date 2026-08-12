import { z } from "zod";

export const HELIX_LIVE_EQUITY_ORDER_PREVIEW_SCHEMA =
  "helix.live_equity_order_preview.v1" as const;
export const HELIX_LIVE_EQUITY_ORDER_APPROVAL_SCHEMA =
  "helix.live_equity_order_approval.v1" as const;

const identifier = z.string().trim().min(1).max(320);
const timestamp = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const symbol = z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);

const publicSafetyFields = {
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

export const helixLiveEquityOrderIntentSchema = z.object({
  asset_type: z.literal("equity"),
  symbol,
  side: z.literal("buy"),
  order_type: z.literal("limit"),
  time_in_force: z.literal("gfd"),
  extended_hours: z.literal(false),
  quantity_micros: z.number().int().positive().max(1_000_000_000_000),
  limit_price_micros: z.number().int().positive().max(10_000_000_000),
  stop_price_micros: z.number().int().positive().max(10_000_000_000),
  notional_cents: z.number().int().positive().max(100_000_000),
}).strict();

export type HelixLiveEquityOrderIntent = z.infer<
  typeof helixLiveEquityOrderIntentSchema
>;

export const helixLiveEquityOrderPreviewSchema = z.object({
  schema: z.literal(HELIX_LIVE_EQUITY_ORDER_PREVIEW_SCHEMA),
  ok: z.literal(true),
  preview_id: identifier,
  client_preview_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  paper_account_id: identifier,
  risk_decision_id: identifier,
  approval_id: identifier.nullable(),
  status: z.enum(["reviewed", "approved", "expired", "consumed", "invalidated"]),
  intent: helixLiveEquityOrderIntentSchema,
  proposal_hash: sha256,
  provider_review_hash: sha256,
  provider_contract_hash: sha256,
  provider_warnings: z.array(z.string().trim().min(1).max(500)).max(32),
  approval_phrase: z.string().trim().min(1).max(240),
  reviewed_at: timestamp,
  expires_at: timestamp,
  manual_approval_required: z.literal(true),
  approval_consumed: z.boolean(),
  live_order_execution_enabled: z.literal(false),
  ...publicSafetyFields,
}).strict();

export type HelixLiveEquityOrderPreview = z.infer<
  typeof helixLiveEquityOrderPreviewSchema
>;

export const helixLiveEquityOrderApprovalSchema = z.object({
  schema: z.literal(HELIX_LIVE_EQUITY_ORDER_APPROVAL_SCHEMA),
  ok: z.literal(true),
  approval_id: identifier,
  preview_id: identifier,
  proposal_hash: sha256,
  provider_review_hash: sha256,
  status: z.literal("approved"),
  decision_source: z.literal("explicit_user"),
  one_time: z.literal(true),
  approved_at: timestamp,
  expires_at: timestamp,
  consumed_at: timestamp.nullable(),
  live_order_execution_enabled: z.literal(false),
  ...publicSafetyFields,
}).strict();

export type HelixLiveEquityOrderApproval = z.infer<
  typeof helixLiveEquityOrderApprovalSchema
>;
