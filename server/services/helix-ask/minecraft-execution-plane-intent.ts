import {
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
} from "@shared/helix-minecraft-player-capabilities";

export type MinecraftExecutionPlaneConstraint =
  "player_embodiment" | "world_authority" | "hybrid" | null;

type MinecraftExecutionPlaneContext = {
  trusted_environment_domain?: "minecraft" | null;
  authorized_player_action_capability_ids?: string[];
};

const PLAYER_EMBODIMENT_PLANE_CUE_RE =
  /\b(?:player\s+embodiment(?:\s+plane)?|paired(?:\s+minecraft)?(?:\s+player)?\s+client|minecraft\s+player\s+client|normal\s+player\s+controls?|player-side\s+(?:client|control)|client-side\s+player\s+control|(?:bounded\s+)?(?:reactive\s+)?guardian\s+program|survival_tas(?:\s+guardian)?\s+program)\b/iu;
const WORLD_AUTHORITY_PLANE_CUE_RE =
  /\b(?:world\s+authority(?:\s+plane)?|minecraft\s+(?:server\s+)?commands?|server\s+command(?:\s+tree)?|command-side\s+(?:world\s+)?control)\b/iu;

const PLAYER_EMBODIMENT_ACTION_RE =
  /\b(?:navigate|go|travel|walk|move|step|take|turn|rotate|look|face|jump|interact|use|open|select|equip|follow|collect|gather|mine|break|place|build|craft|transfer|put|deposit|withdraw|cancel|resume|arm|protect|keep|maintain|preserve|guard)\b/iu;

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
    ) ||
    // Preserve contrasts such as "use Player Embodiment, not a server
    // command". The article sits between the negation and the plane cue, so
    // the older generic negation check incorrectly promoted both planes.
    /\bnot\s+(?:(?:a|an|the)\s+)?$/iu.test(prefix)
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
  context?: MinecraftExecutionPlaneContext | null,
): MinecraftPlayerEmbodimentActionPromptMatch | null => {
  const prompt = stripQuotedMinecraftPlaneExamples(promptText).trim();
  if (!prompt) {
    return null;
  }

  const explicitPlane = resolveMinecraftExecutionPlaneConstraint(prompt);
  if (explicitPlane === "world_authority" || explicitPlane === "hybrid") {
    return null;
  }
  const authorizedPlayerCapabilities = new Set(
    context?.authorized_player_action_capability_ids ?? [],
  );
  const trustedPlayerPlaneAvailable =
    context?.trusted_environment_domain === "minecraft" &&
    authorizedPlayerCapabilities.size > 0;
  if (explicitPlane !== "player_embodiment" && !trustedPlayerPlaneAvailable) {
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
    /(?:^|[.!?;]\s*)(?:please\s+)?(arm|protect|keep|maintain|preserve|guard)\b/iu,
    /(?:^|[.!?;]\s*)(?:please\s+)?(emergency\s+stop|e-?stop|cancel|resume)\b/iu,
  ];
  if (
    explicitPlane !== "player_embodiment" &&
    authorizedPlayerCapabilities.has(
      "com.casimirbot.minecraft.player.sequence.execute",
    )
  ) {
    directActionPatterns.push(
      /\b(?:perform|complete)\b[\s\S]{0,180}?\b(look|sprint|jump|interact|equip|craft|release)\b/iu,
    );
  }
  if (trustedPlayerPlaneAvailable) {
    // In an authenticated room with an admitted Player Embodiment manifest,
    // ordinary imperative gameplay language is enough to expose the player
    // action affordance set. This carries only the semantic obligation; Codex
    // still chooses the concrete capability and arguments. Keep this narrower
    // than the generic command verb set so UI/document phrases such as "open"
    // or "use" do not silently become game actions.
    directActionPatterns.push(
      /(?:^|[.!?;]\s*)(?:please\s+)?(navigate|go|travel|walk|move|step|turn|rotate|look|face|jump|interact|equip|follow|collect|gather|mine|break|place|build|craft|transfer|protect|keep|maintain|preserve|guard)\b/iu,
    );
  }
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
  context?: MinecraftExecutionPlaneContext | null,
): boolean => minecraftPlayerEmbodimentActionPromptMatch(prompt, context) !== null;

const RESIDENT_RECOVERY_HAZARD_RE =
  /\b(?:lava|on\s+fire|catch(?:ing)?\s+fire|burn(?:ing)?|unsafe\s+landing|fall\s+damage|dangerous\s+(?:fall|descent))\b/iu;
const RESIDENT_RECOVERY_PHYSICAL_RESPONSE_RE =
  /\b(?:jump|sprint|walk|move|swim|place|use|land|escape|recover|rescue|save)\b/iu;

const PLAYER_COMBAT_EFFECT_RE =
  /\b(?:attack|fight|strike|hit|defeat|kill|engage(?:\s+in)?\s+combat)\b/iu;
