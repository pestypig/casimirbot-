import {
  buildOscillationGyreCacheKey,
  buildStructureMesaCacheKey,
  readOscillationGyreCache,
  readStructureMesaCache,
  type StarSimCacheControls,
  writeOscillationGyreCache,
} from "../artifacts";
import {
  createBenchmarkPackArtifact,
  getBenchmarkRegistryVersion,
  resolveBenchmarkForLane,
  resolveBenchmarkPackForLane,
  validateBenchmarkOutput,
  validateBenchmarkPackOutput,
} from "../benchmarks";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import { evaluateStarSimSupportedDomain } from "../domain";
import type { CanonicalStar, RequestedLane, StarSimBenchmarkValidation, StarSimLaneResult } from "../contract";
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

export const OSCILLATION_GYRE_SOLVER_MANIFEST = `oscillation_gyre/4:${getBenchmarkRegistryVersion()}`;

const collectObservablesUsed = (star: CanonicalStar): string[] => {
  const used: string[] = [];
  if (typeof star.fields.asteroseismology.numax_uHz.value === "number") used.push("asteroseismology.numax_uHz");
  if (typeof star.fields.asteroseismology.deltanu_uHz.value === "number") used.push("asteroseismology.deltanu_uHz");
  if (typeof star.fields.asteroseismology.mode_count.value === "number") used.push("asteroseismology.mode_count");
  if (typeof star.fields.spectroscopy.teff_K.value === "number") used.push("spectroscopy.teff_K");
  if (typeof star.fields.spectroscopy.logg_cgs.value === "number") used.push("spectroscopy.logg_cgs");
  return used;
};

const fitStatusFromReason = (
  statusReason: string,
): "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain" => {
  if (statusReason === "seismology_required" || statusReason === "insufficient_observables" || statusReason === "missing_structure_model") {
    return "insufficient_data";
  }
  if (statusReason === "out_of_supported_domain" || statusReason === "unsupported_evolutionary_state") {
    return "out_of_domain";
  }
  return "insufficient_data";
};

