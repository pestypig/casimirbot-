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

  const focalUniverse = "How does the universe produce life";
  const focalFinancial = "How can a Human protect itself from an AI financial hack";

  const ask = async (question: string, seed: number, sessionId: string) => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        debug: true,
        temperature: 0.2,
        seed,
        sessionId,
      }),
    });
    expect(response.status).toBe(200);
    return (await response.json()) as { text?: string; debug?: Record<string, unknown> };
  };

  it("hardens universe life explainer with grounded non-placeholder content (seeds 7/11/13)", async () => {
    for (const seed of [7, 11, 13]) {
      const payload = await ask(focalUniverse, seed, `focused-utility-universe-${seed}`);
      const text = payload.text ?? "";
      expect(PLACEHOLDER_RE.test(text)).toBe(false);
      expect(text.length).toBeGreaterThanOrEqual(260);
      expect(/Sources:/i.test(text)).toBe(true);
      expect(countClaims(text)).toBeGreaterThanOrEqual(2);
      expect(/\b(because|therefore|which leads to|drives|enables|causes|through|by)\b/i.test(text)).toBe(true);
      expect(typeof payload.debug?.fallback_reason).toBe("string");
    }
  }, 120000);

  it("hardens AI financial hack prompt with mechanism and actionable safety (seeds 7/11/13)", async () => {
    for (const seed of [7, 11, 13]) {
      const payload = await ask(focalFinancial, seed, `focused-utility-financial-${seed}`);
      const text = payload.text ?? "";
      expect(PLACEHOLDER_RE.test(text)).toBe(false);
      expect(text.length).toBeGreaterThanOrEqual(300);
      expect(/Sources:/i.test(text)).toBe(true);
      expect(countClaims(text)).toBeGreaterThanOrEqual(2);
      expect(/\b(because|therefore|which leads to|drives|enables|causes|through|by)\b/i.test(text)).toBe(true);
      expect(/\b(action|actions|checklist|steps|protect|mitigation|safety|defense|monitor|freeze|alert|2fa|mfa|password manager|contact your bank)\b/i.test(text)).toBe(true);
      expect(typeof payload.debug?.fallback_reason).toBe("string");
    }
  }, 120000);

  it("covers 12-family focused mini-pack without placeholder/scaffold collapse", async () => {
    const cases = [
      "How does the universe produce life",
      "What are the strongest scientific theories linking consciousness to physical reality?",
      "Is life an inevitable outcome of cosmic evolution or an accident?",
      "How do entropy gradients help complex systems emerge?",
      "How do stars constrain the long-horizon habitability window for life?",
      "How can abiogenesis hypotheses be compared without over-claiming certainty?",
      "How can a Human protect itself from an AI financial hack",
      "What controls should small businesses deploy first against AI-enabled account takeover?",
      "How do I set up transaction limits and alerts to reduce financial blast radius?",
      "What should a family do first if they suspect AI-driven payment fraud?",
      "How do MFA, bank alerts, and account segmentation work together against ATO?",
      "What incident-response checklist best limits loss after a suspected AI financial compromise?",
    ];
    let seed = 7;
    for (const [index, question] of cases.entries()) {
      const payload = await ask(question, seed, `focused-mini-pack-${index + 1}`);
      const text = payload.text ?? "";
      expect(PLACEHOLDER_RE.test(text)).toBe(false);
      expect(text.length).toBeGreaterThanOrEqual(220);
      expect(/Sources:/i.test(text)).toBe(true);
      expect(countClaims(text)).toBeGreaterThanOrEqual(2);
      expect(typeof payload.debug?.fallback_reason).toBe("string");
      seed = seed === 7 ? 11 : seed === 11 ? 13 : 7;
    }
  }, 180000);
});
