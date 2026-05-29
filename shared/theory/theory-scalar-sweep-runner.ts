import {
  buildTheorySweepRunV1,
  type TheorySweepAggregateV1,
  type TheorySweepDistributionV1,
  type TheorySweepRateProjectionKind,
  type TheorySweepRateProjectionV1,
  type TheorySweepRunV1,
  type TheorySweepSamplePolicyKind,
  type TheorySweepSampleV1,
  type TheorySweepVariableV1,
} from "../contracts/theory-sweep-run.v1";

type RateProjectionRequest = {
  kind: TheorySweepRateProjectionKind;
  inputSymbol: string;
  outputSymbol: string;
  unit: string | null;
};

type ScalarSweepRunnerInput = {
  expression: string;
  resultSymbol?: string;
  graphId: string;
  targetBadgeIds: string[];
  sourceRunId?: string | null;
  samplePolicy: {
    kind: TheorySweepSamplePolicyKind;
    sampleCount?: number;
    seed?: string | null;
  };
  variables: TheorySweepVariableV1[];
  rateProjections?: RateProjectionRequest[];
  resultDimensionSignature?: string | null;
  generatedAt?: string;
  claimBoundaryNotes?: string[];
};

const PLANCK_H = 6.62607015e-34;
const SPEED_OF_LIGHT = 299_792_458;
const ENERGY_DIMENSION_SIGNATURES = new Set(["M L^2 T^-2", "ML^2T^-2", "energy"]);
const MASS_DIMENSION_SIGNATURES = new Set(["M", "mass"]);

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 0x100000000;
  };
}

function normalSample(random: () => number, mean: number, stddev: number): number {
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stddev;
}

function distributionValue(
  distribution: TheorySweepDistributionV1,
  index: number,
  count: number,
  random: () => number,
): number {
  if (distribution.kind === "fixed") return distribution.value;
  if (distribution.kind === "samples") return distribution.values[Math.min(index, distribution.values.length - 1)] ?? NaN;
  if (distribution.kind === "uniform") {
    if (count <= 1) return (distribution.min + distribution.max) / 2;
    return distribution.min + ((distribution.max - distribution.min) * index) / (count - 1);
  }
  if (distribution.kind === "log_uniform") {
    if (count <= 1) return Math.sqrt(distribution.min * distribution.max);
    const logMin = Math.log(distribution.min);
    const logMax = Math.log(distribution.max);
    return Math.exp(logMin + ((logMax - logMin) * index) / (count - 1));
  }
  return normalSample(random, distribution.mean, distribution.stddev);
}

function monteCarloValue(distribution: TheorySweepDistributionV1, random: () => number): number {
  if (distribution.kind === "fixed") return distribution.value;
  if (distribution.kind === "samples") {
    return distribution.values[Math.min(Math.floor(random() * distribution.values.length), distribution.values.length - 1)] ?? NaN;
  }
  if (distribution.kind === "uniform") return distribution.min + (distribution.max - distribution.min) * random();
  if (distribution.kind === "log_uniform") {
    return Math.exp(Math.log(distribution.min) + (Math.log(distribution.max) - Math.log(distribution.min)) * random());
  }
  return normalSample(random, distribution.mean, distribution.stddev);
}

function sampleCount(policy: ScalarSweepRunnerInput["samplePolicy"], variables: TheorySweepVariableV1[]): number {
  if (policy.sampleCount !== undefined) return Math.max(0, Math.floor(policy.sampleCount));
  if (policy.kind === "grid") {
    const sampleLengths = variables
      .map((variable) => (variable.distribution.kind === "samples" ? variable.distribution.values.length : 0))
      .filter((length) => length > 0);
    return sampleLengths.length > 0 ? Math.max(...sampleLengths) : 1;
  }
  if (policy.kind === "interval_bounds") return 2;
  return 16;
}

