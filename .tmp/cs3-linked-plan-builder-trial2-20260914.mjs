// shared/helix-environment-time.ts
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { z } from "zod";
var HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA = "environment.temporal_action_plan.v1";
var HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA = "environment.affordance_frontier.v1";
var HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA = "environment.interrupt_receipt.v1";
var HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA = "environment.feedback_latency.v1";
var HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA = "environment.capacity_sample.v1";
var HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA = "environment.capacity_report.v1";
var HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA = "environment.temporal_plan_event.v1";
var HELIX_ENVIRONMENT_CLOCK_KINDS = [
  "tick",
  "frame",
  "simulation_step",
  "provider_sequence",
  "revision",
  "event_sequence"
];
var HELIX_ENVIRONMENT_AFFORDANCE_STATES = [
  "available_now",
  "conditional",
  "blocked",
  "unknown"
];
var HELIX_ENVIRONMENT_INTERRUPT_KINDS = [
  "emergency_stop",
  "authority_revoked",
  "identity_lost",
  "epoch_changed",
  "manual_override",
  "hard_safety",
  "user_cancel",
  "user_steering",
  "postcondition_failed",
  "critical_hazard",
  "affordance_lost",
  "runway_low",
  "checkpoint",
  "informational_change"
];
var HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES = [
  "sovereign_stop",
  "local_safety",
  "user_intent",
  "material_deviation",
  "planning_watermark",
  "informational"
];
var HELIX_ENVIRONMENT_PLAN_OUTCOMES = [
  "succeeded",
  "failed",
  "canceled",
  "timed_out",
  "interrupted",
  "not_started"
];
var identifierSchema = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/u);
var timestampSchema = z.string().datetime({ offset: true });
var sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
var sequenceSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
var boundedTextSchema = z.string().trim().min(1).max(2e3);
var canonicalEnvironmentTimeValue = (value) => {
  if (Array.isArray(value)) return value.map(canonicalEnvironmentTimeValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, canonicalEnvironmentTimeValue(nested)])
  );
};
var helixEnvironmentTimeSha256 = (value) => `sha256:${bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(canonicalEnvironmentTimeValue(value)))))}`;
var boundedRecordSchema = (maxBytes) => z.record(z.string(), z.unknown()).superRefine((value, context) => {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalEnvironmentTimeValue(value))).byteLength;
  if (bytes > maxBytes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Structured value exceeds the ${maxBytes}-byte limit.`
    });
  }
});
var helixEnvironmentTimeIdentitySchema = z.object({
  environment_id: identifierSchema,
  source_id: identifierSchema,
  subject_id: identifierSchema,
  producer_epoch: identifierSchema,
  authority_id: identifierSchema,
  authority_revision: sequenceSchema,
  goal_id: identifierSchema,
  goal_revision: sequenceSchema,
  observation_revision: sequenceSchema,
  affordance_revision: sequenceSchema
}).strict();
var helixEnvironmentClockSchema = z.object({
  kind: z.enum(HELIX_ENVIRONMENT_CLOCK_KINDS),
  sequence: sequenceSchema,
  resolution_unit: identifierSchema,
  nominal_units_per_second: z.number().finite().positive().nullable()
}).strict();
var helixEnvironmentThreeClockSchema = z.object({
  environment: helixEnvironmentClockSchema,
  monotonic: z.object({
    origin_id: identifierSchema,
    elapsed_ms: sequenceSchema
  }).strict(),
  audit_at: timestampSchema
}).strict();
var helixEnvironmentPlanConditionSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("boolean_equals"),
      fact_key: identifierSchema,
      expected: z.boolean()
    }).strict(),
    z.object({
      kind: z.literal("number_compare"),
      fact_key: identifierSchema,
      operator: z.enum(["lt", "lte", "eq", "gte", "gt"]),
      value: z.number().finite()
    }).strict(),
    z.object({
      kind: z.literal("enum_equals"),
      fact_key: identifierSchema,
      expected: identifierSchema
    }).strict(),
    z.object({
      kind: z.literal("resource_available"),
      resource_key: identifierSchema
    }).strict(),
    z.object({
      kind: z.literal("prior_node_outcome"),
      node_id: identifierSchema,
      outcome: z.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES)
    }).strict(),
    z.object({
      kind: z.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema
    }).strict(),
    z.object({
      kind: z.literal("adapter_condition"),
      condition_id: identifierSchema,
      arguments: boundedRecordSchema(8 * 1024)
    }).strict()
  ]
);
var nodeTimingSchema = z.object({
  earliest_start_unit: sequenceSchema,
  latest_start_unit: sequenceSchema,
  maximum_duration_units: z.number().int().positive().max(1e6)
}).strict().superRefine((value, context) => {
  if (value.latest_start_unit < value.earliest_start_unit) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["latest_start_unit"],
      message: "Latest start cannot precede earliest start."
    });
  }
});
var effectBudgetSchema = z.record(identifierSchema, z.number().int().nonnegative().max(1e6)).superRefine((value, context) => {
  if (Object.keys(value).length > 64) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Effect budget may contain at most 64 effect kinds."
    });
  }
});
var actionNodeSchema = z.object({
  kind: z.literal("action"),
  node_id: identifierSchema,
  lane_id: identifierSchema,
  capability_id: identifierSchema,
  capability_version: identifierSchema,
  arguments: boundedRecordSchema(32 * 1024),
  required_resources: z.array(identifierSchema).max(32),
  timing: nodeTimingSchema,
  preconditions: z.array(helixEnvironmentPlanConditionSchema).max(32),
  completion_conditions: z.array(helixEnvironmentPlanConditionSchema).min(1).max(32),
  abort_guards: z.array(helixEnvironmentPlanConditionSchema).max(32),
  effect_budget: effectBudgetSchema,
  on_success_node_id: identifierSchema,
  on_failure_node_id: identifierSchema,
  on_timeout_node_id: identifierSchema
}).strict();
var checkpointNodeSchema = z.object({
  kind: z.literal("checkpoint"),
  node_id: identifierSchema,
  checkpoint_id: identifierSchema,
  required_evidence_kinds: z.array(identifierSchema).min(1).max(32),
  condition: helixEnvironmentPlanConditionSchema,
  wait_up_to_units: sequenceSchema,
  on_satisfied_node_id: identifierSchema,
  on_timeout_node_id: identifierSchema
}).strict();
var branchNodeSchema = z.object({
  kind: z.literal("branch"),
  node_id: identifierSchema,
  condition: helixEnvironmentPlanConditionSchema,
  true_node_id: identifierSchema,
  false_node_id: identifierSchema
}).strict();
var terminalNodeSchema = z.object({
  kind: z.literal("terminal"),
  node_id: identifierSchema,
  outcome: z.enum(["succeeded", "failed", "canceled"]),
  reason_code: identifierSchema
}).strict();
var helixEnvironmentTemporalPlanNodeSchema = z.discriminatedUnion(
  "kind",
  [
    actionNodeSchema,
    checkpointNodeSchema,
    branchNodeSchema,
    terminalNodeSchema
  ]
);
var laneSchema = z.object({
  lane_id: identifierSchema,
  priority: z.number().int().min(0).max(1e3),
  resource_keys: z.array(identifierSchema).max(32)
}).strict();
var watermarkSchema = z.object({
  decision_unit: sequenceSchema,
  stop_unit: sequenceSchema,
  committed_through_unit: sequenceSchema,
  stabilization_node_id: identifierSchema.nullable()
}).strict().superRefine((value, context) => {
  if (value.decision_unit > value.stop_unit || value.stop_unit > value.committed_through_unit) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Watermarks must satisfy decision <= stop <= committed-through."
    });
  }
});
var temporalPlanBaseSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA),
  plan_id: identifierSchema,
  previous_plan_id: identifierSchema.nullable(),
  previous_plan_hash: sha256Schema.nullable(),
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  adapter_id: identifierSchema,
  adapter_version: identifierSchema,
  compiler_version: identifierSchema,
  resident_executor_version: identifierSchema,
  start_node_id: identifierSchema,
  maximum_total_units: z.number().int().positive().max(1e6),
  monotonic_deadline_elapsed_ms: sequenceSchema,
  watermarks: watermarkSchema,
  lanes: z.array(laneSchema).min(1).max(32),
  effect_ceiling: effectBudgetSchema,
  nodes: z.array(helixEnvironmentTemporalPlanNodeSchema).min(2).max(256),
  automatic_replay: z.literal(false),
  adapter_strategy_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict();
var nodeTargets = (node) => {
  if (node.kind === "action") {
    return [
      node.on_success_node_id,
      node.on_failure_node_id,
      node.on_timeout_node_id
    ];
  }
  if (node.kind === "checkpoint") {
    return [node.on_satisfied_node_id, node.on_timeout_node_id];
  }
  if (node.kind === "branch") return [node.true_node_id, node.false_node_id];
  return [];
};
var nodeConditions = (node) => {
  if (node.kind === "action") {
    return [
      ...node.preconditions,
      ...node.completion_conditions,
      ...node.abort_guards
    ];
  }
  if (node.kind === "checkpoint" || node.kind === "branch") {
    return [node.condition];
  }
  return [];
};
var validatePlanGraph = (plan, context) => {
  const nodes = new Map(plan.nodes.map((node) => [node.node_id, node]));
  if (nodes.size !== plan.nodes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nodes"],
      message: "Node ids must be unique."
    });
    return;
  }
  const lanes = new Map(plan.lanes.map((lane) => [lane.lane_id, lane]));
  if (lanes.size !== plan.lanes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Lane ids must be unique."
    });
  }
  if (!nodes.has(plan.start_node_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["start_node_id"],
      message: "Start node is missing."
    });
    return;
  }
  if (plan.watermarks.committed_through_unit > plan.maximum_total_units) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["watermarks"],
      message: "Committed watermark exceeds plan horizon."
    });
  }
  if (plan.monotonic_deadline_elapsed_ms <= plan.clocks.monotonic.elapsed_ms) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["monotonic_deadline_elapsed_ms"],
      message: "Plan deadline must follow the starting monotonic clock."
    });
  }
  if (plan.watermarks.stabilization_node_id !== null && !nodes.has(plan.watermarks.stabilization_node_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["watermarks", "stabilization_node_id"],
      message: "Stabilization node is missing."
    });
  }
  for (const [index, node] of plan.nodes.entries()) {
    for (const target of nodeTargets(node)) {
      if (!nodes.has(target)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Node references missing target ${target}.`
        });
      }
    }
    for (const planCondition of nodeConditions(node)) {
      if (planCondition.kind === "prior_node_outcome" && !nodes.has(planCondition.node_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Condition references missing node ${planCondition.node_id}.`
        });
      }
      if (planCondition.kind === "checkpoint_satisfied") {
        const found = plan.nodes.some(
          (candidate) => candidate.kind === "checkpoint" && candidate.checkpoint_id === planCondition.checkpoint_id
        );
        if (!found) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index],
            message: `Condition references missing checkpoint ${planCondition.checkpoint_id}.`
          });
        }
      }
    }
    if (node.kind !== "action") continue;
    const lane = lanes.get(node.lane_id);
    if (!lane) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", index, "lane_id"],
        message: "Action lane is missing."
      });
      continue;
    }
    if (node.required_resources.some(
      (resource) => !lane.resource_keys.includes(resource)
    )) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", index, "required_resources"],
        message: "Action resources must be declared by its lane."
      });
    }
    if (node.timing.latest_start_unit + node.timing.maximum_duration_units > plan.maximum_total_units) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", index, "timing"],
        message: "Action timing exceeds the plan horizon."
      });
    }
    for (const [effect, count] of Object.entries(node.effect_budget)) {
      if (!(effect in plan.effect_ceiling) || count > plan.effect_ceiling[effect]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "effect_budget", effect],
          message: "Action effect exceeds or is absent from the plan ceiling."
        });
      }
    }
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  let terminalReachable = false;
  const visit = (nodeId) => {
    if (visiting.has(nodeId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "Temporal plan graph must be acyclic."
      });
      return;
    }
    if (visited.has(nodeId)) return;
    const node = nodes.get(nodeId);
    if (!node) return;
    visiting.add(nodeId);
    if (node.kind === "terminal") terminalReachable = true;
    nodeTargets(node).forEach(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  visit(plan.start_node_id);
  if (visited.size !== plan.nodes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nodes"],
      message: "Every node must be reachable from the start node."
    });
  }
  if (!terminalReachable) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nodes"],
      message: "At least one terminal must be reachable."
    });
  }
};
var helixEnvironmentTemporalPlanSchema = temporalPlanBaseSchema.extend({ plan_hash: sha256Schema }).superRefine((plan, context) => {
  const { plan_hash: suppliedHash, ...withoutHash } = plan;
  if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["plan_hash"],
      message: "Plan hash does not match canonical semantic content."
    });
  }
  validatePlanGraph(withoutHash, context);
});
var buildHelixEnvironmentTemporalPlan = (input) => {
  const base = {
    schema: HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA,
    ...input,
    automatic_replay: false,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false
  };
  return helixEnvironmentTemporalPlanSchema.parse({
    ...base,
    plan_hash: helixEnvironmentTimeSha256(base)
  });
};
var temporalPlanEventPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan_admitted"), plan_hash: sha256Schema }).strict(),
  z.object({ kind: z.literal("execution_started") }).strict(),
  z.object({
    kind: z.literal("checkpoint_settled"),
    checkpoint_id: identifierSchema,
    observation_revision: sequenceSchema,
    affordance_revision: sequenceSchema,
    evidence_refs: z.array(identifierSchema).min(1).max(256)
  }).strict(),
  z.object({
    kind: z.literal("extension_appended"),
    extension_plan_id: identifierSchema,
    extension_plan_hash: sha256Schema,
    after_checkpoint_id: identifierSchema
  }).strict(),
  z.object({
    kind: z.literal("replacement_committed"),
    replacement_plan_id: identifierSchema,
    replacement_plan_hash: sha256Schema,
    canceled_unexecuted_node_ids: z.array(identifierSchema).max(256),
    performed_effects_preserved: z.literal(true)
  }).strict(),
  z.object({
    kind: z.literal("runway_low"),
    remaining_units: sequenceSchema
  }).strict(),
  z.object({
    kind: z.literal("stabilization_required"),
    stabilization_node_id: identifierSchema.nullable(),
    reason_code: identifierSchema
  }).strict(),
  z.object({
    kind: z.literal("cancel_requested"),
    reason_code: identifierSchema,
    authority_reducing: z.literal(true)
  }).strict(),
  z.object({
    kind: z.literal("plan_settled"),
    outcome: z.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES),
    performed_effects: effectBudgetSchema,
    controls_released: z.literal(true),
    resources_released: z.literal(true),
    evidence_refs: z.array(identifierSchema).max(256)
  }).strict()
]);
var helixEnvironmentTemporalPlanEventSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA),
  event_id: identifierSchema,
  plan_id: identifierSchema,
  sequence: z.number().int().positive(),
  previous_event_hash: sha256Schema.nullable(),
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  payload: temporalPlanEventPayloadSchema,
  event_hash: sha256Schema,
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict();
var affordanceEntrySchema = z.object({
  capability_id: identifierSchema,
  capability_version: identifierSchema,
  subject_id: identifierSchema,
  state: z.enum(HELIX_ENVIRONMENT_AFFORDANCE_STATES),
  reason_codes: z.array(identifierSchema).max(32),
  required_authority_ids: z.array(identifierSchema).max(16),
  held_resource_keys: z.array(identifierSchema).max(32),
  parameter_bounds: boundedRecordSchema(8 * 1024),
  missing_observation_kinds: z.array(identifierSchema).max(32),
  evidence_probe_capability_ids: z.array(identifierSchema).max(16)
}).strict();
var helixEnvironmentAffordanceFrontierSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA),
  frontier_id: identifierSchema,
  identity: helixEnvironmentTimeIdentitySchema,
  clocks: helixEnvironmentThreeClockSchema,
  expires_at_environment_sequence: sequenceSchema,
  entries: z.array(affordanceEntrySchema).max(256),
  newly_available_capability_ids: z.array(identifierSchema).max(256),
  newly_blocked_capability_ids: z.array(identifierSchema).max(256),
  materially_changed_capability_ids: z.array(identifierSchema).max(256),
  expired_capability_ids: z.array(identifierSchema).max(256),
  strategy_recommendation_included: z.literal(false),
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict().superRefine((frontier, context) => {
  if (frontier.expires_at_environment_sequence <= frontier.clocks.environment.sequence) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expires_at_environment_sequence"],
      message: "Affordance frontier must expire after its observation sequence."
    });
  }
  const keys = frontier.entries.map(
    (entry) => `${entry.capability_id}@${entry.capability_version}:${entry.subject_id}`
  );
  if (new Set(keys).size !== keys.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["entries"],
      message: "Affordance entries must be unique by capability, version and subject."
    });
  }
});
var helixEnvironmentInterruptReceiptSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA),
  interrupt_id: identifierSchema,
  plan_id: identifierSchema,
  plan_hash: sha256Schema,
  identity: helixEnvironmentTimeIdentitySchema,
  kind: z.enum(HELIX_ENVIRONMENT_INTERRUPT_KINDS),
  priority: z.enum(HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES),
  detected_clocks: helixEnvironmentThreeClockSchema,
  preempted_clocks: helixEnvironmentThreeClockSchema,
  affected_node_ids: z.array(identifierSchema).max(256),
  released_resource_keys: z.array(identifierSchema).max(64),
  performed_effects: effectBudgetSchema,
  checkpoint_id: identifierSchema.nullable(),
  next_decision: z.enum(["none", "resume", "replan", "cancel", "stabilize"]),
  controls_released: z.boolean(),
  execution_authority: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict().superRefine((receipt, context) => {
  if (receipt.preempted_clocks.monotonic.elapsed_ms < receipt.detected_clocks.monotonic.elapsed_ms) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["preempted_clocks"],
      message: "Pre-emption cannot precede detection."
    });
  }
  if (receipt.kind === "user_steering" && receipt.next_decision === "resume") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["next_decision"],
      message: "Steering that invalidates a plan must replan, cancel or stabilize rather than auto-resume."
    });
  }
  const expected = {
    emergency_stop: ["sovereign_stop", "cancel", true],
    authority_revoked: ["sovereign_stop", "cancel", true],
    identity_lost: ["sovereign_stop", "cancel", true],
    epoch_changed: ["sovereign_stop", "cancel", true],
    manual_override: ["sovereign_stop", "cancel", true],
    hard_safety: ["local_safety", "stabilize", true],
    user_cancel: ["user_intent", "cancel", true],
    user_steering: ["user_intent", "replan", true],
    postcondition_failed: ["material_deviation", "replan", true],
    critical_hazard: ["local_safety", "stabilize", true],
    affordance_lost: ["material_deviation", "replan", true],
    runway_low: ["planning_watermark", "stabilize", false],
    checkpoint: ["informational", "none", false],
    informational_change: ["informational", "none", false]
  }[receipt.kind];
  if (receipt.priority !== expected[0] || receipt.next_decision !== expected[1] || receipt.controls_released !== expected[2]) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Interrupt priority, decision and control release must match the fixed authority-reducing policy."
    });
  }
  if (receipt.preempted_clocks.monotonic.origin_id !== receipt.detected_clocks.monotonic.origin_id || receipt.preempted_clocks.environment.kind !== receipt.detected_clocks.environment.kind || receipt.preempted_clocks.environment.resolution_unit !== receipt.detected_clocks.environment.resolution_unit || receipt.preempted_clocks.environment.sequence < receipt.detected_clocks.environment.sequence) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["preempted_clocks"],
      message: "Pre-emption clocks must preserve their domains and cannot regress."
    });
  }
});
var helixEnvironmentFeedbackLatencySchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA),
  trace_id: identifierSchema,
  identity: helixEnvironmentTimeIdentitySchema,
  spans_ms: z.object({
    manual_input_to_release: z.number().int().nonnegative().nullable(),
    finalized_input_to_task_available: z.number().int().nonnegative().nullable(),
    pickup_to_acknowledgement: z.number().int().nonnegative().nullable(),
    arbitration_to_plan_stop: z.number().int().nonnegative().nullable(),
    observation_to_replacement_proposal: z.number().int().nonnegative().nullable(),
    proposal_to_admission: z.number().int().nonnegative().nullable(),
    admission_to_first_execution_unit: z.number().int().nonnegative().nullable(),
    final_observation_to_presentation: z.number().int().nonnegative().nullable()
  }).strict(),
  speech_capture_and_finalization_ms: z.number().int().nonnegative().nullable(),
  provider_id: identifierSchema.nullable(),
  credential_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict();
var nullableMillisecondsSchema = z.number().int().nonnegative().nullable();
var helixEnvironmentCapacitySampleSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA),
  sample_id: identifierSchema,
  course: z.enum(["controlled_n0", "unknown_world"]).nullable(),
  rolling_cycle_index: z.number().int().positive(),
  identity: helixEnvironmentTimeIdentitySchema,
  exact_reasoning_binding_ref: identifierSchema,
  resident_computation_ms: z.number().int().nonnegative(),
  dispatch_to_first_tick_ms: nullableMillisecondsSchema,
  scheduler_ticks: z.number().int().positive(),
  active_control_ticks: z.number().int().nonnegative(),
  stalled_ticks: z.number().int().nonnegative(),
  missed_ticks: z.number().int().nonnegative(),
  queue_depth_peak: z.number().int().nonnegative(),
  lead_time_ticks: z.number().int().nonnegative().nullable(),
  latencies_ms: z.object({
    event_to_evidence: nullableMillisecondsSchema,
    evidence_to_pickup: nullableMillisecondsSchema,
    stop_to_replan: nullableMillisecondsSchema,
    finalized_steering_to_stop: nullableMillisecondsSchema,
    manual_or_safety_to_release: nullableMillisecondsSchema
  }).strict(),
  elapsed_ms: z.number().int().positive(),
  replans: z.number().int().nonnegative(),
  unnecessary_replans: z.number().int().nonnegative(),
  observation_input_bytes: z.number().int().nonnegative().nullable(),
  observation_output_bytes: z.number().int().nonnegative().nullable(),
  observation_tokens: z.number().int().nonnegative().nullable(),
  raw_event_count: z.number().int().nonnegative(),
  emitted_observation_count: z.number().int().nonnegative(),
  performed_effect_refs: z.array(identifierSchema).max(2048),
  verified_progress_units: z.number().finite().nonnegative(),
  model_tool_round_trips: z.number().int().nonnegative(),
  changed_affordance_replan_observed: z.boolean(),
  local_intervention_observed: z.boolean(),
  user_steering_observed: z.boolean(),
  reconnect_recovery_observed: z.boolean(),
  revocation_observed: z.boolean(),
  stale_after_revoke_rejected: z.boolean(),
  evidence_reentered: z.boolean(),
  controls_released: z.boolean(),
  credential_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict().superRefine((sample, context) => {
  if (sample.active_control_ticks > sample.scheduler_ticks) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["active_control_ticks"],
      message: "Active control ticks cannot exceed scheduler ticks."
    });
  }
  if (sample.stalled_ticks > sample.scheduler_ticks) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stalled_ticks"],
      message: "Stalled ticks cannot exceed observed scheduler ticks."
    });
  }
  if (sample.unnecessary_replans > sample.replans) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unnecessary_replans"],
      message: "Unnecessary replans cannot exceed total replans."
    });
  }
  if (sample.emitted_observation_count > sample.raw_event_count) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emitted_observation_count"],
      message: "Emitted observations cannot exceed raw events."
    });
  }
});
var percentileSummarySchema = z.object({
  sample_count: z.number().int().nonnegative(),
  p50: z.number().finite().nonnegative().nullable(),
  p95: z.number().finite().nonnegative().nullable(),
  p99: z.number().finite().nonnegative().nullable()
}).strict();
var helixEnvironmentCapacityReportSchema = z.object({
  schema: z.literal(HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA),
  report_id: identifierSchema,
  exact_reasoning_binding_ref: identifierSchema,
  sample_count: z.number().int().positive(),
  rolling_cycle_count: z.number().int().positive(),
  courses_observed: z.array(z.enum(["controlled_n0", "unknown_world"])),
  latency_percentiles_ms: z.object({
    resident_computation: percentileSummarySchema,
    dispatch_to_first_tick: percentileSummarySchema,
    event_to_evidence: percentileSummarySchema,
    evidence_to_pickup: percentileSummarySchema,
    stop_to_replan: percentileSummarySchema,
    finalized_steering_to_stop: percentileSummarySchema,
    manual_or_safety_to_release: percentileSummarySchema
  }).strict(),
  continuous_control_ratio: z.number().finite().min(0).max(1),
  stalled_tick_count: z.number().int().nonnegative(),
  missed_tick_count: z.number().int().nonnegative(),
  queue_depth_peak: z.number().int().nonnegative(),
  lead_time_ticks_p50: z.number().finite().nonnegative().nullable(),
  replans_per_minute: z.number().finite().nonnegative(),
  unnecessary_replans_per_minute: z.number().finite().nonnegative(),
  observation_input_bytes: z.number().int().nonnegative().nullable(),
  observation_output_bytes: z.number().int().nonnegative().nullable(),
  observation_tokens: z.number().int().nonnegative().nullable(),
  observation_coalescing_ratio: z.number().finite().min(0).max(1).nullable(),
  performed_effect_count: z.number().int().nonnegative(),
  duplicate_effect_count: z.number().int().nonnegative(),
  verified_progress_per_model_tool_round_trip: z.number().finite().nonnegative().nullable(),
  missing_measurements: z.array(identifierSchema),
  exit_criteria: z.object({
    at_least_three_rolling_cycles: z.boolean(),
    controlled_and_unknown_world_observed: z.boolean(),
    changed_affordance_replan_observed: z.boolean(),
    local_intervention_observed: z.boolean(),
    user_steering_observed: z.boolean(),
    reconnect_recovery_observed: z.boolean(),
    zero_duplicate_effects: z.boolean(),
    final_revocation_observed: z.boolean(),
    stale_after_revoke_rejected: z.boolean(),
    all_controls_released: z.boolean(),
    all_evidence_reentered: z.boolean(),
    required_measurements_complete: z.boolean()
  }).strict(),
  exit_satisfied: z.boolean(),
  evidence_refs: z.array(identifierSchema).min(1).max(512),
  credential_included: z.literal(false),
  hidden_reasoning_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false)
}).strict();

// shared/helix-minecraft-fluid-sequence.ts
import { z as z3 } from "zod";

// shared/helix-minecraft-player-capabilities.ts
import { z as z2 } from "zod";
var HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY = "com.casimirbot.minecraft.player.workflow.status";
var HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY = "com.casimirbot.minecraft.player.navigate";
var HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY = "com.casimirbot.minecraft.player.look";
var HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY = "com.casimirbot.minecraft.player.camera.track";
var HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY = "com.casimirbot.minecraft.player.walk";
var HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY = "com.casimirbot.minecraft.player.jump";
var HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY = "com.casimirbot.minecraft.player.interact";
var HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY = "com.casimirbot.minecraft.player.combat.attack";
var HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY = "com.casimirbot.minecraft.player.combat.guard";
var HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY = "com.casimirbot.minecraft.player.hotbar.select";
var HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY = "com.casimirbot.minecraft.player.equipment.equip";
var HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY = "com.casimirbot.minecraft.player.workflow.cancel";
var HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY = "com.casimirbot.minecraft.player.workflow.resume";
var HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY = "com.casimirbot.minecraft.player.emergency_stop";
var HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY = "com.casimirbot.minecraft.player.follow";
var HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY = "com.casimirbot.minecraft.player.collect";
var HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY = "com.casimirbot.minecraft.player.mine";
var HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY = "com.casimirbot.minecraft.player.place";
var HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY = "com.casimirbot.minecraft.player.craft";
var HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY = "com.casimirbot.minecraft.player.consume";
var HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY = "com.casimirbot.minecraft.player.inventory.transfer";
var HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY = "com.casimirbot.minecraft.player.sequence.execute";
var HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY = "com.casimirbot.minecraft.player.guardian.execute";
var HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY = "com.casimirbot.minecraft.player.viability_guardian.arm";
var HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY = "com.casimirbot.minecraft.player.viability_guardian.disarm";
var HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY
]);
var HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY
]);
var HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS
]);
var HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS = Object.freeze([
  ...HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY
]);
var coordinateSchema = z2.number().finite().min(-3e7).max(3e7);
var yCoordinateSchema = z2.number().finite().min(-2048).max(2048);
var resourceLocationSchema = z2.string().trim().min(1).max(320).regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
var subjectRefSchema = z2.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/);
var helixMinecraftPositionSchema = z2.object({
  x: coordinateSchema,
  y: yCoordinateSchema,
  z: coordinateSchema
}).strict();
var helixMinecraftBlockPositionSchema = z2.object({
  x: z2.number().int().min(-3e7).max(3e7),
  y: z2.number().int().min(-2048).max(2048),
  z: z2.number().int().min(-3e7).max(3e7)
}).strict();
var helixMinecraftPlayerActionArgumentsSchema = z2.discriminatedUnion("action_kind", [
  z2.object({
    action_kind: z2.literal("navigate_to"),
    destination: helixMinecraftPositionSchema,
    arrival_radius: z2.number().finite().min(0.25).max(16),
    allow_sprint: z2.boolean(),
    allow_dig: z2.literal(false),
    allow_place: z2.literal(false),
    engine_preference: z2.enum([
      "adapter_selected",
      "native_fabric",
      "baritone"
    ])
  }).strict(),
  z2.object({
    action_kind: z2.literal("look_at"),
    target: z2.discriminatedUnion("target_kind", [
      z2.object({
        target_kind: z2.literal("position"),
        position: helixMinecraftPositionSchema
      }).strict(),
      z2.object({
        target_kind: z2.literal("current_focus")
      }).strict(),
      z2.object({
        target_kind: z2.literal("relative_rotation"),
        yaw_delta_degrees: z2.number().finite().min(-180).max(180).describe(
          "Positive values turn right; negative values turn left."
        ),
        pitch_delta_degrees: z2.number().finite().min(-180).max(180).describe(
          "Positive values look down; negative values look up."
        )
      }).strict(),
      z2.object({
        target_kind: z2.literal("environment_subject"),
        subject_ref: subjectRefSchema
      }).strict()
    ]),
    max_turn_degrees_per_tick: z2.number().finite().positive().max(180)
  }).strict(),
  z2.object({
    action_kind: z2.literal("track_target"),
    target: z2.discriminatedUnion("target_kind", [
      z2.object({
        target_kind: z2.literal("entity_type"),
        entity_type_id: resourceLocationSchema,
        selection: z2.literal("nearest")
      }).strict(),
      z2.object({
        target_kind: z2.literal("current_focus_entity")
      }).strict(),
      z2.object({
        target_kind: z2.literal("particle_type"),
        particle_type_id: resourceLocationSchema,
        selection: z2.literal("nearest"),
        continuity: z2.enum(["single_instance", "same_type_stream"]),
        handoff_radius: z2.number().finite().min(0).max(8),
        max_handoffs: z2.number().int().min(0).max(1e3)
      }).strict()
    ]),
    aim_point: z2.enum(["center", "render_center", "eyes", "feet"]),
    max_acquisition_distance: z2.number().finite().min(1).max(128),
    max_duration_ms: z2.number().int().min(1e3).max(5 * 6e4),
    max_turn_degrees_per_tick: z2.number().finite().min(0.1).max(180),
    max_angular_acceleration_degrees_per_tick_squared: z2.number().finite().min(0.01).max(180),
    prediction_ticks: z2.number().int().min(0).max(10),
    deadband_degrees: z2.number().finite().min(0).max(10),
    reacquire_ticks: z2.number().int().min(0).max(200),
    require_line_of_sight: z2.boolean(),
    stop_below_health: z2.number().finite().min(1).max(20)
  }).strict(),
  z2.object({
    action_kind: z2.literal("walk"),
    direction: z2.enum(["forward", "back", "left", "right"]),
    duration_ms: z2.number().int().min(50).max(1e4),
    sprint: z2.boolean(),
    jump: z2.boolean().optional()
  }).strict(),
  z2.object({
    action_kind: z2.literal("jump"),
    count: z2.number().int().min(1).max(10)
  }).strict(),
  z2.object({
    action_kind: z2.literal("interact"),
    target: z2.enum([
      "current_focus",
      "looked_at_block",
      "looked_at_entity"
    ]),
    hand: z2.enum(["main_hand", "off_hand"]),
    interaction: z2.enum(["use", "interact"])
  }).strict(),
  z2.object({
    action_kind: z2.literal("attack"),
    target_ref: subjectRefSchema.describe(
      "Opaque exact entity incarnation reference returned by a prior target-lock receipt."
    ),
    target_entity_type_id: resourceLocationSchema,
    target_classification: z2.literal("hostile"),
    max_acquisition_distance: z2.number().finite().min(1).max(16),
    require_line_of_sight: z2.literal(true),
    minimum_attack_cooldown: z2.number().finite().min(0.1).max(1),
    max_attack_pulses: z2.number().int().min(1).max(64),
    max_duration_ms: z2.number().int().min(1e3).max(6e4),
    stop_below_health: z2.number().finite().min(1).max(20),
    friendly_fire: z2.literal(false)
  }).strict(),
  z2.object({
    action_kind: z2.literal("combat_guard"),
    hostile_entity_type_ids: z2.array(resourceLocationSchema).min(1).max(16),
    combat_mode: z2.enum(["engage", "disengage_to_distance"]).optional().describe(
      "engage permits admitted hostile attacks; disengage_to_distance suppresses attacks and succeeds only after every visible eligible hostile is at least retreat_stop_distance away."
    ),
    max_acquisition_distance: z2.number().finite().min(2).max(32),
    require_line_of_sight: z2.literal(true),
    minimum_attack_cooldown: z2.number().finite().min(0.1).max(1),
    max_attack_pulses: z2.number().int().min(1).max(256),
    max_target_switches: z2.number().int().min(0).max(64),
    target_commit_ticks: z2.number().int().min(0).max(200),
    retreat_start_distance: z2.number().finite().min(1).max(6),
    retreat_stop_distance: z2.number().finite().min(1).max(8),
    retreat_when_hostile_count_at_least: z2.number().int().min(1).max(16),
    max_duration_ms: z2.number().int().min(1e3).max(12e4),
    stop_below_health: z2.number().finite().min(1).max(20),
    friendly_fire: z2.literal(false),
    approach_policy: z2.enum(["none", "direct_bounded", "local_reroute_bounded"]).optional(),
    max_approach_ticks: z2.number().int().min(0).max(1200).optional(),
    cover_policy: z2.enum(["none", "lateral_bounded"]).optional(),
    max_cover_ticks: z2.number().int().min(0).max(1200).optional(),
    projectile_response: z2.enum(["none", "sidestep", "shield_or_sidestep"]).optional(),
    projectile_evasion_horizon_ticks: z2.number().int().min(1).max(20).optional(),
    max_evasion_ticks: z2.number().int().min(0).max(1200).optional(),
    shield_hand: z2.enum(["none", "off_hand"]).optional(),
    max_shield_hold_ticks: z2.number().int().min(0).max(1200).optional()
  }).strict(),
  z2.object({
    action_kind: z2.literal("hotbar_select"),
    slot: z2.number().int().min(0).max(8)
  }).strict(),
  z2.object({
    action_kind: z2.literal("equip"),
    item_id: resourceLocationSchema,
    destination: z2.enum([
      "main_hand",
      "off_hand",
      "head",
      "chest",
      "legs",
      "feet"
    ])
  }).strict(),
  z2.object({
    action_kind: z2.literal("follow"),
    subject_ref: subjectRefSchema,
    distance: z2.number().finite().min(1).max(64),
    max_duration_ms: z2.number().int().min(1e3).max(30 * 6e4),
    stop_below_health: z2.number().finite().min(1).max(20)
  }).strict(),
  z2.object({
    action_kind: z2.literal("collect"),
    item_or_block_id: resourceLocationSchema,
    count: z2.number().int().min(1).max(2304),
    search_radius: z2.number().finite().positive().max(128)
  }).strict(),
  z2.object({
    action_kind: z2.literal("mine"),
    block_id: resourceLocationSchema,
    count: z2.number().int().min(1).max(4096),
    search_radius: z2.number().int().positive().max(32),
    target_position: helixMinecraftBlockPositionSchema.optional().describe(
      "Optional exact loaded block to mine. When supplied, count must be 1 and the block must still match block_id inside the admitted search radius."
    )
  }).strict(),
  z2.object({
    action_kind: z2.literal("place"),
    block_id: resourceLocationSchema,
    positions: z2.array(helixMinecraftBlockPositionSchema).min(1).max(256).optional().describe(
      "Exact admitted integer placement cells. Supply either positions or position_binding, never both."
    ),
    position_binding: z2.object({
      binding_kind: z2.literal("predicted_collision_cell"),
      horizon_ticks: z2.number().int().min(1).max(20),
      max_distance_blocks: z2.number().finite().positive().max(6),
      require_replaceable: z2.literal(true)
    }).strict().optional().describe(
      "A bounded Fabric-local data binding that resolves the predicted landing cell from current measured trajectory. It does not choose strategy or permit arbitrary coordinates."
    ),
    placement_method: z2.enum(["block_item", "item_use"]).optional(),
    source_item_id: resourceLocationSchema.optional(),
    hand: z2.enum(["main_hand", "off_hand"]).optional(),
    cleanup_after_landing: z2.literal(true).optional()
  }).strict(),
  z2.object({
    action_kind: z2.literal("craft"),
    output_item_id: resourceLocationSchema,
    count: z2.number().int().min(1).max(2304),
    recipe_id: resourceLocationSchema.nullable().optional()
  }).strict(),
  z2.object({
    action_kind: z2.literal("consume"),
    item_id: resourceLocationSchema,
    count: z2.number().int().min(1).max(64),
    hand: z2.literal("main_hand"),
    max_duration_ms: z2.number().int().min(1e3).max(6e4),
    stop_below_health: z2.number().finite().min(1).max(20),
    minimum_food_gain: z2.number().int().min(0).max(20),
    expected_remainder_item_id: resourceLocationSchema.nullable().optional()
  }).strict(),
  z2.object({
    action_kind: z2.literal("inventory_transfer"),
    direction: z2.enum(["deposit", "withdraw"]),
    item_id: resourceLocationSchema,
    count: z2.number().int().min(1).max(2304),
    container_target: z2.enum([
      "current_open_container",
      "looked_at_container"
    ])
  }).strict()
]).superRefine((value, context) => {
  if (value.action_kind === "combat_guard") {
    if (value.retreat_stop_distance <= value.retreat_start_distance) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["retreat_stop_distance"],
        message: "retreat_stop_distance must exceed retreat_start_distance"
      });
    }
    const approachPolicy = value.approach_policy ?? "none";
    const maxApproachTicks = value.max_approach_ticks ?? 0;
    if (approachPolicy !== "none" !== maxApproachTicks > 0) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["max_approach_ticks"],
        message: "an approach policy requires a positive max_approach_ticks budget"
      });
    }
    const coverPolicy = value.cover_policy ?? "none";
    const maxCoverTicks = value.max_cover_ticks ?? 0;
    if (coverPolicy === "lateral_bounded" !== maxCoverTicks > 0) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["max_cover_ticks"],
        message: "lateral_bounded requires a positive max_cover_ticks budget"
      });
    }
    const projectileResponse = value.projectile_response ?? "none";
    const maxEvasionTicks = value.max_evasion_ticks ?? 0;
    const shieldHand = value.shield_hand ?? "none";
    const maxShieldHoldTicks = value.max_shield_hold_ticks ?? 0;
    if (projectileResponse !== "none" && maxEvasionTicks === 0) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["max_evasion_ticks"],
        message: "projectile response requires a positive evasion budget"
      });
    }
    if (projectileResponse === "shield_or_sidestep" ? shieldHand !== "off_hand" || maxShieldHoldTicks === 0 : shieldHand !== "none" || maxShieldHoldTicks !== 0) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["shield_hand"],
        message: "shield authority requires shield_or_sidestep, off_hand, and a positive hold budget"
      });
    }
    return;
  }
  if (value.action_kind === "mine" && value.target_position && value.count !== 1) {
    context.addIssue({
      code: z2.ZodIssueCode.custom,
      path: ["count"],
      message: "Exact-target mining requires count to equal 1."
    });
    return;
  }
  if (value.action_kind === "place") {
    if (value.positions === void 0 === (value.position_binding === void 0)) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["positions"],
        message: "Placement requires exactly one target source: exact positions or one bounded position_binding."
      });
    }
    const method = value.placement_method ?? "block_item";
    if (method === "item_use") {
      if (!value.source_item_id) {
        context.addIssue({
          code: z2.ZodIssueCode.custom,
          path: ["source_item_id"],
          message: "item_use placement requires the exact source item"
        });
      }
      if (!value.hand) {
        context.addIssue({
          code: z2.ZodIssueCode.custom,
          path: ["hand"],
          message: "item_use placement requires the exact player hand"
        });
      }
      if (value.cleanup_after_landing === true && !(value.block_id === "minecraft:water" && value.source_item_id === "minecraft:water_bucket" && value.position_binding?.binding_kind === "predicted_collision_cell")) {
        context.addIssue({
          code: z2.ZodIssueCode.custom,
          path: ["cleanup_after_landing"],
          message: "Landing cleanup is limited to a predicted-collision water-bucket rescue."
        });
      }
    } else if (value.source_item_id || value.hand) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["placement_method"],
        message: "block_item placement derives its source item and main hand from block_id"
      });
    } else if (value.cleanup_after_landing) {
      context.addIssue({
        code: z2.ZodIssueCode.custom,
        path: ["cleanup_after_landing"],
        message: "Landing cleanup requires item_use placement."
      });
    }
    return;
  }
  if (value.action_kind !== "track_target" || value.target.target_kind !== "particle_type")
    return;
  const target = value.target;
  const valid = target.continuity === "single_instance" ? target.handoff_radius === 0 && target.max_handoffs === 0 : target.handoff_radius > 0 && target.max_handoffs > 0;
  if (!valid) {
    context.addIssue({
      code: z2.ZodIssueCode.custom,
      path: ["target", "continuity"],
      message: "single_instance requires zero handoff scope; same_type_stream requires a positive handoff radius and budget"
    });
  }
});
var minecraftPlayerCapabilityForActionKind = (actionKind) => {
  switch (actionKind) {
    case "navigate_to":
      return HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY;
    case "look_at":
      return HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY;
    case "track_target":
      return HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY;
    case "walk":
      return HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY;
    case "jump":
      return HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY;
    case "interact":
      return HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY;
    case "attack":
      return HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY;
    case "combat_guard":
      return HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY;
    case "hotbar_select":
      return HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY;
    case "equip":
      return HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY;
    case "follow":
      return HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY;
    case "collect":
      return HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY;
    case "mine":
      return HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY;
    case "place":
      return HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY;
    case "craft":
      return HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY;
    case "consume":
      return HELIX_MINECRAFT_PLAYER_CONSUME_CAPABILITY;
    case "inventory_transfer":
      return HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY;
  }
};

// shared/helix-minecraft-fluid-sequence.ts
var HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA = "helix.minecraft.player_sequence.v1";
var HELIX_MINECRAFT_FLUID_CONDITION_KINDS = [
  "tick_at_least",
  "player_grounded",
  "health_at_least",
  "air_at_least",
  "submerged_is",
  "swimming_is",
  "on_fire_is",
  "in_lava_is",
  "food_at_least",
  "position_within",
  "inventory_count_at_least",
  "block_matches",
  "focus_kind_is",
  "focus_reachable",
  "vertical_velocity_at_most",
  "predicted_collision_within",
  "placement_reachable_within",
  "dimension_is",
  "equipment_item_is",
  "portal_nearby",
  "hazard_clear",
  "recipe_craftable",
  "node_outcome_is",
  "checkpoint_satisfied"
];
var HELIX_MINECRAFT_FLUID_RULESETS = [
  "survival_tas",
  "command_assisted_sandbox",
  "copilot_speedrun"
];
var HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS = [
  "survival_tas"
];
var HELIX_MINECRAFT_FLUID_RULESET_DEFINITIONS = Object.freeze({
  survival_tas: {
    execution_plane: "player_embodiment",
    mutating: true,
    description: "Automated legal player inputs and typed client workflows. No server commands, host access, RCON, or arbitrary code."
  },
  command_assisted_sandbox: {
    execution_plane: "world_authority",
    mutating: true,
    description: "Separately authorized Minecraft server commands. This ruleset requires a World Authority capability and is not admitted by the Player Embodiment sequence tool."
  },
  copilot_speedrun: {
    execution_plane: "guidance_only",
    mutating: false,
    description: "Player-controlled guidance and checkpoint timing. It does not synthesize player input or server commands."
  }
});
var identifierSchema2 = z3.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9:._/-]+$/);
var resourceLocationSchema2 = z3.string().trim().min(1).max(320).regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
var tickSchema = z3.number().int().nonnegative().max(36e3);
var nextNodeSchema = identifierSchema2;
var helixMinecraftFluidRulesetSchema = z3.enum(
  HELIX_MINECRAFT_FLUID_RULESETS
);
var isMinecraftFluidRulesetExecutable = (ruleset) => HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS.includes(
  ruleset
);
var helixMinecraftFluidConditionSchema = z3.discriminatedUnion(
  "condition_kind",
  [
    z3.object({
      condition_kind: z3.literal("tick_at_least"),
      tick_index: tickSchema
    }).strict(),
    z3.object({
      condition_kind: z3.literal("player_grounded"),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("health_at_least"),
      health: z3.number().finite().min(0).max(20)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("air_at_least"),
      air: z3.number().int().min(0).max(300)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("submerged_is"),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("swimming_is"),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("on_fire_is"),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("in_lava_is"),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("food_at_least"),
      food: z3.number().int().min(0).max(20)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("position_within"),
      position: helixMinecraftPositionSchema,
      radius: z3.number().finite().positive().max(64)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("inventory_count_at_least"),
      item_id: resourceLocationSchema2,
      count: z3.number().int().nonnegative().max(2304)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("block_matches"),
      position: helixMinecraftBlockPositionSchema,
      block_id: resourceLocationSchema2
    }).strict(),
    z3.object({
      condition_kind: z3.literal("focus_kind_is"),
      focus_kind: z3.enum(["miss", "block", "entity"])
    }).strict(),
    z3.object({
      condition_kind: z3.literal("focus_reachable"),
      expected: z3.boolean(),
      max_distance: z3.number().finite().positive().max(6)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("vertical_velocity_at_most"),
      velocity_y: z3.number().finite().min(-16).max(16)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("predicted_collision_within"),
      max_ticks: z3.number().int().min(1).max(20),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("placement_reachable_within"),
      position: helixMinecraftBlockPositionSchema,
      horizon_ticks: z3.number().int().min(1).max(20),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("dimension_is"),
      dimension: resourceLocationSchema2
    }).strict(),
    z3.object({
      condition_kind: z3.literal("equipment_item_is"),
      destination: z3.enum([
        "main_hand",
        "off_hand",
        "head",
        "chest",
        "legs",
        "feet"
      ]),
      item_id: resourceLocationSchema2
    }).strict(),
    z3.object({
      condition_kind: z3.literal("portal_nearby"),
      portal_kind: z3.enum(["nether_portal", "end_portal", "end_gateway"]),
      radius: z3.number().int().positive().max(8),
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("hazard_clear"),
      hazard_kinds: z3.array(
        z3.enum([
          "lava",
          "fire",
          "magma",
          "cactus",
          "powder_snow",
          "hostile",
          "void_fall"
        ])
      ).min(1).max(7),
      radius: z3.number().int().positive().max(8)
    }).strict(),
    z3.object({
      condition_kind: z3.literal("recipe_craftable"),
      output_item_id: resourceLocationSchema2,
      expected: z3.boolean()
    }).strict(),
    z3.object({
      condition_kind: z3.literal("node_outcome_is"),
      node_id: identifierSchema2,
      outcome: z3.enum(["succeeded", "failed", "timed_out", "canceled"])
    }).strict(),
    z3.object({
      condition_kind: z3.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema2
    }).strict()
  ]
);
var helixMinecraftFluidConditionObservationSchema = z3.object({
  node_id: identifierSchema2,
  tick_index: tickSchema,
  condition_kind: z3.enum(HELIX_MINECRAFT_FLUID_CONDITION_KINDS),
  satisfied: z3.boolean(),
  subject_item_id: resourceLocationSchema2.optional(),
  subject_output_item_id: resourceLocationSchema2.optional(),
  subject_dimension: resourceLocationSchema2.optional(),
  subject_destination: z3.enum(["main_hand", "off_hand", "head", "chest", "legs", "feet"]).optional(),
  subject_portal_kind: z3.enum(["nether_portal", "end_portal", "end_gateway"]).optional(),
  subject_checkpoint_id: identifierSchema2.optional(),
  subject_node_id: identifierSchema2.optional()
}).strict();
var inputControlStateSchema = z3.object({
  forward: z3.union([z3.literal(-1), z3.literal(0), z3.literal(1)]),
  strafe: z3.union([z3.literal(-1), z3.literal(0), z3.literal(1)]),
  sprint: z3.boolean(),
  sneak: z3.literal(false),
  jump: z3.enum(["idle", "pulse", "hold"]),
  use: z3.enum(["idle", "pulse"]),
  hotbar_slot: z3.number().int().min(0).max(8).nullable().optional(),
  look_delta: z3.object({
    yaw_degrees: z3.number().finite().min(-360).max(360),
    pitch_degrees: z3.number().finite().min(-180).max(180),
    max_degrees_per_tick: z3.number().finite().positive().max(180)
  }).strict().nullable().optional()
}).strict();
var inputSegmentNodeSchema = z3.object({
  node_id: identifierSchema2,
  node_kind: z3.literal("input_segment"),
  earliest_tick: tickSchema,
  duration_ticks: z3.number().int().positive().max(1200),
  controls: inputControlStateSchema,
  on_complete: nextNodeSchema,
  on_failure: nextNodeSchema
}).strict();
var workflowActionNodeSchema = z3.object({
  node_id: identifierSchema2,
  node_kind: z3.literal("workflow_action"),
  earliest_tick: tickSchema,
  latest_start_tick: tickSchema.optional(),
  timeout_ticks: z3.number().int().positive().max(36e3),
  action: helixMinecraftPlayerActionArgumentsSchema,
  on_success: nextNodeSchema,
  on_failure: nextNodeSchema
}).strict();
var checkpointNodeSchema2 = z3.object({
  node_id: identifierSchema2,
  node_kind: z3.literal("checkpoint"),
  earliest_tick: tickSchema,
  checkpoint_id: identifierSchema2,
  condition: helixMinecraftFluidConditionSchema,
  wait_up_to_ticks: z3.number().int().nonnegative().max(36e3),
  on_satisfied: nextNodeSchema,
  on_timeout: nextNodeSchema
}).strict();
var branchNodeSchema2 = z3.object({
  node_id: identifierSchema2,
  node_kind: z3.literal("branch"),
  earliest_tick: tickSchema,
  condition: helixMinecraftFluidConditionSchema,
  on_true: nextNodeSchema,
  on_false: nextNodeSchema
}).strict();
var terminalNodeSchema2 = z3.object({
  node_id: identifierSchema2,
  node_kind: z3.literal("terminal"),
  terminal_outcome: z3.enum(["succeeded", "failed"]),
  reason_code: identifierSchema2
}).strict();
var helixMinecraftFluidSequenceNodeSchema = z3.discriminatedUnion(
  "node_kind",
  [
    inputSegmentNodeSchema,
    workflowActionNodeSchema,
    checkpointNodeSchema2,
    branchNodeSchema2,
    terminalNodeSchema2
  ]
);
var helixMinecraftMutationRegionSchema = z3.object({
  min: helixMinecraftBlockPositionSchema,
  max: helixMinecraftBlockPositionSchema
}).strict().superRefine((region, context) => {
  for (const axis of ["x", "y", "z"]) {
    if (region.min[axis] > region.max[axis]) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["max", axis],
        message: "Mutation-region maxima must not be below their minima."
      });
    }
  }
});
var helixMinecraftFluidMutationScopeSchema = z3.object({
  world_mutation_allowed: z3.boolean(),
  max_block_mutations: z3.number().int().nonnegative().max(1e5),
  max_inventory_transfers: z3.number().int().nonnegative().max(1e4),
  allowed_block_ids: z3.array(resourceLocationSchema2).max(64),
  allowed_regions: z3.array(helixMinecraftMutationRegionSchema).max(16),
  combat_allowed: z3.literal(false)
}).strict();
var helixMinecraftFluidSequenceArgumentsSchema = z3.object({
  action_kind: z3.literal("execute_sequence"),
  sequence_schema: z3.literal(HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA),
  sequence_id: identifierSchema2,
  ruleset: helixMinecraftFluidRulesetSchema,
  execution_plane: z3.literal("player_embodiment"),
  scheduler_engine: z3.literal("native_fabric"),
  optimization: z3.object({
    primary: z3.literal("minimize_world_ticks"),
    record_wall_clock: z3.literal(true),
    stop_on_first_verified_success: z3.literal(true)
  }).strict(),
  start_node_id: identifierSchema2,
  max_total_ticks: z3.number().int().positive().max(36e3),
  required_checkpoint_ids: z3.array(identifierSchema2).max(64),
  mutation_scope: helixMinecraftFluidMutationScopeSchema,
  nodes: z3.array(helixMinecraftFluidSequenceNodeSchema).min(2).max(256)
}).strict().superRefine((sequence, context) => {
  if (!isMinecraftFluidRulesetExecutable(sequence.ruleset)) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["ruleset"],
      message: "The Player Embodiment sequence tool currently admits survival_tas only; other rulesets require their separately governed plane."
    });
  }
  const nodes = /* @__PURE__ */ new Map();
  for (const [index, node] of sequence.nodes.entries()) {
    if (nodes.has(node.node_id)) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["nodes", index, "node_id"],
        message: "Sequence node identifiers must be unique."
      });
    }
    nodes.set(node.node_id, node);
  }
  if (!nodes.has(sequence.start_node_id)) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["start_node_id"],
      message: "The sequence start node must exist."
    });
  }
  const transitions2 = (node) => {
    switch (node.node_kind) {
      case "input_segment":
        return [node.on_complete, node.on_failure];
      case "workflow_action":
        return [node.on_success, node.on_failure];
      case "checkpoint":
        return [node.on_satisfied, node.on_timeout];
      case "branch":
        return [node.on_true, node.on_false];
      case "terminal":
        return [];
    }
  };
  for (const [index, node] of sequence.nodes.entries()) {
    for (const target of transitions2(node)) {
      if (!nodes.has(target)) {
        context.addIssue({
          code: z3.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Transition target ${target} does not exist.`
        });
      }
    }
  }
  const reachable = /* @__PURE__ */ new Set();
  const active = /* @__PURE__ */ new Set();
  let cycleReported = false;
  const visit = (nodeId) => {
    if (active.has(nodeId)) {
      if (!cycleReported) {
        cycleReported = true;
        context.addIssue({
          code: z3.ZodIssueCode.custom,
          path: ["nodes"],
          message: "Fluid sequences must be acyclic; repetition belongs inside a bounded typed workflow node."
        });
      }
      return;
    }
    if (reachable.has(nodeId)) return;
    const node = nodes.get(nodeId);
    if (!node) return;
    reachable.add(nodeId);
    active.add(nodeId);
    for (const target of transitions2(node)) visit(target);
    active.delete(nodeId);
  };
  visit(sequence.start_node_id);
  for (const [index, node] of sequence.nodes.entries()) {
    if (!reachable.has(node.node_id)) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["nodes", index, "node_id"],
        message: "Every sequence node must be reachable from the start node."
      });
    }
  }
  if (!sequence.nodes.some(
    (node) => node.node_kind === "terminal" && node.terminal_outcome === "succeeded"
  )) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["nodes"],
      message: "A fluid sequence requires a reachable success terminal."
    });
  }
  const checkpointIds = /* @__PURE__ */ new Set();
  for (const [index, node] of sequence.nodes.entries()) {
    if (node.node_kind !== "checkpoint") continue;
    if (checkpointIds.has(node.checkpoint_id)) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["nodes", index, "checkpoint_id"],
        message: "Checkpoint identifiers must be unique."
      });
    }
    checkpointIds.add(node.checkpoint_id);
  }
  const required = /* @__PURE__ */ new Set();
  for (const [
    index,
    checkpointId
  ] of sequence.required_checkpoint_ids.entries()) {
    if (required.has(checkpointId)) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["required_checkpoint_ids", index],
        message: "Required checkpoint identifiers must be unique."
      });
    }
    required.add(checkpointId);
    if (!checkpointIds.has(checkpointId)) {
      context.addIssue({
        code: z3.ZodIssueCode.custom,
        path: ["required_checkpoint_ids", index],
        message: "Every required checkpoint must name a checkpoint node."
      });
    }
  }
  let declaredBlockMutations = 0;
  let declaredInventoryTransfers = 0;
  const allowedBlocks = new Set(sequence.mutation_scope.allowed_block_ids);
  for (const [index, node] of sequence.nodes.entries()) {
    if (node.node_kind !== "workflow_action") continue;
    const action = node.action;
    if (action.action_kind === "mine") {
      declaredBlockMutations += action.count;
      declaredInventoryTransfers += action.count;
      if (!allowedBlocks.has(action.block_id)) {
        context.addIssue({
          code: z3.ZodIssueCode.custom,
          path: ["nodes", index, "action", "block_id"],
          message: "Mined blocks must be named by the admitted mutation scope."
        });
      }
    } else if (action.action_kind === "place") {
      const placementCount = action.positions?.length ?? 1;
      declaredBlockMutations += placementCount;
      declaredInventoryTransfers += placementCount;
      if (!allowedBlocks.has(action.block_id)) {
        context.addIssue({
          code: z3.ZodIssueCode.custom,
          path: ["nodes", index, "action", "block_id"],
          message: "Placed blocks must be named by the admitted mutation scope."
        });
      }
      if (sequence.mutation_scope.allowed_regions.length > 0 && action.positions) {
        for (const [positionIndex, position] of action.positions.entries()) {
          const admitted = sequence.mutation_scope.allowed_regions.some(
            (region) => position.x >= region.min.x && position.x <= region.max.x && position.y >= region.min.y && position.y <= region.max.y && position.z >= region.min.z && position.z <= region.max.z
          );
          if (!admitted) {
            context.addIssue({
              code: z3.ZodIssueCode.custom,
              path: ["nodes", index, "action", "positions", positionIndex],
              message: "Every exact placement position must lie inside an admitted mutation region."
            });
          }
        }
      }
    } else if (action.action_kind === "collect" || action.action_kind === "craft" || action.action_kind === "consume" || action.action_kind === "inventory_transfer") {
      declaredInventoryTransfers += action.count;
    } else if (action.action_kind === "equip") {
      declaredInventoryTransfers += 1;
    }
  }
  if (declaredBlockMutations > 0 && (!sequence.mutation_scope.world_mutation_allowed || sequence.mutation_scope.max_block_mutations < declaredBlockMutations)) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["mutation_scope", "max_block_mutations"],
      message: "The mutation scope must explicitly cover every declared mine/place effect."
    });
  }
  if (!sequence.mutation_scope.world_mutation_allowed && (sequence.mutation_scope.max_block_mutations !== 0 || sequence.mutation_scope.allowed_block_ids.length !== 0 || sequence.mutation_scope.allowed_regions.length !== 0)) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["mutation_scope"],
      message: "When world_mutation_allowed is false, max_block_mutations must be 0 and allowed_block_ids and allowed_regions must be empty. max_inventory_transfers is independent and must still cover declared collect, equip, craft, and inventory-transfer effects."
    });
  }
  if (declaredInventoryTransfers > sequence.mutation_scope.max_inventory_transfers) {
    context.addIssue({
      code: z3.ZodIssueCode.custom,
      path: ["mutation_scope", "max_inventory_transfers"],
      message: "The inventory-transfer ceiling must cover every declared typed workflow effect."
    });
  }
});

