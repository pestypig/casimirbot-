export const isAskTurnLiveAnswerEnvironmentStateIntent = (transcript: string): boolean => {
  const mentionsLiveAnswer =
    /\b(?:live\s+(?:answer\s+)?environment|live\s+answer\s+card|live\s+card|active\s+live\s+(?:answer\s+)?(?:environment|source|job)|live\s+calculator\s+(?:source|job|environment)|calculator\s+live\s+(?:source|job|environment))\b/i.test(
      transcript,
    );
  if (!mentionsLiveAnswer) return false;
  return /\b(?:latest|current|result|value|equation|line|quiet|silent|threshold|cross(?:ed|es|ing)?|changed|state|status|why)\b/i.test(
    transcript,
  );
};
