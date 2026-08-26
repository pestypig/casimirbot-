const immediateGameSituationSubject =
  /\b(?:nearby\s+(?:hostile\s+)?mobs?|hostile\s+mobs?|mobs?\s+(?:nearby|near\s+me|around\s+me)|nearby\s+entities|entities\s+(?:nearby|near\s+me|around\s+me)|immediate\s+(?:hazards?|threats?)|hazards?\s+(?:nearby|near\s+me|around\s+me)|current\s+actor\s+status|health\s*(?:,|and)\s*hunger|local\s+(?:floor|terrain)|(?:wheat|crop)\s+(?:state|maturity)|line\s+of\s+sight|straight-line\s+(?:geometric\s+)?reachability|players?\s+(?:currently\s+)?online|active\s+(?:source|world)\s+status|world\s+status)\b/i;

const affirmativeObservationVerb =
  /\b(?:recheck|check|scan|inspect|list|read|show)\b/i;

const immediateCue =
  /\b(?:now|right\s+now|current(?:ly)?|immediate|nearby|again|recheck)\b/i;

const negatedExecution =
  /\b(?:do\s+not|don't|dont|never|without)\s+(?:recheck|check|scan|inspect|list|read|show)\b/i;

const futureOrConditionalExecution =
  /\b(?:later|eventually|tomorrow|may|might|would|could|if|when)\b[\s\S]{0,100}\b(?:recheck|check|scan|inspect|list|read|show)\b/i;

const quotedHistoricalOrCapabilityDiscussion =
  /\b(?:the\s+(?:screen|docs?|guide)\s+(?:says?|shows?|uses?)|quoted?|someone\s+said|historically|previous\s+turn\s+said|why\s+did|can\s+(?:the|this|our|a)\s+(?:minecraft\s+)?connector)\b/i;

const immediateMinecraftActorStateQuestion =
  /\b(?:where\s+am\s+i|what(?:'s|\s+is)\s+my\s+(?:current\s+)?(?:minecraft\s+)?(?:location|position|dimension)|how\s+am\s+i\s+doing)\b[\s\S]{0,120}\bminecraft\b|\bminecraft\b[\s\S]{0,120}\b(?:where\s+am\s+i|what(?:'s|\s+is)\s+my\s+(?:current\s+)?(?:location|position|dimension)|how\s+am\s+i\s+doing)\b/i;

const negatedActorStateQuestion =
  /\b(?:do\s+not|don't|dont|never|without)\b[\s\S]{0,100}\b(?:answer|tell|show|report|determine|check|where\s+am\s+i|location|position|dimension)\b/i;

const futureOrConditionalActorStateQuestion =
  /\b(?:later|eventually|tomorrow|may|might|would|could|if|when)\b[\s\S]{0,120}\b(?:ask|answer|tell|show|report|determine|check|where\s+am\s+i|location|position|dimension)\b/i;

const minecraftCommandDiscussionScope =
  /\b(?:minecraft|fabric|minehut|mine\s*hut)\b[\s\S]{0,120}\b(?:server\s+)?command\b|\b(?:server\s+)?command\b[\s\S]{0,120}\b(?:minecraft|fabric|minehut|mine\s*hut)\b/i;

const explicitCommandNonExecution =
  /\b(?:do\s+not|don't|dont|never)\s+(?:actually\s+)?(?:execute|run|issue|send|apply|change|modify|mutate|use)\b|\bwithout\s+(?:actually\s+)?(?:executing|running|issuing|sending|applying|changing|modifying|mutating|using)\b/i;

const scopedOtherCommandExclusion =
  /\b(?:do\s+not|don't|dont|never)\s+(?:execute|run|issue|send|apply|use)\s+(?:any\s+)?(?:other|additional|unrelated)\s+(?:minecraft\s+)?commands?\b/i;

const affirmativeExactCommandBefore =
  /\b(?:run|execute|issue|send|apply|use)\b[\s\S]{0,140}(?:\b(?:exact|catalog|minecraft|fabric)\s+command\b|\/[a-z][a-z0-9:_-]*\b)/i;

/** Keeps command education and quoted syntax out of the live execution lane. */
export const isMinecraftCommandNonExecutionDiscussionPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  const scopedExclusion = prompt.match(scopedOtherCommandExclusion);
  if (
    scopedExclusion &&
    typeof scopedExclusion.index === "number" &&
    affirmativeExactCommandBefore.test(prompt.slice(0, scopedExclusion.index))
  ) {
    return false;
  }
  return Boolean(
    prompt &&
      minecraftCommandDiscussionScope.test(prompt) &&
      explicitCommandNonExecution.test(prompt),
  );
};

/**
 * Identifies an operator request to configure/start the workstation monitoring
 * session. This is an action workflow, not a request for current world
 * evidence. Keeping the distinction here prevents the generic "Minecraft"
 * source cue from making setup depend on an observation that the setup action
 * is meant to attach.
 */
export const isMinecraftSituationSessionSetupPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const normalized = String(promptText ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  const hasQuestionPrefix =
    /^(?:what|what's|whats|how|why|am\s+i|are\s+we|should\s+i|should\s+we|can\s+you\s+(?:tell|summarize|explain|check)|tell\s+me)\b/.test(
      normalized,
    );
  const hasExplicitStartCue =
    /\b(?:start|enable|turn\s+on|set\s+up|attach|bind)\b/.test(normalized) ||
    /^(?:monitor|watch|stand\s+by|keep\s+watch)\b/.test(normalized) ||
    /\b(?:monitor|watch|stand\s+by|keep\s+watch)\s+(?:my|the|this|current)\s+(?:minecraft|minehut|mine\s*hut|server|world|game)\b/.test(
      normalized,
    );
  if (hasQuestionPrefix && !hasExplicitStartCue) return false;
  const hasMinecraftScope =
    /\b(?:minecraft|minehut|mine\s*hut|server|world)\b/.test(normalized) &&
    /\b(?:source|session|situation|monitor|watch|standby|dottie|danger|progress|game)\b/.test(
      normalized,
    );
  const hasSituationSessionCue =
    hasExplicitStartCue || /\bonly\s+tell\s+me\b/.test(normalized);
  const hasGoalSessionPhrase =
    /\b(?:start|enable|set\s+up)\s+(?:a\s+)?situation\b/.test(normalized) ||
    /\bsituation\s+goal\s+session\b/.test(normalized);
  return (
    hasSituationSessionCue &&
    (hasMinecraftScope ||
      (hasGoalSessionPhrase &&
        /\bminecraft|minehut|mine\s*hut\b/.test(normalized)))
  );
};

/**
 * Recognizes a present-tense operator request to create a durable Minecraft
 * objective. This must be distinguished from configuring a monitoring panel:
 * the durable-goal gateway binds the objective to the already authenticated
 * room, environment, player, connector epoch, and action authority.
 */
export const isAffirmativeMinecraftDurableGoalCreatePrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  const durableGoal =
    /\b(?:durable|persistent|checkpointed|long[-\s]?running)\b[\s\S]{0,80}\b(?:goal|objective)\b|\b(?:goal|objective)\b[\s\S]{0,80}\b(?:durable|persistent|checkpointed|long[-\s]?running)\b/i.test(
      prompt,
    );
  const minecraftScope =
    /\b(?:minecraft|fabric|minehut|mine\s*hut)\b/i.test(prompt);
  const affirmativeCreate =
    /^(?:please\s+)?(?:start|create|begin|launch|establish|set\s+up)\b/i.test(
      prompt,
    ) ||
    /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:start|create|begin|launch|establish|set\s+up)\b/i.test(
      prompt,
    ) ||
    /\bi\s+(?:want|need|would\s+like)\s+you\s+to\s+(?:start|create|begin|launch|establish|set\s+up)\b/i.test(
      prompt,
    );
  if (!durableGoal || !minecraftScope || !affirmativeCreate) return false;
  return !(
    /^(?:do\s+not|don't|dont|never|avoid|without)\b/i.test(prompt) ||
    /^(?:later|eventually|tomorrow|after(?:ward|wards)?|in\s+the\s+future|if|when)\b/i.test(
      prompt,
    ) ||
    /^(?:previously|earlier|historically|last\s+turn)\b/i.test(prompt) ||
    /^(?:the\s+(?:screen|docs?|guide|transcript|message)\s+(?:says?|said|shows?|showed)|quoted?|someone\s+said)\b/i.test(
      prompt,
    ) ||
    /^(?:explain|describe|show\s+me|tell\s+me)\b[\s\S]{0,80}\bhow\s+to\b/i.test(
      prompt,
    )
  );
};

/**
 * Recognizes an operative request to inspect or resume one existing durable
 * Minecraft goal. Resumption begins with the read-only inspect capability so
 * the runtime must recover the canonical identity-bound projection before it
 * can propose any later append or environment mutation.
 */
export const isAffirmativeMinecraftDurableGoalInspectPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  const goalReference =
    /\benvironment_durable_goal:[a-z0-9][a-z0-9-]{7,}\b/i.test(prompt) ||
    /\b(?:durable|persistent|checkpointed|long[-\s]?running)\b[\s\S]{0,80}\b(?:minecraft\s+)?(?:goal|objective)\b|\b(?:minecraft\s+)?(?:goal|objective)\b[\s\S]{0,80}\b(?:durable|persistent|checkpointed|long[-\s]?running)\b/i.test(
      prompt,
    );
  const operativeInspect =
    /^(?:please\s+)?(?:resume|continue|inspect|read|check|reconstruct|recover|reopen|re-open)\b/i.test(
      prompt,
    ) ||
    /^(?:in|from|using)\s+(?:this|the\s+current|the\s+bound|the\s+shared(?:\s+live)?)\s+room,?\s+(?:please\s+)?(?:resume|continue|inspect|read|check|reconstruct|recover|reopen|re-open)\b/i.test(
      prompt,
    ) ||
    /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:resume|continue|inspect|read|check|reconstruct|recover|reopen|re-open)\b/i.test(
      prompt,
    ) ||
    /\bi\s+(?:want|need|would\s+like)\s+you\s+to\s+(?:resume|continue|inspect|read|check|reconstruct|recover|reopen|re-open)\b/i.test(
      prompt,
    );
  if (!goalReference || !operativeInspect) return false;
  return !(
    /^(?:do\s+not|don't|dont|never|avoid|without)\b/i.test(prompt) ||
    /^(?:later|eventually|tomorrow|after(?:ward|wards)?|in\s+the\s+future|if|when)\b/i.test(
      prompt,
    ) ||
    /^(?:previously|earlier|historically|last\s+turn)\b/i.test(prompt) ||
    /^(?:the\s+(?:screen|docs?|guide|transcript|message)\s+(?:says?|said|shows?|showed)|quoted?|someone\s+said)\b/i.test(
      prompt,
    ) ||
    /^(?:explain|describe|show\s+me|tell\s+me)\b[\s\S]{0,80}\bhow\s+to\b/i.test(
      prompt,
    )
  );
};

/** Recognizes an operative read of the G6 append-only supporting-role ledger. */
export const isAffirmativeEnvironmentReasoningRoleInspectPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  const goalReference =
    /\benvironment_durable_goal:[a-z0-9][a-z0-9-]{7,}\b/i.test(prompt);
  const roleLedgerReference =
    /\b(?:concurrent[-\s]?reasoning|reasoning[-\s]?role|supporting[-\s]?role)\s+(?:ledger|history|outputs?|projection|support)\b/i.test(
      prompt,
    );
  const operativeInspect =
    /^(?:please\s+)?(?:inspect|read|check|reconstruct|report)\b/i.test(prompt) ||
    /^(?:in|from|using)\s+(?:this|the\s+current|the\s+bound|the\s+shared(?:\s+live)?)\s+room,?\s+(?:please\s+)?(?:inspect|read|check|reconstruct|report)\b/i.test(
      prompt,
    ) ||
    /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:inspect|read|check|reconstruct|report)\b/i.test(
      prompt,
    );
  if (!goalReference || !roleLedgerReference || !operativeInspect) return false;
  return !(
    /^(?:do\s+not|don't|dont|never|avoid|without)\b/i.test(prompt) ||
    /^(?:later|eventually|tomorrow|after(?:ward|wards)?|in\s+the\s+future|if|when)\b/i.test(
      prompt,
    ) ||
    /^(?:previously|earlier|historically|last\s+turn)\b/i.test(prompt) ||
    /^(?:the\s+(?:screen|docs?|guide|transcript|message)\s+(?:says?|said|shows?|showed)|quoted?|someone\s+said)\b/i.test(
      prompt,
    ) ||
    /^(?:explain|describe|show\s+me|tell\s+me)\b[\s\S]{0,80}\bhow\s+to\b/i.test(
      prompt,
    )
  );
};

