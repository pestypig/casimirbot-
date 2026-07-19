import { describe, expect, it } from "vitest";
import {
  buildTheoryCompoundRunV1,
  isTheoryCompoundRunV1,
  validateTheoryCompoundRunV1,
} from "../theory-compound-run.v1";
import {
  buildTheoryRuntimeEntrypointV1,
  isTheoryRuntimeEntrypointV1,
  validateTheoryRuntimeEntrypointV1,
} from "../theory-runtime-entrypoint.v1";
import {
  buildTheoryRuntimeMathTraceV1,
  isTheoryRuntimeMathTraceV1,
  validateTheoryRuntimeMathTraceV1,
} from "../theory-runtime-math-trace.v1";
import {
  buildTheoryRuntimeOutputManifestV1,
  buildTheoryRuntimeReceiptV1,
  isTheoryRuntimeReceiptV1,
  validateTheoryRuntimeOutputManifestV1,
  validateTheoryRuntimeReceiptV1,
} from "../theory-runtime-receipt.v1";

const generatedAt = "2026-05-29T00:00:00.000Z";

function makeRuntimeTrace() {
  return buildTheoryRuntimeMathTraceV1({
    generatedAt,
    traceId: "runtime-trace:test",
    runtimeId: "runtime:gr-static-shell",
    graphId: "nhm2-theory-badge-graph",
    badgeIds: ["physics.gr.einstein_field_equation"],
    request: {
      family: "gr_tensor",
      target: "Einstein tensor static reference shell",
      chart: "reference",
      assumptions: ["Static/reference shell trace only; no backend runtime execution."],
    },
    steps: [
      {
        id: "metric-input",
        index: 1,
        title: "Metric Input",
        operatorKind: "tensor_definition",
        displayLatex: "g_{\\mu\\nu}",
        expression: null,
        inputSymbols: ["x"],
        outputSymbols: ["g_{mu nu}"],
        status: "computed",
        computedBy: "static_reference_shell",
        artifactRef: null,
        scalarCuts: [],
        warnings: ["Static/reference shell trace; not a runtime execution receipt."],
      },
      {
        id: "source-residual-cut",
        index: 2,
        title: "Source Residual Scalar Cut",
        operatorKind: "scalar_cut",
        displayLatex: "R_{source}=source_{required}-source_{available}",
        expression: "R_source = source_required - source_available",
        inputSymbols: ["source_required", "source_available"],
        outputSymbols: ["R_source"],
        status: "pending",
        computedBy: "scientific_calculator",
        artifactRef: null,
        scalarCuts: [
          {
            id: "source-residual-cut:scalar",
            label: "Source residual",
            expression: "R_source = source_required - source_available",
            displayLatex: "R_{source}=source_{required}-source_{available}",
            targetVariable: "R_source",
            calculatorArtifactV1: null,
          },
        ],
        warnings: [],
      },
    ],
    summary: {
      claimBoundaryNotes: ["Diagnostic/proxy row; does not validate NHM2."],
    },
  });
}

function makeRuntimeEntrypoint() {
  return buildTheoryRuntimeEntrypointV1({
    generatedAt,
    runtimeId: "runtime:casimir-verify",
    family: "casimir_field",
    label: "Casimir Verify",
    description: "Artifact-friendly Casimir verification entrypoint.",
    command: "npm run casimir:verify",
    argsSchema: null,
    outputArtifactGlobs: ["artifacts/**/*.json"],
    expectedReceiptKind: "theory_runtime_receipt/v1",
    ownedBadgeIds: ["casimir.runtime.verify"],
    sourceRefs: [
      {
        kind: "script",
        path: "package.json",
        id: "casimir:verify",
        note: "Script registry entry.",
      },
    ],
    timeoutPolicy: {
      smallMs: 5000,
      fullMs: 60000,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionRequires: ["recognized receipt", "gate pass"],
    },
  });
}

function makeRuntimeReceipt() {
  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: "runtime-receipt:test",
    runtimeId: "runtime:casimir-verify",
    graphId: "nhm2-theory-badge-graph",
    badgeIds: ["casimir.runtime.verify"],
    command: "npm run casimir:verify",
    args: {},
    status: "not_run",
    outputs: {
      artifacts: [],
      scalars: {},
      units: {},
      gates: {
        runtime_available: "unknown",
      },
      missingSignals: ["runtime receipt not executed in Phase 1"],
      warnings: ["Contract fixture only; no backend job was run."],
    },
    provenance: {
      gitSha: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "diagnostic",
      promotionAllowed: false,
      promotionBlockedBy: ["not_run"],
    },
  });
}

