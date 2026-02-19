import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask tool clarify", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    vi.resetModules();
    const { planRouter } = await import("../server/routes/agi.plan");
    const app = express();
    app.use(express.json({ limit: "5mb" }));
    app.use("/api/agi", planRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns deterministic structured clarify when required tool inputs are missing", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "compare tide gravity at this place/time",
        mode: "act",
        allowTools: ["halobank.time.compute"],
        sessionId: "tool-clarify-missing-inputs",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      mode?: string;
      fail_reason?: string;
      clarify_slots?: string[];
      debug?: { tool_plan?: { selectedTool?: string } };
    };
    expect(payload.ok).toBe(false);
    expect(payload.mode).toBe("clarify");
    expect(payload.fail_reason).toBe("TOOL_INPUT_MISSING");
    expect(payload.clarify_slots).toEqual(["timestamp", "place"]);
    expect(payload.debug?.tool_plan?.selectedTool).toBe("halobank.time.compute");
  });
});
