import { describe, expect, it } from "vitest";

import {
  buildCasimirMaterialReceipt,
  buildIdealCasimirMaterialReceipt,
} from "../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2NatarioInvariantAudit,
  isNhm2NatarioInvariantAudit,
} from "../shared/contracts/nhm2-natario-invariant-audit.v1";
import {
  buildNhm2ObserverRobustEnergyConditionArtifact,
  isNhm2ObserverRobustEnergyConditionArtifact,
} from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import {
  buildNhm2QeiWorldlineDossier,
  isNhm2QeiWorldlineDossier,
} from "../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  buildNhm2SameChartFullTensorArtifact,
  isNhm2SameChartFullTensorArtifact,
} from "../shared/contracts/nhm2-same-chart-full-tensor.v1";
import {
  buildNhm2WallSourceClosureArtifact,
  isNhm2WallSourceClosureArtifact,
} from "../shared/contracts/nhm2-wall-source-closure.v1";

describe("NHM2 closure contract builders", () => {
  it("marks the full tensor incomplete when T0i momentum-density components are missing", () => {
    const artifact = buildNhm2SameChartFullTensorArtifact({
      generatedAt: "2026-06-10T00:00:00.000Z",
      chartId: "adm_eulerian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      source: "einstein_tensor_geometry_fd4_v1",
      tensor: {
        T00: 1,
        Txx: 2,
        Txy: 0.1,
        Txz: 0.2,
        Tyy: 3,
        Tyz: 0.3,
        Tzz: 4,
      },
    });

    expect(isNhm2SameChartFullTensorArtifact(artifact)).toBe(true);
    expect(artifact.completeness.hasT00).toBe(true);
    expect(artifact.completeness.hasT0i).toBe(false);
    expect(artifact.completeness.hasDiagonalTij).toBe(true);
    expect(artifact.completeness.hasOffDiagonalTij).toBe(true);
    expect(artifact.completeness.fullTensorComplete).toBe(false);
    expect(artifact.completeness.missingComponentIds).toEqual(
      expect.arrayContaining(["T0x", "T0y", "T0z"]),
    );
  });

  it("marks the full tensor incomplete when off-diagonal Tij spatial stresses are missing", () => {
    const artifact = buildNhm2SameChartFullTensorArtifact({
      generatedAt: "2026-06-10T00:00:00.000Z",
      chartId: "adm_eulerian",
      routeId: "einstein_tensor_geometry_fd4_v1",
      source: "einstein_tensor_geometry_fd4_v1",
      tensor: {
        T00: 1,
        T0x: 0.1,
        T0y: 0.2,
        T0z: 0.3,
        Txx: 2,
        Tyy: 3,
        Tzz: 4,
      },
    });

    expect(isNhm2SameChartFullTensorArtifact(artifact)).toBe(true);
    expect(artifact.completeness.hasT0i).toBe(true);
    expect(artifact.completeness.hasDiagonalTij).toBe(true);
    expect(artifact.completeness.hasOffDiagonalTij).toBe(false);
    expect(artifact.completeness.fullTensorComplete).toBe(false);
    expect(artifact.completeness.missingComponentIds).toEqual(
      expect.arrayContaining(["Txy", "Txz", "Tyz"]),
    );
  });

  it("emits wall T00 closure failure as a local blocker with wall-first claim boundary", () => {
    const artifact = buildNhm2WallSourceClosureArtifact({
      generatedAt: "2026-06-10T00:00:00.000Z",
      chartId: "adm_eulerian",
      required: {
        tensorRef: "artifact://metric-required/wall/T00",
        T00_SI: -100,
        componentStatus: "computed",
      },
      available: {
        sourceKind: "tile_effective",
        tensorRef: "artifact://tile-effective/wall/T00",
        T00_SI: -20,
        componentStatus: "computed",
      },
      tolerance: 0.1,
    });

    expect(isNhm2WallSourceClosureArtifact(artifact)).toBe(true);
    expect(artifact.residual.pass).toBe(false);
    expect(artifact.blockers).toContain("wall_T00_source_residual_exceeds_tolerance");
    expect(artifact.claimBoundary.globalResidualCannotOverrideWallFailure).toBe(true);
  });

  it("labels Eulerian-only energy-condition evidence as incomplete, not observer robust", () => {
    const artifact = buildNhm2ObserverRobustEnergyConditionArtifact({
      generatedAt: "2026-06-10T00:00:00.000Z",
      tensorRef: "artifact://same-chart-full-tensor",
      observerFamilies: [
        {
          familyId: "eulerian",
          status: "pass",
          sampleCount: 1,
          worstCase: {
            condition: "WEC",
            value: 0,
            locationRef: "wall",
          },
        },
      ],
    });

    expect(isNhm2ObserverRobustEnergyConditionArtifact(artifact)).toBe(true);
    expect(artifact.summary.eulerianOnly).toBe(true);
    expect(artifact.summary.robustCheckComplete).toBe(false);
    expect(artifact.summary.missedViolationRisk).toBe("high");
    expect(artifact.observerFamilies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          familyId: "boosted_timelike_grid",
          status: "not_run",
        }),
        expect.objectContaining({
          familyId: "continuous_optimizer",
          status: "not_run",
          optimizerUsed: false,
        }),
      ]),
    );
  });

  it("keeps scalar QEI margin from substituting for a worldline dossier", () => {
    const scalarQeiMargin = 1;
    const dossier = buildNhm2QeiWorldlineDossier({
      generatedAt: "2026-06-10T00:00:00.000Z",
      worldlines: [],
    });

    expect(Number.isFinite(scalarQeiMargin)).toBe(true);
    expect(isNhm2QeiWorldlineDossier(dossier)).toBe(true);
    expect(dossier.summary.hasWallWorldline).toBe(false);
    expect(dossier.summary.allMarginsPass).toBeNull();
    expect(dossier.summary.dossierComplete).toBe(false);
    expect(dossier.claimBoundary.scalarMarginCannotSubstituteForDossier).toBe(true);
  });

  it("keeps perfect-conductor Casimir rows ideal_scalar_only without material receipts", () => {
    const idealReceipt = buildIdealCasimirMaterialReceipt({
      generatedAt: "2026-06-10T00:00:00.000Z",
      tileBatchId: "tile_batch:perfect-conductor",
      gapMeters: 1e-9,
      temperatureK: 20,
    });
    const requestedMaterialReceipt = buildCasimirMaterialReceipt({
      generatedAt: "2026-06-10T00:00:00.000Z",
      tileBatchId: "tile_batch:requested-material-without-evidence",
      geometry: {
        gapMeters: 1e-9,
        gapMetrologyStatus: "design",
        beyondPfaValidity: "not_evaluated",
      },
      material: {
        modelKind: "perfect_conductor_ideal",
        finiteConductivityIncluded: false,
        finiteTemperatureIncluded: false,
        roughnessCorrectionIncluded: false,
      },
      status: "material_receipted",
    });

    expect(idealReceipt.status).toBe("ideal_scalar_only");
    expect(requestedMaterialReceipt.status).not.toBe("material_receipted");
    expect(requestedMaterialReceipt.status).toBe("ideal_scalar_only");
    expect(idealReceipt.claimBoundary.idealCasimirDoesNotValidateTileSource).toBe(true);
  });

  it("keeps theta flatness pass from implying Natario invariant audit pass", () => {
    const audit = buildNhm2NatarioInvariantAudit({
      generatedAt: "2026-06-10T00:00:00.000Z",
      metricFamily: "natario_zero_expansion",
      expansion: {
        thetaMaxAbs: 0,
        expansionLeakageBound: 1e-9,
      },
      invariants: {
        status: "missing",
      },
      momentumDensity: {
        status: "missing",
      },
      stability: {
        convergenceStatus: "not_run",
      },
    });

    expect(isNhm2NatarioInvariantAudit(audit)).toBe(true);
    expect(audit.expansion.thetaFlatnessStatus).toBe("pass");
    expect(audit.invariants.status).toBe("missing");
    expect(audit.blockers).toEqual(
      expect.arrayContaining([
        "curvature_invariants_missing",
        "momentum_density_missing",
        "tidal_behavior_missing",
        "blueshift_diagnostic_missing",
        "convergence_not_run",
      ]),
    );
    expect(audit.claimBoundary.zeroExpansionIsNotSafetyCertificate).toBe(true);
  });
});
