import { describe, expect, it } from "vitest";
import { DOC_CALCULATOR_LAUNCH_SCHEMA, validateDocCalculatorLaunchV1 } from "../doc-calculator-launch.v1";
import { buildTheoryRuntimeJobSnapshotV1, validateTheoryRuntimeJobSnapshotV1 } from "../theory-runtime-job.v1";
import { buildTheoryRuntimeContextObservationV1, isTheoryRuntimeContextObservationV1 } from "../theory-runtime-context.v1";
import { buildTheoryRuntimeRunRequestV1 } from "../theory-runtime-run-request.v1";
import { buildTheoryRuntimeReceiptV1 } from "../theory-runtime-receipt.v1";

const now = "2026-07-14T12:00:00.000Z";
const request = buildTheoryRuntimeRunRequestV1({
  requestId: "request:one", runtimeId: "solar.manifest", graphId: "graph", badgeIds: ["badge"], args: {},
  requestedScope: "quick", status: "running", createdAt: now, updatedAt: now,
  heartbeat: { updatedAt: now, stage: "running", message: "running", progress: null },
  outputArtifactGlobs: [], claimBoundary: { currentTier: "diagnostic", maximumTier: "diagnostic", promotionAllowed: false, promotionRequires: [] },
  generatedAt: now,
});
const receipt = buildTheoryRuntimeReceiptV1({
  receiptId: "receipt:one", runtimeId: "solar.manifest", graphId: "graph", badgeIds: ["badge"], command: "npm run solar:manifest", args: {}, status: "completed",
  outputs: { artifacts: ["artifact.json"], scalars: { count: 2 }, units: { count: null }, gates: { runtime_execution: "pass" }, missingSignals: [], warnings: [] },
  provenance: { gitSha: null, startedAt: now, completedAt: now, durationMs: 5 },
  claimBoundary: { currentTier: "diagnostic", maximumTier: "diagnostic", promotionAllowed: false, promotionBlockedBy: ["human_review"] },
  generatedAt: now,
});

describe("Docs calculator runtime workflow contracts", () => {
  it("accepts scalar and registered runtime launch envelopes", () => {
    expect(validateDocCalculatorLaunchV1({ schema: DOC_CALCULATOR_LAUNCH_SCHEMA, kind: "scalar", source: { docPath: "docs/a.md", anchor: null, label: null }, latex: "x=1", claimBoundaryNotes: [] })).toEqual([]);
    expect(validateDocCalculatorLaunchV1({ schema: DOC_CALCULATOR_LAUNCH_SCHEMA, kind: "runtime", source: { docPath: "docs/a.md", anchor: null, label: "Solar" }, runtime: { runtimeId: "solar.manifest", label: "Solar", description: "Read manifest", command: "npm run solar:manifest", args: {}, requestedScope: "quick", graphId: "graph", badgeIds: [], outputArtifactGlobs: [], claimBoundary: { currentTier: "diagnostic", maximumTier: "diagnostic", promotionAllowed: false, promotionRequires: [] } } })).toEqual([]);
  });

  it("reuses a valid request inside the durable job snapshot", () => {
    expect(validateTheoryRuntimeJobSnapshotV1(buildTheoryRuntimeJobSnapshotV1({ jobId: request.requestId, request, result: { available: false, receiptId: null, errorCode: null, errorMessage: null } }))).toEqual([]);
  });

  it("bounds context and makes receipt evidence non-terminal", () => {
    const context = buildTheoryRuntimeContextObservationV1({
      requestId: request.requestId,
      receipt: {
        ...receipt,
        command: "x".repeat(2_000),
        outputs: {
          ...receipt.outputs,
          scalars: { narrative: "y".repeat(2_000) },
          warnings: ["z".repeat(2_000)],
        },
      },
    });
    expect(isTheoryRuntimeContextObservationV1(context)).toBe(true);
    expect(context).toMatchObject({ requestId: "request:one", receiptId: "receipt:one", outputRole: "evidence_for_synthesis", terminalEligible: false, postToolModelStepRequired: true, assistantAnswer: false, rawContentIncluded: false });
    expect(context.command).toHaveLength(1_000);
    expect(context.outputs.scalars.narrative).toHaveLength(1_000);
    expect(context.outputs.warnings[0]).toHaveLength(1_000);
  });
});
