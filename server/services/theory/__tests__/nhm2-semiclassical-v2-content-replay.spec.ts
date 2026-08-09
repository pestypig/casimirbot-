import { describe, expect, it } from "vitest";

import {
  replayNhm2SemiclassicalV2Content,
  type Nhm2SemiclassicalV2ContentReplayInput,
  type Nhm2SemiclassicalV2ContentReplayPolicy,
} from "../nhm2-semiclassical-v2-content-replay";

const SAMPLE_COUNT = 64;
const TENSOR_COMPONENT_COUNT = 10;
const CONSTRAINT_COMPONENT_COUNT = 4;
const ALGEBRA_TOLERANCE = 2 ** -18;
const BASE_RESIDUAL = 2 ** -22;

const hash = (digit: string): string => digit.repeat(64);

const buildPolicy = (
  overrides: Partial<Nhm2SemiclassicalV2ContentReplayPolicy> = {},
): Nhm2SemiclassicalV2ContentReplayPolicy =>
  Object.freeze({
    policyId: "nhm2.frozen-nondegenerate-semiclassical-candidate/v1",
    candidateId: "nhm2-semiclassical-nondegenerate-001",
    geometrySha256: hash("1"),
    quantumStateSha256: hash("2"),
    chartId: "frozen-cartesian-chart-v1",
    chartSha256: hash("3"),
    normalizationId: "frozen-smeared-rset-frobenius-v1",
    normalizationSha256: hash("4"),
    sourceTensorProvenance: "state_derived_not_declared_lever" as const,
    declaredLeverTensorUsed: false as const,
    frozenBeforeExecution: true as const,
    sampleCount: SAMPLE_COUNT,
    regulatorLevelCount: 3,
    noisePsdToleranceSI: 1e-12,
    noiseExchangeToleranceSI: 1e-12,
    fluctuationRatioTolerance: 0.02,
    meanNormalizationFloorSI: 1e-12,
    minimumMetricDemandFrobeniusSI: 0.1,
    smearingWeightNormalizationTolerance: 1e-14,
    bracketResidualTolerance: ALGEBRA_TOLERANCE,
    antisymmetryResidualTolerance: ALGEBRA_TOLERANCE,
    jacobiResidualTolerance: ALGEBRA_TOLERANCE,
    regulatorFinalResidualTolerance: ALGEBRA_TOLERANCE,
    producerResidualConsistencyTolerance: 0,
    regulatorMonotonicityTolerance: 0,
    minimumRegulatorConvergenceOrder: 1.9,
    ...overrides,
  });

const noiseOffset = (matrixRow: number, matrixColumn: number): number => {
  const leftPoint = Math.floor(matrixRow / TENSOR_COMPONENT_COUNT);
  const leftComponent = matrixRow % TENSOR_COMPONENT_COUNT;
  const rightPoint = Math.floor(matrixColumn / TENSOR_COMPONENT_COUNT);
  const rightComponent = matrixColumn % TENSOR_COMPONENT_COUNT;
  return (
    (leftPoint * SAMPLE_COUNT + rightPoint) * 100 +
    leftComponent * TENSOR_COMPONENT_COUNT +
    rightComponent
  );
};

const bracket = () => {
  const length = SAMPLE_COUNT * CONSTRAINT_COMPONENT_COUNT;
  const classicalTarget = new Float64Array(length);
  classicalTarget.fill(1);
  const computed = Float64Array.from(classicalTarget);
  computed[0] += BASE_RESIDUAL;
  const producerResidual = Float64Array.from(
    computed,
    (value: number, index: number) => value - classicalTarget[index],
  );
  return {
    computed,
    classicalTarget,
    producerResidual,
    absoluteUncertainty95: new Float64Array(length),
  };
};

