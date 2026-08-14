import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1 as operator,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256_DOMAIN,
  isNhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1,
  nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};

type Rational = Readonly<{ n: bigint; d: bigint }>;

const rational = (n: bigint, d = 1n): Rational => {
  if (d === 0n) throw new Error("zero denominator");
  const sign = d < 0n ? -1n : 1n;
  const common = gcd(n, d);
  return Object.freeze({ n: (sign * n) / common, d: (sign * d) / common });
};

const add = (a: Rational, b: Rational): Rational =>
  rational(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a: Rational, b: Rational): Rational =>
  rational(a.n * b.d - b.n * a.d, a.d * b.d);
const multiply = (a: Rational, b: Rational): Rational =>
  rational(a.n * b.n, a.d * b.d);
const divide = (a: Rational, b: Rational): Rational =>
  rational(a.n * b.d, a.d * b.n);
const equal = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d;
const lessThanOrEqual = (a: Rational, b: Rational): boolean =>
  a.n * b.d <= b.n * a.d;

const recurrence = (
  a: readonly Rational[],
  b: readonly Rational[],
  nu: Rational,
  n: number,
): Readonly<{ aNext: Rational; bNext: Rational }> => {
  let aConv = rational(0n);
  let bConv = rational(0n);
  for (let k = 0; k <= n; k += 1) {
    aConv = add(aConv, multiply(b[k], a[n - k]));
    bConv = add(bConv, multiply(a[k], a[n - k]));
  }
  const denominator = rational(BigInt((2 * n + 2) * (2 * n + 3)));
  return Object.freeze({
    aNext: divide(
      multiply(rational(2n), subtract(aConv, multiply(nu, a[n]))),
      denominator,
    ),
    bNext: divide(bConv, denominator),
  });
};

