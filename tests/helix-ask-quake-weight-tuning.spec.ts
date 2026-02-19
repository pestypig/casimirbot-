import { describe, expect, it } from "vitest";
import { extractStopReason } from "../scripts/helix-ask-quake-weight-tuning";

describe("helix quake weight tuning stop reason extraction", () => {
  it("prefers debug stop reasons and falls back to row.stop_reason", () => {
    expect(
      extractStopReason({
        stop_reason: "fallback",
        debug: { agent_stop_reason: "clocka_tool_cap", controller_stop_reason: "controller" },
      }),
    ).toBe("clocka_tool_cap");

    expect(
      extractStopReason({
        stop_reason: "fallback",
        debug: { controller_stop_reason: "clocka_tool_cap" },
      }),
    ).toBe("clocka_tool_cap");

    expect(extractStopReason({ stop_reason: "clocka_tool_cap" })).toBe("clocka_tool_cap");
  });
});
