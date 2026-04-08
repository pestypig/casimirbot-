import {
  buildOscillationGyreCacheKey,
  buildStructureMesaCacheKey,
  readCachedLaneResult,
  resolveOscillationGyrePaths,
  resolveStructureMesaPaths,
  writeOscillationGyreCache,
} from "../artifacts";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, RequestedLane, StarSimLaneResult } from "../contract";
import { runOscillationGyreInWorker } from "../worker/starsim-worker-client";
import { canMockOscillationGyre, resolveStarSimSolverRuntime } from "../worker/starsim-runtime";
import type { StarSimLaneExecutionMode } from "./structure-mesa";

const buildUnavailableLane = (args: {
  star: CanonicalStar;
  cacheKey: string;
  structureClaimId: string | null;
  statusReason: "missing_structure_model" | "async_job_required" | "solver_unconfigured" | "out_of_domain";
  note: string;
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
    evidence_fit: 0,
    domain_penalty: 0,
    note: args.note,
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

  const cacheKey = buildStructureMesaCacheKey(star);
  const cached = await readCachedLaneResult(resolveStructureMesaPaths(cacheKey).laneResultPath);
  return cached?.status === "available" ? cached : null;
};

export async function runOscillationGyreLane(
  star: CanonicalStar,
  options: {
    executionMode: StarSimLaneExecutionMode;
    resolvedLanes: Partial<Record<RequestedLane, StarSimLaneResult>>;
  },
): Promise<StarSimLaneResult> {
  const structureLane = await resolveStructureLaneResult(star, options.resolvedLanes);
  const structureCacheKey = structureLane?.cache_key ?? buildStructureMesaCacheKey(star);
  const cacheKey = buildOscillationGyreCacheKey(star, structureCacheKey);
  const cached = await readCachedLaneResult(resolveOscillationGyrePaths(cacheKey).laneResultPath);
  if (cached) {
    return cached;
  }

  if (!structureLane) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: null,
      statusReason: "missing_structure_model",
      note: "No cached or current-run structure_mesa artifact is available for GYRE to consume.",
    });
  }

  const runtime = resolveStarSimSolverRuntime("gyre");
  if (!runtime.executable) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      statusReason: "solver_unconfigured",
      note: "No GYRE runtime is configured. Set STAR_SIM_GYRE_RUNTIME=mock|docker|wsl or populate the cache first.",
    });
  }

  if (options.executionMode === "sync") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      statusReason: "async_job_required",
      note: "No cached GYRE artifact was found. Submit this request to /api/star-sim/v1/jobs to execute the worker.",
    });
  }

  if (runtime.runtime_kind === "docker" || runtime.runtime_kind === "wsl") {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      statusReason: "solver_unconfigured",
      note: `The ${runtime.runtime_kind} GYRE runtime is declared but not wired in this build. Use mock mode or pre-populate the cache.`,
    });
  }

  if (runtime.runtime_kind === "mock" && !canMockOscillationGyre(star)) {
    return buildUnavailableLane({
      star,
      cacheKey,
      structureClaimId: structureLane.tree_dag.claim_id,
      statusReason: "out_of_domain",
      note: "The mock GYRE runtime currently ships only solar and G-type main-sequence fixtures.",
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
  const maturity = workerResult.runtime_kind === "mock" ? "obs_fit" : "research_sim";
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
      workerResult.runtime_kind === "mock"
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
        fixture_id: workerResult.fixture_id,
      },
      benchmark_case_id: workerResult.benchmark_case_id,
      cache_key: cacheKey,
      structure_cache_key: structureCacheKey,
      structure_claim_id: structureLane.tree_dag.claim_id,
      mode_summary: workerResult.mode_summary,
    },
    cache_key: cacheKey,
    evidence_fit: workerResult.evidence_fit,
    domain_penalty: 1,
    note:
      workerResult.runtime_kind === "mock"
        ? "Fixture-backed GYRE mock output cached for deterministic star-sim orchestration."
        : "External GYRE output cached for deterministic star-sim orchestration.",
  };

  const artifactRefs = await writeOscillationGyreCache({
    star,
    cacheKey,
    parentStructureCacheKey: structureCacheKey,
    runtimeKind: workerResult.runtime_kind,
    benchmarkCaseId: workerResult.benchmark_case_id,
    summary: {
      benchmark_case_id: workerResult.benchmark_case_id,
      structure_cache_key: structureCacheKey,
      mode_summary: workerResult.mode_summary,
      inferred_params: workerResult.inferred_params,
      residuals_sigma: workerResult.residuals_sigma,
    },
    laneResult,
  });

  return {
    ...laneResult,
    artifact_refs: artifactRefs,
  };
}
