import type { ImageLensFocusBboxPctV1 } from "./image-lens-focus-run.v1";

export const IMAGE_ATTACHMENT_LENS_RUN_VERSION = "image_attachment_lens_run/v1" as const;

export type ImageAttachmentLensRunFocusRegionStatusV1 = "planned" | "submitted" | "blocked";

export type ImageAttachmentLensRunV1 = {
  contractVersion: typeof IMAGE_ATTACHMENT_LENS_RUN_VERSION;
  generatedAt: string;
  threadId: string;
  attachmentId: string;
  sourceId: string | null;
  sourceImageRef: string | null;
  admission: {
    admitted: boolean;
    reason: string;
    promptRequiresVisualInspection: boolean;
    autoOpenedImageLens: boolean;
  };
  broadObservation: {
    requested: boolean;
    frameHistoryId: string | null;
    evidenceId: string | null;
    summary: string | null;
    status: "submitted" | "blocked" | "not_requested";
  };
  focusRegions: Array<{
    regionId: string;
    bboxPct: ImageLensFocusBboxPctV1;
    reason: string;
    status: ImageAttachmentLensRunFocusRegionStatusV1;
    evidenceId?: string | null;
    frameId?: string | null;
  }>;
  blockers: string[];
  claimBoundary: {
    observationOnly: true;
    notAnswerAuthority: true;
    requiresSolverReentry: true;
  };
};

export type ImageAttachmentLensRunAdmissionV1 = {
  admitted: boolean;
  reason: string;
  promptRequiresVisualInspection: boolean;
};

function normalizedPrompt(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const VISUAL_TARGET_PATTERN =
  /\b(?:attached\s+image|image\s+attachment|this\s+image|the\s+image|picture|photo|screenshot|visual|figure|diagram|equation|region|crop|table|text)\b/i;
const VISUAL_INSPECTION_VERB_PATTERN =
  /\b(?:inspect|analy[sz]e|look\s+at|read|extract|crop|focus|zoom|locate|identify|describe|summari[sz]e|compare|transcribe)\b/i;
const VISUAL_QUESTION_PATTERN =
  /\b(?:what(?:'s| is)?|where|which|can you)\b[\s\S]{0,80}\b(?:in|on|from)\s+(?:this|the|my)?\s*(?:image|picture|photo|screenshot|attachment|visual)\b/i;
const NEGATED_VISUAL_TOOL_PATTERN =
  /\b(?:do\s+not|don't|dont|never|without|no)\b[\s\S]{0,80}\b(?:open|use|run|send|inspect|analy[sz]e|crop|focus|load)\b[\s\S]{0,80}\b(?:image\s+lens|lens|crop|image|attachment)\b/i;
const FUTURE_VISUAL_TOOL_PATTERN =
  /\b(?:later|eventually|one\s+day|next\s+patch|future|after\s+we|when\s+we)\b[\s\S]{0,120}\b(?:image\s+lens|crop|attached\s+image|image\s+attachment|visual)\b/i;
const INSTRUCTION_ONLY_PATTERN =
  /\b(?:write|draft|articulate|construct)\b[\s\S]{0,60}\b(?:instructions|plan|patch\s+plan)\b/i;

export function shouldAdmitImageAttachmentLensRun(prompt: string): ImageAttachmentLensRunAdmissionV1 {
  const normalized = normalizedPrompt(prompt);
  if (!normalized) {
    return {
      admitted: false,
      reason: "empty_prompt",
      promptRequiresVisualInspection: false,
    };
  }
  if (NEGATED_VISUAL_TOOL_PATTERN.test(normalized)) {
    return {
      admitted: false,
      reason: "negated_visual_tool_request",
      promptRequiresVisualInspection: false,
    };
  }
  if (FUTURE_VISUAL_TOOL_PATTERN.test(normalized) || INSTRUCTION_ONLY_PATTERN.test(normalized)) {
    return {
      admitted: false,
      reason: "future_or_instruction_only_visual_tool_mention",
      promptRequiresVisualInspection: false,
    };
  }

  const promptRequiresVisualInspection =
    (VISUAL_TARGET_PATTERN.test(normalized) && VISUAL_INSPECTION_VERB_PATTERN.test(normalized)) ||
    VISUAL_QUESTION_PATTERN.test(normalized);

  return {
    admitted: promptRequiresVisualInspection,
    reason: promptRequiresVisualInspection ? "visual_attachment_inspection_requested" : "prompt_does_not_request_visual_attachment_lens",
    promptRequiresVisualInspection,
  };
}

export function buildImageAttachmentLensRunV1(input: {
  generatedAt?: string;
  threadId: string;
  attachmentId: string;
  sourceId?: string | null;
  sourceImageRef?: string | null;
  admission: ImageAttachmentLensRunV1["admission"];
  broadObservation?: Partial<ImageAttachmentLensRunV1["broadObservation"]>;
  focusRegions?: ImageAttachmentLensRunV1["focusRegions"];
  blockers?: string[];
}): ImageAttachmentLensRunV1 {
  return {
    contractVersion: IMAGE_ATTACHMENT_LENS_RUN_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    threadId: input.threadId,
    attachmentId: input.attachmentId,
    sourceId: input.sourceId ?? null,
    sourceImageRef: input.sourceImageRef ?? null,
    admission: input.admission,
    broadObservation: {
      requested: input.broadObservation?.requested ?? false,
      frameHistoryId: input.broadObservation?.frameHistoryId ?? null,
      evidenceId: input.broadObservation?.evidenceId ?? null,
      summary: input.broadObservation?.summary ?? null,
      status: input.broadObservation?.status ?? "not_requested",
    },
    focusRegions: input.focusRegions ?? [],
    blockers: input.blockers ?? [],
    claimBoundary: {
      observationOnly: true,
      notAnswerAuthority: true,
      requiresSolverReentry: true,
    },
  };
}
