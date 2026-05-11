import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  runErEprSolverAdapter,
  erEprSolverAdapterRequestSchema,
} from "../shared/er-epr-solver-adapter";

function loadRequest(path = "tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json") {
  return erEprSolverAdapterRequestSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

describe("ER=EPR solver adapter", () => {
  it("converts solver raw telemetry into a model-internal evaluation", () => {
    const result = runErEprSolverAdapter(loadRequest());
    expect(result.normalizedInput.modelFamily).toBe("two_sided_SYK");
    expect(result.evaluation.evidence.verdict).toBe("dual_model_support_strong");
    expect(result.qstBoundary.spacetimeCL).toBe("proxy_only");
    expect(result.qstBoundary.mayPromoteToCL4).toBe(false);
  });

  it("demotes high entropy via QST visibility", () => {
    const base = runErEprSolverAdapter(loadRequest());
    const washed = runErEprSolverAdapter(loadRequest("tests/fixtures/er-epr-solver/high-entropy-washout-raw.fixture.json"));
    expect(washed.evaluation.values.entropyVisibility).toBeLessThan(base.evaluation.values.entropyVisibility);
    expect(washed.evaluation.evidence.verdict).toBe("ordinary_control_explains_signal");
  });

  it("requires hamiltonian hash and seed for solver-simulated status", () => {
    const request = loadRequest();
    delete request.raw.model.hamiltonianHash;
    expect(() => runErEprSolverAdapter(request)).toThrow(/hamiltonianHash/);
  });

  it("blocks CL4 promotion through the existing evaluator", () => {
    const result = runErEprSolverAdapter({
      ...loadRequest(),
      requestedSpacetimeCL: "CL4",
    });
    expect(result.evaluation.evidence.verdict).toBe("overclaim_blocked");
    expect(result.evaluation.guards.blockedClaims).toContain("er_epr_sim_to_spacetime_CL_promotion");
  });
});
