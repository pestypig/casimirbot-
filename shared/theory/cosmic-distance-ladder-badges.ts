import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const COSMIC_DOC = "docs/research/starsim-accordion-galactic-dynamics-null-model-v1.md";
const COSMOLOGY_CONTEXT_PATH = "shared/starsim-accordion-cosmology-context.ts";
const ACCORDION_NULL_MODEL_PATH = "shared/starsim-accordion-galactic-null-model.ts";
const REFERENCE_FRAME_DOC = "docs/astronomy/reference-frame-layer.md";

const COSMIC_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

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

const literatureRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
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

const cosmicBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: COSMIC_BOUNDARY,
});

export const COSMIC_DISTANCE_LADDER_BADGES: TheoryBadgeV1[] = [
  cosmicBadge({
    id: "cosmic.spectral.redshift",
    title: "Spectral Redshift",
    plainMeaning: "Computes the fractional shift between a known rest wavelength and the observed wavelength.",
    whyItMatters: "It is the first scalar bridge from a spectrum to recession or cosmology context.",
    subjects: ["cosmic_distance", "spectrum", "redshift", "wavelength"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    equationFamilies: ["spectral_shift", "redshift"],
    tags: ["lambda_obs", "lambda_rest", "spectrum", "redshift", "blueshift"],
    equations: [
      {
        id: "redshift_from_wavelengths",
        role: "calculator_demo",
        displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_{rest}}{\\lambda_{rest}}",
        computableExpression: "z = (lambda_obs - lambda_rest) / lambda_rest",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda_obs", "lambda_rest"],
        outputSymbols: ["z"],
      },
    ],
    units: [
      { symbol: "z", quantity: "redshift", dimensionSignature: "1" },
      { symbol: "lambda_obs", unit: "nm", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "lambda_rest", unit: "nm", quantity: "wavelength", dimensionSignature: "L" },
    ],
    assumptions: [
      "Uses a known spectral line rest wavelength.",
      "Positive z is redshift; negative z is blueshift.",
      "Distance interpretation requires a ladder rung or cosmology model.",
    ],
    calculatorPayloads: [
      payload({
        id: "redshift_from_wavelengths_payload",
        expression: "z = (lambda_obs - lambda_rest) / lambda_rest",
        displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_{rest}}{\\lambda_{rest}}",
        targetVariable: "z",
      }),
    ],
    sourceRefs: [
      literatureRef("Spectroscopic redshift", "Canonical wavelength-shift relation."),
      repoRef(ACCORDION_NULL_MODEL_PATH, "radialVelocity_km_s", "StarSim Accordion nodes carry radial velocity and spectral context."),
    ],
    hintKeys: {
      subjects: ["redshift", "blueshift", "spectrum", "wavelength", "cosmic_distance"],
      symbols: ["z", "lambda_obs", "lambda_rest", "redshift", "blueshift"],
      unitSignatures: ["1", "L"],
      repoPaths: [ACCORDION_NULL_MODEL_PATH],
      equationFamilies: ["spectral_shift", "redshift"],
      simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    },
  }),
  cosmicBadge({
    id: "cosmic.redshift.scale_factor",
    title: "Scale Factor From Redshift",
    plainMeaning: "Relates cosmological redshift to the expansion scale factor for large-scale background context.",
    whyItMatters: "It separates the observed spectral shift from the cosmology variable used by the Accordion context.",
    subjects: ["cosmic_distance", "cosmology", "redshift", "scale_factor"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    equationFamilies: ["cosmological_redshift"],
    tags: ["scale_factor", "redshift", "accordion"],
    equations: [
      {
        id: "scale_factor_from_redshift",
        role: "calculator_demo",
        displayLatex: "a=\\frac{1}{1+z}",
        computableExpression: "a = 1 / (1 + z)",
        operatorKind: "scalar_expression",
        inputSymbols: ["z"],
        outputSymbols: ["a"],
      },
    ],
    units: [{ symbol: "a", quantity: "scale_factor", dimensionSignature: "1" }],
    assumptions: ["Large-scale background cosmology context.", "Does not imply local expansion of bound systems."],
    calculatorPayloads: [
      payload({
        id: "scale_factor_from_redshift_payload",
        expression: "a = 1 / (1 + z)",
        displayLatex: "a=\\frac{1}{1+z}",
        targetVariable: "a",
      }),
    ],
    sourceRefs: [
      repoRef(COSMOLOGY_CONTEXT_PATH, "buildStarSimAccordionCosmologyContext", "Existing Accordion redshift to scale-factor context."),
      docRef(COSMIC_DOC, "cosmology-boundary", "Expansion is background context, not local stellar-core expansion."),
    ],
    hintKeys: {
      subjects: ["redshift", "scale_factor", "cosmology", "accordion"],
      symbols: ["a", "z", "scaleFactor", "redshift"],
      unitSignatures: ["1"],
      repoPaths: [COSMOLOGY_CONTEXT_PATH],
      equationFamilies: ["cosmological_redshift"],
      simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    },
  }),
  cosmicBadge({
    id: "cosmic.parallax.distance",
    title: "Parallax Distance",
    plainMeaning: "Computes nearby-object distance in parsecs from parallax in milliarcseconds.",
    whyItMatters: "It is the local calibration rung that anchors farther standard-candle rungs.",
    subjects: ["cosmic_distance", "parallax", "astrometry", "nearby_stars"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    equationFamilies: ["parallax_distance"],
    tags: ["parallax", "parsec", "gaia", "local_calibration"],
    equations: [
      {
        id: "distance_from_parallax_mas",
        role: "calculator_demo",
        displayLatex: "d_{pc}=\\frac{1000}{\\pi_{mas}}",
        computableExpression: "d_pc = 1000 / parallax_mas",
        operatorKind: "scalar_expression",
        inputSymbols: ["parallax_mas"],
        outputSymbols: ["d_pc"],
      },
    ],
    units: [
      { symbol: "d_pc", unit: "pc", quantity: "distance", dimensionSignature: "L" },
      { symbol: "parallax_mas", unit: "mas", quantity: "angle", dimensionSignature: "1" },
    ],
    assumptions: ["Small-angle parallax relation.", "Best for local calibration objects with reliable astrometry."],
    calculatorPayloads: [
      payload({
        id: "distance_from_parallax_payload",
        expression: "d_pc = 1000 / parallax_mas",
        displayLatex: "d_{pc}=\\frac{1000}{\\pi_{mas}}",
        targetVariable: "d_pc",
      }),
    ],
    sourceRefs: [
      docRef(REFERENCE_FRAME_DOC, "parallax-derived-distance", "Reference-frame layer already names parallax-derived distance."),
      repoRef(ACCORDION_NULL_MODEL_PATH, "parallax_mas", "StarSim Accordion star nodes accept parallax and distance fields."),
    ],
    hintKeys: {
      subjects: ["parallax", "astrometry", "distance", "nearby_stars"],
      symbols: ["d_pc", "parallax_mas", "distance_pc"],
      unitSignatures: ["L", "1"],
      repoPaths: [REFERENCE_FRAME_DOC, ACCORDION_NULL_MODEL_PATH],
      equationFamilies: ["parallax_distance"],
      simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    },
  }),
  cosmicBadge({
    id: "cosmic.cepheid.period_luminosity",
    title: "Cepheid Period-Luminosity",
    plainMeaning: "Uses a Cepheid pulsation period with calibration constants to estimate absolute magnitude.",
    whyItMatters: "It is the variable-star rung that turns a measured period into a standard-candle estimate.",
    subjects: ["cosmic_distance", "cepheid", "period", "standard_candle"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["cosmic_distance_ladder"],
    equationFamilies: ["cepheid_period_luminosity"],
    tags: ["cepheid", "period_luminosity", "standard_candle", "calibration"],
    equations: [
      {
        id: "cepheid_absolute_magnitude",
        role: "calculator_demo",
        displayLatex: "M=\\alpha\\log_{10}(P_{days})+\\beta",
        computableExpression: "M_abs = alpha * log(P_days) / log(10) + beta",
        operatorKind: "scalar_expression",
        inputSymbols: ["alpha", "P_days", "beta"],
        outputSymbols: ["M_abs"],
      },
    ],
    units: [
      { symbol: "P_days", unit: "day", quantity: "period", dimensionSignature: "T" },
      { symbol: "M_abs", unit: "mag", quantity: "absolute_magnitude", dimensionSignature: "1" },
    ],
    assumptions: [
      "Calibration constants alpha and beta must come from the chosen Cepheid band/calibration.",
      "Metallicity, extinction, and bandpass corrections are outside this scalar demo row.",
    ],
    calculatorPayloads: [
      payload({
        id: "cepheid_absolute_magnitude_payload",
        expression: "M_abs = alpha * log(P_days) / log(10) + beta",
        displayLatex: "M=\\alpha\\log_{10}(P_{days})+\\beta",
        targetVariable: "M_abs",
      }),
    ],
    sourceRefs: [literatureRef("Cepheid period-luminosity relation", "Canonical distance-ladder rung.")],
    hintKeys: {
      subjects: ["cepheid", "period", "standard_candle", "distance_ladder"],
      symbols: ["P_days", "M_abs", "alpha", "beta"],
      unitSignatures: ["T", "1"],
      repoPaths: [],
      equationFamilies: ["cepheid_period_luminosity"],
      simulationOwners: ["cosmic_distance_ladder"],
    },
  }),
  cosmicBadge({
    id: "cosmic.standard_candle.distance_modulus",
    title: "Distance Modulus",
    plainMeaning: "Converts apparent and absolute magnitude into distance in parsecs.",
    whyItMatters: "It turns a calibrated standard candle into a calculator-loadable distance estimate.",
    subjects: ["cosmic_distance", "standard_candle", "magnitude", "distance"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["cosmic_distance_ladder"],
    equationFamilies: ["distance_modulus"],
    tags: ["apparent_magnitude", "absolute_magnitude", "parsec"],
    equations: [
      {
        id: "distance_modulus_parsec",
        role: "calculator_demo",
        displayLatex: "d_{pc}=10^{(m-M+5)/5}",
        computableExpression: "d_pc = 10^((m_app - M_abs + 5)/5)",
        operatorKind: "scalar_expression",
        inputSymbols: ["m_app", "M_abs"],
        outputSymbols: ["d_pc"],
      },
    ],
    units: [
      { symbol: "d_pc", unit: "pc", quantity: "distance", dimensionSignature: "L" },
      { symbol: "m_app", unit: "mag", quantity: "apparent_magnitude", dimensionSignature: "1" },
      { symbol: "M_abs", unit: "mag", quantity: "absolute_magnitude", dimensionSignature: "1" },
    ],
    assumptions: ["Extinction and bandpass corrections must be handled before using this row as a calibrated estimate."],
    calculatorPayloads: [
      payload({
        id: "distance_modulus_payload",
        expression: "d_pc = 10^((m_app - M_abs + 5)/5)",
        displayLatex: "d_{pc}=10^{(m-M+5)/5}",
        targetVariable: "d_pc",
      }),
    ],
    sourceRefs: [literatureRef("Distance modulus", "Standard relation for astronomical distance estimates.")],
    hintKeys: {
      subjects: ["distance_modulus", "standard_candle", "magnitude", "distance"],
      symbols: ["d_pc", "m_app", "M_abs"],
      unitSignatures: ["L", "1"],
      repoPaths: [],
      equationFamilies: ["distance_modulus"],
      simulationOwners: ["cosmic_distance_ladder"],
    },
  }),
  cosmicBadge({
    id: "cosmic.low_z.hubble_distance",
    title: "Low-z Hubble Distance",
    plainMeaning: "Estimates distance from redshift using the low-redshift Hubble-law approximation.",
    whyItMatters: "It is a calculator-visible rung for prompts that ask for approximate cosmological distance from small redshift.",
    subjects: ["cosmic_distance", "hubble_law", "redshift", "cosmology"],
    level: "model",
    status: "review",
    simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    equationFamilies: ["hubble_law_low_z"],
    tags: ["H0", "low_z", "luminosity_distance", "recession"],
    equations: [
      {
        id: "low_z_hubble_distance",
        role: "calculator_demo",
        displayLatex: "d_{Mpc}\\approx\\frac{c z}{H_0}",
        computableExpression: "d_Mpc = c_km_s * z / H0_km_s_Mpc",
        operatorKind: "scalar_expression",
        inputSymbols: ["c_km_s", "z", "H0_km_s_Mpc"],
        outputSymbols: ["d_Mpc"],
      },
    ],
    units: [
      { symbol: "d_Mpc", unit: "Mpc", quantity: "distance", dimensionSignature: "L" },
      { symbol: "H0_km_s_Mpc", unit: "km/s/Mpc", quantity: "hubble_constant", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "Low-redshift approximation only.",
      "For larger redshift, use an explicit cosmology model and distance definition.",
    ],
    calculatorPayloads: [
      payload({
        id: "low_z_hubble_distance_payload",
        expression: "d_Mpc = c_km_s * z / H0_km_s_Mpc",
        displayLatex: "d_{Mpc}\\approx\\frac{c z}{H_0}",
        targetVariable: "d_Mpc",
      }),
    ],
    sourceRefs: [
      literatureRef("Hubble law low-redshift approximation", "Approximate distance relation for small redshift."),
      repoRef(COSMOLOGY_CONTEXT_PATH, "distances", "Accordion context stores cosmological distance fields when supplied."),
    ],
    hintKeys: {
      subjects: ["hubble_law", "redshift", "cosmology", "distance"],
      symbols: ["d_Mpc", "c_km_s", "z", "H0_km_s_Mpc"],
      unitSignatures: ["L", "T^-1", "1"],
      repoPaths: [COSMOLOGY_CONTEXT_PATH],
      equationFamilies: ["hubble_law_low_z"],
      simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    },
  }),
  cosmicBadge({
    id: "cosmic.runtime.accordion_context",
    title: "Accordion Cosmology Context",
    plainMeaning: "Represents the existing StarSim Accordion context for redshift, scale factor, and cosmological distance fields.",
    whyItMatters: "It tells Helix that some cosmology answers are context receipts, not scalar calculator-only solves.",
    subjects: ["cosmic_distance", "cosmology", "accordion", "runtime_context"],
    level: "simulation_specific",
    status: "project_derived",
    simulationOwners: ["starsim_accordion", "cosmic_distance_ladder"],
    equationFamilies: ["accordion_cosmology_context"],
    tags: ["accordion", "runtime_context", "cosmology"],
    equations: [
      {
        id: "accordion_context_receipt",
        role: "noncomputable_reference",
        displayLatex: "buildStarSimAccordionCosmologyContext(input)\\rightarrow context",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["z", "scaleFactor", "distances"],
        outputSymbols: ["accordionContext"],
      },
    ],
    units: [{ symbol: "accordionContext", quantity: "runtime_context", dimensionSignature: "context" }],
    assumptions: ["Runtime/context row only.", "Does not make bound stellar or galactic systems locally expand."],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(COSMOLOGY_CONTEXT_PATH, "buildStarSimAccordionCosmologyContext", "Existing redshift/scale-factor/distance context builder."),
      docRef(COSMIC_DOC, "accordion-boundary", "Cosmological context boundary notes."),
    ],
    hintKeys: {
      subjects: ["accordion", "cosmology", "redshift", "scale_factor", "distance"],
      symbols: ["redshift", "scaleFactor", "luminosityDistance_Mpc", "angularDiameterDistance_Mpc"],
      unitSignatures: ["context", "L", "1"],
      repoPaths: [COSMOLOGY_CONTEXT_PATH],
      equationFamilies: ["accordion_cosmology_context"],
      simulationOwners: ["starsim_accordion", "cosmic_distance_ladder"],
    },
  }),
  cosmicBadge({
    id: "cosmic.claim_boundary.distance_ladder_context",
    title: "Cosmic Ladder Boundary",
    plainMeaning: "Keeps distance-ladder estimates tied to calibration, model choice, and scale limits.",
    whyItMatters: "It prevents redshift or standard-candle rows from being read as model-free distance proof.",
    subjects: ["cosmic_distance", "claim_boundary", "calibration"],
    level: "claim_boundary",
    status: "review",
    simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    equationFamilies: ["distance_ladder_boundary"],
    tags: ["claim_boundary", "calibration", "model_dependent"],
    equations: [
      {
        id: "distance_ladder_boundary",
        role: "noncomputable_reference",
        displayLatex: "distance\\_estimate\\Rightarrow calibration+model+uncertainty",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["distance_estimate"],
        outputSymbols: ["claimBoundary"],
      },
    ],
    units: [{ symbol: "claimBoundary", quantity: "interpretation_boundary", dimensionSignature: "context" }],
    assumptions: [
      "Cepheid and standard-candle distances require calibration and uncertainty context.",
      "Low-z Hubble distance is an approximation, not a complete cosmological inference.",
      "Accordion cosmology context does not imply local expansion for bound systems.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef(COSMIC_DOC, "bound-system-caveat", "Cosmology context is not local stellar-core expansion."),
      repoRef(COSMOLOGY_CONTEXT_PATH, "caveats", "Existing context caveats are explicit in the contract."),
    ],
    hintKeys: {
      subjects: ["claim_boundary", "cosmic_distance", "calibration", "model_dependent"],
      symbols: ["claimBoundary", "distance_estimate"],
      unitSignatures: ["context"],
      repoPaths: [COSMIC_DOC, COSMOLOGY_CONTEXT_PATH],
      equationFamilies: ["distance_ladder_boundary"],
      simulationOwners: ["cosmic_distance_ladder", "starsim_accordion"],
    },
  }),
];

export const COSMIC_DISTANCE_LADDER_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "dimension_consistency_to_parallax_distance",
    from: "physics.units.dimension_consistency",
    to: "cosmic.parallax.distance",
    relation: "requires",
    label: "Parallax distance keeps angle and distance units explicit.",
    claimBoundaryNote: "Local calibration still needs astrometric uncertainty context.",
  },
  {
    id: "atomic_line_identification_to_spectral_redshift",
    from: "stellar.spectroscopy.atomic_line_identification_context",
    to: "cosmic.spectral.redshift",
    relation: "documents",
    label: "A calibrated rest-frame spectral-line identification supplies the wavelength reference used for redshift.",
    claimBoundaryNote: "Line identification and propagation context are required before cosmological interpretation.",
  },
  {
    id: "speed_of_light_to_hubble_distance",
    from: "physics.constants.speed_of_light",
    to: "cosmic.low_z.hubble_distance",
    relation: "uses_constant",
    label: "Low-z Hubble distance uses c in km/s.",
    claimBoundaryNote: "Approximation only; not a full cosmology integration.",
  },
  {
    id: "redshift_to_scale_factor",
    from: "cosmic.spectral.redshift",
    to: "cosmic.redshift.scale_factor",
    relation: "derives",
    label: "A measured redshift can be converted into scale-factor context.",
    claimBoundaryNote: "Large-scale background interpretation only.",
  },
  {
    id: "redshift_to_hubble_distance",
    from: "cosmic.spectral.redshift",
    to: "cosmic.low_z.hubble_distance",
    relation: "approximates",
    label: "Small redshift can feed the Hubble-law distance approximation.",
    claimBoundaryNote: "Use explicit cosmology for larger redshift.",
  },
  {
    id: "scale_factor_to_accordion_context",
    from: "cosmic.redshift.scale_factor",
    to: "cosmic.runtime.accordion_context",
    relation: "documents",
    label: "Scale factor is represented in the existing Accordion cosmology context.",
    claimBoundaryNote: "Context receipt, not a scalar solve.",
  },
  {
    id: "parallax_to_cepheid_calibration",
    from: "cosmic.parallax.distance",
    to: "cosmic.cepheid.period_luminosity",
    relation: "requires",
    label: "Parallax anchors local calibration before Cepheid ladder use.",
    claimBoundaryNote: "Calibration constants must be stated.",
  },
  {
    id: "cepheid_to_distance_modulus",
    from: "cosmic.cepheid.period_luminosity",
    to: "cosmic.standard_candle.distance_modulus",
    relation: "derives",
    label: "Cepheid absolute magnitude feeds the distance modulus rung.",
    claimBoundaryNote: "Extinction and bandpass corrections remain outside the scalar demo.",
  },
  {
    id: "distance_modulus_to_cosmic_boundary",
    from: "cosmic.standard_candle.distance_modulus",
    to: "cosmic.claim_boundary.distance_ladder_context",
    relation: "diagnostic_checks",
    label: "Standard-candle distances carry calibration and uncertainty boundaries.",
    claimBoundaryNote: "Distance estimate is model/calibration dependent.",
  },
  {
    id: "hubble_distance_to_cosmic_boundary",
    from: "cosmic.low_z.hubble_distance",
    to: "cosmic.claim_boundary.distance_ladder_context",
    relation: "diagnostic_checks",
    label: "Hubble distance estimates carry cosmology model boundaries.",
    claimBoundaryNote: "Low-z approximation should be named.",
  },
  {
    id: "accordion_context_to_cosmic_boundary",
    from: "cosmic.runtime.accordion_context",
    to: "cosmic.claim_boundary.distance_ladder_context",
    relation: "diagnostic_checks",
    label: "Accordion cosmology context carries bound-system caveats.",
    claimBoundaryNote: "No local expansion claim for bound systems.",
  },
];

export function buildCosmicDistanceLadderBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: COSMIC_DISTANCE_LADDER_BADGES,
    edges: COSMIC_DISTANCE_LADDER_EDGES,
  };
}
