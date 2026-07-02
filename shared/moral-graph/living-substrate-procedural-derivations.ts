import type {
  MoralLivingSubstrateMatchV1,
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

export function deriveLivingSubstrateProceduralLayer(input: {
  prompt: string;
  exactMatches: MoralLivingSubstrateMatchV1[];
  likelyMatches: MoralLivingSubstrateMatchV1[];
}): {
  derivations: MoralLivingSubstrateProceduralDerivationV1[];
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

  return { derivations, synthesisPath };
}
