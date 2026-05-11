import { beforeEach, describe, expect, it } from "vitest";
import { createLiveAnswerEnvironment, resetLiveAnswerEnvironments } from "../services/situation-room/live-answer-environment-store";
import { planLiveWorkstationPipeline } from "../services/helix-ask/live-workstation-pipeline-planner";
import { createLiveWorkstationPipeline, resetLiveWorkstationPipelines } from "../services/situation-room/live-workstation-pipeline-store";
import { runLiveTransformsForSourceEvent } from "../services/situation-room/live-transform-runner";
import { runLiveOutputSinks } from "../services/situation-room/live-output-sink-runner";
import type { WorkstationLiveSourceEvent } from "@shared/helix-workstation-live-source";

describe("live output sink runner", () => {
  beforeEach(() => {
    resetLiveAnswerEnvironments();
    resetLiveWorkstationPipelines();
  });

  it("updates live environment lines and emits note sink receipts", () => {
    const sourceId = "source:browser-tab-transcript";
    const plan = planLiveWorkstationPipeline({
      prompt: "Summarize each sentence from this live browser tab into a note.",
      sourceIds: [sourceId],
    });
    const { environment } = createLiveAnswerEnvironment({
      thread_id: "helix-ask:test",
      created_turn_id: "turn:test",
      objective: plan.objective,
      source_ids: [sourceId],
      preset: "custom",
      line_schema: plan.line_schema,
    });
    const planWithEnv = {
      ...plan,
      sinks: plan.sinks.map((sink) => sink.kind === "live_answer_environment" ? { ...sink, target_id: environment.environment_id } : sink),
    };
    const { pipeline } = createLiveWorkstationPipeline({
      thread_id: "helix-ask:test",
      created_turn_id: "turn:test",
      objective: plan.objective,
      source_ids: [sourceId],
      environment_id: environment.environment_id,
      plan: planWithEnv,
    });
    const event: WorkstationLiveSourceEvent = {
      schema: "helix.workstation_live_source_event.v1",
      event_id: "evt:note",
      source_id: sourceId,
      environment_id: environment.environment_id,
      thread_id: "helix-ask:test",
      seq: 1,
      tick_index: 1,
      ts: "2026-05-10T12:00:00.000Z",
      kind: "browser_audio_transcript",
      source_family: "browser_audio",
      event_type: "transcript_sentence",
      payload: { text: "This source sentence should become a compact note summary." },
      evidence_refs: ["evt:note"],
      deterministic: true,
    };

    const results = runLiveTransformsForSourceEvent({ pipeline, event });
    const receipts = runLiveOutputSinks({ pipeline, results, now: event.ts });

    expect(receipts.map((receipt) => receipt.kind)).toEqual(expect.arrayContaining(["workstation_note", "live_answer_environment"]));
    expect(receipts.every((receipt) => receipt.schema === "helix.live_output_sink_receipt.v1")).toBe(true);
    expect(receipts.every((receipt) => receipt.ok)).toBe(true);
    expect(JSON.stringify(receipts)).not.toContain("assistant_text");
  });
});
