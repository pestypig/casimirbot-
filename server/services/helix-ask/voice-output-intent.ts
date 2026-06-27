export const isAskTurnDottieVoiceReadoutIntent = (transcript: string): boolean =>
  (
    /\b(?:have|ask|tell)\s+(?:auntie\s+)?dottie\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b/i.test(
      transcript,
    ) ||
    /\b(?:auntie\s+)?dottie\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b/i.test(
      transcript,
    ) ||
    /\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b[\s\S]{0,120}\b(?:auntie\s+)?dottie\b/i.test(
      transcript,
    )
  ) &&
  !/\b(?:do\s+not|don't|dont|without|not\s+asking\s+to)\b[\s\S]{0,80}\b(?:read|speak|say|narrate|voice)\b/i.test(
    transcript,
  );

export type HelixAskVoiceOutputIntentLike = {
  kind: string;
};

export type HelixAskDocsReadAloudIntentReaderDependencies = {
  classifyAskTurnVoiceOutputIntent: (transcript: string) => HelixAskVoiceOutputIntentLike;
};

export const createAskTurnDocsReadAloudIntentReader = (
  deps: HelixAskDocsReadAloudIntentReaderDependencies,
) => {
  const isAskTurnDocsReadAloudIntent = (transcript: string): boolean =>
    deps.classifyAskTurnVoiceOutputIntent(transcript).kind === "document_read" &&
    !isAskTurnDottieVoiceReadoutIntent(transcript);

  return {
    isAskTurnDocsReadAloudIntent,
  };
};
