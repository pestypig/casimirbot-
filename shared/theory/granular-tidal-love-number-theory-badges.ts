import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const GRANULAR_TIDAL_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const docRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "doc",
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

const granularTidalBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: GRANULAR_TIDAL_BOUNDARY,
});

export const GRANULAR_TIDAL_LOVE_NUMBER_THEORY_BADGES: TheoryBadgeV1[] = [
  granularTidalBadge({
    id: "self_gravity.shape.strength_balance",
    title: "Self-Gravity Strength Balance",
    plainMeaning: "Estimates a low-order radius scale where self-gravity starts to compete with material strength.",
    whyItMatters: "It exposes the potato-radius style scaling already present in the repo as a diagnostic shape row.",
    subjects: ["self_gravity", "shape", "material_strength", "potato_radius", "tidal_response"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["self_gravity_shape", "galactic_dynamics"],
    equationFamilies: ["potato_radius_strength_balance", "self_gravity_shape"],
    tags: ["calculator_loadable", "material_response", "diagnostic"],
    equations: [
      {
        id: "strength_balance_radius_proxy",
        role: "calculator_demo",
        displayLatex: "R_p\\approx\\sqrt{\\frac{\\sigma_y}{G\\rho^2}}",
        computableExpression: "R_p_proxy = sqrt(sigma_y/(G*rho^2))",
        operatorKind: "scalar_expression",
        inputSymbols: ["sigma_y", "G", "rho"],
        outputSymbols: ["R_p_proxy"],
      },
    ],
    units: [
      { symbol: "R_p_proxy", unit: "m", quantity: "radius_scale", dimensionSignature: "L" },
      { symbol: "sigma_y", unit: "Pa", quantity: "yield_strength", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "rho", unit: "kg/m^3", quantity: "density", dimensionSignature: "M L^-3" },
    ],
    assumptions: [
      "Low-order scaling diagnostic only.",
      "Interior structure, porosity, rotation, and tide context are not solved by this scalar row.",
    ],
    calculatorPayloads: [
      payload({
        id: "strength_balance_radius_proxy_payload",
        expression: "R_p_proxy = sqrt(sigma_y/(G*rho^2))",
        displayLatex: "R_p\\approx\\sqrt{\\frac{\\sigma_y}{G\\rho^2}}",
        targetVariable: "R_p_proxy",
      }),
    ],
    sourceRefs: [
      docRef("docs/knowledge/physics/self-gravity-shape.md", "self-gravity-shape bridge"),
      docRef("docs/knowledge/physics/physics-self-gravity-shape-tree.json", "self-gravity shape tree"),
      docRef("docs/knowledge/math-claims/self-gravity-shape.math-claims.json", "diagnostic claim ledger"),
    ],
    hintKeys: {
      subjects: ["self_gravity", "shape", "material_strength", "potato_radius", "tidal_response"],
      symbols: ["R_p_proxy", "sigma_y", "G", "rho"],
      unitSignatures: ["L", "M L^-1 T^-2", "M L^-3"],
      repoPaths: [
        "docs/knowledge/physics/self-gravity-shape.md",
        "docs/knowledge/math-claims/self-gravity-shape.math-claims.json",
      ],
      equationFamilies: ["potato_radius_strength_balance", "self_gravity_shape"],
      simulationOwners: ["self_gravity_shape", "galactic_dynamics"],
    },
  }),
  granularTidalBadge({
    id: "granular.rubble_pile.dissipation_closure",
    title: "Granular Rubble-Pile Dissipation Closure",
    plainMeaning: "Packages granular and frictional loss into a low-order cycle dissipation diagnostic.",
    whyItMatters: "It keeps contact dynamics and rubble-pile rheology visible without pretending the scalar row is an N-body solver.",
    subjects: ["granular", "rubble_pile", "dissipation", "material_response", "tidal_response"],
    level: "model",
    status: "review",
    simulationOwners: ["self_gravity_shape", "granular_tidal_response"],
    equationFamilies: ["granular_dissipation_closure", "tidal_quality_factor"],
    tags: ["calculator_loadable", "rubble_pile", "diagnostic"],
    equations: [
      {
        id: "granular_tidal_q",
        role: "calculator_demo",
        displayLatex: "Q_{tide}=\\frac{2\\pi E_{stored}}{E_{lost/cycle}}",
        computableExpression: "Q_tide = 2*pi*E_stored/E_lost_per_cycle",
        operatorKind: "scalar_expression",
        inputSymbols: ["E_stored", "E_lost_per_cycle"],
        outputSymbols: ["Q_tide"],
      },
    ],
    units: [
      { symbol: "Q_tide", unit: null, quantity: "quality_factor", dimensionSignature: "1" },
      { symbol: "E_stored", unit: "J", quantity: "stored_energy", dimensionSignature: "M L^2 T^-2" },
      {
        symbol: "E_lost_per_cycle",
        unit: "J",
        quantity: "dissipated_energy_per_cycle",
        dimensionSignature: "M L^2 T^-2",
      },
    ],
    assumptions: [
      "Q packages bulk loss; it does not resolve grain contacts.",
      "Rubble-pile interpretation requires body-specific forcing and structure evidence.",
    ],
    calculatorPayloads: [
      payload({
        id: "granular_tidal_q_payload",
        expression: "Q_tide = 2*pi*E_stored/E_lost_per_cycle",
        displayLatex: "Q_{tide}=\\frac{2\\pi E_{stored}}{E_{lost/cycle}}",
        targetVariable: "Q_tide",
      }),
    ],
    sourceRefs: [
      docRef("docs/knowledge/physics/granular-tidal-response-diagnostic.md", "low-order rubble-pile closure"),
      docRef("docs/knowledge/physics/granular-collision-dissipation.md", "granular dissipation"),
      docRef("docs/knowledge/physics/porous-rubble-pile-rheology.md", "porous rubble-pile rheology"),
    ],
    hintKeys: {
      subjects: ["granular", "rubble_pile", "dissipation", "material_response", "tidal_response"],
      symbols: ["Q_tide", "E_stored", "E_lost_per_cycle"],
      unitSignatures: ["1", "M L^2 T^-2"],
      repoPaths: [
        "docs/knowledge/physics/granular-tidal-response-diagnostic.md",
        "docs/knowledge/physics/granular-collision-dissipation.md",
      ],
      equationFamilies: ["granular_dissipation_closure", "tidal_quality_factor"],
      simulationOwners: ["self_gravity_shape", "granular_tidal_response"],
    },
  }),
  granularTidalBadge({
    id: "tidal.quality_factor.damping_proxy",
    title: "Tidal Quality-Factor Damping Proxy",
    plainMeaning: "Converts tidal Q into a dimensionless loss fraction per cycle.",
    whyItMatters: "It bridges granular dissipation to tidal damping while keeping the interpretation diagnostic.",
    subjects: ["tidal", "quality_factor", "damping", "dissipation", "material_response"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["granular_tidal_response"],
    equationFamilies: ["tidal_quality_factor", "damping_proxy"],
    tags: ["calculator_loadable", "tidal_q", "diagnostic"],
    equations: [
      {
        id: "tidal_loss_fraction",
        role: "calculator_demo",
        displayLatex: "f_{loss}=2\\pi/Q_{tide}",
        computableExpression: "loss_fraction = 2*pi/Q_tide",
        operatorKind: "scalar_expression",
        inputSymbols: ["Q_tide"],
        outputSymbols: ["loss_fraction"],
      },
    ],
    units: [{ symbol: "loss_fraction", unit: null, quantity: "cycle_loss_fraction", dimensionSignature: "1" }],
    assumptions: [
      "Reduced damping proxy only.",
      "Phase lag and interior inversion require observation or runtime receipts.",
    ],
    calculatorPayloads: [
      payload({
        id: "tidal_loss_fraction_payload",
        expression: "loss_fraction = 2*pi/Q_tide",
        displayLatex: "f_{loss}=2\\pi/Q_{tide}",
        targetVariable: "loss_fraction",
      }),
    ],
    sourceRefs: [
      docRef("docs/knowledge/physics/tidal-quality-factor.md", "tidal Q dissipation summary"),
      docRef("docs/knowledge/physics/tidal-bulge-response.md", "tidal deformation response"),
    ],
    hintKeys: {
      subjects: ["tidal", "quality_factor", "damping", "dissipation", "material_response"],
      symbols: ["loss_fraction", "Q_tide"],
      unitSignatures: ["1"],
      repoPaths: ["docs/knowledge/physics/tidal-quality-factor.md"],
      equationFamilies: ["tidal_quality_factor", "damping_proxy"],
      simulationOwners: ["granular_tidal_response"],
    },
  }),
  granularTidalBadge({
    id: "tidal.love_number.displacement_response",
    title: "Love-Number Displacement Response",
    plainMeaning: "Estimates radial deformation from a displacement Love number and external tidal potential.",
    whyItMatters: "It gives Love-number language a calculator row while preserving the need for interior-structure evidence.",
    subjects: ["tidal", "love_number", "displacement", "tidal_bulge", "material_response"],
    level: "model",
    status: "review",
    simulationOwners: ["granular_tidal_response", "self_gravity_shape"],
    equationFamilies: ["love_number_response", "tidal_bulge_response"],
    tags: ["calculator_loadable", "love_number", "diagnostic"],
    equations: [
      {
        id: "love_number_radial_response",
        role: "calculator_demo",
        displayLatex: "\\Delta R=h_2U_{tide}/g_{surface}",
        computableExpression: "deltaR_m = h2*U_tide/g_surface",
        operatorKind: "scalar_expression",
        inputSymbols: ["h2", "U_tide", "g_surface"],
        outputSymbols: ["deltaR_m"],
      },
    ],
    units: [
      { symbol: "deltaR_m", unit: "m", quantity: "radial_displacement", dimensionSignature: "L" },
      { symbol: "U_tide", unit: "m^2/s^2", quantity: "tidal_potential", dimensionSignature: "L^2 T^-2" },
      { symbol: "g_surface", unit: "m/s^2", quantity: "surface_gravity", dimensionSignature: "L T^-2" },
    ],
    assumptions: [
      "Love-number response is a reduced deformation proxy.",
      "Interior structure sets response amplitude and phase.",
    ],
    calculatorPayloads: [
      payload({
        id: "love_number_radial_response_payload",
        expression: "deltaR_m = h2*U_tide/g_surface",
        displayLatex: "\\Delta R=h_2U_{tide}/g_{surface}",
        targetVariable: "deltaR_m",
      }),
    ],
    sourceRefs: [
      docRef("docs/knowledge/physics/tidal-bulge-response.md", "tidal deformation response"),
      docRef("docs/knowledge/physics/tidal-quality-factor.md", "tidal Q dissipation summary"),
      docRef("docs/architecture/granular-tidal-sunquake-bridge-plan.md", "granular tidal bridge plan"),
    ],
    hintKeys: {
      subjects: ["tidal", "love_number", "displacement", "tidal_bulge", "material_response"],
      symbols: ["deltaR_m", "h2", "U_tide", "g_surface"],
      unitSignatures: ["L", "L^2 T^-2", "L T^-2"],
      repoPaths: [
        "docs/knowledge/physics/tidal-bulge-response.md",
        "docs/architecture/granular-tidal-sunquake-bridge-plan.md",
      ],
      equationFamilies: ["love_number_response", "tidal_bulge_response"],
      simulationOwners: ["granular_tidal_response", "self_gravity_shape"],
    },
  }),
  granularTidalBadge({
    id: "tidal.runtime.granular_response_diagnostic",
    title: "Granular Tidal Response Diagnostic Runtime",
    plainMeaning: "Reference row for body-specific granular/tidal response diagnostics and artifact readers.",
    whyItMatters: "It marks where a future runtime receipt belongs without implying one has run.",
    subjects: ["tidal", "granular", "runtime", "diagnostic", "material_response"],
    level: "simulation_specific",
    status: "review",
    simulationOwners: ["granular_tidal_response"],
    equationFamilies: ["granular_tidal_response"],
    tags: ["runtime_reference", "artifact_reader_needed"],
    equations: [
      {
        id: "granular_tidal_runtime_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{granular\\ tidal\\ diagnostic\\ receipt\\ required}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["R_p_proxy", "Q_tide", "loss_fraction", "deltaR_m"],
        outputSymbols: ["granular_tidal_receipt_status"],
      },
    ],
    units: [],
    assumptions: [
      "Runtime row is reference-only in this seed.",
      "Body-specific interpretation requires explicit artifacts or runtime receipts.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef("docs/knowledge/physics/granular-tidal-response-diagnostic.md", "low-order rubble-pile closure"),
      docRef("docs/knowledge/math-claims/self-gravity-shape.math-claims.json", "diagnostic claim ledger"),
    ],
    hintKeys: {
      subjects: ["tidal", "granular", "runtime", "diagnostic", "material_response"],
      symbols: ["granular_tidal_receipt_status", "R_p_proxy", "Q_tide", "deltaR_m"],
      unitSignatures: [],
      repoPaths: [
        "docs/knowledge/physics/granular-tidal-response-diagnostic.md",
        "docs/knowledge/math-claims/self-gravity-shape.math-claims.json",
      ],
      equationFamilies: ["granular_tidal_response"],
      simulationOwners: ["granular_tidal_response"],
    },
  }),
  granularTidalBadge({
    id: "tidal.claim_boundary.material_response_only",
    title: "Tidal Material-Response Boundary",
    plainMeaning: "Keeps self-gravity, granular, tidal-Q, and Love-number rows in diagnostic material-response scope.",
    whyItMatters: "It prevents scalar tide rows from leaking into unrelated validation or intervention claims.",
    subjects: ["tidal", "claim_boundary", "material_response", "granular", "self_gravity"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["granular_tidal_response"],
    equationFamilies: ["granular_tidal_claim_boundary"],
    tags: ["claim_boundary", "diagnostic_only"],
    equations: [
      {
        id: "tidal_material_boundary_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{material\\ response\\ diagnostic\\ only}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [],
        outputSymbols: ["tidal_material_response_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "Tidal response rows are material-response diagnostics.",
      "No validation or intervention claim may be promoted from these scalar rows.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef("docs/knowledge/physics/granular-tidal-response-diagnostic.md", "diagnostic-only boundary"),
      docRef("docs/knowledge/math-claims/self-gravity-shape.math-claims.json", "diagnostic claim ledger"),
    ],
    hintKeys: {
      subjects: ["tidal", "claim_boundary", "material_response", "granular", "self_gravity"],
      symbols: ["tidal_material_response_boundary"],
      unitSignatures: [],
      repoPaths: [
        "docs/knowledge/physics/granular-tidal-response-diagnostic.md",
        "docs/knowledge/math-claims/self-gravity-shape.math-claims.json",
      ],
      equationFamilies: ["granular_tidal_claim_boundary"],
      simulationOwners: ["granular_tidal_response"],
    },
  }),
];

export const GRANULAR_TIDAL_LOVE_NUMBER_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "dimension_consistency_bounds_self_gravity_strength_balance",
    from: "physics.units.dimension_consistency",
    to: "self_gravity.shape.strength_balance",
    relation: "bounds",
    label: "Dimension checks bound the strength-balance radius proxy.",
    claimBoundaryNote: "Dimension checks do not certify a body model.",
  },
  {
    id: "self_gravity_strength_context_for_granular_rubble",
    from: "self_gravity.shape.strength_balance",
    to: "granular.rubble_pile.dissipation_closure",
    relation: "documents",
    label: "Strength and self-gravity context document rubble-pile response.",
    claimBoundaryNote: "Strength balance is context only.",
  },
  {
    id: "granular_dissipation_specializes_tidal_q",
    from: "granular.rubble_pile.dissipation_closure",
    to: "tidal.quality_factor.damping_proxy",
    relation: "specializes",
    label: "Tidal Q packages granular dissipation into a cycle-loss diagnostic.",
    claimBoundaryNote: "Q packages dissipation, not contact dynamics.",
  },
  {
    id: "tidal_q_documents_love_response",
    from: "tidal.quality_factor.damping_proxy",
    to: "tidal.love_number.displacement_response",
    relation: "documents",
    label: "Tidal Q and Love-number response are linked deformation diagnostics.",
    claimBoundaryNote: "Q and Love response are not full interior inversion.",
  },
  {
    id: "love_response_documents_granular_runtime_reference",
    from: "tidal.love_number.displacement_response",
    to: "tidal.runtime.granular_response_diagnostic",
    relation: "documents",
    label: "Love-number displacement points to the body-specific runtime reference.",
    claimBoundaryNote: "Runtime receipt remains required for body-specific interpretation.",
  },
  {
    id: "granular_runtime_documents_material_response_boundary",
    from: "tidal.runtime.granular_response_diagnostic",
    to: "tidal.claim_boundary.material_response_only",
    relation: "documents",
    label: "The runtime reference documents the material-response boundary.",
    claimBoundaryNote: "The lane remains diagnostic only.",
  },
  {
    id: "love_response_blocked_from_collapse_claims",
    from: "tidal.love_number.displacement_response",
    to: "tidal.claim_boundary.material_response_only",
    relation: "blocks",
    label: "Love-number response cannot promote itself beyond material response.",
    claimBoundaryNote: "Prevents leakage into unrelated validation claims.",
  },
];

export function buildGranularTidalLoveNumberTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: GRANULAR_TIDAL_LOVE_NUMBER_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: GRANULAR_TIDAL_LOVE_NUMBER_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
