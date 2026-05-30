import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isTheoryRuntimeMathTraceV1 } from "../../../../../shared/contracts/theory-runtime-math-trace.v1";
import { isTheoryRuntimeReceiptV1 } from "../../../../../shared/contracts/theory-runtime-receipt.v1";
import {
  readStarSimArtifacts,
  starSimRuntimeAdapter,
} from "../starsim-runtime-adapter";

async function withTempRoot<T>(fn: (tempRoot: string) => Promise<T>): Promise<T> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "starsim-adapter-"));
  try {
    return await fn(tempRoot);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

async function writeJson(tempRoot: string, relativePath: string, content: unknown): Promise<void> {
  const target = path.join(tempRoot, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(content, null, 2), "utf8");
}

function artifactFixture(overrides: Record<string, unknown> = {}) {
  return {
    M: 1.989e30,
    R: 6.957e8,
    L: 1,
    dominantFusionChannel: "pp_chain",
    fusionMargin: 0.42,
    opacityProvenance: "OPAL opacity table fixture",
    opticalDepthConvention: "Rosseland mean",
    opticalDepthStatus: "pass",
    solarReference: {
      status: "pass",
      anchor: "solar analog",
    },
    mesaRepro: {
      status: "pass",
      mesaResidualRms: 0.02,
      mesaResidualMax: 0.05,
    },
    ...overrides,
  };
}

describe("StarSim runtime adapter", () => {
  it("maps an artifact fixture to a valid reduced-order receipt", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeJson(tempRoot, "artifacts/starsim/starsim-benchmark.json", artifactFixture());

      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(isTheoryRuntimeReceiptV1(receipt)).toBe(true);
      expect(receipt.status).toBe("completed");
      expect(receipt.outputs.gates.reduced_order_prior).toBe("pass");
      expect(receipt.outputs.gates.opacity_provenance_present).toBe("pass");
      expect(receipt.outputs.gates.solar_reference_present).toBe("pass");
      expect(receipt.outputs.gates.mesa_repro_available).toBe("pass");
      expect(receipt.outputs.gates.fusion_stage_gate).toBe("pass");
      expect(receipt.outputs.gates.claim_boundary_stage1).toBe("pass");
      expect(receipt.outputs.scalars.dominantFusionChannel).toBe("pp_chain");
      expect(receipt.claimBoundary.maximumTier).toBe("reduced_order");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("adds a blocked gate when opacity provenance is missing", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeJson(tempRoot, "artifacts/starsim/no-opacity.json", {
        ...artifactFixture(),
        opacityProvenance: undefined,
      });

      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("blocked");
      expect(receipt.outputs.gates.opacity_provenance_present).toBe("not_ready");
      expect(receipt.outputs.missingSignals).toContain("opacity_provenance_missing");
      expect(receipt.outputs.warnings).toContain("Opacity provenance is missing.");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("generates scalar cuts for observable proxies", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeJson(tempRoot, "artifacts/starsim/scalars.json", artifactFixture());

      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(typeof receipt.outputs.scalars.T_eff).toBe("number");
      expect(typeof receipt.outputs.scalars.g_surface).toBe("number");
      expect(typeof receipt.outputs.scalars.rho_mean).toBe("number");
      expect(typeof receipt.outputs.scalars.compactness).toBe("number");
      expect(receipt.outputs.scalars.fusionMargin).toBe(0.42);
      expect(receipt.args.scalarCuts).toEqual(
        expect.arrayContaining([
          "T_eff = T_sun*(L/R^2)^(1/4)",
          "g_surface = G*M/R^2",
          "rho_mean = 3*M/(4*pi*R^3)",
          "compactness = G*M/(R*c^2)",
          "fusion margin if present",
        ]),
      );
    });
  });

  it("keeps the reduced-order claim boundary visible", async () => {
    await withTempRoot(async (tempRoot) => {
      await writeJson(tempRoot, "artifacts/starsim/boundary.json", artifactFixture());

      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(receipt.outputs.warnings).toContain(
        "StarSim Stage 1 is a reduced-order astrophysical prior, not a full stellar-evolution solve.",
      );
      expect(receipt.claimBoundary.promotionBlockedBy).toContain("stage1_reduced_order_prior_only");
      expect(JSON.stringify(receipt)).not.toMatch(/full stellar-evolution claim|direct ER=EPR evidence|CL4 support/i);
    });
  });

  it("returns not_run when no StarSim artifacts exist", async () => {
    await withTempRoot(async (tempRoot) => {
      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("not_run");
      expect(receipt.outputs.missingSignals).toContain("reduced_order_prior_missing");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("returns failed for invalid JSON artifacts", async () => {
    await withTempRoot(async (tempRoot) => {
      const target = path.join(tempRoot, "artifacts/starsim/bad.json");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, "{ bad", "utf8");

      const receipt = await readStarSimArtifacts({ projectRoot: tempRoot });

      expect(receipt.status).toBe("failed");
      expect(receipt.outputs.missingSignals).toContain("artifact_parse_failed");
      expect(receipt.claimBoundary.promotionAllowed).toBe(false);
    });
  });

  it("exposes static reference trace support", () => {
    expect(starSimRuntimeAdapter.runtimeId).toBe("starsim.artifact_reader");
    expect(starSimRuntimeAdapter.laneId).toBe("stellar_evolution");
    expect(starSimRuntimeAdapter.capabilities).toEqual(["static_reference", "artifact_reader"]);

    const trace = starSimRuntimeAdapter.buildReferenceTrace?.({
      graphId: "nhm2-theory-badge-graph",
      badgeIds: ["starsim.observable.surface_temperature_proxy"],
    });

    expect(isTheoryRuntimeMathTraceV1(trace)).toBe(true);
    expect(JSON.stringify(trace)).toContain("Static reference trace only; no backend runtime executed.");
  });
});
