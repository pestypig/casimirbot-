export const NHM2_RUNTIME_FIELD_BINDING_KIND_VALUES = [
  "model_relation",
  "runtime_bound_output",
  "runtime_gate",
  "claim_boundary",
] as const;

export type Nhm2RuntimeFieldBindingKind =
  (typeof NHM2_RUNTIME_FIELD_BINDING_KIND_VALUES)[number];

export type Nhm2RuntimeFieldBinding = {
  badgeId: string;
  kind: Nhm2RuntimeFieldBindingKind;
  runtimeId: string;
  laneId: "warp_gr_nhm2" | "qei_stress_energy";
  artifactFields: string[];
  scalarCuts: Array<{
    id: string;
    expression: string;
    displayLatex: string;
    outputSymbols: string[];
  }>;
  gates: string[];
  requiredEvidence: string[];
  claimBoundaryNotes: string[];
};

const NHM2_PROMOTION_EVIDENCE = [
  "source_closure_artifact",
  "observer_audit",
  "qei_worldline_dossier",
  "stage3_certificate",
  "certificate_integrity",
] as const;

export const NHM2_RUNTIME_FIELD_BINDINGS: Nhm2RuntimeFieldBinding[] = [
  {
    badgeId: "physics.gr.einstein_field_equation",
    kind: "model_relation",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["metricT00Geom", "metricT00Si", "G_mu_nu", "T_mu_nu"],
    scalarCuts: [],
    gates: ["hard_constraints", "observer_audit"],
    requiredEvidence: ["observer_audit", "hard_constraint_report", "metric_contract"],
    claimBoundaryNotes: [
      "Einstein field equation rows are tensor/model context; scalar calculator rows may only inspect cuts around the runtime.",
    ],
  },
  {
    badgeId: "physics.gr.stress_energy_conservation",
    kind: "model_relation",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["sourceClosureResidualRms", "sourceClosureResidualMax", "divergenceRms"],
    scalarCuts: [],
    gates: ["source_closure", "observer_audit"],
    requiredEvidence: ["source_closure_artifact", "observer_audit"],
    claimBoundaryNotes: [
      "Stress-energy conservation must be backed by source-closure and observer-audit evidence before interpretation.",
    ],
  },
  {
    badgeId: "physics.gr.3p1_decomposition",
    kind: "model_relation",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["alpha", "beta_i", "betaOverAlphaMax", "wallHorizonMargin"],
    scalarCuts: [
      {
        id: "wall_horizon_margin_cut",
        expression: "wallHorizonMargin = 1 - betaOverAlphaMax",
        displayLatex: "margin_{wall}=1-\\max(\\beta/\\alpha)",
        outputSymbols: ["wallHorizonMargin"],
      },
    ],
    gates: ["hard_constraints"],
    requiredEvidence: ["shift_lapse_audit", "hard_constraint_report"],
    claimBoundaryNotes: [
      "3+1 decomposition badges bind to sampled lapse/shift diagnostics, not a standalone scalar solve.",
    ],
  },
  {
    badgeId: "nhm2.geometry.lapse_shift_profile",
    kind: "runtime_bound_output",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["tauSelected", "properTimeS", "savedDays", "betaOverAlphaMax", "wallHorizonMargin"],
    scalarCuts: [
      {
        id: "proper_time_offset_cut",
        expression: "t_proper = t_shift + delta_t_lapse",
        displayLatex: "t_{proper}=t_{shift}+\\Delta t_{lapse}",
        outputSymbols: ["t_proper"],
      },
      {
        id: "wall_horizon_margin_cut",
        expression: "wallHorizonMargin = 1 - betaOverAlphaMax",
        displayLatex: "margin_{wall}=1-\\max(\\beta/\\alpha)",
        outputSymbols: ["wallHorizonMargin"],
      },
    ],
    gates: ["hard_constraints", "observer_audit"],
    requiredEvidence: ["shift_lapse_audit", "observer_audit"],
    claimBoundaryNotes: [
      "Lapse/shift profile values are runtime-bound samples from a selected solve family.",
    ],
  },
  {
    badgeId: "nhm2.source.energy_density_proxy",
    kind: "runtime_bound_output",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["rhoMetric", "rhoProxy", "rhoCoupledShadow", "couplingResidualRel"],
    scalarCuts: [
      {
        id: "energy_density_proxy_cut",
        expression: "rho = E / V",
        displayLatex: "\\rho=E/V",
        outputSymbols: ["rho"],
      },
    ],
    gates: ["source_closure", "qei_applicability"],
    requiredEvidence: ["source_closure_artifact", "qei_worldline_dossier"],
    claimBoundaryNotes: [
      "Energy-density proxy values are source-context diagnostics and do not prove a physical source mechanism.",
    ],
  },
  {
    badgeId: "nhm2.closure.source_residual",
    kind: "runtime_bound_output",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["sourceClosureResidualRms", "sourceClosureResidualMax", "sourceClosureResidualByRegion"],
    scalarCuts: [
      {
        id: "source_residual_difference_cut",
        expression: "R_source = source_required - source_available",
        displayLatex: "R_{source}=source_{required}-source_{available}",
        outputSymbols: ["R_source"],
      },
    ],
    gates: ["source_closure"],
    requiredEvidence: ["source_closure_artifact", "source_closure_region_report", "observer_audit"],
    claimBoundaryNotes: [
      "Source residual is runtime-bound closure evidence; a scalar residual row is only a local diagnostic check.",
    ],
  },
  {
    badgeId: "nhm2.source.wall_t00_trace",
    kind: "runtime_bound_output",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: [
      "sourceClosureResidualByRegion.wall.residualNorms.relLInf",
      "sourceClosureWallT00RelLInf",
      "wallT00RelLInf",
      "t00_mismatch_present",
    ],
    scalarCuts: [
      {
        id: "wall_t00_rel_linf_cut",
        expression: "wall_t00_relLInf = abs(T00_geom_wall - T00_tile_wall) / max(abs(T00_geom_wall), eps)",
        displayLatex:
          "\\mathrm{relLInf}_{wall}=|T_{00,geom}^{wall}-T_{00,tile}^{wall}|/\\max(|T_{00,geom}^{wall}|,\\epsilon)",
        outputSymbols: ["wall_t00_relLInf"],
      },
    ],
    gates: ["source_closure", "wall_t00_trace"],
    requiredEvidence: ["source_closure_region_report", "metric_required_wall_tensor", "tile_effective_wall_tensor"],
    claimBoundaryNotes: [
      "Wall T00 trace is a runtime-bound blocker; global source closure summaries must not hide wall-region mismatch.",
    ],
  },
  {
    badgeId: "nhm2.tensor.full_authority_gate",
    kind: "runtime_gate",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: [
      "observerMetricEmissionAdmissionStatus",
      "observerMetricT0iAdmissionStatus",
      "observerMetricOffDiagonalTijAdmissionStatus",
      "tensorAuthorityStatus",
    ],
    scalarCuts: [],
    gates: ["observer_audit", "tensor_authority"],
    requiredEvidence: ["observer_audit", "metric_t0i_emission", "metric_off_diagonal_tij_emission"],
    claimBoundaryNotes: [
      "Full tensor authority remains blocked until same-chart T00, J_i, diagonal S_ij, and off-diagonal S_ij evidence is present.",
    ],
  },
  {
    badgeId: "nhm2.qei.sampling_window",
    kind: "runtime_bound_output",
    runtimeId: "qei_stress_energy.artifact_reader",
    laneId: "qei_stress_energy",
    artifactFields: ["qei_bound", "qei_sample", "qei_margin", "marginRatio", "tauSelected", "tauWindow"],
    scalarCuts: [
      {
        id: "qei_margin_difference_cut",
        expression: "qei_margin = qei_bound - qei_sample",
        displayLatex: "margin_{qei}=bound_{qei}-sample_{qei}",
        outputSymbols: ["qei_margin"],
      },
      {
        id: "tau_margin_cut",
        expression: "tau_margin = tauWindow - tauSelected",
        displayLatex: "margin_{\\tau}=\\tau_{window}-\\tau_{selected}",
        outputSymbols: ["tau_margin"],
      },
    ],
    gates: [
      "timelike_worldline",
      "hadamard_state",
      "point_splitting",
      "unit_integral_sampling",
      "operator_mapping",
      "semantic_bridge",
      "qei_margin",
    ],
    requiredEvidence: ["qei_worldline_dossier", "operator_mapping", "semantic_bridge", "sampling_normalization"],
    claimBoundaryNotes: [
      "QEI sampling values are runtime-bound applicability diagnostics and must fail closed when semantics are missing.",
    ],
  },
  {
    badgeId: "nhm2.qei.worldline_dossier",
    kind: "runtime_gate",
    runtimeId: "qei_stress_energy.artifact_reader",
    laneId: "qei_stress_energy",
    artifactFields: [
      "worldline",
      "samplingFunction",
      "rhoSource",
      "qeiBoundSource",
      "regionalMargins",
      "dutyLightCrossingConsistency",
    ],
    scalarCuts: [],
    gates: ["timelike_worldline", "sampling_normalization", "operator_mapping", "qei_margin", "qei_dossier"],
    requiredEvidence: ["qei_worldline_dossier", "sampling_normalization", "operator_mapping", "regional_margin_report"],
    claimBoundaryNotes: [
      "QEI worldline dossier is a blocked provenance gate until worldline, sampling, source, bound, and regional margin receipts exist.",
    ],
  },
  {
    badgeId: "nhm2.natario.curvature_invariants",
    kind: "runtime_bound_output",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["weylScalar", "ricciInvariant", "petrovClass", "momentumDensity", "natarioInvariantStatus"],
    scalarCuts: [],
    gates: ["observer_audit", "tensor_authority", "curvature_invariants"],
    requiredEvidence: ["curvature_invariant_report", "observer_audit", "metric_t0i_emission"],
    claimBoundaryNotes: [
      "Natario curvature invariants are runtime targets and cannot promote NHM2 without observer and tensor authority.",
    ],
  },
  {
    badgeId: "nhm2.energy_condition.diagnostic_gate",
    kind: "runtime_gate",
    runtimeId: "qei_stress_energy.artifact_reader",
    laneId: "qei_stress_energy",
    artifactFields: ["gateStatus", "gateDetails", "missingSignals", "requiredSignals"],
    scalarCuts: [],
    gates: [
      "source_closure",
      "qei_applicability",
      "observer_audit",
      "hard_constraints",
      "qei_margin",
    ],
    requiredEvidence: ["source_closure_artifact", "qei_worldline_dossier", "observer_audit"],
    claimBoundaryNotes: [
      "Energy-condition gate badges are gate summaries, not calculator validations.",
    ],
  },
  {
    badgeId: "nhm2.claim_boundary.diagnostic_only",
    kind: "claim_boundary",
    runtimeId: "gr_nhm2.artifact_reader",
    laneId: "warp_gr_nhm2",
    artifactFields: ["claimPosture", "promotionBlockedBy", "certificateIntegrity", "certificateIssued"],
    scalarCuts: [],
    gates: ["certificate_issued", "certificate_integrity"],
    requiredEvidence: [...NHM2_PROMOTION_EVIDENCE],
    claimBoundaryNotes: [
      "NHM2 remains diagnostic unless source closure, observer audit, QEI dossier, certificate issuance, and certificate integrity are all present and passing.",
    ],
  },
];

export function getNhm2RuntimeFieldBinding(
  badgeId: string,
): Nhm2RuntimeFieldBinding | null {
  return NHM2_RUNTIME_FIELD_BINDINGS.find((binding) => binding.badgeId === badgeId) ?? null;
}

export function findNhm2RuntimeFieldBindingsForGate(
  gateId: string,
): Nhm2RuntimeFieldBinding[] {
  return NHM2_RUNTIME_FIELD_BINDINGS.filter((binding) => binding.gates.includes(gateId));
}

export function isNhm2RuntimeBoundBadge(badgeId: string): boolean {
  const binding = getNhm2RuntimeFieldBinding(badgeId);
  return Boolean(binding && binding.kind !== "model_relation");
}
