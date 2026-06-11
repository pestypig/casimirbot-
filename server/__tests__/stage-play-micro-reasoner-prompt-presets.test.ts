import { beforeEach, describe, expect, it } from "vitest";
import {
  buildStagePlayProcessedMailPacketWithPromptedReasoners,
  type StagePlayPromptedMicroReasonerExecutor,
} from "../services/stage-play/stage-play-processed-mail-packet";
import {
  applyStagePlayMicroReasonerPromptPreset,
  ensureDefaultStagePlayMicroReasonerPromptPresets,
  getActiveStagePlayMicroReasonerPromptForRole,
  getActiveStagePlayMicroReasonerPromptPresetForSource,
  listStagePlayActiveMicroReasonerPromptsForSource,
  listStagePlayMicroReasonerPromptPresets,
  resetStagePlayProcessedMailPacketStoreForTest,
} from "../services/stage-play/stage-play-processed-mail-packet-store";

describe("stage play micro-reasoner prompt presets", () => {
  beforeEach(() => {
    resetStagePlayProcessedMailPacketStoreForTest();
    ensureDefaultStagePlayMicroReasonerPromptPresets();
  });

  it("lists global MicroDeck presets without treating them as source-applied", () => {
    const presets = listStagePlayMicroReasonerPromptPresets({
      sourceId: "calculator_source:test",
      includePresets: true,
    });

    expect(presets.map((preset) => preset.presetId)).toContain("stage_play_micro_reasoner_prompt_preset:generic-live-source:v1");
    expect(presets.map((preset) => preset.presetId)).toContain("stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1");
    expect(getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId: "calculator_source:test" })?.presetId)
      .toBe("stage_play_micro_reasoner_prompt_preset:generic-live-source:v1");
  });

  it("applies a source preset and resolves role prompts through the selected deck", () => {
    const applied = applyStagePlayMicroReasonerPromptPreset({
      presetId: "stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1",
      sourceIds: ["calculator_source:test"],
      now: "2026-06-04T12:00:00.000Z",
    });
    const activePreset = getActiveStagePlayMicroReasonerPromptPresetForSource({ sourceId: "calculator_source:test" });
    const decisionPrompt = getActiveStagePlayMicroReasonerPromptForRole("decision_selector", {
      sourceId: "calculator_source:test",
    });
    const deckPrompts = listStagePlayActiveMicroReasonerPromptsForSource({
      sourceId: "calculator_source:test",
    });

    expect(applied?.sourceIds).toContain("calculator_source:test");
    expect(activePreset?.presetId).toBe("stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1");
    expect(activePreset?.promptedRoles).toEqual(["claim_extractor", "observation_classifier", "salience_scorer", "decision_selector"]);
    expect(decisionPrompt?.title).toBe("Calculator Tool-Call Decision Selector");
    expect(deckPrompts.find((prompt) => prompt.role === "decision_selector")?.promptId).toBe(decisionPrompt?.promptId);
  });

  it("uses the source preset role subset when running prompted micro-reasoners", async () => {
    applyStagePlayMicroReasonerPromptPreset({
      presetId: "stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1",
      sourceIds: ["calculator_source:test"],
      now: "2026-06-04T12:00:00.000Z",
    });
    const calls: Array<{ role: string; title: string }> = [];
    const executor: StagePlayPromptedMicroReasonerExecutor = async (input) => {
      calls.push({ role: input.role, title: input.promptTitle });
      const jsonByRole: Record<string, Record<string, unknown>> = {
        claim_extractor: {
          observedFacts: ["row: kinetic_energy=42 J"],
          inferredFacts: ["calculator stream is active"],
          uncertainties: [],
          sceneTags: ["calculator"],
          activityTags: ["calculation"],
          objectTags: ["kinetic_energy"],
          riskTags: [],
          opportunityTags: ["tool_followup_candidate"],
        },
        observation_classifier: {
          stableFactsUsed: [],
          changedFacts: ["kinetic_energy row changed"],
          contradictions: [],
          uncertainties: [],
        },
        salience_scorer: {
          salienceLevel: "medium",
          reasons: ["new calculator result"],
          voiceCandidate: false,
          calloutDraft: null,
          recommendedNext: "record_interpretation",
        },
        decision_selector: {
          selectedDecision: "record_interpretation",
          recommendedNextTool: "calculator.record_result",
          confidence: "high",
          reasons: ["calculator row is grounded"],
          missingEvidence: [],
        },
      };
      const json = jsonByRole[input.role] ?? {};
      return {
        ok: true,
        text: JSON.stringify(json),
        json,
        model: "test-micro-llm",
        latencyMs: 5,
      };
    };

    const result = await buildStagePlayProcessedMailPacketWithPromptedReasoners({
      jobId: "stage_play_live_source_job:test",
      sourceId: "calculator_source:test",
      now: "2026-06-04T12:00:00.000Z",
      mailItems: [{
        mailId: "mail:calculator:1",
        sourceId: "calculator_source:test",
        sourceKind: "manual_feed",
        summary: {
          text: "Calculator row updated: kinetic_energy=42 J.",
          preview: "Calculator row updated: kinetic_energy=42 J.",
        },
        sourceRefs: {
          sourceId: "calculator_source:test",
          evidenceRef: "calculator_evidence:test",
        },
        evidenceRefs: ["calculator_evidence:test"],
      } as any],
      immersionState: {
        immersionStateId: "stage_play_immersion_state:test",
        policyId: null,
        profileId: null,
        sourceIds: ["calculator_source:test"],
        latestMailIds: ["mail:calculator:1"],
        latestEvidenceRefs: ["calculator_evidence:test"],
        sourceIdentity: { label: "Calculator", confidence: 0.8, stable: true },
        stableFacts: [],
        currentSceneFacts: ["Calculator row updated: kinetic_energy=42 J."],
        changedFacts: ["calculator row changed"],
        uncertainties: [],
        currentActivity: "calculation",
        salience: {
          level: "medium",
          reasons: ["calculator row changed"],
          voiceCandidate: false,
          calloutDraft: null,
        },
        prediction: null,
        lastValidation: null,
        evidenceRefs: ["stage_play_immersion_state:test"],
        createdAt: "2026-06-04T12:00:00.000Z",
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
      } as any,
      predictionValidation: {
        validationId: "stage_play_prediction_validation:test",
        priorPredictionId: null,
        result: "no_prior_prediction",
        supportedSignals: [],
        contradictedSignals: [],
        newSignals: ["calculator row changed"],
        salienceHint: "medium",
        recommendedNext: "record_interpretation",
        evidenceRefs: ["stage_play_prediction_validation:test"],
        createdAt: "2026-06-04T12:00:00.000Z",
      } as any,
      promptedMicroReasoners: {
        enabled: true,
        executor,
      },
    });

    expect(calls).toEqual([
      { role: "claim_extractor", title: "Calculator Stream Claim Extractor" },
      { role: "observation_classifier", title: "Observation Classifier" },
      { role: "salience_scorer", title: "Salience / Voice Candidate Scorer" },
      { role: "decision_selector", title: "Calculator Tool-Call Decision Selector" },
    ]);
    expect(result.packet.recommendedNext).toBe("record_interpretation");
    expect(result.microReasonerRuns.find((run) => run.role === "decision_selector")).toMatchObject({
      promptId: "stage_play_micro_reasoner_prompt:calculator-tool-call:decision_selector:v1",
      recommendedNextTool: "calculator.record_result",
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "micro_reasoner_evidence",
    });
  });
});
