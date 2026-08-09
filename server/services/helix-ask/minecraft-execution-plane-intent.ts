export type MinecraftExecutionPlaneConstraint =
  | "player_embodiment"
  | "world_authority"
  | "hybrid"
  | null;

const PLAYER_EMBODIMENT_PLANE_CUE_RE =
  /\b(?:player\s+embodiment(?:\s+plane)?|paired(?:\s+minecraft)?(?:\s+player)?\s+client|minecraft\s+player\s+client|normal\s+player\s+controls?|player-side\s+(?:client|control)|client-side\s+player\s+control)\b/iu;
const WORLD_AUTHORITY_PLANE_CUE_RE =
  /\b(?:world\s+authority(?:\s+plane)?|minecraft\s+(?:server\s+)?commands?|server\s+command(?:\s+tree)?|command-side\s+(?:world\s+)?control)\b/iu;

const stripQuotedMinecraftPlaneExamples = (prompt: string): string =>
  prompt.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/gu, " ");

const IMMEDIATE_EXECUTION_GUARD_RE =
  /\b(?:if|when|unless)\b[^,.!?;\n]{0,120}\b(?:controls?\s+(?:are\s+)?idle|manual\s+input|landing\s+(?:path|area|site)|safe|unsafe|ready|available|online|connected|reachable|within\s+(?:range|reach))\b/iu;

const DEFERRED_OR_HYPOTHETICAL_PLANE_RE =
  /\b(?:later|eventually|hypothetically|in\s+the\s+future|tomorrow|next\s+time|someday)\b|\b(?:if|when)\s+(?:i|we|you|the\s+user)\b[^.!?;\n]{0,80}\b(?:ask|decide|want|choose|reconnect|return|come\s+back)\b/iu;

const planeCueIsOperative = (input: {
  clause: string;
  cueIndex: number;
}): boolean => {
  const prefix = input.clause.slice(0, input.cueIndex);
  if (
    /\b(?:do\s+not|don't|dont|never|without|not\s+using|no\s+need\s+to\s+use)\b/iu.test(
      prefix,
    )
  ) {
    return false;
  }
  if (DEFERRED_OR_HYPOTHETICAL_PLANE_RE.test(input.clause)) {
    return false;
  }
  if (
    /\b(?:previously|earlier|historically|yesterday|last\s+time)\b/iu.test(
      input.clause,
    )
  ) {
    return false;
  }
  if (
    /\b(?:if|when|unless)\b/iu.test(input.clause) &&
    !IMMEDIATE_EXECUTION_GUARD_RE.test(input.clause)
  ) {
    return false;
  }
  if (
    /\b(?:screen|page|button|label|ui|text|sentence|phrase|example|documentation|transcript|debug)\b[^.!?;\n]{0,120}\b(?:says|shows|reads|contains|mentions|describes)\b/iu.test(
      prefix,
    )
  ) {
    return false;
  }
  return !/(?:^|\b)(?:explain|describe|quote|summari[sz]e|discuss)\b/iu.test(
    prefix,
  );
};

const operativePlaneCueExists = (
  clause: string,
  cue: RegExp,
): boolean => {
  const match = cue.exec(clause);
  cue.lastIndex = 0;
  return Boolean(
    match && planeCueIsOperative({ clause, cueIndex: match.index }),
  );
};

/**
 * Resolves only an explicit user-selected Minecraft execution plane. It does
 * not infer a tool from an action verb and cannot manufacture a request. This
 * keeps quoted, historical, future, and screen-visible examples out of tool
 * admission while preserving Codex ownership of the concrete next action.
 */
export const resolveMinecraftExecutionPlaneConstraint = (
  prompt: string,
): MinecraftExecutionPlaneConstraint => {
  const operativePrompt = stripQuotedMinecraftPlaneExamples(prompt);
  let playerEmbodiment = false;
  let worldAuthority = false;
  for (const clause of operativePrompt.split(/[.!?;\n]+/u)) {
    const normalized = clause.trim();
    if (!normalized) continue;
    playerEmbodiment ||= operativePlaneCueExists(
      normalized,
      PLAYER_EMBODIMENT_PLANE_CUE_RE,
    );
    worldAuthority ||= operativePlaneCueExists(
      normalized,
      WORLD_AUTHORITY_PLANE_CUE_RE,
    );
  }
  if (playerEmbodiment && worldAuthority) return "hybrid";
  if (playerEmbodiment) return "player_embodiment";
  if (worldAuthority) return "world_authority";
  return null;
};
