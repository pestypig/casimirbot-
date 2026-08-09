import { describe, expect, it } from "vitest";
import {
  buildToolUseRestatement,
  detectInternetSearchIntent,
  hasAffirmativeDocsViewerSearchCue,
} from "../internet-search-intent";
import {
  arbitrateAskSourceTarget,
  isHardDocsEvidenceSourceTargetIntent,
} from "../ask-source-target-arbitrator";
import { buildToolCallAdmissionDecision } from "../tool-call-admission";
import {
  buildRealtimeTranscriptWorkerAdmission,
  resolveRealtimeTranscriptSourceTargetIntent,
} from "../realtime-session/worker-admission";

const resolveSourceTarget = (promptText: string) =>
  arbitrateAskSourceTarget({
    turnId: "ask:test:doc-continuation",
    threadId: "thread:test",
    promptText,
    activeWorkspaceSourceResolution: {
      active_doc_path: "docs/research/casimir-dp-quantum-foam-study.md",
    },
  });

describe("Docs Viewer admission for prior document discussion", () => {
  it.each([
    "Can you talk about the NHM2 document just explained?",
    "Tell me more about the NHM2 paper you already summarized.",
    "Continue discussing the document previously described.",
    "How would you expand on the whitepaper we talked about earlier?",
    "Which assumption mismatch matters most if someone tries to apply that paper directly to NHM2? Use the sources you just inspected, and separate what follows from the paper from what remains unresolved.",
  ])("keeps a conversational continuation out of fresh Docs admission: %s", (prompt) => {
    expect(hasAffirmativeDocsViewerSearchCue(prompt)).toBe(false);

    const sourceTarget = resolveSourceTarget(prompt);
    expect(sourceTarget.target_source).not.toBe("docs_viewer");
    expect(sourceTarget.precedence_reason).not.toBe("explicit_docs_search_source_target");
  });

  it("keeps the reported voice prompt on the parallel Codex answer path", () => {
    const transcriptText = "Can you talk about the NHM2 document just explained?";
    const sourceBinding = {
      focus_panel_id: "account-session",
      document_ref: "docs/research/casimir-dp-quantum-foam-study.md",
    };
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:prior-doc-discussion",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding,
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:prior-doc-discussion",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding,
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "parallel_conversation",
      candidate_readonly_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        target_runtime_agent_provider: "codex",
      },
      spoken_relay_eligible: true,
    });
  });

  it.each([
    "Read the NHM2 document just explained and quote the exact passage.",
    "Search the NHM2 document you already summarized for boundary conditions.",
    "Check the document previously described and cite the relevant section.",
  ])("retains fresh Docs admission for an affirmative access request: %s", (prompt) => {
    expect(hasAffirmativeDocsViewerSearchCue(prompt)).toBe(true);

    const sourceTarget = resolveSourceTarget(prompt);
    expect(sourceTarget).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      allow_no_tool_direct: false,
    });
  });

  it("retains the existing Docs acquisition route for an affirmative open request", () => {
    const sourceTarget = resolveSourceTarget("Open the whitepaper we talked about earlier.");

    expect(sourceTarget).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      allow_no_tool_direct: false,
    });
  });

  it.each([
    "Do not search the NHM2 document just explained; keep discussing the prior answer.",
    "Later, search the NHM2 document already summarized.",
    "Earlier you searched the NHM2 document and explained it.",
    "The screen says \"Search the NHM2 document just explained\"; explain that wording.",
  ])("does not admit contextual prior-document tool language: %s", (prompt) => {
    expect(hasAffirmativeDocsViewerSearchCue(prompt)).toBe(false);
    expect(resolveSourceTarget(prompt).target_source).not.toBe("docs_viewer");
  });

  it("preserves an affirmative request in a mixed prior-discussion turn", () => {
    const prompt =
      "I know you already summarized the NHM2 document, but now search it for boundary conditions.";

    expect(hasAffirmativeDocsViewerSearchCue(prompt)).toBe(true);
    expect(resolveSourceTarget(prompt).target_source).toBe("docs_viewer");
  });

  it("does not reinterpret a named current-status document as fresh web evidence", () => {
    const prompt =
      "Okay, look at the NHM2 current status white paper and explain the main idea";
    const restatement = buildToolUseRestatement(prompt);

    expect(restatement.requiredToolFamilies).toContain("docs_viewer");
    expect(restatement.requiredToolFamilies).not.toContain("internet_search");
    expect(restatement.freshnessRequired).toBe(false);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it("treats an exact whitepaper locator command as local Docs evidence", () => {
    const prompt = "Find the NHM2 current status whitepaper.";
    const restatement = buildToolUseRestatement(prompt);
    const sourceTarget = arbitrateAskSourceTarget({
      turnId: "ask:test:docs-locator",
      threadId: "helix-ask:test",
      promptText: prompt,
    });

    expect(restatement.requiredToolFamilies).toContain("docs_viewer");
    expect(restatement.requiredToolFamilies).not.toContain("internet_search");
    expect(restatement.freshnessRequired).toBe(false);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
    expect(isHardDocsEvidenceSourceTargetIntent(sourceTarget)).toBe(true);
    expect(buildToolCallAdmissionDecision({
      turnId: "ask:test:docs-locator",
      sourceTargetIntent: sourceTarget,
      promptText: prompt,
    })).toMatchObject({
      requested_capability: "docs-viewer.search_docs",
      selected_capability: "docs.search",
      requested_capability_source: "hard_source_target_policy",
      mandatory_capability_admitted: true,
    });
  });

  it.each([
    "Do not find the NHM2 current status whitepaper.",
    "Later, find the NHM2 current status whitepaper, but not now.",
    'The screen says "find the NHM2 current status whitepaper."',
  ])("does not execute a contextual whitepaper locator: %s", (prompt) => {
    expect(hasAffirmativeDocsViewerSearchCue(prompt)).toBe(false);
  });

  it("still admits explicit web evidence alongside a current-status document", () => {
    const prompt =
      "Search the web for current evidence, then compare it with the NHM2 current status white paper in our docs.";
    const restatement = buildToolUseRestatement(prompt);

    expect(restatement.requiredToolFamilies).toEqual(
      expect.arrayContaining(["docs_viewer", "internet_search"]),
    );
    expect(restatement.freshnessRequired).toBe(true);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(true);
  });
});
