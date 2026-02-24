import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask jobs endpoint regression", () => {
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
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });
  });

  it("accepts job creation and exposes persisted job envelope", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Summarize Helix Ask runtime in one line.",
        sessionId: "jobs-regression-session",
      }),
    });
    expect(response.status).toBe(202);
    const payload = (await response.json()) as { jobId: string; status: string; traceId: string };
    expect(payload.jobId.length).toBeGreaterThan(8);
    expect(payload.status).toBe("queued");
    expect(payload.traceId).toMatch(/^ask:/);

    const getResponse = await fetch(`${baseUrl}/api/agi/ask/jobs/${payload.jobId}`);
    expect(getResponse.status).toBe(200);
    const jobPayload = (await getResponse.json()) as { jobId?: string; status?: string; traceId?: string };
    expect(jobPayload.jobId).toBe(payload.jobId);
    expect(jobPayload.traceId).toBe(payload.traceId);
    expect(typeof jobPayload.status).toBe("string");
  }, 120000);
});
