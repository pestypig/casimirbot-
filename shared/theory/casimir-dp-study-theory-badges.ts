import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const STUDY_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const sourceRef = (
  kind: TheoryBadgeV1["sourceRefs"][number]["kind"],
  path: string,
  id?: string,
  note?: string,
): TheoryBadgeV1["sourceRefs"][number] => ({
  kind,
  path,
  id: id ?? null,
  note: note ?? null,
});

const studyBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: STUDY_BOUNDARY,
});

const stage3StudyBadge = (args: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  status: TheoryBadgeV1["status"];
  maturityTag: string;
  modulePath: string;
  testPath: string;
  equationId: string;
  displayLatex: string;
  primaryObservableId: string;
  primaryObservableSymbol: string;
  primaryObservableQuantity: string;
  primaryObservableUnit: string | null;
  primaryObservableDimension: string | null;
  falsifier: string;
  blockedReason: string;
  maximumClaim: string;
}): TheoryBadgeV1 =>
  studyBadge({
    id: args.id,
    title: args.title,
    plainMeaning: args.plainMeaning,
    whyItMatters: args.whyItMatters,
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage3",
      args.primaryObservableId,
    ],
    level: "diagnostic_gate",
    status: args.status,
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["casimir_dp_stage3_evidence_map"],
    tags: [
      "stage_3",
      args.maturityTag,
      "synthetic_validation",
      "measured_not_ready",
      `maximum_claim:${args.maximumClaim}`,
    ],
    equations: [
      {
        id: args.equationId,
        role: "gate",
        displayLatex: args.displayLatex,
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["stage3_config", "runtime_receipt", "evidence_class"],
        outputSymbols: [args.primaryObservableSymbol, "stage3_gate_status"],
      },
    ],
    units: [
      {
        symbol: args.primaryObservableSymbol,
        unit: args.primaryObservableUnit,
        quantity: args.primaryObservableQuantity,
        dimensionSignature: args.primaryObservableDimension,
      },
    ],
    assumptions: [
      `Primary observable: ${args.primaryObservableQuantity}.`,
      `Preregistered falsifier: ${args.falsifier}`,
      `Current blocked/not-ready reason: ${args.blockedReason}`,
      `Maximum permitted claim: ${args.maximumClaim}.`,
      "Synthetic recovery validates software behavior only and cannot satisfy a measured-evidence gate.",
      "This badge cannot promote collapse identification, manifold dynamics, NHM2, or physical viability.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        args.modulePath,
        args.equationId,
        "Stage-3 diagnostic runtime.",
      ),
      sourceRef(
        "test",
        args.testPath,
        args.equationId,
        "Focused synthetic recovery and fail-closed tests.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-evidence-map-stage3.v1.json",
        "casimir-dp-evidence-map-stage3-v1",
        "Frozen Stage-3 authorities, preregistration, and fixture hashes.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-evidence-map-stage3-report.md",
        "casimir-dp-evidence-map-stage3-v1",
        "Maintained Stage-3 evidence-map report.",
      ),
    ],
    observables: [
      {
        id: `${args.id}.primary_observable`,
        canonicalObservableId: args.primaryObservableId,
        symbol: args.primaryObservableSymbol,
        quantity: args.primaryObservableQuantity,
        mathematicalType: "scalar",
        unit: args.primaryObservableUnit,
        dimensionSignature: args.primaryObservableDimension,
        coordinateFrame: "apparatus_frame",
        operationalDefinitionRef:
          "docs/research/casimir-dp-evidence-map-stage3-report.md",
        responseModelRef: args.modulePath,
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 3",
        args.title,
        args.primaryObservableQuantity,
      ],
      symbols: [args.primaryObservableSymbol],
      unitSignatures:
        args.primaryObservableDimension == null
          ? []
          : [args.primaryObservableDimension],
      repoPaths: [
        args.modulePath,
        args.testPath,
        "configs/research/casimir-dp-evidence-map-stage3.v1.json",
        "docs/research/casimir-dp-evidence-map-stage3-report.md",
      ],
      equationFamilies: ["casimir_dp_stage3_evidence_map"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  });

const stage4StudyBadge = (args: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  status: TheoryBadgeV1["status"];
  maturityTag: string;
  modulePath: string;
  testPath: string;
  equationId: string;
  displayLatex: string;
  primaryObservableId: string;
  primaryObservableSymbol: string;
  primaryObservableQuantity: string;
  primaryObservableUnit: string | null;
  primaryObservableDimension: string | null;
  falsifier: string;
  blockedReason: string;
  maximumClaim: string;
  extraSourceRefs?: TheoryBadgeV1["sourceRefs"];
}): TheoryBadgeV1 =>
  studyBadge({
    id: args.id,
    title: args.title,
    plainMeaning: args.plainMeaning,
    whyItMatters: args.whyItMatters,
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4",
      "polarization",
      "thermal_radiation",
      "dimensional_congruence",
      args.primaryObservableId,
    ],
    level: "diagnostic_gate",
    status: args.status,
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "casimir_dp_stage4_polarization_congruence",
      "macroscopic_qed",
      "thermal_radiation",
    ],
    tags: [
      "stage_4",
      args.maturityTag,
      "synthetic_validation",
      "synthetic_blinding_contract_only",
      "measured_not_ready",
      `maximum_claim:${args.maximumClaim}`,
    ],
    equations: [
      {
        id: args.equationId,
        role: "gate",
        displayLatex: args.displayLatex,
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "stage4_config",
          "stage3_immutable_receipt",
          "runtime_receipt",
          "evidence_class",
          "blinding_lane_state",
        ],
        outputSymbols: [
          args.primaryObservableSymbol,
          "stage4_gate_status",
        ],
      },
    ],
    units: [
      {
        symbol: args.primaryObservableSymbol,
        unit: args.primaryObservableUnit,
        quantity: args.primaryObservableQuantity,
        dimensionSignature: args.primaryObservableDimension,
      },
    ],
    assumptions: [
      `Primary observable: ${args.primaryObservableQuantity}.`,
      `Preregistered falsifier: ${args.falsifier}`,
      `Current blocked/not-ready reason: ${args.blockedReason}`,
      `Maximum permitted claim: ${args.maximumClaim}.`,
      "Stage 3 is immutable upstream evidence and the named DP parameter manifest is reused without mutation.",
      "Synthetic prediction recovery validates software behavior only and cannot satisfy measured evidence, collapse identification, manifold dynamics, or physical viability.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        args.modulePath,
        args.equationId,
        "Stage-4 diagnostic runtime.",
      ),
      sourceRef(
        "test",
        args.testPath,
        args.equationId,
        "Focused synthetic recovery and fail-closed tests.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-polarization-congruence-stage4.v1.json",
        "casimir-dp-polarization-congruence-stage4-v1",
        "Frozen Stage-4 authorities, conventions, model policy, and fixture hashes.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-polarization-congruence-stage4-report.md",
        "casimir-dp-polarization-congruence-stage4-v1",
        "Maintained Stage-4 synthetic prediction report.",
      ),
      ...(args.extraSourceRefs ?? []),
    ],
    observables: [
      {
        id: `${args.id}.primary_observable`,
        canonicalObservableId: args.primaryObservableId,
        symbol: args.primaryObservableSymbol,
        quantity: args.primaryObservableQuantity,
        mathematicalType: "scalar",
        unit: args.primaryObservableUnit,
        dimensionSignature: args.primaryObservableDimension,
        coordinateFrame: "right_handed_apparatus_frame",
        operationalDefinitionRef:
          "docs/research/casimir-dp-polarization-congruence-stage4-report.md",
        responseModelRef: args.modulePath,
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4",
        args.title,
        args.primaryObservableQuantity,
        "circular polarization",
        "blackbody thermal closure",
      ],
      symbols: [args.primaryObservableSymbol],
      unitSignatures:
        args.primaryObservableDimension == null
          ? []
          : [args.primaryObservableDimension],
      repoPaths: [
        args.modulePath,
        args.testPath,
        "configs/research/casimir-dp-polarization-congruence-stage4.v1.json",
        "docs/research/casimir-dp-polarization-congruence-stage4-report.md",
      ],
      equationFamilies: [
        "casimir_dp_stage4_polarization_congruence",
        "macroscopic_qed",
        "thermal_radiation",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  });

