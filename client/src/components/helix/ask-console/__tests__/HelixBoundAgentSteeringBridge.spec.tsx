/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HELIX_BOUND_AGENT_STEERING_RESULT_EVENT,
  publishMinecraftPlaySteeringResult,
  requestBoundAgentSteering,
  subscribeBoundAgentSteeringRequests,
  type HelixBoundAgentSteeringResult,
} from "../HelixBoundAgentSteeringBridge";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bound-agent Play Minecraft steering bridge", () => {
  it("delivers the same request to a full or minimal shell subscriber and publishes queued pickup", async () => {
    const dispatch = vi.fn(async () => true);
    const results: HelixBoundAgentSteeringResult[] = [];
    const onResult = (event: Event): void => {
      results.push((event as CustomEvent<HelixBoundAgentSteeringResult>).detail);
    };
    window.addEventListener(HELIX_BOUND_AGENT_STEERING_RESULT_EVENT, onResult);
    const unsubscribe = subscribeBoundAgentSteeringRequests(dispatch);

    requestBoundAgentSteering({
      requestId: "minecraft-play:test-full-shell",
      instructionText: "Inspect the exact room, then create or restore its goal and monitor.",
      origin: "typed",
      source: "minecraft_play_activation",
    });
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledOnce());

    expect(dispatch).toHaveBeenCalledWith(
      "Inspect the exact room, then create or restore its goal and monitor.",
      "typed",
      "minecraft-play:test-full-shell",
    );
    await vi.waitFor(() => expect(results).toEqual([{
      requestId: "minecraft-play:test-full-shell",
      deliveryState: "queued",
    }]));

    unsubscribe();
    window.removeEventListener(HELIX_BOUND_AGENT_STEERING_RESULT_EVENT, onResult);
  });

  it("fails closed for malformed browser events", async () => {
    const dispatch = vi.fn(async () => true);
    const unsubscribe = subscribeBoundAgentSteeringRequests(dispatch);
    window.dispatchEvent(new CustomEvent("helix:bound-agent-steering-request", {
      detail: {
        requestId: "",
        instructionText: "ignored",
        origin: "typed",
        source: "minecraft_play_activation",
      },
    }));
    await Promise.resolve();
    expect(dispatch).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("publishes terminal pickup state only for the Play Minecraft lifecycle", () => {
    const results: HelixBoundAgentSteeringResult[] = [];
    const onResult = (event: Event): void => {
      results.push((event as CustomEvent<HelixBoundAgentSteeringResult>).detail);
    };
    window.addEventListener(HELIX_BOUND_AGENT_STEERING_RESULT_EVENT, onResult);

    expect(publishMinecraftPlaySteeringResult(
      "ordinary-steering:test",
      "acknowledged",
    )).toBe(false);
    expect(publishMinecraftPlaySteeringResult(
      "minecraft-play:ack-test",
      "acknowledged",
    )).toBe(true);
    expect(publishMinecraftPlaySteeringResult(
      "minecraft-play:bounded-timeout-test",
      "unavailable",
    )).toBe(true);

    expect(results).toEqual([
      {
        requestId: "minecraft-play:ack-test",
        deliveryState: "acknowledged",
      },
      {
        requestId: "minecraft-play:bounded-timeout-test",
        deliveryState: "unavailable",
      },
    ]);
    window.removeEventListener(HELIX_BOUND_AGENT_STEERING_RESULT_EVENT, onResult);
  });
});
