import {
  runConstraintLoop,
  type ConstraintLoopAttempt,
  type ConstraintLoopGate,
  type ConstraintLoopHandlers,
  type ConstraintLoopResult,
} from "./constraint-loop.js";

export type BeliefNode = {
  id: string;
  score: number;
  fixed?: boolean;
};

export type BeliefEdgeKind = "implies" | "excludes";

export type BeliefEdge = {
  from: string;
  to: string;
  kind: BeliefEdgeKind;
  weight?: number;
};

export type BeliefGraphState = {
  nodes: BeliefNode[];
  edges: BeliefEdge[];
};

export type BeliefGraphDerivatives = {
  pressure: Float32Array;
};

export type BeliefGraphConstraints = {
  violationCount: number;
  violationWeight: number;
  axiomViolations: number;
  impliesViolations: number;
  excludesViolations: number;
  maxAbsPressure: number;
};

export type BeliefGraphThresholds = {
  violationMax: number;
  violationWeightMax: number;
};

export type BeliefGraphLoopOptions = {
  graph?: BeliefGraphState;
  maxIterations?: number;
  stepSize?: number;
  thresholds?: Partial<BeliefGraphThresholds>;
  scoreClamp?: { min: number; max: number };
};

export type BeliefGraphAttempt = ConstraintLoopAttempt<
  BeliefGraphState,
  BeliefGraphDerivatives,
  BeliefGraphConstraints
>;

export type BeliefGraphLoopResult = ConstraintLoopResult<
  BeliefGraphState,
  BeliefGraphDerivatives,
  BeliefGraphConstraints
>;

const DEFAULT_THRESHOLDS: BeliefGraphThresholds = {
  violationMax: 0,
  violationWeightMax: 0,
};

const DEFAULT_GRAPH: BeliefGraphState = {
  nodes: [
    { id: "axiom:a", score: 1, fixed: true },
    { id: "b", score: -0.2 },
    { id: "c", score: 0.4 },
  ],
  edges: [
    { from: "axiom:a", to: "b", kind: "implies", weight: 1 },
    { from: "b", to: "c", kind: "excludes", weight: 0.8 },
  ],
};

const cloneGraphState = (state: BeliefGraphState): BeliefGraphState => ({
  nodes: state.nodes.map((node) => ({ ...node })),
  edges: state.edges.map((edge) => ({ ...edge })),
});

const clampScore = (value: number, clamp?: { min: number; max: number }): number => {
  if (!Number.isFinite(value)) return 0;
  if (!clamp) return value;
  return Math.min(clamp.max, Math.max(clamp.min, value));
};

const indexNodes = (nodes: BeliefNode[]): Map<string, number> => {
  const map = new Map<string, number>();
  nodes.forEach((node, idx) => {
    map.set(node.id, idx);
  });
  return map;
};

const isTrue = (score: number): boolean => score > 0;

export const computeBeliefDerivatives = (state: BeliefGraphState): BeliefGraphDerivatives => {
  const { nodes, edges } = state;
  const pressure = new Float32Array(nodes.length);
  const index = indexNodes(nodes);

  nodes.forEach((node, idx) => {
    if (node.fixed === true && node.score < 0) {
      pressure[idx] += 1;
    } else if (node.fixed === false && node.score > 0) {
      pressure[idx] -= 1;
    }
  });

  for (const edge of edges) {
    const fromIdx = index.get(edge.from);
    const toIdx = index.get(edge.to);
    if (fromIdx === undefined || toIdx === undefined) continue;
    const weight = edge.weight ?? 1;
    const fromScore = nodes[fromIdx]?.score ?? 0;
    const toScore = nodes[toIdx]?.score ?? 0;

    if (edge.kind === "implies") {
      if (isTrue(fromScore) && !isTrue(toScore)) {
        pressure[toIdx] += weight;
        pressure[fromIdx] -= weight * 0.5;
      }
    } else if (edge.kind === "excludes") {
      if (isTrue(fromScore) && isTrue(toScore)) {
        pressure[fromIdx] -= weight;
        pressure[toIdx] -= weight;
      }
    }
  }

  return { pressure };
};

