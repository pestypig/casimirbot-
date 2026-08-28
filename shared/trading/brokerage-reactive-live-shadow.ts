import { z } from "zod";
import {
  HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  helixBrokerageReactiveMarketObservationSchema,
} from "./brokerage-reactive-simulation";
import { helixBrokerageReactiveControllerCycleReceiptSchema } from
  "./brokerage-reactive-controller";
import { helixBrokerageReactiveControllerProjectionSchema } from
  "./brokerage-reactive-controller";

export const HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA =
  "helix.brokerage_reactive_live_shadow.v1" as const;

const identifier = z.string().trim().min(1).max(320);
const timestamp = z.string().datetime({ offset: true });
const symbol = z.string().trim().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);
const latency = z.number().int().nonnegative().max(300_000);
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const safetyProjection = {
  owner_private_source: z.literal(true),
  source_read_only: z.literal(true),
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

export const helixBrokerageReactiveLiveShadowStartSchema = z.object({
  client_shadow_session_id: identifier,
  symbol,
  poll_interval_ms: z.number().int().min(1_000).max(300_000),
  maximum_polls: z.number().int().positive().max(10_000),
  maximum_consecutive_failures: z.number().int().positive().max(5),
  earnings_observation_id: identifier.nullable(),
  session_expires_at: timestamp,
}).strict();

export type HelixBrokerageReactiveLiveShadowStart = z.infer<
  typeof helixBrokerageReactiveLiveShadowStartSchema
>;

export const helixBrokerageReactiveLiveShadowStatusSchema = z.enum([
  "active",
  "completed",
  "stopped",
  "source_failed",
  "controller_terminal",
]);

export const helixBrokerageReactiveLiveShadowTerminalReasonSchema = z.enum([
  "maximum_polls_exhausted",
  "session_expired",
  "manual_stop",
  "source_failure_budget_exhausted",
  "controller_terminal",
]);

const latencySummarySchema = z.object({
  samples: z.number().int().nonnegative(),
  minimum_ms: latency.nullable(),
  maximum_ms: latency.nullable(),
  mean_ms: latency.nullable(),
}).strict();

export const helixBrokerageReactiveLiveShadowProjectionSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA),
  shadow_session_id: identifier,
  client_shadow_session_id: identifier,
  controller_run_id: identifier,
  controller_profile_id: z.literal(
    HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  ),
  owner_profile_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  paper_account_id: identifier,
  producer_epoch_ref: identifier,
  strategy_manifest_id: identifier,
  strategy_artifact_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  symbol,
  status: helixBrokerageReactiveLiveShadowStatusSchema,
  terminal_reason: helixBrokerageReactiveLiveShadowTerminalReasonSchema
    .nullable(),
  poll_interval_ms: z.number().int().positive(),
  maximum_polls: z.number().int().positive(),
  polls_attempted: z.number().int().nonnegative(),
  polls_succeeded: z.number().int().nonnegative(),
  consecutive_failures: z.number().int().nonnegative(),
  maximum_consecutive_failures: z.number().int().positive(),
  regular_session_observations: z.number().int().nonnegative(),
  degraded_timing_observations: z.number().int().nonnegative(),
  last_observation_id: identifier.nullable(),
  last_source_output_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u)
    .nullable(),
  last_error_code: identifier.nullable(),
  poll_in_flight: z.boolean(),
  next_poll_at: timestamp,
  session_expires_at: timestamp,
  started_at: timestamp,
  updated_at: timestamp,
  terminal_at: timestamp.nullable(),
  poll_duration: latencySummarySchema,
  provider_to_arrival: latencySummarySchema,
  arrival_to_decision: latencySummarySchema,
  end_to_end: latencySummarySchema,
  bounded_polling: z.literal(true),
  private_model_loop_present: z.literal(false),
  ...safetyProjection,
}).strict().superRefine((value, context) => {
  const terminal = value.status !== "active";
  if (terminal !== (value.terminal_reason !== null) ||
      terminal !== (value.terminal_at !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["status"],
      message: "A terminal shadow session must retain its reason and time.",
    });
  }
  if (value.polls_succeeded > value.polls_attempted ||
      value.polls_attempted > value.maximum_polls) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["polls_attempted"],
      message: "Shadow poll counters must remain within the finite budget.",
    });
  }
});

