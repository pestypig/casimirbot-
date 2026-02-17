import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask modes", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_FAILURE_MAX = "0";
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
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it("keeps read as default mode (mode omitted)", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Explain docs readme scope",
        sessionId: "modes-default-read",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { mode?: string; text?: string };
    expect(payload.mode ?? "read").toBe("read");
    expect(typeof payload.text).toBe("string");
  }, 30000);

  it("returns proof packet for verify mode", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "show readme",
        mode: "verify",
        sessionId: "modes-verify",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      mode?: string;
      proof?: {
        verdict?: string;
        firstFail?: unknown;
        certificate?: { certificateHash?: string | null; integrityOk?: boolean | null };
        artifacts?: Array<{ kind: string; ref: string }>;
      };
    };
    expect(payload.mode).toBe("verify");
    expect(payload.proof?.verdict).toBeDefined();
    expect(payload.proof?.artifacts?.some((entry) => entry.ref === "/api/agi/training-trace/export")).toBe(true);
  }, 30000);
});
