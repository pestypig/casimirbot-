import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { stableJsonStringify } from "../../../utils/stable-json.ts";
import type {
  CanonicalStar,
  PhysicsFlagValue,
  StarSimComparisonSummary,
  StarSimExternalRuntimeKind,
  StarSimFitSummary,
  StarSimSeismicMatchSummary,
  StarSimSupportedDomain,
} from "../contract";
import type {
  OscillationGyreWorkerResult,
  StarSimRuntimeArtifactPayload,
  StructureMesaWorkerResult,
} from "./starsim-worker-types";

type SolverName = "mesa" | "gyre";
type RuntimeStatusReason = "solver_unconfigured" | "runtime_not_ready";
type RuntimeLaunchMode = "wrapper" | "direct";
type FixturePayload = Record<string, unknown>;

export interface StarSimSolverRuntimeConfig {
  solver: SolverName;
  runtime_kind: StarSimExternalRuntimeKind;
  runtime_fingerprint: string;
  image: string | null;
  command: string | null;
  wsl_distro: string | null;
  launcher_bin: string;
  launch_mode: RuntimeLaunchMode;
  live_benchmarks_enabled: boolean;
  executable: boolean;
  configuration_reason: RuntimeStatusReason | null;
}

export interface StarSimSolverRuntimeProbe {
  ready: boolean;
  status_reason: RuntimeStatusReason | null;
  detail: string | null;
}

type StructureMesaRuntimeInput = {
  star: CanonicalStar;
  cache_key: string;
  fit_profile_id: string | null;
  fit_constraints: Record<string, PhysicsFlagValue>;
  supported_domain: StarSimSupportedDomain;
};

type OscillationGyreRuntimeInput = {
  star: CanonicalStar;
  structure_cache_key: string;
  structure_claim_id: string;
  structure_summary: Record<string, unknown>;
  fit_profile_id: string | null;
  fit_constraints: Record<string, PhysicsFlagValue>;
  supported_domain: StarSimSupportedDomain;
};

type StructureRuntimeProtocolResult = {
  schema_version: "star-sim-runtime-result/1";
  execution_mode: "live_benchmark" | "live_fit";
  live_solver: true;
  solver_version: string;
  benchmark_case_id: string | null;
  benchmark_pack_id?: string | null;
  fit_profile_id?: string | null;
  fit_status?: "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain";
  used_seismic_constraints?: boolean;
  evidence_fit?: number;
  structure_summary: Record<string, unknown>;
  synthetic_observables: Record<string, unknown>;
  fit_summary?: StarSimFitSummary | null;
  supported_domain?: StarSimSupportedDomain | null;
  inferred_params?: Record<string, unknown>;
  residuals_sigma?: Record<string, number>;
  domain_validity?: Record<string, unknown>;
  artifact_payloads: StarSimRuntimeArtifactPayload[];
  live_solver_metadata?: Record<string, unknown>;
};

type GyreRuntimeProtocolResult = {
  schema_version: "star-sim-runtime-result/1";
  execution_mode: "live_benchmark" | "live_comparison";
  live_solver: true;
  solver_version: string;
  benchmark_case_id: string | null;
  benchmark_pack_id?: string | null;
  fit_profile_id?: string | null;
  fit_status?: "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain";
  evidence_fit?: number;
  mode_summary: Record<string, unknown>;
  comparison_summary?: StarSimComparisonSummary | null;
  seismic_match_summary?: StarSimSeismicMatchSummary | null;
  supported_domain?: StarSimSupportedDomain | null;
  inferred_params?: Record<string, unknown>;
  residuals_sigma?: Record<string, number>;
  domain_validity?: Record<string, unknown>;
  artifact_payloads: StarSimRuntimeArtifactPayload[];
  live_solver_metadata?: Record<string, unknown>;
};

const runtimeProbeCache = new Map<string, StarSimSolverRuntimeProbe>();

const hashStableJson = (value: unknown): string =>
  `sha256:${createHash("sha256").update(Buffer.from(stableJsonStringify(value), "utf8")).digest("hex")}`;

const getEnv = (name: string): string | null => {
  const value = process.env[name]?.trim();
  return value ? value : null;
};

