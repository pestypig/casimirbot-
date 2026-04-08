import {
  loadSolarDiagnosticDatasetsManifest,
  loadSolarThresholds,
} from "../../halobank-solar/config";
import { runDerivedModule } from "../../halobank-solar/derived";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, StarSimLaneResult } from "../contract";

const MODULE_TREE = {
  stellar_observables_diagnostic: {
    claim_id: "claim:halobank.solar:stellar_observables_diagnostic",
    equation_refs: [
      "collective_observable_response_closure",
      "helioseismic_inversion",
      "solar_activity_cycle",
      "stellar_observables_correlation_diagnostic",
      "flare_power_law_statistics",
      "multiscale_stellar_plasma_variability",
    ],
  },
  stellar_flare_sunquake_diagnostic: {
    claim_id: "claim:halobank.solar:stellar_flare_sunquake_diagnostic",
    equation_refs: [
      "collective_observable_response_closure",
      "flare_pressure_impulse_coupling",
      "flare_sunquake_timing_correlation",
      "sunquake_helioseismic_response",
    ],
  },
  sunquake_timing_replay_diagnostic: {
    claim_id: "claim:halobank.solar:sunquake_timing_replay_diagnostic",
    equation_refs: [
      "collective_observable_response_closure",
      "flare_sunquake_timing_correlation",
      "sunquake_helioseismic_response",
    ],
  },
} as const;

export async function runActivitySolarLane(star: CanonicalStar): Promise<StarSimLaneResult> {
  const evidenceRefs = collectCanonicalEvidenceRefs(star);
  if (!star.target.is_solar_calibrator) {
    return {
      lane_id: "activity_solar_observed",
      requested_lane: "activity",
      solver_id: "halobank.solar.activity/1",
      label: "Solar activity diagnostics",
      availability: "unavailable",
      maturity: "obs_fit",
      assumptions: ["Current activity lane is Sun-only and depends on solar replay datasets."],
      domain_validity: {
        supported_targets: ["Sun"],
      },
      observables_used: [],
      inferred_params: {},
      residuals_sigma: {},
      falsifier_ids: ["STAR_SIM_ACTIVITY_SOLAR_ONLY"],
      tree_dag: buildTreeDagClaim({
        claim_id: "claim:star-sim:activity_solar_observed",
        evidence_refs: evidenceRefs,
      }),
      result: {
        reason: "Solar replay diagnostics are not available for this target.",
      },
      evidence_fit: 0,
      domain_penalty: 0,
      note: "No generic stellar activity solver is wired yet; this adapter only exposes the existing Sun-specific diagnostic lane.",
    };
  }

  const thresholds = await loadSolarThresholds();
  const datasets = await loadSolarDiagnosticDatasetsManifest();
  const replaySeriesId = typeof star.fields.activity.replay_series_id.value === "string"
    ? star.fields.activity.replay_series_id.value
    : "gong-silso-cycle23-radial-band";
  const flareReplaySeriesId = typeof star.fields.activity.flare_replay_series_id.value === "string"
    ? star.fields.activity.flare_replay_series_id.value
    : "flare-sunquake-timing-replay";
  const sunquakeReplaySeriesId = typeof star.fields.activity.sunquake_replay_series_id.value === "string"
    ? star.fields.activity.sunquake_replay_series_id.value
    : flareReplaySeriesId;

  const observables = runDerivedModule({
    module: "stellar_observables_diagnostic",
    input: { replay_series_id: replaySeriesId },
    thresholds,
    diagnosticDatasetsManifest: datasets,
  });
  const flare = runDerivedModule({
    module: "stellar_flare_sunquake_diagnostic",
    input: { replay_series_id: flareReplaySeriesId },
    thresholds,
    diagnosticDatasetsManifest: datasets,
  });
  const sunquake = runDerivedModule({
    module: "sunquake_timing_replay_diagnostic",
    input: { replay_series_id: sunquakeReplaySeriesId },
    thresholds,
    diagnosticDatasetsManifest: datasets,
  });

  const modules = [observables, flare, sunquake].map((moduleResult) => {
    const tree = MODULE_TREE[moduleResult.module];
    return {
      module: moduleResult.module,
      result: moduleResult.result,
      gate: moduleResult.gate,
      artifact_ref: moduleResult.artifact_ref,
      tree_dag: buildTreeDagClaim({
        claim_id: tree.claim_id,
        equation_refs: [...tree.equation_refs],
        evidence_refs: [moduleResult.artifact_ref],
      }),
    };
  });

  const passFraction = modules.filter((entry) => entry.gate.verdict === "PASS").length / modules.length;
  const explicitReplayCount = [
    star.fields.activity.replay_series_id.value,
    star.fields.activity.flare_replay_series_id.value,
    star.fields.activity.sunquake_replay_series_id.value,
  ].filter((value) => typeof value === "string").length;
  const evidenceFit = Math.min(0.95, 0.55 + passFraction * 0.2 + explicitReplayCount * 0.05);
  const domainPenalty = explicitReplayCount === 0 ? 0.9 : 1;
  const falsifierIds = modules
    .map((entry) => entry.gate.firstFail)
    .filter((value): value is string => Boolean(value));
  const equationRefs = modules.flatMap((entry) => entry.tree_dag.equation_refs);
  const moduleClaimIds = modules.map((entry) => entry.tree_dag.claim_id);
  const moduleEvidenceRefs = modules.flatMap((entry) => entry.tree_dag.evidence_refs);

  return {
    lane_id: "activity_solar_observed",
    requested_lane: "activity",
    solver_id: "halobank.solar.activity/1",
    label: "Solar activity diagnostics",
    availability: "available",
    maturity: "obs_fit",
    assumptions: [
      "This lane replays observational solar diagnostics; it does not perform 3D MHD.",
      "Sunquake and p-mode outputs are diagnostic correlations, not causal proofs.",
    ],
    domain_validity: {
      supported_targets: ["Sun"],
      solver_scope: ["activity-cycle proxy", "flare-to-sunquake timing", "helioseismic replay"],
    },
    observables_used: [
      "activity.replay_series_id",
      "activity.flare_replay_series_id",
      "activity.sunquake_replay_series_id",
    ],
    inferred_params: {
      activity_pmode_correlation: observables.result.activity_pmode_correlation,
      flare_energy_helioseismic_correlation: flare.result.flare_energy_helioseismic_correlation,
      timing_alignment_score: sunquake.result.timing_alignment_score,
    },
    residuals_sigma: {},
    falsifier_ids: Array.from(new Set(falsifierIds)),
    tree_dag: buildTreeDagClaim({
      claim_id: "claim:star-sim:activity_solar_observed",
      parent_claim_ids: moduleClaimIds,
      equation_refs: equationRefs,
      evidence_refs: [...evidenceRefs, ...moduleEvidenceRefs],
    }),
    result: {
      replay_ids: {
        stellar_observables: replaySeriesId,
        stellar_flare_sunquake: flareReplaySeriesId,
        sunquake_timing: sunquakeReplaySeriesId,
      },
      modules,
    },
    evidence_fit: evidenceFit,
    domain_penalty: domainPenalty,
    note: "This is a solar observational lane. It exposes the current replay diagnostics with their original TREE+DAG identities and guardrails.",
  };
}
