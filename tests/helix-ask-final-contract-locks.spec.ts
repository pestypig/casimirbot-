import { describe, expect, it } from "vitest";

import {
  applyFinalAnswerSurfaceReconciliation,
} from "../server/services/helix-ask/surface/final-answer-surface";
import {
  applyFrontierTerminalHeadingRepair,
  applyIdeologyFinalNarrativeLock,
  applyOpenWorldFinalContractLock,
} from "../server/services/helix-ask/surface/final-contract-locks";
import { applyTerminalAnswerText } from "../server/services/helix-ask/surface/terminal-finalize";

describe("helix ask final contract lock helpers", () => {
  it("applies frontier heading repair and removes the frontier heading reason", () => {
    const result = { text: "before", envelope: { answer: "before" } };
    const answerPath: string[] = [];
    const debugPayload: Record<string, unknown> = {
      final_mode_gate_consistency_reasons: [
        "frontier_required_headings_missing",
        "sources_missing",
      ],
    };

    const updated = applyFrontierTerminalHeadingRepair({
      cleanedText: "before",
      shouldRepair: true,
      repairedText: "after",
      result,
      answerPath,
      debugPayload,
      applyText: applyTerminalAnswerText,
    });

    expect(updated).toBe("after");
    expect(result.envelope?.answer).toBe("after");
    expect(answerPath).toEqual(["frontier:terminal_heading_repair"]);
    expect(debugPayload.frontier_terminal_heading_repair_applied).toBe(true);
    expect(debugPayload.final_mode_gate_consistency_reasons).toEqual(["sources_missing"]);
  });

  it("applies open-world final contract lock only when eligible", () => {
    const result = { text: "before", envelope: { answer: "before" } };
    const answerPath: string[] = [];
    const debugPayload: Record<string, unknown> = {};

    const updated = applyOpenWorldFinalContractLock({
      cleanedText: "before",
      eligible: true,
      rewriteOpenWorldBestEffortAnswer: () => "after",
      question: "q",
      result,
      answerPath,
      debugPayload,
      applyText: applyTerminalAnswerText,
    });

    expect(updated).toBe("after");
    expect(answerPath).toEqual(["openWorldBypass:final_contract_lock"]);
    expect(debugPayload.open_world_final_contract_applied).toBe(true);
  });

  it("applies ideology final narrative lock and doc-only sources enforcement", () => {
    const result = { text: "before", envelope: { answer: "before" } };
    const answerPath: string[] = [];
    const debugPayload: Record<string, unknown> = {};

    const updated = applyIdeologyFinalNarrativeLock({
      cleanedText: "before",
      ideologyIntent: true,
      rewriteIdeologyScientificVoice: (text) => `${text} voice`,
      enforceIdeologyNarrativeContracts: (text) => `${text} contract`,
      stripIdeologyNarrativeLeakage: (text) => text.replace(" leak", ""),
      shouldPreferIdeologyDocOnlySources: () => true,
      enforceIdeologyDocOnlySourcesLine: (text, citations) => `${text} [${citations.join(",")}]`,
      docOnlyAllowedCitations: ["docs/ethos/ideology.json"],
      question: "q",
      result,
      answerPath,
      debugPayload,
      applyText: applyTerminalAnswerText,
    });

    expect(updated).toContain("docs/ethos/ideology.json");
    expect(answerPath).toEqual(["ideology:final_narrative_contract_lock"]);
    expect(debugPayload.ideology_doc_only_sources_enforced).toBe(true);
    expect(debugPayload.ideology_final_contract_applied).toBe(true);
  });
});

describe("helix ask final answer surface reconciliation helper", () => {
  it("applies final answer surface updates and records visible source mode", () => {
    const result = { text: "before", envelope: { answer: "before" } };
    const answerPath: string[] = [];
    const debugPayload: Record<string, unknown> = {};

    const updated = applyFinalAnswerSurfaceReconciliation({
      cleanedText: "before",
      hasAnswerText: true,
      defaultAnswerSurfaceMode: "conversational",
      defaultVisibleSources: false,
      finalizeAnswerSurface: () => ({
        text: "after",
        mode: "structured_report",
        visibleSources: true,
        explicitVisibleSourcesRequested: true,
      }),
      result,
      answerPath,
      debugPayload,
      applyText: applyTerminalAnswerText,
    });

    expect(updated).toBe("after");
    expect(result.answer_surface_mode).toBe("structured_report");
    expect(answerPath).toEqual(["answerSurface:visible_sources_preserved"]);
    expect(debugPayload.answer_surface_visible_sources).toBe(true);
    expect(debugPayload.answer_surface_explicit_sources_requested).toBe(true);
  });

  it("falls back to default answer surface metadata when text is empty", () => {
    const result = {};
    const answerPath: string[] = [];
    const debugPayload: Record<string, unknown> = {};

    const updated = applyFinalAnswerSurfaceReconciliation({
      cleanedText: "",
      hasAnswerText: false,
      defaultAnswerSurfaceMode: "conversational",
      defaultVisibleSources: false,
      result,
      answerPath,
      debugPayload,
      applyText: applyTerminalAnswerText,
    });

    expect(updated).toBe("");
    expect(result.answer_surface_mode).toBe("conversational");
    expect(answerPath).toEqual([]);
    expect(debugPayload.answer_surface_visible_sources).toBe(false);
  });
});
