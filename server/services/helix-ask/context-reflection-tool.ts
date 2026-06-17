import {
  buildHelixContextReflectionToolReceiptV1,
  type HelixContextAttachmentKind,
  type HelixContextAttachmentSourceRole,
  type HelixContextAttachmentV1,
  type HelixContextReflectionRecommendedActionV1,
  type HelixContextReflectionToolReceiptV1,
  type HelixContextRegionV1,
  type HelixContextTimeSpanV1,
} from "../../../shared/contracts/helix-context-reflection-tool-receipt.v1";
import type { ToolFamily } from "./tool-family-contract";

type ContextReflectionAttachmentInput = Partial<HelixContextAttachmentV1> & {
  attachmentId: string;
  kind: HelixContextAttachmentKind;
  sourceRole?: HelixContextAttachmentSourceRole;
};

export type RunHelixContextReflectionToolInput = {
  turnId: string;
  threadId?: string | null;
  prompt: string;
  attachments: ContextReflectionAttachmentInput[];
  generatedAt?: string;
  receiptId?: string;
};

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const nullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeRegion = (region: HelixContextRegionV1 | null | undefined): HelixContextRegionV1 | null =>
  region
    ? {
        unit: region.unit,
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.height,
      }
    : null;

const normalizeTimeSpan = (timeSpan: HelixContextTimeSpanV1 | null | undefined): HelixContextTimeSpanV1 | null =>
  timeSpan
    ? {
        startMs: timeSpan.startMs,
        endMs: timeSpan.endMs,
        expiresAt: timeSpan.expiresAt ?? null,
      }
    : null;

function normalizeAttachment(input: ContextReflectionAttachmentInput): HelixContextAttachmentV1 {
  return {
    attachmentId: input.attachmentId,
    kind: input.kind,
    sourceRole: input.sourceRole ?? "explicit_user_selection",
    label: nullableString(input.label),
    panelId: nullableString(input.panelId),
    sourceId: nullableString(input.sourceId),
    artifactRef: nullableString(input.artifactRef),
    sourceRefs: uniqueStrings(input.sourceRefs ?? []),
    region: normalizeRegion(input.region),
    timeSpan: normalizeTimeSpan(input.timeSpan),
    contentDigest: nullableString(input.contentDigest),
    excerpt: nullableString(input.excerpt),
    bounded: input.bounded ?? true,
    stale: input.stale ?? false,
  };
}

function inferFamiliesForAttachment(attachment: HelixContextAttachmentV1): ToolFamily[] {
  const families: ToolFamily[] = ["context_reflection"];
  if (
    attachment.kind === "micro_reasoner_deck" ||
    attachment.kind === "macro_reasoner_deck" ||
    attachment.kind === "mail_loop_packet" ||
    attachment.kind === "live_source_span" ||
    attachment.panelId === "live-answer-environment"
  ) {
    families.push("live_source_mail");
  }
  if (attachment.kind === "document_span" || attachment.panelId === "docs-viewer") {
    families.push("docs_viewer");
  }
  if (attachment.kind === "voice_region" || attachment.panelId === "narrator") {
    families.push("voice_delivery");
  }
  if (attachment.kind === "ui_region" || attachment.kind === "workstation_panel") {
    families.push("workstation");
  }
  return families;
}

function action(
  input: Omit<HelixContextReflectionRecommendedActionV1, "reasonCodes"> & { reasonCodes?: string[] },
): HelixContextReflectionRecommendedActionV1 {
  return {
    ...input,
    reasonCodes: input.reasonCodes ?? [],
  };
}

