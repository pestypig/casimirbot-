import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runErEprSolverAdapter, erEprSolverAdapterRequestSchema } from "../shared/er-epr-solver-adapter";
import {
  renderErEprSolverAdapterReport,
  validateErEprSolverSafeLanguage,
} from "../shared/er-epr-solver-safe-language";

describe("ER=EPR solver safe language", () => {
  it.each([
    "proves ER=EPR",
    "wormhole inventory",
    "NHM2 propulsion evidence",
    "stress-energy source",
    "CL4 support",
  ])("rejects forbidden phrase: %s", (phrase) => {
    expect(validateErEprSolverSafeLanguage(phrase).ok).toBe(false);
  });

  it("renders bounded solver-adapter language", () => {
    const request = erEprSolverAdapterRequestSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json", "utf8")),
    );
    const text = renderErEprSolverAdapterReport(runErEprSolverAdapter(request));
    expect(text).toContain("model-internal");
    expect(text).toContain("not real-universe wormhole evidence");
    expect(text).toContain("Claim IDs:");
    expect(text).toContain("proxy_only");
  });
});
