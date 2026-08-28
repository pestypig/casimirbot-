import { z } from "zod";
import {
  helixPaperExecutionModelSchema,
  helixPaperOrderSchema,
} from "./paper-contract";
import { helixTradingRiskDecisionSchema } from "./risk-contract";

export const HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA =
  "helix.brokerage_reactive_simulation.v1" as const;
export const HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID =
  "resident.brokerage.simulated_execution.v1" as const;

export const HELIX_BROKERAGE_REACTIVE_SIMULATION_RESPONSES = [
  "propose_simulated_limit_entry",
  "propose_simulated_entry_cancel",
  "propose_simulated_risk_reducing_exit",
  "activate_simulated_kill_switch",
  "abstain",
  "request_semantic_replan",
] as const;

export const HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE = {
  schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
  profile_id: HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  environment_domain: "brokerage",
  reaction_requirement: "bounded_reflex",
  execution_plane: "local_simulation_ledger",
  response_vocabulary: HELIX_BROKERAGE_REACTIVE_SIMULATION_RESPONSES,
  provider_mutation_vocabulary: [],
  simulated: true,
  live_order_execution_enabled: false,
  answer_authority: false,
} as const;

const identifier = z.string().trim().min(1).max(320);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const timestamp = z.string().datetime({ offset: true });
const symbol = z.string().trim().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);
const cents = z.number().int().min(0).max(100_000_000);
const micros = z.number().int().positive().max(10_000_000_000);
const basisPoints = z.number().int().min(0).max(10_000);
const milliseconds = z.number().int().min(0).max(300_000);

const safetyProjection = {
  simulated: z.literal(true),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

const unique = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const parseTime = (value: string): number => Date.parse(value);

export const helixBrokerageReactiveSimulationProfileSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  profile_id: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID),
  environment_domain: z.literal("brokerage"),
  reaction_requirement: z.literal("bounded_reflex"),
  execution_plane: z.literal("local_simulation_ledger"),
  response_vocabulary: z.tuple([
    z.literal("propose_simulated_limit_entry"),
    z.literal("propose_simulated_entry_cancel"),
    z.literal("propose_simulated_risk_reducing_exit"),
    z.literal("activate_simulated_kill_switch"),
    z.literal("abstain"),
    z.literal("request_semantic_replan"),
  ]),
  provider_mutation_vocabulary: z.tuple([]),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export const HELIX_BROKERAGE_REACTIVE_QUOTE_FIELDS = [
  "bid_micros",
  "ask_micros",
  "last_micros",
  "prior_close_micros",
  "market_session",
] as const;

export const helixBrokerageReactiveStrategyManifestSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  controller_profile_id: z.literal(
    HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  ),
  controller_profile_hash: hash,
  owner_profile_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  connection_id: identifier,
  paper_account_id: identifier,
  producer_epoch_ref: identifier,
  allowed_symbols: z.array(symbol).min(1).max(20),
  required_quote_fields: z.tuple([
    z.literal("bid_micros"),
    z.literal("ask_micros"),
    z.literal("last_micros"),
    z.literal("prior_close_micros"),
    z.literal("market_session"),
  ]),
  observation_schedule: z.object({
    mode: z.literal("bounded_poll"),
    minimum_interval_ms: z.number().int().positive().max(60_000),
    maximum_interval_ms: z.number().int().positive().max(300_000),
  }).strict(),
  maximum_quote_age_ms: z.number().int().positive().max(300_000),
  entry_predicates: z.object({
    minimum_decline_from_prior_close_bps: basisPoints,
    maximum_spread_bps: basisPoints,
    require_regular_session: z.literal(true),
    require_no_open_position: z.literal(true),
    require_no_open_order: z.literal(true),
  }).strict(),
  candidate_ranking: z.enum([
    "largest_decline_then_tightest_spread_then_symbol",
    "tightest_spread_then_largest_decline_then_symbol",
    "manifest_symbol_order",
  ]),
  entry_limit_policy: z.object({
    kind: z.literal("ask_capped_limit"),
    maximum_entry_above_ask_bps: z.literal(0),
  }).strict(),
  protective_exit_policy: z.object({
    kind: z.literal("fixed_stop_bps"),
    stop_distance_bps: z.number().int().positive().max(2_000),
  }).strict(),
  simulation_model: helixPaperExecutionModelSchema,
  maximum_notional_cents: cents,
  maximum_estimated_risk_cents: cents,
  maximum_open_positions: z.literal(1),
  daily_loss_limit_cents: cents,
  regular_session_only: z.literal(true),
  manifest_created_at: timestamp,
  manifest_expires_at: timestamp,
  reset_policy: z.object({
    on_lease_expiry: z.literal("release_and_require_fresh_manifest"),
    on_producer_epoch_change: z.literal("trip_and_require_fresh_snapshot"),
    on_retention_gap: z.literal("trip_and_require_fresh_snapshot"),
  }).strict(),
  ...safetyProjection,
}).strict().superRefine((manifest, context) => {
  if (!unique(manifest.allowed_symbols)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["allowed_symbols"],
      message: "Allowed symbols must be unique.",
    });
  }
  if (
    manifest.observation_schedule.minimum_interval_ms >
    manifest.observation_schedule.maximum_interval_ms
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["observation_schedule"],
      message: "The minimum polling interval cannot exceed the maximum.",
    });
  }
  if (manifest.maximum_estimated_risk_cents > manifest.maximum_notional_cents) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maximum_estimated_risk_cents"],
      message: "Estimated risk cannot exceed simulated entry notional.",
    });
  }
  if (
    parseTime(manifest.manifest_expires_at) <=
    parseTime(manifest.manifest_created_at)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manifest_expires_at"],
      message: "The strategy manifest must have a finite future expiry.",
    });
  }
});

