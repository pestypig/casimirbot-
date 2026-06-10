import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const RELATIVITY_HISTORY_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const literatureRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  note: note ?? null,
});

const repoRef = (path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
  path,
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

const relativityHistoryBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: RELATIVITY_HISTORY_BOUNDARY,
});

export const RELATIVITY_HISTORY_THEORY_BADGES: TheoryBadgeV1[] = [
  relativityHistoryBadge({
    id: "relativity.history.romer_io_light_time_delay",
    title: "Romer Io Light-Time Delay",
    plainMeaning:
      "Represents the finite-light-speed constraint from changing Io eclipse times as Earth-Jupiter distance changes.",
    whyItMatters:
      "It gives the graph the first observational step from instantaneous light toward measurable light propagation.",
    subjects: ["relativity_history", "romer", "io_eclipse", "jupiter", "speed_of_light", "astronomy"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["io_eclipse_light_time", "speed_of_light_measurement"],
    tags: ["romer", "finite_light_speed", "calculator_loadable"],
    equations: [
      {
        id: "romer_light_time_speed_estimate",
        role: "calculator_demo",
        displayLatex: "c_{est}=\\Delta R/\\Delta t",
        computableExpression: "c_estimate_m_s = range_change_m/eclipse_delay_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["range_change_m", "eclipse_delay_s"],
        outputSymbols: ["c_estimate_m_s"],
      },
    ],
    units: [
      { symbol: "range_change_m", unit: "m", quantity: "range_change", dimensionSignature: "L" },
      { symbol: "eclipse_delay_s", unit: "s", quantity: "time_delay", dimensionSignature: "T" },
      { symbol: "c_estimate_m_s", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
    ],
    assumptions: [
      "Io eclipse timing is interpreted as a light-travel-time effect after orbital timing corrections.",
      "This row constrains instantaneous-light models; it does not by itself establish special relativity.",
    ],
    calculatorPayloads: [
      payload({
        id: "romer_light_time_speed_estimate",
        expression: "c_estimate_m_s = range_change_m/eclipse_delay_s",
        displayLatex: "c_{est}=\\Delta R/\\Delta t",
        targetVariable: "c_estimate_m_s",
      }),
    ],
    sourceRefs: [
      literatureRef("Britannica-Ole-Romer-Io-eclipse-light-time", "Romer's 1676 Io eclipse delay context."),
      literatureRef("AMNH-Ole-Roemer-speed-of-light", "Io eclipse timing as finite-light-speed evidence."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "romer", "io_eclipse", "jupiter", "speed_of_light", "astronomy"],
      symbols: ["range_change_m", "eclipse_delay_s", "c_estimate_m_s"],
      unitSignatures: ["L", "T", "L T^-1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["io_eclipse_light_time", "speed_of_light_measurement"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.bradley_stellar_aberration",
    title: "Bradley Stellar Aberration",
    plainMeaning:
      "Represents stellar aberration as the angular effect of Earth orbital motion combined with finite light speed.",
    whyItMatters:
      "It independently ties finite c to Earth's motion and gives the graph the next empirical constraint after Romer.",
    subjects: ["relativity_history", "bradley", "stellar_aberration", "earth_orbit", "speed_of_light"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["stellar_aberration", "speed_of_light_measurement"],
    tags: ["aberration", "earth_orbital_motion", "calculator_loadable"],
    equations: [
      {
        id: "bradley_aberration_small_angle",
        role: "calculator_demo",
        displayLatex: "\\theta_{ab}\\approx v_{earth}/c",
        computableExpression: "aberration_angle_rad = earth_orbital_speed_m_s/c",
        operatorKind: "scalar_expression",
        inputSymbols: ["earth_orbital_speed_m_s", "c"],
        outputSymbols: ["aberration_angle_rad"],
      },
    ],
    units: [
      {
        symbol: "earth_orbital_speed_m_s",
        unit: "m/s",
        quantity: "orbital_speed",
        dimensionSignature: "L T^-1",
      },
      { symbol: "c", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
      { symbol: "aberration_angle_rad", unit: "rad", quantity: "angle", dimensionSignature: "1" },
    ],
    assumptions: [
      "Uses the small-angle stellar-aberration approximation.",
      "Aberration supports finite light speed and Earth orbital motion, not a complete spacetime theory by itself.",
    ],
    calculatorPayloads: [
      payload({
        id: "bradley_aberration_small_angle",
        expression: "aberration_angle_rad = earth_orbital_speed_m_s/c",
        displayLatex: "\\theta_{ab}\\approx v_{earth}/c",
        targetVariable: "aberration_angle_rad",
      }),
    ],
    sourceRefs: [
      literatureRef("Britannica-James-Bradley-stellar-aberration", "Aberration of starlight and Earth orbital motion."),
      literatureRef("Cambridge-BJHS-Bradley-aberration-paper", "Historical reception of Bradley's aberration paper."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "bradley", "stellar_aberration", "earth_orbit", "speed_of_light"],
      symbols: ["earth_orbital_speed_m_s", "c", "aberration_angle_rad"],
      unitSignatures: ["L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["stellar_aberration", "speed_of_light_measurement"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.fizeau_wheel_terrestrial_c",
    title: "Fizeau Toothed-Wheel Terrestrial c",
    plainMeaning:
      "Represents Fizeau's toothed-wheel experiment as a terrestrial round-trip light-time measurement.",
    whyItMatters:
      "It moves c from astronomy into repeatable laboratory measurement and strengthens the empirical backbone of the graph.",
    subjects: ["relativity_history", "fizeau", "toothed_wheel", "terrestrial_measurement", "speed_of_light"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["terrestrial_light_time", "speed_of_light_measurement"],
    tags: ["fizeau", "speed_of_light", "calculator_loadable"],
    equations: [
      {
        id: "fizeau_round_trip_speed",
        role: "calculator_demo",
        displayLatex: "c_{est}=2L/\\Delta t",
        computableExpression: "c_estimate_m_s = 2*path_length_m/light_round_trip_time_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["path_length_m", "light_round_trip_time_s"],
        outputSymbols: ["c_estimate_m_s"],
      },
    ],
    units: [
      { symbol: "path_length_m", unit: "m", quantity: "one_way_path_length", dimensionSignature: "L" },
      { symbol: "light_round_trip_time_s", unit: "s", quantity: "round_trip_time", dimensionSignature: "T" },
      { symbol: "c_estimate_m_s", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
    ],
    assumptions: [
      "Models the experiment as a reduced round-trip light-time measurement.",
      "The exact toothed-wheel timing apparatus is represented by the supplied round-trip time.",
    ],
    calculatorPayloads: [
      payload({
        id: "fizeau_round_trip_speed",
        expression: "c_estimate_m_s = 2*path_length_m/light_round_trip_time_s",
        displayLatex: "c_{est}=2L/\\Delta t",
        targetVariable: "c_estimate_m_s",
      }),
    ],
    sourceRefs: [
      literatureRef("APS-Fizeau-1849-speed-of-light", "Fizeau's terrestrial toothed-wheel speed of light experiment."),
      literatureRef("SPIE-Speed-of-Light-Fizeau", "Fizeau speed-of-light measurement context."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "fizeau", "toothed_wheel", "terrestrial_measurement", "speed_of_light"],
      symbols: ["path_length_m", "light_round_trip_time_s", "c_estimate_m_s"],
      unitSignatures: ["L", "T", "L T^-1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["terrestrial_light_time", "speed_of_light_measurement"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.foucault_medium_speed",
    title: "Foucault Medium-Speed Constraint",
    plainMeaning:
      "Represents Foucault's rotating-mirror comparison showing light travels slower in water than in air.",
    whyItMatters:
      "It links the speed-of-light chain to wave optics and blocks the older corpuscular expectation that denser media make light faster.",
    subjects: ["relativity_history", "foucault", "rotating_mirror", "medium_speed", "wave_optics"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["medium_light_speed", "refractive_index"],
    tags: ["foucault", "wave_optics", "calculator_loadable"],
    equations: [
      {
        id: "medium_refractive_index",
        role: "calculator_demo",
        displayLatex: "n=c/v_{medium}",
        computableExpression: "refractive_index = c/speed_medium_m_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "speed_medium_m_s"],
        outputSymbols: ["refractive_index"],
      },
    ],
    units: [
      { symbol: "c", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
      { symbol: "speed_medium_m_s", unit: "m/s", quantity: "medium_light_speed", dimensionSignature: "L T^-1" },
      { symbol: "refractive_index", unit: null, quantity: "refractive_index", dimensionSignature: "1" },
    ],
    assumptions: [
      "This row represents the medium-speed constraint, not a modern full dispersion model.",
      "The result supports wave-optics context and does not alone establish relativity.",
    ],
    calculatorPayloads: [
      payload({
        id: "medium_refractive_index",
        expression: "refractive_index = c/speed_medium_m_s",
        displayLatex: "n=c/v_{medium}",
        targetVariable: "refractive_index",
      }),
    ],
    sourceRefs: [
      literatureRef("Foucault-1850-rotating-mirror-water-air", "Rotating-mirror water versus air comparison."),
      literatureRef("AJP-2010-Foucault-water-speed", "Modern derivation of Foucault water-speed measurement formulas."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "foucault", "rotating_mirror", "medium_speed", "wave_optics"],
      symbols: ["c", "speed_medium_m_s", "refractive_index"],
      unitSignatures: ["L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["medium_light_speed", "refractive_index"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.fizeau_flowing_water_drag",
    title: "Fizeau Flowing-Water Drag",
    plainMeaning:
      "Represents Fizeau's moving-water result as partial light drag rather than simple Galilean velocity addition.",
    whyItMatters:
      "It is one of the strongest experimental bridges from classical wave/aether models toward Lorentzian velocity structure.",
    subjects: ["relativity_history", "fizeau", "flowing_water", "fresnel_drag", "moving_medium"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["fresnel_drag_coefficient", "moving_medium_light_speed"],
    tags: ["fizeau_drag", "fresnel_drag", "calculator_loadable"],
    equations: [
      {
        id: "fresnel_drag_speed",
        role: "calculator_demo",
        displayLatex: "v_{lab}\\approx c/n+u(1-1/n^2)",
        computableExpression:
          "fresnel_drag_speed_m_s = c/refractive_index + water_speed_m_s*(1 - 1/(refractive_index^2))",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "refractive_index", "water_speed_m_s"],
        outputSymbols: ["fresnel_drag_speed_m_s"],
      },
    ],
    units: [
      { symbol: "c", unit: "m/s", quantity: "speed", dimensionSignature: "L T^-1" },
      { symbol: "refractive_index", unit: null, quantity: "refractive_index", dimensionSignature: "1" },
      { symbol: "water_speed_m_s", unit: "m/s", quantity: "medium_speed", dimensionSignature: "L T^-1" },
      { symbol: "fresnel_drag_speed_m_s", unit: "m/s", quantity: "lab_light_speed", dimensionSignature: "L T^-1" },
    ],
    assumptions: [
      "Uses the Fresnel drag coefficient as a reduced moving-medium context.",
      "Partial drag is not modeled as a direct proof of relativity; it is a constraint later explained by Lorentzian velocity addition.",
    ],
    calculatorPayloads: [
      payload({
        id: "fresnel_drag_speed",
        expression: "fresnel_drag_speed_m_s = c/refractive_index + water_speed_m_s*(1 - 1/(refractive_index^2))",
        displayLatex: "v_{lab}\\approx c/n+u(1-1/n^2)",
        targetVariable: "fresnel_drag_speed_m_s",
      }),
    ],
    sourceRefs: [
      literatureRef("Fizeau-1851-flowing-water-drag", "Moving-water partial light-drag experiment."),
      literatureRef("Einstein-Shankland-Fizeau-influence", "Fizeau experiment as relativity-shaping evidence context."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "fizeau", "flowing_water", "fresnel_drag", "moving_medium"],
      symbols: ["c", "refractive_index", "water_speed_m_s", "fresnel_drag_speed_m_s"],
      unitSignatures: ["L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["fresnel_drag_coefficient", "moving_medium_light_speed"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.michelson_morley_aether_null",
    title: "Michelson-Morley Aether-Drift Null",
    plainMeaning:
      "Represents the interferometer null result as a bound on directional light-speed variation from an aether wind.",
    whyItMatters:
      "It is the central null constraint that forced classical aether models toward contraction hypotheses and Lorentz covariance.",
    subjects: ["relativity_history", "michelson_morley", "aether_drift", "interferometer", "null_result"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["aether_drift_null", "interferometer_fringe_shift"],
    tags: ["michelson_morley", "null_result", "calculator_loadable"],
    equations: [
      {
        id: "michelson_morley_expected_fringe_shift",
        role: "calculator_demo",
        displayLatex: "\\Delta N_{exp}\\approx(2L/\\lambda)(v^2/c^2)",
        computableExpression:
          "expected_fringe_shift = (2*arm_length_m/lambda_light_m)*(aether_speed_m_s^2/c^2)",
        operatorKind: "scalar_expression",
        inputSymbols: ["arm_length_m", "lambda_light_m", "aether_speed_m_s", "c"],
        outputSymbols: ["expected_fringe_shift"],
      },
    ],
    units: [
      { symbol: "arm_length_m", unit: "m", quantity: "interferometer_arm_length", dimensionSignature: "L" },
      { symbol: "lambda_light_m", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "aether_speed_m_s", unit: "m/s", quantity: "hypothetical_aether_speed", dimensionSignature: "L T^-1" },
      { symbol: "expected_fringe_shift", unit: null, quantity: "fringe_count", dimensionSignature: "1" },
    ],
    assumptions: [
      "The expected fringe-shift row is a simplified classical aether-drift diagnostic.",
      "The observed null result constrains aether-drift models; it is not represented as a single proof of special relativity.",
    ],
    calculatorPayloads: [
      payload({
        id: "michelson_morley_expected_fringe_shift",
        expression: "expected_fringe_shift = (2*arm_length_m/lambda_light_m)*(aether_speed_m_s^2/c^2)",
        displayLatex: "\\Delta N_{exp}\\approx(2L/\\lambda)(v^2/c^2)",
        targetVariable: "expected_fringe_shift",
      }),
    ],
    sourceRefs: [
      literatureRef("Britannica-Michelson-Morley-experiment", "Michelson-Morley null result and aether context."),
      literatureRef("Michelson-Morley-1887-American-Journal-of-Science", "Original aether-drift experiment context."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "michelson_morley", "aether_drift", "interferometer", "null_result"],
      symbols: ["arm_length_m", "lambda_light_m", "aether_speed_m_s", "c", "expected_fringe_shift"],
      unitSignatures: ["L", "L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["aether_drift_null", "interferometer_fringe_shift"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.history.trouton_noble_torque_null",
    title: "Trouton-Noble Torque Null",
    plainMeaning:
      "Represents the null torque result for a charged capacitor as an electromagnetic aether-drift constraint.",
    whyItMatters:
      "It extends the aether problem beyond optics: electrostatic systems also failed to reveal absolute motion.",
    subjects: ["relativity_history", "trouton_noble", "electromagnetism", "aether_drift", "null_result"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["relativity_history"],
    equationFamilies: ["electromagnetic_aether_drift", "torque_null_result"],
    tags: ["trouton_noble", "null_result", "calculator_loadable"],
    equations: [
      {
        id: "trouton_noble_expected_torque",
        role: "calculator_demo",
        displayLatex: "\\tau_{exp}\\approx-E(v^2/c^2)\\sin(2\\alpha)",
        computableExpression:
          "trouton_expected_torque_N_m = -capacitor_energy_J*(aether_speed_m_s^2/c^2)*sin(2*plate_angle_rad)",
        operatorKind: "scalar_expression",
        inputSymbols: ["capacitor_energy_J", "aether_speed_m_s", "c", "plate_angle_rad"],
        outputSymbols: ["trouton_expected_torque_N_m"],
      },
    ],
    units: [
      { symbol: "capacitor_energy_J", unit: "J", quantity: "capacitor_energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "aether_speed_m_s", unit: "m/s", quantity: "hypothetical_aether_speed", dimensionSignature: "L T^-1" },
      { symbol: "plate_angle_rad", unit: "rad", quantity: "angle", dimensionSignature: "1" },
      { symbol: "trouton_expected_torque_N_m", unit: "N m", quantity: "torque", dimensionSignature: "M L^2 T^-2" },
    ],
    assumptions: [
      "The torque row is a classical aether-drift expectation used as a diagnostic comparison.",
      "The observed null result blocks absolute-motion claims; it does not alone complete relativistic mechanics.",
    ],
    calculatorPayloads: [
      payload({
        id: "trouton_noble_expected_torque",
        expression: "trouton_expected_torque_N_m = -capacitor_energy_J*(aether_speed_m_s^2/c^2)*sin(2*plate_angle_rad)",
        displayLatex: "\\tau_{exp}\\approx-E(v^2/c^2)\\sin(2\\alpha)",
        targetVariable: "trouton_expected_torque_N_m",
      }),
    ],
    sourceRefs: [
      literatureRef("Trouton-Noble-1903-aether-drift-torque", "Charged-capacitor aether-drift torque experiment."),
      literatureRef("AJP-Trouton-Noble-null-result-analysis", "Modern discussion of the Trouton-Noble null result."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "trouton_noble", "electromagnetism", "aether_drift", "null_result"],
      symbols: ["capacitor_energy_J", "aether_speed_m_s", "c", "plate_angle_rad", "trouton_expected_torque_N_m"],
      unitSignatures: ["M L^2 T^-2", "L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["electromagnetic_aether_drift", "torque_null_result"],
      simulationOwners: ["relativity_history"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.lorentz.length_contraction_context",
    title: "Lorentz-FitzGerald Length Contraction Context",
    plainMeaning:
      "Represents length contraction as the historical bridge from aether-drift null results to Lorentzian kinematics.",
    whyItMatters:
      "It shows why the graph connects Michelson-Morley constraints to the Lorentz factor instead of treating contraction as arbitrary visual foreshortening.",
    subjects: ["relativity_history", "lorentz", "fitzgerald", "length_contraction", "lorentz_factor"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["relativity_history", "general_physics"],
    equationFamilies: ["length_contraction", "lorentz_factor"],
    tags: ["length_contraction", "lorentz", "calculator_loadable"],
    equations: [
      {
        id: "lorentz_length_contraction",
        role: "calculator_demo",
        displayLatex: "L_{\\parallel}=L_0/\\gamma",
        computableExpression: "contracted_length_m = proper_length_m/gamma",
        operatorKind: "scalar_expression",
        inputSymbols: ["proper_length_m", "gamma"],
        outputSymbols: ["contracted_length_m"],
      },
    ],
    units: [
      { symbol: "proper_length_m", unit: "m", quantity: "proper_length", dimensionSignature: "L" },
      { symbol: "gamma", unit: null, quantity: "lorentz_factor", dimensionSignature: "1" },
      { symbol: "contracted_length_m", unit: "m", quantity: "contracted_length", dimensionSignature: "L" },
    ],
    assumptions: [
      "Historically, contraction was first used as a hypothesis to reconcile aether-drift null results.",
      "In special relativity, the same expression is interpreted kinematically through inertial-frame measurement.",
    ],
    calculatorPayloads: [
      payload({
        id: "lorentz_length_contraction",
        expression: "contracted_length_m = proper_length_m/gamma",
        displayLatex: "L_{\\parallel}=L_0/\\gamma",
        targetVariable: "contracted_length_m",
      }),
    ],
    sourceRefs: [
      literatureRef("Brown-2001-origins-of-length-contraction", "FitzGerald-Lorentz deformation hypothesis context."),
      literatureRef("Lorentz-1892-relative-motion-earth-aether", "Lorentz contraction context after Michelson-Morley."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "lorentz", "fitzgerald", "length_contraction", "lorentz_factor"],
      symbols: ["proper_length_m", "gamma", "contracted_length_m"],
      unitSignatures: ["L", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["length_contraction", "lorentz_factor"],
      simulationOwners: ["relativity_history", "general_physics"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.lorentz.transform_context",
    title: "Lorentz Transformation Context",
    plainMeaning:
      "Represents Lorentz transformations as the compact coordinate structure that preserves light-speed form across inertial frames.",
    whyItMatters:
      "It is the formal endpoint of the historical constraint lane and connects the experiment sequence to the existing Lorentz-factor badge.",
    subjects: ["relativity_history", "lorentz", "lorentz_transform", "inertial_frames", "special_relativity"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["relativity_history", "general_physics"],
    equationFamilies: ["lorentz_transform", "inertial_frame_transform"],
    tags: ["lorentz_transform", "special_relativity", "calculator_loadable"],
    equations: [
      {
        id: "lorentz_transform_x",
        role: "calculator_demo",
        displayLatex: "x'=\\gamma(x-vt)",
        computableExpression: "x_prime_m = gamma*(x_m - v_m_s*t_s)",
        operatorKind: "scalar_expression",
        inputSymbols: ["gamma", "x_m", "v_m_s", "t_s"],
        outputSymbols: ["x_prime_m"],
      },
      {
        id: "lorentz_transform_t",
        role: "calculator_demo",
        displayLatex: "t'=\\gamma(t-vx/c^2)",
        computableExpression: "t_prime_s = gamma*(t_s - v_m_s*x_m/c^2)",
        operatorKind: "scalar_expression",
        inputSymbols: ["gamma", "t_s", "v_m_s", "x_m", "c"],
        outputSymbols: ["t_prime_s"],
      },
    ],
    units: [
      { symbol: "x_m", unit: "m", quantity: "position", dimensionSignature: "L" },
      { symbol: "x_prime_m", unit: "m", quantity: "transformed_position", dimensionSignature: "L" },
      { symbol: "t_s", unit: "s", quantity: "time", dimensionSignature: "T" },
      { symbol: "t_prime_s", unit: "s", quantity: "transformed_time", dimensionSignature: "T" },
      { symbol: "v_m_s", unit: "m/s", quantity: "relative_speed", dimensionSignature: "L T^-1" },
      { symbol: "gamma", unit: null, quantity: "lorentz_factor", dimensionSignature: "1" },
    ],
    assumptions: [
      "This row represents inertial-frame transformation context, not a full derivation of special relativity.",
      "The graph separates Lorentz's historical aether interpretation from Einstein's later spacetime interpretation.",
    ],
    calculatorPayloads: [
      payload({
        id: "lorentz_transform_x",
        expression: "x_prime_m = gamma*(x_m - v_m_s*t_s)",
        displayLatex: "x'=\\gamma(x-vt)",
        targetVariable: "x_prime_m",
      }),
      payload({
        id: "lorentz_transform_t",
        expression: "t_prime_s = gamma*(t_s - v_m_s*x_m/c^2)",
        displayLatex: "t'=\\gamma(t-vx/c^2)",
        targetVariable: "t_prime_s",
      }),
    ],
    sourceRefs: [
      literatureRef("Lorentz-1904-electromagnetic-phenomena-moving-system", "Lorentz transformations in 1904 electron theory context."),
      literatureRef("Stanford-spacetime-theories-special-relativity", "Relativity principle applied to electromagnetic theory."),
    ],
    hintKeys: {
      subjects: ["relativity_history", "lorentz", "lorentz_transform", "inertial_frames", "special_relativity"],
      symbols: ["gamma", "x_m", "x_prime_m", "t_s", "t_prime_s", "v_m_s", "c"],
      unitSignatures: ["L", "T", "L T^-1", "1"],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["lorentz_transform", "inertial_frame_transform"],
      simulationOwners: ["relativity_history", "general_physics"],
    },
  }),
  relativityHistoryBadge({
    id: "relativity.claim_boundary.historical_constraints_not_single_proof",
    title: "Relativity History Constraint Boundary",
    plainMeaning:
      "Blocks promotion from any one historical experiment into a one-step proof of special relativity or any project physics claim.",
    whyItMatters:
      "It lets Helix explain why the experiments collectively forced a transition in physics without overstating a single result.",
    subjects: ["claim_boundary", "relativity_history", "special_relativity", "aether_drift", "newtonian_mechanics"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["relativity_history", "general_physics"],
    equationFamilies: ["relativity_history_claim_boundary", "historical_constraint_chain"],
    tags: ["claim_boundary", "diagnostic_only", "blocks_promotion"],
    equations: [
      {
        id: "historical_constraint_boundary",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{experiment\\ chain}\\Rightarrow\\mathrm{constraints},\\;\\mathrm{not\\ single\\ proof}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["historical_experiment_chain"],
        outputSymbols: ["blocked_single_proof_promotion"],
      },
    ],
    units: [],
    assumptions: [
      "No single experiment alone proves special relativity.",
      "The chain constrains instantaneous light, Galilean light-speed addition, and simple aether-drift models.",
      "Lorentz-FitzGerald contraction before Einstein is historical explanatory context, not yet Einsteinian spacetime geometry.",
      "These rows support relativity foundations, not NHM2 validation, warp validation, or physical mechanism claims.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef("shared/theory/relativity-history-theory-badges.ts", "Relativity history boundary row."),
      literatureRef("Britannica-Michelson-Morley-experiment", "Null result as aether-theory constraint."),
    ],
    hintKeys: {
      subjects: ["claim_boundary", "relativity_history", "special_relativity", "aether_drift", "newtonian_mechanics"],
      symbols: ["historical_experiment_chain", "blocked_single_proof_promotion"],
      unitSignatures: [],
      repoPaths: ["shared/theory/relativity-history-theory-badges.ts"],
      equationFamilies: ["relativity_history_claim_boundary", "historical_constraint_chain"],
      simulationOwners: ["relativity_history", "general_physics"],
    },
  }),
];

export const RELATIVITY_HISTORY_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "romer_documents_speed_of_light_constant",
    from: "relativity.history.romer_io_light_time_delay",
    to: "physics.constants.speed_of_light",
    relation: "documents",
    label: "Io eclipse timing documents the empirical origin of finite light-speed measurement.",
    claimBoundaryNote: "Historical measurement context does not replace the exact SI constant definition.",
  },
  {
    id: "romer_documents_bradley_aberration",
    from: "relativity.history.romer_io_light_time_delay",
    to: "relativity.history.bradley_stellar_aberration",
    relation: "documents",
    label: "Romer's finite-light-speed context precedes Bradley's stellar-aberration constraint.",
    claimBoundaryNote: "The sequence is historical constraint context only.",
  },
  {
    id: "bradley_documents_fizeau_wheel",
    from: "relativity.history.bradley_stellar_aberration",
    to: "relativity.history.fizeau_wheel_terrestrial_c",
    relation: "documents",
    label: "Stellar aberration motivates c as a measurable quantity before terrestrial measurement.",
    claimBoundaryNote: "Astronomical and laboratory routes are mutually reinforcing context.",
  },
  {
    id: "fizeau_wheel_documents_foucault_medium",
    from: "relativity.history.fizeau_wheel_terrestrial_c",
    to: "relativity.history.foucault_medium_speed",
    relation: "documents",
    label: "Terrestrial c measurement documents the background for medium-speed comparisons.",
    claimBoundaryNote: "Medium behavior is wave-optics context, not a relativity proof.",
  },
  {
    id: "foucault_documents_fizeau_flowing_water",
    from: "relativity.history.foucault_medium_speed",
    to: "relativity.history.fizeau_flowing_water_drag",
    relation: "documents",
    label: "Medium-speed context leads into moving-medium partial-drag constraints.",
    claimBoundaryNote: "Partial drag constrains velocity-addition stories without proving a final theory by itself.",
  },
  {
    id: "fizeau_flowing_water_documents_lorentz_transform",
    from: "relativity.history.fizeau_flowing_water_drag",
    to: "relativity.lorentz.transform_context",
    relation: "documents",
    label: "Fizeau's partial-drag result is later compactly explained by Lorentzian velocity structure.",
    claimBoundaryNote: "This is a historical fit relation, not a derivation edge.",
  },
  {
    id: "fizeau_flowing_water_documents_michelson_morley",
    from: "relativity.history.fizeau_flowing_water_drag",
    to: "relativity.history.michelson_morley_aether_null",
    relation: "documents",
    label: "Moving-medium partial drag and aether-drift null results jointly strained classical aether models.",
    claimBoundaryNote: "The edge documents tension among experiments, not a single validation.",
  },
  {
    id: "michelson_morley_documents_length_contraction",
    from: "relativity.history.michelson_morley_aether_null",
    to: "relativity.lorentz.length_contraction_context",
    relation: "documents",
    label: "The Michelson-Morley null result motivated FitzGerald-Lorentz contraction hypotheses.",
    claimBoundaryNote: "Contraction began as a historical explanatory context before special-relativistic interpretation.",
  },
  {
    id: "lorentz_factor_required_for_length_contraction",
    from: "physics.frames.lorentz_factor",
    to: "relativity.lorentz.length_contraction_context",
    relation: "requires",
    label: "Length contraction uses the Lorentz factor.",
    claimBoundaryNote: "Calculator dependency only; it does not promote historical context to proof.",
  },
  {
    id: "lorentz_factor_required_for_transform_context",
    from: "physics.frames.lorentz_factor",
    to: "relativity.lorentz.transform_context",
    relation: "requires",
    label: "Lorentz coordinate transforms use gamma.",
    claimBoundaryNote: "Reference dependency only.",
  },
  {
    id: "trouton_noble_bounds_aether_drift_story",
    from: "relativity.history.trouton_noble_torque_null",
    to: "relativity.history.michelson_morley_aether_null",
    relation: "bounds",
    label: "Trouton-Noble bounds aether-drift explanations beyond optical interferometry.",
    claimBoundaryNote: "Electromagnetic null results support the constraint chain without becoming a proof shortcut.",
  },
  {
    id: "michelson_morley_blocks_single_proof_promotion",
    from: "relativity.history.michelson_morley_aether_null",
    to: "relativity.claim_boundary.historical_constraints_not_single_proof",
    relation: "blocks",
    label: "The Michelson-Morley null result cannot be promoted into a one-step proof.",
    claimBoundaryNote: "The graph treats it as a central constraint in a larger chain.",
  },
  {
    id: "trouton_noble_blocks_single_proof_promotion",
    from: "relativity.history.trouton_noble_torque_null",
    to: "relativity.claim_boundary.historical_constraints_not_single_proof",
    relation: "blocks",
    label: "The Trouton-Noble null result cannot be promoted into a one-step proof.",
    claimBoundaryNote: "The graph treats it as an electromagnetic constraint in a larger chain.",
  },
  {
    id: "lorentz_transform_documents_relativity_boundary",
    from: "relativity.lorentz.transform_context",
    to: "relativity.claim_boundary.historical_constraints_not_single_proof",
    relation: "documents",
    label: "Lorentz transformations document the compact endpoint of the historical constraint lane.",
    claimBoundaryNote: "The endpoint is relativity foundation context, not an NHM2 or warp validation.",
  },
];

export function buildRelativityHistoryTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: RELATIVITY_HISTORY_THEORY_BADGES.map((badge: TheoryBadgeV1) => ({ ...badge })),
    edges: RELATIVITY_HISTORY_THEORY_EDGES.map((edge: TheoryBadgeEdgeV1) => ({ ...edge })),
  };
}