export type HelixBrokerageReactiveLiveShadowProjection = z.infer<
  typeof helixBrokerageReactiveLiveShadowProjectionSchema
>;

export const HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_DEGRADED_REASONS = [
  "provider_event_time_unavailable",
  "provider_observation_time_unavailable",
  "provider_to_arrival_latency_unavailable",
  "end_to_end_latency_unavailable",
] as const;

export const helixBrokerageReactiveLiveShadowPollReceiptSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA),
  operation: z.literal("brokerage.reactive_live_shadow.poll"),
  shadow_session: helixBrokerageReactiveLiveShadowProjectionSchema,
  poll_sequence: z.number().int().positive(),
  disposition: z.enum([
    "processed",
    "source_failed",
    "normalization_failed",
    "controller_rejected",
  ]),
  source_observation_id: identifier.nullable(),
  source_output_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/u).nullable(),
  normalized_observation: helixBrokerageReactiveMarketObservationSchema
    .nullable(),
  controller_receipt: helixBrokerageReactiveControllerCycleReceiptSchema
    .nullable(),
  controller_run: helixBrokerageReactiveControllerProjectionSchema.nullable(),
  error_code: identifier.nullable(),
  read_started_at: timestamp,
  read_completed_at: timestamp,
  processing_completed_at: timestamp,
  provider_time_basis: z.enum(["provider_payload", "arrival_proxy"]),
  poll_duration_ms: latency,
  provider_to_arrival_ms: latency.nullable(),
  arrival_to_decision_ms: latency,
  end_to_end_ms: latency.nullable(),
  degraded_timing_reasons: z.array(z.enum(
    HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_DEGRADED_REASONS,
  )).max(4),
  ...safetyProjection,
}).strict().superRefine((value, context) => {
  const processed = value.disposition === "processed";
  const normalized = processed || value.disposition === "controller_rejected";
  if (normalized !== (value.normalized_observation !== null) ||
      processed !== (value.controller_receipt !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["disposition"],
      message: "Only a processed poll may contain normalized controller evidence.",
    });
  }
  if (processed && value.controller_run?.controller_run_id !==
      value.controller_receipt?.controller_run.controller_run_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["controller_run"],
      message: "A processed poll must project its exact controller receipt run.",
    });
  }
  if ((value.disposition === "source_failed") !==
      (value.source_observation_id === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["source_observation_id"],
      message: "A provider-source failure cannot claim a source observation.",
    });
  }
  if (processed !== (value.error_code === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["error_code"],
      message: "Processed polls have no error; all other dispositions require one.",
    });
  }
  const providerTimed = value.provider_time_basis === "provider_payload";
  if (providerTimed !== (value.provider_to_arrival_ms !== null) ||
      providerTimed !== (value.end_to_end_ms !== null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["provider_time_basis"],
      message: "Provider latency is reportable only for provider-supplied time.",
    });
  }
});

export type HelixBrokerageReactiveLiveShadowPollReceipt = z.infer<
  typeof helixBrokerageReactiveLiveShadowPollReceiptSchema
>;

export const helixBrokerageReactiveLiveShadowControlSchema = z.object({
  action: z.literal("stop"),
  reason: z.string().trim().min(1).max(500),
}).strict();

export const HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_EVIDENCE_SCHEMA =
  "helix.brokerage_reactive_live_shadow_evidence.v1" as const;

