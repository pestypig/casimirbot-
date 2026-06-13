import { describe, expect, it } from "vitest";
import {
  buildNhm2QeiWorldlineDossier,
  buildNhm2QeiWorldlineDossierFromGuardrail,
  isNhm2QeiWorldlineDossier,
} from "../shared/contracts/nhm2-qei-worldline-dossier.v1";

describe("nhm2 qei worldline dossier contract", () => {
  it("emits an incomplete artifact instead of omitting missing worldlines", () => {
    const dossier = buildNhm2QeiWorldlineDossier({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "runtime",
      worldlines: [],
    });

    expect(dossier.contractVersion).toBe("nhm2_qei_worldline_dossier/v1");
    expect(dossier.worldlines).toEqual([]);
    expect(dossier.summary).toMatchObject({
      hasWallWorldline: false,
      allMarginsPass: null,
      anyProxy: false,
      dossierComplete: false,
    });
    expect(isNhm2QeiWorldlineDossier(dossier)).toBe(true);
  });

  it("requires a wall worldline for dossier completeness", () => {
    const dossier = buildNhm2QeiWorldlineDossier({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "runtime",
      worldlines: [
        {
          worldlineId: "qei:hull:guardrail",
          regionId: "hull",
          chartId: "adm_eulerian",
          samplingFunction: {
            kind: "gaussian",
            tauSeconds: 1e-9,
            normalized: true,
          },
          sampledRho: {
            valueSI: -1,
            provenanceRef: "warp.metric.T00.natario.shift",
            status: "computed",
          },
          bound: {
            valueSI: 0,
            provenanceRef: "ford_roman_1996_quantum_inequality",
            status: "literature_bound",
          },
          consistency: {
            tauVsDuty: "pass",
            tauVsLightCrossing: "pass",
            tauVsModulation: "pass",
          },
        },
      ],
    });

    expect(dossier.summary.hasWallWorldline).toBe(false);
    expect(dossier.summary.allMarginsPass).toBe(true);
    expect(dossier.summary.dossierComplete).toBe(false);
    expect(dossier.worldlines[0]?.margin.valueSI).toBe(1);
    expect(isNhm2QeiWorldlineDossier(dossier)).toBe(true);
  });

  it("adapts QI guardrail telemetry into a complete wall dossier when provenance is metric-derived", () => {
    const dossier = buildNhm2QeiWorldlineDossierFromGuardrail({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p9625_v1",
      chartId: "adm_eulerian",
      qiGuardrail: {
        lhs_Jm3: -2,
        bound_Jm3: -1,
        metricDerived: true,
        metricDerivedSource: "warp.metric.T00.natario.shift",
        metricDerivedChart: "adm_eulerian",
        sampler: "gaussian",
        tauSelected_s: 1e-9,
        tauLC_s: 2e-9,
        tauPulse_s: 3e-9,
        duty: 0.2,
        qeiSamplingNormalization: "unit_integral",
        congruentSolvePolicyMarginPass: true,
      },
    });

    expect(dossier.summary).toMatchObject({
      hasWallWorldline: true,
      allMarginsPass: true,
      anyProxy: false,
      dossierComplete: true,
    });
    expect(dossier.worldlines[0]).toMatchObject({
      worldlineId: "qei:wall:guardrail",
      regionId: "wall",
      sampledRho: { valueSI: -2, status: "computed" },
      bound: { valueSI: -1, status: "literature_bound" },
      margin: { valueSI: 1, pass: true },
    });
    expect(isNhm2QeiWorldlineDossier(dossier)).toBe(true);
  });

  it("does not mark a dossier complete when worldline blockers remain", () => {
    const dossier = buildNhm2QeiWorldlineDossier({
      generatedAt: "2026-06-09T00:00:00.000Z",
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "runtime",
      worldlines: [
        {
          worldlineId: "qei:wall:blocked",
          regionId: "wall",
          chartId: "adm_eulerian",
          samplingFunction: {
            kind: "gaussian",
            tauSeconds: 1e-9,
            normalized: true,
          },
          sampledRho: {
            valueSI: -2,
            provenanceRef: "source:wall",
            status: "computed",
          },
          bound: {
            valueSI: -1,
            provenanceRef: "ford_roman_1996_quantum_inequality",
            status: "literature_bound",
          },
          margin: { valueSI: 1, pass: true },
          consistency: {
            tauVsDuty: "pass",
            tauVsLightCrossing: "pass",
            tauVsModulation: "pass",
          },
          blockers: ["qei_bound_receipt_review"],
        },
      ],
    });

    expect(dossier.summary.allMarginsPass).toBe(true);
    expect(dossier.summary.dossierComplete).toBe(false);
    expect(isNhm2QeiWorldlineDossier(dossier)).toBe(true);
  });
});
