import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const SPECTRAL_IDENTIFICATION_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const repoRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
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

const spectroscopyBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: SPECTRAL_IDENTIFICATION_BOUNDARY,
});

export const STELLAR_SPECTROSCOPY_ASTROCHEMISTRY_THEORY_BADGES: TheoryBadgeV1[] = [
  spectroscopyBadge({
    id: "starsim.reference.stellar_spectral_abundance_context",
    title: "StarSim Stellar Spectral-Abundance Context",
    plainMeaning:
      "Represents StarSim stellar type, surface-temperature, fusion-stage, and composition context as priors for spectroscopy interpretation.",
    whyItMatters:
      "It gives Helix a traceable bridge from simulated stellar state to spectral abundance priors without claiming StarSim solves astrochemistry.",
    subjects: ["starsim", "stellar_reference", "stellar_type", "spectroscopy", "abundance_prior"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["starsim", "stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["stellar_spectral_context", "abundance_prior_context"],
    tags: ["starsim_overlap", "stellar_context", "noncomputable_reference"],
    equations: [
      {
        id: "stellar_spectral_abundance_context_reference",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{spectral\\ prior}=\\mathrm{context}(\\mathrm{stellar\\ type},M,Z,\\mathrm{fusion\\ stage})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["stellar_type", "M", "Z", "fusion_stage"],
        outputSymbols: ["stellar_spectral_abundance_context"],
      },
    ],
    units: [
      { symbol: "M", unit: "kg", quantity: "mass", dimensionSignature: "M" },
      { symbol: "Z", unit: null, quantity: "metallicity_fraction", dimensionSignature: "1" },
    ],
    assumptions: [
      "StarSim context is a reduced-order prior for stellar class and fusion state.",
      "This row does not assert that StarSim simulates molecular formation, PAHs, fullerenes, or prebiotic chemistry.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef("shared/theory/starsim-theory-badges.ts", "StarSim reduced-order badge branch."),
      repoRef("shared/starsim-fusion-microphysics.ts", "StarSim fusion microphysics support."),
      literatureRef("OpenStax-Astronomy-HR-Diagram", "Stellar structure depends mainly on mass and composition for equilibrium fusion-powered stars."),
      literatureRef("OpenStax-Astronomy-Stellar-Spectra", "Spectral classes are surface-temperature measures with composition caveats."),
    ],
    hintKeys: {
      subjects: ["starsim", "stellar_reference", "stellar_type", "spectroscopy", "abundance_prior"],
      symbols: ["stellar_type", "M", "Z", "fusion_stage", "stellar_spectral_abundance_context"],
      unitSignatures: ["M", "1"],
      repoPaths: ["shared/theory/starsim-theory-badges.ts", "shared/starsim-fusion-microphysics.ts"],
      equationFamilies: ["stellar_spectral_context", "abundance_prior_context"],
      simulationOwners: ["starsim", "stellar_reference", "astrochemistry_prebiotic"],
    },
  }),
  spectroscopyBadge({
    id: "starsim.nucleosynthesis.element_yield_prior",
    title: "StarSim Element Yield Prior",
    plainMeaning:
      "Represents stellar fusion and nucleosynthesis outputs as reduced-order element-yield priors for spectral interpretation.",
    whyItMatters:
      "It connects stellar reaction-network context to observable abundance hypotheses while keeping detailed yield modeling out of scope.",
    subjects: ["starsim", "nucleosynthesis", "element_yield", "reaction_network", "abundance_prior"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["starsim", "stellar_reference"],
    equationFamilies: ["stellar_reaction_network", "element_yield_prior"],
    tags: ["yield_prior", "reaction_network_context", "noncomputable_reference"],
    equations: [
      {
        id: "element_yield_prior_context",
        role: "noncomputable_reference",
        displayLatex: "Y_{element}=\\mathrm{context}(\\mathrm{stellar\\ type},M,Z,\\mathrm{fusion\\ stage})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["stellar_type", "M", "Z", "fusion_stage"],
        outputSymbols: ["element_yield_prior"],
      },
      {
        id: "reaction_network_abundance_context",
        role: "noncomputable_reference",
        displayLatex: "\\frac{dY_i}{dt}=\\sum_j R_{ji}-\\sum_k R_{ik}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Y_i", "R_ji", "R_ik"],
        outputSymbols: ["dY_i_dt"],
      },
    ],
    units: [
      { symbol: "Y_i", unit: null, quantity: "abundance", dimensionSignature: "1" },
      { symbol: "element_yield_prior", unit: null, quantity: "yield_prior", dimensionSignature: "1" },
    ],
    assumptions: [
      "Element yield priors are reduced-order context unless an explicit yield table or runtime receipt is attached.",
      "Nucleosynthesis context constrains abundance hypotheses; it does not identify molecular bands by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef("shared/theory/solar-stellar-reference-theory-badges.ts", "Stellar nucleosynthesis context row."),
      literatureRef("MESA-reaction-networks", "Stellar reaction networks track isotope abundances and reaction sets."),
      literatureRef("ComputationalAstrophysics-reaction-networks", "Reaction networks solve abundance ODEs for nuclei."),
    ],
    hintKeys: {
      subjects: ["starsim", "nucleosynthesis", "element_yield", "reaction_network", "abundance_prior"],
      symbols: ["stellar_type", "M", "Z", "fusion_stage", "Y_i", "R_ji", "R_ik", "element_yield_prior"],
      unitSignatures: ["1", "M"],
      repoPaths: ["shared/theory/solar-stellar-reference-theory-badges.ts"],
      equationFamilies: ["stellar_reaction_network", "element_yield_prior"],
      simulationOwners: ["starsim", "stellar_reference"],
    },
  }),
  spectroscopyBadge({
    id: "stellar.spectroscopy.atomic_line_identification_context",
    title: "Atomic Line Identification Context",
    plainMeaning:
      "Represents redshift-corrected atomic or ionic spectral-line matching as candidate element identification context.",
    whyItMatters:
      "It makes the path from observed wavelength to candidate atoms or ions calculator-loadable before any abundance or astrochemistry interpretation.",
    subjects: ["stellar_spectroscopy", "atomic_line", "redshift", "spectral_identification", "abundance"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["spectral_observable", "redshift_correction", "planck_relation", "atomic_line_identification"],
    tags: ["spectroscopy", "calculator_loadable", "line_identification"],
    equations: [
      {
        id: "spectral_feature_frequency",
        role: "calculator_demo",
        displayLatex: "f=c/\\lambda",
        computableExpression: "f_Hz = c/lambda_m",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "lambda_m"],
        outputSymbols: ["f_Hz"],
      },
      {
        id: "spectral_feature_energy",
        role: "calculator_demo",
        displayLatex: "E=h f",
        computableExpression: "E_J = h*f_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "f_Hz"],
        outputSymbols: ["E_J"],
      },
      {
        id: "spectral_redshift",
        role: "calculator_demo",
        displayLatex: "z=(\\lambda_{obs}-\\lambda_{rest})/\\lambda_{rest}",
        computableExpression: "z = (lambda_obs - lambda_rest)/lambda_rest",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda_obs", "lambda_rest"],
        outputSymbols: ["z"],
      },
      {
        id: "spectral_rest_wavelength",
        role: "calculator_demo",
        displayLatex: "\\lambda_{rest}=\\lambda_{obs}/(1+z)",
        computableExpression: "lambda_rest = lambda_obs/(1 + z)",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda_obs", "z"],
        outputSymbols: ["lambda_rest"],
      },
    ],
    units: [
      { symbol: "lambda_m", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "lambda_obs", unit: "m", quantity: "observed_wavelength", dimensionSignature: "L" },
      { symbol: "lambda_rest", unit: "m", quantity: "rest_wavelength", dimensionSignature: "L" },
      { symbol: "z", unit: null, quantity: "redshift", dimensionSignature: "1" },
      { symbol: "f_Hz", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "E_J", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "Observed wavelengths require calibration and redshift context before line matching.",
      "Atomic line matching identifies candidate atoms or ions; it does not prove a formation pathway.",
    ],
    calculatorPayloads: [
      payload({
        id: "spectral_feature_frequency_payload",
        expression: "f_Hz = c/lambda_m",
        displayLatex: "f=c/\\lambda",
        targetVariable: "f_Hz",
      }),
      payload({
        id: "spectral_feature_energy_payload",
        expression: "E_J = h*f_Hz",
        displayLatex: "E=h f",
        targetVariable: "E_J",
      }),
      payload({
        id: "spectral_redshift_payload",
        expression: "z = (lambda_obs - lambda_rest)/lambda_rest",
        displayLatex: "z=(\\lambda_{obs}-\\lambda_{rest})/\\lambda_{rest}",
        targetVariable: "z",
      }),
      payload({
        id: "spectral_rest_wavelength_payload",
        expression: "lambda_rest = lambda_obs/(1 + z)",
        displayLatex: "\\lambda_{rest}=\\lambda_{obs}/(1+z)",
        targetVariable: "lambda_rest",
      }),
    ],
    sourceRefs: [
      literatureRef("NASA-Spectroscopy-101", "Spectral signatures carry temperature, density, and composition context."),
      literatureRef("NIST-Atomic-Spectra-Database", "Critically evaluated atomic wavelengths, energy levels, and transition data."),
      literatureRef("OpenStax-Astronomy-Stellar-Spectra", "Stellar spectra and spectral classes require temperature context."),
    ],
    hintKeys: {
      subjects: ["stellar_spectroscopy", "atomic_line", "redshift", "spectral_identification", "abundance"],
      symbols: ["lambda_m", "lambda_obs", "lambda_rest", "z", "f_Hz", "E_J", "c", "h"],
      unitSignatures: ["L", "1", "T^-1", "M L^2 T^-2"],
      repoPaths: [],
      equationFamilies: ["spectral_observable", "redshift_correction", "planck_relation", "atomic_line_identification"],
      simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    },
  }),
  spectroscopyBadge({
    id: "stellar.spectroscopy.abundance_proxy_equivalent_width",
    title: "Equivalent-Width Abundance Proxy",
    plainMeaning:
      "Represents line-strength or equivalent-width ratios as a diagnostic abundance proxy that still requires atmospheric modeling for serious abundance claims.",
    whyItMatters:
      "It lets Helix compare observed line strength with reference features while preventing proxy values from becoming certified composition claims.",
    subjects: ["stellar_spectroscopy", "abundance_proxy", "equivalent_width", "line_strength"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["abundance_proxy", "equivalent_width_context", "claim_boundary"],
    tags: ["spectroscopy", "calculator_loadable", "abundance_proxy"],
    equations: [
      {
        id: "abundance_proxy_ratio",
        role: "calculator_demo",
        displayLatex: "A_{proxy}=S_{line}/S_{ref}",
        computableExpression: "abundance_proxy = line_strength/reference_line_strength",
        operatorKind: "scalar_expression",
        inputSymbols: ["line_strength", "reference_line_strength"],
        outputSymbols: ["abundance_proxy"],
      },
    ],
    units: [
      { symbol: "line_strength", unit: null, quantity: "line_strength", dimensionSignature: "1" },
      { symbol: "reference_line_strength", unit: null, quantity: "reference_line_strength", dimensionSignature: "1" },
      { symbol: "abundance_proxy", unit: null, quantity: "relative_abundance_proxy", dimensionSignature: "1" },
    ],
    assumptions: [
      "Equivalent-width or line-strength ratios are proxy diagnostics.",
      "A serious abundance claim requires atmospheric conditions, continuum placement, calibration, and radiative-transfer/model context.",
    ],
    calculatorPayloads: [
      payload({
        id: "abundance_proxy_ratio_payload",
        expression: "abundance_proxy = line_strength/reference_line_strength",
        displayLatex: "A_{proxy}=S_{line}/S_{ref}",
        targetVariable: "abundance_proxy",
      }),
    ],
    sourceRefs: [
      literatureRef("LibreTexts-curve-of-growth-equivalent-width", "Equivalent width relates line strength and abundance through modeling assumptions."),
      literatureRef("NIST-Atomic-Spectra-Database", "Atomic spectral-line reference data."),
    ],
    hintKeys: {
      subjects: ["stellar_spectroscopy", "abundance_proxy", "equivalent_width", "line_strength"],
      symbols: ["line_strength", "reference_line_strength", "abundance_proxy"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["abundance_proxy", "equivalent_width_context", "claim_boundary"],
      simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    },
  }),
  spectroscopyBadge({
    id: "astrochemistry.spectroscopy.molecular_band_identification_context",
    title: "Molecular Band Identification Context",
    plainMeaning:
      "Represents redshift-corrected molecular or dust band matching for astrochemical candidates such as PAH-family bands and C60 features.",
    whyItMatters:
      "It bridges stellar/atomic spectroscopy to molecular astrochemistry without asserting that a matched band proves a formation pathway.",
    subjects: ["astrochemistry", "molecular_band", "dust_band", "pah", "c60", "spectroscopy"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    equationFamilies: ["molecular_band_identification", "spectral_observable", "planck_relation", "redshift_correction"],
    tags: ["astrochemistry", "molecular_band", "calculator_loadable"],
    equations: [
      {
        id: "molecular_band_energy",
        role: "calculator_demo",
        displayLatex: "E_{band}=h c/\\lambda_{band,rest}",
        computableExpression: "E_band_J = h*c/lambda_band_rest_m",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "c", "lambda_band_rest_m"],
        outputSymbols: ["E_band_J"],
      },
      {
        id: "molecular_band_rest_wavelength",
        role: "calculator_demo",
        displayLatex: "\\lambda_{band,rest}=\\lambda_{band,obs}/(1+z)",
        computableExpression: "lambda_band_rest_m = lambda_band_obs_m/(1 + z)",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda_band_obs_m", "z"],
        outputSymbols: ["lambda_band_rest_m"],
      },
    ],
    units: [
      { symbol: "lambda_band_obs_m", unit: "m", quantity: "observed_band_wavelength", dimensionSignature: "L" },
      { symbol: "lambda_band_rest_m", unit: "m", quantity: "rest_band_wavelength", dimensionSignature: "L" },
      { symbol: "E_band_J", unit: "J", quantity: "band_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "z", unit: null, quantity: "redshift", dimensionSignature: "1" },
    ],
    assumptions: [
      "Molecular band matching requires instrument, continuum, temperature, and environment context.",
      "PAH-family and C60 band matches are astrochemical candidates, not biological or consciousness evidence.",
    ],
    calculatorPayloads: [
      payload({
        id: "molecular_band_energy_payload",
        expression: "E_band_J = h*c/lambda_band_rest_m",
        displayLatex: "E_{band}=h c/\\lambda_{band,rest}",
        targetVariable: "E_band_J",
      }),
      payload({
        id: "molecular_band_rest_wavelength_payload",
        expression: "lambda_band_rest_m = lambda_band_obs_m/(1 + z)",
        displayLatex: "\\lambda_{band,rest}=\\lambda_{band,obs}/(1+z)",
        targetVariable: "lambda_band_rest_m",
      }),
    ],
    sourceRefs: [
      literatureRef("Springer-C60-circumstellar-environments", "C60 IR vibrational modes and circumstellar environment caveats."),
      literatureRef("NatureAstronomy-Spitzer-PAH-review", "PAH infrared emission bands and astrophysical implications."),
      docRef("docs/knowledge/physics/interstellar-pah-chemistry.md"),
    ],
    hintKeys: {
      subjects: ["astrochemistry", "molecular_band", "dust_band", "pah", "c60", "spectroscopy"],
      symbols: ["lambda_band_obs_m", "lambda_band_rest_m", "E_band_J", "z", "h", "c"],
      unitSignatures: ["L", "M L^2 T^-2", "1"],
      repoPaths: ["docs/knowledge/physics/interstellar-pah-chemistry.md"],
      equationFamilies: ["molecular_band_identification", "spectral_observable", "planck_relation", "redshift_correction"],
      simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    },
  }),
  spectroscopyBadge({
    id: "astrochemistry.claim_boundary.spectral_identification_only",
    title: "Spectral Identification Only Boundary",
    plainMeaning:
      "Blocks spectral feature matches from promoting into formation-pathway, biological, consciousness, objective-collapse, or StarSim validation claims.",
    whyItMatters:
      "It lets the graph retrieve spectral evidence while keeping the interpretation at candidate-identification maturity.",
    subjects: ["astrochemistry", "spectroscopy", "claim_boundary", "spectral_identification"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["astrochemistry_prebiotic", "stellar_reference", "starsim"],
    equationFamilies: ["spectral_identification_boundary", "claim_boundary"],
    tags: ["claim_boundary", "spectroscopy", "blocks_promotion"],
    equations: [
      {
        id: "spectral_identification_boundary_reference",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{spectral\\ match}\\nRightarrow\\mathrm{formation\\ pathway\\ or\\ biology\\ validation}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [],
        outputSymbols: ["spectral_identification_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "Spectral feature matching identifies candidate atoms, ions, molecules, or dust families under temperature, density, redshift, instrument, and model assumptions.",
      "Spectral matches do not prove formation pathway, biological relevance, consciousness, objective collapse, or StarSim runtime validation.",
      "Detailed abundance claims require atmospheric or radiative-transfer modeling beyond scalar proxy rows.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("NASA-Spectroscopy-101", "Spectroscopy identifies signatures under physical context."),
      literatureRef("NIST-Atomic-Spectra-Database", "Atomic spectral-line reference data."),
      literatureRef("NatureAstronomy-Spitzer-PAH-review", "PAH-band interpretation caveats."),
      literatureRef("Springer-C60-circumstellar-environments", "C60-band interpretation caveats."),
    ],
    hintKeys: {
      subjects: ["astrochemistry", "spectroscopy", "claim_boundary", "spectral_identification"],
      symbols: ["spectral_identification_boundary"],
      unitSignatures: [],
      repoPaths: [],
      equationFamilies: ["spectral_identification_boundary", "claim_boundary"],
      simulationOwners: ["astrochemistry_prebiotic", "stellar_reference", "starsim"],
    },
  }),
];

export const STELLAR_SPECTROSCOPY_ASTROCHEMISTRY_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "starsim_spectral_context_documents_element_yield_prior",
    from: "starsim.reference.stellar_spectral_abundance_context",
    to: "starsim.nucleosynthesis.element_yield_prior",
    relation: "documents",
    label: "StarSim stellar context documents reduced-order element-yield priors.",
    claimBoundaryNote: "StarSim priors do not certify detailed stellar yields or astrochemical formation.",
  },
  {
    id: "element_yield_prior_documents_atomic_line_context",
    from: "starsim.nucleosynthesis.element_yield_prior",
    to: "stellar.spectroscopy.atomic_line_identification_context",
    relation: "documents",
    label: "Element-yield priors provide context for atomic or ionic line identification.",
    claimBoundaryNote: "Abundance priors are not line detections.",
  },
  {
    id: "atomic_line_context_requires_abundance_proxy",
    from: "stellar.spectroscopy.atomic_line_identification_context",
    to: "stellar.spectroscopy.abundance_proxy_equivalent_width",
    relation: "requires",
    label: "Line identification requires strength or equivalent-width context before abundance interpretation.",
    claimBoundaryNote: "Equivalent width remains a proxy without atmosphere modeling.",
  },
  {
    id: "atomic_line_context_documents_molecular_band_context",
    from: "stellar.spectroscopy.atomic_line_identification_context",
    to: "astrochemistry.spectroscopy.molecular_band_identification_context",
    relation: "documents",
    label: "Atomic and redshift-corrected spectroscopy context documents molecular band interpretation.",
    claimBoundaryNote: "Atomic-line context does not imply molecular formation.",
  },
  {
    id: "molecular_band_context_documents_pah_spectral_family",
    from: "astrochemistry.spectroscopy.molecular_band_identification_context",
    to: "astrochemistry.pah.spectral_family_context",
    relation: "documents",
    label: "Molecular band context documents PAH-family spectral interpretation.",
    claimBoundaryNote: "PAH band context is not life, dopamine, or consciousness evidence.",
  },
  {
    id: "molecular_band_context_documents_c60_stellar_context",
    from: "astrochemistry.spectroscopy.molecular_band_identification_context",
    to: "astrochemistry.fullerene.c60_stellar_context",
    relation: "documents",
    label: "Molecular band context documents C60 stellar and circumstellar feature interpretation.",
    claimBoundaryNote: "C60 band context is astrochemistry, not formation-pathway proof.",
  },
  {
    id: "abundance_proxy_blocks_spectral_overclaim",
    from: "stellar.spectroscopy.abundance_proxy_equivalent_width",
    to: "astrochemistry.claim_boundary.spectral_identification_only",
    relation: "blocks",
    label: "Abundance proxy rows cannot promote into formation-pathway or validation claims.",
    claimBoundaryNote: "Proxy abundance rows require model context and remain diagnostic.",
  },
  {
    id: "molecular_band_context_blocks_spectral_overclaim",
    from: "astrochemistry.spectroscopy.molecular_band_identification_context",
    to: "astrochemistry.claim_boundary.spectral_identification_only",
    relation: "blocks",
    label: "Molecular band matches cannot promote into biological, consciousness, or objective-collapse claims.",
    claimBoundaryNote: "Spectral identification is candidate context only.",
  },
  {
    id: "spectral_boundary_documents_prebiotic_boundary",
    from: "astrochemistry.claim_boundary.spectral_identification_only",
    to: "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    relation: "documents",
    label: "The spectral identification boundary points to the broader prebiotic consciousness boundary.",
    claimBoundaryNote: "Spectroscopy adjacency is boundary context, not consciousness evidence.",
  },
];

export function buildStellarSpectroscopyAstrochemistryTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: STELLAR_SPECTROSCOPY_ASTROCHEMISTRY_THEORY_BADGES.map((badge: TheoryBadgeV1) => ({ ...badge })),
    edges: STELLAR_SPECTROSCOPY_ASTROCHEMISTRY_THEORY_EDGES.map((edge: TheoryBadgeEdgeV1) => ({ ...edge })),
  };
}
