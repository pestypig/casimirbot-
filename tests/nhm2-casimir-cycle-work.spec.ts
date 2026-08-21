import { describe, expect, it } from "vitest";
import {
  NHM2_CASIMIR_CYCLE_WORK_VERSION,
  computeNhm2CasimirLifshitzCycle,
  computeNhm2CasimirCycleWork,
  type Nhm2CasimirCycleWorkInputV1,
} from "../shared/nhm2-casimir-cycle-work";

const gaps = [80e-9, 96e-9, 120e-9, 150e-9];

const curve = (
  stateId: string,
  forcesNewtons: number[],
  evidenceTier: "measured" | "validated_simulation" = "validated_simulation",
) => ({
  stateId,
  evidenceTier,
  method:
    evidenceTier === "measured"
      ? ("measured_force_curve" as const)
      : ("finite_geometry_maxwell_stress" as const),
  artifactSha256: (stateId === "strong" ? "a" : "b").repeat(64),
  gapsMeters: [...gaps],
  forcesNewtons,
  forceStandardUncertaintyNewtons: forcesNewtons.map(() => 1e-6),
});

const base = (): Nhm2CasimirCycleWorkInputV1 => ({
  contractVersion: NHM2_CASIMIR_CYCLE_WORK_VERSION,
  cycleId: "coupon-cycle-0001",
  systemBoundaryId: "coupon-plus-drive-controller-and-cold-sink",
  cycleKind: "switchable_material",
  couponTargetGapMeters: 96e-9,
  allowedCouponGapRangeMeters: [80e-9, 150e-9],
  contractionCurve: curve("strong", [-1, -0.8, -0.5, -0.25]),
  expansionCurve: curve("weak", [-0.2, -0.16, -0.1, -0.05]),
  supplyingReservoirIds: ["electrical-switch-drive"],
  switchingEnergyInputJ: 1e-9,
  actuatorEnergyInputJ: 1e-9,
  sensingControlEnergyInputJ: 1e-9,
  coolingEnergyInputJ: 0,
  otherOperatingEnergyInputJ: 0,
  identifiedInputExergyJ: 1e-6,
  hotReservoirTemperatureK: null,
  coldReservoirTemperatureK: null,
  hotReservoirEnergyInputJ: null,
});

