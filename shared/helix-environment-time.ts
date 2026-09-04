import crypto from "node:crypto";
import { z } from "zod";

export const HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA =
  "environment.temporal_action_plan.v1" as const;
export const HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA =
  "environment.affordance_frontier.v1" as const;
export const HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA =
  "environment.interrupt_receipt.v1" as const;
export const HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA =
  "environment.feedback_latency.v1" as const;
export const HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA =
  "environment.capacity_sample.v1" as const;
export const HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA =
  "environment.capacity_report.v1" as const;
export const HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA =
  "environment.temporal_plan_event.v1" as const;
export const HELIX_ENVIRONMENT_PLAN_PROJECTION_SCHEMA =
  "environment.temporal_plan_projection.v1" as const;

export const HELIX_ENVIRONMENT_CLOCK_KINDS = [
  "tick",
  "frame",
  "simulation_step",
  "provider_sequence",
  "revision",
  "event_sequence",
] as const;

export const HELIX_ENVIRONMENT_AFFORDANCE_STATES = [
  "available_now",
  "conditional",
  "blocked",
  "unknown",
] as const;

export const HELIX_ENVIRONMENT_INTERRUPT_KINDS = [
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
  "informational_change",
] as const;

export const HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES = [
  "sovereign_stop",
  "local_safety",
  "user_intent",
  "material_deviation",
  "planning_watermark",
  "informational",
] as const;

export const HELIX_ENVIRONMENT_PLAN_OUTCOMES = [
  "succeeded",
  "failed",
  "canceled",
  "timed_out",
  "interrupted",
  "not_started",
] as const;

export const HELIX_ENVIRONMENT_PLAN_STATES = [
  "admitted",
  "running",
  "stabilizing",
  "canceling",
  "settled",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const sequenceSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const boundedTextSchema = z.string().trim().min(1).max(2_000);

export const canonicalEnvironmentTimeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalEnvironmentTimeValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalEnvironmentTimeValue(nested)]),
  );
};

export const helixEnvironmentTimeSha256 = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalEnvironmentTimeValue(value)), "utf8")
    .digest("hex")}`;

const boundedRecordSchema = (maxBytes: number) =>
  z.record(z.string(), z.unknown()).superRefine((value, context) => {
    const bytes = Buffer.byteLength(
      JSON.stringify(canonicalEnvironmentTimeValue(value)),
      "utf8",
    );
    if (bytes > maxBytes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Structured value exceeds the ${maxBytes}-byte limit.`,
      });
    }
  });

export const helixEnvironmentTimeIdentitySchema = z
  .object({
    environment_id: identifierSchema,
    source_id: identifierSchema,
    subject_id: identifierSchema,
    producer_epoch: identifierSchema,
    authority_id: identifierSchema,
    authority_revision: sequenceSchema,
    goal_id: identifierSchema,
    goal_revision: sequenceSchema,
    observation_revision: sequenceSchema,
    affordance_revision: sequenceSchema,
  })
  .strict();

export type HelixEnvironmentTimeIdentity = z.infer<
  typeof helixEnvironmentTimeIdentitySchema
>;

export const helixEnvironmentClockSchema = z
  .object({
    kind: z.enum(HELIX_ENVIRONMENT_CLOCK_KINDS),
    sequence: sequenceSchema,
    resolution_unit: identifierSchema,
    nominal_units_per_second: z.number().finite().positive().nullable(),
  })
  .strict();

export const helixEnvironmentThreeClockSchema = z
  .object({
    environment: helixEnvironmentClockSchema,
    monotonic: z
      .object({
        origin_id: identifierSchema,
        elapsed_ms: sequenceSchema,
      })
      .strict(),
    audit_at: timestampSchema,
  })
  .strict();

export type HelixEnvironmentThreeClock = z.infer<
  typeof helixEnvironmentThreeClockSchema
>;

export const helixEnvironmentPlanConditionSchema = z.discriminatedUnion(
  "kind",
  [
    z
      .object({
        kind: z.literal("boolean_equals"),
        fact_key: identifierSchema,
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        kind: z.literal("number_compare"),
        fact_key: identifierSchema,
        operator: z.enum(["lt", "lte", "eq", "gte", "gt"]),
        value: z.number().finite(),
      })
      .strict(),
    z
      .object({
        kind: z.literal("enum_equals"),
        fact_key: identifierSchema,
        expected: identifierSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("resource_available"),
        resource_key: identifierSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("prior_node_outcome"),
        node_id: identifierSchema,
        outcome: z.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES),
      })
      .strict(),
    z
      .object({
        kind: z.literal("checkpoint_satisfied"),
        checkpoint_id: identifierSchema,
      })
      .strict(),
    z
      .object({
        kind: z.literal("adapter_condition"),
        condition_id: identifierSchema,
        arguments: boundedRecordSchema(8 * 1024),
      })
      .strict(),
  ],
);

export type HelixEnvironmentPlanCondition = z.infer<
  typeof helixEnvironmentPlanConditionSchema
>;

const nodeTimingSchema = z
  .object({
    earliest_start_unit: sequenceSchema,
    latest_start_unit: sequenceSchema,
    maximum_duration_units: z.number().int().positive().max(1_000_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.latest_start_unit < value.earliest_start_unit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latest_start_unit"],
        message: "Latest start cannot precede earliest start.",
      });
    }
  });

const effectBudgetSchema = z
  .record(identifierSchema, z.number().int().nonnegative().max(1_000_000))
  .superRefine((value, context) => {
    if (Object.keys(value).length > 64) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Effect budget may contain at most 64 effect kinds.",
      });
    }
  });