export type HelixBrokerageReactiveStrategyManifest = z.infer<
  typeof helixBrokerageReactiveStrategyManifestSchema
>;

export const helixBrokerageReactiveMarketObservationSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  observation_id: identifier,
  observation_revision: z.number().int().nonnegative(),
  sequence: z.number().int().positive(),
  owner_profile_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  connection_id: identifier,
  paper_account_id: identifier,
  producer_epoch_ref: identifier,
  symbol,
  bid_micros: micros,
  ask_micros: micros,
  last_micros: micros,
  prior_close_micros: micros,
  market_session: z.enum(["regular", "pre", "post", "closed"]),
  event_time: timestamp,
  provider_observed_at: timestamp,
  arrived_at: timestamp,
  processed_at: timestamp,
  source_output_hash: hash,
  authoritative_snapshot: z.boolean(),
  retention_gap_after_sequence: z.number().int().nonnegative().nullable(),
  source_read_only: z.literal(true),
  simulation_input_only: z.literal(true),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict().superRefine((observation, context) => {
  if (observation.bid_micros > observation.ask_micros) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ask_micros"],
      message: "The ask cannot be below the bid.",
    });
  }
  const eventTime = parseTime(observation.event_time);
  const providerTime = parseTime(observation.provider_observed_at);
  const arrivalTime = parseTime(observation.arrived_at);
  const processingTime = parseTime(observation.processed_at);
  if (
    eventTime > providerTime ||
    providerTime > arrivalTime ||
    arrivalTime > processingTime
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["event_time"],
      message: "Observation timestamps must preserve event, provider, arrival and processing order.",
    });
  }
  if (
    observation.retention_gap_after_sequence !== null &&
    observation.retention_gap_after_sequence >= observation.sequence
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["retention_gap_after_sequence"],
      message: "A declared retention gap must precede the current sequence.",
    });
  }
});

export type HelixBrokerageReactiveMarketObservation = z.infer<
  typeof helixBrokerageReactiveMarketObservationSchema
>;

export const HELIX_BROKERAGE_REACTIVE_PROPOSAL_REASONS = [
  "entry_conditions_met",
  "decline_threshold_not_met",
  "spread_too_wide",
  "market_not_regular",
  "symbol_not_allowed",
  "simulated_entry_already_proposed",
  "estimated_risk_limit_exceeded",
  "watchdog_intervention",
] as const;

const simulatedEntrySchema = z.object({
  notional_cents: cents,
  limit_price_micros: micros,
  stop_price_micros: micros,
  estimated_risk_cents: cents,
}).strict();

export const helixBrokerageReactiveProposalSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  proposal_id: identifier,
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  controller_profile_id: z.literal(
    HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  ),
  source_observation_id: identifier,
  source_observation_revision: z.number().int().nonnegative(),
  source_sequence: z.number().int().positive(),
  symbol,
  response: z.enum(HELIX_BROKERAGE_REACTIVE_SIMULATION_RESPONSES),
  reasons: z.array(z.enum(HELIX_BROKERAGE_REACTIVE_PROPOSAL_REASONS)).min(1).max(8),
  candidate_rank: z.number().int().positive().nullable(),
  simulated_entry: simulatedEntrySchema.nullable(),
  effect_status: z.literal("proposal_only"),
  ...safetyProjection,
}).strict().superRefine((proposal, context) => {
  const isEntry = proposal.response === "propose_simulated_limit_entry";
  if (isEntry !== (proposal.simulated_entry !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["simulated_entry"],
      message: "Only a simulated entry proposal may contain entry parameters.",
    });
  }
  if (!unique(proposal.reasons)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reasons"],
      message: "Proposal reasons must be unique.",
    });
  }
});

export type HelixBrokerageReactiveProposal = z.infer<
  typeof helixBrokerageReactiveProposalSchema
>;

export const HELIX_BROKERAGE_REACTIVE_WATCHDOG_REASONS = [
  "quote_stale",
  "sequence_gap",
  "producer_epoch_changed",
  "manifest_expired",
  "retention_gap",
  "manual_override",
  "emergency_stop",
  "invariant_failure",
] as const;

export const helixBrokerageReactiveWatchdogReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  watchdog_receipt_id: identifier,
  source_observation_id: identifier,
  state: z.enum(["healthy", "tripped"]),
  reasons: z.array(z.enum(HELIX_BROKERAGE_REACTIVE_WATCHDOG_REASONS)).max(8),
  new_simulated_risk_locked: z.boolean(),
  controller_lease_released: z.boolean(),
  fresh_snapshot_required: z.boolean(),
  semantic_escalation_required: z.boolean(),
  ...safetyProjection,
}).strict().superRefine((receipt, context) => {
  const tripped = receipt.state === "tripped";
  if (tripped !== (receipt.reasons.length > 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reasons"],
      message: "A tripped watchdog requires reasons; a healthy watchdog has none.",
    });
  }
  if (tripped !== receipt.new_simulated_risk_locked) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["new_simulated_risk_locked"],
      message: "A watchdog trip must lock new simulated risk.",
    });
  }
});

export type HelixBrokerageReactiveWatchdogReceipt = z.infer<
  typeof helixBrokerageReactiveWatchdogReceiptSchema
>;

export const helixBrokerageReactiveDecisionReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  decision_id: identifier,
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  controller_profile_hash: hash,
  source_observation_id: identifier,
  source_observation_revision: z.number().int().nonnegative(),
  source_sequence: z.number().int().positive(),
  source_output_hash: hash,
  producer_epoch_ref: identifier,
  available_through_event_time: timestamp,
  available_through_arrival_time: timestamp,
  history_length: z.number().int().positive(),
  decision_latency_ms: milliseconds,
  no_lookahead_enforced: z.literal(true),
  proposal: helixBrokerageReactiveProposalSchema,
  watchdog: helixBrokerageReactiveWatchdogReceiptSchema,
  semantic_wake_eligible: z.boolean(),
  idempotent_replay: z.literal(true),
  ...safetyProjection,
}).strict().superRefine((receipt, context) => {
  if (
    receipt.source_observation_id !== receipt.proposal.source_observation_id ||
    receipt.source_observation_id !== receipt.watchdog.source_observation_id ||
    receipt.source_sequence !== receipt.proposal.source_sequence
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["source_observation_id"],
      message: "Decision, proposal and watchdog must bind the same observation.",
    });
  }
  const material =
    receipt.proposal.response !== "abstain" || receipt.watchdog.state === "tripped";
  if (receipt.semantic_wake_eligible !== material) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semantic_wake_eligible"],
      message: "Semantic wake eligibility must match a material proposal or watchdog trip.",
    });
  }
});

export type HelixBrokerageReactiveDecisionReceipt = z.infer<
  typeof helixBrokerageReactiveDecisionReceiptSchema
>;

export const helixBrokerageReactiveArbiterReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  operation: z.literal("brokerage.reactive_simulation.admit_proposal"),
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  decision_id: identifier,
  proposal_id: identifier,
  source_observation_id: identifier,
  source_output_hash: hash,
  earnings_observation_id: identifier,
  effect_idempotency_key: identifier,
  disposition: z.enum(["risk_rejected", "simulated_entry_reserved"]),
  risk_decision: helixTradingRiskDecisionSchema,
  order: helixPaperOrderSchema.nullable(),
  provider_order_tool_calls_made: z.literal(0),
  ...safetyProjection,
}).strict().superRefine((receipt, context) => {
  const reserved = receipt.disposition === "simulated_entry_reserved";
  if (reserved !== (receipt.risk_decision.verdict === "accepted")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["risk_decision", "verdict"],
      message: "Only an accepted risk decision may reserve a simulated entry.",
    });
  }
  if (reserved !== (receipt.order !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["order"],
      message: "A reserved simulated entry requires exactly one paper order.",
    });
  }
  if (
    receipt.order &&
    receipt.order.risk_decision_id !== receipt.risk_decision.decision_id
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["order", "risk_decision_id"],
      message: "The paper order must bind the admitted risk decision.",
    });
  }
});

export type HelixBrokerageReactiveArbiterReceipt = z.infer<
  typeof helixBrokerageReactiveArbiterReceiptSchema
>;

export const helixBrokerageReactiveReplayResultSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA),
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  receipts: z.array(helixBrokerageReactiveDecisionReceiptSchema).max(10_000),
  processed_observation_count: z.number().int().nonnegative(),
  simulated_entry_proposal_count: z.number().int().nonnegative(),
  watchdog_trip_count: z.number().int().nonnegative(),
  deterministic: z.literal(true),
  no_lookahead_enforced: z.literal(true),
  provider_order_tool_calls_made: z.literal(0),
  ...safetyProjection,
}).strict();

export type HelixBrokerageReactiveReplayResult = z.infer<
  typeof helixBrokerageReactiveReplayResultSchema
>;

export class HelixBrokerageReactiveReplayError extends Error {
  constructor(
    public readonly code:
      | "replay_identity_mismatch"
      | "replay_observation_order_invalid",
    message: string,
  ) {
    super(message);
    this.name = "HelixBrokerageReactiveReplayError";
  }
}

const floorBasisPoints = (numerator: number, denominator: number): number =>
  Number((BigInt(numerator) * 10_000n) / BigInt(denominator));

const ceilBasisPoints = (numerator: number, denominator: number): number =>
  Number(
    (BigInt(numerator) * 10_000n + BigInt(denominator) - 1n) /
      BigInt(denominator),
  );

const ceilPortion = (value: number, basisPointValue: number): number =>
  Number(
    (BigInt(value) * BigInt(basisPointValue) + 9_999n) / 10_000n,
  );

const assertObservationIdentity = (input: {
  manifest: HelixBrokerageReactiveStrategyManifest;
  observation: HelixBrokerageReactiveMarketObservation;
}): void => {
  const { manifest, observation } = input;
  if (
    manifest.owner_profile_id !== observation.owner_profile_id ||
    manifest.room_id !== observation.room_id ||
    manifest.environment_binding_id !== observation.environment_binding_id ||
    manifest.connection_id !== observation.connection_id ||
    manifest.paper_account_id !== observation.paper_account_id
  ) {
    throw new HelixBrokerageReactiveReplayError(
      "replay_identity_mismatch",
      "The replay observation does not match the strategy manifest identity.",
    );
  }
};

const derivedObservationRef = (
  kind: "decision" | "proposal" | "watchdog",
  observation: HelixBrokerageReactiveMarketObservation,
): string =>
  `brokerage_sim_${kind}:${observation.source_output_hash.slice("sha256:".length)}:${observation.sequence}`;

