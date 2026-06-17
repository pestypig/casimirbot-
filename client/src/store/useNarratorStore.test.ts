import { beforeEach, describe, expect, it } from "vitest";
import { useNarratorStore } from "./useNarratorStore";

const initialState = useNarratorStore.getState();

describe("useNarratorStore", () => {
  beforeEach(() => {
    useNarratorStore.setState({
      ...initialState,
      events: [],
      queueState: {
        speaking: false,
        queuedEventIds: [],
        suppressedEventIds: [],
        lastSpokenByDedupeKey: {},
        lastSeenByDedupeKey: {},
        deliveryStatusByEventId: {},
        playbackDiagnosticsByEventId: {},
      },
    }, true);
  });

  it("publishes evidence-only narrator events", () => {
    const event = useNarratorStore.getState().publishEvent({
      sourceKind: "situation_room",
      sourceId: "situation-room:event:1",
      text: "A witness-only observation is ready.",
      authority: "panel_observation",
      assistant_answer: false,
      terminal_eligible: false,
      evidenceRefs: ["situation:event:1"],
      rawContentIncluded: false,
      speakable: true,
      requestedDeliveryMode: "confirm_to_speak",
      defaultDeliveryMode: "visible_only",
    }, { nowMs: 10 });

    expect(event).not.toBeNull();
    expect(useNarratorStore.getState().events).toHaveLength(1);
    expect(useNarratorStore.getState().events[0].assistant_answer).toBe(false);
  });

  it("drops duplicate narrator events inside the dedupe window", () => {
    const input = {
      sourceKind: "image_lens" as const,
      sourceId: "image-lens:event:1",
      text: "Repeated summary.",
      authority: "live_observation" as const,
      assistant_answer: false,
      terminal_eligible: false,
      evidenceRefs: ["image:event:1"],
      rawContentIncluded: false,
      speakable: true,
      requestedDeliveryMode: "confirm_to_speak" as const,
      defaultDeliveryMode: "visible_only" as const,
      dedupeKey: "image-lens:event:1",
    };
    expect(useNarratorStore.getState().publishEvent(input, { nowMs: 100 })).not.toBeNull();
    expect(useNarratorStore.getState().publishEvent(input, { nowMs: 200 })).toBeNull();
    expect(useNarratorStore.getState().events).toHaveLength(1);
  });

  it("keeps voice receipts visible without queuing speech", () => {
    const event = useNarratorStore.getState().publishEvent({
      sourceKind: "voice_receipt",
      sourceId: "voice:receipt:1",
      text: "Playback delivered.",
      authority: "voice_receipt",
      assistant_answer: false,
      terminal_eligible: false,
      evidenceRefs: ["voice:receipt:1"],
      rawContentIncluded: false,
      speakable: true,
      requestedDeliveryMode: "auto_speak",
      defaultDeliveryMode: "visible_only",
    }, { voiceArmed: true, nowMs: 300 });

    expect(event).not.toBeNull();
    expect(useNarratorStore.getState().queueState.deliveryStatusByEventId[event?.eventId ?? ""]).toBe("visible");
  });

  it("records playback diagnostics with delivery state", () => {
    const event = useNarratorStore.getState().publishEvent({
      sourceKind: "workstation_panel",
      sourceId: "panel:narrator",
      text: "Playback diagnostic event.",
      authority: "panel_observation",
      assistant_answer: false,
      terminal_eligible: false,
      evidenceRefs: ["panel:narrator"],
      rawContentIncluded: false,
      speakable: true,
      requestedDeliveryMode: "auto_speak",
      defaultDeliveryMode: "visible_only",
    }, { voiceArmed: true, nowMs: 400 });

    expect(event).not.toBeNull();
    const diagnostic = {
      schema: "helix.narrator_playback_diagnostic.v1" as const,
      stage: "ended" as const,
      startedAtMs: 400,
      updatedAtMs: 450,
      provider: "elevenlabs",
      profile: "vU0dJF9WOwsWEUfX1Aqw",
      mimeType: "audio/mpeg",
      audioBytes: 42,
      playResolved: true,
      playingObserved: true,
      endedObserved: true,
      timeupdateCount: 2,
      maxCurrentTime: 1.5,
      duration: 1.5,
      muted: false,
      volume: 1,
      paused: true,
      readyState: 4,
      networkState: 1,
      mediaErrorCode: null,
      errorMessage: null,
    };
    useNarratorStore.getState().markSpoken(event?.eventId ?? "", 450, diagnostic);

    expect(useNarratorStore.getState().queueState.deliveryStatusByEventId[event?.eventId ?? ""]).toBe("spoken");
    expect(useNarratorStore.getState().queueState.playbackDiagnosticsByEventId[event?.eventId ?? ""]).toMatchObject({
      stage: "ended",
      playResolved: true,
      playingObserved: true,
      endedObserved: true,
    });
  });
});
