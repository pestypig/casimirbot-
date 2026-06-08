import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

const EVOLUTIONARY_BIOPHYSICS_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
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

const repoRef = (path: string, note?: string): TheoryBadgeV1["sourceRefs"][number] => ({
  kind: "repo_module",
  path,
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

const evolutionaryBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: EVOLUTIONARY_BIOPHYSICS_BOUNDARY,
});

export const EVOLUTIONARY_BIOPHYSICS_THEORY_BADGES: TheoryBadgeV1[] = [
  evolutionaryBadge({
    id: "biology.evolution.common_descent_phylogeny_context",
    title: "Common Descent / Phylogeny Context",
    plainMeaning:
      "Represents evolutionary lineages and kingdom-scale trait comparisons as biological context.",
    whyItMatters:
      "It gives Helix a first biological scaffold between prebiotic chemistry and later nervous-system or consciousness discussions.",
    subjects: ["biology", "evolution", "common_descent", "phylogeny", "kingdoms"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["evolutionary_biophysics"],
    equationFamilies: ["common_descent_phylogeny_context", "trait_lineage_context"],
    tags: ["biology_context", "evolutionary_context", "kingdom_context"],
    equations: [
      {
        id: "phylogeny_context_reference",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{lineage}_{context}=\\mathrm{tree}(\\mathrm{common\\ descent},\\mathrm{traits})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["common_descent", "trait_observations"],
        outputSymbols: ["lineage_context"],
      },
    ],
    units: [],
    assumptions: [
      "Phylogenetic rows organize biological trait context.",
      "Lineage context does not establish consciousness, objective collapse, or Orch-OR validation.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Darwin-1859-common-descent", "Common-descent lineage context."),
      literatureRef(
        "SEP-animal-consciousness-evidence",
        "Animal consciousness requires evidence markers beyond taxonomy alone.",
      ),
    ],
    hintKeys: {
      subjects: ["biology", "evolution", "common_descent", "phylogeny", "kingdoms"],
      symbols: ["common_descent", "trait_observations", "lineage_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["common_descent_phylogeny_context", "trait_lineage_context"],
      simulationOwners: ["evolutionary_biophysics"],
    },
  }),
  evolutionaryBadge({
    id: "biology.evolution.selection_fitness_context",
    title: "Selection / Fitness Context",
    plainMeaning:
      "Represents selection as a population-level covariance and transmission context for trait change.",
    whyItMatters:
      "It keeps adaptation language mathematical without turning self-organization or survival into a consciousness claim.",
    subjects: ["biology", "evolution", "selection", "fitness", "trait_change"],
    level: "derived_relation",
    status: "diagnostic",
    simulationOwners: ["evolutionary_biophysics"],
    equationFamilies: ["selection_fitness_context", "price_equation_context"],
    tags: ["selection", "trait_change", "calculator_loadable"],
    equations: [
      {
        id: "selection_trait_change_context",
        role: "calculator_demo",
        displayLatex:
          "\\Delta\\bar z=\\mathrm{Cov}(w,z)/\\bar w+\\mathbb{E}(w\\Delta z)/\\bar w",
        computableExpression:
          "mean_trait_change = covariance_fitness_trait/mean_fitness + expected_fitness_transmission_change/mean_fitness",
        operatorKind: "scalar_expression",
        inputSymbols: [
          "covariance_fitness_trait",
          "mean_fitness",
          "expected_fitness_transmission_change",
        ],
        outputSymbols: ["mean_trait_change"],
      },
    ],
    units: [
      {
        symbol: "covariance_fitness_trait",
        unit: null,
        quantity: "fitness_trait_covariance",
        dimensionSignature: "1",
      },
      { symbol: "mean_fitness", unit: null, quantity: "relative_fitness", dimensionSignature: "1" },
      {
        symbol: "expected_fitness_transmission_change",
        unit: null,
        quantity: "expected_transmission_change",
        dimensionSignature: "1",
      },
      { symbol: "mean_trait_change", unit: null, quantity: "trait_change", dimensionSignature: "1" },
    ],
    assumptions: [
      "The scalar row is a reduced trait-change context, not a complete evolutionary model.",
      "Selection context does not define a universal pleasure or consciousness optimization law.",
    ],
    calculatorPayloads: [
      payload({
        id: "selection_trait_change_context",
        expression:
          "mean_trait_change = covariance_fitness_trait/mean_fitness + expected_fitness_transmission_change/mean_fitness",
        displayLatex:
          "\\Delta\\bar z=\\mathrm{Cov}(w,z)/\\bar w+\\mathbb{E}(w\\Delta z)/\\bar w",
        targetVariable: "mean_trait_change",
      }),
    ],
    sourceRefs: [
      literatureRef("Price-1970-selection-covariance", "Selection covariance and transmission context."),
    ],
    hintKeys: {
      subjects: ["biology", "evolution", "selection", "fitness", "trait_change"],
      symbols: [
        "covariance_fitness_trait",
        "mean_fitness",
        "expected_fitness_transmission_change",
        "mean_trait_change",
      ],
      unitSignatures: ["1"],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["selection_fitness_context", "price_equation_context"],
      simulationOwners: ["evolutionary_biophysics"],
    },
  }),
  evolutionaryBadge({
    id: "biology.kingdoms.eukaryotic_trait_matrix",
    title: "Eukaryotic Kingdom Trait Matrix",
    plainMeaning:
      "Represents plants, animals, fungi, and protists as eukaryotic trait-context rows for later biological comparisons.",
    whyItMatters:
      "It creates a biology section where plant photosynthesis, animal nervous systems, and conserved cytoskeleton features can be compared without flattening them into one claim.",
    subjects: ["biology", "kingdoms", "eukaryote", "plant", "animal", "fungi", "protist"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["evolutionary_biophysics"],
    equationFamilies: ["eukaryotic_trait_matrix", "kingdom_trait_context"],
    tags: ["kingdom_context", "trait_matrix", "eukaryote"],
    equations: [
      {
        id: "eukaryotic_trait_matrix_context",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{trait\\ matrix}=\\mathrm{context}(\\mathrm{lineage},\\mathrm{cytoskeleton},\\mathrm{photosynthesis},\\mathrm{nervous\\ system})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["lineage_context", "cytoskeleton_context", "photosynthesis_context", "neural_context"],
        outputSymbols: ["eukaryotic_trait_matrix"],
      },
    ],
    units: [],
    assumptions: [
      "Kingdom rows are comparative biological context.",
      "Shared eukaryotic traits do not establish shared consciousness mechanisms.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Microtubules-in-Plants-2015", "Plant microtubule review and eukaryotic conservation context."),
      literatureRef("SEP-animal-consciousness-evidence", "Comparative animal-consciousness evidence context."),
    ],
    hintKeys: {
      subjects: ["biology", "kingdoms", "eukaryote", "plant", "animal", "fungi", "protist"],
      symbols: [
        "lineage_context",
        "cytoskeleton_context",
        "photosynthesis_context",
        "neural_context",
        "eukaryotic_trait_matrix",
      ],
      unitSignatures: [],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["eukaryotic_trait_matrix", "kingdom_trait_context"],
      simulationOwners: ["evolutionary_biophysics"],
    },
  }),
  evolutionaryBadge({
    id: "eukaryote.cytoskeleton.microtubule_conserved_scaffold",
    title: "Conserved Eukaryotic Microtubule Scaffold",
    plainMeaning:
      "Represents microtubules as conserved eukaryotic cytoskeleton context across plants, animals, fungi, and protists.",
    whyItMatters:
      "It separates the biological fact of conserved tubulin-based scaffolds from Orch-OR-specific microtubule coherence hypotheses.",
    subjects: ["eukaryote", "cytoskeleton", "microtubule", "plant", "animal", "fungi", "protist"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    equationFamilies: ["microtubule_conserved_scaffold", "cytoskeleton_context"],
    tags: ["microtubule", "cytoskeleton", "eukaryote", "claim_boundary"],
    equations: [
      {
        id: "microtubule_polymer_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{MT}=\\mathrm{polymer}(\\alpha\\beta\\mathrm{-tubulin})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["alpha_beta_tubulin", "gtp_polymerization_context"],
        outputSymbols: ["microtubule_scaffold_context"],
      },
    ],
    units: [],
    assumptions: [
      "Microtubule conservation is eukaryotic cytoskeleton context.",
      "Conserved microtubules do not validate Orch-OR, plant consciousness, or objective-collapse biology.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef("Microtubules-in-Plants-2015", "Microtubules as conserved eukaryotic cytoskeleton components."),
      literatureRef(
        "Yin-2025-bryophyte-microtubule-cytoskeleton",
        "Plant-evolution microtubule context in bryophytes.",
      ),
    ],
    hintKeys: {
      subjects: ["eukaryote", "cytoskeleton", "microtubule", "plant", "animal", "fungi", "protist"],
      symbols: ["alpha_beta_tubulin", "gtp_polymerization_context", "microtubule_scaffold_context"],
      unitSignatures: [],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["microtubule_conserved_scaffold", "cytoskeleton_context"],
      simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    },
  }),
  evolutionaryBadge({
    id: "plant.photosynthesis.light_harvesting_exciton_context",
    title: "Photosynthetic Light-Harvesting Exciton Context",
    plainMeaning:
      "Represents photosynthetic pigment excitation and transfer efficiency as molecular biophysics context.",
    whyItMatters:
      "It gives the biology lane a real quantum-biological bridge while keeping it tied to spectroscopy and energy transfer.",
    subjects: ["plant", "photosynthesis", "light_harvesting", "exciton", "quantum_biology"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["evolutionary_biophysics"],
    equationFamilies: ["photosynthetic_light_harvesting", "photosynthetic_exciton_context", "planck_relation"],
    tags: ["photosynthesis", "exciton", "calculator_loadable", "quantum_biology"],
    equations: [
      {
        id: "photosynthesis_absorption_frequency",
        role: "calculator_demo",
        displayLatex: "f_{abs}=c/\\lambda_{abs}",
        computableExpression: "exciton_frequency_Hz = c/lambda_abs_m",
        operatorKind: "scalar_expression",
        inputSymbols: ["c", "lambda_abs_m"],
        outputSymbols: ["exciton_frequency_Hz"],
      },
      {
        id: "photosynthesis_exciton_energy",
        role: "calculator_demo",
        displayLatex: "E_{exc}=h f_{abs}",
        computableExpression: "exciton_energy_J = h*exciton_frequency_Hz",
        operatorKind: "scalar_expression",
        inputSymbols: ["h", "exciton_frequency_Hz"],
        outputSymbols: ["exciton_energy_J"],
      },
      {
        id: "photosynthesis_transfer_efficiency",
        role: "calculator_demo",
        displayLatex: "\\eta_{ET}=k_{ET}/(k_{ET}+k_{loss})",
        computableExpression: "photosynthesis_transfer_efficiency = k_ET_s_inv/(k_ET_s_inv + k_loss_s_inv)",
        operatorKind: "scalar_expression",
        inputSymbols: ["k_ET_s_inv", "k_loss_s_inv"],
        outputSymbols: ["photosynthesis_transfer_efficiency"],
      },
    ],
    units: [
      { symbol: "lambda_abs_m", unit: "m", quantity: "wavelength", dimensionSignature: "L" },
      { symbol: "exciton_frequency_Hz", unit: "Hz", quantity: "frequency", dimensionSignature: "T^-1" },
      { symbol: "exciton_energy_J", unit: "J", quantity: "energy", dimensionSignature: "M L^2 T^-2" },
      { symbol: "k_ET_s_inv", unit: "s^-1", quantity: "energy_transfer_rate", dimensionSignature: "T^-1" },
      { symbol: "k_loss_s_inv", unit: "s^-1", quantity: "loss_rate", dimensionSignature: "T^-1" },
      {
        symbol: "photosynthesis_transfer_efficiency",
        unit: null,
        quantity: "transfer_efficiency",
        dimensionSignature: "1",
      },
    ],
    assumptions: [
      "This row models pigment excitation and energy-transfer context.",
      "Photosynthetic quantum coherence does not establish consciousness or objective collapse.",
    ],
    calculatorPayloads: [
      payload({
        id: "photosynthesis_absorption_frequency",
        expression: "exciton_frequency_Hz = c/lambda_abs_m",
        displayLatex: "f_{abs}=c/\\lambda_{abs}",
        targetVariable: "exciton_frequency_Hz",
      }),
      payload({
        id: "photosynthesis_exciton_energy",
        expression: "exciton_energy_J = h*exciton_frequency_Hz",
        displayLatex: "E_{exc}=h f_{abs}",
        targetVariable: "exciton_energy_J",
      }),
      payload({
        id: "photosynthesis_transfer_efficiency",
        expression: "photosynthesis_transfer_efficiency = k_ET_s_inv/(k_ET_s_inv + k_loss_s_inv)",
        displayLatex: "\\eta_{ET}=k_{ET}/(k_{ET}+k_{loss})",
        targetVariable: "photosynthesis_transfer_efficiency",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "Engel-Calhoun-Read-Ahn-Mancal-Cheng-Blankenship-Fleming-2007-Nature-FMO-coherence",
        "Experimental photosynthetic energy-transfer coherence context.",
      ),
      literatureRef(
        "Scholes-Fleming-OlayaCastro-vanGrondelle-2011-photosynthetic-light-harvesting",
        "Photosynthetic light-harvesting energy-transfer review context.",
      ),
    ],
    hintKeys: {
      subjects: ["plant", "photosynthesis", "light_harvesting", "exciton", "quantum_biology"],
      symbols: [
        "c",
        "h",
        "lambda_abs_m",
        "exciton_frequency_Hz",
        "exciton_energy_J",
        "k_ET_s_inv",
        "k_loss_s_inv",
        "photosynthesis_transfer_efficiency",
      ],
      unitSignatures: ["L", "T^-1", "M L^2 T^-2", "1"],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["photosynthetic_light_harvesting", "photosynthetic_exciton_context", "planck_relation"],
      simulationOwners: ["evolutionary_biophysics"],
    },
  }),
  evolutionaryBadge({
    id: "plant.photosynthesis.coherence_lifetime_gate",
    title: "Photosynthesis Coherence Lifetime Gate",
    plainMeaning:
      "Compares a photosynthetic coherence lifetime with an energy-transfer timescale as a diagnostic gate.",
    whyItMatters:
      "It makes the photosynthesis bridge testable by calculation while preventing broad claims from a coherence label alone.",
    subjects: ["plant", "photosynthesis", "coherence", "energy_transfer", "diagnostic_gate"],
    level: "diagnostic_gate",
    status: "review",
    simulationOwners: ["evolutionary_biophysics"],
    equationFamilies: ["photosynthesis_coherence_lifetime_gate", "coherence_window"],
    tags: ["photosynthesis", "coherence_gate", "calculator_loadable", "claim_boundary"],
    equations: [
      {
        id: "photosynthesis_coherence_surplus",
        role: "calculator_demo",
        displayLatex: "\\Delta t_{photo}=\\tau_{coh}-\\tau_{ET}",
        computableExpression: "photosynthesis_coherence_surplus_s = tau_coherence_s - tau_transfer_s",
        operatorKind: "scalar_expression",
        inputSymbols: ["tau_coherence_s", "tau_transfer_s"],
        outputSymbols: ["photosynthesis_coherence_surplus_s"],
      },
      {
        id: "photosynthesis_coherence_gate",
        role: "gate",
        displayLatex: "\\tau_{coh}>\\tau_{ET}",
        computableExpression: null,
        operatorKind: "gate_status",
        inputSymbols: ["tau_coherence_s", "tau_transfer_s"],
        outputSymbols: ["photosynthesis_coherence_gate_status"],
      },
    ],
    units: [
      { symbol: "tau_coherence_s", unit: "s", quantity: "coherence_lifetime", dimensionSignature: "T" },
      { symbol: "tau_transfer_s", unit: "s", quantity: "energy_transfer_time", dimensionSignature: "T" },
      {
        symbol: "photosynthesis_coherence_surplus_s",
        unit: "s",
        quantity: "coherence_surplus",
        dimensionSignature: "T",
      },
    ],
    assumptions: [
      "Coherence claims require a lifetime and transfer-timescale comparison.",
      "This gate is a photosynthetic energy-transfer diagnostic, not consciousness evidence.",
    ],
    calculatorPayloads: [
      payload({
        id: "photosynthesis_coherence_surplus",
        expression: "photosynthesis_coherence_surplus_s = tau_coherence_s - tau_transfer_s",
        displayLatex: "\\Delta t_{photo}=\\tau_{coh}-\\tau_{ET}",
        targetVariable: "photosynthesis_coherence_surplus_s",
      }),
    ],
    sourceRefs: [
      literatureRef(
        "Engel-Calhoun-Read-Ahn-Mancal-Cheng-Blankenship-Fleming-2007-Nature-FMO-coherence",
        "Photosynthetic coherence evidence context.",
      ),
      literatureRef(
        "Panitchayangkoon-2010-FMO-physiological-temperature-coherence",
        "Biological-temperature photosynthetic coherence context.",
      ),
    ],
    hintKeys: {
      subjects: ["plant", "photosynthesis", "coherence", "energy_transfer", "diagnostic_gate"],
      symbols: ["tau_coherence_s", "tau_transfer_s", "photosynthesis_coherence_surplus_s"],
      unitSignatures: ["T"],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["photosynthesis_coherence_lifetime_gate", "coherence_window"],
      simulationOwners: ["evolutionary_biophysics"],
    },
  }),
  evolutionaryBadge({
    id: "animal.neural.consciousness_evolution_context",
    title: "Animal Consciousness Evolution Context",
    plainMeaning:
      "Represents animal consciousness as a comparative-evidence context involving neural, behavioral, and evolutionary markers.",
    whyItMatters:
      "It gives the graph a biology-side place for consciousness definitions without letting kingdom membership or coherence rows answer the question alone.",
    subjects: ["animal", "neural_system", "consciousness", "evolution", "comparative_evidence"],
    level: "model",
    status: "review",
    simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    equationFamilies: ["animal_consciousness_evolution_context", "comparative_evidence_context"],
    tags: ["animal_consciousness", "comparative_evidence", "claim_boundary"],
    equations: [
      {
        id: "animal_consciousness_evidence_context",
        role: "noncomputable_reference",
        displayLatex:
          "\\mathrm{consciousness}_{context}=\\mathrm{evidence}(\\mathrm{neural},\\mathrm{behavioral},\\mathrm{evolutionary})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["neural_marker_context", "behavioral_marker_context", "evolutionary_marker_context"],
        outputSymbols: ["animal_consciousness_context"],
      },
    ],
    units: [],
    assumptions: [
      "Animal-consciousness discussions require neural and behavioral evidence context.",
      "Comparative evidence context does not validate any one physical theory of consciousness.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      literatureRef(
        "SEP-animal-consciousness-evidence",
        "Evidence categories for animal-consciousness debates.",
      ),
      literatureRef(
        "Wandrey-Halina-2025-evolution-animal-consciousness",
        "Evolutionary animal-consciousness review context.",
      ),
    ],
    hintKeys: {
      subjects: ["animal", "neural_system", "consciousness", "evolution", "comparative_evidence"],
      symbols: [
        "neural_marker_context",
        "behavioral_marker_context",
        "evolutionary_marker_context",
        "animal_consciousness_context",
      ],
      unitSignatures: [],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["animal_consciousness_evolution_context", "comparative_evidence_context"],
      simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    },
  }),
  evolutionaryBadge({
    id: "consciousness.claim_boundary.evolutionary_biology_context_only",
    title: "Evolutionary Biology Context Boundary",
    plainMeaning:
      "Blocks promotion from biological coherence, kingdom traits, or conserved microtubules into consciousness or collapse validation.",
    whyItMatters:
      "It lets the graph connect evolution, plants, microtubules, and animal consciousness definitions while preserving strict claim scope.",
    subjects: ["claim_boundary", "evolution", "biology", "photosynthesis", "microtubule", "consciousness"],
    level: "claim_boundary",
    status: "blocked",
    simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    equationFamilies: ["evolutionary_biology_claim_boundary", "consciousness_claim_boundary"],
    tags: ["claim_boundary", "blocks_promotion", "diagnostic_only"],
    equations: [
      {
        id: "evolutionary_biology_boundary",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{biology\\ context}\\not\\Rightarrow\\mathrm{consciousness\\ validation}",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["biology_context"],
        outputSymbols: ["blocked_consciousness_promotion"],
      },
    ],
    units: [],
    assumptions: [
      "Photosynthetic coherence is biological energy-transfer context.",
      "Conserved microtubules are cytoskeletal context across eukaryotes.",
      "Evolutionary lineages and kingdoms are trait context, not consciousness evidence by themselves.",
      "Animal consciousness requires behavioral and neural evidence markers.",
      "No row validates Orch-OR, objective collapse, plant consciousness, kingdom consciousness, or NHM2.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      repoRef(
        "shared/theory/evolutionary-biophysics-theory-badges.ts",
        "Evolutionary biology context boundary.",
      ),
    ],
    hintKeys: {
      subjects: ["claim_boundary", "evolution", "biology", "photosynthesis", "microtubule", "consciousness"],
      symbols: ["biology_context", "blocked_consciousness_promotion"],
      unitSignatures: [],
      repoPaths: ["shared/theory/evolutionary-biophysics-theory-badges.ts"],
      equationFamilies: ["evolutionary_biology_claim_boundary", "consciousness_claim_boundary"],
      simulationOwners: ["evolutionary_biophysics", "orch_or_coherence"],
    },
  }),
];

export const EVOLUTIONARY_BIOPHYSICS_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  {
    id: "prebiotic_membrane_documents_eukaryotic_trait_matrix",
    from: "biophysics.membrane.open_system_entropy_flow",
    to: "biology.kingdoms.eukaryotic_trait_matrix",
    relation: "documents",
    label: "Open-system membrane context documents later eukaryotic trait comparisons.",
    claimBoundaryNote: "Membrane entropy context does not imply consciousness or evolutionary success.",
  },
  {
    id: "rna_world_documents_common_descent_context",
    from: "prebiotic.rna_world.ribozyme_context",
    to: "biology.evolution.common_descent_phylogeny_context",
    relation: "documents",
    label: "RNA catalytic context documents one prebiotic entry point before lineage comparisons.",
    claimBoundaryNote: "RNA-world context does not settle biological origins or consciousness.",
  },
  {
    id: "common_descent_bounds_kingdom_trait_matrix",
    from: "biology.evolution.common_descent_phylogeny_context",
    to: "biology.kingdoms.eukaryotic_trait_matrix",
    relation: "bounds",
    label: "Phylogeny bounds how kingdom trait rows should be compared.",
    claimBoundaryNote: "Taxonomic context is not a mechanism claim.",
  },
  {
    id: "selection_context_documents_trait_matrix",
    from: "biology.evolution.selection_fitness_context",
    to: "biology.kingdoms.eukaryotic_trait_matrix",
    relation: "documents",
    label: "Selection context documents how trait changes can be framed across lineages.",
    claimBoundaryNote: "Selection diagnostics do not define consciousness or pleasure laws.",
  },
  {
    id: "kingdom_trait_matrix_documents_microtubule_scaffold",
    from: "biology.kingdoms.eukaryotic_trait_matrix",
    to: "eukaryote.cytoskeleton.microtubule_conserved_scaffold",
    relation: "documents",
    label: "The eukaryotic trait matrix surfaces conserved microtubule scaffold context.",
    claimBoundaryNote: "Conserved cytoskeleton context is not Orch-OR validation.",
  },
  {
    id: "kingdom_trait_matrix_documents_photosynthesis_context",
    from: "biology.kingdoms.eukaryotic_trait_matrix",
    to: "plant.photosynthesis.light_harvesting_exciton_context",
    relation: "documents",
    label: "The eukaryotic trait matrix surfaces plant photosynthetic light-harvesting context.",
    claimBoundaryNote: "Plant photosynthesis context is not a plant-consciousness claim.",
  },
  {
    id: "photosynthesis_context_requires_coherence_gate",
    from: "plant.photosynthesis.light_harvesting_exciton_context",
    to: "plant.photosynthesis.coherence_lifetime_gate",
    relation: "requires",
    label: "Photosynthetic coherence interpretation requires lifetime versus transfer-time comparison.",
    claimBoundaryNote: "A coherence label alone is insufficient for broader claims.",
  },
  {
    id: "photosynthesis_coherence_documents_prebiotic_coherence_gate",
    from: "plant.photosynthesis.coherence_lifetime_gate",
    to: "prebiotic.coherence.decoherence_lifetime_gate",
    relation: "documents",
    label: "Photosynthetic and prebiotic coherence rows share lifetime-window diagnostic structure.",
    claimBoundaryNote: "Shared gate structure does not connect either row to consciousness evidence.",
  },
  {
    id: "microtubule_scaffold_documents_orch_or_microtubule_mode",
    from: "eukaryote.cytoskeleton.microtubule_conserved_scaffold",
    to: "orch_or.microtubule.mode_frequency",
    relation: "documents",
    label: "Conserved microtubule scaffold context can document where Orch-OR microtubule rows attach.",
    claimBoundaryNote: "Biological conservation is context only and does not validate Orch-OR.",
  },
  {
    id: "microtubule_scaffold_blocks_consciousness_promotion",
    from: "eukaryote.cytoskeleton.microtubule_conserved_scaffold",
    to: "consciousness.claim_boundary.evolutionary_biology_context_only",
    relation: "blocks",
    label: "Conserved microtubule context is blocked from promoting to consciousness validation.",
    claimBoundaryNote: "Microtubule presence across eukaryotes is not consciousness evidence.",
  },
  {
    id: "photosynthesis_gate_blocks_consciousness_promotion",
    from: "plant.photosynthesis.coherence_lifetime_gate",
    to: "consciousness.claim_boundary.evolutionary_biology_context_only",
    relation: "blocks",
    label: "Photosynthetic coherence diagnostics are blocked from promoting to consciousness validation.",
    claimBoundaryNote: "Photosynthetic quantum biology remains energy-transfer context.",
  },
  {
    id: "animal_consciousness_context_bounds_evolutionary_boundary",
    from: "animal.neural.consciousness_evolution_context",
    to: "consciousness.claim_boundary.evolutionary_biology_context_only",
    relation: "bounds",
    label: "Animal consciousness context bounds the evidence required before consciousness language is used.",
    claimBoundaryNote: "Comparative evidence is required and remains theory-neutral.",
  },
  {
    id: "evolutionary_boundary_documents_orch_or_boundary",
    from: "consciousness.claim_boundary.evolutionary_biology_context_only",
    to: "orch_or.claim_boundary.exploratory_only",
    relation: "documents",
    label: "The evolutionary biology boundary documents the adjacent Orch-OR exploratory boundary.",
    claimBoundaryNote: "Adjacency is a boundary handoff, not a validation path.",
  },
];

export function buildEvolutionaryBiophysicsTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: EVOLUTIONARY_BIOPHYSICS_THEORY_BADGES.map((badge: TheoryBadgeV1) => ({ ...badge })),
    edges: EVOLUTIONARY_BIOPHYSICS_THEORY_EDGES.map((edge: TheoryBadgeEdgeV1) => ({ ...edge })),
  };
}
