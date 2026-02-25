import express from "express";
import http from "http";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "ENABLE_AGI",
  "HELIX_ASK_MICRO_PASS",
  "HELIX_ASK_MICRO_PASS_AUTO",
  "HELIX_ASK_TWO_PASS",
  "LLM_RUNTIME",
  "LLM_HTTP_BASE",
  "LLM_HTTP_API_KEY",
  "HULL_MODE",
] as const;

describe("Helix Ask jobs endpoint regression", () => {
  let server: Server;
  let mockLlmServer: Server;
  let baseUrl = "http://127.0.0.1:0";
  let mockLlmBase = "http://127.0.0.1:0";
  const previousEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

  beforeAll(async () => {
    for (const key of ENV_KEYS) {
      previousEnv[key] = process.env[key];
    }
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_MICRO_PASS = "0";
    process.env.HELIX_ASK_MICRO_PASS_AUTO = "0";
    process.env.HELIX_ASK_TWO_PASS = "0";
    process.env.LLM_RUNTIME = "http";
    process.env.LLM_HTTP_API_KEY = "test-key";
    process.env.HULL_MODE = "0";

    mockLlmServer = http.createServer((req, res) => {
      if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      req.on("data", () => undefined);
      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            id: "chatcmpl-test",
            object: "chat.completion",
            choices: [{ index: 0, message: { role: "assistant", content: "Mock HTTP response." } }],
            usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
            model: "gpt-4o-mini",
          }),
        );
      });
    });
    await new Promise<void>((resolve) => {
      mockLlmServer.listen(0, "127.0.0.1", () => {
        const address = mockLlmServer.address();
        if (address && typeof address === "object") {
          mockLlmBase = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
    process.env.LLM_HTTP_BASE = mockLlmBase;

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
    await new Promise<void>((resolve) => {
      if (!mockLlmServer) return resolve();
      mockLlmServer.close(() => resolve());
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

  it("accepts job creation and persists HTTP LLM invocation metadata", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does Feedback Loop Hygiene affect society?",
        sessionId: "jobs-regression-session",
        debug: true,
      }),
    });
    expect(response.status).toBe(202);
    const payload = (await response.json()) as { jobId: string; status: string; traceId: string };
    expect(payload.jobId.length).toBeGreaterThan(8);
    expect(payload.status).toBe("queued");
    expect(payload.traceId).toMatch(/^ask:/);

    let jobPayload: {
      jobId?: string;
      status?: string;
      traceId?: string;
      result?: {
        debug?: {
          llm_invoke_attempted?: boolean;
          llm_backend_used?: string;
          llm_http_status?: number;
          llm_provider_called?: boolean;
          llm_model?: string;
          llm_skip_reason?: string;
          llm_skip_reason_detail?: string;
        };
      };
    } = {};
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const getResponse = await fetch(`${baseUrl}/api/agi/ask/jobs/${payload.jobId}`);
      expect(getResponse.status).toBe(200);
      jobPayload = (await getResponse.json()) as typeof jobPayload;
      if (jobPayload.status === "completed" || jobPayload.status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    expect(jobPayload.jobId).toBe(payload.jobId);
    expect(jobPayload.traceId).toBe(payload.traceId);
    expect(jobPayload.status).toBe("completed");
    expect(jobPayload.result?.debug?.llm_invoke_attempted).toBe(true);
    expect(jobPayload.result?.debug?.llm_backend_used).toBe("http");
    expect(jobPayload.result?.debug?.llm_http_status).toBe(200);
    expect(jobPayload.result?.debug?.llm_provider_called).toBe(true);
    expect(jobPayload.result?.debug?.llm_model).toBe("gpt-4o-mini");
    expect(jobPayload.result?.debug?.llm_skip_reason).toBeUndefined();
    expect(jobPayload.result?.debug?.llm_skip_reason_detail).toBeUndefined();
  }, 120000);

  it("keeps explicit repo ideology mapping prompts on repo-api lane without deterministic clarify fallback", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question:
          "In this repo, how does Feedback Loop Hygiene map to server/routes/agi.plan.ts? Cite file paths.",
        sessionId: "repo-ideology-explicit-mapping",
        debug: true,
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text?: string;
      debug?: {
        intent_id?: string;
        llm_invoke_attempted?: boolean;
        llm_backend_used?: string;
        llm_http_status?: number;
        llm_provider_called?: boolean;
        llm_skip_reason?: string;
        llm_skip_reason_detail?: string;
        answer_path?: string[];
        answer_quality_floor_reasons?: string[];
      };
    };
    expect(payload.debug?.intent_id).toBe("repo.repo_api_lookup");
    expect(payload.debug?.llm_invoke_attempted).toBe(true);
    expect(payload.debug?.llm_backend_used).toBe("http");
    expect(payload.debug?.llm_http_status).toBe(200);
    expect(payload.debug?.llm_provider_called).toBe(true);
    expect(payload.debug?.llm_skip_reason).toBeUndefined();
    expect(payload.debug?.llm_skip_reason_detail).toBeUndefined();
    expect((payload.debug?.answer_path ?? []).includes("clarify:ambiguity")).toBe(false);
    expect((payload.debug?.answer_path ?? []).includes("fallback:RenderPlatonicFallback")).toBe(
      false,
    );
    expect((payload.debug?.answer_path ?? []).includes("qualityFloor:deterministic_contract")).toBe(
      false,
    );
    expect(payload.debug?.answer_quality_floor_reasons ?? []).not.toContain(
      "relation_missing_dual_domain_terms",
    );
    expect(payload.text ?? "").not.toMatch(/^what_is_warp_bubble:/i);
  }, 120000);

  it("bypasses deterministic quality-floor rewrite for successful open-world HTTP answers", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does sleep deprivation affect memory consolidation?",
        sessionId: "open-world-general-quality-floor-bypass",
        debug: true,
        verbosity: "brief",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text?: string;
      debug?: {
        llm_invoke_attempted?: boolean;
        llm_backend_used?: string;
        llm_http_status?: number;
        llm_provider_called?: boolean;
        answer_path?: string[];
        answer_quality_floor_bypassed?: boolean;
        answer_quality_floor_bypass_reason?: string;
      };
    };
    expect(payload.debug?.llm_invoke_attempted).toBe(true);
    expect(payload.debug?.llm_backend_used).toBe("http");
    expect(payload.debug?.llm_http_status).toBe(200);
    expect(payload.debug?.llm_provider_called).toBe(true);
    expect((payload.debug?.answer_path ?? []).includes("qualityFloor:deterministic_contract")).toBe(
      false,
    );
    expect((payload.debug?.answer_path ?? []).includes("qualityFloor:open_world_expansion")).toBe(
      false,
    );
    if (payload.debug?.answer_quality_floor_bypassed) {
      expect(payload.debug?.answer_quality_floor_bypass_reason).toBe("open_world_provider_success");
    }
  }, 120000);

  it("keeps endpoint guard in warn-only mode for successful explicit repo-api prompts", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Summarize how /api/agi/ask routes through llm.local.generate.",
        sessionId: "endpoint-guard-warn-mode",
        debug: true,
        verbosity: "brief",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text?: string;
      debug?: {
        intent_id?: string;
        llm_invoke_attempted?: boolean;
        llm_backend_used?: string;
        llm_http_status?: number;
        llm_provider_called?: boolean;
        concept_fast_path_blocked_reason?: string;
        concept_fast_path_removed?: boolean;
        endpoint_anchor_violation?: boolean;
        endpoint_anchor_guard_mode?: string;
        endpoint_anchor_warning?: boolean;
        answer_path?: string[];
      };
    };
    expect(payload.debug?.intent_id).toBe("repo.repo_api_lookup");
    expect(payload.debug?.llm_invoke_attempted).toBe(true);
    expect(payload.debug?.llm_backend_used).toBe("http");
    expect(payload.debug?.llm_http_status).toBe(200);
    expect(payload.debug?.llm_provider_called).toBe(true);
    expect(payload.debug?.concept_fast_path_blocked_reason).toBe("repo_api_cue");
    expect(payload.debug?.concept_fast_path_removed).toBe(true);
    expect(payload.debug?.endpoint_anchor_guard_mode).toBe("warn_only");
    expect((payload.debug?.answer_path ?? []).includes("endpointGuard:applied")).toBe(false);
    expect(
      (payload.debug?.answer_path ?? []).some((entry) => /^concept:local-stability-compact$/i.test(entry)),
    ).toBe(false);
    expect((payload.text ?? "").toLowerCase()).not.toContain("local-stability-compact");
    if (payload.debug?.endpoint_anchor_violation) {
      expect(
        (payload.debug?.answer_path ?? []).some(
          (entry) => entry === "endpointGuard:warn_missing_anchor" || entry === "endpointGuard:warn_mismatch_anchor",
        ),
      ).toBe(true);
      expect(payload.debug?.endpoint_anchor_warning).toBe(true);
    }
  }, 120000);
});
