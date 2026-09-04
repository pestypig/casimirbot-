import { z } from "zod";

import {
  helixEnvironmentThreeClockSchema,
  helixEnvironmentTimeSha256,
} from "./helix-environment-time";

export const HELIX_ENVIRONMENT_SPATIAL_SNAPSHOT_SCHEMA =
  "environment.spatial_snapshot.v1" as const;
export const HELIX_ENVIRONMENT_TOPOLOGY_GRAPH_SCHEMA =
  "environment.topology_graph.v1" as const;
export const HELIX_ENVIRONMENT_NAVIGATION_REQUEST_SCHEMA =
  "environment.navigation_request.v1" as const;
export const HELIX_ENVIRONMENT_NAVIGATION_PLAN_SCHEMA =
  "environment.navigation_plan.v1" as const;
export const HELIX_ENVIRONMENT_NAVIGATION_FEEDBACK_SCHEMA =
  "environment.navigation_feedback.v1" as const;
export const HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_SCHEMA =
  "environment.navigation_benchmark_protocol.v1" as const;

export const HELIX_ENVIRONMENT_COVERAGE_STATES = [
  "complete_within_bounds",
  "partial_with_unknown_regions",
] as const;

export const HELIX_ENVIRONMENT_NAVIGATION_PLAN_KINDS = [
  "complete_route",
  "partial_to_frontier",
] as const;

export const HELIX_ENVIRONMENT_NAVIGATION_FEEDBACK_KINDS = [
  "checkpoint_reached",
  "progress_below_threshold",
  "pose_deviation",
  "corridor_deviation",
  "collision",
  "dynamic_obstruction",
  "topology_changed",
  "hazard_policy_violated",
  "coverage_exhausted",
  "coverage_extended",
  "destination_satisfied",
  "destination_invalidated",
  "manual_input_detected",
  "authority_changed",
  "producer_epoch_changed",
] as const;

export const HELIX_ENVIRONMENT_NAVIGATION_DISPOSITIONS = [
  "continue_committed_horizon",
  "hold_safe",
  "replan_same_goal",
  "release_controls",
] as const;

export const HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS = [
  "goal_completion",
  "first_valid_action_latency_ms",
  "elapsed_environment_units",
  "elapsed_wall_ms",
  "route_distance",
  "normalized_route_cost",
  "planning_cpu_ms",
  "planning_peak_memory_bytes",
  "replan_count",
  "stationary_environment_units",
  "stuck_recovery_ms",
  "collision_count",
  "hazard_exposure_units",
  "damage_received",
  "forbidden_effect_count",
  "manual_interrupt_latency_ms",
  "control_release_latency_ms",
  "duplicate_effect_count",
  "stale_segment_execution_count",
  "evidence_bytes_per_distance_unit",
  "evidence_events_per_distance_unit",
  "surface_outcome_parity",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/u);
const boundedLabelSchema = z.string().trim().min(1).max(240);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const timestampSchema = z.string().datetime({ offset: true });
const sequenceSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const coordinateSchema = z.array(z.number().finite()).min(1).max(8);

