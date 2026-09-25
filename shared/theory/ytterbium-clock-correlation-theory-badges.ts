import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const proposal = "docs/research/ytterbium-energy-spin-gravitational-clock-proposal.md";
const boundary: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const common = {
  subjects: ["ytterbium_171", "optical_clock", "gravitational_redshift", "energy_spin_correlation"],
  simulationOwners: ["ytterbium_clock_correlation_proposal"],
  equationFamilies: ["weak_field_clock_redshift", "distributed_clock_correlation"],
  sourceRefs: [
    { kind: "doc" as const, path: proposal, note: "Standalone experimental proposal; analytic design only." },
    { kind: "repo_module" as const, path: "shared/theory/ytterbium-clock-proposal-calculation.ts", note: "Analytic weak-field signal and ideal response calculations." },
    { kind: "artifact" as const, path: "docs/research/ytterbium-clock-proposal-calculations.json", note: "Generated design numbers used by the proposal and presentation." },
    { kind: "test" as const, path: "tests/ytterbium-clock-proposal-calculation.spec.ts", note: "Focused arithmetic and control-model checks." },
    { kind: "literature_ref" as const, id: "doi:10.1038/s41566-020-0619-8", note: "Conventional tower-clock precedent, using strontium." },
    { kind: "literature_ref" as const, id: "doi:10.1038/s41586-022-05088-z", note: "Remote entangled-clock component precedent, using strontium ions." },
  ],
  claimBoundary: boundary,
};