const buildUnavailableLane = (args: {
  star: CanonicalStar;
  cacheKey: string;
  structureClaimId: string | null;
  runtimeMode: StarSimLaneResult["runtime_mode"];
  runtimeFingerprint: string;
  supportedDomain: ReturnType<typeof evaluateStarSimSupportedDomain>;
  benchmarkPackId: string | null;
  fitProfileId: string | null;
  statusReason:
    | "missing_structure_model"
    | "async_job_required"
    | "solver_unconfigured"
    | "runtime_not_ready"
    | "out_of_domain"
    | "benchmark_required"
    | "out_of_supported_domain"
    | "insufficient_observables"
    | "seismology_required"
    | "unsupported_evolutionary_state";
  note: string;
  cacheStatus?: StarSimLaneResult["cache_status"];
  cacheStatusReason?: string;
  artifactIntegrityStatus?: StarSimLaneResult["artifact_integrity_status"];
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "oscillation_gyre",
    requested_lane: "oscillation_gyre",
    solver_id: "starsim.gyre.oscillation/2",
    label: "GYRE oscillation solver",
    availability: "unavailable",
    status: "unavailable",
    status_reason: args.statusReason,
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: "P3",
    assumptions: [
      "This lane requires a supported solar-like seismology domain and a valid structure_mesa artifact before oscillation outputs can be produced.",
    ],
    domain_validity: {
      runtime_backbone: "gyre_worker",
      cached_execution_only_on_sync_route: true,
      supported_domain: args.supportedDomain,
    },
    observables_used: collectObservablesUsed(args.star),
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
      fit_status: fitStatusFromReason(args.statusReason),
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.supportedDomain.fit_constraints_applied,
      supported_domain: args.supportedDomain,
      benchmark_pack: args.benchmarkPackId
        ? {
            id: args.benchmarkPackId,
            benchmark_registry_version: getBenchmarkRegistryVersion(),
            support_mode: "fit_backed_supported_domain",
          }
        : null,
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
  benchmarkPackId: string | null;
  benchmarkValidation: StarSimBenchmarkValidation;
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
      "A live seismic comparison completed, but the output fell outside the declared benchmark or benchmark-pack tolerance envelope.",
    ],
    domain_validity: {
      ...args.workerResult.domain_validity,
      runtime_kind: args.workerResult.runtime_kind,
      requires_structure_cache: true,
      supported_domain: args.workerResult.supported_domain,
    },
    observables_used: collectObservablesUsed(args.star),
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
      benchmark_pack: args.benchmarkPackId
        ? {
            id: args.benchmarkPackId,
            benchmark_registry_version: getBenchmarkRegistryVersion(),
          }
        : null,
      cache_key: args.cacheKey,
      fit_status: args.workerResult.fit_status,
      fit_profile_id: args.workerResult.fit_profile_id,
      comparison_summary: args.workerResult.comparison_summary,
      seismic_match_summary: args.workerResult.seismic_match_summary,
      supported_domain: args.workerResult.supported_domain,
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
    note: "Live oscillation comparison failed post-run validation and was not cached as a successful artifact.",
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
  const structureSupportedDomain = evaluateStarSimSupportedDomain(star, "structure_mesa");
  const structureControls: StarSimCacheControls = {
    benchmark_pack_id: structureSupportedDomain.benchmark_pack_id,
    fit_profile_id: structureSupportedDomain.fit_profile_id,
    fit_constraints: structureSupportedDomain.fit_constraints_applied,
    supported_domain_id: structureSupportedDomain.id,
    supported_domain_version: structureSupportedDomain.version,
  };
  const structureCacheIdentity = {
    runtime_mode: structureRuntime.runtime_kind,
    runtime_fingerprint: structureRuntime.runtime_fingerprint,
    solver_manifest: STRUCTURE_MESA_SOLVER_MANIFEST,
  } as const;
  const structureCacheKey = buildStructureMesaCacheKey(star, structureCacheIdentity, structureControls);
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
  const supportedDomain = evaluateStarSimSupportedDomain(star, "oscillation_gyre");
  const benchmarkPackResolution = resolveBenchmarkPackForLane("oscillation_gyre", supportedDomain);
  const benchmarkResolution =
    runtime.runtime_kind === "mock" || !star.benchmark_case_id
      ? null
      : resolveBenchmarkForLane(star, "oscillation_gyre");
  const fitProfileId = supportedDomain.fit_profile_id;
  const structureLane = await resolveStructureLaneResult(star, options.resolvedLanes);
  const structureCacheKey = structureLane?.cache_key ?? "missing_structure_cache";
  const cacheControls: StarSimCacheControls = {
    benchmark_pack_id: supportedDomain.benchmark_pack_id,
    fit_profile_id: fitProfileId,
    fit_constraints: supportedDomain.fit_constraints_applied,
    supported_domain_id: supportedDomain.id,
    supported_domain_version: supportedDomain.version,
  };
  const cacheIdentity = {
    runtime_mode: runtime.runtime_kind,
    runtime_fingerprint: runtime.runtime_fingerprint,
    solver_manifest: OSCILLATION_GYRE_SOLVER_MANIFEST,
  } as const;
  const cacheKey = buildOscillationGyreCacheKey(star, structureCacheKey, cacheIdentity, cacheControls);
  const cached = await readOscillationGyreCache(cacheKey, cacheIdentity);
  if (cached.status === "hit") {
    return cached.laneResult;
  }

  if (benchmarkResolution?.status === "unavailable") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane?.tree_dag.claim_id ?? null,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: supportedDomain.benchmark_pack_id,
      fitProfileId,
      statusReason: benchmarkResolution.reason,
      note: benchmarkResolution.note,
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (benchmarkPackResolution.status === "unavailable") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane?.tree_dag.claim_id ?? null,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: supportedDomain.benchmark_pack_id,
      fitProfileId,
      statusReason: benchmarkPackResolution.reason,
      note: benchmarkPackResolution.note,
      cacheStatus: cached.miss_reason,
      cacheStatusReason: cached.detail,
      artifactIntegrityStatus: cached.artifact_integrity_status,
    });
  }

  if (!structureLane) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: null,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
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
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
      statusReason: "solver_unconfigured",
      note: "No GYRE runtime is configured. Set STAR_SIM_GYRE_RUNTIME=mock|docker|wsl or populate the cache first.",
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
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
      statusReason: "out_of_supported_domain",
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
        supportedDomain,
        benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
        fitProfileId,
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
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
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
    fitProfileId,
    fitConstraints: supportedDomain.fit_constraints_applied,
    supportedDomain,
  });
  const artifactPayloads = [
    ...workerResult.artifact_payloads,
    createBenchmarkPackArtifact({
      benchmarkPack: benchmarkPackResolution.benchmark_pack,
      supportedDomain,
      validation: undefined,
      benchmarkCaseId: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
    }),
  ];
  const packValidation = validateBenchmarkPackOutput({
    benchmarkPack: benchmarkPackResolution.benchmark_pack,
    star,
    payload: {
      mode_summary: workerResult.mode_summary,
      comparison_summary: workerResult.comparison_summary,
    },
    artifactKinds: artifactPayloads.map((artifact) => artifact.kind),
  });
  const caseValidation =
    workerResult.live_solver && benchmarkResolution?.status === "ok"
      ? validateBenchmarkOutput({
          benchmark: benchmarkResolution.benchmark,
          lane: "oscillation_gyre",
          payload: {
            mode_summary: workerResult.mode_summary,
          },
          artifactKinds: artifactPayloads.map((artifact) => artifact.kind),
        })
      : undefined;
  const effectiveValidation = caseValidation ?? packValidation;
  const liveValidationPassed =
    workerResult.live_solver
    && supportedDomain.passed
    && packValidation.passed
    && (caseValidation ? caseValidation.passed : true)
    && (!benchmarkResolution || workerResult.benchmark_case_id === benchmarkResolution.benchmark_case_id);
  if (workerResult.live_solver && !liveValidationPassed) {
    return buildFailedBenchmarkLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      runtimeMode: workerResult.runtime_kind,
      runtimeFingerprint: workerResult.runtime_fingerprint,
      benchmarkCaseId: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      benchmarkValidation:
        caseValidation
        ?? {
          ...packValidation,
          notes: [
            ...packValidation.notes,
            ...(benchmarkResolution && !caseValidation ? ["Benchmark case mismatch between request resolution and live runtime output."] : []),
          ],
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
        ? "This result comes from a live seismic comparison within the declared solar-like supported domain and is benchmark-pack validated before it earns research_sim."
        : workerResult.runtime_kind === "mock"
        ? "This result comes from the fixture-backed mock GYRE runtime and is suitable for orchestration and contract testing, not public seismology claims."
        : "This lane uses an external GYRE execution backend and caches its artifacts for deterministic reuse.",
    ],
    domain_validity: {
      ...workerResult.domain_validity,
      runtime_kind: workerResult.runtime_kind,
      requires_structure_cache: true,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
    },
    observables_used: collectObservablesUsed(star),
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
      benchmark_pack: {
        id: benchmarkPackResolution.benchmark_pack_id,
        benchmark_registry_version: getBenchmarkRegistryVersion(),
        tolerance_profile: benchmarkPackResolution.benchmark_pack.tolerance_profile,
        support_mode: benchmarkPackResolution.benchmark_pack.support_mode,
        benchmark_family_ids: benchmarkPackResolution.benchmark_pack.benchmark_family_ids,
      },
      benchmark_validation: effectiveValidation,
      cache_key: cacheKey,
      structure_cache_key: structureCacheKey,
      structure_claim_id: structureLane.tree_dag.claim_id,
      fit_status: workerResult.fit_status,
      fit_profile_id: workerResult.fit_profile_id ?? fitProfileId,
      fit_constraints: supportedDomain.fit_constraints_applied,
      comparison_summary: workerResult.comparison_summary,
      seismic_match_summary: workerResult.seismic_match_summary,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
      mode_summary: workerResult.mode_summary,
      live_solver_metadata: workerResult.live_solver_metadata,
    },
    cache_key: cacheKey,
    runtime_mode: workerResult.runtime_kind,
    runtime_fingerprint: workerResult.runtime_fingerprint,
    artifact_integrity_status: "verified",
    cache_status: "hit",
    benchmark_validation: effectiveValidation,
    evidence_fit: workerResult.evidence_fit,
    domain_penalty: 1,
    note:
      workerResult.live_solver
        ? "Live GYRE comparison cached after supported-domain and benchmark-pack validation."
        : workerResult.runtime_kind === "mock"
        ? "Fixture-backed GYRE mock output cached for deterministic star-sim orchestration."
        : "External GYRE output cached for deterministic star-sim orchestration.",
  };

  const finalizedArtifacts = artifactPayloads.map((artifact) =>
    artifact.kind === "benchmark_pack"
      ? createBenchmarkPackArtifact({
          benchmarkPack: benchmarkPackResolution.benchmark_pack,
          supportedDomain,
          validation: effectiveValidation,
          benchmarkCaseId:
            benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
        })
      : artifact,
  );
  const artifactRefs = await writeOscillationGyreCache({
    star,
    cacheKey,
    parentStructureCacheKey: structureCacheKey,
    runtimeMode: workerResult.runtime_kind,
    runtimeFingerprint: workerResult.runtime_fingerprint,
    solverManifest: OSCILLATION_GYRE_SOLVER_MANIFEST,
    benchmarkCaseId: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
    benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
    fitProfileId: workerResult.fit_profile_id ?? fitProfileId,
    fitConstraints: supportedDomain.fit_constraints_applied,
    supportedDomainId: supportedDomain.id,
    supportedDomainVersion: supportedDomain.version,
    summary: {
      benchmark_case_id: benchmarkResolution?.status === "ok" ? benchmarkResolution.benchmark_case_id : workerResult.benchmark_case_id,
      benchmark_pack_id: benchmarkPackResolution.benchmark_pack_id,
      benchmark_validation: effectiveValidation,
      structure_cache_key: structureCacheKey,
      fit_status: workerResult.fit_status,
      fit_profile_id: workerResult.fit_profile_id ?? fitProfileId,
      comparison_summary: workerResult.comparison_summary,
      seismic_match_summary: workerResult.seismic_match_summary,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
      mode_summary: workerResult.mode_summary,
      inferred_params: workerResult.inferred_params,
      residuals_sigma: workerResult.residuals_sigma,
      live_solver_metadata: workerResult.live_solver_metadata,
    },
    laneResult,
    runtimeArtifacts: finalizedArtifacts,
  });

  return {
    ...laneResult,
    artifact_refs: artifactRefs,
  };
}
