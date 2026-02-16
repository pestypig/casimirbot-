import { describe, expect, it } from "vitest";
import { isFastModeRuntimeMissingSymbolError } from "../server/services/helix-ask/runtime-errors";

describe("isFastModeRuntimeMissingSymbolError", () => {
  it("detects missing runHelperWithinStageBudget symbol from Node reference errors", () => {
    const error = new ReferenceError("runHelperWithinStageBudget is not defined");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(true);
  });

  it("detects missing getAskElapsedMs symbol from Safari-style messages", () => {
    const message = "ReferenceError: Can't find variable: getAskElapsedMs";
    expect(isFastModeRuntimeMissingSymbolError(message)).toBe(true);
  });

  it("ignores unrelated runtime errors", () => {
    const error = new Error("database connection reset");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(false);
  });
});
