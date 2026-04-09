import {
  buildOscillationGyreCacheKey,
  buildStructureMesaCacheKey,
  readStructureMesaCache,
  readOscillationGyreCache,
  writeOscillationGyreCache,
} from "../artifacts";
import {
  getBenchmarkRegistryVersion,
  resolveBenchmarkForLane,
  validateBenchmarkOutput,
} from "../benchmarks";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, RequestedLane, StarSimLaneResult } from "../contract";
import { runOscillationGyreInWorker } from "../worker/starsim-worker-client";
import {
  canMockOscillationGyre,
  probeStarSimSolverRuntime,
  resolveStarSimSolverRuntime,
} from "../worker/starsim-runtime";
import {
  STRUCTURE_MESA_SOLVER_MANIFEST,
  type StarSimLaneExecutionMode,
} from "./structure-mesa";

export const OSCILLATION_GYRE_SOLVER_MANIFEST = `oscillation_gyre/3:${getBenchmarkRegistryVersion()}`;

const buildUnavailableLane = (args: {
  star: CanonicalStar;
  cacheKey: string;
  structureClaimId: string | null;
  runtimeMode: StarSimLaneResult["runtime_mode"];
  runtimeFingerprint: string;
  statusReason:
    | "missing_structure_model"
    | "async_job_required"
    | "solver_unconfigured"
    | "runtime_not_ready"
    | "out_of_domain"
    | "benchmark_required";
  note: string;
  cacheStatus?: StarSimLaneResult["cache_status"];
  cacheStatusReason?: string;
  artifactIntegrityStatus?: StarSimLaneResult["artifact_integrity_status"];
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "oscillation_gyre",
    requested_lane: "oscillation_gyre",
    solver_id: "starsim.gyre.oscillation/1",
    label: "GYRE oscillation solver",
    availability: "unavailable",
    status: "unavailable",
    status_reason: args.statusReason,
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: "P3",
    assumptions: [
      "This lane requires a cached or freshly executed structure_mesa model before oscillation outputs can be produced.",
    ],
    domain_validity: {
      runtime_backbone: "gyre_worker",
      cached_execution_only_on_sync_route: true,
    },
    observables_used: [],
    inferred_params: {},
    residuals_sigma: {},
    falsifier_ids: [`STAR_SIM_OSCILLATION_GYRE_${args.statusReason.toUpperCase()}`],
    tree_dag: buildTreeDagClaim({
      claim_id: `claim:star-sim:oscillation_gyre:${args.cacheKey.replace(/^sha256:/, "").slice(0, 16)}`,
      parent_claim_ids: args.structureClaimId ? [args.structureClaimId] : [],
      equation_refs: ["gyre_linear_adiabatic_modes", "mesa_gyre_structure_bridge"],
      evidence_refs: evidenceRefs,
    }),
    result: {
      cache_key: args.cacheKey,
      reason: args.note,
    },
    cache_key: args.cacheKey,
    runtime_mode: args.runtimeMode,
    runtime_fingerprint: args.runtimeFingerprint,
    artifact_integrity_status: args.artifactIntegrityStatus ?? "unknown",
    cache_status: args.cacheStatus ?? "missing",
    cache_status_reason: args.cacheStatusReason,
    evidence_fit: 0,
    domain_penalty: 0,
    note: args.note,
  };
};

