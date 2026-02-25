import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "ENABLE_AGI",
  "HELIX_ASK_MICRO_PASS",
  "HELIX_ASK_MICRO_PASS_AUTO",
  "HELIX_ASK_TWO_PASS",
  "HELIX_ASK_ALLOW_FORCE_LLM_PROBE",
  "LLM_RUNTIME",
  "LLM_HTTP_BASE",
  "LLM_HTTP_API_KEY",
  "HULL_MODE",
] as const;

describe("Helix Ask llm debug skip metadata", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";
  const previousEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeAll(async () => {
    for (const key of ENV_KEYS) {
      previousEnv[key] = process.env[key];
    }
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_MICRO_PASS = "0";
    process.env.HELIX_ASK_MICRO_PASS_AUTO = "0";
    process.env.HELIX_ASK_TWO_PASS = "0";
    process.env.HELIX_ASK_ALLOW_FORCE_LLM_PROBE = "1";
    process.env.LLM_RUNTIME = "http";
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:9";
    process.env.LLM_HTTP_API_KEY = "test-key";
    process.env.HULL_MODE = "0";

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
    for (const key of ENV_KEYS) {
      const value = previousEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("exposes skip reason when a forced answer path avoids LLM invocation", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is 2 + 2?",
        debug: true,
        sessionId: "llm-skip-proof",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      debug?: {
        llm_route_expected_backend?: string;
        llm_invoke_attempted?: boolean;
        llm_skip_reason?: string;
        llm_skip_reason_detail?: string;
        llm_short_circuit_rule?: string;
        llm_short_circuit_reason?: string;
        llm_short_circuit_bypassed?: boolean;
        llm_force_probe_requested?: boolean;
        llm_force_probe_enabled?: boolean;
        llm_calls?: Array<unknown>;
      };
    };
    expect(payload.debug?.llm_route_expected_backend).toBe("http");
    expect(payload.debug?.llm_invoke_attempted).toBe(false);
    expect(payload.debug?.llm_skip_reason).toBe("short_circuit_forced_answer");
    expect(payload.debug?.llm_skip_reason_detail).toBe("forcedAnswer:math_solver");
    expect(payload.debug?.llm_short_circuit_rule).toBe("fallback_answer_short_circuit_v1");
    expect(typeof payload.debug?.llm_short_circuit_reason).toBe("string");
    expect((payload.debug?.llm_short_circuit_reason ?? "").length).toBeGreaterThan(0);
    expect(payload.debug?.llm_short_circuit_bypassed).toBe(false);
    expect(payload.debug?.llm_force_probe_requested).toBe(false);
    expect(payload.debug?.llm_force_probe_enabled).toBe(false);
    expect((payload.debug?.llm_calls ?? []).length).toBe(0);
  }, 45000);

  it("allows debug forceLlmProbe to bypass short-circuit and record an LLM attempt", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is 2 + 2?",
        debug: true,
        forceLlmProbe: true,
        sessionId: "llm-probe-proof",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      debug?: {
        llm_invoke_attempted?: boolean;
        llm_skip_reason?: string;
        llm_skip_reason_detail?: string;
        llm_short_circuit_bypassed?: boolean;
        llm_force_probe_requested?: boolean;
        llm_force_probe_enabled?: boolean;
        llm_calls?: Array<unknown>;
      };
    };
    expect(payload.debug?.llm_force_probe_requested).toBe(true);
    expect(payload.debug?.llm_force_probe_enabled).toBe(true);
    expect(payload.debug?.llm_short_circuit_bypassed).toBe(true);
    expect(payload.debug?.llm_invoke_attempted).toBe(true);
    expect(payload.debug?.llm_skip_reason).toBeUndefined();
    expect(payload.debug?.llm_skip_reason_detail).toBeUndefined();
    expect((payload.debug?.llm_calls ?? []).length).toBeGreaterThan(0);
  }, 45000);
});