/**
 * Recognizes an affirmative request to record verified progress on an
 * existing durable Minecraft goal. This admits only the append capability;
 * the gateway still requires the exact current revision, identity, authority,
 * typed event payload, and evidence references before any ledger mutation.
 */
export const isAffirmativeMinecraftDurableGoalAppendPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  const existingGoalContext =
    /\benvironment_durable_goal:[a-z0-9][a-z0-9-]{7,}\b/i.test(prompt) ||
    isAffirmativeMinecraftDurableGoalInspectPrompt(prompt);
  if (!existingGoalContext) return false;

  const progressMutation =
    /\b(?:record|append|save|persist|write)\b[\s\S]{0,100}\b(?:progress|checkpoint|event|attempt|recovery|postcondition)\b|\b(?:mark|complete|advance|update)\b[\s\S]{0,100}\b(?:milestone|checkpoint|goal|postcondition)\b/giu;
  const candidates = [...prompt.matchAll(progressMutation)];
  return candidates.some((candidate) => {
    const index = candidate.index ?? 0;
    const prefix = prompt.slice(Math.max(0, index - 100), index);
    return !(
      /\b(?:do\s+not|don't|dont|never|avoid|without)\b[\s\S]{0,80}$/iu.test(
        prefix,
      ) ||
      /\b(?:later|eventually|tomorrow|after(?:ward|wards)?|in\s+the\s+future|if|when|unless|once)\b[\s\S]{0,80}$/iu.test(
        prefix,
      ) ||
      /\b(?:previously|earlier|historically|last\s+turn)\b[\s\S]{0,100}$/iu.test(
        prefix,
      ) ||
      /\b(?:screen|docs?|guide|transcript|message|example|quoted?|someone\s+said)\b[\s\S]{0,100}$/iu.test(
        prefix,
      ) ||
      /\b(?:explain|describe|show\s+me|tell\s+me)\b[\s\S]{0,80}\bhow\s+to\b[\s\S]{0,80}$/iu.test(
        prefix,
      )
    );
  });
};

/**
 * Admits an immediate game-world observation request without requiring the
 * user to repeat "Minecraft" on every turn. This is intentionally narrower
 * than generic tool-word matching and rejects contextual/non-executable text.
 */
export const isAffirmativeImmediateMinecraftSituationPrompt = (
  promptText: string | null | undefined,
): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  const actorStateQuestion = immediateMinecraftActorStateQuestion.test(prompt);
  return (
    !isMinecraftSituationSessionSetupPrompt(prompt) &&
    (
      (
        affirmativeObservationVerb.test(prompt) &&
        immediateGameSituationSubject.test(prompt) &&
        immediateCue.test(prompt)
      ) ||
      actorStateQuestion
    ) &&
    !negatedExecution.test(prompt) &&
    !futureOrConditionalExecution.test(prompt) &&
    !negatedActorStateQuestion.test(prompt) &&
    !futureOrConditionalActorStateQuestion.test(prompt) &&
    !quotedHistoricalOrCapabilityDiscussion.test(prompt)
  );
};
