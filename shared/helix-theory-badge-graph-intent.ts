const unquoteTheoryBadgeGraphPrompt = (prompt: string): string =>
  prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

export const HELIX_THEORY_BADGE_GRAPH_CUE_RE =
  /\b(?:theory\s+badge\s+graph|theory\s+graph|badge\s+graph|theory_context_reflection|reflect_theory_context|helix_ask\.reflect_theory_context|theory-badge-graph\.reflect_discussion_context)\b/i;

const AFFIRMATIVE_DISCOURSE_PREFIX =
  "(?:(?:ok(?:ay)?|all\\s+right|alright|now|next|then)[,:]?\\s*)?";

/**
 * Detect an operator-authored request to use the Theory Badge Graph without
 * imposing a short character window on the semantic subject. The command must
 * be locally affirmative; quoted, negated, historical, hypothetical, and UI
 * text remains non-executable.
 */
export function isAffirmativeTheoryBadgeGraphReflectionPrompt(prompt: string): boolean {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquoted = unquoteTheoryBadgeGraphPrompt(prompt);
  return unquoted.split(/[.!?;\n]+/).some((rawClause) => {
    const clause = rawClause.trim();
    if (!clause || !HELIX_THEORY_BADGE_GRAPH_CUE_RE.test(clause)) return false;

    const command = clause.match(new RegExp(
      `^${AFFIRMATIVE_DISCOURSE_PREFIX}(?:(?:can|could|would|will)\\s+you\\s+)?(?:please\\s+)?(?:reflect|use|run|call|query|apply|consult|map|locate|place|compare)\\b`,
      "i",
    ));
    const graphQuestion = clause.match(new RegExp(
      `^${AFFIRMATIVE_DISCOURSE_PREFIX}(?:what\\s+does|what\\s+do|where\\s+does|where\\s+do|how\\s+does|how\\s+do)\\b[\\s\\S]*\\b(?:theory\\s+badge\\s+graph|theory\\s+graph|badge\\s+graph)\\b`,
      "i",
    ));
    const action = command ?? graphQuestion;
    if (!action) return false;

    const prefix = clause.slice(0, action.index ?? 0);
    if (/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b/i.test(prefix)) return false;
    if (/\b(?:if|when|before|after|later|eventually|hypothetically|in\s+the\s+future)\b/i.test(prefix)) return false;
    if (/\b(?:earlier|previously|last\s+turn|historically|already)\b/i.test(prefix)) return false;
    if (/\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,100}\b(?:says|shows|reads|contains|mentions|is\s+labeled)\b/i.test(prefix)) return false;
    return true;
  });
}

export function isTheoryBadgeGraphCurrentContextPrompt(prompt: string): boolean {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquoted = unquoteTheoryBadgeGraphPrompt(prompt);
  if (
    /\b(?:not|don'?t|do\s+not|without)\b[\s\S]{0,100}\b(?:use|read|show|observe|access|inspect|explain|interpret|infer\s+from)\b[\s\S]{0,100}\b(?:these|this|current|selected)\b[\s\S]{0,80}\b(?:badges?|selection|combination|trace|branch|context|theory\s+(?:badge\s+)?graph|badge\s+graph)\b/i.test(unquoted) ||
    /\b(?:before|after|if|when|future|later|eventually|hypothetically)\b[\s\S]{0,120}\b(?:select|selected|choose|use|read|show|observe|access|inspect|explain)\b[\s\S]{0,120}\b(?:badges?|selection|combination|trace|branch|context|theory\s+(?:badge\s+)?graph|badge\s+graph)\b/i.test(unquoted) ||
    /\b(?:previously|earlier|historically|last\s+time|prior)\b[\s\S]{0,120}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,100}\b(?:says|shows|reads|contains|mentions|is\s+labeled)\b[\s\S]{0,100}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted)
  ) {
    return false;
  }

  const currentContextCue =
    /\b(?:these|this|current|selected|highlighted)\s+(?:theory\s+)?badges?\b/i.test(unquoted) ||
    /\b(?:these|this|current|selected|highlighted)\s+(?:badge\s+)?(?:selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\b(?:current|active)\s+(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)\s+(?:context|state|selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\bcurrent\s+(?:state|states|arrangement|configuration)\s+of\s+(?:the\s+)?(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)(?:'s)?\s+current\s+(?:state|states|arrangement|configuration)\b/i.test(unquoted) ||
    /\bbadges?\s+(?:I|we|the\s+user)\s+(?:select|selected|set\s+up|choose|chose|pick|picked)\b/i.test(unquoted) ||
    /\b(?:selection|combination|trace|branch)\s+(?:I|we)\s+(?:selected|set\s+up|chose|picked)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)\b[\s\S]{0,100}\b(?:current|selected|selection|combination|trace|branch|these)\b/i.test(unquoted);
  const asksForMeaningOrPossibility =
    /\b(?:what|which|how|why|explain|interpret|infer|show|tell|identify|compare|connect|trace|see|read|access|observe|refer)\b/i.test(unquoted) &&
    /\b(?:mean|means|imply|implies|represent|represents|represented|possible|possibilities|available|next|add|connect|connection|related|relationship|branch|path|trace|intermediate|boundary|boundaries|infer|reason|visible|state|states|selection|combination|context)\b/i.test(unquoted);

  return currentContextCue && asksForMeaningOrPossibility;
}
