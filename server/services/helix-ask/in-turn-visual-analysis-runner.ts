import crypto from "node:crypto";
import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import type { HelixTurnInputItem } from "@shared/helix-turn-input-item";
import {
  HELIX_VISUAL_ANALYSIS_TURN_ITEM_SCHEMA,
  type HelixVisualAnalysisTurnItem,
} from "@shared/helix-visual-analysis-turn-item";
import type { HelixTurnItemLifecycleEvent } from "@shared/helix-turn-item-lifecycle";
import type { HelixVisualFrameEvidence } from "@shared/helix-visual-frame-evidence";
import {
  analyzeVisualFrame,
  recordVisualFrame,
} from "../situation-room/visual-snapshot-store";
import { appendInterpretedEvent } from "../situation-room/interpreted-event-log-store";
import { defaultVisionPrompt, getVisionProvider } from "../vision/provider";
import { makeTurnItemLifecycleEvent } from "./turn-item-lifecycle-ledger";

type ImageInputItem = Extract<HelixTurnInputItem, { type: "image" }>;

export type HelixInTurnVisualAnalysisResult = {
  context: HelixMultimodalTurnContext;
  visual_analysis_items: HelixVisualAnalysisTurnItem[];
  visual_frame_evidence: HelixVisualFrameEvidence[];
  lifecycle_events: HelixTurnItemLifecycleEvent[];
  had_native_image_input: boolean;
  failed_native_image_count: number;
};

const readImageBase64 = (item: ImageInputItem): string | null => {
  const raw = typeof item.image_base64 === "string" ? item.image_base64.trim() : "";
  if (!raw) return null;
  const dataUrlMatch = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  return (dataUrlMatch?.[2] ?? raw).replace(/\s+/g, "") || null;
};

export const helixVisualPromptRequestsNumericExtraction = (userPrompt: string): boolean =>
  !/\b(?:do\s+not|don't|dont|without|no)\b[^.!?\n]{0,80}\b(?:count|counts|counting|hotbar|inventory|slot|stack|item\s+counts?|inventory\s+numbers?)\b/i.test(userPrompt.trim()) &&
  /\b(?:count|counts|how many|add up|sum|total|calculator|calculate|hotbar|inventory|slot|stack)\b/i.test(userPrompt.trim());

export const stripUnrequestedNumericUiExtraction = (summary: string, userPrompt: string): string => {
  if (helixVisualPromptRequestsNumericExtraction(userPrompt)) return summary.trim();
  const countCenteredPattern =
    /\b(?:hotbar|inventory|slot|stack|item\s+count|item\s+counts|ui\s+count|ui\s+counts|displayed\s+hotbar\s+counts)\b/i;
  const countValuePattern =
    /\b(?:counts?|numbers?|values?)\b[^.\n]{0,80}(?:\d|unclear|unknown|\?)/i;
  const paragraphs = summary
    .split(/\n{2,}/)
    .map((paragraph) => {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => {
          const trimmed = sentence.trim();
          if (!trimmed) return false;
          return !(countCenteredPattern.test(trimmed) && countValuePattern.test(trimmed));
        });
      return sentences.join(" ").trim();
    })
    .filter((paragraph) => {
      if (!paragraph) return false;
      return !(countCenteredPattern.test(paragraph) && countValuePattern.test(paragraph));
    });
  return paragraphs.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
};

const buildPrompt = (userPrompt: string): string => {
  const trimmed = userPrompt.trim();
  const asksForCounts = helixVisualPromptRequestsNumericExtraction(trimmed);
  if (trimmed) {
    const lines = [
      `User visual task: ${trimmed}`,
      "Analyze the attached image as compact evidence inside this Helix Ask turn.",
      "Mention uncertainty instead of guessing unreadable numbers.",
    ];
    if (asksForCounts) {
      lines.push(
        "The user is asking for numeric extraction. If a Minecraft hotbar, inventory, counter, label, or other numeric UI is visible, transcribe only clearly readable counts explicitly as: hotbar counts: n, n, n.",
        "If a count is unclear, mark that slot as unclear instead of fabricating a value.",
      );
    } else {
      lines.push(
        "The user is asking for a general visual description. Do not transcribe hotbar counts, inventory counts, stack counts, or numeric UI values unless the user explicitly asks for counting or calculation.",
        "Describe the scene, visible objects, text, layout, people/characters, and notable relationships. Omit item-count sections.",
      );
    }
    return lines.join("\n");
  }
  return defaultVisionPrompt(
    "Describe the attached image for Helix Ask. Focus on visible objects, text, layout, and uncertainty. Do not prioritize numeric UI extraction unless it is central to the visible scene.",
  );
};

