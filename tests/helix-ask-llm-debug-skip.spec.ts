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

describe("Helix Ask llm debug skip metadata", () => {
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
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
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
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
    await new Promise<void>((resolve) => {
      if (mockLlmServer) {
        mockLlmServer.close(() => resolve());
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
        llm_calls?: Array<unknown>;
      };
    };
    expect(payload.debug?.llm_route_expected_backend).toBe("http");
    expect(payload.debug?.llm_invoke_attempted).toBe(false);
    expect(typeof payload.debug?.llm_skip_reason).toBe("string");
    expect((payload.debug?.llm_skip_reason ?? "").length).toBeGreaterThan(0);
    expect((payload.debug?.llm_calls ?? []).length).toBe(0);
  }, 45000);
  it("invokes HTTP LLM for non-deterministic repo questions", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Summarize one implementation detail from server/routes/agi.plan.ts.",
        debug: true,
        sessionId: "llm-http-proof",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      debug?: {
        llm_route_expected_backend?: string;
        llm_invoke_attempted?: boolean;
        llm_skip_reason?: string;
        llm_calls?: Array<{
          backend?: string;
          status?: number;
          providerCalled?: boolean;
        }>;
      };
    };
    expect(payload.debug?.llm_route_expected_backend).toBe("http");
    expect(payload.debug?.llm_invoke_attempted).toBe(true);
    expect(payload.debug?.llm_skip_reason).toBeUndefined();
    expect((payload.debug?.llm_calls ?? []).length).toBeGreaterThan(0);
    expect(payload.debug?.llm_calls?.[0]?.backend).toBe("http");
    expect(payload.debug?.llm_calls?.[0]?.providerCalled).toBe(true);
    expect(payload.debug?.llm_calls?.[0]?.status).toBe(200);
  }, 45000);

});

