import { describe, expect, it } from "vitest";

import {
  HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS,
  buildHelixEnvironmentNavigationBenchmarkProtocol,
  buildHelixEnvironmentNavigationFeedback,
  buildHelixEnvironmentNavigationPlan,
  buildHelixEnvironmentNavigationRequest,
  buildHelixEnvironmentSpatialSnapshot,
  buildHelixEnvironmentTopologyGraph,
  helixEnvironmentNavigationCostPolicyHash,
  helixEnvironmentNavigationBenchmarkProtocolSchema,
  helixEnvironmentNavigationPlanSchema,
  helixEnvironmentNavigationRequestSchema,
  helixEnvironmentSpatialSnapshotSchema,
  helixEnvironmentTopologyGraphSchema,
  validateHelixEnvironmentNavigationPlanContext,
  type HelixEnvironmentNavigationIdentity,
} from "../helix-environment-navigation";
import { helixEnvironmentTimeSha256 } from "../helix-environment-time";

const hash = (value: string) => helixEnvironmentTimeSha256({ value });

const identity: HelixEnvironmentNavigationIdentity = {
  environment_id: "environment:test",
  source_id: "source:test",
  subject_id: "subject:test",
  producer_epoch: "producer:1",
  coordinate_frame_id: "frame:world",
  observation_revision: 7,
  authority_id: "authority:test",
  authority_revision: 3,
};

const clocks = {
  environment: {
    kind: "simulation_step" as const,
    sequence: 70,
    resolution_unit: "step",
    nominal_units_per_second: 20,
  },
  monotonic: {
    origin_id: "origin:test",
    elapsed_ms: 1_000,
  },
  audit_at: "2026-09-03T20:00:00.000Z",
};

const makeSnapshot = (overrides: Record<string, unknown> = {}) =>
  buildHelixEnvironmentSpatialSnapshot({
    snapshot_id: "snapshot:1",
    identity,
    clocks,
    captured_at: "2026-09-03T20:00:00.000Z",
    bounds: {
      axes: ["axis:a", "axis:b", "axis:c"],
      minimum: [0, 0, 0],
      maximum: [8, 8, 8],
    },
    coverage_state: "partial_with_unknown_regions",
    unknown_region_ids: ["region:unknown:1"],
    features: [
      {
        feature_id: "feature:surface:1",
        feature_kind: "surface:support",
        centroid: [0, 0, 0],
        geometry: { shape: "adapter_defined" },
        dynamic: false,
        traversability: "traversable",
        hazard_ids: [],
        evidence_refs: ["evidence:snapshot:1"],
      },
    ],
    frontiers: [
      {
        frontier_id: "frontier:1",
        position: [2, 0, 0],
        reason: "coverage_boundary",
        evidence_refs: ["evidence:frontier:1"],
      },
    ],
    adapter_profile: { representation: "test_fixture" },
    ...overrides,
  });

const makeGraph = (
  snapshot = makeSnapshot(),
  overrides: Record<string, unknown> = {},
) =>
  buildHelixEnvironmentTopologyGraph({
    graph_id: "graph:1",
    graph_revision: 2,
    identity: snapshot.identity,
    snapshot_id: snapshot.snapshot_id,
    snapshot_hash: snapshot.snapshot_hash,
    previous_graph_hash: null,
    axes: snapshot.bounds.axes,
    nodes: [
      {
        node_id: "node:start",
        position: [0, 0, 0],
        node_class: "state:grounded",
        state: {},
        evidence_refs: ["evidence:node:start"],
      },
      {
        node_id: "node:goal",
        position: [2, 0, 0],
        node_class: "state:grounded",
        state: {},
        evidence_refs: ["evidence:node:goal"],
      },
    ],
    edges: [
      {
        edge_id: "edge:1",
        from_node_id: "node:start",
        to_node_id: "node:goal",
        traversal_class: "traversal:walk",
        estimated_costs: { distance: 2, duration: 3 },
        risk_score: 0.05,
        reversible: true,
        required_effects: [{ effect_kind: "locomotion", maximum_count: 1 }],
        valid_from_observation_revision: 7,
        valid_through_observation_revision: 7,
        evidence_refs: ["evidence:edge:1"],
      },
    ],
    frontiers: [
      {
        frontier_id: "frontier:1",
        at_node_id: "node:goal",
        reason: "coverage_boundary",
        evidence_refs: ["evidence:frontier:1"],
      },
    ],
    adapter_profile_id: "profile:test",
    ...overrides,
  });

