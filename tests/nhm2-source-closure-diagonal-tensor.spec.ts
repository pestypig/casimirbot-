import { describe, expect, it } from "vitest";
import {
  buildNhm2SourceClosureDiagonalTensorSnapshotArtifact,
  isNhm2SourceClosureDiagonalTensorSnapshotArtifact,
} from "../shared/contracts/nhm2-source-closure-diagonal-tensor.v1";

describe("nhm2 source-closure diagonal tensor snapshot artifact", () => {
  it("builds a typed snapshot with repo-style provenance paths", () => {
    const artifact = buildNhm2SourceClosureDiagonalTensorSnapshotArtifact({
      tensorRole: "metric_required",
      familyId: "nhm2_shift_lapse",
      shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      shiftLapseProfileStage: "controlled_tuning_stage_1",
      tensorSemanticRef: "warp.metric.T00.nhm2.shift_lapse",
      sourceArtifactPath:
        "artifacts\\research\\full-solve\\selected-family\\nhm2-shift-lapse\\nhm2-shift-lapse-transport-result-latest.json",
      diagonalTensor: {
        T00: -2,
        T11: 2,
        T22: 2,
        T33: 2,
      },
      note: "selected-profile metric tensor snapshot",
    });

    expect(isNhm2SourceClosureDiagonalTensorSnapshotArtifact(artifact)).toBe(true);
    expect(artifact.sourceArtifactPath).toBe(
      "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json",
    );
    expect(artifact.tensorRole).toBe("metric_required");
    expect(artifact.diagonalTensor.T22).toBe(2);
  });

  it("rejects malformed snapshot payloads", () => {
    expect(
      isNhm2SourceClosureDiagonalTensorSnapshotArtifact({
        artifactId: "nhm2_source_closure_diagonal_tensor",
        schemaVersion: "nhm2_source_closure_diagonal_tensor/v1",
        tensorRole: "bad_role",
        familyId: "nhm2_shift_lapse",
        producer: "test",
        diagonalTensor: { T00: 1, T11: 1, T22: 1, T33: 1 },
      }),
    ).toBe(false);
  });
});
