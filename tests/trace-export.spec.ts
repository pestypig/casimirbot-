import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { planRouter } from "../server/routes/agi.plan";
import { traceRouter } from "../server/routes/agi.trace";
import { resetDbClient } from "../server/db/client";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "pg-mem://trace-export-tests";
process.env.ENABLE_ESSENCE = "1";
process.env.ENABLE_AGI = "1";
process.env.ENABLE_TRACE_API = "1";

describe("trace export route", () => {
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

  const planAndExecute = async (): Promise<string> => {
    const planResponse = await fetch(`${baseUrl}/api/agi/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "summarize local README" }),
    });
    expect(planResponse.status).toBe(200);
    const planned = (await planResponse.json()) as { traceId: string };
    const executeResponse = await fetch(`${baseUrl}/api/agi/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId: planned.traceId }),
    });
    expect(executeResponse.status).toBe(200);
    return planned.traceId;
  };

  it("exports plan + manifest when enabled", async () => {
    process.env.ENABLE_TRACE_EXPORT = "1";
    const traceId = await planAndExecute();
    const response = await fetch(`${baseUrl}/api/agi/trace/${traceId}/export`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      version: string;
      plan: unknown[];
      tool_manifest: unknown[];
      knowledge_context: unknown[];
    };
    expect(payload.version).toBe("essence-trace-export/1.0");
    expect(Array.isArray(payload.plan)).toBe(true);
    expect(Array.isArray(payload.tool_manifest)).toBe(true);
    expect(Array.isArray(payload.knowledge_context)).toBe(true);
  });

  it("returns 404 when export gate is disabled", async () => {
    process.env.ENABLE_TRACE_EXPORT = "0";
    const traceId = await planAndExecute();
    const response = await fetch(`${baseUrl}/api/agi/trace/${traceId}/export`);
    expect(response.status).toBe(404);
  });
});
