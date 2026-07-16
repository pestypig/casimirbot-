const unquote = (prompt: string): string => prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");

export function isTheoryBadgeGraphCurrentContextPrompt(prompt: string): boolean {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquoted = unquote(prompt);
  if (
    /\b(?:not|don'?t|do\s+not|without)\b[\s\S]{0,100}\b(?:use|read|inspect|explain|interpret|infer\s+from)\b[\s\S]{0,100}\b(?:these|this|current|selected)\b[\s\S]{0,60}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\b(?:before|after|if|when|future|later|eventually|hypothetically)\b[\s\S]{0,120}\b(?:select|selected|choose|use|inspect|explain)\b[\s\S]{0,100}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\b(?:previously|earlier|historically|last\s+time|prior)\b[\s\S]{0,120}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,100}\b(?:says|shows|reads|contains|mentions|is\s+labeled)\b[\s\S]{0,100}\b(?:badges?|selection|combination|trace|branch)\b/i.test(unquoted)
  ) {
    return false;
  }

  const currentContextCue =
    /\b(?:these|this|current|selected|highlighted)\s+(?:theory\s+)?badges?\b/i.test(unquoted) ||
    /\b(?:these|this|current|selected|highlighted)\s+(?:badge\s+)?(?:selection|combination|trace|branch)\b/i.test(unquoted) ||
    /\bcurrent\s+(?:state|states|arrangement|configuration)\s+of\s+(?:the\s+)?(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)(?:'s)?\s+current\s+(?:state|states|arrangement|configuration)\b/i.test(unquoted) ||
    /\bbadges?\s+(?:I|we|the\s+user)\s+(?:select|selected|set\s+up|choose|chose|pick|picked)\b/i.test(unquoted) ||
    /\b(?:selection|combination|trace|branch)\s+(?:I|we)\s+(?:selected|set\s+up|chose|picked)\b/i.test(unquoted) ||
    /\b(?:theory\s+badge\s+graph|badge\s+graph|theory\s+graph)\b[\s\S]{0,100}\b(?:current|selected|selection|combination|trace|branch|these)\b/i.test(unquoted);
  const asksForMeaningOrPossibility =
    /\b(?:what|which|how|why|explain|interpret|infer|show|tell|identify|compare|connect|trace|see|read|access|observe|refer)\b/i.test(unquoted) &&
    /\b(?:mean|means|imply|implies|possible|possibilities|available|next|add|connect|connection|related|relationship|branch|path|trace|intermediate|boundary|boundaries|infer|reason|visible|state|states|selection|combination)\b/i.test(unquoted);

  return currentContextCue && asksForMeaningOrPossibility;
}
