import {
  buildTheoryBadgeGraphV1,
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeGraphV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA } from "../helix-calculator-setup-context";
import {
  FIRST_PRINCIPLES_THEORY_BADGES,
  FIRST_PRINCIPLES_THEORY_EDGES,
} from "./first-principles-theory-badges";
import {
  STARSIM_THEORY_BADGES,
  STARSIM_THEORY_EDGES,
} from "./starsim-theory-badges";
import {
  COSMIC_DISTANCE_LADDER_BADGES,
  COSMIC_DISTANCE_LADDER_EDGES,
} from "./cosmic-distance-ladder-badges";
import {
  buildSolarSpectrumTheoryBadgesV1,
} from "./solar-spectrum-theory-badges";
import {
  buildSolarStellarReferenceTheoryBadgesV1,
} from "./solar-stellar-reference-theory-badges";
import {
  buildAstrochemistryPrebioticTheoryBadgesV1,
} from "./astrochemistry-prebiotic-theory-badges";
import {
  buildEvolutionaryBiophysicsTheoryBadgesV1,
} from "./evolutionary-biophysics-theory-badges";
import {
  buildPreboundaryBioenergeticsTheoryBadgesV1,
} from "./preboundary-bioenergetics-theory-badges";
import {
  buildViabilityRegulationTheoryBadgesV1,
} from "./viability-regulation-theory-badges";
import {
  buildLowTemperatureQuantumBoundsTheoryBadgesV1,
} from "./low-temperature-quantum-bounds-theory-badges";
import {
  buildRelativityHistoryTheoryBadgesV1,
} from "./relativity-history-theory-badges";
import {
  buildNhm2FullSolveTheoryBadgesV1,
} from "./nhm2-full-solve-theory-badges";
import {
  buildStellarSpectroscopyAstrochemistryTheoryBadgesV1,
} from "./stellar-spectroscopy-astrochemistry-theory-badges";
import {
  buildCasimirCavityTheoryBadgesV1,
} from "./casimir-cavity-theory-badges";
import {
  buildTokamakPlasmaTheoryBadgesV1,
} from "./tokamak-plasma-theory-badges";
import {
  buildGalacticDynamicsTheoryBadgesV1,
} from "./galactic-dynamics-theory-badges";
import {
  buildGranularTidalLoveNumberTheoryBadgesV1,
} from "./granular-tidal-love-number-theory-badges";
import {
  buildCurvatureCollapseTheoryBadgesV1,
} from "./curvature-collapse-theory-badges";
import {
  buildOrchOrCoherenceTheoryBadgesV1,
} from "./orch-or-coherence-theory-badges";
import {
  buildNucleosynthesisOriginTheoryBadgesV1,
} from "./nucleosynthesis-origin-theory-badges";
import {
  buildNuclearBindingFirstPrinciplesTheoryBadgesV1,
} from "./nuclear-binding-first-principles-theory-badges";
import {
  buildPeriodicElementOriginTheoryBadgesV1,
} from "./periodic-element-origin-theory-badges";
import {
  buildPhaseOfMatterTheoryBadgesV1,
} from "./phase-of-matter-theory-badges";
import {
  buildCollectiveModeSynchronyTheoryBadgesV1,
} from "./collective-mode-synchrony-theory-badges";
import {
  buildCrossScaleConnectiveTissueTheoryBadgesV1,
} from "./cross-scale-connective-tissue-theory-badges";

const DIAGNOSTIC_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const repoRef = (path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
  path,
  note: note ?? null,
});

const docRef = (path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "doc",
  path,
  note: note ?? null,
});

const literatureRef = (id: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
  note: note ?? null,
});

