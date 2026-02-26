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

  it("returns deterministic provider metadata and correlation headers on success", async () => {
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    process.env.LLM_HTTP_API_KEY = "k";
    process.env.LLM_HTTP_RETRY_COUNT = "0";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "ok" } }], usage: { total_tokens: 5 } }),
    } as Response) as unknown as typeof fetch;
    __setLlmHttpFetchForTests(fetchMock);

    const result = (await llmHttpHandler(
      { prompt: "a", traceId: "t1", sessionId: "s1", tenantId: "tenant-7" },
      {},
    )) as Record<string, unknown>;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect((init as RequestInit)?.headers).toMatchObject({
      "X-Trace-Id": "t1",
      "X-Session-Id": "s1",
      "X-Tenant-Id": "tenant-7",
      "X-Customer-Id": "tenant-7",
    });
    expect(result.__llm_backend).toBe("http");
    expect(result.__llm_provider_called).toBe(true);
    expect(result.__llm_provider).toBe("openai_compatible");
    expect(result.__llm_routed_via).toBe("llm.http.generate");
  }, 15000);

  it("does not open breaker on repeated auth failures (401)", async () => {
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    process.env.LLM_HTTP_API_KEY = "k";
    process.env.LLM_HTTP_RETRY_COUNT = "0";
    process.env.LLM_HTTP_BREAKER_THRESHOLD = "1";
    process.env.LLM_HTTP_BREAKER_COOLDOWN_MS = "60000";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response) as unknown as typeof fetch;
    __setLlmHttpFetchForTests(fetchMock);

    await expect(llmHttpHandler({ prompt: "a" }, {})).rejects.toThrow("llm_http_401");
    await expect(llmHttpHandler({ prompt: "a" }, {})).rejects.toThrow("llm_http_401");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