const buildFailedBenchmarkLane = (args: {
  star: CanonicalStar;
  cacheKey: string;
  structureClaimId: string;
  runtimeMode: StarSimLaneResult["runtime_mode"];
  runtimeFingerprint: string;
  benchmarkCaseId: string | null;
  benchmarkValidation: NonNullable<StarSimLaneResult["benchmark_validation"]>;
  workerResult: Awaited<ReturnType<typeof runOscillationGyreInWorker>>;
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "oscillation_gyre_failed",
    requested_lane: "oscillation_gyre",
    solver_id: args.workerResult.solver_version,
    label: "GYRE oscillation solver",
    availability: "unavailable",
    status: "failed",
    status_reason: "benchmark_validation_failed",
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: "P3",
    assumptions: [
      "A live benchmark execution completed, but the oscillation output fell outside the declared benchmark tolerance envelope.",
    ],
    domain_validity: {
      ...args.workerResult.domain_validity,
      runtime_kind: args.workerResult.runtime_kind,
      requires_structure_cache: true,
    },
    observables_used: [
      "asteroseismology.numax_uHz",
      "asteroseismology.deltanu_uHz",
      "asteroseismology.mode_count",
    ],
    inferred_params: args.workerResult.inferred_params,
    residuals_sigma: args.workerResult.residuals_sigma,
    falsifier_ids: ["STAR_SIM_OSCILLATION_GYRE_BENCHMARK_VALIDATION_FAILED"],
    tree_dag: buildTreeDagClaim({
      claim_id: `claim:star-sim:oscillation_gyre:${args.cacheKey.replace(/^sha256:/, "").slice(0, 16)}`,
      parent_claim_ids: [args.structureClaimId],
      equation_refs: ["gyre_linear_adiabatic_modes", "mesa_gyre_structure_bridge"],
      evidence_refs: evidenceRefs,
    }),
    result: {
      runtime: {
        kind: args.workerResult.runtime_kind,
        fingerprint: args.workerResult.runtime_fingerprint,
        execution_mode: args.workerResult.execution_mode,
        live_solver: args.workerResult.live_solver,
        fixture_id: args.workerResult.fixture_id,
      },
      benchmark_case_id: args.benchmarkCaseId,
      benchmark_validation: args.benchmarkValidation,
      cache_key: args.cacheKey,
      mode_summary: args.workerResult.mode_summary,
      live_solver_metadata: args.workerResult.live_solver_metadata,
    },
    cache_key: args.cacheKey,
    runtime_mode: args.runtimeMode,
    runtime_fingerprint: args.runtimeFingerprint,
    artifact_integrity_status: "unknown",
    cache_status: "missing",
    benchmark_validation: args.benchmarkValidation,
    evidence_fit: 0,
    domain_penalty: 0,
    note: "Live benchmark oscillation output failed post-run validation and was not cached as a successful artifact.",
  };
};

const resolveStructureLaneResult = async (
  star: CanonicalStar,
  resolvedLanes: Partial<Record<RequestedLane, StarSimLaneResult>>,
): Promise<StarSimLaneResult | null> => {
  const current = resolvedLanes.structure_mesa;
  if (current?.status === "available") {
    return current;
  }
  const structureRuntime = resolveStarSimSolverRuntime("mesa");
  const structureCacheIdentity = {
    runtime_mode: structureRuntime.runtime_kind,
    runtime_fingerprint: structureRuntime.runtime_fingerprint,
    solver_manifest: STRUCTURE_MESA_SOLVER_MANIFEST,
  } as const;
  const structureCacheKey = buildStructureMesaCacheKey(star, structureCacheIdentity);
  const cached = await readStructureMesaCache(structureCacheKey, structureCacheIdentity);
  if (cached.status === "hit" && cached.laneResult.status === "available") {
    return cached.laneResult;
  }
  return null;
};

