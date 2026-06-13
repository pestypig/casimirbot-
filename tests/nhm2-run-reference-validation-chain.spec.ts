import { describe, expect, it } from "vitest";

import { planReferenceValidationChain } from "../tools/nhm2/run-reference-validation-chain";

const baseArgs = () => ({
  "reference-run": "artifacts/reference/nhm2-reference-run.json",
  "source-closure": "artifacts/reference/nhm2-source-closure.json",
  "full-loop-audit": "artifacts/reference/nhm2-full-loop-audit.json",
  "out-root": "artifacts/research/full-solve/reference/run-1",
  "run-id": "run-1",
});

const baseArgsWithoutSourceClosure = () => {
  const args: Record<string, string> = { ...baseArgs() };
  delete args["source-closure"];
  return args;
};

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

  it("generates and consumes a regional material source tensor model from component evidence", () => {
    const plan = planReferenceValidationChain({
      ...baseArgs(),
      "build-tile-local-source-elements": true,
      "casimir-material-receipt": "artifacts/reference/casimir-material-receipt.json",
      "qei-worldline-dossier": "artifacts/reference/nhm2-qei-worldline-dossier.json",
      "observer-robust-energy-conditions":
        "artifacts/reference/nhm2-observer-robust-energy-conditions.json",
      "regional-source-component-model": "fixtures/nhm2/regional-source-components.json",
      "regional-source-full-tensor-template":
        "fixtures/nhm2/regional-full-tensor-template.json",
      "metric-required-full-tensor-source":
        "fixtures/nhm2/metric-required-full-tensor-source.json",
    });
    const scripts = plan.map((command) => command.script);
    const regionalModel = findCommand(
      plan,
      "nhm2:build-regional-material-source-tensor-model",
    );
    const tileLocal = findCommand(plan, "nhm2:build-tile-local-source-elements");

    expect(scripts.indexOf("nhm2:build-regional-material-source-tensor-model")).toBeLessThan(
      scripts.indexOf("nhm2:build-tile-local-source-elements"),
    );
    expect(regionalModel.args).toContain("fixtures/nhm2/regional-source-components.json");
    expect(tileLocal.args).toContain("--regional-material-source-tensor-model");
    expect(tileLocal.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-material-source-tensor-model.json",
    );

    const coupled = findCommand(plan, "nhm2:build-coupled-closure-pass-candidate");
    expect(scripts.indexOf("nhm2:source-closure-pass-readiness")).toBeLessThan(
      scripts.indexOf("nhm2:build-coupled-closure-pass-candidate"),
    );
    expect(scripts.indexOf("nhm2:build-coupled-closure-pass-candidate")).toBeLessThan(
      scripts.indexOf("nhm2:build-regional-tensor-pass-path-harness"),
    );
    expect(scripts.indexOf("nhm2:build-regional-tensor-pass-path-harness")).toBeLessThan(
      scripts.indexOf("nhm2:build-reference-run-blocker-ledger"),
    );
    expect(scripts.indexOf("nhm2:build-reference-run-blocker-ledger")).toBeLessThan(
      scripts.indexOf("nhm2:build-full-solve-claim-admission"),
    );
    expect(scripts.indexOf("nhm2:build-full-solve-claim-admission")).toBeLessThan(
      scripts.indexOf("nhm2:render-reference-run-blocker-ledger"),
    );
    expect(coupled.args).toContain("--regional-material-source-tensor-model");
    expect(coupled.args).toContain("--qei-worldline-dossier");
    expect(coupled.args).toContain("--observer-robust-energy-conditions");
    expect(coupled.args).toContain("--casimir-material-receipt");

    const targets = findCommand(plan, "nhm2:build-regional-source-tensor-targets");
    expect(scripts.indexOf("nhm2:publish-regional-source-closure-evidence")).toBeLessThan(
      scripts.indexOf("nhm2:build-regional-source-tensor-targets"),
    );
    expect(
      scripts.indexOf("nhm2:publish-metric-required-regional-tensor-receipt"),
    ).toBeLessThan(scripts.indexOf("nhm2:publish-regional-source-closure-evidence"));
    expect(scripts.indexOf("nhm2:build-regional-source-tensor-targets")).toBeLessThan(
      scripts.indexOf("nhm2:build-regional-source-tensor-candidate"),
    );
    expect(scripts.indexOf("nhm2:build-regional-source-tensor-candidate")).toBeLessThan(
      scripts.indexOf("nhm2:build-regional-source-tensor-quality-control"),
    );
    expect(scripts.indexOf("nhm2:build-regional-source-tensor-quality-control")).toBeLessThan(
      scripts.indexOf("nhm2:source-closure-pass-readiness"),
    );
    expect(targets.args).toContain("--regional-source-closure-evidence");
    expect(targets.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-closure-evidence.json",
    );
    expect(targets.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-targets.json",
    );

    const metricReceipt = findCommand(
      plan,
      "nhm2:publish-metric-required-regional-tensor-receipt",
    );
    expect(metricReceipt.args).toContain("--reference-run");
    expect(metricReceipt.args).toContain("artifacts/reference/nhm2-reference-run.json");
    expect(metricReceipt.args).toContain("--source-closure");
    expect(metricReceipt.args).toContain("artifacts/reference/nhm2-source-closure.json");
    expect(metricReceipt.args).toContain("--metric-required-full-tensor-source");
    expect(metricReceipt.args).toContain(
      "fixtures/nhm2/metric-required-full-tensor-source.json",
    );
    expect(metricReceipt.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-tensor-receipt.json",
    );

    const regionalEvidence = findCommand(
      plan,
      "nhm2:publish-regional-source-closure-evidence",
    );
    expect(regionalEvidence.args).toContain("--metric-required-regional-tensor-receipt");
    expect(regionalEvidence.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-tensor-receipt.json",
    );

    const candidate = findCommand(plan, "nhm2:build-regional-source-tensor-candidate");
    expect(candidate.args).toContain("--regional-source-tensor-targets");
    expect(candidate.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-targets.json",
    );
    expect(candidate.args).toContain("--material-receipt");
    expect(candidate.args).toContain("artifacts/reference/casimir-material-receipt.json");
    expect(candidate.args).toContain("--full-tensor-template");
    expect(candidate.args).toContain("fixtures/nhm2/regional-full-tensor-template.json");
    expect(candidate.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-candidate.json",
    );

    const qualityControl = findCommand(
      plan,
      "nhm2:build-regional-source-tensor-quality-control",
    );
    expect(qualityControl.args).toContain("--regional-source-tensor-targets");
    expect(qualityControl.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-targets.json",
    );
    expect(qualityControl.args).toContain("--regional-source-tensor-candidate");
    expect(qualityControl.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-candidate.json",
    );
    expect(qualityControl.args).toContain("--regional-material-source-tensor-model");
    expect(qualityControl.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-material-source-tensor-model.json",
    );
    expect(qualityControl.args).toContain("--material-receipt");
    expect(qualityControl.args).toContain("artifacts/reference/casimir-material-receipt.json");
    expect(qualityControl.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-source-tensor-quality-control.json",
    );

    const passPathHarness = findCommand(
      plan,
      "nhm2:build-regional-tensor-pass-path-harness",
    );
    expect(passPathHarness.args).toContain("--regional-material-source-tensor-model");
    expect(passPathHarness.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-material-source-tensor-model.json",
    );
    expect(passPathHarness.args).toContain("--source-side-authority");
    expect(passPathHarness.args).toContain("--regional-source-closure-evidence");
    expect(passPathHarness.args).toContain("--source-closure-pass-readiness");
    expect(passPathHarness.args).toContain("--qei-worldline-dossier");
    expect(passPathHarness.args).toContain("--observer-robust-energy-conditions");
    expect(passPathHarness.args).toContain("--casimir-material-receipt");
    expect(passPathHarness.args).toContain("--coupled-closure-pass-candidate");
    expect(passPathHarness.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-coupled-closure-pass-candidate.json",
    );
    expect(passPathHarness.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-tensor-pass-path-harness.json",
    );

    const admission = findCommand(plan, "nhm2:build-full-solve-claim-admission");
    expect(admission.args).toContain("--coupled-closure-pass-candidate");
    expect(admission.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-coupled-closure-pass-candidate.json",
    );
    expect(admission.args).toContain("--blocker-ledger");
    expect(admission.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-blocker-ledger-run-1.json",
    );
    expect(admission.args).toContain("--reference-run-validation");
    expect(admission.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-reference-run-validation.json",
    );
  });

  it("generates metric-required full tensor source from a runtime artifact before publishing the metric receipt", () => {
    const plan = planReferenceValidationChain({
      ...baseArgs(),
      "generate-metric-required-full-tensor-source": true,
      "metric-runtime-artifact": "artifacts/reference/nhm2-runtime-artifact.json",
    });
    const scripts = plan.map((command) => command.script);
    const generatedSource = findCommand(
      plan,
      "nhm2:publish-metric-required-full-tensor-source",
    );
    const metricReceipt = findCommand(
      plan,
      "nhm2:publish-metric-required-regional-tensor-receipt",
    );

    expect(scripts.indexOf("nhm2:publish-metric-required-full-tensor-source")).toBeLessThan(
      scripts.indexOf("nhm2:publish-metric-required-regional-tensor-receipt"),
    );
    expect(generatedSource.args).toEqual([
      "--reference-run",
      "artifacts/reference/nhm2-reference-run.json",
      "--runtime-artifact",
      "artifacts/reference/nhm2-runtime-artifact.json",
      "--source-closure",
      "artifacts/reference/nhm2-source-closure.json",
      "--out",
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-full-tensor-source.json",
    ]);
    expect(metricReceipt.args).toContain("--metric-required-full-tensor-source");
    expect(metricReceipt.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-full-tensor-source.json",
    );
  });

  it("freezes current runtime source closure before generating metric-required full tensor source", () => {
    const plan = planReferenceValidationChain({
      ...baseArgsWithoutSourceClosure(),
      "generate-current-runtime-source-closure": true,
      "generate-metric-required-full-tensor-source": true,
    });
    const scripts = plan.map((command) => command.script);
    const currentRuntime = findCommand(plan, "nhm2:publish-current-runtime-source-closure");
    const generatedSource = findCommand(
      plan,
      "nhm2:publish-metric-required-full-tensor-source",
    );
    const metricReceipt = findCommand(
      plan,
      "nhm2:publish-metric-required-regional-tensor-receipt",
    );

    expect(scripts[0]).toBe("nhm2:publish-current-runtime-source-closure");
    expect(scripts.indexOf("nhm2:publish-current-runtime-source-closure")).toBeLessThan(
      scripts.indexOf("nhm2:publish-metric-required-full-tensor-source"),
    );
    expect(scripts.indexOf("nhm2:publish-metric-required-full-tensor-source")).toBeLessThan(
      scripts.indexOf("nhm2:publish-metric-required-regional-tensor-receipt"),
    );
    expect(currentRuntime.args).toEqual([
      "--out-root",
      "artifacts/research/full-solve/reference/run-1",
      "--runtime-out",
      "artifacts/research/full-solve/reference/run-1/nhm2-runtime-current.json",
      "--source-closure-out",
      "artifacts/research/full-solve/reference/run-1/nhm2-source-closure-current.json",
      "--coverage-out",
      "artifacts/research/full-solve/reference/run-1/nhm2-regional-full-tensor-coverage.json",
      "--selected-profile-id",
      "stage1_centerline_alpha_0p995_v1",
      "--run-id",
      "run-1",
    ]);
    expect(generatedSource.args).toEqual([
      "--reference-run",
      "artifacts/reference/nhm2-reference-run.json",
      "--runtime-artifact",
      "artifacts/research/full-solve/reference/run-1/nhm2-runtime-current.json",
      "--source-closure",
      "artifacts/research/full-solve/reference/run-1/nhm2-source-closure-current.json",
      "--out",
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-full-tensor-source.json",
    ]);
    expect(metricReceipt.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-source-closure-current.json",
    );
    expect(metricReceipt.args).toContain(
      "artifacts/research/full-solve/reference/run-1/nhm2-metric-required-regional-full-tensor-source.json",
    );
  });

  it("rejects ambiguous generated and prebuilt metric-required full tensor source inputs", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "metric-required-full-tensor-source":
          "artifacts/reference/nhm2-metric-required-regional-full-tensor-source.json",
        "generate-metric-required-full-tensor-source": true,
        "metric-runtime-artifact": "artifacts/reference/nhm2-runtime-artifact.json",
      }),
    ).toThrow(/mutually exclusive/);
  });

  it("requires a runtime artifact when generating metric-required full tensor source", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "generate-metric-required-full-tensor-source": true,
      }),
    ).toThrow(/requires --metric-runtime-artifact/);
  });

  it("rejects ambiguous current runtime generation inputs", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "generate-current-runtime-source-closure": true,
      }),
    ).toThrow(/--source-closure and --generate-current-runtime-source-closure/);
    expect(() =>
      planReferenceValidationChain({
        ...baseArgsWithoutSourceClosure(),
        "generate-current-runtime-source-closure": true,
        "metric-runtime-artifact": "artifacts/reference/nhm2-runtime-artifact.json",
      }),
    ).toThrow(/--metric-runtime-artifact and --generate-current-runtime-source-closure/);
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

  it("rejects mixed wall and regional tensor model inputs", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "build-tile-local-source-elements": true,
        "wall-material-source-tensor-model":
          "artifacts/reference/nhm2-wall-material-source-tensor-model.json",
        "regional-source-component-model":
          "fixtures/nhm2/regional-source-components.json",
      }),
    ).toThrow(/regional and wall material source tensor models are mutually exclusive/);
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

  it("rejects prebuilt tile-local inputs when a regional tensor model still needs provenance", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "build-tile-local-source-elements": true,
        "tile-local-source-elements":
          "artifacts/reference/nhm2-tile-local-source-elements.json",
        "regional-material-source-tensor-model":
          "artifacts/reference/nhm2-regional-material-source-tensor-model.json",
      }),
    ).toThrow(/prebuilt --tile-local-source-elements/);
  });

  it("rejects ambiguous generated and prebuilt conservation inputs", () => {
    expect(() =>
      planReferenceValidationChain({
        ...baseArgs(),
        "source-input": "fixtures/nhm2/source-input.json",
        "conservation": "artifacts/reference/nhm2-tile-counterpart-conservation.json",
      }),
    ).toThrow(/mutually exclusive/);
  });
});
