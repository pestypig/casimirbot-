import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2SiOutputNormalization,
  isNhm2SphericalBosonStarV2SiOutputNormalizationV1,
  nhm2SphericalBosonStarV2SiOutputNormalizationViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v1";

const clone = (): any => cloneNhm2SphericalBosonStarV2SiOutputNormalization();

type PositiveDyadic = Readonly<{
  mantissa: bigint;
  exponent2: number;
}>;

const positiveDyadic = (
  mantissaLowercaseHex: string,
  exponent2: number,
): PositiveDyadic => ({
  mantissa: BigInt(`0x${mantissaLowercaseHex}`),
  exponent2,
});

const positiveF64DyadicFromBigEndianHex = (
  bigEndianHex: string,
): PositiveDyadic => {
  const bits = BigInt(`0x${bigEndianHex}`);
  if (bits >> 63n !== 0n) throw new Error("negative_f64_witness");
  const exponentField = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (exponentField === 0x7ff) throw new Error("nonfinite_f64_witness");
  if (exponentField === 0) {
    return fraction === 0n
      ? { mantissa: 0n, exponent2: 0 }
      : { mantissa: fraction, exponent2: -1_074 };
  }
  return {
    mantissa: (1n << 52n) | fraction,
    exponent2: exponentField - 1_023 - 52,
  };
};

const alignedPositiveDyadics = (
  left: PositiveDyadic,
  right: PositiveDyadic,
) => {
  const exponent2 = Math.min(left.exponent2, right.exponent2);
  return {
    leftMantissa: left.mantissa << BigInt(left.exponent2 - exponent2),
    rightMantissa: right.mantissa << BigInt(right.exponent2 - exponent2),
    exponent2,
  } as const;
};

const comparePositiveDyadics = (
  left: PositiveDyadic,
  right: PositiveDyadic,
): -1 | 0 | 1 => {
  const aligned = alignedPositiveDyadics(left, right);
  return aligned.leftMantissa < aligned.rightMantissa
    ? -1
    : aligned.leftMantissa > aligned.rightMantissa
      ? 1
      : 0;
};

const subtractPositiveDyadics = (
  left: PositiveDyadic,
  right: PositiveDyadic,
): PositiveDyadic => {
  const aligned = alignedPositiveDyadics(left, right);
  if (aligned.leftMantissa < aligned.rightMantissa) {
    throw new Error("negative_dyadic_difference");
  }
  return {
    mantissa: aligned.leftMantissa - aligned.rightMantissa,
    exponent2: aligned.exponent2,
  };
};

