import {
  CIVIC_ORDER_PARTICIPATION_ARTIFACT_ID,
  CIVIC_ORDER_PARTICIPATION_SCHEMA_VERSION,
  type CivicAccountabilityChannelV1,
  type CivicActorRoleV1,
  type CivicAllocationChannelV1,
  type CivicAuthorityChannelV1,
  type CivicConsentStateV1,
  type CivicEntryModeV1,
  type CivicNormSourceV1,
  type CivicNormStatusV1,
  type CivicOrderParticipationV1,
  type CivicOrderScaleV1,
  type CivicParticipationFunctionV1,
} from "../contracts/civic-order-participation.v1";

export type BuildCivicOrderParticipationInput = {
  text: string;
  refs?: string[];
  activatedBadgeIds?: string[];
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const normalizedRefs = (refs: string[] | undefined): string[] =>
  unique((refs ?? []).filter((ref) => ref.trim().length > 0));

const ROLE_RULES: ReadonlyArray<{ role: CivicActorRoleV1; cue: RegExp }> = [
  { role: "resident", cue: /\b(?:resident|citizen|inhabitant)\b/i },
  { role: "worker", cue: /\b(?:worker|employee|laborer)\b/i },
  { role: "tenant", cue: /\b(?:tenant|renter|roommate)\b/i },
  { role: "owner", cue: /\b(?:owner|landlord|shareholder)\b/i },
  { role: "consumer", cue: /\b(?:consumer|customer|buyer)\b/i },
  { role: "recipient", cue: /\b(?:recipient|beneficiary)\b/i },
  { role: "member", cue: /\b(?:member|participant)\b/i },
  { role: "steward", cue: /\b(?:steward|trustee)\b/i },
  { role: "official", cue: /\b(?:official|administrator|representative)\b/i },
  { role: "enforcer", cue: /\b(?:enforcer|police|inspector)\b/i },
  { role: "dissenter", cue: /\b(?:dissenter|protester|objector)\b/i },
  { role: "outsider_affected", cue: /\b(?:outsider|nonmember|downstream affected)\b/i },
];

const FUNCTION_RULES: ReadonlyArray<{ value: CivicParticipationFunctionV1; cue: RegExp }> = [
  { value: "subject_to_norm", cue: /\b(?:subject to|bound by|must comply|under the rule)\b/i },
  { value: "uses_system", cue: /\b(?:uses?|relies on|depends on|participates in) (?:the )?(?:system|service|order|market|institution)\b/i },
  { value: "contributes_resources", cue: /\b(?:pays?|contributes?|provides?) (?:rent|tax|fees?|labor|resources?)\b/i },
  { value: "receives_benefit", cue: /\b(?:receives?|benefits? from|uses public|receives service)\b/i },
  { value: "votes_or_deliberates", cue: /\b(?:votes?|deliberates?|public hearing|assembly)\b/i },
  { value: "owns_or_governs", cue: /\b(?:owns?|governs?|board member|cooperative member)\b/i },
  { value: "administers", cue: /\b(?:administers?|manages? the program)\b/i },
  { value: "enforces", cue: /\b(?:enforces?|polices?|sanctions?)\b/i },
  { value: "contests", cue: /\b(?:contests?|appeals?|dissents?|protests?|challenges?)\b/i },
  { value: "attempts_exit", cue: /\b(?:attempts? to exit|tries? to leave|withdraws?|emigrates?)\b/i },
];

const ALLOCATION_RULES: ReadonlyArray<{ channel: CivicAllocationChannelV1; cue: RegExp }> = [
  { channel: "market_price", cue: /\b(?:market price|price signal|buy|sell)\b/i },
  { channel: "private_contract", cue: /\b(?:private contract|lease|employment contract)\b/i },
  { channel: "democratic_budget", cue: /\b(?:democratic budget|participatory budget|voted budget)\b/i },
  { channel: "public_provision", cue: /\b(?:public provision|public service|municipal service)\b/i },
  { channel: "administrative_plan", cue: /\b(?:administrative plan|state plan|central plan)\b/i },
  { channel: "cooperative_governance", cue: /\b(?:cooperative|worker governed|member governed)\b/i },
  { channel: "commons_stewardship", cue: /\b(?:commons|common resource|shared stewardship)\b/i },
  { channel: "household_allocation", cue: /\b(?:household allocation|family budget|shared household)\b/i },
  { channel: "mutual_aid", cue: /\bmutual aid\b/i },
  { channel: "rationing", cue: /\bration(?:ing|ed)?\b/i },
];

const AUTHORITY_RULES: ReadonlyArray<{ channel: CivicAuthorityChannelV1; cue: RegExp }> = [
  { channel: "property_control", cue: /\b(?:property owner|ownership control|landlord)\b/i },
  { channel: "contract_authority", cue: /\b(?:contract authority|lease|terms of service)\b/i },
  { channel: "electoral_authority", cue: /\b(?:elected|election|mayor|council)\b/i },
  { channel: "legislative_authority", cue: /\b(?:legislature|legislative|statute)\b/i },
  { channel: "administrative_authority", cue: /\b(?:agency|administrative authority|regulator)\b/i },
  { channel: "party_hierarchy", cue: /\b(?:party hierarchy|party directive)\b/i },
  { channel: "professional_expertise", cue: /\b(?:professional expertise|expert authority)\b/i },
  { channel: "customary_authority", cue: /\b(?:customary authority|tradition|elder)\b/i },
  { channel: "platform_control", cue: /\b(?:platform control|platform rule|algorithmic moderation)\b/i },
];

const ACCOUNTABILITY_RULES: ReadonlyArray<{ channel: CivicAccountabilityChannelV1; cue: RegExp }> = [
  { channel: "competition", cue: /\bcompetition\b/i },
  { channel: "exit", cue: /\b(?:exit|leave|switch provider|move away)\b/i },
  { channel: "election", cue: /\b(?:election|vote out)\b/i },
  { channel: "recall", cue: /\brecall (?:vote|election|process)\b/i },
  { channel: "court_or_appeal", cue: /\b(?:court|appeal|tribunal)\b/i },
  { channel: "independent_audit", cue: /\b(?:independent audit|oversight body)\b/i },
  { channel: "union_or_worker_governance", cue: /\b(?:union|worker governance|works council)\b/i },
  { channel: "cooperative_review", cue: /\b(?:cooperative review|member review)\b/i },
  { channel: "community_mediation", cue: /\b(?:community mediation|mediator)\b/i },
  { channel: "public_transparency", cue: /\b(?:public transparency|open records|published reasons)\b/i },
  { channel: "internal_discipline", cue: /\b(?:internal discipline|disciplinary process)\b/i },
];

const detectScales = (text: string): CivicOrderScaleV1[] => {
  const rules: Array<[CivicOrderScaleV1, RegExp]> = [
    ["household", /\b(?:household|family|roommate|rent)\b/i],
    ["workplace", /\b(?:workplace|worker|employee|employer|firm)\b/i],
    ["neighborhood", /\b(?:neighborhood|local community)\b/i],
    ["municipality", /\b(?:municipality|city|mayor|council)\b/i],
    ["region", /\b(?:region|province|state government)\b/i],
    ["polity", /\b(?:polity|nation|country|society|civilization)\b/i],
    ["trade_interface", /\b(?:trade|cross[-\s]?border|international|jurisdiction interface)\b/i],
  ];
  return rules.filter(([, cue]) => cue.test(text)).map(([scale]) => scale);
};

const detectEntryMode = (text: string): CivicEntryModeV1 => {
  if (/\b(?:born into|by birth)\b/i.test(text)) return "birth";
  if (/\b(?:migrat|immigrat|emigrat)\w*\b/i.test(text)) return "migration";
  if (/\b(?:employ|job|workplace)\w*\b/i.test(text)) return "employment";
  if (/\b(?:contract|lease|agreement)\b/i.test(text)) return "contract";
  if (/\b(?:member|membership|joined)\b/i.test(text)) return "membership";
  if (/\b(?:resident|residence|lives? in)\b/i.test(text)) return "residence";
  return "unknown";
};

// Consent is only classified from explicit language. Participation, payment,
// residence, use, and compliance never imply it.
const detectConsentState = (text: string): CivicConsentStateV1 => {
  if (/\b(?:explicitly consent(?:ed|s)?|gave informed consent|freely agreed)\b/i.test(text)) return "explicit";
  if (/\b(?:informed but constrained|agreed under constraint)\b/i.test(text)) return "informed_but_constrained";
  if (/\b(?:necessity[-\s]?bound|no affordable alternative|must participate to survive)\b/i.test(text)) return "necessity_bound";
  if (/\b(?:was coerced|coercion|forced to participate)\b/i.test(text)) return "coerced";
  if (/\b(?:contests? consent|does not consent|withholds? consent)\b/i.test(text)) return "contested";
  return "unknown";
};

const detectNormSource = (text: string): CivicNormSourceV1 => {
  if (/\bplatform rule\b/i.test(text)) return "platform_rule";
  if (/\bparty directive\b/i.test(text)) return "party_directive";
  if (/\bassociation rule\b/i.test(text)) return "association_rule";
  if (/\badministrative rule\b/i.test(text)) return "administrative_rule";
  if (/\b(?:law|statute|ordinance)\b/i.test(text)) return "law";
  if (/\bmarket rule\b/i.test(text)) return "market_rule";
  if (/\b(?:contract|lease)\b/i.test(text)) return "contract";
  if (/\bpeer expectation\b/i.test(text)) return "peer_expectation";
  return "custom";
};

const detectNormStatus = (text: string): CivicNormStatusV1 => {
  if (/\b(?:obsolete|drifting|outdated)\b/i.test(text)) return "obsolete_or_drifting";
  if (/\b(?:contested|challenged|dissented)\b/i.test(text)) return "contested";
  if (/\b(?:enforced|sanctioned|penalty)\b/i.test(text)) return "enforced";
  if (/\b(?:codified|written rule|law)\b/i.test(text)) return "codified";
  if (/\b(?:expected|should conform|social expectation)\b/i.test(text)) return "expected";
  return "descriptive";
};

export function buildCivicOrderParticipationV1(
  input: BuildCivicOrderParticipationInput,
): CivicOrderParticipationV1 | null {
  const text = input.text.trim();
  const relevant = /\b(?:participat|consent|compliance|conform|dissent|civic order|social order|economic order|inherited system|voice|feasible exit|legitimacy|tenant|worker|resident|coercion|ideology|capitalism|socialism|communism)\w*\b/i.test(text);
  if (!relevant) return null;

  const refs = normalizedRefs(input.refs);
  const roles = ROLE_RULES.filter(({ cue }) => cue.test(text)).map(({ role }) => role);
  const functions = FUNCTION_RULES.filter(({ cue }) => cue.test(text)).map(({ value }) => value);
  const scalePath = detectScales(text);
  const allocationChannels = ALLOCATION_RULES.filter(({ cue }) => cue.test(text)).map(({ channel }) => ({ channel, role: "unknown" as const, evidenceRefs: refs }));
  const authorityChannels = AUTHORITY_RULES.filter(({ cue }) => cue.test(text)).map(({ channel }) => ({ channel, role: "unknown" as const, evidenceRefs: refs }));
  const accountabilityChannels = ACCOUNTABILITY_RULES.filter(({ cue }) => cue.test(text)).map(({ channel }) => ({ channel, role: "unknown" as const, evidenceRefs: refs }));
  const declaredLabels = unique([
    ...(/\bcapitalis(?:m|t)\b/i.test(text) ? ["capitalism"] : []),
    ...(/\b(?:democratic socialism|socialis(?:m|t))\b/i.test(text) ? ["socialism"] : []),
    ...(/\b(?:state communism|communis(?:m|t))\b/i.test(text) ? ["communism"] : []),
  ]);
  const normMentioned = /\b(?:norm|custom|expectation|rule|law|contract|conform|compliance)\w*\b/i.test(text);
  const crossJurisdiction = /\b(?:cross[-\s]?border|international|trade interface|between jurisdictions)\b/i.test(text);
  const activatedBadgeIds = unique([
    ...(input.activatedBadgeIds ?? []),
    "participation-consent-separation",
    ...(/\b(?:born into|inherited|raised in|socialized into)\b/i.test(text) ? ["inherited-order-participation"] : []),
    ...(normMentioned ? ["proximity-norm-reciprocity"] : []),
    ...(/\b(?:voice|exit|appeal|contest|retaliation|repair|re[-\s]?entry)\w*\b/i.test(text) ? ["voice-exit-contestability"] : []),
    ...(/\b(?:legitimacy|popular|adherence|compliance|stable order)\w*\b/i.test(text) ? ["adherence-legitimacy-separation"] : []),
    ...(allocationChannels.length + authorityChannels.length + accountabilityChannels.length > 1 || declaredLabels.length > 0 ? ["coordination-pluralism"] : []),
  ]);

  return {
    artifactId: CIVIC_ORDER_PARTICIPATION_ARTIFACT_ID,
    schemaVersion: CIVIC_ORDER_PARTICIPATION_SCHEMA_VERSION,
    scalePath,
    actors: [{
      id: "civic-actor:prompt-subject",
      roles: unique(roles),
      participationFunctions: unique(functions),
      consentState: detectConsentState(text),
      dependencyContext: /\b(?:depend|need|cannot afford|no alternative|housing|work|transport|food)\w*\b/i.test(text)
        ? ["dependency_mentioned_requires_bounded_evidence"]
        : [],
      alternatives: [],
      evidenceRefs: refs,
    }],
    orderInheritance: {
      entryMode: detectEntryMode(text),
      maturationContext: /\b(?:raised|learned|socialized|conditioning|custom)\w*\b/i.test(text)
        ? ["maturation_or_learning_context_mentioned"]
        : [],
      learnedNormSources: normMentioned ? [detectNormSource(text)] : [],
      alternativesAtEntry: [],
      presentChosenPosition: null,
    },
    localNorms: normMentioned
      ? [{
          id: "civic-norm:observed",
          description: "Norm mentioned in prompt; exact wording and scope require evidence.",
          source: detectNormSource(text),
          status: detectNormStatus(text),
          scope: scalePath,
          affectedParties: [],
          sharedProximityEffects: [],
          enforcementChannels: [],
          exceptions: [],
          dissentPath: /\b(?:dissent|contest|appeal)\w*\b/i.test(text) ? "mentioned_not_verified" : null,
          reviewAt: null,
          evidenceRefs: refs,
        }]
      : [],
    coordinationProfile: {
      declaredLabels,
      declaredLabelsAreNonAuthoritative: true,
      allocationChannels,
      authorityChannels,
      accountabilityChannels,
    },
    participationConditions: {
      voicePath: /\b(?:voice path|hearing|deliberat|vote)\w*\b/i.test(text) ? "mentioned_not_verified" : null,
      formalExitPath: /\b(?:formal exit|may leave|right to exit|can exit)\b/i.test(text) ? "mentioned_not_verified" : null,
      feasibleExitEvidence: /\b(?:affordable alternative|feasible exit|can afford to leave)\b/i.test(text) ? refs : [],
      contestabilityPath: /\b(?:appeal|contest|challenge|court)\w*\b/i.test(text) ? "mentioned_not_verified" : null,
      retaliationRisks: /\b(?:retaliation|sanction|punishment|reprisal)\w*\b/i.test(text) ? ["retaliation_risk_mentioned"] : [],
      repairPath: /\brepair path\b/i.test(text) ? "mentioned_not_verified" : null,
      reentryPath: /\bre[-\s]?entry path\b/i.test(text) ? "mentioned_not_verified" : null,
    },
    supportSignals: [
      ...(/\bendorse\w*\b/i.test(text) ? [{ actorId: "civic-actor:prompt-subject", signal: "endorsement" as const, description: "Endorsement is asserted but remains descriptive.", evidenceRefs: refs }] : []),
      ...(/\b(?:compl(?:y|ies|ied|iance)|conform)\w*\b/i.test(text) ? [{ actorId: "civic-actor:prompt-subject", signal: "compliance" as const, description: "Compliance is observed without inferring endorsement or legitimacy.", evidenceRefs: refs }] : []),
      ...(/\bdepend\w*\b/i.test(text) ? [{ actorId: "civic-actor:prompt-subject", signal: "dependence" as const, description: "Dependence is observed without inferring loyalty or consent.", evidenceRefs: refs }] : []),
      ...(/\bdissent\w*\b/i.test(text) ? [{ actorId: "civic-actor:prompt-subject", signal: "dissent" as const, description: "Dissent can coexist with participation.", evidenceRefs: refs }] : []),
    ],
    jurisdictionInterfaces: crossJurisdiction
      ? [{
          interfaceId: "civic-jurisdiction-interface:observed",
          fromJurisdiction: "requires_source_jurisdiction",
          toJurisdiction: "requires_destination_jurisdiction",
          exchangedFunctions: [],
          governingChannels: [],
          disputePath: null,
          exitOrContinuityPath: null,
          evidenceRefs: refs,
        }]
      : [],
    activatedBadgeIds,
    missingEvidence: unique([
      "actor_identity_and_role_scope",
      "participation_function_evidence",
      "consent_statement_or_unknown",
      "dependency_and_alternative_map",
      "voice_exit_and_contestability_paths",
      ...(normMentioned ? ["norm_scope_and_enforcement", "affected_parties_and_exceptions"] : []),
      ...(declaredLabels.length > 0 ? ["observable_allocation_authority_and_accountability_channels"] : []),
      ...(crossJurisdiction ? ["jurisdiction_parties", "exchange_terms", "dispute_and_continuity_paths"] : []),
    ]),
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      agent_executable: false,
      moral_finality: false,
      policy_finality: false,
      legitimacy_finality: false,
      consent_inference: false,
      ideology_rank: false,
      global_order_score_allowed: false,
    },
  };
}