const makeAnalysisItem = (input: {
  itemId: string;
  threadId: string;
  turnId: string;
  sourceInputItemIndex: number;
  status: HelixVisualAnalysisTurnItem["status"];
  frameId?: string | null;
  evidenceId?: string | null;
  summary?: string | null;
  errorCode?: HelixVisualAnalysisTurnItem["error_code"];
  modelInvoked: boolean;
}): HelixVisualAnalysisTurnItem => ({
  schema: HELIX_VISUAL_ANALYSIS_TURN_ITEM_SCHEMA,
  item_id: input.itemId,
  thread_id: input.threadId,
  turn_id: input.turnId,
  status: input.status,
  source_input_item_index: input.sourceInputItemIndex,
  frame_id: input.frameId ?? null,
  evidence_id: input.evidenceId ?? null,
  summary: input.summary ?? null,
  error_code: input.errorCode ?? null,
  model_invoked: input.modelInvoked,
  assistant_answer: false,
  raw_image_included: false,
  context_policy: "compact_context_pack_only",
});

const pushLifecycle = (
  events: HelixTurnItemLifecycleEvent[],
  input: {
    threadId: string;
    turnId: string;
    itemId: string;
    completed: boolean;
  },
): void => {
  events.push(
    makeTurnItemLifecycleEvent({
      thread_id: input.threadId,
      turn_id: input.turnId,
      item_id: input.itemId,
      item_type: "visualAnalysis",
      event_type: "item_started",
      status: "inProgress",
      assistant_answer: false,
    }),
    makeTurnItemLifecycleEvent({
      thread_id: input.threadId,
      turn_id: input.turnId,
      item_id: input.itemId,
      item_type: "visualAnalysis",
      event_type: input.completed ? "item_completed" : "item_failed",
      status: input.completed ? "completed" : "failed",
      assistant_answer: false,
    }),
  );
};