const actionNodeSchema = z
  .object({
    kind: z.literal("action"),
    node_id: identifierSchema,
    lane_id: identifierSchema,
    capability_id: identifierSchema,
    capability_version: identifierSchema,
    arguments: boundedRecordSchema(32 * 1024),
    required_resources: z.array(identifierSchema).max(32),
    timing: nodeTimingSchema,
    preconditions: z.array(helixEnvironmentPlanConditionSchema).max(32),
    completion_conditions: z
      .array(helixEnvironmentPlanConditionSchema)
      .min(1)
      .max(32),
    abort_guards: z.array(helixEnvironmentPlanConditionSchema).max(32),
    effect_budget: effectBudgetSchema,
    on_success_node_id: identifierSchema,
    on_failure_node_id: identifierSchema,
    on_timeout_node_id: identifierSchema,
  })
  .strict();

const checkpointNodeSchema = z
  .object({
    kind: z.literal("checkpoint"),
    node_id: identifierSchema,
    checkpoint_id: identifierSchema,
    required_evidence_kinds: z.array(identifierSchema).min(1).max(32),
    condition: helixEnvironmentPlanConditionSchema,
    wait_up_to_units: sequenceSchema,
    on_satisfied_node_id: identifierSchema,
    on_timeout_node_id: identifierSchema,
  })
  .strict();

const branchNodeSchema = z
  .object({
    kind: z.literal("branch"),
    node_id: identifierSchema,
    condition: helixEnvironmentPlanConditionSchema,
    true_node_id: identifierSchema,
    false_node_id: identifierSchema,
  })
  .strict();

const terminalNodeSchema = z
  .object({
    kind: z.literal("terminal"),
    node_id: identifierSchema,
    outcome: z.enum(["succeeded", "failed", "canceled"]),
    reason_code: identifierSchema,
  })
  .strict();

export const helixEnvironmentTemporalPlanNodeSchema = z.discriminatedUnion(
  "kind",
  [
    actionNodeSchema,
    checkpointNodeSchema,
    branchNodeSchema,
    terminalNodeSchema,
  ],
);

const laneSchema = z
  .object({
    lane_id: identifierSchema,
    priority: z.number().int().min(0).max(1_000),
    resource_keys: z.array(identifierSchema).max(32),
  })
  .strict();

const watermarkSchema = z
  .object({
    decision_unit: sequenceSchema,
    stop_unit: sequenceSchema,
    committed_through_unit: sequenceSchema,
    stabilization_node_id: identifierSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.decision_unit > value.stop_unit ||
      value.stop_unit > value.committed_through_unit
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Watermarks must satisfy decision <= stop <= committed-through.",
      });
    }
  });

