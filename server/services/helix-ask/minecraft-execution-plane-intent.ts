export type MinecraftExecutionPlaneConstraint =
  "player_embodiment" | "world_authority" | "hybrid" | null;

const PLAYER_EMBODIMENT_PLANE_CUE_RE =
  /\b(?:player\s+embodiment(?:\s+plane)?|paired(?:\s+minecraft)?(?:\s+player)?\s+client|minecraft\s+player\s+client|normal\s+player\s+controls?|player-side\s+(?:client|control)|client-side\s+player\s+control|(?:bounded\s+)?(?:reactive\s+)?guardian\s+program|survival_tas(?:\s+guardian)?\s+program)\b/iu;
const WORLD_AUTHORITY_PLANE_CUE_RE =
  /\b(?:world\s+authority(?:\s+plane)?|minecraft\s+(?:server\s+)?commands?|server\s+command(?:\s+tree)?|command-side\s+(?:world\s+)?control)\b/iu;

const PLAYER_EMBODIMENT_ACTION_RE =
  /\b(?:navigate|go|travel|walk|move|step|take|turn|rotate|look|face|jump|interact|use|open|select|equip|follow|collect|gather|mine|break|place|build|craft|transfer|put|deposit|withdraw|cancel|resume)\b/iu;

const stripQuotedMinecraftPlaneExamples = (prompt: string): string =>
  prompt.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/gu, " ");

const IMMEDIATE_EXECUTION_GUARD_RE =
  /\b(?:if|when|unless)\b[^.!?;\n]{0,240}\b(?:controls?\s+(?:are\s+)?idle|manual\s+(?:input|control)|health|food|hunger|landing\s+(?:path|area|site)|solid\s+(?:walkable\s+)?support|safe\s+headroom|air\s+clearance|nearby\s+(?:fire|drop|hazard)|safe|unsafe|ready|available|online|connected|reachable|within\s+(?:range|reach))\b/iu;

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

const operativePlaneCueExists = (clause: string, cue: RegExp): boolean => {
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

export type MinecraftPlayerEmbodimentActionPromptMatch = {
  matched_text: string;
  match_index: number;
  match_end_index: number;
};

const playerEmbodimentActionClauseIsOperative = (input: {
  prompt: string;
  actionIndex: number;
}): boolean => {
  const priorBoundary = Math.max(
    input.prompt.lastIndexOf(".", input.actionIndex - 1),
    input.prompt.lastIndexOf("!", input.actionIndex - 1),
    input.prompt.lastIndexOf("?", input.actionIndex - 1),
    input.prompt.lastIndexOf(";", input.actionIndex - 1),
    input.prompt.lastIndexOf("\n", input.actionIndex - 1),
  );
  const clausePrefix = input.prompt.slice(priorBoundary + 1, input.actionIndex);
  if (
    /\b(?:do\s+not|don't|dont|never|avoid|without)\b[^.!?;\n]{0,180}$/iu.test(
      clausePrefix,
    ) ||
    /\b(?:later|eventually|tomorrow|someday|next\s+time|in\s+the\s+future|previously|earlier|historically|yesterday|last\s+time)\b/iu.test(
      clausePrefix,
    ) ||
    /\b(?:if|when|unless)\s+(?:i|we|you|the\s+user)\b[^.!?;\n]{0,120}$/iu.test(
      clausePrefix,
    ) ||
    /\b(?:explain|describe|quote|summari[sz]e|discuss|outline|teach|tell\s+me\s+how|show\s+me\s+how|what\s+would|which\s+(?:action|tool|capability))\b/iu.test(
      clausePrefix,
    ) ||
    /^\s*(?:can|could|would|will|does|do|is|are)\s+(?:the|this|that|our|a|an|my)\b/iu.test(
      clausePrefix,
    ) ||
    /\bi\s+(?:want|need|would\s+like)\s+to\s+(?:know|see|understand|learn|ask)\b/iu.test(
      clausePrefix,
    )
  ) {
    return false;
  }
  return true;
};

/**
 * Detects an affirmative request to act through the already selected Player
 * Embodiment plane without choosing a concrete capability. The result is an
 * admission affordance only: Codex still selects the player action and its
 * arguments from the authorized live manifest.
 */
export const minecraftPlayerEmbodimentActionPromptMatch = (
  promptText: string,
): MinecraftPlayerEmbodimentActionPromptMatch | null => {
  const prompt = stripQuotedMinecraftPlaneExamples(promptText).trim();
  if (
    !prompt ||
    resolveMinecraftExecutionPlaneConstraint(prompt) !== "player_embodiment"
  ) {
    return null;
  }

  const planeThenAction = new RegExp(
    `${PLAYER_EMBODIMENT_PLANE_CUE_RE.source}[\\s\\S]{0,240}?(${PLAYER_EMBODIMENT_ACTION_RE.source})`,
    "iu",
  );
  const actionThenPlane = new RegExp(
    `(${PLAYER_EMBODIMENT_ACTION_RE.source})[\\s\\S]{0,320}?${PLAYER_EMBODIMENT_PLANE_CUE_RE.source}`,
    "iu",
  );
  const directActionPatterns = [
    new RegExp(
      `\\b(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?(${PLAYER_EMBODIMENT_ACTION_RE.source})`,
      "iu",
    ),
    new RegExp(
      `\\bi\\s+(?:want|need|would\\s+like)\\s+you\\s+to\\s+(${PLAYER_EMBODIMENT_ACTION_RE.source})`,
      "iu",
    ),
    planeThenAction,
    actionThenPlane,
  ];
  for (const pattern of directActionPatterns) {
    const match = prompt.match(pattern);
    if (!match || typeof match.index !== "number") continue;
    const matchedText = String(match[1] ?? "").trim();
    if (!matchedText) continue;
    const relativeActionIndex = match[0].lastIndexOf(matchedText);
    const matchIndex = match.index + Math.max(0, relativeActionIndex);
    if (
      !playerEmbodimentActionClauseIsOperative({
        prompt,
        actionIndex: matchIndex,
      })
    ) {
      continue;
    }
    return {
      matched_text: matchedText,
      match_index: matchIndex,
      match_end_index: matchIndex + matchedText.length,
    };
  }
  return null;
};

export const isAffirmativeMinecraftPlayerEmbodimentActionPrompt = (
  prompt: string,
): boolean => minecraftPlayerEmbodimentActionPromptMatch(prompt) !== null;

/**
 * Reads the already-admitted source contract without reclassifying the prompt.
 * This is useful after source arbitration, where the specialized Minecraft
 * interpreter may be more precise than a generic control-command projection.
 * The predicate carries only the semantic obligation to perform some Player
 * Embodiment action; it never selects the concrete capability or arguments.
 */
export const sourceTargetIntentRequiresMinecraftPlayerEmbodimentAction = (
  value: unknown,
): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const intent = value as Record<string, unknown>;
  const explicitCues = Array.isArray(intent.explicit_cues)
    ? intent.explicit_cues.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const reasons = Array.isArray(intent.reasons)
    ? intent.reasons.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  return (
    intent.target_source === "live_environment" &&
    intent.strength === "hard" &&
    explicitCues.includes("operative_minecraft_player_embodiment_action") &&
    reasons.includes("player_action_capability_selection_owned_by_runtime")
  );
};
