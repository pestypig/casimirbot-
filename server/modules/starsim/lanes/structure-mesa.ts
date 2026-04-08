import {
  buildStructureMesaCacheKey,
  readCachedLaneResult,
  resolveStructureMesaPaths,
  writeStructureMesaCache,
} from "../artifacts";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, PhysClass, StarSimLaneResult } from "../contract";
import { runStructureMesaInWorker } from "../worker/starsim-worker-client";
import { canMockStructureMesa, resolveStarSimSolverRuntime } from "../worker/starsim-runtime";

export type StarSimLaneExecutionMode = "sync" | "job";

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

const buildUnavailableLane = (args: {
  star: CanonicalStar;
  cacheKey: string;
  statusReason: "async_job_required" | "solver_unconfigured" | "out_of_domain";
  note: string;
}): StarSimLaneResult => {
  const evidenceRefs = collectCanonicalEvidenceRefs(args.star);
  return {
    lane_id: "structure_mesa",
    requested_lane: "structure_mesa",
    solver_id: "starsim.mesa.structure/1",
    label: "MESA-backed 1D structure",
    availability: "unavailable",
    status: "unavailable",
    status_reason: args.statusReason,
    execution_kind: "simulation",
    maturity: "obs_fit",
    phys_class: "P2",
    assumptions: [
      "This lane requires an asynchronous worker run or a previously cached artifact before it can return a structure model.",
    ],
    domain_validity: {
      runtime_backbone: "mesa_worker",
      cached_execution_only_on_sync_route: true,
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
    },
    cache_key: args.cacheKey,
    evidence_fit: 0,
    domain_penalty: 0,
    note: args.note,
  };
};

export async function runStructureMesaLane(
  star: CanonicalStar,
  options: { executionMode: StarSimLaneExecutionMode },
): Promise<StarSimLaneResult> {
  const cacheKey = buildStructureMesaCacheKey(star);
  const cached = await readCachedLaneResult(resolveStructureMesaPaths(cacheKey).laneResultPath);
  if (cached) {
    return cached;
  }

  const runtime = resolveStarSimSolverRuntime("mesa");
  if (!runtime.executable) {
    return buildUnavailableLane({
      star,
      cacheKey,
      statusReason: "solver_unconfigured",
      note: "No MESA runtime is configured. Set STAR_SIM_MESA_RUNTIME=mock|docker|wsl or populate the cache first.",
    });
  }

  if (options.executionMode === "sync") {
    return buildUnavailableLane({
      star,
      cacheKey,
      statusReason: "async_job_required",
      note: "No cached MESA artifact was found. Submit this request to /api/star-sim/v1/jobs to execute the worker.",
    });
  }

  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    return buildUnavailableLane({
      star,
      cacheKey,
      statusReason: "solver_unconfigured",
      note: `The ${runtime.runtime_kind} MESA runtime is declared but not wired in this build. Use mock mode or pre-populate the cache.`,
    });
  }

  if (runtime.runtime_kind === "mock" && !canMockStructureMesa(star)) {
    return buildUnavailableLane({
      star,
      cacheKey,
      statusReason: "out_of_domain",
      note: "The mock MESA runtime currently ships only solar and G-type main-sequence fixtures.",
    });
  }

  const evidenceRefs = collectCanonicalEvidenceRefs(star);
  const workerResult = await runStructureMesaInWorker(star, cacheKey);
  const physClass: PhysClass = workerResult.used_seismic_constraints ? "P3" : "P2";
  const maturity = workerResult.runtime_kind === "mock" ? "obs_fit" : "research_sim";
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
      workerResult.runtime_kind === "mock"
        ? "This result comes from the fixture-backed mock MESA runtime and is suitable for orchestration and contract testing, not public scientific claims."
        : "This lane uses an external MESA execution backend and caches its artifacts for deterministic reuse.",
    ],
    domain_validity: {
      ...workerResult.domain_validity,
      runtime_kind: workerResult.runtime_kind,
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
        fixture_id: workerResult.fixture_id,
      },
      benchmark_case_id: workerResult.benchmark_case_id,
      cache_key: cacheKey,
      structure_summary: workerResult.structure_summary,
      synthetic_observables: workerResult.synthetic_observables,
      used_seismic_constraints: workerResult.used_seismic_constraints,
    },
    cache_key: cacheKey,
    evidence_fit: workerResult.evidence_fit,
    domain_penalty: 1,
    note:
      workerResult.runtime_kind === "mock"
        ? "Fixture-backed MESA mock output cached for deterministic star-sim orchestration."
        : "External MESA output cached for deterministic star-sim orchestration.",
  };

  const artifactRefs = await writeStructureMesaCache({
    star,
    cacheKey,
    runtimeKind: workerResult.runtime_kind,
    benchmarkCaseId: workerResult.benchmark_case_id,
    summary: {
      benchmark_case_id: workerResult.benchmark_case_id,
      structure_summary: workerResult.structure_summary,
      synthetic_observables: workerResult.synthetic_observables,
      inferred_params: workerResult.inferred_params,
      residuals_sigma: workerResult.residuals_sigma,
    },
    laneResult,
    modelPlaceholder: workerResult.model_placeholder,
  });

  return {
    ...laneResult,
    artifact_refs: artifactRefs,
  };
}
