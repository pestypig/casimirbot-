import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON } from "../server/services/helix-ask/runtime-errors";

const restoreEnv = () => {
  delete process.env.HELIX_ASK_BASE_URL;
  delete process.env.HELIX_ASK_AVAILABILITY_PATH;
  delete process.env.HELIX_ASK_AVAILABILITY_CONSECUTIVE_200;
  delete process.env.HELIX_ASK_AVAILABILITY_MAX_ATTEMPTS;
  delete process.env.HELIX_ASK_AVAILABILITY_TIMEOUT_MS;
  delete process.env.HELIX_ASK_AVAILABILITY_INTERVAL_MS;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  restoreEnv();
});

describe("runHelixAskAvailabilityPrecheck", () => {
  it("passes only after 3 consecutive 200 responses", async () => {
    process.env.HELIX_ASK_AVAILABILITY_CONSECUTIVE_200 = "3";
    process.env.HELIX_ASK_AVAILABILITY_MAX_ATTEMPTS = "7";
    const statuses = [500, 200, 200, 503, 200, 200, 200];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ status: statuses.shift() ?? 200 })) as unknown as typeof fetch,
    );

    const { runHelixAskAvailabilityPrecheck } = await import("../scripts/helix-ask-availability-precheck");
    const result = await runHelixAskAvailabilityPrecheck();

    expect(result.ok).toBe(true);
    expect(result.fail_reason).toBeNull();
    expect(result.required_consecutive_200).toBe(3);
    expect(result.consecutive_200).toBe(3);
    expect(result.probes.at(-1)?.status).toBe(200);
  });

  it("returns deterministic runtime-unavailable fail reason when threshold is never reached", async () => {
    process.env.HELIX_ASK_AVAILABILITY_CONSECUTIVE_200 = "3";
    process.env.HELIX_ASK_AVAILABILITY_MAX_ATTEMPTS = "3";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ status: 503 })) as unknown as typeof fetch,
    );

    const { runHelixAskAvailabilityPrecheck } = await import("../scripts/helix-ask-availability-precheck");
    const result = await runHelixAskAvailabilityPrecheck();

    expect(result.ok).toBe(false);
    expect(result.fail_reason).toBe(HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON);
    expect(result.probes).toHaveLength(3);
  });
});
