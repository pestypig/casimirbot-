import { describe, expect, it } from "vitest";

import { buildReferenceValidationChainLatestCommandArgs } from "../tools/nhm2/run-reference-validation-chain-latest";

const resolvedInputs = () => ({
  runId: "latest-run",
  outRoot: "artifacts/research/full-solve/validation-chain/latest-run",
  inputRefs: {
    atlasManifest: "artifacts/research/full-solve/rendered/layered-ledger-atlas/run/manifest.json",
    referenceLedger: "artifacts/research/full-solve/reference/run/nhm2-blocker-ledger-run.json",
    referenceRun: "artifacts/research/full-solve/reference/run/nhm2-reference-run.json",
    sourceClosure: "artifacts/research/full-solve/reference/run/nhm2-source-closure.json",
    regionalSourceClosure:
      "artifacts/research/full-solve/reference/run/nhm2-regional-source-closure-evidence.json",
    fullLoopAudit: "artifacts/research/full-solve/reference/run/nhm2-full-loop-audit.json",
  },
});

describe("NHM2 latest reference validation chain wrapper", () => {
  it("forwards current-runtime metric full-tensor generation without stale source closure", () => {
    const commandArgs = buildReferenceValidationChainLatestCommandArgs(
      {
        "generate-current-runtime-source-closure": true,
        "generate-metric-required-full-tensor-source": true,
        "build-regional-support-function-atlas": true,
        "current-runtime-profile-id": "stage1_centerline_alpha_0p995_v1",
      },
      resolvedInputs(),
    );

    expect(commandArgs).toContain("--generate-current-runtime-source-closure");
    expect(commandArgs).toContain("--generate-metric-required-full-tensor-source");
    expect(commandArgs).toContain("--build-regional-support-function-atlas");
    expect(commandArgs).toContain("--current-runtime-profile-id");
    expect(commandArgs).toContain("stage1_centerline_alpha_0p995_v1");
    expect(commandArgs).not.toContain("--source-closure");
  });

  it("does not require a resolved source closure when current-runtime generation owns it", () => {
    const resolved = resolvedInputs();
    resolved.inputRefs.sourceClosure = null;
    const commandArgs = buildReferenceValidationChainLatestCommandArgs(
      { "generate-current-runtime-source-closure": true },
      resolved,
    );

    expect(commandArgs).toContain("--generate-current-runtime-source-closure");
    expect(commandArgs).not.toContain("--source-closure");
  });

  it("preserves explicit source closure unless current-runtime generation is requested", () => {
    const commandArgs = buildReferenceValidationChainLatestCommandArgs({}, resolvedInputs());

    expect(commandArgs).toContain("--source-closure");
    expect(commandArgs).toContain(
      "artifacts/research/full-solve/reference/run/nhm2-source-closure.json",
    );
    expect(commandArgs).not.toContain("--generate-current-runtime-source-closure");
  });

  it("forwards regional runtime artifacts and templates used by the full-solve chain", () => {
    const commandArgs = buildReferenceValidationChainLatestCommandArgs(
      {
        "source-input": "fixtures/nhm2/source-input.json",
        "build-regional-source-transition-kernel": true,
        "regional-source-transition-kernel":
          "artifacts/reference/nhm2-regional-source-transition-kernel.json",
        "regional-support-atlas":
          "artifacts/reference/nhm2-regional-support-function-atlas.json",
        "regional-source-full-tensor-template":
          "fixtures/nhm2/regional-full-tensor-template.json",
        "metric-required-full-tensor-source":
          "fixtures/nhm2/metric-required-full-tensor-source.json",
      },
      resolvedInputs(),
    );

    expect(commandArgs).toContain("--source-input");
    expect(commandArgs).toContain("--build-regional-source-transition-kernel");
    expect(commandArgs).toContain("--regional-source-transition-kernel");
    expect(commandArgs).toContain("--regional-support-atlas");
    expect(commandArgs).toContain("--regional-source-full-tensor-template");
    expect(commandArgs).toContain("--metric-required-full-tensor-source");
  });
});
