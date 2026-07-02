export const isStagePlayReflectionPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim();
  if (!normalized) return false;
  const explicitNegative =
    /\b(?:do\s+not|don't|without|no)\b[\s\S]{0,80}\b(?:stage\s*play|stage\s*builder|badge\s*graph|procedural\s+bindings?|affordance\s+graph|observer\s*\/?\s*source\s+routing|routed\s+visual\s+source|narrative_stage_play|live\s+interpretation|answer\s+snapshot|perturbation)\b/i.test(normalized) ||
    /\b(?:stage\s*play|stage\s*builder|badge\s*graph|procedural\s+bindings?|affordance\s+graph|observer\s*\/?\s*source\s+routing|routed\s+visual\s+source|narrative_stage_play|live\s+interpretation|answer\s+snapshot|perturbation)\b[\s\S]{0,80}\b(?:do\s+not|don't|without|no)\b/i.test(normalized);
  if (explicitNegative) return false;
  if (/\b(?:moral\s*(?:badge\s*)?graph|moral\s*batch\s*graph|moralgraph|fruition|ideology\s+(?:tree|graph|map)|theory\s+badge\s+graph|theory\s+graph|physics\s+badge\s+graph)\b/i.test(normalized)) {
    return false;
  }
  return (
    /\bstage\s*play(?:\s+badge\s+graph|\s+graph|\s+context|\s+reflection)?\b/i.test(normalized) ||
    /\bactive\s+stage\s*play\s+graph\b/i.test(normalized) ||
    /\bstage\s*builder\b/i.test(normalized) ||
    /\bprocedural\s+bindings?\b/i.test(normalized) ||
    /\bmodel-reviewed\s+answer\s+snapshot\b/i.test(normalized) ||
    /\banswer\s+snapshot\b/i.test(normalized) ||
    /\bcheckpoint\s+(?:freshness|status|request|queue|node|turn|debug)\b/i.test(normalized) ||
    /\bhelix\s+ask\s+checkpoint\b/i.test(normalized) ||
    /\bperturbation(?:\s+(?:event|node|pulse|checkpoint))?\b/i.test(normalized) ||
    /\brouted\s+visual\s+source\b/i.test(normalized) ||
    /\blive\s+interpretation\b/i.test(normalized) ||
    /\bpredict(?:ion|ing)?\b[\s\S]{0,80}\b(?:next\s+(?:scene|beat)|scene)\b/i.test(normalized) ||
    /\bnext\s+(?:scene|beat)\b[\s\S]{0,80}\b(?:predict|prediction|forecast|anticipate)\b/i.test(normalized) ||
    /\baffordance\s+graph\b/i.test(normalized) ||
    /\b(?:project|update)\b[\s\S]{0,80}\blive\s+answer\b[\s\S]{0,80}\bstage\s*play\b/i.test(normalized) ||
    /\bstage\s*play\b[\s\S]{0,80}\b(?:project|update)\b[\s\S]{0,80}\blive\s+answer\b/i.test(normalized) ||
    /\b(?:project|update)\b[\s\S]{0,80}\blive\s+interpretation\b/i.test(normalized) ||
    /\bnarrative_stage_play\b/i.test(normalized) ||
    /\bObserver\s*\/?\s*source\s+routing\b/i.test(normalized) ||
    /\bbadge\s+graph\b/i.test(normalized)
  );
};

export const isStagePlayJobPlanningPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim();
  if (!normalized) return false;
  const explicitNegative =
    /\b(?:do\s+not|don't|without|no)\b[\s\S]{0,80}\b(?:stage\s*play|stage\s*builder|badge\s*graph|visual\s+capture\s+job|prediction\s+job)\b/i.test(normalized) ||
    /\b(?:stage\s*play|stage\s*builder|badge\s*graph|visual\s+capture\s+job|prediction\s+job)\b[\s\S]{0,80}\b(?:do\s+not|don't|without|no)\b/i.test(normalized);
  if (explicitNegative) return false;
  if (isStagePlayReflectionPrompt(normalized)) {
    return /\b(?:plan|setup|set\s+up|configure|job|about\s+to\s+attach|going\s+to\s+attach|want\s+to\s+predict|predict\s+what\s+happens\s+next)\b/i.test(normalized);
  }
  const sourceSetupCue =
    /\b(?:about\s+to\s+attach|going\s+to\s+attach|want\s+to\s+attach|plan|setup|set\s+up|configure)\b[\s\S]{0,120}\b(?:youtube|browser\s+tab|video|visual\s+capture|screen\s+capture|tab\s+capture)\b/i.test(normalized) ||
    /\b(?:youtube|browser\s+tab|video|visual\s+capture|screen\s+capture|tab\s+capture)\b[\s\S]{0,120}\b(?:plan|setup|set\s+up|configure|prediction\s+job|stage\s*play\s+job)\b/i.test(normalized);
  const predictionCue =
    /\b(?:predict|prediction|what\s+happens\s+next|next\s+scene|next\s+beat|forecast|anticipate)\b/i.test(normalized);
  const stageLikeCue =
    /\b(?:stage\s*play|stage\s*builder|badge\s*graph|node\s+chain|checkpoint\s+request|answer\s+snapshot|live\s+interpretation)\b/i.test(normalized);
  return (sourceSetupCue && predictionCue) || (stageLikeCue && sourceSetupCue);
};

export const isStagePlayCheckpointRequestPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim();
  if (!normalized) return false;
  const explicitNegative =
    /\b(?:do\s+not|don't|without|no)\b[\s\S]{0,80}\b(?:checkpoint|answer\s+snapshot|helix\s+ask\s+checkpoint|stage\s*play)\b/i.test(normalized) ||
    /\b(?:checkpoint|answer\s+snapshot|helix\s+ask\s+checkpoint|stage\s*play)\b[\s\S]{0,80}\b(?:do\s+not|don't|without|no)\b/i.test(normalized);
  if (explicitNegative) return false;
  const stageCue =
    /\b(?:stage\s*play|stage\s*builder|badge\s*graph|live\s+interpretation|answer\s+snapshot|helix\s+ask\s+checkpoint)\b/i.test(normalized);
  const requestCue =
    /\b(?:request|queue|enqueue|create|make|run|start|produce)\b[\s\S]{0,80}\b(?:checkpoint|checkpoint\s+request|answer\s+snapshot|helix\s+ask\s+checkpoint)\b/i.test(normalized) ||
    /\b(?:checkpoint|checkpoint\s+request|answer\s+snapshot|helix\s+ask\s+checkpoint)\b[\s\S]{0,80}\b(?:request|queue|enqueue|create|make|run|start|produce)\b/i.test(normalized);
  return stageCue && requestCue;
};
