import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask tool dry-run", () => {
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

  it("returns deterministic tool_plan and never executes side effects in dry-run", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "compare tide gravity at this place/time",
        mode: "act",
        allowTools: ["halobank.time.compute"],
        tool: { dryRun: true },
        timestamp: "2025-03-01T12:00:00Z",
        place: { lat: 40.7128, lon: -74.006 },
        sessionId: "tool-dry-run",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      dry_run?: boolean;
      tool_plan?: { selectedTool?: string; tieBreakReason?: string };
      action?: unknown;
      predicted_contract_path?: string;
      debug?: { tool_plan?: { selectedTool?: string } };
    };
    expect(payload.ok).toBe(true);
    expect(payload.dry_run).toBe(true);
    expect(payload.action).toBeUndefined();
    expect(payload.tool_plan?.selectedTool).toBe("halobank.time.compute");
    expect(payload.tool_plan?.tieBreakReason).toBe("highest_score_then_lexicographic_tool_id");
    expect(payload.debug?.tool_plan?.selectedTool).toBe("halobank.time.compute");
    expect(payload.predicted_contract_path).toBe("tool://halobank.time.compute/handler");
  });
});