// shared/helix-minecraft-reactive-program.ts
import { z as z4 } from "zod";
var HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA = "helix.minecraft.reactive_program.v1";
var HELIX_MINECRAFT_REACTIVE_LANE_KINDS = [
  "camera",
  "locomotion",
  "inventory",
  "hand",
  "world",
  "safety"
];
var HELIX_MINECRAFT_REACTIVE_RESOURCES = [
  "camera",
  "locomotion",
  "hotbar",
  "main_hand",
  "off_hand",
  "inventory",
  "world",
  "native_workflow",
  "safety"
];
var HELIX_MINECRAFT_RESIDENT_GUARDIAN_COVERAGE = [
  "unsafe_landing_recovery",
  "fire_recovery"
];
var identifierSchema3 = z4.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9:._/-]+$/);
var tickSchema2 = z4.number().int().nonnegative().max(36e3);
var resourceSchema = z4.enum(HELIX_MINECRAFT_REACTIVE_RESOURCES);
var embeddedActionSchema = helixMinecraftPlayerActionArgumentsSchema;
var helixMinecraftReactiveMutationScopeSchema = helixMinecraftFluidMutationScopeSchema.extend({
  combat_allowed: z4.boolean()
});
var minecraftReactiveResourcesForAction = (action) => {
  switch (action.action_kind) {
    case "navigate_to":
      return ["camera", "locomotion"];
    case "look_at":
    case "track_target":
      return ["camera"];
    case "walk":
    case "jump":
      return ["locomotion"];
    case "interact":
      return [action.hand];
    case "attack":
      return ["camera", "main_hand"];
    case "combat_guard":
      return [
        "camera",
        "locomotion",
        "main_hand",
        "off_hand",
        "native_workflow"
      ];
    case "hotbar_select":
      return ["hotbar"];
    case "equip":
      return ["hotbar", "main_hand", "off_hand", "inventory"];
    case "follow":
      return ["camera", "locomotion", "native_workflow"];
    case "collect":
      return ["camera", "locomotion", "inventory", "native_workflow"];
    case "mine":
      return ["camera", "locomotion", "main_hand", "world", "native_workflow"];
    case "place":
      return action.placement_method === "item_use" && action.hand === "off_hand" ? [
        "camera",
        "locomotion",
        "off_hand",
        "inventory",
        "world",
        "native_workflow"
      ] : [
        "camera",
        "locomotion",
        "hotbar",
        "main_hand",
        "inventory",
        "world",
        "native_workflow"
      ];
    case "craft":
      return ["inventory", "native_workflow"];
    case "consume":
      return ["hotbar", "main_hand", "inventory", "native_workflow"];
    case "inventory_transfer":
      return ["inventory", "native_workflow"];
  }
};
var actionNodeSchema2 = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("action"),
  earliest_tick: tickSchema2,
  latest_start_tick: tickSchema2.optional(),
  timeout_ticks: z4.number().int().positive().max(36e3),
  action: embeddedActionSchema,
  on_success: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var repeatNodeSchema = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("repeat"),
  earliest_tick: tickSchema2,
  action: embeddedActionSchema,
  max_iterations: z4.number().int().positive().max(256),
  timeout_ticks: z4.number().int().positive().max(36e3),
  until_condition: z4.discriminatedUnion("condition_kind", [
    z4.object({
      condition_kind: z4.literal("tick_at_least"),
      tick_index: tickSchema2
    }).strict(),
    z4.object({
      condition_kind: z4.literal("player_grounded"),
      expected: z4.boolean()
    }).strict(),
    z4.object({
      condition_kind: z4.literal("health_at_least"),
      health: z4.number().finite().min(0).max(20)
    }).strict(),
    z4.object({
      condition_kind: z4.literal("food_at_least"),
      food: z4.number().int().min(0).max(20)
    }).strict(),
    z4.object({
      condition_kind: z4.literal("inventory_count_at_least"),
      item_id: z4.string().regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/),
      count: z4.number().int().nonnegative().max(2304)
    }).strict(),
    z4.object({
      condition_kind: z4.literal("checkpoint_satisfied"),
      checkpoint_id: identifierSchema3
    }).strict()
  ]).optional(),
  on_complete: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var maintainNodeSchema = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("maintain"),
  earliest_tick: tickSchema2,
  action: embeddedActionSchema,
  while_condition: z4.discriminatedUnion("condition_kind", [
    z4.object({
      condition_kind: z4.literal("player_grounded"),
      expected: z4.boolean()
    }).strict(),
    z4.object({
      condition_kind: z4.literal("health_at_least"),
      health: z4.number().finite().min(0).max(20)
    }).strict(),
    z4.object({
      condition_kind: z4.literal("food_at_least"),
      food: z4.number().int().min(0).max(20)
    }).strict(),
    z4.object({
      condition_kind: z4.literal("hazard_clear"),
      hazard_kinds: z4.array(
        z4.enum([
          "lava",
          "fire",
          "magma",
          "cactus",
          "powder_snow",
          "hostile",
          "void_fall"
        ])
      ).min(1).max(7),
      radius: z4.number().int().positive().max(8)
    }).strict()
  ]),
  max_restarts: z4.number().int().nonnegative().max(256),
  max_duration_ticks: z4.number().int().positive().max(36e3),
  on_condition_false: identifierSchema3,
  on_failure: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var eventNodeSchema = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("event"),
  earliest_tick: tickSchema2,
  condition: helixMinecraftFluidConditionSchema,
  trigger_when: z4.enum(["satisfied", "not_satisfied"]),
  debounce_ticks: z4.number().int().positive().max(200),
  wait_up_to_ticks: z4.number().int().nonnegative().max(36e3),
  on_event: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var checkpointNodeSchema3 = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("checkpoint"),
  earliest_tick: tickSchema2,
  checkpoint_id: identifierSchema3,
  condition: helixMinecraftFluidConditionSchema,
  wait_up_to_ticks: z4.number().int().nonnegative().max(36e3),
  on_satisfied: identifierSchema3,
  on_timeout: identifierSchema3
}).strict();
var branchNodeSchema3 = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("branch"),
  earliest_tick: tickSchema2,
  condition: helixMinecraftFluidConditionSchema,
  on_true: identifierSchema3,
  on_false: identifierSchema3
}).strict();
var terminalNodeSchema3 = z4.object({
  node_id: identifierSchema3,
  node_kind: z4.literal("terminal"),
  terminal_outcome: z4.enum(["succeeded", "failed", "canceled"]),
  reason_code: identifierSchema3
}).strict();
var helixMinecraftReactiveNodeSchema = z4.discriminatedUnion(
  "node_kind",
  [
    actionNodeSchema2,
    repeatNodeSchema,
    maintainNodeSchema,
    eventNodeSchema,
    checkpointNodeSchema3,
    branchNodeSchema3,
    terminalNodeSchema3
  ]
);
var laneSchema2 = z4.object({
  lane_id: identifierSchema3,
  lane_kind: z4.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
  priority: z4.number().int().min(0).max(255),
  required: z4.boolean().describe(
    "Must be true for required immediate work and false for every interrupt-only lane."
  ),
  activation: z4.enum(["immediate", "interrupt_only"]).describe(
    "Immediate lanes start with the program. Interrupt-only lanes stay dormant until activated and must set required false."
  ),
  resource_ceiling: z4.array(resourceSchema).max(9),
  start_node_id: identifierSchema3,
  nodes: z4.array(helixMinecraftReactiveNodeSchema).min(1).max(128)
}).strict();
var interruptSchema = z4.object({
  interrupt_id: identifierSchema3,
  priority: z4.number().int().min(0).max(255),
  condition: helixMinecraftFluidConditionSchema,
  trigger_when: z4.enum(["satisfied", "not_satisfied"]),
  debounce_ticks: z4.number().int().positive().max(200),
  activate_lane_id: identifierSchema3.describe(
    "Exact ID of a lane declared with activation interrupt_only and required false."
  ),
  cancel_lane_ids: z4.array(identifierSchema3).max(8),
  max_activations: z4.literal(1)
}).strict();
var raceSchema = z4.object({
  race_id: identifierSchema3,
  lane_ids: z4.array(identifierSchema3).min(2).max(8),
  settle_on: z4.enum(["first_succeeded", "first_terminal"]),
  cancel_remaining: z4.literal(true)
}).strict();
var transitions = (node) => {
  switch (node.node_kind) {
    case "action":
      return [node.on_success, node.on_failure, node.on_timeout];
    case "repeat":
      return [node.on_complete, node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_condition_false, node.on_failure, node.on_timeout];
    case "event":
      return [node.on_event, node.on_timeout];
    case "checkpoint":
      return [node.on_satisfied, node.on_timeout];
    case "branch":
      return [node.on_true, node.on_false];
    case "terminal":
      return [];
  }
};
var negativeOutcomeTransitions = (node) => {
  switch (node.node_kind) {
    case "action":
    case "repeat":
      return [node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_failure, node.on_timeout];
    case "event":
    case "checkpoint":
      return [node.on_timeout];
    case "branch":
    case "terminal":
      return [];
  }
};
var nodeActions = (node) => node.node_kind === "action" || node.node_kind === "repeat" || node.node_kind === "maintain" ? [node.action] : [];
var helixMinecraftReactiveProgramArgumentsSchema = z4.object({
  action_kind: z4.literal("execute_reactive_program"),
  program_schema: z4.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
  program_id: identifierSchema3,
  ruleset: helixMinecraftFluidRulesetSchema,
  execution_plane: z4.literal("player_embodiment"),
  scheduler_engine: z4.literal("native_fabric_concurrent"),
  resident_guardian_coverage: z4.array(z4.enum(HELIX_MINECRAFT_RESIDENT_GUARDIAN_COVERAGE)).max(2).refine((values) => new Set(values).size === values.length, {
    message: "Resident guardian coverage entries must be unique."
  }).optional(),
  max_total_ticks: z4.number().int().positive().max(36e3),
  completion_policy: z4.object({
    mode: z4.enum(["all_required", "first_success"]),
    cancel_remaining_on_settle: z4.literal(true)
  }).strict(),
  mutation_scope: helixMinecraftReactiveMutationScopeSchema,
  lanes: z4.array(laneSchema2).min(1).max(8),
  races: z4.array(raceSchema).max(8),
  interrupts: z4.array(interruptSchema).max(16)
}).strict().superRefine((program, context) => {
  if (!isMinecraftFluidRulesetExecutable(program.ruleset)) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["ruleset"],
      message: "The Player Embodiment reactive program currently admits survival_tas only."
    });
  }
  const lanes = new Map(program.lanes.map((lane) => [lane.lane_id, lane]));
  if (lanes.size !== program.lanes.length) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Reactive lane identifiers must be unique."
    });
  }
  if (!program.lanes.some((lane) => lane.activation === "immediate")) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["lanes"],
      message: "A reactive program requires at least one immediate lane."
    });
  }
  const residentCoverage = new Set(
    program.resident_guardian_coverage ?? []
  );
  const requiredImmediateLanes = program.lanes.filter(
    (lane) => lane.required && lane.activation === "immediate"
  );
  const hasHealthFloorInterrupt = program.interrupts.some(
    (interrupt) => interrupt.condition.condition_kind === "health_at_least" && interrupt.trigger_when === "not_satisfied" && interrupt.cancel_lane_ids.length > 0
  );
  if (residentCoverage.size > 0 && !hasHealthFloorInterrupt) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["interrupts"],
      message: "Resident guardian coverage requires an independent health-floor interrupt."
    });
  }
  if (residentCoverage.has("unsafe_landing_recovery")) {
    const validFallLane = requiredImmediateLanes.some((lane) => {
      const conditions = lane.nodes.flatMap(
        (node) => node.node_kind === "event" || node.node_kind === "checkpoint" || node.node_kind === "branch" ? [node.condition] : []
      );
      const actions = lane.nodes.flatMap(nodeActions);
      return conditions.some(
        (condition2) => condition2.condition_kind === "vertical_velocity_at_most"
      ) && conditions.some(
        (condition2) => condition2.condition_kind === "predicted_collision_within"
      ) && actions.some(
        (action) => action.action_kind === "place" && action.block_id === "minecraft:water" && action.placement_method === "item_use" && action.source_item_id === "minecraft:water_bucket" && action.position_binding?.binding_kind === "predicted_collision_cell" && action.position_binding.require_replaceable === true && action.cleanup_after_landing === true
      );
    });
    const boundedMutation = program.mutation_scope.world_mutation_allowed && program.mutation_scope.max_block_mutations >= 2 && program.mutation_scope.max_inventory_transfers >= 2 && program.mutation_scope.allowed_block_ids.includes("minecraft:water");
    if (!validFallLane || !boundedMutation) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["resident_guardian_coverage"],
        message: "Unsafe-landing coverage requires a required immediate predicted-collision water-bucket rescue with cleanup and a two-mutation water scope."
      });
    }
  }
  if (residentCoverage.has("fire_recovery")) {
    const validFireLane = requiredImmediateLanes.some((lane) => {
      const conditions = lane.nodes.flatMap(
        (node) => node.node_kind === "event" || node.node_kind === "checkpoint" || node.node_kind === "branch" ? [node.condition] : []
      );
      const actions = lane.nodes.flatMap(nodeActions);
      const observesMatchedHazardTransition = ["on_fire_is", "in_lava_is"].some(
        (conditionKind) => conditions.some(
          (condition2) => (condition2.condition_kind === "on_fire_is" || condition2.condition_kind === "in_lava_is") && condition2.condition_kind === conditionKind && condition2.expected
        ) && conditions.some(
          (condition2) => (condition2.condition_kind === "on_fire_is" || condition2.condition_kind === "in_lava_is") && condition2.condition_kind === conditionKind && !condition2.expected
        )
      );
      return observesMatchedHazardTransition && actions.some(
        (action) => action.action_kind === "walk" || action.action_kind === "navigate_to"
      );
    });
    if (!validFireLane) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["resident_guardian_coverage"],
        message: "Fire/lava coverage requires a required immediate lane that measures a matched hazard onset and clearance, performs bounded locomotion, and verifies stabilization."
      });
    }
  }
  const observationIds = [
    ...program.lanes.flatMap(
      (lane) => lane.nodes.map((node) => node.node_id)
    ),
    ...program.interrupts.map((interrupt) => interrupt.interrupt_id)
  ];
  if (new Set(observationIds).size !== observationIds.length) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Reactive node and interrupt identifiers must be globally unique so condition evidence has one exact origin."
    });
  }
  let declaredBlockMutations = 0;
  let declaredInventoryTransfers = 0;
  const allowedBlocks = new Set(program.mutation_scope.allowed_block_ids);
  for (const [laneIndex, lane] of program.lanes.entries()) {
    const ceiling = new Set(lane.resource_ceiling);
    if (ceiling.size !== lane.resource_ceiling.length) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "resource_ceiling"],
        message: "A lane resource ceiling cannot contain duplicates."
      });
    }
    if (lane.lane_kind === "safety" && !ceiling.has("safety")) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "resource_ceiling"],
        message: "A safety lane must declare the safety resource."
      });
    }
    const nodes = new Map(lane.nodes.map((node) => [node.node_id, node]));
    if (nodes.size !== lane.nodes.length) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "nodes"],
        message: "Node identifiers must be unique inside each lane."
      });
    }
    if (!nodes.has(lane.start_node_id)) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "start_node_id"],
        message: "The lane start node must exist in that lane."
      });
    }
    if (lane.required && lane.activation !== "immediate") {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "required"],
        message: "A required lane must activate immediately."
      });
    }
    for (const [nodeIndex, node] of lane.nodes.entries()) {
      for (const target of transitions(node)) {
        if (!nodes.has(target)) {
          context.addIssue({
            code: z4.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex],
            message: `Lane transition target ${target} does not exist.`
          });
        }
      }
      for (const target of negativeOutcomeTransitions(node)) {
        const terminal = nodes.get(target);
        if (terminal?.node_kind === "terminal" && terminal.terminal_outcome === "succeeded") {
          context.addIssue({
            code: z4.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex],
            message: `Reactive ${node.node_kind} failure or timeout cannot transition directly to succeeded terminal ${target}; route it to a failed/canceled terminal or through explicit recovery work.`
          });
        }
      }
      for (const action of nodeActions(node)) {
        if ((action.action_kind === "attack" || action.action_kind === "combat_guard") && !program.mutation_scope.combat_allowed) {
          context.addIssue({
            code: z4.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
            message: "Reactive combat actions require mutation_scope.combat_allowed=true."
          });
        }
        if (action.action_kind === "follow" || action.action_kind === "look_at" && action.target.target_kind === "environment_subject") {
          context.addIssue({
            code: z4.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
            message: "Reactive subject-bound actions require nested room-identity resolution and are not yet admitted; use entity/particle tracking or a separate resolved follow action."
          });
        }
        for (const resource of minecraftReactiveResourcesForAction(action)) {
          if (!ceiling.has(resource)) {
            context.addIssue({
              code: z4.ZodIssueCode.custom,
              path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
              message: `Action ${action.action_kind} requires undeclared lane resource ${resource}.`
            });
          }
        }
        const multiplier = node.node_kind === "repeat" ? node.max_iterations : node.node_kind === "maintain" ? node.max_restarts + 1 : 1;
        if (action.action_kind === "mine") {
          declaredBlockMutations += action.count * multiplier;
          declaredInventoryTransfers += action.count * multiplier;
          if (!allowedBlocks.has(action.block_id)) {
            context.addIssue({
              code: z4.ZodIssueCode.custom,
              path: [
                "lanes",
                laneIndex,
                "nodes",
                nodeIndex,
                "action",
                "block_id"
              ],
              message: "Mined blocks must be named by the admitted mutation scope."
            });
          }
        } else if (action.action_kind === "place") {
          const placementCount = action.positions?.length ?? 1;
          const mutationFactor = action.cleanup_after_landing === true ? 2 : 1;
          declaredBlockMutations += placementCount * multiplier * mutationFactor;
          declaredInventoryTransfers += placementCount * multiplier * mutationFactor;
          if (!allowedBlocks.has(action.block_id)) {
            context.addIssue({
              code: z4.ZodIssueCode.custom,
              path: [
                "lanes",
                laneIndex,
                "nodes",
                nodeIndex,
                "action",
                "block_id"
              ],
              message: "Placed blocks must be named by the admitted mutation scope."
            });
          }
          if (program.mutation_scope.allowed_regions.length > 0 && action.positions) {
            for (const [
              positionIndex,
              position
            ] of action.positions.entries()) {
              const admitted = program.mutation_scope.allowed_regions.some(
                (region) => position.x >= region.min.x && position.x <= region.max.x && position.y >= region.min.y && position.y <= region.max.y && position.z >= region.min.z && position.z <= region.max.z
              );
              if (!admitted) {
                context.addIssue({
                  code: z4.ZodIssueCode.custom,
                  path: [
                    "lanes",
                    laneIndex,
                    "nodes",
                    nodeIndex,
                    "action",
                    "positions",
                    positionIndex
                  ],
                  message: "Every exact placement position must lie inside an admitted mutation region."
                });
              }
            }
          }
        } else if (action.action_kind === "collect" || action.action_kind === "craft" || action.action_kind === "consume" || action.action_kind === "inventory_transfer") {
          declaredInventoryTransfers += action.count * multiplier;
        } else if (action.action_kind === "equip") {
          declaredInventoryTransfers += multiplier;
        }
      }
    }
    if (!lane.nodes.some((node) => node.node_kind === "terminal")) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["lanes", laneIndex, "nodes"],
        message: "Every reactive lane requires a terminal node."
      });
    }
    const reachable = /* @__PURE__ */ new Set();
    const active = /* @__PURE__ */ new Set();
    let cycleReported = false;
    const visit = (nodeId) => {
      if (active.has(nodeId)) {
        if (!cycleReported) {
          cycleReported = true;
          context.addIssue({
            code: z4.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes"],
            message: "Reactive lane graphs must be acyclic; bounded repetition belongs inside repeat or maintain nodes."
          });
        }
        return;
      }
      if (reachable.has(nodeId)) return;
      const node = nodes.get(nodeId);
      if (!node) return;
      reachable.add(nodeId);
      active.add(nodeId);
      for (const target of transitions(node)) visit(target);
      active.delete(nodeId);
    };
    visit(lane.start_node_id);
    for (const [nodeIndex, node] of lane.nodes.entries()) {
      if (!reachable.has(node.node_id)) {
        context.addIssue({
          code: z4.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "nodes", nodeIndex, "node_id"],
          message: "Every lane node must be reachable from its lane start node."
        });
      }
    }
  }
  for (const [raceIndex, race] of program.races.entries()) {
    const members = new Set(race.lane_ids);
    if (members.size !== race.lane_ids.length) {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["races", raceIndex, "lane_ids"],
        message: "Race lane identifiers must be unique."
      });
    }
    for (const laneId of members) {
      if (!lanes.has(laneId)) {
        context.addIssue({
          code: z4.ZodIssueCode.custom,
          path: ["races", raceIndex, "lane_ids"],
          message: `Race lane ${laneId} does not exist.`
        });
      }
    }
  }
  for (const [interruptIndex, interrupt] of program.interrupts.entries()) {
    const activated = lanes.get(interrupt.activate_lane_id);
    if (!activated || activated.activation !== "interrupt_only") {
      context.addIssue({
        code: z4.ZodIssueCode.custom,
        path: ["interrupts", interruptIndex, "activate_lane_id"],
        message: "An interrupt must activate an interrupt-only lane."
      });
    }
    for (const laneId of interrupt.cancel_lane_ids) {
      if (!lanes.has(laneId)) {
        context.addIssue({
          code: z4.ZodIssueCode.custom,
          path: ["interrupts", interruptIndex, "cancel_lane_ids"],
          message: `Interrupted lane ${laneId} does not exist.`
        });
      }
    }
  }
  if (declaredBlockMutations > program.mutation_scope.max_block_mutations) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["mutation_scope", "max_block_mutations"],
      message: `The mutation ceiling must cover all bounded lane iterations: required at least ${declaredBlockMutations}, received ${program.mutation_scope.max_block_mutations}.`
    });
  }
  if (declaredInventoryTransfers > program.mutation_scope.max_inventory_transfers) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["mutation_scope", "max_inventory_transfers"],
      message: `The inventory-transfer ceiling must cover all bounded lane iterations: required at least ${declaredInventoryTransfers}, received ${program.mutation_scope.max_inventory_transfers}.`
    });
  }
  if (declaredBlockMutations > 0 && !program.mutation_scope.world_mutation_allowed) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["mutation_scope", "world_mutation_allowed"],
      message: "World-changing lanes require explicit mutation authority."
    });
  }
  if (!program.mutation_scope.world_mutation_allowed && (program.mutation_scope.max_block_mutations !== 0 || program.mutation_scope.allowed_block_ids.length !== 0 || program.mutation_scope.allowed_regions.length !== 0)) {
    context.addIssue({
      code: z4.ZodIssueCode.custom,
      path: ["mutation_scope"],
      message: "A non-world-mutating reactive program must carry an empty world mutation scope."
    });
  }
});
var helixMinecraftReactiveLaneObservationSchema = z4.object({
  lane_id: identifierSchema3,
  lane_kind: z4.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
  state: z4.enum([
    "dormant",
    "waiting_for_resources",
    "running",
    "succeeded",
    "failed",
    "canceled",
    "timed_out"
  ]),
  node_id: identifierSchema3.nullable(),
  held_resources: z4.array(resourceSchema).max(9),
  iteration: z4.number().int().nonnegative().max(256),
  tick_index: tickSchema2,
  controls_released: z4.boolean()
}).strict();
var helixMinecraftReactiveProgramObservationSchema = z4.object({
  program_schema: z4.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
  program_id: identifierSchema3,
  tick_index: tickSchema2,
  active_lane_count: z4.number().int().nonnegative().max(8),
  lanes: z4.array(helixMinecraftReactiveLaneObservationSchema).min(1).max(8),
  condition_observations: z4.array(helixMinecraftFluidConditionObservationSchema).max(512),
  resource_conflict_count: z4.number().int().nonnegative(),
  interrupt_count: z4.number().int().nonnegative().max(16),
  controls_released: z4.boolean()
}).strict();

