import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const SOLAR_SPECTRUM_PATH = "shared/solar-spectrum-analysis.ts";
const SOLAR_SPECTRUM_INGEST_PATH = "server/services/essence/solar-spectrum-ingest.ts";
const SOLAR_SPECTRUM_MODELS_PATH = "server/services/essence/solar-spectrum-models.ts";
const SOLAR_MODEL_FIT_TEST_PATH = "tests/solar-model-fit.spec.ts";
const SOLAR_INGEST_TEST_PATH = "tests/solar-spectrum-ingest.spec.ts";
const SOLAR_FLARE_CONTRACT_PATH = "shared/solar-flare-observable-contract.v1.ts";
const SOLAR_ENERGY_ADAPTER_PATH = "server/services/essence/solar-energy-adapter.ts";
const SOLAR_RADIATIVE_TREE_PATH = "docs/knowledge/physics/solar-radiative-observables-tree.json";

const SOLAR_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const testRef = (path: string, id?: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "test",
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

const solarBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: SOLAR_BOUNDARY,
});

const SOLAR_SPECTRUM_BADGES: TheoryBadgeV1[] = [
  solarBadge({
    id: "solar.spectrum.photon_energy",
    title: "Solar Photon Energy",
    plainMeaning: "Computes photon energy from a measured wavelength using h and c.",
    whyItMatters: "It gives spectral-line prompts a calculator-loadable bridge from wavelength to photon energy.",
    subjects: ["solar", "spectrum", "photon", "energy", "wavelength", "quantum"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["planck_relation", "spectral_observable"],
    tags: ["photon", "energy", "lambda", "calculator_loadable"],
    equations: [
      {
        id: "photon_energy_from_wavelength",
        role: "calculator_demo",
        displayLatex: "E=\\frac{hc}{\\lambda}",
        computableExpression: "E = h*c/lambda",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "c", "lambda"],
        outputSymbols: ["E"],
      },
    ],
    units: [
      { symbol: "E", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "lambda", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "c", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
    ],
    assumptions: [
      "Single-photon scalar relation.",
      "Line identification and instrument calibration remain observation context.",
    ],
    calculatorPayloads: [
      payload({
        id: "photon_energy_payload",
        expression: "E = h*c/lambda",
        displayLatex: "E=\\frac{hc}{\\lambda}",
        targetVariable: "E",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "spectral-lines", "Solar spectrum analysis uses wavelength-bearing observables."),
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "spectral-models", "Solar spectral model context."),
      docRef(SOLAR_RADIATIVE_TREE_PATH, "radiative-observables", "Knowledge tree for solar radiative observables."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "photon", "energy", "wavelength"],
      symbols: ["E", "h", "c", "lambda", "photon_energy_J"],
      unitSignatures: ["M L^2 T^-2", "L", "L T^-1"],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_SPECTRUM_MODELS_PATH, SOLAR_RADIATIVE_TREE_PATH],
      equationFamilies: ["planck_relation", "spectral_observable"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.wien_peak",
    title: "Solar Wien Peak",
    plainMeaning: "Estimates the peak wavelength for an ideal blackbody-like temperature.",
    whyItMatters: "It connects solar color and peak-spectrum prompts to temperature in a scalar calculator row.",
    subjects: ["solar", "spectrum", "blackbody", "temperature", "wien"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum", "starsim"],
    equationFamilies: ["wien_displacement", "blackbody_radiation"],
    tags: ["lambda_max", "temperature", "calculator_loadable"],
    equations: [
      {
        id: "wien_peak",
        role: "calculator_demo",
        displayLatex: "\\lambda_{max}=\\frac{b}{T}",
        computableExpression: "lambda_max = b / T",
        operatorKind: "scalar_expression",
        inputSymbols: ["b", "T"],
        outputSymbols: ["lambda_max"],
      },
    ],
    units: [
      { symbol: "lambda_max", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Idealized blackbody proxy.",
      "Solar atmosphere and line features require model context.",
    ],
    calculatorPayloads: [
      payload({
        id: "wien_peak_payload",
        expression: "lambda_max = b / T",
        displayLatex: "\\lambda_{max}=\\frac{b}{T}",
        targetVariable: "lambda_max",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "blackbody", "Solar spectrum model context."),
      testRef(SOLAR_INGEST_TEST_PATH, "synthetic-blackbody", "Synthetic blackbody analysis test."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "blackbody", "temperature", "wien"],
      symbols: ["lambda_max", "b", "T", "T_eff"],
      unitSignatures: ["L", "Theta"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, SOLAR_INGEST_TEST_PATH],
      equationFamilies: ["wien_displacement", "blackbody_radiation"],
      simulationOwners: ["solar_spectrum", "starsim"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.stefan_boltzmann_luminosity",
    title: "Solar Stefan-Boltzmann Luminosity",
    plainMeaning: "Relates luminosity to radius and temperature through a blackbody surface model.",
    whyItMatters: "It bridges solar radiance, stellar surface observables, and calculator-visible power units.",
    subjects: ["solar", "spectrum", "radiation", "blackbody", "luminosity", "temperature"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum", "starsim"],
    equationFamilies: ["stefan_boltzmann_law", "blackbody_radiation"],
    tags: ["luminosity", "radius", "temperature", "calculator_loadable"],
    equations: [
      {
        id: "stefan_boltzmann_luminosity",
        role: "calculator_demo",
        displayLatex: "L=4\\pi R^2\\sigma T^4",
        computableExpression: "L = 4*pi*R^2*sigma*T^4",
        operatorKind: "scalar_expression",
        inputSymbols: ["R", "sigma", "T"],
        outputSymbols: ["L"],
      },
    ],
    units: [
      { symbol: "L", unit: "W", quantity: "luminosity", dimensionSignature: "M L^2 T^-3" },
      { symbol: "R", unit: "m", quantity: "radius", dimensionSignature: "L" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Idealized blackbody surface relation.",
      "Does not replace atmosphere or radiative-transfer modeling.",
    ],
    calculatorPayloads: [
      payload({
        id: "stefan_boltzmann_luminosity_payload",
        expression: "L = 4*pi*R^2*sigma*T^4",
        displayLatex: "L=4\\pi R^2\\sigma T^4",
        targetVariable: "L",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "blackbody", "Solar spectrum model context."),
      testRef(SOLAR_MODEL_FIT_TEST_PATH, "solar-model-comparison", "Solar model comparison uses spectral model families."),
    ],
    hintKeys: {
      subjects: ["solar", "radiation", "blackbody", "temperature", "luminosity"],
      symbols: ["L", "R", "sigma", "T", "T_eff"],
      unitSignatures: ["M L^2 T^-3", "L", "Theta"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, SOLAR_MODEL_FIT_TEST_PATH],
      equationFamilies: ["stefan_boltzmann_law", "blackbody_radiation"],
      simulationOwners: ["solar_spectrum", "starsim"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.halpha_line_reference",
    title: "Solar H-Alpha Line Reference",
    plainMeaning: "Anchors H-alpha as a common solar spectral rest-line reference.",
    whyItMatters: "It gives Doppler and radial-velocity prompts an explicit line identity instead of an unnamed wavelength.",
    subjects: ["solar", "spectrum", "halpha", "hydrogen", "line_reference"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["spectral_line_reference"],
    tags: ["halpha", "rest_wavelength", "reference"],
    equations: [
      {
        id: "halpha_rest_wavelength",
        role: "noncomputable_reference",
        displayLatex: "\\lambda_{H\\alpha}\\approx656.28\\,\\mathrm{nm}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["H_alpha"],
        outputSymbols: ["lambda0"],
      },
    ],
    units: [
      { symbol: "lambda0", unit: "nm", quantity: "rest_wavelength", dimensionSignature: "L" },
    ],
    assumptions: ["Reference wavelength only; observation-specific line fitting must provide measured wavelength."],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "spectral-lines", "Solar spectrum analysis uses line references."),
      repoRef(SOLAR_SPECTRUM_INGEST_PATH, "ingest", "Runtime import path for solar spectrum observations."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "halpha", "hydrogen", "line_reference"],
      symbols: ["lambda0", "H_alpha", "lambda_rest", "656.28"],
      unitSignatures: ["L"],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_SPECTRUM_INGEST_PATH],
      equationFamilies: ["spectral_line_reference"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.doppler_shift",
    title: "Solar Doppler Shift",
    plainMeaning: "Computes the fractional wavelength shift of a spectral line.",
    whyItMatters: "It separates the observable shift ratio from the radial-velocity proxy that may use it.",
    subjects: ["solar", "spectrum", "doppler", "redshift", "blueshift"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["doppler_shift", "spectral_shift"],
    tags: ["z", "line_shift", "calculator_loadable"],
    equations: [
      {
        id: "doppler_shift_ratio",
        role: "calculator_demo",
        displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
        computableExpression: "z = (lambda_obs - lambda0)/lambda0",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda_obs", "lambda0"],
        outputSymbols: ["z"],
      },
    ],
    units: [
      { symbol: "z", unit: null, quantity: "fractional_shift", dimensionSignature: "1" },
      { symbol: "lambda_obs", unit: "nm", quantity: "observed_wavelength", dimensionSignature: "L" },
      { symbol: "lambda0", unit: "nm", quantity: "rest_wavelength", dimensionSignature: "L" },
    ],
    assumptions: [
      "Line calibration and rest-line choice must be explicit.",
      "Formula is an observational proxy unless backed by a receipt.",
    ],
    calculatorPayloads: [
      payload({
        id: "doppler_shift_payload",
        expression: "z = (lambda_obs - lambda0)/lambda0",
        displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
        targetVariable: "z",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "line-shift", "Solar spectrum analysis path for spectral line shifts."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "doppler", "redshift", "blueshift"],
      symbols: ["z", "lambda_obs", "lambda0", "lambda_rest"],
      unitSignatures: ["1", "L"],
      repoPaths: [SOLAR_SPECTRUM_PATH],
      equationFamilies: ["doppler_shift", "spectral_shift"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.radial_velocity_proxy",
    title: "Solar Radial Velocity Proxy",
    plainMeaning: "Converts a small spectral shift into line-of-sight velocity.",
    whyItMatters: "It lets Helix Ask and the calculator distinguish measured shift from inferred velocity.",
    subjects: ["solar", "spectrum", "doppler", "velocity", "radial_velocity"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["doppler_shift", "radial_velocity_proxy"],
    tags: ["velocity", "line_shift", "calculator_loadable"],
    equations: [
      {
        id: "radial_velocity_from_shift",
        role: "calculator_demo",
        displayLatex: "v=cz",
        computableExpression: "v = c*z",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "z"],
        outputSymbols: ["v"],
      },
    ],
    units: [
      { symbol: "v", unit: "m/s", quantity: "velocity", dimensionSignature: "L T^-1" },
      { symbol: "z", unit: null, quantity: "fractional_shift", dimensionSignature: "1" },
    ],
    assumptions: [
      "Low-velocity radial-velocity proxy.",
      "Does not separate solar rotation, convection, instrument drift, or atmospheric effects.",
    ],
    calculatorPayloads: [
      payload({
        id: "radial_velocity_proxy_payload",
        expression: "v = c*z",
        displayLatex: "v=cz",
        targetVariable: "v",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "radial-velocity", "Solar spectrum analysis path for velocity proxies."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "doppler", "velocity", "radial_velocity"],
      symbols: ["v", "c", "z", "radial_velocity"],
      unitSignatures: ["L T^-1", "1"],
      repoPaths: [SOLAR_SPECTRUM_PATH],
      equationFamilies: ["doppler_shift", "radial_velocity_proxy"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.blackbody_curve_reference",
    title: "Solar Blackbody Curve Reference",
    plainMeaning: "Records the Planck spectral radiance curve as a reference/sweep expression.",
    whyItMatters: "It keeps curve plotting out of the scalar calculator while preserving the theory location.",
    subjects: ["solar", "spectrum", "blackbody", "planck_curve", "sweep"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["planck_distribution", "blackbody_radiation", "sweep_expression"],
    tags: ["blackbody_curve", "non_scalar", "reference"],
    equations: [
      {
        id: "planck_radiance_lambda",
        role: "noncomputable_reference",
        displayLatex:
          "B_\\lambda(\\lambda,T)=\\frac{2hc^2/\\lambda^5}{\\exp(hc/(\\lambda k_B T))-1}",
        computableExpression:
          "B_lambda = (2*h*c^2/lambda^5)/(exp(h*c/(lambda*k_B*T))-1)",
        operatorKind: "noncomputable_reference",
        inputSymbols: ["lambda", "T", "h", "c", "k_B"],
        outputSymbols: ["B_lambda"],
      },
    ],
    units: [
      { symbol: "B_lambda", unit: "W sr^-1 m^-3", quantity: "spectral_radiance", dimensionSignature: "M L^-1 T^-3" },
      { symbol: "lambda", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Reference/sweep expression, not a scalar calculator solve.",
      "Blackbody curves are idealized and do not replace atmosphere/radiative-transfer modeling.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "planck-radiance", "Solar model context for spectral radiance."),
      testRef(SOLAR_INGEST_TEST_PATH, "planckRadianceLambda", "Synthetic blackbody fixture uses Planck radiance."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "blackbody", "planck_curve", "sweep"],
      symbols: ["B_lambda", "lambda", "T", "h", "c", "k_B"],
      unitSignatures: ["M L^-1 T^-3", "L", "Theta"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, SOLAR_INGEST_TEST_PATH],
      equationFamilies: ["planck_distribution", "blackbody_radiation", "sweep_expression"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.magnetic.zeeman_split_proxy",
    title: "Solar Zeeman Split Proxy",
    plainMeaning: "Estimates magnetic spectral splitting from a field strength and line parameters.",
    whyItMatters: "It connects solar magnetic-field prompts to quantum/spectral calculator proxies.",
    subjects: ["solar", "spectrum", "magnetism", "zeeman", "line_splitting"],
    level: "derived_relation",
    status: "project_derived",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["zeeman_splitting", "spectral_observable"],
    tags: ["magnetic_field", "line_split", "calculator_loadable"],
    equations: [
      {
        id: "zeeman_frequency_split",
        role: "calculator_demo",
        displayLatex: "\\Delta\\nu=\\frac{\\mu_B g_{eff} B}{h}",
        computableExpression: "delta_nu = mu_B*g_eff*B/h",
        operatorKind: "scalar_expression",
        inputSymbols: ["mu_B", "g_eff", "B", "h"],
        outputSymbols: ["delta_nu"],
      },
      {
        id: "zeeman_wavelength_split",
        role: "calculator_demo",
        displayLatex: "\\Delta\\lambda=\\frac{\\lambda_0^2\\Delta\\nu}{c}",
        computableExpression: "delta_lambda = lambda0^2*delta_nu/c",
        operatorKind: "scalar_expression",
        inputSymbols: ["lambda0", "delta_nu", "c"],
        outputSymbols: ["delta_lambda"],
      },
    ],
    units: [
      { symbol: "delta_nu", unit: "Hz", quantity: "frequency_split", dimensionSignature: "T^-1" },
      { symbol: "delta_lambda", unit: "m", quantity: "wavelength_split", dimensionSignature: "L" },
      { symbol: "B", unit: "T", quantity: "magnetic_field", dimensionSignature: "M T^-2 I^-1" },
    ],
    assumptions: [
      "Calculator proxy for simple line splitting.",
      "Requires line identification, effective Lande factor, and observation receipt for interpretation.",
    ],
    calculatorPayloads: [
      payload({
        id: "zeeman_frequency_split_payload",
        expression: "delta_nu = mu_B*g_eff*B/h",
        displayLatex: "\\Delta\\nu=\\frac{\\mu_B g_{eff} B}{h}",
        targetVariable: "delta_nu",
      }),
      payload({
        id: "zeeman_wavelength_split_payload",
        expression: "delta_lambda = lambda0^2*delta_nu/c",
        displayLatex: "\\Delta\\lambda=\\frac{\\lambda_0^2\\Delta\\nu}{c}",
        targetVariable: "delta_lambda",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "line-splitting", "Solar spectrum analysis context for spectral lines."),
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "spectral-models", "Solar spectral model context."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "magnetism", "zeeman", "line_splitting"],
      symbols: ["delta_nu", "delta_lambda", "mu_B", "g_eff", "B", "lambda0", "h", "c"],
      unitSignatures: ["T^-1", "L", "M T^-2 I^-1"],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_SPECTRUM_MODELS_PATH],
      equationFamilies: ["zeeman_splitting", "spectral_observable"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.flare.energy_proxy",
    title: "Solar Flare Energy Proxy",
    plainMeaning: "Estimates event energy from a radiant power proxy over event duration.",
    whyItMatters: "It gives flare prompts a calculator-loadable bridge while preserving observation caveats.",
    subjects: ["solar", "flare", "energy", "power", "duration"],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["solar_flare", "solar_spectrum"],
    equationFamilies: ["flare_energy_proxy", "power_rate"],
    tags: ["flare", "energy", "duration", "calculator_loadable"],
    equations: [
      {
        id: "flare_energy_proxy",
        role: "calculator_demo",
        displayLatex: "E_{flare}=P_{rad}\\Delta t",
        computableExpression: "E_flare = P_rad * delta_t",
        operatorKind: "scalar_expression",
        inputSymbols: ["P_rad", "delta_t"],
        outputSymbols: ["E_flare"],
      },
    ],
    units: [
      { symbol: "E_flare", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "P_rad", unit: "W", quantity: "power", dimensionSignature: "M L^2 T^-3" },
      { symbol: "delta_t", unit: "s", quantity: "duration", dimensionSignature: "T" },
    ],
    assumptions: [
      "Radiant-energy proxy only.",
      "Instrument response, bandpass, and event segmentation must come from observation context.",
    ],
    calculatorPayloads: [
      payload({
        id: "flare_energy_proxy_payload",
        expression: "E_flare = P_rad * delta_t",
        displayLatex: "E_{flare}=P_{rad}\\Delta t",
        targetVariable: "E_flare",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_FLARE_CONTRACT_PATH, "solar-flare-observable", "Solar flare observable contract."),
      repoRef(SOLAR_ENERGY_ADAPTER_PATH, "solar-energy-adapter", "Energy adapter for solar observation workflows."),
    ],
    hintKeys: {
      subjects: ["solar", "flare", "energy", "power", "duration"],
      symbols: ["E_flare", "P_rad", "delta_t", "duration_s"],
      unitSignatures: ["M L^2 T^-2", "M L^2 T^-3", "T"],
      repoPaths: [SOLAR_FLARE_CONTRACT_PATH, SOLAR_ENERGY_ADAPTER_PATH],
      equationFamilies: ["flare_energy_proxy", "power_rate"],
      simulationOwners: ["solar_flare", "solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.runtime.spectrum_analysis",
    title: "Solar Spectrum Analysis Runtime",
    plainMeaning: "References the local runtime path that ingests and analyzes solar spectrum observations.",
    whyItMatters: "It gives the atlas a runtime/source anchor without pretending spectrum ingestion is a scalar solve.",
    subjects: ["solar", "spectrum", "runtime", "analysis", "ingest"],
    level: "simulation_specific",
    status: "project_derived",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["solar_spectrum_runtime", "observation_receipt"],
    tags: ["runtime", "source_ref", "analysis"],
    equations: [
      {
        id: "solar_spectrum_analysis_runtime",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{ingestSolarSpectrumFile}\\rightarrow\\mathrm{analysis\\ artifact}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["spectrum_observation"],
        outputSymbols: ["solar_spectrum_analysis"],
      },
    ],
    units: [],
    assumptions: [
      "Runtime/source reference only.",
      "A future runtime action should return an observation receipt before physical interpretation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_INGEST_PATH, "ingestSolarSpectrumFile", "Local runtime path for solar spectrum ingest."),
      repoRef(SOLAR_SPECTRUM_PATH, "analyzeSolarSpectrum", "Local analysis helper path."),
      testRef(SOLAR_INGEST_TEST_PATH, "solar-spectrum-ingest", "Solar spectrum ingest coverage."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "runtime", "analysis", "ingest"],
      symbols: ["solar_spectrum_analysis", "spectrum_observation"],
      unitSignatures: [],
      repoPaths: [SOLAR_SPECTRUM_INGEST_PATH, SOLAR_SPECTRUM_PATH, SOLAR_INGEST_TEST_PATH],
      equationFamilies: ["solar_spectrum_runtime", "observation_receipt"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.claim_boundary.observational_proxy",
    title: "Solar Observational Proxy Boundary",
    plainMeaning: "Keeps solar spectrum and flare calculations framed as observational and inference helpers.",
    whyItMatters: "It prevents Doppler, Zeeman, blackbody, or flare proxies from being overstated without receipts.",
    subjects: ["solar", "claim_boundary", "observational_proxy"],
    level: "claim_boundary",
    status: "diagnostic",
    simulationOwners: ["solar_spectrum", "solar_flare"],
    equationFamilies: ["claim_boundary"],
    tags: ["boundary", "diagnostic_only", "observation"],
    equations: [
      {
        id: "solar_observational_proxy_boundary",
        role: "gate",
        displayLatex: "\\mathrm{solar\\ spectrum\\ rows}=\\mathrm{observational\\ proxies}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["solar_observation"],
        outputSymbols: ["boundary_note"],
      },
    ],
    units: [],
    assumptions: [
      "Solar spectrum badges provide observational and inference helpers.",
      "Doppler/Zeeman formulas are calculator proxies unless backed by a specific observation receipt.",
      "Blackbody curves are idealized and do not replace atmosphere/radiative-transfer modeling.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "analysis", "Solar spectrum analysis context."),
      repoRef(SOLAR_FLARE_CONTRACT_PATH, "claim-boundary", "Solar flare observable boundary context."),
      docRef(SOLAR_RADIATIVE_TREE_PATH, "claim-boundary", "Solar radiative observables tree."),
    ],
    hintKeys: {
      subjects: ["solar", "claim_boundary", "observational_proxy"],
      symbols: ["solar_observation", "boundary_note"],
      unitSignatures: [],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_FLARE_CONTRACT_PATH, SOLAR_RADIATIVE_TREE_PATH],
      equationFamilies: ["claim_boundary"],
      simulationOwners: ["solar_spectrum", "solar_flare"],
    },
  }),
];

const SOLAR_SPECTRUM_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "speed_of_light_feeds_solar_photon_energy",
    from: "physics.constants.speed_of_light",
    to: "solar.spectrum.photon_energy",
    relation: "uses_constant",
    label: "Photon energy from wavelength uses c.",
    claimBoundaryNote: "Constant usage is a scalar reference edge.",
  },
  {
    id: "quantum_energy_supports_solar_photon_energy",
    from: "physics.quantum.energy_frequency",
    to: "solar.spectrum.photon_energy",
    relation: "requires",
    label: "The solar photon energy row specializes the Planck relation.",
    claimBoundaryNote: "Canonical quantum bridge only.",
  },
  {
    id: "photon_energy_supports_blackbody_curve",
    from: "solar.spectrum.photon_energy",
    to: "solar.spectrum.blackbody_curve_reference",
    relation: "requires",
    label: "The Planck curve depends on photon-energy scale and wavelength context.",
    claimBoundaryNote: "Curve row is a reference/sweep expression, not a scalar calculator solve.",
  },
  {
    id: "blackbody_curve_supports_wien_peak",
    from: "solar.spectrum.blackbody_curve_reference",
    to: "solar.spectrum.wien_peak",
    relation: "approximates",
    label: "Wien's law summarizes the ideal blackbody peak.",
    claimBoundaryNote: "Blackbody peak remains an idealized proxy.",
  },
  {
    id: "wien_peak_supports_stefan_luminosity",
    from: "solar.spectrum.wien_peak",
    to: "solar.spectrum.stefan_boltzmann_luminosity",
    relation: "requires",
    label: "Temperature links the peak relation to luminosity estimates.",
    claimBoundaryNote: "Atmosphere and radiative transfer remain model context.",
  },
  {
    id: "halpha_reference_feeds_doppler_shift",
    from: "solar.spectrum.halpha_line_reference",
    to: "solar.spectrum.doppler_shift",
    relation: "requires",
    label: "Doppler shift requires an explicit rest-line reference.",
    claimBoundaryNote: "Rest-line selection is observation context.",
  },
  {
    id: "doppler_shift_feeds_radial_velocity",
    from: "solar.spectrum.doppler_shift",
    to: "solar.spectrum.radial_velocity_proxy",
    relation: "derives",
    label: "Radial-velocity proxy multiplies the spectral shift by c.",
    claimBoundaryNote: "Velocity row is a low-velocity observational proxy.",
  },
  {
    id: "solar_doppler_shares_cosmic_redshift_form",
    from: "solar.spectrum.doppler_shift",
    to: "cosmic.spectral.redshift",
    relation: "shares_units",
    label: "Solar Doppler shift and cosmic redshift share a wavelength-ratio form.",
    claimBoundaryNote: "Solar line motion and cosmological distance interpretation remain separate contexts.",
  },
  {
    id: "halpha_reference_supports_zeeman_proxy",
    from: "solar.spectrum.halpha_line_reference",
    to: "solar.magnetic.zeeman_split_proxy",
    relation: "requires",
    label: "Zeeman wavelength splitting requires a reference line.",
    claimBoundaryNote: "Line-specific magnetic interpretation requires observation context.",
  },
  {
    id: "solar_runtime_documents_spectrum_rows",
    from: "solar.runtime.spectrum_analysis",
    to: "solar.claim_boundary.observational_proxy",
    relation: "documents",
    label: "Solar runtime analysis rows must preserve observational proxy boundaries.",
    claimBoundaryNote: "Runtime source refs do not replace observation receipts.",
  },
  {
    id: "solar_power_rate_feeds_flare_energy",
    from: "physics.energy.power_rate",
    to: "solar.flare.energy_proxy",
    relation: "requires",
    label: "Flare energy proxy uses power over event duration.",
    claimBoundaryNote: "Radiant-energy proxy requires observation context.",
  },
  {
    id: "solar_flare_documents_boundary",
    from: "solar.flare.energy_proxy",
    to: "solar.claim_boundary.observational_proxy",
    relation: "documents",
    label: "Solar flare energy proxies must point to the observation boundary.",
    claimBoundaryNote: "Boundary prevents overstatement from event proxies.",
  },
  {
    id: "solar_radial_velocity_documents_boundary",
    from: "solar.spectrum.radial_velocity_proxy",
    to: "solar.claim_boundary.observational_proxy",
    relation: "documents",
    label: "Solar velocity proxies require observational calibration context.",
    claimBoundaryNote: "Boundary prevents overstatement from spectral shifts.",
  },
];

export function buildSolarSpectrumTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: SOLAR_SPECTRUM_BADGES,
    edges: SOLAR_SPECTRUM_EDGES,
  };
}

export const SOLAR_SPECTRUM_THEORY_BADGES = buildSolarSpectrumTheoryBadgesV1().badges;
export const SOLAR_SPECTRUM_THEORY_EDGES = buildSolarSpectrumTheoryBadgesV1().edges;
