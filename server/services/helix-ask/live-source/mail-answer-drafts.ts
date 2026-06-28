import { readAskTurnString } from "../value-readers";

export type StagePlayMailVoiceCalloutCandidate = {
  shouldRequest: boolean;
  draft: string | null;
  reasonCodes: string[];
  rationale: string;
};

export const stagePlayWatchPolicyWantsTextForEveryMailBatch = (policy: Record<string, unknown> | null): boolean => {
  if (!policy) return false;
  const interpretationMode = readAskTurnString(policy.interpretationMode ?? policy.interpretation_mode);
  if (interpretationMode) return interpretationMode === "latest_scene_answer";
  const objective = readAskTurnString(policy.objectiveText ?? policy.objective_text) ?? "";
  const decisionPolicy = readAskTurnString(policy.decisionPolicyPrompt ?? policy.decision_policy_prompt) ?? "";
  const importanceCriteria = Array.isArray(policy.importanceCriteria ?? policy.importance_criteria)
    ? (policy.importanceCriteria ?? policy.importance_criteria) as unknown[]
    : [];
  const policyText = [
    objective,
    decisionPolicy,
    ...importanceCriteria.map((entry) => String(entry ?? "")),
  ].join("\n");
  return (
    /\beach\s+(?:new\s+)?(?:visual-summary\s+)?mail\s+batch\b/i.test(policyText) ||
    /\bany\s+new\s+visual-summary\s+mail\s+batch\b/i.test(policyText) ||
    /\brecord\s+draft_text_answer\b/i.test(policyText)
  );
};

export const compactStagePlayMailSummarySentence = (text: string): string => {
  const clean = text
    .replace(/\*\*/g, "")
    .replace(/[`#*_>~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "the latest visual summary contains a compact observation";
  const firstSentence = clean.match(/^(.+?[.!?])(?:\s|$)/)?.[1]?.trim() ?? clean;
  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217).trim()}...` : firstSentence;
};

export const collectStagePlayMailBatchSummaries = (items: Record<string, unknown>[]): string[] =>
  items
    .map((item) => {
      const summary = item.summary && typeof item.summary === "object" && !Array.isArray(item.summary)
        ? item.summary as Record<string, unknown>
        : null;
      return readAskTurnString(summary?.text) ?? readAskTurnString(summary?.preview);
    })
    .filter((entry): entry is string => Boolean(entry));

export const buildStagePlayMailBatchTextAnswerDraft = (items: Record<string, unknown>[]): string => {
  const summaries = collectStagePlayMailBatchSummaries(items);
  const summary = compactStagePlayMailSummarySentence(summaries.at(-1) ?? summaries[0] ?? "");
  return `The latest visual-summary mail reports ${summary.replace(/[.!?]+$/, "")}.`;
};

export const buildStagePlayMailVoiceCalloutCandidate = (
  items: Record<string, unknown>[],
): StagePlayMailVoiceCalloutCandidate => {
  const summaries = collectStagePlayMailBatchSummaries(items);
  const joined = summaries.join(" ");
  const reasonCodes: string[] = [];
  const hasDanger =
    /\b(?:danger|hostile|mob|creeper|zombie|skeleton|spider|enemy|attacking|attack|combat|fight|fighting|damage|damaged|taking\s+damage|low\s+health|lava|falling|drowning)\b/i.test(joined);
  const hasHostileMob =
    /\b(?:hostile\s+mob|creeper|zombie|skeleton|spider|enemy)\b/i.test(joined);
  const hasFire =
    /\b(?:on\s+fire|burning|fire|flames?|ablaze)\b/i.test(joined);
  const hasRareResource =
    /\b(?:diamond|diamonds|emerald|ancient\s+debris|netherite|rare\s+resource|valuable\s+item|ore)\b/i.test(joined);
  const hasMajorTransition =
    /\b(?:moves?\s+(?:outside|indoors|underground)|returns?\s+to\s+(?:base|inventory|chest)|scene\s+changes?|major\s+transition|switches?\s+(?:scene|window|area)|enters?\s+(?:cave|nether|village|stronghold)|leaves?\s+(?:base|cave|building))\b/i.test(joined);
  const routineOnly =
    !hasDanger &&
    !hasFire &&
    !hasRareResource &&
    !hasMajorTransition &&
    /\b(?:inventory|chest|base|interior|stable|same|routine\s+walking|walking)\b/i.test(joined);
  if (hasFire) reasonCodes.push("minecraft_fire_or_damage_cue");
  if (hasDanger) reasonCodes.push("minecraft_visible_danger_cue");
  if (hasRareResource) reasonCodes.push("minecraft_rare_resource_cue");
  if (hasMajorTransition) reasonCodes.push("major_scene_transition_cue");
  if (routineOnly) reasonCodes.push("routine_or_stable_scene_suppressed");
  if (hasFire) {
    return {
      shouldRequest: true,
      draft: "The player appears to be on fire or taking damage; watch for recovery or combat.",
      reasonCodes,
      rationale: "The visual-summary mail contains fire/damage cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasHostileMob) {
    return {
      shouldRequest: true,
      draft: "Hostile mob appeared near the player.",
      reasonCodes,
      rationale: "The visual-summary mail contains hostile-mob cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasDanger) {
    return {
      shouldRequest: true,
      draft: "A visible danger or combat cue appeared; watch for recovery, avoidance, or combat.",
      reasonCodes,
      rationale: "The visual-summary mail contains danger/combat cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasRareResource) {
    return {
      shouldRequest: true,
      draft: "A valuable resource appears to be visible; watch whether the player collects or uses it.",
      reasonCodes,
      rationale: "The visual-summary mail contains rare-resource cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasMajorTransition) {
    return {
      shouldRequest: true,
      draft: "The scene appears to shift to a new activity or area; watch what the player does next.",
      reasonCodes,
      rationale: "The visual-summary mail contains a major scene-transition cue, so the commentary policy should request a short provisional voice callout.",
    };
  }
  return {
    shouldRequest: false,
    draft: null,
    reasonCodes,
    rationale: routineOnly
      ? "The visual-summary mail looks routine or stable, so voice should be suppressed."
      : "No configured voice-callout salience cue was detected in the visual-summary mail.",
  };
};
