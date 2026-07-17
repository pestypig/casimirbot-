import { describe, expect, it } from "vitest";
import {
  HELIX_REALTIME_GROUNDED_RELAY_SCHEMA,
  HELIX_REALTIME_WORKER_ADMISSION_SCHEMA,
  isTerminalHelixRealtimeGroundedRelayStatus,
} from "../helix-realtime-worker-relay.v1";

describe("Helix Realtime worker relay v1 contract", () => {
  it("keeps stable versioned schema identities", () => {
    expect(HELIX_REALTIME_WORKER_ADMISSION_SCHEMA).toBe("helix.realtime_worker_admission.v1");
    expect(HELIX_REALTIME_GROUNDED_RELAY_SCHEMA).toBe("helix.realtime_grounded_relay.v1");
  });

  it.each([
    "delivered",
    "suppressed",
    "superseded",
    "stale",
    "interrupted",
    "cancelled",
    "failed",
  ] as const)("recognizes terminal relay status %s", (status) => {
    expect(isTerminalHelixRealtimeGroundedRelayStatus(status)).toBe(true);
  });

  it.each([
    "worker_running",
    "result_ready",
    "relay_queued_busy",
    "response_requested",
    "speaking",
  ] as const)("keeps in-flight relay status %s nonterminal", (status) => {
    expect(isTerminalHelixRealtimeGroundedRelayStatus(status)).toBe(false);
  });
});
