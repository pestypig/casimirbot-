import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { planRouter } from "../routes/agi.plan";
import { auditHelixTurnInputIntegrity } from "../services/helix-ask/turn-input-integrity-audit";
import { normalizeHelixTurnInputItems } from "../services/helix-ask/turn-input-item-normalizer";

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

  it("normalizes text attachments as typed turn inputs without retaining raw content", () => {
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
          attachment_kind: "text",
          file_name: "pasted-text.txt",
          raw_content_included: false,
          raw_content_scope: null,
          content_sha256: expect.any(String),
        }),
      ]),
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
