import type {
  CanonicalStar,
  RequestedLane,
  StarSimBenchmarkMetricCheck,
  StarSimBenchmarkValidation,
} from "./contract";

export const STAR_SIM_BENCHMARK_REGISTRY_VERSION =
  process.env.STAR_SIM_BENCHMARK_REGISTRY_VERSION?.trim() || "starsim-benchmarks/1";

type BenchmarkMetricSpec = {
  metric_id: string;
  expected: number;
  tolerance: number;
  valueFrom: (payload: Record<string, unknown>) => number | null;
};

export interface StarSimBenchmarkSpec {
  id: string;
  label: string;
  supported_lanes: Array<"structure_mesa" | "oscillation_gyre">;
  requires_solar_calibrator: boolean;
  requires_asteroseismology: boolean;
  required_observables: string[];
  tolerance_profile: string;
  required_artifact_kinds: Record<"structure_mesa" | "oscillation_gyre", string[]>;
  validations: Record<"structure_mesa" | "oscillation_gyre", BenchmarkMetricSpec[]>;
}

export type BenchmarkResolution =
  | {
      status: "ok";
      benchmark: StarSimBenchmarkSpec;
      benchmark_case_id: string;
      inferred: boolean;
    }
  | {
      status: "unavailable";
      reason: "benchmark_required" | "out_of_domain";
      note: string;
    };

const getNumber = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const structureSummaryValue = (key: string) => (payload: Record<string, unknown>): number | null =>
  getNumber(asRecord(payload.structure_summary)[key]);

const syntheticObservableValue = (key: string) => (payload: Record<string, unknown>): number | null =>
  getNumber(asRecord(payload.synthetic_observables)[key]);

const modeSummaryValue = (key: string) => (payload: Record<string, unknown>): number | null =>
  getNumber(asRecord(payload.mode_summary)[key]);

const BENCHMARKS: Record<string, StarSimBenchmarkSpec> = {
  simplex_solar_calibration: {
    id: "simplex_solar_calibration",
    label: "Solar calibration benchmark",
    supported_lanes: ["structure_mesa"],
    requires_solar_calibrator: true,
    requires_asteroseismology: false,
    required_observables: [
      "structure.mass_Msun",
      "structure.radius_Rsun",
      "spectroscopy.teff_K",
      "spectroscopy.logg_cgs",
    ],
    tolerance_profile: "simplex_solar_calibration/1",
    required_artifact_kinds: {
      structure_mesa: ["solver_metadata", "model_artifact"],
      oscillation_gyre: [],
    },
    validations: {
      structure_mesa: [
        { metric_id: "structure.mass_Msun", expected: 1, tolerance: 0.02, valueFrom: structureSummaryValue("mass_Msun") },
        { metric_id: "structure.radius_Rsun", expected: 1, tolerance: 0.02, valueFrom: structureSummaryValue("radius_Rsun") },
        { metric_id: "synthetic.teff_K", expected: 5772, tolerance: 60, valueFrom: syntheticObservableValue("teff_K") },
        { metric_id: "synthetic.logg_cgs", expected: 4.438, tolerance: 0.05, valueFrom: syntheticObservableValue("logg_cgs") },
      ],
      oscillation_gyre: [],
    },
  },
  astero_gyre_solar_like: {
    id: "astero_gyre_solar_like",
    label: "Solar-like asteroseismic benchmark",
    supported_lanes: ["structure_mesa", "oscillation_gyre"],
    requires_solar_calibrator: true,
    requires_asteroseismology: true,
    required_observables: [
      "structure.mass_Msun",
      "structure.radius_Rsun",
      "spectroscopy.teff_K",
      "asteroseismology.numax_uHz",
      "asteroseismology.deltanu_uHz",
    ],
    tolerance_profile: "astero_gyre_solar_like/1",
    required_artifact_kinds: {
      structure_mesa: ["solver_metadata", "model_artifact"],
      oscillation_gyre: ["solver_metadata", "mode_table"],
    },
    validations: {
      structure_mesa: [
        { metric_id: "structure.mass_Msun", expected: 1, tolerance: 0.03, valueFrom: structureSummaryValue("mass_Msun") },
        { metric_id: "structure.radius_Rsun", expected: 1, tolerance: 0.03, valueFrom: structureSummaryValue("radius_Rsun") },
        { metric_id: "synthetic.teff_K", expected: 5772, tolerance: 80, valueFrom: syntheticObservableValue("teff_K") },
      ],
      oscillation_gyre: [
        { metric_id: "mode.numax_uHz", expected: 3090, tolerance: 120, valueFrom: modeSummaryValue("numax_uHz") },
        { metric_id: "mode.deltanu_uHz", expected: 135.1, tolerance: 6, valueFrom: modeSummaryValue("deltanu_uHz") },
        { metric_id: "mode.mode_count", expected: 3, tolerance: 0, valueFrom: modeSummaryValue("mode_count") },
      ],
    },
  },
};

