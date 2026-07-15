import {
  buildProceduralMoralClassificationV1,
  type ProceduralMoralClassificationEntryV1,
  type ProceduralMoralClassificationV1,
} from "../procedural-moral-classification";
import type { IdeologyContextReflectionV1 } from "../ideology-context-reflection";
import type { IdeologyGraph } from "./ideology-graph-types";
import { CIVIC_ORDER_PROCEDURAL_RULES } from "./procedural-rules/civic-order-rules";
import { PROVISIONING_PROCEDURAL_RULES } from "./procedural-rules/provisioning-rules";
import type { ProceduralMoralPatternRule } from "./procedural-rules/procedural-rule-types";

export type ClassifyProceduralMoralContextInput = {
  graph: IdeologyGraph;
  reflection: IdeologyContextReflectionV1;
  text: string;
  generatedAt?: string;
  classificationId?: string;
};

const PROCEDURAL_MORAL_PATTERN_RULES: readonly ProceduralMoralPatternRule[] = [
  {
    id: "comparison-pressure",
    cues: [/\b(?:lost|behind|past|used to be|world moved on|where have you been|where have u been)\b/i],
    observedPattern: "comparison_pressure",
    moralRootId: "comparison-pressure-and-equanimity",
    proceduralMove: "separate_observation_from_story",
    explanation:
      "Comparison pressure is treated as a signal to separate present observation from a stale self-story before deciding what changed.",
    missingEvidence: ["present_observation_that_shows_what_changed", "concrete_next_practice"],
    warnings: ["avoid_identity_lock", "avoid_final_self_story"],
    reasonCodes: ["comparison_pressure", "impermanence_revision"],
  },
  {
    id: "rumination-loop",
    cues: [/\b(?:rumination|ruminating|loop|non[-\s]?growth|perpetuat(?:e|ing)|leads nowhere|old)\b/i],
    observedPattern: "rumination_loop",
    moralRootId: "rumination-to-practice",
    proceduralMove: "convert_reflection_to_experiment",
    explanation:
      "A repeated reflection loop becomes useful when it produces a bounded practice, test, repair step, or review trigger.",
    missingEvidence: ["bounded_experiment_or_practice", "review_trigger"],
    warnings: ["reflection_is_not_itself_understanding"],
    reasonCodes: ["rumination_loop", "right_effort"],
  },
  {
    id: "information-overload",
    cues: [/\b(?:too much information|overwhelm(?:ed|ing)?|dysregulated|dis regulated|tainted lens|take in too much)\b/i],
    observedPattern: "information_overload",
    moralRootId: "mindful-consumption",
    proceduralMove: "reduce_input_noise",
    explanation:
      "Information intake is classified as a practice condition: reduce noise, preserve useful signals, and test what clarifies versus destabilizes.",
    missingEvidence: ["which_inputs_clarify", "which_inputs_destabilize"],
    warnings: ["avoid_single_channel_certainty"],
    reasonCodes: ["mindful_consumption", "middle_way"],
  },
  {
    id: "practice-commitment",
    cues: [/\b(?:falsifiable|experiment(?:al|ation)?|test|bounds?|constraints?|core understanding|how things work)\b/i],
    observedPattern: "practice_commitment",
    moralRootId: "right-effort-loop",
    proceduralMove: "ask_for_concrete_evidence",
    explanation:
      "A claim about understanding is routed toward evidence, bounds, and a concrete test before confidence increases.",
    missingEvidence: ["falsifiable_check", "observation_refs"],
    warnings: ["do_not_treat_explanation_as_proof"],
    reasonCodes: ["falsifiability", "right_effort"],
  },
  {
    id: "ignorance-boundary",
    cues: [/\b(?:ignorance is bliss|ignorance|unknown|did not know|didn't know|not aware|unaware|not seen as wrong|not seeing it as wrong)\b/i],
    observedPattern: "ignorance_boundary",
    moralRootId: "ignorance-and-consideration",
    proceduralMove: "ask_what_was_reasonably_knowable",
    explanation:
      "Ignorance is classified as a responsibility boundary, not final innocence or final blame; ask what was known, signaled, or reasonably knowable.",
    missingEvidence: ["what_was_known", "what_was_reasonably_knowable", "warning_signs_or_available_evidence"],
    warnings: ["avoid_ignorance_as_permission", "avoid_guilt_as_identity_verdict"],
    reasonCodes: ["ignorance_boundary", "due_care_before_judgment"],
  },
  {
    id: "unconsidered-harm",
    cues: [/\b(?:not being considered|isn't being considered|not considered|consideration|inconsiderate|affected|well[-\s]?being|impact|consequence|blind spot)\b/i],
    observedPattern: "unconsidered_harm",
    moralRootId: "unseen-harm-inquiry",
    proceduralMove: "research_missing_considerations",
    explanation:
      "A possible unconsidered effect is routed toward research, affected-party context, and missing-consequence checks before moral confidence increases.",
    missingEvidence: ["affected_parties", "consequence_evidence", "missing_perspective_sources"],
    warnings: ["absence_of_visible_harm_is_not_no_harm"],
    reasonCodes: ["unseen_harm_inquiry", "consideration_debt"],
  },
  {
    id: "affected-party-omission",
    cues: [/\b(?:affected part(?:y|ies)|who may be affected|who is affected|stakeholders?|dependencies|downstream effects?)\b/i],
    observedPattern: "unconsidered_harm",
    moralRootId: "consideration-debt",
    proceduralMove: "identify_affected_parties",
    explanation:
      "A missing stakeholder or dependency is routed toward affected-party mapping before responsibility or repair language is strengthened.",
    missingEvidence: ["affected_party_map", "dependency_or_downstream_effects"],
    warnings: ["do_not_decide_from_single_viewpoint"],
    reasonCodes: ["affected_party_mapping", "consideration_debt"],
  },
  {
    id: "dependency-transparency-gate",
    cues: [
      /\b(?:hidden shared risk|late disclosure|shared obligation transparency|dependency risk disclosure)\b/i,
      /\b(?:tell them before damage compounds|shared obligation is at risk|materially depend)\b/i,
    ],
    observedPattern: "unconsidered_harm",
    moralRootId: "dependency-transparency-gate",
    proceduralMove: "identify_affected_parties",
    explanation:
      "Hidden dependency risk is routed toward naming who depends on timely disclosure, what risk is known, and what deadline preserves their ability to adapt.",
    missingEvidence: ["shared_dependency_context", "risk_disclosure_deadline", "contingency_or_repair_path"],
    warnings: ["avoid_late_disclosure_as_private_matter", "avoid_character_verdict"],
    reasonCodes: ["dependency_transparency_gate", "shared_obligation"],
  },
  {
    id: "agency-preserving-disclosure",
    cues: [
      /\b(?:stripped away agency|could not plan|withheld information|lost ability to adapt|planning harm)\b/i,
      /\b(?:silence would remove|choose, prepare, or protect|ability to choose|ability to prepare|ability to protect)\b/i,
    ],
    observedPattern: "unconsidered_harm",
    moralRootId: "agency-preserving-disclosure",
    proceduralMove: "identify_affected_parties",
    explanation:
      "Agency-preserving disclosure asks which choices become unavailable when information stays hidden from affected people.",
    missingEvidence: ["affected_choices", "response_time_window", "disclosure_scope"],
    warnings: ["avoid_treating_silence_as_private_when_options_are_controlled", "preserve_response_time"],
    reasonCodes: ["agency_preserving_disclosure", "planning_harm"],
  },
  {
    id: "guilt-signal",
    cues: [/\b(?:guilt|guilty|moral guilt|shame|blame|wrongdoing|wrong)\b/i],
    observedPattern: "guilt_signal",
    moralRootId: "guilt-to-repair",
    proceduralMove: "separate_guilt_from_repair",
    explanation:
      "Guilt is treated as a signal to separate feeling, evidence, responsibility tier, and repair question without issuing an identity judgment.",
    missingEvidence: ["evidence_of_effect", "repair_or_restraint_option", "user_confirmed_responsibility_frame"],
    warnings: ["avoid_self_punishment_loop", "avoid_character_verdict"],
    reasonCodes: ["guilt_to_repair", "repair_readiness"],
  },
  {
    id: "shame-avoidance-loop",
    cues: [
      /\b(?:shame[-\s]?avoidance loop|avoidance loop|hiding because of shame|too ashamed to disclose)\b/i,
      /\b(?:delaying conflict|compounding damage|shame delays truth|shame blocks repair)\b/i,
    ],
    observedPattern: "guilt_signal",
    moralRootId: "shame-avoidance-loop",
    proceduralMove: "separate_guilt_from_repair",
    explanation:
      "Shame-avoidance is treated as a repairable loop: separate self-image pain from the actionable truth and next repair step.",
    missingEvidence: ["shame_context", "repair_delay_cost", "actionable_truth"],
    warnings: ["avoid_shame_as_reason_to_hide", "avoid_self_image_as_repair"],
    reasonCodes: ["shame_avoidance_loop", "repair_readiness"],
  },
  {
    id: "fallout-transfer-check",
    cues: [
      /\b(?:fallout transfer|externalized fallout|shifted burden|transferred damage|cost of hiding)\b/i,
      /\b(?:drag others into the wake|shift(?:ed|ing)? cost|shift(?:ed|ing)? urgency|urgency onto others)\b/i,
    ],
    observedPattern: "unconsidered_harm",
    moralRootId: "fallout-transfer-check",
    proceduralMove: "identify_affected_parties",
    explanation:
      "Fallout transfer maps whether avoided responsibility has shifted cost, uncertainty, or urgency onto people who did not consent to carry it.",
    missingEvidence: ["transferred_burden_map", "affected_party_consent", "urgency_or_cost_shift"],
    warnings: ["avoid_delayed_conflict_as_reduced_harm", "avoid_externalized_fallout_without_consent"],
    reasonCodes: ["fallout_transfer_check", "consideration_debt"],
  },
  {
    id: "familiarity-anonymity-balance",
    cues: [
      /\b(?:familiarity[-\s]?anonymity balance|repeated contact|network overlap|newcomer access)\b/i,
      /\b(?:rural|urban|city|population density)\b[\s\S]{0,100}\b(?:patience|trust|moral|virtue|anonymity)\b/i,
    ],
    observedPattern: "unclear_evidence",
    moralRootId: "familiarity-anonymity-balance",
    proceduralMove: "ask_for_concrete_evidence",
    explanation:
      "Density and familiarity are treated as context variables; ask about repeated contact, network overlap, newcomer access, privacy, and alternatives before drawing a social conclusion.",
    missingEvidence: ["repeated_contact_context", "network_overlap", "newcomer_access", "privacy_and_exit_options", "service_alternatives"],
    warnings: ["avoid_density_essentialism", "avoid_familiarity_as_proof"],
    reasonCodes: ["familiarity_anonymity_balance", "density_is_context_not_verdict"],
  },
  {
    id: "trust-medium-translation",
    cues: [
      /\b(?:trust medium|trust channel|relational trust|institutional trust|community reputation)\b/i,
      /\b(?:personal promise|shared reputation|formal record|contract|financial record)\b[\s\S]{0,80}\b(?:trust|access|threshold)\b/i,
    ],
    observedPattern: "unclear_evidence",
    moralRootId: "trust-medium-translation",
    proceduralMove: "ask_for_concrete_evidence",
    explanation:
      "Trust-medium translation asks what trust channel is operating, what context is lost during translation, and which correction or appeal path remains.",
    missingEvidence: ["source_trust_channel", "destination_trust_channel", "dependency_scope", "translation_loss", "fallback_and_appeal_path"],
    warnings: ["avoid_contract_as_character", "avoid_financial_record_as_total_reputation"],
    reasonCodes: ["trust_medium_translation", "institutional_context_preservation"],
  },
  {
    id: "domain-bounded-accountability",
    cues: [
      /\b(?:domain[-\s]?bounded accountability|observer exposure|witness exposure|accountability domain)\b/i,
      /\b(?:credit score|financial history|reference|endorsement)\b[\s\S]{0,100}\b(?:character|worth|trustworthy|accountability)\b/i,
    ],
    observedPattern: "practice_commitment",
    moralRootId: "domain-bounded-accountability",
    proceduralMove: "ask_for_concrete_evidence",
    explanation:
      "Accountability evidence is restricted to the observed domain, exposure, parties, provenance, and time window rather than generalized into moral worth.",
    missingEvidence: ["accountability_domain", "observer_exposure", "time_window", "source_provenance", "dispute_or_correction_state", "repair_history"],
    warnings: ["avoid_financial_totalization", "avoid_cross_domain_character_claim"],
    reasonCodes: ["domain_bounded_accountability", "evidence_scope_required"],
  },
  {
    id: "contestable-reentry-threshold",
    cues: [
      /\b(?:contestable re[-\s]?entry|re[-\s]?entry threshold|appeal path|repair path|review date)\b/i,
      /\b(?:excluded|exclusion|denied access|rejected)\b[\s\S]{0,100}\b(?:criteria|appeal|repair|review|permanent|stigma)\b/i,
    ],
    observedPattern: "unconsidered_harm",
    moralRootId: "contestable-reentry-threshold",
    proceduralMove: "identify_affected_parties",
    explanation:
      "A consequential exclusion is converted from an identity label into a bounded access decision with visible criteria, reasons, appeal, repair, and review.",
    missingEvidence: ["published_threshold", "decision_reason", "supporting_evidence", "appeal_path", "repair_or_reentry_path", "review_or_sunset_date"],
    warnings: ["avoid_permanent_reject_identity", "avoid_stale_record_exclusion"],
    reasonCodes: ["contestable_reentry_threshold", "due_process_for_exclusion"],
  },
  {
    id: "willful-avoidance-risk",
    cues: [/\b(?:willful avoidance|avoiding knowing|refuse to know|don't want to know|do not want to know|look away|looked away|ignore warning|ignored warning)\b/i],
    observedPattern: "willful_avoidance_risk",
    moralRootId: "due-care-before-judgment",
    proceduralMove: "update_responsibility_tier",
    explanation:
      "Possible avoidance after a warning sign is routed to a responsibility-tier update and missing evidence review, not to an immediate moral verdict.",
    missingEvidence: ["warning_signs", "available_research_path", "reason_for_avoidance"],
    warnings: ["avoid_overclaiming_intent", "requires_user_confirmation"],
    reasonCodes: ["willful_avoidance_risk", "due_care"],
  },
  {
    id: "repair-readiness",
    cues: [/\b(?:repair|apology|accountability|make it right|changed practice|do differently|responsibility)\b/i],
    observedPattern: "repair_readiness",
    moralRootId: "moral-residue-after-awareness",
    proceduralMove: "route_to_repair_or_review",
    explanation:
      "After awareness changes the frame, route the next step toward inquiry, restraint, repair-readiness, or changed practice.",
    missingEvidence: ["what_changed_after_awareness", "affected_party_or_boundary", "repair_path"],
    warnings: ["do_not_skip_inquiry_before_repair_claim"],
    reasonCodes: ["moral_residue_after_awareness", "repair_readiness"],
  },
  {
    id: "identity-view",
    cues: [/\b(?:essence|who we are|who i am|identity|private language|brothers|own lens|own feelings toward self)\b/i],
    observedPattern: "identity_view",
    moralRootId: "identity-view-and-non-attachment",
    proceduralMove: "reframe_without_finality",
    explanation:
      "Identity language is held as a provisional lens, not a fixed verdict; restate it as observations and choices.",
    missingEvidence: ["observable_behavior_now", "user_confirmation_of_meaning"],
    warnings: ["avoid_character_fixedness", "preserve_user_confirmation"],
    reasonCodes: ["identity_view", "non_attachment"],
  },
  {
    id: "inherited-conditioning-check",
    cues: [/\b(?:conditioning check|is this my belief|cliche belief|inherited norm|belief origin|role pressure|stale self story)\b/i],
    observedPattern: "identity_view",
    moralRootId: "inherited-conditioning-check",
    proceduralMove: "reframe_without_finality",
    explanation:
      "Inherited conditioning is routed toward belief-origin separation: observed, inherited, imitated, pressured, stale, or chosen now.",
    missingEvidence: ["belief_origin_context", "current_observation", "chosen_commitment"],
    warnings: ["avoid_conditioning_as_disproof", "avoid_conditioning_as_final_authority"],
    reasonCodes: ["inherited_conditioning_check", "belief_origin"],
  },
  {
    id: "private-language-bond",
    cues: [/\b(?:private language|brothers|sandbox|from the outside|we were different)\b/i],
    observedPattern: "private_language_bond",
    moralRootId: "spiritual-friendship-mirror",
    proceduralMove: "preserve_uncertainty",
    explanation:
      "Relational mirroring can support practice when it keeps truth-telling, revision, and agency visible instead of preserving a closed myth.",
    missingEvidence: ["what_the_friendship_currently_helps_test", "where_the_mirror_could_become_closed"],
    warnings: ["avoid_closed_myth_loop"],
    reasonCodes: ["spiritual_friendship", "sangha_mirror"],
  },
  {
    id: "creative-expression",
    cues: [/\b(?:music|songs?|art|blues|message|world stage|stage|creative|taste)\b/i],
    observedPattern: "creative_expression",
    moralRootId: "art-as-skillful-means",
    proceduralMove: "choose_small_practice",
    explanation:
      "Creative material is treated as a possible skillful means: ask what it helps notice, heal, warn, or practice now.",
    missingEvidence: ["specific_expression_or_practice", "intended_helpful_effect"],
    warnings: ["avoid_treating_art_as_identity_trap"],
    reasonCodes: ["skillful_means", "creative_expression"],
  },
  {
    id: "healing-before-action",
    cues: [/\b(?:healing first|internal healing|heal(?:ing)?|live now|reflection warning|shadow)\b/i],
    observedPattern: "healing_before_action",
    moralRootId: "shadow-without-identification",
    proceduralMove: "route_to_repair_or_review",
    explanation:
      "Healing language is routed toward repair and grounded practice without making the past into a final identity.",
    missingEvidence: ["repair_or_practice_step", "what_would_show_less_suffering"],
    warnings: ["avoid_bypassing_needed_action"],
    reasonCodes: ["healing_before_action", "repair"],
  },
  {
    id: "aspiration-drift",
    cues: [/\b(?:ideals?|optimism|pursuit|ultimate and clear|growth|change|challenge(?:d|ing)? the world)\b/i],
    observedPattern: "aspiration_drift",
    moralRootId: "small-experiment-vow",
    proceduralMove: "choose_small_practice",
    explanation:
      "Large aspiration is grounded by selecting one small vow-like experiment that can survive contact with present conditions.",
    missingEvidence: ["small_next_practice", "review_timeframe"],
    warnings: ["avoid_grandiosity_or_collapse"],
    reasonCodes: ["aspiration", "small_experiment"],
  },
  {
    id: "purpose-as-inquiry",
    cues: [/\b(?:evidence based purpose|investigate the dream|purpose formation|personal passion public truth|future projection)\b/i],
    observedPattern: "aspiration_drift",
    moralRootId: "purpose-as-inquiry",
    proceduralMove: "choose_small_practice",
    explanation:
      "Purpose is classified as inquiry when the dream needs sources, a bounded test, evidence collection, and revision without shame.",
    missingEvidence: ["purpose_sources", "small_test", "revision_condition"],
    warnings: ["avoid_inspiration_as_proof", "avoid_uncertainty_as_abandonment"],
    reasonCodes: ["purpose_as_inquiry", "small_experiment"],
  },
  {
    id: "inspiration-without-imitation",
    cues: [/\b(?:idol worship|celebrity mirror|inspiration not imitation|social performance|approval seeking)\b/i],
    observedPattern: "identity_view",
    moralRootId: "inspiration-without-imitation",
    proceduralMove: "reframe_without_finality",
    explanation:
      "Inspiration is routed toward extracting the admired value while separating imitation, approval pressure, and chosen practice.",
    missingEvidence: ["admired_value", "imitation_pressure", "chosen_practice"],
    warnings: ["avoid_admiration_as_authority", "avoid_identity_surrender"],
    reasonCodes: ["inspiration_without_imitation", "values_over_images"],
  },
  {
    id: "goalpost-integrity",
    cues: [/\b(?:moving the goal post|goalpost moving|criteria drift|honest revision|revision boundary)\b/i],
    observedPattern: "practice_commitment",
    moralRootId: "goalpost-integrity",
    proceduralMove: "ask_for_concrete_evidence",
    explanation:
      "Goalpost changes are routed toward naming the old criterion, new criterion, and evidence that justifies revision.",
    missingEvidence: ["old_criterion", "new_criterion", "revision_evidence"],
    warnings: ["avoid_criteria_drift_as_proof", "avoid_conclusion_protection"],
    reasonCodes: ["goalpost_integrity", "falsifiability"],
  },
  {
    id: "recognition-before-transcendence",
    cues: [/\b(?:no one gets left behind|forgotten people|cultural difference|recognition path|who will not understand)\b/i],
    observedPattern: "unconsidered_harm",
    moralRootId: "recognition-before-transcendence",
    proceduralMove: "identify_affected_parties",
    explanation:
      "Recognition before transcendence maps affected agency, missing translation, and non-domination before inclusion or transcendence claims strengthen.",
    missingEvidence: ["affected_agency_map", "translation_gap", "non_domination_check"],
    warnings: ["avoid_assimilation_as_transcendence", "avoid_abandonment_as_transcendence"],
    reasonCodes: ["recognition_before_transcendence", "affected_agency"],
  },
  {
    id: "feedback-loop",
    cues: [/\b(?:feedback loop|self[-\s]?confirming|perpetual negative states|psychological traps?|non[-\s]?growth)\b/i],
    observedPattern: "feedback_loop",
    moralRootId: "feedback-loop-hygiene",
    proceduralMove: "check_for_feedback_loop",
    explanation:
      "A possible loop is routed toward signal checks, liveness checks, and a decision about what should be carried forward.",
    missingEvidence: ["independent_signal_check", "liveness_check"],
    warnings: ["avoid_closing_loop_on_stale_signal"],
    reasonCodes: ["feedback_loop_hygiene", "liveness"],
  },
  ...CIVIC_ORDER_PROCEDURAL_RULES,
  ...PROVISIONING_PROCEDURAL_RULES,
] as const;

function compactSummary(input: IdeologyContextReflectionV1): string {
  const kind = input.input.kind;
  const matchCount =
    input.matches.exact.length + input.matches.likely.length + input.matches.inferred_lenses.length;
  return `Procedural Moral classification for ${kind}; ${matchCount} ideology lens match(es) supplied as evidence.`;
}

function labelForNode(graph: IdeologyGraph, nodeId: string): string {
  return graph.nodeById.get(nodeId)?.title ?? nodeId.replace(/-/g, " ");
}

function evidenceRefsFor(input: ClassifyProceduralMoralContextInput): string[] {
  return Array.from(
    new Set([
      `ideology_context_reflection:${input.reflection.reflectionId}`,
      ...(input.reflection.input.refs ?? []),
    ]),
  );
}

function confidenceFor(rule: ProceduralMoralPatternRule, text: string, reflection: IdeologyContextReflectionV1): number {
  const cueHits = rule.cues.filter((cue) => cue.test(text)).length;
  const nodeHit = [
    ...reflection.matches.exact,
    ...reflection.matches.likely,
    ...reflection.matches.inferred_lenses,
    ...reflection.activated_traits,
  ].some((entry) => entry.nodeId === rule.moralRootId || entry.pathToRoot?.includes(rule.moralRootId));
  const raw = Math.min(0.95, 0.58 + cueHits * 0.12 + (nodeHit ? 0.12 : 0));
  return Math.round(raw * 100) / 100;
}

function buildRecommendedNextMoves(classifications: readonly ProceduralMoralClassificationEntryV1[]) {
  if (classifications.length === 0) {
    return [
      {
        id: "procedural-moral-action:ask-for-concrete-observation",
        label: "Ask for one concrete present observation.",
        description:
          "The classifier did not find a stable procedural pattern, so the next move is to separate observation from interpretation.",
        reasonCodes: ["missing_pattern", "direct_observation"],
      },
    ];
  }

  const moves = new Map<string, { label: string; description: string; reasonCodes: string[] }>();
  for (const classification of classifications) {
    if (classification.proceduralMove === "convert_reflection_to_experiment") {
      moves.set("procedural-moral-action:choose-small-experiment", {
        label: "Choose one bounded experiment.",
        description: "Convert repeated reflection into a small practice with a review trigger.",
        reasonCodes: ["rumination_to_practice", "right_effort"],
      });
    }
    if (classification.proceduralMove === "reduce_input_noise") {
      moves.set("procedural-moral-action:map-information-diet", {
        label: "Map clarifying and destabilizing inputs.",
        description: "Sort recent inputs by whether they clarify, destabilize, or merely repeat an old loop.",
        reasonCodes: ["mindful_consumption", "middle_way"],
      });
    }
    if (classification.proceduralMove === "reframe_without_finality") {
      moves.set("procedural-moral-action:restate-identity-as-observation", {
        label: "Restate identity language as observations.",
        description: "Convert fixed identity statements into observable patterns, choices, and user-confirmable meanings.",
        reasonCodes: ["identity_view", "non_attachment"],
      });
    }
    if (classification.proceduralMove === "ask_for_concrete_evidence") {
      moves.set("procedural-moral-action:define-falsifiable-check", {
        label: "Define the falsifiable check.",
        description: "Name what observation would increase, reduce, or reverse confidence.",
        reasonCodes: ["falsifiability", "direct_observation"],
      });
    }
    if (classification.proceduralMove === "check_for_feedback_loop") {
      moves.set("procedural-moral-action:check-loop-liveness", {
        label: "Check whether the loop is live or stale.",
        description: "Ask which signal is current, which is inherited, and what should be retired.",
        reasonCodes: ["feedback_loop_hygiene", "liveness"],
      });
    }
    if (classification.proceduralMove === "research_missing_considerations") {
      moves.set("procedural-moral-action:research-missing-considerations", {
        label: "Research missing considerations.",
        description:
          "Identify affected parties, downstream consequences, and evidence sources before strengthening the moral claim.",
        reasonCodes: ["unseen_harm_inquiry", "consideration_debt", "model_may_choose_research_tool"],
      });
    }
    if (classification.proceduralMove === "identify_affected_parties") {
      moves.set("procedural-moral-action:identify-affected-parties", {
        label: "Identify affected parties.",
        description: "Name who or what may be affected but is not represented in the current frame.",
        reasonCodes: ["affected_parties", "non_harm"],
      });
    }
    if (classification.proceduralMove === "separate_guilt_from_repair") {
      moves.set("procedural-moral-action:separate-guilt-from-repair", {
        label: "Separate guilt from repair.",
        description:
          "Treat guilt as a signal for evidence, responsibility tier, and repair questions rather than as an identity judgment.",
        reasonCodes: ["guilt_to_repair", "character_verdict_forbidden"],
      });
    }
    if (classification.proceduralMove === "ask_what_was_reasonably_knowable") {
      moves.set("procedural-moral-action:ask-reasonably-knowable", {
        label: "Ask what was reasonably knowable.",
        description:
          "Separate unknown unknowns, signaled unknowns, reasonably knowable gaps, and avoidance risk.",
        reasonCodes: ["due_care_before_judgment", "ignorance_boundary"],
      });
    }
    if (classification.proceduralMove === "update_responsibility_tier") {
      moves.set("procedural-moral-action:update-responsibility-tier", {
        label: "Update the responsibility tier.",
        description:
          "Classify the state as unknown, signaled, reasonably knowable, avoidance risk, or repair required without moral finality.",
        reasonCodes: ["responsibility_tier", "evidence_only"],
      });
    }
  }

  return [...moves.entries()].map(([id, move]) => ({ id, ...move }));
}

export function classifyProceduralMoralContext(
  input: ClassifyProceduralMoralContextInput,
): ProceduralMoralClassificationV1 {
  const text = input.text;
  const evidenceRefs = evidenceRefsFor(input);
  const classifications = PROCEDURAL_MORAL_PATTERN_RULES.filter((rule) =>
    rule.cues.some((cue) => cue.test(text)),
  ).map((rule): ProceduralMoralClassificationEntryV1 => ({
    id: `procedural-moral:${rule.id}`,
    observedPattern: rule.observedPattern,
    moralRootId: rule.moralRootId,
    moralRootLabel: labelForNode(input.graph, rule.moralRootId),
    proceduralMove: rule.proceduralMove,
    explanation: rule.explanation,
    confidence: confidenceFor(rule, text, input.reflection),
    evidenceRefs,
    missingEvidence: rule.missingEvidence,
    warnings: rule.warnings ?? [],
  }));

  const finalClassifications = classifications.length > 0
    ? classifications
    : [
        {
          id: "procedural-moral:unclear-evidence",
          observedPattern: "unclear_evidence" as const,
          moralRootId: "direct-observation-before-claim",
          moralRootLabel: labelForNode(input.graph, "direct-observation-before-claim"),
          proceduralMove: "ask_for_concrete_evidence" as const,
          explanation:
            "The prompt did not expose enough deterministic cues for a stronger inner-practice classification.",
          confidence: 0.5,
          evidenceRefs,
          missingEvidence: ["concrete_observation", "user_confirmed_objective"],
          warnings: ["avoid_overclassification"],
        },
      ];

  return buildProceduralMoralClassificationV1({
    classificationId: input.classificationId,
    generatedAt: input.generatedAt,
    sourceReflectionId: input.reflection.reflectionId,
    input: {
      kind: input.reflection.input.kind,
      summary: compactSummary(input.reflection),
      ...(input.reflection.input.refs ? { refs: input.reflection.input.refs } : {}),
    },
    classifications: finalClassifications,
    recommendedNextMoves: buildRecommendedNextMoves(finalClassifications),
  });
}
