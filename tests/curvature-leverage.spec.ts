import { describe, expect, it } from "vitest";

import {
  buildCurvatureLeverageObservable,
  buildNhm2FullSolveCurvatureLeverage,
  responseWeightedCurvatureLeverage,
  scaleNormalizedCurvatureLeverage,
} from "../shared/curvature-leverage";

describe("curvature leverage diagnostics", () => {
  it("computes the scale-normalized curvature leverage as |kappa| L^2", () => {
    expect(scaleNormalizedCurvatureLeverage(-2e-12, 1_000)).toBeCloseTo(2e-6, 18);
    expect(scaleNormalizedCurvatureLeverage(2e-12, 1_000)).toBeCloseTo(2e-6, 18);
  });

  it("keeps raw leverage separate from response and closure weighting", () => {
    const raw = scaleNormalizedCurvatureLeverage(4e-9, 20);
    expect(raw).toBeCloseTo(1.6e-6, 18);
    expect(
      responseWeightedCurvatureLeverage({
        leverage: raw,
        responseGain: 2,
        closureQuality: 0.25,
      }),
    ).toBeCloseTo(8e-7, 18);
  });

  it("builds external observable records without enabling promotion", () => {
    const observable = buildCurvatureLeverageObservable({
      id: "self_gravity_shape:potato_radius",
      lane: "self_gravity_shape",
      sourceKind: "mass_density",
      kappa_m2: 1e-16,
      leverLength_m: 250_000,
      responseGain: 1,
      closureQuality: 0.8,
      responseLawId: "self_gravity_strength_balance",
      closureMetricId: "shape_transition_residual",
      claimTier: "diagnostic",
    });

    expect(observable.leverage).toBeCloseTo(6.25e-6, 18);
    expect(observable.responseWeightedLeverage).toBeCloseTo(5e-6, 18);
    expect(observable.promotionAllowed).toBe(false);
  });

  it("defaults response gain and closure quality to unity", () => {
    const observable = buildCurvatureLeverageObservable({
      id: "stellar_hydrostatic:pressure_scale_height",
      lane: "stellar_hydrostatic",
      sourceKind: "pressure_gradient",
      kappa_m2: 5e-20,
      leverLength_m: 1_000_000,
      responseLawId: "hydrostatic_balance",
      closureMetricId: "profile_residual",
      claimTier: "reduced_order",
    });

    expect(observable.responseGain).toBe(1);
    expect(observable.closureQuality).toBe(1);
    expect(observable.responseWeightedLeverage).toBe(observable.leverage);
    expect(observable.promotionAllowed).toBe(false);
  });

  it("builds NHM2 full-solve regional leverage from tensor norm and region scale", () => {
    const leverage = buildNhm2FullSolveCurvatureLeverage({
      metricRequiredTensorRef: "artifact://nhm2/metric-required/wall",
      tileEffectiveTensorRef: "artifact://nhm2/tile-effective/wall",
      region: "wall",
      leverLength_m: 1_200,
      tensorNorm_m2: 3e-14,
      residualRelLInf: 0.2,
      observerClosureStatus: "review",
      qeiStatus: "missing",
      conservationStatus: "present",
    });

    expect(leverage.lane).toBe("nhm2_full_solve");
    expect(leverage.leverage).toBeCloseTo(4.32e-8, 18);
    expect(leverage.promotionAllowed).toBe(false);
    expect(leverage.qeiStatus).toBe("missing");
  });

  it("rejects nonfinite curvature and nonpositive lever lengths", () => {
    expect(() => scaleNormalizedCurvatureLeverage(Number.NaN, 1)).toThrow(TypeError);
    expect(() => scaleNormalizedCurvatureLeverage(1, 0)).toThrow(RangeError);
  });
});