export const YTTERBIUM_CLOCK_CORRELATION_BADGES: TheoryBadgeV1[] = [
  {
    ...common,
    id: "clock.yb171.terrestrial_redshift_prediction",
    title: "Yb-171 Terrestrial Clock Redshift Prediction",
    plainMeaning: "Predicts the differential optical-clock frequency and phase from an independently surveyed potential difference.",
    whyItMatters: "This is the conventional reference against which the correlated preparations are compared.",
    level: "derived_relation",
    status: "review",
    tags: ["experimental_proposal", "analytic_benchmark", "no_measured_result"],
    equations: [
      { id: "yb171_weak_field_redshift", role: "law", displayLatex: "\\Delta\\nu/\\nu_0=\\Delta U/c^2", computableExpression: null, operatorKind: "noncomputable_reference", inputSymbols: ["nu_0", "Delta_U", "c"], outputSymbols: ["Delta_nu"] },
      { id: "yb171_gravitational_phase", role: "transform", displayLatex: "x_{\\rm GR}=2\\pi\\nu_0\\Delta U T/c^2", computableExpression: null, operatorKind: "noncomputable_reference", inputSymbols: ["nu_0", "Delta_U", "T", "c"], outputSymbols: ["x_GR"] },
    ],
    units: [
      { symbol: "Delta_U", unit: "m^2/s^2", quantity: "potential_difference", dimensionSignature: "L^2 T^-2" },
      { symbol: "Delta_nu", unit: "Hz", quantity: "differential_clock_frequency", dimensionSignature: "T^-1" },
      { symbol: "x_GR", unit: "rad", quantity: "relative_clock_phase", dimensionSignature: "1" },
    ],
    assumptions: ["Stationary weak-field illustration; real analysis uses a consistent terrestrial frame and independently determined potential.", "The numerical benchmark is not a measured clock result."],
    calculatorPayloads: [],
    hintKeys: { subjects: ["Yb-171 tower clock", "building-scale gravitational redshift"], symbols: ["Delta_U", "Delta_nu", "x_GR"], unitSignatures: ["L^2 T^-2", "T^-1", "1"], repoPaths: [proposal,"shared/theory/ytterbium-clock-proposal-calculation.ts","docs/research/ytterbium-clock-proposal-calculations.json"], equationFamilies: ["weak_field_clock_redshift"], simulationOwners: ["ytterbium_clock_correlation_proposal"] },
  },
  {
    ...common,
    id: "clock.yb171.opposite_energy_spin_preparations",
    title: "Opposite Energy–Spin Clock Preparations",
    plainMeaning: "Defines two distributed single-excitation states with reversed association between optical energy and nuclear spin.",
    whyItMatters: "The paired preparations ask whether the inferred gravitational response depends on that internal correlation.",
    level: "model",
    status: "review",
    tags: ["experimental_proposal", "distributed_entanglement", "bell_coherence_required", "not_spatial_center_of_mass_superposition"],
    equations: [
      { id: "yb171_single_excitation_phase", role: "definition", displayLatex: "x_s=(\\Delta E_s/\\hbar)\\Delta\\tau", computableExpression: null, operatorKind: "noncomputable_reference", inputSymbols: ["Delta_E_s", "Delta_tau"], outputSymbols: ["x_s"] },
    ],
    units: [
      { symbol: "Delta_E_s", unit: "J", quantity: "spectroscopic_gap_for_encoding", dimensionSignature: "M L^2 T^-2" },
      { symbol: "Delta_tau", unit: "s", quantity: "proper_time_difference", dimensionSignature: "T" },
      { symbol: "x_s", unit: "rad", quantity: "correlation_phase", dimensionSignature: "1" },
    ],
    assumptions: ["Each encoding's actual spectroscopic gap and state-dependent shifts must be measured.", "Complementary-basis measurements must verify Bell coherence; the integrated building-scale ytterbium system is not demonstrated."],
    calculatorPayloads: [],
    hintKeys: { subjects: ["Yb-171 energy-spin correlation", "distributed entangled optical clocks"], symbols: ["Delta_E_s", "Delta_tau", "x_s"], unitSignatures: ["M L^2 T^-2", "T", "1"], repoPaths: [proposal,"shared/theory/ytterbium-clock-proposal-calculation.ts"], equationFamilies: ["distributed_clock_correlation"], simulationOwners: ["ytterbium_clock_correlation_proposal"] },
  },
  {
    ...common,
    id: "clock.yb171.dimensionless_response_test",
    title: "Clock Correlation Dimensionless Response Test",
    plainMeaning: "Compares the classical redshift coefficient with the mean and half-difference of two quantum-encoding responses.",
    whyItMatters: "It states the falsifiable output: standard evolution predicts kappa_cl and kappa_0 equal to one and eta_ES equal to zero.",
    level: "diagnostic_gate",
    status: "review",
    tags: ["experimental_proposal", "unacquired", "identifiability_gate", "no_new_constant_claim"],
    equations: [
      { id: "yb171_response_coefficients", role: "definition", displayLatex: "\\kappa_0=(\\kappa_++\\kappa_-)/2,\\quad\\eta_{ES}=(\\kappa_+-\\kappa_-)/2", computableExpression: null, operatorKind: "noncomputable_reference", inputSymbols: ["kappa_plus", "kappa_minus"], outputSymbols: ["kappa_0", "eta_ES"] },
      { id: "yb171_standard_response_target", role: "gate", displayLatex: "(\\kappa_{\\rm cl},\\kappa_0,\\eta_{ES})=(1,1,0)", computableExpression: null, operatorKind: "gate_status", inputSymbols: ["kappa_cl", "kappa_0", "eta_ES", "covariance", "evidence_class"], outputSymbols: ["response_gate"] },
    ],
    units: [
      { symbol: "kappa_cl", unit: null, quantity: "classical_gravitational_response", dimensionSignature: "1" },
      { symbol: "kappa_0", unit: null, quantity: "mean_quantum_gravitational_response", dimensionSignature: "1" },
      { symbol: "eta_ES", unit: null, quantity: "energy_spin_response_half_difference", dimensionSignature: "1" },
    ],
    assumptions: ["Potential and spectroscopy are determined independently of the response fit.", "A height scan and calibrated field controls are required to identify the gravitational slope.", "No result or apparatus certificate exists; this badge cannot promote an unexplained residual to a mechanism claim."],
    calculatorPayloads: [],
    hintKeys: { subjects: ["dimensionless gravitational response", "Yb-171 energy-spin experimental proposal"], symbols: ["kappa_cl", "kappa_0", "eta_ES"], unitSignatures: ["1"], repoPaths: [proposal,"shared/theory/ytterbium-clock-proposal-calculation.ts","tests/ytterbium-clock-proposal-calculation.spec.ts"], equationFamilies: ["distributed_clock_correlation"], simulationOwners: ["ytterbium_clock_correlation_proposal"] },
  },
];

export const YTTERBIUM_CLOCK_CORRELATION_EDGES: TheoryBadgeEdgeV1[] = [
  { id: "yb171_prediction_required_by_preparations", from: "clock.yb171.opposite_energy_spin_preparations", to: "clock.yb171.terrestrial_redshift_prediction", relation: "requires", label: "The quantum phase needs an independently predicted proper-time baseline.", claimBoundaryNote: "A theoretical baseline is not a measured result." },
  { id: "yb171_inference_requires_preparations", from: "clock.yb171.dimensionless_response_test", to: "clock.yb171.opposite_energy_spin_preparations", relation: "requires", label: "Both verified correlation encodings are needed for the response half-difference.", claimBoundaryNote: "Unverified state preparation cannot satisfy the measurement gate." },
  { id: "yb171_inference_requires_redshift", from: "clock.yb171.dimensionless_response_test", to: "clock.yb171.terrestrial_redshift_prediction", relation: "requires", label: "The response fit requires independent potential and conventional-clock references.", claimBoundaryNote: "Avoid defining the potential from the tested clock signal." },
];
