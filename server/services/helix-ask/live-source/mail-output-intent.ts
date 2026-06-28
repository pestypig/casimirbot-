export type AskTurnLiveSourceMailOutputIntent = {
  wantsTextAnswer: boolean;
  wantsInterpretation: boolean;
  wantsOneSentence: boolean;
  wantsWatchOnly: boolean;
  wantsImportanceOnly: boolean;
  wantsVoiceCallout: boolean;
  reasonCodes: string[];
};

export type AskTurnLiveSourceMailOutputIntentDependencies = {
  hasNegatedLiveSourceMailLoopIntent: (transcript: string) => boolean;
  hasContextualLiveSourceMailLoopIntent: (transcript: string) => boolean;
};

export const createLiveSourceMailOutputIntentDetector = (
  dependencies: AskTurnLiveSourceMailOutputIntentDependencies,
) => (transcript: string): AskTurnLiveSourceMailOutputIntent => {
  const reasonCodes: string[] = [];
  const text = transcript.trim();
  const contextualOrNegated =
    dependencies.hasNegatedLiveSourceMailLoopIntent(text) ||
    dependencies.hasContextualLiveSourceMailLoopIntent(text);
  const mentionsMail =
    /\b(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|check_live_source_mail)|processed\s+mail|processed\s+packet|mailbox|live[-\s]?source\s+mail|source\s+mail|new\s+source\s+mail|visual\s+mail|visual\s+summary\s+mail|latest\s+mail|latest\s+visual\s+update|visual\s+update|source\s+update|unread\s+(?:mail|updates?))\b/i.test(text);
  const mentionsLiveObservationContext =
    /\b(?:summary|summaries|observation|observations|live\s+source|live-source|visual\s+source|visual\s+summary|visual\s+update|latest\s+visual\s+update|screen\s+summary|source\s+update|watch\s+next|story\s+so\s+far|minecraft\s+video\s+predictor|contract)\b/i.test(text);
  const wantsOneSentence =
    /\b(?:one|1)\s+(?:concise\s+)?sentence\b/i.test(text) ||
    /\bin\s+(?:one|1)\s+(?:concise\s+)?sentence\b/i.test(text);
  if (wantsOneSentence) reasonCodes.push("one_sentence_requested");
  const wantsVoiceCallout =
    !contextualOrNegated &&
    (mentionsMail || mentionsLiveObservationContext) &&
    /\b(?:announce|notify|speak|say\s+it\s+out\s+loud|read\s+it\s+out\s+loud|voice|call\s*out|callout|tell\s+me\s+aloud)\b/i.test(text);
  if (wantsVoiceCallout) reasonCodes.push("voice_callout_requested");
  const wantsDescribe =
    /\b(?:describe|summari[sz]e|tell\s+me|answer|say|report|state|show)\b[\s\S]{0,160}\b(?:what|latest|current|active|unread|mail|mailbox|visual-summary|visual\s+summary|visual\s+update|source\s+update|observed|shows?|says?|visible)\b/i.test(text) ||
    /\b(?:what|latest|current|active|unread)\b[\s\S]{0,120}\b(?:mail|mailbox|visual-summary|visual\s+summary|visual\s+update|source\s+update|source\s+mail)\b[\s\S]{0,120}\b(?:shows?|says?|observed|contains?|reports?|visible)\b/i.test(text) ||
    /\bwhat\s+is\s+visible\b[\s\S]{0,120}\b(?:mail|mailbox|visual-summary|visual\s+summary|visual\s+update|source\s+update|source\s+mail|summary|summaries)\b/i.test(text);
  if (wantsDescribe) reasonCodes.push("mail_description_requested");
  const wantsInterpretation =
    !contextualOrNegated &&
    (mentionsMail || mentionsLiveObservationContext) &&
    (
      /\b(?:interpret|interpretation|what\s+is\s+happening|what's\s+happening|what\s+happened|what\s+changed|changed|changes|compare|comparison|meaning|make\s+sense\s+of|story|narrative|situation|observations?\s+mean|predict|prediction|might\s+happen\s+next|record\s+an?\s+interpretation|summari[sz]e\s+the\s+story)\b/i.test(text) ||
      /\b(?:what\s+should\s+(?:be\s+)?watched\s+next|watch\s+next|watch\s+target|next\s+watch\s+target|what\s+to\s+watch\s+next)\b/i.test(text) ||
      /\b(?:contract|minecraft\s+video\s+predictor|observed\s+facts?|cautious\s+inferences?|separate\s+observed\s+facts)\b/i.test(text)
    );
  if (wantsInterpretation) reasonCodes.push("mail_interpretation_requested");
  const wantsImportanceOnly =
    /\b(?:don'?t|do\s+not)\s+bother\s+me\s+unless\b[\s\S]{0,140}\b(?:important|urgent|risk|danger|hostile|meaningful|salient|changes?)\b/i.test(text) ||
    /\b(?:only|just)\b[\s\S]{0,80}\b(?:if|when|unless)\b[\s\S]{0,140}\b(?:important|urgent|risk|danger|hostile|meaningful|salient)\b/i.test(text) ||
    /\b(?:announce|notify|tell\s+me|speak|call\s*out|callout)\b[\s\S]{0,80}\b(?:if|when|unless)\b[\s\S]{0,140}\b(?:important|urgent|risk|danger|hostile|meaningful|salient)\b/i.test(text);
  if (wantsImportanceOnly) reasonCodes.push("importance_only");
  const wantsWatchOnly =
    !wantsDescribe &&
    (
      /\b(?:watch|monitor|keep\s+watching|keep\s+an\s+eye\s+on|observe)\b/i.test(text) ||
      /\bwait\s+for\s+(?:the\s+)?next\s+(?:summary|source\s+update|mail)\b/i.test(text)
    );
  if (wantsWatchOnly) reasonCodes.push("watch_only");
  const wantsTextAnswer =
    !contextualOrNegated &&
    mentionsMail &&
    !wantsInterpretation &&
    !wantsWatchOnly &&
    !wantsImportanceOnly &&
    !wantsVoiceCallout &&
    (wantsDescribe || wantsOneSentence);
  if (wantsTextAnswer) reasonCodes.push("text_answer_required_for_read_mail");
  return {
    wantsTextAnswer,
    wantsInterpretation,
    wantsOneSentence,
    wantsWatchOnly,
    wantsImportanceOnly,
    wantsVoiceCallout,
    reasonCodes,
  };
};