const MULTI_HOSTILE_COMBAT_SCOPE_RE =
  /\b(?:multiple|several|all|two|three|four|five|six|seven|eight)\s+(?:hostile\s+)?(?:mobs?|zombies?|skeletons?|enemies)\b|\b(?:hostile\s+mobs|zombies|skeletons|enemies)\b/iu;

/**
 * Carries an affirmatively requested combat effect into terminal evidence.
 * This does not author an attack request or its target arguments; it prevents
 * a different successful player action (for example, camera tracking) from
 * satisfying a prompt that still explicitly requires combat.
 */
export const requiredMinecraftPlayerCombatCapabilityIds = (
  promptText: string,
  context?: MinecraftExecutionPlaneContext | null,
): string[] => {
  const prompt = stripQuotedMinecraftPlaneExamples(promptText).trim();
  if (!prompt || !minecraftPlayerEmbodimentActionPromptMatch(prompt, context)) {
    return [];
  }
  for (const clause of prompt.split(/[.!?;\n]+/u)) {
    const match = PLAYER_COMBAT_EFFECT_RE.exec(clause);
    PLAYER_COMBAT_EFFECT_RE.lastIndex = 0;
    if (
      match &&
      typeof match.index === "number" &&
      playerEmbodimentActionClauseIsOperative({
        prompt: clause,
        actionIndex: match.index,
      })
    ) {
      const requiresResidentGuard = MULTI_HOSTILE_COMBAT_SCOPE_RE.test(clause);
      MULTI_HOSTILE_COMBAT_SCOPE_RE.lastIndex = 0;
      return [
        requiresResidentGuard
          ? HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY
          : HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
      ];
    }
  }
  return [];
};

/**
 * Narrows terminal evidence for an affirmative resident-response request only
 * when the user specified a physical recovery for a named hazard. This does
 * not author the program or admit an effect; it prevents an unrelated
 * successful player action (for example, the low-air-only guardian profile)
 * from satisfying a requested fire or landing recovery.
 */
export const requiredMinecraftResidentRecoveryCapabilityIds = (
  promptText: string,
  context?: MinecraftExecutionPlaneContext | null,
): string[] => {
  const prompt = stripQuotedMinecraftPlaneExamples(promptText).trim();
  if (!prompt || !minecraftPlayerEmbodimentActionPromptMatch(prompt, context)) {
    return [];
  }
  const hazard = RESIDENT_RECOVERY_HAZARD_RE.exec(prompt);
  RESIDENT_RECOVERY_HAZARD_RE.lastIndex = 0;
  if (!hazard || typeof hazard.index !== "number") return [];
  const nearby = prompt.slice(
    Math.max(0, hazard.index - 240),
    Math.min(prompt.length, hazard.index + hazard[0].length + 320),
  );
  const physicalResponse = RESIDENT_RECOVERY_PHYSICAL_RESPONSE_RE.exec(nearby);
  RESIDENT_RECOVERY_PHYSICAL_RESPONSE_RE.lastIndex = 0;
  if (!physicalResponse) return [];
  return [HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY];
};

const PLAYER_CONTROL_CUES = [
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
    cue: /\b(?:emergency\s+stop|e-?stop)\b/iu,
  },
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
    cue: /\bcancel\b/iu,
  },
  {
    capabilityId: HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
    cue: /\bresume\b/iu,
  },
] as const;

/**
 * Exposes only an affirmatively requested workflow control to Runtime Codex.
 * This is provider-catalog selection, not execution admission: the gateway
 * still validates the exact workflow, participant, player, authority, lease,
 * and connector before any control can run.
 */
export const affirmativeMinecraftPlayerControlCapabilityIds = (
  promptText: string,
): string[] => {
  const prompt = stripQuotedMinecraftPlaneExamples(promptText).trim();
  if (!prompt) return [];
  const selected = new Set<string>();
  for (const clause of prompt.split(/[.!?;\n]+/u)) {
    const normalized = clause.trim();
    if (!normalized) continue;
    for (const control of PLAYER_CONTROL_CUES) {
      const match = control.cue.exec(normalized);
      control.cue.lastIndex = 0;
      if (!match || typeof match.index !== "number") continue;
      const prefix = normalized.slice(0, match.index);
      const affirmativeFrame =
        /^\s*(?:please\s+)?$/iu.test(prefix) ||
        /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?$/iu.test(prefix) ||
        /\bi\s+(?:want|need|would\s+like)\s+you\s+to\s+$/iu.test(prefix);
      if (
        !affirmativeFrame ||
        !playerEmbodimentActionClauseIsOperative({
          prompt: normalized,
          actionIndex: match.index,
        }) ||
        /\b(?:screen|page|button|label|ui|text|sentence|phrase|example|documentation|transcript|debug)\b[^.!?;\n]{0,120}\b(?:says|shows|reads|contains|mentions|describes)\b/iu.test(
          prefix,
        )
      ) {
        continue;
      }
      selected.add(control.capabilityId);
    }
  }
  return [...selected].sort();
};

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
