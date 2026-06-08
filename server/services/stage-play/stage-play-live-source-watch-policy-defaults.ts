import type { StagePlayLiveSourceWatchJobPolicyV1 } from "@shared/contracts/stage-play-live-source-mail.v1";

export type StagePlayLiveSourceWatchJobPolicyDefaults = {
  objectiveText: string;
  decisionPolicyPrompt: string;
  interpretationMode: NonNullable<StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"]>;
  mailProcessingMode: NonNullable<StagePlayLiveSourceWatchJobPolicyV1["mailProcessingMode"]>;
  outputCadence: NonNullable<StagePlayLiveSourceWatchJobPolicyV1["outputCadence"]>;
  outputPolicy: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"];
  importanceCriteria: string[];
  suppressCriteria: string[];
};

const normalizeSpace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const hasVoiceCue = (objectiveText: string): boolean =>
  /\b(?:announce|voice|headphones|callout|call\s*out|speak|tell\s+me\s+aloud|commentate|commentary|narrate|narration)\b/i.test(objectiveText);

const isDescribeEachVisualSummaryBatchObjective = (objectiveText: string): boolean =>
  /\b(?:describe|summari[sz]e|report|tell\s+me)\b[\s\S]{0,120}\b(?:each|every|new)\b[\s\S]{0,120}\b(?:mail\s+batch|mail|summary|summaries|observation|update)s?\b/i.test(objectiveText) ||
  /\b(?:each|every|new)\b[\s\S]{0,120}\b(?:mail\s+batch|mail|summary|summaries|observation|update)s?\b[\s\S]{0,120}\b(?:describe|summari[sz]e|report|tell\s+me)\b/i.test(objectiveText) ||
  /\b(?:every\s+time|whenever|when)\b[\s\S]{0,80}\b(?:summary|summaries|mail|mail\s+batch|observation|update)\b[\s\S]{0,80}\b(?:comes?\s+in|arrives?|changes?|updates?)\b[\s\S]{0,120}\b(?:describe|summari[sz]e|report|tell\s+me)\b/i.test(objectiveText);