describe("NHM2 real-material Casimir closed-cycle work", () => {
  it("makes a same-state gap cycle an explicit zero-work reference", () => {
    const input = base();
    input.cycleKind = "gap_only_control";
    input.expansionCurve = {
      ...input.contractionCurve,
      gapsMeters: [...input.contractionCurve.gapsMeters],
      forcesNewtons: [...input.contractionCurve.forcesNewtons],
      forceStandardUncertaintyNewtons: [0, 0, 0, 0],
    };
    input.contractionCurve = {
      ...input.contractionCurve,
      forceStandardUncertaintyNewtons: [0, 0, 0, 0],
    };

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.derived.grossMechanicalWorkByFieldJ).toBe(0);
    expect(result.checks.gapOnlyNullControlPassed).toBe(true);
    expect(result.experimentDecision).toBe("gap_only_null_reference");
    expect(result.claimBoundary.vacuumEnergyExtractionClaimAllowed).toBe(false);
  });

  it("integrates a two-state force loop and recommends a coupon only after known costs", () => {
    const result = computeNhm2CasimirCycleWork(base());

    expect(result.derived.contractionWorkByFieldJ).toBeGreaterThan(0);
    expect(result.derived.expansionWorkByFieldJ).toBeLessThan(0);
    expect(result.derived.conservativeMechanicalSurplusLowerJ).toBeGreaterThan(
      0,
    );
    expect(result.checks.couponTargetBracketed).toBe(true);
    expect(result.experimentDecision).toBe(
      "validated_model_supports_coupon_test",
    );
    expect(result.recommendedCoupon).toMatchObject({
      nominalGapMeters: 96e-9,
      startQuasistatic: true,
      singlePairBeforeStack: true,
    });
  });

  it("rejects a positive loop whose switching and control inputs erase the margin", () => {
    const input = base();
    input.switchingEnergyInputJ = 1e-5;

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.derived.grossMechanicalWorkByFieldJ).toBeGreaterThan(0);
    expect(result.derived.conservativeMechanicalSurplusLowerJ).toBeLessThan(0);
    expect(result.experimentDecision).toBe("theoretical_margin_not_positive");
  });

  it("blocks apparent work without sufficient identified input exergy", () => {
    const input = base();
    input.identifiedInputExergyJ = 1e-12;

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.checks.usefulWorkWithinIdentifiedExergy).toBe(false);
    expect(result.blockers).toContain(
      "mechanical_work_exceeds_identified_input_exergy",
    );
    expect(result.experimentDecision).toBe("reservoir_accounting_incomplete");
  });

  it("applies the Carnot work bound to a thermal fluctuation engine", () => {
    const input = base();
    input.cycleKind = "thermal_nonreciprocal";
    input.hotReservoirTemperatureK = 400;
    input.coldReservoirTemperatureK = 300;
    input.hotReservoirEnergyInputJ = 1e-9;

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.derived.carnotEfficiencyLimit).toBe(0.25);
    expect(result.checks.thermalCarnotBoundPassed).toBe(false);
    expect(result.blockers).toContain(
      "thermal_cycle_exceeds_carnot_work_bound",
    );
    expect(result.experimentDecision).toBe("reservoir_accounting_incomplete");
  });

  it("does not confuse a measured force curve with practical validation", () => {
    const input = base();
    input.contractionCurve = curve(
      "strong",
      [-1, -0.8, -0.5, -0.25],
      "measured",
    );
    input.expansionCurve = curve(
      "weak",
      [-0.2, -0.16, -0.1, -0.05],
      "measured",
    );

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.checks.measuredForceCurvesComplete).toBe(true);
    expect(result.experimentDecision).toBe(
      "measured_curve_supports_repeatability_test",
    );
    expect(result.claimBoundary.experimentRequiredForPracticalUtility).toBe(
      true,
    );
    expect(result.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("keeps a literature-only force contrast below coupon recommendation", () => {
    const input = base();
    input.contractionCurve.evidenceTier = "literature_anchored";
    input.contractionCurve.method = "equilibrium_lifshitz_planar";
    input.expansionCurve.evidenceTier = "literature_anchored";
    input.expansionCurve.method = "equilibrium_lifshitz_planar";

    const result = computeNhm2CasimirCycleWork(input);

    expect(result.checks.forceCurveEvidenceReady).toBe(false);
    expect(result.experimentDecision).toBe(
      "literature_model_requires_validated_force_curves",
    );
  });

  it("builds a literature-only force loop through the registered Lifshitz solver", () => {
    const ideal = {
      kind: "ideal_conductor" as const,
      label: "ideal fixed coupon face",
      evidence_class: "literature_anchored" as const,
      source_ref: "Casimir ideal reference",
      artifact_sha256: null,
    };
    const drude = {
      kind: "drude" as const,
      label: "gold-like Drude switched state",
      evidence_class: "literature_anchored" as const,
      source_ref: "https://doi.org/10.1103/RevModPhys.81.1827",
      artifact_sha256: null,
      plasma_frequency_rad_s: 1.367e16,
      damping_rad_s: 5.317e13,
    };

    const result = computeNhm2CasimirLifshitzCycle({
      cycleId: "lifshitz-literature-screen",
      systemBoundaryId: "coupon-plus-optical-switch-drive",
      cycleKind: "switchable_material",
      temperatureK: 300,
      areaM2: 1e-8,
      gapsMeters: [...gaps],
      fixedMaterial: ideal,
      contractionStateId: "ideal-strong-reference",
      contractionMaterial: ideal,
      contractionCalculationSha256: "c".repeat(64),
      expansionStateId: "drude-weak-reference",
      expansionMaterial: drude,
      expansionCalculationSha256: "d".repeat(64),
      relativeModelForceUncertainty: 0.1,
      numerics: {
        max_matsubara_terms: 1024,
        integration_subdivisions: 240,
        integration_tail_y: 40,
        relative_term_tolerance: 1e-8,
        consecutive_small_terms: 6,
      },
      supplyingReservoirIds: ["optical-or-electrical-switch-drive"],
      switchingEnergyInputJ: 0,
      actuatorEnergyInputJ: 0,
      sensingControlEnergyInputJ: 0,
      coolingEnergyInputJ: 0,
      otherOperatingEnergyInputJ: 0,
      identifiedInputExergyJ: 1e-6,
    });

    expect(result.derived.grossMechanicalWorkByFieldJ).toBeGreaterThan(0);
    expect(result.checks.forceCurveEvidenceReady).toBe(false);
    expect(result.experimentDecision).toBe(
      "literature_model_requires_validated_force_curves",
    );
    expect(result.claimBoundary.vacuumEnergyExtractionClaimAllowed).toBe(false);
  });

  it("fails closed on mismatched grids, nonfinite values, and duplicate reservoirs", () => {
    const mismatched = base();
    mismatched.expansionCurve.gapsMeters = [80e-9, 97e-9, 120e-9, 150e-9];
    expect(computeNhm2CasimirCycleWork(mismatched).experimentDecision).toBe(
      "invalid_input",
    );

    const nonfinite = base();
    nonfinite.contractionCurve.forcesNewtons[1] = Number.NaN;
    expect(computeNhm2CasimirCycleWork(nonfinite).blockers).toContain(
      "cycle_input_invalid_or_unbounded",
    );

    const duplicate = base();
    duplicate.supplyingReservoirIds = ["drive", "drive"];
    expect(computeNhm2CasimirCycleWork(duplicate).checks.inputShapeValid).toBe(
      false,
    );

    const substitutedCoupon = base();
    substitutedCoupon.couponTargetGapMeters = 8e-9;
    substitutedCoupon.allowedCouponGapRangeMeters = [8e-9, 10e-9];
    expect(
      computeNhm2CasimirCycleWork(substitutedCoupon).experimentDecision,
    ).toBe("invalid_input");

    const oneStateSwitch = base();
    oneStateSwitch.expansionCurve.stateId =
      oneStateSwitch.contractionCurve.stateId;
    expect(computeNhm2CasimirCycleWork(oneStateSwitch).experimentDecision).toBe(
      "invalid_input",
    );
  });
});
