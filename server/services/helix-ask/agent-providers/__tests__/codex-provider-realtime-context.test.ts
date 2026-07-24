import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetStagePlayLiveSourceConversationStoreForTest } from
  "../../../stage-play/stage-play-live-source-conversation-store";
import { recordStagePlayLiveSourceConversationEvent } from
  "../../../stage-play/stage-play-live-source-conversation-store";
import {
  bridgeRealtimeTranscriptToStagePlay,
  resetRealtimeStagePlayAskHandoffsForTests,
} from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../../realtime-session/route-boundary";
import { codexProvider } from "../codex-provider";
import { readWorkstationGatewayCallRequestsForTurn } from "../explicit-workstation-gateway";

const ENV_KEYS = [
  "CODEX_AGENT_FAKE_STDOUT",
  "CODEX_AGENT_FAKE_EXIT_CODE",
  "CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH",
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

const bridgeTranscript = (input: {
  transcriptText: string;
  eventRef: string;
  nowMs: number;
  sourceBinding?: Record<string, unknown>;
}) => {
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: "realtime:provider-context",
    nowMs: input.nowMs,
    body: {
      event_type: "transcript.final",
      event_ref: input.eventRef,
      transcript_text: input.transcriptText,
    },
  })!;
  return bridgeRealtimeTranscriptToStagePlay({
    realtimeSessionId: "realtime:provider-context",
    threadId: "helix-ask:desktop",
    providerEventRef: input.eventRef,
    transcriptText: input.transcriptText,
    observation,
    sourceBinding: input.sourceBinding,
    selectedRuntimeAgentProvider: "codex",
    nowMs: input.nowMs,
  });
};

describe("Codex provider Realtime conversation context", () => {
  beforeEach(() => {
    resetStagePlayLiveSourceConversationStoreForTest();
    resetRealtimeStagePlayAskHandoffsForTests();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("places bounded prior Live context before the verbatim current user request", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-realtime-context-"));
    const promptPath = path.join(directory, "prompt.txt");
    process.env.CODEX_AGENT_FAKE_STDOUT = "The Casimir effect arises from changed field modes.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = promptPath;

    try {
      bridgeTranscript({
        transcriptText: "The topic I want to explore is the Casimir effect.",
        eventRef: "provider-event:topic",
        nowMs: 100,
      });
      const currentText = "Explain that in more detail.";
      const current = bridgeTranscript({
        transcriptText: currentText,
        eventRef: "provider-event:followup",
        nowMs: 200,
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "ask:realtime-context:followup",
          question: currentText,
          route_metadata: current.route_metadata,
        },
      });
      const prompt = fs.readFileSync(promptPath, "utf8");
      const debug = result.debug as Record<string, unknown>;
      const gatewayDebug = debug.provider_gateway_debug_summary as Record<string, unknown>;

      expect(result.answer).toBe("The Casimir effect arises from changed field modes.");
      expect(prompt).toContain("Bounded GPT Live conversation context for this Codex turn:");
      expect(prompt).toContain("The topic I want to explore is the Casimir effect.");
      expect(prompt).toContain(`User request:\n${currentText}`);
      expect(prompt.indexOf("Bounded GPT Live conversation context"))
        .toBeLessThan(prompt.lastIndexOf(`User request:\n${currentText}`));
      expect(gatewayDebug.realtime_conversation_context_materialization).toMatchObject({
        status: "materialized",
        model_context_included: true,
        raw_content_included: false,
      });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("derives active-document evidence query terms from the validated prior grounded answer", () => {
    recordStagePlayLiveSourceConversationEvent({
      threadId: "helix-ask:desktop",
      source: "assistant_answer",
      text:
        "The response is intentionally noncomputable until the model and its falsifier are registered.",
      turnId: "ask:meaning",
      evidenceRefs: ["ask:meaning:docs.search:observation"],
      now: new Date(150).toISOString(),
    });
    const currentText =
      "Can you quote the exact passage where it says that and explain the surrounding section?";
    const current = bridgeTranscript({
      transcriptText: currentText,
      eventRef: "provider-event:quote",
      nowMs: 200,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question: currentText,
        route_metadata: current.route_metadata,
      },
      includePlannerDerived: true,
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "docs.search",
        arguments: expect.objectContaining({
          paths: ["docs/research/example.md"],
          exact_terms: expect.arrayContaining(["noncomputable", "falsifier", "registered"]),
          source_target_intent: expect.objectContaining({
            evidence_query_derivation: "retained_assistant_answer_salient_terms",
            referent_resolution: expect.objectContaining({
              source_kind: "realtime_grounded_answer_context",
              resolved_source_ref: expect.stringMatching(/^stage_play_live_source_conversation_event:/),
              context_role: "query_terms_only",
            }),
          }),
        }),
      }),
    ]);
  });
});
