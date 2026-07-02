import type {
  MoralLivingSubstrateMatchV1,
  MoralLivingSubstrateProceduralChainStepV1,
  MoralLivingSubstrateProceduralDerivationV1,
  MoralLivingSubstrateSynthesisStepV1,
} from "../contracts/moral-living-substrate-reflection.v1";

type DerivationDefinition = Omit<
  MoralLivingSubstrateProceduralDerivationV1,
  "matchedBadgeIds" | "evidenceStrength"
> & {
  triggerBadgeIds: string[];
  triggerTerms: string[];
};

const DERIVATION_DEFINITIONS: readonly DerivationDefinition[] = [
  {
    derivationId: "gradient-condition",
    label: "Gradient Condition",
    triggerBadgeIds: ["gradient-before-boundary"],
    triggerTerms: ["gradient", "energy gradient", "entropy contrast", "low entropy", "hot sun", "dark sky", "source sink"],
    proceduralQuestion: "What source/sink contrast makes persistent organization possible before a living boundary is named?",
    substrateObservation: "Pre-boundary moral reflection starts from conditions that can support persistence, not from a completed organism or obligation.",
    estimate: {
      vulnerability: "unknown",
      dependency: "high",
      agency: "unknown",
    },
    obligationHint: "Use the condition to bound later inquiry; do not derive duty until a bounded system and vulnerability are identified.",
    caution: "Keep thermodynamic mechanism details in the Theory Badge Graph or calculator.",
    forbiddenOverclaim: "Energy-gradient evidence does not prove life, agency, consciousness, or moral status.",
  },
  {
    derivationId: "flux-condition",
    label: "Flux Condition",
    triggerBadgeIds: ["flux-before-action"],
    triggerTerms: ["flux", "flow", "dissipation", "non equilibrium", "free energy", "gibbs", "heat"],
    proceduralQuestion: "Which flow or dissipation path exists before anything is treated as action?",
    substrateObservation: "Physical flux can make action possible, but it is not itself agency or moral action.",
    estimate: {
      vulnerability: "unknown",
      dependency: "medium",
      agency: "unknown",
    },
    obligationHint: "Preserve flux as a precursor condition and wait for boundary, sensing, and maintenance evidence before obligation claims.",
    caution: "Do not translate energy flow directly into intention.",
    forbiddenOverclaim: "Flux evidence is not proof of agency, choice, or obligation.",
  },
  {
    derivationId: "compartment-condition",
    label: "Compartment Condition",
    triggerBadgeIds: ["compartment-before-organism"],
    triggerTerms: ["compartment", "vesicle", "micropore", "mineral barrier", "inorganic barrier", "hydrothermal vent", "proton gradient"],
    proceduralQuestion: "What compartment or barrier creates local inside/outside conditions before organism status?",
    substrateObservation: "Compartments can make selection and persistence possible without yet establishing a full organism.",
    estimate: {
      vulnerability: "medium",
      dependency: "high",
      agency: "unknown",
    },
    obligationHint: "Use compartment evidence to ask what later boundary or maintenance evidence is needed.",
    caution: "Do not equate prebiotic compartments with modern cellular identity.",
    forbiddenOverclaim: "Compartment evidence does not prove organism status or moral standing.",
  },
  {
    derivationId: "concentration-condition",
    label: "Concentration Condition",
    triggerBadgeIds: ["concentration-before-replication"],
    triggerTerms: ["concentration", "concentrate", "thermophoresis", "before replication", "replication", "organic molecules"],
    proceduralQuestion: "What local concentration mechanism makes later replication or maintenance plausible?",
    substrateObservation: "Concentration is a pre-replication condition and should not be treated as heredity, life, or obligation.",
    estimate: {
      vulnerability: "unknown",
      dependency: "medium",
      agency: "unknown",
    },
    obligationHint: "Treat concentration as a prerequisite candidate for later living-substrate claims.",
    caution: "Do not infer replication or agency from concentration alone.",
    forbiddenOverclaim: "Concentration evidence does not prove life, heredity, or final moral status.",
  },
  {
    derivationId: "boundary-integrity",
    label: "Boundary Integrity",
    triggerBadgeIds: ["boundary-before-obligation"],
    triggerTerms: ["boundary", "membrane", "organism environment", "inside outside"],
    proceduralQuestion: "What preserves, crosses, or damages the living-system boundary?",
    substrateObservation: "A bounded living system must be identified before care, interference, or obligation is assigned.",
    estimate: {
      vulnerability: "medium",
      dependency: "medium",
      agency: "unknown",
    },
    obligationHint: "Prefer actions that preserve necessary boundary integrity unless stronger evidence justifies intervention.",
    caution: "Do not infer personhood from boundary evidence alone.",
    forbiddenOverclaim: "Boundary evidence does not prove consciousness or final moral status.",
  },
  {
    derivationId: "maintenance-requirement",
    label: "Maintenance Requirement",
    triggerBadgeIds: ["maintenance-before-optimization"],
    triggerTerms: ["homeostasis", "maintain", "maintenance", "viability", "survive", "regulation"],
    proceduralQuestion: "What must remain stable enough for the system to continue living?",
    substrateObservation: "Homeostatic maintenance is a prerequisite for optimization, preference, and higher-order mandate claims.",
    estimate: {
      vulnerability: "high",
      dependency: "medium",
      agency: "low",
    },
    obligationHint: "Treat viability-preserving needs as stronger moral inputs than optional optimization preferences.",
    caution: "Do not collapse maintenance needs into human-style wants.",
    forbiddenOverclaim: "Maintenance evidence does not show that every viable process has equal moral standing.",
  },
  {
    derivationId: "sensing-and-error",
    label: "Sensing And Error",
    triggerBadgeIds: ["sensing-before-judgment"],
    triggerTerms: ["sensing", "detect", "signal", "stimulus", "state discrimination", "perceive"],
    proceduralQuestion: "What can the system detect, misread, avoid, or adapt toward?",
    substrateObservation: "Sensing begins as state discrimination and should be modeled before judgment or blame.",
    estimate: {
      vulnerability: "medium",
      dependency: "low",
      agency: "medium",
    },
    obligationHint: "Account for limited sensing and error before assigning responsibility or expectation.",
    caution: "Do not treat signal response as human-like interpretation without additional evidence.",
    forbiddenOverclaim: "Sensing evidence does not prove reflective awareness.",
  },
  {
    derivationId: "perturbation-cost",
    label: "Perturbation Cost",
    triggerBadgeIds: ["perturbation-response-before-verdict"],
    triggerTerms: ["perturbation", "stress", "damage", "repair", "adapt", "response"],
    proceduralQuestion: "What cost, repair burden, or failure mode follows from disruption?",
    substrateObservation: "Perturbation response is the substrate-level bridge from disruption to possible harm.",
    estimate: {
      vulnerability: "high",
      dependency: "medium",
      agency: "medium",
    },
    obligationHint: "Prefer reversible, low-perturbation actions until repair cost and failure modes are understood.",
    caution: "Do not label all perturbation as harm; adaptation and repair must be distinguished.",
    forbiddenOverclaim: "Perturbation cost alone is not a final moral verdict.",
  },
  {
    derivationId: "dependency-and-scale",
    label: "Dependency And Scale",
    triggerBadgeIds: ["coordination-before-mandate", "scale-continuity-from-cell-to-society"],
    triggerTerms: ["single cell", "multicellular", "scale", "coordination", "society", "ecosystem", "collective"],
    proceduralQuestion: "Which scale is being evaluated, and what dependencies hold that scale together?",
    substrateObservation: "Moral relevance changes as cells, organisms, groups, and ecosystems create different dependencies.",
    estimate: {
      vulnerability: "medium",
      dependency: "high",
      agency: "medium",
    },
    obligationHint: "State the scale before deriving duties, because obligations can conflict across cell, organism, and social layers.",
    caution: "Do not import society-level mandates into cellular or organism-level evidence without a bridge.",
    forbiddenOverclaim: "Scale continuity does not make all scales morally identical.",
  },
  {
    derivationId: "obligation-emergence",
    label: "Obligation Emergence",
    triggerBadgeIds: [
      "gradient-before-boundary",
      "flux-before-action",
      "compartment-before-organism",
      "concentration-before-replication",
      "boundary-before-obligation",
      "maintenance-before-optimization",
      "sensing-before-judgment",
      "perturbation-response-before-verdict",
    ],
    triggerTerms: ["obligation", "duty", "care", "moral", "responsibility", "flourishing"],
    proceduralQuestion: "Which observed vulnerabilities, dependencies, or agency capacities create a duty or caution?",
    substrateObservation: "Obligation should emerge from observed vulnerability, dependency, and agency rather than from human-only categories.",
    estimate: {
      vulnerability: "medium",
      dependency: "medium",
      agency: "medium",
    },
    obligationHint: "Derive duties as provisional care constraints: protect viable boundaries, reduce needless perturbation, and respect demonstrated agency.",
    caution: "Keep the obligation provisional when substrate evidence is incomplete.",
    forbiddenOverclaim: "Substrate-derived obligation is not a proof of absolute rights, personhood, or final status.",
  },
  {
    derivationId: "claim-boundary",
    label: "Claim Boundary",
    triggerBadgeIds: ["microtubule-orch-or-frontier-boundary"],
    triggerTerms: ["claim boundary", "claim boundaries", "overclaim", "orch or", "hameroff", "penrose", "microtubule", "consciousness", "personhood", "prove"],
    proceduralQuestion: "What does the substrate observation support, and what must remain unproven?",
    substrateObservation: "Frontier consciousness mechanisms can orient inquiry but cannot serve as settled moral proof.",
    estimate: {
      vulnerability: "unknown",
      dependency: "unknown",
      agency: "unknown",
    },
    obligationHint: "Use frontier theory as a cautionary boundary and a prompt for further evidence, not as verdict authority.",
    caution: "Separate mechanism plausibility from moral classification.",
    forbiddenOverclaim: "Orch-OR or microtubule cues do not prove consciousness, personhood, or final moral status.",
  },
];

