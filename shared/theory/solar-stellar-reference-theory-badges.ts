import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const SOLAR_PRODUCT_REGISTRY_PATH = "data/starsim/solar-product-registry.v1.json";
const SOLAR_REFERENCE_PACK_PATH = "data/starsim/solar-reference-pack.v1.json";
const SOLAR_REFERENCE_REPRO_DOC = "docs/research/starsim-solar-reference-repro-run-v1.md";
const SOLAR_PRODUCT_PROVENANCE_DOC = "docs/starsim/solar-product-provenance.md";
const SOLAR_REFERENCE_ANCHORS_DOC = "docs/starsim/solar-reference-anchors.md";
const SOLAR_PRODUCT_REGISTRY_MODULE = "server/modules/starsim/solar-product-registry.ts";
const SOLAR_REFERENCE_PACK_MODULE = "server/modules/starsim/solar-reference-pack.ts";
const SOLAR_NEUTRINO_CLOSURE_MODULE = "shared/starsim-fusion-neutrino-closure.ts";
const HELIOSEISMIC_CONTRACT_DOC = "docs/knowledge/physics/solar-helioseismic-observable-contract.md";
const NANOFLARE_DOC = "docs/knowledge/physics/nanoflare-heating.md";
const SOLAR_EVENT_TREE_DOC = "docs/knowledge/physics/physics-solar-surface-event-tree.json";
const FLARE_SUNQUAKE_TIMING_DOC = "docs/knowledge/physics/flare-sunquake-timing-correlation.md";
const SUNQUAKE_IMPACT_DOC = "docs/knowledge/physics/solar-sunquake-impact-definition.md";
const SUNQUAKE_REPLAY_DOC = "docs/knowledge/physics/sunquake-timing-replay-diagnostic.md";
const STELLAR_HYDROSTATIC_DOC = "docs/knowledge/star-hydrostatic.md";
const STARSIM_STAGE1_DOC = "docs/research/starsim-fusion-microphysics-stage1.md";
const STARSIM_MESA_REPRO_DOC = "docs/research/starsim-solar-mesa-docker-repro-v1.md";
const STELLAR_NUCLEOSYNTHESIS_AUDIT_DOC =
  "docs/audits/research/stellar-structure-nucleosynthesis-source-check-2026-03-25.md";
const STELLAR_CHEMICAL_INHERITANCE_DOC = "docs/knowledge/physics/stellar-chemical-inheritance.md";
const STELLAR_NUCLEOSYNTHESIS_TREE_DOC =
  "docs/knowledge/physics/physics-stellar-structure-nucleosynthesis-tree.json";
const STARSIM_FUSION_BENCHMARK_DOC = "docs/research/starsim-fusion-benchmark-stage2-candidate.md";
const STARSIM_FUSION_CLAIMS_DOC = "docs/knowledge/math-claims/starsim-fusion-microphysics.claims.json";

const SOLAR_STELLAR_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const COMMON_ASSUMPTIONS = [
  "Solar reference rows are observational/provenance context.",
  "Helioseismic and neutrino rows require calibration context.",
  "Nanoflare and sunquake rows are MHD/helioseismic diagnostics.",
  "Stellar structure rows are reduced-order/model context unless runtime receipts are attached.",
  "No row validates NHM2, objective collapse, solar restoration, or feasible stellar intervention.",
];

const repoRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
  path,
  id: id ?? null,
  note: note ?? null,
});

const docRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "doc",
  path,
  id: id ?? null,
  note: note ?? null,
});

const artifactRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "artifact",
  path,
  id: id ?? null,
  note: note ?? null,
});

const payload = (args: {
  id: string;
  expression: string;
  displayLatex: string;
  targetVariable: string;
}): TheoryBadgeV1["calculatorPayloads"][number] => ({
  id: args.id,
  expression: args.expression,
  displayLatex: args.displayLatex,
  preferredAction: "solve_with_steps",
  targetVariable: args.targetVariable,
  setupContext: null,
});

const solarStellarBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: SOLAR_STELLAR_BOUNDARY,
});

