import { describe, expect, it } from "vitest";
import type { LiveAnswerEnvironment } from "../../shared/helix-live-answer-environment";
import { evaluateLiveEnvironmentTurnRelevance } from "../services/helix-ask/live-environment-relevance";
import { decideHelixToolChoice } from "../services/helix-ask/tool-choice-policy";

const makeEnvironment = (overrides: Partial<LiveAnswerEnvironment>): LiveAnswerEnvironment => ({
  schema: "helix.live_answer_environment.v1",
  environment_id: "live_answer:test",
  thread_id: "helix-ask:desktop",
  created_turn_id: "ask:test",
  objective: "Use the latest visual observation to describe the current workstation screen.",
  preset: "custom",
  room_id: null,
  source_ids: ["visual_source:test"],
  graph_id: null,
  status: "active",
  mode: "text_only",
  line_schema: [],
  lines: [
    {
      key: "activity",
      label: "Activity",
      update_policy: "model_reviewed",
      visibility: "answer_card",
      value: "Likely browsing visible workstation files.",
      confidence: 0.62,
      source_event_ids: [],
      evidence_refs: ["observation:test"],
      updated_at: "2026-05-18T02:18:22.685Z",
      source: "model_review",
      model_invoked: true,
      deterministic: false,
    },
  ],
  subgoals: [],
  latest_evaluation: null,
  latest_summary: "Current screen shows a file manager window.",
  evidence_refs: ["observation:test"],
  created_at: "2026-05-18T02:18:22.685Z",
  updated_at: "2026-05-18T02:18:22.685Z",
  context_policy: "compact_context_pack_only",
  raw_logs_included: false,
  raw_transcript_included: false,
  raw_audio_included: false,
  deterministic_content_role: "observation_not_assistant_answer",
  ...overrides,
});

describe("live visual deictic routing", () => {
  it("routes voice-style current-screen references to active visual environment evidence", () => {
    const relevance = evaluateLiveEnvironmentTurnRelevance({
      threadId: "helix-ask:desktop",
      turnId: "ask:test",
      prompt: "Can you see the file that I'm clicking on right now?",
      environments: [makeEnvironment({})],
    });

    expect(relevance).toMatchObject({
      relevant_environment_ids: ["live_answer:test"],
      relevance: "answer_from_environment",
      environment_context_allowed: true,
      artifact_synthesis_allowed: true,
    });
  });

  it("does not attach visual deictic prompts to unrelated non-visual streams", () => {
    const relevance = evaluateLiveEnvironmentTurnRelevance({
      threadId: "helix-ask:desktop",
      turnId: "ask:test",
      prompt: "Can you see the file that I'm clicking on right now?",
      environments: [
        makeEnvironment({
          environment_id: "live_answer:prime",
          objective: "Set up a live prime number generator and show the next primes as they are found.",
          preset: "calculator_prime_stream",
          source_ids: ["source:calculator-prime-stream"],
          lines: [],
          latest_summary: "Current candidate: 11.",
        }),
      ],
    });

    expect(relevance).toMatchObject({
      relevant_environment_ids: [],
      relevance: "background_only",
      environment_context_allowed: false,
      artifact_synthesis_allowed: false,
    });
  });

  it("routes active visual deictic prompts away from direct-answer tool choice", () => {
    const decision = decideHelixToolChoice({
      turn_id: "ask:test",
      prompt: "Compare this file with the file I'm about to show you.",
      active_live_environment_ids: ["live_answer:test"],
    });

    expect(decision).toMatchObject({
      decision: "live_environment_synthesis",
      reason: "Prompt refers to the active visual/workstation live environment.",
    });
  });
});