const buildInput = (): Nhm2SemiclassicalV2ContentReplayInput => {
  const covarianceDimension = SAMPLE_COUNT * TENSOR_COMPONENT_COUNT;
  const noiseKernel = new Float64Array(
    SAMPLE_COUNT * SAMPLE_COUNT * TENSOR_COMPONENT_COUNT ** 2,
  );
  for (let index = 0; index < covarianceDimension; index += 1) {
    noiseKernel[noiseOffset(index, index)] = 1 + index / 1_000;
  }

  const meanStressTensor = new Float64Array(
    SAMPLE_COUNT * TENSOR_COMPONENT_COUNT,
  );
  for (let point = 0; point < SAMPLE_COUNT; point += 1) {
    meanStressTensor[point * TENSOR_COMPONENT_COUNT] = 100;
    meanStressTensor[point * TENSOR_COMPONENT_COUNT + 4] = 10;
    meanStressTensor[point * TENSOR_COMPONENT_COUNT + 7] = 10;
    meanStressTensor[point * TENSOR_COMPONENT_COUNT + 9] = 10;
  }
  const metricDemandRset = new Float64Array(
    SAMPLE_COUNT * TENSOR_COMPONENT_COUNT,
  );
  for (let point = 0; point < SAMPLE_COUNT; point += 1) {
    metricDemandRset[point * TENSOR_COMPONENT_COUNT] = 1 + point / 100;
  }

  const meanSmearingWeights = new Float64Array(SAMPLE_COUNT);
  meanSmearingWeights.fill(1 / SAMPLE_COUNT);
  const constraintLength = SAMPLE_COUNT * CONSTRAINT_COMPONENT_COUNT;
  const antisymmetryForward = new Float64Array(constraintLength);
  antisymmetryForward[0] = BASE_RESIDUAL;
  const antisymmetryReverse = new Float64Array(constraintLength);
  const antisymmetryProducerResidual = Float64Array.from(
    antisymmetryForward,
    (value: number, index: number) => value + antisymmetryReverse[index],
  );
  const jacobiFirst = new Float64Array(constraintLength);
  const jacobiSecond = new Float64Array(constraintLength);
  const jacobiThird = new Float64Array(constraintLength);
  jacobiFirst[0] = BASE_RESIDUAL / 4;
  jacobiSecond[0] = BASE_RESIDUAL / 4;
  jacobiThird[0] = BASE_RESIDUAL / 2;
  const jacobiProducerResidual = Float64Array.from(
    jacobiFirst,
    (value: number, index: number) =>
      value + jacobiSecond[index] + jacobiThird[index],
  );

  return {
    policy: buildPolicy(),
    arrays: {
      noiseKernel,
      noiseAbsoluteUncertainty95: new Float64Array(noiseKernel.length),
      meanStressTensor,
      metricDemandRset,
      meanSmearingWeights,
      brackets: {
        H_H: bracket(),
        H_Hi: bracket(),
        Hi_Hj: bracket(),
      },
      antisymmetry: {
        forward: antisymmetryForward,
        reverse: antisymmetryReverse,
        producerResidual: antisymmetryProducerResidual,
        absoluteUncertainty95: new Float64Array(constraintLength),
      },
      jacobi: {
        first: jacobiFirst,
        second: jacobiSecond,
        third: jacobiThird,
        producerResidual: jacobiProducerResidual,
        absoluteUncertainty95: new Float64Array(constraintLength),
      },
      regulator: {
        levels: [
          {
            scale: 0.25,
            residual: Object.assign(new Float64Array(constraintLength), {
              0: 16 * BASE_RESIDUAL,
            }),
            absoluteUncertainty95: new Float64Array(constraintLength),
          },
          {
            scale: 0.125,
            residual: Object.assign(new Float64Array(constraintLength), {
              0: 4 * BASE_RESIDUAL,
            }),
            absoluteUncertainty95: new Float64Array(constraintLength),
          },
          {
            scale: 0.0625,
            residual: Object.assign(new Float64Array(constraintLength), {
              0: BASE_RESIDUAL,
            }),
            absoluteUncertainty95: new Float64Array(constraintLength),
          },
        ],
      },
    },
  };
};

const mutable = (
  input: Nhm2SemiclassicalV2ContentReplayInput,
): {
  policy: Nhm2SemiclassicalV2ContentReplayPolicy;
  arrays: {
    noiseKernel: Float64Array;
    noiseAbsoluteUncertainty95: Float64Array;
    meanStressTensor: Float64Array;
    metricDemandRset: Float64Array;
    meanSmearingWeights: Float64Array;
    brackets: Record<string, ReturnType<typeof bracket>>;
    antisymmetry: {
      forward: Float64Array;
      reverse: Float64Array;
      producerResidual: Float64Array;
      absoluteUncertainty95: Float64Array;
    };
    jacobi: {
      first: Float64Array;
      second: Float64Array;
      third: Float64Array;
      producerResidual: Float64Array;
      absoluteUncertainty95: Float64Array;
    };
    regulator: {
      levels: Array<{
        scale: number;
        residual: Float64Array;
        absoluteUncertainty95: Float64Array;
      }>;
    };
  };
} => input as never;

const expectLocked = (result: ReturnType<typeof replayNhm2SemiclassicalV2Content>) => {
  expect(
    Object.values(result.claimLocks).every(
      (value: boolean) => value === false,
    ),
  ).toBe(true);
};