const badges: TheoryBadgeV1[] = [
  {
    id: "physics.gr.einstein_field_equation",
    title: "Einstein field equation",
    plainMeaning: "Connects spacetime curvature with stress-energy as a canonical GR reference.",
    whyItMatters: "It anchors the graph in the field equation family that source and geometry diagnostics refer back to.",
    subjects: ["general_relativity", "field_equations", "stress_energy"],
    level: "law",
    status: "canonical_reference",
    simulationOwners: ["general_relativity"],
    equationFamilies: ["einstein_field_equation"],
    tags: ["curvature", "stress_energy", "canonical"],
    equations: [
      {
        id: "efe_tensor_form",
        role: "law",
        displayLatex: "G_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["G", "c", "T_mu_nu"],
        outputSymbols: ["G_mu_nu"],
      },
    ],
    units: [
      { symbol: "G_{\\mu\\nu}", quantity: "curvature", dimensionSignature: "L^-2" },
      { symbol: "T_{\\mu\\nu}", unit: "Pa", quantity: "stress_energy", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: ["Canonical reference only in this graph.", "Tensor solving is outside the scalar calculator path."],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Einstein field equations", "Canonical GR reference."),
      repoRef("shared/math-stage.ts", "Math stage registry contributes maturity metadata for related modules."),
    ],
    hintKeys: {
      subjects: ["general_relativity", "stress_energy"],
      symbols: ["G_mu_nu", "T_mu_nu", "G", "c"],
      unitSignatures: ["L^-2", "M L^-1 T^-2"],
      repoPaths: ["shared/math-stage.ts"],
      equationFamilies: ["einstein_field_equation"],
      simulationOwners: ["general_relativity"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "physics.gr.stress_energy_conservation",
    title: "Stress-energy conservation",
    plainMeaning: "Tracks the compatibility condition that stress-energy should be conserved in the GR setting.",
    whyItMatters: "It gives source diagnostics a conservation target without claiming a complete physical source model.",
    subjects: ["general_relativity", "stress_energy", "conservation"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_relativity"],
    equationFamilies: ["stress_energy_conservation"],
    tags: ["conservation", "covariant_derivative"],
    equations: [
      {
        id: "stress_energy_covariant_divergence",
        role: "constraint",
        displayLatex: "\\nabla_{\\mu}T^{\\mu\\nu}=0",
        computableExpression: null,
        operatorKind: "tensor_component",
        inputSymbols: ["T_mu_nu"],
        outputSymbols: ["div_T"],
      },
    ],
    units: [{ symbol: "T^{\\mu\\nu}", unit: "Pa", quantity: "stress_energy", dimensionSignature: "M L^-1 T^-2" }],
    assumptions: ["Canonical compatibility relation.", "No scalar calculator payload until tensor components are projected."],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Stress-energy conservation", "Canonical compatibility condition."),
      repoRef("MATH_GRAPH.json", "Dependency graph source for math-module relation hints."),
    ],
    hintKeys: {
      subjects: ["stress_energy", "conservation"],
      symbols: ["T_mu_nu", "div_T"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: ["MATH_GRAPH.json"],
      equationFamilies: ["stress_energy_conservation"],
      simulationOwners: ["general_relativity"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "physics.gr.3p1_decomposition",
    title: "3+1 decomposition",
    plainMeaning: "Splits spacetime geometry into lapse, shift, and spatial metric terms used by simulation diagnostics.",
    whyItMatters: "It bridges GR references to the lapse and shift quantities that NHM2 panels already expose.",
    subjects: ["general_relativity", "adm", "geometry"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_relativity", "NHM2"],
    equationFamilies: ["adm_decomposition"],
    tags: ["lapse", "shift", "spatial_metric"],
    equations: [
      {
        id: "adm_line_element",
        role: "transform",
        displayLatex: "ds^2=-\\alpha^2dt^2+\\gamma_{ij}(dx^i+\\beta^idt)(dx^j+\\beta^jdt)",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["alpha", "beta_i", "gamma_ij"],
        outputSymbols: ["ds_squared"],
      },
    ],
    units: [
      { symbol: "\\alpha", quantity: "lapse", dimensionSignature: "1" },
      { symbol: "\\beta^i", quantity: "shift", dimensionSignature: "L T^-1" },
    ],
    assumptions: ["Reference decomposition only.", "Calculator payloads use scalar projections of these fields."],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("ADM 3+1 decomposition", "Canonical GR split used for simulation-facing terms."),
      repoRef("client/src/components/ShiftVectorPanel.tsx", "Panel owner for shift-vector visualization."),
    ],
    hintKeys: {
      subjects: ["adm", "geometry"],
      symbols: ["alpha", "beta_i", "gamma_ij", "ds_squared"],
      unitSignatures: ["1", "L T^-1"],
      repoPaths: ["client/src/components/ShiftVectorPanel.tsx"],
      equationFamilies: ["adm_decomposition"],
      simulationOwners: ["general_relativity", "NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.geometry.lapse_shift_profile",
    title: "Lapse-shift profile sample",
    plainMeaning: "Represents a scalar timing offset used to inspect a sampled lapse-shift profile.",
    whyItMatters: "It gives the badge graph a calculator-loadable bridge from geometry language to a simple timing expression.",
    subjects: ["nhm2", "geometry", "time_dilation"],
    level: "simulation_specific",
    status: "project_derived",
    simulationOwners: ["NHM2"],
    equationFamilies: ["lapse_shift_profile"],
    tags: ["lapse", "shift", "time_offset", "calculator_loadable"],
    equations: [
      {
        id: "proper_time_scalar_offset",
        role: "calculator_demo",
        displayLatex: "t_{proper}=t_{shift}+\\Delta t_{lapse}",
        computableExpression: "t_proper = t_shift + delta_t_lapse",
        operatorKind: "scalar_expression",
        inputSymbols: ["t_shift", "delta_t_lapse"],
        outputSymbols: ["t_proper"],
      },
    ],
    units: [
      { symbol: "t_{proper}", unit: "s", quantity: "time", dimensionSignature: "T" },
      { symbol: "t_{shift}", unit: "s", quantity: "time", dimensionSignature: "T" },
      { symbol: "\\Delta t_{lapse}", unit: "s", quantity: "time", dimensionSignature: "T" },
    ],
    assumptions: ["Scalar timing proxy only.", "Does not establish a complete spacetime solution."],
    calculatorPayloads: [
      {
        id: "proper_time_scalar_offset_payload",
        expression: "t_proper = t_shift + delta_t_lapse",
        displayLatex: "t_{proper}=t_{shift}+\\Delta t_{lapse}",
        preferredAction: "solve_with_steps",
        targetVariable: "t_proper",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "t_proper = t_shift + delta_t_lapse",
          display_latex: "t_{proper}=t_{shift}+\\Delta t_{lapse}",
          subgoal: "Compute a scalar timing proxy from shift and lapse-offset terms.",
          domain: "generic",
          equation: "t_proper = t_shift + delta_t_lapse",
          variables: [
            { symbol: "t_shift", value: "1", unit: "s", meaning: "shift timing sample", dimension_signature: "T" },
            { symbol: "delta_t_lapse", value: "0.1", unit: "s", meaning: "lapse timing offset", dimension_signature: "T" },
          ],
          unit_system: "SI",
          result_unit: "s",
          result_quantity: "time",
          result_dimension_signature: "T",
          assumptions: ["Diagnostic scalar proxy only.", "Does not validate NHM2."],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("client/src/components/TimeDilationLatticePanel.tsx", "Panel owner for time-dilation visualization."),
      repoRef("client/src/components/ShiftVectorPanel.tsx", "Panel owner for shift-vector visualization."),
    ],
    hintKeys: {
      subjects: ["nhm2", "geometry", "time_dilation"],
      symbols: ["t_proper", "t_shift", "delta_t_lapse"],
      unitSignatures: ["T"],
      repoPaths: ["client/src/components/TimeDilationLatticePanel.tsx", "client/src/components/ShiftVectorPanel.tsx"],
      equationFamilies: ["lapse_shift_profile"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.source.energy_density_proxy",
    title: "Energy density proxy",
    plainMeaning: "Relates an energy-like quantity to an effective sampled volume.",
    whyItMatters: "It provides a simple scalar loadout for stress-energy unit checks and future badge-path playback.",
    subjects: ["nhm2", "stress_energy", "units"],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["energy_density_proxy"],
    tags: ["energy_density", "scalar_proxy", "calculator_loadable"],
    equations: [
      {
        id: "rho_equals_E_over_V",
        role: "calculator_demo",
        displayLatex: "\\rho = \\frac{E}{V}",
        computableExpression: "rho = E / V",
        operatorKind: "scalar_expression",
        inputSymbols: ["E", "V"],
        outputSymbols: ["rho"],
      },
    ],
    units: [
      { symbol: "\\rho", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "E", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "V", unit: "m^3", quantity: "volume", dimensionSignature: "L^3" },
    ],
    assumptions: ["Diagnostic scalar proxy only.", "Does not validate NHM2."],
    calculatorPayloads: [
      {
        id: "rho_equals_E_over_V_payload",
        expression: "rho = E / V",
        displayLatex: "\\rho = \\frac{E}{V}",
        preferredAction: "solve_with_steps",
        targetVariable: "rho",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "rho = E / V",
          display_latex: "\\rho = \\frac{E}{V}",
          subgoal: "Compute an energy-density proxy from energy and volume.",
          domain: "generic",
          equation: "rho = E / V",
          variables: [
            {
              symbol: "E",
              value: "1",
              unit: "J",
              meaning: "energy-like quantity",
              dimension_signature: "M L^2 T^-2",
            },
            {
              symbol: "V",
              value: "1",
              unit: "m^3",
              meaning: "effective sampled volume",
              dimension_signature: "L^3",
            },
          ],
          unit_system: "SI",
          result_unit: "J/m^3",
          result_quantity: "energy_density",
          result_dimension_signature: "M L^-1 T^-2",
          assumptions: ["Diagnostic scalar proxy only.", "Does not validate NHM2."],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("shared/contracts/nhm2-observable-equation-map.v1.ts", "Equation-map contract for source bindings."),
      repoRef("client/src/components/panels/ScientificCalculatorPanel.tsx", "Calculator panel that will load this scalar payload."),
    ],
    hintKeys: {
      subjects: ["nhm2", "stress_energy", "units"],
      symbols: ["rho", "E", "V"],
      unitSignatures: ["M L^-1 T^-2", "M L^2 T^-2", "L^3"],
      repoPaths: ["shared/contracts/nhm2-observable-equation-map.v1.ts", "client/src/components/panels/ScientificCalculatorPanel.tsx"],
      equationFamilies: ["energy_density_proxy"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.tile.duty_cycle_average",
    title: "Tile duty-cycle average",
    plainMeaning: "Converts an energy-per-cycle term into an average power proxy over a cycle period.",
    whyItMatters: "It links tile scheduling language to a scalar expression the calculator can replay deterministically.",
    subjects: ["nhm2", "tile_array", "power"],
    level: "simulation_specific",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["duty_cycle_average"],
    tags: ["duty_cycle", "power", "calculator_loadable"],
    equations: [
      {
        id: "average_power_from_cycle_energy",
        role: "calculator_demo",
        displayLatex: "P_{avg}=\\frac{E_{cycle}}{T_{cycle}}",
        computableExpression: "P_avg = E_cycle / T_cycle",
        operatorKind: "scalar_expression",
        inputSymbols: ["E_cycle", "T_cycle"],
        outputSymbols: ["P_avg"],
      },
    ],
    units: [
      { symbol: "P_{avg}", unit: "W", quantity: "power", dimensionSignature: "M L^2 T^-3" },
      { symbol: "E_{cycle}", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "T_{cycle}", unit: "s", quantity: "time", dimensionSignature: "T" },
    ],
    assumptions: ["Averaging proxy only.", "Tile duty values are diagnostic inputs, not a physical mechanism claim."],
    calculatorPayloads: [
      {
        id: "average_power_from_cycle_energy_payload",
        expression: "P_avg = E_cycle / T_cycle",
        displayLatex: "P_{avg}=\\frac{E_{cycle}}{T_{cycle}}",
        preferredAction: "solve_with_steps",
        targetVariable: "P_avg",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "P_avg = E_cycle / T_cycle",
          display_latex: "P_{avg}=\\frac{E_{cycle}}{T_{cycle}}",
          subgoal: "Compute average tile power from cycle energy and period.",
          domain: "generic",
          equation: "P_avg = E_cycle / T_cycle",
          variables: [
            { symbol: "E_cycle", value: "1", unit: "J", meaning: "energy-like cycle budget", dimension_signature: "M L^2 T^-2" },
            { symbol: "T_cycle", value: "1", unit: "s", meaning: "cycle period", dimension_signature: "T" },
          ],
          unit_system: "SI",
          result_unit: "W",
          result_quantity: "power",
          result_dimension_signature: "M L^2 T^-3",
          assumptions: ["Diagnostic scalar proxy only.", "Does not validate NHM2."],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("client/src/components/CasimirTileGridPanel.tsx", "Tile-grid panel owner."),
      repoRef("MATH_GRAPH.json", "Dependency graph source for tile-related math modules."),
    ],
    hintKeys: {
      subjects: ["nhm2", "tile_array", "power"],
      symbols: ["P_avg", "E_cycle", "T_cycle"],
      unitSignatures: ["M L^2 T^-3", "M L^2 T^-2", "T"],
      repoPaths: ["client/src/components/CasimirTileGridPanel.tsx", "MATH_GRAPH.json"],
      equationFamilies: ["duty_cycle_average"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.closure.source_residual",
    title: "Source residual",
    plainMeaning: "Compares a required source proxy with an available source proxy.",
    whyItMatters: "It gives closure diagnostics a named scalar residual that future path playback can trace.",
    subjects: ["nhm2", "source_closure", "residual"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["source_residual"],
    tags: ["residual", "closure", "calculator_loadable"],
    equations: [
      {
        id: "source_residual_difference",
        role: "residual",
        displayLatex: "R_{source}=source_{required}-source_{available}",
        computableExpression: "R_source = source_required - source_available",
        operatorKind: "residual",
        inputSymbols: ["source_required", "source_available"],
        outputSymbols: ["R_source"],
      },
    ],
    units: [
      { symbol: "R_{source}", unit: "J/m^3", quantity: "source_residual", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "source_{required}", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "source_{available}", unit: "J/m^3", quantity: "energy_density", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: ["Residual is a diagnostic comparison.", "A small residual is not a validation statement."],
    calculatorPayloads: [
      {
        id: "source_residual_difference_payload",
        expression: "R_source = source_required - source_available",
        displayLatex: "R_{source}=source_{required}-source_{available}",
        preferredAction: "solve_with_steps",
        targetVariable: "R_source",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "R_source = source_required - source_available",
          display_latex: "R_{source}=source_{required}-source_{available}",
          subgoal: "Compute a diagnostic source residual.",
          domain: "generic",
          equation: "R_source = source_required - source_available",
          variables: [
            {
              symbol: "source_required",
              value: "1",
              unit: "J/m^3",
              meaning: "required source proxy",
              dimension_signature: "M L^-1 T^-2",
            },
            {
              symbol: "source_available",
              value: "0.5",
              unit: "J/m^3",
              meaning: "available source proxy",
              dimension_signature: "M L^-1 T^-2",
            },
          ],
          unit_system: "SI",
          result_unit: "J/m^3",
          result_quantity: "source_residual",
          result_dimension_signature: "M L^-1 T^-2",
          assumptions: ["Diagnostic scalar proxy only.", "Does not validate NHM2."],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("shared/contracts/nhm2-observable-equation-map.v1.ts", "Equation-map source and claim-boundary contract."),
      repoRef("tools/nhm2/validate-observable-equation-map.ts", "Validator source for observable map safety."),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_closure", "residual"],
      symbols: ["R_source", "source_required", "source_available"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: ["shared/contracts/nhm2-observable-equation-map.v1.ts", "tools/nhm2/validate-observable-equation-map.ts"],
      equationFamilies: ["source_residual"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.closure.wall_t00_source_residual",
    title: "Wall T00 source residual",
    plainMeaning:
      "Compares metric-required wall T00 with the available wall-region source T00 before global source residuals are interpreted.",
    whyItMatters:
      "It makes the wall-region source mismatch the front-door closure blocker so global averages cannot hide local wall failure.",
    subjects: ["nhm2", "source_closure", "wall_region", "T00", "residual"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["wall_t00_source_residual", "source_residual"],
    tags: ["wall_region", "T00", "residual", "calculator_loadable", "wall_first"],
    equations: [
      {
        id: "wall_t00_source_residual_difference",
        role: "residual",
        displayLatex:
          "R_{wall,T00}=T00_{wall,required}-T00_{wall,available}",
        computableExpression:
          "R_wall_T00 = T00_wall_required - T00_wall_available",
        operatorKind: "residual",
        inputSymbols: ["T00_wall_required", "T00_wall_available"],
        outputSymbols: ["R_wall_T00"],
      },
    ],
    units: [
      { symbol: "R_{wall,T00}", unit: "J/m^3", quantity: "wall_t00_source_residual", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "T00_{wall,required}", unit: "J/m^3", quantity: "metric_required_wall_t00", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "T00_{wall,available}", unit: "J/m^3", quantity: "available_wall_t00", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "Wall T00 residual is a diagnostic comparison.",
      "Global source residuals are secondary context and cannot override wall failure.",
      "A small wall residual is not a validation statement.",
    ],
    calculatorPayloads: [
      {
        id: "wall_t00_source_residual_payload",
        expression: "R_wall_T00 = T00_wall_required - T00_wall_available",
        displayLatex:
          "R_{wall,T00}=T00_{wall,required}-T00_{wall,available}",
        preferredAction: "solve_with_steps",
        targetVariable: "R_wall_T00",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "R_wall_T00 = T00_wall_required - T00_wall_available",
          display_latex:
            "R_{wall,T00}=T00_{wall,required}-T00_{wall,available}",
          subgoal: "Compute the diagnostic wall-region T00 source residual.",
          domain: "generic",
          equation: "R_wall_T00 = T00_wall_required - T00_wall_available",
          variables: [
            {
              symbol: "T00_wall_required",
              value: "1",
              unit: "J/m^3",
              meaning: "metric-required wall T00",
              dimension_signature: "M L^-1 T^-2",
            },
            {
              symbol: "T00_wall_available",
              value: "0.5",
              unit: "J/m^3",
              meaning: "available wall-region source T00",
              dimension_signature: "M L^-1 T^-2",
            },
          ],
          unit_system: "SI",
          result_unit: "J/m^3",
          result_quantity: "wall_t00_source_residual",
          result_dimension_signature: "M L^-1 T^-2",
          assumptions: [
            "Diagnostic scalar proxy only.",
            "Global residuals cannot override a failed wall closure.",
            "Does not validate NHM2.",
          ],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("shared/contracts/nhm2-wall-source-closure.v1.ts", "Wall source-closure contract."),
      repoRef("shared/contracts/nhm2-source-closure.v2.ts", "Source-closure v2 embeds the wall contract."),
    ],
    hintKeys: {
      subjects: ["nhm2", "source_closure", "wall_region", "T00", "residual"],
      symbols: ["R_wall_T00", "T00_wall_required", "T00_wall_available"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [
        "shared/contracts/nhm2-wall-source-closure.v1.ts",
        "shared/contracts/nhm2-source-closure.v2.ts",
      ],
      equationFamilies: ["wall_t00_source_residual", "source_residual"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.energy_condition.diagnostic_gate",
    title: "Energy-condition diagnostic gate",
    plainMeaning: "Collects source and inequality indicators into a diagnostic gate label.",
    whyItMatters: "It gives the theory graph a place to show warnings without implying a physical claim.",
    subjects: ["nhm2", "energy_conditions", "diagnostics"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["energy_condition_gate"],
    tags: ["gate", "energy_condition", "claim_boundary"],
    equations: [
      {
        id: "energy_condition_gate_status",
        role: "gate",
        displayLatex: "gate_{EC}=diagnostic(R_{source}, margin_{qei})",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["R_source", "qei_margin"],
        outputSymbols: ["gate_EC"],
      },
    ],
    units: [
      { symbol: "R_{source}", unit: "J/m^3", quantity: "source_residual", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "margin_{qei}", unit: "J/m^3", quantity: "inequality_margin", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: ["Gate status is diagnostic only.", "A favorable indicator does not confirm a physical mechanism."],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef("shared/contracts/nhm2-observable-equation-map.v1.ts", "Claim-boundary rules for NHM2 observable maps."),
      docRef("docs/audits/research/needle-hull-mark2/theory-directory-latest.md", "Theory-directory context where available."),
    ],
    hintKeys: {
      subjects: ["nhm2", "energy_conditions", "diagnostics"],
      symbols: ["gate_EC", "R_source", "qei_margin"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: ["shared/contracts/nhm2-observable-equation-map.v1.ts"],
      equationFamilies: ["energy_condition_gate"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.qei.sampling_window",
    title: "QEI badge replay margin",
    plainMeaning: "Replays the scalar badge calculation qei_margin = qei_bound - qei_sample; the runtime dossier is the authoritative QEI artifact when available.",
    whyItMatters: "It keeps the calculator-loadable scalar margin available without presenting it as a final QEI proof.",
    subjects: ["nhm2", "qei", "sampling"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["NHM2"],
    equationFamilies: ["qei_sampling_window"],
    tags: ["sampling_window", "inequality_margin", "calculator_loadable"],
    equations: [
      {
        id: "qei_margin_difference",
        role: "calculator_demo",
        displayLatex: "margin_{qei}=bound_{qei}-sample_{qei}",
        computableExpression: "qei_margin = qei_bound - qei_sample",
        operatorKind: "scalar_expression",
        inputSymbols: ["qei_bound", "qei_sample"],
        outputSymbols: ["qei_margin"],
      },
    ],
    units: [
      { symbol: "margin_{qei}", unit: "J/m^3", quantity: "inequality_margin", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "bound_{qei}", unit: "J/m^3", quantity: "inequality_bound", dimensionSignature: "M L^-1 T^-2" },
      { symbol: "sample_{qei}", unit: "J/m^3", quantity: "sampled_density", dimensionSignature: "M L^-1 T^-2" },
    ],
    assumptions: [
      "Diagnostic badge replay only.",
      "Bound comparison is a proxy unless backed by the QEI worldline dossier.",
      "The runtime dossier carries worldline, sampling, consistency, and regional margin provenance.",
    ],
    calculatorPayloads: [
      {
        id: "qei_margin_difference_payload",
        expression: "qei_margin = qei_bound - qei_sample",
        displayLatex: "margin_{qei}=bound_{qei}-sample_{qei}",
        preferredAction: "solve_with_steps",
        targetVariable: "qei_margin",
        setupContext: {
          schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
          expression: "qei_margin = qei_bound - qei_sample",
          display_latex: "margin_{qei}=bound_{qei}-sample_{qei}",
          subgoal: "Compute a badge replay inequality margin from bound and sample proxies.",
          domain: "generic",
          equation: "qei_margin = qei_bound - qei_sample",
          variables: [
            {
              symbol: "qei_bound",
              value: "1",
              unit: "J/m^3",
              meaning: "badge replay inequality bound proxy",
              dimension_signature: "M L^-1 T^-2",
            },
            {
              symbol: "qei_sample",
              value: "0.25",
              unit: "J/m^3",
              meaning: "badge replay sampled density proxy",
              dimension_signature: "M L^-1 T^-2",
            },
          ],
          unit_system: "SI",
          result_unit: "J/m^3",
          result_quantity: "inequality_margin",
          result_dimension_signature: "M L^-1 T^-2",
          assumptions: ["Badge replay scalar proxy only.", "Does not validate NHM2."],
          unit_options: [],
        },
      },
    ],
    sourceRefs: [
      repoRef("client/src/components/QiWidgetPanel.tsx", "QI widget owner when present in the app."),
      repoRef("shared/contracts/nhm2-observable-equation-map.v1.ts", "Observable equation claim-boundary source."),
      repoRef("shared/contracts/nhm2-qei-worldline-dossier.v1.ts", "Runtime QEI dossier artifact when available."),
    ],
    hintKeys: {
      subjects: ["nhm2", "qei", "sampling"],
      symbols: ["qei_margin", "qei_bound", "qei_sample"],
      unitSignatures: ["M L^-1 T^-2"],
      repoPaths: [
        "client/src/components/QiWidgetPanel.tsx",
        "shared/contracts/nhm2-observable-equation-map.v1.ts",
        "shared/contracts/nhm2-qei-worldline-dossier.v1.ts",
      ],
      equationFamilies: ["qei_sampling_window"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
  {
    id: "nhm2.claim_boundary.diagnostic_only",
    title: "Diagnostic-only claim boundary",
    plainMeaning: "Marks NHM2 theory badges as diagnostic references rather than validation statements.",
    whyItMatters: "It keeps UI language, graph edges, and future solve playback from overstating what the artifacts show.",
    subjects: ["nhm2", "claim_boundary", "safety"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["NHM2"],
    equationFamilies: ["claim_boundary"],
    tags: ["boundary", "safety", "diagnostic_only"],
    equations: [
      {
        id: "diagnostic_only_boundary",
        role: "noncomputable_reference",
        displayLatex: "claim_{NHM2}=diagnostic\\ only",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["badge_trace", "source_refs"],
        outputSymbols: ["claim_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "NHM2 badge traces are diagnostic artifacts.",
      "Promotion requires a separate review process outside this graph.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef("shared/contracts/nhm2-observable-equation-map.v1.ts", "Existing NHM2 claim-boundary precedent."),
      repoRef("shared/contracts/theory-badge-graph.v1.ts", "Theory badge graph claim-boundary validator."),
    ],
    hintKeys: {
      subjects: ["nhm2", "claim_boundary", "safety"],
      symbols: ["claim_NHM2", "claim_boundary"],
      unitSignatures: [],
      repoPaths: ["shared/contracts/nhm2-observable-equation-map.v1.ts", "shared/contracts/theory-badge-graph.v1.ts"],
      equationFamilies: ["claim_boundary"],
      simulationOwners: ["NHM2"],
    },
    claimBoundary: DIAGNOSTIC_BOUNDARY,
  },
];

const edges: TheoryBadgeEdgeV1[] = [
  {
    id: "efe_requires_conservation",
    from: "physics.gr.einstein_field_equation",
    to: "physics.gr.stress_energy_conservation",
    relation: "requires",
    label: "Field-equation source terms require compatible conservation checks.",
    claimBoundaryNote: "Reference relation only; no NHM2 physical claim.",
  },
  {
    id: "efe_specializes_to_3p1",
    from: "physics.gr.einstein_field_equation",
    to: "physics.gr.3p1_decomposition",
    relation: "specializes",
    label: "3+1 variables provide a simulation-facing geometry split.",
    claimBoundaryNote: "Geometry split is representational in this graph.",
  },
  {
    id: "3p1_specializes_lapse_shift",
    from: "physics.gr.3p1_decomposition",
    to: "nhm2.geometry.lapse_shift_profile",
    relation: "specializes",
    label: "NHM2 lapse-shift samples use scalar projections of 3+1 terms.",
    claimBoundaryNote: "Calculator payload is a scalar proxy.",
  },
  {
    id: "conservation_requires_energy_density_proxy",
    from: "physics.gr.stress_energy_conservation",
    to: "nhm2.source.energy_density_proxy",
    relation: "requires",
    label: "Source diagnostics need energy-density unit signatures.",
    claimBoundaryNote: "Unit compatibility does not imply source closure.",
  },
  {
    id: "energy_density_shares_units_with_tile_average",
    from: "nhm2.source.energy_density_proxy",
    to: "nhm2.tile.duty_cycle_average",
    relation: "shares_units",
    label: "Both badges carry energy-derived scalar quantities.",
    claimBoundaryNote: "Shared units are only a hint relation.",
  },
  {
    id: "energy_density_requires_qei_sampling",
    from: "nhm2.source.energy_density_proxy",
    to: "nhm2.qei.sampling_window",
    relation: "requires",
    label: "QEI sampling compares energy-density-like scalar quantities.",
    claimBoundaryNote: "Executable dependency only feeds diagnostic playback.",
  },
  {
    id: "energy_density_shares_units_with_qei_sampling",
    from: "nhm2.source.energy_density_proxy",
    to: "nhm2.qei.sampling_window",
    relation: "shares_units",
    label: "The source proxy and QEI badge replay margin share energy-density units.",
    claimBoundaryNote: "Shared units are excluded from executable playback.",
  },
  {
    id: "energy_density_requires_source_residual",
    from: "nhm2.source.energy_density_proxy",
    to: "nhm2.closure.source_residual",
    relation: "requires",
    label: "Residual comparison uses source-density-like quantities.",
    claimBoundaryNote: "Residual comparison remains diagnostic.",
  },
  {
    id: "energy_density_requires_wall_t00_source_residual",
    from: "nhm2.source.energy_density_proxy",
    to: "nhm2.closure.wall_t00_source_residual",
    relation: "requires",
    label: "Wall T00 source closure compares energy-density-like quantities.",
    claimBoundaryNote: "Wall residual comparison remains diagnostic.",
  },
  {
    id: "wall_t00_source_residual_specializes_source_residual",
    from: "nhm2.closure.wall_t00_source_residual",
    to: "nhm2.closure.source_residual",
    relation: "diagnostic_checks",
    label: "Wall T00 is the front-door regional source residual before global source closure.",
    claimBoundaryNote: "Global residuals cannot override wall failure.",
  },
  {
    id: "source_residual_checks_energy_gate",
    from: "nhm2.closure.source_residual",
    to: "nhm2.energy_condition.diagnostic_gate",
    relation: "diagnostic_checks",
    label: "Source residual contributes to the energy-condition diagnostic gate.",
    claimBoundaryNote: "Gate status must not be described as validation.",
  },
  {
    id: "qei_bounds_energy_gate",
    from: "nhm2.qei.sampling_window",
    to: "nhm2.energy_condition.diagnostic_gate",
    relation: "bounds",
    label: "The sampled inequality margin bounds one gate input.",
    claimBoundaryNote: "Bound comparison is a diagnostic indicator.",
  },
  {
    id: "energy_gate_documents_boundary",
    from: "nhm2.energy_condition.diagnostic_gate",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "documents",
    label: "Gate labels must point at the diagnostic-only boundary.",
    claimBoundaryNote: "Prevents UI copy from overstating the gate.",
  },
  {
    id: "source_residual_blocks_promotion",
    from: "nhm2.closure.source_residual",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "Residual diagnostics cannot promote themselves into a physical claim.",
    claimBoundaryNote: "Promotion is intentionally disallowed in v1.",
  },
  {
    id: "wall_t00_source_residual_blocks_promotion",
    from: "nhm2.closure.wall_t00_source_residual",
    to: "nhm2.claim_boundary.diagnostic_only",
    relation: "blocks",
    label: "Wall residual diagnostics cannot promote themselves into source closure.",
    claimBoundaryNote: "Wall failure is a blocker even when global residual context looks acceptable.",
  },
];

export function buildHelixTheoryBadgeGraphV1(): TheoryBadgeGraphV1 {
  const relativityHistory = buildRelativityHistoryTheoryBadgesV1();
  const nhm2FullSolve = buildNhm2FullSolveTheoryBadgesV1();
  const solar = buildSolarSpectrumTheoryBadgesV1();
  const solarStellar = buildSolarStellarReferenceTheoryBadgesV1();
  const astroPrebiotic = buildAstrochemistryPrebioticTheoryBadgesV1();
  const evolutionaryBiophysics = buildEvolutionaryBiophysicsTheoryBadgesV1();
  const preboundaryBioenergetics = buildPreboundaryBioenergeticsTheoryBadgesV1();
  const viabilityRegulation = buildViabilityRegulationTheoryBadgesV1();
  const lowTemperatureQuantumBounds = buildLowTemperatureQuantumBoundsTheoryBadgesV1();
  const stellarSpectroscopy = buildStellarSpectroscopyAstrochemistryTheoryBadgesV1();
  const casimir = buildCasimirCavityTheoryBadgesV1();
  const tokamak = buildTokamakPlasmaTheoryBadgesV1();
  const galactic = buildGalacticDynamicsTheoryBadgesV1();
  const granularTidal = buildGranularTidalLoveNumberTheoryBadgesV1();
  const curvature = buildCurvatureCollapseTheoryBadgesV1();
  const orchOr = buildOrchOrCoherenceTheoryBadgesV1();
  const nucleosynthesisOrigins = buildNucleosynthesisOriginTheoryBadgesV1();
  const nuclearBindingFirstPrinciples = buildNuclearBindingFirstPrinciplesTheoryBadgesV1();
  const periodicElements = buildPeriodicElementOriginTheoryBadgesV1();
  const phasesOfMatter = buildPhaseOfMatterTheoryBadgesV1();
  const collectiveModeSynchrony = buildCollectiveModeSynchronyTheoryBadgesV1();
  const crossScaleConnectiveTissue = buildCrossScaleConnectiveTissueTheoryBadgesV1();

  return buildTheoryBadgeGraphV1({
    graphId: "nhm2-theory-badge-graph",
    title: "Helix Theory Badge Graph",
    description:
      "Diagnostic physics theory badges, scalar calculator loadouts, unit signatures, runtime references, NHM2 full-solve tensor/observer/closure provenance, and claim boundaries for relativity history, NHM2, StarSim, cosmic distance ladder, solar spectrum, solar/stellar reference, stellar spectroscopy, astrochemistry/prebiotic, pre-boundary bioenergetics, viability regulation, low-temperature quantum bounds, evolutionary biophysics, Casimir cavity, tokamak plasma, galactic dynamics, and curvature/collapse contexts.",
    badges: [
      ...FIRST_PRINCIPLES_THEORY_BADGES,
      ...relativityHistory.badges,
      ...badges,
      ...nhm2FullSolve.badges,
      ...STARSIM_THEORY_BADGES,
      ...COSMIC_DISTANCE_LADDER_BADGES,
      ...solar.badges,
      ...solarStellar.badges,
      ...astroPrebiotic.badges,
      ...evolutionaryBiophysics.badges,
      ...preboundaryBioenergetics.badges,
      ...viabilityRegulation.badges,
      ...lowTemperatureQuantumBounds.badges,
      ...stellarSpectroscopy.badges,
      ...casimir.badges,
      ...tokamak.badges,
      ...galactic.badges,
      ...granularTidal.badges,
      ...curvature.badges,
      ...orchOr.badges,
      ...nucleosynthesisOrigins.badges,
      ...nuclearBindingFirstPrinciples.badges,
      ...periodicElements.badges,
      ...phasesOfMatter.badges,
      ...collectiveModeSynchrony.badges,
      ...crossScaleConnectiveTissue.badges,
    ],
    edges: [
      ...FIRST_PRINCIPLES_THEORY_EDGES,
      ...relativityHistory.edges,
      ...edges,
      ...nhm2FullSolve.edges,
      ...STARSIM_THEORY_EDGES,
      ...COSMIC_DISTANCE_LADDER_EDGES,
      ...solar.edges,
      ...solarStellar.edges,
      ...astroPrebiotic.edges,
      ...evolutionaryBiophysics.edges,
      ...preboundaryBioenergetics.edges,
      ...viabilityRegulation.edges,
      ...lowTemperatureQuantumBounds.edges,
      ...stellarSpectroscopy.edges,
      ...casimir.edges,
      ...tokamak.edges,
      ...galactic.edges,
      ...granularTidal.edges,
      ...curvature.edges,
      ...orchOr.edges,
      ...nucleosynthesisOrigins.edges,
      ...nuclearBindingFirstPrinciples.edges,
      ...periodicElements.edges,
      ...phasesOfMatter.edges,
      ...collectiveModeSynchrony.edges,
      ...crossScaleConnectiveTissue.edges,
    ],
  });
}

export const buildNhm2TheoryBadgeGraphV1 = buildHelixTheoryBadgeGraphV1;
