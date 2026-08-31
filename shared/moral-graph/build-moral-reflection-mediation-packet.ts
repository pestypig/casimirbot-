import {
  MORAL_REFLECTION_MEDIATION_PACKET_ARTIFACT_ID,
  MORAL_REFLECTION_MEDIATION_PACKET_SCHEMA_VERSION,
  MORAL_REFLECTION_OBJECTIVE_SOURCE_OPTIONS,
  type MoralReflectionMediationPacketV1,
  type MoralReflectionMediationStepV1,
} from "../contracts/moral-reflection-mediation-packet.v1";
import type { SharedAuthoritySocialRenewalReflectionV1 } from "../contracts/shared-authority-social-renewal.v1";

type StepDefinition = Omit<MoralReflectionMediationStepV1, "missingEvidence" | "priority" | "relevanceReasons"> & {
  fallbackMissingEvidence: string[];
  scenarioCues: RegExp;
  requiresScenarioCue?: boolean;
};

const STEP_DEFINITIONS: readonly StepDefinition[] = [
  {
    id: "observation_claim_boundary",
    question: "Which details are observed, reported, alleged, inferred, or value judgments, and which require external verification?",
    supportingDomainIds: ["situated_knowledge_plurality"],
    supportingTensionIds: [],
    fallbackMissingEvidence: ["observation_sources", "claim_provenance", "independent_verification", "inference_boundaries"],
    scenarioCues: /\b(?:observ(?:e|ed|ation)|report(?:ed)?|alleg(?:e|ed|ation)|claim(?:ed)?|unknown|assum(?:e|ed|ption)|no current position|not present|absent|source|verify|fact)\b/i,
  },
  {
    id: "objective_source_attribution",
    question: "Is the objective declared by a person, inferred from conduct, prescribed by a role, incentivized by an institution, mutually reinforced, or still unknown?",
    supportingDomainIds: ["cost_and_instrumentalization", "inherited_continuity_and_constraint"],
    supportingTensionIds: ["shared_purpose_vs_instrumentalization"],
    fallbackMissingEvidence: ["declared_objective", "role_duties", "institutional_incentives", "objective_source"],
    scenarioCues: /\b(?:objective|ambition|goal|purpose|request(?:ed|s)?|incentiv(?:e|ed|izes?)|reward(?:ed|s)?|role|order|hierarch(?:y|ical)|preserv(?:e|ing)|succession|mandate)\b/i,
  },
  {
    id: "instrumentalization_ledger",
    question: "Who contributes risk, labor, loyalty, legitimacy, attention, or data; who defines the future produced; and what reciprocal benefit, consent, voice, or exit exists?",
    supportingDomainIds: ["cost_and_instrumentalization", "protected_person_agency"],
    supportingTensionIds: ["shared_purpose_vs_instrumentalization", "protected_future_vs_protected_person_agency"],
    fallbackMissingEvidence: ["inputs_and_costs", "decision_authorship", "beneficiaries", "consent_voice_exit", "reciprocal_return"],
    scenarioCues: /\b(?:material|input|cost|sacrifice|danger|labor|loyalty|legitimacy|benefit|burden|consent|voice|exit|convert(?:ed|s|ing)?|instrumentaliz(?:e|ed|ation))\b/i,
  },
  {
    id: "perspective_power_and_asymmetry",
    question: "What is the strongest supportable consideration for each affected perspective, and which differences in power, exposure, or agency make simple symmetry misleading?",
    supportingDomainIds: ["situated_knowledge_plurality", "shared_governance_and_decision_rights"],
    supportingTensionIds: ["earned_expertise_vs_exclusive_sovereignty", "inherited_continuity_vs_personal_constraint"],
    fallbackMissingEvidence: ["affected_perspectives", "situated_knowledge", "power_asymmetry", "risk_exposure", "decision_access"],
    scenarioCues: /\b(?:powerful|power asymmetry|public figure|audience|amplif(?:y|ied|ication)|rank|status|young|absent|exposure|affected|perspective|decision access|restricted)\b/i,
  },
  {
    id: "developmental_freedom",
    question: "Can a person revise a prior position, contradict an assigned role, dissent, or leave without that change automatically becoming hypocrisy or betrayal?",
    supportingDomainIds: ["role_projection_and_personhood", "dissent_and_separation", "leadership_lifecycle_and_succession"],
    supportingTensionIds: ["love_and_role_vs_independent_purpose", "renewal_vs_replacement"],
    fallbackMissingEvidence: ["present_position", "revision_evidence", "independent_purpose", "feasible_exit", "retaliation_risk"],
    scenarioCues: /\b(?:previous|earlier|past|current position|present position|grow|growth|develop(?:ment|ing)?|revis(?:e|ed|ion)|change(?:d)?|dissent|leave|leaving|departure|separation|betrayal|hypocri(?:sy|te|tical))\b/i,
  },
  {
    id: "ai_mediated_judgment",
    question: "Does AI help investigate, translate, or mediate the disagreement, or does the prompt presuppose a verdict and borrow AI authority to ridicule, shame, or permanently identify a person?",
    supportingDomainIds: ["role_projection_and_personhood", "protected_person_agency"],
    supportingTensionIds: ["love_and_role_vs_independent_purpose"],
    fallbackMissingEvidence: ["prompted_conclusion", "requested_audience_effect", "opportunity_to_respond", "developmental_context", "ai_authority_claim"],
    scenarioCues: /\b(?:AI|artificial intelligence|LLM|Grok|chatbot|model)\b|\b(?:roast|ridicule|mock|shame|pile-on|presuppos(?:e|ed|es)|borrowed authority)\b/i,
    requiresScenarioCue: true,
  },
] as const;

