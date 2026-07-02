import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const VIABILITY_REGULATION_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const literatureRef = (id: string, path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "literature_ref",
  id,
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

const viabilityBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: VIABILITY_REGULATION_BOUNDARY,
});

export const VIABILITY_REGULATION_THEORY_BADGES: TheoryBadgeV1[] = [
  viabilityBadge({
    id: "viability.regulation.viability_range_before_preference",
    title: "Viability Range Before Preference",
    plainMeaning:
      "Represents a bounded system's survivable state range before preference, obligation, or value language is introduced.",
    whyItMatters:
      "It lets reflection reason about persistence conditions while keeping moral interpretation outside this theory row.",
    subjects: ["biology", "viability", "homeostasis", "bounded_system", "range_constraint"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["viability_regulation", "preboundary_bioenergetics"],
    equationFamilies: ["viability_range", "state_setpoint_error"],
    tags: ["viability", "calculator_loadable", "not_preference"],
    equations: [
      {
        id: "viability_setpoint_error",
        role: "calculator_demo",
        displayLatex: "e_{viability}=x-x_{set}",
        computableExpression: "viability_error = state - setpoint",
        operatorKind: "scalar_expression",
        inputSymbols: ["state", "setpoint"],
        outputSymbols: ["viability_error"],
      },
    ],
    units: [
      { symbol: "state", unit: null, quantity: "regulated_state", dimensionSignature: "context" },
      { symbol: "setpoint", unit: null, quantity: "reference_state", dimensionSignature: "context" },
      { symbol: "viability_error", unit: null, quantity: "state_setpoint_error", dimensionSignature: "context" },
    ],
    assumptions: [
      "A viability range is a condition for persistence, not a preference or obligation.",
      "The scalar error is a calculator proxy for placement and comparison.",
    ],
    calculatorPayloads: [
      payload({
        id: "viability_error_payload",
        expression: "viability_error = state - setpoint",
        displayLatex: "e_{viability}=x-x_{set}",
        targetVariable: "viability_error",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pmcid:PMC4166604",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604/",
        "Review clarifying homeostasis and allostasis in physiological regulation.",
      ),
      literatureRef(
        "royalsociety:rsfs.20220041",
        "https://royalsocietypublishing.org/rsfs/article/13/3/20220041/89425/Free-energy-and-inference-in-living-systemsFree",
        "Free-energy and inference framing for living systems and homeostatic regulation.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "viability", "homeostasis", "bounded_system", "range_constraint"],
      symbols: ["state", "setpoint", "viability_error"],
      unitSignatures: ["context"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["viability_range", "state_setpoint_error"],
      simulationOwners: ["viability_regulation", "preboundary_bioenergetics"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.homeostasis_constraint_maintenance",
    title: "Homeostasis as Constraint Maintenance",
    plainMeaning:
      "Represents homeostasis as feedback-based regulation of internal variables, not wanting or moral preference.",
    whyItMatters:
      "It gives the graph a clear theory row for keeping bounded variables near a reference condition.",
    subjects: ["biology", "homeostasis", "feedback_control", "constraint_maintenance"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["viability_regulation"],
    equationFamilies: ["feedback_error", "homeostatic_control"],
    tags: ["homeostasis", "calculator_loadable", "feedback"],
    equations: [
      {
        id: "homeostatic_feedback_error",
        role: "calculator_demo",
        displayLatex: "e_{homeo}=x_{set}-x_{measured}",
        computableExpression: "homeostatic_error = setpoint - measured_state",
        operatorKind: "scalar_expression",
        inputSymbols: ["setpoint", "measured_state"],
        outputSymbols: ["homeostatic_error"],
      },
    ],
    units: [
      { symbol: "setpoint", unit: null, quantity: "reference_state", dimensionSignature: "context" },
      { symbol: "measured_state", unit: null, quantity: "measured_state", dimensionSignature: "context" },
      { symbol: "homeostatic_error", unit: null, quantity: "feedback_error", dimensionSignature: "context" },
    ],
    assumptions: [
      "Feedback error is a regulation diagnostic, not evidence of subjective preference.",
      "This badge does not define a moral claim or obligation.",
    ],
    calculatorPayloads: [
      payload({
        id: "homeostatic_error_payload",
        expression: "homeostatic_error = setpoint - measured_state",
        displayLatex: "e_{homeo}=x_{set}-x_{measured}",
        targetVariable: "homeostatic_error",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pii:S2405471221001599",
        "https://www.sciencedirect.com/science/article/pii/S2405471221001599",
        "Review of biological feedback control and homeostatic loop structure.",
      ),
      literatureRef(
        "pmcid:PMC8889180",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC8889180/",
        "Feedback control principle shared across biological and engineered systems.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "homeostasis", "feedback_control", "constraint_maintenance"],
      symbols: ["setpoint", "measured_state", "homeostatic_error"],
      unitSignatures: ["context"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["feedback_error", "homeostatic_control"],
      simulationOwners: ["viability_regulation"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.sensing_state_discrimination",
    title: "Sensing as State Discrimination",
    plainMeaning:
      "Represents sensing as noisy discrimination between states, bounded by signal, noise, receptors, and information limits.",
    whyItMatters:
      "It lets the agent reason about detection without turning detection into experience or consciousness.",
    subjects: ["biology", "sensing", "signal_detection", "noise", "information"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["viability_regulation"],
    equationFamilies: ["signal_to_noise", "state_discrimination"],
    tags: ["sensing", "calculator_loadable", "not_consciousness"],
    equations: [
      {
        id: "sensing_signal_to_noise_ratio",
        role: "calculator_demo",
        displayLatex: "\\mathrm{SNR}=S/N",
        computableExpression: "SNR = signal/noise",
        operatorKind: "scalar_expression",
        inputSymbols: ["signal", "noise"],
        outputSymbols: ["SNR"],
      },
    ],
    units: [
      { symbol: "signal", unit: null, quantity: "signal_magnitude", dimensionSignature: "context" },
      { symbol: "noise", unit: null, quantity: "noise_magnitude", dimensionSignature: "context" },
      { symbol: "SNR", unit: null, quantity: "signal_to_noise_ratio", dimensionSignature: "1" },
    ],
    assumptions: [
      "Signal discrimination is not subjective experience.",
      "Sensing accuracy is bounded by noise and measurement context.",
    ],
    calculatorPayloads: [
      payload({
        id: "sensing_snr_payload",
        expression: "SNR = signal/noise",
        displayLatex: "\\mathrm{SNR}=S/N",
        targetVariable: "SNR",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pmcid:PMC3945014",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC3945014/",
        "Berg-Purcell sensing limit revisited for receptor-noise accuracy.",
      ),
      literatureRef(
        "doi:10.1073/pnas.0504321102",
        "https://www.pnas.org/doi/10.1073/pnas.0504321102",
        "Physical limits to biochemical signaling.",
      ),
      literatureRef(
        "pmcid:PMC9507437",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC9507437/",
        "Review of information-theoretic approaches to intracellular signaling.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "sensing", "signal_detection", "noise", "information"],
      symbols: ["signal", "noise", "SNR"],
      unitSignatures: ["context", "1"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["signal_to_noise", "state_discrimination"],
      simulationOwners: ["viability_regulation"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.membrane_potential_maintenance_signal",
    title: "Membrane Potential as Maintenance Signal",
    plainMeaning:
      "Represents membrane voltage as a cellular bioelectric state that can coordinate behavior before nervous-system or consciousness claims.",
    whyItMatters:
      "It keeps bioelectricity available for cellular regulation reasoning without promoting it into mind or agency.",
    subjects: ["biology", "bioelectricity", "membrane_potential", "cell_signaling", "maintenance"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["viability_regulation", "orch_or_coherence"],
    equationFamilies: ["membrane_potential", "bioelectric_state"],
    tags: ["bioelectricity", "calculator_loadable", "not_mind"],
    equations: [
      {
        id: "membrane_potential_difference",
        role: "calculator_demo",
        displayLatex: "\\Delta V=V_{inside}-V_{outside}",
        computableExpression: "Delta_V = V_inside - V_outside",
        operatorKind: "scalar_expression",
        inputSymbols: ["V_inside", "V_outside"],
        outputSymbols: ["Delta_V"],
      },
    ],
    units: [
      { symbol: "V_inside", unit: "V", quantity: "inside_potential", dimensionSignature: "V" },
      { symbol: "V_outside", unit: "V", quantity: "outside_potential", dimensionSignature: "V" },
      { symbol: "Delta_V", unit: "V", quantity: "membrane_potential_difference", dimensionSignature: "V" },
    ],
    assumptions: [
      "Bioelectric state can coordinate cells without implying a nervous system.",
      "Membrane potential is not a consciousness or mind validation row.",
    ],
    calculatorPayloads: [
      payload({
        id: "membrane_potential_payload",
        expression: "Delta_V = V_inside - V_outside",
        displayLatex: "\\Delta V=V_{inside}-V_{outside}",
        targetVariable: "Delta_V",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pmid:22237730",
        "https://pubmed.ncbi.nlm.nih.gov/22237730/",
        "Molecular bioelectricity review covering transmembrane potential and cell behavior.",
      ),
      literatureRef(
        "pii:S0092867421002233",
        "https://www.sciencedirect.com/science/article/pii/S0092867421002233",
        "Bioelectric signaling review in developmental and regenerative contexts.",
      ),
      literatureRef(
        "doi:10.1091/mbc.E23-08-0312",
        "https://www.molbiolcell.org/doi/10.1091/mbc.E23-08-0312",
        "Bioelectricity overview as a broad cellular signaling cue.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "bioelectricity", "membrane_potential", "cell_signaling", "maintenance"],
      symbols: ["V_inside", "V_outside", "Delta_V"],
      unitSignatures: ["V"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["membrane_potential", "bioelectric_state"],
      simulationOwners: ["viability_regulation", "orch_or_coherence"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.repair_cost_before_growth",
    title: "Repair Cost Before Growth",
    plainMeaning:
      "Represents maintenance and repair energy costs that must be paid before growth is interpreted as expansion or success.",
    whyItMatters:
      "It keeps growth reasoning tied to energetic surplus instead of treating growth as automatically beneficial or successful.",
    subjects: ["biology", "microbial_maintenance", "repair_cost", "energy_budget", "growth"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["viability_regulation"],
    equationFamilies: ["maintenance_energy", "growth_energy_surplus"],
    tags: ["maintenance", "calculator_loadable", "repair_before_growth"],
    equations: [
      {
        id: "maintenance_energy_surplus",
        role: "calculator_demo",
        displayLatex: "E_{surplus}=E_{available}-E_{maintenance}",
        computableExpression: "energy_surplus = energy_available - maintenance_cost",
        operatorKind: "scalar_expression",
        inputSymbols: ["energy_available", "maintenance_cost"],
        outputSymbols: ["energy_surplus"],
      },
    ],
    units: [
      { symbol: "energy_available", unit: null, quantity: "available_energy", dimensionSignature: "context" },
      { symbol: "maintenance_cost", unit: null, quantity: "maintenance_energy_cost", dimensionSignature: "context" },
      { symbol: "energy_surplus", unit: null, quantity: "post_maintenance_energy_surplus", dimensionSignature: "context" },
    ],
    assumptions: [
      "Maintenance cost includes repair and survival costs before growth.",
      "Energy surplus is a diagnostic and does not prove growth success.",
    ],
    calculatorPayloads: [
      payload({
        id: "maintenance_energy_surplus_payload",
        expression: "energy_surplus = energy_available - maintenance_cost",
        displayLatex: "E_{surplus}=E_{available}-E_{maintenance}",
        targetVariable: "energy_surplus",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pmcid:PMC1915598",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC1915598/",
        "Critical review of microbial maintenance quantification.",
      ),
      literatureRef(
        "doi:10.3389/fmicb.2017.00031",
        "https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2017.00031/full",
        "Review of bacterial maintenance and minimal energy requirements.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "microbial_maintenance", "repair_cost", "energy_budget", "growth"],
      symbols: ["energy_available", "maintenance_cost", "energy_surplus"],
      unitSignatures: ["context"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["maintenance_energy", "growth_energy_surplus"],
      simulationOwners: ["viability_regulation"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.perturbation_margin_before_response",
    title: "Perturbation Margin Before Response",
    plainMeaning:
      "Represents response as deviation, tolerance, feedback, and return-to-range before agency language is introduced.",
    whyItMatters:
      "It makes disturbance handling visible as a control problem rather than an action or intention claim.",
    subjects: ["biology", "perturbation", "feedback_control", "tolerance", "response"],
    level: "diagnostic_gate",
    status: "diagnostic",
    simulationOwners: ["viability_regulation"],
    equationFamilies: ["perturbation_margin", "control_response"],
    tags: ["perturbation", "calculator_loadable", "not_agency"],
    equations: [
      {
        id: "perturbation_tolerance_margin",
        role: "calculator_demo",
        displayLatex: "m_{perturb}=T_{tol}-d",
        computableExpression: "perturbation_margin = tolerance - deviation",
        operatorKind: "scalar_expression",
        inputSymbols: ["tolerance", "deviation"],
        outputSymbols: ["perturbation_margin"],
      },
    ],
    units: [
      { symbol: "tolerance", unit: null, quantity: "tolerance_budget", dimensionSignature: "context" },
      { symbol: "deviation", unit: null, quantity: "disturbance_deviation", dimensionSignature: "context" },
      { symbol: "perturbation_margin", unit: null, quantity: "remaining_tolerance_margin", dimensionSignature: "context" },
    ],
    assumptions: [
      "Deviation response is control context, not agency.",
      "A positive margin only means the simplified tolerance proxy remains above zero.",
    ],
    calculatorPayloads: [
      payload({
        id: "perturbation_margin_payload",
        expression: "perturbation_margin = tolerance - deviation",
        displayLatex: "m_{perturb}=T_{tol}-d",
        targetVariable: "perturbation_margin",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "pmcid:PMC8889180",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC8889180/",
        "Feedback control principle used to frame response to changing conditions.",
      ),
      literatureRef(
        "pii:S2405471221001599",
        "https://www.sciencedirect.com/science/article/pii/S2405471221001599",
        "Biological feedback loops support growth, repair, response, and homeostasis.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "perturbation", "feedback_control", "tolerance", "response"],
      symbols: ["tolerance", "deviation", "perturbation_margin"],
      unitSignatures: ["context"],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["perturbation_margin", "control_response"],
      simulationOwners: ["viability_regulation"],
    },
  }),
  viabilityBadge({
    id: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    title: "Regulation Is Not Preference Or Agency",
    plainMeaning:
      "Keeps viability, homeostasis, sensing, bioelectricity, repair, and perturbation response from being promoted into preference, agency, mind, or moral claims.",
    whyItMatters:
      "It gives reflection a visible boundary row so compound reasoning can use regulation evidence without overclaiming what it means.",
    subjects: ["biology", "viability", "claim_boundary", "preference", "agency", "consciousness"],
    level: "claim_boundary",
    status: "diagnostic",
    simulationOwners: ["viability_regulation"],
    equationFamilies: ["regulation_claim_boundary"],
    tags: ["claim_boundary", "not_preference", "not_agency", "not_consciousness"],
    equations: [
      {
        id: "regulation_claim_boundary_context",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{regulation}_{evidence}\\nRightarrow\\{preference,agency,consciousness,moral\\ claim\\}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["regulation_evidence"],
        outputSymbols: ["claim_boundary_context"],
      },
    ],
    units: [],
    assumptions: [
      "Regulatory structure can support later reflection without itself proving preference, agency, consciousness, or morality.",
      "This boundary is diagnostic-only and cannot promote a theory row into NHM2 validation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "pmcid:PMC4166604",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604/",
        "Homeostasis and allostasis are physiological regulation concepts, not moral claims.",
      ),
      literatureRef(
        "pmcid:PMC9507437",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC9507437/",
        "Information-theoretic signaling context is separate from consciousness interpretation.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "viability", "claim_boundary", "preference", "agency", "consciousness"],
      symbols: ["regulation_evidence", "claim_boundary_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/viability-regulation-theory-badges.ts"],
      equationFamilies: ["regulation_claim_boundary"],
      simulationOwners: ["viability_regulation"],
    },
  }),
];

export const VIABILITY_REGULATION_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "local_concentration_documents_viability_range",
    from: "bio.origin.local_concentration_before_replication",
    to: "viability.regulation.viability_range_before_preference",
    relation: "documents",
    label: "Local concentration context can feed bounded viability-range reasoning.",
    claimBoundaryNote: "Viability range is not preference or moral status.",
  },
  {
    id: "viability_range_requires_homeostasis_constraint",
    from: "viability.regulation.viability_range_before_preference",
    to: "viability.regulation.homeostasis_constraint_maintenance",
    relation: "requires",
    label: "Maintaining a viable range requires a homeostatic constraint interpretation.",
    claimBoundaryNote: "Homeostasis is regulation, not wanting.",
  },
  {
    id: "homeostasis_requires_sensing_discrimination",
    from: "viability.regulation.homeostasis_constraint_maintenance",
    to: "viability.regulation.sensing_state_discrimination",
    relation: "requires",
    label: "Feedback regulation requires some discrimination of state or deviation.",
    claimBoundaryNote: "Sensing does not imply consciousness.",
  },
  {
    id: "sensing_documents_membrane_potential_signal",
    from: "viability.regulation.sensing_state_discrimination",
    to: "viability.regulation.membrane_potential_maintenance_signal",
    relation: "documents",
    label: "State discrimination can be discussed alongside cellular bioelectric state.",
    claimBoundaryNote: "Bioelectric state does not prove a nervous system or mind.",
  },
  {
    id: "membrane_potential_documents_repair_cost",
    from: "viability.regulation.membrane_potential_maintenance_signal",
    to: "viability.regulation.repair_cost_before_growth",
    relation: "documents",
    label: "Cell-state maintenance context connects to maintenance and repair energy costs.",
    claimBoundaryNote: "Repair budget is not growth success.",
  },
  {
    id: "repair_cost_bounds_perturbation_response",
    from: "viability.regulation.repair_cost_before_growth",
    to: "viability.regulation.perturbation_margin_before_response",
    relation: "bounds",
    label: "Maintenance energy bounds whether perturbation response remains viable.",
    claimBoundaryNote: "Perturbation response remains a control diagnostic, not agency.",
  },
  {
    id: "homeostasis_blocks_preference_shortcut",
    from: "viability.regulation.homeostasis_constraint_maintenance",
    to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    relation: "blocks",
    label: "Homeostatic regulation cannot be promoted into preference by itself.",
    claimBoundaryNote: "A feedback loop is not a preference claim.",
  },
  {
    id: "sensing_blocks_consciousness_shortcut",
    from: "viability.regulation.sensing_state_discrimination",
    to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    relation: "blocks",
    label: "State discrimination cannot be promoted into consciousness by itself.",
    claimBoundaryNote: "Detection is not experience.",
  },
  {
    id: "membrane_potential_blocks_mind_shortcut",
    from: "viability.regulation.membrane_potential_maintenance_signal",
    to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    relation: "blocks",
    label: "Bioelectric maintenance context cannot be promoted into a mind claim by itself.",
    claimBoundaryNote: "Cellular voltage is not nervous-system proof.",
  },
  {
    id: "repair_cost_blocks_growth_success_shortcut",
    from: "viability.regulation.repair_cost_before_growth",
    to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    relation: "blocks",
    label: "Repair cost context cannot be promoted into growth success by itself.",
    claimBoundaryNote: "Energy accounting is not success or value.",
  },
  {
    id: "perturbation_response_blocks_agency_shortcut",
    from: "viability.regulation.perturbation_margin_before_response",
    to: "viability.regulation.claim_boundary.not_preference_agency_consciousness",
    relation: "blocks",
    label: "Perturbation response cannot be promoted into agency by itself.",
    claimBoundaryNote: "Response is not intention.",
  },
];

export function buildViabilityRegulationTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: VIABILITY_REGULATION_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: VIABILITY_REGULATION_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
