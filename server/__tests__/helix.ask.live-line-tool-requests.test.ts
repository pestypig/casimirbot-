import { beforeEach, describe, expect, it } from "vitest";

import { auditHelixAskContextForPoison } from "../services/helix-ask/ask-context-poison-audit";
import { evaluateLiveLineToolRequest } from "../services/helix-ask/live-line-tool-evaluator";
import { planLiveLineToolRequest } from "../services/helix-ask/live-line-tool-request-planner";
import { buildHelixTurnTerminalAuthority } from "../services/helix-ask/turn-terminal-authority";
import { clearLiveLineToolRequestStoreForTest } from "../services/situation-room/live-line-tool-request-store";

describe("Helix Ask live line tool requests", () => {
  beforeEach(() => {
    clearLiveLineToolRequestStoreForTest();
  });

  it("routes missing lava evidence lines to the Minecraft event window tool", () => {
    const request = planLiveLineToolRequest({
      threadId: "helix-ask:desktop",
      environmentId: "live-env:minecraft",
      line: {
        key: "next_check",
        label: "Next check",
        value: "Watch for bucket-empty events, lava placement, and light-level increase.",
        evidence_refs: ["evidence:stair-trench"],
      },
      autoRecord: false,
    });

    expect(request?.schema).toBe("helix.live_line_tool_request.v1");
    expect(request?.requested_tool).toBe("minecraft.query_event_window");
    expect(request?.expected_evidence_kind).toBe("missing_evidence");
    expect(request?.assistant_answer).toBe(false);
    expect(request?.raw_content_included).toBe(false);
  });

  it("routes calculator hypotheses to solve-with-steps before confidence changes", () => {
    const request = planLiveLineToolRequest({
      threadId: "helix-ask:desktop",
      line: {
        key: "equation",
        label: "Equation",
        value: "Equation result may support the equilibrium claim; solve x^2 - 4 = 0.",
        evidence_refs: [],
      },
      autoRecord: false,
    });

    expect(request?.requested_tool).toBe("scientific-calculator.solve_with_steps");
    expect(request?.expected_evidence_kind).toBe("calculation");

    const noReceiptEvaluation = evaluateLiveLineToolRequest({
      request: request!,
      autoRecord: false,
    });
    expect(noReceiptEvaluation.supports_line).toBe("unknown");
    expect(noReceiptEvaluation.confidence_delta).toBe(0);
    expect(noReceiptEvaluation.summary).toMatch(/no receipt yet/i);

    const receiptEvaluation = evaluateLiveLineToolRequest({
      request: request!,
      tool_receipt_refs: ["receipt:calculator:1"],
      receipts: [{ ok: true, result: "x = -2, 2", trace_id: "trace:calculator:1" }],
      autoRecord: false,
    });
    expect(receiptEvaluation.supports_line).toBe("supports");
    expect(receiptEvaluation.confidence_delta).toBeGreaterThan(0);
    expect(receiptEvaluation.assistant_answer).toBe(false);
  });

  it("routes large-context storage lines to notes instead of raw Ask context", () => {
    const request = planLiveLineToolRequest({
      threadId: "helix-ask:desktop",
      line: {
        key: "context_transport",
        label: "Context transport",
        value: "Store this large transcript in notes and preserve only compact note refs.",
        evidence_refs: ["evidence:transcript-window"],
      },
      autoRecord: false,
    });

    expect(request?.requested_tool).toBe("workstation-notes.append_to_note");
    expect(request?.expected_evidence_kind).toBe("storage");
    expect(request?.raw_content_included).toBe(false);
  });

  it("does not mistake Minecraft source-event lines for document lookups", () => {
    const request = planLiveLineToolRequest({
      threadId: "helix-ask:desktop",
      environmentId: "live-env:minecraft",
      line: {
        key: "next_check",
        label: "Next check",
        value: "Watch for source events that affect the requested Minecraft categories.",
        evidence_refs: ["source:source:minecraft-server"],
      },
      autoRecord: false,
    });

    expect(request?.requested_tool).toBe("minecraft.query_event_window");
    expect(request?.expected_evidence_kind).toBe("missing_evidence");
  });

  it("fails poison audit when a line tool evaluation is marked as an assistant answer", () => {
    const request = planLiveLineToolRequest({
      threadId: "helix-ask:desktop",
      line: {
        key: "structure",
        label: "Structure",
        value: "possible lava-lit stair mine",
        evidence_refs: ["evidence:structure"],
      },
      autoRecord: false,
    });
    const poisonedEvaluation = {
      ...evaluateLiveLineToolRequest({
        request: request!,
        tool_receipt_refs: ["receipt:bad"],
        supports_line: "supports",
        autoRecord: false,
      }),
      assistant_answer: true,
    };
    const authority = buildHelixTurnTerminalAuthority({
      thread_id: "helix-ask:desktop",
      turn_id: "turn:e609-poison",
      final_answer_source: "artifact_synthesis",
      terminal_artifact_kind: "situation_context_pack",
      terminal_text: "Normal answer text.",
    });

    const audit = auditHelixAskContextForPoison({
      thread_id: "helix-ask:desktop",
      turn_id: "turn:e609-poison",
      terminal_authority: authority,
      payload: {
        turn_id: "turn:e609-poison",
        answer: "Normal answer text.",
        final_answer_source: "artifact_synthesis",
        terminal_artifact_kind: "situation_context_pack",
        live_line_tool_evaluations: [poisonedEvaluation],
      },
      client_visible_text: "Normal answer text.",
    });

    expect(audit.ok).toBe(false);
    expect(audit.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "deterministic_as_answer" })]),
    );
  });
});
