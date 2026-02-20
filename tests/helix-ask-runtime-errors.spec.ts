import { describe, expect, it } from "vitest";
import { isFastModeRuntimeMissingSymbolError } from "../server/services/helix-ask/runtime-errors";
import { __testOnlyNonReportGuard } from "../server/routes/agi.plan";

describe("isFastModeRuntimeMissingSymbolError", () => {
  it("detects missing runHelperWithinStageBudget symbol from Node reference errors", () => {
    const error = new ReferenceError("runHelperWithinStageBudget is not defined");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(true);
  });

  it("detects missing getAskElapsedMs symbol from Safari-style messages", () => {
    const message = "ReferenceError: Can't find variable: getAskElapsedMs";
    expect(isFastModeRuntimeMissingSymbolError(message)).toBe(true);
  });

  it("detects quoted/function-form missing symbol messages", () => {
    expect(isFastModeRuntimeMissingSymbolError("ReferenceError: 'getAskElapsedMs' is not defined")).toBe(true);
    expect(isFastModeRuntimeMissingSymbolError("ReferenceError: getAskElapsedMs() is not defined")).toBe(true);
  });

  it("ignores unrelated runtime errors", () => {
    const error = new Error("database connection reset");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(false);
  });
});


describe("non-report guard ordering for runtime fallback", () => {
  it("strips report scaffolding for non-report runtime fallback context", () => {
    const context = __testOnlyNonReportGuard.resolveNonReportGuardContext(
      "Where is ask route logic?",
    );
    const guarded = __testOnlyNonReportGuard.enforceNonReportModeGuard(
      "Executive summary:\n- Runtime fallback excerpt surfaced.\n\nCoverage map:\n- Grounded: 0\n\nSources: server/routes/agi.plan.ts",
      context.reportModeEnabled,
      context.intentStrategy,
    );

    expect(context.reportModeEnabled).toBe(false);
    expect(context.intentStrategy).not.toBe("constraint_report");
    expect(guarded.text).not.toMatch(/Executive summary:/i);
    expect(guarded.text).toMatch(/Runtime fallback excerpt surfaced/i);
    expect(guarded.hadScaffold).toBe(true);
  });

  it("preserves report scaffolding for explicit report requests", () => {
    const context = __testOnlyNonReportGuard.resolveNonReportGuardContext(
      "Generate a report for helix ask with executive summary and coverage map.",
    );
    const answer = "Executive summary:\n- item\n\nCoverage map:\n- Grounded: 1";
    const guarded = __testOnlyNonReportGuard.enforceNonReportModeGuard(
      answer,
      context.reportModeEnabled,
      context.intentStrategy,
    );

    expect(context.reportModeEnabled).toBe(true);
    expect(guarded.text).toBe(answer);
    expect(guarded.hadScaffold).toBe(false);
  });
});
