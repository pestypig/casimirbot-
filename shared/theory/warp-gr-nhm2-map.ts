import type { Nhm2DiagnosticObjectBindingInput } from "./nhm2-diagnostic-object-bindings";

export type WarpGrNhm2GroupId =
  | "warp.gr.reference_roots"
  | "warp.nhm2.geometry_sample"
  | "warp.nhm2.source_closure"
  | "warp.nhm2.diagnostic_path"
  | "warp.nhm2.claim_boundary";

export type WarpGrNhm2Group = {
  id: WarpGrNhm2GroupId;
  title: string;
  band: "gr" | "geometry" | "source" | "diagnostic" | "boundary";
  description: string;
  theoryBadgeIds: string[];
  calculatorPayloadRefs: Array<{
    badgeId: string;
    payloadId: string;
  }>;
  claimBoundaryBadgeIds: string[];
  objectBindings: Array<{
    id: string;
    label: string;
    description: string;
    input: Nhm2DiagnosticObjectBindingInput;
  }>;
};

const NHM2_BOUNDARY_BADGES = ["nhm2.claim_boundary.diagnostic_only"];

export const WARP_GR_NHM2_GROUPS: WarpGrNhm2Group[] = [
  {
    id: "warp.gr.reference_roots",
    title: "GR Reference Roots",
    band: "gr",
    description: "Einstein equation, stress-energy conservation, and 3+1 reference context.",
    theoryBadgeIds: [
      "physics.fields.stress_energy_tensor",
      "physics.gr.einstein_field_equation",
      "physics.gr.stress_energy_conservation",
      "physics.gr.3p1_decomposition",
      "nhm2.natario.curvature_invariants",
      "nhm2.natario.invariant_audit",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [],
  },
  {
    id: "warp.nhm2.geometry_sample",
    title: "Geometry Sample",
    band: "geometry",
    description: "Scalar lapse/shift timing row tied to the 3+1 reference branch.",
    theoryBadgeIds: [
      "physics.gr.3p1_decomposition",
      "nhm2.geometry.lapse_shift_profile",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "nhm2.geometry.lapse_shift_profile",
        payloadId: "proper_time_scalar_offset_payload",
      },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-lapse-shift",
        label: "Sample lapse / shift",
        description: "One-second shift sample with a 0.1 second lapse offset.",
        input: {
          objectId: "nhm2-diagnostic:sample-lapse-shift",
          label: "NHM2 sample lapse-shift row",
          t_shift: 1,
          delta_t_lapse: 0.1,
        },
      },
    ],
  },
  {
    id: "warp.nhm2.source_closure",
    title: "Source Closure",
    band: "source",
    description: "Energy density, average cycle power, and source residual scalar diagnostics.",
    theoryBadgeIds: [
      "physics.energy.energy_density",
      "physics.energy.power_rate",
      "nhm2.source.energy_density_proxy",
      "nhm2.tile.duty_cycle_average",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.tensor.full_authority_gate",
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.regional_atlas.available",
      "nhm2.regional_atlas.partition_of_unity",
      "nhm2.regional_atlas.transition_supports",
      "nhm2.regional_atlas.derivative_support",
      "nhm2.regional_atlas.consumer_congruence",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "casimir.tile.duty_budget",
      "casimir.material_receipts",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "nhm2.source.energy_density_proxy", payloadId: "rho_equals_E_over_V_payload" },
      { badgeId: "nhm2.tile.duty_cycle_average", payloadId: "average_power_from_cycle_energy_payload" },
      { badgeId: "nhm2.closure.wall_t00_source_residual", payloadId: "wall_t00_source_residual_payload" },
      { badgeId: "nhm2.closure.source_residual", payloadId: "source_residual_difference_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-source-residual",
        label: "Sample source residual",
        description: "Simple density, duty-cycle, and source residual defaults.",
        input: {
          objectId: "nhm2-diagnostic:sample-source-residual",
          label: "NHM2 sample source residual row",
          E: 1,
          V: 1,
          E_cycle: 1,
          T_cycle: 2,
          T00_wall_required: 1,
          T00_wall_available: 0.8,
          source_required: 1,
          source_available: 0.8,
        },
      },
    ],
  },
  {
    id: "warp.nhm2.diagnostic_path",
    title: "Diagnostic Path",
    band: "diagnostic",
    description: "Scalar path through geometry, source residual, QEI badge replay margin, gate context, and claim boundary.",
    theoryBadgeIds: [
      "physics.gr.einstein_field_equation",
      "physics.gr.3p1_decomposition",
      "nhm2.geometry.lapse_shift_profile",
      "nhm2.source.energy_density_proxy",
      "nhm2.tile.duty_cycle_average",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.tensor.full_authority_gate",
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.regional_atlas.available",
      "nhm2.regional_atlas.partition_of_unity",
      "nhm2.regional_atlas.transition_supports",
      "nhm2.regional_atlas.derivative_support",
      "nhm2.regional_atlas.consumer_congruence",
      "nhm2.source.component_authority_ledger",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.closure.coupled_pass_candidate",
      "nhm2.closure.regional_tensor_pass_path_harness",
      "nhm2.formal.lean_certificate",
      "nhm2.formal.certificate_hashes_pinned",
      "nhm2.formal.diagnostic_campaign_admissible",
      "nhm2.formal.claim_locks_closed",
      "nhm2.formal.negative_fixtures_fail_closed",
      "nhm2.experimental.physical_viability_campaign",
      "nhm2.experimental.theory_solve_roadmap",
      "nhm2.experimental.parameter_targets",
      "nhm2.experimental.research_gap_ledger",
      "nhm2.experimental.layer_stack_mechanical_receipt",
      "nhm2.experimental.prediction_freeze",
      "nhm2.experimental.tile_force_receipt",
      "nhm2.experimental.tile_cycle_energy_balance",
      "nhm2.experimental.array_scaling",
      "nhm2.experimental.full_apparatus_tensor",
      "nhm2.experimental.vacuum_weight",
      "nhm2.experimental.metric_upper_bound",
      "nhm2.experimental.invariant_metric_response",
      "nhm2.experimental.geodesic_response",
      "nhm2.experimental.independent_replication",
      "nhm2.claim_boundary.physical_viability_locked",
      "nhm2.claim_boundary.transport_locked",
      "nhm2.qei.sampling_window",
      "nhm2.qei.worldline_dossier",
      "nhm2.natario.curvature_invariants",
      "nhm2.natario.invariant_audit",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.energy_condition.diagnostic_gate",
      "nhm2.regional_atlas.claim_boundary",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "nhm2.geometry.lapse_shift_profile", payloadId: "proper_time_scalar_offset_payload" },
      { badgeId: "nhm2.source.energy_density_proxy", payloadId: "rho_equals_E_over_V_payload" },
      { badgeId: "nhm2.tile.duty_cycle_average", payloadId: "average_power_from_cycle_energy_payload" },
      { badgeId: "nhm2.closure.wall_t00_source_residual", payloadId: "wall_t00_source_residual_payload" },
      { badgeId: "nhm2.closure.source_residual", payloadId: "source_residual_difference_payload" },
      { badgeId: "nhm2.qei.sampling_window", payloadId: "qei_margin_difference_payload" },
      { badgeId: "nhm2.experimental.tile_cycle_energy_balance", payloadId: "delta_m_energy_equivalent_payload" },
      { badgeId: "nhm2.experimental.tile_cycle_energy_balance", payloadId: "delta_F_weight_equivalent_payload" },
      { badgeId: "nhm2.experimental.array_scaling", payloadId: "array_scaling_ratio_payload" },
      { badgeId: "nhm2.experimental.metric_upper_bound", payloadId: "h00_proxy_weak_field_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-diagnostic-path",
        label: "Sample diagnostic path",
        description: "Small scalar defaults for path lighting and calculator loadout checks.",
        input: {
          objectId: "nhm2-diagnostic:sample-path",
          label: "NHM2 sample diagnostic path",
          t_shift: 1,
          delta_t_lapse: 0.1,
          E: 1,
          V: 1,
          E_cycle: 1,
          T_cycle: 2,
          T00_wall_required: 1,
          T00_wall_available: 0.8,
          source_required: 1,
          source_available: 0.8,
          qei_bound: 1,
          qei_sample: 0.9,
        },
      },
    ],
  },
  {
    id: "warp.nhm2.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps Warp/GR/NHM2 rows in diagnostic-only scope.",
    theoryBadgeIds: [
      "nhm2.formal.claim_locks_closed",
      "nhm2.formal.diagnostic_campaign_admissible",
      "nhm2.claim_boundary.physical_viability_locked",
      "nhm2.claim_boundary.transport_locked",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getWarpGrNhm2Group(groupId: WarpGrNhm2GroupId): WarpGrNhm2Group | null {
  return WARP_GR_NHM2_GROUPS.find((group) => group.id === groupId) ?? null;
}
