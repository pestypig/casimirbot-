import {
  buildProceduralMoralClassificationV1,
  type ProceduralMoralClassificationEntryV1,
  type ProceduralMoralClassificationV1,
  type ProceduralMoralMoveV1,
  type ProceduralMoralObservedPatternV1,
} from "../procedural-moral-classification";
import type { IdeologyContextReflectionV1 } from "../ideology-context-reflection";
import type { IdeologyGraph } from "./ideology-graph-types";

type ProceduralMoralPatternRule = {
  id: string;
  cues: RegExp[];
  observedPattern: ProceduralMoralObservedPatternV1;
  moralRootId: string;
  proceduralMove: ProceduralMoralMoveV1;
  explanation: string;
  missingEvidence: string[];
  warnings?: string[];
  reasonCodes: string[];
};

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
