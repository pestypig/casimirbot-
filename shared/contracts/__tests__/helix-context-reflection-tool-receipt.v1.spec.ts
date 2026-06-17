import { describe, expect, it } from "vitest";
import {
  buildHelixContextReflectionToolReceiptV1,
  HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID,
  HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION,
  isHelixContextReflectionToolReceiptV1,
  validateHelixContextReflectionToolReceiptV1,
  type HelixContextAttachmentV1,
} from "../helix-context-reflection-tool-receipt.v1";

const attachment: HelixContextAttachmentV1 = {
  attachmentId: "ctx:live-answer:microdeck:1",
  kind: "micro_reasoner_deck",
  sourceRole: "dragged_cutout",
  label: "Earbud translation microdeck",
  panelId: "live-answer-environment",
  sourceId: "live-source:voice:earbud",
  artifactRef: "stage_play_micro_reasoner_prompt_preset_query_result:v1",
  sourceRefs: ["live-source:voice:earbud", "frame-span:120-180"],
  region: {
    unit: "css_px",
    left: 12,
    top: 24,
    width: 280,
    height: 96,
  },
  timeSpan: {
    startMs: 120000,
    endMs: 180000,
    expiresAt: "2026-06-17T18:00:00.000Z",
  },
  contentDigest: "sha256:test",
  excerpt: "Microreasoner preset for translating the live source.",
  bounded: true,
  stale: false,
};

function receiptFixture() {
  return buildHelixContextReflectionToolReceiptV1({
    generatedAt: "2026-06-17T16:00:00.000Z",
    receiptId: "helix-context-reflection-tool-receipt:test",
    turnId: "turn:context-reflection",
    threadId: "thread:context-reflection",
    prompt: "Change this microreasoner to produce x from live source y.",
    attachments: [attachment],
    reflection: {
      summary: "One bounded microreasoner deck reference was selected from the live answer environment.",
      selectedReferenceRefs: [attachment.attachmentId, "live-source:voice:earbud"],
      likelyToolFamilies: ["context_reflection", "live_source_mail"],
      missingEvidence: ["target_output_contract"],
      claimBoundaries: [
        "The dragged cutout is context evidence only.",
        "Changing the preset requires a separate admitted operator command.",
      ],
      recommendedNextActions: [
        {
          actionId: "live_env.draft_micro_reasoner_preset",
          label: "Draft a revised microreasoner preset",
          toolFamily: "live_source_mail",
          requiresOperatorCommand: true,
          reasonCodes: ["micro_reasoner_deck_selected", "mutation_requires_separate_admission"],
        },
      ],
    },
  });
}

describe("helix context reflection tool receipt v1", () => {
  it("builds a valid bounded context-binding evidence receipt", () => {
    const receipt = receiptFixture();

    expect(receipt.artifactId).toBe(HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_ARTIFACT_ID);
    expect(receipt.schemaVersion).toBe(HELIX_CONTEXT_REFLECTION_TOOL_RECEIPT_SCHEMA_VERSION);
    expect(receipt.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      panel_generated_answer: false,
      ask_context_policy: "evidence_only",
      deterministic_content_role: "context_binding_not_answer",
      execution_permission: false,
    });
    expect(receipt.attachments[0]).toMatchObject({
      kind: "micro_reasoner_deck",
      sourceRole: "dragged_cutout",
      bounded: true,
      stale: false,
    });
    expect(validateHelixContextReflectionToolReceiptV1(receipt)).toEqual([]);
    expect(isHelixContextReflectionToolReceiptV1(receipt)).toBe(true);
  });

  it("rejects unbounded context attachments", () => {
    const receipt = {
      ...receiptFixture(),
      attachments: [
        {
          ...attachment,
          bounded: false,
        },
      ],
    };

    expect(validateHelixContextReflectionToolReceiptV1(receipt)).toContain(
      "attachments[0].bounded must be true",
    );
  });

  it("rejects context receipts that try to grant execution permission", () => {
    const receipt = {
      ...receiptFixture(),
      authority: {
        ...receiptFixture().authority,
        execution_permission: true,
      },
    };

    expect(validateHelixContextReflectionToolReceiptV1(receipt)).toContain(
      "authority.execution_permission must be false",
    );
  });

  it("rejects empty attachment provenance", () => {
    const receipt = {
      ...receiptFixture(),
      attachments: [
        {
          ...attachment,
          sourceId: null,
          artifactRef: null,
          sourceRefs: [],
        },
      ],
    };

    expect(validateHelixContextReflectionToolReceiptV1(receipt)).toContain(
      "attachments[0] must include sourceId, artifactRef, or sourceRefs",
    );
  });

  it("rejects authority-like prose inside the reflection", () => {
    const receipt = {
      ...receiptFixture(),
      reflection: {
        ...receiptFixture().reflection,
        summary: "The selected cutout executed the change.",
      },
    };

    expect(validateHelixContextReflectionToolReceiptV1(receipt)).toContain(
      "forbidden context-reflection authority text matched: \\bexecuted the change\\b",
    );
  });
});
