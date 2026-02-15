import { describe, expect, it } from "vitest";
import { loadRuntimeFrameContract } from "../server/services/runtime/frame-contract";

describe("runtime frame contract", () => {
  it("loads the default $499 profile", () => {
    const contract = loadRuntimeFrameContract();
    expect(contract.profile).toBe("console_499");
    expect(contract.clockA.max_tool_calls).toBe(2);
    expect(contract.lanes.llm.max_concurrent).toBe(1);
  });
});
