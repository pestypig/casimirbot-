import { isAskTurnWorkspaceHelpIntent } from "./workspace-context-predicates";
import { buildAskTurnWorkspaceHelpAnswer } from "./workspace-help-answer";

export const buildAskTurnSimpleConversationAnswer = (transcript: string): string => {
  if (isAskTurnWorkspaceHelpIntent(transcript)) {
    return buildAskTurnWorkspaceHelpAnswer();
  }
  const normalized = transcript.trim().toLowerCase().replace(/\s+/g, " ");
  const statusCue =
    /\b(?:is this|is it|are we|is everything)\s+(?:working|on|live|connected|running|ok|okay)\b/.test(normalized) ||
    /\bis\s+this\s+thing\s+on\b/.test(normalized) ||
    /\b(?:you there|are you there|can you hear me|are you awake|you awake|are you alive|are you working|does this work|can this respond)\b/.test(normalized);
  const noToolCue =
    /\b(?:respond|reply|answer)\b/.test(normalized) &&
    /\b(?:without|no)\b[\s\S]*\b(?:workspace\s+actions?|tools?|tool\s+use|acting)\b/.test(normalized);
  if (noToolCue) {
    return "Yes. I can answer directly here. What would you like to do next?";
  }
  if (!statusCue && /^(?:hello|hi|hey|yo|howdy)\b/.test(normalized)) {
    return "Hello. What would you like to work on?";
  }
  return "Yes, Helix Ask is responding. What would you like to do next?";
};
