import { getBaryState, getBodyStateSource } from "../../halobank-solar/ephemeris-core";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, StarSimLaneResult } from "../contract";

export function runBarycenterAnalyticLane(star: CanonicalStar): StarSimLaneResult {
  const explicitBodyId = star.fields.orbital_context.naif_body_id.value;
  const bodyId =
    typeof explicitBodyId === "number" ? explicitBodyId : star.target.is_solar_calibrator ? 10 : null;
  const evidenceRefs = collectCanonicalEvidenceRefs(star);

  if (bodyId === null) {
    return {
      lane_id: "barycenter_analytic",
      requested_lane: "barycenter",
      solver_id: "halobank.solar.barycenter/1",
      label: "Analytic barycenter state",
      availability: "unavailable",
      maturity: "reduced_order",
      assumptions: ["Current barycenter lane requires a supported NAIF body id or the solar calibration target."],
      domain_validity: {
        supported_context: "current solar-system body map only",
      },
      observables_used: [],
      inferred_params: {},
      residuals_sigma: {},
      falsifier_ids: ["STAR_SIM_BARYCENTER_BODY_UNSUPPORTED"],
      tree_dag: buildTreeDagClaim({
        claim_id: "claim:star-sim:barycenter_analytic",
        evidence_refs: evidenceRefs,
      }),
      result: {
        reason: "No supported body id was provided for barycenter evaluation.",
      },
      evidence_fit: 0,
      domain_penalty: 0,
      note: "This adapter does not yet bridge arbitrary stellar barycenters, SPICE kernels, or forward N-body propagation.",
    };
  }

  const date = new Date(star.target.epoch_iso);
  const state = getBaryState(bodyId, date);
  const stateSource = getBodyStateSource(bodyId);
  const explicitEphemeris = star.fields.orbital_context.ephemeris_source.value;
  const evidenceFit = typeof explicitBodyId === "number" ? 0.88 : 0.75;
  const domainPenalty = stateSource.synthetic ? 0.5 : 0.75;

  return {
    lane_id: "barycenter_analytic",
    requested_lane: "barycenter",
    solver_id: "halobank.solar.barycenter/1",
    label: "Analytic barycenter state",
    availability: "available",
    maturity: "reduced_order",
    assumptions: [
      "Current barycenter state comes from astronomy-engine or synthetic diagnostic orbits, not SPICE exact kernels.",
    ],
    domain_validity: {
      supported_context: "current solar-system body map only",
      exact_ephemeris: false,
    },
    observables_used: typeof explicitBodyId === "number" ? ["orbital_context.naif_body_id"] : ["target.is_solar_calibrator"],
    inferred_params: {
      body_id: bodyId,
      source_model: explicitEphemeris ?? stateSource.source_model,
    },
    residuals_sigma: {},
    falsifier_ids: stateSource.synthetic ? ["STAR_SIM_BARYCENTER_SYNTHETIC_STATE_SOURCE"] : [],
    tree_dag: buildTreeDagClaim({
      claim_id: "claim:star-sim:barycenter_analytic",
      equation_refs: ["barycentric_state_lookup", "reference_frame_projection"],
      evidence_refs: [...evidenceRefs, ...stateSource.source_refs],
    }),
    result: {
      epoch_iso: date.toISOString(),
      body_id: bodyId,
      position_AU: state.pos,
      velocity_AU_per_day: state.vel,
      state_source: stateSource,
    },
    evidence_fit: evidenceFit,
    domain_penalty: domainPenalty,
    note: "Useful for context and visualization-grade barycentric state. It is not an ephemeris-exact certification lane.",
  };
}