const temporalPlanBaseSchema = z
  .object({
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
    maximum_total_units: z.number().int().positive().max(1_000_000),
    monotonic_deadline_elapsed_ms: sequenceSchema,
    watermarks: watermarkSchema,
    lanes: z.array(laneSchema).min(1).max(32),
    effect_ceiling: effectBudgetSchema,
    nodes: z.array(helixEnvironmentTemporalPlanNodeSchema).min(2).max(256),
    automatic_replay: z.literal(false),
    adapter_strategy_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type TemporalPlanBase = z.infer<typeof temporalPlanBaseSchema>;

const nodeTargets = (
  node: z.infer<typeof helixEnvironmentTemporalPlanNodeSchema>,
) => {
  if (node.kind === "action") {
    return [
      node.on_success_node_id,
      node.on_failure_node_id,
      node.on_timeout_node_id,
    ];
  }
  if (node.kind === "checkpoint") {
    return [node.on_satisfied_node_id, node.on_timeout_node_id];
  }
  if (node.kind === "branch") return [node.true_node_id, node.false_node_id];
  return [];
};

const nodeConditions = (
  node: z.infer<typeof helixEnvironmentTemporalPlanNodeSchema>,
) => {
  if (node.kind === "action") {
    return [
      ...node.preconditions,
      ...node.completion_conditions,
      ...node.abort_guards,
    ];
  }
  if (node.kind === "checkpoint" || node.kind === "branch") {
    return [node.condition];
  }
  return [];
};

const validatePlanGraph = (
  plan: TemporalPlanBase,
  context: z.RefinementCtx,
) => {
  const nodes = new Map(plan.nodes.map((node) => [node.node_id, node]));
  if (nodes.size !== plan.nodes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nodes"],
      message: "Node ids must be unique.",
    });
    return;
  }
  const lanes = new Map(plan.lanes.map((lane) => [lane.lane_id, lane]));
  if (lanes.size !== plan.lanes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lanes"],
      message: "Lane ids must be unique.",
    });
  }
  if (!nodes.has(plan.start_node_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["start_node_id"],
      message: "Start node is missing.",
    });
    return;
  }
  if (plan.watermarks.committed_through_unit > plan.maximum_total_units) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["watermarks"],
      message: "Committed watermark exceeds plan horizon.",
    });
  }
  if (plan.monotonic_deadline_elapsed_ms <= plan.clocks.monotonic.elapsed_ms) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["monotonic_deadline_elapsed_ms"],
      message: "Plan deadline must follow the starting monotonic clock.",
    });
  }
  if (
    plan.watermarks.stabilization_node_id !== null &&
    !nodes.has(plan.watermarks.stabilization_node_id)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["watermarks", "stabilization_node_id"],
      message: "Stabilization node is missing.",
    });
  }

  for (const [index, node] of plan.nodes.entries()) {
    for (const target of nodeTargets(node)) {
      if (!nodes.has(target)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Node references missing target ${target}.`,
        });
      }
    }
    for (const planCondition of nodeConditions(node)) {
      if (
        planCondition.kind === "prior_node_outcome" &&
        !nodes.has(planCondition.node_id)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index],
          message: `Condition references missing node ${planCondition.node_id}.`,
        });
      }
      if (planCondition.kind === "checkpoint_satisfied") {
        const found = plan.nodes.some(
          (candidate) =>
            candidate.kind === "checkpoint" &&
            candidate.checkpoint_id === planCondition.checkpoint_id,
        );
        if (!found) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index],
            message: `Condition references missing checkpoint ${planCondition.checkpoint_id}.`,
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
        message: "Action lane is missing.",
      });
      continue;
    }
    if (
      node.required_resources.some(
        (resource) => !lane.resource_keys.includes(resource),
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", index, "required_resources"],
        message: "Action resources must be declared by its lane.",
      });
    }
    if (
      node.timing.latest_start_unit + node.timing.maximum_duration_units >
      plan.maximum_total_units
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes", index, "timing"],
        message: "Action timing exceeds the plan horizon.",
      });
    }
    for (const [effect, count] of Object.entries(node.effect_budget)) {
      if (
        !(effect in plan.effect_ceiling) ||
        count > plan.effect_ceiling[effect]
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "effect_budget", effect],
          message: "Action effect exceeds or is absent from the plan ceiling.",
        });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  let terminalReachable = false;
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "Temporal plan graph must be acyclic.",
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
      message: "Every node must be reachable from the start node.",
    });
  }
  if (!terminalReachable) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nodes"],
      message: "At least one terminal must be reachable.",
    });
  }
};

export const helixEnvironmentTemporalPlanSchema = temporalPlanBaseSchema
  .extend({ plan_hash: sha256Schema })
  .superRefine((plan, context) => {
    const { plan_hash: suppliedHash, ...withoutHash } = plan;
    if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plan_hash"],
        message: "Plan hash does not match canonical semantic content.",
      });
    }
    validatePlanGraph(withoutHash, context);
  });

export type HelixEnvironmentTemporalPlan = z.infer<
  typeof helixEnvironmentTemporalPlanSchema
>;

export const buildHelixEnvironmentTemporalPlan = (
  input: Omit<
    TemporalPlanBase,
    | "schema"
    | "automatic_replay"
    | "adapter_strategy_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentTemporalPlan => {
  const base: TemporalPlanBase = {
    schema: HELIX_ENVIRONMENT_TEMPORAL_PLAN_SCHEMA,
    ...input,
    automatic_replay: false,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentTemporalPlanSchema.parse({
    ...base,
    plan_hash: helixEnvironmentTimeSha256(base),
  });
};

export const evaluateHelixEnvironmentPlanCurrentness = (input: {
  plan: HelixEnvironmentTemporalPlan;
  current_identity: HelixEnvironmentTimeIdentity;
  monotonic_elapsed_ms: number;
}) => {
  const plan = helixEnvironmentTemporalPlanSchema.parse(input.plan);
  const current = helixEnvironmentTimeIdentitySchema.parse(
    input.current_identity,
  );
  const mismatches = (
    Object.keys(current) as Array<keyof typeof current>
  ).filter((key) => plan.identity[key] !== current[key]);
  if (mismatches.length > 0) {
    return {
      current: false as const,
      reason: "identity_stale" as const,
      mismatch_fields: mismatches,
    };
  }
  if (input.monotonic_elapsed_ms >= plan.monotonic_deadline_elapsed_ms) {
    return {
      current: false as const,
      reason: "deadline_expired" as const,
      mismatch_fields: ["monotonic_deadline_elapsed_ms"],
    };
  }
  return {
    current: true as const,
    reason: "current" as const,
    mismatch_fields: [],
  };
};

const temporalPlanEventPayloadSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("plan_admitted"), plan_hash: sha256Schema })
    .strict(),
  z.object({ kind: z.literal("execution_started") }).strict(),
  z
    .object({
      kind: z.literal("checkpoint_settled"),
      checkpoint_id: identifierSchema,
      observation_revision: sequenceSchema,
      affordance_revision: sequenceSchema,
      evidence_refs: z.array(identifierSchema).min(1).max(256),
    })
    .strict(),
  z
    .object({
      kind: z.literal("extension_appended"),
      extension_plan_id: identifierSchema,
      extension_plan_hash: sha256Schema,
      after_checkpoint_id: identifierSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("replacement_committed"),
      replacement_plan_id: identifierSchema,
      replacement_plan_hash: sha256Schema,
      canceled_unexecuted_node_ids: z.array(identifierSchema).max(256),
      performed_effects_preserved: z.literal(true),
    })
    .strict(),
  z
    .object({
      kind: z.literal("runway_low"),
      remaining_units: sequenceSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("stabilization_required"),
      stabilization_node_id: identifierSchema.nullable(),
      reason_code: identifierSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("cancel_requested"),
      reason_code: identifierSchema,
      authority_reducing: z.literal(true),
    })
    .strict(),
  z
    .object({
      kind: z.literal("plan_settled"),
      outcome: z.enum(HELIX_ENVIRONMENT_PLAN_OUTCOMES),
      performed_effects: effectBudgetSchema,
      controls_released: z.literal(true),
      resources_released: z.literal(true),
      evidence_refs: z.array(identifierSchema).max(256),
    })
    .strict(),
]);

export const helixEnvironmentTemporalPlanEventSchema = z
  .object({
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
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixEnvironmentTemporalPlanEvent = z.infer<
  typeof helixEnvironmentTemporalPlanEventSchema
>;

export const buildHelixEnvironmentTemporalPlanEvent = (
  input: Omit<
    HelixEnvironmentTemporalPlanEvent,
    | "schema"
    | "event_hash"
    | "execution_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentTemporalPlanEvent => {
  const base = {
    schema: HELIX_ENVIRONMENT_PLAN_EVENT_SCHEMA,
    ...input,
    execution_authority: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
  return helixEnvironmentTemporalPlanEventSchema.parse({
    ...base,
    event_hash: helixEnvironmentTimeSha256(base),
  });
};

export class HelixEnvironmentPlanReductionError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HelixEnvironmentPlanReductionError";
  }
}

export const reduceHelixEnvironmentTemporalPlanEvents = (
  suppliedEvents: HelixEnvironmentTemporalPlanEvent[],
) => {
  if (suppliedEvents.length === 0) {
    throw new HelixEnvironmentPlanReductionError(
      "environment_plan_events_empty",
      "At least one temporal-plan event is required.",
    );
  }
  const events = suppliedEvents.map((event) =>
    helixEnvironmentTemporalPlanEventSchema.parse(event),
  );
  const first = events[0];
  let previousHash: string | null = null;
  let previousEnvironmentSequence = -1;
  let previousMonotonicMs = -1;
  let state: (typeof HELIX_ENVIRONMENT_PLAN_STATES)[number] | "none" = "none";
  let latestCheckpointId: string | null = null;
  let observationRevision = first.identity.observation_revision;
  let affordanceRevision = first.identity.affordance_revision;
  let performedEffects: Record<string, number> = {};

  const transitions: Record<
    string,
    Partial<
      Record<
        z.infer<typeof temporalPlanEventPayloadSchema>["kind"],
        typeof state
      >
    >
  > = {
    none: { plan_admitted: "admitted" },
    admitted: {
      execution_started: "running",
      cancel_requested: "canceling",
      plan_settled: "settled",
    },
    running: {
      checkpoint_settled: "running",
      extension_appended: "running",
      replacement_committed: "running",
      runway_low: "running",
      stabilization_required: "stabilizing",
      cancel_requested: "canceling",
      plan_settled: "settled",
    },
    stabilizing: {
      checkpoint_settled: "stabilizing",
      cancel_requested: "canceling",
      plan_settled: "settled",
    },
    canceling: { plan_settled: "settled" },
    settled: {},
  };

  for (const [index, event] of events.entries()) {
    if (
      event.plan_id !== first.plan_id ||
      JSON.stringify(event.identity) !== JSON.stringify(first.identity)
    ) {
      throw new HelixEnvironmentPlanReductionError(
        "environment_plan_identity_drift",
        "A temporal-plan event chain cannot change plan or identity.",
      );
    }
    if (
      event.sequence !== index + 1 ||
      event.previous_event_hash !== previousHash
    ) {
      throw new HelixEnvironmentPlanReductionError(
        "environment_plan_event_chain_invalid",
        "Temporal-plan events must be contiguous and hash-linked.",
      );
    }
    const { event_hash: suppliedHash, ...withoutHash } = event;
    if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
      throw new HelixEnvironmentPlanReductionError(
        "environment_plan_event_hash_invalid",
        "Temporal-plan event hash does not match canonical content.",
      );
    }
    if (
      event.clocks.environment.sequence < previousEnvironmentSequence ||
      event.clocks.monotonic.elapsed_ms < previousMonotonicMs
    ) {
      throw new HelixEnvironmentPlanReductionError(
        "environment_plan_clock_regressed",
        "Environment and monotonic event clocks cannot regress.",
      );
    }
    const next = transitions[state][event.payload.kind];
    if (!next) {
      throw new HelixEnvironmentPlanReductionError(
        "environment_plan_transition_invalid",
        `Event ${event.payload.kind} is invalid from ${state}.`,
      );
    }
    if (event.payload.kind === "checkpoint_settled") {
      if (
        event.payload.observation_revision < observationRevision ||
        event.payload.affordance_revision < affordanceRevision
      ) {
        throw new HelixEnvironmentPlanReductionError(
          "environment_plan_checkpoint_revision_regressed",
          "Checkpoint observation and affordance revisions cannot regress.",
        );
      }
      latestCheckpointId = event.payload.checkpoint_id;
      observationRevision = event.payload.observation_revision;
      affordanceRevision = event.payload.affordance_revision;
    }
    if (event.payload.kind === "plan_settled") {
      performedEffects = event.payload.performed_effects;
    }
    state = next;
    previousHash = event.event_hash;
    previousEnvironmentSequence = event.clocks.environment.sequence;
    previousMonotonicMs = event.clocks.monotonic.elapsed_ms;
  }

  return {
    schema: HELIX_ENVIRONMENT_PLAN_PROJECTION_SCHEMA,
    plan_id: first.plan_id,
    identity: first.identity,
    state,
    revision: events.length,
    latest_event_hash: previousHash!,
    latest_checkpoint_id: latestCheckpointId,
    latest_observation_revision: observationRevision,
    latest_affordance_revision: affordanceRevision,
    performed_effects: performedEffects,
    controls_may_be_asserted: state === "running" || state === "stabilizing",
    execution_authority: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
};

const affordanceEntrySchema = z
  .object({
    capability_id: identifierSchema,
    capability_version: identifierSchema,
    subject_id: identifierSchema,
    state: z.enum(HELIX_ENVIRONMENT_AFFORDANCE_STATES),
    reason_codes: z.array(identifierSchema).max(32),
    required_authority_ids: z.array(identifierSchema).max(16),
    held_resource_keys: z.array(identifierSchema).max(32),
    parameter_bounds: boundedRecordSchema(8 * 1024),
    missing_observation_kinds: z.array(identifierSchema).max(32),
    evidence_probe_capability_ids: z.array(identifierSchema).max(16),
  })
  .strict();

export type HelixEnvironmentAffordanceEntry = z.infer<
  typeof affordanceEntrySchema
>;

export const helixEnvironmentAffordanceFrontierSchema = z
  .object({
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
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((frontier, context) => {
    if (
      frontier.expires_at_environment_sequence <=
      frontier.clocks.environment.sequence
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at_environment_sequence"],
        message:
          "Affordance frontier must expire after its observation sequence.",
      });
    }
    const keys = frontier.entries.map(
      (entry) =>
        `${entry.capability_id}@${entry.capability_version}:${entry.subject_id}`,
    );
    if (new Set(keys).size !== keys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entries"],
        message:
          "Affordance entries must be unique by capability, version and subject.",
      });
    }
  });

export type HelixEnvironmentAffordanceFrontier = z.infer<
  typeof helixEnvironmentAffordanceFrontierSchema
>;

const affordanceKey = (entry: HelixEnvironmentAffordanceEntry) =>
  `${entry.capability_id}@${entry.capability_version}:${entry.subject_id}`;

const stableAffordanceIdentityFields = [
  "environment_id",
  "source_id",
  "subject_id",
  "producer_epoch",
  "authority_id",
  "authority_revision",
  "goal_id",
  "goal_revision",
] as const;

export const buildHelixEnvironmentAffordanceFrontier = (input: {
  frontier_id: string;
  identity: HelixEnvironmentTimeIdentity;
  clocks: HelixEnvironmentThreeClock;
  expires_at_environment_sequence: number;
  entries: HelixEnvironmentAffordanceEntry[];
  previous_frontier?: HelixEnvironmentAffordanceFrontier | null;
}): HelixEnvironmentAffordanceFrontier => {
  const identity = helixEnvironmentTimeIdentitySchema.parse(input.identity);
  const previous = input.previous_frontier
    ? helixEnvironmentAffordanceFrontierSchema.parse(input.previous_frontier)
    : null;
  if (previous) {
    const mismatch = stableAffordanceIdentityFields.find(
      (field) => previous.identity[field] !== identity[field],
    );
    if (mismatch) {
      throw new Error(`Affordance frontier identity changed at ${mismatch}.`);
    }
    if (
      identity.affordance_revision !==
      previous.identity.affordance_revision + 1
    ) {
      throw new Error("Affordance revision must advance by exactly one.");
    }
    if (
      input.clocks.environment.kind !== previous.clocks.environment.kind ||
      input.clocks.environment.resolution_unit !==
        previous.clocks.environment.resolution_unit ||
      input.clocks.environment.sequence <
        previous.clocks.environment.sequence ||
      input.clocks.monotonic.origin_id !==
        previous.clocks.monotonic.origin_id ||
      input.clocks.monotonic.elapsed_ms < previous.clocks.monotonic.elapsed_ms
    ) {
      throw new Error(
        "Affordance frontier clocks changed domain or regressed.",
      );
    }
  }
  const entries = input.entries
    .map((entry) => affordanceEntrySchema.parse(entry))
    .sort((left, right) =>
      affordanceKey(left).localeCompare(affordanceKey(right)),
    );
  const currentByKey = new Map(
    entries.map((entry) => [affordanceKey(entry), entry]),
  );
  const previousByKey = new Map(
    (previous?.entries ?? []).map((entry) => [affordanceKey(entry), entry]),
  );
  const changed = [...currentByKey].filter(([key, entry]) => {
    const prior = previousByKey.get(key);
    return (
      prior !== undefined &&
      helixEnvironmentTimeSha256(prior) !== helixEnvironmentTimeSha256(entry)
    );
  });
  const uniqueCapabilities = (values: string[]) => [...new Set(values)].sort();
  return helixEnvironmentAffordanceFrontierSchema.parse({
    schema: HELIX_ENVIRONMENT_AFFORDANCE_FRONTIER_SCHEMA,
    frontier_id: input.frontier_id,
    identity,
    clocks: input.clocks,
    expires_at_environment_sequence: input.expires_at_environment_sequence,
    entries,
    newly_available_capability_ids: uniqueCapabilities(
      [...currentByKey]
        .filter(
          ([, entry]) =>
            entry.state === "available_now" &&
            previousByKey.get(affordanceKey(entry))?.state !== "available_now",
        )
        .map(([, entry]) => entry.capability_id),
    ),
    newly_blocked_capability_ids: uniqueCapabilities(
      [...currentByKey]
        .filter(
          ([, entry]) =>
            entry.state === "blocked" &&
            previousByKey.get(affordanceKey(entry))?.state !== "blocked",
        )
        .map(([, entry]) => entry.capability_id),
    ),
    materially_changed_capability_ids: uniqueCapabilities(
      changed.map(([, entry]) => entry.capability_id),
    ),
    expired_capability_ids: uniqueCapabilities(
      [...previousByKey]
        .filter(([key]) => !currentByKey.has(key))
        .map(([, entry]) => entry.capability_id),
    ),
    strategy_recommendation_included: false,
    execution_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

export const helixEnvironmentInterruptReceiptSchema = z
  .object({
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
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((receipt, context) => {
    if (
      receipt.preempted_clocks.monotonic.elapsed_ms <
      receipt.detected_clocks.monotonic.elapsed_ms
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preempted_clocks"],
        message: "Pre-emption cannot precede detection.",
      });
    }
    if (
      receipt.kind === "user_steering" &&
      receipt.next_decision === "resume"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["next_decision"],
        message:
          "Steering that invalidates a plan must replan, cancel or stabilize rather than auto-resume.",
      });
    }
    const expected = (
      {
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
        informational_change: ["informational", "none", false],
      } as const
    )[receipt.kind];
    if (
      receipt.priority !== expected[0] ||
      receipt.next_decision !== expected[1] ||
      receipt.controls_released !== expected[2]
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Interrupt priority, decision and control release must match the fixed authority-reducing policy.",
      });
    }
    if (
      receipt.preempted_clocks.monotonic.origin_id !==
        receipt.detected_clocks.monotonic.origin_id ||
      receipt.preempted_clocks.environment.kind !==
        receipt.detected_clocks.environment.kind ||
      receipt.preempted_clocks.environment.resolution_unit !==
        receipt.detected_clocks.environment.resolution_unit ||
      receipt.preempted_clocks.environment.sequence <
        receipt.detected_clocks.environment.sequence
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preempted_clocks"],
        message:
          "Pre-emption clocks must preserve their domains and cannot regress.",
      });
    }
  });

export type HelixEnvironmentInterruptReceipt = z.infer<
  typeof helixEnvironmentInterruptReceiptSchema
>;

const interruptPolicy = {
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
  informational_change: ["informational", "none", false],
} as const satisfies Record<
  (typeof HELIX_ENVIRONMENT_INTERRUPT_KINDS)[number],
  readonly [
    (typeof HELIX_ENVIRONMENT_INTERRUPT_PRIORITIES)[number],
    "none" | "resume" | "replan" | "cancel" | "stabilize",
    boolean,
  ]
>;

export const buildHelixEnvironmentInterruptReceipt = (
  input: Omit<
    HelixEnvironmentInterruptReceipt,
    | "schema"
    | "priority"
    | "next_decision"
    | "controls_released"
    | "execution_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentInterruptReceipt => {
  const [priority, nextDecision, controlsReleased] =
    interruptPolicy[input.kind];
  return helixEnvironmentInterruptReceiptSchema.parse({
    schema: HELIX_ENVIRONMENT_INTERRUPT_RECEIPT_SCHEMA,
    ...input,
    priority,
    next_decision: nextDecision,
    controls_released: controlsReleased,
    execution_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

export const helixEnvironmentFeedbackLatencySchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA),
    trace_id: identifierSchema,
    identity: helixEnvironmentTimeIdentitySchema,
    spans_ms: z
      .object({
        manual_input_to_release: z.number().int().nonnegative().nullable(),
        finalized_input_to_task_available: z
          .number()
          .int()
          .nonnegative()
          .nullable(),
        pickup_to_acknowledgement: z.number().int().nonnegative().nullable(),
        arbitration_to_plan_stop: z.number().int().nonnegative().nullable(),
        observation_to_replacement_proposal: z
          .number()
          .int()
          .nonnegative()
          .nullable(),
        proposal_to_admission: z.number().int().nonnegative().nullable(),
        admission_to_first_execution_unit: z
          .number()
          .int()
          .nonnegative()
          .nullable(),
        final_observation_to_presentation: z
          .number()
          .int()
          .nonnegative()
          .nullable(),
      })
      .strict(),
    speech_capture_and_finalization_ms: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
    provider_id: identifierSchema.nullable(),
    credential_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixEnvironmentFeedbackLatency = z.infer<
  typeof helixEnvironmentFeedbackLatencySchema
>;

type FeedbackMark = number | null | undefined;
const duration = (start: FeedbackMark, end: FeedbackMark) => {
  if (start == null || end == null) return null;
  if (end < start) throw new Error("Feedback latency marks cannot regress.");
  return end - start;
};

export const buildHelixEnvironmentFeedbackLatency = (input: {
  trace_id: string;
  identity: HelixEnvironmentTimeIdentity;
  provider_id: string | null;
  marks_ms: {
    manual_input?: FeedbackMark;
    controls_released?: FeedbackMark;
    speech_capture_started?: FeedbackMark;
    input_finalized?: FeedbackMark;
    task_available?: FeedbackMark;
    steering_picked_up?: FeedbackMark;
    steering_acknowledged?: FeedbackMark;
    arbitration_completed?: FeedbackMark;
    plan_stopped?: FeedbackMark;
    observation_available?: FeedbackMark;
    replacement_proposed?: FeedbackMark;
    proposal_admitted?: FeedbackMark;
    first_execution_unit?: FeedbackMark;
    final_observation?: FeedbackMark;
    presentation_completed?: FeedbackMark;
  };
}): HelixEnvironmentFeedbackLatency => {
  const marks = input.marks_ms;
  return helixEnvironmentFeedbackLatencySchema.parse({
    schema: HELIX_ENVIRONMENT_FEEDBACK_LATENCY_SCHEMA,
    trace_id: input.trace_id,
    identity: input.identity,
    spans_ms: {
      manual_input_to_release: duration(
        marks.manual_input,
        marks.controls_released,
      ),
      finalized_input_to_task_available: duration(
        marks.input_finalized,
        marks.task_available,
      ),
      pickup_to_acknowledgement: duration(
        marks.steering_picked_up,
        marks.steering_acknowledged,
      ),
      arbitration_to_plan_stop: duration(
        marks.arbitration_completed,
        marks.plan_stopped,
      ),
      observation_to_replacement_proposal: duration(
        marks.observation_available,
        marks.replacement_proposed,
      ),
      proposal_to_admission: duration(
        marks.replacement_proposed,
        marks.proposal_admitted,
      ),
      admission_to_first_execution_unit: duration(
        marks.proposal_admitted,
        marks.first_execution_unit,
      ),
      final_observation_to_presentation: duration(
        marks.final_observation,
        marks.presentation_completed,
      ),
    },
    speech_capture_and_finalization_ms: duration(
      marks.speech_capture_started,
      marks.input_finalized,
    ),
    provider_id: input.provider_id,
    credential_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

const nullableMillisecondsSchema = z.number().int().nonnegative().nullable();

export const helixEnvironmentCapacitySampleSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_CAPACITY_SAMPLE_SCHEMA),
    sample_id: identifierSchema,
    course: z.enum(["controlled_n0", "unknown_world"]),
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
    lead_time_ticks: z.number().int().nonnegative(),
    latencies_ms: z
      .object({
        event_to_evidence: nullableMillisecondsSchema,
        evidence_to_pickup: nullableMillisecondsSchema,
        stop_to_replan: nullableMillisecondsSchema,
        finalized_steering_to_stop: nullableMillisecondsSchema,
        manual_or_safety_to_release: nullableMillisecondsSchema,
      })
      .strict(),
    elapsed_ms: z.number().int().positive(),
    replans: z.number().int().nonnegative(),
    unnecessary_replans: z.number().int().nonnegative(),
    observation_input_bytes: z.number().int().nonnegative(),
    observation_output_bytes: z.number().int().nonnegative(),
    observation_tokens: z.number().int().nonnegative().nullable(),
    raw_event_count: z.number().int().nonnegative(),
    emitted_observation_count: z.number().int().nonnegative(),
    performed_effect_refs: z.array(identifierSchema).max(2_048),
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
    terminal_eligible: z.literal(false),
  })
  .strict()
  .superRefine((sample, context) => {
    if (sample.active_control_ticks > sample.scheduler_ticks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["active_control_ticks"],
        message: "Active control ticks cannot exceed scheduler ticks.",
      });
    }
    if (sample.stalled_ticks + sample.missed_ticks > sample.scheduler_ticks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stalled_ticks"],
        message: "Stalled and missed ticks cannot exceed scheduler ticks.",
      });
    }
    if (sample.unnecessary_replans > sample.replans) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unnecessary_replans"],
        message: "Unnecessary replans cannot exceed total replans.",
      });
    }
    if (sample.emitted_observation_count > sample.raw_event_count) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emitted_observation_count"],
        message: "Emitted observations cannot exceed raw events.",
      });
    }
  });

export type HelixEnvironmentCapacitySample = z.infer<
  typeof helixEnvironmentCapacitySampleSchema
>;

const percentileSummarySchema = z
  .object({
    sample_count: z.number().int().nonnegative(),
    p50: z.number().finite().nonnegative().nullable(),
    p95: z.number().finite().nonnegative().nullable(),
    p99: z.number().finite().nonnegative().nullable(),
  })
  .strict();

export const helixEnvironmentCapacityReportSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA),
    report_id: identifierSchema,
    exact_reasoning_binding_ref: identifierSchema,
    sample_count: z.number().int().positive(),
    rolling_cycle_count: z.number().int().positive(),
    courses_observed: z.array(z.enum(["controlled_n0", "unknown_world"])),
    latency_percentiles_ms: z
      .object({
        resident_computation: percentileSummarySchema,
        dispatch_to_first_tick: percentileSummarySchema,
        event_to_evidence: percentileSummarySchema,
        evidence_to_pickup: percentileSummarySchema,
        stop_to_replan: percentileSummarySchema,
        finalized_steering_to_stop: percentileSummarySchema,
        manual_or_safety_to_release: percentileSummarySchema,
      })
      .strict(),
    continuous_control_ratio: z.number().finite().min(0).max(1),
    stalled_tick_count: z.number().int().nonnegative(),
    missed_tick_count: z.number().int().nonnegative(),
    queue_depth_peak: z.number().int().nonnegative(),
    lead_time_ticks_p50: z.number().finite().nonnegative(),
    replans_per_minute: z.number().finite().nonnegative(),
    unnecessary_replans_per_minute: z.number().finite().nonnegative(),
    observation_input_bytes: z.number().int().nonnegative(),
    observation_output_bytes: z.number().int().nonnegative(),
    observation_tokens: z.number().int().nonnegative().nullable(),
    observation_coalescing_ratio: z.number().finite().min(0).max(1).nullable(),
    performed_effect_count: z.number().int().nonnegative(),
    duplicate_effect_count: z.number().int().nonnegative(),
    verified_progress_per_model_tool_round_trip: z
      .number()
      .finite()
      .nonnegative()
      .nullable(),
    missing_measurements: z.array(identifierSchema),
    exit_criteria: z
      .object({
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
        required_measurements_complete: z.boolean(),
      })
      .strict(),
    exit_satisfied: z.boolean(),
    evidence_refs: z.array(identifierSchema).min(1).max(512),
    credential_included: z.literal(false),
    hidden_reasoning_included: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixEnvironmentCapacityReport = z.infer<
  typeof helixEnvironmentCapacityReportSchema
>;

const percentile = (
  values: readonly number[],
  quantile: number,
): number | null => {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const position = (ordered.length - 1) * quantile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return ordered[lower];
  return (
    ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)
  );
};

const percentileSummary = (values: readonly (number | null)[]) => {
  const present = values.filter((value): value is number => value !== null);
  return {
    sample_count: present.length,
    p50: percentile(present, 0.5),
    p95: percentile(present, 0.95),
    p99: percentile(present, 0.99),
  };
};

export const buildHelixEnvironmentCapacityReport = (input: {
  report_id: string;
  samples: HelixEnvironmentCapacitySample[];
  evidence_refs: string[];
}): HelixEnvironmentCapacityReport => {
  if (input.samples.length === 0) {
    throw new Error("A capacity report requires at least one sample.");
  }
  const samples = input.samples.map((sample) =>
    helixEnvironmentCapacitySampleSchema.parse(sample),
  );
  const bindingRef = samples[0].exact_reasoning_binding_ref;
  if (
    samples.some((sample) => sample.exact_reasoning_binding_ref !== bindingRef)
  ) {
    throw new Error(
      "Capacity samples must preserve one exact reasoning binding.",
    );
  }

  const totalSchedulerTicks = samples.reduce(
    (sum, sample) => sum + sample.scheduler_ticks,
    0,
  );
  const totalElapsedMs = samples.reduce(
    (sum, sample) => sum + sample.elapsed_ms,
    0,
  );
  const performedEffects = samples.flatMap(
    (sample) => sample.performed_effect_refs,
  );
  const duplicateEffectCount =
    performedEffects.length - new Set(performedEffects).size;
  const totalRoundTrips = samples.reduce(
    (sum, sample) => sum + sample.model_tool_round_trips,
    0,
  );
  const totalRawEvents = samples.reduce(
    (sum, sample) => sum + sample.raw_event_count,
    0,
  );
  const totalEmittedObservations = samples.reduce(
    (sum, sample) => sum + sample.emitted_observation_count,
    0,
  );
  const totalObservationTokens = samples.every(
    (sample) => sample.observation_tokens !== null,
  )
    ? samples.reduce((sum, sample) => sum + (sample.observation_tokens ?? 0), 0)
    : null;

  const latencyValues = {
    resident_computation: samples.map(
      (sample) => sample.resident_computation_ms,
    ),
    dispatch_to_first_tick: samples.map(
      (sample) => sample.dispatch_to_first_tick_ms,
    ),
    event_to_evidence: samples.map(
      (sample) => sample.latencies_ms.event_to_evidence,
    ),
    evidence_to_pickup: samples.map(
      (sample) => sample.latencies_ms.evidence_to_pickup,
    ),
    stop_to_replan: samples.map((sample) => sample.latencies_ms.stop_to_replan),
    finalized_steering_to_stop: samples.map(
      (sample) => sample.latencies_ms.finalized_steering_to_stop,
    ),
    manual_or_safety_to_release: samples.map(
      (sample) => sample.latencies_ms.manual_or_safety_to_release,
    ),
  };
  // Reaction measurements are event-specific. A normal rolling cycle does
  // not have a manual-release or steering-stop event, so null in that cycle
  // means "not applicable", not "the whole capacity run is unmeasured".
  // The report requires at least one measured sample for every latency family.
  const missingMeasurements = Object.entries(latencyValues)
    .filter(([, values]) => values.every((value) => value === null))
    .map(([name]) => `latency:${name}`);
  if (totalObservationTokens === null)
    missingMeasurements.push("observation:tokens");
  if (totalRawEvents === 0)
    missingMeasurements.push("observation:coalescing");
  if (totalRoundTrips === 0)
    missingMeasurements.push("progress:model_tool_round_trip");

  const rollingCycleCount = new Set(
    samples.map((sample) => sample.rolling_cycle_index),
  ).size;
  const coursesObserved = [...new Set(samples.map((sample) => sample.course))];
  const exitCriteria = {
    at_least_three_rolling_cycles: rollingCycleCount >= 3,
    controlled_and_unknown_world_observed:
      coursesObserved.includes("controlled_n0") &&
      coursesObserved.includes("unknown_world"),
    changed_affordance_replan_observed: samples.some(
      (sample) => sample.changed_affordance_replan_observed,
    ),
    local_intervention_observed: samples.some(
      (sample) => sample.local_intervention_observed,
    ),
    user_steering_observed: samples.some(
      (sample) => sample.user_steering_observed,
    ),
    reconnect_recovery_observed: samples.some(
      (sample) => sample.reconnect_recovery_observed,
    ),
    zero_duplicate_effects: duplicateEffectCount === 0,
    final_revocation_observed: samples.some(
      (sample) => sample.revocation_observed,
    ),
    stale_after_revoke_rejected: samples.some(
      (sample) => sample.stale_after_revoke_rejected,
    ),
    all_controls_released: samples.every((sample) => sample.controls_released),
    all_evidence_reentered: samples.every(
      (sample) => sample.evidence_reentered,
    ),
    required_measurements_complete: missingMeasurements.length === 0,
  };

  return helixEnvironmentCapacityReportSchema.parse({
    schema: HELIX_ENVIRONMENT_CAPACITY_REPORT_SCHEMA,
    report_id: input.report_id,
    exact_reasoning_binding_ref: bindingRef,
    sample_count: samples.length,
    rolling_cycle_count: rollingCycleCount,
    courses_observed: coursesObserved,
    latency_percentiles_ms: Object.fromEntries(
      Object.entries(latencyValues).map(([name, values]) => [
        name,
        percentileSummary(values),
      ]),
    ),
    continuous_control_ratio:
      samples.reduce((sum, sample) => sum + sample.active_control_ticks, 0) /
      totalSchedulerTicks,
    stalled_tick_count: samples.reduce(
      (sum, sample) => sum + sample.stalled_ticks,
      0,
    ),
    missed_tick_count: samples.reduce(
      (sum, sample) => sum + sample.missed_ticks,
      0,
    ),
    queue_depth_peak: Math.max(
      ...samples.map((sample) => sample.queue_depth_peak),
    ),
    lead_time_ticks_p50:
      percentile(
        samples.map((sample) => sample.lead_time_ticks),
        0.5,
      ) ?? 0,
    replans_per_minute:
      (samples.reduce((sum, sample) => sum + sample.replans, 0) * 60_000) /
      totalElapsedMs,
    unnecessary_replans_per_minute:
      (samples.reduce((sum, sample) => sum + sample.unnecessary_replans, 0) *
        60_000) /
      totalElapsedMs,
    observation_input_bytes: samples.reduce(
      (sum, sample) => sum + sample.observation_input_bytes,
      0,
    ),
    observation_output_bytes: samples.reduce(
      (sum, sample) => sum + sample.observation_output_bytes,
      0,
    ),
    observation_tokens: totalObservationTokens,
    observation_coalescing_ratio:
      totalRawEvents === 0
        ? null
        : 1 - totalEmittedObservations / totalRawEvents,
    performed_effect_count: performedEffects.length,
    duplicate_effect_count: duplicateEffectCount,
    verified_progress_per_model_tool_round_trip:
      totalRoundTrips === 0
        ? null
        : samples.reduce(
            (sum, sample) => sum + sample.verified_progress_units,
            0,
          ) / totalRoundTrips,
    missing_measurements: missingMeasurements,
    exit_criteria: exitCriteria,
    exit_satisfied: Object.values(exitCriteria).every(Boolean),
    evidence_refs: input.evidence_refs,
    credential_included: false,
    hidden_reasoning_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};
