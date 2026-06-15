import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { planRouter } from "../routes/agi.plan";
import { auditHelixTurnInputIntegrity } from "../services/helix-ask/turn-input-integrity-audit";
import {
  getHelixTurnAttachmentArtifactBody,
  normalizeHelixTurnInputItems,
} from "../services/helix-ask/turn-input-item-normalizer";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "12mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("helix ask turn input integrity audit", () => {
  it("rejects a visual prompt when the committed turn has no image or visual evidence item", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        sessionId: "test:turn-input-integrity:no-image",
        question: "Describe this image and use the calculator to add my inventory counts.",
        debug: true,
      })
      .expect(200);

    expect(response.body.route_reason_code).toBe("turn_input_integrity_failed");
    expect(response.body.answer).toContain("Reattach it and resend");
    expect(response.body.turn_input_integrity_audit).toEqual(
      expect.objectContaining({
        ok: false,
        assistant_answer: false,
      }),
    );
    expect(response.body.turn_input_integrity_audit.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "visual_prompt_without_visual_input" }),
      ]),
    );
    expect(response.body.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(response.body.poison_audit?.ok).toBe(true);
  });

  it("rejects an image item with no image bytes, image ref, or evidence ref", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        sessionId: "test:turn-input-integrity:stale-image",
        question: "describe this image",
        debug: true,
        turn_input_items: [
          { type: "text", text: "describe this image", source: "user" },
          {
            type: "image",
            mime_type: "image/png",
            file_name: "stale.png",
            raw_image_included: true,
            raw_image_scope: "turn_input_only",
          },
        ],
      })
      .expect(200);

    expect(response.body.route_reason_code).toBe("turn_input_integrity_failed");
    expect(response.body.turn_input_integrity_audit.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "visual_prompt_without_visual_input" }),
        expect.objectContaining({ kind: "stale_image_item" }),
      ]),
    );
    expect(JSON.stringify(response.body.turn_input_items)).not.toContain("stale.png");
  });

  it("allows nonvisual text-only prompts", () => {
    const requestBody = {
      question: "What is terminal authority?",
    };
    const context = normalizeHelixTurnInputItems({
      request: requestBody,
      threadId: "test:turn-input-integrity:text",
    });

    expect(
      auditHelixTurnInputIntegrity({
        userText: requestBody.question,
        request: requestBody,
        context,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        text_input_count: 1,
        image_input_count: 0,
        evidence_ref_count: 0,
      }),
    );
  });

  it("does not require image input for figurative science picture prompts", () => {
    const requestBody = {
      question:
        "How should I understand the popular vacuum-fluctuation picture in quantum field theory, and why is that picture only an analogy?",
    };
    const context = normalizeHelixTurnInputItems({
      request: requestBody,
      threadId: "test:turn-input-integrity:figurative-picture",
    });

    expect(
      auditHelixTurnInputIntegrity({
        userText: requestBody.question,
        request: requestBody,
        context,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        text_input_count: 1,
        image_input_count: 0,
        evidence_ref_count: 0,
      }),
    );
  });

  it("does not require image input for rubber-sheet relativity picture prompts", () => {
    const requestBody = {
      question:
        "In relativity, spacetime curvature is often pictured as a rubber sheet, but that picture seems misleading because it uses gravity to explain gravity and ignores time. What does curvature really mean mathematically and physically?",
    };
    const context = normalizeHelixTurnInputItems({
      request: requestBody,
      threadId: "test:turn-input-integrity:rubber-sheet-picture",
    });

    expect(
      auditHelixTurnInputIntegrity({
        userText: requestBody.question,
        request: requestBody,
        context,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        text_input_count: 1,
        image_input_count: 0,
        evidence_ref_count: 0,
      }),
    );
  });

  it("normalizer prefers full raw prompt over extracted question labels", () => {
    const fullPrompt = [
      "Question: diagnose Helix Ask large prompt behavior",
      "",
      "Full compound context:",
      "1. preserve global context",
      "2. compare with Codex compaction",
      "3. propose code changes",
    ].join("\n");
    const context = normalizeHelixTurnInputItems({
      request: {
        question: "diagnose Helix Ask large prompt behavior",
        prompt: fullPrompt,
        raw_user_prompt: fullPrompt,
      },
      threadId: "test:turn-input-integrity:compound-prompt",
    });

    expect(context.turn_input_items[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("Full compound context"),
      source: "user",
    });
  });

  it("normalizes text attachments as typed turn inputs with retrievable pasted-text artifacts", () => {
    const contentBase64 = Buffer.from("Large pasted text that should stay out of user prompt text.").toString("base64");
    const requestBody = {
      question: "Use the attached pasted text.",
      turn_input_items: [
        { type: "text", text: "Use the attached pasted text.", source: "user" },
        {
          type: "attachment",
          attachment_id: "paste:1",
          attachment_kind: "text",
          mime_type: "text/plain",
          file_name: "pasted-text.txt",
          size_bytes: 56,
          content_base64: contentBase64,
          preview: "Large pasted text that should stay out of user prompt text.",
          raw_content_included: true,
          raw_content_scope: "turn_input_only",
          assistant_answer: false,
        },
      ],
    };
    const context = normalizeHelixTurnInputItems({
      request: requestBody,
      threadId: "test:turn-input-integrity:text-attachment",
    });

    expect(context.turn_input_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "attachment",
          attachment_id: "paste:1",
          artifact_id: expect.stringContaining("pasted_text_attachment"),
          attachment_kind: "text",
          file_name: "pasted-text.txt",
          raw_content_included: false,
          raw_content_scope: null,
          content_sha256: expect.any(String),
        }),
      ]),
    );
    expect(context.attachment_artifacts).toEqual([
      expect.objectContaining({
        schema: "helix.pasted_text_attachment_artifact.v1",
        attachment_id: "paste:1",
        body_available: true,
        body_ref: expect.stringContaining("helix-turn-attachment://"),
        model_visible_summary: expect.stringContaining("Large pasted text"),
        raw_content_included: false,
      }),
    ]);
    expect(getHelixTurnAttachmentArtifactBody(context.attachment_artifacts?.[0]?.artifact_id)).toBe(
      "Large pasted text that should stay out of user prompt text.",
    );
    expect(JSON.stringify(context.turn_input_items)).not.toContain(contentBase64);
    expect(
      auditHelixTurnInputIntegrity({
        userText: requestBody.question,
        request: requestBody,
        context,
      }),
    ).toEqual(expect.objectContaining({ ok: true, attachment_input_count: 1 }));
  });

  it("admits explicit conversation-memory resume route metadata before pasted-text integrity rejection", async () => {
    const sentinel = "HELIX_PASTED_TEXT_RESUME_SENTINEL_ENDPOINT";
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        thread_id: "test:turn-input-integrity:explicit-resume-frame",
        session_id: "test:turn-input-integrity:explicit-resume-frame",
        turn_id: "turn-explicit-resume-frame",
        question: "What exact sentinel token was in the attached pasted text? Answer with only the sentinel token.",
        debug: true,
        routeMetadata: {
          schema: "helix.ask.route_metadata.v1",
          source: "conversation_memory_recall",
          sourceTarget: "conversation_memory",
          context_resume_frame: {
            schema: "helix.pasted_text_attachment_resume_frame.v1",
            id: "context_resume:endpoint",
            source_request_id: "turn-pause:context_compaction:pause",
            source_turn_id: "turn-pause",
            original_prompt: "Use the attached pasted text.",
            attachment_artifact_refs: ["thread:pasted_text_attachment:endpoint-sentinel"],
            attachment_previews: [`${sentinel}\nThis is compacted pasted text.`],
            turn_input_item_count: 2,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      })
      .expect(200);

    expect(response.body.route_reason_code).toBe("conversation_memory_recall");
    expect(response.body.answer).toBe(sentinel);
    expect(response.body.final_answer_source).toBe("conversation_memory_recall_answer");
    expect(response.body.turn_input_integrity_audit).toEqual(
      expect.objectContaining({
        ok: true,
        assistant_answer: false,
      }),
    );
    expect(response.body.conversation_memory_packet?.context_resume_frames?.[0]).toMatchObject({
      schema: "helix.pasted_text_attachment_resume_frame.v1",
      attachment_artifact_refs: ["thread:pasted_text_attachment:endpoint-sentinel"],
      attachment_previews: [`${sentinel}\nThis is compacted pasted text.`],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed when a prompt references attached pasted text without a pasted-text artifact", async () => {
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        sessionId: "test:turn-input-integrity:missing-paste",
        question: "Use the attached pasted text.",
        debug: true,
      })
      .expect(200);

    expect(response.body.route_reason_code).toBe("turn_input_integrity_failed");
    expect(response.body.final_answer_source).toBe("typed_failure");
    expect(response.body.answer).toContain("attached pasted text");
    expect(response.body.turn_input_integrity_audit.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "missing_pasted_text_attachment" }),
      ]),
    );
  });

  it("returns context compaction pause for oversized pasted-text attachments before direct answer", async () => {
    const largePaste = [
      "This is a large pasted-text checkpoint body.",
      "The sentinel instruction is at the end.",
      "filler ".repeat(12000),
      "SENTINEL: resume after compaction and answer from this pasted text.",
    ].join("\n");
    const response = await request(createApp())
      .post("/api/agi/ask/turn")
      .send({
        sessionId: "test:turn-input-integrity:large-paste-pause",
        turnId: "turn-large-paste-pause",
        question: "Use the attached pasted text.",
        debug: true,
        turn_input_items: [
          { type: "text", text: "Use the attached pasted text.", source: "user" },
          {
            type: "attachment",
            attachment_id: "paste:large",
            attachment_kind: "text",
            mime_type: "text/plain",
            file_name: "large-pasted-text.txt",
            size_bytes: Buffer.byteLength(largePaste, "utf8"),
            content_base64: Buffer.from(largePaste, "utf8").toString("base64"),
            preview: largePaste.slice(0, 300),
            raw_content_included: true,
            raw_content_scope: "turn_input_only",
            assistant_answer: false,
          },
        ],
      })
      .expect(200);

    expect(response.body.dispatch_policy).toBe("context_compaction_pause");
    expect(response.body.pending_server_request?.kind).toBe("context_compaction_pause");
    expect(response.body.pending_server_request?.resume_frame).toMatchObject({
      schema: "helix.pasted_text_attachment_resume_frame.v1",
      original_prompt: "Use the attached pasted text.",
      attachment_artifact_refs: [expect.stringContaining("pasted_text_attachment")],
    });
    expect(response.body.rolling_session_context_packet?.estimated_tokens?.current_turn_attachments).toBeGreaterThan(0);
    expect(response.body.context_fidelity_meter?.handoff_state?.state).toBe("pause_required");
    expect(response.body.final_answer_source).toBe("pending_server_request");
    expect(response.body.final_answer_source).not.toBe("model_direct_answer");
  });

  it("allows live visual tool requests to reach the agent loop without committed image input", () => {
    const requestBody = {
      question: "What is visible on my screen right now?",
    };
    const context = normalizeHelixTurnInputItems({
      request: requestBody,
      threadId: "test:turn-input-integrity:live-visual-tool",
    });

    expect(
      auditHelixTurnInputIntegrity({
        userText: requestBody.question,
        request: requestBody,
        context,
      }),
    ).toEqual(
      expect.objectContaining({
        ok: true,
        text_input_count: 1,
        image_input_count: 0,
        evidence_ref_count: 0,
      }),
    );
  });
});
