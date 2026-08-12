// math-stage: diagnostic
import type {
  TheoryBadgeClaimBoundaryV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeObservableV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const KHI_CONTRACT = "shared/contracts/solar-khi-observation.v1.ts";
const KHI_ANALYSIS = "server/services/essence/solar-khi-analysis.ts";
const KHI_INGEST = "tools/dkist_fastcam_ingest.py";
const MODEL_REGISTRY = "server/services/vision/solar-model-registry.ts";
const NATURE_PAPER = "10.1038/s41586-026-10871-3";

const DIAGNOSTIC_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const sourceRefs: TheoryBadgeV1["sourceRefs"] = [
  { kind: "repo_module", path: KHI_CONTRACT, id: "khi-contract", note: "Typed native-resolution observation and measurement contract." },
  { kind: "repo_module", path: KHI_ANALYSIS, id: "khi-analysis", note: "Deterministic boundary measurement authority." },
  { kind: "repo_module", path: KHI_INGEST, id: "khi-ingest", note: "MFBD/speckle provenance-preserving ingest." },
  { kind: "repo_module", path: MODEL_REGISTRY, id: "solar-model-registry", note: "Instrument/scale/task-aware model routing." },
  { kind: "literature_ref", id: NATURE_PAPER, note: "Observed photospheric magnetized KHI ranges and MURaM comparison." },
];

const observable = (
  id: string,
  symbol: string,
  quantity: string,
  mathematicalType: TheoryBadgeObservableV1["mathematicalType"],
  unit: string | null,
  dimensionSignature: string | null,
  operationalDefinitionRef = KHI_ANALYSIS,
  responseModelRef: string | null = null,
): TheoryBadgeObservableV1 => ({
  id,
  canonicalObservableId: id,
  symbol,
  quantity,
  mathematicalType,
  unit,
  dimensionSignature,
  coordinateFrame: "DKIST FastCam native pixel grid registered to helioprojective coordinates",
  operationalDefinitionRef,
  responseModelRef,
});

const base = (args: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  subjects: string[];
  level: TheoryBadgeV1["level"];
  status: TheoryBadgeV1["status"];
  equationFamily: string;
  tags: string[];
  equations: TheoryBadgeV1["equations"];
  units: TheoryBadgeV1["units"];
  assumptions: string[];
  symbols: string[];
  observables?: TheoryBadgeObservableV1[];
  scale: { characteristic: number | null; min: number | null; max: number | null; basis: "measured" | "derived" | "model_assumption" | "heuristic" };
}): TheoryBadgeV1 => ({
  id: args.id,
  title: args.title,
  plainMeaning: args.plainMeaning,
  whyItMatters: args.whyItMatters,
  subjects: args.subjects,
  level: args.level,
  status: args.status,
  simulationOwners: ["starsim", "solar_khi"],
  equationFamilies: [args.equationFamily],
  tags: args.tags,
  equations: args.equations,
  units: args.units,
  assumptions: [
    ...args.assumptions,
    "The row is diagnostic and cannot by itself establish a cross-scale causal mechanism.",
    "Quantum-amplitude, mode-phase, morphological, cross-spectral, topological, and predictive coherence are not interchangeable.",
  ],
  calculatorPayloads: [],
  sourceRefs,
  scaleEnvelope: {
    characteristicLog10M: args.scale.characteristic,
    minLog10M: args.scale.min,
    maxLog10M: args.scale.max,
    basis: args.scale.basis,
    sourceRefs: [sourceRefs[4]],
  },
  observables: args.observables ?? [],
  hintKeys: {
    subjects: args.subjects,
    symbols: args.symbols,
    unitSignatures: args.units.flatMap((unit) => unit.dimensionSignature ? [unit.dimensionSignature] : []),
    repoPaths: [KHI_CONTRACT, KHI_ANALYSIS, KHI_INGEST, MODEL_REGISTRY],
    equationFamilies: [args.equationFamily],
    simulationOwners: ["starsim", "solar_khi"],
  },
  claimBoundary: DIAGNOSTIC_BOUNDARY,
});

