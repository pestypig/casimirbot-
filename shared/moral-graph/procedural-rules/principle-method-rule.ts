import type { ProceduralMoralPatternRule } from "./procedural-rule-types";

// Deliberately character- and setting-independent. These cues nominate a review;
// they cannot decide whether continuing, changing course, or surrender is right.
const METHOD_CHOICE = /\b(?:surrender\w*|surviv\w*|retir\w*|resign\w*|resist\w*|refus\w*|declin\w*|stop\w*|continu\w*|chang\w*|abandon\w*|compromis\w*|demonstrat\w*|prov(?:e|es|ing)|serve|serving|withdraw\w*)\b/i;
const STAKES_OR_NECESSITY = /\b(?:defeat\w*|die|dies|dying|death|sacrific\w*|punish\w*|protect\w*|subordinates?|crew\w*|lives|safety|harm\w*|betray\w*|only way|must|trapped|cost\w*|demonstrat\w*|prov(?:e|es|ing))\b/i;

export const PRINCIPLE_METHOD_RULE: ProceduralMoralPatternRule = {
  id: "principle-method-review",
  cues: [
    /\bprinciple and method review\b/i,
    /\b(?:principles?|integrity|conscience|honou?r|convictions?|democracy|nonviolence|truthfulness|human dignity)\b/i,
    /\b(?:friendship|relationships?)\s+between\s+equals\b/i,
  ],
  matches: (text) => /\bprinciple and method review\b/i.test(text) ||
    (METHOD_CHOICE.test(text) && STAKES_OR_NECESSITY.test(text)),
  observedPattern: "principle_method_tension",
  moralRootId: "values-over-images",
  proceduralMove: "separate_principle_from_method",
  explanation:
    "Review a possible tension between a principle and its chosen demonstration, not a proven attachment. Defeat does not refute a value; survival does not imply consent; admiration does not confer authority. The principle itself remains open to ethical review.",
  missingEvidence: [
    "principle_and_why_this_method_is_thought_necessary",
    "actual_terms_of_each_alternative_and_what_it_concedes",
    "remaining_protective_or_testimonial_value_and_evidence",
    "cost_bearers_consent_exit_and_other_actors_responsibility",
    "value_preserving_alternatives_remaining_duties_and_review_triggers",
  ],
  warnings: [
    "review_hypothesis_not_proven_attachment_or_required_surrender",
    "survival_is_not_consent_and_defeat_is_not_disproof",
    "life_has_worth_without_usefulness_or_sacrificial_proof",
    "admiration_and_respect_do_not_establish_equal_standing_or_authority",
    "assess_each_decision_actual_terms_protective_purpose_and_credible_testimonial_value",
    "preserve_other_actors_responsibility_and_do_not_blame_only_the_resister",
  ],
  reasonCodes: ["values_over_images", "identity_non_attachment", "non_harm", "adherence_legitimacy_separation"],
};

export const PRINCIPLE_METHOD_NEXT_MOVE = {
  id: "procedural-moral-action:principle-method-review",
  label: "Principle and Method Review.",
  description:
    "What value, and why this method? What would each alternative actually concede? What protective or credible testimonial purpose remains? Who bears costs, can consent or leave, and who else is responsible? Which alternatives preserve conscience and remaining duties, and when should the choice be reviewed?",
  reasonCodes: PRINCIPLE_METHOD_RULE.reasonCodes,
};