export const CASIMIR_DP_STUDY_THEORY_BADGES: TheoryBadgeV1[] = [
  studyBadge({
    id: "study.casimir_dp.protocol",
    title: "Casimir / DP Separated-Lane Study Protocol",
    plainMeaning:
      "Runs Casimir reference, material/metrology, DP branch, bounds, bridge, sensitivity, reproduction, and paper-update stages in dependency order.",
    whyItMatters:
      "It transfers the reproducibility discipline of the NHM2 full solve without importing NHM2 force, source, transport, or viability assumptions.",
    subjects: [
      "casimir_dp_study",
      "casimir_effect",
      "diosi_penrose",
      "quantum_foam",
      "study_protocol",
      "run_order",
      "reproducibility",
    ],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["study_protocol", "casimir_energy", "dp_collapse"],
    tags: ["whitepaper", "runtime_reference", "ordered_protocol", "diagnostic_only"],
    equations: [
      {
        id: "casimir_dp_canonical_run_order",
        role: "noncomputable_reference",
        displayLatex:
          "P_{study}=P_{freeze}\\prec P_{Casimir}\\prec P_{material}\\prec P_{DP}\\prec P_{bounds}\\prec P_{bridge}\\prec P_{sensitivity}\\prec P_{reproduce}\\prec P_{paper}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["study_config", "runtime_receipts", "evidence_receipts"],
        outputSymbols: ["study_run_receipt"],
      },
    ],
    units: [],
    assumptions: [
      "Stage authority follows dependency order even when a stage uses internal parallelism.",
      "A completed process receipt does not turn blocked or not-ready scientific gates into pass.",
      "The protocol is independent of NHM2 source closure, transport, viability, and certificate semantics.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "CDP-QF-1", "Maintained study paper."),
      sourceRef("doc", "docs/research/study-full-solve-template.md", "full-solve-study-template", "Reusable study protocol."),
      sourceRef("repo_module", "scripts/research/run-casimir-dp-quantum-foam-study.ts", "runCasimirDpStudy", "Deterministic diagnostic runner."),
      sourceRef("artifact", "configs/research/casimir-dp-quantum-foam-study.v1.json", "diagnostic-smoke-v1", "Machine-readable stage order and smoke inputs."),
    ],
    hintKeys: {
      subjects: ["casimir dp study", "casimir effect", "diosi penrose", "quantum foam", "full solve", "study protocol"],
      symbols: ["P_study", "study_run_receipt"],
      unitSignatures: [],
      repoPaths: [
        "docs/research/casimir-dp-quantum-foam-study.md",
        "docs/research/study-full-solve-template.md",
        "configs/research/casimir-dp-quantum-foam-study.v1.json",
        "scripts/research/run-casimir-dp-quantum-foam-study.ts",
      ],
      equationFamilies: ["study_protocol", "casimir_energy", "dp_collapse"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.manifold_response_hypothesis",
    title: "Boundary-Conditioned Manifold-Response Hypothesis",
    plainMeaning:
      "Tests whether a controlled Casimir boundary change leaves a coherence-rate residual after ordinary electromagnetic, thermal, mechanical, and readout decoherence are accounted for.",
    whyItMatters:
      "It turns the proposed vacuum/manifold connection into a differential observable while keeping semiclassical mean stress, stochastic metric fluctuations, DP collapse, and quantum foam as distinct model classes.",
    subjects: [
      "casimir_dp_study",
      "semiclassical_gravity",
      "stochastic_gravity",
      "boundary_conditioned_coherence",
      "manifold_response",
    ],
    level: "model",
    status: "blocked",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["semiclassical_einstein", "stress_tensor_noise", "coherence_residual"],
    tags: ["stage_0", "hypothesis", "noncomputable", "decoherence_budget_required"],
    equations: [
      {
        id: "semiclassical_curvature_baseline",
        role: "noncomputable_reference",
        displayLatex:
          "G_{\\mu\\nu}+\\Lambda g_{\\mu\\nu}=\\frac{8\\pi G}{c^4}\\langle\\hat T_{\\mu\\nu}\\rangle_{\\rm ren}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["T_munu_ren", "Lambda", "metric", "renormalization_contract"],
        outputSymbols: ["metric_response"],
      },
      {
        id: "boundary_conditioned_coherence_residual",
        role: "noncomputable_reference",
        displayLatex:
          "\\Delta\\Gamma_{res}=\\Delta_b\\Gamma_{obs}-\\Delta\\Gamma_{EM}-\\Delta\\Gamma_{thermal}-\\Delta\\Gamma_{mech}-\\Delta\\Gamma_{readout}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Gamma_b1", "Gamma_b0", "standard_decoherence_budget"],
        outputSymbols: ["delta_Gamma_res"],
      },
      {
        id: "manifold_response_slot",
        role: "noncomputable_reference",
        displayLatex:
          "\\Delta\\Gamma_{MR}=\\mathcal{F}_{MR}[\\Delta_b\\langle\\hat T_{\\mu\\nu}\\rangle_{ren},N_{\\mu\\nu\\rho\\sigma},\\Delta\\rho;\\theta_{MR}]",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["delta_b_T_munu_ren", "noise_kernel", "delta_rho", "theta_MR"],
        outputSymbols: ["delta_Gamma_MR"],
      },
    ],
    units: [
      { symbol: "delta_Gamma_res", unit: "s^-1", quantity: "coherence_decay_rate_residual", dimensionSignature: "T^-1" },
      { symbol: "delta_Gamma_MR", unit: "s^-1", quantity: "candidate_manifold_response_rate", dimensionSignature: "T^-1" },
      { symbol: "T_munu_ren", unit: "J m^-3", quantity: "renormalized_stress_energy_component", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "Math maturity is Stage 0 exploratory and no tensor-to-metric-to-coherence functional is registered.",
      "A cavity boundary setting is not a DP material branch.",
      "A negative renormalized energy-density component does not uniquely determine curvature sign or geometry.",
      "Virtual particles are not treated as literal prepared branches with annihilation lifetimes.",
      "The material branch distribution and standard decoherence budget must be fixed before the target comparison.",
      "The four displayed nuisance terms are aggregate buckets: EM includes electrostatic, patch, and surface terms; thermal includes blackbody and residual-gas terms; readout includes optical readout and backaction. The proposal preserves the expanded terms and covariance.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "manifold-response-hypothesis", "Stage-0 hypothesis, direct-manipulation protocol, and non-claims."),
      sourceRef("literature_ref", "https://doi.org/10.12942/lrr-2008-3", "Hu-Verdaguer-2008", "Semiclassical mean stress and stochastic-gravity noise-kernel framework."),
      sourceRef("literature_ref", "https://doi.org/10.1007/BF02105068", "Penrose-1996", "Objective-reduction motivation; not a derivation of the proposed Casimir bridge."),
    ],
    hintKeys: {
      subjects: ["manifold response", "boundary conditioned coherence", "semiclassical gravity", "stochastic gravity", "vacuum collapse"],
      symbols: ["T_munu_ren", "delta_Gamma_res", "delta_Gamma_MR", "noise_kernel"],
      unitSignatures: ["T^-1", "M L^-1 T^-2"],
      repoPaths: ["docs/research/casimir-dp-quantum-foam-study.md"],
      equationFamilies: ["semiclassical_einstein", "stress_tensor_noise", "coherence_residual"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.decoherence_collapse_gate",
    title: "Phase, Visibility, Decoherence / Objective-Collapse Separation Gate",
    plainMeaning:
      "Keeps interferometric phase, visibility, coherence-decay rate, and objective-collapse attribution separate while ordinary open-system and gravitational-phase explanations remain viable.",
    whyItMatters:
      "Decoherence and objective collapse can both reduce interference, but they assert different dynamics and require discriminating evidence.",
    subjects: ["casimir_dp_study", "interferometric_phase", "visibility", "decoherence", "objective_collapse", "coherence_rate", "ambient_gravity_phase", "model_selection"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    equationFamilies: ["interference_readout", "phase_residual", "ordinary_gravity_phase", "coherence_residual", "collapse_model_selection"],
    tags: ["hard_gate", "fail_closed", "ordinary_decoherence_not_closed"],
    equations: [
      {
        id: "decoherence_collapse_identification_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Identify}(\\Delta\\Gamma_{res},\\Gamma_{collapse})=\\mathrm{BLOCKED}:\\mathrm{ordinary\\ decoherence\\ alternatives\\ remain}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["delta_Gamma_res", "standard_decoherence_receipts", "dynamics_discriminator"],
        outputSymbols: ["decoherence_collapse_gate_status"],
      },
      {
        id: "interferometric_phase_visibility_readout",
        role: "noncomputable_reference",
        displayLatex:
          "P_{\\pm}(b,t)=\\frac12\\left[1\\pm V_b(t)\\cos(\\Delta\\phi_b+\\chi)\\right]",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["V_b", "delta_phi_b", "chi"],
        outputSymbols: ["P_plus", "P_minus"],
      },
      {
        id: "boundary_conditioned_phase_residual",
        role: "noncomputable_reference",
        displayLatex:
          "\\Delta\\phi_{res}=\\Delta_b\\phi_{obs}-\\Delta\\phi_{QED}-\\Delta\\phi_{electric}-\\Delta\\phi_{thermal}-\\Delta\\phi_{mechanical}-\\Delta\\phi_{readout}-\\Delta\\phi_{gravity}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["delta_b_phi_obs", "ordinary_phase_budget"],
        outputSymbols: ["delta_phi_res"],
      },
      {
        id: "ambient_gravity_phase_control",
        role: "noncomputable_reference",
        displayLatex:
          "\\Delta\\phi_g=-\\frac{m}{\\hbar}\\int[\\Phi_A(t)-\\Phi_B(t)]dt",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["mass", "Phi_A", "Phi_B", "observation_time"],
        outputSymbols: ["delta_phi_g"],
      },
    ],
    units: [
      { symbol: "delta_Gamma_res", unit: "s^-1", quantity: "coherence_decay_rate_residual", dimensionSignature: "T^-1" },
      { symbol: "Gamma_collapse", unit: "s^-1", quantity: "objective_collapse_rate", dimensionSignature: "T^-1" },
      { symbol: "delta_phi_res", unit: "rad", quantity: "boundary_conditioned_phase_residual", dimensionSignature: "1" },
      { symbol: "delta_phi_g", unit: "rad", quantity: "ordinary_gravitational_phase", dimensionSignature: "1" },
      { symbol: "V_b", unit: "1", quantity: "interference_visibility", dimensionSignature: "1" },
    ],
    observables: [
      {
        id: "study_boundary_conditioned_coherence_residual",
        canonicalObservableId: "observable.coherence.boundary_conditioned_decay_residual",
        symbol: "delta_Gamma_res",
        quantity: "boundary_conditioned_coherence_decay_rate_after_standard_budget",
        mathematicalType: "scalar",
        unit: "s^-1",
        dimensionSignature: "T^-1",
        coordinateFrame: "apparatus_clock",
        operationalDefinitionRef: "manifold-response-hypothesis",
        responseModelRef: "manifold-response-hypothesis",
      },
      {
        id: "study_boundary_conditioned_phase_residual",
        canonicalObservableId: "observable.coherence.boundary_conditioned_phase_residual",
        symbol: "delta_phi_res",
        quantity: "boundary_conditioned_interferometric_phase_after_standard_budget",
        mathematicalType: "scalar",
        unit: "rad",
        dimensionSignature: "1",
        coordinateFrame: "apparatus_interferometer_phase",
        operationalDefinitionRef: "computeCasimirDpBoundaryPhase",
        responseModelRef: "computeCasimirDpBoundaryPhase",
      },
      {
        id: "study_objective_collapse_rate",
        canonicalObservableId: "observable.collapse.objective_rate",
        symbol: "Gamma_collapse",
        quantity: "registered_objective_collapse_model_rate",
        mathematicalType: "scalar",
        unit: "s^-1",
        dimensionSignature: "T^-1",
        coordinateFrame: "collapse_model_time",
        operationalDefinitionRef: "computeDpCollapse",
        responseModelRef: "computeDpCollapse",
      },
    ],
    assumptions: [
      "Reduced visibility alone does not identify nonunitary dynamics.",
      "A phase shift and visibility loss are distinct observables and neither identifies collapse alone.",
      "Ambient gravity is an ordinary unitary phase control, not the DP branch self-energy.",
      "All ordinary decoherence contributions and uncertainties must be pre-registered and receipt-backed.",
      "Correlation with a cavity boundary setting does not establish a gravitational cause.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "manifold-response-hypothesis", "Coherence residual and direct-manipulation protocol."),
      sourceRef("repo_module", "shared/casimir-dp-phase-coherence.ts", "computeCasimirDpBoundaryPhase", "Ordinary branch-action phase, four-quadrature interference, visibility, and ambient-gravity control."),
      sourceRef("doc", "docs/research/casimir-dp-or-phase-stage2-report.md", "casimir-dp-or-phase-stage2-v1", "Runnable phase/visibility and fail-closed evidence ledger."),
      sourceRef("repo_module", "shared/dp-collapse.ts", "computeDpCollapse", "Current DP model-rate authority."),
      sourceRef("literature_ref", "https://doi.org/10.1103/PhysRevLett.34.1472", "COW-1975", "Observed ordinary gravitationally induced quantum phase; not objective reduction."),
      sourceRef("literature_ref", "https://doi.org/10.1038/s41567-020-1008-4", "Donadi-et-al-2021", "Independent collapse-model constraint context."),
    ],
    hintKeys: {
      subjects: ["interferometric phase", "visibility", "ambient gravity phase", "decoherence versus collapse", "objective collapse", "coherence residual"],
      symbols: ["delta_phi_res", "delta_phi_g", "V_b", "delta_Gamma_res", "Gamma_collapse"],
      unitSignatures: ["1", "T^-1"],
      repoPaths: ["docs/research/casimir-dp-quantum-foam-study.md", "shared/casimir-dp-phase-coherence.ts", "shared/dp-collapse.ts"],
      equationFamilies: ["interference_readout", "phase_residual", "ordinary_gravity_phase", "coherence_residual", "collapse_model_selection"],
      simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.quantum_foam_hypothesis",
    title: "Quantum-Foam Casimir Residual Hypothesis",
    plainMeaning:
      "Reserves a bounded model slot for a future quantum-spacetime response function that predicts a Casimir observable residual.",
    whyItMatters:
      "It makes the speculative mechanism explicit and falsifiable instead of embedding quantum-foam language in the accepted Casimir baseline.",
    subjects: ["casimir_dp_study", "quantum_foam", "casimir_residual", "coherence_residual", "candidate_mechanism"],
    level: "model",
    status: "blocked",
    simulationOwners: ["casimir_dp_study"],
    equationFamilies: ["quantum_foam_response", "casimir_residual"],
    tags: ["hypothesis", "unregistered_response", "noncomputable", "falsifier_required"],
    equations: [
      {
        id: "quantum_foam_response_slot",
        role: "noncomputable_reference",
        displayLatex:
          "R_F^{foam}=\\mathcal{R}_{foam}(a,T,\\mathcal{G},\\mathcal{M};\\theta_{foam})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["a", "T", "geometry", "material", "theta_foam"],
        outputSymbols: ["R_F_foam"],
      },
    ],
    units: [
      { symbol: "R_F_foam", unit: "N", quantity: "candidate_force_residual", dimensionSignature: "M L T^-2" },
      { symbol: "a", unit: "m", quantity: "gap", dimensionSignature: "L" },
    ],
    assumptions: [
      "No quantitative response function is currently registered.",
      "The model must recover the standard Casimir baseline in a declared limiting domain.",
      "A nuisance model, error contract, and independent falsifier are required before fitting target residuals.",
      "Quantum foam is not treated as the accepted explanation of the Casimir effect.",
      "Vacuum-induced ordinary decoherence is not identified with objective collapse.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "lane-c", "Candidate-model requirements and non-claims."),
      sourceRef("literature_ref", "https://doi.org/10.1103/PhysRevD.72.021301", "Jaffe-2005", "Casimir force does not uniquely fix a vacuum ontology."),
      sourceRef("literature_ref", "https://arxiv.org/abs/0912.0535", "Christiansen-et-al-2009", "Example of separately testable spacetime-foam phenomenology and constraints."),
    ],
    hintKeys: {
      subjects: ["quantum foam", "spacetime foam", "casimir residual", "candidate mechanism"],
      symbols: ["R_F_foam", "theta_foam", "a", "T"],
      unitSignatures: ["M L T^-2", "L"],
      repoPaths: ["docs/research/casimir-dp-quantum-foam-study.md"],
      equationFamilies: ["quantum_foam_response", "casimir_residual"],
      simulationOwners: ["casimir_dp_study"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.observable_separation_gate",
    title: "Casimir-to-DP Observable Separation Gate",
    plainMeaning:
      "Keeps a Casimir force residual distinct from the DP gravitational self-energy built from mass-density branch differences.",
    whyItMatters:
      "It blocks the central category error: treating an overall Casimir force or energy as if it were the DP branch self-energy input.",
    subjects: [
      "casimir_dp_study",
      "observable_identity",
      "casimir_force_residual",
      "dp_self_energy",
      "missing_bridge",
    ],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["observable_identity", "casimir_residual", "dp_collapse"],
    tags: ["hard_gate", "missing_registered_observable_bridge", "fail_closed"],
    equations: [
      {
        id: "casimir_dp_bridge_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Bridge}(R_F,\\Delta E_G)=\\mathrm{BLOCKED}:\\mathrm{missing\\ registered\\ observable\\ bridge}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["R_F", "deltaE_G_J", "observable_bridge_receipt"],
        outputSymbols: ["observable_bridge_status"],
      },
    ],
    units: [
      { symbol: "R_F", unit: "N", quantity: "force_residual", dimensionSignature: "M L T^-2" },
      { symbol: "deltaE_G_J", unit: "J", quantity: "gravitational_self_energy_difference", dimensionSignature: "M L^2 T^-2" },
    ],
    observables: [
      {
        id: "study_casimir_force_residual",
        canonicalObservableId: "observable.casimir.force_residual",
        symbol: "R_F",
        quantity: "observed_minus_standard_casimir_force",
        mathematicalType: "scalar",
        unit: "N",
        dimensionSignature: "M L T^-2",
        coordinateFrame: "apparatus_force_axis",
        operationalDefinitionRef: "observable-separation-gate",
        responseModelRef: "casimir.cavity.parallel_plate_pressure",
      },
      {
        id: "study_dp_gravitational_self_energy",
        canonicalObservableId: "observable.dp.gravitational_self_energy_difference",
        symbol: "deltaE_G_J",
        quantity: "dp_gravitational_self_energy_from_mass_density_branch_difference",
        mathematicalType: "scalar",
        unit: "J",
        dimensionSignature: "M L^2 T^-2",
        coordinateFrame: "dp_branch_density_grid",
        operationalDefinitionRef: "computeDpCollapse",
        responseModelRef: "computeDpCollapse",
      },
    ],
    assumptions: [
      "The two observables have different canonical identities, dimensions, operational definitions, and response models.",
      "No registered transformation currently maps the Casimir residual to DP self-energy.",
      "Shared vocabulary, sign, or energy units elsewhere in the pipeline cannot satisfy this gate.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "observable-separation-gate", "Study gate and repair conditions."),
      sourceRef("repo_module", "shared/dp-collapse.ts", "computeDpCollapse", "DP input and solver authority."),
      sourceRef("repo_module", "shared/theory/casimir-cavity-theory-badges.ts", "casimir.cavity.parallel_plate_pressure", "Casimir scalar and receipt boundaries."),
      sourceRef("doc", "docs/architecture/theory-badge-graph-contract.md", "observable-identity", "Observable identity and bridge contract."),
    ],
    hintKeys: {
      subjects: ["casimir dp bridge", "observable separation", "casimir force residual", "dp self energy", "missing bridge"],
      symbols: ["R_F", "deltaE_G_J", "observable_bridge_status"],
      unitSignatures: ["M L T^-2", "M L^2 T^-2"],
      repoPaths: [
        "docs/research/casimir-dp-quantum-foam-study.md",
        "shared/dp-collapse.ts",
        "docs/architecture/theory-badge-graph-contract.md",
      ],
      equationFamilies: ["observable_identity", "casimir_residual", "dp_collapse"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.frequency_bridge_gate",
    title: "Compton / DP / Cavity Frequency Separation Gate",
    plainMeaning:
      "Separates the Compton rest-energy frequency, the DP inverse-timescale frequency, and a physical cavity mode until a sourced transfer kernel connects them to one apparatus observable.",
    whyItMatters:
      "It prevents E=mc^2=h nu and matching frequency units from being promoted into an unsupported collapse beat, manifold resonance, or quantum-foam spectral prediction.",
    subjects: [
      "casimir_dp_study",
      "compton_frequency",
      "dp_timescale",
      "cavity_frequency",
      "observable_transfer",
      "claim_boundary",
    ],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["compton_frequency", "dp_timescale", "frequency_bridge"],
    tags: ["hard_gate", "fail_closed", "missing_transfer_kernel", "no_resonance_claim"],
    equations: [
      {
        id: "compton_dp_frequency_identities",
        role: "noncomputable_reference",
        displayLatex:
          "\\nu_C=mc^2/h,\\quad\\nu_{DP}=\\Delta E_G/h=(2\\pi\\tau_{DP})^{-1},\\quad\\omega_{DP}=\\Delta E_G/\\hbar=\\tau_{DP}^{-1}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["mass", "deltaE_G_J", "tau_DP"],
        outputSymbols: ["nu_C", "nu_DP", "omega_DP"],
      },
      {
        id: "compton_dp_cavity_bridge_gate",
        role: "gate",
        displayLatex:
          "\\mathrm{Bridge}(\\nu_C,\\nu_{DP},\\omega_{cavity})=\\mathrm{BLOCKED}:\\mathcal K_{cavity\\rightarrow branch/coherence}\\ \\mathrm{not\\ registered}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["nu_C", "nu_DP", "omega_cavity", "transfer_kernel_receipt"],
        outputSymbols: ["frequency_bridge_status"],
      },
    ],
    units: [
      { symbol: "nu_C", unit: "Hz", quantity: "compton_rest_energy_frequency", dimensionSignature: "T^-1" },
      { symbol: "nu_DP", unit: "Hz", quantity: "dp_cyclic_inverse_timescale", dimensionSignature: "T^-1" },
      { symbol: "omega_DP", unit: "s^-1", quantity: "dp_angular_inverse_timescale", dimensionSignature: "T^-1" },
      { symbol: "omega_cavity", unit: "s^-1", quantity: "declared_cavity_angular_frequency", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "The Compton frequency is associated with total rest energy and is not a body-vibration observable by identity alone.",
      "The DP frequencies are derived from branch-dependent gravitational self-energy and do not imply a DP spectral line.",
      "Equal dimensions or numerical proximity cannot supply a dynamical coupling.",
      "A bridge requires a sourced kernel with declared field input, branch or coherence dynamics, differential output, validity limits, uncertainty model, and falsifier.",
      "The current transfer kernel is absent, so beat-frequency, manifold-ringing, and quantum-foam-resonance claims remain blocked.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "compton-frequency-non-bridge", "Canonical frequency identities, transfer-kernel requirements, and claim-audit baseline."),
      sourceRef("repo_module", "shared/dp-collapse.ts", "computeDpCollapse", "Branch-dependent DP self-energy and timescale authority."),
      sourceRef("literature_ref", "https://doi.org/10.1007/BF02105068", "Penrose-1996", "Objective-reduction motivation; not a cavity-resonance derivation."),
      sourceRef("literature_ref", "https://doi.org/10.1088/0264-9381/28/14/145017", "Wolf-et-al-2011", "Operational context for why a Compton-frequency interpretation requires a defined phase observable and readout."),
    ],
    hintKeys: {
      subjects: ["compton frequency", "DP frequency", "collapse beat frequency", "cavity resonance", "manifold ringing"],
      symbols: ["nu_C", "nu_DP", "omega_DP", "omega_cavity", "transfer_kernel_receipt"],
      unitSignatures: ["T^-1"],
      repoPaths: ["docs/research/casimir-dp-quantum-foam-study.md", "shared/dp-collapse.ts"],
      equationFamilies: ["compton_frequency", "dp_timescale", "frequency_bridge"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.experiment_design_campaign",
    title: "Boundary-Conditioned Coherence Experiment Design Campaign",
    plainMeaning:
      "Compares a Casimir calibration platform, an integrated levitated coherence platform, and a free-flight spatial-superposition benchmark under one ordered gate ledger.",
    whyItMatters:
      "It turns the proposed experiment into runnable signal, force-symmetry, decoherence, DP-proxy, and identifiability budgets without mistaking engineering readiness for physical evidence.",
    subjects: [
      "casimir_dp_study",
      "experiment_design",
      "boundary_conditioned_coherence",
      "levitated_nanoparticle",
      "nanomechanical_resonator",
      "matter_wave",
      "rate_budget",
    ],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["coherence_rate_budget", "dp_collapse", "experiment_design_screen"],
    tags: ["design_only", "role_separated", "hashed_receipt", "no_physics_winner"],
    equations: [
      {
        id: "casimir_dp_accessible_rate_ratio",
        role: "residual",
        displayLatex: "\\mathcal R_{access}=\\Gamma_{DP}/\\Gamma_{env}",
        computableExpression: "R_access = Gamma_DP/Gamma_env",
        operatorKind: "scalar_expression",
        inputSymbols: ["Gamma_DP", "Gamma_env"],
        outputSymbols: ["R_access"],
      },
    ],
    units: [
      { symbol: "Gamma_DP", unit: "s^-1", quantity: "dp_proxy_rate", dimensionSignature: "T^-1" },
      { symbol: "Gamma_env", unit: "s^-1", quantity: "ordinary_decoherence_rate", dimensionSignature: "T^-1" },
      { symbol: "R_access", unit: "1", quantity: "dp_to_environment_rate_ratio", dimensionSignature: "1" },
    ],
    assumptions: [
      "The engineering screening index is not a physics-evidence score or platform selection.",
      "Ideal parallel-plate Casimir values are reference rows, not finite-geometry apparatus predictions.",
      "Gaussian DP branches are diagnostic proxies, not measured material-density receipts.",
      "The integrated levitated row uses design-assumption decoherence rates and cannot support a collapse claim.",
      "No manifold-response rate is registered or computed.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-experiment-design-report.md", "boundary-coherence-platform-screen-v1", "Maintained role-separated diagnostic report."),
      sourceRef("artifact", "configs/research/casimir-dp-experiment-design.v1.json", "boundary-coherence-platform-screen-v1", "Frozen candidate inputs, evidence classes, thresholds, and run order."),
      sourceRef("repo_module", "scripts/research/run-casimir-dp-experiment-design.ts", "runCasimirDpExperimentDesign", "Deterministic signal, disturbance, coherence, and DP-proxy runner."),
      sourceRef("repo_module", "shared/contracts/casimir-dp-experiment-design.v1.ts", "casimir_dp_experiment_design/1", "Validated input and report contract."),
    ],
    hintKeys: {
      subjects: ["casimir dp experiment", "coherence platform", "levitated nanoparticle", "matter wave", "superconducting casimir"],
      symbols: ["Gamma_DP", "Gamma_env", "R_access"],
      unitSignatures: ["T^-1", "1"],
      repoPaths: [
        "docs/research/casimir-dp-experiment-design-report.md",
        "configs/research/casimir-dp-experiment-design.v1.json",
        "scripts/research/run-casimir-dp-experiment-design.ts",
        "shared/contracts/casimir-dp-experiment-design.v1.ts",
      ],
      equationFamilies: ["coherence_rate_budget", "dp_collapse", "experiment_design_screen"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.gated_computations_stage1",
    title: "Casimir-DP Gated Computations Stage 1",
    plainMeaning:
      "Runs a real Matsubara/reflection-coefficient calculation, evidence-bearing sidecar budgets, exact-grid rigid-sphere DP convergence, rate-only power analysis, a dynamics-signature gate, and a fail-closed manifold registration audit.",
    whyItMatters:
      "It replaces heuristic screening in the lanes where a reduced-order computation is defensible and quantifies why visibility-rate data alone are not an accessible or identifiable collapse test.",
    subjects: [
      "casimir_dp_study",
      "lifshitz_matsubara",
      "material_receipts",
      "decoherence_sidecars",
      "dp_grid_convergence",
      "statistical_power",
      "dynamics_identifiability",
      "manifold_registration",
    ],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "lifshitz_matsubara",
      "dp_collapse",
      "grid_convergence",
      "visibility_power",
      "dynamics_signature",
    ],
    tags: ["stage_1", "reduced_order", "exact_grid", "rate_only_inaccessible", "promotion_blocked"],
    equations: [
      {
        id: "casimir_dp_stage1_lifshitz_free_energy",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathcal F/A=(k_BT/2\\pi)\\sum_n{}'\\int k_\\perp dk_\\perp\\sum_p\\ln(1-r_p^{(1)}r_p^{(2)}e^{-2q_na})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["a", "T", "epsilon_1_i_xi", "epsilon_2_i_xi", "geometry"],
        outputSymbols: ["F_free_per_area", "P_lifshitz"],
      },
      {
        id: "casimir_dp_stage1_rate_power",
        role: "noncomputable_reference",
        displayLatex:
          "N_{setting}\\approx(z_{1-\\alpha/2}+z_{power})^2[(1-V_0^2)+(1-V_1^2)]/(V_0-V_1)^2",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["alpha", "power", "V_0", "V_1", "variance_inflation"],
        outputSymbols: ["N_setting"],
      },
      {
        id: "casimir_dp_stage1_manifold_registration_gate",
        role: "gate",
        displayLatex:
          "Register(\\Delta\\langle T_{\\mu\\nu}\\rangle,N_{\\mu\\nu\\rho\\sigma},G_{ret},\\mathcal L_{coh})=BLOCKED",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["renormalization", "noise_kernel", "causal_response", "coherence_dynamics"],
        outputSymbols: ["manifold_registration_status"],
      },
    ],
    units: [
      { symbol: "F_free_per_area", unit: "J m^-2", quantity: "lifshitz_free_energy_per_area", dimensionSignature: "M T^-2" },
      { symbol: "P_lifshitz", unit: "Pa", quantity: "lifshitz_pressure", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "N_setting", unit: "1", quantity: "shots_per_boundary_setting", dimensionSignature: "1" },
    ],
    assumptions: [
      "The Lifshitz solver is equilibrium, local, isotropic, nonmagnetic, and planar; PFA remains reference-only.",
      "The ideal validation and coarse DP convergence gates are numerical checks, not measured-material or branch-provenance gates.",
      "Current switching and decoherence sidecars are design assumptions with no raw measurement hashes.",
      "The visibility power calculation uses independent binomial samples and an exponential rate-only alternative.",
      "No collapse secondary-observable signature or manifold-response dynamics are registered.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-next-computations-report.md", "casimir-dp-gated-computations-stage1-v1", "Maintained Stage-1 gate report."),
      sourceRef("artifact", "configs/research/casimir-dp-next-computations.v1.json", "casimir-dp-gated-computations-stage1-v1", "Frozen numerical, sidecar, power, dynamics, and manifold inputs."),
      sourceRef("repo_module", "shared/casimir-lifshitz.ts", "computeLifshitzEquilibrium", "Reduced-order Matsubara/reflection-coefficient solver."),
      sourceRef("repo_module", "shared/casimir-dp-inference.ts", "estimateVisibilityRatePower", "Rate-only power and dynamics-signature diagnostics."),
      sourceRef("repo_module", "scripts/research/run-casimir-dp-next-computations.ts", "runCasimirDpNextComputations", "Ordered campaign runner and hashed receipt writer."),
      sourceRef("literature_ref", "https://doi.org/10.1103/RevModPhys.81.1827", "Klimchitskaya-et-al-2009", "Planar finite-temperature real-material Lifshitz formalism."),
      sourceRef("literature_ref", "https://doi.org/10.1103/PhysRevLett.134.061501", "Kryhin-Sudhir-2025", "Phase/correlation observables as dynamics discriminators."),
    ],
    hintKeys: {
      subjects: ["lifshitz solver", "dp convergence", "collapse power", "dynamics discriminator", "manifold registration"],
      symbols: ["F_free_per_area", "P_lifshitz", "N_setting", "manifold_registration_status"],
      unitSignatures: ["M T^-2", "M L^-1 T^-2", "1"],
      repoPaths: [
        "docs/research/casimir-dp-next-computations-report.md",
        "configs/research/casimir-dp-next-computations.v1.json",
        "shared/casimir-lifshitz.ts",
        "shared/casimir-dp-inference.ts",
        "scripts/research/run-casimir-dp-next-computations.ts",
      ],
      equationFamilies: ["lifshitz_matsubara", "dp_collapse", "grid_convergence", "visibility_power", "dynamics_signature"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.data_readiness_stage1",
    title: "Casimir-DP Data Readiness Stage 1",
    plainMeaning:
      "Validates the real-to-imaginary optical-response transform, artifact hashes, calibration and covariance gates, source-data access ledger, and a blinded secondary-observable power protocol without promoting synthetic fixtures to measurements.",
    whyItMatters:
      "It makes the next experimental acquisition reproducible while preserving the distinction between a runnable data path, authentic measured evidence, contamination discrimination, and objective-collapse identification.",
    subjects: [
      "casimir_dp_study",
      "kramers_kronig",
      "optical_response_receipts",
      "sidecar_integrity",
      "covariance",
      "blinded_protocol",
      "correlation_power",
      "data_access_ledger",
    ],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["kramers_kronig", "sidecar_covariance", "fisher_correlation_power"],
    tags: ["stage_1", "data_readiness", "synthetic_validation", "measured_evidence_open", "promotion_blocked"],
    equations: [
      {
        id: "casimir_dp_data_readiness_kramers_kronig",
        role: "noncomputable_reference",
        displayLatex:
          "\\epsilon(i\\xi)=1+(2/\\pi)\\int_0^\\infty \\omega\\epsilon''(\\omega)/(\\omega^2+\\xi^2)\\,d\\omega",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["omega", "epsilon_imag", "optical_covariance", "tail_models"],
        outputSymbols: ["epsilon_i_xi"],
      },
      {
        id: "casimir_dp_data_readiness_correlation_power",
        role: "noncomputable_reference",
        displayLatex:
          "N_{pair}=\\lceil3+[(z_{1-\\alpha/(2m)}+z_{power})/(atanh\\rho_1-atanh\\rho_0)]^2\\rceil",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["alpha", "multiplicity", "power", "rho_0", "rho_1"],
        outputSymbols: ["N_pair"],
      },
      {
        id: "casimir_dp_data_readiness_measured_gate",
        role: "gate",
        displayLatex:
          "G_{measured}=G_{hash}\\land G_{cal}\\land G_{cov}\\land G_{coverage}\\land G_{blinding}=NOT\\ READY",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["raw_hashes", "calibrations", "covariance", "spectral_coverage", "blind_state"],
        outputSymbols: ["measured_evidence_status"],
      },
    ],
    units: [
      { symbol: "omega", unit: "rad s^-1", quantity: "real_axis_angular_frequency", dimensionSignature: "T^-1" },
      { symbol: "epsilon_i_xi", unit: "1", quantity: "imaginary_axis_relative_permittivity", dimensionSignature: "1" },
      { symbol: "N_pair", unit: "1", quantity: "paired_acquisition_windows", dimensionSignature: "1" },
    ],
    assumptions: [
      "The Kramers-Kronig quadrature uses the supplied passive loss table; registered tails are audited but not silently extrapolated.",
      "The current Lorentz, switching, and decoherence artifacts are synthetic validation fixtures.",
      "Diagonal optical uncertainty propagation assumes independent loss samples unless a fuller covariance model is supplied.",
      "Fisher-z power assumes independent approximately bivariate-normal paired acquisition windows.",
      "Switch cross-correlation can diagnose contamination but cannot identify objective collapse by itself.",
      "No source-backed DP/Penrose secondary-observable signature or manifold-response dynamics is registered.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-data-readiness-report.md", "casimir-dp-data-readiness-stage1-v1", "Maintained data-readiness report."),
      sourceRef("artifact", "configs/research/casimir-dp-data-readiness.v1.json", "casimir-dp-data-readiness-stage1-v1", "Frozen artifacts, source ledger, blind protocol, and power cases."),
      sourceRef("repo_module", "shared/casimir-optical-response.ts", "convertLossTableToImaginaryAxis", "Kramers-Kronig transform and measured-material gates."),
      sourceRef("repo_module", "shared/casimir-dp-data-readiness.ts", "validateAcquisitionSidecar", "Hash, calibration, covariance, and correlation-power diagnostics."),
      sourceRef("repo_module", "scripts/research/run-casimir-dp-data-readiness.ts", "runCasimirDpDataReadiness", "Ordered runner and hashed report receipt."),
      sourceRef("artifact", "https://doi.org/10.5281/zenodo.17502163", "Pedalino-et-al-data", "Open external matter-wave data/code benchmark; not this apparatus's measurement."),
      sourceRef("literature_ref", "https://doi.org/10.1038/s41567-020-1008-4", "Donadi-et-al-2021", "DP exclusion context and source-data route."),
    ],
    hintKeys: {
      subjects: ["casimir dp data readiness", "kramers kronig", "sidecar covariance", "blinded coherence", "correlation power"],
      symbols: ["epsilon_i_xi", "N_pair", "measured_evidence_status"],
      unitSignatures: ["T^-1", "1"],
      repoPaths: [
        "docs/research/casimir-dp-data-readiness-report.md",
        "configs/research/casimir-dp-data-readiness.v1.json",
        "shared/casimir-optical-response.ts",
        "shared/casimir-dp-data-readiness.ts",
        "scripts/research/run-casimir-dp-data-readiness.ts",
      ],
      equationFamilies: ["kramers_kronig", "sidecar_covariance", "fisher_correlation_power"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.proposal_closure",
    title: "Casimir-DP Proposal Closure",
    plainMeaning:
      "Freezes the transverse-branch sample-and-hold apparatus, systematic-transfer matrix, commissioning dependency ladder, blinded power plan, and decision language needed to enter experimental commissioning without calling the apparatus or mechanism validated.",
    whyItMatters:
      "It converts open validation labels into explicit artifact-producing acceptance tests and corrects the earlier dependence on implausibly exact cancellation of normal surface forces.",
    subjects: [
      "casimir_dp_study",
      "experiment_proposal",
      "transverse_superposition",
      "sample_and_hold_boundary",
      "casimir_polder",
      "systematics_matrix",
      "commissioning",
      "blinding",
      "decision_table",
    ],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: ["phase_force_bound", "casimir_polder_reference", "proposal_gate_ledger"],
    tags: ["proposal_complete", "commissioning_conditional", "architecture_frozen", "hardware_not_validated", "promotion_blocked"],
    equations: [
      {
        id: "casimir_dp_proposal_phase_force_bound",
        role: "noncomputable_reference",
        displayLatex: "\\delta F_{max}=\\hbar\\delta\\phi_{max}/(\\Delta x\\,t)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["delta_phi_max", "branch_separation", "observation_time"],
        outputSymbols: ["delta_F_max"],
      },
      {
        id: "casimir_dp_proposal_cp_reference",
        role: "noncomputable_reference",
        displayLatex: "U_{CP}=-C_4/z^4,\\quad F_{CP}=-4C_4/z^5",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["C_4", "surface_distance"],
        outputSymbols: ["U_CP", "F_CP"],
      },
      {
        id: "casimir_dp_proposal_gate_ledger",
        role: "gate",
        displayLatex: "G_{proposal}=PASS,\\quad G_{commission}=CONDITIONAL,\\quad G_{measured}=NOT\\ READY",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["architecture", "systematics", "commissioning", "blinding", "decision_table"],
        outputSymbols: ["proposal_status", "commissioning_status", "measured_status"],
      },
    ],
    units: [
      { symbol: "delta_F_max", unit: "N", quantity: "maximum_differential_force_noise", dimensionSignature: "M L T^-2" },
      { symbol: "C_4", unit: "J m^4", quantity: "retarded_casimir_polder_coefficient", dimensionSignature: "M L^6 T^-2" },
      { symbol: "surface_distance", unit: "m", quantity: "particle_surface_distance", dimensionSignature: "L" },
      { symbol: "F_CP", unit: "N", quantity: "casimir_polder_force", dimensionSignature: "M L T^-2" },
    ],
    assumptions: [
      "The silica/silicon C4 value is a literature reference and not the gate-dependent 2D boundary contrast.",
      "The superposition separation is transverse to the surface normal so the normal force is common-mode only to first order.",
      "Boundary switching occurs between shots and is followed by a registered settling interval.",
      "Every systematic threshold is a commissioning target until a measured transfer-function receipt exists.",
      "Proposal completeness and software verification do not validate integrated hardware, collapse, or manifold dynamics.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-experiment-proposal.md", "casimir-dp-transverse-branch-pilot-v1", "Submission-ready bounded experiment proposal."),
      sourceRef("doc", "docs/research/casimir-dp-proposal-closure-report.md", "casimir-dp-transverse-branch-pilot-v1", "Runnable proposal-closure report."),
      sourceRef("artifact", "configs/research/casimir-dp-proposal-closure.v1.json", "casimir-dp-transverse-branch-pilot-v1", "Frozen apparatus, systematics, commissioning, model, and decision contracts."),
      sourceRef("repo_module", "shared/casimir-dp-proposal-readiness.ts", "evaluateCasimirDpProposalReadiness", "Proposal readiness, reference-scale, and gate evaluation."),
      sourceRef("repo_module", "scripts/research/run-casimir-dp-proposal-closure.ts", "runCasimirDpProposalClosure", "Ordered proposal runner and hashed receipt."),
      sourceRef("literature_ref", "https://doi.org/10.1038/s41565-024-01677-3", "Melo-et-al-2024", "On-chip high-vacuum levitation subsystem evidence."),
      sourceRef("literature_ref", "https://doi.org/10.1103/PhysRevA.98.053831", "Winstone-et-al-2018", "Near-surface electrostatic and Casimir-Polder reference evidence."),
      sourceRef("literature_ref", "https://doi.org/10.1103/y1q9-pnlc", "Seta-et-al-2026", "State-expansion displacement-noise evidence."),
    ],
    hintKeys: {
      subjects: ["casimir dp proposal", "transverse branch", "sample hold boundary", "commissioning", "phase force bound"],
      symbols: ["delta_F_max", "C_4", "F_CP", "proposal_status"],
      unitSignatures: ["M L T^-2", "M L^6 T^-2", "L"],
      repoPaths: [
        "docs/research/casimir-dp-experiment-proposal.md",
        "docs/research/casimir-dp-proposal-closure-report.md",
        "configs/research/casimir-dp-proposal-closure.v1.json",
        "shared/casimir-dp-proposal-readiness.ts",
        "scripts/research/run-casimir-dp-proposal-closure.ts",
      ],
      equationFamilies: ["phase_force_bound", "casimir_polder_reference", "proposal_gate_ledger"],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.penrose_or_branch_geometry_context",
    title: "Penrose OR Branch-Geometry and Notation Context",
    plainMeaning:
      "Connects Penrose's branch-dependent geometry motivation and order-of-magnitude OR timescale to the repository's explicitly regularized weak-field DP diagnostic without supplying a Casimir boundary coupling.",
    whyItMatters:
      "It states precisely why the experiment is OR-motivated while preventing branch-geometry language, Compton frequency, ambient gravity, gravitational waves, or Orch OR from being promoted into unsupported dynamics.",
    subjects: [
      "casimir_dp_study",
      "penrose_objective_reduction",
      "branch_dependent_geometry",
      "dp_self_energy",
      "or_notation",
      "orch_or_scope",
    ],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    equationFamilies: ["penrose_or_context", "branch_geometry", "dp_timescale"],
    tags: ["penrose_or", "notation_crosswalk", "weak_field_context", "non_biological", "no_casimir_coupling"],
    equations: [
      {
        id: "penrose_or_branch_geometry_state",
        role: "noncomputable_reference",
        displayLatex:
          "|\\Psi\\rangle\\sim\\alpha|\\rho_A,g^{(A)}_{\\mu\\nu}\\rangle+\\beta|\\rho_B,g^{(B)}_{\\mu\\nu}\\rangle",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["rho_A", "rho_B", "g_A_munu", "g_B_munu"],
        outputSymbols: ["penrose_or_branch_geometry_context"],
      },
      {
        id: "penrose_or_timescale_notation_context",
        role: "noncomputable_reference",
        displayLatex:
          "\\tau_{\\rm OR}\\sim\\hbar/E_G,\\quad E_\\Delta\\leftrightarrow E_G\\leftrightarrow\\Delta E_G^{\\rm repo}(\\ell)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["E_Delta", "E_G", "deltaE_G_repo", "ell"],
        outputSymbols: ["tau_OR_context", "or_notation_crosswalk"],
      },
    ],
    units: [
      { symbol: "E_G", unit: "J", quantity: "penrose_gravitational_instability_scale", dimensionSignature: "M L^2 T^-2" },
      { symbol: "deltaE_G_repo", unit: "J", quantity: "regularized_weak_field_dp_self_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "tau_OR_context", unit: "s", quantity: "objective_reduction_order_of_magnitude_timescale", dimensionSignature: "T" },
    ],
    assumptions: [
      "Branch-dependent geometries do not assert topologically distinct manifolds or a completed covariant quantum-gravity state.",
      "Penrose OR supplies motivation and a timescale conjecture, not Casimir boundary-response dynamics.",
      "The repository Delta E_G is grid-, branch-, and Plummer-regularization-dependent and is not numerically identified with every Penrose convention.",
      "A shared ambient gravitational field produces ordinary phase controls and is not the branch-relative DP self-energy.",
      "Gravitational-wave observations establish classical metric dynamics, not quantum superposed geometry or OR.",
      "The study is non-biological and does not validate Orch OR, microtubules, neuronal orchestration, anesthetic response, or consciousness.",
      "No Compton/cavity beat, manifold resonance, or collapse spectral line is predicted.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "penrose-or-motivation-notation-and-scope", "Canonical OR thesis, notation crosswalk, ambient-gravity control, and Orch OR scope."),
      sourceRef("doc", "docs/research/casimir-dp-or-phase-stage2-report.md", "casimir-dp-or-phase-stage2-v1", "Runnable DP algebra, phase/interference, fixed-branch null, and three-lane gate report."),
      sourceRef("repo_module", "shared/casimir-dp-or-phase-stage2.ts", "buildCasimirDpOrPhaseStage2Report", "Stage-2 categorical plausibility and claim-ceiling runtime."),
      sourceRef("literature_ref", "https://doi.org/10.1007/BF02105068", "Penrose-1996", "Branch-dependent spacetime and objective-reduction motivation."),
      sourceRef("literature_ref", "https://doi.org/10.1007/s10701-013-9770-0", "Penrose-2014", "E_G notation and tau approximately hbar over E_G context."),
      sourceRef("literature_ref", "https://doi.org/10.1016/j.plrev.2013.08.002", "Hameroff-Penrose-2014", "Primary Orch OR scope reference; not evidence for this experiment."),
    ],
    hintKeys: {
      subjects: ["Penrose OR", "objective reduction", "branch dependent geometry", "E Delta", "E G", "Orch OR scope"],
      symbols: ["E_Delta", "E_G", "deltaE_G_repo", "tau_OR_context", "g_A_munu", "g_B_munu"],
      unitSignatures: ["M L^2 T^-2", "T"],
      repoPaths: [
        "docs/research/casimir-dp-quantum-foam-study.md",
        "docs/research/casimir-dp-or-phase-stage2-report.md",
        "shared/casimir-dp-or-phase-stage2.ts",
        "shared/dp-collapse.ts",
      ],
      equationFamilies: ["penrose_or_context", "branch_geometry", "dp_timescale"],
      simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    },
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.complex_coherence_discriminator",
    title: "Stage-3 Complex-Coherence Discriminator",
    plainMeaning:
      "Reconstructs complex coherence, phase-conditioned visibility, path-swap sign, echo recovery, and decay-shape identifiability without relabeling unrecovered loss as collapse.",
    whyItMatters:
      "Complex coherence separates a reversible Hamiltonian phase and conditionable dephasing from an unresolved loss channel before any intrinsic model is compared.",
    status: "diagnostic",
    maturityTag: "stage_2_diagnostic",
    modulePath: "shared/casimir-dp-complex-coherence.ts",
    testPath: "tests/casimir-dp-complex-coherence.spec.ts",
    equationId: "casimir_dp_stage3_complex_coherence",
    displayLatex: "C_b(t)=V_b(t)e^{i\\phi_b(t)}",
    primaryObservableId: "observable.coherence.complex_boundary_cell",
    primaryObservableSymbol: "C_b",
    primaryObservableQuantity: "complex boundary-conditioned coherence",
    primaryObservableUnit: "1",
    primaryObservableDimension: "1",
    falsifier:
      "A purported irreducible loss that reverses under path swap or recovers under independent conditioning/echo is not intrinsic collapse.",
    blockedReason:
      "Only synthetic quadrature, echo, and hold-time fixtures are present; measured coherence sidecars are absent.",
    maximumClaim: "computational_phase_dephasing_echo_discrimination",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.qed_green_noise_budget",
    title: "Stage-3 Measurement-Constrained QED Green/Noise Budget",
    plainMeaning:
      "Propagates one material, geometry, Green-response, and PSD receipt into mean phase, force noise, heating, and ordinary decoherence.",
    whyItMatters:
      "The same apparatus model must explain both mean and fluctuation observables before a boundary-correlated residual can be assigned to an anomalous channel.",
    status: "diagnostic",
    maturityTag: "stage_1_reduced_order",
    modulePath: "shared/casimir-dp-qed-green-noise.ts",
    testPath: "tests/casimir-dp-qed-green-noise.spec.ts",
    equationId: "casimir_dp_stage3_qed_noise_exponent",
    displayLatex:
      "\\chi_b(t)=\\frac{1}{2\\hbar^2}\\int\\frac{d\\omega}{2\\pi}S_{\\Delta U,b}(\\omega)|Y_b(\\omega,t)|^2",
    primaryObservableId: "observable.qed.green_noise_budget",
    primaryObservableSymbol: "\\chi_{QED}",
    primaryObservableQuantity: "QED/open-system coherence exponent",
    primaryObservableUnit: "1",
    primaryObservableDimension: "1",
    falsifier:
      "A QED explanation fails its registered region when held-out phase/noise/heating cells exceed the propagated material and covariance envelope.",
    blockedReason:
      "The reduced-order fixture is synthetic; apparatus-matched material, Green-tensor, calibration, and noise receipts are absent.",
    maximumClaim: "conditional_qed_open_system_budget",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.dp_companion_signature",
    title: "Stage-3 Named DP Companion Signature",
    plainMeaning:
      "Keeps Penrose's lifetime envelope separate from one named regularized dynamical-DP implementation whose coherence and applicable companion channels share one parameter manifest.",
    whyItMatters:
      "A companion observable can disfavor a named dynamics even when a coherence timescale remains numerically compatible with the Penrose heuristic.",
    status: "diagnostic",
    maturityTag: "stage_0_dependency_ceiling",
    modulePath: "shared/casimir-dp-dp-companion.ts",
    testPath: "tests/casimir-dp-dp-companion.spec.ts",
    equationId: "casimir_dp_stage3_dp_companion",
    displayLatex: "\\Gamma_{OR}=E_G/\\hbar",
    primaryObservableId: "observable.dp.named_companion_signature",
    primaryObservableSymbol: "\\Gamma_{DP}",
    primaryObservableQuantity: "named DP coherence and companion signature",
    primaryObservableUnit: "s^-1",
    primaryObservableDimension: "T^-1",
    falsifier:
      "A powered missing heating, diffusion, or radiation companion disfavors only the frozen named variant and parameter set.",
    blockedReason:
      "The DP dependency remains exploratory and no measured coherence or companion-observable sidecar is present.",
    maximumClaim: "named_model_constraint_or_rejection",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.casimir_gravity_upper_bound",
    title: "Stage-3 Complete-Apparatus Casimir Gravity Bound",
    plainMeaning:
      "Converts a signed complete-apparatus state-energy ledger into mass, weight, and ordinary weak-field phase bounds without substituting plate pressure for gravitational weight.",
    whyItMatters:
      "It separates ordinary mass-energy coupling from objective reduction and exposes when a tensor or conservation claim lacks a complete source.",
    status: "diagnostic",
    maturityTag: "stage_1_reduced_order",
    modulePath: "shared/casimir-dp-gravity-upper-bound.ts",
    testPath: "tests/casimir-dp-gravity-upper-bound.spec.ts",
    equationId: "casimir_dp_stage3_gravity_upper_bound",
    displayLatex: "\\Delta m_{app}=\\Delta E_{app}/c^2",
    primaryObservableId:
      "observable.gravity.complete_apparatus_energy_difference",
    primaryObservableSymbol: "\\Delta E_{app}",
    primaryObservableQuantity: "complete-apparatus state-energy difference",
    primaryObservableUnit: "J",
    primaryObservableDimension: "M L^2 T^-2",
    falsifier:
      "A claimed tensor response fails closed when the source ledger is incomplete or its stress-energy conservation residual exceeds tolerance.",
    blockedReason:
      "Only a synthetic scalar ledger is closed; a measured complete tensor source and gravitational response are absent.",
    maximumClaim: "scalar_gravitational_upper_bound",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.blinded_model_comparison",
    title: "Stage-3 Blinded Joint Model Comparison",
    plainMeaning:
      "Compares a composite ordinary-physics null with named nested DP and only preregistered bridge extensions over held-out coherence and companion cells.",
    whyItMatters:
      "Joint prediction, power, identifiability, and a custodian boundary keep one residual from becoming an automatic collapse or ontology verdict.",
    status: "diagnostic",
    maturityTag: "stage_2_diagnostic",
    modulePath: "shared/casimir-dp-model-comparison.ts",
    testPath: "tests/casimir-dp-model-comparison.spec.ts",
    equationId: "casimir_dp_stage3_composite_null",
    displayLatex:
      "M_0=M_{QED\\ phase}+M_{technical}+M_{environment}+M_{ordinary\\ GR}",
    primaryObservableId: "observable.inference.blinded_joint_model_state",
    primaryObservableSymbol: "M_0",
    primaryObservableQuantity: "blinded held-out joint model state",
    primaryObservableUnit: null,
    primaryObservableDimension: null,
    falsifier:
      "A model is disfavored only by its frozen held-out criterion within a demonstrated powered and identifiable parameter region.",
    blockedReason:
      "Synthetic cells validate the comparison contract; measured confirmatory cells and a custodian unblinding receipt are absent.",
    maximumClaim: "specified_model_comparison",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.manifold_kernel_registry",
    title: "Stage-3 Manifold-Kernel Registry Gate",
    plainMeaning:
      "Validates whether a proposed tensor/noise-to-metric-to-coherence bridge has every causal, gauge, dimensional, conservation, positivity, recovery, provenance, and falsifier field.",
    whyItMatters:
      "The registry prevents scalar negative energy, plate pressure, or a frequency coincidence from masquerading as an executable manifold dynamics.",
    status: "blocked",
    maturityTag: "stage_2_validator_stage_0_candidate",
    modulePath: "shared/casimir-dp-manifold-kernel-registry.ts",
    testPath: "tests/casimir-dp-manifold-kernel-registry.spec.ts",
    equationId: "casimir_dp_stage3_manifold_registry_gate",
    displayLatex:
      "registered\\iff T_{\\mu\\nu}^{ren}\\land N_{\\mu\\nu\\alpha\\beta}\\land G^{ret}\\land \\mathcal{D}_{coh}\\land falsifiers",
    primaryObservableId: "observable.manifold.kernel_registry_status",
    primaryObservableSymbol: "R_{kernel}",
    primaryObservableQuantity: "manifold-kernel registry status",
    primaryObservableUnit: null,
    primaryObservableDimension: null,
    falsifier:
      "The deterministic first missing or invalid field blocks every bridge phase or rate; a rejected version remains immutable.",
    blockedReason:
      "No complete preregistered Casimir-to-coherence kernel exists.",
    maximumClaim: "schema_and_consistency_completeness_only",
  }),
  stage3StudyBadge({
    id: "study.casimir_dp.evidence_map_stage3",
    title: "Casimir-DP Stage-3 Evidence Map",
    plainMeaning:
      "Runs the six Stage-3 diagnostics in immutable authority order and maps every outcome to what it establishes, disfavors, and cannot establish.",
    whyItMatters:
      "It makes model-specific falsification runnable while retaining measured-evidence, collapse, manifold, and physical-viability gates.",
    status: "diagnostic",
    maturityTag: "stage_2_diagnostic_per_lane_ceiling",
    modulePath: "shared/casimir-dp-evidence-map-stage3.ts",
    testPath: "tests/casimir-dp-evidence-map-stage3.spec.ts",
    equationId: "casimir_dp_stage3_claim_ceiling",
    displayLatex: "claim_{Stage3}\\leq diagnostic",
    primaryObservableId: "observable.study.stage3_evidence_map",
    primaryObservableSymbol: "claim_{Stage3}",
    primaryObservableQuantity: "Stage-3 outcome-to-claim state",
    primaryObservableUnit: null,
    primaryObservableDimension: null,
    falsifier:
      "Any hash, blind, power, identifiability, model-registration, or evidence-class failure forces the affected lane to not_ready or blocked.",
    blockedReason:
      "The synthetic campaign cannot close measured, collapse, or manifold gates.",
    maximumClaim: "diagnostic_evidence_map",
  }),
  stage4StudyBadge({
    id: "study.casimir_dp.polarization_resolved_qed_control",
    title: "Stage-4 Polarization-Resolved Macroscopic-QED Control",
    plainMeaning:
      "Represents the two transverse photon polarizations with Jones/Stokes states, propagates reciprocal or nonreciprocal reflection response, and evaluates basis invariance, mirror parity, matched controls, and helicity double contrasts.",
    whyItMatters:
      "Circular polarization is an ordinary electromagnetic control axis whose material and geometry response must close before any polarization-correlated coherence residual is called anomalous.",
    status: "diagnostic",
    maturityTag: "stage_1_reduced_order",
    modulePath: "shared/casimir-dp-polarization-qed-control.ts",
    testPath: "tests/casimir-dp-polarization-qed-control.spec.ts",
    equationId: "casimir_dp_stage4_polarization_double_contrast",
    displayLatex:
      "\\Delta_{h,m}X=\\frac12[(X_{+,R}-X_{+,L})-(X_{-,R}-X_{-,L})]",
    primaryObservableId:
      "observable.qed.polarization_mirror_double_contrast",
    primaryObservableSymbol: "\\Delta_{h,m}X",
    primaryObservableQuantity:
      "polarization and mirror double contrast",
    primaryObservableUnit: "varies",
    primaryObservableDimension: null,
    falsifier:
      "Basis dependence, unmatched branch state, wrong mirror parity, or failure to follow the calibrated material response rejects an intrinsic interpretation.",
    blockedReason:
      "The current fixture is synthetic and the reduced-order transfer coefficients are not apparatus-matched finite-geometry Green-tensor receipts.",
    maximumClaim: "synthetic_polarization_qed_control",
    extraSourceRefs: [
      sourceRef(
        "literature_ref",
        "https://arxiv.org/abs/0908.2649",
        "Rahi-et-al-2009",
        "Scattering formulation for material and geometry dependent Casimir interactions.",
      ),
      sourceRef(
        "literature_ref",
        "https://arxiv.org/abs/1707.04577",
        "Fuchs-et-al-2017",
        "Polarization-mixing reflection matrices in macroscopic QED.",
      ),
    ],
  }),
  stage4StudyBadge({
    id: "study.casimir_dp.thermal_radiative_closure",
    title: "Stage-4 Planck/FDT Thermal-Radiative Closure",
    plainMeaning:
      "Checks omega/nu normalization, Planck occupation, Stefan-Boltzmann recovery, near- versus far-field routing, detailed balance, thermal recoil, heating, noise, decoherence, and their covariance.",
    whyItMatters:
      "Blackbody and near-field thermal channels are ordinary decoherence controls and must not be double counted with zero-point or parent-QED terms.",
    status: "diagnostic",
    maturityTag: "stage_0_exploratory_reduced_order",
    modulePath: "shared/casimir-dp-radiative-thermal-closure.ts",
    testPath: "tests/casimir-dp-radiative-thermal-closure.spec.ts",
    equationId: "casimir_dp_stage4_planck_stefan_boltzmann_closure",
    displayLatex:
      "\\sigma=\\frac{\\pi^2k_B^4}{60\\hbar^3c^2},\\quad P_{net}=\\epsilon_{eff}AF\\sigma(T_s^4-T_e^4)",
    primaryObservableId:
      "observable.thermal.net_radiative_power_and_covariance",
    primaryObservableSymbol: "P_{net}",
    primaryObservableQuantity:
      "net radiative power with thermal covariance",
    primaryObservableUnit: "W",
    primaryObservableDimension: "M L^2 T^-3",
    falsifier:
      "Failure of Planck-to-Stefan-Boltzmann recovery, detailed balance, entropy sign, receipt integrity, or exclusive near/far-field routing blocks the thermal prediction.",
    blockedReason:
      "The synthetic greybody lane is not apparatus thermometry, emissivity, or Green/FDT evidence.",
    maximumClaim: "synthetic_thermal_radiative_control",
    extraSourceRefs: [
      sourceRef(
        "literature_ref",
        "https://physics.nist.gov/cuu/pdf/RevModPhys.93.025010.pdf",
        "CODATA-2018",
        "Exact SI radiation constants and Stefan-Boltzmann relation.",
      ),
      sourceRef(
        "literature_ref",
        "https://arxiv.org/abs/0902.3586",
        "Scheel-Buhmann-2008",
        "Macroscopic-QED Green and fluctuation-dissipation framework.",
      ),
    ],
  }),
  stage4StudyBadge({
    id: "study.casimir_dp.tensor_dimensional_congruence",
    title: "Stage-4 Tensor, Dimensional, and Semantic Congruence Gate",
    plainMeaning:
      "Validates units, semantic quantity identity, tensor rank and symmetry, frame/basis/gauge maps, spectral Jacobians, receipts, conservation, FDT, covariance, and recovery limits.",
    whyItMatters:
      "It allows variables to remain consistently represented without treating equal dimensions as a physical coupling or replacing a tensor source with a scalar.",
    status: "diagnostic",
    maturityTag: "stage_2_diagnostic_validator",
    modulePath: "shared/casimir-dp-tensor-dimensional-congruence.ts",
    testPath: "tests/casimir-dp-tensor-dimensional-congruence.spec.ts",
    equationId: "casimir_dp_stage4_frequency_semantic_nonbridge",
    displayLatex:
      "[\\omega_C]=[E_G/\\hbar]=[\\omega_{cav}]=T^{-1}\\;\\not\\Rightarrow\\;K_{transfer}",
    primaryObservableId:
      "observable.study.tensor_dimensional_semantic_congruence",
    primaryObservableSymbol: "G_{congruence}",
    primaryObservableQuantity:
      "tensor, dimensional, and semantic congruence gate",
    primaryObservableUnit: null,
    primaryObservableDimension: null,
    falsifier:
      "The deterministic first unit, semantic, tensor, frame, spectral, conservation, positivity, receipt, or recovery error blocks the affected chain.",
    blockedReason:
      "The QED chain is congruent, but the manifold bridge remains schema-level and has no registered numerical output.",
    maximumClaim: "synthetic_congruence_validation",
  }),
  stage4StudyBadge({
    id: "study.casimir_dp.polarization_congruence_stage4",
    title: "Casimir-DP Polarization and Congruence Stage-4 Campaign",
    plainMeaning:
      "Hash-links immutable Stage 3, expands the ordinary-physics null with polarization-QED and thermal/FDT controls, reuses the named DP manifest unchanged, and admits only registered numerical bridge kernels.",
    whyItMatters:
      "It creates a runnable prediction playground and model-specific falsifier map while preserving measured, collapse, manifold, and viability gates.",
    status: "diagnostic",
    maturityTag: "stage_2_diagnostic_per_lane_ceiling",
    modulePath: "shared/casimir-dp-polarization-congruence-stage4.ts",
    testPath: "tests/casimir-dp-polarization-congruence-stage4.spec.ts",
    equationId: "casimir_dp_stage4_expanded_ordinary_null",
    displayLatex:
      "M'_0=M_0+M_{polarization\\ QED}+M_{thermal/FDT}",
    primaryObservableId:
      "observable.study.stage4_polarization_congruence_state",
    primaryObservableSymbol: "M'_0",
    primaryObservableQuantity:
      "Stage-4 expanded-null prediction and claim state",
    primaryObservableUnit: null,
    primaryObservableDimension: null,
    falsifier:
      "Any upstream hash, convention, runtime, blinding, fixed-branch, model-version, or evidence-class failure forces the affected lane to not_ready or blocked.",
    blockedReason:
      "All current inputs are synthetic. Reserved blind labels are contract-test labels only: no custodian receipt or mapping has been created, measured comparison and unblinding are unauthorized, ordinary-physics measured closure is absent, and no numerical bridge is registered.",
    maximumClaim: "diagnostic_prediction_campaign",
  }),
  studyBadge({
    id: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    title: "Stage-4.1 QED Scale-Hierarchy Calibration",
    plainMeaning:
      "Replays the CODATA 2022 electron Compton, Rydberg, Bohr-radius, and classical-electron-radius identities with explicit uncertainty, covariance, reduced-mass, and rounding conventions.",
    whyItMatters:
      "It calibrates the ordinary QED hierarchy without treating a shared frequency or length scale as a Casimir, Diósi-Penrose, collapse, manifold, resonance, or polarization transfer law.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_1",
      "qed_scale_hierarchy",
      "codata_2022",
      "compton_frequency",
      "rydberg_scale",
      "semantic_nonbridge",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "qed_scale_hierarchy",
      "compton_frequency",
      "rydberg_energy",
      "atomic_length_scales",
    ],
    tags: [
      "stage_4_1",
      "stage_1_reduced_order",
      "source_backed_calculation",
      "codata_2022",
      "same_dimension_not_connected",
      "promotion_blocked",
      "maximum_claim:qed_scale_identity_calibration",
    ],
    equations: [
      {
        id: "casimir_dp_qed_scale_hierarchy_stage4_1",
        role: "gate",
        displayLatex:
          "\\nu_C=\\frac{m_ec^2}{h},\\quad \\nu_R^{(\\infty)}=\\frac{\\alpha_{fs}^2}{2}\\nu_C,\\quad \\bar\\lambda_C=\\alpha_{fs}a_0,\\quad r_e=\\alpha_{fs}^2a_0",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "h",
          "c",
          "m_e",
          "alpha_fs",
          "codata_covariance",
          "reduced_mass_ledger",
        ],
        outputSymbols: ["G_QED_4_1", "qed_scale_identity_status"],
      },
    ],
    units: [
      {
        symbol: "G_QED_4_1",
        unit: null,
        quantity: "source_backed_qed_scale_identity_calibration_gate",
        dimensionSignature: null,
      },
    ],
    assumptions: [
      "Maximum permitted claim: qed_scale_identity_calibration.",
      "The identities are a source-backed reduced-order calibration wrapped in a diagnostic gate; they are not independent confirmations because the CODATA quantities share inputs and covariance.",
      "The fine-structure constant is namespaced as alpha_fs and cannot be substituted for a polarizability tensor, a fit coefficient, or any unrelated alpha.",
      "The hydrogen reduced-mass result is a leading-order scale with an explicit correction ledger, not a precision spectroscopy prediction.",
      "Stage 4 remains immutable upstream evidence and retains same_dimension_not_connected for Compton, DP, and cavity frequencies.",
      "No cavity-mode, Casimir, DP, collapse, manifold, resonance, polarization, or transfer-kernel variable is admitted by this calibration.",
      "Measured evidence, apparatus closure, collapse identification, manifold dynamics, and physical viability remain not ready, blocked, or not evaluated.",
      "This badge is non-promotable and has no calculator payload or observable bridge.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-qed-scale-hierarchy-calibration.ts",
        "casimir_dp_qed_scale_hierarchy_stage4_1",
        "Strict source-backed Stage-4.1 calibration runtime.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-qed-scale-hierarchy-calibration.spec.ts",
        "casimir_dp_qed_scale_hierarchy_stage4_1",
        "Focused identity, uncertainty, namespace, and fail-closed tests.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json",
        "casimir-dp-qed-scale-hierarchy-stage4-1-v1",
        "Frozen Stage-4.1 authorities, CODATA fixture, run order, and claim policy.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md",
        "casimir-dp-qed-scale-hierarchy-stage4-1-v1",
        "Maintained source-backed calibration report and nonclaim ledger.",
      ),
      sourceRef(
        "artifact",
        "configs/constants/codata-2022.v1.json",
        "codata-2022",
        "Namespaced constant values, standard uncertainties, provenance, and dependency metadata.",
      ),
    ],
    observables: [
      {
        id: "study.casimir_dp.qed_scale_hierarchy_stage4_1.calibration_gate",
        canonicalObservableId:
          "observable.study.qed_scale_identity_calibration_gate",
        symbol: "G_QED_4_1",
        quantity: "source_backed_qed_scale_identity_calibration_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "not_applicable_scalar_identity_space",
        operationalDefinitionRef:
          "docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md",
        responseModelRef:
          "shared/casimir-dp-qed-scale-hierarchy-calibration.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.1",
        "QED scale hierarchy",
        "Compton Rydberg congruence",
        "CODATA 2022 calibration",
        "semantic nonbridge",
      ],
      symbols: [
        "G_QED_4_1",
        "nu_C",
        "nu_R",
        "alpha_fs",
        "lambda_bar_C",
        "a_0",
        "r_e",
      ],
      unitSignatures: ["1", "T^-1", "L"],
      repoPaths: [
        "shared/casimir-dp-qed-scale-hierarchy-calibration.ts",
        "tests/casimir-dp-qed-scale-hierarchy-calibration.spec.ts",
        "configs/research/casimir-dp-qed-scale-hierarchy-stage4-1.v1.json",
        "configs/constants/codata-2022.v1.json",
        "docs/research/casimir-dp-qed-scale-hierarchy-stage4-1-report.md",
      ],
      equationFamilies: [
        "qed_scale_hierarchy",
        "compton_frequency",
        "rydberg_energy",
        "atomic_length_scales",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    title: "Stage-4.2A Electron-Mass and Higgs-Yukawa Anchor",
    plainMeaning:
      "Replays a theory-assisted Penning-trap electron-mass determination, keeps CODATA conversions correlated, and maps the same rest-energy parameter into the conditional Standard Model tree-level Yukawa convention.",
    whyItMatters:
      "It gives the downstream DP experiment a traceable mass parameter and unit contract while explicitly preventing mass, Higgs, Compton, or shared-energy notation from becoming evidence for collapse.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2a",
      "electron_mass_metrology",
      "higgs_yukawa_tree_anchor",
      "cross_scale_calibration",
      "semantic_nonbridge",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    equationFamilies: [
      "electron_mass_metrology",
      "standard_model_yukawa_tree_relation",
      "compton_frequency",
      "cross_scale_dependency_ladder",
    ],
    tags: [
      "stage_4_2a",
      "diagnostic",
      "source_backed_replay",
      "correlated_calibration",
      "same_dimension_not_connected",
      "promotion_blocked",
      "maximum_claim:electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only",
    ],
    equations: [
      {
        id: "casimir_dp_electron_mass_higgs_anchor_stage4_2a",
        role: "gate",
        displayLatex:
          "m_ec^2=\\frac{y_e^{\\mathrm{tree}}v_F}{\\sqrt2},\\quad v_F=(\\sqrt2G_F)^{-1/2},\\quad g_{hee}^{\\mathrm{tree}}=\\frac{y_e^{\\mathrm{tree}}}{\\sqrt2}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "A_r_e",
          "m_e_OS_kg",
          "E_e_OS_J",
          "v_F_tree_GeV",
          "penning_covariance",
          "source_dependency_dag",
        ],
        outputSymbols: [
          "G_MH_4_2A",
          "y_e_lagrangian_tree",
          "g_h_e_e_tree",
        ],
      },
    ],
    units: [
      {
        symbol: "G_MH_4_2A",
        unit: null,
        quantity:
          "electron_mass_metrology_and_conditional_tree_mapping_gate",
        dimensionSignature: null,
      },
    ],
    assumptions: [
      "Maximum permitted claim: electron_mass_metrology_replay_and_conditional_sm_tree_mapping_only.",
      "The Penning result is a bound-electron frequency-ratio and QED-assisted inference, not static weighing.",
      "The kg, joule, MeV, Compton-frequency, and Rydberg forms reuse one electron-mass ancestor and are not independent confirmations.",
      "The inferred tree-level electron Yukawa is reconstructed from the mass and v_F; it is not a direct electron-Higgs observation and does not explain the Yukawa hierarchy.",
      "The CMS H to electron-pair result remains an upper limit, and precision running-Yukawa matching remains blocked until a scheme, scale, tadpole convention, and matching kernel are supplied.",
      "The formal v_F to zero limit is a domain-exit recovery test, not an apparatus control.",
      "The cross-scale ladder calibrates parameters and dimensions only; it supplies no Casimir, DP, collapse, manifold, cosmological, or quantum-foam transfer law.",
      "Measured coherence evidence, collapse identification, manifold dynamics, cosmological lift, and physical viability remain not ready, blocked, or not evaluated.",
      "This badge is non-promotable and has no calculator payload or observable bridge.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts",
        "casimir_dp_electron_mass_higgs_anchor_stage4_2a",
        "Strict source-backed metrology, unit, covariance, Yukawa, collider, and nonbridge runtime.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-electron-mass-higgs-anchor-stage4-2a.spec.ts",
        "casimir_dp_electron_mass_higgs_anchor_stage4_2a",
        "Focused replay, covariance, unit, tree-mapping, upper-bound, and fail-closed tests.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a.v1.json",
        "casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1",
        "Frozen Stage-4.2A authorities, fixtures, run order, and claim policy.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
        "casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1",
        "Maintained cross-scale calibration report and nonclaim ledger.",
      ),
    ],
    observables: [
      {
        id:
          "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a.calibration_gate",
        canonicalObservableId:
          "observable.study.electron_mass_higgs_anchor_calibration_gate",
        symbol: "G_MH_4_2A",
        quantity:
          "electron_mass_metrology_and_conditional_tree_mapping_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "not_applicable_parameter_calibration_space",
        operationalDefinitionRef:
          "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
        responseModelRef:
          "shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2A",
        "electron mass metrology",
        "Higgs Yukawa anchor",
        "Penning trap replay",
        "mass energy frequency ladder",
      ],
      symbols: [
        "G_MH_4_2A",
        "A_r_e",
        "m_e_OS_kg",
        "E_e_OS_J",
        "v_F_tree_GeV",
        "y_e_lagrangian_tree",
        "g_h_e_e_tree",
      ],
      unitSignatures: ["1", "M", "M L^2 T^-2", "T^-1"],
      repoPaths: [
        "shared/casimir-dp-electron-mass-higgs-anchor-stage4-2a.ts",
        "tests/casimir-dp-electron-mass-higgs-anchor-stage4-2a.spec.ts",
        "configs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a.v1.json",
        "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
      ],
      equationFamilies: [
        "electron_mass_metrology",
        "standard_model_yukawa_tree_relation",
        "compton_frequency",
        "cross_scale_dependency_ladder",
      ],
      simulationOwners: ["casimir_dp_study", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.planck_solar_calibration_stage4_2a",
    title: "Stage-4.2A Planck and Solar Radiometric Calibration",
    plainMeaning:
      "Closes the Planck spectral-density Jacobians and Stefan-Boltzmann integral, then keeps a TSIS spectrum-derived solar color temperature separate from the IAU luminosity-radius bolometric effective temperature.",
    whyItMatters:
      "It demonstrates cross-scale energy-frequency bookkeeping on a macroscopic radiometric benchmark without treating a solar-temperature match or shared Planck constant as collapse evidence.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2a",
      "planck_spectrum",
      "stefan_boltzmann",
      "solar_color_temperature",
      "solar_effective_temperature",
      "semantic_nonbridge",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "solar"],
    equationFamilies: [
      "planck_spectral_radiance",
      "stefan_boltzmann_integral",
      "wien_color_temperature",
      "solar_effective_temperature",
    ],
    tags: [
      "stage_4_2a",
      "diagnostic",
      "source_backed_radiometric_calibration",
      "coarse_wien_peak_not_full_fit",
      "temperature_semantics_separated",
      "same_dimension_not_connected",
      "promotion_blocked",
      "maximum_claim:source_backed_radiometric_calibration_only",
    ],
    equations: [
      {
        id: "casimir_dp_planck_solar_calibration_stage4_2a",
        role: "gate",
        displayLatex:
          "B_\\lambda(T)=\\frac{2hc^2}{\\lambda^5}\\frac{1}{e^{hc/(\\lambda k_BT)}-1},\\quad T_{\\mathrm{color}}=\\frac{b}{\\lambda_{\\max}},\\quad T_{\\mathrm{eff}}=\\left(\\frac{L}{4\\pi R^2\\sigma}\\right)^{1/4}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "h",
          "c",
          "k_B",
          "TSIS_HSRS_lambda",
          "TSIS_HSRS_E_lambda",
          "L_sun_nominal",
          "R_sun_nominal",
        ],
        outputSymbols: [
          "G_PS_4_2A",
          "T_color_TSIS",
          "T_eff_IAU",
        ],
      },
    ],
    units: [
      {
        symbol: "G_PS_4_2A",
        unit: null,
        quantity: "planck_solar_radiometric_calibration_gate",
        dimensionSignature: null,
      },
      {
        symbol: "T_color_TSIS",
        unit: "K",
        quantity: "band_and_model_dependent_solar_color_temperature",
        dimensionSignature: "Theta",
      },
      {
        symbol: "T_eff_IAU",
        unit: "K",
        quantity: "flux_equivalent_solar_effective_temperature",
        dimensionSignature: "Theta",
      },
      {
        symbol: "B_lambda",
        unit: "W m^-2 sr^-1 m^-1",
        quantity: "spectral_radiance_per_wavelength",
        dimensionSignature: "M L^-1 T^-3",
      },
      {
        symbol: "B_nu",
        unit: "W m^-2 sr^-1 Hz^-1",
        quantity: "spectral_radiance_per_cyclic_frequency",
        dimensionSignature: "M T^-2",
      },
      {
        symbol: "B_omega",
        unit: "W m^-2 sr^-1 per_rad_s",
        quantity: "spectral_radiance_per_angular_frequency",
        dimensionSignature: "M T^-2",
      },
      {
        symbol: "sigma_SB",
        unit: "W m^-2 K^-4",
        quantity: "stefan_boltzmann_constant",
        dimensionSignature: "M T^-3 Theta^-4",
      },
    ],
    assumptions: [
      "Maximum permitted claim: source_backed_radiometric_calibration_only.",
      "Planck integration and the Stefan-Boltzmann constant belong to one analytic identity family and are not independent theories.",
      "The TSIS spectrum-derived result is a coarse frozen-grid Wien-peak color diagnostic, not a full spectral fit or a unique temperature of the solar photosphere.",
      "The IAU nominal effective temperature is a flux-equivalent luminosity-radius conversion and is distinct from color and wavelength-dependent brightness temperatures.",
      "The source-backed spectral snapshot lacks the complete cross-wavelength covariance required for an independent measured-fit significance claim.",
      "Shared h, c, k_B, energy, frequency, or inverse-time dimensions calibrate notation only and do not connect thermal radiation to DP.",
      "No near-field, Casimir, cavity, collapse, manifold, cosmological, or transfer-kernel output is admitted.",
      "This badge is non-promotable and has no calculator payload or observable bridge.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-planck-solar-calibration-stage4-2a.ts",
        "casimir_dp_planck_solar_calibration_stage4_2a",
        "Strict spectral-density, Planck-integral, solar-temperature-semantics, and nonbridge runtime.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-planck-solar-calibration-stage4-2a.spec.ts",
        "casimir_dp_planck_solar_calibration_stage4_2a",
        "Focused Jacobian, integral, temperature-semantics, geometry, provenance, and fail-closed tests.",
      ),
      sourceRef(
        "artifact",
        "configs/research/fixtures/casimir-dp-planck-solar-calibration.source-backed.v1.json",
        "casimir-dp-planck-solar-calibration-stage4-2a-v1",
        "Frozen IAU and TSIS source-backed radiometric fixture.",
      ),
      sourceRef(
        "artifact",
        "configs/research/source-snapshots/tsis1-hsrs-20260725-480-800nm.csv",
        "casimir-dp-planck-solar-calibration-stage4-2a-v1",
        "Content-addressed TSIS-1 HSRS rows used by the coarse frozen-window Wien diagnostic.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
        "casimir-dp-electron-mass-higgs-anchor-stage4-2a-v1",
        "Combined Stage-4.2A cross-scale calibration report.",
      ),
    ],
    observables: [
      {
        id:
          "study.casimir_dp.planck_solar_calibration_stage4_2a.calibration_gate",
        canonicalObservableId:
          "observable.study.planck_solar_radiometric_calibration_gate",
        symbol: "G_PS_4_2A",
        quantity: "planck_solar_radiometric_calibration_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "not_applicable_radiometric_calibration_space",
        operationalDefinitionRef:
          "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
        responseModelRef:
          "shared/casimir-dp-planck-solar-calibration-stage4-2a.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2A radiometry",
        "Planck spectrum",
        "Stefan Boltzmann",
        "solar color temperature",
        "solar effective temperature",
      ],
      symbols: [
        "G_PS_4_2A",
        "B_lambda",
        "T_color_TSIS",
        "T_eff_IAU",
        "sigma",
      ],
      unitSignatures: ["1", "Theta", "M T^-3", "M T^-3 Theta^-4"],
      repoPaths: [
        "shared/casimir-dp-planck-solar-calibration-stage4-2a.ts",
        "tests/casimir-dp-planck-solar-calibration-stage4-2a.spec.ts",
        "configs/research/fixtures/casimir-dp-planck-solar-calibration.source-backed.v1.json",
        "docs/research/casimir-dp-electron-mass-higgs-anchor-stage4-2a-report.md",
      ],
      equationFamilies: [
        "planck_spectral_radiance",
        "stefan_boltzmann_integral",
        "wien_color_temperature",
        "solar_effective_temperature",
      ],
      simulationOwners: ["casimir_dp_study", "solar"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    title: "Stage-4.2B Apparatus Coherence Residual Forecast",
    plainMeaning:
      "Transports the frozen apparatus and complete branch-density ledger into response-corrected ordinary-decoherence, named Diósi-Penrose, complex-residual, covariance, identifiability, power, and acquisition forecasts; the coupled v1 run reaches a signature-identifiability no-go.",
    whyItMatters:
      "It requires the proposed experiment to fail closed in one observable space. The current runtime does not estimate DP power or exclusion because the frozen intercept and thermal signatures remain too collinear.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2b",
      "apparatus_coherence_residual",
      "response_corrected_spectral_thermometry",
      "sensor_self_noise",
      "full_cross_spectral_covariance",
      "dp_scaling_forecast",
      "identifiability_and_power",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "apparatus_scale_transport",
      "response_corrected_spectral_thermometry",
      "sensor_forward_noise_covariance",
      "regularized_dp_self_energy_scaling",
      "complex_coherence_residual",
      "signature_identifiability_power",
    ],
    tags: [
      "stage_4_2b",
      "diagnostic",
      "synthetic_only_v1",
      "synthetic_validation",
      "measured_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "promotion_blocked",
      "zero_observable_bridge",
      "runtime_g_campaign_pass",
      "runtime_f_signature_not_identifiable",
      "current_no_go_not_dp_exclusion",
      "maximum_synthetic_claim:apparatus_residual_and_frozen_dp_signature_software_recovery_only",
      "maximum_source_backed_claim:apparatus_power_and_identifiability_forecast_only",
    ],
    equations: [
      {
        id: "casimir_dp_apparatus_coherence_residual_stage4_2b",
        role: "gate",
        displayLatex:
          "\\Gamma_{\\mathrm{DP}}=\\frac{E_G[\\Delta\\rho;r_0]}{\\hbar},\\quad \\mathbf r=\\mathbf y-\\boldsymbol\\mu_0,\\quad \\Sigma_r=\\Sigma_{yy}+J\\Sigma_{xx}J^{\\mathsf T}-\\Sigma_{yx}J^{\\mathsf T}-J\\Sigma_{xy}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "object_and_joint_branch_density_receipts",
          "apparatus_spectral_response",
          "sensor_forward_model",
          "ordinary_prediction_vector",
          "frozen_dp_prediction_vector",
          "full_residual_covariance",
          "pilot_freeze_receipt",
          "held_out_cell_order",
        ],
        outputSymbols: [
          "G_ACR_4_2B",
          "apparatus_go_no_go",
          "powered_parameter_regions",
          "required_paired_windows",
        ],
      },
    ],
    units: [
      {
        symbol: "G_ACR_4_2B",
        unit: null,
        quantity: "apparatus_coherence_residual_forecast_gate",
        dimensionSignature: null,
      },
    ],
    assumptions: [
      "Maximum synthetic claim: apparatus_residual_and_frozen_dp_signature_software_recovery_only.",
      "Maximum source-backed claim: apparatus_power_and_identifiability_forecast_only.",
      "Stage-4.2B v1 accepts synthetic_fixture evidence only; measured ingestion requires a new versioned campaign and evidence class.",
      "Parameter transport is not evidence transport: complete object mass and branch density are design-class inputs until measured-preparation receipts exist.",
      "Ordinary, frozen-DP, and separately registered bridge hypotheses remain separate and are scored in one pilot-frozen complex-coherence and full-covariance space.",
      "The conditional boundary null applies only to the registered nonrelativistic Markovian mass-density DP generator under complete joint-system equivalence of branch densities, smearing, trajectories, and parameters.",
      "The analytic DP identity, numerical null-recovery error, and experimental equivalence uncertainty are separate outputs.",
      "The boundary identity is not a theorem about Penrose OR, relativistic collapse, colored, dissipative, or non-Markovian DP, or a branch-dependent cavity modifier.",
      "No confirmatory label, nuisance parameter, covariance regularization, DP amplitude, r0 value, row order, or exclusion rule may be learned after the pilot freeze.",
      "The authoritative coupled campaign may return powered_parameter_region_available, apparatus_not_powered_for_dp, or signature_not_identifiable; neither no-go outcome falsifies DP.",
      "The immutable v1 coupled run passes Runtimes A-E and blocks Runtime F as signature_not_identifiable: rank 7, maximum absolute whitened cosine 0.9999771044199663 for intercept versus thermal, and normalized Gram condition number 179103.91134865975.",
      "The 30 frozen control rows currently identify axes and levels but do not admit source-backed numeric control-response vectors and a block-bound covariance, so acquisition power and a DP exclusion are not estimable from this run.",
      "Fresh adapter run 2325 passes the repo-convergence software gate with no first failure, no deltas, certificate integrity OK, and scientific scope none.",
      "Measured evidence remains not_ready; collapse identification and manifold dynamics remain blocked; physical viability remains not_evaluated.",
      "This badge is non-promotable, has no calculator payload, and creates no observable bridge.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts",
        "casimir_dp_apparatus_scale_transport_stage4_2b",
        "Object, composition, complete-joint-system branch-density, hierarchy, and equivalence ledger.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts",
        "casimir_dp_apparatus_spectral_thermometry_stage4_2b",
        "Response-corrected detector and nonblackbody spectral-thermometry runtime.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts",
        "casimir_dp_apparatus_response_covariance_stage4_2b",
        "Sensor-self-noise separation and full cross-spectral/shared-calibration covariance runtime.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts",
        "casimir_dp_dp_scaling_forecast_stage4_2b",
        "Frozen named regularized DP scaling, convergence, companion, and conditional-null runtime.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
        "casimir_dp_apparatus_coherence_residual_stage4_2b",
        "Pilot-frozen raw-complex or coverage-qualified log-visibility residual comparator.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-identifiability-stage4-2b.ts",
        "casimir_dp_apparatus_identifiability_stage4_2b",
        "Nuisance-profiled identifiability, coverage, power, bounded-region, and go/no-go runtime.",
      ),
      sourceRef(
        "repo_module",
        "scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
        "casimir_dp_apparatus_coherence_residual_stage4_2b_runtime_g",
        "Runtime-G authority, coupling adapters, immutable artifact writer, fixture executor, and claim ledger.",
      ),
      sourceRef(
        "repo_module",
        "shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts",
        "casimir_dp_apparatus_coherence_residual_stage4_2b_contract",
        "Strict 22-stage, 28-authority, 19-fixture campaign contract.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json",
        "casimir-dp-apparatus-coherence-residual-stage4-2b-v1",
        "Frozen evidence policy, named DP manifest, thresholds, software, and run order.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-stage4-2b-authorities.v1.json",
        "dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35",
        "Stage-4.2B immutable upstream authority-role and hash manifest.",
      ),
      sourceRef(
        "artifact",
        "configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json",
        "ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c",
        "Frozen 19-case synthetic recovery and fail-closed fixture matrix.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json",
        "2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67",
        "Immutable coupled Runtime-G JSON report; campaign PASS with Runtime-F signature-identifiability no-go.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.md",
        "e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe",
        "Immutable human-readable coupled Runtime-G report.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-trace.jsonl",
        "727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7",
        "Immutable 42-record Runtime-G execution trace with no measured-evidence promotion.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-receipt.json",
        "50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c",
        "Immutable campaign receipt binding inputs, authorities, coupling adapters, outputs, fixtures, and the pending external-verification state.",
      ),
      sourceRef(
        "artifact",
        "artifacts/training-trace-stage4-2b-20260726T130100867Z-bound-validated.jsonl",
        "3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd",
        "Fresh fail-closed one-record adapter trace for run 2325; PASS, no first failure, no deltas, certificate integrity OK.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json",
        "194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d",
        "Downstream verification receipt binding the campaign, 509-test replay, build, math, root, WARP, explicit adapter request, validated trace, and certificate scope.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md",
        "casimir_dp_apparatus_coherence_residual_stage4_2b_plan",
        "Implementation plan and claim-boundary contract; it is not runtime evidence.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2b-contract.spec.ts",
        "casimir_dp_apparatus_coherence_residual_stage4_2b_contract_test",
        "Strict schema, exact run-order, authority, fixture-order, and fail-closed contract tests.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2b-campaign.spec.ts",
        "casimir_dp_apparatus_coherence_residual_stage4_2b_campaign_test",
        "Coupled value/hash lineage, partition-template, 19-fixture, no-go, and immutable-output tests.",
      ),
    ],
    observables: [
      {
        id:
          "study.casimir_dp.apparatus_coherence_residual_stage4_2b.forecast_gate",
        canonicalObservableId:
          "observable.study.apparatus_coherence_residual_forecast_gate",
        symbol: "G_ACR_4_2B",
        quantity: "apparatus_coherence_residual_forecast_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "not_applicable_forecast_decision_space",
        operationalDefinitionRef:
          "shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts",
        responseModelRef:
          "shared/casimir-dp-apparatus-identifiability-stage4-2b.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2B",
        "apparatus coherence residual",
        "DP scaling forecast",
        "sensor self noise",
        "full covariance",
        "identifiability power",
        "apparatus no go",
      ],
      symbols: [
        "G_ACR_4_2B",
        "E_G",
        "Gamma_DP",
        "Delta_rho",
        "Sigma_r",
        "Q_M",
      ],
      unitSignatures: ["1", "M", "L", "T", "T^-1", "M L^2 T^-2"],
      repoPaths: [
        "shared/casimir-dp-apparatus-scale-transport-stage4-2b.ts",
        "shared/casimir-dp-apparatus-spectral-thermometry-stage4-2b.ts",
        "shared/casimir-dp-apparatus-response-covariance-stage4-2b.ts",
        "shared/casimir-dp-dp-scaling-forecast-stage4-2b.ts",
        "shared/casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
        "shared/casimir-dp-apparatus-identifiability-stage4-2b.ts",
        "scripts/research/run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
        "shared/contracts/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.ts",
        "configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json",
        "configs/research/casimir-dp-stage4-2b-authorities.v1.json",
        "configs/research/fixtures/casimir-dp-stage4-2b-campaign.synthetic.v1.json",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.json",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-report.md",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-trace.jsonl",
        "artifacts/research/casimir-dp-apparatus-coherence-residual-stage4-2b/casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z/apparatus-coherence-residual-stage4-2b-receipt.json",
        "artifacts/training-trace-stage4-2b-20260726T130100867Z-bound-validated.jsonl",
        "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json",
        "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-plan.md",
        "tests/casimir-dp-stage4-2b-contract.spec.ts",
        "tests/casimir-dp-stage4-2b-campaign.spec.ts",
      ],
      equationFamilies: [
        "apparatus_scale_transport",
        "spectral_thermometry_forward_model",
        "sensor_self_noise_forward_model",
        "ordinary_coherence_exponent",
        "residual_covariance",
        "joint_complex_residual",
        "frozen_dp_scaling",
        "identifiability_power_gate",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.identifiability_redesign_stage4_2c",
    title: "Stage-4.2C Identifiability-First Apparatus Redesign",
    plainMeaning:
      "Recovers the certified Stage-4.2B apparatus no-go, adds numerical design-assumption response and block-covariance authority for the 30 frozen controls, transports a bounded candidate catalogue through the unchanged registered Diósi-Penrose generator, and identifies one synthetic powered region while keeping physical pilot readiness open.",
    whyItMatters:
      "It closes the software design question without converting a forecast into an experiment. The selected candidate separates the registered signatures and supplies an acquisition budget, but authentic response, covariance, and state-preparation receipts are still absent.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2c",
      "identifiability_first_redesign",
      "numeric_control_response",
      "block_covariance",
      "bounded_apparatus_search",
      "dp_candidate_transport",
      "blinded_acquisition_packets",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "complex_control_response",
      "block_covariance_whitening",
      "registered_dp_candidate_transport",
      "signature_identifiability_power",
      "blinded_acquisition_freeze",
    ],
    tags: [
      "stage_4_2c",
      "diagnostic",
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
      "promotion_blocked",
      "zero_observable_bridge",
      "maximum_claim:bounded_synthetic_apparatus_redesign_and_empirical_input_readiness_only",
    ],
    equations: [
      {
        id: "casimir_dp_identifiability_redesign_stage4_2c",
        role: "gate",
        displayLatex:
          "\\widetilde{\\mathbf s}_j=L^{-1}\\frac{\\partial\\boldsymbol\\mu}{\\partial\\theta_j},\\quad LL^{\\mathsf T}=C,\\quad \\Gamma_{\\rm DP}=\\frac{E_G[\\Delta\\rho;r_0]}{\\hbar},\\quad G_{4.2C}=G_{\\cos}\\land G_{\\kappa}\\land G_{\\rm power}\\land G_{\\alpha}\\land G_{\\rm companion}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "stage4_2b_immutable_report",
          "numeric_control_axis_values",
          "raw_complex_control_response",
          "block_covariance",
          "registered_dp_parameter_manifest",
          "bounded_candidate_catalogue",
          "pilot_freeze_receipt",
        ],
        outputSymbols: [
          "G_IR_4_2C",
          "selected_candidate_id",
          "required_paired_windows",
          "physical_pilot_readiness",
        ],
      },
    ],
    units: [
      {
        symbol: "G_IR_4_2C",
        unit: null,
        quantity: "identifiability_first_redesign_gate",
        dimensionSignature: null,
      },
    ],
    assumptions: [
      "Maximum claim: bounded_synthetic_apparatus_redesign_and_empirical_input_readiness_only.",
      "The authoritative run is casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z and accepts synthetic_fixture evidence only.",
      "Stage-4.2B report, receipt, trace, configuration, fixture, and downstream verification receipt are immutable content-addressed upstream authorities.",
      "The 30 numerical control responses and their covariance are design assumptions; measured control-response and covariance authority remain not_ready.",
      "The control response vectors derive from frozen physical axis values and covariance whitening; manually substituted orthogonal proxy vectors are forbidden.",
      "Sensor self-noise contributes to covariance and dark-channel accounting but is not a physical decoherence signature.",
      "Every candidate is transported through the unchanged registered Gaussian-regularized nondissipative DP generator; no fitted amplitude, r0 retuning, or confirmatory-data tuning is admitted.",
      "The candidate catalogue is bounded before scoring. The mass-scale-80 candidate is rejected even though it is more powerful because it exceeds the frozen mass bound.",
      "The diamond candidate is rejected because its material-response authority is contextual_not_admitted.",
      "The selected synthetic candidate silica_high_mass_identifiable has maximum absolute whitened cosine 0.7177243227022941, normalized Gram condition 6.531693613125537, forecast power 0.9978580863455258, and 542 required paired windows.",
      "The selected candidate remains a design-assumption superposition; no authentic state-preparation receipt exists.",
      "Calibration and pilot may fit response and covariance. Confirmatory and independent-replication packets are blinded and forbid response, covariance, candidate, DP, or exclusion refitting.",
      "Compton, Higgs/Yukawa, QED-scale, and blackbody relations remain calibration or dimensional authorities and do not act as collapse-transfer kernels.",
      "The ordinary null, frozen mass-density DP forecast, and a separately registered boundary-conditioned bridge remain distinct; no bridge kernel is admitted.",
      "Physical pilot readiness and measured evidence remain not_ready; collapse identification and manifold dynamics remain blocked; physical viability remains not_evaluated.",
      "Fresh adapter run 2332 passes with no first failure or deltas, certificate integrity OK, and scientific scope none; it certifies the supplied repository gates rather than the apparatus or DP.",
      "This badge is non-promotable, has no calculator payload, and creates no observable bridge.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-control-response-stage4-2c.ts",
        "casimir_dp_control_response_stage4_2c",
        "Runtime H numerical complex-control response, block covariance, shared-calibration ancestry, sensor-noise separation, and whitening receipt.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-apparatus-redesign-stage4-2c.ts",
        "casimir_dp_apparatus_redesign_stage4_2c",
        "Runtimes I/J bounded candidate admission, registered-DP transport, identifiability, power, and deterministic design selection.",
      ),
      sourceRef(
        "repo_module",
        "shared/casimir-dp-acquisition-packets-stage4-2c.ts",
        "casimir_dp_acquisition_packets_stage4_2c",
        "Runtime L calibration, pilot, confirmatory, independent-replication, freeze, and custody packet compiler.",
      ),
      sourceRef(
        "repo_module",
        "scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts",
        "casimir_dp_identifiability_redesign_stage4_2c_runtime_m",
        "Runtime M authority validator, candidate orchestrator, adversarial fixture executor, report, trace, and receipt writer.",
      ),
      sourceRef(
        "repo_module",
        "shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1.ts",
        "casimir_dp_identifiability_redesign_stage4_2c_contract",
        "Strict 18-stage, 16-fixture, bounded-search, non-bridge, packet, and scientific-status contract.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json",
        "81f6109525202f57b6e5958373b37ec18d15dfff0ddc9ad0af274b8a294af6aa",
        "Frozen control authority, candidate catalogue, thresholds, hypothesis policy, packet policy, and run order.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-stage4-2c-authorities.v1.json",
        "7f3a7fb7bfc748b1e92427da0c649bb73ce99fd4ebf9a20414a5a7fa1b5604e7",
        "Stage-4.2C immutable Stage-4.2B authority-role and content-hash manifest.",
      ),
      sourceRef(
        "artifact",
        "configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json",
        "f576c20c05cee3d29ed0198bfc4056a0540a3f89199d1babb6ebde9dfaa1d45d",
        "Frozen 16-case recovery and fail-closed fixture matrix.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/identifiability-redesign-stage4-2c-report.json",
        "d9237eeb9079e7fab84a86b3eda28b0f14bb83be1a340b3d6f9695dcffb5047c",
        "Immutable Stage-4.2C JSON report with one bounded powered synthetic region and physical pilot readiness not_ready.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/identifiability-redesign-stage4-2c-report.md",
        "0f01cb550fed502fe8d5fa3920f4517d7931a89761cdb7a68af1b7d901b55f5f",
        "Immutable human-readable Stage-4.2C report.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/identifiability-redesign-stage4-2c-trace.jsonl",
        "3ceeaddbdb0e8a78f1038bd3227f8b0ddbac4ac0af24ca7c37a6b026e5fe2b81",
        "Immutable authority, control, candidate, selection, fixture, and scientific-status trace.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-identifiability-redesign-stage4-2c/casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z/identifiability-redesign-stage4-2c-receipt.json",
        "59cca7ab7f6f6a3d27a83ad8b455fc63fc6db3ca7207cdeff350ed97d497865c",
        "Campaign receipt binding the config, authority manifest, fixture, immutable reports, trace, selection, and pending downstream-verification state.",
      ),
      sourceRef(
        "artifact",
        "artifacts/training-trace-stage4-2c-20260728T045623510Z-bound-validated.jsonl",
        "3d454ba0cf3e778dc934cae1c0ee33996bb792caa06255a9dfe984a38138bdee",
        "Fresh validated one-record Stage-4.2C Casimir adapter trace for run 2332.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-identifiability-redesign-stage4-2c-verification-receipt.json",
        "51c461db1fdaa29162b2c5287a31c01823e5bb23b16a25fe2914841239abba98",
        "Downstream receipt binding the receipt-grade replay, explicit verifier request, validated trace, PASS verdict, certificate hash, and integrity status.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-identifiability-redesign-stage4-2c-report.md",
        "0f01cb550fed502fe8d5fa3920f4517d7931a89761cdb7a68af1b7d901b55f5f",
        "Maintained report identical to the immutable campaign Markdown.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-identifiability-redesign-stage4-2c-plan.md",
        "casimir_dp_identifiability_redesign_stage4_2c_plan",
        "Implementation, hypothesis, runtime, run-order, claim-map, and completion contract.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2c-contract.spec.ts",
        "casimir_dp_identifiability_redesign_stage4_2c_contract_test",
        "Strict contract, authority-hash, threshold, non-bridge, and status tests.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2c-campaign.spec.ts",
        "casimir_dp_identifiability_redesign_stage4_2c_campaign_test",
        "Runtime H-M, determinism, 16-fixture, selection, and scientific-status tests.",
      ),
    ],
    observables: [
      {
        id:
          "study.casimir_dp.identifiability_redesign_stage4_2c.design_gate",
        canonicalObservableId:
          "observable.study.identifiability_first_redesign_gate",
        symbol: "G_IR_4_2C",
        quantity: "identifiability_first_redesign_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "not_applicable_design_decision_space",
        operationalDefinitionRef:
          "shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1.ts",
        responseModelRef:
          "shared/casimir-dp-apparatus-redesign-stage4-2c.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2C",
        "identifiability first redesign",
        "numeric control response",
        "block covariance",
        "bounded powered region",
        "blinded acquisition packets",
        "physical pilot not ready",
      ],
      symbols: [
        "G_IR_4_2C",
        "s_tilde",
        "L",
        "C",
        "E_G",
        "Gamma_DP",
        "power",
      ],
      unitSignatures: ["1", "M", "L", "T", "T^-1", "M L^2 T^-2"],
      repoPaths: [
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
      ],
      equationFamilies: [
        "complex_control_response",
        "block_covariance_whitening",
        "registered_dp_candidate_transport",
        "signature_identifiability_power",
        "blinded_acquisition_freeze",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    title: "Stage-4.2D Cross-Scale Recovery and Spectroscopic Field Metrology",
    plainMeaning:
      "Runs source-bounded Stark, Zeeman, circular-polarization, and blackbody dynamic-Stark calibration projections alongside Schwarzschild compactness, material-strength crossover, and Jeans pressure-support recovery checks, while leaving the frozen mass-density DP generator unchanged.",
    whyItMatters:
      "It makes the presentation congruent without treating repeated constants or shared energy-frequency notation as independent evidence for collapse. Sourced apparatus transfers, conventional recovery checks, representation changes, and the frozen DP hypothesis are kept in separate machine-checkable classes.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2d",
      "stark_metrology",
      "zeeman_metrology",
      "blackbody_dynamic_stark",
      "spinor_nonbridge",
      "schwarzschild_compactness",
      "potato_radius",
      "jeans_instability",
      "equation_congruence",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "spectroscopic_field_metrology",
      "classical_gravity_recovery",
      "spinor_representation_nonbridge",
      "cross_scale_equation_congruence",
    ],
    tags: [
      "stage_4_2d",
      "diagnostic",
      "synthetic_only_v1",
      "source_bounded",
      "spectroscopic_response_not_ready",
      "physical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "promotion_blocked",
      "zero_observable_bridge",
      "fresh_adapter_verifier_pass_integrity_ok",
      "maximum_claim:spectroscopic_field_metrology_and_classical_gravity_recovery_only",
    ],
    equations: [
      {
        id: "casimir_dp_stage4_2d_spectroscopic_field_metrology",
        role: "transform",
        displayLatex:
          "\\Delta\\nu_Z=\\frac{g_Jm_J\\mu_BB}{h},\\quad \\Delta\\nu_S=-\\frac12\\alpha_\\nu E^2,\\quad \\Delta\\nu_{\\rm BBR}=k_{\\rm BBR}(T^4-T_{\\rm ref}^4)",
        computableExpression: null,
        operatorKind: "scalar_expression",
        inputSymbols: [
          "transition_response_authority",
          "B",
          "E",
          "T",
          "field_covariance",
        ],
        outputSymbols: [
          "spectroscopic_response_vector",
          "spectroscopic_covariance",
          "response_to_complex_coherence_transfer",
        ],
      },
      {
        id: "casimir_dp_stage4_2d_classical_gravity_recovery",
        role: "transform",
        displayLatex:
          "\\mathcal C=\\frac{2GM}{Rc^2},\\quad R_{\\rm yield}=\\sqrt{\\frac{\\sigma_y}{k_{\\rm geom}G\\rho^2}},\\quad \\lambda_J=c_s\\sqrt{\\frac{\\pi}{G\\rho}}",
        computableExpression: null,
        operatorKind: "scalar_expression",
        inputSymbols: [
          "G",
          "c",
          "mass",
          "radius",
          "density",
          "yield_strength",
          "sound_speed",
        ],
        outputSymbols: [
          "compactness",
          "material_gravity_crossover_radius",
          "jeans_length",
        ],
      },
      {
        id: "casimir_dp_stage4_2d_nonbridge_gate",
        role: "gate",
        displayLatex:
          "G_{4.2D}=G_{\\rm source}\\land G_{\\rm units}\\land G_{\\rm recovery}\\land G_{\\rm spinor\\neq mass}\\land G_{\\rm DP\\ unchanged}\\land(N_{\\rm bridge}=0)",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "equation_relation_class",
          "source_support_boundary",
          "registered_dp_generator",
        ],
        outputSymbols: [
          "G_4_2D",
          "observable_bridge_edges_added",
          "claim_ceiling",
        ],
      },
    ],
    units: [
      {
        symbol: "Delta_nu",
        unit: "Hz",
        quantity: "spectroscopic_frequency_shift",
        dimensionSignature: "T^-1",
      },
      {
        symbol: "compactness",
        unit: null,
        quantity: "schwarzschild_compactness",
        dimensionSignature: null,
      },
      {
        symbol: "R_yield",
        unit: "m",
        quantity: "material_gravity_crossover_radius",
        dimensionSignature: "L",
      },
      {
        symbol: "lambda_J",
        unit: "m",
        quantity: "jeans_length",
        dimensionSignature: "L",
      },
      {
        symbol: "G_4_2D",
        unit: null,
        quantity: "cross_scale_metrology_gate",
        dimensionSignature: null,
      },
    ],
    assumptions: [
      "Maximum claim: spectroscopic_field_metrology_and_classical_gravity_recovery_only.",
      "The authoritative synthetic run is casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z.",
      "All six Stage-4.2C authority tuples are immutable and recover the selected silica candidate, 542-window forecast, and open empirical-status ledger.",
      "Stark, Zeeman, and blackbody dynamic-Stark equations are sourced apparatus calibration transfers only.",
      "The integrated transition coefficients, field response, drift, and covariance are design assumptions until measured in calibration and pilot data.",
      "The witness-to-complex-coherence transfer remains not_ready and cannot be inferred from equal frequency dimensions.",
      "Schwarzschild compactness, potato radius, and Jeans length are force-balance or compactness recovery checks, not gravity-onset or wave-function-collapse thresholds.",
      "Penrose spinors represent fields and curvature; mass is not a spinor, the Maxwell spinor is not a collapse generator, and Penrose 1960 attempts no quantization.",
      "Only branch_density_difference_to_dp_rate is admitted to the frozen DP-rate lane.",
      "The ordinary null, frozen mass-density DP hypothesis, and boundary-conditioned extension remain separate.",
      "All 10 baseline and fail-closed fixtures pass, the maximum algebraic replay error is below 1e-12, and zero observable bridge edges are added.",
      "Fresh adapter run 2338 returns PASS with no first failure, no deltas, GREEN certificate status, and integrity OK; its scientific scope is none.",
      "Physical pilot readiness and measured evidence remain not_ready; collapse identification and manifold dynamics remain blocked; physical viability remains not_evaluated.",
      "This badge is non-promotable and has no calculator payload.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-cross-scale-metrology-stage4-2d.ts",
        "casimir_dp_cross_scale_metrology_stage4_2d",
        "Spectroscopic response/covariance, gravitational recovery, spinor semantic, and equation-congruence runtime.",
      ),
      sourceRef(
        "repo_module",
        "scripts/research/run-casimir-dp-cross-scale-metrology-stage4-2d.ts",
        "casimir_dp_cross_scale_metrology_stage4_2d_orchestrator",
        "Authority validator, fixture executor, report, trace, and receipt writer.",
      ),
      sourceRef(
        "repo_module",
        "shared/contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1.ts",
        "casimir_dp_cross_scale_metrology_stage4_2d_contract",
        "Strict sources, authorities, run order, status, nonbridge, and fixture contract.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-cross-scale-metrology-stage4-2d.v1.json",
        "614f5b6de4176ffda7fc49ce794592aa50a56ecb56d4accf7df3cae6b0bcc41e",
        "Frozen Stage-4.2D source, constant, calibration, gravity-recovery, hypothesis, threshold, and status configuration.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-stage4-2d-authorities.v1.json",
        "721e0ffbcc26425236d62ba2d368fc8cabec9ba469d5dfac89a707e90d42dcb1",
        "Immutable Stage-4.2C role/path/content-hash authority manifest.",
      ),
      sourceRef(
        "artifact",
        "configs/research/fixtures/casimir-dp-stage4-2d-cross-scale.synthetic.v1.json",
        "9fb2f66f5d454aafde3c65e058c2c94c7279d4a5e821bd4b2c359cae6e12ab85",
        "Ten-case baseline and fail-closed cross-scale fixture matrix.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-cross-scale-metrology-stage4-2d/casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z/cross-scale-metrology-stage4-2d-report.json",
        "5e16c28a32ab77d0ca7ee44483824ca6ddedfb09657a77340df4b4f892c74229",
        "Immutable machine-readable Stage-4.2D report.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-cross-scale-metrology-stage4-2d/casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z/cross-scale-metrology-stage4-2d-receipt.json",
        "e602cb12250c2560b1f71502ae93c17e754cacbbe69b6f0acfbb4a5a55a6809c",
        "Campaign receipt binding the config, authority manifest, fixture, report, trace, and open scientific gates.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-report.md",
        "3ef52e169d5f4b91f1236d705bbd7acda5097e2e3fdb165e15fdb571acb7ce55",
        "Maintained human-readable report identical to the immutable run Markdown.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-plan.md",
        "casimir_dp_cross_scale_metrology_stage4_2d_plan",
        "Implementation, hypothesis, runtime, empirical-pilot, evidence, and completion contract.",
      ),
      sourceRef(
        "artifact",
        "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-verification-receipt.json",
        "d96430684379dd5408d8099ae49a05ca0eaf4042a0ea64b09e23d0a4156a0556",
        "Fresh adapter run 2338, certificate, explicit telemetry, local-gate, and scientific-nonclaim receipt.",
      ),
      sourceRef(
        "artifact",
        "artifacts/training-trace-stage4-2d-20260728T195741260Z-bound-validated.jsonl",
        "bb4f53cf48f7cf0726822e53dbacd369485c638636df1e6f5078027d36f91d38",
        "Exclusive one-record validated adapter trace bound to run 2338 and the Stage-4.2D trace identity.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-cross-scale-metrology-stage4-2d.spec.ts",
        "casimir_dp_cross_scale_metrology_stage4_2d_test",
        "Focused spectroscopic, gravitational-recovery, spinor, and nonbridge tests.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2d-campaign.spec.ts",
        "casimir_dp_stage4_2d_campaign_test",
        "Authority, determinism, fixture, zero-bridge, and scientific-status campaign tests.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1016/0003-4916(60)90021-X",
        "Penrose-spinor-1960",
        "Spinor representation of curvature and source-free electromagnetism; no quantization is attempted.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1007/BF02105068",
        "Penrose-OR-1996",
        "Branch-relative gravitational self-energy and order-hbar-over-energy lifetime proposal.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1103/PhysRevLett.78.622",
        "blackbody-Stark-1997",
        "Measured blackbody dynamic-Stark frequency shift; no DP implication.",
      ),
      sourceRef(
        "literature_ref",
        "https://arxiv.org/abs/1004.1091",
        "potato-radius-2010",
        "Material-strength versus self-gravity crossover; not a collapse threshold.",
      ),
    ],
    observables: [
      {
        id: "study.casimir_dp.cross_scale_metrology_stage4_2d.gate",
        canonicalObservableId:
          "observable.study.cross_scale_metrology_recovery_gate",
        symbol: "G_4_2D",
        quantity: "cross_scale_metrology_recovery_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "apparatus_and_reference_regime_registry",
        operationalDefinitionRef:
          "shared/contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1.ts",
        responseModelRef:
          "shared/casimir-dp-cross-scale-metrology-stage4-2d.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2D",
        "Stark metrology",
        "Zeeman metrology",
        "spinor nonbridge",
        "Schwarzschild compactness",
        "potato radius",
        "Jeans instability",
        "cross-scale equation congruence",
      ],
      symbols: [
        "Delta_nu_Z",
        "Delta_nu_S",
        "Delta_nu_BBR",
        "compactness",
        "R_yield",
        "lambda_J",
        "G_4_2D",
      ],
      unitSignatures: ["1", "L", "M", "T", "T^-1"],
      repoPaths: [
        "shared/casimir-dp-cross-scale-metrology-stage4-2d.ts",
        "scripts/research/run-casimir-dp-cross-scale-metrology-stage4-2d.ts",
        "shared/contracts/casimir-dp-cross-scale-metrology-stage4-2d.v1.ts",
        "configs/research/casimir-dp-cross-scale-metrology-stage4-2d.v1.json",
        "configs/research/casimir-dp-stage4-2d-authorities.v1.json",
        "configs/research/fixtures/casimir-dp-stage4-2d-cross-scale.synthetic.v1.json",
        "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-report.md",
        "docs/research/casimir-dp-cross-scale-metrology-stage4-2d-plan.md",
        "tests/casimir-dp-cross-scale-metrology-stage4-2d.spec.ts",
        "tests/casimir-dp-stage4-2d-campaign.spec.ts",
      ],
      equationFamilies: [
        "spectroscopic_field_metrology",
        "classical_gravity_recovery",
        "spinor_representation_nonbridge",
        "cross_scale_equation_congruence",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.causal_cone_clock_stage4_2e",
    title: "Stage-4.2E Causal Cones, Worldlines, and Clock Congruence",
    plainMeaning:
      "Reconstructs local null cones from the ADM metric, checks timelike proper clocks and bounded light propagation against Schwarzschild recovery, and screens the ideal Casimir stress tensor and QED propagation correction without turning either into a DP-collapse coupling.",
    whyItMatters:
      "Light cones are the causal geometry against which every proposed apparatus clock, light path, and massive worldline must be checked. This campaign shows that the NHM2 and conventional-GR notation is reusable, while also quantifying why a Casimir boundary is not automatically a measurable spacetime-curvature modifier.",
    subjects: [
      "casimir_dp_study",
      "casimir_dp_stage4_2e",
      "adm_null_cone",
      "timelike_worldline",
      "proper_clock",
      "null_geodesic",
      "radar_time",
      "schwarzschild_recovery",
      "casimir_stress_energy",
      "qed_effective_propagation_nonbridge",
    ],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    equationFamilies: [
      "adm_causal_cone_clock",
      "null_geodesic_radar_time",
      "semiclassical_casimir_curvature_screen",
      "qed_propagation_metric_nonbridge",
    ],
    tags: [
      "stage_4_2e",
      "diagnostic",
      "synthetic_only_v1",
      "source_bounded",
      "null_geodesic_apparatus_authority_not_ready",
      "complete_apparatus_metric_response_not_ready",
      "physical_pilot_readiness_not_ready",
      "measured_evidence_not_ready",
      "collapse_identification_blocked",
      "manifold_dynamics_blocked",
      "physical_viability_not_evaluated",
      "promotion_blocked",
      "zero_observable_bridge",
      "maximum_claim:causal_geometry_recovery_and_scale_separation_only",
    ],
    equations: [
      {
        id: "casimir_dp_stage4_2e_adm_null_clock",
        role: "transform",
        displayLatex:
          "\\left(\\frac{d\\tau}{dt}\\right)^2=\\alpha^2-\\gamma_{ij}(v^i+\\beta^i)(v^j+\\beta^j),\\quad ds^2=0\\Rightarrow\\gamma_{ij}(\\lambda e^i+\\beta^i)(\\lambda e^j+\\beta^j)=\\alpha^2",
        computableExpression: null,
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha", "beta_i", "gamma_ij", "v_i", "e_i"],
        outputSymbols: [
          "proper_clock_rate",
          "directional_null_root_plus",
          "directional_null_root_minus",
          "causal_class",
        ],
      },
      {
        id: "casimir_dp_stage4_2e_radial_null_recovery",
        role: "transform",
        displayLatex:
          "t_{\\rm null}=\\frac{r_2-r_1}{c}+\\frac{r_s}{c}\\ln\\!\\left(\\frac{r_2-r_s}{r_1-r_s}\\right)",
        computableExpression: null,
        operatorKind: "scalar_expression",
        inputSymbols: ["r_1", "r_2", "r_s", "c"],
        outputSymbols: ["null_coordinate_time", "shapiro_excess_time"],
      },
      {
        id: "casimir_dp_stage4_2e_casimir_curvature_screen",
        role: "transform",
        displayLatex:
          "u_C=-\\frac{\\pi^2\\hbar c}{720a^4},\\quad P_C=-\\frac{\\pi^2\\hbar c}{240a^4},\\quad \\mathcal R_C\\sim\\frac{8\\pi G|u_C|}{c^4}",
        computableExpression: null,
        operatorKind: "scalar_expression",
        inputSymbols: ["a", "hbar", "c", "G"],
        outputSymbols: [
          "ideal_casimir_energy_density",
          "ideal_casimir_pressure",
          "curvature_scale_screen",
          "fractional_light_time_screen",
        ],
      },
      {
        id: "casimir_dp_stage4_2e_qed_metric_nonbridge",
        role: "gate",
        displayLatex:
          "\\delta v_{\\rm QED}/c\\sim\\frac{11\\pi^2}{2700}\\alpha_{\\rm fs}^2(\\bar\\lambda_e/a)^4\\not\\Rightarrow\\delta g_{\\mu\\nu}\\not\\Rightarrow\\delta\\Gamma_{\\rm DP}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: [
          "qed_effective_phase_speed_proxy",
          "complete_stress_energy_tensor",
          "registered_transfer_kernel",
        ],
        outputSymbols: [
          "qed_gr_signature_class",
          "observable_bridge_edges_added",
          "claim_ceiling",
        ],
      },
    ],
    units: [
      {
        symbol: "d_tau_over_dt",
        unit: null,
        quantity: "proper_clock_rate",
        dimensionSignature: null,
      },
      {
        symbol: "t_null",
        unit: "s",
        quantity: "null_coordinate_time",
        dimensionSignature: "T",
      },
      {
        symbol: "u_C",
        unit: "J/m^3",
        quantity: "ideal_casimir_energy_density",
        dimensionSignature: "M L^-1 T^-2",
      },
      {
        symbol: "R_C",
        unit: "m^-2",
        quantity: "casimir_curvature_scale_screen",
        dimensionSignature: "L^-2",
      },
    ],
    assumptions: [
      "Maximum claim: causal_geometry_recovery_and_scale_separation_only.",
      "The authoritative synthetic run is casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z.",
      "All six Stage-4.2D authority tuples are immutable upstream evidence.",
      "The ADM lapse, shift, and spatial metric define coordinate light-cone roots; only coordinate-invariant observables may be compared across gauges.",
      "Massive apparatus clocks must remain timelike and therefore inside the local null cone.",
      "A flat L/c estimate is a baseline, not a null-geodesic solve in a nontrivial metric.",
      "The ideal parallel-plate Casimir stress-energy screen is incomplete apparatus physics and cannot be promoted to a complete semiclassical metric solution.",
      "The Scharnhorst-scale QED propagation proxy belongs to the material/QED response lane and is not a GR metric perturbation or superluminal signaling claim.",
      "Standard mass-density DP remains boundary independent; a Casimir-to-collapse modifier requires a separately registered, sourced transfer kernel.",
      "All 10 baseline and fail-closed fixtures pass; the maximum local-null residual is below 2e-16 and the Schwarzschild analytic/numerical relative error is below 3e-16.",
      "At a 100 nm ideal gap the curvature-scale screen is approximately 9e-43 m^-2 and the fractional light-time screen approximately 9e-57, while the QED propagation proxy is approximately 4.76e-28; neither is a collapse signal.",
      "Null-geodesic apparatus authority, complete apparatus metric response, physical pilot readiness, and measured evidence remain not_ready; collapse identification and manifold dynamics remain blocked; physical viability remains not_evaluated.",
      "This badge is non-promotable and has no calculator payload.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef(
        "repo_module",
        "shared/casimir-dp-causal-cone-clock-stage4-2e.ts",
        "casimir_dp_causal_cone_clock_stage4_2e",
        "ADM cone, proper-clock, Schwarzschild recovery, Casimir curvature-screen, and QED-control runtime.",
      ),
      sourceRef(
        "repo_module",
        "scripts/research/run-casimir-dp-causal-cone-clock-stage4-2e.ts",
        "casimir_dp_causal_cone_clock_stage4_2e_orchestrator",
        "Authority validator, fixture executor, report, trace, and receipt writer.",
      ),
      sourceRef(
        "repo_module",
        "shared/contracts/casimir-dp-causal-cone-clock-stage4-2e.v1.ts",
        "casimir_dp_causal_cone_clock_stage4_2e_contract",
        "Strict sources, ADM inputs, controls, gates, statuses, and fixture contract.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-causal-cone-clock-stage4-2e.v1.json",
        "1279c8e23fb033237a79c29546ef5c210a9405d21604ad844ae801e55d5732e5",
        "Frozen Stage-4.2E source, benchmark, scale-screen, nonbridge, and status configuration.",
      ),
      sourceRef(
        "artifact",
        "configs/research/casimir-dp-stage4-2e-authorities.v1.json",
        "cba9c8b40dc153cda0bb9683834df953c9de09a0c4d1a2bb9aa32ac5167b91f2",
        "Immutable Stage-4.2D role/path/content-hash authority manifest.",
      ),
      sourceRef(
        "artifact",
        "configs/research/fixtures/casimir-dp-stage4-2e-causal-cone.synthetic.v1.json",
        "16245e73a70acee3a429a6beaee6ec5b18b66863a357c60918d602920ef9bab8",
        "Ten-case baseline and fail-closed causal-cone fixture matrix.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-causal-cone-clock-stage4-2e/casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z/causal-cone-clock-stage4-2e-report.json",
        "d75857f22e0a95b4302e61d60d25c9fa689182ce8c9ef31eabfd15e64f66ed58",
        "Immutable machine-readable Stage-4.2E report.",
      ),
      sourceRef(
        "artifact",
        "artifacts/research/casimir-dp-causal-cone-clock-stage4-2e/casimir-dp-causal-cone-clock-stage4-2e-v1-20260729T193000000Z/causal-cone-clock-stage4-2e-receipt.json",
        "633b07c4f2d769b4701612bd4e112e5a2e12e111f60f7405f1f752b3e260d2c2",
        "Campaign receipt binding upstream authorities, inputs, report, trace, and open scientific gates.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-causal-cone-clock-stage4-2e-report.md",
        "fd3463408012bc168832167159641bc30a87a627bf26ec2d9d3ebd9bfe0af5c0",
        "Maintained human-readable report identical to the immutable run Markdown.",
      ),
      sourceRef(
        "doc",
        "docs/research/casimir-dp-causal-cone-clock-stage4-2e-plan.md",
        "casimir_dp_causal_cone_clock_stage4_2e_plan",
        "Implementation, causal semantics, recovery, scale-separation, falsifier, and completion contract.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-causal-cone-clock-stage4-2e.spec.ts",
        "casimir_dp_causal_cone_clock_stage4_2e_test",
        "Focused ADM, Schwarzschild, scale-screen, and nonbridge tests.",
      ),
      sourceRef(
        "test",
        "tests/casimir-dp-stage4-2e-campaign.spec.ts",
        "casimir_dp_stage4_2e_campaign_test",
        "Authority, determinism, fixture, zero-bridge, and scientific-status campaign tests.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1007/978-3-642-37276-6",
        "Gourgoulhon-3plus1-2012",
        "ADM/3+1 spacetime decomposition and causal kinematics.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1007/BF00754584",
        "Ehlers-Pirani-Schild-1972",
        "Light rays and freely falling particles as operational foundations of spacetime geometry.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1007/BF02105068",
        "Penrose-OR-1996",
        "Branch-relative gravitational self-energy and order-hbar-over-energy lifetime proposal; no Casimir modifier.",
      ),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1088/0305-4470/36/50/R01",
        "Fulling-Casimir-gravity-2003",
        "Casimir stress-energy and gravity review; supports tensor treatment, not a DP coupling.",
      ),
    ],
    observables: [
      {
        id: "study.casimir_dp.causal_cone_clock_stage4_2e.gate",
        canonicalObservableId:
          "observable.study.causal_cone_clock_recovery_gate",
        symbol: "G_4_2E",
        quantity: "causal_cone_clock_recovery_gate",
        mathematicalType: "scalar",
        unit: null,
        dimensionSignature: null,
        coordinateFrame: "adm_chart_and_reference_spacetime_registry",
        operationalDefinitionRef:
          "shared/contracts/casimir-dp-causal-cone-clock-stage4-2e.v1.ts",
        responseModelRef:
          "shared/casimir-dp-causal-cone-clock-stage4-2e.ts",
      },
    ],
    hintKeys: {
      subjects: [
        "Casimir DP Stage 4.2E",
        "light cone",
        "worldline",
        "proper clock",
        "null geodesic",
        "radar time",
        "Schwarzschild recovery",
        "Casimir stress energy",
        "Scharnhorst nonbridge",
      ],
      symbols: [
        "alpha",
        "beta_i",
        "gamma_ij",
        "d_tau_over_dt",
        "t_null",
        "u_C",
        "R_C",
        "G_4_2E",
      ],
      unitSignatures: ["1", "L", "T", "L^-2", "M L^-1 T^-2"],
      repoPaths: [
        "shared/casimir-dp-causal-cone-clock-stage4-2e.ts",
        "scripts/research/run-casimir-dp-causal-cone-clock-stage4-2e.ts",
        "shared/contracts/casimir-dp-causal-cone-clock-stage4-2e.v1.ts",
        "configs/research/casimir-dp-causal-cone-clock-stage4-2e.v1.json",
        "configs/research/casimir-dp-stage4-2e-authorities.v1.json",
        "configs/research/fixtures/casimir-dp-stage4-2e-causal-cone.synthetic.v1.json",
        "docs/research/casimir-dp-causal-cone-clock-stage4-2e-report.md",
        "docs/research/casimir-dp-causal-cone-clock-stage4-2e-plan.md",
        "tests/casimir-dp-causal-cone-clock-stage4-2e.spec.ts",
        "tests/casimir-dp-stage4-2e-campaign.spec.ts",
      ],
      equationFamilies: [
        "adm_causal_cone_clock",
        "null_geodesic_radar_time",
        "semiclassical_casimir_curvature_screen",
        "qed_propagation_metric_nonbridge",
      ],
      simulationOwners: ["casimir_dp_study", "casimir", "curvature_collapse"],
    },
  }),
  studyBadge({
    id: "study.casimir_dp.claim_boundary",
    title: "Casimir / DP Quantum-Foam Study Claim Boundary",
    plainMeaning:
      "Keeps the study diagnostic until the material, branch-provenance, bounds, observable-bridge, sensitivity, and reproduction gates close.",
    whyItMatters:
      "It prevents a runnable smoke receipt or scalar agreement from being described as quantum-foam, objective-collapse, NHM2, or viability validation.",
    subjects: ["casimir_dp_study", "claim_boundary", "quantum_foam", "objective_collapse"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["casimir_dp_study"],
    equationFamilies: ["study_claim_boundary"],
    tags: ["diagnostic_only", "promotion_blocked", "non_claims"],
    equations: [
      {
        id: "casimir_dp_claim_boundary",
        role: "noncomputable_reference",
        displayLatex:
          "claim_{CDP-QF-1}=diagnostic\\ only\\;\\ promotion=blocked",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["study_gate_ledger"],
        outputSymbols: ["claim_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "Casimir calculations do not prove a unique quantum-vacuum or quantum-foam ontology.",
      "DP calculations do not prove observed objective collapse.",
      "Compton and DP frequency identities do not supply a cavity resonance or collapse beat without a registered transfer kernel.",
      "Negative renormalized energy density does not by itself identify negative curvature.",
      "Ambient gravity and gravitationally induced phase are not the branch-relative DP self-energy.",
      "Visibility loss does not establish objective collapse without a dynamics-level discriminator.",
      "Classical gravitational-wave observations do not establish quantum superposed geometry or objective reduction.",
      "This non-biological experiment does not validate Orch OR or consciousness claims.",
      "The study does not validate NHM2, propulsion, gravity control, negative-energy engineering, or physical viability.",
      "Promotion remains disallowed in this badge graph version.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      sourceRef("doc", "docs/research/casimir-dp-quantum-foam-study.md", "claim-boundaries", "Canonical study non-claims."),
      sourceRef("literature_ref", "https://doi.org/10.1038/s41567-020-1008-4", "Donadi-et-al-2021", "Experimental exclusion context for the natural parameter-free DP version."),
      sourceRef(
        "literature_ref",
        "https://doi.org/10.1103/2jm3-4976",
        "XENONnT-2026",
        "Current lower bound on R_0 for the tested Markovian spontaneous-radiation DP implementation; no significant excess; not generic Penrose OR or colored, dissipative, or non-Markovian DP.",
      ),
    ],
    hintKeys: {
      subjects: ["casimir dp claim boundary", "quantum foam non claim", "objective collapse bounds"],
      symbols: ["claim_CDP_QF_1", "claim_boundary"],
      unitSignatures: [],
      repoPaths: ["docs/research/casimir-dp-quantum-foam-study.md"],
      equationFamilies: ["study_claim_boundary"],
      simulationOwners: ["casimir_dp_study"],
    },
  }),
];

export const CASIMIR_DP_STUDY_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "casimir_dp_protocol_requires_casimir_baseline",
    from: "casimir.cavity.parallel_plate_pressure",
    to: "study.casimir_dp.protocol",
    relation: "requires",
    label: "The study protocol starts from the established Casimir reference lane.",
    claimBoundaryNote: "The ideal scalar is a baseline, not a complete apparatus prediction.",
  },
  {
    id: "casimir_dp_protocol_requires_material_receipts",
    from: "casimir.material_receipts",
    to: "study.casimir_dp.protocol",
    relation: "requires",
    label: "Measurement comparison requires the Casimir material and metrology receipt chain.",
    claimBoundaryNote: "Missing receipts keep residual interpretation not ready.",
  },
  {
    id: "casimir_dp_protocol_requires_dp_branches",
    from: "collapse.objective.mass_density_branch_difference",
    to: "study.casimir_dp.protocol",
    relation: "requires",
    label: "The DP lane requires explicit mass-density branch evidence.",
    claimBoundaryNote: "Casimir force cannot replace branch distributions.",
  },
  {
    id: "casimir_dp_protocol_requires_dp_bounds",
    from: "collapse.objective.experimental_bounds",
    to: "study.casimir_dp.protocol",
    relation: "requires",
    label: "The DP diagnostic must be interpreted against independent experimental bounds.",
    claimBoundaryNote: "Bounds constrain parameter space and do not validate collapse.",
  },
  {
    id: "casimir_dp_penrose_or_requires_branch_difference",
    from: "collapse.objective.mass_density_branch_difference",
    to: "study.casimir_dp.penrose_or_branch_geometry_context",
    relation: "requires",
    label: "Penrose OR context begins with two explicit material mass-density branches.",
    claimBoundaryNote: "Signed branch difference is not negative mass, Casimir energy, or a virtual-particle population.",
  },
  {
    id: "casimir_dp_penrose_or_requires_dp_self_energy",
    from: "collapse.objective.dp_gravitational_self_energy",
    to: "study.casimir_dp.penrose_or_branch_geometry_context",
    relation: "requires",
    label: "The weak-field repository counterpart requires the registered branch self-energy diagnostic.",
    claimBoundaryNote: "Grid and regularization dependence prevent an unqualified numerical identification with covariant OR.",
  },
  {
    id: "casimir_dp_penrose_or_documents_dp_timescale",
    from: "study.casimir_dp.penrose_or_branch_geometry_context",
    to: "collapse.objective.dp_timescale",
    relation: "documents",
    label: "The OR notation crosswalk documents the relation between the Penrose estimate and the repository DP timescale.",
    claimBoundaryNote: "A timescale diagnostic is not an observed reduction or oscillatory spectral line.",
  },
  {
    id: "casimir_dp_penrose_or_contextualizes_manifold_hypothesis",
    from: "study.casimir_dp.penrose_or_branch_geometry_context",
    to: "study.casimir_dp.manifold_response_hypothesis",
    relation: "documents",
    label: "Penrose branch-geometry motivation contextualizes, but does not derive, the boundary-conditioned manifold hypothesis.",
    claimBoundaryNote: "Standard OR supplies no Casimir boundary-response kernel.",
  },
  {
    id: "casimir_dp_penrose_or_documents_orch_boundary",
    from: "study.casimir_dp.penrose_or_branch_geometry_context",
    to: "orch_or.claim_boundary.exploratory_only",
    relation: "documents",
    label: "The study records that Orch OR adds biological claims absent from this apparatus.",
    claimBoundaryNote: "No microtubule, neuronal, anesthetic, or consciousness validation is allowed.",
  },
  {
    id: "casimir_dp_penrose_or_documents_claim_boundary",
    from: "study.casimir_dp.penrose_or_branch_geometry_context",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label: "The OR context carries the diagnostic-only claim ceiling into the study boundary.",
    claimBoundaryNote: "Branch-geometry language, ambient gravity, and gravitational waves cannot promote the study.",
  },
  {
    id: "casimir_dp_manifold_response_requires_observable_gate",
    from: "study.casimir_dp.observable_separation_gate",
    to: "study.casimir_dp.manifold_response_hypothesis",
    relation: "requires",
    label: "The manifold-response hypothesis requires distinct boundary-stress, coherence, and DP observables.",
    claimBoundaryNote: "Shared vacuum or gravity vocabulary cannot supply the transformation.",
  },
  {
    id: "casimir_dp_manifold_response_requires_decoherence_gate",
    from: "study.casimir_dp.decoherence_collapse_gate",
    to: "study.casimir_dp.manifold_response_hypothesis",
    relation: "requires",
    label: "A candidate manifold term must survive the ordinary decoherence budget and dynamics discriminator.",
    claimBoundaryNote: "A coherence residual is not automatically an objective-collapse rate.",
  },
  {
    id: "casimir_dp_manifold_response_requires_frequency_bridge_gate",
    from: "study.casimir_dp.frequency_bridge_gate",
    to: "study.casimir_dp.manifold_response_hypothesis",
    relation: "requires",
    label: "A frequency-based manifold-response model requires a sourced transfer kernel from cavity input to branch or coherence dynamics.",
    claimBoundaryNote: "Frequency identities and matching units cannot supply the missing dynamics.",
  },
  {
    id: "casimir_dp_manifold_response_specializes_quantum_foam_slot",
    from: "study.casimir_dp.manifold_response_hypothesis",
    to: "study.casimir_dp.quantum_foam_hypothesis",
    relation: "specializes",
    label: "The direct-manipulation manifold hypothesis provides a narrower test target inside the quantum-foam model family.",
    claimBoundaryNote: "Both model slots remain noncomputable and Stage 0 until dynamics are registered.",
  },
  {
    id: "casimir_dp_quantum_foam_requires_observable_gate",
    from: "study.casimir_dp.observable_separation_gate",
    to: "study.casimir_dp.quantum_foam_hypothesis",
    relation: "requires",
    label: "Any quantum-foam residual model must identify its Casimir observable and any proposed DP bridge.",
    claimBoundaryNote: "The missing bridge currently blocks cross-lane inference.",
  },
  {
    id: "casimir_dp_protocol_documents_observable_gate",
    from: "study.casimir_dp.protocol",
    to: "study.casimir_dp.observable_separation_gate",
    relation: "diagnostic_checks",
    label: "The ordered protocol evaluates observable identity before synthesis.",
    claimBoundaryNote: "Process completion cannot override a blocked identity gate.",
  },
  {
    id: "casimir_dp_protocol_runs_experiment_design_campaign",
    from: "study.casimir_dp.protocol",
    to: "study.casimir_dp.experiment_design_campaign",
    relation: "diagnostic_checks",
    label: "The ordered study protocol runs the role-separated experiment-design screen before apparatus selection.",
    claimBoundaryNote: "The screen compares open budgets and cannot promote a candidate.",
  },
  {
    id: "casimir_dp_experiment_design_requires_decoherence_gate",
    from: "study.casimir_dp.decoherence_collapse_gate",
    to: "study.casimir_dp.experiment_design_campaign",
    relation: "requires",
    label: "The design campaign inherits the ordinary-decoherence and collapse-identifiability gate.",
    claimBoundaryNote: "A DP-to-environment rate ratio is a design diagnostic, not observed collapse.",
  },
  {
    id: "casimir_dp_experiment_design_runs_stage1_gated_computations",
    from: "study.casimir_dp.experiment_design_campaign",
    to: "study.casimir_dp.gated_computations_stage1",
    relation: "diagnostic_checks",
    label: "The role-separated design campaign feeds the Stage-1 numerical and inference gates.",
    claimBoundaryNote: "Numerical progress cannot replace material, sidecar, or branch evidence.",
  },
  {
    id: "casimir_dp_stage1_requires_material_receipts",
    from: "casimir.material_receipts",
    to: "study.casimir_dp.gated_computations_stage1",
    relation: "requires",
    label: "Publication comparison requires measured material and metrology receipts beyond literature Drude parameters.",
    claimBoundaryNote: "The current material gate remains not ready.",
  },
  {
    id: "casimir_dp_stage1_blocks_claims",
    from: "study.casimir_dp.gated_computations_stage1",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Open finite-geometry, sidecar, branch-provenance, identifiability, and manifold gates block promotion.",
    claimBoundaryNote: "Stage-1 numerical passes do not establish objective collapse or a manifold mechanism.",
  },
  {
    id: "casimir_dp_stage1_runs_data_readiness",
    from: "study.casimir_dp.gated_computations_stage1",
    to: "study.casimir_dp.data_readiness_stage1",
    relation: "diagnostic_checks",
    label: "Stage-1 numerical gaps feed the authenticated material, sidecar, source-ledger, and blinded discriminator campaign.",
    claimBoundaryNote: "Synthetic validation makes the acquisition path runnable but does not supply measurements.",
  },
  {
    id: "casimir_dp_data_readiness_requires_material_receipts",
    from: "casimir.material_receipts",
    to: "study.casimir_dp.data_readiness_stage1",
    relation: "requires",
    label: "Measured optical continuation requires apparatus-specific material and calibration receipts.",
    claimBoundaryNote: "External or synthetic optical response cannot close the measured-material gate.",
  },
  {
    id: "casimir_dp_data_readiness_blocks_claims",
    from: "study.casimir_dp.data_readiness_stage1",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Open measured-evidence, collapse-signature, and manifold-dynamics gates block promotion.",
    claimBoundaryNote: "A passing pipeline receipt is not evidence for objective collapse or manifold manipulation.",
  },
  {
    id: "casimir_dp_data_readiness_runs_proposal_closure",
    from: "study.casimir_dp.data_readiness_stage1",
    to: "study.casimir_dp.proposal_closure",
    relation: "diagnostic_checks",
    label: "The authenticated data path feeds the frozen apparatus, systematics, commissioning, and decision contracts.",
    claimBoundaryNote: "Protocol closure does not supply the missing measured artifacts.",
  },
  {
    id: "casimir_dp_proposal_requires_decoherence_gate",
    from: "study.casimir_dp.decoherence_collapse_gate",
    to: "study.casimir_dp.proposal_closure",
    relation: "requires",
    label: "The proposal inherits the ordinary-decoherence and collapse-identification separation gate.",
    claimBoundaryNote: "An unexplained coherence residual remains non-identifying.",
  },
  {
    id: "casimir_dp_proposal_closure_blocks_claims",
    from: "study.casimir_dp.proposal_closure",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Conditional commissioning and open measured/model gates block physical promotion.",
    claimBoundaryNote: "Proposal readiness is not experimental or mechanism validation.",
  },
  {
    id: "casimir_dp_experiment_design_blocks_claims",
    from: "study.casimir_dp.experiment_design_campaign",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Open material, geometry, decoherence, DP-branch, manifold, and identifiability gates block promotion.",
    claimBoundaryNote: "No engineering rank is physical evidence.",
  },
  {
    id: "casimir_dp_decoherence_gate_blocks_claims",
    from: "study.casimir_dp.decoherence_collapse_gate",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Unclosed ordinary decoherence alternatives block objective-collapse interpretation.",
    claimBoundaryNote: "Visibility loss or a cavity correlation alone cannot establish collapse.",
  },
  {
    id: "casimir_dp_manifold_response_blocks_claims",
    from: "study.casimir_dp.manifold_response_hypothesis",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "The unregistered tensor-to-metric-to-coherence functional blocks manifold-mechanism claims.",
    claimBoundaryNote: "The current math maturity is Stage 0 exploratory.",
  },
  {
    id: "casimir_dp_observable_gate_blocks_claims",
    from: "study.casimir_dp.observable_separation_gate",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "The missing Casimir-to-DP bridge blocks mechanism and promotion claims.",
    claimBoundaryNote: "No quantum-foam or DP mechanism claim is allowed while blocked.",
  },
  {
    id: "casimir_dp_frequency_bridge_gate_blocks_claims",
    from: "study.casimir_dp.frequency_bridge_gate",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "The missing Compton/DP-to-cavity transfer kernel blocks beat-frequency and resonance claims.",
    claimBoundaryNote: "The gate can open only with sourced dynamics, an operational observable, uncertainties, and a falsifier.",
  },
  {
    id: "casimir_dp_quantum_foam_blocks_claims",
    from: "study.casimir_dp.quantum_foam_hypothesis",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "An unregistered quantum-foam response remains a bounded hypothesis slot.",
    claimBoundaryNote: "Noncomputable hypothesis language is not evidence.",
  },
  {
    id: "casimir_dp_proposal_feeds_stage3_evidence_map",
    from: "study.casimir_dp.proposal_closure",
    to: "study.casimir_dp.evidence_map_stage3",
    relation: "diagnostic_checks",
    label: "The frozen proposal architecture and commissioning contracts feed the Stage-3 evidence map.",
    claimBoundaryNote: "Proposal completeness cannot satisfy measured Stage-3 gates.",
  },
  {
    id: "casimir_dp_stage2_context_feeds_stage3_evidence_map",
    from: "study.casimir_dp.penrose_or_branch_geometry_context",
    to: "study.casimir_dp.evidence_map_stage3",
    relation: "diagnostic_checks",
    label: "The immutable Stage-2 OR/phase and fixed-branch-null context feeds Stage 3.",
    claimBoundaryNote: "Stage-2's prior certificate and blocked evidence states are not promoted or reused.",
  },
  {
    id: "casimir_dp_complex_coherence_feeds_model_comparison",
    from: "study.casimir_dp.complex_coherence_discriminator",
    to: "study.casimir_dp.blinded_model_comparison",
    relation: "requires",
    label: "Joint inference requires complex coherence, path-swap, conditioning, echo, and decay-shape diagnostics.",
    claimBoundaryNote: "Visibility alone cannot identify collapse.",
  },
  {
    id: "casimir_dp_qed_noise_feeds_model_comparison",
    from: "study.casimir_dp.qed_green_noise_budget",
    to: "study.casimir_dp.blinded_model_comparison",
    relation: "requires",
    label: "The composite ordinary-physics null requires a shared material/Green mean-and-noise budget.",
    claimBoundaryNote: "Mean pressure cannot be substituted for a fluctuation spectrum.",
  },
  {
    id: "casimir_dp_dp_companion_feeds_model_comparison",
    from: "study.casimir_dp.dp_companion_signature",
    to: "study.casimir_dp.blinded_model_comparison",
    relation: "requires",
    label: "A named DP comparison requires one frozen parameter manifest across coherence and companions.",
    claimBoundaryNote: "Penrose's lifetime heuristic is not a generative master equation.",
  },
  {
    id: "casimir_dp_gravity_bound_feeds_model_comparison",
    from: "study.casimir_dp.casimir_gravity_upper_bound",
    to: "study.casimir_dp.blinded_model_comparison",
    relation: "requires",
    label: "The ordinary-physics null includes the complete-apparatus gravitational upper-bound lane.",
    claimBoundaryNote: "A plate force or partial energy source cannot enter as gravitational weight.",
  },
  {
    id: "casimir_dp_registry_gates_bridge_comparison",
    from: "study.casimir_dp.manifold_kernel_registry",
    to: "study.casimir_dp.blinded_model_comparison",
    relation: "requires",
    label: "Only a bridge passing the fail-closed registry may enter the held-out comparison.",
    claimBoundaryNote: "A blocked registry excludes only the bridge lane; it does not block ordinary or named-DP diagnostics.",
  },
  {
    id: "casimir_dp_model_comparison_feeds_stage3_evidence_map",
    from: "study.casimir_dp.blinded_model_comparison",
    to: "study.casimir_dp.evidence_map_stage3",
    relation: "diagnostic_checks",
    label: "Held-out model states populate the machine-readable outcome-to-claim ledger.",
    claimBoundaryNote: "Not-disfavored within a powered region is not confirmation.",
  },
  {
    id: "casimir_dp_registry_feeds_stage3_evidence_map",
    from: "study.casimir_dp.manifold_kernel_registry",
    to: "study.casimir_dp.evidence_map_stage3",
    relation: "diagnostic_checks",
    label: "The registry contributes its deterministic first failure and bridge-admission state.",
    claimBoundaryNote: "Schema completeness is not empirical validation.",
  },
  {
    id: "casimir_dp_radiation_modes_feed_stage4_polarization",
    from: "physics.radiation.mode_context",
    to: "study.casimir_dp.polarization_resolved_qed_control",
    relation: "requires",
    label:
      "The Stage-4 polarization lane starts from the two-dimensional transverse radiation-mode space.",
    claimBoundaryNote:
      "TE/TM and RCP/LCP are bases of the same photon field space, not extra gravitational degrees of freedom.",
  },
  {
    id: "casimir_dp_quantum_field_state_feeds_stage4_polarization",
    from: "physics.radiation.quantum_field_state_context",
    to: "study.casimir_dp.polarization_resolved_qed_control",
    relation: "requires",
    label:
      "Jones coherency and Stokes state physicality feed the polarization-resolved QED control.",
    claimBoundaryNote:
      "A polarization state does not define a DP mass-density branch.",
  },
  {
    id: "casimir_dp_stage3_qed_feeds_stage4_polarization",
    from: "study.casimir_dp.qed_green_noise_budget",
    to: "study.casimir_dp.polarization_resolved_qed_control",
    relation: "requires",
    label:
      "Stage 4 resolves the Stage-3 QED material/Green response by polarization and mirror parity.",
    claimBoundaryNote:
      "The current reduced-order fixture remains synthetic and is not apparatus closure.",
  },
  {
    id: "casimir_dp_blackbody_reference_feeds_stage4_thermal",
    from: "solar.spectrum.blackbody_curve_reference",
    to: "study.casimir_dp.thermal_radiative_closure",
    relation: "diagnostic_checks",
    label:
      "The Planck spectrum provides a normalization benchmark for the Stage-4 thermal lane.",
    claimBoundaryNote:
      "The blackbody reference is a thermal benchmark, not a collapse bridge.",
  },
  {
    id: "casimir_dp_stefan_boltzmann_feeds_stage4_thermal",
    from: "solar.spectrum.stefan_boltzmann_luminosity",
    to: "study.casimir_dp.thermal_radiative_closure",
    relation: "diagnostic_checks",
    label:
      "Planck integration must recover the Stefan-Boltzmann flux normalization.",
    claimBoundaryNote:
      "Flux closure does not derive stellar structure or gravitational reduction.",
  },
  {
    id: "casimir_dp_thermal_population_feeds_stage4_thermal",
    from: "low_temp.radiation.thermal_population_floor",
    to: "study.casimir_dp.thermal_radiative_closure",
    relation: "requires",
    label:
      "Thermal occupation and zero-point separation feed the ordinary radiative-noise budget.",
    claimBoundaryNote:
      "Zero-point mode energy is not added to net thermal power.",
  },
  {
    id: "casimir_dp_energy_frequency_feeds_stage4_congruence",
    from: "physics.quantum.energy_frequency",
    to: "study.casimir_dp.tensor_dimensional_congruence",
    relation: "requires",
    label:
      "The congruence gate enforces h versus hbar and nu versus omega representations.",
    claimBoundaryNote:
      "A shared inverse-time dimension is not a transfer kernel.",
  },
  {
    id: "casimir_dp_frequency_gate_feeds_stage4_congruence",
    from: "study.casimir_dp.frequency_bridge_gate",
    to: "study.casimir_dp.tensor_dimensional_congruence",
    relation: "requires",
    label:
      "The Compton/DP/cavity non-bridge is made machine-checkable by semantic quantity identities.",
    claimBoundaryNote:
      "The synthetic result is same_dimension_not_connected.",
  },
  {
    id: "casimir_dp_manifold_registry_feeds_stage4_congruence",
    from: "study.casimir_dp.manifold_kernel_registry",
    to: "study.casimir_dp.tensor_dimensional_congruence",
    relation: "requires",
    label:
      "Tensor, gauge, conservation, covariance, and causal-chain fields are checked before any bridge comparison.",
    claimBoundaryNote:
      "Registered congruence emits no numerical bridge rate and is not empirical validation.",
  },
  {
    id: "casimir_dp_stage3_evidence_map_feeds_stage4",
    from: "study.casimir_dp.evidence_map_stage3",
    to: "study.casimir_dp.polarization_congruence_stage4",
    relation: "requires",
    label:
      "Stage 4 hash-links the immutable Stage-3 report, receipt, config, and verification receipt.",
    claimBoundaryNote:
      "Stage 4 cannot rewrite or promote Stage-3 scientific gates.",
  },
  {
    id: "casimir_dp_stage4_polarization_feeds_campaign",
    from: "study.casimir_dp.polarization_resolved_qed_control",
    to: "study.casimir_dp.polarization_congruence_stage4",
    relation: "requires",
    label:
      "Polarization-resolved ordinary-QED predictions enter the expanded null.",
    claimBoundaryNote:
      "A nonzero ordinary optical double contrast is not collapse.",
  },
  {
    id: "casimir_dp_stage4_thermal_feeds_campaign",
    from: "study.casimir_dp.thermal_radiative_closure",
    to: "study.casimir_dp.polarization_congruence_stage4",
    relation: "requires",
    label:
      "Thermal/FDT power, recoil, heating, noise, decoherence, and covariance enter the expanded null.",
    claimBoundaryNote:
      "Near- and far-field lanes are mutually exclusive in one prediction cell.",
  },
  {
    id: "casimir_dp_stage4_congruence_gates_campaign",
    from: "study.casimir_dp.tensor_dimensional_congruence",
    to: "study.casimir_dp.polarization_congruence_stage4",
    relation: "requires",
    label:
      "The model comparator runs only after unit, semantic, tensor, and representation congruence passes.",
    claimBoundaryNote:
      "Congruence is necessary for comparison but does not validate a mechanism.",
  },
  {
    id: "casimir_dp_stage4_campaign_documents_claim_boundary",
    from: "study.casimir_dp.polarization_congruence_stage4",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label:
      "The Stage-4 outcome map preserves the least-mature claim ceiling of every lane.",
    claimBoundaryNote:
      "The graph-wide maximum remains diagnostic: the synthetic blinding contract passes only by proving that no custodian receipt, mapping, measured comparison, or unblinding exists or is authorized.",
  },
  {
    id: "casimir_dp_stage4_campaign_requires_stage4_1_qed_scale_calibration",
    from: "study.casimir_dp.polarization_congruence_stage4",
    to: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    relation: "requires",
    label:
      "Stage 4.1 consumes the immutable Stage-4 authority and preserves its Compton/DP/cavity semantic non-bridge.",
    claimBoundaryNote:
      "A successful identity calibration cannot rewrite or promote any Stage-4 scientific gate.",
  },
  {
    id: "casimir_dp_stage4_congruence_requires_stage4_1_qed_scale_calibration",
    from: "study.casimir_dp.tensor_dimensional_congruence",
    to: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    relation: "requires",
    label:
      "The Stage-4.1 QED hierarchy inherits explicit h versus hbar, nu versus omega, dimensional, semantic, and namespace conventions.",
    claimBoundaryNote:
      "Algebraic congruence is not a sourced transfer kernel or mechanism.",
  },
  {
    id: "casimir_dp_atomic_electronic_context_requires_stage4_1_qed_scale_calibration",
    from: "physics.atomic.electronic_level_structure_context",
    to: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    relation: "requires",
    label:
      "Atomic electronic-level context bounds the Rydberg identity and the leading-order reduced-mass hydrogen scale.",
    claimBoundaryNote:
      "The leading-order identity does not replace precision spectroscopy or its correction ledger.",
  },
  {
    id: "casimir_dp_stage4_1_qed_scale_calibration_documents_claim_boundary",
    from: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label:
      "The source-backed QED identity calibration records its reduced-order maximum claim and every semantic nonclaim.",
    claimBoundaryNote:
      "The maximum claim is qed_scale_identity_calibration; measured, collapse, manifold, and viability claims remain unavailable.",
  },
  {
    id: "casimir_dp_stage4_2a_mass_anchor_requires_stage4_1_qed_calibration",
    from: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    to: "study.casimir_dp.qed_scale_hierarchy_stage4_1",
    relation: "requires",
    label:
      "Stage 4.2A consumes the immutable Stage-4.1 mass, h/hbar, nu/omega, alpha_fs, Compton, and Rydberg semantics without rewriting them.",
    claimBoundaryNote:
      "A downstream mass-provenance and Yukawa replay cannot promote the upstream QED identity calibration.",
  },
  {
    id: "casimir_dp_stage4_2a_mass_anchor_requires_planck_solar_calibration",
    from: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    to: "study.casimir_dp.planck_solar_calibration_stage4_2a",
    relation: "diagnostic_checks",
    label:
      "The composite campaign co-reports independent mass and radiometric sibling lanes under one claim ledger.",
    claimBoundaryNote:
      "Neither sibling requires the other's physics output; shared constants and reporting do not make them independent votes for a mechanism.",
  },
  {
    id: "casimir_dp_frequency_gate_requires_stage4_2a_mass_semantics",
    from: "study.casimir_dp.frequency_bridge_gate",
    to: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    relation: "requires",
    label:
      "The blocked frequency bridge uses the traceable rest-mass and tree-anchor semantics before evaluating any future sourced kernel.",
    claimBoundaryNote:
      "Compton rest-energy bookkeeping remains distinct from a physical oscillator, cavity mode, or collapse clock.",
  },
  {
    id: "casimir_dp_stage4_2a_mass_anchor_documents_claim_boundary",
    from: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label:
      "The mass/Higgs runtime records correlated provenance, upper-bound-only collider evidence, and a zero-bridge claim ceiling.",
    claimBoundaryNote:
      "The maximum claim is a diagnostic metrology replay and conditional Standard Model tree mapping.",
  },
  {
    id: "casimir_dp_stage4_2a_planck_solar_requires_stage4_thermal_conventions",
    from: "study.casimir_dp.planck_solar_calibration_stage4_2a",
    to: "study.casimir_dp.thermal_radiative_closure",
    relation: "diagnostic_checks",
    label:
      "The independently frozen radiometric lane is compared against the Stage-4 Planck, h/hbar, nu/omega, and far-field conventions.",
    claimBoundaryNote:
      "This is a convention cross-check, not a hash-linked Stage-4 authority dependency, and it imports no apparatus heat-transfer or decoherence output.",
  },
  {
    id: "casimir_dp_solar_reference_checks_stage4_2a_planck_solar_calibration",
    from: "solar.spectrum.stefan_boltzmann_luminosity",
    to: "study.casimir_dp.planck_solar_calibration_stage4_2a",
    relation: "diagnostic_checks",
    label:
      "The IAU luminosity-radius effective-temperature identity checks the bolometric lane while TSIS supplies a distinct spectrum-shape lane.",
    claimBoundaryNote:
      "Color and bolometric effective temperatures are operationally different and their agreement is not a DP observable.",
  },
  {
    id: "casimir_dp_stage4_2a_planck_solar_documents_claim_boundary",
    from: "study.casimir_dp.planck_solar_calibration_stage4_2a",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label:
      "The radiometric runtime preserves source overlap, temperature vocabulary, and every thermal-to-collapse nonclaim.",
    claimBoundaryNote:
      "Shared h, energy, frequency, or inverse-time dimensions do not register a thermal-to-DP bridge.",
  },
  {
    id: "casimir_dp_stage4_2a_mass_anchor_feeds_stage4_2b_apparatus_forecast",
    from: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "requires",
    label:
      "Stage 4.2B inherits traceable mass, unit, and energy-frequency semantics while transporting complete object density rather than reconstructing bulk mass from the electron scale.",
    claimBoundaryNote:
      "Parameter provenance is not a Higgs, Compton, Casimir, DP, collapse, or manifold transfer mechanism.",
  },
  {
    id: "casimir_dp_stage4_thermal_feeds_stage4_2b_apparatus_forecast",
    from: "study.casimir_dp.thermal_radiative_closure",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "requires",
    label:
      "Response-corrected apparatus thermometry and ordinary radiative decoherence inherit the frozen Planck/FDT and zero-point-separation conventions.",
    claimBoundaryNote:
      "The Stage-4.2B thermometry lane is synthetic and cannot satisfy measured apparatus thermal closure.",
  },
  {
    id: "casimir_dp_mass_density_branch_difference_feeds_stage4_2b_dp_forecast",
    from: "collapse.objective.mass_density_branch_difference",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "requires",
    label:
      "The named DP forecast requires complete object and joint-system branch-density receipts before evaluating E_G over a frozen mass, geometry, separation, and hold-time grid.",
    claimBoundaryNote:
      "Design-class branch preparation cannot satisfy the experimental-equivalence or measured-evidence gate.",
  },
  {
    id: "casimir_dp_named_companion_checks_stage4_2b_dp_forecast",
    from: "study.casimir_dp.dp_companion_signature",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "diagnostic_checks",
    label:
      "The Stage-4.2B frozen DP rate is reconciled with the separately powered applicable companion and the immutable Stage-3 parameter manifest.",
    claimBoundaryNote:
      "An unpowered companion permits compatibility or exclusion language only and cannot support a named-DP identification.",
  },
  {
    id: "casimir_dp_qed_green_noise_feeds_stage4_2b_apparatus_forecast",
    from: "study.casimir_dp.qed_green_noise_budget",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "requires",
    label:
      "The residual forecast extends the ordinary QED mean/noise budget with sensor-forward response, self-noise separation, and full cross-spectral/shared-calibration covariance.",
    claimBoundaryNote:
      "Mean Casimir pressure or a raw sensor PSD cannot substitute for a measured disturbance-to-coherence noise kernel.",
  },
  {
    id: "casimir_dp_stage3_model_comparison_feeds_stage4_2b_power_gate",
    from: "study.casimir_dp.blinded_model_comparison",
    to: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    relation: "requires",
    label:
      "Stage 4.2B freezes the ordinary, named-DP, and separately registered bridge prediction vectors before forecasting held-out identifiability and power.",
    claimBoundaryNote:
      "Synthetic recovery and a software power forecast are not a physical blind, measured residual, or model preference from nature.",
  },
  {
    id: "casimir_dp_stage4_2b_missing_bridge_blocks_claim_boundary",
    from: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label:
      "Synthetic-only evidence, an underpowered frozen apparatus, absent measured preparation and covariance, and a missing numerical boundary-to-coherence kernel block physical promotion.",
    claimBoundaryNote:
      "The maximum current claim is an apparatus power and identifiability forecast; measured evidence is not ready, collapse and manifold dynamics are blocked, and physical viability is not evaluated.",
  },
  {
    id: "casimir_dp_stage4_2b_no_go_requires_stage4_2c_redesign",
    from: "study.casimir_dp.apparatus_coherence_residual_stage4_2b",
    to: "study.casimir_dp.identifiability_redesign_stage4_2c",
    relation: "requires",
    label:
      "Stage 4.2C must recover the immutable Stage-4.2B signature-identifiability no-go before admitting numerical control responses or scoring a bounded redesign.",
    claimBoundaryNote:
      "The redesign may not reinterpret the Stage-4.2B no-go as a DP exclusion or replace its content-addressed authority.",
  },
  {
    id: "casimir_dp_stage4_thermal_requires_stage4_2c_control_response",
    from: "study.casimir_dp.thermal_radiative_closure",
    to: "study.casimir_dp.identifiability_redesign_stage4_2c",
    relation: "requires",
    label:
      "The Stage-4.2C temperature control compiles a numerical complex-coherence response in the same frozen Planck/FDT convention used by the ordinary thermal lane.",
    claimBoundaryNote:
      "Its numerical response and covariance are design assumptions and cannot satisfy measured thermal closure.",
  },
  {
    id: "casimir_dp_named_companion_checks_stage4_2c_powered_region",
    from: "study.casimir_dp.dp_companion_signature",
    to: "study.casimir_dp.identifiability_redesign_stage4_2c",
    relation: "diagnostic_checks",
    label:
      "The bounded redesign retains the unchanged registered DP generator and requires the separately powered companion SNR gate.",
    claimBoundaryNote:
      "A powered synthetic companion and candidate do not demonstrate state preparation, DP collapse, or a Casimir modifier.",
  },
  {
    id: "casimir_dp_stage4_2c_missing_measurement_blocks_claim_boundary",
    from: "study.casimir_dp.identifiability_redesign_stage4_2c",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label:
      "Authentic control response, covariance, state preparation, confirmatory data, and independent replication remain absent even though one bounded synthetic region passes the design gates.",
    claimBoundaryNote:
      "The maximum claim is a bounded synthetic redesign and acquisition budget; physical pilot readiness and measured evidence remain not_ready.",
  },
  {
    id: "casimir_dp_stage4_2c_requires_stage4_2d_cross_scale_metrology",
    from: "study.casimir_dp.identifiability_redesign_stage4_2c",
    to: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    relation: "requires",
    label:
      "Stage 4.2D consumes the immutable selected-candidate and open empirical-status ledger before adding calibration and recovery checks.",
    claimBoundaryNote:
      "The downstream recovery campaign may not rewrite the Stage-4.2C DP generator, apparatus forecast, or scientific standing.",
  },
  {
    id: "casimir_dp_stage4_thermal_checks_stage4_2d_blackbody_stark",
    from: "study.casimir_dp.thermal_radiative_closure",
    to: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    relation: "diagnostic_checks",
    label:
      "The blackbody dynamic-Stark witness checks an electromagnetic thermal-field calibration path against the existing thermal convention.",
    claimBoundaryNote:
      "A blackbody-induced spectral shift is an ordinary electromagnetic calibration observable, not a collapse rate.",
  },
  {
    id: "casimir_dp_stage4_2a_mass_anchor_checks_stage4_2d_units",
    from: "study.casimir_dp.electron_mass_higgs_anchor_stage4_2a",
    to: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    relation: "diagnostic_checks",
    label:
      "The traceable mass and constant namespace checks the Stage-4.2D energy-frequency and gravitational unit conventions.",
    claimBoundaryNote:
      "Shared constants and dimensions are not independent votes for DP or a Higgs-to-collapse mechanism.",
  },
  {
    id: "casimir_dp_stage4_2d_nonbridge_blocks_claim_boundary",
    from: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label:
      "Unmeasured witness response, an absent witness-to-coherence transfer, synthetic recovery fixtures, and zero registered boundary-to-collapse kernels block physical promotion.",
    claimBoundaryNote:
      "The maximum claim is spectroscopic field metrology and classical-gravity recovery only; measured evidence remains not_ready and collapse/manifold claims remain blocked.",
  },
  {
    id: "casimir_dp_stage4_2d_requires_stage4_2e_causal_congruence",
    from: "study.casimir_dp.cross_scale_metrology_stage4_2d",
    to: "study.casimir_dp.causal_cone_clock_stage4_2e",
    relation: "requires",
    label:
      "Stage 4.2E consumes immutable Stage-4.2D calibration and recovery evidence before checking the apparatus notation against ADM null cones, timelike clocks, and conventional null propagation.",
    claimBoundaryNote:
      "Causal consistency does not create a Casimir-to-DP transfer kernel or measured collapse evidence.",
  },
  {
    id: "casimir_dp_semiclassical_baseline_checks_stage4_2e_tensor_screen",
    from: "study.casimir_dp.casimir_gravity_upper_bound",
    to: "study.casimir_dp.causal_cone_clock_stage4_2e",
    relation: "diagnostic_checks",
    label:
      "The ideal parallel-plate stress-energy scale is screened through semiclassical curvature dimensions before any apparatus metric claim is considered.",
    claimBoundaryNote:
      "A scalar ideal-cavity screen is not a complete, renormalized apparatus stress tensor or solved metric.",
  },
  {
    id: "casimir_dp_stage4_2e_nonbridge_blocks_claim_boundary",
    from: "study.casimir_dp.causal_cone_clock_stage4_2e",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label:
      "Missing complete-apparatus metric response, missing measured light-path/clock data, and the absence of a registered boundary-to-collapse kernel block physical promotion.",
    claimBoundaryNote:
      "The maximum claim is causal-geometry recovery and scale separation only; QED propagation, GR curvature, and DP collapse remain distinct signature lanes.",
  },
  {
    id: "casimir_dp_stage4_missing_numeric_bridge_blocks_claims",
    from: "study.casimir_dp.tensor_dimensional_congruence",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label:
      "A schema-congruent but non-numerical bridge blocks collapse and manifold-mechanism claims.",
    claimBoundaryNote:
      "same_dimension_not_connected is a successful non-bridge result.",
  },
  {
    id: "casimir_dp_stage3_comparison_blocks_claims",
    from: "study.casimir_dp.blinded_model_comparison",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "Missing measured held-out data, power, or identifiability blocks confirmatory physical claims.",
    claimBoundaryNote: "Synthetic model recovery is a software result only.",
  },
  {
    id: "casimir_dp_stage3_registry_blocks_manifold_claims",
    from: "study.casimir_dp.manifold_kernel_registry",
    to: "study.casimir_dp.claim_boundary",
    relation: "blocks",
    label: "An incomplete tensor/noise-to-coherence registry blocks every manifold-mechanism claim.",
    claimBoundaryNote: "No numerical bridge rate is emitted while blocked.",
  },
  {
    id: "casimir_dp_stage3_evidence_map_documents_claim_boundary",
    from: "study.casimir_dp.evidence_map_stage3",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label: "The Stage-3 outcome map carries each lane's least-mature maximum claim.",
    claimBoundaryNote: "The graph-wide maximum remains diagnostic.",
  },
  {
    id: "casimir_dp_protocol_documents_claim_boundary",
    from: "study.casimir_dp.protocol",
    to: "study.casimir_dp.claim_boundary",
    relation: "documents",
    label: "Every run receipt carries the study claim boundary.",
    claimBoundaryNote: "The maximum claim tier remains diagnostic.",
  },
];

export function buildCasimirDpStudyTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: CASIMIR_DP_STUDY_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: CASIMIR_DP_STUDY_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
