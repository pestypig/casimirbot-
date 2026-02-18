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
    expect(payload.text ?? "").toMatch(/(Sources:|Next evidence:)/i);
    expect((payload.text ?? "").length).toBeGreaterThanOrEqual(220);
  }, 30000);


  it("returns concept provenance metadata for concept answers", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is epistemology?",
        mode: "read",
        sessionId: "modes-concept-provenance",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      provenance_class?: string;
      claim_tier?: string;
      certifying?: boolean;
      concept?: {
        id?: string;
        provenance_class?: string;
        claim_tier?: string;
        certifying?: boolean;
      };
      fail_reason?: string | null;
    };
    expect(payload.provenance_class).toBe("inferred");
    expect(payload.claim_tier).toBe("diagnostic");
    expect(payload.certifying).toBe(false);
    expect(payload.concept?.id).toBe("epistemology");
    expect(payload.concept?.provenance_class).toBe("inferred");
    expect(payload.concept?.claim_tier).toBe("diagnostic");
    expect(payload.concept?.certifying).toBe(false);
    expect(payload.fail_reason ?? null).toBeNull();
  }, 90000);

  it("returns deterministic strict provenance fail_reason for concepts missing explicit provenance", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is epistemology?",
        mode: "read",
        strictProvenance: true,
        sessionId: "modes-concept-provenance-strict",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      provenance_class?: string;
      claim_tier?: string;
      certifying?: boolean;
      fail_reason?: string;
      fail_class?: string;
      concept?: {
        id?: string;
      };
    };
    expect(payload.provenance_class).toBe("inferred");
    expect(payload.claim_tier).toBe("diagnostic");
    expect(payload.certifying).toBe(false);
    expect(payload.concept?.id).toBe("epistemology");
    expect(payload.fail_reason).toBe("CONCEPTS_PROVENANCE_MISSING");
    expect(payload.fail_class).toBe("input_contract");
  }, 90000);

  it("routes act mode date/time/place gravity query to halobank.time.compute", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Compare tide gravity at this place/time",
        mode: "act",
        allowTools: ["halobank.time.compute"],
        timestamp: "2025-03-01T12:00:00Z",
        durationMs: 60000,
        place: { lat: 40.7128, lon: -74.006 },
        compare: {
          timestamp: "2025-03-01T13:00:00Z",
          durationMs: 120000,
          place: { lat: 34.0522, lon: -118.2437 },
        },
        sessionId: "modes-act-halobank",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      mode?: string;
      action?: { tool?: string; output?: { ok?: boolean; comparison?: { deltas?: Record<string, unknown> } } };
    };
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("act");
    expect(payload.action?.tool).toBe("halobank.time.compute");
    expect(payload.action?.output?.ok).toBe(true);
    expect(payload.action?.output?.comparison?.deltas?.dDuration_s).toBeDefined();
    expect(payload.action?.output?.comparison?.deltas?.dGravExposure_ns).toBeDefined();
  }, 180000);

  it("returns proof packet + action output for verify mode with halobank tool", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "time/place tide gravity check",
        mode: "verify",
        allowTools: ["halobank.time.compute"],
        timestamp: "2025-03-01T12:00:00Z",
        place: { lat: 40.7128, lon: -74.006 },
        model: {
          orbitalAlignment: true,
          ephemerisSource: "live",
          ephemerisEvidenceVerified: true,
          ephemerisEvidenceRef: "artifact:jpl-horizons:modes-verify-halobank",
        },
        sessionId: "modes-verify-halobank",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      mode?: string;
      action?: { tool?: string; output?: { ok?: boolean } };
      proof?: {
        verdict?: string;
        firstFail?: unknown;
        certificate?: { certificateHash?: string | null; integrityOk?: boolean | null };
        artifacts?: Array<{ kind: string; ref: string }>;
        consistencyGate?: { gate?: string; verdict?: string; firstFailId?: string | null; deterministic?: boolean };
      };
    };
    expect(payload.mode).toBe("verify");
    expect(payload.action?.tool).toBe("halobank.time.compute");
    expect(payload.action?.output?.ok).toBe(true);
    expect(payload.proof?.verdict).toBeDefined();
    expect(payload.proof?.consistencyGate?.gate).toBe("halobank.horizons.consistency.v1");
    expect(payload.proof?.consistencyGate?.verdict).toBe("PASS");
    expect(payload.proof?.consistencyGate?.firstFailId).toBeNull();
    expect(payload.proof?.consistencyGate?.deterministic).toBe(true);
    expect(payload.proof?.artifacts?.some((entry) => entry.ref === "/api/agi/training-trace/export")).toBe(true);
  }, 90000);

  it("includes deterministic consistency firstFail id in verify mode on fallback ephemeris", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "time/place tide gravity orbital alignment check",
        mode: "verify",
        allowTools: ["halobank.time.compute"],
        timestamp: "2025-03-01T12:00:00Z",
        place: { lat: 40.7128, lon: -74.006 },
        model: { orbitalAlignment: true, ephemerisSource: "fallback" },
        verify: { mode: "constraint-pack", packId: "repo-convergence" },
        sessionId: "modes-verify-halobank-fallback",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok?: boolean;
      mode?: string;
      action?: { output?: { ephemeris?: { consistency?: { verdict?: string; firstFailId?: string | null } } } };
      proof?: {
        firstFail?: { id?: string } | null;
        consistencyGate?: { verdict?: string; firstFailId?: string | null; deterministic?: boolean };
      };
    };
    expect(payload.ok).toBe(false);
    expect(payload.mode).toBe("verify");
    expect(payload.action?.output?.ephemeris?.consistency?.verdict).toBe("FAIL");
    expect(payload.proof?.consistencyGate?.verdict).toBe("FAIL");
    expect(payload.proof?.firstFail?.id).toBe("HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY");
    expect(payload.proof?.consistencyGate?.firstFailId).toBe("HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY");
    expect(payload.proof?.consistencyGate?.deterministic).toBe(true);
  }, 90000);

  it("respects allowTools exclusions with tool_not_allowed", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "time place tidal gravity",
        mode: "act",
        allowTools: ["docs.readme"],
        sessionId: "modes-not-allowed",
      }),
    });
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string; toolName?: string };
    expect(payload.error).toBe("tool_not_allowed");
    expect(payload.toolName).toBe("halobank.time.compute");
  }, 30000);

  it("returns atomic viewer launch claim tier metadata and blocks certified narration", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Show hydrogen 2p electron orbital and certify the result",
        mode: "read",
        sessionId: "modes-atomic-claim-tier",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text?: string;
      viewer_launch?: {
        claim_tier?: string;
        provenance_class?: string;
        policy?: {
          allowedCL?: string;
          allowConceptual?: boolean;
          allowProxies?: boolean;
          chart?: string;
        };
        params?: {
          model?: string;
          claim_tier?: string;
          provenance_class?: string;
          certifying?: boolean;
        };
      };
    };
    expect(payload.viewer_launch?.claim_tier).toBe("diagnostic");
    expect(payload.viewer_launch?.provenance_class).toMatch(/^(simulation|proxy)$/);
    expect(payload.viewer_launch?.policy?.allowedCL).toBe("CL4");
    expect(payload.viewer_launch?.policy?.allowConceptual).toBe(false);
    expect(payload.viewer_launch?.policy?.allowProxies).toBe(false);
    expect(payload.viewer_launch?.policy?.chart).toBe("comoving_cartesian");
    expect(payload.viewer_launch?.params?.claim_tier).toBe("diagnostic");
    expect(payload.viewer_launch?.params?.provenance_class).toMatch(/^(simulation|proxy)$/);
    expect(payload.viewer_launch?.params?.certifying).toBe(false);
    expect(payload.text ?? "").not.toMatch(/\bcertified\b/i);
  }, 90000);

  it("ensures tools manifest includes halobank.time.compute once defaults load", async () => {
    const response = await fetch(`${baseUrl}/api/agi/tools/manifest`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as Array<{ name?: string }>;
    expect(payload.some((entry) => entry.name === "halobank.time.compute")).toBe(true);
  });
});
