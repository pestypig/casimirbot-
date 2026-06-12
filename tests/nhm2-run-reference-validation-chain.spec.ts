import { describe, expect, it } from "vitest";

import { planReferenceValidationChain } from "../tools/nhm2/run-reference-validation-chain";

const baseArgs = () => ({
  "reference-run": "artifacts/reference/nhm2-reference-run.json",
  "source-closure": "artifacts/reference/nhm2-source-closure.json",
  "full-loop-audit": "artifacts/reference/nhm2-full-loop-audit.json",
  "out-root": "artifacts/research/full-solve/reference/run-1",
  "run-id": "run-1",
});

const findCommand = (
  plan: ReturnType<typeof planReferenceValidationChain>,
  script: string,
) => {
  const match = plan.find((command) => command.script === script);
  if (match == null) throw new Error(`missing command ${script}`);
  return match;
};

describe("NHM2 reference validation chain planner", () => {
  it("generates and consumes a wall material source tensor model from component evidence", () => {
    const plan = planReferenceValidationChain({
      ...baseArgs(),
      "build-tile-local-source-elements": true,
      "casimir-material-receipt": "artifacts/reference/casimir-material-receipt.json",
      "regional-source-closure-evidence":
        "artifacts/reference/nhm2-regional-source-closure-evidence.json",
      "wall-source-component-model": "fixtures/nhm2/wall-source-components.json",
    });
    const scripts = plan.map((command) => command.script);

    expect(scripts.slice(0, 6)).toEqual([
      "nhm2:build-wall-source-layering-sweep",
      "nhm2:build-layered-wall-source-candidate",
      "nhm2:build-wall-material-source-tensor-model",
      "nhm2:build-layered-wall-full-tensor-source-audit",
      "nhm2:build-layered-wall-source-tensor-candidate",
      "nhm2:build-tile-local-source-elements",
    ]);

    expect(findCommand(plan, "nhm2:build-wall-source-layering-sweep").args).toEqual([
      "--regional-source-closure-evidence",
      "artifacts/reference/nhm2-regional-source-closure-evidence.json",
      "--out",
      "artifacts/research/full-solve/reference/run-1/nhm2-wall-source-layering-sweep.json",
    ]);
    expect(findCommand(plan, "nhm2:build-wall-material-source-tensor-model").args).toContain(
      "fixtures/nhm2/wall-source-components.json",
    );
    expect(findCommand(plan, "nhm2:build-layered-wall-full-tensor-source-audit").args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-wall-material-source-tensor-model.json",
    );
    expect(findCommand(plan, "nhm2:build-tile-local-source-elements").args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-wall-material-source-tensor-model.json",
    );
  });

  it("forwards a prebuilt wall material source tensor model into tile-local generation", () => {
    const plan = planReferenceValidationChain({
      ...baseArgs(),
      "build-tile-local-source-elements": true,
      "wall-material-source-tensor-model":
        "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
    });
    const scripts = plan.map((command) => command.script);
    const tileLocal = findCommand(plan, "nhm2:build-tile-local-source-elements");

    expect(scripts).not.toContain("nhm2:build-wall-material-source-tensor-model");
    expect(tileLocal.args).toContain("--wall-material-source-tensor-model");
    expect(tileLocal.args).toContain(
      "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
    );
  });

  it("builds a layered full-tensor audit when both a candidate and source tensor model are available", () => {
    const plan = planReferenceValidationChain({
      ...baseArgs(),
      "build-tile-local-source-elements": true,
      "layered-wall-source-candidate":
        "artifacts/reference/nhm2-layered-wall-source-candidate.json",
      "wall-material-source-tensor-model":
        "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
    });
    const audit = findCommand(plan, "nhm2:build-layered-wall-full-tensor-source-audit");
    const tensorCandidate = findCommand(
      plan,
      "nhm2:build-layered-wall-source-tensor-candidate",
    );

    expect(audit.args).toContain("artifacts/reference/nhm2-layered-wall-source-candidate.json");
    expect(audit.args).toContain("artifacts/reference/nhm2-wall-material-source-tensor-model.json");
    expect(tensorCandidate.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-layered-wall-full-tensor-source-audit.json",
    );
  });

  it("does not let a wall tensor model be silently ignored", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "wall-material-source-tensor-model":
          "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
      }),
    ).toThrow(/requires --build-tile-local-source-elements/);
  });

  it("rejects mutually exclusive wall tensor model inputs", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "build-tile-local-source-elements": true,
        "wall-material-source-tensor-model":
          "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
        "wall-source-component-model": "fixtures/nhm2/wall-source-components.json",
      }),
    ).toThrow(/mutually exclusive/);
  });

  it("rejects prebuilt tile-local inputs when a wall tensor model still needs provenance", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "build-tile-local-source-elements": true,
        "tile-local-source-elements":
          "artifacts/reference/nhm2-tile-local-source-elements.json",
        "wall-material-source-tensor-model":
          "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
      }),
    ).toThrow(/prebuilt --tile-local-source-elements/);
  });
});
