import { describe, expect, it } from "vitest";
import { helixEnvironmentClockSnapshotSchema } from "../helix-environment-action";

const clock = {
  schema: "helix.environment_clock_snapshot.v1",
  clock_id: "clock:test", clock_kind: "minecraft_game_tick", tick_rate_hz: 20,
  tick_index: 12, world_tick_index: 900, synchronization: "server_synchronized",
  observed_at: "2026-09-05T08:00:00Z",
};
describe("environment clock monotonic measurement", () => {
  it("preserves legacy absence rather than inventing zero", () => {
    expect(helixEnvironmentClockSnapshotSchema.parse(clock).monotonic).toBeUndefined();
  });
  it("retains an independent origin and fractional elapsed measurement", () => {
    const value = helixEnvironmentClockSnapshotSchema.parse({ ...clock,
      monotonic: { origin_id: "origin:test", elapsed_ms: 1.5 } });
    expect(value.monotonic).toEqual({ origin_id: "origin:test", elapsed_ms: 1.5 });
    expect(value.tick_index).toBe(12);
    expect(value.world_tick_index).toBe(900);
  });
  it.each([-1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid elapsed %s", elapsed_ms => {
    expect(helixEnvironmentClockSnapshotSchema.safeParse({ ...clock,
      monotonic: { origin_id: "origin:test", elapsed_ms } }).success).toBe(false);
  });
  it("rejects elapsed time without its origin", () => {
    expect(helixEnvironmentClockSnapshotSchema.safeParse({ ...clock,
      monotonic: { elapsed_ms: 2 } }).success).toBe(false);
  });
});