function makeCompoundRun() {
  const runtimeTrace = makeRuntimeTrace();
  const runtimeReceipt = makeRuntimeReceipt();
  return buildTheoryCompoundRunV1({
    generatedAt,
    runId: "compound-run:test",
    graphId: "nhm2-theory-badge-graph",
    targetBadgeIds: ["physics.gr.einstein_field_equation"],
    source: {
      kind: "manual",
      label: "contract fixture",
    },
    rows: [
      {
        id: "row:reference",
        index: 1,
        badgeId: "physics.gr.einstein_field_equation",
        badgeTitle: "Einstein Field Equation",
        title: "Einstein Field Equation Reference",
        kind: "tensor",
        displayLatex: "G_{\\mu\\nu}=8\\pi G T_{\\mu\\nu}/c^4",
        expression: null,
        status: "computed",
        solver: "tensor_runtime",
        sourcePath: "theory://nhm2-theory-badge-graph/physics.gr.einstein_field_equation/runtime",
        dependsOn: [],
        runtimeMathTraceV1: runtimeTrace,
        runtimeReceiptV1: runtimeReceipt,
        evidenceRefs: [],
        claimBoundaryNotes: ["Static/reference shell trace only; no validation claim."],
        warnings: ["No backend runtime execution in Phase 1 fixture."],
      },
      {
        id: "row:boundary",
        index: 2,
        badgeId: "nhm2.claim_boundary.diagnostic_only",
        badgeTitle: "Diagnostic Only Boundary",
        title: "Claim Boundary",
        kind: "boundary",
        displayLatex: null,
        expression: null,
        status: "blocked",
        solver: "none",
        sourcePath: "theory://nhm2-theory-badge-graph/nhm2.claim_boundary.diagnostic_only/context",
        dependsOn: ["row:reference"],
        calculatorArtifactV1: null,
        runtimeMathTraceV1: null,
        runtimeReceiptV1: null,
        evidenceRefs: [],
        claimBoundaryNotes: ["Promotion not allowed without required gates and evidence."],
        warnings: ["Fails closed until evidence and gates are present."],
      },
    ],
  });
}