export async function runOscillationGyreLane(
  star: CanonicalStar,
  options: {
    executionMode: StarSimLaneExecutionMode;
    resolvedLanes: Partial<Record<RequestedLane, StarSimLaneResult>>;
  },
): Promise<StarSimLaneResult> {
  const runtime = resolveStarSimSolverRuntime("gyre");
  const benchmarkResolution =
    runtime.runtime_kind === "mock" ? null : resolveBenchmarkForLane(star, "oscillation_gyre");
  const cacheIdentity = {
    runtime_mode: runtime.runtime_kind,
    runtime_fingerprint: runtime.runtime_fingerprint,
    solver_manifest: OSCILLATION_GYRE_SOLVER_MANIFEST,
  } as const;
  const structureLane = await resolveStructureLaneResult(star, options.resolvedLanes);
  const structureCacheKey = structureLane?.cache_key ?? "missing_structure_cache";
  const cacheKey = buildOscillationGyreCacheKey(star, structureCacheKey, cacheIdentity);
  const cached = await readOscillationGyreCache(cacheKey, cacheIdentity);
  if (cached.status === "hit") {
    return cached.laneResult;
  }

  if (!structureLane) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: null,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      statusReason: "missing_structure_model",
      note: "No cached or current-run structure_mesa artifact is available for GYRE to consume.",
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (!runtime.executable) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      statusReason: "solver_unconfigured",
      note: "No GYRE runtime is configured. Set STAR_SIM_GYRE_RUNTIME=mock|docker|wsl or populate the cache first.",
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (benchmarkResolution?.status === "unavailable") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      statusReason: benchmarkResolution.reason,
      note: benchmarkResolution.note,
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (runtime.runtime_kind === "mock" && !canMockOscillationGyre(star)) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      statusReason: "out_of_domain",
      note: "The mock GYRE runtime currently ships only solar and G-type main-sequence fixtures.",
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    const probe = await probeStarSimSolverRuntime(runtime);
    if (!probe.ready) {
      return buildUnavailableLane({
        star,
        cacheKey,
        structureClaimId: structureLane.tree_dag.claim_id,
        runtimeMode: runtime.runtime_kind,
        runtimeFingerprint: runtime.runtime_fingerprint,
        statusReason: probe.status_reason ?? "runtime_not_ready",
        note: probe.detail ?? `The ${runtime.runtime_kind} GYRE runtime failed readiness checks.`,
        cacheStatus: cached.miss_reason,
        cacheStatusReason: cached.detail,
        artifactIntegrityStatus: cached.artifact_integrity_status,
      });
    }
  }

  if (options.executionMode === "sync") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      statusReason: "async_job_required",
      note: "No valid cached GYRE artifact was found. Submit this request to /api/star-sim/v1/jobs to execute the worker.",
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  const evidenceRefs = collectCanonicalEvidenceRefs(star);
  const structureSummary =
    typeof structureLane.result.structure_summary === "object" && structureLane.result.structure_summary
      ? (structureLane.result.structure_summary as Record<string, unknown>)
      : {};
  const workerResult = await runOscillationGyreInWorker({
    star,
    cacheKey,
    structureCacheKey,
    structureClaimId: structureLane.tree_dag.claim_id,
    structureSummary,
  });
  const benchmarkValidation =
    workerResult.live_solver && benchmarkResolution?.status === "ok"
      ? validateBenchmarkOutput({
          benchmark: benchmarkResolution.benchmark,
          lane: "oscillation_gyre",
          payload: {
            mode_summary: workerResult.mode_summary,
          },
          artifactKinds: workerResult.artifact_payloads.map((artifact) => artifact.kind),
        })
      : undefined;
  if (workerResult.live_solver && (!benchmarkValidation?.passed || workerResult.benchmark_case_id !== benchmarkResolution?.benchmark_case_id)) {
    return buildFailedBenchmarkLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: workerResult.runtime_kind,
      runtimeFingerprint: workerResult.runtime_fingerprint,
      benchmarkCaseId: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
      benchmarkValidation:
        benchmarkValidation
        ?? {
          passed: false,
          tolerance_profile: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark.tolerance_profile : "unknown",
          checked_metrics: [],
          notes: ["Benchmark case mismatch between request resolution and live runtime output."],
        },
      workerResult,
    });
  }
  const maturity = workerResult.live_solver ? "research_sim" : "obs_fit";
  const claimId = `claim:star-sim:oscillation_gyre:${cacheKey.replace(/^sha256:/, "").slice(0, 16)}`;
  const laneResult: StarSimLaneResult = {
    lane_id: "oscillation_gyre",
    requested_lane: "oscillation_gyre",
    solver_id: workerResult.solver_version,
    label: "GYRE oscillation solver",
    availability: "available",
    status: "available",
    execution_kind: "simulation",
    maturity,
    phys_class: "P3",
    assumptions: [
      workerResult.live_solver
        ? "This result comes from a live benchmark-scoped GYRE execution path. It is validated only against the registered benchmark tolerance profile, not against arbitrary-star seismology claims."
        : workerResult.runtime_kind === "mock"
        ? "This result comes from the fixture-backed mock GYRE runtime and is suitable for orchestration and contract testing, not public seismology claims."
        : "This lane uses an external GYRE execution backend and caches its artifacts for deterministic reuse.",
    ],
    domain_validity: {
      ...workerResult.domain_validity,
      runtime_kind: workerResult.runtime_kind,
      requires_structure_cache: true,
    },
    observables_used: [
      "asteroseismology.numax_uHz",
      "asteroseismology.deltanu_uHz",
      "asteroseismology.mode_count",
    ],
    inferred_params: workerResult.inferred_params,
    residuals_sigma: workerResult.residuals_sigma,
    falsifier_ids: [],
    tree_dag: buildTreeDagClaim({
      claim_id: claimId,
      parent_claim_ids: [structureLane.tree_dag.claim_id],
      equation_refs: ["gyre_linear_adiabatic_modes", "mesa_gyre_structure_bridge"],
      evidence_refs: [...evidenceRefs, `artifact:star-sim:oscillation_gyre:${cacheKey.replace(/^sha256:/, "").slice(0, 16)}`],
    }),
    result: {
      runtime: {
        kind: workerResult.runtime_kind,
        fingerprint: workerResult.runtime_fingerprint,
        execution_mode: workerResult.execution_mode,
        live_solver: workerResult.live_solver,
        fixture_id: workerResult.fixture_id,
      },
      benchmark_case_id: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
      benchmark_validation: benchmarkValidation,
      cache_key: cacheKey,
      structure_cache_key: structureCacheKey,
      structure_claim_id: structureLane.tree_dag.claim_id,
      mode_summary: workerResult.mode_summary,
      live_solver_metadata: workerResult.live_solver_metadata,
    },
    cache_key: cacheKey,
    runtime_mode: workerResult.runtime_kind,
    runtime_fingerprint: workerResult.runtime_fingerprint,
    artifact_integrity_status: "verified",
    cache_status: "hit",
    benchmark_validation: benchmarkValidation,
    evidence_fit: workerResult.evidence_fit,
    domain_penalty: 1,
    note:
      workerResult.live_solver
        ? "Live benchmark-scoped GYRE output cached after validation against the registered tolerance profile."
        : workerResult.runtime_kind === "mock"
        ? "Fixture-backed GYRE mock output cached for deterministic star-sim orchestration."
        : "External GYRE output cached for deterministic star-sim orchestration.",
  };

  const artifactRefs = await writeOscillationGyreCache({
    star,
    cacheKey,
    parentStructureCacheKey: structureCacheKey,
    runtimeMode: workerResult.runtime_kind,
    runtimeFingerprint: workerResult.runtime_fingerprint,
    solverManifest: OSCILLATION_GYRE_SOLVER_MANIFEST,
    benchmarkCaseId: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
    summary: {
      benchmark_case_id: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
      benchmark_validation: benchmarkValidation,
      structure_cache_key: structureCacheKey,
      mode_summary: workerResult.mode_summary,
      inferred_params: workerResult.inferred_params,
      residuals_sigma: workerResult.residuals_sigma,
      live_solver_metadata: workerResult.live_solver_metadata,
    },
    laneResult,
    runtimeArtifacts: workerResult.artifact_payloads,
  });

  return {
    ...laneResult,
    artifact_refs: artifactRefs,
  };
}