const hasSeismology = (star: CanonicalStar): boolean =>
  typeof star.fields.asteroseismology.numax_uHz.value === "number"
  || typeof star.fields.asteroseismology.deltanu_uHz.value === "number"
  || typeof star.fields.asteroseismology.mode_count.value === "number";

export const inferBenchmarkCaseIdForCanonicalStar = (star: CanonicalStar): string | null => {
  if (star.benchmark_case_id) {
    return star.benchmark_case_id;
  }
  if (!star.target.is_solar_calibrator) {
    return null;
  }
  if (star.requested_lanes.includes("oscillation_gyre") || hasSeismology(star)) {
    return "astero_gyre_solar_like";
  }
  if (star.requested_lanes.includes("structure_mesa")) {
    return "simplex_solar_calibration";
  }
  return null;
};

export const resolveBenchmarkForLane = (
  star: CanonicalStar,
  lane: "structure_mesa" | "oscillation_gyre",
): BenchmarkResolution => {
  const benchmarkCaseId = inferBenchmarkCaseIdForCanonicalStar(star);
  if (!benchmarkCaseId) {
    return {
      status: "unavailable",
      reason: "benchmark_required",
      note: "Live benchmark execution requires a supported benchmark_case_id or a deterministic benchmark mapping.",
    };
  }

  const benchmark = BENCHMARKS[benchmarkCaseId];
  if (!benchmark || !benchmark.supported_lanes.includes(lane)) {
    return {
      status: "unavailable",
      reason: "out_of_domain",
      note: `Benchmark ${benchmarkCaseId} does not support lane ${lane}.`,
    };
  }

  if (benchmark.requires_solar_calibrator && !star.target.is_solar_calibrator) {
    return {
      status: "unavailable",
      reason: "out_of_domain",
      note: `Benchmark ${benchmarkCaseId} is restricted to the solar calibration target class.`,
    };
  }

  if (benchmark.requires_asteroseismology && !hasSeismology(star)) {
    return {
      status: "unavailable",
      reason: "out_of_domain",
      note: `Benchmark ${benchmarkCaseId} requires asteroseismic observables.`,
    };
  }

  return {
    status: "ok",
    benchmark,
    benchmark_case_id: benchmarkCaseId,
    inferred: star.benchmark_case_id == null,
  };
};

export const validateBenchmarkOutput = (args: {
  benchmark: StarSimBenchmarkSpec;
  lane: "structure_mesa" | "oscillation_gyre";
  payload: Record<string, unknown>;
  artifactKinds: string[];
}): StarSimBenchmarkValidation => {
  const checks: StarSimBenchmarkMetricCheck[] = args.benchmark.validations[args.lane].map((spec) => {
    const actual = spec.valueFrom(args.payload);
    const passed = actual !== null && Math.abs(actual - spec.expected) <= spec.tolerance;
    return {
      metric_id: spec.metric_id,
      actual: actual ?? Number.NaN,
      expected: spec.expected,
      tolerance: spec.tolerance,
      comparator: "abs",
      passed,
    };
  });

  const missingArtifacts = args.benchmark.required_artifact_kinds[args.lane].filter(
    (kind) => !args.artifactKinds.includes(kind),
  );
  const notes: string[] = [];
  if (missingArtifacts.length > 0) {
    notes.push(`Missing required benchmark artifacts: ${missingArtifacts.join(", ")}`);
  }

  return {
    passed: checks.every((check) => check.passed) && missingArtifacts.length === 0,
    tolerance_profile: args.benchmark.tolerance_profile,
    checked_metrics: checks,
    notes,
  };
};

export const getBenchmarkRegistryVersion = (): string => STAR_SIM_BENCHMARK_REGISTRY_VERSION;

export const getBenchmarkById = (benchmarkCaseId: string): StarSimBenchmarkSpec | null => BENCHMARKS[benchmarkCaseId] ?? null;