const unique = (values: string[]): string[] => [...new Set(values)];

export function buildMoralReflectionMediationPacketV1(
  reflection: SharedAuthoritySocialRenewalReflectionV1,
  options: { text?: string } = {},
): MoralReflectionMediationPacketV1 {
  const domainById = new Map(reflection.domains.map((domain) => [domain.id, domain]));
  const tensionById = new Map(reflection.tensions.map((tension) => [tension.id, tension]));
  const scenarioText = options.text?.trim() ?? "";
  const theoryBridgeCue = /\b(?:coherence lifetime|boundary-sensitive|natural selection|heritable|molecular structure|dielectric environment|collective mode|physical process|physical mechanism|biological process|moral proof|analogy)\b/i.test(scenarioText);
  const externalVerificationCue = /\b(?:recently|latest|episode\s+\d+|tweet|twitter|public post|acquisition|security concern|according to|reported that|what happened)\b/i.test(scenarioText);
  const evidenceOrderBoundary: MoralReflectionMediationPacketV1["evidenceOrderBoundary"] = theoryBridgeCue
    ? {
        kind: "theory_ideology_bridge_first",
        reason: "The scenario crosses from a physical or biological claim into moral procedure; the physical claim and analogy boundary must be established before moral synthesis.",
        requiredBeforeStrongClaim: [
          "physical_claim_maturity_and_replication",
          "supported_cross_domain_mapping",
          "naturalistic_fallacy_boundary",
        ],
        advisory_only: true,
      }
    : externalVerificationCue
      ? {
          kind: "external_verification_first",
          reason: "The scenario contains externally checkable event or source claims that should be verified before they carry moral weight.",
          requiredBeforeStrongClaim: ["source_identity", "event_freshness", "claim_and_inference_separation"],
          advisory_only: true,
        }
      : {
          kind: "moral_scenario_ready",
          reason: "The supplied scenario can enter procedural moral reflection while its unresolved observations and intentions remain explicitly bounded.",
          requiredBeforeStrongClaim: ["scenario_observation_boundaries"],
          advisory_only: true,
        };
  const priorityRank = { primary: 0, supporting: 1, available: 2 } as const;
  const steps = STEP_DEFINITIONS.map((definition, definitionIndex): MoralReflectionMediationStepV1 & { definitionIndex: number } => {
    const cueMatched = scenarioText.length > 0 && (
      definition.scenarioCues.test(scenarioText) ||
      (theoryBridgeCue && definition.id === "observation_claim_boundary")
    );
    const inScopeDomains = definition.supportingDomainIds.filter((id) => domainById.get(id)?.status === "in_scope");
    const inScopeTensions = definition.supportingTensionIds.filter((id) => tensionById.get(id)?.status === "in_scope");
    const priority: MoralReflectionMediationStepV1["priority"] = cueMatched
      ? "primary"
      : !theoryBridgeCue && !definition.requiresScenarioCue && (inScopeDomains.length || inScopeTensions.length)
        ? "supporting"
        : "available";
    return {
      id: definition.id,
      question: definition.question,
      priority,
      relevanceReasons: [
        ...(cueMatched ? ["explicit_scenario_cue"] : []),
        ...inScopeDomains.map((id) => `in_scope_domain:${id}`),
        ...inScopeTensions.map((id) => `in_scope_tension:${id}`),
      ],
      supportingDomainIds: [...definition.supportingDomainIds],
      supportingTensionIds: [...definition.supportingTensionIds],
      missingEvidence: unique([
        ...definition.supportingDomainIds.flatMap((id) => domainById.get(id)?.missingEvidence ?? []),
        ...definition.fallbackMissingEvidence,
      ]),
      definitionIndex,
    };
  })
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.definitionIndex - b.definitionIndex)
    .map(({ definitionIndex: _definitionIndex, ...step }) => step);

  return {
    artifactId: MORAL_REFLECTION_MEDIATION_PACKET_ARTIFACT_ID,
    schemaVersion: MORAL_REFLECTION_MEDIATION_PACKET_SCHEMA_VERSION,
    generatedAt: reflection.generatedAt,
    reflectionId: reflection.reflectionId,
    purpose:
      "Carry the Moral Graph's evidence boundaries and mediation questions into post-observation reasoning without supplying a verdict or inferring intent.",
    objectiveSourceOptions: [...MORAL_REFLECTION_OBJECTIVE_SOURCE_OPTIONS],
    objectiveSourceStatus: "unresolved",
    evidenceOrderBoundary,
    steps,
    synthesisProtocol: [
      "Separate observed events and sourced claims from allegations, inference, and value judgment.",
      "Attribute an objective to a person, role, or institution only when the evidence supports that source; otherwise keep it unresolved.",
      "State the strongest supportable consideration for affected perspectives without manufacturing equal power, evidence, or responsibility.",
      "Trace costs, benefits, decision rights, consent, voice, and exit before describing instrumentalization.",
      "Preserve developmental freedom: a previous position can invite accountability without becoming a permanent identity.",
      "Treat AI output as mediated analysis, not borrowed moral authority, and answer the user's requested form rather than dumping badge labels.",
    ],
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      agent_executable: false,
      diagnostic_only: true,
      evidence_only: true,
      no_moral_verdict: true,
      no_intent_inference: true,
      no_character_identity_claim: true,
      no_legitimacy_inference: true,
    },
  };
}