describe("NHM2 semiclassical-v2 server-owned content replay", () => {
  it("passes a nondegenerate N=64 diagonal covariance fixture without granting claims", () => {
    const result = replayNhm2SemiclassicalV2Content(buildInput());

    expect(result.status).toBe("pass");
    expect(result.blockers).toEqual([]);
    expect(result.metrics.noise).toMatchObject({
      sampleCount: 64,
      covarianceDimension: 640,
      exchangeResidualUpper95SI: 0,
      covariancePositiveSemidefiniteCertified: true,
      psdCertificationDisposition: "certified",
      minimumLdltPivotSI: 1 / SAMPLE_COUNT,
      factorizationResidualLInfSI: 0,
      maximumGershgorinRadiusUpper95SI: 0,
      maximumEigenvalueUpper95SI: 3.276 / SAMPLE_COUNT,
    });
    expect(result.metrics.mean?.smearedTensorComponentsSI).toEqual([
      100,
      0,
      0,
      0,
      10,
      0,
      0,
      10,
      0,
      10,
    ]);
    expect(result.metrics.mean?.symmetricTensorFrobeniusSI).toBeCloseTo(
      Math.sqrt(10_300),
      12,
    );
    expect(result.metrics.mean?.fluctuationToMeanRatioUpper95).toBeLessThan(
      0.02,
    );
    expect(result.metrics.metricDemand).toEqual({
      maximumPointwiseSymmetricTensorFrobeniusSI: 1.63,
      argmaxPointIndex: 63,
      minimumRequiredFrobeniusSI: 0.1,
      strictlyNondegenerate: true,
    });
    expect(result.metrics.regulator).toMatchObject({
      minimumObservedOrder: 2,
      monotone: true,
      finalResidualUpper95: BASE_RESIDUAL,
    });
    expectLocked(result);
  });

  it("fails closed when the covariance has a negative diagonal mode", () => {
    const input = mutable(buildInput());
    input.arrays.noiseKernel[noiseOffset(0, 0)] = -1;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain("noise_psd_negative_witness");
    expect(result.metrics.noise?.minimumLdltPivotSI).toBe(
      -1 / SAMPLE_COUNT,
    );
    expect(
      result.metrics.noise?.negativeWitnessRayleighQuotientSI,
    ).toBe(-1 / SAMPLE_COUNT);
    expectLocked(result);
  });

  it("certifies a correlated PSD block that is not diagonally dominant", () => {
    const input = mutable(buildInput());
    for (const matrixIndex of [0, 1, 2]) {
      input.arrays.noiseKernel[noiseOffset(matrixIndex, matrixIndex)] = 1;
    }
    for (const [left, right] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      input.arrays.noiseKernel[noiseOffset(left, right)] = 0.75;
      input.arrays.noiseKernel[noiseOffset(right, left)] = 0.75;
    }

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("pass");
    expect(result.metrics.noise).toMatchObject({
      psdCertificationDisposition: "certified",
      covariancePositiveSemidefiniteCertified: true,
      factorizationResidualLInfSI: 0,
    });
    expect(
      result.metrics.noise?.maximumGershgorinRadiusUpper95SI,
    ).toBeGreaterThan(1 / SAMPLE_COUNT);
    expectLocked(result);
  });

  it("blocks a zero-pivot row violation without mislabeling it a negative witness", () => {
    const input = mutable(buildInput());
    input.arrays.noiseKernel[noiseOffset(0, 0)] = 0;
    input.arrays.noiseKernel[noiseOffset(0, 1)] = 1e-6;
    input.arrays.noiseKernel[noiseOffset(1, 0)] = 1e-6;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("noise_psd_numerically_inconclusive");
    expect(result.blockers).not.toContain("noise_psd_negative_witness");
    expect(result.metrics.noise).toMatchObject({
      psdCertificationDisposition: "numerically_inconclusive",
      covariancePositiveSemidefiniteCertified: false,
    });
    expect(
      result.metrics.noise?.maximumZeroPivotRowResidualSI,
    ).toBeGreaterThan(0);
    expectLocked(result);
  });

  it("fails an exact-zero metric-demand screen as degenerate", () => {
    const input = mutable(buildInput());
    input.arrays.metricDemandRset.fill(0);

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain("metric_demand_degenerate");
    expect(result.metrics.metricDemand).toEqual({
      maximumPointwiseSymmetricTensorFrobeniusSI: 0,
      argmaxPointIndex: 0,
      minimumRequiredFrobeniusSI: 0.1,
      strictlyNondegenerate: false,
    });
    expectLocked(result);

    const atFloor = mutable(buildInput());
    atFloor.arrays.metricDemandRset.fill(0);
    atFloor.arrays.metricDemandRset[0] =
      atFloor.policy.minimumMetricDemandFrobeniusSI;
    const atFloorResult = replayNhm2SemiclassicalV2Content(atFloor);
    expect(atFloorResult.status).toBe("fail");
    expect(atFloorResult.blockers).toContain("metric_demand_degenerate");
  });

  it("propagates raw noise uncertainty through the smeared eigenvalue upper bound", () => {
    const input = mutable(buildInput());
    const lastOffDiagonalComponentIndex =
      SAMPLE_COUNT * TENSOR_COMPONENT_COUNT - 2;
    input.arrays.noiseAbsoluteUncertainty95[
      noiseOffset(
        lastOffDiagonalComponentIndex,
        lastOffDiagonalComponentIndex,
      )
    ] = 0.1;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("pass");
    expect(result.metrics.noise?.exchangeResidualUpper95SI).toBe(0);
    expect(result.metrics.noise?.maximumEigenvalueUpper95SI).toBe(
      3.476 / SAMPLE_COUNT,
    );
    expect(result.metrics.mean?.fluctuationAmplitudeUpper95SI).toBeCloseTo(
      Math.sqrt(3.476 / SAMPLE_COUNT),
      15,
    );
    expectLocked(result);
  });

  it("detects point/component exchange-symmetry tampering", () => {
    const input = mutable(buildInput());
    input.arrays.noiseKernel[noiseOffset(0, 1)] = 1e-4;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "noise_exchange_symmetry_exceeds_tolerance",
    );
    expect(result.metrics.noise?.exchangeResidualUpper95SI).toBe(1e-4);
    expectLocked(result);
  });

  it("detects a forged producer bracket residual", () => {
    const input = mutable(buildInput());
    input.arrays.brackets.H_H.producerResidual[0] += 2 ** -20;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "bracket_H_H_producer_residual_mismatch",
    );
    expect(
      result.metrics.brackets.H_H?.producerResidualMismatchLInf,
    ).toBe(2 ** -20);
    expectLocked(result);
  });

  it.each(["antisymmetry", "jacobi"] as const)(
    "recomputes and rejects a %s identity violation even when the producer residual agrees",
    (identity: "antisymmetry" | "jacobi") => {
      const input = mutable(buildInput());
      if (identity === "antisymmetry") {
        input.arrays.antisymmetry.forward[0] = 0.1;
        input.arrays.antisymmetry.reverse[0] = 0;
        input.arrays.antisymmetry.producerResidual[0] = 0.1;
      } else {
        input.arrays.jacobi.first[0] = 0.025;
        input.arrays.jacobi.second[0] = 0.025;
        input.arrays.jacobi.third[0] = 0.05;
        input.arrays.jacobi.producerResidual[0] = 0.1;
      }

      const result = replayNhm2SemiclassicalV2Content(input);

      expect(result.status).toBe("fail");
      expect(result.blockers).toContain(
        `${identity}_residual_upper95_exceeds_tolerance`,
      );
      expect(result.metrics[identity]?.residualLInf).toBeCloseTo(0.1, 15);
      expectLocked(result);
    },
  );

  it("fails a monotone but insufficient regulator convergence order", () => {
    const input = mutable(buildInput());
    input.arrays.regulator.levels[0].residual[0] = 4 * BASE_RESIDUAL;
    input.arrays.regulator.levels[1].residual[0] = 3 * BASE_RESIDUAL;
    input.arrays.regulator.levels[2].residual[0] = 2 * BASE_RESIDUAL;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "regulator_convergence_order_below_minimum",
    );
    expect(result.metrics.regulator?.monotone).toBe(true);
    expect(result.metrics.regulator?.finalResidualUpper95).toBeLessThan(
      ALGEBRA_TOLERANCE,
    );
    expectLocked(result);
  });

  it("passes at an exact frozen tolerance edge and fails without retuning above it", () => {
    const atEdge = mutable(buildInput());
    atEdge.arrays.brackets.H_H.computed[0] = 1 + ALGEBRA_TOLERANCE;
    atEdge.arrays.brackets.H_H.producerResidual[0] = ALGEBRA_TOLERANCE;
    const atEdgeResult = replayNhm2SemiclassicalV2Content(atEdge);
    expect(atEdgeResult.status).toBe("pass");
    expect(atEdgeResult.metrics.brackets.H_H?.residualUpper95).toBe(
      ALGEBRA_TOLERANCE,
    );

    const above = mutable(buildInput());
    above.arrays.brackets.H_H.computed[0] = 1 + 2 * ALGEBRA_TOLERANCE;
    above.arrays.brackets.H_H.producerResidual[0] =
      2 * ALGEBRA_TOLERANCE;
    const aboveResult = replayNhm2SemiclassicalV2Content(above);
    expect(aboveResult.status).toBe("fail");
    expect(aboveResult.blockers).toContain(
      "bracket_H_H_residual_upper95_exceeds_tolerance",
    );
    expect(aboveResult.frozenBindings.policyId).toBe(
      atEdgeResult.frozenBindings.policyId,
    );
    expectLocked(aboveResult);
  });

  it("keeps bracket and identity tolerances independently frozen", () => {
    const input = mutable(buildInput());
    input.policy = buildPolicy({
      bracketResidualTolerance: BASE_RESIDUAL / 2,
      antisymmetryResidualTolerance: 2 * BASE_RESIDUAL,
      jacobiResidualTolerance: 2 * BASE_RESIDUAL,
    });

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "bracket_H_H_residual_upper95_exceeds_tolerance",
    );
    expect(result.blockers).not.toContain(
      "antisymmetry_residual_upper95_exceeds_tolerance",
    );
    expect(result.blockers).not.toContain(
      "jacobi_residual_upper95_exceeds_tolerance",
    );
    expect(result.metrics.brackets.H_H?.tolerance).toBe(BASE_RESIDUAL / 2);
    expect(result.metrics.antisymmetry?.tolerance).toBe(
      2 * BASE_RESIDUAL,
    );
    expect(result.metrics.jacobi?.tolerance).toBe(2 * BASE_RESIDUAL);
    expectLocked(result);
  });

  it("uses pointwise residual-plus-uncertainty maxima for brackets and regulator levels", () => {
    const input = mutable(buildInput());
    input.policy = buildPolicy({
      bracketResidualTolerance: 2,
      regulatorFinalResidualTolerance: 0.3,
    });
    const bracket = input.arrays.brackets.H_H;
    bracket.computed.set(bracket.classicalTarget);
    bracket.computed[0] += 1;
    bracket.producerResidual.fill(0);
    bracket.producerResidual[0] = 1;
    bracket.absoluteUncertainty95.fill(0);
    bracket.absoluteUncertainty95[1] = 2;

    const regulatorResiduals = [4, 1, 0.25] as const;
    const regulatorUncertainties = [3, 0.75, 0.1875] as const;
    for (let level = 0; level < 3; level += 1) {
      input.arrays.regulator.levels[level].residual.fill(0);
      input.arrays.regulator.levels[level].absoluteUncertainty95.fill(0);
      input.arrays.regulator.levels[level].residual[0] =
        regulatorResiduals[level];
      input.arrays.regulator.levels[level].absoluteUncertainty95[1] =
        regulatorUncertainties[level];
    }

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("pass");
    expect(result.metrics.brackets.H_H).toMatchObject({
      residualLInf: 1,
      absoluteUncertainty95: 2,
      residualUpper95: 2,
    });
    expect(result.metrics.regulator).toMatchObject({
      residualUpper95ByLevel: [4, 1, 0.25],
      observedOrders: [2, 2],
      finalResidualUpper95: 0.25,
    });
    expectLocked(result);
  });

  it("blocks non-finite bytes before numerical authority", () => {
    const input = mutable(buildInput());
    input.arrays.noiseKernel[0] = Number.NaN;

    const result = replayNhm2SemiclassicalV2Content(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain("array_nonfinite");
    expect(result.metrics.noise).toBeNull();
    expectLocked(result);
  });

  it("blocks wrong array shapes, aliased buffers, and target echoes", () => {
    const wrongShape = mutable(buildInput());
    wrongShape.arrays.meanStressTensor = new Float64Array(1);
    expect(
      replayNhm2SemiclassicalV2Content(wrongShape).blockers,
    ).toContain("mean_stress_tensor_shape_invalid");

    const aliased = mutable(buildInput());
    aliased.arrays.antisymmetry.reverse =
      aliased.arrays.antisymmetry.forward;
    expect(replayNhm2SemiclassicalV2Content(aliased).blockers).toContain(
      "array_shared_buffer_forbidden",
    );

    const targetEcho = mutable(buildInput());
    targetEcho.arrays.brackets.H_H.classicalTarget = Float64Array.from(
      targetEcho.arrays.brackets.H_H.computed,
    );
    targetEcho.arrays.brackets.H_H.producerResidual.fill(0);
    const targetEchoResult = replayNhm2SemiclassicalV2Content(targetEcho);
    expect(targetEchoResult.status).toBe("blocked");
    expect(targetEchoResult.blockers).toContain("bracket_H_H_target_echo");
    expectLocked(targetEchoResult);
  });
});