const makeRequest = (overrides: Record<string, unknown> = {}) =>
  buildHelixEnvironmentNavigationRequest({
    request_id: "request:1",
    identity,
    created_at: "2026-09-03T20:00:00.000Z",
    destination: {
      kind: "topology_node_set",
      node_ids: ["node:goal"],
    },
    allowed_traversal_classes: ["traversal:walk"],
    forbidden_region_ids: [],
    cost_weights: { distance: 1, duration: 0.25, risk: 4 },
    maximum_risk_score: 0.25,
    effect_ceiling: [
      { effect_kind: "locomotion", maximum_count: 16 },
      { effect_kind: "orientation", maximum_count: 16 },
    ],
    budgets: {
      maximum_search_ms: 50,
      maximum_expanded_nodes: 10_000,
      maximum_memory_bytes: 16 * 1024 * 1024,
      maximum_route_edges: 1_024,
      maximum_trajectory_units: 40,
      maximum_evidence_bytes: 1024 * 1024,
    },
    temporal_plan_id: "temporal-plan:1",
    temporal_plan_hash: hash("temporal-plan"),
    observation_floor: 7,
    monotonic_deadline_elapsed_ms: 10_000,
    partial_progress_to_frontier: true,
    ...overrides,
  });

const makePlan = (
  snapshot = makeSnapshot(),
  graph = makeGraph(snapshot),
  request = makeRequest(),
  overrides: Record<string, unknown> = {},
) =>
  buildHelixEnvironmentNavigationPlan({
    plan_id: "navigation-plan:1",
    previous_plan_hash: null,
    identity,
    request_id: request.request_id,
    request_hash: request.request_hash,
    snapshot_id: snapshot.snapshot_id,
    snapshot_hash: snapshot.snapshot_hash,
    graph_id: graph.graph_id,
    graph_revision: graph.graph_revision,
    graph_hash: graph.graph_hash,
    planner_id: "planner:owned:test",
    planner_version: "0.0.1",
    cost_policy_hash: helixEnvironmentNavigationCostPolicyHash(request),
    plan_kind: "complete_route",
    destination_satisfaction: {
      route_node_id: "node:goal",
      proof_kind: "topology_membership",
      evidence_refs: ["evidence:destination:goal"],
    },
    route_node_ids: ["node:start", "node:goal"],
    route_edge_ids: ["edge:1"],
    frontier_id: null,
    accumulated_costs: { distance: 2, duration: 3 },
    accumulated_risk_score: 0.05,
    alternative_route_hashes: [],
    checkpoints: [
      {
        checkpoint_id: "checkpoint:goal",
        route_node_id: "node:goal",
        expected_position: [2, 0, 0],
        position_tolerance: 0.25,
        earliest_environment_unit: 1,
        latest_environment_unit: 5,
        required_evidence_kinds: ["evidence:pose"],
      },
    ],
    trajectory_segments: [
      {
        segment_id: "segment:1",
        from_node_id: "node:start",
        to_node_id: "node:goal",
        edge_ids: ["edge:1"],
        expected_start_state_hash: hash("start-state"),
        start_environment_unit: 0,
        stop_environment_unit: 4,
        committed: true,
        effect_budget: [
          { effect_kind: "locomotion", maximum_count: 1 },
          { effect_kind: "orientation", maximum_count: 1 },
        ],
        checkpoint_ids: ["checkpoint:goal"],
      },
    ],
    committed_through_environment_unit: 6,
    decision_environment_unit: 2,
    stop_environment_unit: 4,
    monotonic_deadline_elapsed_ms: 9_000,
    ...overrides,
  });

