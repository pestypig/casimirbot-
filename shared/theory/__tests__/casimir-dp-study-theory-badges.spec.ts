import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildCasimirDpStudyTheoryBadgesV1 } from "../casimir-dp-study-theory-badges";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { locateTheoryBadges } from "../theory-badge-overlap-locator";
import type { TheoryBadgeLookupMatch } from "../theory-badge-overlap-locator";

describe("Casimir / DP quantum-foam study badges", () => {
  it("registers the separated study lane in the canonical graph", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const graph = buildHelixTheoryBadgeGraphV1();
    const ids = graph.badges.map((badge) => badge.id);

    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(ids).toEqual(
      expect.arrayContaining([
        "study.casimir_dp.protocol",
        "study.casimir_dp.manifold_response_hypothesis",
        "study.casimir_dp.decoherence_collapse_gate",
        "study.casimir_dp.quantum_foam_hypothesis",
        "study.casimir_dp.observable_separation_gate",
        "study.casimir_dp.frequency_bridge_gate",
        "study.casimir_dp.experiment_design_campaign",
        "study.casimir_dp.gated_computations_stage1",
        "study.casimir_dp.data_readiness_stage1",
        "study.casimir_dp.proposal_closure",
        "study.casimir_dp.penrose_or_branch_geometry_context",
        "study.casimir_dp.complex_coherence_discriminator",
        "study.casimir_dp.qed_green_noise_budget",
        "study.casimir_dp.dp_companion_signature",
        "study.casimir_dp.casimir_gravity_upper_bound",
        "study.casimir_dp.blinded_model_comparison",
        "study.casimir_dp.manifold_kernel_registry",
        "study.casimir_dp.evidence_map_stage3",
        "study.casimir_dp.polarization_resolved_qed_control",
        "study.casimir_dp.thermal_radiative_closure",
        "study.casimir_dp.tensor_dimensional_congruence",
        "study.casimir_dp.polarization_congruence_stage4",
        "study.casimir_dp.qed_scale_hierarchy_stage4_1",
        "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
        "study.casimir_dp.planck_solar_calibration_stage4_2a",
        "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
        "study.casimir_dp.identifiability_redesign_stage4_2c",
        "study.casimir_dp.cross_scale_metrology_stage4_2d",
        "study.casimir_dp.causal_cone_clock_stage4_2e",
        "study.casimir_dp.maxwell_macroscopic_qed_closure_stage4_2f",
        "study.casimir_dp.empirical_feasibility_pilot_stage4_2g",
        "study.casimir_dp.commissioning_intake_stage4_2h",
        "study.casimir_dp.claim_boundary",
      ]),
    );
    expect(branch.badges).toHaveLength(33);
    expect(branch.edges).toHaveLength(98);
    expect(branch.badges.every((badge) => badge.claimBoundary.diagnosticOnly)).toBe(true);
    expect(branch.badges.every((badge) => badge.claimBoundary.promotionAllowed === false)).toBe(true);
  });

  it("connects Stage-4 polarization, thermal, and congruence controls without inventing a bridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const stage4Ids = [
      "study.casimir_dp.polarization_resolved_qed_control",
      "study.casimir_dp.thermal_radiative_closure",
      "study.casimir_dp.tensor_dimensional_congruence",
      "study.casimir_dp.polarization_congruence_stage4",
    ];
    const stage4 = branch.badges.filter((badge) =>
      stage4Ids.includes(badge.id)
    );
    const campaign = stage4.find((badge) =>
      badge.id === "study.casimir_dp.polarization_congruence_stage4"
    );

    expect(stage4).toHaveLength(4);
    expect(stage4.every((badge) =>
      badge.tags.includes("synthetic_validation")
    )).toBe(true);
    expect(stage4.every((badge) =>
      badge.tags.includes("measured_not_ready")
    )).toBe(true);
    expect(stage4.every((badge) =>
      badge.tags.includes("synthetic_blinding_contract_only")
    )).toBe(true);
    expect(stage4.every((badge) =>
      badge.calculatorPayloads.length === 0
    )).toBe(true);
    expect(branch.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        from: "physics.radiation.mode_context",
        to: "study.casimir_dp.polarization_resolved_qed_control",
        relation: "requires",
      }),
      expect.objectContaining({
        from: "solar.spectrum.stefan_boltzmann_luminosity",
        to: "study.casimir_dp.thermal_radiative_closure",
        relation: "diagnostic_checks",
      }),
      expect.objectContaining({
        from: "physics.quantum.energy_frequency",
        to: "study.casimir_dp.tensor_dimensional_congruence",
        relation: "requires",
      }),
      expect.objectContaining({
        from: "study.casimir_dp.evidence_map_stage3",
        to: campaign?.id,
        relation: "requires",
      }),
    ]));
    expect(branch.edges.some((edge) =>
      edge.observableBridge != null &&
      stage4Ids.includes(edge.from)
    )).toBe(false);
    expect(branch.badges.find((badge) =>
      badge.id === "study.casimir_dp.tensor_dimensional_congruence"
    )?.equations[0]?.displayLatex).toContain("not\\Rightarrow");
    expect(campaign?.assumptions.join(" ")).toContain(
      "no custodian receipt or mapping has been created",
    );
    expect(campaign?.assumptions.join(" ")).toContain(
      "measured comparison and unblinding are unauthorized",
    );
  });

  it("registers Stage-4.1 as a source-backed QED identity calibration and semantic non-bridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const calibration = branch.badges.find(
      (badge) =>
        badge.id === "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    );
    const calibrationEdges = branch.edges.filter(
      (edge) =>
        edge.from === calibration?.id ||
        edge.to === calibration?.id,
    );

    expect(calibration).toEqual(
      expect.objectContaining({
        level: "diagnostic_gate",
        status: "diagnostic",
        calculatorPayloads: [],
        claimBoundary: expect.objectContaining({
          diagnosticOnly: true,
          physicalMechanismClaimAllowed: false,
          promotionAllowed: false,
        }),
      }),
    );
    expect(calibration?.tags).toEqual(
      expect.arrayContaining([
        "stage_4_1",
        "stage_1_reduced_order",
        "source_backed_calculation",
        "same_dimension_not_connected",
        "maximum_claim:qed_scale_identity_calibration",
      ]),
    );
    expect(calibration?.equations[0]?.displayLatex).toContain(
      "\\nu_R^{(\\infty)}=\\frac{\\alpha_{fs}^2}{2}\\nu_C",
    );
    expect(calibration?.assumptions.join(" ")).toContain(
      "not independent confirmations",
    );
    expect(calibration?.assumptions.join(" ")).toContain(
      "No cavity-mode, Casimir, DP, collapse, manifold, resonance, polarization, or transfer-kernel variable",
    );
    expect(calibrationEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "study.casimir_dp.polarization_congruence_stage4",
          to: calibration?.id,
          relation: "requires",
        }),
        expect.objectContaining({
          from: "study.casimir_dp.tensor_dimensional_congruence",
          to: calibration?.id,
          relation: "requires",
        }),
        expect.objectContaining({
          from: "physics.atomic.electronic_level_structure_context",
          to: calibration?.id,
          relation: "requires",
        }),
        expect.objectContaining({
          from: calibration?.id,
          to: "study.casimir_dp.claim_boundary",
          relation: "documents",
        }),
      ]),
    );
    expect(calibrationEdges).toHaveLength(5);
    expect(
      calibrationEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
  });

  it("registers Stage-4.2A mass and radiometric calibrations as a zero-bridge dependency ladder", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const massAnchor = branch.badges.find(
      (badge) =>
        badge.id ===
          "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    );
    const solarCalibration = branch.badges.find(
      (badge) =>
        badge.id ===
          "study.casimir_dp.planck_solar_calibration_stage4_2a",
    );
    const stage4_2aIds = [massAnchor?.id, solarCalibration?.id].filter(
      (id): id is string => id != null,
    );
    const stage4_2aEdges = branch.edges.filter(
      (edge) =>
        stage4_2aIds.includes(edge.from) ||
        stage4_2aIds.includes(edge.to),
    );
    const stage4_2bId =
      "study.casimir_dp.apparatus_coherence_residual_stage4_2b";
    const stage4_2aLadderEdges = stage4_2aEdges.filter(
      (edge) => edge.from !== stage4_2bId && edge.to !== stage4_2bId,
    );
    const stage4_2bDependencyEdges = stage4_2aEdges.filter(
      (edge) => edge.from === stage4_2bId || edge.to === stage4_2bId,
    );

    expect(massAnchor).toEqual(expect.objectContaining({
      level: "diagnostic_gate",
      status: "diagnostic",
      calculatorPayloads: [],
      claimBoundary: expect.objectContaining({
        diagnosticOnly: true,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      }),
    }));
    expect(massAnchor?.tags).toEqual(expect.arrayContaining([
      "stage_4_2a",
      "source_backed_replay",
      "same_dimension_not_connected",
      "maximum_claim:electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only",
    ]));
    expect(massAnchor?.assumptions.join(" ")).toContain(
      "not independent confirmations",
    );
    expect(massAnchor?.assumptions.join(" ")).toContain(
      "supplies no Casimir, DP, collapse, manifold, cosmological, or quantum-foam transfer law",
    );

    expect(solarCalibration).toEqual(expect.objectContaining({
      level: "diagnostic_gate",
      status: "diagnostic",
      calculatorPayloads: [],
      claimBoundary: expect.objectContaining({
        diagnosticOnly: true,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      }),
    }));
    expect(solarCalibration?.tags).toEqual(expect.arrayContaining([
      "stage_4_2a",
      "coarse_wien_peak_not_full_fit",
      "temperature_semantics_separated",
      "same_dimension_not_connected",
      "promotion_blocked",
    ]));
    expect(solarCalibration?.assumptions.join(" ")).toContain(
      "coarse frozen-grid Wien-peak color diagnostic",
    );
    expect(solarCalibration?.assumptions.join(" ")).toContain(
      "flux-equivalent luminosity-radius conversion",
    );
    expect(solarCalibration?.assumptions.join(" ")).toContain(
      "not a full spectral fit",
    );
    expect(solarCalibration?.units).toEqual(expect.arrayContaining([
      expect.objectContaining({
        symbol: "T_color_TSIS",
        unit: "K",
        dimensionSignature: "Theta",
      }),
      expect.objectContaining({
        symbol: "T_eff_IAU",
        unit: "K",
        dimensionSignature: "Theta",
      }),
      expect.objectContaining({
        symbol: "B_lambda",
        unit: "W m^-2 sr^-1 m^-1",
        dimensionSignature: "M L^-1 T^-3",
      }),
      expect.objectContaining({
        symbol: "B_nu",
        unit: "W m^-2 sr^-1 Hz^-1",
        dimensionSignature: "M T^-2",
      }),
      expect.objectContaining({
        symbol: "B_omega",
        unit: "W m^-2 sr^-1 per_rad_s",
        dimensionSignature: "M T^-2",
      }),
      expect.objectContaining({
        symbol: "sigma_SB",
        unit: "W m^-2 K^-4",
        dimensionSignature: "M T^-3 Theta^-4",
      }),
    ]));
    expect(solarCalibration?.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path:
          "configs/research/source-snapshots/tsis1-hsrs-20260725-480-800nm.csv",
      }),
    ]));
    expect(stage4_2aLadderEdges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        from: massAnchor?.id,
        to: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
        relation: "requires",
      }),
      expect.objectContaining({
        from: massAnchor?.id,
        to: solarCalibration?.id,
        relation: "diagnostic_checks",
      }),
      expect.objectContaining({
        from: "study.casimir_dp.frequency_bridge_gate",
        to: massAnchor?.id,
        relation: "requires",
      }),
      expect.objectContaining({
        from: solarCalibration?.id,
        to: "study.casimir_dp.thermal_radiative_closure",
        relation: "diagnostic_checks",
      }),
      expect.objectContaining({
        from: "solar.spectrum.stefan_boltzmann_luminosity",
        to: solarCalibration?.id,
        relation: "diagnostic_checks",
      }),
      expect.objectContaining({
        from: massAnchor?.id,
        to: "study.casimir_dp.claim_boundary",
        relation: "documents",
      }),
      expect.objectContaining({
        from: solarCalibration?.id,
        to: "study.casimir_dp.claim_boundary",
        relation: "documents",
      }),
      expect.objectContaining({
        from: massAnchor?.id,
        to: "study.casimir_dp.cross_scale_metrology_stage4_2d",
        relation: "diagnostic_checks",
      }),
    ]));
    expect(stage4_2aLadderEdges).toHaveLength(8);
    expect(stage4_2bDependencyEdges).toEqual([
      expect.objectContaining({
        from: massAnchor?.id,
        to: stage4_2bId,
        relation: "requires",
      }),
    ]);
    expect(
      stage4_2aEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      stage4_2aEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("exposes the Stage-3 evidence map without promoting synthetic or blocked lanes", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const stage3Ids = [
      "study.casimir_dp.complex_coherence_discriminator",
      "study.casimir_dp.qed_green_noise_budget",
      "study.casimir_dp.dp_companion_signature",
      "study.casimir_dp.casimir_gravity_upper_bound",
      "study.casimir_dp.blinded_model_comparison",
      "study.casimir_dp.manifold_kernel_registry",
      "study.casimir_dp.evidence_map_stage3",
    ];
    const stage3 = branch.badges.filter((badge) => stage3Ids.includes(badge.id));
    const registry = stage3.find(
      (badge) => badge.id === "study.casimir_dp.manifold_kernel_registry",
    );

    expect(stage3).toHaveLength(7);
    expect(stage3.every((badge) => badge.tags.includes("synthetic_validation"))).toBe(true);
    expect(stage3.every((badge) => badge.tags.includes("measured_not_ready"))).toBe(true);
    expect(stage3.every((badge) => badge.calculatorPayloads.length === 0)).toBe(true);
    expect(registry?.status).toBe("blocked");
    expect(branch.edges.some((edge) =>
      edge.from === registry?.id &&
      edge.to === "study.casimir_dp.blinded_model_comparison" &&
      edge.relation === "requires"
    )).toBe(true);
    expect(branch.edges.some((edge) => edge.relation === "derives" && edge.from === registry?.id)).toBe(false);
    expect(branch.edges.some((edge) => edge.observableBridge != null)).toBe(false);
  });

  it("registers proposal completeness separately from commissioning and evidence", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const proposal = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.proposal_closure",
    );

    expect(proposal?.status).toBe("diagnostic");
    expect(proposal?.tags).toEqual(expect.arrayContaining([
      "proposal_complete",
      "commissioning_conditional",
      "hardware_not_validated",
    ]));
    expect(proposal?.equations.map((equation) => equation.id)).toContain(
      "casimir_dp_proposal_phase_force_bound",
    );
    expect(proposal?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === proposal?.id && edge.relation === "blocks")).toBe(true);
  });

  it("registers data-readiness numerics without promoting synthetic fixtures", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const readiness = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.data_readiness_stage1",
    );

    expect(readiness?.status).toBe("diagnostic");
    expect(readiness?.tags).toEqual(expect.arrayContaining(["synthetic_validation", "measured_evidence_open"]));
    expect(readiness?.equations.map((equation) => equation.id)).toEqual(expect.arrayContaining([
      "casimir_dp_data_readiness_kramers_kronig",
      "casimir_dp_data_readiness_correlation_power",
      "casimir_dp_data_readiness_measured_gate",
    ]));
    expect(readiness?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === readiness?.id && edge.relation === "blocks")).toBe(true);
  });

  it("exposes the role-separated campaign as diagnostic design evidence only", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const campaign = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.experiment_design_campaign",
    );

    expect(campaign?.status).toBe("diagnostic");
    expect(campaign?.tags).toEqual(expect.arrayContaining(["design_only", "no_physics_winner"]));
    expect(campaign?.equations[0]?.computableExpression).toBe("R_access = Gamma_DP/Gamma_env");
    expect(campaign?.claimBoundary.promotionAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === campaign?.id && edge.relation === "blocks")).toBe(true);
  });

  it("registers Stage-1 numerical progress without closing physical evidence gates", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const stage1 = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.gated_computations_stage1",
    );

    expect(stage1?.status).toBe("diagnostic");
    expect(stage1?.tags).toEqual(expect.arrayContaining(["stage_1", "promotion_blocked"]));
    expect(stage1?.equations.map((equation) => equation.id)).toContain(
      "casimir_dp_stage1_manifold_registration_gate",
    );
    expect(stage1?.claimBoundary.physicalMechanismClaimAllowed).toBe(false);
    expect(branch.edges.some((edge) => edge.from === stage1?.id && edge.relation === "blocks")).toBe(true);
  });

  it("keeps manifold response at Stage 0 and decoherence distinct from objective collapse", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const hypothesis = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.manifold_response_hypothesis",
    );
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.decoherence_collapse_gate");

    expect(hypothesis?.status).toBe("blocked");
    expect(hypothesis?.tags).toContain("stage_0");
    expect(hypothesis?.calculatorPayloads).toEqual([]);
    expect(hypothesis?.equations.find((equation) => equation.id === "manifold_response_slot")?.operatorKind).toBe(
      "noncomputable_reference",
    );
    expect(gate?.status).toBe("blocked");
    expect(gate?.observables?.map((observable) => observable.canonicalObservableId)).toEqual([
      "observable.coherence.boundary_conditioned_decay_residual",
      "observable.coherence.boundary_conditioned_phase_residual",
      "observable.collapse.objective_rate",
    ]);
    expect(gate?.equations.map((equation) => equation.id)).toEqual(
      expect.arrayContaining([
        "interferometric_phase_visibility_readout",
        "boundary_conditioned_phase_residual",
        "ambient_gravity_phase_control",
      ]),
    );
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.relation === "blocks")).toBe(true);
  });

  it("records Penrose OR as context without importing Orch OR or phase-of-matter dynamics", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const context = branch.badges.find(
      (badge) => badge.id === "study.casimir_dp.penrose_or_branch_geometry_context",
    );

    expect(context?.status).toBe("diagnostic");
    expect(context?.equations.map((equation) => equation.id)).toEqual([
      "penrose_or_branch_geometry_state",
      "penrose_or_timescale_notation_context",
    ]);
    expect(context?.assumptions.join(" ")).toContain("does not validate Orch OR");
    expect(branch.edges.filter((edge) => edge.from === context?.id || edge.to === context?.id)).toHaveLength(7);
    expect(branch.edges.some((edge) =>
      edge.from === context?.id &&
      edge.to === "orch_or.claim_boundary.exploratory_only" &&
      edge.relation === "documents"
    )).toBe(true);
    expect(branch.edges.some((edge) =>
      edge.from.startsWith("matter.phase.") || edge.to.startsWith("matter.phase.")
    )).toBe(false);
  });

  it("fails closed instead of inventing a Casimir-to-DP observable bridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.observable_separation_gate");
    const hypothesis = branch.badges.find((badge) => badge.id === "study.casimir_dp.quantum_foam_hypothesis");
    const observableIds = gate?.observables?.map((observable) => observable.canonicalObservableId) ?? [];

    expect(gate?.status).toBe("blocked");
    expect(observableIds).toEqual([
      "observable.casimir.force_residual",
      "observable.dp.gravitational_self_energy_difference",
    ]);
    expect(branch.edges.some((edge) => edge.observableBridge != null)).toBe(false);
    expect(hypothesis?.calculatorPayloads).toEqual([]);
    expect(hypothesis?.equations[0]?.operatorKind).toBe("noncomputable_reference");
  });

  it("registers Stage-4.2B as a synthetic-only zero-bridge apparatus forecast", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
        "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];
    const sourceRefKeys = new Set(
      badge?.sourceRefs.flatMap((sourceRef) => [sourceRef.path, sourceRef.id]) ?? [],
    );

    expect(badge).toEqual(expect.objectContaining({
      level: "diagnostic_gate",
      status: "diagnostic",
      calculatorPayloads: [],
    }));
    expect(badge?.claimBoundary).toEqual(expect.objectContaining({
      diagnosticOnly: true,
      promotionAllowed: false,
      physicalMechanismClaimAllowed: false,
    }));
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "synthetic_only_v1",
      "synthetic_validation",
      "measured_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "runtime_g_campaign_pass",
      "runtime_f_signature_not_identifiable",
      "current_no_go_not_dp_exclusion",
      "maximum_synthetic_claim:apparatus_residual_and_frozen_dp_signature_software_recovery_only",
      "maximum_source_backed_claim:apparatus_power_and_identifiability_forecast_only",
    ]));
    expect(assumptions).toContain(
      "registered nonrelativistic Markovian mass-density DP generator",
    );
    expect(assumptions).toContain(
      "complete joint-system equivalence",
    );
    expect(assumptions).toContain(
      "not a theorem about Penrose OR",
    );
    expect(assumptions).toContain(
      "Stage-4.2B v1 accepts synthetic_fixture evidence only",
    );
    expect(assumptions).toContain(
      "blocks Runtime F as signature_not_identifiable",
    );
    expect(assumptions).toContain(
      "acquisition power and a DP exclusion are not estimable",
    );
    expect(assumptions).toContain(
      "Fresh adapter run 2325 passes",
    );
    const reportJsonPath =
      "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json";
    const reportMarkdownPath =
      "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.md";
    const tracePath =
      "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-trace.jsonl";
    const receiptPath =
      "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-receipt.json";
    const adapterTracePath =
      "artifacts/training-trace-stage4-2b-20260726T130100867Z-bound-validated.jsonl";
    const verificationReceiptPath =
      "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json";
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md",
      "shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts",
      "tests/casimir-dp-stage4-2b-contract.spec.ts",
      "scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
      "configs/research/casimir-dp-stage4-2b-authorities.v1.json",
      "configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json",
      "tests/casimir-dp-stage4-2b-campaign.spec.ts",
      reportJsonPath,
      reportMarkdownPath,
      tracePath,
      receiptPath,
      adapterTracePath,
      verificationReceiptPath,
    ]));
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === reportJsonPath,
    )?.id).toBe(
      "2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67",
    );
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === reportMarkdownPath,
    )?.id).toBe(
      "e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe",
    );
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === tracePath,
    )?.id).toBe(
      "727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7",
    );
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === receiptPath,
    )?.id).toBe(
      "50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c",
    );
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === adapterTracePath,
    )?.id).toBe(
      "3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd",
    );
    expect(badge?.sourceRefs.find(
      (sourceRef) => sourceRef.path === verificationReceiptPath,
    )?.id).toBe(
      "194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d",
    );
    expect(sourceRefKeys.has(
      badge?.observables?.[0]?.operationalDefinitionRef ?? "",
    )).toBe(true);
    expect(sourceRefKeys.has(
      badge?.observables?.[0]?.responseModelRef ?? "",
    )).toBe(true);
    expect(incidentEdges).toHaveLength(8);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
    expect(
      branch.edges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
  });

  it("registers Stage-4.2C as a bounded synthetic redesign without promoting pilot readiness", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
        "study.casimir_dp.identifiability_redesign_stage4_2c",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge).toEqual(expect.objectContaining({
      level: "diagnostic_gate",
      status: "diagnostic",
      calculatorPayloads: [],
    }));
    expect(badge?.claimBoundary).toEqual(expect.objectContaining({
      diagnosticOnly: true,
      promotionAllowed: false,
      physicalMechanismClaimAllowed: false,
    }));
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "synthetic_only_v1",
      "bounded_powered_region_available",
      "selected_candidate:silica_high_mass_identifiable",
      "required_paired_windows:542",
      "measured_control_response_not_ready",
      "measured_covariance_not_ready",
      "state_preparation_not_ready",
      "physical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "fresh_adapter_verifier_pass_integrity_ok",
      "zero_observable_bridge",
    ]));
    expect(assumptions).toContain(
      "maximum absolute whitened cosine 0.7177243227022941",
    );
    expect(assumptions).toContain(
      "normalized Gram condition 6.531693613125537",
    );
    expect(assumptions).toContain("542 required paired windows");
    expect(assumptions).toContain(
      "no authentic state-preparation receipt exists",
    );
    expect(assumptions).toContain("no bridge kernel is admitted");
    expect(assumptions).toContain(
      "Fresh adapter run 2332 passes",
    );
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "shared/casimir-dp-control-response-stage4-2c.ts",
      "shared/casimir-dp-apparatus-redesign-stage4-2c.ts",
      "shared/casimir-dp-acquisition-packets-stage4-2c.ts",
      "scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts",
      "shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1.ts",
      "configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json",
      "configs/research/casimir-dp-stage4-2c-authorities.v1.json",
      "configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json",
      "docs/research/casimir-dp-identifiability-redesign-stage4-2c-report.md",
      "docs/research/casimir-dp-identifiability-redesign-stage4-2c-plan.md",
      "docs/research/casimir-dp-identifiability-redesign-stage4-2c-verification-receipt.json",
      "artifacts/training-trace-stage4-2c-20260728T045623510Z-bound-validated.jsonl",
      "tests/casimir-dp-stage4-2c-contract.spec.ts",
      "tests/casimir-dp-stage4-2c-campaign.spec.ts",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2b_no_go_requires_stage4_2c_redesign",
        "casimir_dp_stage4_thermal_requires_stage4_2c_control_response",
        "casimir_dp_named_companion_checks_stage4_2c_powered_region",
        "casimir_dp_stage4_2c_missing_measurement_blocks_claim_boundary",
        "casimir_dp_stage4_2c_requires_stage4_2d_cross_scale_metrology",
      ]),
    );
    expect(incidentEdges).toHaveLength(5);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("registers Stage-4.2D as source-bounded calibration and recovery with zero DP bridges", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
          "study.casimir_dp.cross_scale_metrology_stage4_2d",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge?.status).toBe("diagnostic");
    expect(badge?.calculatorPayloads).toEqual([]);
    expect(badge?.claimBoundary).toEqual(expect.objectContaining({
      diagnosticOnly: true,
      promotionAllowed: false,
      physicalMechanismClaimAllowed: false,
    }));
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "source_bounded",
      "spectroscopic_response_not_ready",
      "physical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "zero_observable_bridge",
      "fresh_adapter_verifier_pass_integrity_ok",
    ]));
    expect(badge?.equations.map((equation) => equation.id)).toEqual([
      "casimir_dp_stage4_2d_spectroscopic_field_metrology",
      "casimir_dp_stage4_2d_classical_gravity_recovery",
      "casimir_dp_stage4_2d_nonbridge_gate",
    ]);
    expect(assumptions).toContain(
      "Stark, Zeeman, and blackbody dynamic-Stark equations are sourced apparatus calibration transfers only",
    );
    expect(assumptions).toContain(
      "Schwarzschild compactness, potato radius, and Jeans length are force-balance or compactness recovery checks",
    );
    expect(assumptions).toContain(
      "Only branch_density_difference_to_dp_rate is admitted",
    );
    expect(assumptions).toContain("Fresh adapter run 2338 returns PASS");
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-verification-receipt.json",
      "artifacts/training-trace-stage4-2d-20260728T195741260Z-bound-validated.jsonl",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2c_requires_stage4_2d_cross_scale_metrology",
        "casimir_dp_stage4_thermal_checks_stage4_2d_blackbody_stark",
        "casimir_dp_stage4_2a_mass_anchor_checks_stage4_2d_units",
        "casimir_dp_stage4_2d_nonbridge_blocks_claim_boundary",
        "casimir_dp_stage4_2d_requires_stage4_2e_causal_congruence",
      ]),
    );
    expect(incidentEdges).toHaveLength(5);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("registers Stage-4.2E as a causal recovery and QED/GR/DP nonbridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id === "study.casimir_dp.causal_cone_clock_stage4_2e",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge?.status).toBe("diagnostic");
    expect(badge?.calculatorPayloads).toEqual([]);
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "null_geodesic_apparatus_authority_not_ready",
      "complete_apparatus_metric_response_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "zero_observable_bridge",
      "fresh_adapter_verifier_pass_integrity_ok",
    ]));
    expect(badge?.equations.map((equation) => equation.id)).toEqual([
      "casimir_dp_stage4_2e_adm_null_clock",
      "casimir_dp_stage4_2e_radial_null_recovery",
      "casimir_dp_stage4_2e_casimir_curvature_screen",
      "casimir_dp_stage4_2e_qed_metric_nonbridge",
    ]);
    expect(assumptions).toContain(
      "Massive apparatus clocks must remain timelike",
    );
    expect(assumptions).toContain(
      "Standard mass-density DP remains boundary independent",
    );
    expect(assumptions).toContain(
      "The Scharnhorst-scale QED propagation proxy belongs to the material/QED response lane",
    );
    expect(assumptions).toContain("Fresh adapter run 2346 returns PASS");
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "docs/research/casimir-dp-causal-cone-clock-stage4-2e-verification-receipt.json",
      "artifacts/training-trace-stage4-2e-20260729T221500000Z-bound-validated.jsonl",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2d_requires_stage4_2e_causal_congruence",
        "casimir_dp_semiclassical_baseline_checks_stage4_2e_tensor_screen",
        "casimir_dp_stage4_2e_nonbridge_blocks_claim_boundary",
        "casimir_dp_stage4_2e_requires_stage4_2f_maxwell_closure",
      ]),
    );
    expect(incidentEdges).toHaveLength(4);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("registers Stage-4.2F as a Maxwell/macroscopic-QED and exact-DP nonbridge", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
          "study.casimir_dp.maxwell_macroscopic_qed_closure_stage4_2f",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge?.status).toBe("diagnostic");
    expect(badge?.calculatorPayloads).toEqual([]);
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "nhm2_method_only_no_evidence_reuse",
      "finite_geometry_maxwell_authority_not_ready",
      "candidate_transport_identity_not_ready",
      "companion_detector_authority_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "zero_observable_bridge",
    ]));
    expect(badge?.equations.map((equation) => equation.id)).toEqual([
      "casimir_dp_stage4_2f_covariant_maxwell",
      "casimir_dp_stage4_2f_green_fdt_stress",
      "casimir_dp_stage4_2f_dp_master_model",
      "casimir_dp_stage4_2f_closure_gate",
    ]);
    expect(assumptions).toContain(
      "The NHM2 finite-temperature finite-geometry Maxwell-stress contract is method authority only",
    );
    expect(assumptions).toContain(
      "the headline 0.13487168259863525 s^-1 rate belongs to the strongest 4.60765e-16 kg transported grid cell",
    );
    expect(assumptions).toContain(
      "SNR 1985.5322830887471 assumes a synthetic 1e-43 W one-shot uncertainty",
    );
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "shared/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f.ts",
      "artifacts/research/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1-20260730T023000000Z/maxwell-macroscopic-qed-closure-stage4-2f-report.json",
      "docs/research/casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-plan.md",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2e_requires_stage4_2f_maxwell_closure",
        "casimir_dp_qed_green_requires_stage4_2f_apparatus_closure",
        "casimir_dp_companion_checks_stage4_2f_named_dp_domain",
        "casimir_dp_stage4_2f_open_apparatus_gates_block_claim_boundary",
        "casimir_dp_stage4_2f_requires_stage4_2g_empirical_handoff",
      ]),
    );
    expect(incidentEdges).toHaveLength(5);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("registers Stage-4.2G as a non-promotable empirical handoff", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
          "study.casimir_dp.empirical_feasibility_pilot_stage4_2g",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge?.status).toBe("diagnostic");
    expect(badge?.calculatorPayloads).toEqual([]);
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "single_design_identity_frozen",
      "empirical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "zero_observable_bridge",
    ]));
    expect(badge?.equations.map((equation) => equation.id)).toEqual([
      "casimir_dp_stage4_2g_single_identity_dp",
      "casimir_dp_stage4_2g_companion_threshold",
      "casimir_dp_stage4_2g_whitened_pilot_gates",
    ]);
    expect(assumptions).toContain(
      "mass 1.94385e-16 kg, branch separation 1.6e-7 m, and hold time 0.25 s",
    );
    expect(assumptions).toContain(
      "Gamma_DP 0.02400420398374263 s^-1",
    );
    expect(assumptions).toContain(
      "maximum one-shot companion uncertainty is 3.859576928482061e-40 W",
    );
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "shared/casimir-dp-empirical-feasibility-pilot-stage4-2g.ts",
      "configs/research/fixtures/casimir-dp-stage4-2g-pilot-unacquired.v1.json",
      "artifacts/research/casimir-dp-empirical-feasibility-pilot-stage4-2g/casimir-dp-empirical-feasibility-pilot-stage4-2g-v1-20260730T030000000Z/empirical-feasibility-pilot-stage4-2g-report.json",
      "docs/research/casimir-dp-empirical-feasibility-pilot-stage4-2g-plan.md",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2f_requires_stage4_2g_empirical_handoff",
        "casimir_dp_stage4_2g_unacquired_packet_blocks_claim_boundary",
        "casimir_dp_stage4_2g_requires_stage4_2h_commissioning_intake",
      ]),
    );
    expect(incidentEdges).toHaveLength(3);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("registers Stage-4.2H as a non-promotable commissioning intake", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const badge = branch.badges.find(
      (candidate) =>
        candidate.id ===
          "study.casimir_dp.commissioning_intake_stage4_2h",
    );
    const incidentEdges = branch.edges.filter(
      (edge) => edge.from === badge?.id || edge.to === badge?.id,
    );
    const assumptions = badge?.assumptions.join(" ") ?? "";
    const sourceRefPaths =
      badge?.sourceRefs.map((sourceRef) => sourceRef.path) ?? [];

    expect(badge?.status).toBe("diagnostic");
    expect(badge?.calculatorPayloads).toEqual([]);
    expect(badge?.tags).toEqual(expect.arrayContaining([
      "synthetic_dry_run_only",
      "instrument_registry_not_ready",
      "raw_data_not_ready",
      "empirical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "zero_observable_bridge",
    ]));
    expect(badge?.equations.map((equation) => equation.id)).toEqual([
      "casimir_dp_stage4_2h_commissioning_gate",
    ]);
    expect(assumptions).toContain(
      "twelve instrument/computational roles, thirteen acquisition products, four data partitions, and twenty-eight raw columns",
    );
    expect(assumptions).toContain(
      "every synthetic identifier, hash, covariance, and custody event has zero empirical authority",
    );
    expect(sourceRefPaths).toEqual(expect.arrayContaining([
      "shared/casimir-dp-commissioning-intake-stage4-2h.ts",
      "configs/research/fixtures/casimir-dp-stage4-2h-commissioning-blank.v1.json",
      "artifacts/research/casimir-dp-commissioning-intake-stage4-2h/casimir-dp-commissioning-intake-stage4-2h-v1-20260730T050000000Z/commissioning-intake-stage4-2h-report.json",
      "docs/research/casimir-dp-commissioning-intake-stage4-2h-plan.md",
    ]));
    expect(incidentEdges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "casimir_dp_stage4_2g_requires_stage4_2h_commissioning_intake",
        "casimir_dp_stage4_2h_uncommissioned_dossier_blocks_claim_boundary",
      ]),
    );
    expect(incidentEdges).toHaveLength(2);
    expect(
      incidentEdges.some((edge) => edge.observableBridge != null),
    ).toBe(false);
    expect(
      incidentEdges.some((edge) => edge.relation === "derives"),
    ).toBe(false);
  });

  it("keeps Compton, DP, and cavity frequencies separate until a transfer kernel exists", () => {
    const branch = buildCasimirDpStudyTheoryBadgesV1();
    const gate = branch.badges.find((badge) => badge.id === "study.casimir_dp.frequency_bridge_gate");

    expect(gate?.status).toBe("blocked");
    expect(gate?.tags).toEqual(expect.arrayContaining(["missing_transfer_kernel", "no_resonance_claim"]));
    expect(gate?.equations.map((equation) => equation.id)).toEqual([
      "compton_dp_frequency_identities",
      "compton_dp_cavity_bridge_gate",
    ]);
    expect(gate?.calculatorPayloads).toEqual([]);
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.to === "study.casimir_dp.manifold_response_hypothesis" && edge.relation === "requires")).toBe(true);
    expect(branch.edges.some((edge) => edge.from === gate?.id && edge.relation === "blocks")).toBe(true);
  });

  it("is locatable for study, Casimir, DP, and quantum-foam prompts", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const matches = locateTheoryBadges({
      graph,
      input: {
        query: "Open the CDP-QF-1 Casimir Diósi-Penrose quantum foam manifold-response study and explain the decoherence and observable gates",
        simulationOwners: ["casimir_dp_study"],
        limit: 40,
      },
    });
    expect(matches.map((match: TheoryBadgeLookupMatch) => match.badgeId)).toEqual(
      expect.arrayContaining([
        "study.casimir_dp.protocol",
        "study.casimir_dp.manifold_response_hypothesis",
        "study.casimir_dp.observable_separation_gate",
      ]),
    );
  });
});