type ProceduralChainDefinition = Omit<
  MoralLivingSubstrateProceduralChainStepV1,
  "evidenceStrength" | "missingEvidence"
> & {
  missingEvidenceByBadgeId?: Partial<Record<"from" | "to", string>>;
};

const CHAIN_DEFINITIONS: readonly ProceduralChainDefinition[] = [
  {
    fromBadgeId: "gradient-before-boundary",
    toBadgeId: "flux-before-action",
    transitionLabel: "gradient to flux",
    proceduralClaim: "A source/sink contrast only begins to matter procedurally when a flow path can carry usable change.",
    forbiddenOverclaim: "A gradient-to-flux link does not prove life, agency, or obligation.",
  },
  {
    fromBadgeId: "flux-before-action",
    toBadgeId: "compartment-before-organism",
    transitionLabel: "flux to compartment",
    proceduralClaim: "Flow becomes relevant to living substrate claims when a local compartment can hold differential conditions.",
    forbiddenOverclaim: "Flux plus compartment evidence does not prove organism status.",
  },
  {
    fromBadgeId: "compartment-before-organism",
    toBadgeId: "boundary-before-obligation",
    transitionLabel: "compartment to living boundary",
    proceduralClaim: "A compartment becomes morally relevant only when the trace identifies a boundary whose persistence or disruption matters.",
    forbiddenOverclaim: "Boundary evidence does not prove consciousness, personhood, or final moral status.",
  },
  {
    fromBadgeId: "boundary-before-obligation",
    toBadgeId: "maintenance-before-optimization",
    transitionLabel: "boundary to maintenance",
    proceduralClaim: "A bounded system supports stronger reflection when the trace shows what must be maintained before optional optimization.",
    forbiddenOverclaim: "Maintenance evidence does not make every viable process morally identical.",
  },
  {
    fromBadgeId: "maintenance-before-optimization",
    toBadgeId: "sensing-before-judgment",
    transitionLabel: "maintenance to sensing",
    proceduralClaim: "Maintenance can become action-relevant when the system senses state differences that affect viability.",
    forbiddenOverclaim: "Sensing evidence does not prove reflective awareness or blame.",
  },
  {
    fromBadgeId: "sensing-before-judgment",
    toBadgeId: "valence-before-preference",
    transitionLabel: "sensing to valence",
    proceduralClaim: "Sensing supports generative reflection when detected states can be treated as favorable, adverse, or costly before preference.",
    forbiddenOverclaim: "Valence does not prove human-like preference.",
  },
  {
    fromBadgeId: "valence-before-preference",
    toBadgeId: "affordance-before-action",
    transitionLabel: "valence to affordance",
    proceduralClaim: "A valenced state becomes action-shaped when the environment offers possible moves or constraints.",
    forbiddenOverclaim: "Affordance evidence does not prove intention.",
  },
  {
    fromBadgeId: "affordance-before-action",
    toBadgeId: "actuation-before-agency",
    transitionLabel: "affordance to actuation",
    proceduralClaim: "An affordance only becomes enacted when the system can physically alter state or relation.",
    forbiddenOverclaim: "Actuation does not prove free will or personhood.",
  },
  {
    fromBadgeId: "actuation-before-agency",
    toBadgeId: "feedback-before-learning",
    transitionLabel: "actuation to feedback",
    proceduralClaim: "Action becomes procedurally inspectable when its consequences can feed back into later state changes.",
    forbiddenOverclaim: "Feedback does not prove reflective learning by itself.",
  },
  {
    fromBadgeId: "feedback-before-learning",
    toBadgeId: "memory-before-commitment",
    transitionLabel: "feedback to retained state",
    proceduralClaim: "Feedback supports learning claims only when some retained state can carry prior effects forward.",
    forbiddenOverclaim: "Retained state does not prove autobiographical memory or commitment authority.",
  },
  {
    fromBadgeId: "memory-before-commitment",
    toBadgeId: "prediction-before-planning",
    transitionLabel: "memory to prediction",
    proceduralClaim: "Retained state becomes planning-relevant when it constrains expected future states.",
    forbiddenOverclaim: "Prediction does not prove human planning or deliberation.",
  },
  {
    fromBadgeId: "prediction-before-planning",
    toBadgeId: "choice-before-mandate",
    transitionLabel: "prediction to choice",
    proceduralClaim: "Prediction supports choice only where alternatives can be discriminated before any mandate is assigned.",
    forbiddenOverclaim: "Choice evidence does not prove free will, personhood, or moral verdict authority.",
  },
  {
    fromBadgeId: "choice-before-mandate",
    toBadgeId: "coordination-before-mandate",
    transitionLabel: "choice to coordination",
    proceduralClaim: "Choice scales toward coordination only when multiple actions or agents must be ordered together.",
    forbiddenOverclaim: "Coordination does not authorize society-level mandates for a cell-scale trace.",
  },
  {
    fromBadgeId: "coordination-before-mandate",
    toBadgeId: "communication-before-norm",
    transitionLabel: "coordination to communication",
    proceduralClaim: "Coordination becomes norm-relevant only when signals or shared constraints can stabilize behavior across participants.",
    forbiddenOverclaim: "Communication does not prove a norm, law, or institution.",
  },
  {
    fromBadgeId: "communication-before-norm",
    toBadgeId: "reciprocity-before-law",
    transitionLabel: "communication to reciprocity",
    proceduralClaim: "Communication supports norm reflection when reciprocal expectation or correction is visible before law.",
    forbiddenOverclaim: "Reciprocity does not prove legal authority.",
  },
  {
    fromBadgeId: "reciprocity-before-law",
    toBadgeId: "scale-continuity-from-cell-to-society",
    transitionLabel: "reciprocity to institutional scale",
    proceduralClaim: "Law or objective-binding reflection should appear only when reciprocal relations are placed at the correct organism, group, or institution scale.",
    forbiddenOverclaim: "Scale continuity does not make institutional mandates valid for lower-scale substrate traces.",
    missingEvidenceByBadgeId: {
      to: "institutional or scale-specific evidence that justifies law/objective binding",
    },
  },
];

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const strengthFor = (
  definition: DerivationDefinition,
  matchedBadgeIds: string[],
  promptText: string,
): MoralLivingSubstrateProceduralDerivationV1["evidenceStrength"] => {
  const badgeHits = definition.triggerBadgeIds.filter((badgeId) => matchedBadgeIds.includes(badgeId)).length;
  const termHits = definition.triggerTerms.filter((term) => promptText.includes(normalize(term))).length;
  if (badgeHits >= 2 || (badgeHits >= 1 && termHits >= 2)) return "strong";
  if (badgeHits >= 1 || termHits >= 1) return "moderate";
  return "weak";
};