const getProcessTimeoutMs = (): number => {
  const value = Number(process.env.STAR_SIM_WORKER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 60_000;
};

const resolveRuntimeKind = (solver: SolverName): StarSimExternalRuntimeKind => {
  const envName = solver === "mesa" ? "STAR_SIM_MESA_RUNTIME" : "STAR_SIM_GYRE_RUNTIME";
  const value = process.env[envName]?.trim().toLowerCase();
  switch (value) {
    case "mock":
    case "docker":
    case "wsl":
    case "disabled":
      return value;
    default:
      return "disabled";
  }
};

const resolveLaunchMode = (runtimeKind: StarSimExternalRuntimeKind): RuntimeLaunchMode => {
  if (runtimeKind !== "docker" && runtimeKind !== "wsl") {
    return "wrapper";
  }
  const envName = runtimeKind === "docker" ? "STAR_SIM_DOCKER_LAUNCH_MODE" : "STAR_SIM_WSL_LAUNCH_MODE";
  return process.env[envName]?.trim().toLowerCase() === "direct" ? "direct" : "wrapper";
};

const resolveLauncherBinary = (runtimeKind: StarSimExternalRuntimeKind): string => {
  if (runtimeKind === "docker") {
    return getEnv("STAR_SIM_DOCKER_BIN") ?? "docker";
  }
  if (runtimeKind === "wsl") {
    return getEnv("STAR_SIM_WSL_BIN") ?? "wsl.exe";
  }
  return "";
};

const buildRuntimeFingerprint = (args: {
  solver: SolverName;
  runtime_kind: StarSimExternalRuntimeKind;
  image: string | null;
  command: string | null;
  wsl_distro: string | null;
  launcher_bin: string;
  launch_mode: RuntimeLaunchMode;
  live_benchmarks_enabled: boolean;
}): string => {
  switch (args.runtime_kind) {
    case "mock":
      return `mock:${hashStableJson({ solver: args.solver, fixture_pack: "starsim-fixtures/1" })}`;
    case "docker":
      return `docker:${hashStableJson({
        solver: args.solver,
        image: args.image,
        command: args.command,
        launcher_bin: args.launcher_bin,
        launch_mode: args.launch_mode,
        live_benchmarks_enabled: args.live_benchmarks_enabled,
      })}`;
    case "wsl":
      return `wsl:${hashStableJson({
        solver: args.solver,
        distro: args.wsl_distro,
        command: args.command,
        launcher_bin: args.launcher_bin,
        launch_mode: args.launch_mode,
        live_benchmarks_enabled: args.live_benchmarks_enabled,
      })}`;
    case "disabled":
    default:
      return `disabled:${hashStableJson({ solver: args.solver })}`;
  }
};

const readProcessResult = async (args: {
  command: string;
  commandArgs: string[];
  input: unknown;
  timeoutMs: number;
}): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const child = spawn(args.command, args.commandArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error(`star_sim_runtime_timeout:${args.command}`));
    }, args.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`star_sim_runtime_exec_failed:${args.command}:${code}:${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.end(`${JSON.stringify(args.input)}\n`);
  });

const probeProcess = async (command: string, commandArgs: string[]): Promise<StarSimSolverRuntimeProbe> => {
  try {
    await readProcessResult({
      command,
      commandArgs,
      input: { probe: true },
      timeoutMs: Math.min(getProcessTimeoutMs(), 10_000),
    });
    return {
      ready: true,
      status_reason: null,
      detail: null,
    };
  } catch (error) {
    return {
      ready: false,
      status_reason: "runtime_not_ready",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

const resolveFixturePath = (solver: SolverName, fixtureId: string): string =>
  path.resolve(process.cwd(), "tests", "fixtures", "starsim", solver, `${fixtureId}.json`);

const loadFixture = async (solver: SolverName, fixtureId: string): Promise<FixturePayload> => {
  const raw = await fs.readFile(resolveFixturePath(solver, fixtureId), "utf8");
  return JSON.parse(raw) as FixturePayload;
};

const isGTypeMainSequence = (star: CanonicalStar): boolean => {
  const teff = star.fields.spectroscopy.teff_K.value;
  const logg = star.fields.spectroscopy.logg_cgs.value;
  const spectral = star.target.spectral_type?.toUpperCase() ?? "";
  return (
    spectral.startsWith("G")
    || (typeof teff === "number" && teff >= 5_200 && teff <= 6_100)
    || (typeof teff === "number" && typeof logg === "number" && teff >= 5_000 && teff <= 6_300 && logg >= 4)
  );
};

const usesSeismicConstraints = (star: CanonicalStar): boolean =>
  typeof star.fields.asteroseismology.numax_uHz.value === "number"
  || typeof star.fields.asteroseismology.deltanu_uHz.value === "number"
  || typeof star.fields.asteroseismology.mode_count.value === "number";

const buildDefaultFitSummary = (args: {
  profileId: string | null;
  fitConstraints: Record<string, PhysicsFlagValue>;
  residualsSigma: Record<string, number>;
}): StarSimFitSummary => ({
  profile_id: args.profileId ?? "solar_like_observable_fit_v1",
  free_parameters: ["mass_Msun", "age_Gyr", "metallicity_feh", "helium_fraction", "mixing_length_alpha"],
  fixed_priors: {
    helium_prior: args.fitConstraints.helium_prior ?? "solar_scaled",
  },
  applied_constraints: args.fitConstraints,
  metrics: args.residualsSigma,
  note: "Constrained solar-like live-fit summary generated by the star-sim runtime contract.",
});

const buildDefaultComparisonSummary = (args: {
  profileId: string | null;
  residualsSigma: Record<string, number>;
}): StarSimComparisonSummary => ({
  profile_id: args.profileId ?? "solar_like_seismic_compare_v1",
  checked_observables: ["asteroseismology.numax_uHz", "asteroseismology.deltanu_uHz", "asteroseismology.mode_count"],
  coverage: 1,
  metrics: args.residualsSigma,
  note: "Solar-like seismic comparison summary generated by the star-sim runtime contract.",
});

const buildDefaultSeismicMatchSummary = (modeSummary: Record<string, unknown>): StarSimSeismicMatchSummary => ({
  used_observables: ["asteroseismology.numax_uHz", "asteroseismology.deltanu_uHz", "asteroseismology.mode_count"],
  matched_mode_count: typeof modeSummary.mode_count === "number" ? modeSummary.mode_count : 0,
  available_mode_count: typeof modeSummary.mode_count === "number" ? modeSummary.mode_count : 0,
});

const selectMesaFixtureId = (star: CanonicalStar): string | null => {
  if (star.target.is_solar_calibrator) {
    return "solar-calibration";
  }
  if (isGTypeMainSequence(star)) {
    return "g-type-main-sequence";
  }
  return null;
};

const selectGyreFixtureId = (star: CanonicalStar): string | null => {
  if (star.target.is_solar_calibrator) {
    return "solar-astero";
  }
  if (isGTypeMainSequence(star)) {
    return "g-type-astero";
  }
  return null;
};

const normalizeResiduals = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
  );
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeArtifactPayloads = (value: unknown): StarSimRuntimeArtifactPayload[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry) => ({
      kind: typeof entry.kind === "string" ? entry.kind : "runtime_artifact",
      file_name: typeof entry.file_name === "string" ? path.basename(entry.file_name) : `artifact-${Date.now()}.dat`,
      content_encoding: entry.content_encoding === "base64" ? "base64" : "utf8",
      content: typeof entry.content === "string" ? entry.content : "",
      media_type: typeof entry.media_type === "string" ? entry.media_type : undefined,
    }))
    .filter((entry) => entry.content.length > 0);
};

const normalizeSupportedDomain = (value: unknown): StarSimSupportedDomain | null => {
  const record = asRecord(value);
  if (typeof record.id !== "string" || typeof record.version !== "string" || typeof record.lane_id !== "string") {
    return null;
  }
  return {
    id: record.id,
    version: record.version,
    lane_id: record.lane_id === "oscillation_gyre" ? "oscillation_gyre" : "structure_mesa",
    passed: record.passed === true,
    reasons: Array.isArray(record.reasons)
      ? (record.reasons.filter((entry): entry is string => typeof entry === "string") as StarSimSupportedDomain["reasons"])
      : [],
    required_observables: Array.isArray(record.required_observables)
      ? record.required_observables.filter((entry): entry is string => typeof entry === "string")
      : [],
    optional_observables: Array.isArray(record.optional_observables)
      ? record.optional_observables.filter((entry): entry is string => typeof entry === "string")
      : [],
    fit_profile_id: typeof record.fit_profile_id === "string" ? record.fit_profile_id : null,
    fit_constraints_applied: asRecord(record.fit_constraints_applied) as Record<string, PhysicsFlagValue>,
    benchmark_pack_id: typeof record.benchmark_pack_id === "string" ? record.benchmark_pack_id : null,
    notes: Array.isArray(record.notes) ? record.notes.filter((entry): entry is string => typeof entry === "string") : [],
  };
};

const normalizeFitSummary = (value: unknown): StarSimFitSummary | null => {
  const record = asRecord(value);
  if (typeof record.profile_id !== "string") {
    return null;
  }
  return {
    profile_id: record.profile_id,
    free_parameters: Array.isArray(record.free_parameters)
      ? record.free_parameters.filter((entry): entry is string => typeof entry === "string")
      : [],
    fixed_priors: asRecord(record.fixed_priors),
    applied_constraints: asRecord(record.applied_constraints) as Record<string, PhysicsFlagValue>,
    metrics: normalizeResiduals(record.metrics),
    note: typeof record.note === "string" ? record.note : undefined,
  };
};

const normalizeComparisonSummary = (value: unknown): StarSimComparisonSummary | null => {
  const record = asRecord(value);
  if (typeof record.profile_id !== "string") {
    return null;
  }
  return {
    profile_id: record.profile_id,
    checked_observables: Array.isArray(record.checked_observables)
      ? record.checked_observables.filter((entry): entry is string => typeof entry === "string")
      : [],
    coverage: typeof record.coverage === "number" ? record.coverage : 0,
    metrics: normalizeResiduals(record.metrics),
    note: typeof record.note === "string" ? record.note : undefined,
  };
};

const normalizeSeismicMatchSummary = (value: unknown): StarSimSeismicMatchSummary | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    used_observables: Array.isArray(record.used_observables)
      ? record.used_observables.filter((entry): entry is string => typeof entry === "string")
      : [],
    matched_mode_count: typeof record.matched_mode_count === "number" ? record.matched_mode_count : 0,
    available_mode_count: typeof record.available_mode_count === "number" ? record.available_mode_count : 0,
  };
};

const validateLiveStructureProtocol = (payload: unknown): StructureRuntimeProtocolResult => {
  const record = asRecord(payload);
  const artifactPayloads = normalizeArtifactPayloads(record.artifact_payloads);
  if (
    record.schema_version !== "star-sim-runtime-result/1"
    || (record.execution_mode !== "live_benchmark" && record.execution_mode !== "live_fit")
    || record.live_solver !== true
    || typeof record.solver_version !== "string"
    || artifactPayloads.length === 0
  ) {
    throw new Error("star_sim_runtime_invalid_live_structure_payload");
  }

  return {
    schema_version: "star-sim-runtime-result/1",
    execution_mode: record.execution_mode,
    live_solver: true,
    solver_version: record.solver_version,
    benchmark_case_id: typeof record.benchmark_case_id === "string" ? record.benchmark_case_id : null,
    benchmark_pack_id: typeof record.benchmark_pack_id === "string" ? record.benchmark_pack_id : null,
    fit_profile_id: typeof record.fit_profile_id === "string" ? record.fit_profile_id : null,
    fit_status:
      record.fit_status === "comparison_completed"
      || record.fit_status === "insufficient_data"
      || record.fit_status === "out_of_domain"
        ? record.fit_status
        : "fit_completed",
    used_seismic_constraints: typeof record.used_seismic_constraints === "boolean" ? record.used_seismic_constraints : undefined,
    evidence_fit: typeof record.evidence_fit === "number" ? record.evidence_fit : undefined,
    structure_summary: asRecord(record.structure_summary),
    synthetic_observables: asRecord(record.synthetic_observables),
    fit_summary: normalizeFitSummary(record.fit_summary),
    supported_domain: normalizeSupportedDomain(record.supported_domain),
    inferred_params: asRecord(record.inferred_params),
    residuals_sigma: normalizeResiduals(record.residuals_sigma),
    domain_validity: asRecord(record.domain_validity),
    artifact_payloads: artifactPayloads,
    live_solver_metadata: asRecord(record.live_solver_metadata),
  };
};

const validateLiveGyreProtocol = (payload: unknown): GyreRuntimeProtocolResult => {
  const record = asRecord(payload);
  const artifactPayloads = normalizeArtifactPayloads(record.artifact_payloads);
  if (
    record.schema_version !== "star-sim-runtime-result/1"
    || (record.execution_mode !== "live_benchmark" && record.execution_mode !== "live_comparison")
    || record.live_solver !== true
    || typeof record.solver_version !== "string"
    || artifactPayloads.length === 0
  ) {
    throw new Error("star_sim_runtime_invalid_live_gyre_payload");
  }

  return {
    schema_version: "star-sim-runtime-result/1",
    execution_mode: record.execution_mode,
    live_solver: true,
    solver_version: record.solver_version,
    benchmark_case_id: typeof record.benchmark_case_id === "string" ? record.benchmark_case_id : null,
    benchmark_pack_id: typeof record.benchmark_pack_id === "string" ? record.benchmark_pack_id : null,
    fit_profile_id: typeof record.fit_profile_id === "string" ? record.fit_profile_id : null,
    fit_status:
      record.fit_status === "fit_completed"
      || record.fit_status === "insufficient_data"
      || record.fit_status === "out_of_domain"
        ? record.fit_status
        : "comparison_completed",
    evidence_fit: typeof record.evidence_fit === "number" ? record.evidence_fit : undefined,
    mode_summary: asRecord(record.mode_summary),
    comparison_summary: normalizeComparisonSummary(record.comparison_summary),
    seismic_match_summary: normalizeSeismicMatchSummary(record.seismic_match_summary),
    supported_domain: normalizeSupportedDomain(record.supported_domain),
    inferred_params: asRecord(record.inferred_params),
    residuals_sigma: normalizeResiduals(record.residuals_sigma),
    domain_validity: asRecord(record.domain_validity),
    artifact_payloads: artifactPayloads,
    live_solver_metadata: asRecord(record.live_solver_metadata),
  };
};

const resolveProcessCommand = (
  runtime: StarSimSolverRuntimeConfig,
): { command: string; commandArgs: string[] } | null => {
  if (!runtime.command) {
    return null;
  }

  if (runtime.launch_mode === "direct") {
    return {
      command: runtime.launcher_bin,
      commandArgs: [runtime.command],
    };
  }

  if (runtime.runtime_kind === "docker") {
    if (!runtime.image) {
      return null;
    }
    return {
      command: runtime.launcher_bin,
      commandArgs: ["run", "--rm", "-i", runtime.image, "sh", "-lc", runtime.command],
    };
  }
  if (runtime.runtime_kind === "wsl") {
    return {
      command: runtime.launcher_bin,
      commandArgs: [
        ...(runtime.wsl_distro ? ["-d", runtime.wsl_distro] : []),
        "--",
        "bash",
        "-lc",
        runtime.command,
      ],
    };
  }
  return null;
};

const executeExternalRuntime = async (
  runtime: StarSimSolverRuntimeConfig,
  input: unknown,
): Promise<Record<string, unknown>> => {
  const invocation = resolveProcessCommand(runtime);
  if (!invocation) {
    throw new Error(`star_sim_runtime_not_configured:${runtime.runtime_kind}`);
  }
  const stdout = await readProcessResult({
    command: invocation.command,
    commandArgs: invocation.commandArgs,
    input,
    timeoutMs: getProcessTimeoutMs(),
  });
  try {
    return JSON.parse(stdout) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `star_sim_runtime_invalid_json:${runtime.runtime_kind}:${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const resolveStarSimSolverRuntime = (solver: SolverName): StarSimSolverRuntimeConfig => {
  const runtimeKind = resolveRuntimeKind(solver);
  const imageEnv = solver === "mesa" ? "STAR_SIM_MESA_IMAGE" : "STAR_SIM_GYRE_IMAGE";
  const commandEnv = solver === "mesa" ? "STAR_SIM_MESA_COMMAND" : "STAR_SIM_GYRE_COMMAND";
  const image = getEnv(imageEnv);
  const command = getEnv(commandEnv);
  const wsl_distro = getEnv("STAR_SIM_WSL_DISTRO");
  const launch_mode = resolveLaunchMode(runtimeKind);
  const launcher_bin = resolveLauncherBinary(runtimeKind);
  const live_benchmarks_enabled = process.env.STAR_SIM_ENABLE_LIVE_BENCHMARKS === "1";
  const runtime_fingerprint = buildRuntimeFingerprint({
    solver,
    runtime_kind: runtimeKind,
    image,
    command,
    wsl_distro,
    launcher_bin,
    launch_mode,
    live_benchmarks_enabled,
  });

  if (runtimeKind === "disabled") {
    return {
      solver,
      runtime_kind: runtimeKind,
      runtime_fingerprint,
      image,
      command,
      wsl_distro,
      launcher_bin,
      launch_mode,
      live_benchmarks_enabled,
      executable: false,
      configuration_reason: "solver_unconfigured",
    };
  }

  if (runtimeKind === "mock") {
    return {
      solver,
      runtime_kind: runtimeKind,
      runtime_fingerprint,
      image,
      command,
      wsl_distro,
      launcher_bin,
      launch_mode,
      live_benchmarks_enabled,
      executable: true,
      configuration_reason: null,
    };
  }

  const configured = live_benchmarks_enabled && Boolean(command) && (launch_mode === "direct" || runtimeKind !== "docker" || image);
  return {
    solver,
    runtime_kind: runtimeKind,
    runtime_fingerprint,
    image,
    command,
    wsl_distro,
    launcher_bin,
    launch_mode,
    live_benchmarks_enabled,
    executable: configured,
    configuration_reason: configured ? null : "solver_unconfigured",
  };
};

export const probeStarSimSolverRuntime = async (
  runtime: StarSimSolverRuntimeConfig,
): Promise<StarSimSolverRuntimeProbe> => {
  const cached = runtimeProbeCache.get(runtime.runtime_fingerprint);
  if (cached) {
    return cached;
  }

  if (!runtime.executable) {
    const result = {
      ready: false,
      status_reason: runtime.configuration_reason ?? "solver_unconfigured",
      detail:
        runtime.runtime_kind === "disabled"
          ? "Runtime mode is disabled."
          : "Runtime command/image configuration is incomplete or live benchmarks are not enabled.",
    } satisfies StarSimSolverRuntimeProbe;
    runtimeProbeCache.set(runtime.runtime_fingerprint, result);
    return result;
  }

  if (runtime.runtime_kind === "mock") {
    const result = {
      ready: true,
      status_reason: null,
      detail: null,
    } satisfies StarSimSolverRuntimeProbe;
    runtimeProbeCache.set(runtime.runtime_fingerprint, result);
    return result;
  }

  const result =
    runtime.launch_mode === "direct"
      ? await probeProcess(runtime.launcher_bin, ["--version"])
      : runtime.runtime_kind === "docker"
        ? await probeProcess(runtime.launcher_bin, ["--version"])
        : await probeProcess(
            runtime.launcher_bin,
            runtime.wsl_distro ? ["-d", runtime.wsl_distro, "--", "true"] : ["--status"],
          );

  runtimeProbeCache.set(runtime.runtime_fingerprint, result);
  return result;
};

export const canMockStructureMesa = (star: CanonicalStar): boolean => selectMesaFixtureId(star) !== null;
export const canMockOscillationGyre = (star: CanonicalStar): boolean => selectGyreFixtureId(star) !== null;

export async function executeStructureMesaRuntime(args: StructureMesaRuntimeInput): Promise<StructureMesaWorkerResult> {
  const runtime = resolveStarSimSolverRuntime("mesa");
  if (runtime.runtime_kind === "disabled") {
    throw new Error("structure_mesa_runtime_disabled");
  }

  if (runtime.runtime_kind === "mock") {
    const fixtureId = selectMesaFixtureId(args.star);
    if (!fixtureId) {
      throw new Error("structure_mesa_mock_out_of_domain");
    }

    const fixture = await loadFixture("mesa", fixtureId);
    const residualsSigma = normalizeResiduals(fixture.residuals_sigma);
    return {
      runtime_kind: "mock",
      runtime_fingerprint: runtime.runtime_fingerprint,
      execution_mode: "mock_fixture",
      live_solver: false,
      solver_version: String(fixture.solver_version ?? "mesa.mock/1"),
      benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : args.star.benchmark_case_id,
      benchmark_pack_id: args.supported_domain.benchmark_pack_id,
      fit_profile_id: args.fit_profile_id,
      fixture_id: fixtureId,
      used_seismic_constraints: usesSeismicConstraints(args.star),
      fit_status: "fit_completed",
      evidence_fit: typeof fixture.evidence_fit === "number" ? fixture.evidence_fit : 0.85,
      structure_summary:
        typeof fixture.structure_summary === "object" && fixture.structure_summary
          ? (fixture.structure_summary as Record<string, unknown>)
          : {},
      synthetic_observables:
        typeof fixture.synthetic_observables === "object" && fixture.synthetic_observables
          ? (fixture.synthetic_observables as Record<string, unknown>)
          : {},
      inferred_params:
        typeof fixture.inferred_params === "object" && fixture.inferred_params
          ? (fixture.inferred_params as Record<string, unknown>)
          : {},
      residuals_sigma: residualsSigma,
      fit_summary: buildDefaultFitSummary({
        profileId: args.fit_profile_id,
        fitConstraints: args.fit_constraints,
        residualsSigma,
      }),
      supported_domain: args.supported_domain,
      domain_validity:
        typeof fixture.domain_validity === "object" && fixture.domain_validity
          ? (fixture.domain_validity as Record<string, unknown>)
          : {},
      model_placeholder: {
        kind: "gsm_hdf5_placeholder",
        solver: "mesa",
        fixture_id: fixtureId,
        note: "Mock runtime placeholder for a future MESA GSM HDF5 model artifact.",
      },
      artifact_payloads: [],
      live_solver_metadata: {
        fixture_id: fixtureId,
      },
    };
  }

  const probe = await probeStarSimSolverRuntime(runtime);
  if (!probe.ready) {
    throw new Error(`star_sim_runtime_not_ready:${runtime.runtime_kind}:${probe.detail ?? probe.status_reason ?? "unknown"}`);
  }

  const payload = await executeExternalRuntime(runtime, {
    schema_version: "star-sim-runtime/1",
    lane_id: "structure_mesa",
    cache_key: args.cache_key,
    benchmark_case_id: args.star.benchmark_case_id,
    benchmark_pack_id: args.supported_domain.benchmark_pack_id,
    fit_profile_id: args.fit_profile_id,
    fit_constraints: args.fit_constraints,
    physics_flags: args.star.physics_flags,
    target: args.star.target,
    canonical_observables: args.star.fields,
    requested_lanes: args.star.requested_lanes,
    evidence_refs: args.star.evidence_refs,
    supported_domain: args.supported_domain,
  });
  const validated = validateLiveStructureProtocol(payload);
  const residualsSigma = validated.residuals_sigma ?? {};
  return {
    runtime_kind: runtime.runtime_kind as Exclude<StarSimExternalRuntimeKind, "disabled">,
    runtime_fingerprint: runtime.runtime_fingerprint,
    execution_mode: validated.execution_mode,
    live_solver: true,
    solver_version: validated.solver_version,
    benchmark_case_id: validated.benchmark_case_id,
    benchmark_pack_id: validated.benchmark_pack_id ?? args.supported_domain.benchmark_pack_id,
    fit_profile_id: validated.fit_profile_id ?? args.fit_profile_id,
    fixture_id: null,
    used_seismic_constraints:
      typeof validated.used_seismic_constraints === "boolean"
        ? validated.used_seismic_constraints
        : usesSeismicConstraints(args.star),
    fit_status: validated.fit_status ?? "fit_completed",
    evidence_fit: typeof validated.evidence_fit === "number" ? validated.evidence_fit : 0.9,
    structure_summary: validated.structure_summary,
    synthetic_observables: validated.synthetic_observables,
    fit_summary:
      validated.fit_summary
      ?? buildDefaultFitSummary({
        profileId: validated.fit_profile_id ?? args.fit_profile_id,
        fitConstraints: args.fit_constraints,
        residualsSigma,
      }),
    supported_domain: validated.supported_domain ?? args.supported_domain,
    inferred_params: validated.inferred_params ?? {},
    residuals_sigma: residualsSigma,
    domain_validity: validated.domain_validity ?? {},
    model_placeholder: null,
    artifact_payloads: validated.artifact_payloads,
    live_solver_metadata: validated.live_solver_metadata ?? {},
  };
}

export async function executeOscillationGyreRuntime(
  args: OscillationGyreRuntimeInput,
): Promise<OscillationGyreWorkerResult> {
  const runtime = resolveStarSimSolverRuntime("gyre");
  if (runtime.runtime_kind === "disabled") {
    throw new Error("oscillation_gyre_runtime_disabled");
  }

  if (runtime.runtime_kind === "mock") {
    const fixtureId = selectGyreFixtureId(args.star);
    if (!fixtureId) {
      throw new Error("oscillation_gyre_mock_out_of_domain");
    }

    const fixture = await loadFixture("gyre", fixtureId);
    const residualsSigma = normalizeResiduals(fixture.residuals_sigma);
    const modeSummary =
      typeof fixture.mode_summary === "object" && fixture.mode_summary
        ? (fixture.mode_summary as Record<string, unknown>)
        : {};
    return {
      runtime_kind: "mock",
      runtime_fingerprint: runtime.runtime_fingerprint,
      execution_mode: "mock_fixture",
      live_solver: false,
      solver_version: String(fixture.solver_version ?? "gyre.mock/1"),
      benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : args.star.benchmark_case_id,
      benchmark_pack_id: args.supported_domain.benchmark_pack_id,
      fit_profile_id: args.fit_profile_id,
      fixture_id: fixtureId,
      fit_status: "comparison_completed",
      evidence_fit: typeof fixture.evidence_fit === "number" ? fixture.evidence_fit : 0.82,
      mode_summary: modeSummary,
      comparison_summary: buildDefaultComparisonSummary({
        profileId: args.fit_profile_id,
        residualsSigma,
      }),
      seismic_match_summary: buildDefaultSeismicMatchSummary(modeSummary),
      supported_domain: args.supported_domain,
      inferred_params:
        typeof fixture.inferred_params === "object" && fixture.inferred_params
          ? (fixture.inferred_params as Record<string, unknown>)
          : {},
      residuals_sigma: residualsSigma,
      domain_validity:
        typeof fixture.domain_validity === "object" && fixture.domain_validity
          ? (fixture.domain_validity as Record<string, unknown>)
          : {},
      artifact_payloads: [],
      live_solver_metadata: {
        fixture_id: fixtureId,
      },
    };
  }

  const probe = await probeStarSimSolverRuntime(runtime);
  if (!probe.ready) {
    throw new Error(`star_sim_runtime_not_ready:${runtime.runtime_kind}:${probe.detail ?? probe.status_reason ?? "unknown"}`);
  }

  const payload = await executeExternalRuntime(runtime, {
    schema_version: "star-sim-runtime/1",
    lane_id: "oscillation_gyre",
    benchmark_case_id: args.star.benchmark_case_id,
    benchmark_pack_id: args.supported_domain.benchmark_pack_id,
    fit_profile_id: args.fit_profile_id,
    fit_constraints: args.fit_constraints,
    physics_flags: args.star.physics_flags,
    target: args.star.target,
    canonical_observables: args.star.fields,
    requested_lanes: args.star.requested_lanes,
    structure_cache_key: args.structure_cache_key,
    structure_claim_id: args.structure_claim_id,
    structure_summary: args.structure_summary,
    evidence_refs: args.star.evidence_refs,
    supported_domain: args.supported_domain,
  });
  const validated = validateLiveGyreProtocol(payload);
  const residualsSigma = validated.residuals_sigma ?? {};
  return {
    runtime_kind: runtime.runtime_kind as Exclude<StarSimExternalRuntimeKind, "disabled">,
    runtime_fingerprint: runtime.runtime_fingerprint,
    execution_mode: validated.execution_mode,
    live_solver: true,
    solver_version: validated.solver_version,
    benchmark_case_id: validated.benchmark_case_id,
    benchmark_pack_id: validated.benchmark_pack_id ?? args.supported_domain.benchmark_pack_id,
    fit_profile_id: validated.fit_profile_id ?? args.fit_profile_id,
    fixture_id: null,
    fit_status: validated.fit_status ?? "comparison_completed",
    evidence_fit: typeof validated.evidence_fit === "number" ? validated.evidence_fit : 0.88,
    mode_summary: validated.mode_summary,
    comparison_summary:
      validated.comparison_summary
      ?? buildDefaultComparisonSummary({
        profileId: validated.fit_profile_id ?? args.fit_profile_id,
        residualsSigma,
      }),
    seismic_match_summary:
      validated.seismic_match_summary ?? buildDefaultSeismicMatchSummary(validated.mode_summary),
    supported_domain: validated.supported_domain ?? args.supported_domain,
    inferred_params: validated.inferred_params ?? {},
    residuals_sigma: residualsSigma,
    domain_validity: validated.domain_validity ?? {},
    artifact_payloads: validated.artifact_payloads,
    live_solver_metadata: validated.live_solver_metadata ?? {},
  };
}

export const __resetStarSimRuntimeProbeCacheForTest = (): void => {
  runtimeProbeCache.clear();
};