describe("NHM2 spherical directed-proof operator v1", () => {
  it("binds the three frozen predecessors and the replacement final primary policy", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_PINS,
    ).toEqual({
      semanticSeed: {
        sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
        canonicalSizeBytes:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
      },
      operationPrepolicy: {
        sha256:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
        canonicalSizeBytes:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
      },
      directedProofArchitecture: {
        sha256:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
        canonicalSizeBytes:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
      },
      primaryNumericsPolicyBinding: {
        sha256:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
        canonicalSizeBytes:
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
      },
    });
    expect(operator.completionBoundary.primaryNumericsPolicyBound).toBe(true);
    expect(operator.blockers).not.toContain(
      "replacement_final_primary_numerics_policy_binding_absent",
    );
  });

  it("closes the exact origin recurrence, representative, inverse, and radii formulas", () => {
    const origin = operator.originOperatorClosure;
    expect(origin.nonlinearResidual.aComponent).toContain("G_a[m]");
    expect(origin.nonlinearResidual.bComponent).toContain("G_b[m]");
    expect(
      origin.nonlinearResidual.representativeDefectFiniteSupport,
    ).toContain("m>=34");
    expect(origin.representativeAndInverse.inverseAOrigin).toBe(
      "identity_map_on_the_origin_tail_residual_coordinates",
    );
    expect(origin.representativeAndInverse.fixedPointSemantics).toContain(
      "Gtail=exact_zero",
    );
    expect(origin.radiiBounds.YUpper).toContain("m=17^33");
    expect(origin.radiiBounds.Z0Upper).toContain("Abar+Bbar+abs(nu0)");
    expect(origin.radiiBounds.Z1Upper).toContain("*6");
    expect(origin.radiiBounds.pUpper).toContain("YUpper");
  });

  it("mechanically exercises the origin recurrence with an exact rational fixture", () => {
    const nu = rational(-1n, 2n);
    const a: Rational[] = [rational(1n)];
    const b: Rational[] = [rational(-1n)];
    const first = recurrence(a, b, nu, 0);
    a.push(first.aNext);
    b.push(first.bNext);
    const second = recurrence(a, b, nu, 1);

    expect(equal(first.aNext, rational(-1n, 6n))).toBe(true);
    expect(equal(first.bNext, rational(1n, 6n))).toBe(true);
    expect(equal(second.aNext, rational(1n, 40n))).toBe(true);
    expect(equal(second.bNext, rational(-1n, 60n))).toBe(true);
  });

  it("keeps closed-overlap derivative control separate from the origin contraction norm", () => {
    const envelope =
      operator.originOperatorClosure.separateGeometricEnvelopeDuty;
    expect(
      operator.originOperatorClosure.tailSpace
        .closedOverlapDerivativeControlFromThisNormAlone,
    ).toBe(false);
    expect(envelope.isConsequenceOfOriginL1Contraction).toBe(false);
    expect(envelope.fixedEnvelope.qExact).toBe("2^-12");
    expect(envelope.fixedEnvelope.MExact).toBe("2^8");
    expect(envelope.baseRange).toContain("17..34");
    expect(envelope.propagationForEveryNAtLeast34).toContain("n-33");
    expect(envelope.fixedUniformPropagationInequality).toContain("1/548");
    expect(envelope.discreteSupremumProof).toContain("-4*n^2+260*n+468");
    expect(envelope.tailsAtClosedOverlap.value).toBe(
      "sum_n>=17 M*q^n=M*q^17/(1-q)",
    );
    expect(envelope.tailsAtClosedOverlap.firstDerivative).toContain("17-16*q");
    expect(envelope.tailsAtClosedOverlap.secondDerivative).toContain(
      "561-1053*q+496*q^2",
    );
    expect(envelope.convergenceConclusion).toContain(
      "uniform_absolute_convergence",
    );
  });

  it("mechanically verifies the three closed geometric tail identities", () => {
    const q = rational(1n, 8n);
    const M = rational(3n);
    const q17 = rational(q.n ** 17n, q.d ** 17n);
    const oneMinusQ = subtract(rational(1n), q);

    const finiteMaximum = 80;
    let finiteValue = rational(0n);
    let finiteD1 = rational(0n);
    let finiteD2 = rational(0n);
    for (let n = 17; n <= finiteMaximum; n += 1) {
      const qn = rational(q.n ** BigInt(n), q.d ** BigInt(n));
      finiteValue = add(finiteValue, multiply(M, qn));
      finiteD1 = add(
        finiteD1,
        multiply(rational(BigInt(2 * n)), multiply(M, qn)),
      );
      finiteD2 = add(
        finiteD2,
        multiply(rational(BigInt(2 * n * (2 * n - 1))), multiply(M, qn)),
      );
    }
    const valueClosed = divide(multiply(M, q17), oneMinusQ);
    const d1Closed = divide(
      multiply(
        multiply(rational(2n), multiply(M, q17)),
        subtract(rational(17n), multiply(rational(16n), q)),
      ),
      multiply(oneMinusQ, oneMinusQ),
    );
    const d2Polynomial = add(
      subtract(rational(561n), multiply(rational(1053n), q)),
      multiply(rational(496n), multiply(q, q)),
    );
    const d2Closed = divide(
      multiply(multiply(rational(2n), multiply(M, q17)), d2Polynomial),
      multiply(multiply(oneMinusQ, oneMinusQ), oneMinusQ),
    );

    const tailStart = BigInt(finiteMaximum + 1);
    const qTail = rational(q.n ** tailStart, q.d ** tailStart);
    const valueRemainder = divide(multiply(M, qTail), oneMinusQ);
    const d1Remainder = divide(
      multiply(
        multiply(rational(2n), multiply(M, qTail)),
        subtract(rational(tailStart), multiply(rational(tailStart - 1n), q)),
      ),
      multiply(oneMinusQ, oneMinusQ),
    );
    const d2RemainderPolynomial = add(
      add(
        rational(2n * tailStart * (2n * tailStart - 1n)),
        multiply(
          rational(-8n * tailStart * tailStart + 12n * tailStart + 2n),
          q,
        ),
      ),
      multiply(
        rational(4n * tailStart * tailStart - 10n * tailStart + 6n),
        multiply(q, q),
      ),
    );
    const d2Remainder = divide(
      multiply(multiply(M, qTail), d2RemainderPolynomial),
      multiply(multiply(oneMinusQ, oneMinusQ), oneMinusQ),
    );
    expect(equal(add(finiteValue, valueRemainder), valueClosed)).toBe(true);
    expect(equal(add(finiteD1, d1Remainder), d1Closed)).toBe(true);
    expect(equal(add(finiteD2, d2Remainder), d2Closed)).toBe(true);
  });

  it("freezes the exact projection partition, split policy, and derived budgets", () => {
    const projection = operator.projectionClosure;
    expect(projection.projectedFibersInOrder).toHaveLength(12);
    expect(projection.modesPerFiber).toBe(513);
    expect(projection.initialPartition.cellCount).toBe(8);
    expect(
      projection.splitRule.maximumAdditionalSplitDepthFromInitialCell,
    ).toBe(9);
    expect(projection.exactBudgets).toEqual({
      maximumPoppedCellsPerProjection: 8184,
      derivation:
        "eight_binary_trees_each_with_depth_9_below_its_initial_root_have_at_most_8*(2^10-1)=8184_popped_cells",
      maximumAcceptedLeavesPerProjection: 4096,
      maximumTaylorJetBuildsPerPoppedCell: 1,
      maximumJetCoefficientWorkUnitsPerPoppedCell: 11,
      maximumJetCoefficientWorkUnitsPerProjection: 90024,
      exactProjectionCount: 6156,
      projectionCountDerivation: "12_fibers*513_modes",
      maximumGlobalPoppedCells: 50380704,
      maximumGlobalTaylorJetBuilds: 50380704,
      maximumGlobalJetCoefficientWorkUnits: 554187744,
      endpointFlatnessDerivativeChecksPerFiber: 10,
      endpointFlatnessOrders: "odd_orders_1_3_5_7_9_at_each_of_two_endpoints",
      maximumGlobalEndpointFlatnessChecks: 120,
      maximumGlobalScalarEvaluationWorkUnits: 554187864,
    });
    expect(8 * (2 ** 10 - 1)).toBe(8184);
    expect(12 * 513).toBe(6156);
    expect(6156 * 8184).toBe(50380704);
    expect(50380704 * 11).toBe(554187744);
  });

  it("defines the sign-correct reciprocal graph for both sign components", () => {
    const reciprocal =
      operator.directedArithmeticClosure.signedReciprocalEndpointGraph;
    expect(reciprocal.positiveBranch).toEqual([
      "lower=MPFR_div_RNDD(exact_positive_one,b)",
      "upper=MPFR_div_RNDU(exact_positive_one,a)",
    ]);
    expect(reciprocal.negativeBranch).toEqual(reciprocal.positiveBranch);
    expect(reciprocal.orderingReason).toContain("strictly_decreasing");

    const reciprocalRational = (
      a: Rational,
      b: Rational,
    ): readonly [Rational, Rational] => {
      if (a.n * b.d <= 0n && b.n * a.d >= 0n) {
        throw new Error("sign crossing");
      }
      return [divide(rational(1n), b), divide(rational(1n), a)];
    };
    expect(reciprocalRational(rational(2n), rational(5n))).toEqual([
      rational(1n, 5n),
      rational(1n, 2n),
    ]);
    expect(reciprocalRational(rational(-5n), rational(-2n))).toEqual([
      rational(-1n, 2n),
      rational(-1n, 5n),
    ]);
    expect(() => reciprocalRational(rational(-1n), rational(2n))).toThrow(
      "sign crossing",
    );
  });

  it("computes nine ordered Hessian blocks and forbids symmetry copying", () => {
    expect(
      operator.exteriorOperatorClosure.exactFirstDerivativeColumns
        .directionalFormulas,
    ).toHaveLength(5);
    const hessian =
      operator.exteriorOperatorClosure.exactSecondDerivativeBlocks;
    expect(hessian.orderedBlockOrder).toEqual([
      "alpha_alpha",
      "alpha_beta",
      "alpha_gamma",
      "beta_alpha",
      "beta_beta",
      "beta_gamma",
      "gamma_alpha",
      "gamma_beta",
      "gamma_gamma",
    ]);
    expect(hessian.schrodingerNonlinearSecondDerivative).toContain("G2_rs");
    expect(hessian.poissonSourceSecondDerivative).toContain("H_r*H_s");
    expect(hessian.directionalSymbols).toContain("cP_rs=8*y^2");
    expect(hessian.schrodingerPolynomialSecondDerivative).toContain("cS_rs*H");
    expect(hessian.poissonPolynomialSecondDerivative).toContain("cP_rs*Q");
    expect(hessian.massSecondDerivative).toContain("all_beta_rows");
    expect(hessian.wholeXBallOperandRule).toContain("wholeXBallSequenceSource");
    expect(hessian.symmetryUseForbidden).toContain("all_nine_ordered_blocks");
  });

  it("binds every Hessian block and mass tail to one shared whole-X-ball sequence source", () => {
    const compiler = operator.weightedMajorantCompiler;
    const source =
      compiler.normalizedBasisColumnPrimitives.wholeXBallSequenceSource;
    expect(source.commonRadiusExact).toBe("rhoX=2^-20");
    expect(source.admittedBall).toContain("one_shared_rhoX_budget");
    expect(source.coordinateCoefficientIntervals).toContain(
      "must_never_be_summed",
    );
    expect(source.liftWeightedNormExact).toContain("1897/2");
    expect(source.pointwiseBallEnvelope).toContain("<=rhoX");
    expect(source.wholeFieldSources).toContain("HWholeXBall");
    expect(source.wholeFieldSources).toContain("QWholeXBall");
    expect(source.requiredConsumers).toContain("all_nine_ordered_D2F_blocks");
    expect(source.massIntegrationBoundary).toContain(
      "must_never_differentiate",
    );
    expect(
      compiler.symbolicColumnDag.allowedNodeKindsInTopologicalOrder,
    ).toContain("whole_X_ball_sequence_with_tail_and_norm");
    expect(compiler.symbolicColumnDag.wholeXBallProduct).toContain(
      "shared_wholeWeightedNormUpper",
    );
    expect(compiler.primitiveTailRules.massIntegralHighColumns).toContain(
      "JE0",
    );
    expect(compiler.primitiveTailRules.massIntegralHighColumns).toContain(
      "never_build_a_Taylor_jet",
    );
    expect(compiler.Z1Compiler.exactPairFunction).toContain("QWholeXBall");
    expect(compiler.Z1Compiler.ballDependency).toContain(
      "shared_alpha_beta_weighted-norm_budget",
    );
    expect(
      operator.completionBoundary.exactWholeXBallSequenceAndTailCompilerClosed,
    ).toBe(true);
  });

  it("mechanically covers normalized high-mode alpha and beta perturbations without independent reboxing", () => {
    const rhoX = rational(1n, 2n ** 20n);
    const highMode = 513n;
    const highWeight = (highMode + 1n) ** 8n;
    const alphaPerturbation = divide(rhoX, rational(highWeight));
    const betaPerturbation = divide(rhoX, rational(highWeight));
    expect(equal(multiply(rational(highWeight), alphaPerturbation), rhoX)).toBe(
      true,
    );
    expect(equal(multiply(rational(highWeight), betaPerturbation), rhoX)).toBe(
      true,
    );
    expect(lessThanOrEqual(alphaPerturbation, rhoX)).toBe(true);
    expect(lessThanOrEqual(betaPerturbation, rhoX)).toBe(true);

    // For one input T_n, multiplication by
    // ell=(3/8)T_0-(1/2)T_1+(1/8)T_2 produces the five listed modes.
    const liftedWeightedNorm = multiply(
      alphaPerturbation,
      add(
        add(
          multiply(rational(3n, 8n), rational((highMode + 1n) ** 8n)),
          multiply(
            rational(1n, 4n),
            add(rational((highMode + 2n) ** 8n), rational(highMode ** 8n)),
          ),
        ),
        multiply(
          rational(1n, 16n),
          add(rational((highMode + 3n) ** 8n), rational((highMode - 1n) ** 8n)),
        ),
      ),
    );
    const declaredLiftBound = multiply(rational(1897n, 2n), rhoX);
    expect(lessThanOrEqual(liftedWeightedNorm, declaredLiftBound)).toBe(true);
    const liftedTailFrom513 = multiply(
      alphaPerturbation,
      add(
        add(
          multiply(rational(3n, 8n), rational((highMode + 1n) ** 8n)),
          multiply(rational(1n, 4n), rational((highMode + 2n) ** 8n)),
        ),
        multiply(rational(1n, 16n), rational((highMode + 3n) ** 8n)),
      ),
    );
    expect(lessThanOrEqual(liftedTailFrom513, declaredLiftBound)).toBe(true);

    const liftedSameModeDelta = multiply(rational(3n, 8n), alphaPerturbation);
    const liftedBetaSameModeDelta = multiply(
      rational(3n, 8n),
      betaPerturbation,
    );
    const schrodingerGammaGammaDelta = multiply(
      rational(2n),
      liftedSameModeDelta,
    );
    const poissonGammaGammaDelta = multiply(
      rational(2n),
      liftedBetaSameModeDelta,
    );
    expect(schrodingerGammaGammaDelta.n > 0n).toBe(true);
    expect(poissonGammaGammaDelta.n > 0n).toBe(true);
    expect(
      operator.exteriorOperatorClosure.exactSecondDerivativeBlocks
        .schrodingerPolynomialSecondDerivative,
    ).toContain("cS_rs*H");
    expect(
      operator.exteriorOperatorClosure.exactSecondDerivativeBlocks
        .poissonPolynomialSecondDerivative,
    ).toContain("cP_rs*Q");
  });

  it("mechanically exercises the written second-product formula", () => {
    type Jet = Readonly<{ v: number; r: number; s: number; rs: number }>;
    const productSecond = (g: Jet, q: Jet, h: Jet): number =>
      g.rs * q.v * h.v +
      g.r * (q.s * h.v + q.v * h.s) +
      g.s * (q.r * h.v + q.v * h.r) +
      g.v * (q.rs * h.v + q.r * h.s + q.s * h.r + q.v * h.rs);
    const g = { v: 2, r: 3, s: 5, rs: 7 };
    const q = { v: 11, r: 13, s: 17, rs: 19 };
    const h = { v: 23, r: 29, s: 31, rs: 37 };
    const direct = (r: number, s: number): number =>
      (g.v + g.r * r + g.s * s + g.rs * r * s) *
      (q.v + q.r * r + q.s * s + q.rs * r * s) *
      (h.v + h.r * r + h.s * s + h.rs * r * s);
    const coefficient =
      direct(1, 1) - direct(1, 0) - direct(0, 1) + direct(0, 0);
    // The finite difference also includes terms of degree >1 in r or s at unit
    // steps, so use the exact symbolic mixed coefficient as the fixture oracle.
    const symbolicCoefficient =
      g.rs * q.v * h.v +
      g.r * q.s * h.v +
      g.r * q.v * h.s +
      g.s * q.r * h.v +
      g.s * q.v * h.r +
      g.v * q.rs * h.v +
      g.v * q.r * h.s +
      g.v * q.s * h.r +
      g.v * q.v * h.rs;
    expect(productSecond(g, q, h)).toBe(symbolicCoefficient);
    expect(coefficient).toBeGreaterThan(symbolicCoefficient);
  });

  it("closes the Z0 high-column and Z1 bilinear-tail compilers without sampling fallback", () => {
    const compiler = operator.weightedMajorantCompiler;
    expect(compiler.exactFiniteOffsetColumns.S02).toContain(
      "for_n>=4_S02[n-4,n]=1/(2*(n-1))",
    );
    expect(compiler.exactFiniteOffsetColumns.D02).toContain(
      "for_n>=3_D02[n-3,n]=-2",
    );
    expect(compiler.exactFiniteOffsetColumns.D202).toContain(
      "for_n>=2_D202[n-2,n]=8*n",
    );
    expect(compiler.Z0Compiler.cancellation).toContain("exact_zero");
    expect(compiler.Z0Compiler.supremum).toContain("n>=513");
    expect(compiler.Z0Compiler.failure).toContain("no_sampling");
    expect(compiler.Z1Compiler.explicitPairs).toContain("j,k=0..512");
    expect(compiler.Z1Compiler.infinitePairs).toContain("above_512");
    expect(compiler.Z1Compiler.M2Upper).toContain("nine_blockUpper");
    expect(compiler.Z1Compiler.Z1Upper).toBe("RNDU(ANormUpper*M2Upper)");
    expect(compiler.Z1Compiler.pairSuprema).toContain(
      "finite-infinite_and_infinite-finite",
    );
    expect(
      compiler.Z1Compiler.infiniteInfiniteAbsoluteDifferenceHandling,
    ).toContain("abs(j-k)");
  });

  it("mechanically exercises finite-offset, product, and discrete-supremum formulas", () => {
    const s02n4 = [
      rational(1n, 10n),
      subtract(rational(-1n, 10n), rational(1n, 6n)),
      rational(1n, 6n),
    ];
    expect(equal(s02n4[1], rational(-4n, 15n))).toBe(true);
    expect(equal(add(add(s02n4[0], s02n4[1]), s02n4[2]), rational(0n))).toBe(
      true,
    );

    const productUnit = (j: number, k: number): Map<number, Rational> => {
      const output = new Map<number, Rational>();
      for (const mode of [j + k, Math.abs(j - k)]) {
        output.set(
          mode,
          add(output.get(mode) ?? rational(0n), rational(1n, 2n)),
        );
      }
      return output;
    };
    expect(productUnit(2, 3)).toEqual(
      new Map([
        [5, rational(1n, 2n)],
        [1, rational(1n, 2n)],
      ]),
    );
    expect(productUnit(0, 3)).toEqual(new Map([[3, rational(1n)]]));

    const forwardDifferenceNumerator = (n: bigint): bigint =>
      -4n * n * n + 260n * n + 468n;
    expect(forwardDifferenceNumerator(66n) > 0n).toBe(true);
    expect(forwardDifferenceNumerator(67n) < 0n).toBe(true);
    expect(-8n * 67n + 260n < 0n).toBe(true);
    const f67 = rational(34n, BigInt(2 * 68 * 137));
    expect(equal(f67, rational(1n, 548n))).toBe(true);
  });

  it("registers every truncation remainder explicitly and forbids generic epsilon", () => {
    const registry = operator.truncationRemainderRegistry;
    expect(registry.requiredNamedRemaindersInOrder).toEqual([
      "projection_mode_tail",
      "Chebyshev_product_tail",
      "C1_lift_tail",
      "ultraspherical_conversion_tail",
      "polynomial_band_crossing_tail",
      "preconditioner_tail",
      "mass_integral_cell_remainder",
      "origin_value_tail",
      "origin_first_derivative_tail",
      "origin_second_derivative_tail",
    ]);
    for (const id of registry.requiredNamedRemaindersInOrder) {
      expect(registry.formulas).toHaveProperty(id);
    }
    expect(registry.unregisteredRemainderOrGenericEpsilonAllowed).toBe(false);
    expect(registry.doubleCountingAllowed).toBe(false);
  });

  it("does not promote the projected contraction over the six omitted raw modes", () => {
    expect(operator.scopeBoundary.projectedContractionImpliesFullRawPde).toBe(
      false,
    );
    expect(operator.scopeBoundary.omittedRawModes).toEqual([
      "S_C2[0]",
      "S_C2[1]",
      "P_C2[0]",
      "P_C2[1]",
      "P_C2[2]",
      "P_C2[3]",
    ]);
    expect(
      operator.scopeBoundary.omittedRawModesRequiredAsSeparateWholeBallDuties,
    ).toBe(true);
    expect(
      operator.exteriorOperatorClosure.projectedAndRawDutySeparation
        .rawDutyAcceptance,
    ).toContain("contain_zero");
    expect(
      operator.scopeBoundary.fullRawAndGlobalDutyBoundary
        .exactPdeZeroConclusionAllowed,
    ).toBe(false);
    expect(
      operator.scopeBoundary.fullRawAndGlobalDutyBoundary
        .dutiesAfterProjectedRadiusSelection,
    ).toContain(
      "virial_eigenvalue_Poisson_energy_and_Gauss_flux_interval_identities",
    );
  });

  it("keeps all implementation, execution, lamp, and physical authority false", () => {
    expect(
      Object.values(operator.unresolved).every((value) => value === null),
    ).toBe(true);
    expect(
      Object.values(operator.authorityLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(operator.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(operator.completionBoundary.implementationComplete).toBe(false);
    expect(operator.completionBoundary.runtimeClosureComplete).toBe(false);
    expect(operator.completionBoundary.executionAuthorized).toBe(false);
    expect(operator.completionBoundary.executionObserved).toBe(false);
    expect(operator.completionBoundary.seedAccepted).toBe(false);
  });

  it("is deeply frozen and identity-authoritative", () => {
    expect(Object.isFrozen(operator)).toBe(true);
    expect(Object.isFrozen(operator.originOperatorClosure)).toBe(true);
    expect(Object.isFrozen(operator.weightedMajorantCompiler.Z1Compiler)).toBe(
      true,
    );
    expect(
      isNhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1(operator),
    ).toBe(true);
    expect(
      isNhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1(
        clone(operator),
      ),
    ).toBe(false);
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        clone(operator),
      ),
    ).toEqual([
      "spherical_seed_directed_proof_operator_external_copy_not_authoritative",
    ]);
  });

  it("has stable canonical hash arithmetic and a fail-fast literal self-seal", () => {
    const digest = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(digest).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    ).toMatch(/^[0-9a-f]{64}$/);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_LITERAL_SEAL_STATUS,
    ).toContain("without_execution_authority");
  });

  it("rejects hostile noncanonical values fail-closed", () => {
    expect(
      operator.hostileCanonicalValidation.maximumPropertyKeyUtf8Bytes,
    ).toBe(4096);
    expect(operator.hostileCanonicalValidation.maximumAggregateUtf8Bytes).toBe(
      262144,
    );
    expect(operator.completionBoundary.hostileCanonicalUtf8BudgetsClosed).toBe(
      true,
    );
    const semantic = clone(operator) as Record<string, unknown>;
    semantic.maturity = "changed";
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        semantic,
      ),
    ).toEqual(["spherical_seed_directed_proof_operator_semantic_mismatch"]);

    const negativeZero = clone(operator) as Record<string, unknown>;
    negativeZero.bad = -0;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        negativeZero,
      )[0],
    ).toContain("invalid_number");

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        cyclic,
      )[0],
    ).toContain("cycle");

    const proxy = new Proxy({}, {});
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        proxy,
      )[0],
    ).toContain("proxy_forbidden");

    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, "x", {
      enumerable: true,
      get: () => operator,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        accessor,
      )[0],
    ).toContain("object_property_surface");

    const oversizedString = { x: "x".repeat(65537) };
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        oversizedString,
      )[0],
    ).toContain("string_byte_limit");

    const oversizedKey: Record<string, unknown> = {};
    Object.defineProperty(oversizedKey, "é".repeat(2049), {
      value: 1,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        oversizedKey,
      )[0],
    ).toContain("property_key_byte_limit");

    const aggregateUtf8 = {
      a: "a".repeat(65536),
      b: "b".repeat(65536),
      c: "c".repeat(65536),
      d: "d".repeat(65536),
      e: "e".repeat(65536),
    };
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        aggregateUtf8,
      )[0],
    ).toContain("snapshot_aggregate_utf8_byte_limit");

    const nonPlain = Object.create(null) as Record<string, unknown>;
    nonPlain.x = 1;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofOperatorV1Violations(
        nonPlain,
      )[0],
    ).toContain("non_plain_object");
  });
});
