import { z } from "zod";

export const HELIX_LIVE_ACCEPTANCE_READINESS_SCHEMA =
  "helix.live_acceptance_readiness.v1" as const;

export const HELIX_LIVE_ACCEPTANCE_GATE_IDS = [
  "agentic_account_selected",
  "owner_private_room_binding",
  "required_read_receipts_fresh",
  "provider_contract_fresh_pass",
  "live_deployment_pair_enabled",
  "supervisor_and_exit_plane_fresh",
  "no_operator_attention",
  "operator_presence_fresh",
  "tiny_entry_reconciled_filled",
  "risk_reducing_exit_reconciled_filled",
  "no_unresolved_live_exposure",
] as const;

const identifier = z.string().trim().min(1).max(320);
const timestamp = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixLiveAcceptanceGateSchema = z.object({
  gate_id: z.enum(HELIX_LIVE_ACCEPTANCE_GATE_IDS),
  verdict: z.enum(["pass", "pending", "fail"]),
  reason_code: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(500),
  evidence_hashes: z.array(sha256).max(32),
  observed_at: timestamp.nullable(),
}).strict();

export type HelixLiveAcceptanceGate = z.infer<
  typeof helixLiveAcceptanceGateSchema
>;

export const helixLiveAcceptanceReadinessSchema = z.object({
  schema: z.literal(HELIX_LIVE_ACCEPTANCE_READINESS_SCHEMA),
  ok: z.literal(true),
  connection_id: identifier,
  room_id: identifier,
  generated_at: timestamp,
  read_acceptance_complete: z.boolean(),
  safe_to_enable_live_flags: z.boolean(),
  ready_to_start_attended_canary: z.boolean(),
  ready_to_arm: z.boolean(),
  acceptance_complete: z.boolean(),
  gates: z.array(helixLiveAcceptanceGateSchema)
    .length(HELIX_LIVE_ACCEPTANCE_GATE_IDS.length),
  required_read_tools: z.array(z.enum([
    "get_portfolio",
    "get_realized_pnl",
    "get_equity_positions",
    "get_equity_quotes",
    "get_equity_orders",
  ])).length(5),
  fresh_read_tools: z.array(z.string().trim().min(1).max(100)).max(5),
  live_entry_count: z.number().int().nonnegative(),
  reconciled_filled_entry_count: z.number().int().nonnegative(),
  reconciled_filled_exit_count: z.number().int().nonnegative(),
  unresolved_live_exposure_count: z.number().int().nonnegative(),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  live_order_tool_calls_made: z.literal(0),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixLiveAcceptanceReadiness = z.infer<
  typeof helixLiveAcceptanceReadinessSchema
>;