export const helixBrokerageReactiveLiveShadowEvidenceLedgerSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_EVIDENCE_SCHEMA),
  shadow_session: helixBrokerageReactiveLiveShadowProjectionSchema,
  receipts: z.array(helixBrokerageReactiveLiveShadowPollReceiptSchema)
    .max(10_000),
  receipt_hashes: z.array(sha256).max(10_000),
  evidence_hash: sha256,
  settled_poll_count: z.number().int().nonnegative(),
  regular_market_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/u))
    .max(366),
  source_gap_count: z.number().int().nonnegative(),
  watchdog_reaction_count: z.number().int().nonnegative(),
  complete: z.boolean(),
  restart_safe_persistence: z.literal(true),
  maturity_authority: z.literal(false),
  ...safetyProjection,
}).strict().superRefine((value, context) => {
  if (value.receipts.length !== value.receipt_hashes.length ||
      value.receipts.length !== value.settled_poll_count) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["settled_poll_count"],
      message: "Every settled poll must have one sanitized receipt hash.",
    });
  }
  if (value.receipts.some((receipt) =>
    receipt.shadow_session.shadow_session_id !==
      value.shadow_session.shadow_session_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["receipts"],
      message: "Evidence receipts must belong to the exact shadow session.",
    });
  }
});

export type HelixBrokerageReactiveLiveShadowEvidenceLedger = z.infer<
  typeof helixBrokerageReactiveLiveShadowEvidenceLedgerSchema
>;

export const HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_ACCEPTANCE_SCHEMA =
  "helix.brokerage_reactive_live_shadow_acceptance.v1" as const;

export const helixBrokerageReactiveLiveShadowAcceptanceRequestSchema = z.object({
  shadow_session_ids: z.array(identifier).min(2).max(10),
}).strict().superRefine((value, context) => {
  if (new Set(value.shadow_session_ids).size !== value.shadow_session_ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["shadow_session_ids"],
      message: "Acceptance session identities must be unique.",
    });
  }
});

export const helixBrokerageReactiveLiveShadowAcceptanceSchema = z.object({
  schema: z.literal(HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_ACCEPTANCE_SCHEMA),
  ok: z.literal(true),
  archive_id: identifier,
  evidence_hash: sha256,
  status: z.literal("qualified"),
  owner_profile_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  environment_binding_id: identifier,
  controller_profile_id: z.literal(
    HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE_ID,
  ),
  strategy_artifact_hash: sha256,
  symbol,
  shadow_session_ids: z.array(identifier).min(2).max(10),
  session_evidence_hashes: z.array(sha256).min(2).max(10),
  regular_market_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/u))
    .min(2).max(366),
  terminal_session_count: z.number().int().min(2).max(10),
  settled_poll_count: z.number().int().positive(),
  processed_poll_count: z.number().int().positive(),
  regular_session_observation_count: z.number().int().min(2),
  source_gap_count: z.number().int().nonnegative(),
  watchdog_reaction_count: z.number().int().nonnegative(),
  degraded_timing_observation_count: z.number().int().nonnegative(),
  poll_duration: latencySummarySchema,
  provider_to_arrival: latencySummarySchema,
  arrival_to_decision: latencySummarySchema,
  end_to_end: latencySummarySchema,
  all_sessions_complete: z.literal(true),
  multiple_regular_hours_sessions: z.literal(true),
  latency_measured: z.literal(true),
  restart_safe_persistence: z.literal(true),
  ready_for_maturity_review: z.literal(true),
  canonical_maturity_updated: z.literal(false),
  maturity_authority: z.literal(false),
  qualified_at: timestamp,
  ...safetyProjection,
}).strict().superRefine((value, context) => {
  if (value.shadow_session_ids.length !== value.session_evidence_hashes.length ||
      value.terminal_session_count !== value.shadow_session_ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["shadow_session_ids"],
      message: "Every qualified session must have one immutable evidence hash.",
    });
  }
  if (value.arrival_to_decision.samples < value.processed_poll_count ||
      value.poll_duration.samples < value.settled_poll_count) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["arrival_to_decision"],
      message: "Qualified evidence must measure each settled and processed poll.",
    });
  }
});

export type HelixBrokerageReactiveLiveShadowAcceptance = z.infer<
  typeof helixBrokerageReactiveLiveShadowAcceptanceSchema
>;