const watchdogForObservation = (input: {
  manifest: HelixBrokerageReactiveStrategyManifest;
  observation: HelixBrokerageReactiveMarketObservation;
  previousSequence: number | null;
}): HelixBrokerageReactiveWatchdogReceipt => {
  const { manifest, observation, previousSequence } = input;
  const reasons = new Set<
    (typeof HELIX_BROKERAGE_REACTIVE_WATCHDOG_REASONS)[number]
  >();
  if (manifest.producer_epoch_ref !== observation.producer_epoch_ref) {
    reasons.add("producer_epoch_changed");
  }
  if (previousSequence !== null && observation.sequence !== previousSequence + 1) {
    reasons.add("sequence_gap");
  }
  if (observation.retention_gap_after_sequence !== null) {
    reasons.add("retention_gap");
  }
  if (
    parseTime(observation.processed_at) -
      parseTime(observation.provider_observed_at) >
    manifest.maximum_quote_age_ms
  ) {
    reasons.add("quote_stale");
  }
  if (
    parseTime(observation.processed_at) >= parseTime(manifest.manifest_expires_at)
  ) {
    reasons.add("manifest_expired");
  }
  const orderedReasons = [...reasons].sort();
  const tripped = orderedReasons.length > 0;
  return helixBrokerageReactiveWatchdogReceiptSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
    watchdog_receipt_id: derivedObservationRef("watchdog", observation),
    source_observation_id: observation.observation_id,
    state: tripped ? "tripped" : "healthy",
    reasons: orderedReasons,
    new_simulated_risk_locked: tripped,
    controller_lease_released: orderedReasons.includes("manifest_expired"),
    fresh_snapshot_required:
      orderedReasons.includes("sequence_gap") ||
      orderedReasons.includes("retention_gap") ||
      orderedReasons.includes("producer_epoch_changed"),
    semantic_escalation_required: tripped,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

const proposalForObservation = (input: {
  manifest: HelixBrokerageReactiveStrategyManifest;
  observation: HelixBrokerageReactiveMarketObservation;
  watchdog: HelixBrokerageReactiveWatchdogReceipt;
  entryAlreadyProposed: boolean;
}): HelixBrokerageReactiveProposal => {
  const { manifest, observation, watchdog, entryAlreadyProposed } = input;
  let response: HelixBrokerageReactiveProposal["response"] = "abstain";
  let reasons: HelixBrokerageReactiveProposal["reasons"] = [];
  let candidateRank: number | null = null;
  let simulatedEntry: HelixBrokerageReactiveProposal["simulated_entry"] = null;

  if (watchdog.state === "tripped") {
    response = "activate_simulated_kill_switch";
    reasons = ["watchdog_intervention"];
  } else if (!manifest.allowed_symbols.includes(observation.symbol)) {
    reasons = ["symbol_not_allowed"];
  } else if (observation.market_session !== "regular") {
    reasons = ["market_not_regular"];
  } else if (entryAlreadyProposed) {
    reasons = ["simulated_entry_already_proposed"];
  } else {
    const declineBps = observation.last_micros >= observation.prior_close_micros
      ? 0
      : floorBasisPoints(
        observation.prior_close_micros - observation.last_micros,
        observation.prior_close_micros,
      );
    const spreadBps = ceilBasisPoints(
      observation.ask_micros - observation.bid_micros,
      observation.ask_micros,
    );
    if (
      declineBps <
      manifest.entry_predicates.minimum_decline_from_prior_close_bps
    ) {
      reasons = ["decline_threshold_not_met"];
    } else if (spreadBps > manifest.entry_predicates.maximum_spread_bps) {
      reasons = ["spread_too_wide"];
    } else {
      const stopDistanceBps =
        manifest.protective_exit_policy.stop_distance_bps;
      const estimatedRiskCents = ceilPortion(
        manifest.maximum_notional_cents,
        stopDistanceBps,
      );
      if (estimatedRiskCents > manifest.maximum_estimated_risk_cents) {
        reasons = ["estimated_risk_limit_exceeded"];
      } else {
        response = "propose_simulated_limit_entry";
        reasons = ["entry_conditions_met"];
        candidateRank = 1;
        simulatedEntry = {
          notional_cents: manifest.maximum_notional_cents,
          limit_price_micros: observation.ask_micros,
          stop_price_micros: Number(
            (BigInt(observation.ask_micros) *
              BigInt(10_000 - stopDistanceBps)) /
              10_000n,
          ),
          estimated_risk_cents: estimatedRiskCents,
        };
      }
    }
  }

  return helixBrokerageReactiveProposalSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
    proposal_id: derivedObservationRef("proposal", observation),
    strategy_manifest_id: manifest.strategy_manifest_id,
    strategy_artifact_hash: manifest.strategy_artifact_hash,
    controller_profile_id: HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
    source_observation_id: observation.observation_id,
    source_observation_revision: observation.observation_revision,
    source_sequence: observation.sequence,
    symbol: observation.symbol,
    response,
    reasons,
    candidate_rank: candidateRank,
    simulated_entry: simulatedEntry,
    effect_status: "proposal_only",
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

export const createBrokerageReactiveDecision = (input: {
  manifest: unknown;
  observation: unknown;
  previousSequence: number | null;
  previousArrivalTime: string | null;
  historyLength: number;
  entryAlreadyProposed: boolean;
}): HelixBrokerageReactiveDecisionReceipt => {
  const manifest = helixBrokerageReactiveStrategyManifestSchema.parse(
    input.manifest,
  );
  const observation = helixBrokerageReactiveMarketObservationSchema.parse(
    input.observation,
  );
  assertObservationIdentity({ manifest, observation });
  const arrivalTime = parseTime(observation.arrived_at);
  if (
    (input.previousSequence !== null &&
      observation.sequence <= input.previousSequence) ||
    (input.previousArrivalTime !== null &&
      arrivalTime < parseTime(input.previousArrivalTime))
  ) {
    throw new HelixBrokerageReactiveReplayError(
      "replay_observation_order_invalid",
      "Resident input must be strictly increasing by sequence and nondecreasing by arrival time.",
    );
  }
  const watchdog = watchdogForObservation({
    manifest,
    observation,
    previousSequence: input.previousSequence,
  });
  const proposal = proposalForObservation({
    manifest,
    observation,
    watchdog,
    entryAlreadyProposed: input.entryAlreadyProposed,
  });
  return helixBrokerageReactiveDecisionReceiptSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
    decision_id: derivedObservationRef("decision", observation),
    strategy_manifest_id: manifest.strategy_manifest_id,
    strategy_artifact_hash: manifest.strategy_artifact_hash,
    controller_profile_hash: manifest.controller_profile_hash,
    source_observation_id: observation.observation_id,
    source_observation_revision: observation.observation_revision,
    source_sequence: observation.sequence,
    source_output_hash: observation.source_output_hash,
    producer_epoch_ref: observation.producer_epoch_ref,
    available_through_event_time: observation.event_time,
    available_through_arrival_time: observation.arrived_at,
    history_length: input.historyLength + 1,
    decision_latency_ms:
      parseTime(observation.processed_at) - parseTime(observation.arrived_at),
    no_lookahead_enforced: true,
    proposal,
    watchdog,
    semantic_wake_eligible:
      proposal.response !== "abstain" || watchdog.state === "tripped",
    idempotent_replay: true,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

export const runDeterministicBrokerageReactiveReplay = (input: {
  manifest: unknown;
  observations: readonly unknown[];
}): HelixBrokerageReactiveReplayResult => {
  const manifest = helixBrokerageReactiveStrategyManifestSchema.parse(
    input.manifest,
  );
  const observations = input.observations.map((observation) =>
    helixBrokerageReactiveMarketObservationSchema.parse(observation));
  const receipts: HelixBrokerageReactiveDecisionReceipt[] = [];
  let previousSequence: number | null = null;
  let previousArrivalTime: number | null = null;
  let entryAlreadyProposed = false;

  for (const observation of observations) {
    const receipt = createBrokerageReactiveDecision({
      manifest,
      observation,
      previousSequence,
      previousArrivalTime:
        previousArrivalTime === null
          ? null
          : new Date(previousArrivalTime).toISOString(),
      historyLength: receipts.length,
      entryAlreadyProposed,
    });
    if (receipt.proposal.response === "propose_simulated_limit_entry") {
      entryAlreadyProposed = true;
    }
    receipts.push(receipt);
    const arrivalTime = parseTime(observation.arrived_at);
    previousSequence = observation.sequence;
    previousArrivalTime = arrivalTime;
    if (receipt.watchdog.state === "tripped") break;
  }

  return helixBrokerageReactiveReplayResultSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
    strategy_manifest_id: manifest.strategy_manifest_id,
    strategy_artifact_hash: manifest.strategy_artifact_hash,
    receipts,
    processed_observation_count: receipts.length,
    simulated_entry_proposal_count: receipts.filter(
      (receipt) =>
        receipt.proposal.response === "propose_simulated_limit_entry",
    ).length,
    watchdog_trip_count: receipts.filter(
      (receipt) => receipt.watchdog.state === "tripped",
    ).length,
    deterministic: true,
    no_lookahead_enforced: true,
    provider_order_tool_calls_made: 0,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};
