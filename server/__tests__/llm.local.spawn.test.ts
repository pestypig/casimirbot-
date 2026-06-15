import { describe, expect, it } from "vitest";

import { buildArgs, isUnsupportedStopFlagError } from "../skills/llm.local.spawn";

const baseSpawnOptions = {
  model: "./models/test.gguf",
  prompt: "Say hello.",
  maxTokens: 32,
  contextTokens: 1024,
  temperature: 0.2,
  seed: 42,
};

describe("llm.local.spawn", () => {
  it("detects unsupported llama stop-flag errors", () => {
    expect(isUnsupportedStopFlagError("llm spawn exit 1: error: invalid argument: --stop", "--stop")).toBe(true);
    expect(
      isUnsupportedStopFlagError("llm spawn exit 1: error: unrecognized option: --reverse-prompt", "--reverse-prompt"),
    ).toBe(true);
    expect(isUnsupportedStopFlagError("llm spawn timeout after 60000ms", "--stop")).toBe(false);
  });

  it("can omit stop sequences when a llama build rejects stop flags", () => {
    const withStops = buildArgs([], {
      ...baseSpawnOptions,
      stop: ["</s>", "<|end|>"],
      stopFlag: "--stop",
    });
    const withoutStops = buildArgs([], {
      ...baseSpawnOptions,
      stop: ["</s>", "<|end|>"],
      stopFlag: null,
    });

    expect(withStops).toContain("--stop");
    expect(withoutStops).not.toContain("--stop");
    expect(withoutStops).not.toContain("--reverse-prompt");
    expect(withoutStops).not.toContain("</s>");
    expect(withoutStops).not.toContain("<|end|>");
  });
});
