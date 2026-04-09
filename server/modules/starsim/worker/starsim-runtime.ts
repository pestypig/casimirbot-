import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { stableJsonStringify } from "../../../utils/stable-json.ts";
import type { CanonicalStar, StarSimExternalRuntimeKind } from "../contract";
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
};

type OscillationGyreRuntimeInput = {
  star: CanonicalStar;
  structure_cache_key: string;
  structure_claim_id: string;
  structure_summary: Record<string, unknown>;
};

type StructureRuntimeProtocolResult = {
  schema_version: "star-sim-runtime-result/1";
  execution_mode: "live_benchmark";
  live_solver: true;
  solver_version: string;
  benchmark_case_id: string;
  used_seismic_constraints?: boolean;
  evidence_fit?: number;
  structure_summary: Record<string, unknown>;
  synthetic_observables: Record<string, unknown>;
  inferred_params?: Record<string, unknown>;
  residuals_sigma?: Record<string, number>;
  domain_validity?: Record<string, unknown>;
  artifact_payloads: StarSimRuntimeArtifactPayload[];
  live_solver_metadata?: Record<string, unknown>;
};

type GyreRuntimeProtocolResult = {
  schema_version: "star-sim-runtime-result/1";
  execution_mode: "live_benchmark";
  live_solver: true;
  solver_version: string;
  benchmark_case_id: string;
  evidence_fit?: number;
  mode_summary: Record<string, unknown>;
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

const validateLiveStructureProtocol = (payload: unknown): StructureRuntimeProtocolResult => {
  const record = asRecord(payload);
  const artifactPayloads = normalizeArtifactPayloads(record.artifact_payloads);
  if (
    record.schema_version !== "star-sim-runtime-result/1"
    || record.execution_mode !== "live_benchmark"
    || record.live_solver !== true
    || typeof record.solver_version !== "string"
    || typeof record.benchmark_case_id !== "string"
    || artifactPayloads.length === 0
  ) {
    throw new Error("star_sim_runtime_invalid_live_structure_payload");
  }

  return {
    schema_version: "star-sim-runtime-result/1",
    execution_mode: "live_benchmark",
    live_solver: true,
    solver_version: record.solver_version,
    benchmark_case_id: record.benchmark_case_id,
    used_seismic_constraints: typeof record.used_seismic_constraints === "boolean" ? record.used_seismic_constraints : undefined,
    evidence_fit: typeof record.evidence_fit === "number" ? record.evidence_fit : undefined,
    structure_summary: asRecord(record.structure_summary),
    synthetic_observables: asRecord(record.synthetic_observables),
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
    || record.execution_mode !== "live_benchmark"
    || record.live_solver !== true
    || typeof record.solver_version !== "string"
    || typeof record.benchmark_case_id !== "string"
    || artifactPayloads.length === 0
  ) {
    throw new Error("star_sim_runtime_invalid_live_gyre_payload");
  }

  return {
    schema_version: "star-sim-runtime-result/1",
    execution_mode: "live_benchmark",
    live_solver: true,
    solver_version: record.solver_version,
    benchmark_case_id: record.benchmark_case_id,
    evidence_fit: typeof record.evidence_fit === "number" ? record.evidence_fit : undefined,
    mode_summary: asRecord(record.mode_summary),
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
    return {
      runtime_kind: "mock",
      runtime_fingerprint: runtime.runtime_fingerprint,
      execution_mode: "mock_fixture",
      live_solver: false,
      solver_version: String(fixture.solver_version ?? "mesa.mock/1"),
      benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : args.star.benchmark_case_id,
      fixture_id: fixtureId,
      used_seismic_constraints: usesSeismicConstraints(args.star),
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
      residuals_sigma: normalizeResiduals(fixture.residuals_sigma),
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
    physics_flags: args.star.physics_flags,
    target: args.star.target,
    canonical_observables: args.star.fields,
    requested_lanes: args.star.requested_lanes,
    evidence_refs: args.star.evidence_refs,
  });
  const validated = validateLiveStructureProtocol(payload);
  return {
    runtime_kind: runtime.runtime_kind as Exclude<StarSimExternalRuntimeKind, "disabled">,
    runtime_fingerprint: runtime.runtime_fingerprint,
    execution_mode: "live_benchmark",
    live_solver: true,
    solver_version: validated.solver_version,
    benchmark_case_id: validated.benchmark_case_id,
    fixture_id: null,
    used_seismic_constraints:
      typeof validated.used_seismic_constraints === "boolean"
        ? validated.used_seismic_constraints
        : usesSeismicConstraints(args.star),
    evidence_fit: typeof validated.evidence_fit === "number" ? validated.evidence_fit : 0.9,
    structure_summary: validated.structure_summary,
    synthetic_observables: validated.synthetic_observables,
    inferred_params: validated.inferred_params ?? {},
    residuals_sigma: validated.residuals_sigma ?? {},
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
    return {
      runtime_kind: "mock",
      runtime_fingerprint: runtime.runtime_fingerprint,
      execution_mode: "mock_fixture",
      live_solver: false,
      solver_version: String(fixture.solver_version ?? "gyre.mock/1"),
      benchmark_case_id: typeof fixture.benchmark_case_id === "string" ? fixture.benchmark_case_id : args.star.benchmark_case_id,
      fixture_id: fixtureId,
      evidence_fit: typeof fixture.evidence_fit === "number" ? fixture.evidence_fit : 0.82,
      mode_summary:
        typeof fixture.mode_summary === "object" && fixture.mode_summary
          ? (fixture.mode_summary as Record<string, unknown>)
          : {},
      inferred_params:
        typeof fixture.inferred_params === "object" && fixture.inferred_params
          ? (fixture.inferred_params as Record<string, unknown>)
          : {},
      residuals_sigma: normalizeResiduals(fixture.residuals_sigma),
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
    physics_flags: args.star.physics_flags,
    target: args.star.target,
    canonical_observables: args.star.fields,
    requested_lanes: args.star.requested_lanes,
    structure_cache_key: args.structure_cache_key,
    structure_claim_id: args.structure_claim_id,
    structure_summary: args.structure_summary,
    evidence_refs: args.star.evidence_refs,
  });
  const validated = validateLiveGyreProtocol(payload);
  return {
    runtime_kind: runtime.runtime_kind as Exclude<StarSimExternalRuntimeKind, "disabled">,
    runtime_fingerprint: runtime.runtime_fingerprint,
    execution_mode: "live_benchmark",
    live_solver: true,
    solver_version: validated.solver_version,
    benchmark_case_id: validated.benchmark_case_id,
    fixture_id: null,
    evidence_fit: typeof validated.evidence_fit === "number" ? validated.evidence_fit : 0.88,
    mode_summary: validated.mode_summary,
    inferred_params: validated.inferred_params ?? {},
    residuals_sigma: validated.residuals_sigma ?? {},
    domain_validity: validated.domain_validity ?? {},
    artifact_payloads: validated.artifact_payloads,
    live_solver_metadata: validated.live_solver_metadata ?? {},
  };
}

export const __resetStarSimRuntimeProbeCacheForTest = (): void => {
  runtimeProbeCache.clear();
};
