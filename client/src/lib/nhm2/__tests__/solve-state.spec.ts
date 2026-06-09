import { describe, expect, it } from "vitest";
import { buildNhm2SolveState } from "@/lib/nhm2/solve-state";
import type { GrConstraintContract, GrEvaluation, ProofPack } from "@shared/schema";

describe("buildNhm2SolveState", () => {
  it("reports an authority-wired state when live inputs line up with NHM2 authority", () => {
    const proofPack = {
      values: {
        hull_Lx_m: { value: 1007, proxy: false },
        hull_Ly_m: { value: 264, proxy: false },
        hull_Lz_m: { value: 173, proxy: false },
        metric_adapter_family: { value: "natario_like_low_expansion", proxy: false },
        metric_chart_contract_status: { value: "ok", proxy: false },
      },
    } as unknown as ProofPack;

    const grConstraintContract = {
      sources: { grDiagnostics: "gr-evolve-brick", certificate: "physics.warp.viability" },
      diagnostics: { brickMeta: { status: "CERTIFIED", reasons: [] } },
      certificate: {
        status: "ADMISSIBLE",
        admissibleStatus: "ADMISSIBLE",
        hasCertificate: true,
        certificateHash: "cert-hash",
        certificateId: "cert-id",
      },
      guardrails: {
        fordRoman: "ok",
        thetaAudit: "ok",
        tsRatio: "ok",
        vdbBand: "ok",
      },
      constraints: [],
      proxy: false,
    } as unknown as GrConstraintContract;

    const grEvaluation = {
      pass: true,
      constraints: [],
      certificate: {
        status: "ADMISSIBLE",
        admissibleStatus: "ADMISSIBLE",
        hasCertificate: true,
        certificateHash: "cert-hash",
        certificateId: "cert-id",
        integrityOk: true,
      },
    } as unknown as GrEvaluation;

    const state = buildNhm2SolveState({
      pipeline: {
        claim_tier: "diagnostic",
        provenance_class: "simulation",
        currentMode: "hover",
        warpFieldType: "natario_sdf",
        gammaGeo: 1,
        gammaVanDenBroeck: 500,
        qCavity: 100000,
        qSpoilingFactor: 3,
        dutyCycle: 0.12,
        sectorCount: 80,
        concurrentSectors: 2,
        zeta: 0.84,
        hull: { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
        nhm2SameChartFullTensor: {
          completeness: { fullTensorComplete: true, missingComponentIds: [] },
        },
        nhm2WallSourceClosure: {
          residual: { pass: true, relative: 0 },
          blockers: [],
        },
        nhm2ObserverRobustEnergyConditions: {
          metricRequired: {
            summary: {
              robustCheckComplete: true,
              eulerianOnly: false,
              anyViolation: false,
            },
          },
          tileEffective: {
            summary: {
              robustCheckComplete: true,
              eulerianOnly: false,
              anyViolation: false,
            },
          },
        },
        nhm2QeiWorldlineDossier: {
          summary: {
            dossierComplete: true,
            hasWallWorldline: true,
            anyProxy: false,
          },
        },
        casimirMaterialReceipt: { status: "material_receipted" },
        nhm2NatarioInvariantAudit: {
          expansion: { thetaFlatnessStatus: "pass" },
          invariants: { status: "computed" },
          stability: { convergenceStatus: "pass" },
          blockers: [],
        },
      } as any,
      proofPack,
      grConstraintContract,
      grEvaluation,
      stageGate: { ok: true, stage: "reduced-order", pending: false } as any,
    });

    expect(state.overall.tone).toBe("good");
    expect(state.overall.reasons).toEqual([]);
    expect(state.geometry.matchesAuthority).toBe(true);
    expect(state.proof.metricAdapterFamily).toBe("natario_like_low_expansion");
    expect(state.contract.integrityOk).toBe(true);
    expect(state.closureStack.sameChartFullTensor.fullTensorComplete).toBe(true);
  });

  it("surfaces blocking proxy and geometry drift reasons", () => {
    const proofPack = {
      values: {
        metric_adapter_family: { value: "natario_like_low_expansion", proxy: true },
      },
    } as unknown as ProofPack;

    const state = buildNhm2SolveState({
      pipeline: {
        hull: { Lx_m: 503.5, Ly_m: 132, Lz_m: 86.5 },
        geometryFallback: { mode: "warn", applied: true, blocked: false, reasons: ["legacy fallback"] },
      } as any,
      proofPack,
      stageGate: { ok: true, stage: "reduced-order", pending: false } as any,
    });

    expect(state.overall.tone).toBe("bad");
    expect(state.overall.reasons).toContain("strict proof-pack proxy present");
    expect(state.overall.reasons.some((reason) => reason.includes("live hull drift"))).toBe(true);
    expect(state.pipeline.geometryFallback.applied).toBe(true);
    expect(state.geometry.matchesAuthority).toBe(false);
  });

  it("keeps closure-stack gaps guarded instead of promotional success", () => {
    const state = buildNhm2SolveState({
      pipeline: {
        hull: { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
        nhm2SameChartFullTensor: {
          completeness: { fullTensorComplete: false, missingComponentIds: ["T0x", "Txy"] },
        },
        nhm2WallSourceClosure: {
          residual: { pass: false, relative: 0.2 },
          blockers: ["wall_t00_residual_exceeded"],
        },
        nhm2ObserverRobustEnergyConditions: {
          metricRequired: {
            summary: {
              robustCheckComplete: false,
              eulerianOnly: true,
              anyViolation: false,
            },
          },
        },
        nhm2QeiWorldlineDossier: {
          summary: {
            dossierComplete: false,
            hasWallWorldline: false,
            anyProxy: true,
          },
        },
        casimirMaterialReceipt: { status: "ideal_scalar_only" },
        nhm2NatarioInvariantAudit: {
          expansion: { thetaFlatnessStatus: "pass" },
          invariants: { status: "missing" },
          stability: { convergenceStatus: "not_run" },
          blockers: ["curvature_invariants_missing"],
        },
      } as any,
      stageGate: { ok: true, stage: "reduced-order", pending: false } as any,
    });

    expect(state.overall.label).toBe("Blocked / proxy");
    expect(state.overall.reasons).toContain("same-chart full tensor incomplete");
    expect(state.overall.reasons).toContain("wall source closure missing/failing");
    expect(state.overall.reasons).toContain("observer-robust energy-condition check incomplete");
    expect(state.overall.reasons).toContain("QEI worldline dossier incomplete");
    expect(state.overall.reasons).toContain("Casimir material receipt missing");
    expect(state.overall.reasons).toContain("Natário invariant audit incomplete");
    expect(state.closureStack.sameChartFullTensor.missingComponentIds).toEqual(["T0x", "Txy"]);
    expect(state.closureStack.wallSourceClosure.pass).toBe(false);
    expect(state.closureStack.casimirMaterialReceipt.idealScalarOnly).toBe(true);
  });
});
