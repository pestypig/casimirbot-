import { describe, expect, it } from "vitest";
import {
  buildWorkstationIntentClassifierPrompt,
  coerceWorkstationActionFromIntentDecision,
  parseWorkstationIntentDecision,
  reconcileWorkstationIntentDecisionWithPrompt,
  shouldProbeWorkstationIntentClassifier,
} from "@/lib/workstation/intentClassifier";

describe("intentClassifier", () => {
  it("detects prompts worth classifier probing", () => {
    expect(shouldProbeWorkstationIntentClassifier("can you read a paper about nhm2")).toBe(true);
    expect(shouldProbeWorkstationIntentClassifier("close the current tab")).toBe(true);
    expect(shouldProbeWorkstationIntentClassifier("summarize this section")).toBe(true);
    expect(shouldProbeWorkstationIntentClassifier("can you shut this panel for me")).toBe(true);
    expect(shouldProbeWorkstationIntentClassifier("get rid of the current tab")).toBe(true);
    expect(shouldProbeWorkstationIntentClassifier("what is entropy")).toBe(false);
  });

  it("builds classifier prompts with strict json contract", () => {
    const prompt = buildWorkstationIntentClassifierPrompt("read a paper on nhm2");
    expect(prompt).toContain("Return ONLY JSON");
    expect(prompt).toContain('"intent"');
    expect(prompt).toContain("User prompt:");
  });

  it("parses fenced json classifier output", () => {
    const parsed = parseWorkstationIntentDecision(
      '```json\n{"intent":"docs_read_paper","confidence":0.91,"subgoal":"find a paper about NHM2 and read it","args":{"topic":"NHM2"}}\n```',
    );
    expect(parsed).toEqual({
      intent: "docs_read_paper",
      confidence: 0.91,
      subgoal: "find a paper about NHM2 and read it",
      args: { topic: "NHM2" },
      reason: undefined,
    });
  });

  it("returns null on malformed classifier payload", () => {
    expect(parseWorkstationIntentDecision("no-json-here")).toBeNull();
  });

  it("maps open_panel decisions into workstation actions", () => {
    const action = coerceWorkstationActionFromIntentDecision({
      intent: "open_panel",
      confidence: 0.8,
      subgoal: "open docs viewer",
      args: { panel_id: "docs-viewer" },
    });
    expect(action).toEqual({
      action: "open_panel",
      panel_id: "docs-viewer",
    });
  });

  it("maps docs_read_paper decisions into read actions", () => {
    const action = coerceWorkstationActionFromIntentDecision({
      intent: "docs_read_paper",
      confidence: 0.93,
      subgoal: "find a paper about the sun and read it",
      args: { topic: "sun" },
    });
    expect(action?.action).toBe("run_panel_action");
    expect(action?.panel_id).toBe("docs-viewer");
    expect(action?.action_id).toBe("open_doc_and_read");
    expect((action as { args?: { path?: string } } | null)?.args?.path).toBeTruthy();
  });

  it("maps docs summarize/explain intents into panel actions", () => {
    const summarizeDoc = coerceWorkstationActionFromIntentDecision({
      intent: "docs_summarize_doc",
      confidence: 0.86,
      subgoal: "summarize the current document",
      args: { path: "/docs/papers.md" },
    });
    expect(summarizeDoc).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "summarize_doc",
      args: { path: "/docs/papers.md" },
    });

    const summarizeSection = coerceWorkstationActionFromIntentDecision({
      intent: "docs_summarize_section",
      confidence: 0.91,
      subgoal: "summarize this section",
      args: { anchor: "results" },
    });
    expect(summarizeSection).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "summarize_section",
      args: { anchor: "results" },
    });

    const explainPaper = coerceWorkstationActionFromIntentDecision({
      intent: "docs_explain_paper",
      confidence: 0.9,
      subgoal: "explain this paper",
      args: { selected_text: "Abstract content" },
    });
    expect(explainPaper).toEqual({
      action: "run_panel_action",
      panel_id: "docs-viewer",
      action_id: "explain_paper",
      args: { selected_text: "Abstract content" },
    });
  });

  it("reconciles classifier read intent into summarize/explain intent when prompt demands it", () => {
    const summarizeDecision = reconcileWorkstationIntentDecisionWithPrompt(
      "ok summarize a doc about the sun to me",
      {
        intent: "docs_read_paper",
        confidence: 0.88,
        subgoal: "find a paper about the sun and read it",
        args: { topic: "sun" },
      },
    );
    expect(summarizeDecision.intent).toBe("docs_summarize_doc");

    const explainDecision = reconcileWorkstationIntentDecisionWithPrompt(
      "what does this doc do?",
      {
        intent: "docs_read_paper",
        confidence: 0.8,
        subgoal: "open a paper and read it",
        args: { topic: "starsim" },
      },
    );
    expect(explainDecision.intent).toBe("docs_explain_paper");
  });

  it("maps active tab navigation intents into workstation actions", () => {
    expect(
      coerceWorkstationActionFromIntentDecision({
        intent: "close_active_panel",
        confidence: 0.9,
        subgoal: "close the active tab",
      }),
    ).toEqual({ action: "close_active_panel" });
    expect(
      coerceWorkstationActionFromIntentDecision({
        intent: "focus_next_panel",
        confidence: 0.9,
        subgoal: "focus the next tab",
      }),
    ).toEqual({ action: "focus_next_panel" });
    expect(
      coerceWorkstationActionFromIntentDecision({
        intent: "focus_previous_panel",
        confidence: 0.9,
        subgoal: "focus the previous tab",
      }),
    ).toEqual({ action: "focus_previous_panel" });
    expect(
      coerceWorkstationActionFromIntentDecision({
        intent: "reopen_last_closed_panel",
        confidence: 0.9,
        subgoal: "reopen the last closed tab",
      }),
    ).toEqual({ action: "reopen_last_closed_panel" });
  });
});
