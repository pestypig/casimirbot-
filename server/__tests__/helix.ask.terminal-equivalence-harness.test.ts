import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { buildTerminalEquivalenceHarnessResult } from "../services/helix-ask/terminal-equivalence-harness";
import { buildHelixTurnTerminalAuthority, hashHelixTerminalText } from "../services/helix-ask/turn-terminal-authority";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const parseSse = (text: string): Array<{ event: string; data: Record<string, unknown> }> =>
  text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const event = block.match(/^event:\s*(.+)$/m)?.[1]?.trim() ?? "message";
      const dataText = block.match(/^data:\s*(.+)$/m)?.[1]?.trim() ?? "{}";
      return { event, data: JSON.parse(dataText) as Record<string, unknown> };
    });

const finalText = (body: Record<string, unknown>): string =>
  String(body.selected_final_answer ?? body.answer ?? body.assistant_answer ?? body.text ?? "");

describe("Helix stream/UI/backend terminal equivalence harness", () => {
  it("keeps non-stream, stream, debug, terminal authority, poison audit, route authority, and solver trace equivalent", async () => {
    const app = createApp();
    const question = "what is happening in the visual screen capture?";
    const sessionId = `terminal-equivalence-${Date.now()}`;
    await request(app)
      .post("/api/agi/situation/test-harness/live-visual-source")
      .send({
        thread_id: sessionId,
        source_id: `visual_source:${sessionId}`,
        scene_text: "A seeded visual capture shows a terminal equivalence test screen.",
        activity: "Reviewing the terminal equivalence harness output.",
        objects: "test screen, terminal output, debug panel",
        confidence: 0.82,
      })
      .expect(200);

    const nonStream = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question, mode: "read", debug: true, sessionId })
      .expect(200);
    const debug = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(String(nonStream.body.turn_id))}/debug-export`)
      .expect(200);
    const stream = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({ question, mode: "read", debug: true, sessionId })
      .expect(200);
    const streamEvents = parseSse(stream.text);
    const turnFinal = streamEvents.find((entry) => entry.event === "turn_final")?.data;
    const terminalEvent = streamEvents.find(
      (entry) =>
        entry.event === "turn_transcript_event" &&
        (entry.data.source_event_type === "terminal_answer" || entry.data.type === "final_answer"),
    )?.data;

    expect(turnFinal).toBeTruthy();
    const result = buildTerminalEquivalenceHarnessResult({
      nonStreamResponse: nonStream.body,
      streamFinal: turnFinal,
      streamTerminalEvent: terminalEvent,
      debugExport: debug.body,
      visibleUiAnswerState: {
        question,
        finalAnswer: finalText(nonStream.body),
      },
    });
    expect(result).toMatchObject({
      schema: "helix.terminal_equivalence_harness_result.v1",
      ok: true,
      failure_codes: [],
    });
    expect(nonStream.body.terminal_answer_authority?.server_authoritative).toBe(true);
    expect(nonStream.body.poison_audit?.ok).toBe(true);
    expect(nonStream.body.route_authority_audit).toBeTruthy();
    expect(nonStream.body.ask_turn_solver_trace).toBeTruthy();
    expect(turnFinal?.client_server_terminal_match).toBe(true);
  }, 60_000);

  it("detects stale UI projection over a hidden typed failure authority", () => {
    const terminalText = "I could not complete this Ask turn because solver authority failed.";
    const staleProjection = "The screen shows a successful descriptive visual answer.";
    const authority = buildHelixTurnTerminalAuthority({
      thread_id: "helix-ask:test",
      turn_id: "ask:stale-ui",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_text: terminalText,
      route: "visual / typed_failure",
    });
    const result = buildTerminalEquivalenceHarnessResult({
      nonStreamResponse: {
        turn_id: "ask:stale-ui",
        selected_final_answer: terminalText,
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        terminal_answer_authority: authority,
        poison_audit: {
          ok: true,
          terminal_authority: {
            server_terminal_text_hash: authority.terminal_text_hash,
            client_visible_text_hash: authority.terminal_text_hash,
          },
        },
        route_authority_audit: { route_authority_ok: true },
        ask_turn_solver_trace: { completed_solver_path: true },
      },
      visibleUiAnswerState: {
        question: "what is on screen",
        finalAnswer: staleProjection,
      },
    });

    expect(result.failure_codes).toEqual(
      expect.arrayContaining([
        "visible_state_differs_from_terminal",
        "ui_success_with_typed_failure_authority",
        "poison_hashes_hidden_terminal_while_ui_stale",
      ]),
    );
  });

  it("detects stream terminal text that diverges from /ask/turn terminal text", () => {
    const terminalText = "Hello.";
    const authority = buildHelixTurnTerminalAuthority({
      thread_id: "helix-ask:test",
      turn_id: "ask:stream-mismatch",
      final_answer_source: "no_tool_direct",
      terminal_artifact_kind: "direct_answer_text",
      terminal_text: terminalText,
      route: "conversation:simple",
    });
    const result = buildTerminalEquivalenceHarnessResult({
      nonStreamResponse: {
        turn_id: "ask:stream-mismatch",
        selected_final_answer: terminalText,
        final_answer_source: "no_tool_direct",
        terminal_artifact_kind: "direct_answer_text",
        terminal_answer_authority: authority,
        poison_audit: {
          ok: true,
          terminal_authority: {
            server_terminal_text_hash: authority.terminal_text_hash,
            client_visible_text_hash: authority.terminal_text_hash,
          },
        },
        route_authority_audit: { route_authority_ok: true },
        ask_turn_solver_trace: { completed_solver_path: true },
      },
      streamFinal: {
        turn_id: "ask:stream-mismatch:stream",
        selected_final_answer: "Different final answer.",
        terminal_answer_authority: {
          ...authority,
          terminal_text_preview: "Different final answer.",
          terminal_text_hash: hashHelixTerminalText("Different final answer."),
        },
      },
    });

    expect(result.failure_codes).toEqual(expect.arrayContaining(["stream_terminal_differs_from_turn_terminal"]));
  });
});
