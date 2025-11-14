import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { planRouter } from "../server/routes/agi.plan";
import { traceRouter } from "../server/routes/agi.trace";
import { resetDbClient } from "../server/db/client";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "pg-mem://persona-ui-tests";
process.env.ENABLE_ESSENCE = "1";
process.env.ENABLE_AGI = "1";
process.env.ENABLE_TRACE_API = "1";
process.env.ENABLE_PERSONA_UI = "1";

describe("Persona wiring in AGI plan/execute", () => {
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

  it("echoes personaId through plan, execute, and trace lookups", async () => {
    const personaId = "persona:test-user";
    const planResponse = await fetch(`${baseUrl}/api/agi/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: "Summarize release plan", personaId }),
    });
    expect(planResponse.status).toBe(200);
    const planned = (await planResponse.json()) as { traceId: string; personaId: string; task_trace?: { persona_id?: string } };
    expect(planned.personaId).toBe(personaId);
    expect(planned.task_trace?.persona_id).toBe(personaId);

    const execResponse = await fetch(`${baseUrl}/api/agi/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId: planned.traceId }),
    });
    expect(execResponse.status).toBe(200);
    const executed = (await execResponse.json()) as { task_trace?: { persona_id?: string } };
    expect(executed.task_trace?.persona_id).toBe(personaId);

    const traceResponse = await fetch(`${baseUrl}/api/agi/trace/${planned.traceId}`);
    expect(traceResponse.status).toBe(200);
    const tracePayload = (await traceResponse.json()) as { persona_id?: string };
    expect(tracePayload.persona_id).toBe(personaId);
  });
});
