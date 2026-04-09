import type {
  CanonicalStar,
  StarSimBenchmarkMetricCheck,
  StarSimBenchmarkValidation,
  StarSimSupportedDomain,
  StarSimSupportedDomainReason,
} from "./contract";
import { STAR_SIM_SUPPORTED_DOMAIN_ID } from "./domain";
import type { StarSimRuntimeArtifactPayload } from "./worker/starsim-worker-types";

export const STAR_SIM_BENCHMARK_REGISTRY_VERSION =
  process.env.STAR_SIM_BENCHMARK_REGISTRY_VERSION?.trim() || "starsim-benchmarks/2";

type HeavyLane = "structure_mesa" | "oscillation_gyre";

type BenchmarkMetricSpec = {
  metric_id: string;
  expected: number;
  tolerance: number;
  valueFrom: (payload: Record<string, unknown>) => number | null;
};

type BenchmarkPackMetricSpec = {
  metric_id: string;
  tolerance: number;
  valueFrom: (payload: Record<string, unknown>) => number | null;
  expectedFrom: (star: CanonicalStar) => number | null;
};

export interface StarSimBenchmarkSpec {
  id: string;
  label: string;
  supported_lanes: HeavyLane[];
  requires_solar_calibrator: boolean;
  requires_asteroseismology: boolean;
  required_observables: string[];
  tolerance_profile: string;
  required_artifact_kinds: Record<HeavyLane, string[]>;
  validations: Record<HeavyLane, BenchmarkMetricSpec[]>;
  benchmark_pack_id: string;
}

