import { describe, expect, it } from "vitest";
import {
  advanceMotorcycleAwareness,
  bearingToHudSector,
  createMotorcycleAwarenessState,
  fixtureIdentityHash,
  headRelativeBearingDeg,
  runMotorcycleReplay,
  HudCueSchema,
  MotorcycleDecisionReceiptSchema,
  MotorcycleRunIdentitySchema,
  SystemHealthSchema,
  ThreatStateSchema,
} from "../helix-motorcycle-awareness";
import { MOTORCYCLE_REPLAY_FIXTURES } from "../helix-motorcycle-awareness-fixtures";

describe("motorcycle awareness deterministic controller", () => {
  it("maps bike-relative threats into the documented clockwise HUD sectors", () => {
    expect(bearingToHudSector(0)).toBe(0);
    expect(bearingToHudSector(-90)).toBe(2);
    expect(bearingToHudSector(180)).toBe(4);
    expect(bearingToHudSector(90)).toBe(6);
    expect(headRelativeBearingDeg(-150, -40)).toBe(-110);
  });

  it.each(MOTORCYCLE_REPLAY_FIXTURES)("meets fixture oracle: $id", (fixture) => {
    const state = runMotorcycleReplay(fixture);
    expect(state.blankReason).toBe(fixture.expected.finalBlankReason);
    expect(state.activeCues.map((cue) => cue.sector)).toEqual(fixture.expected.finalActiveSectors);
    expect(state.rejectedObservationCount).toBeGreaterThanOrEqual(fixture.expected.minimumRejectedObservations);
  });

  it("replays to the exact same causal receipts", () => {
    const fixture = MOTORCYCLE_REPLAY_FIXTURES.find(({ id }) => id === "rear-left-escalation");
    expect(fixture).toBeDefined();
    const first = runMotorcycleReplay(fixture!);
    const second = runMotorcycleReplay(fixture!);
    expect(second.receipts).toEqual(first.receipts);
    expect(fixtureIdentityHash(second.receipts)).toBe(fixtureIdentityHash(first.receipts));
  });

  it("fails closed on an invalid runtime frame", () => {
    const fixture = MOTORCYCLE_REPLAY_FIXTURES[0];
    const invalid = { ...fixture.frames[0], atMs: -1 };
    expect(() => advanceMotorcycleAwareness(createMotorcycleAwarenessState(), invalid as never)).toThrow();
  });

  it("seals run, threat, cue, health, and receipt output contracts", () => {
    const state = runMotorcycleReplay(MOTORCYCLE_REPLAY_FIXTURES[1]);
    expect(ThreatStateSchema.parse(state.threats[0]).trackId).toBe("vehicle-rl");
    expect(HudCueSchema.parse(state.activeCues[0]).sector).toBe(5);
    expect(MotorcycleDecisionReceiptSchema.parse(state.receipts.at(-1)).causalHash).toMatch(/^fnv1a32:/);
    expect(MotorcycleRunIdentitySchema.parse({
      schema: "helix.motorcycle_replay.v1",
      runId: "run-001",
      fixtureId: "rear-left-escalation",
      sourceMode: "frozen_replay",
      configurationHash: "mhud-controller-v1-2026-09-02",
      producerEpochs: ["radar-epoch-a", "pose-epoch-a"],
      startedAtMs: 0,
    }).sourceMode).toBe("frozen_replay");
    expect(SystemHealthSchema.parse({
      schema: "helix.motorcycle_awareness.v1",
      atMs: 300,
      reflexController: "healthy",
      watchdog: "armed",
      pose: "fresh",
      rendererAuthority: "admitted",
      blankReason: "none",
      networkRequired: false,
    }).networkRequired).toBe(false);
  });

  it("records typed duplicate rejection evidence while retaining a cue until TTL", () => {
    const fixture = MOTORCYCLE_REPLAY_FIXTURES.find(({ id }) => id === "duplicate-reorder")!;
    const state = runMotorcycleReplay(fixture);
    expect(state.rejectedObservationCount).toBe(2);
    expect(state.receipts.at(-1)?.rejectedTrackRefs).toEqual([
      expect.objectContaining({ reason: "duplicate_or_reordered" }),
      expect.objectContaining({ reason: "duplicate_or_reordered" }),
    ]);
    expect(state.activeCues.map((cue) => cue.sector)).toEqual([4]);
  });
});
