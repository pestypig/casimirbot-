import { describe, expect, it } from "vitest";
import {
  NARRATOR_EVENT_SCHEMA,
  type NarratorEventV1,
  validateNarratorEventV1,
} from "../narrator-event.v1";

describe("narrator event contract", () => {
  const event: NarratorEventV1 = {
    schemaVersion: NARRATOR_EVENT_SCHEMA,
    eventId: "narrator:event:1",
    sourceKind: "image_lens",
    sourceId: "image-lens:summary:1",
    sourceLabelMessageId: "narrator.source.imageLens",
    text: "Image Lens found one selected crop summary.",
    language: "en",
    authority: "live_observation",
    assistant_answer: false,
    terminal_eligible: false,
    certainty: "medium",
    evidenceRefs: ["image_lens_focus_run:1"],
    traceId: "trace:1",
    turnKey: "turn:1",
    rawContentIncluded: false,
    speakable: true,
    requestedDeliveryMode: "confirm_to_speak",
    defaultDeliveryMode: "visible_only",
    dedupeKey: "image-lens:summary:1",
    createdAtMs: 1_700_000_000_000,
  };

  it("accepts evidence-only narrator observations", () => {
    expect(validateNarratorEventV1(event)).toEqual([]);
  });

  it("accepts narrator observations linked to durable goal-context updates", () => {
    expect(validateNarratorEventV1({
      ...event,
      goalId: "goal:translation-monitor",
      goalContextUpdateId: "stage_play_goal_context_update:narrator:translation",
      evidenceRefs: [
        "image_lens_focus_run:1",
        "stage_play_goal_context_update:narrator:translation",
      ],
      producedRefs: [
        "narrator:event:1",
        "stage_play_goal_context_update:narrator:translation",
      ],
    })).toEqual([]);
  });

  it("accepts terminal final-answer events only with final authority", () => {
    const finalAnswerProjection = {
      ...event,
      sourceKind: "final_answer",
      authority: "terminal_answer",
      assistant_answer: true,
      terminal_eligible: true,
      requestedDeliveryMode: "auto_speak",
      defaultDeliveryMode: "auto_speak",
    } satisfies NarratorEventV1;
    expect(validateNarratorEventV1(finalAnswerProjection)).toEqual([]);
    expect(finalAnswerProjection.schemaVersion).toBe("helix.narrator_event/v1");
    expect(finalAnswerProjection.evidenceRefs).toEqual(["image_lens_focus_run:1"]);
  });

  it("rejects non-final events that try to become answers", () => {
    expect(validateNarratorEventV1({
      ...event,
      authority: "terminal_answer",
      assistant_answer: true,
      terminal_eligible: true,
      rawContentIncluded: true,
    })).toEqual(expect.arrayContaining([
      "non-final narrator events must not use terminal_answer authority",
      "non-final narrator events must not be assistant answers",
      "non-final narrator events must not be terminal eligible",
      "non-final narrator events must not include raw content",
    ]));
  });

  it("requires narrator observations to carry evidence refs and durable goal-context proof when present", () => {
    expect(validateNarratorEventV1({
      ...event,
      evidenceRefs: [],
    })).toEqual(expect.arrayContaining([
      "evidenceRefs must include at least one reference",
    ]));
    expect(validateNarratorEventV1({
      ...event,
      evidenceRefs: ["valid-ref", ""],
    })).toEqual(expect.arrayContaining([
      "evidenceRefs[1] must be a non-empty string",
    ]));
    expect(validateNarratorEventV1({
      ...event,
      goalId: " ",
      goalContextUpdateId: "stage_play_goal_context_update:narrator:translation",
      producedRefs: ["narrator:event:1"],
    })).toEqual(expect.arrayContaining([
      "goalId must be a non-empty string or null",
      "evidenceRefs must include goalContextUpdateId",
      "producedRefs must include goalContextUpdateId",
    ]));
    expect(validateNarratorEventV1({
      ...event,
      goalContextUpdateId: "stage_play_goal_context_update:narrator:translation",
    })).toEqual(expect.arrayContaining([
      "evidenceRefs must include goalContextUpdateId",
      "producedRefs must be provided when goalContextUpdateId is present",
    ]));
  });

  it("rejects re-speaking voice receipts by auto policy", () => {
    expect(validateNarratorEventV1({
      ...event,
      sourceKind: "voice_receipt",
      authority: "voice_receipt",
      requestedDeliveryMode: "auto_speak",
    })).toEqual(expect.arrayContaining([
      "voice receipts must not auto-speak",
    ]));
  });
});