export interface StarSimBenchmarkPackSpec {
  id: string;
  label: string;
  supported_lane: HeavyLane;
  domain_id: string;
  support_mode: "benchmark_backed_only" | "fit_backed_supported_domain";
  benchmark_family_ids: string[];
  tolerance_profile: string;
  required_artifact_kinds: string[];
  required_observables: string[];
  validations: BenchmarkPackMetricSpec[];
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

export type BenchmarkPackResolution =
  | {
      status: "ok";
      benchmark_pack: StarSimBenchmarkPackSpec;
      benchmark_pack_id: string;
    }
  | {
      status: "unavailable";
      reason: StarSimSupportedDomainReason | "out_of_domain";
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

const starValue = {
  teff: (star: CanonicalStar) => getNumber(star.fields.spectroscopy.teff_K.value),
  logg: (star: CanonicalStar) => getNumber(star.fields.spectroscopy.logg_cgs.value),
  feh: (star: CanonicalStar) => getNumber(star.fields.spectroscopy.metallicity_feh.value),
  mass: (star: CanonicalStar) => getNumber(star.fields.structure.mass_Msun.value),
  radius: (star: CanonicalStar) => getNumber(star.fields.structure.radius_Rsun.value),
  numax: (star: CanonicalStar) => getNumber(star.fields.asteroseismology.numax_uHz.value),
  deltanu: (star: CanonicalStar) => getNumber(star.fields.asteroseismology.deltanu_uHz.value),
  modeCount: (star: CanonicalStar) => getNumber(star.fields.asteroseismology.mode_count.value),
};

const BENCHMARK_CASES: Record<string, StarSimBenchmarkSpec> = {
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
    benchmark_pack_id: "solar_like_structure_fit_pack_v1",
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
    benchmark_pack_id: "solar_like_seismic_compare_pack_v1",
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

const BENCHMARK_PACKS: Record<string, StarSimBenchmarkPackSpec> = {
  solar_like_structure_fit_pack_v1: {
    id: "solar_like_structure_fit_pack_v1",
    label: "Solar-like structure live-fit pack",
    supported_lane: "structure_mesa",
    domain_id: STAR_SIM_SUPPORTED_DOMAIN_ID,
    support_mode: "fit_backed_supported_domain",
    benchmark_family_ids: ["simplex_solar_calibration", "astero_gyre_solar_like"],
    tolerance_profile: "solar_like_structure_fit_pack/1",
    required_artifact_kinds: ["solver_metadata", "model_artifact", "benchmark_pack"],
    required_observables: ["spectroscopy.teff_K", "spectroscopy.metallicity_feh", "spectroscopy.logg_cgs|structure.radius_Rsun"],
    validations: [
      { metric_id: "synthetic.teff_K", tolerance: 220, valueFrom: syntheticObservableValue("teff_K"), expectedFrom: starValue.teff },
      { metric_id: "synthetic.logg_cgs", tolerance: 0.2, valueFrom: syntheticObservableValue("logg_cgs"), expectedFrom: starValue.logg },
      { metric_id: "structure.radius_Rsun", tolerance: 0.2, valueFrom: structureSummaryValue("radius_Rsun"), expectedFrom: starValue.radius },
      { metric_id: "structure.mass_Msun", tolerance: 0.2, valueFrom: structureSummaryValue("mass_Msun"), expectedFrom: starValue.mass },
    ],
  },
  solar_like_seismic_compare_pack_v1: {
    id: "solar_like_seismic_compare_pack_v1",
    label: "Solar-like seismic comparison pack",
    supported_lane: "oscillation_gyre",
    domain_id: STAR_SIM_SUPPORTED_DOMAIN_ID,
    support_mode: "fit_backed_supported_domain",
    benchmark_family_ids: ["astero_gyre_solar_like"],
    tolerance_profile: "solar_like_seismic_compare_pack/1",
    required_artifact_kinds: ["solver_metadata", "mode_table", "benchmark_pack"],
    required_observables: ["asteroseismology.numax_uHz|asteroseismology.deltanu_uHz|asteroseismology.mode_count"],
    validations: [
      { metric_id: "mode.numax_uHz", tolerance: 180, valueFrom: modeSummaryValue("numax_uHz"), expectedFrom: starValue.numax },
      { metric_id: "mode.deltanu_uHz", tolerance: 10, valueFrom: modeSummaryValue("deltanu_uHz"), expectedFrom: starValue.deltanu },
      { metric_id: "mode.mode_count", tolerance: 2, valueFrom: modeSummaryValue("mode_count"), expectedFrom: starValue.modeCount },
    ],
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
  lane: HeavyLane,
): BenchmarkResolution => {
  const benchmarkCaseId = inferBenchmarkCaseIdForCanonicalStar(star);
  if (!benchmarkCaseId) {
    return {
      status: "unavailable",
      reason: "benchmark_required",
      note: "No explicit or inferred benchmark case is available for this live request.",
    };
  }

  const benchmark = BENCHMARK_CASES[benchmarkCaseId];
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

export const resolveBenchmarkPackForLane = (
  lane: HeavyLane,
  supportedDomain: StarSimSupportedDomain,
): BenchmarkPackResolution => {
  if (!supportedDomain.passed) {
    return {
      status: "unavailable",
      reason: supportedDomain.reasons[0] ?? "out_of_domain",
      note: supportedDomain.notes.join(" "),
    };
  }
  if (!supportedDomain.benchmark_pack_id) {
    return {
      status: "unavailable",
      reason: "out_of_domain",
      note: `No benchmark pack is registered for lane ${lane}.`,
    };
  }
  const benchmarkPack = BENCHMARK_PACKS[supportedDomain.benchmark_pack_id];
  if (!benchmarkPack || benchmarkPack.supported_lane !== lane || benchmarkPack.domain_id !== supportedDomain.id) {
    return {
      status: "unavailable",
      reason: "out_of_domain",
      note: `Benchmark pack ${supportedDomain.benchmark_pack_id} is not compatible with lane ${lane} and domain ${supportedDomain.id}.`,
    };
  }
  return {
    status: "ok",
    benchmark_pack: benchmarkPack,
    benchmark_pack_id: benchmarkPack.id,
  };
};

export const validateBenchmarkOutput = (args: {
  benchmark: StarSimBenchmarkSpec;
  lane: HeavyLane;
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

export const validateBenchmarkPackOutput = (args: {
  benchmarkPack: StarSimBenchmarkPackSpec;
  star: CanonicalStar;
  payload: Record<string, unknown>;
  artifactKinds: string[];
}): StarSimBenchmarkValidation => {
  const checks: StarSimBenchmarkMetricCheck[] = [];
  for (const spec of args.benchmarkPack.validations) {
    const expected = spec.expectedFrom(args.star);
    if (expected === null) {
      continue;
    }
    const actual = spec.valueFrom(args.payload);
    const passed = actual !== null && Math.abs(actual - expected) <= spec.tolerance;
    checks.push({
      metric_id: spec.metric_id,
      actual: actual ?? Number.NaN,
      expected,
      tolerance: spec.tolerance,
      comparator: "abs",
      passed,
    });
  }
  const missingArtifacts = args.benchmarkPack.required_artifact_kinds.filter(
    (kind) => !args.artifactKinds.includes(kind),
  );
  const notes: string[] = [];
  if (missingArtifacts.length > 0) {
    notes.push(`Missing required benchmark-pack artifacts: ${missingArtifacts.join(", ")}`);
  }
  if (checks.length === 0) {
    notes.push("No benchmark-pack checks were available from the supplied observables.");
  }

  return {
    passed: checks.length > 0 && checks.every((check) => check.passed) && missingArtifacts.length === 0,
    tolerance_profile: args.benchmarkPack.tolerance_profile,
    checked_metrics: checks,
    notes,
  };
};

export const createBenchmarkPackArtifact = (args: {
  benchmarkPack: StarSimBenchmarkPackSpec;
  supportedDomain: StarSimSupportedDomain;
  validation: StarSimBenchmarkValidation | undefined;
  benchmarkCaseId: string | null;
}): StarSimRuntimeArtifactPayload => ({
  kind: "benchmark_pack",
  file_name: "benchmark-pack.json",
  content_encoding: "utf8",
  content:
    `${JSON.stringify(
      {
        benchmark_pack_id: args.benchmarkPack.id,
        label: args.benchmarkPack.label,
        benchmark_registry_version: STAR_SIM_BENCHMARK_REGISTRY_VERSION,
        support_mode: args.benchmarkPack.support_mode,
        supported_lane: args.benchmarkPack.supported_lane,
        domain_id: args.supportedDomain.id,
        domain_version: args.supportedDomain.version,
        benchmark_family_ids: args.benchmarkPack.benchmark_family_ids,
        benchmark_case_id: args.benchmarkCaseId,
        tolerance_profile: args.benchmarkPack.tolerance_profile,
        validation: args.validation,
      },
      null,
      2,
    )}\n`,
  media_type: "application/json",
});

export const getBenchmarkRegistryVersion = (): string => STAR_SIM_BENCHMARK_REGISTRY_VERSION;

export const getBenchmarkById = (benchmarkCaseId: string): StarSimBenchmarkSpec | null =>
  BENCHMARK_CASES[benchmarkCaseId] ?? null;

export const getBenchmarkPackById = (benchmarkPackId: string): StarSimBenchmarkPackSpec | null =>
  BENCHMARK_PACKS[benchmarkPackId] ?? null;