describe("spherical boson-star v2 SI output normalization", () => {
  it("exact-binds the candidate freeze and the unmodified CODATA registry bytes", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING_PINS,
    ).toEqual({
      candidateFreezeSha256:
        "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
      candidateFreezeCanonicalSizeBytes: 55_997,
      codata2022RawSha256:
        "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
      codata2022RawSizeBytes: 6_180,
    });

    const raw = readFileSync(
      resolve(process.cwd(), "configs/constants/codata-2022.v1.json"),
    );
    expect(raw.byteLength).toBe(6_180);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(
      "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61",
    );
    const binding =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.exactBindings
        .constantsRegistryRawBytes;
    expect(
      binding.rawBytesAreAuthorityNotAParsedAndReserializedProjection,
    ).toBe(true);
    expect(binding.serverMustRehashExactRawBytesBeforeScientificPreseal).toBe(
      true,
    );
  });

  it("freezes the exact candidate coupling and derives the SI scales dimensionally", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;
    expect(contract.candidateIdentity.candidateId).toBe(
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1",
    );
    expect(contract.candidateIdentity.dimensionlessCoupling).toMatchObject({
      definitionNaturalUnits: "g=8*pi*G_nat*mu_nat^2",
      exact: "2^-40",
      dyadicMantissa: "1",
      dyadicExponent2: -40,
    });
    expect(contract.dimensionalDerivation.couplingReintroduction).toBe(
      "g=8*pi*G_SI*mu_E^2/(hbar*c^5)=2^-40",
    );
    expect(contract.dimensionalDerivation.massEnergyScale).toBe(
      "mu_E=sqrt(g*hbar*c^5/(8*pi*G_SI))",
    );
    expect(contract.dimensionalDerivation.inverseLengthScale).toBe(
      "mu_L=mu_E/(hbar*c)=sqrt(g*c^3/(8*pi*G_SI*hbar))",
    );
    expect(contract.dimensionalDerivation.stressScalePrimary).toBe(
      "stressScale_J_m3=c^4*mu_L^2/(8*pi*G_SI)",
    );
    expect(contract.dimensionalDerivation.stressScaleClosed).toBe(
      "stressScale_J_m3=g*c^7/((8*pi*G_SI)^2*hbar)",
    );
    expect(contract.dimensionalDerivation.noiseScale).toBe(
      "noiseScale_(J_m3)^2=stressScale_J_m3^2",
    );
    expect(contract.dimensionalDerivation.dimensionalChecks).toEqual({
      muE: "J",
      muL: "m^-1",
      stressScale: "J/m^3",
      noiseScale: "(J/m^3)^2",
    });
    expect(contract.candidateIdentity.declaredLeverTensorUsed).toBe(false);
    expect(contract.candidateIdentity.declaredTileTensorUsed).toBe(false);
  });

  it("uses exact c and h, derives hbar from directed pi, and keeps G uncertain", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;
    expect(contract.constants.speedOfLight).toMatchObject({
      exactDecimal: "299792458",
      exactBySI: true,
    });
    expect(contract.constants.planckConstant).toMatchObject({
      exactDecimal: "6.62607015e-34",
      exactBySI: true,
    });
    expect(contract.constants.reducedPlanckConstant.formula).toBe("h/(2*pi)");
    expect(
      contract.constants.reducedPlanckConstant.exactConfigDecimalUsedAsInput,
    ).toBe(false);
    expect(contract.constants.newtonianConstant).toMatchObject({
      centralDecimal: "6.67430e-11",
      parentheticalNotation: "6.67430(15)e-11",
      standardUncertaintyDecimal: "1.5e-15",
      sourceUncertaintyKind: "one_sigma_standard_uncertainty",
      exact: false,
    });
    expect(
      contract.constants.newtonianConstant
        .configRelativeUncertaintyIsRoundedMetadataNotEndpointAuthority,
    ).toBe(true);
    expect(contract.decimalAndPiInterpretation.pi).toMatchObject({
      implementationPrimitive: "MPFR_mpfr_const_pi",
      lowerConstruction: "mpfr_const_pi(destination,MPFR_RNDD)",
      upperConstruction: "mpfr_const_pi(destination,MPFR_RNDU)",
      centralConstruction: "mpfr_const_pi(destination,MPFR_RNDN)",
      MathPIAllowed: false,
      decimalPiLiteralAllowed: false,
    });
    expect(
      contract.decimalAndPiInterpretation
        .noBinary64OrJavaScriptNumberIntermediate,
    ).toBe(true);
  });

  it("separates the quoted one-sigma interval from the frozen k=2 admission envelope", () => {
    const policy =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.uncertaintyPolicy;
    expect(policy.sourceStandardUncertainty).toEqual({
      coverageFactorExact: "1",
      GIntervalExactDecimal: ["6.67415e-11", "6.67445e-11"],
      role: "reported_one_sigma_scale_sensitivity_only",
    });
    expect(policy.admissionEnclosure).toMatchObject({
      policyId: "codata_standard_uncertainty_expanded_k2/v1",
      coverageFactorExact: "2",
      GIntervalExactDecimal: ["6.67400e-11", "6.67460e-11"],
      approximately95PercentUnderUsualExpandedUncertaintyInterpretation: true,
      rigorousProbabilityOrHardPhysicalBoundClaim: false,
      statisticalTailsOutsideFiniteIntervalExcludedByTheSourceData: false,
      mayBeCalledExact95PercentConfidenceInterval: false,
      physicalClaimUnlockAllowed: false,
    });
    expect(policy.centralValueMayBeTreatedAsExact).toBe(false);
    expect(policy.oneSigmaIntervalMayReplaceK2AdmissionInterval).toBe(false);
    expect(
      policy.configRoundedRelativeUncertaintyMayReplaceParentheticalUncertainty,
    ).toBe(false);
    expect(policy.widerOrNarrowerPostObservationEnvelopeAllowed).toBe(false);
  });

  it("freezes the full MPFR256 RNDD/RNDU interval graph and RNDN representative graph", () => {
    const context =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.mpfr256Context;
    expect(context).toMatchObject({
      precisionBitsForEveryDestination: 256,
      exponentMinimum: -1_000_000,
      exponentMaximum: 1_000_000,
      lowerRoundingMode: "MPFR_RNDD",
      upperRoundingMode: "MPFR_RNDU",
      centralRoundingMode: "MPFR_RNDN",
      primitiveOperationReassociationAllowed: false,
      fusedMultiplyAddSubstitutionAllowed: false,
      extendedOrReducedPrecisionAllowed: false,
      dedicatedSinglePurposeProcessRequired: true,
      concurrentMutationOfMpfrGlobalExponentRangeAllowed: false,
      scaleGraphNodeCount: 49,
      centralRepresentativeGraphNodeCount: 27,
    });
    expect(context.scaleGraphOrder).toHaveLength(49);
    expect(context.scaleGraphOrder[0]).toBe("01_g=dyadic(1,-40)");
    expect(context.scaleGraphOrder[7]).toBe("08_hbar=divPos(h,twoPi)");
    expect(context.scaleGraphOrder[31]).toBe(
      "32_stressScaleCentral=divPos(gC7,eightPiGCentralSquaredHbar)",
    );
    expect(context.scaleGraphOrder[32]).toBe(
      "33_noiseScaleCentral=squarePos(stressScaleCentral)",
    );
    expect(context.scaleGraphOrder[48]).toBe(
      "49_noiseScaleAdmissionK2=squarePos(stressScaleAdmissionK2)",
    );
    expect(context.centralRepresentativeGraphOrder).toHaveLength(27);
    expect(context.centralRepresentativeGraphOrder[25]).toBe(
      "26_stressScaleN=mpfr_div(gC7N,eightPiG2HbarN,MPFR_RNDN)",
    );
    expect(context.centralRepresentativeGraphOrder[26]).toBe(
      "27_noiseScaleN=mpfr_mul(stressScaleN,stressScaleN,MPFR_RNDN)",
    );
    expect(context.intervalPrimitives.generalMultiply).toContain(
      "all_eight_products_evaluated_fresh_in_order_ac_ad_bc_bd",
    );
    expect(context.intervalPrimitives.exactUnsignedInteger).toContain(
      "allocate_distinct_fresh_lower_then_upper_MPFR256_destinations",
    );
    expect(context.intervalPrimitives.exactUnsignedInteger).not.toContain(
      "same_handle",
    );
    expect(context.intervalPrimitives.exactDyadic).toContain(
      "allocate_distinct_fresh_mantissa_then_lower_then_upper_MPFR256_destinations",
    );
    expect(context.intervalPrimitives.exactDyadic).not.toContain(
      "used_as_both_endpoints",
    );
    expect(context.exactEndpointConstructionOrder.exactUnsignedInteger).toEqual(
      [
        "01_allocate_fresh_MPFR256_lower_destination",
        "02_allocate_fresh_MPFR256_upper_destination",
        "03_require_lower_and_upper_storage_identity_distinct",
        "04_lower_ternary=mpfr_set_ui(lower,n,MPFR_RNDN)",
        "05_require_lower_ternary_equal_zero_and_lower_exact",
        "06_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
        "07_require_upper_ternary_equal_zero_and_upper_exact",
        "08_require_mpfr_equal_p(lower,upper)_and_no_endpoint_alias",
      ],
    );
    expect(context.exactEndpointConstructionOrder.exactDyadic).toHaveLength(11);
    expect(
      context.exactEndpointConstructionOrder.exactDyadic.slice(4, 9),
    ).toEqual([
      "05_mantissa_ternary=mpfr_set_z(mantissa,m,MPFR_RNDN)",
      "06_require_mantissa_ternary_equal_zero_and_integer_exact",
      "07_lower_ternary=mpfr_mul_2si(lower,mantissa,e2,MPFR_RNDN)",
      "08_require_lower_ternary_equal_zero_and_dyadic_exact",
      "09_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
    ]);
    expect(context.endpointAliasingAllowed).toBe(false);
    expect(context.exactEndpointEqualityMayUseSharedStorageIdentity).toBe(
      false,
    );
    expect(context.endpointStorageIdentityCheckedBeforeFirstWrite).toBe(true);
    expect(context.requireCentralViaMuAndClosedStressIntervalsOverlap).toBe(
      true,
    );
    expect(
      context.unresolvedIntervalEndpointOrderOrRoundingModeBlocksExecution,
    ).toBe(true);
  });

  it("freezes scale application order, units, uncertainty propagation, and once-only barriers", () => {
    const scaling =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.outputScaling;
    expect(scaling.scientificInputRoleOrder).toEqual([
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
    ]);
    expect(scaling.rawOutputFamilyOrder).toEqual([
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
      "smearing_weights",
      "constraint_operand.level_0_then_level_1_then_level_2",
    ]);
    expect(scaling.mappings.map((entry) => entry.role)).toEqual([
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "smearing_weights",
      "constraint_operand.*",
    ]);
    expect(
      scaling.mappings
        .filter(
          (entry) =>
            entry.elementProgramId === "paired_central_and_uncertainty_hull",
        )
        .map((entry) => entry.role),
    ).toEqual([
      "metric_demand_absolute_error_bound",
      "mean_rset_absolute_uncertainty95",
      "noise_kernel_absolute_uncertainty95",
    ]);
    expect(
      scaling.mappings
        .filter(
          (entry) =>
            entry.elementProgramId === "paired_central_and_uncertainty_hull",
        )
        .every(
          (entry) =>
            "pairedCentralRole" in entry && entry.pairedCentralRole != null,
        ),
    ).toBe(true);
    expect(
      scaling.mappings.find((entry) => entry.role === "mean_rset"),
    ).toMatchObject({
      outputUnit: "J/m^3",
      centralScaleId: "stressScaleN",
      admissionScaleIntervalId: "stressScaleAdmissionK2",
      elementProgramId: "central_scaled_value",
      pairedUncertaintyRole: "mean_rset_absolute_uncertainty95",
    });
    expect(
      scaling.mappings.find(
        (entry) => entry.role === "noise_kernel_absolute_uncertainty95",
      ),
    ).toMatchObject({
      outputUnit: "(J/m^3)^2",
      centralScaleId: null,
      admissionScaleIntervalId: "noiseScaleAdmissionK2",
      elementProgramId: "paired_central_and_uncertainty_hull",
      pairedCentralRole: "noise_kernel",
    });
    expect(scaling.uncertaintyElementProgram).toContain(
      "reinject_the_exact_already_serialized_paired_centralF64_bits_as_the_distance_center",
    );
    expect(scaling.uncertaintyElementProgram).toContain(
      "require_the_emitted_uncertaintyF64_to_enclose_both_distances",
    );
    expect(scaling.centralElementOperationOrder).toHaveLength(7);
    expect(scaling.centralElementOperationOrder[4]).toBe(
      "05_centralF64=the_only_mpfr_get_d(centralProduct,MPFR_RNDN)_for_this_central_output_element",
    );
    expect(scaling.uncertaintyElementOperationOrder).toHaveLength(17);
    expect(scaling.uncertaintyElementOperationOrder.slice(6, 16)).toEqual([
      "07_read_the_exact_already_serialized_paired_centralF64_bit_pattern_without_a_second_central_conversion",
      "08_inject_paired_centralF64_as_an_exact_binary64_dyadic_into_fresh_MPFR256_serializedCenter_without_rounding",
      "09_require_scaledHull.lower_less_than_or_equal_to_serializedCenter_less_than_or_equal_to_scaledHull.upper",
      "10_lowerDistanceUpper=mpfr_sub(serializedCenter,scaledHull.lower,MPFR_RNDU)",
      "11_upperDistanceUpper=mpfr_sub(scaledHull.upper,serializedCenter,MPFR_RNDU)",
      "12_maxDistanceUpper=the_larger_of_lowerDistanceUpper_and_upperDistanceUpper_with_lower_selected_on_exact_tie_and_no_arithmetic",
      "13_uncertaintyF64=the_only_mpfr_get_d(maxDistanceUpper,MPFR_RNDU)_for_this_uncertainty_output_element",
      "14_reject_nonfinite_negative_or_negative_zero_uncertaintyF64",
      "15_reinject_uncertaintyF64_as_an_exact_binary64_dyadic_into_fresh_MPFR256_serializedUncertainty_without_rounding",
      "16_require_serializedUncertainty_greater_than_or_equal_to_lowerDistanceUpper_and_upperDistanceUpper",
    ]);
    expect(
      scaling.pairedCentralSerializedF64IsTheOnlyUncertaintyDistanceCenter,
    ).toBe(true);
    expect(scaling.unroundedMpfrCentralProductMayCenterOutputUncertainty).toBe(
      false,
    );
    expect(scaling.secondCentralMpfrGetDInsideUncertaintyProgramAllowed).toBe(
      false,
    );
    expect(scaling.terminalCenterRoundingMayBeOmittedFromByteEnclosure).toBe(
      false,
    );
    expect(scaling.byteLevelEnclosurePostcondition).toBe(
      "exactMPFR(serialized_uncertainty_f64)>=max(serialized_center_f64_exactMPFR-scaled_hull_lower,scaled_hull_upper-serialized_center_f64_exactMPFR)",
    );
    expect(
      scaling.byteLevelEnclosurePostconditionCheckedBeforeUncertaintySerialization,
    ).toBe(true);
    expect(scaling.standaloneAbsoluteErrorScalingAllowed).toBe(false);
    expect(
      scaling.uncertaintyMustIncludeBothDimensionlessAndK2NormalizationContributions,
    ).toBe(true);
    expect(scaling.exactlyOneTerminalBinary64BarrierPerScaledElement).toBe(
      true,
    );
    expect(scaling.intermediateBinary64ScaleOrProductAllowed).toBe(false);
    expect(scaling.scaleBarrierBeforeElementMultiplicationAllowed).toBe(false);
    expect(
      scaling.submittedSIBytesMayBeTrustedWithoutServerReplayOfThisGraph,
    ).toBe(false);
  });

  it("regresses the MPFR256 0.7/u=0 byte-centered enclosure counterexample exactly", () => {
    // Reference vector reproduced with GNU MPFR 4.2.2, precision 256, the
    // contract's exact RNDD/RNDU/RNDN graph, and no binary64 intermediate.
    const witness = {
      inputCentralF64BigEndianHex: "3fe6666666666666",
      inputUncertaintyF64BigEndianHex: "0000000000000000",
      scaledHullLower: positiveDyadic(
        "da980d99860fdab218800f9a7568325d6e7935f81762dee36df5bb8de3f96c16",
        72,
      ),
      scaledHullUpper: positiveDyadic(
        "daa21d857703cee9103f2246627990de0a7adf6e7c4881e41bd16e6e86e2441b",
        72,
      ),
      serializedCentralF64BigEndianHex: "546b53a2af2870e6",
      legacyUnroundedCenterUncertaintyF64BigEndianHex: "53942030cdf27a27",
      greatestF64BelowRequiredByteCenteredUncertaintyBigEndianHex:
        "53942030cdf27ba4",
      repairedByteCenteredUncertaintyF64BigEndianHex: "53942030cdf27ba5",
    } as const;

    const input = positiveF64DyadicFromBigEndianHex(
      witness.inputCentralF64BigEndianHex,
    );
    const inputUncertainty = positiveF64DyadicFromBigEndianHex(
      witness.inputUncertaintyF64BigEndianHex,
    );
    expect(input).toEqual({
      mantissa: 0x16666666666666n,
      exponent2: -53,
    });
    expect(inputUncertainty.mantissa).toBe(0n);

    const serializedCenter = positiveF64DyadicFromBigEndianHex(
      witness.serializedCentralF64BigEndianHex,
    );
    expect(
      comparePositiveDyadics(serializedCenter, witness.scaledHullLower),
    ).toBeGreaterThanOrEqual(0);
    expect(
      comparePositiveDyadics(serializedCenter, witness.scaledHullUpper),
    ).toBeLessThanOrEqual(0);

    const lowerDistance = subtractPositiveDyadics(
      serializedCenter,
      witness.scaledHullLower,
    );
    const upperDistance = subtractPositiveDyadics(
      witness.scaledHullUpper,
      serializedCenter,
    );
    const requiredByteCenteredUncertainty =
      comparePositiveDyadics(lowerDistance, upperDistance) >= 0
        ? lowerDistance
        : upperDistance;
    expect(comparePositiveDyadics(upperDistance, lowerDistance)).toBe(1);

    const legacyUncertainty = positiveF64DyadicFromBigEndianHex(
      witness.legacyUnroundedCenterUncertaintyF64BigEndianHex,
    );
    expect(
      comparePositiveDyadics(
        legacyUncertainty,
        requiredByteCenteredUncertainty,
      ),
    ).toBe(-1);

    const greatestF64BelowRequired = positiveF64DyadicFromBigEndianHex(
      witness.greatestF64BelowRequiredByteCenteredUncertaintyBigEndianHex,
    );
    expect(
      comparePositiveDyadics(
        greatestF64BelowRequired,
        requiredByteCenteredUncertainty,
      ),
    ).toBe(-1);

    const repairedUncertainty = positiveF64DyadicFromBigEndianHex(
      witness.repairedByteCenteredUncertaintyF64BigEndianHex,
    );
    expect(
      comparePositiveDyadics(
        repairedUncertainty,
        requiredByteCenteredUncertainty,
      ),
    ).toBeGreaterThanOrEqual(0);
    expect(
      comparePositiveDyadics(repairedUncertainty, lowerDistance),
    ).toBeGreaterThanOrEqual(0);
    expect(
      comparePositiveDyadics(repairedUncertainty, upperDistance),
    ).toBeGreaterThanOrEqual(0);
  });

  it("requires source-disjoint materialization receipts and leaves their tolerances unresolved", () => {
    const receipt =
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION.scaleMaterializationReceiptSchema;
    expect(receipt.materialized).toBe(false);
    expect(receipt.receipt).toBeNull();
    expect(receipt.requiredScaleIdsInOrder).toHaveLength(13);
    expect(receipt.primaryAndIndependentReceiptsRequired).toBe(true);
    expect(
      receipt.primaryAndIndependentSourceDependencyExecutableRootsMustBeDisjoint,
    ).toBe(true);
    expect(receipt.roundingAuditBound).toBeNull();
    expect(receipt.unresolvedRoundingAuditBoundBlocksExecution).toBe(true);
  });

  it("fails closed without retuning and keeps every result, lamp, and physical claim locked", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;
    expect(
      contract.failurePolicy
        .anyConstantHashIntervalEndpointRoundingFlagUnitOrBarrierMismatch,
    ).toBe(
      "fail_this_v2_candidate_before_or_during_execution_without_retuning",
    );
    expect(
      contract.failurePolicy.postObservationCoverageFactorChangeAllowed,
    ).toBe(false);
    expect(contract.completion.directedMpfr256GraphFrozen).toBe(true);
    expect(contract.completion.scaleEndpointsMaterialized).toBe(false);
    expect(
      contract.completion.normalizationScientificInputContentComplete,
    ).toBe(false);
    expect(contract.completion.candidateExecutionMayStart).toBe(false);
    expect(contract.materialization.result).toBeNull();
    expect(contract.materialization.lamps).toBeNull();
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_AUTHORITY_LOCKS,
      ).every((value) => value === false || value === null),
    ).toBe(true);
    expect(contract.authorityLocks.physicalViability).toBe(false);
    expect(contract.authorityLocks.propulsion).toBe(false);
    expect(contract.authorityLocks.transport).toBe(false);
  });

  it("is recursively frozen and sealed to literal canonical bytes", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION;
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.mpfr256Context.scaleGraphOrder)).toBe(true);
    expect(Object.isFrozen(contract.outputScaling.mappings[0])).toBe(true);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    ).toMatchObject({
      candidateId:
        "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1",
      sha256: NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_SIZE_BYTES,
      mediaType: "application/json",
    });
  });

  it("accepts only the exact bounded canonical JSON descriptor", () => {
    expect(
      isNhm2SphericalBosonStarV2SiOutputNormalizationV1(
        NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_CANONICAL_JSON,
      ),
    ).toBe(true);
    const changed = clone();
    changed.uncertaintyPolicy.admissionEnclosure.coverageFactorExact = "1";
    const changedWire = JSON.stringify(changed);
    expect(isNhm2SphericalBosonStarV2SiOutputNormalizationV1(changedWire)).toBe(
      false,
    );
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations(changedWire),
    ).toEqual(["spherical_v2_si_output_normalization_semantic_drift"]);
  });

  it("rejects non-string objects before proxy traps or accessors", () => {
    let trapCount = 0;
    const hostile = new Proxy(Object.create(null), {
      get: () => {
        trapCount += 1;
        throw new Error("get_trap");
      },
      getOwnPropertyDescriptor: () => {
        trapCount += 1;
        throw new Error("descriptor_trap");
      },
      getPrototypeOf: () => {
        trapCount += 1;
        throw new Error("prototype_trap");
      },
      ownKeys: () => {
        trapCount += 1;
        throw new Error("own_keys_trap");
      },
    });
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations(hostile),
    ).toEqual(["canonical_json_text_required"]);

    let invoked = false;
    const accessor = Object.create(null);
    Object.defineProperty(accessor, "wire", {
      enumerable: true,
      get: () => {
        invoked = true;
        throw new Error("accessor_trap");
      },
    });
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations(accessor),
    ).toEqual(["canonical_json_text_required"]);
    expect(trapCount).toBe(0);
    expect(invoked).toBe(false);
  });

  it("rejects non-string values and pre-bounds canonical text", () => {
    for (const value of [null, Number.NaN, -0, 1n, new String("wire")]) {
      expect(
        nhm2SphericalBosonStarV2SiOutputNormalizationViolations(value),
      ).toEqual(["canonical_json_text_required"]);
    }
    const excessiveCodeUnits = "x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_VALIDATOR_LIMITS.maximumAggregateUtf8Bytes +
        1,
    );
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations(
        excessiveCodeUnits,
      ),
    ).toEqual(["canonical_json_code_unit_limit"]);

    const excessiveUtf8 = "\u0800".repeat(400_000);
    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations(excessiveUtf8),
    ).toEqual(["canonical_json_utf8_byte_limit"]);

    expect(
      nhm2SphericalBosonStarV2SiOutputNormalizationViolations("{}"),
    ).toEqual(["spherical_v2_si_output_normalization_semantic_drift"]);
  });
});
