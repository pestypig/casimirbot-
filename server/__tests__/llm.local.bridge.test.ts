import { afterEach, describe, expect, it, vi } from "vitest";
import { llmLocalHandler, resolveLlmLocalBackend } from "../skills/llm.local";

const envKeys = [
  "ENABLE_LLM_LOCAL_SPAWN",
  "LLM_LOCAL_CMD",
  "LLM_RUNTIME",
  "LLM_POLICY",
  "LLM_HTTP_BASE",
  "LLM_HTTP_API_KEY",
  "OPENAI_API_KEY",
  "LLM_HTTP_RETRY_COUNT",
  "LLM_LOCAL_STRICT_NO_STUB",
] as const;

const resetEnv = () => {
  for (const key of envKeys) {
    delete process.env[key];
  }
};

describe("llm.local bridge routing", () => {
  afterEach(() => {
    resetEnv();
    vi.restoreAllMocks();
  });

  it("prefers http when both backends are configured", () => {
    process.env.ENABLE_LLM_LOCAL_SPAWN = "1";
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    expect(resolveLlmLocalBackend()).toBe("http");
  });

  it("respects explicit local runtime override when spawn is available", () => {
    process.env.LLM_RUNTIME = "local";
    process.env.ENABLE_LLM_LOCAL_SPAWN = "1";
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    expect(resolveLlmLocalBackend()).toBe("spawn");
  });

  it("fails deterministically when no backend is configured", async () => {
    process.env.LLM_LOCAL_STRICT_NO_STUB = "1";
    await expect(llmLocalHandler({ prompt: "hello" }, {})).rejects.toThrow(
      "llm_backend_unavailable: configure local spawn or LLM_HTTP_BASE",
    );
  });

  it("routes through llm.http.generate bridge when only HTTP backend exists", async () => {
    process.env.LLM_HTTP_BASE = "http://127.0.0.1:11434";
    process.env.LLM_HTTP_API_KEY = "test-key";
    process.env.LLM_HTTP_RETRY_COUNT = "0";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "" } }], usage: { total_tokens: 3 } }),
      } as Response);

    const result = await llmLocalHandler({ prompt: "hello", traceId: "trace-1", sessionId: "sess-1" }, { tenantId: "t-1" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(String(url)).toContain("/v1/chat/completions");
    expect((init as RequestInit)?.headers).toMatchObject({
      "X-Trace-Id": "trace-1",
      "X-Session-Id": "sess-1",
      "X-Tenant-Id": "t-1",
    });
    expect((result as any).usage).toMatchObject({ total_tokens: 3 });
  });
});
