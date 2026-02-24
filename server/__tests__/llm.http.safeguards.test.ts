import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetLlmHttpBreakerForTests,
  __setLlmHttpFetchForTests,
  llmHttpHandler,
} from "../skills/llm.http";

const envKeys = [
  "LLM_HTTP_BASE",
  "LLM_HTTP_API_KEY",
  "LLM_HTTP_RETRY_COUNT",
  "LLM_HTTP_TIMEOUT_MS",
  "LLM_HTTP_BREAKER_THRESHOLD",
  "LLM_HTTP_BREAKER_COOLDOWN_MS",
  "HULL_MODE",
] as const;

describe("llm.http safeguards", () => {
  afterEach(() => {
    for (const key of envKeys) delete process.env[key];
    __resetLlmHttpBreakerForTests();
    __setLlmHttpFetchForTests(typeof globalThis.fetch === "function" ? globalThis.fetch : null);
    vi.restoreAllMocks();
  });

  it("opens breaker after bounded failures and returns deterministic error", async () => {
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    process.env.LLM_HTTP_API_KEY = "k";
    process.env.LLM_HTTP_RETRY_COUNT = "0";
    process.env.LLM_HTTP_BREAKER_THRESHOLD = "1";
    process.env.LLM_HTTP_BREAKER_COOLDOWN_MS = "60000";

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("econnrefused")) as unknown as typeof fetch;
    __setLlmHttpFetchForTests(fetchMock);

    await expect(llmHttpHandler({ prompt: "a" }, {})).rejects.toThrow(/llm_http_transport/);
    await expect(llmHttpHandler({ prompt: "a" }, {})).rejects.toThrow("llm_http_circuit_open");
  });

  it("keeps Hull allowlist enforcement on HTTP path", async () => {
    process.env.HULL_MODE = "1";
    process.env.LLM_HTTP_BASE = "https://api.openai.com";
    process.env.LLM_HTTP_API_KEY = "k";

    await expect(llmHttpHandler({ prompt: "a" }, {})).rejects.toThrow(/HULL_MODE: blocked outbound/);
  });
});
