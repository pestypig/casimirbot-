import { z } from "zod";

export const HELIX_LIVE_PROVIDER_CONTRACT_PREFLIGHT_SCHEMA =
  "helix.live_provider_contract_preflight.v1" as const;

export const HELIX_LIVE_PROVIDER_CONTRACT_GATE_IDS = [
  "entry_review",
  "entry_placement",
  "protective_stop_review",
  "protective_stop_placement",
  "market_close_review",
  "market_close_placement",
  "equity_order_cancellation",
] as const;

const identifier = z.string().trim().min(1).max(320);
const timestamp = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixLiveProviderContractGateSchema = z.object({
  gate_id: z.enum(HELIX_LIVE_PROVIDER_CONTRACT_GATE_IDS),
  tool_name: z.enum([
    "review_equity_order",
    "place_equity_order",
    "cancel_equity_order",
  ]),
  verdict: z.enum(["pass", "fail"]),
  reason_code: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(500),
  input_schema_hash: sha256.nullable(),
  destructive_hint_expected: z.enum(["true", "not_true"]),
  destructive_hint_observed: z.enum(["true", "false", "absent"]),
}).strict();

export type HelixLiveProviderContractGate = z.infer<
  typeof helixLiveProviderContractGateSchema
>;

const safetyProjection = {
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  provider_order_tool_calls_made: z.literal(0),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

export const helixLiveProviderContractPreflightSchema = z.object({
  schema: z.literal(HELIX_LIVE_PROVIDER_CONTRACT_PREFLIGHT_SCHEMA),
  ok: z.literal(true),
  acceptance_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  provider_id: z.literal("robinhood"),
  verdict: z.enum(["pass", "fail"]),
  catalog_hash: sha256,
  gates: z.array(helixLiveProviderContractGateSchema)
    .length(HELIX_LIVE_PROVIDER_CONTRACT_GATE_IDS.length),
  checked_at: timestamp,
  expires_at: timestamp,
  fresh: z.boolean(),
  ...safetyProjection,
}).strict();

export type HelixLiveProviderContractPreflight = z.infer<
  typeof helixLiveProviderContractPreflightSchema
>;