export const evaluateBeliefGraph = (
  state: BeliefGraphState,
  derivatives: BeliefGraphDerivatives,
): BeliefGraphConstraints => {
  const { nodes, edges } = state;
  const index = indexNodes(nodes);
  let violationCount = 0;
  let violationWeight = 0;
  let axiomViolations = 0;
  let impliesViolations = 0;
  let excludesViolations = 0;

  nodes.forEach((node) => {
    if (node.fixed === true && node.score < 0) {
      violationCount += 1;
      axiomViolations += 1;
      violationWeight += 1;
    } else if (node.fixed === false && node.score > 0) {
      violationCount += 1;
      axiomViolations += 1;
      violationWeight += 1;
    }
  });

  for (const edge of edges) {
    const fromIdx = index.get(edge.from);
    const toIdx = index.get(edge.to);
    if (fromIdx === undefined || toIdx === undefined) continue;
    const weight = edge.weight ?? 1;
    const fromScore = nodes[fromIdx]?.score ?? 0;
    const toScore = nodes[toIdx]?.score ?? 0;

    if (edge.kind === "implies") {
      if (isTrue(fromScore) && !isTrue(toScore)) {
        violationCount += 1;
        impliesViolations += 1;
        violationWeight += weight;
      }
    } else if (edge.kind === "excludes") {
      if (isTrue(fromScore) && isTrue(toScore)) {
        violationCount += 1;
        excludesViolations += 1;
        violationWeight += weight;
      }
    }
  }

  let maxAbsPressure = 0;
  for (let i = 0; i < derivatives.pressure.length; i += 1) {
    const abs = Math.abs(derivatives.pressure[i] ?? 0);
    if (abs > maxAbsPressure) maxAbsPressure = abs;
  }

  return {
    violationCount,
    violationWeight,
    axiomViolations,
    impliesViolations,
    excludesViolations,
    maxAbsPressure,
  };
};

const buildGate = (
  constraints: BeliefGraphConstraints,
  thresholds: BeliefGraphThresholds,
): ConstraintLoopGate => {
  const pass =
    constraints.violationCount <= thresholds.violationMax &&
    constraints.violationWeight <= thresholds.violationWeightMax;
  return {
    status: pass ? "pass" : "fail",
    residuals: {
      violationCount: constraints.violationCount,
      violationWeight: constraints.violationWeight,
      axiomViolations: constraints.axiomViolations,
      impliesViolations: constraints.impliesViolations,
      excludesViolations: constraints.excludesViolations,
      maxAbsPressure: constraints.maxAbsPressure,
    },
  };
};

const stepBeliefGraph = (
  state: BeliefGraphState,
  derivatives: BeliefGraphDerivatives,
  stepSize: number,
  clamp?: { min: number; max: number },
): BeliefGraphState => {
  const nextNodes = state.nodes.map((node, idx) => {
    const fixedValue =
      node.fixed === true ? 1 : node.fixed === false ? -1 : undefined;
    const updated = fixedValue ?? (node.score + stepSize * derivatives.pressure[idx]);
    return {
      ...node,
      score: clampScore(updated, clamp),
    };
  });
  return { nodes: nextNodes, edges: state.edges.map((edge) => ({ ...edge })) };
};

export function runBeliefGraphLoop(
  options: BeliefGraphLoopOptions = {},
): BeliefGraphLoopResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds ?? {}) };
  const stepSize = options.stepSize ?? 0.25;
  const graph = options.graph ? cloneGraphState(options.graph) : cloneGraphState(DEFAULT_GRAPH);

  const handlers: ConstraintLoopHandlers<
    BeliefGraphState,
    BeliefGraphDerivatives,
    BeliefGraphConstraints
  > = {
    derive: (state) => computeBeliefDerivatives(state),
    constrain: (state, derivatives) => evaluateBeliefGraph(state, derivatives),
    gate: (constraints) => buildGate(constraints, thresholds),
    step: (state, derivatives) =>
      stepBeliefGraph(state, derivatives, stepSize, options.scoreClamp),
    cloneState: cloneGraphState,
    capture: ({ state, derivatives, constraints }) => ({
      state: cloneGraphState(state),
      derivatives: { pressure: new Float32Array(derivatives.pressure) },
      constraints: { ...constraints },
    }),
  };

  return runConstraintLoop({
    initialState: graph,
    maxIterations: options.maxIterations ?? 6,
    handlers,
  });
}