export const SOLAR_STELLAR_REFERENCE_THEORY_BADGES: TheoryBadgeV1[] = [
  solarStellarBadge({
    id: "solar.reference.solar_product_registry",
    title: "Solar Product Registry Reference",
    plainMeaning: "Documents solar reference products, dataset provenance, calibration anchors, and timestamps.",
    whyItMatters: "It gives solar prompts a repo-backed provenance row before helioseismic, neutrino, cycle, or event context is interpreted.",
    subjects: ["solar", "solar_reference", "provenance", "registry", "calibration"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["starsim", "solar_reference"],
    equationFamilies: ["solar_reference_provenance"],
    tags: ["solar_reference", "product_registry", "provenance", "calibration"],
    equations: [
      {
        id: "solar_product_registry_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{registry}=\\mathrm{provenance}(\\mathrm{dataset},\\mathrm{calibration},\\mathrm{timestamp})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["dataset", "calibration", "timestamp"],
        outputSymbols: ["registry"],
      },
    ],
    units: [],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(SOLAR_PRODUCT_REGISTRY_PATH, "solar-product-registry", "Solar product registry artifact."),
      artifactRef(SOLAR_REFERENCE_PACK_PATH, "solar-reference-pack", "Solar reference-pack artifact."),
      docRef(SOLAR_REFERENCE_REPRO_DOC, "repro-run", "Reference-pack reproduction notes."),
      docRef(SOLAR_PRODUCT_PROVENANCE_DOC, "provenance", "Solar product provenance documentation."),
      docRef(SOLAR_REFERENCE_ANCHORS_DOC, "anchors", "Solar reference anchors."),
      repoRef(SOLAR_PRODUCT_REGISTRY_MODULE, "registry-module", "Registry loader/runtime module."),
      repoRef(SOLAR_REFERENCE_PACK_MODULE, "reference-pack-module", "Reference-pack loader/runtime module."),
    ],
    hintKeys: {
      subjects: ["solar", "solar_reference", "provenance", "registry", "calibration"],
      symbols: ["registry", "dataset", "calibration", "timestamp"],
      unitSignatures: [],
      repoPaths: [
        SOLAR_PRODUCT_REGISTRY_PATH,
        SOLAR_REFERENCE_PACK_PATH,
        SOLAR_REFERENCE_REPRO_DOC,
        SOLAR_PRODUCT_PROVENANCE_DOC,
        SOLAR_REFERENCE_ANCHORS_DOC,
        SOLAR_PRODUCT_REGISTRY_MODULE,
        SOLAR_REFERENCE_PACK_MODULE,
      ],
      equationFamilies: ["solar_reference_provenance"],
      simulationOwners: ["starsim", "solar_reference"],
    },
  }),
  solarStellarBadge({
    id: "solar.reference.neutrino_flux_context",
    title: "Solar Neutrino Flux Context",
    plainMeaning: "Exposes solar neutrino closure as calibrated observational context for solar-core comparisons.",
    whyItMatters: "It lets retrieval connect neutrino references to solar interior context without promoting them into proof rows.",
    subjects: ["solar", "solar_reference", "neutrino", "solar_core", "calibration"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["starsim", "solar_reference"],
    equationFamilies: ["solar_neutrino_context"],
    tags: ["neutrino", "solar_core", "closure_context"],
    equations: [
      {
        id: "solar_neutrino_flux_context",
        role: "noncomputable_reference",
        displayLatex: "\\Phi_{\\nu}=\\mathrm{context}(\\mathrm{model}_{core},\\mathrm{detector\\ calibration})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["model_solar_core", "detector_calibration"],
        outputSymbols: ["Phi_nu"],
      },
    ],
    units: [{ symbol: "Phi_nu", quantity: "neutrino_flux_context", dimensionSignature: "L^-2 T^-1" }],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_NEUTRINO_CLOSURE_MODULE, "neutrino-closure", "StarSim neutrino closure context."),
      artifactRef(SOLAR_REFERENCE_PACK_PATH, "solar-reference-pack", "Reference-pack neutrino context."),
      docRef(SOLAR_REFERENCE_ANCHORS_DOC, "anchors", "Calibration and reference anchors."),
    ],
    hintKeys: {
      subjects: ["solar", "neutrino", "solar_core", "calibration"],
      symbols: ["Phi_nu", "model_solar_core", "detector_calibration"],
      unitSignatures: ["L^-2 T^-1"],
      repoPaths: [SOLAR_NEUTRINO_CLOSURE_MODULE, SOLAR_REFERENCE_PACK_PATH, SOLAR_REFERENCE_ANCHORS_DOC],
      equationFamilies: ["solar_neutrino_context"],
      simulationOwners: ["starsim", "solar_reference"],
    },
  }),
  solarStellarBadge({
    id: "solar.interior.helioseismic_sound_speed",
    title: "Helioseismic Sound-Speed Difference",
    plainMeaning: "Computes the relative sound-speed difference between an observed helioseismic value and a reference profile.",
    whyItMatters: "It bridges helioseismology to solar interior structure through a scalar, calibration-aware comparison.",
    subjects: ["solar", "solar_interior", "helioseismology", "sound_speed", "relative_difference"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["solar_reference", "starsim"],
    equationFamilies: ["helioseismic_sound_speed"],
    tags: ["helioseismic", "sound_speed", "calculator_loadable"],
    equations: [
      {
        id: "helioseismic_sound_speed_delta",
        role: "calculator_demo",
        displayLatex: "\\Delta c/c=(c_{obs}-c_{ref})/c_{ref}",
        computableExpression: "delta_c_ratio = (c_observed - c_reference)/c_reference",
        operatorKind: "scalar_expression",
        inputSymbols: ["c_observed", "c_reference"],
        outputSymbols: ["delta_c_ratio"],
      },
    ],
    units: [
      { symbol: "c_observed", unit: "m/s", quantity: "sound_speed", dimensionSignature: "L T^-1" },
      { symbol: "c_reference", unit: "m/s", quantity: "sound_speed", dimensionSignature: "L T^-1" },
      { symbol: "delta_c_ratio", unit: null, quantity: "relative_difference", dimensionSignature: "1" },
    ],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [
      payload({
        id: "helioseismic_sound_speed_delta_payload",
        expression: "delta_c_ratio = (c_observed - c_reference)/c_reference",
        displayLatex: "\\Delta c/c=(c_{obs}-c_{ref})/c_{ref}",
        targetVariable: "delta_c_ratio",
      }),
    ],
    sourceRefs: [
      docRef(HELIOSEISMIC_CONTRACT_DOC, "helioseismic-observable-contract", "Helioseismic observable contract."),
      artifactRef(SOLAR_REFERENCE_PACK_PATH, "solar-reference-pack", "Reference profile context."),
    ],
    hintKeys: {
      subjects: ["solar", "solar_interior", "helioseismology", "sound_speed"],
      symbols: ["delta_c_ratio", "c_observed", "c_reference"],
      unitSignatures: ["1", "L T^-1"],
      repoPaths: [HELIOSEISMIC_CONTRACT_DOC, SOLAR_REFERENCE_PACK_PATH],
      equationFamilies: ["helioseismic_sound_speed"],
      simulationOwners: ["solar_reference", "starsim"],
    },
  }),
  solarStellarBadge({
    id: "solar.cycle.magnetogram_activity_context",
    title: "Magnetogram Activity Context",
    plainMeaning: "Names magnetogram and cycle-phase context as observational conditioning for solar activity rows.",
    whyItMatters: "It connects magnetic-field products and solar-cycle phase to event diagnostics without claiming event causation.",
    subjects: ["solar", "solar_cycle", "magnetogram", "activity_context", "calibration"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["solar_reference"],
    equationFamilies: ["solar_cycle_context"],
    tags: ["magnetogram", "solar_cycle", "activity_context"],
    equations: [
      {
        id: "magnetogram_activity_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{activity\\ context}=\\mathrm{context}(B_{los},\\mathrm{cycle\\ phase},\\mathrm{calibration})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["B_los", "cycle_phase", "calibration"],
        outputSymbols: ["activity_context"],
      },
    ],
    units: [
      { symbol: "B_los", unit: "T", quantity: "line_of_sight_magnetic_field", dimensionSignature: "M T^-2 I^-1" },
      { symbol: "cycle_phase", unit: null, quantity: "solar_cycle_phase", dimensionSignature: "1" },
    ],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [],
    sourceRefs: [
      artifactRef(SOLAR_REFERENCE_PACK_PATH, "solar-reference-pack", "Magnetogram and cycle context."),
      docRef(SOLAR_REFERENCE_ANCHORS_DOC, "anchors", "Reference anchors for solar products."),
    ],
    hintKeys: {
      subjects: ["solar", "solar_cycle", "magnetogram", "activity_context"],
      symbols: ["B_los", "cycle_phase", "calibration", "activity_context"],
      unitSignatures: ["M T^-2 I^-1", "1"],
      repoPaths: [SOLAR_REFERENCE_PACK_PATH, SOLAR_REFERENCE_ANCHORS_DOC],
      equationFamilies: ["solar_cycle_context"],
      simulationOwners: ["solar_reference"],
    },
  }),
  solarStellarBadge({
    id: "solar.nanoflare.heating_proxy",
    title: "Nanoflare Heating Proxy",
    plainMeaning: "Computes a reduced power proxy from nanoflare energy and event timescale.",
    whyItMatters: "It exposes nanoflare heating as MHD/observational context without treating it as collapse evidence.",
    subjects: ["solar", "nanoflare", "coronal_heating", "mhd", "power"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["solar_flare", "solar_reference"],
    equationFamilies: ["nanoflare_heating_proxy"],
    tags: ["nanoflare", "heating", "calculator_loadable"],
    equations: [
      {
        id: "nanoflare_heating_power",
        role: "calculator_demo",
        displayLatex: "P_{nano}=E_{nano}/\\tau_{nano}",
        computableExpression: "P_nano = E_nano/tau_nano",
        operatorKind: "scalar_expression",
        inputSymbols: ["E_nano", "tau_nano"],
        outputSymbols: ["P_nano"],
      },
    ],
    units: [
      { symbol: "P_nano", unit: "W", quantity: "power", dimensionSignature: "M L^2 T^-3" },
      { symbol: "E_nano", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "tau_nano", unit: "s", quantity: "time", dimensionSignature: "T" },
    ],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [
      payload({
        id: "nanoflare_heating_proxy_payload",
        expression: "P_nano = E_nano/tau_nano",
        displayLatex: "P_{nano}=E_{nano}/\\tau_{nano}",
        targetVariable: "P_nano",
      }),
    ],
    sourceRefs: [
      docRef(NANOFLARE_DOC, "nanoflare-heating", "Nanoflare heating context."),
      docRef(SOLAR_EVENT_TREE_DOC, "solar-surface-event-tree", "Solar surface event taxonomy."),
    ],
    hintKeys: {
      subjects: ["solar", "nanoflare", "coronal_heating", "mhd", "power"],
      symbols: ["P_nano", "E_nano", "tau_nano"],
      unitSignatures: ["M L^2 T^-3", "M L^2 T^-2", "T"],
      repoPaths: [NANOFLARE_DOC, SOLAR_EVENT_TREE_DOC],
      equationFamilies: ["nanoflare_heating_proxy"],
      simulationOwners: ["solar_flare", "solar_reference"],
    },
  }),
  solarStellarBadge({
    id: "solar.sunquake.flare_coupling_window",
    title: "Flare-To-Sunquake Timing Window",
    plainMeaning: "Computes the timing offset between a flare marker and a sunquake diagnostic marker.",
    whyItMatters: "It gives flare-to-sunquake prompts a concrete observable window while keeping interpretation diagnostic.",
    subjects: ["solar", "sunquake", "flare", "helioseismology", "timing"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["solar_flare", "solar_reference"],
    equationFamilies: ["sunquake_timing_correlation"],
    tags: ["sunquake", "flare", "timing", "calculator_loadable"],
    equations: [
      {
        id: "flare_sunquake_timing_delta",
        role: "calculator_demo",
        displayLatex: "\\Delta t_{flare,sq}=t_{sq}-t_{flare}",
        computableExpression: "delta_t_flare_sunquake = t_sunquake - t_flare",
        operatorKind: "scalar_expression",
        inputSymbols: ["t_sunquake", "t_flare"],
        outputSymbols: ["delta_t_flare_sunquake"],
      },
    ],
    units: [
      { symbol: "delta_t_flare_sunquake", unit: "s", quantity: "time_difference", dimensionSignature: "T" },
      { symbol: "t_flare", unit: "s", quantity: "event_time", dimensionSignature: "T" },
      { symbol: "t_sunquake", unit: "s", quantity: "event_time", dimensionSignature: "T" },
    ],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [
      payload({
        id: "flare_sunquake_timing_window_payload",
        expression: "delta_t_flare_sunquake = t_sunquake - t_flare",
        displayLatex: "\\Delta t_{flare,sq}=t_{sq}-t_{flare}",
        targetVariable: "delta_t_flare_sunquake",
      }),
    ],
    sourceRefs: [
      docRef(FLARE_SUNQUAKE_TIMING_DOC, "flare-sunquake-timing", "Flare/sunquake timing correlation."),
      docRef(SUNQUAKE_IMPACT_DOC, "sunquake-impact", "Sunquake impact definition."),
      docRef(SUNQUAKE_REPLAY_DOC, "sunquake-replay", "Sunquake timing replay diagnostic."),
      docRef(HELIOSEISMIC_CONTRACT_DOC, "helioseismic-contract", "Helioseismic observable context."),
    ],
    hintKeys: {
      subjects: ["solar", "sunquake", "flare", "helioseismology", "timing"],
      symbols: ["delta_t_flare_sunquake", "t_flare", "t_sunquake"],
      unitSignatures: ["T"],
      repoPaths: [FLARE_SUNQUAKE_TIMING_DOC, SUNQUAKE_IMPACT_DOC, SUNQUAKE_REPLAY_DOC, HELIOSEISMIC_CONTRACT_DOC],
      equationFamilies: ["sunquake_timing_correlation"],
      simulationOwners: ["solar_flare", "solar_reference"],
    },
  }),
  solarStellarBadge({
    id: "stellar.structure.hydrostatic_equilibrium",
    title: "Stellar Hydrostatic Equilibrium",
    plainMeaning: "Names the stellar pressure-gradient balance between gravity and pressure support.",
    whyItMatters: "It gives the graph an explicit stellar first-principles bridge from gravity to interior pressure context.",
    subjects: ["stellar", "stellar_structure", "hydrostatic_equilibrium", "gravity", "pressure"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["starsim", "stellar_reference"],
    equationFamilies: ["stellar_hydrostatic_equilibrium", "stellar_structure_equations"],
    tags: ["stellar", "hydrostatic", "pressure", "gravity"],
    equations: [
      {
        id: "stellar_hydrostatic_equilibrium",
        role: "law",
        displayLatex: "\\frac{dP}{dr}=-\\frac{G M_r \\rho}{r^2}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["G", "M_r", "rho", "r"],
        outputSymbols: ["dP_dr"],
      },
    ],
    units: [
      { symbol: "dP_dr", quantity: "pressure_gradient", dimensionSignature: "M L^-2 T^-2" },
      { symbol: "M_r", quantity: "enclosed_mass", dimensionSignature: "M" },
      { symbol: "rho", quantity: "density", dimensionSignature: "M L^-3" },
      { symbol: "r", quantity: "radius", dimensionSignature: "L" },
    ],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [],
    sourceRefs: [
      docRef(STELLAR_HYDROSTATIC_DOC, "hydrostatic-equilibrium", "Stellar hydrostatic reference."),
      docRef(STARSIM_STAGE1_DOC, "stellar-structure-equations", "StarSim reduced-order structure context."),
      docRef(STARSIM_MESA_REPRO_DOC, "mesa-repro", "MESA reference-pack reproduction context."),
    ],
    hintKeys: {
      subjects: ["stellar", "stellar_structure", "hydrostatic_equilibrium", "gravity", "pressure"],
      symbols: ["dP_dr", "G", "M_r", "rho", "r"],
      unitSignatures: ["M L^-2 T^-2", "M", "M L^-3", "L"],
      repoPaths: [STELLAR_HYDROSTATIC_DOC, STARSIM_STAGE1_DOC, STARSIM_MESA_REPRO_DOC],
      equationFamilies: ["stellar_hydrostatic_equilibrium", "stellar_structure_equations"],
      simulationOwners: ["starsim", "stellar_reference"],
    },
  }),
  solarStellarBadge({
    id: "stellar.nucleosynthesis.reaction_network_context",
    title: "Stellar Chemical Inheritance Root",
    plainMeaning:
      "Names B2FH-style stellar nucleosynthesis abundance flow as the elemental and isotopic inheritance root for later astrochemistry.",
    whyItMatters:
      "It grounds fusion, nucleosynthesis, and astrochemistry prompts in first-principles reaction-network bounds without claiming a full stellar-evolution solver or a direct life/consciousness mechanism.",
    subjects: ["stellar", "nucleosynthesis", "reaction_network", "fusion", "abundance", "chemical_inheritance"],
    level: "first_principle",
    status: "diagnostic",
    simulationOwners: ["starsim", "stellar_reference"],
    equationFamilies: ["stellar_reaction_network", "nucleosynthesis_context", "stellar_yield_context"],
    tags: ["stellar", "nucleosynthesis", "reaction_network", "b2fh", "no_teleology_boundary"],
    equations: [
      {
        id: "stellar_reaction_network_context",
        role: "noncomputable_reference",
        displayLatex: "\\frac{dY_i}{dt}=\\sum_j R_{ji}-\\sum_k R_{ik}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Y_i", "R_ji", "R_ik"],
        outputSymbols: ["dY_i_dt"],
      },
      {
        id: "stellar_yield_inheritance_context",
        role: "noncomputable_reference",
        displayLatex: "Z_{system}\\sim\\int \\xi(M)\\,y_i(M,Z,t)\\,R(M,Z,t)\\,dM",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["initial_mass_function", "stellar_yield", "event_rate", "metallicity"],
        outputSymbols: ["system_abundance_vector"],
      },
    ],
    units: [
      { symbol: "Y_i", quantity: "abundance", dimensionSignature: "1" },
      { symbol: "R_ji", quantity: "reaction_flow", dimensionSignature: "T^-1" },
      { symbol: "R_ik", quantity: "reaction_flow", dimensionSignature: "T^-1" },
      { symbol: "dY_i_dt", quantity: "abundance_rate", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      ...COMMON_ASSUMPTIONS,
      "Stellar nucleosynthesis supplies chemical possibility-space constraints.",
      "Reaction-network and yield terms do not certify life, fullerenes-as-life, consciousness, or Earth inevitability.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      {
        kind: "literature_ref",
        id: "doi:10.1103/RevModPhys.29.547",
        note: "B2FH stellar nucleosynthesis source anchor.",
      },
      docRef(STELLAR_CHEMICAL_INHERITANCE_DOC, "stellar-chemical-inheritance", "B2FH chemical-inheritance root batch."),
      docRef(
        STELLAR_NUCLEOSYNTHESIS_TREE_DOC,
        "physics-stellar-structure-nucleosynthesis-chemical-inheritance-root",
        "Stellar lane graph node for chemical inheritance.",
      ),
      docRef(STELLAR_NUCLEOSYNTHESIS_AUDIT_DOC, "stellar-structure-nucleosynthesis", "Source-check audit."),
      docRef(STARSIM_FUSION_BENCHMARK_DOC, "stage2-candidate", "Fusion benchmark candidate context."),
      docRef(STARSIM_FUSION_CLAIMS_DOC, "fusion-microphysics-claims", "Math-claims reference for StarSim fusion microphysics."),
    ],
    hintKeys: {
      subjects: ["stellar", "nucleosynthesis", "reaction_network", "fusion", "abundance", "chemical_inheritance"],
      symbols: ["Y_i", "R_ji", "R_ik", "dY_i_dt", "system_abundance_vector"],
      unitSignatures: ["1", "T^-1"],
      repoPaths: [
        STELLAR_CHEMICAL_INHERITANCE_DOC,
        STELLAR_NUCLEOSYNTHESIS_TREE_DOC,
        STELLAR_NUCLEOSYNTHESIS_AUDIT_DOC,
        STARSIM_FUSION_BENCHMARK_DOC,
        STARSIM_FUSION_CLAIMS_DOC,
      ],
      equationFamilies: ["stellar_reaction_network", "nucleosynthesis_context", "stellar_yield_context"],
      simulationOwners: ["starsim", "stellar_reference"],
    },
  }),
  solarStellarBadge({
    id: "stellar.claim_boundary.reduced_order_observational_context",
    title: "Solar/Stellar Reduced-Order Boundary",
    plainMeaning: "Keeps solar reference, helioseismic, neutrino, nanoflare, sunquake, and stellar rows in diagnostic context.",
    whyItMatters: "It blocks retrieval and calculator overlays from promoting reference rows into validation, mechanism, or intervention claims.",
    subjects: ["stellar", "solar", "claim_boundary", "observational_context", "reduced_order"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["solar_reference", "stellar_reference", "starsim"],
    equationFamilies: ["solar_stellar_claim_boundary"],
    tags: ["claim_boundary", "diagnostic_only", "reduced_order"],
    equations: [
      {
        id: "solar_stellar_boundary_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{observational/reduced\\ order\\ context\\ only}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [],
        outputSymbols: ["solar_stellar_claim_boundary"],
      },
    ],
    units: [],
    assumptions: COMMON_ASSUMPTIONS,
    calculatorPayloads: [],
    sourceRefs: [
      docRef(SOLAR_REFERENCE_ANCHORS_DOC, "solar-boundary", "Solar reference boundary context."),
      docRef(HELIOSEISMIC_CONTRACT_DOC, "helioseismic-boundary", "Helioseismic calibration boundary."),
      docRef(STELLAR_NUCLEOSYNTHESIS_AUDIT_DOC, "stellar-boundary", "Stellar source-check boundary."),
    ],
    hintKeys: {
      subjects: ["stellar", "solar", "claim_boundary", "observational_context", "reduced_order"],
      symbols: ["solar_stellar_claim_boundary"],
      unitSignatures: [],
      repoPaths: [SOLAR_REFERENCE_ANCHORS_DOC, HELIOSEISMIC_CONTRACT_DOC, STELLAR_NUCLEOSYNTHESIS_AUDIT_DOC],
      equationFamilies: ["solar_stellar_claim_boundary"],
      simulationOwners: ["solar_reference", "stellar_reference", "starsim"],
    },
  }),
];

export const SOLAR_STELLAR_REFERENCE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "solar_reference_documents_helioseismic_context",
    from: "solar.reference.solar_product_registry",
    to: "solar.interior.helioseismic_sound_speed",
    relation: "documents",
    label: "Solar reference products provide provenance context for helioseismic interior comparisons.",
    claimBoundaryNote: "Reference-pack provenance is required before interpretation.",
  },
  {
    id: "solar_reference_documents_neutrino_context",
    from: "solar.reference.solar_product_registry",
    to: "solar.reference.neutrino_flux_context",
    relation: "documents",
    label: "Solar reference products document calibrated neutrino flux context.",
    claimBoundaryNote: "Neutrino context requires detector and model calibration.",
  },
  {
    id: "solar_cycle_documents_nanoflare_context",
    from: "solar.cycle.magnetogram_activity_context",
    to: "solar.nanoflare.heating_proxy",
    relation: "documents",
    label: "Magnetogram and solar-cycle context can condition nanoflare heating diagnostics.",
    claimBoundaryNote: "Activity context is observational conditioning only.",
  },
  {
    id: "nanoflare_context_documents_sunquake_window",
    from: "solar.nanoflare.heating_proxy",
    to: "solar.sunquake.flare_coupling_window",
    relation: "documents",
    label: "Impulsive heating context can be compared with flare-to-sunquake timing diagnostics.",
    claimBoundaryNote: "Timing correlation is observational/MHD context, not collapse evidence.",
  },
  {
    id: "stellar_hydrostatic_documents_solar_interior",
    from: "stellar.structure.hydrostatic_equilibrium",
    to: "solar.interior.helioseismic_sound_speed",
    relation: "documents",
    label: "Hydrostatic structure documents the stellar-interior context around helioseismic sound-speed comparisons.",
    claimBoundaryNote: "Solar interior comparison still requires reference-pack calibration.",
  },
  {
    id: "stellar_hydrostatic_documents_nucleosynthesis_context",
    from: "stellar.structure.hydrostatic_equilibrium",
    to: "stellar.nucleosynthesis.reaction_network_context",
    relation: "documents",
    label: "Hydrostatic structure provides stellar-interior context for reaction-network rows.",
    claimBoundaryNote: "Reduced-order context does not certify stellar evolution.",
  },
  {
    id: "solar_sunquake_documents_stellar_boundary",
    from: "solar.sunquake.flare_coupling_window",
    to: "stellar.claim_boundary.reduced_order_observational_context",
    relation: "documents",
    label: "Sunquake timing rows must expose their diagnostic boundary.",
    claimBoundaryNote: "Sunquake timing does not promote to collapse or intervention claims.",
  },
  {
    id: "solar_reference_documents_stellar_boundary",
    from: "solar.reference.solar_product_registry",
    to: "stellar.claim_boundary.reduced_order_observational_context",
    relation: "documents",
    label: "Solar reference rows must expose observational/provenance boundaries.",
    claimBoundaryNote: "No solar reference row promotes to NHM2 or restoration claims.",
  },
  {
    id: "stellar_nucleosynthesis_documents_stellar_boundary",
    from: "stellar.nucleosynthesis.reaction_network_context",
    to: "stellar.claim_boundary.reduced_order_observational_context",
    relation: "documents",
    label: "Nucleosynthesis context rows must remain reduced-order unless runtime receipts are attached.",
    claimBoundaryNote: "Reaction-network context is not a full stellar-evolution certificate.",
  },
];

export function buildSolarStellarReferenceTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: SOLAR_STELLAR_REFERENCE_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: SOLAR_STELLAR_REFERENCE_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
