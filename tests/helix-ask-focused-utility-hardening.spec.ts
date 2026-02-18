import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const PLACEHOLDER_RE = /\b(?:llm\.local\s+stub\s+result|placeholder|unable to answer|i cannot answer|answer grounded in retrieved evidence\.?\s*$)\b/i;

const countClaims = (text: string): number => {
  const body = text.replace(/\n\nSources:[\s\S]*$/i, " ").trim();
  return body
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20).length;
};

describe("Helix Ask focused utility hardening", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_ENFORCE_GLOBAL_QUALITY_FLOOR = "1";
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

  it("hardens universe life explainer with grounded non-placeholder content", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does the universe produce life",
        debug: true,
        temperature: 0.2,
        seed: 7,
        sessionId: "focused-utility-universe",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { text?: string };
    const text = payload.text ?? "";
    expect(PLACEHOLDER_RE.test(text)).toBe(false);
    expect(text.length).toBeGreaterThanOrEqual(260);
    expect(/Sources:/i.test(text)).toBe(true);
    expect(countClaims(text)).toBeGreaterThanOrEqual(2);
    expect(/\b(because|therefore|which leads to|drives|enables|causes|through|by)\b/i.test(text)).toBe(true);
  }, 90000);

  it("hardens AI financial hack prompt with mechanism and actionable safety", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How can a Human protect itself from an AI financial hack",
        debug: true,
        temperature: 0.2,
        seed: 11,
        sessionId: "focused-utility-financial",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { text?: string };
    const text = payload.text ?? "";
    expect(PLACEHOLDER_RE.test(text)).toBe(false);
    expect(text.length).toBeGreaterThanOrEqual(300);
    expect(/Sources:/i.test(text)).toBe(true);
    expect(countClaims(text)).toBeGreaterThanOrEqual(2);
    expect(/\b(because|therefore|which leads to|drives|enables|causes|through|by)\b/i.test(text)).toBe(true);
    expect(/\b(action|actions|checklist|steps|protect|mitigation|safety|defense|monitor|freeze|alert|2fa|mfa|password manager|contact your bank)\b/i.test(text)).toBe(true);
  }, 90000);
});
