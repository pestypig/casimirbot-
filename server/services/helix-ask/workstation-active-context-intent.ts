const CURRENT_PANEL_VIEWING_CUE_PATTERN =
  /\b(?:which|what)\s+(?:workstation\s+)?panel\b[\s\S]{0,100}?\b(?:currently|right\s+now|now)\b[\s\S]{0,80}?\b(?:look(?:ing)?\s+at|view(?:ing)?|focus(?:ed)?|active|visible|open)\b/gi;

const hasAffirmativeCurrentPanelViewingCue = (prompt: string): boolean => {
  for (const match of prompt.matchAll(CURRENT_PANEL_VIEWING_CUE_PATTERN)) {
    const prefix = prompt.slice(Math.max(0, (match.index ?? 0) - 180), match.index ?? 0);
    const clausePrefix = prefix.split(/[.!?;\n]|\b(?:but|however|instead)\b/i).at(-1) ?? "";
    if (
      /\b(?:not|don'?t|do\s+not|without|avoid)\b[\s\S]{0,100}\b(?:ask|asking|answer|identify|inspect|tell)\b/i.test(clausePrefix) ||
      /\b(?:before|after|if|when|later|future|eventually|hypothetically|would|could|might|previously|earlier|historically)\b/i.test(clausePrefix) ||
      /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions)\b/i.test(clausePrefix)
    ) {
      continue;
    }
    return true;
  }
  return false;
};

export const hasWorkstationPanelScopeCue = (prompt: string): boolean =>
  /\b(?:current|active|open|visible|focused)\s+(?:workstation\s+)?(?:panel|panels|workspace|layout)\b/i.test(prompt) ||
  /\b(?:panel|panels)\s+(?:is|are|currently|right\s+now|now)?\s*(?:active|open|visible|focused)\b/i.test(prompt) ||
  /\b(?:what|which)\s+panels?\s+(?:in|on)\s+(?:the\s+)?(?:workstation|workspace)\s+(?:is|are)\s+(?:active|open|visible|focused)\b/i.test(prompt) ||
  /\b(?:which|what)\s+workstation\s+panel\b/i.test(prompt) ||
  /\bworkstation\s+(?:panel|panels|workspace|layout)\b/i.test(prompt);

export const isActiveWorkstationContextPrompt = (prompt: string): boolean => {
  if (/\bbackground\s+only\b/i.test(prompt)) return false;
  const unquotedPrompt = prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (
    /\b(?:do\s+not|don'?t|no)\b.{0,80}\b(?:run|call|use|execute)\s+(?:any\s+)?(?:tools?|workstation\s+tools?|gateway\s+calls?)\b/i.test(unquotedPrompt)
  ) {
    return false;
  }
  const clauses = unquotedPrompt.split(/[.!?;\n]|\b(?:but|however|instead)\b/i);
  return clauses.some((clause) => {
    if (
      /\b(?:not|don'?t|do\s+not|without|avoid|no\s+need\s+to)\b[\s\S]{0,100}\b(?:ask|asking|answer|identify|inspect|tell|use|read|explain)\b/i.test(clause) ||
      /\b(?:if|when|before|after|later|future|eventually|hypothetically|previously|earlier|historically|last\s+turn)\b/i.test(clause) ||
      /\b(?:screen|page|button|label|ui|text|sentence|phrase)\b[\s\S]{0,120}\b(?:says|shows|reads|contains|mentions)\b/i.test(clause)
    ) {
      return false;
    }
    const mentionsPanelContext =
      /\b(?:current|active|open|visible)\s+(?:panel|panels|workspace|workstation|layout)\b/i.test(clause) ||
      /\b(?:panel|panels)\s+(?:(?:is|are|currently|right\s+now|now)\s+)?(?:open|active|visible|on\s+screen|in\s+(?:the\s+)?workspace)\b/i.test(clause) ||
      /\bwhat\s+(?:panel|panels)\s+(?:is|are)\s+(?:open|active|visible)\b/i.test(clause) ||
      /\b(?:what|which)\s+panels?\s+(?:in|on)\s+(?:the\s+)?(?:workstation|workspace)\s+(?:is|are)\s+(?:active|open|visible|focused)\b/i.test(clause) ||
      /\b(?:what|which)\s+(?:workstation\s+)?panels?\s+(?:do|can)\s+you\s+(?:see|view|observe)\b/i.test(clause) ||
      /\b(?:what|which)\s+(?:workstation\s+)?panels?\b.{0,60}\b(?:looking\s+at|viewing|focused\s+on)\b/i.test(clause) ||
      hasAffirmativeCurrentPanelViewingCue(clause);
    const asksForContext = /\b(?:what|which|where|list|show|tell\s+me|identify|inspect|read)\b/i.test(clause);
    return mentionsPanelContext && asksForContext;
  });
};
