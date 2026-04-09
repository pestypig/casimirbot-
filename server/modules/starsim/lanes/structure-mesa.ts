import {
  buildStructureMesaCacheKey,
  readStructureMesaCache,
  type StarSimCacheControls,
  writeStructureMesaCache,
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
import { buildLaneDiagnosticSummary } from "../diagnostics";
import { evaluateStarSimSupportedDomain } from "../domain";
import type {
  CanonicalStar,
  PhysClass,
  StarSimBenchmarkValidation,
  StarSimLaneResult,
} from "../contract";
import { runStructureMesaInWorker } from "../worker/starsim-worker-client";
import {
  canMockStructureMesa,
  probeStarSimSolverRuntime,
  resolveStarSimSolverRuntime,
} from "../worker/starsim-runtime";

export type StarSimLaneExecutionMode = "sync" | "job";
export const STRUCTURE_MESA_SOLVER_MANIFEST = `structure_mesa/4:${getBenchmarkRegistryVersion()}`;

const collectObservablesUsed = (star: CanonicalStar): string[] => {
  const used: string[] = [];
  if (typeof star.fields.structure.mass_Msun.value === "number") used.push("structure.mass_Msun");
  if (typeof star.fields.structure.radius_Rsun.value === "number") used.push("structure.radius_Rsun");
  if (typeof star.fields.structure.age_Gyr.value === "number") used.push("structure.age_Gyr");
  if (typeof star.fields.spectroscopy.teff_K.value === "number") used.push("spectroscopy.teff_K");
  if (typeof star.fields.spectroscopy.logg_cgs.value === "number") used.push("spectroscopy.logg_cgs");
  if (typeof star.fields.spectroscopy.metallicity_feh.value === "number") used.push("spectroscopy.metallicity_feh");
  if (typeof star.fields.asteroseismology.numax_uHz.value === "number") used.push("asteroseismology.numax_uHz");
  if (typeof star.fields.asteroseismology.deltanu_uHz.value === "number") used.push("asteroseismology.deltanu_uHz");
  if (typeof star.fields.asteroseismology.mode_count.value === "number") used.push("asteroseismology.mode_count");
  return used;
};

const fitStatusFromReason = (
  statusReason: string,
): "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain" => {
  if (statusReason === "insufficient_observables" || statusReason === "seismology_required") {
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
  runtimeMode: StarSimLaneResult["runtime_mode"];
  runtimeFingerprint: string;
  supportedDomain: ReturnType<typeof evaluateStarSimSupportedDomain>;
  benchmarkPackId: string | null;
  fitProfileId: string | null;
  statusReason:
    | "async_job_required"
    | "solver_unconfigured"
    | "runtime_not_ready"
    | "out_of_domain"
    | "benchmark_required"
    | "out_of_supported_domain"
    | "insufficient_observables"
    | "unsupported_evolutionary_state";
  note: string;
  cacheStatus?: StarSimLaneResult["cache_status"];
  cacheStatusReason?: string;
  artifactIntegrityStatus?: StarSimLaneResult["artifact_integrity_status"];
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "structure_mesa",
    requested_lane: "structure_mesa",
    solver_id: "starsim.mesa.structure/2",
    label: "MESA-backed 1D structure",
    availability: "unavailable",
    status: "unavailable",
    status_reason: args.statusReason,
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: "P2",
    assumptions: [
      "This lane is limited to a constrained solar-like main-sequence live-fit domain and requires an asynchronous worker run or a cached artifact.",
    ],
    domain_validity: {
      runtime_backbone: "mesa_worker",
      cached_execution_only_on_sync_route: true,
      supported_domain: args.supportedDomain,
    },
    observables_used: collectObservablesUsed(args.star),
    inferred_params: {},
    residuals_sigma: {},
    falsifier_ids: [`STAR_SIM_STRUCTURE_MESA_${args.statusReason.toUpperCase()}`],
    tree_dag: buildTreeDagClaim({
      claim_id: `claim:star-sim:structure_mesa:${args.cacheKey.replace(/^sha256:/, "").slice(0, 16)}`,
      parent_claim_ids: ["claim:star-sim:classification"],
      equation_refs: ["mesa_1d_structure_fit", "synthetic_observables_forward_model"],
      evidence_refs: evidenceRefs,
    }),
    result: {
      cache_key: args.cacheKey,
      reason: args.note,
      fit_status: fitStatusFromReason(args.statusReason),
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.supportedDomain.fit_constraints_applied,
      supported_domain: args.supportedDomain,
      benchmark_target_id: args.star.source_context?.benchmark_target_id ?? null,
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
  runtimeMode: StarSimLaneResult["runtime_mode"];
  runtimeFingerprint: string;
  benchmarkCaseId: string | null;
  benchmarkPackId: string | null;
  benchmarkValidation: StarSimBenchmarkValidation;
  workerResult: Awaited<ReturnType<typeof runStructureMesaInWorker>>;
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "structure_mesa_failed",
    requested_lane: "structure_mesa",
    solver_id: args.workerResult.solver_version,
    label: "MESA-backed 1D structure",
    availability: "unavailable",
    status: "failed",
    status_reason: "benchmark_validation_failed",
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: args.workerResult.used_seismic_constraints ? "P3" : "P2",
    assumptions: [
      "A live fit execution completed, but the output fell outside the declared benchmark or benchmark-pack tolerance envelope.",
    ],
    domain_validity: {
      ...args.workerResult.domain_validity,
      runtime_kind: args.workerResult.runtime_kind,
      supported_domain: args.workerResult.supported_domain,
      benchmark_target_id: args.star.source_context?.benchmark_target_id ?? null,
      diagnostic_summary: buildLaneDiagnosticSummary({ residuals: args.workerResult.residuals_sigma, observablesUsed: collectObservablesUsed(args.star), comparison: false }),
    },
    observables_used: collectObservablesUsed(args.star),
    inferred_params: args.workerResult.inferred_params,
    residuals_sigma: args.workerResult.residuals_sigma,
    falsifier_ids: ["STAR_SIM_STRUCTURE_MESA_BENCHMARK_VALIDATION_FAILED"],
    tree_dag: buildTreeDagClaim({
      claim_id: `claim:star-sim:structure_mesa:${args.cacheKey.replace(/^sha256:/, "").slice(0, 16)}`,
      parent_claim_ids: ["claim:star-sim:classification"],
      equation_refs: ["mesa_1d_structure_fit", "synthetic_observables_forward_model"],
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
      benchmark_target_id: args.star.source_context?.benchmark_target_id ?? null,
      benchmark_pack: args.benchmarkPackId
        ? {
            id: args.benchmarkPackId,
            benchmark_registry_version: getBenchmarkRegistryVersion(),
          }
        : null,
      cache_key: args.cacheKey,
      fit_status: args.workerResult.fit_status,
      fit_profile_id: args.workerResult.fit_profile_id,
      fit_summary: args.workerResult.fit_summary,
      supported_domain: args.workerResult.supported_domain,
      benchmark_target_id: args.star.source_context?.benchmark_target_id ?? null,
      diagnostic_summary: buildLaneDiagnosticSummary({ residuals: args.workerResult.residuals_sigma, observablesUsed: collectObservablesUsed(args.star), comparison: false }),
      structure_summary: args.workerResult.structure_summary,
      synthetic_observables: args.workerResult.synthetic_observables,
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
    note: "Live fit output failed post-run validation and was not cached as a successful artifact.",
  };
};

export async function runStructureMesaLane(
  star: CanonicalStar,
  options: { executionMode: StarSimLaneExecutionMode },
): Promise<StarSimLaneResult> {
  const runtime = resolveStarSimSolverRuntime("mesa");
  const supportedDomain = evaluateStarSimSupportedDomain(star, "structure_mesa");
  const benchmarkPackResolution = resolveBenchmarkPackForLane("structure_mesa", supportedDomain);
  const benchmarkResolution =
    runtime.runtime_kind === "mock" || !star.benchmark_case_id
      ? null
      : resolveBenchmarkForLane(star, "structure_mesa");
  const fitProfileId = supportedDomain.fit_profile_id;
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
    solver_manifest: STRUCTURE_MESA_SOLVER_MANIFEST,
  } as const;
  const cacheKey = buildStructureMesaCacheKey(star, cacheIdentity, cacheControls);
  const cacheRead = await readStructureMesaCache(cacheKey, cacheIdentity);
  if (cacheRead.status === "hit") {
    return cacheRead.laneResult;
  }

  if (!runtime.executable) {
    return buildUnavailableLane({
      star,
      cacheKey,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: supportedDomain.benchmark_pack_id,
      fitProfileId,
      statusReason: "solver_unconfigured",
      note: "No MESA runtime is configured. Set STAR_SIM_MESA_RUNTIME=mock|docker|wsl or populate the cache first.",
      cacheStatus: cacheRead.miss_reason,
      cacheStatusReason: cacheRead.detail,
      artifactIntegrityStatus: cacheRead.artifact_integrity_status,
    });
  }

  if (benchmarkResolution?.status === "unavailable") {
    return buildUnavailableLane({
      star,
      cacheKey,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: supportedDomain.benchmark_pack_id,
      fitProfileId,
      statusReason: benchmarkResolution.reason,
      note: benchmarkResolution.note,
      cacheStatus: cacheRead.miss_reason,
      cacheStatusReason: cacheRead.detail,
      artifactIntegrityStatus: cacheRead.artifact_integrity_status,
    });
  }

  if (benchmarkPackResolution.status === "unavailable") {
    return buildUnavailableLane({
      star,
      cacheKey,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: supportedDomain.benchmark_pack_id,
      fitProfileId,
      statusReason: benchmarkPackResolution.reason,
      note: benchmarkPackResolution.note,
      cacheStatus: cacheRead.miss_reason,
      cacheStatusReason: cacheRead.detail,
      artifactIntegrityStatus: cacheRead.artifact_integrity_status,
    });
  }

  if (runtime.runtime_kind === "mock" && !canMockStructureMesa(star)) {
    return buildUnavailableLane({
      star,
      cacheKey,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
      statusReason: "out_of_supported_domain",
      note: "The mock MESA runtime currently ships only solar and G-type main-sequence fixtures.",
      cacheStatus: cacheRead.miss_reason,
      cacheStatusReason: cacheRead.detail,
      artifactIntegrityStatus: cacheRead.artifact_integrity_status,
    });
  }

  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    const probe = await probeStarSimSolverRuntime(runtime);
    if (!probe.ready) {
      return buildUnavailableLane({
        star,
        cacheKey,
        runtimeMode: runtime.runtime_kind,
        runtimeFingerprint: runtime.runtime_fingerprint,
        supportedDomain,
        benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
        fitProfileId,
        statusReason: probe.status_reason ?? "runtime_not_ready",
        note: probe.detail ?? `The ${runtime.runtime_kind} MESA runtime failed readiness checks.`,
        cacheStatus: cacheRead.miss_reason,
        cacheStatusReason: cacheRead.detail,
        artifactIntegrityStatus: cacheRead.artifact_integrity_status,
      });
    }
  }

  if (options.executionMode === "sync") {
    return buildUnavailableLane({
      star,
      cacheKey,
      runtimeMode: runtime.runtime_kind,
      runtimeFingerprint: runtime.runtime_fingerprint,
      supportedDomain,
      benchmarkPackId: benchmarkPackResolution.benchmark_pack_id,
      fitProfileId,
      statusReason: "async_job_required",
      note: "No valid cached MESA artifact was found. Submit this request to /api/star-sim/v1/jobs to execute the worker.",
      cacheStatus: cacheRead.miss_reason,
      cacheStatusReason: cacheRead.detail,
      artifactIntegrityStatus: cacheRead.artifact_integrity_status,
    });
  }

  const evidenceRefs = collectCanonicalEvidenceRefs(star);
  const workerResult = await runStructureMesaInWorker({
    star,
    cacheKey,
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
      structure_summary: workerResult.structure_summary,
      synthetic_observables: workerResult.synthetic_observables,
      fit_summary: workerResult.fit_summary,
    },
    artifactKinds: artifactPayloads.map((artifact) => artifact.kind),
  });
  const caseValidation =
    workerResult.live_solver && benchmarkResolution?.status === "ok"
      ? validateBenchmarkOutput({
          benchmark: benchmarkResolution.benchmark,
          lane: "structure_mesa",
          payload: {
            structure_summary: workerResult.structure_summary,
            synthetic_observables: workerResult.synthetic_observables,
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

  const physClass: PhysClass = workerResult.used_seismic_constraints ? "P3" : "P2";
  const maturity = workerResult.live_solver ? "research_sim" : "obs_fit";
  const claimId = `claim:star-sim:structure_mesa:${cacheKey.replace(/^sha256:/, "").slice(0, 16)}`;
  const laneResult: StarSimLaneResult = {
    lane_id: "structure_mesa",
    requested_lane: "structure_mesa",
    solver_id: workerResult.solver_version,
    label: "MESA-backed 1D structure",
    availability: "available",
    status: "available",
    execution_kind: "simulation",
    maturity,
    phys_class: physClass,
    assumptions: [
      workerResult.live_solver
        ? "This result comes from a live constrained MESA fit within the declared solar-like supported domain and is benchmark-pack validated before it earns research_sim."
        : workerResult.runtime_kind === "mock"
        ? "This result comes from the fixture-backed mock MESA runtime and is suitable for orchestration and contract testing, not public scientific claims."
        : "This lane uses an external MESA execution backend and caches its artifacts for deterministic reuse.",
    ],
    domain_validity: {
      ...workerResult.domain_validity,
      runtime_kind: workerResult.runtime_kind,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
    },
    observables_used: collectObservablesUsed(star),
    inferred_params: workerResult.inferred_params,
    residuals_sigma: workerResult.residuals_sigma,
    falsifier_ids: [],
    tree_dag: buildTreeDagClaim({
      claim_id: claimId,
      parent_claim_ids: ["claim:star-sim:classification"],
      equation_refs: ["mesa_1d_structure_fit", "synthetic_observables_forward_model"],
      evidence_refs: [...evidenceRefs, `artifact:star-sim:structure_mesa:${cacheKey.replace(/^sha256:/, "").slice(0, 16)}`],
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
      benchmark_target_id: star.source_context?.benchmark_target_id ?? null,
      cache_key: cacheKey,
      fit_status: workerResult.fit_status,
      fit_profile_id: workerResult.fit_profile_id ?? fitProfileId,
      fit_constraints: supportedDomain.fit_constraints_applied,
      fit_summary: workerResult.fit_summary,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
      structure_summary: workerResult.structure_summary,
      synthetic_observables: workerResult.synthetic_observables,
      used_seismic_constraints: workerResult.used_seismic_constraints,
      live_solver_metadata: workerResult.live_solver_metadata,
      diagnostic_summary: buildLaneDiagnosticSummary({ residuals: workerResult.residuals_sigma, observablesUsed: collectObservablesUsed(star), comparison: false }),
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
        ? "Live constrained MESA fit cached after supported-domain and benchmark-pack validation."
        : workerResult.runtime_kind === "mock"
        ? "Fixture-backed MESA mock output cached for deterministic star-sim orchestration."
        : "External MESA output cached for deterministic star-sim orchestration.",
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
  const artifactRefs = await writeStructureMesaCache({
    star,
    cacheKey,
    runtimeMode: workerResult.runtime_kind,
    runtimeFingerprint: workerResult.runtime_fingerprint,
    solverManifest: STRUCTURE_MESA_SOLVER_MANIFEST,
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
      benchmark_target_id: star.source_context?.benchmark_target_id ?? null,
      fit_status: workerResult.fit_status,
      fit_profile_id: workerResult.fit_profile_id ?? fitProfileId,
      fit_summary: workerResult.fit_summary,
      supported_domain: workerResult.supported_domain ?? supportedDomain,
      structure_summary: workerResult.structure_summary,
      synthetic_observables: workerResult.synthetic_observables,
      inferred_params: workerResult.inferred_params,
      residuals_sigma: workerResult.residuals_sigma,
      live_solver_metadata: workerResult.live_solver_metadata,
      diagnostic_summary: buildLaneDiagnosticSummary({ residuals: workerResult.residuals_sigma, observablesUsed: collectObservablesUsed(star), comparison: false }),
    },
    laneResult,
    modelPlaceholder: workerResult.model_placeholder,
    runtimeArtifacts: finalizedArtifacts,
  });

  return {
    ...laneResult,
    artifact_refs: artifactRefs,
  };
}
