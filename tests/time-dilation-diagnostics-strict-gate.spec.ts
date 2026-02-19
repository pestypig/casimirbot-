import { describe, expect, it, vi } from "vitest";
import { buildTimeDilationDiagnostics } from "../shared/time-dilation-diagnostics";

const basePipeline = {
  strictCongruence: true,
  hull: { Lx_m: 20, Ly_m: 10, Lz_m: 10 },
  warp: { metricT00Contract: { family: "natario" } },
};

const baseProofs = { values: {} };
const baseMath = { root: { id: "server/energy-pipeline.ts", stage: "certified", children: [{ id: "server/gr-evolve-brick.ts", stage: "certified", children: [] }] } };
const baseGrBrick = { meta: { status: "CERTIFIED" }, stats: { solverHealth: { status: "CERTIFIED" } }, dims: [1, 1, 1] };
const baseRegion = { summary: { wall: { detected: true, source: "kretschmann" } } };

function stubFetch(pipeline: any) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/helix/pipeline/proofs")) return { ok: true, json: async () => baseProofs } as Response;
    if (url.includes("/api/helix/math/graph")) return { ok: true, json: async () => baseMath } as Response;
    if (url.includes("/api/helix/gr-evolve-brick")) return { ok: true, json: async () => baseGrBrick } as Response;
    if (url.includes("/api/helix/lapse-brick")) return { ok: true, json: async () => ({}) } as Response;
    if (url.includes("/api/helix/gr-region-stats")) return { ok: true, json: async () => baseRegion } as Response;
    if (url.includes("/api/helix/pipeline")) return { ok: true, json: async () => pipeline } as Response;
    throw new Error(`unexpected url ${url}`);
  }) as unknown as typeof fetch);
}

describe("time dilation strict verification gate", () => {
  it("fails closed with deterministic id when certificate is missing", async () => {
    stubFetch({ ...basePipeline, viability: { integrityOk: true, constraints: [] } });
    const diagnostics = await buildTimeDilationDiagnostics({ baseUrl: "http://example.test", publish: false });
    expect(diagnostics.strict.grCertified).toBe(false);
    expect(diagnostics.strict.failId).toBe("ADAPTER_CERTIFICATE_MISSING");
    expect(diagnostics.strict.certifiedLabelsAllowed).toBe(false);
    expect(diagnostics.strict.strongClaimsAllowed).toBe(false);
  });

  it("fails closed with deterministic id when certificate integrity is false", async () => {
    stubFetch({
      ...basePipeline,
      viability: { certificateHash: "cert:1", integrityOk: false, constraints: [{ id: "FordRomanQI", severity: "HARD", passed: true }] },
    });
    const diagnostics = await buildTimeDilationDiagnostics({ baseUrl: "http://example.test", publish: false });
    expect(diagnostics.strict.grCertified).toBe(false);
    expect(diagnostics.strict.failId).toBe("ADAPTER_CERTIFICATE_INTEGRITY");
    expect(diagnostics.gate.reasons).toContain("verification:certificate_integrity_failed");
  });

  it("fails closed with deterministic id when hard constraints are unknown", async () => {
    stubFetch({
      ...basePipeline,
      viability: { certificateHash: "cert:1", integrityOk: true, constraints: [{ id: "FordRomanQI", severity: "HARD", status: "unknown" }] },
    });
    const diagnostics = await buildTimeDilationDiagnostics({ baseUrl: "http://example.test", publish: false });
    expect(diagnostics.strict.grCertified).toBe(false);
    expect(diagnostics.strict.failId).toBe("ADAPTER_CONSTRAINTS_UNKNOWN");
    expect(diagnostics.strict.failClosedReasons).toContain("hard_constraints_unknown");
  });

  it("reports ship-comoving dtau/dt observable with valid=false and missingFields when worldline inputs are absent", async () => {
    stubFetch({
      ...basePipeline,
      viability: {
        certificateHash: "cert:1",
        integrityOk: true,
        constraints: [{ id: "FordRomanQI", severity: "HARD", passed: true }],
      },
      warp: {
        metricT00Contract: { family: "natario" },
        metricAdapter: {
          alpha: 1,
          gammaDiag: [1, 1, 1],
        },
      },
    });
    const diagnostics = await buildTimeDilationDiagnostics({ baseUrl: "http://example.test", publish: false });
    expect(diagnostics.observables.ship_comoving_dtau_dt).toEqual(
      expect.objectContaining({
        observerFamily: "ship_comoving",
        valid: false,
      }),
    );
    expect(diagnostics.observables.ship_comoving_dtau_dt?.missingFields).toEqual(
      expect.arrayContaining(["shipKinematics.betaCoord", "shipKinematics.dxdt"]),
    );
  });

  it("computes ship-comoving dtau/dt from ADM variables when worldline inputs are present", async () => {
    stubFetch({
      ...basePipeline,
      viability: {
        certificateHash: "cert:1",
        integrityOk: true,
        constraints: [{ id: "FordRomanQI", severity: "HARD", passed: true }],
      },
      shipKinematics: {
        dxdt: [0.1, 0, 0],
        betaCoord: [0.2, 0, 0],
      },
      warp: {
        metricT00Contract: { family: "natario" },
        metricAdapter: {
          alpha: 1,
          gammaDiag: [1, 1, 1],
        },
      },
    });
    const diagnostics = await buildTimeDilationDiagnostics({ baseUrl: "http://example.test", publish: false });
    const dtauDt = diagnostics.observables.ship_comoving_dtau_dt;
    expect(dtauDt?.valid).toBe(true);
    expect(dtauDt?.missingFields).toEqual([]);
    expect(dtauDt?.value ?? 0).toBeCloseTo(Math.sqrt(1 - 0.3 * 0.3), 6);
  });
});
