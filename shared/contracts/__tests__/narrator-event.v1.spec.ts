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

  it("accepts terminal final-answer events only with final authority", () => {
    expect(validateNarratorEventV1({
      ...event,
      sourceKind: "final_answer",
      authority: "terminal_answer",
      assistant_answer: true,
      terminal_eligible: true,
      requestedDeliveryMode: "auto_speak",
      defaultDeliveryMode: "auto_speak",
    })).toEqual([]);
  });

  it("rejects non-final events that try to become answers", () => {
    expect(validateNarratorEventV1({
      ...event,
      assistant_answer: true,
      terminal_eligible: true,
    })).toEqual(expect.arrayContaining([
      "non-final narrator events must not be assistant answers",
      "non-final narrator events must not be terminal eligible",
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
