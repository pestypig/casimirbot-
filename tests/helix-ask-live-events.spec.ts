import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask live events", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_MICRO_PASS = "0";
    process.env.HELIX_ASK_MICRO_PASS_AUTO = "0";
    process.env.HELIX_ASK_TWO_PASS = "0";
    vi.resetModules();
    const { planRouter } = await import("../server/routes/agi.plan");
    const app = express();
    app.use(express.json({ limit: "5mb" }));
    app.use("/api/agi", planRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it("emits ladder stages in live events for a repo definition prompt", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does the Helix Ask pipeline work in this system?",
        debug: true,
        sessionId: "test-session",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      debug?: { live_events?: Array<{ stage: string }> };
    };
    const stages = new Set(
      (payload.debug?.live_events ?? []).map((entry) => entry.stage),
    );
    const requiredStages = [
      "Intent resolved",
      "Topic tags",
      "Topic profile",
      "Plan",
      "Context ready",
      "Allowlist tier",
      "Evidence gate",
      "Arbiter",
      "Synthesis prompt ready",
      "Platonic gates",
      "Coverage gate",
      "Belief gate",
      "Rattling gate",
      "Citations",
    ];
    const missing = requiredStages.filter((stage) => !stages.has(stage));
    if (missing.length) {
      console.log("Missing stages:", missing.join(", "));
    }
    expect(missing).toEqual([]);
  }, 20000);
});
