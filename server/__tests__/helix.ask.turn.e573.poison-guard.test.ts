import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { auditHelixAskContextForPoison } from "../services/helix-ask/ask-context-poison-audit";
import { quarantineHelixArtifact } from "../services/helix-ask/deterministic-artifact-quarantine";
import { buildHelixTurnTerminalAuthority } from "../services/helix-ask/turn-terminal-authority";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const answerText = (body: any): string => String(body?.assistant_answer ?? body?.answer ?? body?.text ?? "");

describe("helix ask E573 deterministic artifact quarantine", () => {
  it("keeps synthetic evidence and UI projections out of assistant-answer authority", () => {
    const synthetic = quarantineHelixArtifact({
      schema: "helix.synthetic_evidence.v1",
      evidence_id: "evidence:1",
      deterministic: true,
      assistant_answer: false,
      raw_content_included: false,
      deterministic_content_role: "evidence_not_assistant_answer",
    });
    const projection = quarantineHelixArtifact({
      schema: "helix.present_state_card.v1",
      card_id: "card:1",
      deterministic: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    const poisoned = quarantineHelixArtifact({
      schema: "helix.synthetic_evidence.v1",
      evidence_id: "evidence:bad",
      deterministic: true,
      assistant_answer: true,
      raw_content_included: false,
      deterministic_content_role: "evidence_not_assistant_answer",
    });

    expect(synthetic.role).toBe("synthetic_evidence");
    expect(synthetic.can_be_assistant_answer).toBe(false);
    expect(synthetic.violations).toEqual([]);
    expect(projection.role).toBe("ui_projection");
    expect(projection.can_enter_model_context).toBe(false);
    expect(poisoned.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "deterministic_as_answer" })]),
    );
  });

  it("audits compact evidence packs without treating them as assistant history", () => {
    const terminal = buildHelixTurnTerminalAuthority({
      thread_id: "helix-ask:desktop",
      turn_id: "turn:e573",
      final_answer_source: "artifact_synthesis",
      terminal_artifact_kind: "situation_context_pack",
      terminal_text: "This is a normal synthesized answer.",
    });
    const audit = auditHelixAskContextForPoison({
      thread_id: "helix-ask:desktop",
      turn_id: "turn:e573",
      terminal_authority: terminal,
      payload: {
        turn_id: "turn:e573",
        assistant_answer: "This is a normal synthesized answer.",
        final_answer_source: "artifact_synthesis",
        terminal_artifact_kind: "situation_context_pack",
        selected_evidence_pack: {
          schema: "helix.selected_evidence_pack.v1",
          thread_id: "helix-ask:desktop",
          turn_id: "turn:e573",
          prompt: "Is this a chicken farm?",
          selected_evidence_ids: ["evidence:1"],
          selected_subgoal_ids: [],
          selected_note_refs: [],
          selected_tool_receipts: [],
          selected_live_environment_ids: [],
          selection_reason: "compact evidence only",
          budget: { max_items: 8, estimated_tokens: 12 },
          raw_content_included: false,
          deterministic_content_role: "evidence_not_assistant_answer",
        },
      },
      assistant_history_items: [],
    });

    expect(audit.ok).toBe(true);
    expect(audit.violations).toEqual([]);
    expect(audit.artifact_role_counts.validation).toBeGreaterThanOrEqual(1);
    expect(audit.assistant_history_projection_count).toBe(0);
  });

  it("attaches poison audit and terminal authority to normal Ask turn responses", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "hello",
        mode: "read",
        debug: true,
        sessionId: `e573-poison-route-${Date.now()}`,
      })
      .expect(200);

    expect(answerText(response.body)).toBeTruthy();
    expect(response.body?.poison_audit?.schema).toBe("helix.turn_poison_audit.v1");
    expect(response.body?.poison_audit?.ok).toBe(true);
    expect(response.body?.terminal_answer_authority?.schema).toBe("helix.turn_terminal_authority.v1");
    expect(response.body?.poison_audit?.terminal_authority?.server_terminal_text_hash).toBe(
      response.body?.terminal_answer_authority?.terminal_text_hash,
    );
    expect(response.body?.debug?.poison_audit?.ok).toBe(true);
  }, 90000);
});
