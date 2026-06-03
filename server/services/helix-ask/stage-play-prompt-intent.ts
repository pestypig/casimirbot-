export const isStagePlayReflectionPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim();
  if (!normalized) return false;
  const explicitNegative =
    /\b(?:do\s+not|don't|without|no)\b[\s\S]{0,80}\b(?:stage\s*play|stage\s*builder|badge\s*graph|procedural\s+bindings?|affordance\s+graph|observer\s*\/?\s*source\s+routing|narrative_stage_play)\b/i.test(normalized) ||
    /\b(?:stage\s*play|stage\s*builder|badge\s*graph|procedural\s+bindings?|affordance\s+graph|observer\s*\/?\s*source\s+routing|narrative_stage_play)\b[\s\S]{0,80}\b(?:do\s+not|don't|without|no)\b/i.test(normalized);
  if (explicitNegative) return false;
  if (/\b(?:zen\s*(?:badge\s*)?graph|zen\s*batch\s*graph|zengraph|fruition|ideology\s+(?:tree|graph|map)|theory\s+badge\s+graph|theory\s+graph|physics\s+badge\s+graph)\b/i.test(normalized)) {
    return false;
  }
  return (
    /\bstage\s*play(?:\s+badge\s+graph|\s+graph|\s+context|\s+reflection)?\b/i.test(normalized) ||
    /\bactive\s+stage\s*play\s+graph\b/i.test(normalized) ||
    /\bstage\s*builder\b/i.test(normalized) ||
    /\bprocedural\s+bindings?\b/i.test(normalized) ||
    /\bmodel-reviewed\s+answer\s+snapshot\b/i.test(normalized) ||
    /\baffordance\s+graph\b/i.test(normalized) ||
    /\b(?:project|update)\b[\s\S]{0,80}\blive\s+answer\b[\s\S]{0,80}\bstage\s*play\b/i.test(normalized) ||
    /\bstage\s*play\b[\s\S]{0,80}\b(?:project|update)\b[\s\S]{0,80}\blive\s+answer\b/i.test(normalized) ||
    /\bnarrative_stage_play\b/i.test(normalized) ||
    /\bObserver\s*\/?\s*source\s+routing\b/i.test(normalized) ||
    /\bbadge\s+graph\b/i.test(normalized)
  );
};
