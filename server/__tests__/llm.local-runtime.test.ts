import { afterEach, describe, expect, it } from "vitest";
import { isHttpRuntimeLocked, isLocalRuntime } from "../services/llm/local-runtime";

const envKeys = ["LLM_POLICY", "LLM_RUNTIME", "ENABLE_LLM_LOCAL_SPAWN"] as const;

describe("llm local runtime policy lock", () => {
  afterEach(() => {
    for (const key of envKeys) delete process.env[key];
  });

  it("treats explicit local policy as local runtime", () => {
    process.env.LLM_POLICY = "local";
    expect(isLocalRuntime()).toBe(true);
    expect(isHttpRuntimeLocked()).toBe(false);
  });

  it("keeps explicit http policy locked out of local runtime even when spawn flag is set", () => {
    process.env.LLM_POLICY = "http";
    process.env.ENABLE_LLM_LOCAL_SPAWN = "1";
    expect(isLocalRuntime()).toBe(false);
    expect(isHttpRuntimeLocked()).toBe(true);
  });

  it("keeps explicit http runtime locked out of local runtime even when spawn flag is set", () => {
    process.env.LLM_RUNTIME = "http";
    process.env.ENABLE_LLM_LOCAL_SPAWN = "1";
    expect(isLocalRuntime()).toBe(false);
    expect(isHttpRuntimeLocked()).toBe(true);
  });
});
