import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  parseVoiceCommandCandidate,
  runVoiceCommandArbiter,
} from "../server/services/voice-command/command-arbiter";

const ORIGINAL_ENV = {
  HELIX_VOICE_COMMAND_LANE_ENABLED: process.env.HELIX_VOICE_COMMAND_LANE_ENABLED,
  HELIX_VOICE_COMMAND_LANE_LOG_ONLY: process.env.HELIX_VOICE_COMMAND_LANE_LOG_ONLY,
  HELIX_VOICE_COMMAND_LANE_ACTIVE_PERCENT: process.env.HELIX_VOICE_COMMAND_LANE_ACTIVE_PERCENT,
  HELIX_VOICE_COMMAND_LANE_STRICT_PREFIX_MODE: process.env.HELIX_VOICE_COMMAND_LANE_STRICT_PREFIX_MODE,
  HELIX_VOICE_COMMAND_LANE_KILL_SWITCH: process.env.HELIX_VOICE_COMMAND_LANE_KILL_SWITCH,
  HELIX_VOICE_COMMAND_LANE_EVALUATOR_API_KEY: process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  LLM_HTTP_API_KEY: process.env.LLM_HTTP_API_KEY,
};

const restoreEnv = () => {
  const keys = Object.keys(ORIGINAL_ENV) as Array<keyof typeof ORIGINAL_ENV>;
  for (const key of keys) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

describe("voice command arbiter", () => {
  beforeEach(() => {
    delete process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_HTTP_API_KEY;
    process.env.HELIX_VOICE_COMMAND_LANE_ENABLED = "1";
    process.env.HELIX_VOICE_COMMAND_LANE_LOG_ONLY = "0";
    process.env.HELIX_VOICE_COMMAND_LANE_ACTIVE_PERCENT = "100";
    process.env.HELIX_VOICE_COMMAND_LANE_STRICT_PREFIX_MODE = "adaptive";
    process.env.HELIX_VOICE_COMMAND_LANE_KILL_SWITCH = "0";
  });

  afterEach(() => {
    restoreEnv();
  });

  it("parses direct imperative commands through parser-first path", () => {
    expect(parseVoiceCommandCandidate("send")).toMatchObject({
      decision: "accepted",
      action: "send",
    });
    expect(parseVoiceCommandCandidate("retry")).toMatchObject({
      decision: "accepted",
      action: "retry",
    });
    expect(parseVoiceCommandCandidate("cancel")).toMatchObject({
      decision: "accepted",
      action: "cancel",
    });
  });

  it("suppresses unprefixed send/retry in adaptive strict-prefix under noisy audio", async () => {
    const result = await runVoiceCommandArbiter({
      transcript: "send",
      traceId: "trace-noisy-send",
      speechProbability: 0.42,
      snrDb: 6,
    });
    expect(result.decision).toBe("suppressed");
    expect(result.action).toBe("send");
    expect(result.suppression_reason).toBe("strict_prefix_required");
    expect(result.strict_prefix_applied).toBe(true);
  });

  it("accepts prefixed command in adaptive strict-prefix mode under noisy audio", async () => {
    const result = await runVoiceCommandArbiter({
      transcript: "helix send",
      traceId: "trace-noisy-prefixed-send",
      speechProbability: 0.42,
      snrDb: 6,
    });
    expect(result.decision).toBe("accepted");
    expect(result.action).toBe("send");
    expect(result.source).toBe("parser");
    expect(result.confirm_required).toBe(true);
    expect(result.strict_prefix_applied).toBe(true);
  });

  it("keeps cancel available without strict prefix for safety", async () => {
    const result = await runVoiceCommandArbiter({
      transcript: "cancel",
      traceId: "trace-noisy-cancel",
      speechProbability: 0.4,
      snrDb: 5,
    });
    expect(result.decision).toBe("accepted");
    expect(result.action).toBe("cancel");
    expect(result.strict_prefix_applied).toBe(true);
  });

  it("keeps mid-sentence keyword as normal dictation", async () => {
    const result = await runVoiceCommandArbiter({
      transcript: "can you explain how we retry the warp solver in this codebase",
      traceId: "trace-mid-sentence",
      speechProbability: 0.9,
      snrDb: 22,
    });
    expect(result.decision).toBe("none");
    expect(result.action).toBeNull();
  });

  it("returns none when command lane is disabled", async () => {
    process.env.HELIX_VOICE_COMMAND_LANE_ENABLED = "0";
    const result = await runVoiceCommandArbiter({
      transcript: "send",
      traceId: "trace-disabled",
      speechProbability: 0.92,
      snrDb: 20,
    });
    expect(result.decision).toBe("none");
    expect(result.suppression_reason).toBe("disabled");
  });
});