const boundedRecordSchema = (maxBytes: number) =>
  z.record(z.string(), z.unknown()).superRefine((value, context) => {
    if (Buffer.byteLength(JSON.stringify(value), "utf8") > maxBytes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Structured value exceeds the ${maxBytes}-byte limit.`,
      });
    }
  });

const unique = (values: readonly string[]) =>
  new Set(values).size === values.length;

const addIssue = (
  context: z.RefinementCtx,
  path: Array<string | number>,
  message: string,
) =>
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });

export const helixEnvironmentNavigationIdentitySchema = z
  .object({
    environment_id: identifierSchema,
    source_id: identifierSchema,
    subject_id: identifierSchema,
    producer_epoch: identifierSchema,
    coordinate_frame_id: identifierSchema,
    observation_revision: sequenceSchema,
    authority_id: identifierSchema,
    authority_revision: sequenceSchema,
  })
  .strict();

export type HelixEnvironmentNavigationIdentity = z.infer<
  typeof helixEnvironmentNavigationIdentitySchema
>;

const coordinateBoundsSchema = z
  .object({
    axes: z.array(identifierSchema).min(1).max(8),
    minimum: coordinateSchema,
    maximum: coordinateSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!unique(value.axes))
      addIssue(context, ["axes"], "Coordinate axes must be unique.");
    if (
      value.axes.length !== value.minimum.length ||
      value.axes.length !== value.maximum.length
    ) {
      addIssue(
        context,
        ["minimum"],
        "Coordinate bounds must match the declared axis count.",
      );
      return;
    }
    value.minimum.forEach((minimum, index) => {
      if (minimum > value.maximum[index]) {
        addIssue(context, ["minimum", index], "Minimum cannot exceed maximum.");
      }
    });
  });

const spatialFeatureSchema = z
  .object({
    feature_id: identifierSchema,
    feature_kind: identifierSchema,
    centroid: coordinateSchema,
    geometry: boundedRecordSchema(8 * 1024),
    dynamic: z.boolean(),
    traversability: z.enum([
      "traversable",
      "blocked",
      "conditional",
      "unknown",
    ]),
    hazard_ids: z.array(identifierSchema).max(32),
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict();

const spatialFrontierSchema = z
  .object({
    frontier_id: identifierSchema,
    position: coordinateSchema,
    reason: z.enum([
      "coverage_boundary",
      "sensor_occlusion",
      "budget_boundary",
      "streaming_boundary",
    ]),
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict();

const spatialSnapshotBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_SPATIAL_SNAPSHOT_SCHEMA),
    snapshot_id: identifierSchema,
    identity: helixEnvironmentNavigationIdentitySchema,
    clocks: helixEnvironmentThreeClockSchema,
    captured_at: timestampSchema,
    bounds: coordinateBoundsSchema,
    coverage_state: z.enum(HELIX_ENVIRONMENT_COVERAGE_STATES),
    unknown_region_ids: z.array(identifierSchema).max(256),
    features: z.array(spatialFeatureSchema).max(4_096),
    frontiers: z.array(spatialFrontierSchema).max(512),
    adapter_profile: boundedRecordSchema(16 * 1024),
    adapter_strategy_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type SpatialSnapshotBase = z.infer<typeof spatialSnapshotBaseSchema>;

const validateSpatialSnapshot = (
  snapshot: SpatialSnapshotBase,
  context: z.RefinementCtx,
) => {
  const dimension = snapshot.bounds.axes.length;
  if (
    snapshot.coverage_state === "complete_within_bounds" &&
    snapshot.unknown_region_ids.length > 0
  ) {
    addIssue(
      context,
      ["unknown_region_ids"],
      "Complete coverage cannot declare unknown regions.",
    );
  }
  if (
    snapshot.coverage_state === "partial_with_unknown_regions" &&
    snapshot.unknown_region_ids.length === 0 &&
    snapshot.frontiers.length === 0
  ) {
    addIssue(
      context,
      ["coverage_state"],
      "Partial coverage must identify an unknown region or frontier.",
    );
  }
  if (!unique(snapshot.features.map((feature) => feature.feature_id))) {
    addIssue(context, ["features"], "Spatial feature ids must be unique.");
  }
  if (!unique(snapshot.frontiers.map((frontier) => frontier.frontier_id))) {
    addIssue(context, ["frontiers"], "Spatial frontier ids must be unique.");
  }
  snapshot.features.forEach((feature, index) => {
    if (feature.centroid.length !== dimension) {
      addIssue(
        context,
        ["features", index, "centroid"],
        "Feature coordinates must match the coordinate frame dimension.",
      );
    }
  });
  snapshot.frontiers.forEach((frontier, index) => {
    if (frontier.position.length !== dimension) {
      addIssue(
        context,
        ["frontiers", index, "position"],
        "Frontier coordinates must match the coordinate frame dimension.",
      );
    }
  });
};

export const helixEnvironmentSpatialSnapshotSchema = spatialSnapshotBaseSchema
  .extend({ snapshot_hash: sha256Schema })
  .superRefine((snapshot, context) => {
    const { snapshot_hash: suppliedHash, ...withoutHash } = snapshot;
    if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
      addIssue(
        context,
        ["snapshot_hash"],
        "Snapshot hash does not match canonical semantic content.",
      );
    }
    validateSpatialSnapshot(withoutHash, context);
  });

export type HelixEnvironmentSpatialSnapshot = z.infer<
  typeof helixEnvironmentSpatialSnapshotSchema
>;

export const buildHelixEnvironmentSpatialSnapshot = (
  input: Omit<
    SpatialSnapshotBase,
    | "schema"
    | "adapter_strategy_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentSpatialSnapshot => {
  const base: SpatialSnapshotBase = {
    schema: HELIX_ENVIRONMENT_SPATIAL_SNAPSHOT_SCHEMA,
    ...input,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentSpatialSnapshotSchema.parse({
    ...base,
    snapshot_hash: helixEnvironmentTimeSha256(base),
  });
};

const topologyNodeSchema = z
  .object({
    node_id: identifierSchema,
    position: coordinateSchema,
    node_class: identifierSchema,
    state: boundedRecordSchema(8 * 1024),
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict();

const navigationEffectSchema = z
  .object({
    effect_kind: z.enum(["locomotion", "orientation"]),
    maximum_count: z.number().int().nonnegative().max(1_000_000),
  })
  .strict();

const topologyEdgeSchema = z
  .object({
    edge_id: identifierSchema,
    from_node_id: identifierSchema,
    to_node_id: identifierSchema,
    traversal_class: identifierSchema,
    estimated_costs: z
      .record(identifierSchema, z.number().finite().nonnegative())
      .refine((value) => Object.keys(value).length <= 32, {
        message: "An edge may declare at most 32 cost dimensions.",
      }),
    risk_score: z.number().finite().min(0).max(1),
    reversible: z.boolean(),
    required_effects: z.array(navigationEffectSchema).max(2),
    valid_from_observation_revision: sequenceSchema,
    valid_through_observation_revision: sequenceSchema,
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.valid_through_observation_revision <
      value.valid_from_observation_revision
    ) {
      addIssue(
        context,
        ["valid_through_observation_revision"],
        "Edge validity cannot end before it begins.",
      );
    }
    if (!unique(value.required_effects.map((effect) => effect.effect_kind))) {
      addIssue(
        context,
        ["required_effects"],
        "Navigation effect kinds must be unique.",
      );
    }
  });

const topologyFrontierSchema = z
  .object({
    frontier_id: identifierSchema,
    at_node_id: identifierSchema,
    reason: z.enum([
      "coverage_boundary",
      "sensor_occlusion",
      "budget_boundary",
      "streaming_boundary",
    ]),
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict();

const topologyGraphBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_TOPOLOGY_GRAPH_SCHEMA),
    graph_id: identifierSchema,
    graph_revision: sequenceSchema,
    identity: helixEnvironmentNavigationIdentitySchema,
    snapshot_id: identifierSchema,
    snapshot_hash: sha256Schema,
    previous_graph_hash: sha256Schema.nullable(),
    axes: z.array(identifierSchema).min(1).max(8),
    nodes: z.array(topologyNodeSchema).min(1).max(16_384),
    edges: z.array(topologyEdgeSchema).max(65_536),
    frontiers: z.array(topologyFrontierSchema).max(1_024),
    adapter_profile_id: identifierSchema,
    adapter_strategy_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type TopologyGraphBase = z.infer<typeof topologyGraphBaseSchema>;

const validateTopologyGraph = (
  graph: TopologyGraphBase,
  context: z.RefinementCtx,
) => {
  if (!unique(graph.axes))
    addIssue(context, ["axes"], "Graph axes must be unique.");
  const nodes = new Set(graph.nodes.map((node) => node.node_id));
  if (nodes.size !== graph.nodes.length) {
    addIssue(context, ["nodes"], "Topology node ids must be unique.");
  }
  if (!unique(graph.edges.map((edge) => edge.edge_id))) {
    addIssue(context, ["edges"], "Topology edge ids must be unique.");
  }
  if (!unique(graph.frontiers.map((frontier) => frontier.frontier_id))) {
    addIssue(context, ["frontiers"], "Topology frontier ids must be unique.");
  }
  graph.nodes.forEach((node, index) => {
    if (node.position.length !== graph.axes.length) {
      addIssue(
        context,
        ["nodes", index, "position"],
        "Node coordinates must match the graph dimension.",
      );
    }
  });
  graph.edges.forEach((edge, index) => {
    if (!nodes.has(edge.from_node_id) || !nodes.has(edge.to_node_id)) {
      addIssue(
        context,
        ["edges", index],
        "Topology edges must reference known nodes.",
      );
    }
    if (
      edge.valid_from_observation_revision >
        graph.identity.observation_revision ||
      edge.valid_through_observation_revision <
        graph.identity.observation_revision
    ) {
      addIssue(
        context,
        ["edges", index],
        "Topology edge must be valid at the graph observation revision.",
      );
    }
  });
  graph.frontiers.forEach((frontier, index) => {
    if (!nodes.has(frontier.at_node_id)) {
      addIssue(
        context,
        ["frontiers", index, "at_node_id"],
        "Topology frontier must reference a known observed node.",
      );
    }
  });
};

export const helixEnvironmentTopologyGraphSchema = topologyGraphBaseSchema
  .extend({ graph_hash: sha256Schema })
  .superRefine((graph, context) => {
    const { graph_hash: suppliedHash, ...withoutHash } = graph;
    if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
      addIssue(
        context,
        ["graph_hash"],
        "Topology graph hash does not match canonical semantic content.",
      );
    }
    validateTopologyGraph(withoutHash, context);
  });

export type HelixEnvironmentTopologyGraph = z.infer<
  typeof helixEnvironmentTopologyGraphSchema
>;

export const buildHelixEnvironmentTopologyGraph = (
  input: Omit<
    TopologyGraphBase,
    | "schema"
    | "adapter_strategy_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentTopologyGraph => {
  const base: TopologyGraphBase = {
    schema: HELIX_ENVIRONMENT_TOPOLOGY_GRAPH_SCHEMA,
    ...input,
    adapter_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentTopologyGraphSchema.parse({
    ...base,
    graph_hash: helixEnvironmentTimeSha256(base),
  });
};

const navigationDestinationSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("coordinate_radius"),
      coordinate: coordinateSchema,
      tolerance: z.number().finite().nonnegative(),
      metric: z.literal("euclidean"),
      terminal_orientation: coordinateSchema.nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("topology_node_set"),
      node_ids: z.array(identifierSchema).min(1).max(256),
    })
    .strict(),
  z
    .object({
      kind: z.literal("region_membership"),
      region_id: identifierSchema,
    })
    .strict(),
]);

const navigationBudgetsSchema = z
  .object({
    maximum_search_ms: z.number().int().positive().max(60_000),
    maximum_expanded_nodes: z.number().int().positive().max(10_000_000),
    maximum_memory_bytes: z
      .number()
      .int()
      .positive()
      .max(4 * 1024 ** 3),
    maximum_route_edges: z.number().int().positive().max(65_536),
    maximum_trajectory_units: z.number().int().positive().max(1_000_000),
    maximum_evidence_bytes: z
      .number()
      .int()
      .positive()
      .max(64 * 1024 ** 2),
  })
  .strict();

const navigationRequestBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_NAVIGATION_REQUEST_SCHEMA),
    request_id: identifierSchema,
    identity: helixEnvironmentNavigationIdentitySchema,
    created_at: timestampSchema,
    destination: navigationDestinationSchema,
    allowed_traversal_classes: z.array(identifierSchema).min(1).max(128),
    forbidden_region_ids: z.array(identifierSchema).max(256),
    cost_weights: z
      .record(identifierSchema, z.number().finite().nonnegative())
      .refine(
        (value) =>
          Object.keys(value).length > 0 && Object.keys(value).length <= 32,
      ),
    maximum_risk_score: z.number().finite().min(0).max(1),
    effect_ceiling: z.array(navigationEffectSchema).min(1).max(2),
    budgets: navigationBudgetsSchema,
    temporal_plan_id: identifierSchema,
    temporal_plan_hash: sha256Schema,
    observation_floor: sequenceSchema,
    monotonic_deadline_elapsed_ms: sequenceSchema,
    partial_progress_to_frontier: z.boolean(),
    automatic_replay: z.literal(false),
    movement_only: z.literal(true),
    planner_strategy_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type NavigationRequestBase = z.infer<typeof navigationRequestBaseSchema>;

const validateNavigationRequest = (
  value: NavigationRequestBase,
  context: z.RefinementCtx,
) => {
  if (!unique(value.allowed_traversal_classes)) {
    addIssue(
      context,
      ["allowed_traversal_classes"],
      "Allowed traversal classes must be unique.",
    );
  }
  if (!unique(value.forbidden_region_ids)) {
    addIssue(
      context,
      ["forbidden_region_ids"],
      "Forbidden region ids must be unique.",
    );
  }
  if (!unique(value.effect_ceiling.map((effect) => effect.effect_kind))) {
    addIssue(
      context,
      ["effect_ceiling"],
      "Effect ceiling kinds must be unique.",
    );
  }
  if (value.observation_floor > value.identity.observation_revision) {
    addIssue(
      context,
      ["observation_floor"],
      "Observation floor cannot exceed the request observation revision.",
    );
  }
};

export const helixEnvironmentNavigationRequestSchema =
  navigationRequestBaseSchema
    .extend({ request_hash: sha256Schema })
    .superRefine((request, context) => {
      const { request_hash: suppliedHash, ...withoutHash } = request;
      if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
        addIssue(
          context,
          ["request_hash"],
          "Navigation request hash does not match canonical semantic content.",
        );
      }
      validateNavigationRequest(withoutHash, context);
    });

export type HelixEnvironmentNavigationRequest = z.infer<
  typeof helixEnvironmentNavigationRequestSchema
>;

export const buildHelixEnvironmentNavigationRequest = (
  input: Omit<
    NavigationRequestBase,
    | "schema"
    | "automatic_replay"
    | "movement_only"
    | "planner_strategy_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentNavigationRequest => {
  const base: NavigationRequestBase = {
    schema: HELIX_ENVIRONMENT_NAVIGATION_REQUEST_SCHEMA,
    ...input,
    automatic_replay: false,
    movement_only: true,
    planner_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentNavigationRequestSchema.parse({
    ...base,
    request_hash: helixEnvironmentTimeSha256(base),
  });
};

export const helixEnvironmentNavigationCostPolicyHash = (
  request: HelixEnvironmentNavigationRequest,
) =>
  helixEnvironmentTimeSha256({
    allowed_traversal_classes: request.allowed_traversal_classes,
    forbidden_region_ids: request.forbidden_region_ids,
    cost_weights: request.cost_weights,
    maximum_risk_score: request.maximum_risk_score,
    effect_ceiling: request.effect_ceiling,
  });

const routeCheckpointSchema = z
  .object({
    checkpoint_id: identifierSchema,
    route_node_id: identifierSchema,
    expected_position: coordinateSchema,
    position_tolerance: z.number().finite().nonnegative(),
    earliest_environment_unit: sequenceSchema,
    latest_environment_unit: sequenceSchema,
    required_evidence_kinds: z.array(identifierSchema).min(1).max(32),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.latest_environment_unit < value.earliest_environment_unit) {
      addIssue(
        context,
        ["latest_environment_unit"],
        "Checkpoint window cannot end before it begins.",
      );
    }
  });

const trajectorySegmentSchema = z
  .object({
    segment_id: identifierSchema,
    from_node_id: identifierSchema,
    to_node_id: identifierSchema,
    edge_ids: z.array(identifierSchema).min(1).max(1_024),
    expected_start_state_hash: sha256Schema,
    start_environment_unit: sequenceSchema,
    stop_environment_unit: sequenceSchema,
    committed: z.boolean(),
    effect_budget: z.array(navigationEffectSchema).min(1).max(2),
    checkpoint_ids: z.array(identifierSchema).min(1).max(256),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.stop_environment_unit <= value.start_environment_unit) {
      addIssue(
        context,
        ["stop_environment_unit"],
        "Trajectory segment stop must follow its start.",
      );
    }
    if (!unique(value.edge_ids)) {
      addIssue(context, ["edge_ids"], "Segment edge ids must be unique.");
    }
    if (!unique(value.checkpoint_ids)) {
      addIssue(
        context,
        ["checkpoint_ids"],
        "Segment checkpoint ids must be unique.",
      );
    }
    if (!unique(value.effect_budget.map((effect) => effect.effect_kind))) {
      addIssue(
        context,
        ["effect_budget"],
        "Effect budget kinds must be unique.",
      );
    }
  });

const destinationSatisfactionSchema = z
  .object({
    route_node_id: identifierSchema,
    proof_kind: z.enum([
      "coordinate_metric",
      "topology_membership",
      "adapter_predicate",
    ]),
    evidence_refs: z.array(identifierSchema).min(1).max(64),
  })
  .strict();

const navigationPlanBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_NAVIGATION_PLAN_SCHEMA),
    plan_id: identifierSchema,
    previous_plan_hash: sha256Schema.nullable(),
    identity: helixEnvironmentNavigationIdentitySchema,
    request_id: identifierSchema,
    request_hash: sha256Schema,
    snapshot_id: identifierSchema,
    snapshot_hash: sha256Schema,
    graph_id: identifierSchema,
    graph_revision: sequenceSchema,
    graph_hash: sha256Schema,
    planner_id: identifierSchema,
    planner_version: identifierSchema,
    cost_policy_hash: sha256Schema,
    plan_kind: z.enum(HELIX_ENVIRONMENT_NAVIGATION_PLAN_KINDS),
    destination_satisfaction: destinationSatisfactionSchema.nullable(),
    route_node_ids: z.array(identifierSchema).min(1).max(65_537),
    route_edge_ids: z.array(identifierSchema).max(65_536),
    frontier_id: identifierSchema.nullable(),
    accumulated_costs: z.record(
      identifierSchema,
      z.number().finite().nonnegative(),
    ),
    accumulated_risk_score: z.number().finite().min(0).max(1),
    alternative_route_hashes: z.array(sha256Schema).max(32),
    checkpoints: z.array(routeCheckpointSchema).min(1).max(2_048),
    trajectory_segments: z.array(trajectorySegmentSchema).min(1).max(256),
    committed_through_environment_unit: sequenceSchema,
    decision_environment_unit: sequenceSchema,
    stop_environment_unit: sequenceSchema,
    monotonic_deadline_elapsed_ms: sequenceSchema,
    automatic_replay: z.literal(false),
    planner_strategy_authority: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type NavigationPlanBase = z.infer<typeof navigationPlanBaseSchema>;

const validateNavigationPlan = (
  value: NavigationPlanBase,
  context: z.RefinementCtx,
) => {
  if (!unique(value.route_node_ids)) {
    addIssue(context, ["route_node_ids"], "Route node ids must be unique.");
  }
  if (!unique(value.route_edge_ids)) {
    addIssue(context, ["route_edge_ids"], "Route edge ids must be unique.");
  }
  if (value.route_edge_ids.length !== value.route_node_ids.length - 1) {
    addIssue(
      context,
      ["route_edge_ids"],
      "A route must contain exactly one edge between consecutive nodes.",
    );
  }
  if (value.plan_kind === "complete_route" && value.frontier_id !== null) {
    addIssue(
      context,
      ["frontier_id"],
      "Complete routes cannot end at a frontier.",
    );
  }
  if (value.plan_kind === "partial_to_frontier" && value.frontier_id === null) {
    addIssue(context, ["frontier_id"], "Partial routes require a frontier.");
  }
  if (
    value.plan_kind === "complete_route" &&
    value.destination_satisfaction === null
  ) {
    addIssue(
      context,
      ["destination_satisfaction"],
      "Complete routes require destination-satisfaction evidence.",
    );
  }
  if (
    value.plan_kind === "partial_to_frontier" &&
    value.destination_satisfaction !== null
  ) {
    addIssue(
      context,
      ["destination_satisfaction"],
      "Partial routes cannot claim destination satisfaction.",
    );
  }
  if (
    value.decision_environment_unit > value.stop_environment_unit ||
    value.stop_environment_unit > value.committed_through_environment_unit
  ) {
    addIssue(
      context,
      ["committed_through_environment_unit"],
      "Plan watermarks must satisfy decision <= stop <= committed-through.",
    );
  }
  if (
    !unique(value.checkpoints.map((checkpoint) => checkpoint.checkpoint_id))
  ) {
    addIssue(context, ["checkpoints"], "Checkpoint ids must be unique.");
  }
  if (!unique(value.trajectory_segments.map((segment) => segment.segment_id))) {
    addIssue(context, ["trajectory_segments"], "Segment ids must be unique.");
  }
  const routeNodes = new Set(value.route_node_ids);
  const routeEdges = new Set(value.route_edge_ids);
  const checkpoints = new Set(
    value.checkpoints.map((checkpoint) => checkpoint.checkpoint_id),
  );
  if (
    value.destination_satisfaction !== null &&
    value.destination_satisfaction.route_node_id !== value.route_node_ids.at(-1)
  ) {
    addIssue(
      context,
      ["destination_satisfaction", "route_node_id"],
      "Destination evidence must bind the route terminal node.",
    );
  }
  value.checkpoints.forEach((checkpoint, index) => {
    if (!routeNodes.has(checkpoint.route_node_id)) {
      addIssue(
        context,
        ["checkpoints", index, "route_node_id"],
        "Checkpoint must reference a route node.",
      );
    }
  });
  value.trajectory_segments.forEach((segment, index) => {
    if (
      !routeNodes.has(segment.from_node_id) ||
      !routeNodes.has(segment.to_node_id) ||
      segment.edge_ids.some((edgeId) => !routeEdges.has(edgeId))
    ) {
      addIssue(
        context,
        ["trajectory_segments", index],
        "Trajectory segment must remain inside the route corridor.",
      );
    }
    if (
      segment.checkpoint_ids.some(
        (checkpointId) => !checkpoints.has(checkpointId),
      )
    ) {
      addIssue(
        context,
        ["trajectory_segments", index, "checkpoint_ids"],
        "Trajectory segment references an unknown checkpoint.",
      );
    }
    if (
      segment.stop_environment_unit > value.committed_through_environment_unit
    ) {
      addIssue(
        context,
        ["trajectory_segments", index, "stop_environment_unit"],
        "Trajectory segment exceeds the committed horizon.",
      );
    }
  });
};

export const helixEnvironmentNavigationPlanSchema = navigationPlanBaseSchema
  .extend({ plan_hash: sha256Schema })
  .superRefine((plan, context) => {
    const { plan_hash: suppliedHash, ...withoutHash } = plan;
    if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
      addIssue(
        context,
        ["plan_hash"],
        "Navigation plan hash does not match canonical semantic content.",
      );
    }
    validateNavigationPlan(withoutHash, context);
  });

export type HelixEnvironmentNavigationPlan = z.infer<
  typeof helixEnvironmentNavigationPlanSchema
>;

export const buildHelixEnvironmentNavigationPlan = (
  input: Omit<
    NavigationPlanBase,
    | "schema"
    | "automatic_replay"
    | "planner_strategy_authority"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentNavigationPlan => {
  const base: NavigationPlanBase = {
    schema: HELIX_ENVIRONMENT_NAVIGATION_PLAN_SCHEMA,
    ...input,
    automatic_replay: false,
    planner_strategy_authority: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentNavigationPlanSchema.parse({
    ...base,
    plan_hash: helixEnvironmentTimeSha256(base),
  });
};

export const validateHelixEnvironmentNavigationPlanContext = (input: {
  snapshot: HelixEnvironmentSpatialSnapshot;
  graph: HelixEnvironmentTopologyGraph;
  request: HelixEnvironmentNavigationRequest;
  plan: HelixEnvironmentNavigationPlan;
  monotonic_elapsed_ms: number;
}) => {
  const snapshot = helixEnvironmentSpatialSnapshotSchema.parse(input.snapshot);
  const graph = helixEnvironmentTopologyGraphSchema.parse(input.graph);
  const request = helixEnvironmentNavigationRequestSchema.parse(input.request);
  const plan = helixEnvironmentNavigationPlanSchema.parse(input.plan);
  const reasons: string[] = [];
  const identityKeys = Object.keys(plan.identity) as Array<
    keyof HelixEnvironmentNavigationIdentity
  >;
  for (const key of identityKeys) {
    if (
      snapshot.identity[key] !== plan.identity[key] ||
      graph.identity[key] !== plan.identity[key] ||
      request.identity[key] !== plan.identity[key]
    ) {
      reasons.push(`identity_mismatch:${key}`);
    }
  }
  if (
    graph.snapshot_id !== snapshot.snapshot_id ||
    graph.snapshot_hash !== snapshot.snapshot_hash
  ) {
    reasons.push("graph_snapshot_mismatch");
  }
  if (
    plan.snapshot_id !== snapshot.snapshot_id ||
    plan.snapshot_hash !== snapshot.snapshot_hash
  ) {
    reasons.push("plan_snapshot_mismatch");
  }
  if (
    plan.graph_id !== graph.graph_id ||
    plan.graph_revision !== graph.graph_revision ||
    plan.graph_hash !== graph.graph_hash
  ) {
    reasons.push("plan_graph_mismatch");
  }
  if (
    plan.request_id !== request.request_id ||
    plan.request_hash !== request.request_hash
  ) {
    reasons.push("plan_request_mismatch");
  }
  if (
    plan.cost_policy_hash !== helixEnvironmentNavigationCostPolicyHash(request)
  ) {
    reasons.push("cost_policy_mismatch");
  }
  if (request.observation_floor > snapshot.identity.observation_revision) {
    reasons.push("observation_below_floor");
  }
  if (
    input.monotonic_elapsed_ms >= request.monotonic_deadline_elapsed_ms ||
    input.monotonic_elapsed_ms >= plan.monotonic_deadline_elapsed_ms
  ) {
    reasons.push("deadline_expired");
  }

  const nodes = new Map(graph.nodes.map((node) => [node.node_id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.edge_id, edge]));
  plan.route_node_ids.forEach((nodeId) => {
    if (!nodes.has(nodeId)) reasons.push(`route_node_missing:${nodeId}`);
  });
  plan.route_edge_ids.forEach((edgeId, index) => {
    const edge = edges.get(edgeId);
    if (!edge) {
      reasons.push(`route_edge_missing:${edgeId}`);
      return;
    }
    if (
      edge.from_node_id !== plan.route_node_ids[index] ||
      edge.to_node_id !== plan.route_node_ids[index + 1]
    ) {
      reasons.push(`route_edge_disconnected:${edgeId}`);
    }
    if (!request.allowed_traversal_classes.includes(edge.traversal_class)) {
      reasons.push(`traversal_class_forbidden:${edge.traversal_class}`);
    }
    if (edge.risk_score > request.maximum_risk_score) {
      reasons.push(`risk_ceiling_exceeded:${edgeId}`);
    }
    const effectCeiling = new Map(
      request.effect_ceiling.map((effect) => [
        effect.effect_kind,
        effect.maximum_count,
      ]),
    );
    edge.required_effects.forEach((effect) => {
      if (
        (effectCeiling.get(effect.effect_kind) ?? -1) < effect.maximum_count
      ) {
        reasons.push(`effect_ceiling_exceeded:${effect.effect_kind}`);
      }
    });
  });
  if (plan.plan_kind === "partial_to_frontier") {
    if (!request.partial_progress_to_frontier) {
      reasons.push("partial_progress_not_admitted");
    }
    const frontier = graph.frontiers.find(
      (candidate) => candidate.frontier_id === plan.frontier_id,
    );
    if (!frontier) reasons.push("frontier_missing");
    else if (frontier.at_node_id !== plan.route_node_ids.at(-1)) {
      reasons.push("frontier_route_terminal_mismatch");
    }
  }
  if (request.destination.kind === "coordinate_radius") {
    if (request.destination.coordinate.length !== snapshot.bounds.axes.length) {
      reasons.push("destination_dimension_mismatch");
    } else if (plan.plan_kind === "complete_route") {
      const terminal = nodes.get(plan.route_node_ids.at(-1) ?? "");
      const distance = terminal
        ? Math.sqrt(
            terminal.position.reduce((sum, coordinate, index) => {
              const delta = coordinate - request.destination.coordinate[index];
              return sum + delta * delta;
            }, 0),
          )
        : Number.POSITIVE_INFINITY;
      if (distance > request.destination.tolerance) {
        reasons.push("complete_route_does_not_satisfy_destination");
      }
      if (plan.destination_satisfaction?.proof_kind !== "coordinate_metric") {
        reasons.push("destination_proof_kind_mismatch");
      }
    }
  } else if (request.destination.kind === "topology_node_set") {
    if (request.destination.node_ids.some((nodeId) => !nodes.has(nodeId))) {
      reasons.push("destination_node_missing");
    }
    if (
      plan.plan_kind === "complete_route" &&
      !request.destination.node_ids.includes(plan.route_node_ids.at(-1) ?? "")
    ) {
      reasons.push("complete_route_does_not_satisfy_destination");
    }
    if (
      plan.plan_kind === "complete_route" &&
      plan.destination_satisfaction?.proof_kind !== "topology_membership"
    ) {
      reasons.push("destination_proof_kind_mismatch");
    }
  } else if (
    plan.plan_kind === "complete_route" &&
    plan.destination_satisfaction?.proof_kind !== "adapter_predicate"
  ) {
    reasons.push("destination_proof_kind_mismatch");
  }
  plan.checkpoints.forEach((checkpoint) => {
    if (checkpoint.expected_position.length !== graph.axes.length) {
      reasons.push(`checkpoint_dimension_mismatch:${checkpoint.checkpoint_id}`);
    }
  });
  return {
    valid: reasons.length === 0,
    reasons: [...new Set(reasons)].sort(),
  } as const;
};

const navigationFeedbackBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_NAVIGATION_FEEDBACK_SCHEMA),
    feedback_id: identifierSchema,
    identity: helixEnvironmentNavigationIdentitySchema,
    plan_id: identifierSchema,
    plan_hash: sha256Schema,
    segment_id: identifierSchema.nullable(),
    checkpoint_id: identifierSchema.nullable(),
    kind: z.enum(HELIX_ENVIRONMENT_NAVIGATION_FEEDBACK_KINDS),
    disposition: z.enum(HELIX_ENVIRONMENT_NAVIGATION_DISPOSITIONS),
    observed_at: timestampSchema,
    clocks: helixEnvironmentThreeClockSchema,
    evidence_refs: z.array(identifierSchema).min(1).max(256),
    details: boundedRecordSchema(16 * 1024),
    controls_released: z.boolean(),
    changed_strategy: z.literal(false),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type NavigationFeedbackBase = z.infer<typeof navigationFeedbackBaseSchema>;

const validateNavigationFeedback = (
  value: NavigationFeedbackBase,
  context: z.RefinementCtx,
) => {
  if (
    value.disposition === "release_controls" &&
    value.controls_released !== true
  ) {
    addIssue(
      context,
      ["controls_released"],
      "Release disposition requires released controls.",
    );
  }
  if (
    [
      "manual_input_detected",
      "authority_changed",
      "producer_epoch_changed",
    ].includes(value.kind) &&
    !["hold_safe", "release_controls"].includes(value.disposition)
  ) {
    addIssue(
      context,
      ["disposition"],
      "Manual or authority invalidation must hold or release controls.",
    );
  }
};

export const helixEnvironmentNavigationFeedbackSchema =
  navigationFeedbackBaseSchema
    .extend({ feedback_hash: sha256Schema })
    .superRefine((feedback, context) => {
      const { feedback_hash: suppliedHash, ...withoutHash } = feedback;
      if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
        addIssue(
          context,
          ["feedback_hash"],
          "Navigation feedback hash does not match canonical semantic content.",
        );
      }
      validateNavigationFeedback(withoutHash, context);
    });

export type HelixEnvironmentNavigationFeedback = z.infer<
  typeof helixEnvironmentNavigationFeedbackSchema
>;

export const buildHelixEnvironmentNavigationFeedback = (
  input: Omit<
    NavigationFeedbackBase,
    | "schema"
    | "changed_strategy"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentNavigationFeedback => {
  const base: NavigationFeedbackBase = {
    schema: HELIX_ENVIRONMENT_NAVIGATION_FEEDBACK_SCHEMA,
    ...input,
    changed_strategy: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentNavigationFeedbackSchema.parse({
    ...base,
    feedback_hash: helixEnvironmentTimeSha256(base),
  });
};

const benchmarkEngineSchema = z
  .object({
    engine_id: identifierSchema,
    engine_version: boundedLabelSchema,
    artifact_sha256: sha256Schema,
  })
  .strict();

const benchmarkProtocolBaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_SCHEMA),
    protocol_id: identifierSchema,
    created_at: timestampSchema,
    owned_engine: benchmarkEngineSchema,
    reference_engine: benchmarkEngineSchema.extend({
      execution_mode: z.literal("isolated_black_box"),
      shipping_dependency: z.literal(false),
      source_code_consulted: z.literal(false),
      api_or_structure_copied: z.literal(false),
    }),
    frozen_conditions: boundedRecordSchema(64 * 1024),
    training_course_ids: z.array(identifierSchema).min(1).max(1_024),
    held_out_course_ids: z.array(identifierSchema).min(1).max(1_024),
    metrics: z.array(z.enum(HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS)),
    minimum_repetitions_per_course: z.number().int().positive().max(10_000),
    held_out_tuning_prohibited: z.literal(true),
    shipping_artifact_exclusion_required: z.literal(true),
    course_specific_claims_only: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

type BenchmarkProtocolBase = z.infer<typeof benchmarkProtocolBaseSchema>;

const validateBenchmarkProtocol = (
  value: BenchmarkProtocolBase,
  context: z.RefinementCtx,
) => {
  if (
    !unique(value.training_course_ids) ||
    !unique(value.held_out_course_ids)
  ) {
    addIssue(context, ["training_course_ids"], "Course ids must be unique.");
  }
  const training = new Set(value.training_course_ids);
  if (value.held_out_course_ids.some((courseId) => training.has(courseId))) {
    addIssue(
      context,
      ["held_out_course_ids"],
      "Training and held-out courses must be disjoint.",
    );
  }
  if (!unique(value.metrics)) {
    addIssue(context, ["metrics"], "Benchmark metrics must be unique.");
  }
  const supplied = new Set(value.metrics);
  const missing = HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS.filter(
    (metric) => !supplied.has(metric),
  );
  if (missing.length > 0) {
    addIssue(
      context,
      ["metrics"],
      `Benchmark protocol is missing required metrics: ${missing.join(", ")}.`,
    );
  }
};

export const helixEnvironmentNavigationBenchmarkProtocolSchema =
  benchmarkProtocolBaseSchema
    .extend({ protocol_hash: sha256Schema })
    .superRefine((protocol, context) => {
      const { protocol_hash: suppliedHash, ...withoutHash } = protocol;
      if (helixEnvironmentTimeSha256(withoutHash) !== suppliedHash) {
        addIssue(
          context,
          ["protocol_hash"],
          "Benchmark protocol hash does not match canonical semantic content.",
        );
      }
      validateBenchmarkProtocol(withoutHash, context);
    });

export type HelixEnvironmentNavigationBenchmarkProtocol = z.infer<
  typeof helixEnvironmentNavigationBenchmarkProtocolSchema
>;

export const buildHelixEnvironmentNavigationBenchmarkProtocol = (
  input: Omit<
    BenchmarkProtocolBase,
    | "schema"
    | "held_out_tuning_prohibited"
    | "shipping_artifact_exclusion_required"
    | "course_specific_claims_only"
    | "answer_authority"
    | "assistant_answer"
    | "terminal_eligible"
  >,
): HelixEnvironmentNavigationBenchmarkProtocol => {
  const base: BenchmarkProtocolBase = {
    schema: HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_SCHEMA,
    ...input,
    held_out_tuning_prohibited: true,
    shipping_artifact_exclusion_required: true,
    course_specific_claims_only: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  };
  return helixEnvironmentNavigationBenchmarkProtocolSchema.parse({
    ...base,
    protocol_hash: helixEnvironmentTimeSha256(base),
  });
};