export const SOLAR_KHI_NANOFLARE_THEORY_BADGES: TheoryBadgeV1[] = [
  base({
    id: "stellar.energy.surface_transport_balance",
    title: "Stellar Surface Energy-Transport Balance",
    plainMeaning: "Separates radiative, convective, kinetic, and magnetic energy flux near the stellar surface.",
    whyItMatters: "It is the slow-scale physical bridge from core luminosity to magnetoconvective boundary conditions, not a quantum-phase bridge.",
    subjects: ["stellar", "solar", "energy_transport", "magnetoconvection"],
    level: "derived_relation",
    status: "project_derived",
    equationFamily: "stellar_surface_transport_balance",
    tags: ["fusion_boundary_condition", "energy_transport", "no_quantum_phase_transport"],
    equations: [{ id: "surface_flux_balance", role: "law", displayLatex: "\\mathbf F_{total}=\\mathbf F_{rad}+\\mathbf F_{conv}+\\mathbf F_{kin}+\\mathbf F_{mag}", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["F_rad", "F_conv", "F_kin", "F_mag"], outputSymbols: ["F_total"] }],
    units: [{ symbol: "F_total", unit: "W/m^2", quantity: "energy_flux", dimensionSignature: "M T^-3" }],
    assumptions: ["Fusion luminosity enters only as a slow structural boundary condition."],
    symbols: ["F_total", "F_rad", "F_conv", "F_kin", "F_mag"],
    scale: { characteristic: 8.84, min: 8, max: 9, basis: "model_assumption" },
  }),
  base({
    id: "solar.photosphere.magnetic_boundary_shear",
    title: "Photospheric Magnetic-Boundary Shear",
    plainMeaning: "Records the traced granule/magnetic-element interface, shear thickness, velocity contrast, and field orientation.",
    whyItMatters: "These are the admission observables for a KHI interpretation.",
    subjects: ["solar", "photosphere", "magnetic_boundary", "velocity_shear"],
    level: "diagnostic_gate",
    status: "diagnostic",
    equationFamily: "magnetic_boundary_shear",
    tags: ["boundary_spine", "shear", "native_resolution"],
    equations: [{ id: "boundary_velocity_shear", role: "definition", displayLatex: "\\Delta U=|\\mathbf v_1-\\mathbf v_2|", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["v_1", "v_2", "d"], outputSymbols: ["Delta_U"] }],
    units: [{ symbol: "Delta_U", unit: "m/s", quantity: "velocity_contrast", dimensionSignature: "L T^-1" }, { symbol: "d", unit: "m", quantity: "shear_thickness", dimensionSignature: "L" }],
    assumptions: ["A sharp boundary and resolved temporal growth are required; brightness texture alone is insufficient."],
    symbols: ["Delta_U", "d", "B", "boundary_spine"],
    observables: [observable("khi_shear_thickness_m", "d", "shear_thickness", "scalar", "m", "L")],
    scale: { characteristic: 4.7, min: 4.3, max: 5.3, basis: "measured" },
  }),
  base({
    id: "solar.photosphere.khi_growth_observable",
    title: "Photospheric KHI Growth Observable",
    plainMeaning: "Measures repeated boundary corrugations, exponential growth, and propagation in native FastCam time series.",
    whyItMatters: "It reproduces the paper's numerical observables without granting a caption model measurement authority.",
    subjects: ["solar", "photosphere", "kelvin_helmholtz", "temporal_tracking"],
    level: "diagnostic_gate",
    status: "canonical_reference",
    equationFamily: "khi_growth_measurement",
    tags: ["wavelength", "growth_rate", "phase_speed", "morphological_persistence"],
    equations: [{ id: "khi_exponential_growth", role: "definition", displayLatex: "A(t)=A_0 e^{\\gamma_{KH}t}", computableExpression: null, operatorKind: "residual", inputSymbols: ["A_0", "gamma_KH", "t"], outputSymbols: ["A_t"] }],
    units: [{ symbol: "lambda_KH", unit: "m", quantity: "wavelength", dimensionSignature: "L" }, { symbol: "gamma_KH", unit: "s^-1", quantity: "growth_rate", dimensionSignature: "T^-1" }, { symbol: "v_ph", unit: "m/s", quantity: "phase_speed", dimensionSignature: "L T^-1" }],
    assumptions: ["Detection and tracking occur at native resolution before any reduced overlay is generated.", "MFBD and speckle agreement is a robustness gate."],
    symbols: ["lambda_KH", "gamma_KH", "v_ph", "A_t"],
    observables: [
      observable("khi_wavelength_m", "lambda_KH", "khi_wavelength", "distribution", "m", "L"),
      observable("khi_growth_rate_s_inv", "gamma_KH", "khi_growth_rate", "distribution", "s^-1", "T^-1"),
      observable("khi_phase_speed_m_s", "v_ph", "khi_phase_speed", "distribution", "m/s", "L T^-1"),
      observable("boundary_curvature_rms_m_inv", "kappa_rms", "boundary_curvature_rms", "scalar", "m^-1", "L^-1"),
      observable("boundary_track_persistence", "P_track", "morphological_persistence", "scalar", null, "1"),
    ],
    scale: { characteristic: 4.81, min: 4.4, max: 5.23, basis: "measured" },
  }),
  base({
    id: "solar.photosphere.khi_turbulent_diffusivity",
    title: "KHI Turbulent-Diffusivity Proxy",
    plainMeaning: "Derives a mixing-scale diffusivity from resolved flow speed and KHI wavelength.",
    whyItMatters: "It expresses the thermodynamic mixing implication without turning 416 nm intensity into energy density.",
    subjects: ["solar", "photosphere", "khi", "mixing", "diffusivity"],
    level: "derived_relation",
    status: "project_derived",
    equationFamily: "khi_turbulent_diffusivity",
    tags: ["mixing", "low_entropy_plasma", "forward_model_required"],
    equations: [{ id: "khi_turbulent_diffusivity", role: "definition", displayLatex: "\\eta_{turb}=u\\lambda/3", computableExpression: null, operatorKind: "scalar_expression", inputSymbols: ["u", "lambda_KH"], outputSymbols: ["eta_turb"] }],
    units: [{ symbol: "eta_turb", unit: "m^2/s", quantity: "diffusivity", dimensionSignature: "L^2 T^-1" }],
    assumptions: ["The mixing-length relation is a derived proxy, not a direct calorimetric measurement."],
    symbols: ["eta_turb", "u", "lambda_KH"],
    observables: [observable("khi_turbulent_diffusivity_m2_s", "eta_turb", "turbulent_diffusivity", "scalar", "m^2/s", "L^2 T^-1")],
    scale: { characteristic: 4.81, min: 4.4, max: 5.23, basis: "derived" },
  }),
  base({
    id: "solar.mhd.footpoint_poynting_flux",
    title: "Magnetic-Footpoint Poynting Flux",
    plainMeaning: "Estimates vertical electromagnetic energy flux from registered magnetic and velocity fields.",
    whyItMatters: "It is the data-supported state variable that can connect boundary motion to coronal stressing.",
    subjects: ["solar", "mhd", "footpoint", "poynting_flux"],
    level: "model",
    status: "diagnostic",
    equationFamily: "mhd_poynting_flux",
    tags: ["magnetic_field_required", "velocity_field_required", "not_continuum_only"],
    equations: [{ id: "vertical_poynting_flux", role: "law", displayLatex: "S_z=[B^2v_z-(\\mathbf v\\cdot\\mathbf B)B_z]/\\mu_0", computableExpression: null, operatorKind: "field_sample", inputSymbols: ["B", "v", "B_z", "v_z", "mu_0"], outputSymbols: ["S_z"] }],
    units: [{ symbol: "S_z", unit: "W/m^2", quantity: "poynting_flux", dimensionSignature: "M T^-3" }],
    assumptions: ["Continuum-only FastCam frames cannot close this badge without magnetic/velocity context."],
    symbols: ["S_z", "B", "v", "B_z", "v_z"],
    observables: [observable("poynting_flux_W_m2", "S_z", "vertical_poynting_flux", "scalar", "W/m^2", "M T^-3")],
    scale: { characteristic: 5.5, min: 4.5, max: 7, basis: "model_assumption" },
  }),
  base({
    id: "solar.mhd.flux_braiding_proxy",
    title: "Solar Flux-Braiding Proxy",
    plainMeaning: "Combines winding, helicity injection, and current-density growth as a review-tier braiding diagnostic.",
    whyItMatters: "It leaves the proposed KHI-to-braiding step testable instead of asserting it as observed causation.",
    subjects: ["solar", "mhd", "flux_braiding", "helicity", "current_sheet"],
    level: "model",
    status: "review",
    equationFamily: "flux_braiding_proxy",
    tags: ["hypothesis", "helicity", "current_density", "falsifiable"],
    equations: [{ id: "helicity_injection", role: "noncomputable_reference", displayLatex: "\\dot H_R=\\mathcal H(\\mathbf A_p,\\mathbf B,\\mathbf v)", computableExpression: null, operatorKind: "region_aggregate", inputSymbols: ["A_p", "B", "v"], outputSymbols: ["Hdot_R"] }],
    units: [{ symbol: "Hdot_R", unit: "Wb^2/s", quantity: "helicity_injection", dimensionSignature: "M^2 L^4 T^-5 I^-2" }, { symbol: "A_J", unit: "m^2", quantity: "current_sheet_area", dimensionSignature: "L^2" }],
    assumptions: ["Support requires co-temporal magnetic observations; the FastCam movie alone is insufficient.", "A displaced or time-shuffled KHI field must lose any claimed association."],
    symbols: ["Hdot_R", "A_J", "winding", "J"],
    observables: [observable("helicity_injection_Wb2_s", "Hdot_R", "helicity_injection", "scalar", "Wb^2/s", "M^2 L^4 T^-5 I^-2"), observable("current_sheet_area_m2", "A_J", "current_sheet_area", "scalar", "m^2", "L^2")],
    scale: { characteristic: 6, min: 4.5, max: 8, basis: "heuristic" },
  }),
  base({
    id: "solar.nanoflare.event_population",
    title: "Spatial Nanoflare Event Population",
    plainMeaning: "Extends a scalar nanoflare power proxy into a provenance-bound catalogue of event times, locations, energies, and rates.",
    whyItMatters: "It supplies the later-event target needed for a leakage-safe predictive experiment.",
    subjects: ["solar", "nanoflare", "event_population", "coronal_heating"],
    level: "diagnostic_gate",
    status: "diagnostic",
    equationFamily: "nanoflare_event_population",
    tags: ["event_catalogue", "label_separation", "spatiotemporal"],
    equations: [{ id: "nanoflare_event_process", role: "definition", displayLatex: "P_{rec}(t)=\\sum_i E_i\\delta(t-t_i)+P_{continuous}", computableExpression: null, operatorKind: "region_aggregate", inputSymbols: ["E_i", "t_i", "P_continuous"], outputSymbols: ["P_rec"] }],
    units: [{ symbol: "nu_nano", unit: "s^-1", quantity: "nanoflare_rate", dimensionSignature: "T^-1" }, { symbol: "E_i", unit: "J", quantity: "nanoflare_energy", dimensionSignature: "M L^2 T^-2" }],
    assumptions: ["Event labels remain excluded from KHI feature construction.", "The three-minute FastCam sequence cannot establish a long-lag event population."],
    symbols: ["nu_nano", "E_i", "t_i", "P_rec"],
    observables: [observable("nanoflare_rate_s_inv", "nu_nano", "nanoflare_rate", "scalar", "s^-1", "T^-1"), observable("nanoflare_energy_J", "E_i", "nanoflare_energy", "distribution", "J", "M L^2 T^-2")],
    scale: { characteristic: 6, min: 4, max: 8, basis: "derived" },
  }),
  base({
    id: "solar.cross_scale.khi_nanoflare_gate",
    title: "KHI-to-Nanoflare Predictive Gate",
    plainMeaning: "Tests whether KHI features improve held-out nanoflare prediction beyond ordinary active-region controls.",
    whyItMatters: "This is the only promotion path for the proposed cross-scale edge, and it remains closed without unseen-region results and negative controls.",
    subjects: ["solar", "khi", "nanoflare", "predictive_dependence", "causal_gate"],
    level: "diagnostic_gate",
    status: "diagnostic",
    equationFamily: "khi_nanoflare_hazard_test",
    tags: ["out_of_sample", "no_label_leakage", "negative_controls", "predictive_not_causal"],
    equations: [{ id: "augmented_event_hazard", role: "gate", displayLatex: "\\log h_1=\\alpha_{AR}+\\boldsymbol\\beta_B\\cdot X_B+\\boldsymbol\\beta_{KH}\\cdot X_{KH}", computableExpression: null, operatorKind: "gate_status", inputSymbols: ["X_B", "X_KH", "h_0"], outputSymbols: ["h_1", "delta_skill"] }],
    units: [{ symbol: "delta_skill", unit: null, quantity: "out_of_sample_skill_gain", dimensionSignature: "1" }],
    assumptions: ["Promotion requires calibrated improvement on unseen active regions.", "Time-shuffled and spatially displaced KHI controls must remove the gain.", "Simulation reproduction and strict label separation are required.", "Passing establishes predictive dependence, not universal causation."],
    symbols: ["X_KH", "X_B", "h_0", "h_1", "delta_skill"],
    scale: { characteristic: null, min: 4.4, max: 8, basis: "heuristic" },
  }),
  base({
    id: "stellar.flux_rope.cat_branch_boundary",
    title: "Flux-Rope Cat-Branch Claim Boundary",
    plainMeaning: "Represents competing classical magnetic-topology branches and their inference entropy.",
    whyItMatters: "It permits a useful cat-rope visualization while blocking promotion to a physical quantum superposition.",
    subjects: ["stellar", "solar", "flux_rope", "topology", "claim_boundary"],
    level: "claim_boundary",
    status: "blocked",
    equationFamily: "classical_topology_branch_entropy",
    tags: ["classical_posterior", "topological_persistence", "quantum_claim_blocked"],
    equations: [{ id: "topology_branch_entropy", role: "definition", displayLatex: "H_{branch}=-\\sum_i p_i\\ln p_i", computableExpression: null, operatorKind: "region_aggregate", inputSymbols: ["p_i"], outputSymbols: ["H_branch"] }],
    units: [{ symbol: "H_branch", unit: null, quantity: "classical_branch_entropy", dimensionSignature: "1" }],
    assumptions: ["The probabilities are classical inference weights over magnetic topologies.", "No interference-sensitive observable between rope configurations is registered.", "H_branch is not an off-diagonal density-matrix element."],
    symbols: ["p_i", "H_branch", "rho_ij"],
    observables: [observable("topology_branch_entropy", "H_branch", "classical_topology_branch_entropy", "scalar", null, "1", KHI_CONTRACT)],
    scale: { characteristic: 7, min: 6, max: 8.5, basis: "model_assumption" },
  }),
];