function buildSampleInputs(args: {
  policy: ScalarSweepRunnerInput["samplePolicy"];
  variables: TheorySweepVariableV1[];
  index: number;
  count: number;
  random: () => number;
}): Record<string, number> {
  return args.variables.reduce<Record<string, number>>((acc, variable) => {
    if (args.policy.kind === "monte_carlo" || args.policy.kind === "latin_hypercube") {
      acc[variable.symbol] = monteCarloValue(variable.distribution, args.random);
    } else if (args.policy.kind === "interval_bounds" && variable.distribution.kind !== "fixed") {
      if (variable.distribution.kind === "samples") {
        acc[variable.symbol] = variable.distribution.values[args.index === 0 ? 0 : variable.distribution.values.length - 1] ?? NaN;
      } else if (variable.distribution.kind === "normal") {
        acc[variable.symbol] = args.index === 0
          ? variable.distribution.mean - variable.distribution.stddev
          : variable.distribution.mean + variable.distribution.stddev;
      } else {
        acc[variable.symbol] = args.index === 0 ? variable.distribution.min : variable.distribution.max;
      }
    } else {
      acc[variable.symbol] = distributionValue(variable.distribution, args.index, args.count, args.random);
    }
    return acc;
  }, {});
}

function parseExpression(expression: string): { resultSymbol: string; rhs: string } {
  const [lhs, ...rest] = expression.split("=");
  if (rest.length > 0 && lhs.trim()) {
    return { resultSymbol: lhs.trim(), rhs: rest.join("=").trim() };
  }
  return { resultSymbol: "result", rhs: expression.trim() };
}

function evaluateExpression(rhs: string, inputs: Record<string, number>): number {
  const replaced = rhs.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (symbol) => {
    if (symbol === "pi") return String(Math.PI);
    if (symbol === "e") return String(Math.E);
    if (Object.prototype.hasOwnProperty.call(inputs, symbol)) return String(inputs[symbol]);
    throw new Error(`unbound symbol: ${symbol}`);
  });
  if (!/^[\deE.+\-*/^(),\s]+$/.test(replaced)) throw new Error("expression contains unsupported tokens");
  const value = Function(`"use strict"; return (${replaced.replace(/\^/g, "**")});`)();
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("expression did not evaluate to a finite number");
  return value;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const raw = (sorted.length - 1) * p;
  const lower = Math.floor(raw);
  const upper = Math.ceil(raw);
  if (lower === upper) return sorted[lower] ?? null;
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? 0;
  return lowerValue + (upperValue - lowerValue) * (raw - lower);
}

function aggregate(resultSymbol: string, values: Array<number | null>, failedCount: number): TheorySweepAggregateV1 {
  const okValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const sorted = [...okValues].sort((left, right) => left - right);
  const mean = okValues.length > 0 ? okValues.reduce((sum, value) => sum + value, 0) / okValues.length : null;
  const stddev = mean === null || okValues.length === 0
    ? null
    : Math.sqrt(okValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / okValues.length);
  return {
    resultSymbol,
    mean,
    median: percentile(sorted, 0.5),
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    stddev,
    p05: percentile(sorted, 0.05),
    p95: percentile(sorted, 0.95),
    failedCount,
    okCount: okValues.length,
  };
}

function compatibleDimensionForProjection(args: {
  kind: TheorySweepRateProjectionKind;
  inputSymbol: string;
  variables: TheorySweepVariableV1[];
  resultSymbol: string;
  resultDimensionSignature: string | null | undefined;
}): boolean {
  const variable = args.variables.find((candidate) => candidate.symbol === args.inputSymbol);
  const signature =
    variable?.dimensionSignature ?? (args.inputSymbol === args.resultSymbol ? args.resultDimensionSignature : null);
  if (args.kind === "energy_to_frequency" || args.kind === "energy_per_period") {
    return Boolean(signature && ENERGY_DIMENSION_SIGNATURES.has(signature));
  }
  if (args.kind === "mass_to_compton_frequency") {
    return Boolean(signature && MASS_DIMENSION_SIGNATURES.has(signature));
  }
  return true;
}

