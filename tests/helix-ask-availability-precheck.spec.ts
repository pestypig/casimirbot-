import { describe, expect, it } from "vitest";
import { runHelixAskAvailabilityPrecheck, assertHelixAskAvailability } from "../scripts/helix-ask-availability-precheck";

describe("Helix Ask availability precheck", () => {
  it("returns ok=false for non-200 status with payload metadata", async () => {
    const result = await runHelixAskAvailabilityPrecheck({
      baseUrl: "http://example.invalid",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({ error: "helix_ask_temporarily_unavailable", message: "cooldown active" }),
          {
            status: 503,
            headers: { "content-type": "application/json" },
          },
        )) as typeof fetch,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(result.error).toBe("helix_ask_temporarily_unavailable");
    expect(result.message).toBe("cooldown active");
  });

  it("fails fast with clear error when ask is unavailable", async () => {
    await expect(
      assertHelixAskAvailability({
        baseUrl: "http://example.invalid",
        fetchImpl: (async () =>
          new Response(JSON.stringify({ error: "helix_ask_temporarily_unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          })) as typeof fetch,
      }),
    ).rejects.toThrow(/Helix Ask availability precheck failed/);
  });
});
