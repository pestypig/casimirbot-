import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask modes", () => {
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
    await new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });
  });

  it("defaults to read mode when mode is omitted", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What is Helix Ask?", sessionId: "modes-default-read" }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { mode?: string; text?: string };
    expect(typeof payload.text).toBe("string");
    expect(payload.mode === undefined || payload.mode === "read").toBe(true);
  }, 30000);

  it("returns proof packet for verify mode", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "readme summary",
        mode: "verify",
        allowTools: ["docs.readme"],
        sessionId: "modes-verify",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      mode?: string;
      proof?: { verdict?: string; firstFail?: unknown; certificate?: { certificateHash?: string | null; integrityOk?: boolean | null }; artifacts?: Array<{ kind: string; ref: string }> };
    };
    expect(payload.mode).toBe("verify");
    expect(payload.proof?.verdict).toBeDefined();
    expect(payload.proof?.artifacts?.some((entry) => entry.ref === "/api/agi/training-trace/export")).toBe(true);
  }, 70000);

  it("activates relation packet mode with dual-domain evidence", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does warp bubble connect with mission ethos in this repo?",
        context: [
          "docs/knowledge/warp/warp-bubble-overview.md",
          "Warp bubble is constrained by GR viability checks.",
          "docs/ethos/ideology.json",
          "Mission ethos governs stewardship and verification behavior.",
        ].join("\n"),
        debug: true,
        sessionId: "modes-relation",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text?: string;
      debug?: {
        relation_packet_built?: boolean;
        relation_dual_domain_ok?: boolean;
        relation_packet_bridge_count?: number;
      };
    };
    expect(payload.debug?.relation_packet_built).toBe(true);
    expect(payload.debug?.relation_dual_domain_ok).toBe(true);
    expect(payload.debug?.relation_packet_bridge_count ?? 0).toBeGreaterThanOrEqual(2);
  }, 30000);
});