export async function runInTurnVisualAnalysisForNativeImages(input: {
  threadId: string;
  turnId: string;
  userPrompt: string;
  context: HelixMultimodalTurnContext;
}): Promise<HelixInTurnVisualAnalysisResult> {
  const visualAnalysisItems: HelixVisualAnalysisTurnItem[] = [];
  const visualFrameEvidence: HelixVisualFrameEvidence[] = [];
  const lifecycleEvents: HelixTurnItemLifecycleEvent[] = [];
  let failedNativeImageCount = 0;
  let hadNativeImageInput = false;

  const nextItems: HelixTurnInputItem[] = [];
  for (const [index, item] of input.context.turn_input_items.entries()) {
    if (item.type !== "image") {
      nextItems.push(item);
      continue;
    }

    const imageBase64 = readImageBase64(item);
    if (!imageBase64) {
      nextItems.push(item);
      continue;
    }

    hadNativeImageInput = true;
    const itemId = `${input.turnId}:visual_analysis:${index}`;
    try {
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const imageHash = crypto.createHash("sha256").update(imageBuffer).digest("hex");
      const frame = recordVisualFrame({
        thread_id: input.threadId,
        source_id: "source:helix-ask-image-upload",
        source_surface: "manual_upload",
        capture_mode: "manual",
        raw_image_storage_policy: "ephemeral",
        image_ref: `ephemeral://helix-ask-upload/${imageHash.slice(0, 16)}`,
        image_sha256: imageHash,
        mime_type: item.mime_type,
      });
      const provider = getVisionProvider();
      const summary = await provider.describeImage(imageBase64, item.mime_type, buildPrompt(input.userPrompt));
      if (!summary?.trim()) {
        failedNativeImageCount += 1;
        const analysisItem = makeAnalysisItem({
          itemId,
          threadId: input.threadId,
          turnId: input.turnId,
          sourceInputItemIndex: index,
          status: "failed",
          frameId: frame.frame_id,
          errorCode: "vision_provider_unavailable",
          modelInvoked: true,
        });
        visualAnalysisItems.push(analysisItem);
        pushLifecycle(lifecycleEvents, { threadId: input.threadId, turnId: input.turnId, itemId, completed: false });
        nextItems.push({
          type: "image",
          image_ref: frame.frame_id,
          mime_type: item.mime_type,
          file_name: item.file_name ?? null,
          evidence_id: null,
          raw_image_included: false,
          raw_image_scope: null,
        });
        continue;
      }

      const evidence = analyzeVisualFrame({
        thread_id: frame.thread_id,
        frame_id: frame.frame_id,
        source_id: frame.source_id,
        mime_type: frame.mime_type,
        image_model: process.env.VISION_HTTP_MODEL || process.env.LLM_HTTP_MODEL || "gpt-4o-mini",
        summary: summary.trim(),
        uncertainty: [],
      });
      appendInterpretedEvent({
        thread_id: evidence.thread_id,
        source_family: "visual_snapshot",
        kind: "visual_observation",
        title: "Visual frame analyzed",
        summary: evidence.summary,
        evidence_refs: [evidence.evidence_id],
        source_event_ids: [evidence.frame_id],
        model_invoked: evidence.model_invoked,
        deterministic: false,
        created_at: evidence.ts,
      });
      const analysisItem = makeAnalysisItem({
        itemId,
        threadId: input.threadId,
        turnId: input.turnId,
        sourceInputItemIndex: index,
        status: "completed",
        frameId: frame.frame_id,
        evidenceId: evidence.evidence_id,
        summary: evidence.summary,
        modelInvoked: true,
      });
      visualAnalysisItems.push(analysisItem);
      visualFrameEvidence.push(evidence);
      pushLifecycle(lifecycleEvents, { threadId: input.threadId, turnId: input.turnId, itemId, completed: true });
      nextItems.push(
        {
          type: "image",
          image_ref: frame.frame_id,
          mime_type: item.mime_type,
          file_name: item.file_name ?? null,
          evidence_id: evidence.evidence_id,
          raw_image_included: false,
          raw_image_scope: null,
        },
        {
          type: "evidence_ref",
          evidence_id: evidence.evidence_id,
          evidence_kind: "visual_frame_evidence",
          compact_summary: evidence.summary,
          assistant_answer: false,
          raw_content_included: false,
        },
      );
    } catch (_error) {
      failedNativeImageCount += 1;
      const analysisItem = makeAnalysisItem({
        itemId,
        threadId: input.threadId,
        turnId: input.turnId,
        sourceInputItemIndex: index,
        status: "failed",
        errorCode: "vision_parse_error",
        modelInvoked: true,
      });
      visualAnalysisItems.push(analysisItem);
      pushLifecycle(lifecycleEvents, { threadId: input.threadId, turnId: input.turnId, itemId, completed: false });
    }
  }

  const visualEvidenceRefs = Array.from(new Set([
    ...input.context.visual_evidence_refs,
    ...visualFrameEvidence.map((evidence) => evidence.evidence_id),
  ]));
  const selectedEvidenceRefs = Array.from(new Set([
    ...input.context.selected_evidence_refs,
    ...visualFrameEvidence.map((evidence) => evidence.evidence_id),
  ]));

  return {
    context: {
      ...input.context,
      turn_input_items: nextItems,
      visual_evidence_refs: visualEvidenceRefs,
      selected_evidence_refs: selectedEvidenceRefs,
      raw_image_included: false,
      assistant_answer: false,
      context_policy: "compact_context_pack_only",
    },
    visual_analysis_items: visualAnalysisItems,
    visual_frame_evidence: visualFrameEvidence,
    lifecycle_events: lifecycleEvents,
    had_native_image_input: hadNativeImageInput,
    failed_native_image_count: failedNativeImageCount,
  };
}

export function sanitizeNativeImageTurnInputItems(items: HelixTurnInputItem[]): HelixTurnInputItem[] {
  return items.map((item) => {
    if (item.type !== "image") return item;
    const { image_base64: _imageBase64, ...rest } = item;
    return {
      ...rest,
      raw_image_included: false,
      raw_image_scope: null,
    };
  });
}