function recommendedActionsFor(attachments: HelixContextAttachmentV1[]): HelixContextReflectionRecommendedActionV1[] {
  const actions: HelixContextReflectionRecommendedActionV1[] = [];
  if (attachments.some((attachment) => attachment.stale)) {
    actions.push(action({
      actionId: "helix_ask.refresh_context_attachment",
      label: "Refresh stale context attachment",
      toolFamily: "context_reflection",
      requiresOperatorCommand: false,
      reasonCodes: ["stale_context_reference"],
    }));
  }
  if (attachments.some((attachment) => attachment.kind === "micro_reasoner_deck")) {
    actions.push(action({
      actionId: "live_env.draft_micro_reasoner_preset",
      label: "Draft a revised microreasoner preset from the selected context",
      toolFamily: "live_source_mail",
      requiresOperatorCommand: true,
      reasonCodes: ["micro_reasoner_deck_selected", "mutation_requires_separate_admission"],
    }));
  }
  if (attachments.some((attachment) => attachment.kind === "macro_reasoner_deck")) {
    actions.push(action({
      actionId: "helix_ask.reflect_live_synthetic_data",
      label: "Reflect macro-reasoner deck outputs against live-source evidence",
      toolFamily: "context_reflection",
      requiresOperatorCommand: false,
      reasonCodes: ["macro_reasoner_deck_selected"],
    }));
  }
  if (attachments.some((attachment) => attachment.kind === "mail_loop_packet")) {
    actions.push(action({
      actionId: "live_env.read_processed_live_source_mail",
      label: "Read the referenced processed live-source packet",
      toolFamily: "live_source_mail",
      requiresOperatorCommand: false,
      reasonCodes: ["mail_loop_packet_selected"],
    }));
  }
  if (attachments.some((attachment) => attachment.kind === "document_span")) {
    actions.push(action({
      actionId: "docs-viewer.locate_in_doc",
      label: "Re-locate the selected document span before synthesis",
      toolFamily: "docs_viewer",
      requiresOperatorCommand: false,
      reasonCodes: ["document_span_selected"],
    }));
  }
  return actions;
}

function summarizeAttachments(attachments: HelixContextAttachmentV1[]): string {
  const kinds = uniqueStrings(attachments.map((attachment) => attachment.kind));
  const panels = uniqueStrings(attachments.map((attachment) => attachment.panelId ?? ""));
  const staleCount = attachments.filter((attachment) => attachment.stale).length;
  const panelText = panels.length ? ` from ${panels.join(", ")}` : "";
  const staleText = staleCount ? `; ${staleCount} reference${staleCount === 1 ? " is" : "s are"} stale` : "";
  return `${attachments.length} bounded context reference${attachments.length === 1 ? "" : "s"} selected${panelText}: ${kinds.join(", ")}${staleText}.`;
}

function missingEvidenceFor(attachments: HelixContextAttachmentV1[]): string[] {
  const missing: string[] = [];
  for (const attachment of attachments) {
    if (!attachment.contentDigest) missing.push(`${attachment.attachmentId}:content_digest`);
    if (!attachment.region && attachment.sourceRole === "dragged_cutout") missing.push(`${attachment.attachmentId}:region`);
    if (attachment.stale) missing.push(`${attachment.attachmentId}:fresh_reference`);
  }
  return uniqueStrings(missing);
}

export function runHelixContextReflectionTool(
  input: RunHelixContextReflectionToolInput,
): HelixContextReflectionToolReceiptV1 {
  const attachments = input.attachments.map(normalizeAttachment);
  const likelyToolFamilies = uniqueStrings(attachments.flatMap(inferFamiliesForAttachment));
  const selectedReferenceRefs = uniqueStrings(
    attachments.flatMap((attachment) => [
      attachment.attachmentId,
      attachment.sourceId ?? "",
      attachment.artifactRef ?? "",
      ...attachment.sourceRefs,
    ]),
  );

  return buildHelixContextReflectionToolReceiptV1({
    generatedAt: input.generatedAt,
    receiptId: input.receiptId,
    turnId: input.turnId,
    threadId: input.threadId ?? null,
    prompt: input.prompt,
    attachments,
    reflection: {
      summary: summarizeAttachments(attachments),
      selectedReferenceRefs,
      likelyToolFamilies,
      missingEvidence: missingEvidenceFor(attachments),
      claimBoundaries: [
        "Context reflection binds references for the solver; it is not answer authority.",
        "Context reflection does not grant execution permission for workstation, live-source, voice, or note mutations.",
        "Mutating follow-up actions require a separate admitted operator command and receipt.",
      ],
      recommendedNextActions: recommendedActionsFor(attachments),
    },
  });
}