const isImportantOnlyObjective = (objectiveText: string): boolean =>
  /\bonly\b[\s\S]{0,80}\b(?:announce|notify|tell\s+me|speak|call\s*out|callout|describe|report)\b[\s\S]{0,100}\b(?:if|when|unless)\b/i.test(objectiveText) ||
  /\b(?:announce|notify|tell\s+me|speak|call\s*out|callout)\b[\s\S]{0,60}\b(?:if|when)\b[\s\S]{0,120}\b(?:anything\s+important|something\s+important|meaningful|risk|hostile|target|appears?|changes?|happens?)\b/i.test(objectiveText) ||
  /\b(?:don'?t|do\s+not)\s+bother\s+me\s+unless\b[\s\S]{0,140}\b(?:important|urgent|risk|danger|hostile|meaningful|salient|changes?)\b/i.test(objectiveText) ||
  /\b(?:if|when)\b[\s\S]{0,120}\b(?:anything\s+important|something\s+important|meaningful|risk|hostile|target|appears?|changes?|happens?)\b[\s\S]{0,80}\b(?:announce|notify|tell\s+me|speak|call\s*out|callout)\b/i.test(objectiveText);

const isInterpretEachVisualSummaryBatchObjective = (objectiveText: string): boolean =>
  /\b(?:interpret|compare|what\s+changed|what\s+is\s+happening|what's\s+happening|what\s+should\s+(?:be\s+)?watched\s+next|watch\s+next|story\s+so\s+far|observations?\s+mean|predict|might\s+happen\s+next|record\s+an?\s+interpretation|summari[sz]e\s+the\s+story)\b[\s\S]{0,180}\b(?:mail|summary|summaries|observation|update|live\s+source|visual\s+source|screen\s+summary|source)\b/i.test(objectiveText) ||
  /\b(?:mail|summary|summaries|observation|update|live\s+source|visual\s+source|screen\s+summary|source)\b[\s\S]{0,180}\b(?:interpret|compare|what\s+changed|what\s+is\s+happening|what's\s+happening|what\s+should\s+(?:be\s+)?watched\s+next|watch\s+next|story\s+so\s+far|observations?\s+mean|predict|might\s+happen\s+next|record\s+an?\s+interpretation|summari[sz]e\s+the\s+story)\b/i.test(objectiveText);

const isVoiceCommentaryObjective = (objectiveText: string): boolean =>
  /\b(?:commentate|commentary|narrate|narration|talk\s+me\s+through|while\s+i\s+play|as\s+i\s+play)\b/i.test(objectiveText) ||
  /\b(?:voice|announce|speak|call\s*out)\b[\s\S]{0,120}\b(?:while\s+i\s+play|as\s+i\s+play|commentary|narrat(?:e|ion))\b/i.test(objectiveText);

export const inferStagePlayLiveSourceInterpretationMode = (
  input: {
    objectiveText?: string | null;
    decisionPolicyPrompt?: string | null;
    outputPolicy?: Partial<StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"]> | null;
  },
): NonNullable<StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"]> => {
  const policyText = normalizeSpace([
    input.objectiveText ?? "",
    input.decisionPolicyPrompt ?? "",
  ].join("\n"));
  const voiceAllowed = input.outputPolicy?.allowVoiceCallout === true || hasVoiceCue(policyText);
  if (isImportantOnlyObjective(policyText)) return "salience_watch";
  if (
    voiceAllowed &&
    isVoiceCommentaryObjective(policyText)
  ) {
    return "voice_commentary_watch";
  }
  if (
    voiceAllowed &&
    /\b(?:request_voice_callout|voice|announce|speak|call\s*out|callout|say\s+it\s+out\s+loud)\b/i.test(policyText)
  ) {
    return "voice_callout_watch";
  }
  if (
    /\b(?:predict|prediction|might\s+happen\s+next|validation\s+signals?|horizon|watch\s+next|what\s+should\s+(?:be\s+)?watched\s+next|what\s+changed|what\s+is\s+happening|what's\s+happening)\b/i.test(policyText)
  ) {
    return "prediction_watch";
  }
  if (
    /\b(?:record_interpretation|interpret|interpretation|compare|what\s+changed|what\s+is\s+happening|watch\s+next|story\s+so\s+far|observations?\s+mean|running\s+story)\b/i.test(policyText)
  ) {
    return "batch_interpretation";
  }
  if (isDescribeEachVisualSummaryBatchObjective(policyText) || /\bdraft_text_answer\b/i.test(policyText)) {
    return "latest_scene_answer";
  }
  return "latest_scene_answer";
};

export const inferStagePlayLiveSourceMailProcessingMode = (
  input: {
    objectiveText?: string | null;
    decisionPolicyPrompt?: string | null;
    interpretationMode?: StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"] | null;
  },
): NonNullable<StagePlayLiveSourceWatchJobPolicyV1["mailProcessingMode"]> => {
  const policyText = normalizeSpace([
    input.objectiveText ?? "",
    input.decisionPolicyPrompt ?? "",
    input.interpretationMode ?? "",
  ].join("\n"));
  if (/\bper[-\s]?mail|each\s+mail\s+item|each\s+observation\s+separately\b/i.test(policyText)) return "per_mail";
  if (/\bsalience\s+window|only\s+salient|only\s+important|only\s+if\s+important|don'?t\s+bother\s+me\s+unless\b/i.test(policyText)) return "salience_window";
  if (/\bmicro[-\s]?batch|commentary|commentate|while\s+i\s+play|as\s+i\s+play|one\s+fps|1\s*fps\b/i.test(policyText)) return "micro_batch";
  if (/\bchronological|timeline|what\s+changed|interpret|prediction|predict|watch\s+next|batch_interpretation|prediction_watch\b/i.test(policyText)) return "chronological_batch";
  if (/\blatest\s+only|latest\s+scene|one\s+sentence|latest_scene_answer|describe\s+each\s+new\s+mail\s+batch\b/i.test(policyText)) return "latest_only";
  if (input.interpretationMode === "salience_watch" || input.interpretationMode === "voice_callout_watch") return "salience_window";
  if (input.interpretationMode === "voice_commentary_watch") return "micro_batch";
  if (input.interpretationMode === "batch_interpretation" || input.interpretationMode === "prediction_watch") return "chronological_batch";
  return "latest_only";
};

export const inferStagePlayLiveSourceOutputCadence = (
  input: {
    objectiveText?: string | null;
    decisionPolicyPrompt?: string | null;
    interpretationMode?: StagePlayLiveSourceWatchJobPolicyV1["interpretationMode"] | null;
    mailProcessingMode?: StagePlayLiveSourceWatchJobPolicyV1["mailProcessingMode"] | null;
  },
): NonNullable<StagePlayLiveSourceWatchJobPolicyV1["outputCadence"]> => {
  const policyText = normalizeSpace([
    input.objectiveText ?? "",
    input.decisionPolicyPrompt ?? "",
    input.interpretationMode ?? "",
    input.mailProcessingMode ?? "",
  ].join("\n"));
  if (/\bmanual\s+only|only\s+when\s+i\s+ask|on\s+request\b/i.test(policyText)) return "manual_only";
  if (/\bvoice\s+only\s+salient|voice_only_salient|announce\s+if|speak\s+if|call\s*out\s+if\b/i.test(policyText)) return "voice_only_salient";
  if (/\bonly\s+salient|only\s+important|only\s+if\s+important|don'?t\s+bother\s+me\s+unless|salience_watch\b/i.test(policyText)) return "only_salient";
  if (/\bevery\s+batch|each\s+new\s+mail\s+batch|each\s+batch|every\s+summary|every\s+update|latest_scene_answer\b/i.test(policyText)) return "every_batch";
  if (input.interpretationMode === "latest_scene_answer") return "every_batch";
  if (input.interpretationMode === "salience_watch") return "only_salient";
  if (input.interpretationMode === "voice_callout_watch" || input.interpretationMode === "voice_commentary_watch") return "voice_only_salient";
  return input.mailProcessingMode === "latest_only" ? "every_batch" : "only_salient";
};

const describeEachBatchObjectiveText = (objectiveText: string): string => {
  if (/\bactive\s+visual\s+source\b/i.test(objectiveText)) {
    return "Watch the active visual source and describe each new visual-summary mail batch in one sentence.";
  }
  if (/\bvisual\s+source\b/i.test(objectiveText)) {
    return "Watch the visual source and describe each new visual-summary mail batch in one sentence.";
  }
  return "Watch the live source and describe each new visual-summary mail batch in one sentence.";
};

export function buildStagePlayLiveSourceWatchJobPolicyDefaults(
  rawObjectiveText: string,
): StagePlayLiveSourceWatchJobPolicyDefaults {
  const objectiveText = normalizeSpace(rawObjectiveText) || "Watch the live source and record decisions when source mail arrives.";

  if (isInterpretEachVisualSummaryBatchObjective(objectiveText)) {
    return {
      objectiveText,
      interpretationMode: inferStagePlayLiveSourceInterpretationMode({
        objectiveText,
        decisionPolicyPrompt: "record_interpretation with running story and watch-next targets",
        outputPolicy: { allowVoiceCallout: hasVoiceCue(objectiveText) },
      }),
      mailProcessingMode: "chronological_batch",
      outputCadence: "only_salient",
      decisionPolicyPrompt: [
        "For each unread mail batch, read the listed mail refs as the current observation window.",
        "If the mail batch contains any compact visual summary, record the decision record_interpretation.",
        "The interpretation must include a concise batch interpretation, running story update, meaningful changes if any, uncertainties, and watch-next targets.",
        "If the user asks for prediction, include prediction text, horizon, confidence, and validation signals.",
        "If the batch is empty, record wait_for_next_summary.",
        "Do not claim visual evidence is unavailable when mail refs or compact summaries exist.",
        "After recording the decision, set nextLoopState to armed_for_next_summary.",
      ].join("\n"),
      outputPolicy: {
        allowTextAnswer: true,
        allowVoiceCallout: hasVoiceCue(objectiveText),
        voiceRequiresUrgency: true,
        confirmationRequired: true,
      },
      importanceCriteria: [
        "Any new visual-summary mail batch should update the narrative interpretation when the policy asks to interpret, compare, predict, or decide what to watch next.",
      ],
      suppressCriteria: [
        "Suppress only if no unread mail items exist or mail lacks compact summary text.",
      ],
    };
  }

  if (isDescribeEachVisualSummaryBatchObjective(objectiveText)) {
    return {
      objectiveText: describeEachBatchObjectiveText(objectiveText),
      interpretationMode: "latest_scene_answer",
      mailProcessingMode: "latest_only",
      outputCadence: "every_batch",
      decisionPolicyPrompt: [
        "For each unread mail batch, read the listed mail refs as the current observation window.",
        "If the mail batch contains any compact visual summary, record draft_text_answer.",
        "The textAnswerDraft must be one sentence describing what was observed.",
        "If the batch is empty, record wait_for_next_summary.",
        "Do not claim visual evidence is unavailable when mail refs or compact summaries exist.",
        "After recording the decision, set nextLoopState to armed_for_next_summary.",
      ].join("\n"),
      outputPolicy: {
        allowTextAnswer: true,
        allowVoiceCallout: false,
        voiceRequiresUrgency: true,
        confirmationRequired: true,
      },
      importanceCriteria: [
        "Any new visual-summary mail batch should produce a one-sentence text answer.",
      ],
      suppressCriteria: [
        "Suppress only if no unread mail items exist or mail lacks compact summary text.",
      ],
    };
  }

  if (isImportantOnlyObjective(objectiveText)) {
    const allowVoiceCallout = hasVoiceCue(objectiveText);
    return {
      objectiveText,
      interpretationMode: inferStagePlayLiveSourceInterpretationMode({
        objectiveText,
        decisionPolicyPrompt: "wait_for_next_summary unless salience criteria matched; request_voice_callout only when allowed",
        outputPolicy: { allowVoiceCallout },
      }),
      mailProcessingMode: "salience_window",
      outputCadence: allowVoiceCallout ? "voice_only_salient" : "only_salient",
      decisionPolicyPrompt: [
        "For each unread mail batch, read the listed mail refs as the current observation window.",
        "If there is no meaningful user-facing change, record wait_for_next_summary.",
        "If risk, actor/object change, or a user-mentioned target appears, record draft_text_answer.",
        "If voice callouts are allowed and the change is urgent enough for speech, record request_voice_callout with a concise voiceCalloutDraft.",
        "Do not claim visual evidence is unavailable when mail refs or compact summaries exist.",
        "After recording the decision, set nextLoopState to armed_for_next_summary.",
      ].join("\n"),
      outputPolicy: {
        allowTextAnswer: true,
        allowVoiceCallout,
        voiceRequiresUrgency: true,
        confirmationRequired: true,
      },
      importanceCriteria: [
        "Risk, actor/object change, or a user-mentioned target appearing should produce a user-facing decision.",
      ],
      suppressCriteria: [
        "If no meaningful user-facing change is present, record wait_for_next_summary.",
      ],
    };
  }

  const allowVoiceCallout = hasVoiceCue(objectiveText);
  return {
    objectiveText,
    interpretationMode: inferStagePlayLiveSourceInterpretationMode({
      objectiveText,
      decisionPolicyPrompt: "record draft_text_answer for meaningful compact summaries",
      outputPolicy: { allowVoiceCallout },
    }),
    mailProcessingMode: inferStagePlayLiveSourceMailProcessingMode({
      objectiveText,
      decisionPolicyPrompt: "record draft_text_answer for meaningful compact summaries",
      interpretationMode: inferStagePlayLiveSourceInterpretationMode({
        objectiveText,
        decisionPolicyPrompt: "record draft_text_answer for meaningful compact summaries",
        outputPolicy: { allowVoiceCallout },
      }),
    }),
    outputCadence: inferStagePlayLiveSourceOutputCadence({
      objectiveText,
      decisionPolicyPrompt: "record draft_text_answer for meaningful compact summaries",
      interpretationMode: inferStagePlayLiveSourceInterpretationMode({
        objectiveText,
        decisionPolicyPrompt: "record draft_text_answer for meaningful compact summaries",
        outputPolicy: { allowVoiceCallout },
      }),
    }),
    decisionPolicyPrompt: [
      "For each unread mail batch, read the listed mail refs as the current observation window.",
      "If the mail batch contains a meaningful compact summary, record draft_text_answer.",
      "If the batch is empty or lacks usable compact summary text, record wait_for_next_summary.",
      "Do not claim visual evidence is unavailable when mail refs or compact summaries exist.",
      "After recording the decision, set nextLoopState to armed_for_next_summary.",
    ].join("\n"),
    outputPolicy: {
      allowTextAnswer: true,
      allowVoiceCallout,
      voiceRequiresUrgency: true,
      confirmationRequired: true,
    },
    importanceCriteria: [
      "Meaningful compact live-source summaries should produce a concise text answer.",
    ],
    suppressCriteria: [
      "Suppress if no unread mail items exist or no compact summary text is available.",
    ],
  };
}