describe("theory runtime and compound run contracts", () => {
  it("validates runtime math trace fixtures", () => {
    const trace = makeRuntimeTrace();

    expect(validateTheoryRuntimeMathTraceV1(trace)).toEqual([]);
    expect(isTheoryRuntimeMathTraceV1(trace)).toBe(true);
    expect(trace.summary).toMatchObject({
      stepCount: 2,
      computedCount: 1,
      scalarCutCount: 1,
      blockedCount: 0,
      failedCount: 0,
    });
  });

  it("rejects runtime math traces with missing artifactId, invalid operator kind, invalid status, or stale summary", () => {
    const missingArtifact = { ...makeRuntimeTrace(), artifactId: undefined };
    const invalidKind = {
      ...makeRuntimeTrace(),
      steps: [{ ...makeRuntimeTrace().steps[0], operatorKind: "magic_tensor" }],
    };
    const invalidStatus = {
      ...makeRuntimeTrace(),
      steps: [{ ...makeRuntimeTrace().steps[0], status: "validated" }],
    };
    const staleSummary = {
      ...makeRuntimeTrace(),
      summary: { ...makeRuntimeTrace().summary, stepCount: 99 },
    };

    expect(validateTheoryRuntimeMathTraceV1(missingArtifact).some((issue) => issue.includes("artifactId"))).toBe(true);
    expect(validateTheoryRuntimeMathTraceV1(invalidKind).some((issue) => issue.includes("operatorKind"))).toBe(true);
    expect(validateTheoryRuntimeMathTraceV1(invalidStatus).some((issue) => issue.includes("status"))).toBe(true);
    expect(validateTheoryRuntimeMathTraceV1(staleSummary).some((issue) => issue.includes("summary.stepCount"))).toBe(true);
  });

  it("validates runtime entrypoint fixtures and requires claim boundaries", () => {
    const entrypoint = makeRuntimeEntrypoint();
    const missingBoundary = { ...entrypoint, claimBoundary: undefined };

    expect(validateTheoryRuntimeEntrypointV1(entrypoint)).toEqual([]);
    expect(isTheoryRuntimeEntrypointV1(entrypoint)).toBe(true);
    expect(validateTheoryRuntimeEntrypointV1(missingBoundary).some((issue) => issue.includes("claimBoundary"))).toBe(true);
  });

  it("validates runtime receipt fixtures and requires claim boundaries", () => {
    const receipt = makeRuntimeReceipt();
    const missingBoundary = { ...receipt, claimBoundary: undefined };
    const invalidGate = {
      ...receipt,
      outputs: {
        ...receipt.outputs,
        gates: { runtime_available: "validated" },
      },
    };

    expect(validateTheoryRuntimeReceiptV1(receipt)).toEqual([]);
    expect(isTheoryRuntimeReceiptV1(receipt)).toBe(true);
    expect(validateTheoryRuntimeReceiptV1(missingBoundary).some((issue) => issue.includes("claimBoundary"))).toBe(true);
    expect(validateTheoryRuntimeReceiptV1(invalidGate).some((issue) => issue.includes("outputs.gates"))).toBe(true);
  });

  it("validates review-valued per-artifact evidence and content-addressed output manifests", () => {
    const manifest = buildTheoryRuntimeOutputManifestV1({
      generatedAt,
      requestId: "request:test",
      runtimeId: "nhm2.shift_lapse.alpha_sweep",
      gitSha: "1234567890abcdef1234567890abcdef12345678",
      startedAt: generatedAt,
      completedAt: "2026-05-29T00:00:01.000Z",
      outputDirectory: "artifacts/run",
      boundToExecution: true,
      manifestPath: "artifacts/run/theory-runtime-output-manifest-test.v1.json",
      manifestSha256: "a".repeat(64),
      entries: [{
        path: "artifacts/run/source-closure.json",
        sha256: "b".repeat(64),
        sizeBytes: 42,
        modifiedAt: generatedAt,
        freshness: "new",
      }],
    });
    const receipt = makeRuntimeReceipt();
    const withEvidence = {
      ...receipt,
      outputs: {
        ...receipt.outputs,
        gates: { source_closure: "pass" as const },
        artifactManifest: manifest,
        artifactEvidence: [{
          path: "artifacts/run/source-closure.json",
          sha256: "b".repeat(64),
          freshness: "new" as const,
          status: "review" as const,
          gates: { status: "review" as const },
        }],
      },
    };

    expect(validateTheoryRuntimeOutputManifestV1(manifest)).toEqual([]);
    expect(validateTheoryRuntimeOutputManifestV1({
      ...manifest,
      gitSha: "abc123",
      startedAt: "2026-05-29T00:00:02.000Z",
      completedAt: "2026-05-29T00:00:01.000Z",
      entries: [{
        ...manifest.entries[0],
        sha256: "short",
        sizeBytes: 1.5,
        modifiedAt: "not-a-timestamp",
      }],
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("gitSha"),
      expect.stringContaining("completedAt"),
      expect.stringContaining("entries"),
    ]));
    expect(validateTheoryRuntimeReceiptV1(withEvidence)).toEqual([]);
    expect(isTheoryRuntimeReceiptV1(withEvidence)).toBe(true);
    expect(validateTheoryRuntimeReceiptV1({
      ...withEvidence,
      outputs: {
        ...withEvidence.outputs,
        artifactEvidence: [{ ...withEvidence.outputs.artifactEvidence[0], status: "approved" }],
      },
    }).some((issue) => issue.includes("artifactEvidence"))).toBe(true);
  });

  it("validates compound run fixtures", () => {
    const run = makeCompoundRun();

    expect(validateTheoryCompoundRunV1(run)).toEqual([]);
    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(run.summary).toMatchObject({
      rowCount: 2,
      tensorCount: 1,
      boundaryCount: 1,
      blockedCount: 1,
      computedCount: 1,
      claimBoundaryNoteCount: 2,
    });
  });

  it("rejects compound runs with missing artifactId, invalid row kind, invalid status, stale summary, or missing claim notes", () => {
    const missingArtifact = { ...makeCompoundRun(), artifactId: undefined };
    const invalidKind = {
      ...makeCompoundRun(),
      rows: [{ ...makeCompoundRun().rows[0], kind: "magic" }],
    };
    const invalidStatus = {
      ...makeCompoundRun(),
      rows: [{ ...makeCompoundRun().rows[0], status: "validated" }],
    };
    const staleSummary = {
      ...makeCompoundRun(),
      summary: { ...makeCompoundRun().summary, rowCount: 99 },
    };
    const missingClaimNotes = {
      ...makeCompoundRun(),
      rows: [{ ...makeCompoundRun().rows[0], claimBoundaryNotes: undefined }],
    };

    expect(validateTheoryCompoundRunV1(missingArtifact).some((issue) => issue.includes("artifactId"))).toBe(true);
    expect(validateTheoryCompoundRunV1(invalidKind).some((issue) => issue.includes("kind"))).toBe(true);
    expect(validateTheoryCompoundRunV1(invalidStatus).some((issue) => issue.includes("status"))).toBe(true);
    expect(validateTheoryCompoundRunV1(staleSummary).some((issue) => issue.includes("summary.rowCount"))).toBe(true);
    expect(validateTheoryCompoundRunV1(missingClaimNotes).some((issue) => issue.includes("claimBoundaryNotes"))).toBe(true);
  });
});
