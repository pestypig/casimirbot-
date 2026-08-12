import { z } from "zod";
import { HELIX_LIVE_EXECUTION_STATES } from "./live-execution-contract";

export const HELIX_PROTECTIVE_EXIT_SCHEMA =
  "helix.live_equity_protective_exit.v1" as const;

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

const protectiveExitIntentBase = {
  asset_type: z.literal("equity"),
  symbol,
  side: z.literal("sell"),
  time_in_force: z.literal("gfd"),
  extended_hours: z.literal(false),
  quantity_micros: z.number().int().positive().max(1_000_000_000_000),
};

export const helixProtectiveExitIntentSchema = z.discriminatedUnion(
  "order_type",
  [z.object({
    ...protectiveExitIntentBase,
    order_type: z.literal("stop"),
    stop_price_micros: z.number().int().positive().max(10_000_000_000),
  }).strict(), z.object({
    ...protectiveExitIntentBase,
    order_type: z.literal("market"),
  }).strict()],
);

export type HelixProtectiveExitIntent = z.infer<
  typeof helixProtectiveExitIntentSchema
>;

export const helixProtectiveExitPreviewSchema = z.object({
  schema: z.literal(HELIX_PROTECTIVE_EXIT_SCHEMA),
  ok: z.literal(true),
  exit_preview_id: identifier,
  client_preview_id: identifier,
  entry_execution_id: identifier,
  approval_id: identifier.nullable(),
  connection_id: identifier,
  room_id: identifier,
  status: z.enum(["reviewed", "approved", "expired", "consumed", "invalidated"]),
  intent: helixProtectiveExitIntentSchema,
  proposal_hash: sha256,
  provider_review_hash: sha256,
  provider_contract_hash: sha256,
  preflight_snapshot_hash: sha256,
  provider_warnings: z.array(z.string().trim().min(1).max(500)).max(32),
  approval_phrase: z.string().trim().min(1).max(500),
  reviewed_at: timestamp,
  expires_at: timestamp,
  manual_approval_required: z.literal(true),
  approval_consumed: z.boolean(),
  live_order_execution_enabled: z.literal(false),
  ...publicSafetyFields,
}).strict();

export type HelixProtectiveExitPreview = z.infer<
  typeof helixProtectiveExitPreviewSchema
>;

export const helixProtectiveExitApprovalSchema = z.object({
  schema: z.literal(HELIX_PROTECTIVE_EXIT_SCHEMA),
  ok: z.literal(true),
  exit_approval_id: identifier,
  exit_preview_id: identifier,
  entry_execution_id: identifier,
  proposal_hash: sha256,
  provider_review_hash: sha256,
  decision_source: z.literal("explicit_user"),
  one_time: z.literal(true),
  approved_at: timestamp,
  expires_at: timestamp,
  consumed_at: timestamp.nullable(),
  live_order_execution_enabled: z.literal(false),
  ...publicSafetyFields,
}).strict();

export type HelixProtectiveExitApproval = z.infer<
  typeof helixProtectiveExitApprovalSchema
>;

export const helixProtectiveExitExecutionSchema = z.object({
  schema: z.literal(HELIX_PROTECTIVE_EXIT_SCHEMA),
  ok: z.literal(true),
  exit_execution_id: identifier,
  exit_preview_id: identifier,
  exit_approval_id: identifier,
  entry_execution_id: identifier,
  client_order_id: identifier,
  state: z.enum(HELIX_LIVE_EXECUTION_STATES),
  intent: helixProtectiveExitIntentSchema,
  proposal_hash: sha256,
  provider_review_hash: sha256,
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
  risk_reducing_only: z.literal(true),
  ...publicSafetyFields,
}).strict();

export type HelixProtectiveExitExecution = z.infer<
  typeof helixProtectiveExitExecutionSchema
>;
