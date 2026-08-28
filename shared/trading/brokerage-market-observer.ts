import { z } from "zod";
import { helixPaperProcessObservationReceiptSchema } from "./paper-contract";

export const HELIX_BROKERAGE_MARKET_OBSERVER_SCHEMA =
  "helix.brokerage_market_observer.v1" as const;
export const HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID =
  "resident.brokerage.market_observer.v1" as const;
export const HELIX_BROKERAGE_MARKET_OBSERVER_PROCESS_SCOPE =
  "helix.brokerage.paper_observer.process" as const;

export const HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE = {
  profile_id: HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID,
  environment_domain: "brokerage",
  reaction_requirement: "monitor_only",
  input: "fresh_profile_scoped_robinhood_quote_observation",
  response_vocabulary: [
    "emit_paper_order_filled",
    "emit_paper_position_opened",
    "emit_paper_position_marked",
    "emit_paper_stop_triggered",
    "emit_paper_position_closed",
    "emit_risk_kill_switch_activated",
  ],
  provider_mutation_vocabulary: [],
  live_order_execution_enabled: false,
  abstain_on_stale_or_invalid_evidence: true,
} as const;

export const HELIX_BROKERAGE_MARKET_OBSERVER_EVENT_TYPES = [
  "paper_order_filled",
  "paper_position_opened",
  "paper_position_marked",
  "paper_stop_triggered",
  "paper_position_closed",
  "risk_kill_switch_activated",
] as const;

const identifier = z.string().trim().min(1).max(320);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const timestamp = z.string().datetime({ offset: true });
const symbol = z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);

export const helixBrokerageMarketObserverReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_MARKET_OBSERVER_SCHEMA),
  ok: z.literal(true),
  observer_cycle_id: identifier,
  profile_id: z.literal(HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID),
  profile_artifact_hash: hash,
  reaction_requirement: z.literal("monitor_only"),
  monitor_lease_id: identifier,
  owner_profile_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  paper_account_id: identifier,
  producer_epoch_ref: identifier,
  source_observation_id: identifier,
  source_output_hash: hash,
  source_observed_at: timestamp,
  observation_revision: z.number().int().nonnegative(),
  symbol,
  event_types: z.array(
    z.enum(HELIX_BROKERAGE_MARKET_OBSERVER_EVENT_TYPES),
  ).max(HELIX_BROKERAGE_MARKET_OBSERVER_EVENT_TYPES.length),
  disposition: z.enum([
    "no_material_paper_change",
    "paper_state_changed",
    "risk_control_changed",
  ]),
  semantic_wake_eligible: z.boolean(),
  paper_receipt: helixPaperProcessObservationReceiptSchema,
  kill_switch_active_before: z.boolean(),
  kill_switch_active_after: z.boolean(),
  simulated: z.literal(true),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((receipt, context) => {
  if (new Set(receipt.event_types).size !== receipt.event_types.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_types"],
      message: "Brokerage observer event types must be unique.",
    });
  }
  const killSwitchChanged =
    !receipt.kill_switch_active_before && receipt.kill_switch_active_after;
  if (
    receipt.event_types.includes("risk_kill_switch_activated") !==
      killSwitchChanged
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_types"],
      message: "The kill-switch event must match the measured state transition.",
    });
  }
  if (receipt.semantic_wake_eligible !== (receipt.event_types.length > 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semantic_wake_eligible"],
      message: "Semantic wake eligibility requires a material observer event.",
    });
  }
  const expectedDisposition = killSwitchChanged
    ? "risk_control_changed"
    : receipt.event_types.length > 0
      ? "paper_state_changed"
      : "no_material_paper_change";
  if (receipt.disposition !== expectedDisposition) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["disposition"],
      message: "The observer disposition must match its measured events.",
    });
  }
});

export type HelixBrokerageMarketObserverReceipt = z.infer<
  typeof helixBrokerageMarketObserverReceiptSchema
>;