function projectRateValue(kind: TheorySweepRateProjectionKind, value: number): number {
  if (kind === "energy_to_frequency") return value / PLANCK_H;
  if (kind === "mass_to_compton_frequency") return (value * SPEED_OF_LIGHT ** 2) / PLANCK_H;
  if (kind === "energy_per_period") return value;
  return value;
}

function buildRateProjections(args: {
  requests: RateProjectionRequest[];
  samples: TheorySweepSampleV1[];
  variables: TheorySweepVariableV1[];
  resultSymbol: string;
  resultDimensionSignature?: string | null;
}): TheorySweepRateProjectionV1[] {
  return args.requests.map((request) => {
    const compatible = compatibleDimensionForProjection({
      kind: request.kind,
      inputSymbol: request.inputSymbol,
      variables: args.variables,
      resultSymbol: args.resultSymbol,
      resultDimensionSignature: args.resultDimensionSignature,
    });
    const values = compatible
      ? args.samples.map((sample) => {
          const source = sample.scalarResults[request.inputSymbol] ?? sample.inputs[request.inputSymbol] ?? null;
          return typeof source === "number" ? projectRateValue(request.kind, source) : null;
        })
      : [];
    return {
      kind: request.kind,
      inputSymbol: request.inputSymbol,
      outputSymbol: request.outputSymbol,
      unit: request.unit,
      aggregate: aggregate(request.outputSymbol, values, compatible ? values.filter((value) => value === null).length : args.samples.length),
    };
  });
}

export function runTheoryScalarSweep(input: ScalarSweepRunnerInput): TheorySweepRunV1 {
  const parsed = parseExpression(input.expression);
  const resultSymbol = input.resultSymbol ?? parsed.resultSymbol;
  const count = sampleCount(input.samplePolicy, input.variables);
  const random = seededRandom(input.samplePolicy.seed ?? "theory-sweep-default-seed");
  const samples: TheorySweepSampleV1[] = [];

  for (let index = 0; index < count; index += 1) {
    const inputs = buildSampleInputs({
      policy: input.samplePolicy,
      variables: input.variables,
      index,
      count,
      random,
    });
    try {
      const value = evaluateExpression(parsed.rhs, inputs);
      samples.push({
        index: index + 1,
        inputs,
        scalarResults: { [resultSymbol]: value },
        status: "ok",
        warnings: [],
      });
    } catch (error) {
      samples.push({
        index: index + 1,
        inputs,
        scalarResults: { [resultSymbol]: null },
        status: "failed",
        warnings: [error instanceof Error ? error.message : "sweep sample failed"],
      });
    }
  }

  const values = samples.map((sample) => sample.scalarResults[resultSymbol] ?? null);
  const failedCount = samples.filter((sample) => sample.status === "failed").length;
  const baseAggregate = aggregate(resultSymbol, values, failedCount);
  const rateProjections = buildRateProjections({
    requests: input.rateProjections ?? [],
    samples,
    variables: input.variables,
    resultSymbol,
    resultDimensionSignature: input.resultDimensionSignature,
  });

  return buildTheorySweepRunV1({
    generatedAt: input.generatedAt,
    sweepId: `theory-sweep:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`,
    graphId: input.graphId,
    targetBadgeIds: input.targetBadgeIds,
    sourceRunId: input.sourceRunId ?? null,
    samplePolicy: {
      kind: input.samplePolicy.kind,
      sampleCount: count,
      seed: input.samplePolicy.seed ?? null,
    },
    variables: input.variables,
    samples,
    aggregate: baseAggregate,
    rateProjections,
    quality: {
      confidence: failedCount === 0 ? 0.82 : Math.max(0, 0.5 - failedCount / Math.max(1, count)),
      uncertaintyModel: input.samplePolicy.kind,
      fallbackReason: failedCount > 0 ? "one or more scalar sweep samples failed" : null,
    },
    claimBoundary: {
      diagnosticOnly: true,
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      notes: input.claimBoundaryNotes ?? ["Scalar sweep is diagnostic-only and does not validate a physical mechanism."],
    },
  });
}
