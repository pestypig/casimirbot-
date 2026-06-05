import type { StagePlayLiveSourceWatchJobPolicyV1 } from "@shared/contracts/stage-play-live-source-mail.v1";

export type StagePlayLiveSourceWatchJobPolicyDefaults = {
  objectiveText: string;
  decisionPolicyPrompt: string;
  outputPolicy: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"];
  importanceCriteria: string[];
  suppressCriteria: string[];
};

const normalizeSpace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const hasVoiceCue = (objectiveText: string): boolean =>
  /\b(?:announce|voice|headphones|callout|call\s*out|speak|tell\s+me\s+aloud)\b/i.test(objectiveText);

const isDescribeEachVisualSummaryBatchObjective = (objectiveText: string): boolean =>
  /\b(?:describe|summari[sz]e|report|tell\s+me)\b[\s\S]{0,120}\b(?:each|every|new)\b[\s\S]{0,120}\b(?:mail\s+batch|mail|summary|summaries|observation|update)s?\b/i.test(objectiveText) ||
  /\b(?:each|every|new)\b[\s\S]{0,120}\b(?:mail\s+batch|mail|summary|summaries|observation|update)s?\b[\s\S]{0,120}\b(?:describe|summari[sz]e|report|tell\s+me)\b/i.test(objectiveText) ||
  /\b(?:every\s+time|whenever|when)\b[\s\S]{0,80}\b(?:summary|summaries|mail|mail\s+batch|observation|update)\b[\s\S]{0,80}\b(?:comes?\s+in|arrives?|changes?|updates?)\b[\s\S]{0,120}\b(?:describe|summari[sz]e|report|tell\s+me)\b/i.test(objectiveText);

const isImportantOnlyObjective = (objectiveText: string): boolean =>
  /\bonly\b[\s\S]{0,80}\b(?:announce|notify|tell\s+me|speak|call\s*out|callout|describe|report)\b[\s\S]{0,100}\b(?:if|when|unless)\b/i.test(objectiveText) ||
  /\b(?:announce|notify|tell\s+me|speak|call\s*out|callout)\b[\s\S]{0,60}\b(?:if|when)\b[\s\S]{0,120}\b(?:anything\s+important|something\s+important|meaningful|risk|hostile|target|appears?|changes?|happens?)\b/i.test(objectiveText) ||
  /\b(?:if|when)\b[\s\S]{0,120}\b(?:anything\s+important|something\s+important|meaningful|risk|hostile|target|appears?|changes?|happens?)\b[\s\S]{0,80}\b(?:announce|notify|tell\s+me|speak|call\s*out|callout)\b/i.test(objectiveText);

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

  if (isDescribeEachVisualSummaryBatchObjective(objectiveText)) {
    return {
      objectiveText: describeEachBatchObjectiveText(objectiveText),
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