// server/services/environment-connectors/temporal-plans/minecraft-environment-time-compiler.ts
var MinecraftEnvironmentTimeCompileError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MinecraftEnvironmentTimeCompileError";
  }
};
var wrapCompilation = (plan, targetSchema, argumentsValue) => {
  const base = {
    schema: "environment.minecraft_temporal_plan_compilation.v1",
    source_plan_id: plan.plan_id,
    source_plan_hash: plan.plan_hash,
    source_goal_id: plan.identity.goal_id,
    source_goal_revision: plan.identity.goal_revision,
    target_schema: targetSchema,
    arguments: argumentsValue,
    // Generated action postconditions are intentionally absent. Only explicit
    // source checkpoints can anchor a source-plan extension. Both current
    // compilers preserve these node/checkpoint IDs; the map is hash-bound.
    source_checkpoint_bindings: plan.nodes.flatMap((node) => node.kind === "checkpoint" ? [{
      source_node_id: node.node_id,
      source_checkpoint_id: node.checkpoint_id,
      native_node_id: node.node_id,
      native_checkpoint_id: node.checkpoint_id
    }] : []),
    execution_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false
  };
  return { ...base, compilation_hash: helixEnvironmentTimeSha256(base) };
};
var condition = (source) => {
  if (source.kind === "adapter_condition") {
    const conditionId = source.condition_id.startsWith("minecraft.") ? source.condition_id.slice("minecraft.".length) : source.condition_id;
    const parsed = helixMinecraftFluidConditionSchema.safeParse({
      condition_kind: conditionId,
      ...source.arguments
    });
    if (parsed.success) return parsed.data;
  }
  if (source.kind === "prior_node_outcome") {
    const outcome = source.outcome === "interrupted" || source.outcome === "not_started" ? null : source.outcome;
    if (outcome) {
      return helixMinecraftFluidConditionSchema.parse({
        condition_kind: "node_outcome_is",
        node_id: source.node_id,
        outcome
      });
    }
  }
  if (source.kind === "checkpoint_satisfied") {
    return helixMinecraftFluidConditionSchema.parse({
      condition_kind: "checkpoint_satisfied",
      checkpoint_id: source.checkpoint_id
    });
  }
  throw new MinecraftEnvironmentTimeCompileError(
    "unsupported_condition",
    `Minecraft cannot exactly compile shared condition ${source.kind}.`
  );
};
var validateBase = (planInput) => {
  const plan = helixEnvironmentTemporalPlanSchema.parse(planInput);
  if (plan.adapter_id !== "minecraft.fabric_client") {
    throw new MinecraftEnvironmentTimeCompileError(
      "adapter_mismatch",
      `Expected minecraft.fabric_client, received ${plan.adapter_id}.`
    );
  }
  if (plan.clocks.environment.kind !== "tick" || plan.clocks.environment.resolution_unit !== "minecraft_tick") {
    throw new MinecraftEnvironmentTimeCompileError(
      "clock_mismatch",
      "Minecraft plans require the tick/minecraft_tick clock domain."
    );
  }
  for (const node of plan.nodes) {
    if (node.kind !== "action") continue;
    if (node.abort_guards.length > 0) {
      throw new MinecraftEnvironmentTimeCompileError(
        "unsupported_semantics",
        `Action ${node.node_id} has abort guards that require a separately admitted resident interrupt lane.`
      );
    }
    const action = helixMinecraftPlayerActionArgumentsSchema.parse(node.arguments);
    if (minecraftPlayerCapabilityForActionKind(action.action_kind) !== node.capability_id || node.capability_version !== "1") {
      throw new MinecraftEnvironmentTimeCompileError(
        "capability_mismatch",
        `Action ${node.node_id} arguments do not match capability ${node.capability_id}@${node.capability_version}.`
      );
    }
  }
  return plan;
};
var minecraftAction = (plan, nodeId) => {
  const node = plan.nodes.find((candidate) => candidate.node_id === nodeId);
  if (!node || node.kind !== "action") {
    throw new MinecraftEnvironmentTimeCompileError(
      "unsupported_semantics",
      `Expected action node ${nodeId}.`
    );
  }
  return helixMinecraftPlayerActionArgumentsSchema.parse(node.arguments);
};
var assertResources = (declared, action, bindings) => {
  const required = minecraftReactiveResourcesForAction(action);
  const translated = new Set(declared.map((resource) => bindings[resource] ?? resource));
  const missing = required.filter((resource) => !translated.has(resource));
  if (missing.length > 0) {
    throw new MinecraftEnvironmentTimeCompileError(
      "resource_mismatch",
      `Minecraft action ${action.action_kind} is missing declared resources: ${missing.join(", ")}.`
    );
  }
};
var inferredEffects = (action) => {
  if (action.action_kind === "mine") {
    return { block_mutations: action.count, inventory_transfers: action.count };
  }
  if (action.action_kind === "place") {
    const count = (action.positions?.length ?? 1) * (action.cleanup_after_landing === true ? 2 : 1);
    return { block_mutations: count, inventory_transfers: count };
  }
  if (["collect", "craft", "consume", "inventory_transfer"].includes(action.action_kind)) {
    return { inventory_transfers: "count" in action ? action.count : 0 };
  }
  if (action.action_kind === "equip") return { inventory_transfers: 1 };
  if (action.action_kind === "attack") return { combat_pulses: action.max_attack_pulses };
  if (action.action_kind === "combat_guard") return { combat_pulses: action.max_attack_pulses };
  return {};
};
var assertEffects = (plan, nodeId, action) => {
  const node = plan.nodes.find((candidate) => candidate.node_id === nodeId);
  if (!node || node.kind !== "action") return;
  for (const [effect, count] of Object.entries(inferredEffects(action))) {
    if ((node.effect_budget[effect] ?? -1) < count) {
      throw new MinecraftEnvironmentTimeCompileError(
        "effect_mismatch",
        `Action ${nodeId} under-declares ${effect}: requires ${count}.`
      );
    }
  }
};
var terminalOutcome = (outcome) => outcome === "succeeded" ? "succeeded" : "failed";
var compileEnvironmentTimePlanToMinecraftFluidSequence = (input) => {
  const plan = validateBase(input.plan);
  const nodes = [];
  for (const node of plan.nodes) {
    if (node.kind === "terminal") {
      if (node.outcome === "canceled") {
        throw new MinecraftEnvironmentTimeCompileError(
          "unsupported_semantics",
          "The serial Fabric sequence format cannot preserve a canceled terminal."
        );
      }
      nodes.push({
        node_id: node.node_id,
        node_kind: "terminal",
        terminal_outcome: terminalOutcome(node.outcome),
        reason_code: node.reason_code
      });
      continue;
    }
    if (node.kind === "branch") {
      nodes.push({
        node_id: node.node_id,
        node_kind: "branch",
        earliest_tick: 0,
        condition: condition(node.condition),
        on_true: node.true_node_id,
        on_false: node.false_node_id
      });
      continue;
    }
    if (node.kind === "checkpoint") {
      nodes.push({
        node_id: node.node_id,
        node_kind: "checkpoint",
        earliest_tick: 0,
        checkpoint_id: node.checkpoint_id,
        condition: condition(node.condition),
        wait_up_to_ticks: node.wait_up_to_units,
        on_satisfied: node.on_satisfied_node_id,
        on_timeout: node.on_timeout_node_id
      });
      continue;
    }
    if (node.on_failure_node_id !== node.on_timeout_node_id) {
      throw new MinecraftEnvironmentTimeCompileError(
        "unsupported_semantics",
        `Serial action ${node.node_id} requires one shared failure/timeout target.`
      );
    }
    const action = minecraftAction(plan, node.node_id);
    assertResources(node.required_resources, action, input.resource_bindings ?? {});
    assertEffects(plan, node.node_id, action);
    const actionId = `${node.node_id}.execute`;
    let entryId = actionId;
    for (let index = node.preconditions.length - 1; index >= 0; index -= 1) {
      const gateId = index === 0 ? node.node_id : `${node.node_id}.pre.${index}`;
      nodes.push({
        node_id: gateId,
        node_kind: "branch",
        earliest_tick: node.timing.earliest_start_unit,
        condition: condition(node.preconditions[index]),
        on_true: entryId,
        on_false: node.on_failure_node_id
      });
      entryId = gateId;
    }
    const completionIds = node.completion_conditions.map(
      (_, index) => `${node.node_id}.post.${index}`
    );
    nodes.push({
      node_id: node.preconditions.length === 0 ? node.node_id : actionId,
      node_kind: "workflow_action",
      earliest_tick: node.timing.earliest_start_unit,
      latest_start_tick: node.timing.latest_start_unit,
      timeout_ticks: node.timing.maximum_duration_units,
      action,
      on_success: completionIds[0],
      on_failure: node.on_failure_node_id
    });
    node.completion_conditions.forEach((postcondition, index) => {
      nodes.push({
        node_id: completionIds[index],
        node_kind: "checkpoint",
        earliest_tick: node.timing.earliest_start_unit,
        checkpoint_id: `${node.node_id}.post.${index}`,
        condition: condition(postcondition),
        wait_up_to_ticks: 0,
        on_satisfied: completionIds[index + 1] ?? node.on_success_node_id,
        on_timeout: node.on_failure_node_id
      });
    });
  }
  const compiled = {
    action_kind: "execute_sequence",
    sequence_schema: HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA,
    sequence_id: plan.plan_id,
    ruleset: "survival_tas",
    execution_plane: "player_embodiment",
    scheduler_engine: "native_fabric",
    optimization: {
      primary: "minimize_world_ticks",
      record_wall_clock: true,
      stop_on_first_verified_success: true
    },
    start_node_id: plan.start_node_id,
    max_total_ticks: plan.maximum_total_units,
    required_checkpoint_ids: plan.nodes.filter((node) => node.kind === "checkpoint").map((node) => node.kind === "checkpoint" ? node.checkpoint_id : ""),
    mutation_scope: input.mutation_scope,
    nodes
  };
  const parsed = helixMinecraftFluidSequenceArgumentsSchema.safeParse(compiled);
  if (!parsed.success) {
    throw new MinecraftEnvironmentTimeCompileError(
      "invalid_compiled_program",
      parsed.error.issues.map((issue) => issue.message).join("; ")
    );
  }
  return parsed.data;
};
var compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact = (input) => {
  const plan = helixEnvironmentTemporalPlanSchema.parse(input.plan);
  return wrapCompilation(
    plan,
    HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA,
    compileEnvironmentTimePlanToMinecraftFluidSequence(input)
  );
};