export const SOLAR_KHI_NANOFLARE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  { id: "starsim_luminosity_requires_surface_transport", from: "stellar.energy.surface_transport_balance", to: "starsim.structure.luminosity_gradient", relation: "requires", label: "Surface transport requires the slow nuclear-luminosity and stellar-structure boundary condition.", claimBoundaryNote: "This transfers energy-budget context, never microscopic quantum phase." },
  { id: "surface_shear_requires_transport_context", from: "solar.photosphere.magnetic_boundary_shear", to: "stellar.energy.surface_transport_balance", relation: "requires", label: "Magnetoconvective shear requires a surface energy-transport context.", claimBoundaryNote: "Transport context does not determine a particular observed vortex." },
  { id: "khi_growth_requires_boundary_shear", from: "solar.photosphere.khi_growth_observable", to: "solar.photosphere.magnetic_boundary_shear", relation: "requires", label: "A KHI interpretation requires resolved magnetic-boundary shear and temporal growth.", claimBoundaryNote: "Static curls or brightness texture fail this admission gate." },
  { id: "khi_diffusivity_derives_growth_scale", from: "solar.photosphere.khi_turbulent_diffusivity", to: "solar.photosphere.khi_growth_observable", relation: "derives", label: "The mixing-length diffusivity derives from measured flow and KHI wavelength.", claimBoundaryNote: "It is a proxy, not a direct energy-density conversion." },
  { id: "footpoint_flux_requires_khi_context", from: "solar.mhd.footpoint_poynting_flux", to: "solar.photosphere.khi_growth_observable", relation: "requires", label: "KHI-weighted footpoint injection requires the native KHI probability field.", claimBoundaryNote: "Magnetic and velocity observations are additionally required." },
  { id: "braiding_requires_poynting_flux", from: "solar.mhd.flux_braiding_proxy", to: "solar.mhd.footpoint_poynting_flux", relation: "requires", label: "Braiding diagnostics require registered Poynting-flux and magnetic-connectivity context.", claimBoundaryNote: "The FastCam continuum sequence alone cannot satisfy this edge." },
  { id: "braiding_documents_khi_hypothesis", from: "solar.mhd.flux_braiding_proxy", to: "solar.photosphere.khi_growth_observable", relation: "documents", label: "The braiding row documents the proposed KHI contribution as a falsifiable hypothesis.", claimBoundaryNote: "Documentation is not causal confirmation." },
  { id: "nanoflare_population_specializes_power_proxy", from: "solar.nanoflare.event_population", to: "solar.nanoflare.heating_proxy", relation: "specializes", label: "The event population spatially and temporally resolves the existing scalar power proxy.", claimBoundaryNote: "The scalar proxy remains available and neither row proves a driver." },
  { id: "khi_nanoflare_gate_checks_khi", from: "solar.cross_scale.khi_nanoflare_gate", to: "solar.photosphere.khi_growth_observable", relation: "diagnostic_checks", label: "The predictive gate checks leakage-safe KHI features on held-out active regions.", claimBoundaryNote: "Failure of negative controls blocks the edge." },
  { id: "khi_nanoflare_gate_checks_events", from: "solar.cross_scale.khi_nanoflare_gate", to: "solar.nanoflare.event_population", relation: "diagnostic_checks", label: "The predictive gate checks a separately built later-event catalogue.", claimBoundaryNote: "Labels cannot enter the KHI feature-building path." },
  { id: "cat_branch_documents_braiding_topology", from: "stellar.flux_rope.cat_branch_boundary", to: "solar.mhd.flux_braiding_proxy", relation: "documents", label: "Classical topology branches can summarize macro-scale states influenced by magnetic stressing.", claimBoundaryNote: "Branch uncertainty is classical and topology-conditioned." },
  { id: "cat_branch_blocks_quantum_promotion", from: "stellar.flux_rope.cat_branch_boundary", to: "stellar.claim_boundary.reduced_order_observational_context", relation: "blocks", label: "The cat-rope boundary blocks promotion from classical topology uncertainty to quantum coherence.", claimBoundaryNote: "An interference-sensitive rope observable is absent." },
];

export function buildSolarKhiNanoflareTheoryBadgesV1(): { badges: TheoryBadgeV1[]; edges: TheoryBadgeEdgeV1[] } {
  return {
    badges: SOLAR_KHI_NANOFLARE_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: SOLAR_KHI_NANOFLARE_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
