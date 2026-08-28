import { z } from "zod";
import {
  HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  helixBrokerageReactiveArbiterReceiptSchema,
  helixBrokerageReactiveDecisionReceiptSchema,
  helixBrokerageReactiveMarketObservationSchema,
  helixBrokerageReactiveStrategyManifestSchema,
} from "./brokerage-reactive-simulation";

export const HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA =
  "helix.brokerage_reactive_controller.v1" as const;

const identifier = z.string().trim().min(1).max(320);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const timestamp = z.string().datetime({ offset: true });
const safetyProjection = {
  simulated: z.literal(true),
  provider_order_tool_calls_made: z.literal(0),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
};

export const HELIX_BROKERAGE_REACTIVE_CONTROLLER_TERMINAL_REASONS = [
  "cycle_budget_exhausted",
  "controller_deadline_reached",
  "controller_lease_expired",
  "manifest_expired",
  "observation_deadline_missed",
  "quote_stale",
  "sequence_gap",
  "producer_epoch_changed",
  "retention_gap",
  "paper_kill_switch_active",
  "daily_loss_limit_reached",
  "consecutive_loss_limit_reached",
  "paper_invariant_failure",
  "unresolved_simulated_effect",
  "source_poll_failed",
  "source_contract_invalid",
  "manual_override",
  "emergency_stop",
] as const;

export const helixBrokerageReactiveControllerStatusSchema = z.enum([
  "active",
  "completed",
  "watchdog_tripped",
  "manual_override",
  "emergency_stopped",
]);

export const helixBrokerageReactiveControllerStartSchema = z.object({
  client_controller_id: identifier,
  manifest: helixBrokerageReactiveStrategyManifestSchema,
  maximum_cycles: z.number().int().positive().max(10_000),
  unresolved_effect_timeout_ms: z.number().int().min(100).max(300_000),
  controller_deadline_at: timestamp,
  lease_expires_at: timestamp,
}).strict();

export type HelixBrokerageReactiveControllerStart = z.infer<
  typeof helixBrokerageReactiveControllerStartSchema
>;

export const helixBrokerageReactiveControllerProjectionSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA),
  controller_run_id: identifier,
  client_controller_id: identifier,
  controller_profile_id: z.literal(
    HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  ),
  controller_profile_hash: hash,
  strategy_manifest_id: identifier,
  strategy_artifact_hash: hash,
  owner_profile_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  paper_account_id: identifier,
  producer_epoch_ref: identifier,
  status: helixBrokerageReactiveControllerStatusSchema,
  maximum_cycles: z.number().int().positive(),
  processed_cycles: z.number().int().nonnegative(),
  unresolved_effect_timeout_ms: z.number().int().positive(),
  last_sequence: z.number().int().positive().nullable(),
  last_arrival_time: timestamp.nullable(),
  last_observation_id: identifier.nullable(),
  entry_already_proposed: z.boolean(),
  new_simulated_risk_locked: z.boolean(),
  controller_lease_released: z.boolean(),
  fresh_snapshot_required: z.boolean(),
  released_simulated_order_count: z.number().int().nonnegative(),
  released_reservation_cents: z.number().int().nonnegative(),
  terminal_reason: z.enum(
    HELIX_BROKERAGE_REACTIVE_CONTROLLER_TERMINAL_REASONS,
  ).nullable(),
  next_observation_deadline_at: timestamp,
  controller_deadline_at: timestamp,
  lease_expires_at: timestamp,
  manifest_expires_at: timestamp,
  started_at: timestamp,
  updated_at: timestamp,
  terminal_at: timestamp.nullable(),
  current_event_sequence: z.number().int().nonnegative(),
  latest_event_hash: hash.nullable(),
  finite_scheduler: z.literal(true),
  independent_watchdog: z.literal(true),
  private_model_loop_present: z.literal(false),
  ...safetyProjection,
}).strict().superRefine((run, context) => {
  const terminal = run.status !== "active";
  if (terminal !== run.controller_lease_released ||
      terminal !== (run.terminal_at !== null) ||
      terminal !== (run.terminal_reason !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["status"],
      message: "Every terminal controller state must release its lease and retain a terminal reason and time.",
    });
  }
  if (run.processed_cycles > run.maximum_cycles) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["processed_cycles"],
      message: "A finite controller cannot exceed its cycle budget.",
    });
  }
});

export type HelixBrokerageReactiveControllerProjection = z.infer<
  typeof helixBrokerageReactiveControllerProjectionSchema
>;

export const helixBrokerageReactiveControllerCycleRequestSchema = z.object({
  observation: helixBrokerageReactiveMarketObservationSchema,
  earnings_observation_id: identifier.nullable(),
}).strict();

export const helixBrokerageReactiveControllerCycleReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA),
  operation: z.literal("brokerage.reactive_controller.process_observation"),
  controller_run: helixBrokerageReactiveControllerProjectionSchema,
  decision_receipt: helixBrokerageReactiveDecisionReceiptSchema,
  arbiter_receipt: helixBrokerageReactiveArbiterReceiptSchema.nullable(),
  duplicate_replay: z.boolean(),
  effect_resolved: z.literal(true),
  resource_release_verified: z.boolean(),
  ...safetyProjection,
}).strict().superRefine((receipt, context) => {
  const entry = receipt.decision_receipt.proposal.response ===
    "propose_simulated_limit_entry";
  if (entry !== (receipt.arbiter_receipt !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["arbiter_receipt"],
      message: "Only a simulated entry proposal requires an arbiter receipt.",
    });
  }
  if (receipt.resource_release_verified !==
      receipt.controller_run.controller_lease_released) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["resource_release_verified"],
      message: "The cycle receipt must report the persisted lease-release state.",
    });
  }
});

export type HelixBrokerageReactiveControllerCycleReceipt = z.infer<
  typeof helixBrokerageReactiveControllerCycleReceiptSchema
>;

export const helixBrokerageReactiveControllerControlSchema = z.object({
  action: z.enum(["manual_override", "emergency_stop"]),
  reason: z.string().trim().min(1).max(500),
}).strict();

export const helixBrokerageReactiveControllerWatchdogCycleSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA),
  operation: z.literal("brokerage.reactive_controller.watchdog_cycle"),
  controllers_checked: z.number().int().nonnegative(),
  controllers_tripped: z.number().int().nonnegative(),
  unresolved_effects_tripped: z.number().int().nonnegative(),
  provider_order_tool_calls_made: z.literal(0),
  provider_mutation_attempted: z.literal(false),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();