// .tmp/cs3-linked-plan-builder-trial2-20260914.ts
function buildLinked(frontier, planning, actor, index, previous) {
  if (!Number.isInteger(index) || index < 0 || index > 3 || index > 0 && !previous) throw Error("Invalid finite trial index");
  const resident = planning.resident_clock_observation;
  if (!resident?.clock?.monotonic || resident.clock.clock_kind !== "minecraft_game_tick" || resident.producer_epoch_ref !== frontier.identity.producer_epoch) throw Error("Observed resident clock required");
  if (actor.health < 18 || !actor.on_ground || actor.on_fire) throw Error("Current viable grounded actor required");
  if (index > 0 && Math.abs(actor.yaw) > 2) throw Error("Southward orientation changed");
  const successor = planning.successor_context;
  if (index > 0 && (!successor?.available || successor.previous_plan_id !== previous.plan_id || successor.previous_plan_hash !== previous.plan_hash)) throw Error("Exact verified predecessor required");
  const clocks = previous?.clocks ?? { environment: { kind: "tick", sequence: resident.clock.tick_index, resolution_unit: "minecraft_tick", nominal_units_per_second: 20 }, monotonic: { ...resident.clock.monotonic, elapsed_ms: Math.floor(resident.clock.monotonic.elapsed_ms) }, audit_at: (/* @__PURE__ */ new Date()).toISOString() };
  const start = 80 + index * 200;
  const id = `cs3-linked-walk-20260914-02-${index}`;
  const condition2 = (name, args) => ({ kind: "adapter_condition", condition_id: `minecraft.${name}`, arguments: args });
  const grounded = condition2("player_grounded", { expected: true });
  const action = (node_id, capability, args, lane, earliest, latest, duration, next) => ({ kind: "action", node_id, lane_id: lane, capability_id: `com.casimirbot.minecraft.player.${capability}`, capability_version: "1", arguments: args, required_resources: [`resource:${lane}`], timing: { earliest_start_unit: earliest, latest_start_unit: latest, maximum_duration_units: duration }, preconditions: [grounded, condition2("health_at_least", { health: 18 })], completion_conditions: [grounded], abort_guards: [], effect_budget: {}, on_success_node_id: next, on_failure_node_id: "failed", on_timeout_node_id: "failed" });
  const nodes = [{ kind: "checkpoint", node_id: "initial", checkpoint_id: `checkpoint:${id}`, required_evidence_kinds: ["player_pose"], condition: index === 0 ? condition2("position_within", { position: actor.position, radius: 0.75 }) : grounded, wait_up_to_units: 1, on_satisfied_node_id: index === 0 ? "align" : "walk", on_timeout_node_id: "failed" }];
  if (index === 0) nodes.push(action("align", "look", { action_kind: "look_at", target: { target_kind: "relative_rotation", yaw_delta_degrees: -actor.yaw, pitch_delta_degrees: -actor.pitch }, max_turn_degrees_per_tick: 15 }, "camera", 0, 80, 30, "walk"));
  nodes.push(action("walk", "walk", { action_kind: "walk", direction: "forward", duration_ms: 1e4, sprint: false }, "locomotion", start, start, 201, "success"), { kind: "terminal", node_id: "success", outcome: "succeeded", reason_code: "bounded_forward_segment_verified" }, { kind: "terminal", node_id: "failed", outcome: "failed", reason_code: "bounded_forward_segment_stopped" });
  const plan = buildHelixEnvironmentTemporalPlan({ schema: "environment.temporal_action_plan.v1", plan_id: `plan:${id}`, previous_plan_id: previous?.plan_id ?? null, previous_plan_hash: previous?.plan_hash ?? null, identity: frontier.identity, clocks, adapter_id: "minecraft.fabric_client", adapter_version: "1", compiler_version: "environment_time_minecraft:1", resident_executor_version: "native_fabric:1", start_node_id: "initial", maximum_total_units: 950, monotonic_deadline_elapsed_ms: clocks.monotonic.elapsed_ms + 47500, watermarks: { decision_unit: start, stop_unit: start + (index === 3 ? 202 : 199), committed_through_unit: start + (index === 3 ? 203 : 200), stabilization_node_id: "initial" }, lanes: [{ lane_id: "locomotion", priority: 100, resource_keys: ["resource:locomotion"] }, ...index === 0 ? [{ lane_id: "camera", priority: 100, resource_keys: ["resource:camera"] }] : []], effect_ceiling: {}, nodes, automatic_replay: false, adapter_strategy_authority: false, answer_authority: false, assistant_answer: false, terminal_eligible: false });
  const mutation_scope = { world_mutation_allowed: false, max_block_mutations: 0, max_inventory_transfers: 0, allowed_block_ids: [], allowed_regions: [], combat_allowed: false };
  const resource_bindings = { "resource:locomotion": "locomotion", "resource:camera": "camera" };
  const compilation = compileEnvironmentTimePlanToMinecraftFluidSequenceArtifact({ plan, mutation_scope, resource_bindings });
  return { plan, compilation, mutation_scope, resource_bindings, id, checkpoint: index > 0 ? successor.checkpoint : void 0 };
}
export {
  buildLinked
};
