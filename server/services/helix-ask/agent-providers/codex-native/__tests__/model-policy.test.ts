import { afterEach, describe, expect, it } from "vitest";
import { resolveCodexNativeModelPolicy } from "../model-policy";

const originalEnvironment = {
  LLM_HTTP_MODEL: process.env.LLM_HTTP_MODEL,
  LLM_LOCAL_MODEL: process.env.LLM_LOCAL_MODEL,
  HELIX_ASK_INTERPRETER_MODEL: process.env.HELIX_ASK_INTERPRETER_MODEL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Codex native model policy", () => {
  it("passes the resolved Helix language model and effort to Codex", () => {
    expect(resolveCodexNativeModelPolicy({
      language_model_policy: {
        schema: "helix.language_model_policy.v1",
        resolved_model: "gpt-5.5",
        reasoning_effort: "high",
      },
    })).toMatchObject({
      model: "gpt-5.5",
      reasoningEffort: "high",
      source: "language_model_policy",
    });
  });

  it("does not pass an invalid reasoning effort", () => {
    expect(resolveCodexNativeModelPolicy({
      model: "gpt-5.4-mini",
      reasoning_effort: "maximum",
    })).toMatchObject({
      model: "gpt-5.4-mini",
      reasoningEffort: null,
      source: "request",
    });
  });

  it("uses the existing environment model without requiring a new startup flag", () => {
    process.env.LLM_HTTP_MODEL = "gpt-5.4-mini";
    expect(resolveCodexNativeModelPolicy({})).toMatchObject({
      model: "gpt-5.4-mini",
      reasoningEffort: null,
      source: "environment",
    });
  });
});
