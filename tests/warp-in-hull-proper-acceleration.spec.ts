import { describe, expect, it } from "vitest";
import {
  buildWarpInHullProperAccelerationContractFromState,
  calculateEnergyPipeline,
  initializePipelineState,
} from "../server/energy-pipeline";
import {
  buildWarpInHullProperAccelerationContract,
  isCertifiedWarpInHullProperAccelerationContract,
} from "../shared/contracts/warp-in-hull-proper-acceleration.v1";
import { makeWarpInHullProperAccelerationFixture } from "./helpers/warp-worldline-fixture";

describe("warp in-hull proper-acceleration contract", () => {
  it("builds a deterministic certified direct-brick contract fixture", () => {
    const first = makeWarpInHullProperAccelerationFixture();
    const second = makeWarpInHullProperAccelerationFixture();

    expect(second).toEqual(first);
    expect(first.status).toBe("bounded_in_hull_profile_certified");
    expect(first.observerFamily).toBe("eulerian_comoving_cabin");
    expect(first.accelerationQuantityId).toBe(
      "experienced_proper_acceleration_magnitude",
    );
    expect(first.sampleCount).toBe(7);
    expect(first.samplingGeometry.ordering).toEqual([
      "cabin_center",
      "cabin_fore",
      "cabin_aft",
      "cabin_port",
      "cabin_starboard",
      "cabin_dorsal",
      "cabin_ventral",
    ]);
    expect(first.profileSummary.representativeSampleId).toBe("cabin_center");
    expect(first.profileSummary.max_mps2).toBeGreaterThanOrEqual(
      first.profileSummary.min_mps2,
    );
    expect(first.fallbackUsed).toBe(false);
    expect(isCertifiedWarpInHullProperAccelerationContract(first)).toBe(true);
  });

  it("preserves an honest certified zero-profile case when the bounded solve path is constant-lapse", () => {
    const contract = makeWarpInHullProperAccelerationFixture({ zeroProfile: true });

    expect(contract.resolutionAdequacy.status).toBe(
      "adequate_constant_lapse_zero_profile",
    );
    expect(contract.profileSummary.interpretation).toBe(
      "observer_defined_zero_profile_in_constant_lapse_regime",
    );
    expect(contract.profileSummary.max_mps2).toBe(0);
    expect(contract.profileSummary.max_g).toBe(0);
    expect(contract.fallbackUsed).toBe(false);
    expect(isCertifiedWarpInHullProperAccelerationContract(contract)).toBe(true);
  });

  it("rejects fallback-backed or forged certified contracts", () => {
    const contract = makeWarpInHullProperAccelerationFixture();

    expect(
      buildWarpInHullProperAccelerationContract({
        sourceSurface: contract.sourceSurface,
        chart: contract.chart,
        samplingGeometry: contract.samplingGeometry,
        sampleSummaries: contract.sampleSummaries,
        resolutionAdequacy: {
          ...contract.resolutionAdequacy,
          status: "adequate_constant_lapse_zero_profile",
          allSampleMagnitudesZero: false,
          expectedZeroProfileByModel: false,
        },
      }),
    ).toBeNull();
    expect(
      isCertifiedWarpInHullProperAccelerationContract({
        ...contract,
        fallbackUsed: true,
      }),
    ).toBe(false);
    expect(
      isCertifiedWarpInHullProperAccelerationContract({
        ...contract,
        sourceSurface: {
          ...contract.sourceSurface,
          provenanceClass: "proxy",
        },
      }),
    ).toBe(false);
  });

  it("emits a certified direct-brick zero-profile contract from the current NHM2 solve-backed natario state", async () => {
    const state = await calculateEnergyPipeline(initializePipelineState());
    const contract = await buildWarpInHullProperAccelerationContractFromState(state);

    expect(contract).not.toBeNull();
    expect(contract?.certified).toBe(true);
    expect(contract?.fallbackUsed).toBe(false);
    expect(contract?.observerFamily).toBe("eulerian_comoving_cabin");
    expect(contract?.resolutionAdequacy.status).toBe(
      "adequate_constant_lapse_zero_profile",
    );
    expect(contract?.profileSummary.max_mps2).toBe(0);
    expect(contract?.profileSummary.max_g).toBe(0);
    expect(
      contract?.sampleSummaries.map((entry) => entry.sampleId),
    ).toEqual([
      "cabin_center",
      "cabin_fore",
      "cabin_aft",
      "cabin_port",
      "cabin_starboard",
      "cabin_dorsal",
      "cabin_ventral",
    ]);
    expect(isCertifiedWarpInHullProperAccelerationContract(contract)).toBe(true);
  });
});
