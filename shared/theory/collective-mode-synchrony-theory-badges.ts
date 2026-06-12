import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const COLLECTIVE_MODE_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const collectiveBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: COLLECTIVE_MODE_BOUNDARY,
});

export const COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES: TheoryBadgeV1[] = [
  collectiveBadge({
    id: "matter.collective.polariton_reservoir_lifetime_context",
    title: "Polaritonic Reservoir Lifetime Context",
    plainMeaning:
      "Represents a reported long-lived collective soliton-polariton reservoir lifetime as an open-system timescale.",
    whyItMatters:
      "It gives the graph a calculator-loadable temporal window while preventing reservoir lifetime from being treated as a measured coherence time.",
    subjects: ["matter", "collective_mode", "polariton", "reservoir_lifetime", "open_system"],
    level: "model",
    status: "review",
    simulationOwners: ["general_physics", "evolutionary_biophysics"],
    equationFamilies: ["reservoir_lifetime", "linewidth_proxy", "open_system_timescale"],
    tags: ["polariton", "reservoir", "lifetime", "linewidth_proxy", "claim_boundary"],
    equations: [
      {
        id: "reservoir_inverse_lifetime",
        role: "calculator_demo",
        displayLatex: "\\Gamma_{\\mathrm{life}}=1/\\tau",
        computableExpression: "Gamma_life_s_inv = 1 / tau_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["tau_s"],
        outputSymbols: ["Gamma_life_s_inv"],
      },
      {
        id: "reservoir_fourier_limited_linewidth_proxy",
        role: "calculator_demo",
        displayLatex: "\\Delta f_{\\mathrm{proxy}}=1/(2\\pi\\tau)",
        computableExpression: "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
        operatorKind: "scalar_expression",
        inputSymbols: ["tau_s"],
        outputSymbols: ["linewidth_proxy_Hz"],
      },
    ],
    units: [
      { symbol: "tau_s", unit: "s", quantity: "reservoir_lifetime", dimensionSignature: "T" },
      { symbol: "Gamma_life_s_inv", unit: "1/s", quantity: "inverse_lifetime", dimensionSignature: "T^-1" },
      { symbol: "linewidth_proxy_Hz", unit: "Hz", quantity: "fourier_limited_linewidth_proxy", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "The lifetime is interpreted as a reservoir or condensate survival timescale unless phase-coherence evidence is separately admitted.",
      "A Fourier-limited linewidth proxy is a scale estimate, not a measured decoherence linewidth.",
      "The reported room-temperature soliton-polariton condensate does not by itself establish time-crystalline order.",
    ],
    calculatorPayloads: [
      {
        id: "polariton_reservoir_inverse_lifetime_payload",
        expression: "Gamma_life_s_inv = 1 / tau_s",
        displayLatex: "\\Gamma_{\\mathrm{life}}=1/\\tau",
        preferredAction: "solve_with_steps",
        targetVariable: "Gamma_life_s_inv",
        setupContext: null,
      },
      {
        id: "polariton_reservoir_linewidth_proxy_payload",
        expression: "linewidth_proxy_Hz = 1 / (2 * pi * tau_s)",
        displayLatex: "\\Delta f_{\\mathrm{proxy}}=1/(2\\pi\\tau)",
        preferredAction: "solve_with_steps",
        targetVariable: "linewidth_proxy_Hz",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("PubMed:41707245", "Room-temperature soliton-polariton condensation in a hierarchical helical-nanowire fractal gel."),
    ],
    hintKeys: {
      subjects: ["matter", "collective_mode", "polariton", "reservoir_lifetime", "open_system"],
      symbols: ["tau_s", "Gamma_life_s_inv", "linewidth_proxy_Hz", "reservoir_context"],
      unitSignatures: ["T", "T^-1"],
      repoPaths: [],
      equationFamilies: ["reservoir_lifetime", "linewidth_proxy", "open_system_timescale"],
      simulationOwners: ["general_physics", "evolutionary_biophysics"],
    },
  }),
  collectiveBadge({
    id: "matter.collective.polariton_decoherence_boundary",
    title: "Polaritonic Decoherence Boundary",
    plainMeaning:
      "Represents the evidence boundary between a long-lived polariton reservoir and a measured quantum coherence time.",
    whyItMatters:
      "It keeps lifetime, linewidth, phase noise, first-order coherence, and echo-like measurements from being conflated.",
    subjects: ["matter", "collective_mode", "polariton", "decoherence", "claim_boundary"],
    level: "claim_boundary",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "evolutionary_biophysics"],
    equationFamilies: ["coherence_boundary", "linewidth_measurement", "phase_noise"],
    tags: ["polariton", "decoherence", "T2", "phase_noise", "claim_boundary"],
    equations: [
      {
        id: "polariton_coherence_evidence_boundary",
        role: "gate",
        displayLatex: "T_2\\ \\mathrm{requires}\\ g^{(1)}(\\tau),\\ \\mathrm{linewidth},\\ \\mathrm{echo},\\ \\mathrm{or\\ phase\\ noise}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["T2_s", "g1_tau", "linewidth_Hz", "echo_context", "phase_noise_context"],
        outputSymbols: ["coherence_evidence_boundary"],
      },
    ],
    units: [
      { symbol: "T2_s", unit: "s", quantity: "coherence_time", dimensionSignature: "T" },
      { symbol: "linewidth_Hz", unit: "Hz", quantity: "measured_linewidth", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "A reservoir lifetime is not automatically a single-particle lifetime, coherence time, or dephasing time.",
      "Coherence claims require direct coherence observables such as first-order coherence, linewidth, echo, ODMR, phase-noise, or Allan-deviation evidence.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("PubMed:41707245", "The reported integrated SPC lifetime is not a single-polariton lifetime."),
      literatureRef("doi:10.1038/s41567-025-03163-6", "Time-crystal sensing context where linewidth is tied to collective lifetime."),
    ],
    hintKeys: {
      subjects: ["matter", "collective_mode", "polariton", "decoherence", "claim_boundary"],
      symbols: ["T2_s", "g1_tau", "linewidth_Hz", "phase_noise_context", "coherence_evidence_boundary"],
      unitSignatures: ["T", "T^-1"],
      repoPaths: [],
      equationFamilies: ["coherence_boundary", "linewidth_measurement", "phase_noise"],
      simulationOwners: ["general_physics", "evolutionary_biophysics"],
    },
  }),
  collectiveBadge({
    id: "matter.time_crystal.collective_lifetime_limited_linewidth_context",
    title: "Collective Lifetime-Limited Linewidth Context",
    plainMeaning:
      "Represents the linewidth scale set by the lifetime of collective time-crystalline order rather than isolated microscopic excitations.",
    whyItMatters:
      "It lets calculator traces compare noisy and stabilized collective lifetimes without claiming a physical mechanism is established.",
    subjects: ["matter", "time_crystal", "collective_mode", "linewidth", "sensing"],
    level: "derived_relation",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["time_crystal_linewidth", "collective_lifetime", "sensing"],
    tags: ["time_crystal", "linewidth", "T2_prime", "collective_order", "sensing"],
    equations: [
      {
        id: "collective_lifetime_limited_linewidth",
        role: "calculator_demo",
        displayLatex: "\\Delta f_{\\mathrm{collective}}=1/(2\\pi T'_2)",
        computableExpression: "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
        operatorKind: "scalar_expression",
        inputSymbols: ["T2_prime_s"],
        outputSymbols: ["delta_f_collective_Hz"],
      },
    ],
    units: [
      { symbol: "T2_prime_s", unit: "s", quantity: "collective_lifetime", dimensionSignature: "T" },
      { symbol: "delta_f_collective_Hz", unit: "Hz", quantity: "collective_linewidth", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "The linewidth relation is a diagnostic scale for collective order lifetime and does not certify time-crystal formation by itself.",
      "The collective lifetime must come from admitted time-crystal sensing, phase-coherence, or ordered-response evidence.",
    ],
    calculatorPayloads: [
      {
        id: "collective_lifetime_limited_linewidth_payload",
        expression: "delta_f_collective_Hz = 1 / (2 * pi * T2_prime_s)",
        displayLatex: "\\Delta f_{\\mathrm{collective}}=1/(2\\pi T'_2)",
        preferredAction: "solve_with_steps",
        targetVariable: "delta_f_collective_Hz",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("doi:10.1038/s41567-025-03163-6", "Discrete time-crystal sensing with linewidth tied to time-crystal lifetime."),
      literatureRef("doi:10.1103/RevModPhys.95.031001", "Review of quantum and classical discrete time crystals."),
    ],
    hintKeys: {
      subjects: ["matter", "time_crystal", "collective_mode", "linewidth", "sensing"],
      symbols: ["T2_prime_s", "delta_f_collective_Hz", "collective_order_context"],
      unitSignatures: ["T", "T^-1"],
      repoPaths: [],
      equationFamilies: ["time_crystal_linewidth", "collective_lifetime", "sensing"],
      simulationOwners: ["general_physics"],
    },
  }),
  collectiveBadge({
    id: "matter.time_crystal.noisy_synchrony_margin_context",
    title: "Noisy Synchrony Margin Context",
    plainMeaning:
      "Represents the competition between locking, dephasing noise, and loss in a noisy collective-mode synchronization route.",
    whyItMatters:
      "It gives noisy environments a scalar diagnostic without promoting ordinary noisy oscillation into a time crystal.",
    subjects: ["matter", "time_crystal", "synchrony", "noise", "open_system"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["general_physics"],
    equationFamilies: ["synchrony_margin", "open_system_dynamics", "noise_dephasing"],
    tags: ["time_crystal", "synchrony", "noise", "locking", "loss", "claim_boundary"],
    equations: [
      {
        id: "noisy_synchrony_margin",
        role: "calculator_demo",
        displayLatex:
          "\\mu_{\\mathrm{sync}}=\\Gamma_{\\mathrm{lock}}-\\Gamma_{\\mathrm{noise}}-\\Gamma_{\\mathrm{loss}}",
        computableExpression:
          "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
        operatorKind: "scalar_expression",
        inputSymbols: ["locking_rate_s_inv", "noise_dephasing_rate_s_inv", "loss_rate_s_inv"],
        outputSymbols: ["stability_margin_s_inv"],
      },
    ],
    units: [
      { symbol: "locking_rate_s_inv", unit: "1/s", quantity: "locking_rate", dimensionSignature: "T^-1" },
      { symbol: "noise_dephasing_rate_s_inv", unit: "1/s", quantity: "noise_dephasing_rate", dimensionSignature: "T^-1" },
      { symbol: "loss_rate_s_inv", unit: "1/s", quantity: "loss_rate", dimensionSignature: "T^-1" },
      { symbol: "stability_margin_s_inv", unit: "1/s", quantity: "synchrony_stability_margin", dimensionSignature: "T^-1" },
    ],
    assumptions: [
      "Positive margin is only a model diagnostic and still requires observable subharmonic response, rigidity, and phase-boundary evidence.",
      "Noise can destabilize or synchronize depending on the route, coupling, bath, and observation window.",
    ],
    calculatorPayloads: [
      {
        id: "noisy_synchrony_margin_payload",
        expression: "stability_margin_s_inv = locking_rate_s_inv - noise_dephasing_rate_s_inv - loss_rate_s_inv",
        displayLatex:
          "\\mu_{\\mathrm{sync}}=\\Gamma_{\\mathrm{lock}}-\\Gamma_{\\mathrm{noise}}-\\Gamma_{\\mathrm{loss}}",
        preferredAction: "solve_with_steps",
        targetVariable: "stability_margin_s_inv",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("doi:10.1103/PhysRevLett.126.020603", "Classical stochastic many-body DTC model with thermodynamic consistency."),
      literatureRef("doi:10.22331/q-2020-05-25-270", "Open-system time-crystallinity context."),
      literatureRef("doi:10.1038/s41567-025-03163-6", "DTC sensing lifetime and linewidth context."),
    ],
    hintKeys: {
      subjects: ["matter", "time_crystal", "synchrony", "noise", "open_system"],
      symbols: ["locking_rate_s_inv", "noise_dephasing_rate_s_inv", "loss_rate_s_inv", "stability_margin_s_inv"],
      unitSignatures: ["T^-1"],
      repoPaths: [],
      equationFamilies: ["synchrony_margin", "open_system_dynamics", "noise_dephasing"],
      simulationOwners: ["general_physics"],
    },
  }),
  collectiveBadge({
    id: "matter.time_crystal.stabilized_vs_noisy_trace_context",
    title: "Stabilized-Versus-Noisy Trace Context",
    plainMeaning:
      "Represents paired traces comparing a stabilized collective lifetime against a noisy or unstabilized lifetime.",
    whyItMatters:
      "It lets the badge graph compare linewidth narrowing and lifetime gain while preserving the evidence-only boundary.",
    subjects: ["matter", "time_crystal", "synchrony", "noise", "trace_comparison"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["general_physics"],
    equationFamilies: ["lifetime_gain", "linewidth_comparison", "trace_comparison"],
    tags: ["time_crystal", "stabilized", "noisy", "lifetime_gain", "trace"],
    equations: [
      {
        id: "stabilized_noisy_lifetime_gain",
        role: "calculator_demo",
        displayLatex: "G_T=T'_{2,\\mathrm{stabilized}}/T'_{2,\\mathrm{noisy}}",
        computableExpression: "lifetime_gain = T2_prime_stabilized_s / T2_prime_noisy_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["T2_prime_stabilized_s", "T2_prime_noisy_s"],
        outputSymbols: ["lifetime_gain"],
      },
    ],
    units: [
      { symbol: "T2_prime_stabilized_s", unit: "s", quantity: "stabilized_collective_lifetime", dimensionSignature: "T" },
      { symbol: "T2_prime_noisy_s", unit: "s", quantity: "noisy_collective_lifetime", dimensionSignature: "T" },
      { symbol: "lifetime_gain", unit: null, quantity: "lifetime_gain", dimensionSignature: "1" },
    ],
    assumptions: [
      "A lifetime-gain trace compares collective persistence and does not establish a microscopic mechanism by itself.",
      "Trace comparison must keep stabilized, noisy, and baseline conditions explicit.",
    ],
    calculatorPayloads: [
      {
        id: "stabilized_noisy_lifetime_gain_payload",
        expression: "lifetime_gain = T2_prime_stabilized_s / T2_prime_noisy_s",
        displayLatex: "G_T=T'_{2,\\mathrm{stabilized}}/T'_{2,\\mathrm{noisy}}",
        preferredAction: "solve_with_steps",
        targetVariable: "lifetime_gain",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("doi:10.1038/s41567-025-03163-6", "Stabilized and unstabilized DTC sensing lifetime comparison context."),
    ],
    hintKeys: {
      subjects: ["matter", "time_crystal", "synchrony", "noise", "trace_comparison"],
      symbols: ["T2_prime_stabilized_s", "T2_prime_noisy_s", "lifetime_gain", "trace_context"],
      unitSignatures: ["T", "1"],
      repoPaths: [],
      equationFamilies: ["lifetime_gain", "linewidth_comparison", "trace_comparison"],
      simulationOwners: ["general_physics"],
    },
  }),
  collectiveBadge({
    id: "matter.time_crystal.magnon_space_time_lattice_context",
    title: "Magnon Space-Time Lattice Context",
    plainMeaning:
      "Represents a driven magnonic space-time lattice that reshapes quasiparticle propagation through band folding and scattering.",
    whyItMatters:
      "It gives the graph a directly imaged spatiotemporal-lattice reference without treating it as the same mechanism as polariton condensates or strict DTC order.",
    subjects: ["matter", "time_crystal", "magnon", "space_time_crystal", "band_folding"],
    level: "model",
    status: "canonical_reference",
    simulationOwners: ["general_physics"],
    equationFamilies: ["space_time_lattice", "magnon_wavelength", "band_folding"],
    tags: ["magnon", "space_time_crystal", "STXM", "band_folding", "wavelength"],
    equations: [
      {
        id: "magnon_wavenumber_wavelength",
        role: "calculator_demo",
        displayLatex: "\\lambda_{\\mu m}=1/k_{\\mu m^{-1}}",
        computableExpression: "lambda_um = 1 / k_um_inv",
        operatorKind: "scalar_expression",
        inputSymbols: ["k_um_inv"],
        outputSymbols: ["lambda_um"],
      },
    ],
    units: [
      { symbol: "k_um_inv", unit: "1/um", quantity: "magnon_wavenumber", dimensionSignature: "L^-1" },
      { symbol: "lambda_um", unit: "um", quantity: "magnon_wavelength", dimensionSignature: "L" },
    ],
    assumptions: [
      "The driven magnonic space-time lattice is a visualization bridge for spatiotemporal ordering, band folding, and scattering.",
      "The PRL magnon system is not automatically a strict discrete time crystal with spontaneous subharmonic symmetry breaking.",
    ],
    calculatorPayloads: [
      {
        id: "magnon_space_time_lattice_wavelength_payload",
        expression: "lambda_um = 1 / k_um_inv",
        displayLatex: "\\lambda_{\\mu m}=1/k_{\\mu m^{-1}}",
        preferredAction: "solve_with_steps",
        targetVariable: "lambda_um",
        setupContext: null,
      },
    ],
    sourceRefs: [
      literatureRef("doi:10.1103/PhysRevLett.126.057201", "Real-space observation of magnon interaction with driven space-time crystals."),
      literatureRef("arXiv:1911.13192", "Preprint context for the driven magnonic space-time crystal experiment."),
    ],
    hintKeys: {
      subjects: ["matter", "time_crystal", "magnon", "space_time_crystal", "band_folding"],
      symbols: ["k_um_inv", "lambda_um", "band_folding_context", "STXM_context"],
      unitSignatures: ["L^-1", "L"],
      repoPaths: [],
      equationFamilies: ["space_time_lattice", "magnon_wavelength", "band_folding"],
      simulationOwners: ["general_physics"],
    },
  }),
  collectiveBadge({
    id: "matter.time_crystal.polariton_stc_bridge_boundary",
    title: "Polariton-Time-Crystal Bridge Boundary",
    plainMeaning:
      "Represents the analogy boundary connecting long-lived polariton reservoirs, time-crystal synchronization, and driven magnonic space-time lattices.",
    whyItMatters:
      "It lets the graph compare bosonic collective modes, gain/loss balance, nonlinear feedback, and phase-rigid order without merging distinct mechanisms.",
    subjects: ["matter", "collective_mode", "time_crystal", "polariton", "magnon", "claim_boundary"],
    level: "claim_boundary",
    status: "canonical_reference",
    simulationOwners: ["general_physics", "evolutionary_biophysics"],
    equationFamilies: ["analogy_boundary", "collective_mode_bridge", "mechanism_boundary"],
    tags: ["polariton", "time_crystal", "magnon", "bridge", "claim_boundary"],
    equations: [
      {
        id: "polariton_stc_bridge_boundary",
        role: "gate",
        displayLatex:
          "\\mathrm{bridge}=\\mathrm{compare}(\\mathrm{reservoir},\\mathrm{synchrony},\\mathrm{lattice},\\mathrm{mechanism})",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["reservoir_context", "time_crystal_synchrony_context", "space_time_lattice_context", "mechanism_context"],
        outputSymbols: ["polariton_stc_bridge_boundary"],
      },
    ],
    units: [{ symbol: "mechanism_context", unit: null, quantity: "mechanism_boundary", dimensionSignature: "1" }],
    assumptions: [
      "The bridge admits analogy among collective modes, gain/loss balance, nonlinear feedback, and phase ordering.",
      "The bridge does not claim that soliton-polariton condensates, DTC sensing systems, and driven magnonic space-time lattices are the same physical mechanism.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("PubMed:41707245", "Long-lived room-temperature soliton-polariton reservoir context."),
      literatureRef("doi:10.1038/s41567-025-03163-6", "Discrete time-crystal sensing and collective linewidth context."),
      literatureRef("doi:10.1103/PhysRevLett.126.057201", "Driven magnonic space-time lattice visualization context."),
      literatureRef("doi:10.1088/1361-6633/ad6585", "Continuous-to-discrete time-crystal synchronization and subharmonic locking review context."),
    ],
    hintKeys: {
      subjects: ["matter", "collective_mode", "time_crystal", "polariton", "magnon", "claim_boundary"],
      symbols: ["reservoir_context", "time_crystal_synchrony_context", "space_time_lattice_context", "polariton_stc_bridge_boundary"],
      unitSignatures: ["1"],
      repoPaths: [],
      equationFamilies: ["analogy_boundary", "collective_mode_bridge", "mechanism_boundary"],
      simulationOwners: ["general_physics", "evolutionary_biophysics"],
    },
  }),
];

export const COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "polariton_reservoir_lifetime_requires_decoherence_boundary",
    from: "matter.collective.polariton_reservoir_lifetime_context",
    to: "matter.collective.polariton_decoherence_boundary",
    relation: "requires",
    label: "Reservoir lifetime interpretation requires an explicit decoherence-evidence boundary.",
    claimBoundaryNote: "Lifetime is not automatically coherence time or dephasing time.",
  },
  {
    id: "polariton_reservoir_lifetime_documents_bridge_boundary",
    from: "matter.collective.polariton_reservoir_lifetime_context",
    to: "matter.time_crystal.polariton_stc_bridge_boundary",
    relation: "documents",
    label: "Long-lived polariton reservoirs document the temporal-window side of the collective-mode bridge.",
    claimBoundaryNote: "A long reservoir lifetime does not establish time-crystalline order.",
  },
  {
    id: "time_crystal_signature_requires_collective_linewidth_context",
    from: "matter.phase.time_crystal_observable_signature_context",
    to: "matter.time_crystal.collective_lifetime_limited_linewidth_context",
    relation: "requires",
    label: "Time-crystal sensing and linewidth claims require collective lifetime context.",
    claimBoundaryNote: "A linewidth estimate is diagnostic until tied to admitted collective-order evidence.",
  },
  {
    id: "open_system_drive_requires_noisy_synchrony_margin",
    from: "matter.phase.open_system_drive_dissipation_context",
    to: "matter.time_crystal.noisy_synchrony_margin_context",
    relation: "requires",
    label: "Open noisy routes require a locking, dephasing, and loss margin when synchrony stability is discussed.",
    claimBoundaryNote: "Positive model margin is not a phase proof.",
  },
  {
    id: "collective_linewidth_documents_stabilized_noisy_trace",
    from: "matter.time_crystal.collective_lifetime_limited_linewidth_context",
    to: "matter.time_crystal.stabilized_vs_noisy_trace_context",
    relation: "documents",
    label: "Collective linewidth context documents stabilized-versus-noisy trace comparison.",
    claimBoundaryNote: "Trace comparison remains evidence-only.",
  },
  {
    id: "noisy_synchrony_margin_documents_stabilized_noisy_trace",
    from: "matter.time_crystal.noisy_synchrony_margin_context",
    to: "matter.time_crystal.stabilized_vs_noisy_trace_context",
    relation: "documents",
    label: "Noisy synchrony margin documents the destabilization side of the trace comparison.",
    claimBoundaryNote: "Noisy synchrony does not validate a mechanism without observable order evidence.",
  },
  {
    id: "stabilized_noisy_trace_documents_time_crystal_claim_boundary",
    from: "matter.time_crystal.stabilized_vs_noisy_trace_context",
    to: "matter.phase.time_crystal_claim_boundary",
    relation: "documents",
    label: "Stabilized-versus-noisy traces document time-crystal claim boundaries.",
    claimBoundaryNote: "Lifetime gain must not bypass symmetry, route, stability, or signature requirements.",
  },
  {
    id: "magnon_space_time_lattice_documents_bridge_boundary",
    from: "matter.time_crystal.magnon_space_time_lattice_context",
    to: "matter.time_crystal.polariton_stc_bridge_boundary",
    relation: "documents",
    label: "Driven magnonic space-time lattice observations document the spatiotemporal-lattice side of the bridge.",
    claimBoundaryNote: "The visualization bridge does not equate magnon STC, polariton reservoirs, and strict DTC order.",
  },
  {
    id: "magnon_space_time_lattice_documents_time_crystal_signature",
    from: "matter.time_crystal.magnon_space_time_lattice_context",
    to: "matter.phase.time_crystal_observable_signature_context",
    relation: "documents",
    label: "Magnon space-time lattices document observable spatiotemporal ordering, band folding, and scattering context.",
    claimBoundaryNote: "Driven STC-like behavior remains distinct from strict spontaneous subharmonic DTC evidence.",
  },
  {
    id: "polariton_stc_bridge_bounds_time_crystal_claim_boundary",
    from: "matter.time_crystal.polariton_stc_bridge_boundary",
    to: "matter.phase.time_crystal_claim_boundary",
    relation: "bounds",
    label: "The polariton/time-crystal/magnon bridge is bounded by mechanism and evidence-class differences.",
    claimBoundaryNote: "The bridge compares analogy classes and cannot certify mechanism equivalence.",
  },
];

export function buildCollectiveModeSynchronyTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: COLLECTIVE_MODE_SYNCHRONY_THEORY_BADGES,
    edges: COLLECTIVE_MODE_SYNCHRONY_THEORY_EDGES,
  };
}
