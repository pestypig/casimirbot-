import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const SOLAR_SPECTRUM_PATH = "shared/solar-spectrum-analysis.ts";
const SOLAR_SPECTRUM_INGEST_PATH = "server/services/essence/solar-spectrum-ingest.ts";
const SOLAR_SPECTRUM_MODELS_PATH = "server/services/essence/solar-spectrum-models.ts";
const SOLAR_FLARE_CONTRACT_PATH = "shared/solar-flare-observable-contract.v1.ts";
const SOLAR_ENERGY_ADAPTER_PATH = "server/services/essence/solar-energy-adapter.ts";
const STAR_WATCHER_PANEL_PATH = "client/src/pages/star-watcher-panel.tsx";
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

const solarBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: SOLAR_BOUNDARY,
});

export const SOLAR_SPECTRUM_THEORY_BADGES: TheoryBadgeV1[] = [
  solarBadge({
    id: "solar.spectrum.frequency_from_wavelength",
    title: "Solar Spectrum Frequency From Wavelength",
    plainMeaning: "Converts a measured spectral wavelength into frequency.",
    whyItMatters: "It gives solar spectral lines a scalar bridge into photon-energy calculations.",
    subjects: ["solar", "spectrum", "wavelength", "frequency"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["wave_frequency", "spectral_observable"],
    tags: ["lambda", "frequency", "calculator_loadable"],
    equations: [
      {
        id: "frequency_from_wavelength",
        role: "calculator_demo",
        displayLatex: "f=\\frac{c}{\\lambda}",
        computableExpression: "f = c / lambda",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "lambda"],
        outputSymbols: ["f"],
      },
    ],
    units: [
      { symbol: "f", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "lambda", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "c", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
    ],
    assumptions: ["Vacuum wavelength relation unless a medium correction is supplied."],
    calculatorPayloads: [
      payload({
        id: "frequency_from_wavelength_payload",
        expression: "f = c / lambda",
        displayLatex: "f=\\frac{c}{\\lambda}",
        targetVariable: "f",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "spectral-lines", "Solar spectrum analysis uses wavelength-bearing observables."),
      repoRef(SOLAR_SPECTRUM_INGEST_PATH, "ingest", "Runtime import path for solar spectrum observations."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "wavelength", "frequency"],
      symbols: ["f", "c", "lambda", "wavelength_nm", "frequency_Hz"],
      unitSignatures: ["T^-1", "L", "L T^-1"],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_SPECTRUM_INGEST_PATH],
      equationFamilies: ["wave_frequency", "spectral_observable"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.photon_energy_wavelength",
    title: "Solar Photon Energy From Wavelength",
    plainMeaning: "Computes photon energy from a spectral wavelength using h, c, and lambda.",
    whyItMatters: "It links spectral line observations to energy scales that Helix Ask can load into the calculator.",
    subjects: ["solar", "spectrum", "quantum", "energy", "wavelength"],
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
    ],
    assumptions: ["Single-photon scalar relation.", "Line identification and calibration remain observation context."],
    calculatorPayloads: [
      payload({
        id: "photon_energy_from_wavelength_payload",
        expression: "E = h*c/lambda",
        displayLatex: "E=\\frac{hc}{\\lambda}",
        targetVariable: "E",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "spectral-models", "Solar spectral model context."),
      docRef(SOLAR_RADIATIVE_TREE_PATH, "radiative-observables", "Knowledge tree for solar radiative observables."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "photon", "energy", "wavelength"],
      symbols: ["E", "h", "c", "lambda", "photon_energy_J"],
      unitSignatures: ["M L^2 T^-2", "L"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, SOLAR_RADIATIVE_TREE_PATH],
      equationFamilies: ["planck_relation", "spectral_observable"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.spectrum.doppler_velocity",
    title: "Solar Spectral Doppler Velocity",
    plainMeaning: "Estimates line-of-sight velocity from a small spectral-line wavelength shift.",
    whyItMatters: "It connects solar line motion to the same redshift/blueshift language used by the distance ladder.",
    subjects: ["solar", "spectrum", "doppler", "redshift", "blueshift"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum"],
    equationFamilies: ["doppler_shift", "spectral_shift"],
    tags: ["velocity", "line_shift", "calculator_loadable"],
    equations: [
      {
        id: "doppler_velocity_from_line_shift",
        role: "calculator_demo",
        displayLatex: "v=c\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
        computableExpression: "v = c*(lambda_obs - lambda0)/lambda0",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "lambda_obs", "lambda0"],
        outputSymbols: ["v"],
      },
    ],
    units: [
      { symbol: "v", unit: "m/s", quantity: "velocity", dimensionSignature: "L T^-1" },
      { symbol: "lambda_obs", unit: "nm", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "lambda0", unit: "nm", quantity: "rest_wavelength", dimensionSignature: "L" },
    ],
    assumptions: ["Low-velocity Doppler approximation.", "Line calibration and rest-line choice must be explicit."],
    calculatorPayloads: [
      payload({
        id: "doppler_velocity_from_line_shift_payload",
        expression: "v = c*(lambda_obs - lambda0)/lambda0",
        displayLatex: "v=c\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
        targetVariable: "v",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "line-shift", "Solar spectrum analysis path for spectral line shifts."),
    ],
    hintKeys: {
      subjects: ["solar", "spectrum", "doppler", "redshift", "blueshift", "velocity"],
      symbols: ["v", "c", "lambda_obs", "lambda0", "lambda_rest"],
      unitSignatures: ["L T^-1", "L"],
      repoPaths: [SOLAR_SPECTRUM_PATH],
      equationFamilies: ["doppler_shift", "spectral_shift"],
      simulationOwners: ["solar_spectrum"],
    },
  }),
  solarBadge({
    id: "solar.radiation.wien_peak",
    title: "Solar Blackbody Peak",
    plainMeaning: "Estimates the peak wavelength for a blackbody-like surface temperature.",
    whyItMatters: "It links solar color and spectral peak prompts to the stellar surface-temperature branch.",
    subjects: ["solar", "radiation", "blackbody", "temperature", "spectrum"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum", "starsim"],
    equationFamilies: ["wien_displacement", "blackbody_radiation"],
    tags: ["temperature", "lambda_max", "calculator_loadable"],
    equations: [
      {
        id: "wien_displacement",
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
    assumptions: ["Blackbody-like scalar approximation.", "Solar atmosphere and line features require model context."],
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
      docRef(SOLAR_RADIATIVE_TREE_PATH, "blackbody-null-model", "Solar radiation null-model lane."),
    ],
    hintKeys: {
      subjects: ["solar", "radiation", "blackbody", "temperature", "spectrum"],
      symbols: ["lambda_max", "b", "T", "T_eff"],
      unitSignatures: ["L", "Theta"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, SOLAR_RADIATIVE_TREE_PATH],
      equationFamilies: ["wien_displacement", "blackbody_radiation"],
      simulationOwners: ["solar_spectrum", "starsim"],
    },
  }),
  solarBadge({
    id: "solar.radiation.stefan_boltzmann_flux",
    title: "Solar Stefan-Boltzmann Flux",
    plainMeaning: "Relates emitted flux to surface temperature through sigma T to the fourth.",
    whyItMatters: "It bridges solar radiance, StarSim luminosity-radius-temperature loadouts, and calculator-visible power units.",
    subjects: ["solar", "radiation", "blackbody", "temperature", "power"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["solar_spectrum", "starsim"],
    equationFamilies: ["stefan_boltzmann_law", "blackbody_radiation"],
    tags: ["flux", "temperature", "calculator_loadable"],
    equations: [
      {
        id: "stefan_boltzmann_flux",
        role: "calculator_demo",
        displayLatex: "F=\\sigma T^4",
        computableExpression: "F = sigma*T^4",
        operatorKind: "scalar_expression",
        inputSymbols: ["sigma", "T"],
        outputSymbols: ["F"],
      },
    ],
    units: [
      { symbol: "F", unit: "W/m^2", quantity: "radiant_flux", dimensionSignature: "M T^-3" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: ["Blackbody-like flux relation.", "Atmospheric transfer and passband effects are outside this scalar row."],
    calculatorPayloads: [
      payload({
        id: "stefan_boltzmann_flux_payload",
        expression: "F = sigma*T^4",
        displayLatex: "F=\\sigma T^4",
        targetVariable: "F",
      }),
    ],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_MODELS_PATH, "blackbody", "Solar spectrum model context."),
      repoRef(STAR_WATCHER_PANEL_PATH, "star-watcher", "UI surface for star/solar observation workflows."),
    ],
    hintKeys: {
      subjects: ["solar", "radiation", "blackbody", "temperature", "power", "flux"],
      symbols: ["F", "sigma", "T", "T_eff"],
      unitSignatures: ["M T^-3", "Theta"],
      repoPaths: [SOLAR_SPECTRUM_MODELS_PATH, STAR_WATCHER_PANEL_PATH],
      equationFamilies: ["stefan_boltzmann_law", "blackbody_radiation"],
      simulationOwners: ["solar_spectrum", "starsim"],
    },
  }),
  solarBadge({
    id: "solar.flare.radiant_energy_proxy",
    title: "Solar Flare Radiant Energy Proxy",
    plainMeaning: "Estimates event energy from a radiant power proxy over event duration.",
    whyItMatters: "It gives flare prompts a calculator-loadable bridge while preserving observation and calibration caveats.",
    subjects: ["solar", "flare", "energy", "power", "duration"],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["solar_flare", "solar_spectrum"],
    equationFamilies: ["flare_energy_proxy", "power_rate"],
    tags: ["flare", "energy", "duration", "calculator_loadable"],
    equations: [
      {
        id: "flare_radiant_energy_proxy",
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
        id: "flare_radiant_energy_proxy_payload",
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
    id: "solar.claim_boundary.observation_proxy",
    title: "Solar Observation Boundary",
    plainMeaning: "Keeps solar spectrum and flare calculations framed as observation/model proxies.",
    whyItMatters: "It prevents spectral matches or flare proxies from being overstated as mechanism-level proof.",
    subjects: ["solar", "claim_boundary", "observation_proxy"],
    level: "claim_boundary",
    status: "diagnostic",
    simulationOwners: ["solar_spectrum", "solar_flare"],
    equationFamilies: ["claim_boundary"],
    tags: ["boundary", "diagnostic_only", "observation"],
    equations: [
      {
        id: "solar_observation_boundary",
        role: "gate",
        displayLatex: "\\mathrm{solar\\ calculations}=\\mathrm{observation\\ proxy}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["solar_observation"],
        outputSymbols: ["boundary_note"],
      },
    ],
    units: [],
    assumptions: [
      "Solar spectrum and flare rows are observation/model proxies.",
      "External calibration and instrument context are required for physical interpretation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(SOLAR_SPECTRUM_PATH, "analysis", "Solar spectrum analysis context."),
      repoRef(SOLAR_FLARE_CONTRACT_PATH, "claim-boundary", "Solar flare observable boundary context."),
    ],
    hintKeys: {
      subjects: ["solar", "claim_boundary", "observation_proxy"],
      symbols: ["solar_observation", "boundary_note"],
      unitSignatures: [],
      repoPaths: [SOLAR_SPECTRUM_PATH, SOLAR_FLARE_CONTRACT_PATH],
      equationFamilies: ["claim_boundary"],
      simulationOwners: ["solar_spectrum", "solar_flare"],
    },
  }),
];

export const SOLAR_SPECTRUM_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "speed_of_light_feeds_solar_frequency",
    from: "physics.constants.speed_of_light",
    to: "solar.spectrum.frequency_from_wavelength",
    relation: "uses_constant",
    label: "Frequency-from-wavelength uses c.",
    claimBoundaryNote: "Constant usage is a scalar reference edge.",
  },
  {
    id: "solar_frequency_feeds_photon_energy",
    from: "solar.spectrum.frequency_from_wavelength",
    to: "solar.spectrum.photon_energy_wavelength",
    relation: "requires",
    label: "Photon energy can be computed from the wavelength-derived frequency relation.",
    claimBoundaryNote: "Scalar relation only; line identification is observation context.",
  },
  {
    id: "quantum_energy_supports_solar_photon_energy",
    from: "physics.quantum.energy_frequency",
    to: "solar.spectrum.photon_energy_wavelength",
    relation: "requires",
    label: "The solar photon energy row specializes the Planck relation.",
    claimBoundaryNote: "Canonical quantum bridge only.",
  },
  {
    id: "solar_doppler_specializes_cosmic_redshift",
    from: "solar.spectrum.doppler_velocity",
    to: "cosmic.spectral.redshift",
    relation: "specializes",
    label: "Local spectral Doppler shifts share the wavelength-ratio form with redshift.",
    claimBoundaryNote: "Solar line velocity and cosmological distance interpretation remain separate contexts.",
  },
  {
    id: "solar_wien_requires_photon_energy",
    from: "solar.spectrum.photon_energy_wavelength",
    to: "solar.radiation.wien_peak",
    relation: "requires",
    label: "Blackbody peak reasoning sits on wavelength and photon-energy context.",
    claimBoundaryNote: "Blackbody peak is a model proxy.",
  },
  {
    id: "solar_stefan_boltzmann_requires_power_rate",
    from: "physics.energy.power_rate",
    to: "solar.radiation.stefan_boltzmann_flux",
    relation: "requires",
    label: "Radiative flux carries power-per-area units.",
    claimBoundaryNote: "Unit relation is not an instrument calibration.",
  },
  {
    id: "solar_radiation_supports_starsim_temperature_proxy",
    from: "solar.radiation.stefan_boltzmann_flux",
    to: "starsim.observable.surface_temperature_proxy",
    relation: "requires",
    label: "StarSim's luminosity-radius-temperature proxy is adjacent to Stefan-Boltzmann surface radiation.",
    claimBoundaryNote: "StarSim remains a reduced-order prior lane.",
  },
  {
    id: "solar_power_rate_feeds_flare_energy",
    from: "physics.energy.power_rate",
    to: "solar.flare.radiant_energy_proxy",
    relation: "requires",
    label: "Flare energy proxy uses power over event duration.",
    claimBoundaryNote: "Radiant-energy proxy requires observation context.",
  },
  {
    id: "solar_observables_document_boundary",
    from: "solar.flare.radiant_energy_proxy",
    to: "solar.claim_boundary.observation_proxy",
    relation: "documents",
    label: "Solar event energy proxies must point to the observation boundary.",
    claimBoundaryNote: "Boundary prevents mechanism overstatement.",
  },
  {
    id: "solar_spectrum_documents_boundary",
    from: "solar.spectrum.doppler_velocity",
    to: "solar.claim_boundary.observation_proxy",
    relation: "documents",
    label: "Solar spectral shifts require observational calibration context.",
    claimBoundaryNote: "Boundary prevents overclaiming from spectral matches.",
  },
];
