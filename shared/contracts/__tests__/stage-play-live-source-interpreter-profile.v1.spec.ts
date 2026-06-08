import { describe, expect, it } from "vitest";
import {
  buildStagePlayLiveSourceInterpreterProfileComparisonV1,
  buildStagePlayLiveSourceInterpreterProfileV1,
  isStagePlayLiveSourceInterpreterProfileComparisonV1,
  isStagePlayLiveSourceInterpreterProfileV1,
  validateStagePlayLiveSourceInterpreterProfileComparisonV1,
  validateStagePlayLiveSourceInterpreterProfileV1,
} from "../stage-play-live-source-interpreter-profile.v1";

describe("stage_play live-source interpreter profile contracts", () => {
  it("validates interpreter profiles as evidence-only live-source guidance", () => {
    const profile = buildStagePlayLiveSourceInterpreterProfileV1({
      profileId: "stage_play_live_source_interpreter_profile:minecraft-coach",
      title: "Minecraft Safety Coach",
      threadId: "thread:minecraft-watch",
      roomId: "room:visual",
      environmentId: "live_answer_environment:minecraft",
      jobId: "stage_play_live_source_job:minecraft",
      policyId: "stage_play_live_source_watch_job_policy:minecraft",
      sourceKinds: ["visual_frame"],
      domain: "minecraft",
      objectiveText: "Interpret Minecraft visual summaries for survival risks and useful next actions.",
      interpretationGuidelines:
        "Preserve what was actually observed, then infer risks, resources, and next watch targets separately.",
      lenses: ["survival_safety", "resource_opportunity", "navigation_context"],
      salienceCriteria: ["hostile mob appears", "lighting changes toward night", "player health risk"],
      suppressCriteria: ["unchanged scenery", "routine walking with no new object or risk"],
      riskCriteria: ["lava", "hostile mob", "fall risk", "dark cave"],
      opportunityCriteria: ["ore visible", "crafting station visible", "food source visible"],
      voiceCalloutCriteria: ["urgent risk", "user-mentioned target appears"],
      evidenceRules: {
        preserveRawObservation: true,
        distinguishObservedVsInferred: true,
        requireEvidenceRefs: true,
        askWhenUncertain: true,
      },
      outputStyle: {
        textAnswerStyle: "brief_explanation",
        voiceStyle: "warning_only",
      },
      linkedNoteId: "note:minecraft-safety-coach",
      linkedNoteTitle: "Minecraft Safety Coach",
      status: "active",
      evidenceRefs: ["user_prompt:watch-minecraft"],
      createdAt: "2026-06-07T14:00:00.000Z",
      updatedAt: "2026-06-07T14:00:00.000Z",
    });

    expect(validateStagePlayLiveSourceInterpreterProfileV1(profile)).toEqual([]);
    expect(isStagePlayLiveSourceInterpreterProfileV1(profile)).toBe(true);
    expect(profile.assistant_answer).toBe(false);
    expect(profile.terminal_eligible).toBe(false);
    expect(profile.context_role).toBe("tool_evidence");
    expect(profile.raw_content_included).toBe(false);
  });

  it("rejects profiles that weaken observation custody or terminal authority", () => {
    const profile = buildStagePlayLiveSourceInterpreterProfileV1({
      profileId: "stage_play_live_source_interpreter_profile:minecraft-coach",
      title: "Minecraft Safety Coach",
      threadId: "thread:minecraft-watch",
      sourceKinds: ["visual_frame"],
      domain: "minecraft",
      objectiveText: "Interpret Minecraft visual summaries.",
      interpretationGuidelines: "Keep observations and inferences separate.",
      lenses: [],
      salienceCriteria: [],
      suppressCriteria: [],
      riskCriteria: [],
      opportunityCriteria: [],
      voiceCalloutCriteria: [],
      evidenceRules: {
        preserveRawObservation: true,
        distinguishObservedVsInferred: true,
        requireEvidenceRefs: true,
        askWhenUncertain: true,
      },
      outputStyle: {
        textAnswerStyle: "one_sentence",
        voiceStyle: "short_callout",
      },
      status: "active",
      evidenceRefs: ["user_prompt:watch-minecraft"],
      createdAt: "2026-06-07T14:00:00.000Z",
      updatedAt: "2026-06-07T14:00:00.000Z",
    });
    const invalid = {
      ...profile,
      terminal_eligible: true,
      evidenceRules: {
        ...profile.evidenceRules,
        preserveRawObservation: false,
      },
    };

    expect(validateStagePlayLiveSourceInterpreterProfileV1(invalid)).toEqual(expect.arrayContaining([
      "evidenceRules.preserveRawObservation must be true",
      "terminal_eligible must be false",
    ]));
  });

  it("validates profile comparisons as contractual interpretation evidence", () => {
    const comparison = buildStagePlayLiveSourceInterpreterProfileComparisonV1({
      comparisonId: "stage_play_live_source_interpreter_profile_comparison:minecraft-1",
      profileId: "stage_play_live_source_interpreter_profile:minecraft-coach",
      jobId: "stage_play_live_source_job:minecraft",
      policyId: "stage_play_live_source_watch_job_policy:minecraft",
      mailIds: ["stage_play_live_source_mail:1", "stage_play_live_source_mail:2"],
      narrativeStateRef: "stage_play_live_source_narrative_state:prior",
      observedFacts: [
        "The compact visual summary reports a dark cave-like area.",
        "A player-facing interface and nearby blocks are visible.",
      ],
      inferredMeaning: [
        "The current situation may involve cave exploration with elevated mob or fall risk.",
      ],
      matchedCriteria: ["dark cave"],
      suppressedCriteria: ["routine walking with no new object or risk"],
      riskMatches: ["dark cave"],
      opportunityMatches: [],
      voiceCalloutMatches: ["urgent risk"],
      contradictions: [],
      uncertainties: ["Inventory, health, and exact mob proximity are not visible from the summary."],
      recommendedDecision: "request_voice_callout",
      recommendedNextWatch: ["lighting", "hostile mobs", "health bar", "lava"],
      evidenceRefs: [
        "stage_play_live_source_mail:1",
        "visual_evidence:cave",
        "stage_play_live_source_interpreter_profile:minecraft-coach",
      ],
      createdAt: "2026-06-07T14:00:10.000Z",
    });

    expect(validateStagePlayLiveSourceInterpreterProfileComparisonV1(comparison)).toEqual([]);
    expect(isStagePlayLiveSourceInterpreterProfileComparisonV1(comparison)).toBe(true);
    expect(comparison.observedFacts[0]).toMatch(/compact visual summary/i);
    expect(comparison.inferredMeaning[0]).toMatch(/may involve/i);
    expect(comparison.recommendedDecision).toBe("request_voice_callout");
    expect(comparison.assistant_answer).toBe(false);
    expect(comparison.terminal_eligible).toBe(false);
  });

  it("rejects profile comparisons with invalid decisions or answer authority", () => {
    const comparison = buildStagePlayLiveSourceInterpreterProfileComparisonV1({
      comparisonId: "stage_play_live_source_interpreter_profile_comparison:minecraft-1",
      profileId: "stage_play_live_source_interpreter_profile:minecraft-coach",
      mailIds: ["stage_play_live_source_mail:1"],
      observedFacts: ["A hostile mob is mentioned in the compact visual summary."],
      inferredMeaning: ["This may be an immediate survival risk."],
      matchedCriteria: ["hostile mob appears"],
      suppressedCriteria: [],
      riskMatches: ["hostile mob"],
      opportunityMatches: [],
      voiceCalloutMatches: ["urgent risk"],
      contradictions: [],
      uncertainties: [],
      recommendedDecision: "request_voice_callout",
      recommendedNextWatch: ["mob distance"],
      evidenceRefs: ["stage_play_live_source_mail:1"],
      createdAt: "2026-06-07T14:00:10.000Z",
    });
    const invalid = {
      ...comparison,
      assistant_answer: true,
      recommendedDecision: "answer_now",
    };

    expect(validateStagePlayLiveSourceInterpreterProfileComparisonV1(invalid)).toEqual(expect.arrayContaining([
      "recommendedDecision is invalid",
      "assistant_answer must be false",
    ]));
  });
});
