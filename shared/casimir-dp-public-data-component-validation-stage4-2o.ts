// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  CASIMIR_DP_STAGE4_2O_RUN_ORDER,
  CasimirDpPublicDataComponentFixtureStage4_2O,
  CasimirDpPublicDataComponentValidationStage4_2OConfig,
  type CasimirDpPublicDataComponentFixtureStage4_2O as Fixture,
  type CasimirDpPublicDataComponentValidationStage4_2OConfig as Config,
} from "./contracts/casimir-dp-public-data-component-validation-stage4-2o.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [
    key,
    canonicalize((value as Record<string, unknown>)[key]),
  ]));
}

export function sha256CasimirDpPublicDataComponentValidationStage4_2O(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

function inverse2(matrix: [[number, number], [number, number]]) {
  const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  if (!(determinant > 0)) throw new Error("stage4_2o_sodium_covariance_not_invertible");
  return [
    [matrix[1][1] / determinant, -matrix[0][1] / determinant],
    [-matrix[1][0] / determinant, matrix[0][0] / determinant],
  ] as [[number, number], [number, number]];
}

function mahalanobis2(delta: [number, number], covariance: [[number, number], [number, number]]) {
  const inverse = inverse2(covariance);
  return delta[0] * (inverse[0][0] * delta[0] + inverse[0][1] * delta[1]) +
    delta[1] * (inverse[1][0] * delta[0] + inverse[1][1] * delta[1]);
}

export function evaluateCasimirDpPublicDataComponentValidationStage4_2O(
  rawConfig: Config,
  rawFixture: Fixture,
) {
  const config = CasimirDpPublicDataComponentValidationStage4_2OConfig.parse(rawConfig);
  const fixture = CasimirDpPublicDataComponentFixtureStage4_2O.parse(rawFixture);
  const runOrderPass = JSON.stringify(config.run_order) === JSON.stringify(CASIMIR_DP_STAGE4_2O_RUN_ORDER);
  const sourceRows = Object.values(fixture.sources).map((source) => ({
    source_id: source.source_id,
    expected_sha256: source.expected_sha256,
    actual_sha256: source.actual_sha256,
    gate: source.integrity_verified && source.expected_sha256 === source.actual_sha256 ? "pass" as const : "not_ready" as const,
  }));
  const sourceIntegrityPass = sourceRows.every((row) => row.gate === "pass");

  const split = fixture.components.sodium.alternating_split;
  const sodiumDelta = [
    split.train_mean_complex[0] - split.holdout_mean_complex[0],
    split.train_mean_complex[1] - split.holdout_mean_complex[1],
  ] as [number, number];
  const sodiumMahalanobis2 = mahalanobis2(sodiumDelta, split.train_covariance);
  const sodiumPass =
    fixture.components.sodium.scan_count >= config.gates.minimum_sodium_scan_count &&
    fixture.components.sodium.scans.length === fixture.components.sodium.scan_count &&
    fixture.components.sodium.scans.every((row) => row.visibility >= 0 && Number.isFinite(row.phase_rad)) &&
    sodiumMahalanobis2 <= config.gates.maximum_sodium_split_mahalanobis2;

  const casimir = fixture.components.casimir;
  const casimirPass =
    casimir.trace_count >= config.gates.minimum_casimir_trace_count &&
    casimir.down_centroid_Hz.length === casimir.trace_count &&
    casimir.up_centroid_Hz.length === casimir.trace_count &&
    casimir.up_minus_down_shift.rms_Hz >= config.gates.minimum_casimir_shift_rms_Hz;

  const lisa = fixture.components.lisa_pathfinder;
  const lisaRmseRatio = lisa.linear_residual.train_rmse_standardized > 0
    ? lisa.linear_residual.holdout_rmse_standardized / lisa.linear_residual.train_rmse_standardized
    : Number.POSITIVE_INFINITY;
  const lisaPass =
    lisa.channel_ids.length === lisa.channel_semantics.length &&
    lisa.train_shrunk_condition_number <= config.gates.maximum_lisa_shrunk_condition_number &&
    lisa.holdout_shrunk_condition_number <= config.gates.maximum_lisa_shrunk_condition_number &&
    lisa.relative_covariance_drift <= config.gates.maximum_lisa_relative_covariance_drift &&
    lisaRmseRatio <= config.gates.maximum_lisa_holdout_to_train_rmse_ratio;

  const gran = fixture.components.gran_sasso;
  const granSassoPass =
    gran.fig4.bin_count >= config.gates.minimum_gran_sasso_fig4_bins &&
    gran.fig4.data_simulation_pearson >= config.gates.minimum_gran_sasso_data_simulation_pearson &&
    gran.registered_stage4_2o_model_adjudication === "not_adjudicated";

  const separationPass =
    !config.cross_apparatus_covariance_fusion_allowed &&
    !fixture.cross_apparatus_covariance_fusion &&
    !fixture.joint_protocol_cells_present &&
    !fixture.leading_design_modified;
  const componentReplayPass =
    runOrderPass && sourceIntegrityPass && sodiumPass && casimirPass && lisaPass && granSassoPass && separationPass;

  return {
    schema_version: "casimir_dp_public_data_component_validation_stage4_2o_result/1" as const,
    campaign_id: config.campaign_id,
    evidence_class: config.evidence_class,
    claim_ceiling: config.claim_ceiling,
    upstream_binding: {
      run_id: config.upstream_stage4_2n.run_id,
      leading_design: config.leading_design,
      run_order_gate: runOrderPass ? "pass" as const : "not_ready" as const,
      leading_design_unchanged: !fixture.leading_design_modified,
    },
    provenance: {
      sources: sourceRows,
      gate: sourceIntegrityPass ? "pass" as const : "not_ready" as const,
    },
    component_replays: {
      sodium_complex_fringe: {
        scan_count: fixture.components.sodium.scan_count,
        split_mean_mahalanobis2: sodiumMahalanobis2,
        observable_definition: fixture.components.sodium.observable_definition,
        gate: sodiumPass ? "pass" as const : "not_ready" as const,
        claim_boundary: fixture.components.sodium.claim_boundary,
      },
      measured_boundary_response: {
        trace_count: casimir.trace_count,
        rms_up_down_centroid_shift_Hz: casimir.up_minus_down_shift.rms_Hz,
        median_absolute_up_down_centroid_shift_Hz: casimir.up_minus_down_shift.median_absolute_Hz,
        gate: casimirPass ? "pass" as const : "not_ready" as const,
        claim_boundary: casimir.claim_boundary,
      },
      multichannel_covariance: {
        active_row_count: lisa.active_row_count,
        channel_count: lisa.channel_ids.length,
        train_shrunk_condition_number: lisa.train_shrunk_condition_number,
        holdout_shrunk_condition_number: lisa.holdout_shrunk_condition_number,
        relative_covariance_drift: lisa.relative_covariance_drift,
        holdout_to_train_rmse_ratio: lisaRmseRatio,
        gate: lisaPass ? "pass" as const : "not_ready" as const,
        claim_boundary: lisa.claim_boundary,
      },
      external_dp_bound: {
        fig3_bin_count: gran.fig3.bin_count,
        fig4_bin_count: gran.fig4.bin_count,
        fig4_data_simulation_pearson: gran.fig4.data_simulation_pearson,
        parameter_free_result: gran.paper_result,
        registered_model_adjudication: gran.registered_stage4_2o_model_adjudication,
        gate: granSassoPass ? "pass" as const : "not_ready" as const,
        claim_boundary: gran.claim_boundary,
      },
    },
    isolation: {
      cross_apparatus_covariance_fusion: false as const,
      joint_protocol_cells_present: false as const,
      shared_likelihood_constructed: false as const,
      gate: separationPass ? "pass" as const : "not_ready" as const,
    },
    readiness: {
      component_replay: componentReplayPass ? "pass" as const : "not_ready" as const,
      measured_evidence: config.standing.measured_evidence,
      joint_protocol_validation: config.standing.joint_protocol_validation,
      collapse_identification: config.standing.collapse_identification,
      manifold_dynamics: config.standing.manifold_dynamics,
      physical_viability: config.standing.physical_viability,
      physical_pilot_authorized: config.standing.physical_pilot_authorized,
      confirmatory_campaign_authorized: config.standing.confirmatory_campaign_authorized,
    },
    graph_policy: {
      theory_badge_promotable: false as const,
      observable_bridge_edges_added: 0 as const,
      public_component_edges_added: 4 as const,
      joint_protocol_edge_added: false as const,
    },
    claim_boundaries: [
      "The public datasets validate four separate analysis components; they do not instantiate the four cells of the proposed apparatus.",
      "No covariance, residual, likelihood, or physical parameter is transported between apparatuses.",
      "The sodium fringe coefficient is not the proposed sphere's density-matrix element.",
      "The superconducting-drum replay is not a measured ordinary-null model for the proposed cavity.",
      "LISA Pathfinder validates classical multichannel covariance handling only.",
      "The Gran Sasso parameter-free exclusion does not adjudicate the registered R0=100 nm comparator without a model-matched bound calculation.",
      "No component replay identifies collapse or spacetime-manifold dynamics.",
    ],
  };
}
