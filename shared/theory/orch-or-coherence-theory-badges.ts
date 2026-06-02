import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const ORCH_OR_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const orchBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: ORCH_OR_BOUNDARY,
});

export const ORCH_OR_COHERENCE_THEORY_BADGES: TheoryBadgeV1[] = [
  orchBadge({
    id: "orch_or.microtubule.coherence_window",
    title: "Orch-OR Coherence Window",
    plainMeaning: "Compares an exploratory DP timescale with a measured or hypothesized microtubule coherence lifetime.",
    whyItMatters: "It is the first scalar check for whether an objective-reduction timescale and a biological coherence window even overlap.",
    subjects: ["orch_or", "microtubule", "coherence", "objective_collapse"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["curvature_collapse", "orch_or_coherence"],
    equationFamilies: ["objective_collapse", "coherence_window", "orch_or_comparison"],
    tags: ["calculator_loadable", "exploratory_bridge"],
    equations: [
      {
        id: "orch_or_coherence_margin",
        role: "calculator_demo",
        displayLatex: "\\Delta t_{coh}=\\tau_{coherence}-\\tau_{DP}",
        computableExpression: "coherence_margin_s = tau_coherence_s - tau_DP_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["tau_coherence_s", "tau_DP_s"],
        outputSymbols: ["coherence_margin_s"],
      },
    ],
    units: [
      { symbol: "tau_coherence_s", unit: "s", quantity: "coherence_lifetime", dimensionSignature: "T" },
      { symbol: "coherence_margin_s", unit: "s", quantity: "coherence_margin", dimensionSignature: "T" },
    ],
    assumptions: [
      "Exploratory overlap check only.",
      "Requires direct coherence-lifetime evidence before interpretation.",
    ],
    calculatorPayloads: [
      payload({
        id: "orch_or_coherence_margin_payload",
        expression: "coherence_margin_s = tau_coherence_s - tau_DP_s",
        displayLatex: "\\Delta t_{coh}=\\tau_{coherence}-\\tau_{DP}",
        targetVariable: "coherence_margin_s",
      }),
    ],
    sourceRefs: [
      literatureRef("Hameroff-Penrose-2014-Orch-OR-review", "Primary positive Orch-OR hypothesis review."),
      literatureRef("McKemmish-Reimers-2009-biological-feasibility-critique", "Biological feasibility critique."),
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "microtubule-observable-question"),
    ],
    hintKeys: {
      subjects: ["orch_or", "microtubule", "coherence", "objective_collapse"],
      symbols: ["tau_coherence_s", "tau_DP_s", "coherence_margin_s"],
      unitSignatures: ["T"],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["objective_collapse", "coherence_window", "orch_or_comparison"],
      simulationOwners: ["curvature_collapse", "orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.microtubule.mode_frequency",
    title: "Microtubule Mode Frequency",
    plainMeaning: "Reference node for measured or modeled microtubule vibrational and transport-mode spectra.",
    whyItMatters: "It separates microtubule observables from consciousness claims and makes frequency evidence explicit.",
    subjects: ["orch_or", "microtubule", "frequency", "observable"],
    level: "model",
    status: "review",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["microtubule_observable", "frequency_period"],
    tags: ["runtime_reference", "observable_context"],
    equations: [
      {
        id: "microtubule_mode_period",
        role: "calculator_demo",
        displayLatex: "T_{mt}=1/f_{mt}",
        computableExpression: "T_mt_s = 1/f_mt_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["f_mt_Hz"],
        outputSymbols: ["T_mt_s"],
      },
    ],
    units: [
      { symbol: "f_mt_Hz", unit: "Hz", quantity: "mode_frequency", dimensionSignature: "T^-1" },
      { symbol: "T_mt_s", unit: "s", quantity: "mode_period", dimensionSignature: "T" },
    ],
    assumptions: [
      "Mode frequency may be measured or modeled.",
      "A microtubule frequency is not itself evidence of consciousness or objective reduction.",
    ],
    calculatorPayloads: [
      payload({
        id: "microtubule_mode_period_payload",
        expression: "T_mt_s = 1/f_mt_Hz",
        displayLatex: "T_{mt}=1/f_{mt}",
        targetVariable: "T_mt_s",
      }),
    ],
    sourceRefs: [
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "microtubule-vibrational-mode-definition"),
      literatureRef("Kalra-2023-electronic-energy-migration-microtubules", "Microtubule transport observable source."),
    ],
    hintKeys: {
      subjects: ["orch_or", "microtubule", "frequency", "observable"],
      symbols: ["f_mt_Hz", "T_mt_s"],
      unitSignatures: ["T^-1", "T"],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["microtubule_observable", "frequency_period"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.gamma_synchrony.neural_band",
    title: "Gamma Synchrony Band",
    plainMeaning: "Represents neural gamma synchrony as a classical neural oscillation context, commonly around 30-100 Hz.",
    whyItMatters: "It lets the graph compare a DP timescale to neural timing without claiming gamma proves quantum collapse.",
    subjects: ["orch_or", "gamma_synchrony", "neuroscience", "frequency"],
    level: "model",
    status: "review",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["neural_oscillation", "frequency_period"],
    tags: ["calculator_loadable", "neural_context"],
    equations: [
      {
        id: "gamma_period",
        role: "calculator_demo",
        displayLatex: "T_\\gamma=1/f_\\gamma",
        computableExpression: "T_gamma_s = 1/f_gamma_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["f_gamma_Hz"],
        outputSymbols: ["T_gamma_s"],
      },
    ],
    units: [
      { symbol: "f_gamma_Hz", unit: "Hz", quantity: "neural_oscillation_frequency", dimensionSignature: "T^-1" },
      { symbol: "T_gamma_s", unit: "s", quantity: "neural_oscillation_period", dimensionSignature: "T" },
    ],
    assumptions: [
      "Gamma synchrony is neural timing context.",
      "Gamma synchrony does not establish objective collapse or microtubule quantum coherence.",
    ],
    calculatorPayloads: [
      payload({
        id: "gamma_period_payload",
        expression: "T_gamma_s = 1/f_gamma_Hz",
        displayLatex: "T_\\gamma=1/f_\\gamma",
        targetVariable: "T_gamma_s",
      }),
    ],
    sourceRefs: [
      literatureRef("Singer-Gray-1989-gamma-synchrony", "Classic gamma synchrony source."),
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "bridge-question"),
    ],
    hintKeys: {
      subjects: ["orch_or", "gamma_synchrony", "neuroscience", "frequency"],
      symbols: ["f_gamma_Hz", "T_gamma_s"],
      unitSignatures: ["T^-1", "T"],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["neural_oscillation", "frequency_period"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.frequency_hierarchy.cross_scale_locking",
    title: "Cross-Scale Frequency Locking",
    plainMeaning: "Compares candidate fast and slow frequencies through a dimensionless locking ratio.",
    whyItMatters: "It lets the graph discuss nested or hierarchical frequencies without calling them time crystals by default.",
    subjects: ["orch_or", "frequency_hierarchy", "phase_locking", "scale"],
    level: "derived_relation",
    status: "review",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["frequency_ratio", "cross_scale_locking"],
    tags: ["calculator_loadable", "exploratory_bridge"],
    equations: [
      {
        id: "phase_lock_ratio",
        role: "calculator_demo",
        displayLatex: "R_{lock}=f_{fast}/f_{slow}",
        computableExpression: "phase_lock_ratio = f_fast_Hz/f_slow_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["f_fast_Hz", "f_slow_Hz"],
        outputSymbols: ["phase_lock_ratio"],
      },
      {
        id: "gamma_cycles_per_dp_tau",
        role: "calculator_demo",
        displayLatex: "N_\\gamma=\\tau_{DP}f_\\gamma",
        computableExpression: "N_gamma_cycles = tau_DP_s*f_gamma_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["tau_DP_s", "f_gamma_Hz"],
        outputSymbols: ["N_gamma_cycles"],
      },
    ],
    units: [
      { symbol: "phase_lock_ratio", unit: null, quantity: "frequency_ratio", dimensionSignature: "1" },
      { symbol: "N_gamma_cycles", unit: null, quantity: "cycle_count", dimensionSignature: "1" },
    ],
    assumptions: [
      "Frequency ratios are comparison diagnostics.",
      "A hierarchy of frequencies is not sufficient for a time-crystal claim.",
    ],
    calculatorPayloads: [
      payload({
        id: "phase_lock_ratio_payload",
        expression: "phase_lock_ratio = f_fast_Hz/f_slow_Hz",
        displayLatex: "R_{lock}=f_{fast}/f_{slow}",
        targetVariable: "phase_lock_ratio",
      }),
      payload({
        id: "gamma_cycles_per_dp_tau_payload",
        expression: "N_gamma_cycles = tau_DP_s*f_gamma_Hz",
        displayLatex: "N_\\gamma=\\tau_{DP}f_\\gamma",
        targetVariable: "N_gamma_cycles",
      }),
    ],
    sourceRefs: [docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "bridge-question")],
    hintKeys: {
      subjects: ["orch_or", "frequency_hierarchy", "phase_locking", "scale"],
      symbols: ["phase_lock_ratio", "f_fast_Hz", "f_slow_Hz", "N_gamma_cycles", "tau_DP_s", "f_gamma_Hz"],
      unitSignatures: ["1", "T^-1", "T"],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["frequency_ratio", "cross_scale_locking"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.time_crystal.subharmonic_locking_test",
    title: "Time-Crystal Subharmonic Test",
    plainMeaning: "Checks whether a response frequency is subharmonically locked to a drive frequency.",
    whyItMatters: "It encodes one strict time-crystal criterion rather than treating repeated rhythms as enough.",
    subjects: ["orch_or", "time_crystal", "subharmonic_locking", "frequency"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["time_crystal_criteria", "subharmonic_locking"],
    tags: ["calculator_loadable", "time_crystal_gate"],
    equations: [
      {
        id: "subharmonic_ratio",
        role: "calculator_demo",
        displayLatex: "R_{sub}=f_{response}/f_{drive}",
        computableExpression: "subharmonic_ratio = f_response_Hz/f_drive_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["f_response_Hz", "f_drive_Hz"],
        outputSymbols: ["subharmonic_ratio"],
      },
    ],
    units: [{ symbol: "subharmonic_ratio", unit: null, quantity: "frequency_ratio", dimensionSignature: "1" }],
    assumptions: [
      "Subharmonic locking is necessary but not sufficient for time-crystal status.",
      "Robustness and non-equilibrium context are required separately.",
    ],
    calculatorPayloads: [
      payload({
        id: "subharmonic_ratio_payload",
        expression: "subharmonic_ratio = f_response_Hz/f_drive_Hz",
        displayLatex: "R_{sub}=f_{response}/f_{drive}",
        targetVariable: "subharmonic_ratio",
      }),
    ],
    sourceRefs: [
      literatureRef("Else-Bauer-Nayak-2016-Floquet-time-crystals", "Floquet time crystal criteria."),
      literatureRef("Zhang-et-al-2017-observation-discrete-time-crystal", "Experimental discrete time crystal source."),
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "time-crystal-criteria-question"),
    ],
    hintKeys: {
      subjects: ["orch_or", "time_crystal", "subharmonic_locking", "frequency"],
      symbols: ["subharmonic_ratio", "f_response_Hz", "f_drive_Hz"],
      unitSignatures: ["1", "T^-1"],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["time_crystal_criteria", "subharmonic_locking"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.time_crystal.robustness_window",
    title: "Time-Crystal Robustness Window",
    plainMeaning: "Reference gate for robustness, persistence, and driven-dissipative context required by time-crystal claims.",
    whyItMatters: "It prevents the graph from promoting frequency hierarchy or synchrony into a time-crystal identity.",
    subjects: ["orch_or", "time_crystal", "robustness", "claim_boundary"],
    level: "diagnostic_gate",
    status: "blocked",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["time_crystal_criteria", "claim_boundary"],
    tags: ["claim_boundary", "time_crystal_gate"],
    equations: [
      {
        id: "time_crystal_criteria_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{subharmonic\\ locking}+\\mathrm{robustness}+\\mathrm{drive\\ context}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["subharmonic_ratio", "robustness_window", "drive_context"],
        outputSymbols: ["time_crystal_signature_status"],
      },
    ],
    units: [],
    assumptions: [
      "Time-crystal status requires standard criteria and independent evidence.",
      "Biological frequency hierarchy is not enough by itself.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Sacha-Zakrzewski-2018-time-crystals-review", "Time-crystal review."),
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "time-crystal-no-go-boundary-definition"),
    ],
    hintKeys: {
      subjects: ["orch_or", "time_crystal", "robustness", "claim_boundary"],
      symbols: ["time_crystal_signature_status", "subharmonic_ratio", "robustness_window"],
      unitSignatures: [],
      repoPaths: ["docs/architecture/orch-or-time-crystal-research-packet.md"],
      equationFamilies: ["time_crystal_criteria", "claim_boundary"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
  orchBadge({
    id: "orch_or.claim_boundary.exploratory_only",
    title: "Orch-OR Exploratory Boundary",
    plainMeaning: "Keeps Orch-OR, gamma synchrony, microtubule coherence, and time-crystal rows in exploratory comparison scope.",
    whyItMatters: "It blocks calculator rows and locator overlays from implying a confirmed consciousness or collapse mechanism.",
    subjects: ["orch_or", "claim_boundary", "consciousness", "objective_collapse"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["orch_or_coherence"],
    equationFamilies: ["orch_or_claim_boundary"],
    tags: ["claim_boundary", "exploratory_only"],
    equations: [
      {
        id: "orch_or_boundary_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{exploratory\\ comparison\\ only}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [],
        outputSymbols: ["orch_or_claim_boundary"],
      },
    ],
    units: [],
    assumptions: [
      "Orch-OR rows are hypothesis-comparison helpers.",
      "Gamma synchrony is neural timing context, not objective-collapse evidence.",
      "Microtubule time-crystal status requires standard criteria and direct evidence.",
      "No consciousness mechanism claim may be promoted from scalar rows.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      docRef("docs/architecture/orch-or-time-crystal-research-packet.md", "non-goals"),
      docRef("docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json", "microtubule_time_crystal_status_not_established"),
    ],
    hintKeys: {
      subjects: ["orch_or", "claim_boundary", "consciousness", "objective_collapse"],
      symbols: ["orch_or_claim_boundary"],
      unitSignatures: [],
      repoPaths: [
        "docs/architecture/orch-or-time-crystal-research-packet.md",
        "docs/knowledge/bridges/astrochemistry-prebiotic-neuro-consciousness-bridge-tree.json",
      ],
      equationFamilies: ["orch_or_claim_boundary"],
      simulationOwners: ["orch_or_coherence"],
    },
  }),
];

export const ORCH_OR_COHERENCE_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "dp_timescale_to_orch_coherence",
    from: "collapse.objective.dp_timescale",
    to: "orch_or.microtubule.coherence_window",
    relation: "documents",
    label: "DP timescale can be compared against a microtubule coherence window.",
    claimBoundaryNote: "Overlap is exploratory and requires direct coherence evidence.",
  },
  {
    id: "microtubule_mode_to_coherence_window",
    from: "orch_or.microtubule.mode_frequency",
    to: "orch_or.microtubule.coherence_window",
    relation: "documents",
    label: "Microtubule mode observables document the coherence comparison context.",
    claimBoundaryNote: "Mode evidence is not a consciousness mechanism claim.",
  },
  {
    id: "gamma_synchrony_to_frequency_hierarchy",
    from: "orch_or.gamma_synchrony.neural_band",
    to: "orch_or.frequency_hierarchy.cross_scale_locking",
    relation: "documents",
    label: "Gamma timing can participate in cross-scale frequency comparisons.",
    claimBoundaryNote: "Gamma synchrony does not establish objective collapse.",
  },
  {
    id: "dp_timescale_to_frequency_hierarchy",
    from: "collapse.objective.dp_timescale",
    to: "orch_or.frequency_hierarchy.cross_scale_locking",
    relation: "documents",
    label: "DP tau can be compared against gamma cycles or other timing bands.",
    claimBoundaryNote: "Cycle count is a comparison diagnostic only.",
  },
  {
    id: "frequency_hierarchy_to_subharmonic_test",
    from: "orch_or.frequency_hierarchy.cross_scale_locking",
    to: "orch_or.time_crystal.subharmonic_locking_test",
    relation: "requires",
    label: "Frequency hierarchy must pass subharmonic tests before time-crystal language.",
    claimBoundaryNote: "Frequency hierarchy is not enough for time-crystal status.",
  },
  {
    id: "subharmonic_test_to_robustness_window",
    from: "orch_or.time_crystal.subharmonic_locking_test",
    to: "orch_or.time_crystal.robustness_window",
    relation: "requires",
    label: "Subharmonic response must be robust under perturbation and drive context.",
    claimBoundaryNote: "Robustness evidence is required.",
  },
  {
    id: "robustness_window_blocks_orch_claims",
    from: "orch_or.time_crystal.robustness_window",
    to: "orch_or.claim_boundary.exploratory_only",
    relation: "blocks",
    label: "Time-crystal gate remains exploratory until standard criteria are met.",
    claimBoundaryNote: "No biological time-crystal or consciousness claim is promoted.",
  },
  {
    id: "orch_coherence_boundary_blocks_claims",
    from: "orch_or.microtubule.coherence_window",
    to: "orch_or.claim_boundary.exploratory_only",
    relation: "blocks",
    label: "Coherence overlap diagnostics remain exploratory.",
    claimBoundaryNote: "No consciousness mechanism claim is allowed from this row.",
  },
];

export function buildOrchOrCoherenceTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: ORCH_OR_COHERENCE_THEORY_BADGES.map((badge) => ({ ...badge })),
    edges: ORCH_OR_COHERENCE_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
