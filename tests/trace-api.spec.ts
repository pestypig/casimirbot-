import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { planRouter } from "../server/routes/agi.plan";
import { traceRouter } from "../server/routes/agi.trace";
import { resetDbClient } from "../server/db/client";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "pg-mem://trace-api-tests";
process.env.ENABLE_ESSENCE = process.env.ENABLE_ESSENCE ?? "1";

const traceSuite =
  process.env.ENABLE_AGI === "1" && process.env.ENABLE_TRACE_API === "1" ? describe : describe.skip;

traceSuite("AGI trace API", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/agi/trace", traceRouter);
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
    await resetDbClient();
  });

  it("returns stored traces and 404 for unknown ids", async () => {
    const planResponse = await fetch(`${baseUrl}/api/agi/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "Summarize README status" }),
    });
    expect(planResponse.status).toBe(200);
    const planned = (await planResponse.json()) as { traceId: string };
    expect(planned.traceId).toBeDefined();

    const executeResponse = await fetch(`${baseUrl}/api/agi/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId: planned.traceId }),
    });
    expect(executeResponse.status).toBe(200);
    const executed = (await executeResponse.json()) as { steps: Array<{ ok: boolean }> };
    expect(Array.isArray(executed.steps)).toBe(true);
    expect(executed.steps.length).toBeGreaterThan(0);

    const traceResponse = await fetch(`${baseUrl}/api/agi/trace/${planned.traceId}`);
    expect(traceResponse.status).toBe(200);
    const tracePayload = (await traceResponse.json()) as { steps?: unknown[] };
    expect(Array.isArray(tracePayload.steps)).toBe(true);
    expect((tracePayload.steps ?? []).length).toBeGreaterThan(0);

    const missingResponse = await fetch(`${baseUrl}/api/agi/trace/trace-missing`);
    expect(missingResponse.status).toBe(404);
  });
});
