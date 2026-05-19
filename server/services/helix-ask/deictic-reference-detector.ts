import crypto from "node:crypto";
import {
  HELIX_DEICTIC_REFERENCE_SCHEMA,
  type HelixDeicticInputModality,
  type HelixDeicticReference,
  type HelixDeicticReferenceType,
  type HelixDeicticResolutionStatus,
} from "@shared/helix-deictic-reference";
import { isSceneEpochReplayPrompt } from "./scene-epoch-replay-intent";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const repoCodeContextRe =
  /\b(?:repo|repository|code|source|implementation|module|contract|schema|route|endpoint|line-backed|line backed|file paths?|where is .* enforced)\b/i;

const explicitScreenContextRe =
  /\b(?:my screen|current screen|current window|current tab|visual capture|screen capture|visual source|visual frame|visual screen|visuals|looking at right now|clicking|clicked|selected|selected visible file|visible selected file|window i am viewing|screen i am viewing)\b/i;

export function detectDeicticReference(input: {
  threadId: string;
  promptText: string;
  inputModality?: HelixDeicticInputModality;
  resolvedContextRefs?: string[];
  resolutionStatus?: HelixDeicticResolutionStatus;
}): HelixDeicticReference {
  const prompt = input.promptText.trim();
  const text = normalize(prompt);
  const repoCodeContextWithoutScreen = repoCodeContextRe.test(prompt) && !explicitScreenContextRe.test(prompt);
  const epochChangeRe =
    /\b(?:changed|last\s+step|card\s+update|confidence\s+change|why\s+did)\b/;
  const referenceType: HelixDeicticReferenceType =
    repoCodeContextWithoutScreen
      ? "unknown"
      : isSceneEpochReplayPrompt(prompt) || epochChangeRe.test(text)
      ? "latest_epoch_change"
      : /\b(?:compare|comparison|next\s+(?:one|file|image|picture|screen)|about\s+to\s+show|first\s+(?:picture|image|file))\b/.test(text)
      ? "comparison_target"
      : /\b(?:clicking|clicked|selected|selection|highlighted|file\s+i(?:'m| am)?\s+(?:clicking|selecting|looking\s+at)|selected\s+(?:file|item))\b/.test(text)
          ? "selected_visible_file"
          : /\b(?:what\s+am\s+i\s+doing|doing\s+right\s+now|current\s+activity)\b/.test(text)
            ? "current_activity"
            : /\b(?:what\s+am\s+i\s+looking\s+at|what\s+is\s+(?:in|inside)\s+(?:the\s+)?(?:visual\s+capture|screen\s+capture|visual\s+source|visual\s+frame|visuals)|(?:describe|explain|summari[sz]e)\s+(?:what\s+)?(?:the\s+)?visuals\s+(?:are|show|contain|depict)|what\s+is\s+on\s+(?:my|the)\s+screen|current\s+(?:screen|window|tab|folder|file|document|image|picture|photo)|latest\s+(?:visual|screen|frame|observation)|visual\s+capture|screen\s+capture|visual\s+source|visual\s+frame|visuals|screen|window|tab|folder|file|document|image|picture|photo|looking\s+at|viewing|can\s+you\s+see\s+(?:the\s+)?(?:screen|window|folder|file|document|image|picture|photo)|do\s+you\s+see\s+(?:the\s+)?(?:screen|window|folder|file|document|image|picture|photo))\b/.test(text)
              ? "current_screen"
              : "unknown";
  const candidateSignal = referenceType !== "unknown";
  const confidence =
    referenceType === "selected_visible_file" || referenceType === "comparison_target" || referenceType === "latest_epoch_change"
      ? 0.82
      : referenceType === "current_screen" || referenceType === "current_activity"
        ? 0.72
        : 0.2;
  return {
    schema: HELIX_DEICTIC_REFERENCE_SCHEMA,
    reference_id: `deictic_reference:${hashShort([input.threadId, prompt, referenceType])}`,
    thread_id: input.threadId,
    prompt_text: prompt,
    input_modality: input.inputModality ?? "typed",
    reference_type: referenceType,
    candidate_signal: candidateSignal,
    resolved_context_refs: Array.from(new Set(input.resolvedContextRefs ?? [])).slice(-40),
    confidence,
    resolution_status: input.resolutionStatus ?? (candidateSignal ? "ambiguous" : "missing_context"),
    assistant_answer: false,
    raw_content_included: false,
  };
}
