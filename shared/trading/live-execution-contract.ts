import { z } from "zod";
import { helixLiveEquityOrderIntentSchema } from "./live-order-contract";

export const HELIX_LIVE_EXECUTION_SCHEMA =
  "helix.live_equity_execution.v1" as const;

const identifier = z.string().trim().min(1).max(320);
const timestamp = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixLiveExecutionPolicySchema = z.object({
  schema: z.literal(HELIX_LIVE_EXECUTION_SCHEMA),
  policy_id: z.literal("helix:live-equity:tiny-v1"),
  policy_version: z.literal(1),
  long_equities_only: z.literal(true),
  limit_orders_only: z.literal(true),
  allow_options: z.literal(false),
  allow_margin: z.literal(false),
  allow_extended_hours: z.literal(false),
  allow_unattended_placement: z.literal(false),
  require_explicit_order_approval: z.literal(true),
  max_entry_notional_cents: z.literal(2_500),
  max_estimated_risk_cents: z.literal(100),
  max_daily_loss_cents: z.literal(300),
  max_new_entries_per_day: z.literal(1),
  max_open_positions: z.literal(1),
  max_open_orders: z.literal(0),
  max_preview_age_ms: z.literal(30_000),
  max_snapshot_age_ms: z.literal(10_000),
}).strict();

export type HelixLiveExecutionPolicy = z.infer<
  typeof helixLiveExecutionPolicySchema
>;

export const DEFAULT_HELIX_LIVE_EXECUTION_POLICY: HelixLiveExecutionPolicy = {
  schema: HELIX_LIVE_EXECUTION_SCHEMA,
  policy_id: "helix:live-equity:tiny-v1",
  policy_version: 1,
  long_equities_only: true,
  limit_orders_only: true,
  allow_options: false,
  allow_margin: false,
  allow_extended_hours: false,
  allow_unattended_placement: false,
  require_explicit_order_approval: true,
  max_entry_notional_cents: 2_500,
  max_estimated_risk_cents: 100,
  max_daily_loss_cents: 300,
  max_new_entries_per_day: 1,
  max_open_positions: 1,
  max_open_orders: 0,
  max_preview_age_ms: 30_000,
  max_snapshot_age_ms: 10_000,
};

const safetyProjection = {
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

export const helixLiveTradingControlSchema = z.object({
  schema: z.literal(HELIX_LIVE_EXECUTION_SCHEMA),
  ok: z.literal(true),
  control_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  policy: helixLiveExecutionPolicySchema,
  policy_hash: sha256,
  deployment_enabled: z.boolean(),
  operator_armed: z.boolean(),
  kill_switch_active: z.boolean(),
  kill_switch_reason: z.string().trim().min(1).max(500),
  protective_exit_ready: z.boolean(),
  supervisor_heartbeat_at: timestamp.nullable(),
  supervisor_fresh: z.boolean(),
  supervisor_status: z.enum(["disabled", "healthy", "degraded"]),
  operator_presence_at: timestamp.nullable(),
  operator_present: z.boolean(),
  attention_required: z.boolean(),
  attention_reason: z.string().trim().min(1).max(500).nullable(),
  arming_phrase: z.string().trim().min(1).max(500),
  trading_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  new_entries_today: z.number().int().nonnegative(),
  status: z.enum(["active", "archived"]),
  created_at: timestamp,
  updated_at: timestamp,
  live_order_execution_enabled: z.boolean(),
  ...safetyProjection,
}).strict();

export type HelixLiveTradingControl = z.infer<
  typeof helixLiveTradingControlSchema
>;

export const HELIX_LIVE_EXECUTION_STATES = [
  "reserved",
  "provider_call_started",
  "submitted",
  "reconciliation_required",
  "reconciled_open",
  "reconciled_filled",
  "reconciled_cancelled",
  "reconciled_rejected",
] as const;

export const helixLiveEquityExecutionSchema = z.object({
  schema: z.literal(HELIX_LIVE_EXECUTION_SCHEMA),
  ok: z.literal(true),
  execution_id: identifier,
  control_id: identifier,
  preview_id: identifier,
  approval_id: identifier,
  client_order_id: identifier,
  state: z.enum(HELIX_LIVE_EXECUTION_STATES),
  intent: helixLiveEquityOrderIntentSchema,
  proposal_hash: sha256,
  provider_review_hash: sha256,
  preflight_snapshot_hash: sha256,
  provider_result_hash: sha256.nullable(),
  provider_order_ref_hash: sha256.nullable(),
  ambiguity_reason: z.string().trim().min(1).max(500).nullable(),
  reserved_at: timestamp,
  provider_call_started_at: timestamp.nullable(),
  submitted_at: timestamp.nullable(),
  reconciled_at: timestamp.nullable(),
  live_order_execution_enabled: z.literal(true),
  unattended: z.literal(false),
  explicit_approval_consumed: z.literal(true),
  ...safetyProjection,
}).strict();

export type HelixLiveEquityExecution = z.infer<
  typeof helixLiveEquityExecutionSchema
>;