function deriveProceduralChain(matchedBadgeIds: string[]): MoralLivingSubstrateProceduralChainStepV1[] {
  const matched = new Set(matchedBadgeIds);
  return CHAIN_DEFINITIONS
    .map((definition): MoralLivingSubstrateProceduralChainStepV1 | null => {
      const fromPresent = matched.has(definition.fromBadgeId);
      const toPresent = matched.has(definition.toBadgeId);
      if (!fromPresent && !toPresent) return null;

      const missingEvidence = [
        fromPresent ? null : definition.missingEvidenceByBadgeId?.from ?? definition.fromBadgeId,
        toPresent ? null : definition.missingEvidenceByBadgeId?.to ?? definition.toBadgeId,
      ].filter((entry): entry is string => Boolean(entry));

      return {
        fromBadgeId: definition.fromBadgeId,
        toBadgeId: definition.toBadgeId,
        transitionLabel: definition.transitionLabel,
        proceduralClaim: definition.proceduralClaim,
        evidenceStrength: fromPresent && toPresent ? "present" : "partial",
        missingEvidence,
        forbiddenOverclaim: definition.forbiddenOverclaim,
      };
    })
    .filter((step): step is MoralLivingSubstrateProceduralChainStepV1 => Boolean(step));
}

export function deriveLivingSubstrateProceduralLayer(input: {
  prompt: string;
  exactMatches: MoralLivingSubstrateMatchV1[];
  likelyMatches: MoralLivingSubstrateMatchV1[];
}): {
  derivations: MoralLivingSubstrateProceduralDerivationV1[];
  proceduralChain: MoralLivingSubstrateProceduralChainStepV1[];
  synthesisPath: MoralLivingSubstrateSynthesisStepV1[];
} {
  const promptText = normalize(input.prompt);
  const matchedBadgeIds = unique([...input.exactMatches, ...input.likelyMatches].map((match) => match.badgeId));
  const derivations = DERIVATION_DEFINITIONS
    .map((definition): MoralLivingSubstrateProceduralDerivationV1 | null => {
      const definitionMatchedBadgeIds = definition.triggerBadgeIds.filter((badgeId) => matchedBadgeIds.includes(badgeId));
      const hasTermHit = definition.triggerTerms.some((term) => promptText.includes(normalize(term)));
      if (definitionMatchedBadgeIds.length === 0 && !hasTermHit) return null;
      const { triggerBadgeIds: _triggerBadgeIds, triggerTerms: _triggerTerms, ...derivation } = definition;
      return {
        ...derivation,
        matchedBadgeIds: definitionMatchedBadgeIds,
        evidenceStrength: strengthFor(definition, matchedBadgeIds, promptText),
      };
    })
    .filter((derivation): derivation is MoralLivingSubstrateProceduralDerivationV1 => Boolean(derivation));
  const proceduralChain = deriveProceduralChain(matchedBadgeIds);

  const synthesisPath: MoralLivingSubstrateSynthesisStepV1[] = [
    {
      stepId: "substrate_observation",
      label: "Substrate Observation",
      description: "Start from matched living-system badges and mechanism boundaries before importing human-only moral categories.",
      derivedFrom: matchedBadgeIds,
      outputKind: "substrate_observation",
    },
    {
      stepId: "vulnerability_dependency_agency_estimate",
      label: "Vulnerability / Dependency / Agency Estimate",
      description: "Estimate vulnerability, dependency, and agency from the procedural derivations rather than from a final status assumption.",
      derivedFrom: derivations.map((derivation) => derivation.derivationId),
      outputKind: "vulnerability_dependency_agency_estimate",
    },
    {
      stepId: "obligation_caution_forbidden_overclaim",
      label: "Obligation / Caution / Forbidden Overclaim",
      description: "Translate the estimate into provisional obligations, cautions, and explicit overclaim boundaries for the final model synthesis.",
      derivedFrom: derivations.map((derivation) => derivation.derivationId),
      outputKind: "obligation_caution_forbidden_overclaim",
    },
  ];

  return { derivations, proceduralChain, synthesisPath };
}