const makeBenchmark = (overrides: Record<string, unknown> = {}) =>
  buildHelixEnvironmentNavigationBenchmarkProtocol({
    protocol_id: "benchmark:navigation:1",
    created_at: "2026-09-03T20:00:00.000Z",
    owned_engine: {
      engine_id: "engine:casimirbot-owned",
      engine_version: "0.0.1",
      artifact_sha256: hash("owned"),
    },
    reference_engine: {
      engine_id: "engine:reference",
      engine_version: "evaluation-version",
      artifact_sha256: hash("reference"),
      execution_mode: "isolated_black_box",
      shipping_dependency: false,
      source_code_consulted: false,
      api_or_structure_copied: false,
    },
    frozen_conditions: {
      world_snapshot: "snapshot:test",
      game_profile: "movement_only",
      hardware_profile: "host:test",
    },
    training_course_ids: ["course:training:1"],
    held_out_course_ids: ["course:held-out:1"],
    metrics: [...HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS],
    minimum_repetitions_per_course: 5,
    ...overrides,
  });

describe("environment-neutral navigation contracts", () => {
  it("builds hash-bound spatial, topology, request and plan contracts", () => {
    const snapshot = makeSnapshot();
    const graph = makeGraph(snapshot);
    const request = makeRequest();
    const plan = makePlan(snapshot, graph, request);

    expect(helixEnvironmentSpatialSnapshotSchema.parse(snapshot)).toEqual(
      snapshot,
    );
    expect(helixEnvironmentTopologyGraphSchema.parse(graph)).toEqual(graph);
    expect(helixEnvironmentNavigationRequestSchema.parse(request)).toEqual(
      request,
    );
    expect(helixEnvironmentNavigationPlanSchema.parse(plan)).toEqual(plan);
    expect(
      validateHelixEnvironmentNavigationPlanContext({
        snapshot,
        graph,
        request,
        plan,
        monotonic_elapsed_ms: 2_000,
      }),
    ).toEqual({ valid: true, reasons: [] });
  });

  it("rejects hash tampering", () => {
    const snapshot = makeSnapshot();
    expect(
      helixEnvironmentSpatialSnapshotSchema.safeParse({
        ...snapshot,
        captured_at: "2026-09-03T20:00:01.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects false complete coverage and coordinate dimension drift", () => {
    expect(() =>
      makeSnapshot({
        coverage_state: "complete_within_bounds",
        unknown_region_ids: ["region:still-unknown"],
      }),
    ).toThrow();
    expect(() =>
      makeSnapshot({
        features: [
          {
            feature_id: "feature:bad",
            feature_kind: "surface:test",
            centroid: [0, 0],
            geometry: {},
            dynamic: false,
            traversability: "unknown",
            hazard_ids: [],
            evidence_refs: ["evidence:bad"],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects dangling topology and edges stale at the graph revision", () => {
    expect(() =>
      makeGraph(makeSnapshot(), {
        edges: [
          {
            edge_id: "edge:dangling",
            from_node_id: "node:start",
            to_node_id: "node:absent",
            traversal_class: "traversal:walk",
            estimated_costs: { distance: 1 },
            risk_score: 0,
            reversible: true,
            required_effects: [{ effect_kind: "locomotion", maximum_count: 1 }],
            valid_from_observation_revision: 7,
            valid_through_observation_revision: 7,
            evidence_refs: ["evidence:dangling"],
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      makeGraph(makeSnapshot(), {
        edges: [
          {
            edge_id: "edge:stale",
            from_node_id: "node:start",
            to_node_id: "node:goal",
            traversal_class: "traversal:walk",
            estimated_costs: { distance: 1 },
            risk_score: 0,
            reversible: true,
            required_effects: [{ effect_kind: "locomotion", maximum_count: 1 }],
            valid_from_observation_revision: 1,
            valid_through_observation_revision: 6,
            evidence_refs: ["evidence:stale"],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects hidden non-navigation effects and future observation floors", () => {
    expect(
      helixEnvironmentNavigationRequestSchema.safeParse({
        ...makeRequest(),
        effect_ceiling: [{ effect_kind: "world_mutation", maximum_count: 1 }],
      }).success,
    ).toBe(false);
    expect(() => makeRequest({ observation_floor: 8 })).toThrow();
  });

  it("rejects malformed route corridors and unbound checkpoints", () => {
    expect(() =>
      makePlan(undefined, undefined, undefined, { route_edge_ids: [] }),
    ).toThrow();
    expect(() =>
      makePlan(undefined, undefined, undefined, {
        checkpoints: [
          {
            checkpoint_id: "checkpoint:elsewhere",
            route_node_id: "node:not-on-route",
            expected_position: [1, 1, 1],
            position_tolerance: 0.25,
            earliest_environment_unit: 1,
            latest_environment_unit: 2,
            required_evidence_kinds: ["evidence:pose"],
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      makePlan(undefined, undefined, undefined, {
        destination_satisfaction: null,
      }),
    ).toThrow();
  });

  it("fails context validation for disconnected, forbidden, risky or stale routes", () => {
    const snapshot = makeSnapshot();
    const graph = makeGraph(snapshot);
    const request = makeRequest({
      allowed_traversal_classes: ["traversal:other"],
      maximum_risk_score: 0.01,
    });
    const plan = makePlan(snapshot, graph, request);
    const result = validateHelixEnvironmentNavigationPlanContext({
      snapshot,
      graph,
      request,
      plan,
      monotonic_elapsed_ms: 10_000,
    });
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("deadline_expired");
    expect(result.reasons).toContain("risk_ceiling_exceeded:edge:1");
    expect(result.reasons).toContain(
      "traversal_class_forbidden:traversal:walk",
    );
  });

  it("fails stale identity and cost-policy substitution", () => {
    const snapshot = makeSnapshot();
    const graph = makeGraph(snapshot);
    const request = makeRequest();
    const plan = makePlan(snapshot, graph, request, {
      identity: { ...identity, producer_epoch: "producer:stale" },
      cost_policy_hash: hash("substituted-cost-policy"),
    });
    const result = validateHelixEnvironmentNavigationPlanContext({
      snapshot,
      graph,
      request,
      plan,
      monotonic_elapsed_ms: 2_000,
    });
    expect(result.reasons).toContain("identity_mismatch:producer_epoch");
    expect(result.reasons).toContain("cost_policy_mismatch");
  });

  it("verifies coordinate-radius satisfaction against the terminal node", () => {
    const snapshot = makeSnapshot();
    const graph = makeGraph(snapshot);
    const request = makeRequest({
      destination: {
        kind: "coordinate_radius",
        coordinate: [2, 0, 0],
        tolerance: 0.25,
        metric: "euclidean",
        terminal_orientation: null,
      },
    });
    const plan = makePlan(snapshot, graph, request, {
      destination_satisfaction: {
        route_node_id: "node:goal",
        proof_kind: "coordinate_metric",
        evidence_refs: ["evidence:destination:coordinate"],
      },
    });
    expect(
      validateHelixEnvironmentNavigationPlanContext({
        snapshot,
        graph,
        request,
        plan,
        monotonic_elapsed_ms: 2_000,
      }),
    ).toEqual({ valid: true, reasons: [] });
  });

  it("requires explicit admission for a partial route to a declared frontier", () => {
    const snapshot = makeSnapshot();
    const graph = makeGraph(snapshot);
    const request = makeRequest({ partial_progress_to_frontier: false });
    const plan = makePlan(snapshot, graph, request, {
      plan_kind: "partial_to_frontier",
      frontier_id: "frontier:1",
      destination_satisfaction: null,
    });
    expect(
      validateHelixEnvironmentNavigationPlanContext({
        snapshot,
        graph,
        request,
        plan,
        monotonic_elapsed_ms: 2_000,
      }).reasons,
    ).toContain("partial_progress_not_admitted");
  });

  it("forces manual input and authority changes to hold or release", () => {
    expect(() =>
      buildHelixEnvironmentNavigationFeedback({
        feedback_id: "feedback:manual",
        identity,
        plan_id: "navigation-plan:1",
        plan_hash: hash("plan"),
        segment_id: "segment:1",
        checkpoint_id: null,
        kind: "manual_input_detected",
        disposition: "continue_committed_horizon",
        observed_at: "2026-09-03T20:00:01.000Z",
        clocks,
        evidence_refs: ["evidence:manual"],
        details: {},
        controls_released: false,
      }),
    ).toThrow();

    expect(
      buildHelixEnvironmentNavigationFeedback({
        feedback_id: "feedback:release",
        identity,
        plan_id: "navigation-plan:1",
        plan_hash: hash("plan"),
        segment_id: "segment:1",
        checkpoint_id: null,
        kind: "authority_changed",
        disposition: "release_controls",
        observed_at: "2026-09-03T20:00:01.000Z",
        clocks,
        evidence_refs: ["evidence:authority"],
        details: {},
        controls_released: true,
      }).changed_strategy,
    ).toBe(false);
  });

  it("accepts a non-voxel, navmesh-shaped adapter fixture", () => {
    const snapshot = makeSnapshot({
      bounds: {
        axes: ["east", "north", "altitude"],
        minimum: [-100, -100, 0],
        maximum: [100, 100, 50],
      },
      adapter_profile: {
        representation: "navigation_mesh",
        coverage_loaded: true,
        actor_kind: "pedestrian",
      },
    });
    const graph = makeGraph(snapshot, {
      adapter_profile_id: "profile:polygon-corridor",
      axes: ["east", "north", "altitude"],
      nodes: [
        {
          node_id: "node:start",
          position: [0, 0, 0],
          node_class: "polygon:walkable",
          state: { corridor_id: "corridor:1" },
          evidence_refs: ["evidence:polygon:start"],
        },
        {
          node_id: "node:goal",
          position: [2, 0, 0],
          node_class: "polygon:walkable",
          state: { corridor_id: "corridor:1" },
          evidence_refs: ["evidence:polygon:goal"],
        },
      ],
    });
    expect(graph.adapter_profile_id).toBe("profile:polygon-corridor");
  });
});

describe("clean-room navigation benchmark protocol", () => {
  it("seals all required metrics and black-box boundaries", () => {
    const protocol = makeBenchmark();
    expect(
      helixEnvironmentNavigationBenchmarkProtocolSchema.parse(protocol),
    ).toEqual(protocol);
    expect(protocol.metrics).toEqual(
      HELIX_ENVIRONMENT_NAVIGATION_BENCHMARK_METRICS,
    );
    expect(protocol.reference_engine.shipping_dependency).toBe(false);
  });

  it("rejects training/held-out overlap", () => {
    expect(() =>
      makeBenchmark({ held_out_course_ids: ["course:training:1"] }),
    ).toThrow();
  });

  it("rejects missing metrics and contaminated reference use", () => {
    expect(() => makeBenchmark({ metrics: ["goal_completion"] })).toThrow();
    const protocol = makeBenchmark();
    expect(
      helixEnvironmentNavigationBenchmarkProtocolSchema.safeParse({
        ...protocol,
        reference_engine: {
          ...protocol.reference_engine,
          source_code_consulted: true,
        },
      }).success,
    ).toBe(false);
    expect(
      helixEnvironmentNavigationBenchmarkProtocolSchema.safeParse({
        ...protocol,
        reference_engine: {
          ...protocol.reference_engine,
          shipping_dependency: true,
        },
      }).success,
    ).toBe(false);
  });
});
