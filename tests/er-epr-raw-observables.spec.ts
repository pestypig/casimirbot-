import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseErEprRawSolverObservables } from "../shared/er-epr-raw-observables";

describe("ER=EPR raw observables", () => {
  it("accepts raw solver telemetry with backend and provenance", () => {
    const request = JSON.parse(readFileSync("tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json", "utf8"));
    const raw = parseErEprRawSolverObservables(request.raw);
    expect(raw.backend).toBe("two_sided_syk_tiny_exact_diag");
    expect(raw.model.hamiltonianHash).toBeTruthy();
    expect(raw.rawTelemetry.teleportationFidelityRaw).toBeGreaterThan(0.8);
  });

  it("rejects normalized-only solver claims", () => {
    expect(() =>
      parseErEprRawSolverObservables({
        schemaVersion: "er-epr-raw-solver-observables.v1",
        runId: "bad",
        createdAt: "2026-05-11T00:00:00.000Z",
        backend: "two_sided_syk_tiny_exact_diag",
        model: { nQubitsOrModes: 8, temperatureRegime: "low", statePreparation: "thermofield_double", coupling: "double_trace_correct_sign" },
        observables: { teleportationFidelity: 0.9 },
        normalization: { thresholdProfileId: "x", teleportationFidelityScale: "0_to_1", diagnosticsScale: "0_to_1", notes: ["bad"] },
        provenance: { reproducibilityStatus: "solver_simulated", claimIds: ["x"], citations: ["https://example.com"], caveats: ["bad"] },
      }),
    ).toThrow();
  });
});
