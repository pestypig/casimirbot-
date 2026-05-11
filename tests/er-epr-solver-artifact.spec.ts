import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runErEprSolverAdapter, erEprSolverAdapterRequestSchema } from "../shared/er-epr-solver-adapter";
import { erEprSolverAdapterArtifactSchema } from "../shared/er-epr-solver-artifact";

describe("ER=EPR solver artifact", () => {
  it("accepts a complete solver adapter artifact", () => {
    const request = erEprSolverAdapterRequestSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json", "utf8")),
    );
    const artifact = erEprSolverAdapterArtifactSchema.parse(runErEprSolverAdapter(request));
    expect(artifact.evidence.claimIds.length).toBeGreaterThan(0);
  });

  it("rejects missing claim IDs", () => {
    const request = erEprSolverAdapterRequestSchema.parse(
      JSON.parse(readFileSync("tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json", "utf8")),
    );
    const artifact = runErEprSolverAdapter(request);
    expect(() =>
      erEprSolverAdapterArtifactSchema.parse({
        ...artifact,
        evidence: { ...artifact.evidence, claimIds: [] },
      }),
    ).toThrow();
  });
});
