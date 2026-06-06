import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isTheoryRuntimeMathTraceV1 } from "../../../../../shared/contracts/theory-runtime-math-trace.v1";
import { isTheoryRuntimeReceiptV1 } from "../../../../../shared/contracts/theory-runtime-receipt.v1";
import {
  GR_NHM2_ARTIFACT_ROOTS,
  grNhm2RuntimeAdapter,
  readGrNhm2RuntimeArtifacts,
} from "../gr-nhm2-runtime-adapter";

async function withTempRoot<T>(fn: (tempRoot: string) => Promise<T>): Promise<T> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "gr-nhm2-adapter-"));
  try {
    return await fn(tempRoot);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

async function writeArtifact(tempRoot: string, name: string, content: unknown): Promise<void> {
  const root = path.join(tempRoot, GR_NHM2_ARTIFACT_ROOTS[0]);
  await fs.mkdir(root, { recursive: true });
  const raw = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  await fs.writeFile(path.join(root, name), raw, "utf8");
}

function completeGateArtifact(overrides: Record<string, unknown> = {}) {
  return {
    gateStatus: {
      sourceClosure: "pass",
      qeiApplicability: "pass",
      observerAudit: "pass",
      hardConstraints: "pass",
      certificateIssued: "pass",
      certificateIntegrity: "pass",
    },
    g4Diagnostics: {
      curvatureRatio: 0.2,
      marginRatio: 1.4,
      qeiMargin: 0.05,
      tauSelected: 0.1,
      betaOverAlphaMax: 0.8,
      wallHorizonMargin: 0.3,
      wallT00RelLInf: 14.95,
      weylScalar: 0.03,
      ricciInvariant: 0.02,
    },
    sourceClosure: {
      sourceClosureResidualRms: 0.001,
      sourceClosureResidualMax: 0.004,
    },
    alphaSweepRows: [
      {
        properTimeS: 12,
        savedDays: 2,
      },
    ],
    ...overrides,
  };
}

describe("GR/NHM2 runtime adapter", () => {
  it("returns a not_run receipt when no artifact exists", async () => {
    await withTempRoot(async (tempRoot) => {
      const receipt = await readGrNhm2RuntimeArtifacts({
        projectRoot: tempRoot,
        graphId: "nhm2-theory-badge-graph",
      });

      expect(isTheoryRuntimeReceiptV1(receipt)).toBe(true);
      expect(receipt.status).toBe("not_run");
      expect(receipt.outputs.artifacts).toEqual([]);
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("returns a failed receipt for invalid JSON", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeArtifact(tempRoot, "bad.json", "{ not json");

      const receipt = await readGrNhm2RuntimeArtifacts({ projectRoot: tempRoot });

      expect(isTheoryRuntimeReceiptV1(receipt)).toBe(true);
      expect(receipt.status).toBe("failed");
      expect(receipt.outputs.missingSignals).toContain("artifact_parse_failed");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("blocks when certificate evidence is missing", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeArtifact(tempRoot, "missing-certificate.json", {
        gateStatus: {
          sourceClosure: "pass",
          qeiApplicability: "pass",
          observerAudit: "pass",
          hardConstraints: "pass",
        },
      });

      const receipt = await readGrNhm2RuntimeArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("blocked");
      expect(receipt.outputs.missingSignals).toEqual(
        expect.arrayContaining(["certificate_issued_missing", "certificate_integrity_missing"]),
      );
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("keeps explicit failing gates in a completed receipt without promotion", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeArtifact(
        tempRoot,
        "gate-fail.json",
        completeGateArtifact({
          gateStatus: {
            sourceClosure: "pass",
            qeiApplicability: "pass",
            observerAudit: "pass",
            hardConstraints: "fail",
            certificateIssued: "pass",
            certificateIntegrity: "pass",
          },
        }),
      );

      const receipt = await readGrNhm2RuntimeArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("completed");
      expect(receipt.outputs.gates.hard_constraints).toBe("fail");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
      expect(receipt.claimBoundary.promotionBlockedBy).toContain("hard_constraints_failed");
    });
  });

  it("blocks promotion when source closure is missing", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeArtifact(tempRoot, "missing-source-closure.json", {
        gateStatus: {
          qeiApplicability: "pass",
          observerAudit: "pass",
          hardConstraints: "pass",
          certificateIssued: "pass",
          certificateIntegrity: "pass",
        },
      });

      const receipt = await readGrNhm2RuntimeArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("blocked");
      expect(receipt.claimBoundary.promotionBlockedBy).toContain("source_closure");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("extracts scalar fields from readable artifacts", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeArtifact(tempRoot, "complete.json", completeGateArtifact());

      const receipt = await grNhm2RuntimeAdapter.readArtifacts?.({
        projectRoot: tempRoot,
        graphId: "nhm2-theory-badge-graph",
      });

      expect(receipt?.status).toBe("completed");
      expect(receipt?.outputs.scalars.curvatureRatio).toBe(0.2);
      expect(receipt?.outputs.scalars.wallT00RelLInf).toBe(14.95);
      expect(receipt?.outputs.scalars.weylScalar).toBe(0.03);
      expect(receipt?.outputs.scalars.sourceClosureResidualRms).toBe(0.001);
      expect(receipt?.outputs.scalars.properTimeS).toBe(12);
    });
  });

  it("advertises wall, tensor authority, and Natario badges", () => {
    expect(grNhm2RuntimeAdapter.supportedBadgeIds).toEqual(
      expect.arrayContaining([
        "nhm2.source.wall_t00_trace",
        "nhm2.tensor.full_authority_gate",
        "nhm2.natario.curvature_invariants",
      ]),
    );
  });

  it("keeps the static GR reference trace available", () => {
    const trace = grNhm2RuntimeAdapter.buildReferenceTrace?.({
      graphId: "nhm2-theory-badge-graph",
      badgeIds: ["physics.gr.einstein_field_equation"],
    });

    expect(trace).toBeDefined();
    expect(isTheoryRuntimeMathTraceV1(trace)).toBe(true);
    expect(JSON.stringify(trace)).toContain("Static reference trace only; no backend runtime executed.");
  });
});
