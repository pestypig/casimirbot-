import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
} from "../shared/contracts/nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2RenormalizationCounterterms,
  isNhm2SphericalBosonStarV2RenormalizationCountertermsV1,
  nhm2SphericalBosonStarV2RenormalizationCountertermsViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-renormalization-counterterms.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-renormalization-prescription.v1";

const deepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor == null ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "object" ||
        descriptor.value == null
        ? true
        : deepFrozen(descriptor.value, seen);
    })
  );
};

const f64HexBigEndian = (value: number): string => {
  const bytes = Buffer.allocUnsafe(8);
  bytes.writeDoubleBE(value, 0);
  return `0x${bytes.toString("hex")}`;
};

describe("NHM2 spherical boson-star v2 renormalization counterterms v1", () => {
  it("has stable canonical bytes, a domain-separated digest and a hostile singleton validator", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256,
    ).toBe("ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_SIZE_BYTES,
    ).toBe(10182);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_SHA256);
    expect(
      isNhm2SphericalBosonStarV2RenormalizationCountertermsV1(
        cloneNhm2SphericalBosonStarV2RenormalizationCounterterms(),
      ),
    ).toBe(true);
    expect(
      deepFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS),
    ).toBe(true);
  });

  it("exact-pins the candidate plan, v2 freeze, branch BVP, prescription and base DAG", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_BINDING_PINS;
    expect(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256).toBe(
      pins.sourceCandidatePlanSha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
    ).toBe(pins.sourceCandidatePlanCanonicalSizeBytes);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256).toBe(
      pins.v2CandidateFreezeSha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
    ).toBe(pins.v2CandidateFreezeCanonicalSizeBytes);
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256).toBe(
      pins.branchBvpSha256,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES).toBe(
      pins.branchBvpCanonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
    ).toBe(pins.renormalizationPrescriptionSha256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
    ).toBe(pins.renormalizationPrescriptionCanonicalSizeBytes);
    expect(NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256).toBe(
      pins.scienceDerivationDagSha256,
    );
  });

  it("binds counterterms to prescription in only one direction", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
    expect(
      contract.exactUpstreamPins.renormalizationPrescription,
    ).toMatchObject({
      inputId: "renormalization_prescription",
      sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
      role: "one_way_exact_prescription_dependency",
    });
    expect(contract.dependencyDirection).toEqual({
      countertermsImportAndExactBindPrescription: true,
      prescriptionImportsOrBindsCounterterms: false,
      reverseDependencyAllowed: false,
      dependencyCycleAllowed: false,
    });
  });

  it("adds the two missing dependency edges without mutating or authorizing the base DAG", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY,
    ).toEqual([
      {
        from: "renormalization_prescription",
        to: "renormalization_counterterms",
        relation: "prescription_defines_counterterm_convention",
      },
      {
        from: "finite_renormalization_freedom",
        to: "renormalization_counterterms",
        relation: "finite_freedom_selects_counterterm_coefficients",
      },
    ]);
    for (const overlay of NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_DAG_EDGE_OVERLAY) {
      expect(
        NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.some(
          (base) => base.from === overlay.from && base.to === overlay.to,
        ),
      ).toBe(false);
    }
    expect(contract.additiveDerivationDagOverlay).toMatchObject({
      baseDagSha256: NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
      baseDagMutated: false,
      overlayOnly: true,
      edgeCount: 2,
      overlayGrantsDerivationOrExecutionAuthority: false,
      futureClosureArtifactMustBindBaseDagAndOverlayBytes: true,
    });
  });

  it("freezes the four-element finite basis and four-dimensional Gauss-Bonnet reduction", () => {
    const basis =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS.finiteBasis;
    expect(basis.orderedBasisNames).toEqual(["mu4_g", "mu2_G", "H1", "H2"]);
    expect(
      basis.entries.map(({ name, coefficientSymbol }) => ({
        name,
        coefficientSymbol,
      })),
    ).toEqual([
      { name: "mu4_g", coefficientSymbol: "cLambda" },
      { name: "mu2_G", coefficientSymbol: "cG" },
      { name: "H1", coefficientSymbol: "c1" },
      { name: "H2", coefficientSymbol: "c2" },
    ]);
    expect(basis.entries[2].tensorFormula).toBe(
      "H1_ab=2*nabla_a*nabla_b(R)-2*R*R_ab+g_ab*(-2*Box(R)+R^2/2)",
    );
    expect(basis.entries[3].tensorFormula).toBe(
      "H2_ab=nabla_a*nabla_b(R)-Box(R_ab)-2*R^cd*R_cadb+g_ab*(-Box(R)/2+R_cd*R^cd/2)",
    );
    expect(basis.gaussBonnetIdentity).toBe("H1_ab-4*H2_ab+H3_ab=0");
    expect(basis.eliminatedTensor).toBe("H3");
    expect(basis.unnamedOrProducerSelectedBasisTermsAllowed).toBe(false);
  });

  it("pins cLambda exactly and in binary64 while fixing cG=c1=c2=0", () => {
    const coefficients =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS.frozenCoefficients;
    expect(coefficients.cLambda).toEqual({
      exactExpression: "2*(2*gamma_E-ln(2)-7/4)/(3*(4*pi)^2)",
      f64Value: -0.005440592307388723,
      f64HexBigEndian: "0xbf7648dfe07f66a4",
      complexMultiplicityFactor: 2,
      complexMultiplicityAlreadyAbsorbedExactlyOnce: true,
      furtherFactorTwoAllowed: false,
    });
    expect(f64HexBigEndian(coefficients.cLambda.f64Value)).toBe(
      "0xbf7648dfe07f66a4",
    );
    expect(coefficients.cG).toEqual({ exactExpression: "0", f64Value: 0 });
    expect(coefficients.c1).toEqual({ exactExpression: "0", f64Value: 0 });
    expect(coefficients.c2).toEqual({ exactExpression: "0", f64Value: 0 });
    expect(coefficients.independentlyVerified).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS.selectedLocalTensor,
    ).toMatchObject({
      exactFormula: "Theta_ab=cLambda*mu^4*g_ab+cG*mu^2*G_ab+c1*H1_ab+c2*H2_ab",
      substitutedFormula:
        "Theta_ab=[2*(2*gamma_E-ln(2)-7/4)/(3*(4*pi)^2)]*mu^4*g_ab",
      multiplicityAlreadyAbsorbedExactlyOnce: true,
      derivationExecuted: false,
    });
  });

  it("copies the finite conditions and forbids producer-selected terms or route double counting", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
    expect(contract.finiteRenormalizationConditions.conditionsInOrder).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.renormalization
        .finiteAmbiguityConditions,
    );
    expect(contract.finiteRenormalizationConditions).toMatchObject({
      copiedFromFrozenCandidatePlan: true,
      producerSelectedFiniteCountertermsAllowed: false,
      referenceScale: "mu",
      zeroCoefficientsMeanChosenSchemeNotAbsenceOfWaldAmbiguity: true,
    });
    expect(contract.prescriptionCompatibility).toMatchObject({
      selectedMeanRoute: "improved_moretti_eta_one_third",
      meanFormula: "<T_ab>_ren=[D^(1/3)_ab*K_C]+Theta_ab",
      exclusiveAlternativeMeanFormula:
        "<T_ab>_ren=[D^(0)_ab*K_C]+(1/(2*pi^2))*g_ab*v1+Theta_ab",
      explicitV1AddedToImprovedRoute: false,
      bothRoutesAccumulated: false,
      exactOneRoutePerEvaluationRequired: true,
    });
  });

  it("cancels c-number counterterms after centering and forbids numerical noise injection", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS.connectedNoiseBoundary,
    ).toMatchObject({
      centeredOperator: "t_ab=T_ab_ren-omega(T_ab_ren)*1",
      deterministicShift: "T_ab_ren_to_T_ab_ren+Theta_ab*1",
      centeredShiftIdentity:
        "(T_ab_ren+Theta_ab*1)-omega(T_ab_ren+Theta_ab*1)*1=t_ab",
      cNumberCountertermsCancelExactlyAfterCentering: true,
      countertermArraysInjectedIntoNumericalNoiseKernel: false,
      countertermContributionAddedToConnectedNoiseOutput: false,
      stateDependentConnectedTermsMayBeDropped: false,
      cancellationDerivationPacketBinding: null,
      cancellationReplayReceipt: null,
    });
  });

  it("requires future source and derivation packets and leaves every authority, lamp and physical claim locked", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS;
    expect(contract.futureDerivationPacketRequirements).toMatchObject({
      primarySourceByteEntries: null,
      derivationEntries: null,
      serverReplayReceipt: null,
      independentAgreementReceipt: null,
      symbolicDerivationTranscriptRequired: true,
      exactBinary64ConversionTranscriptRequired: true,
      complete: false,
    });
    expect(
      Object.values(contract.executionBoundary).every((value) => !value),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_AUTHORITY_LOCKS,
      ).every((value) => !value),
    ).toBe(true);
  });

  it("rejects drift, proxies, accessors, symbols, invalid numbers, cycles and oversized strings", () => {
    const drift =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        string,
        unknown
      >;
    (
      (drift.frozenCoefficients as Record<string, unknown>).cLambda as Record<
        string,
        unknown
      >
    ).f64HexBigEndian = "0x0000000000000000";
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(drift),
    ).toContain("spherical_v2_renormalization_counterterms_semantic_drift");

    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(
        new Proxy(
          cloneNhm2SphericalBosonStarV2RenormalizationCounterterms(),
          {},
        ),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const accessor =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        string,
        unknown
      >;
    Object.defineProperty(accessor, "authority", {
      get: () =>
        "canonical_counterterm_choice_only_no_source_or_execution_authority",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(
        accessor,
      )[0],
    ).toContain("object_entry_surface:");

    const symbolKey =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        PropertyKey,
        unknown
      >;
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(
        symbolKey,
      )[0],
    ).toContain("object_surface:");

    const invalid =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        string,
        unknown
      >;
    (
      (invalid.frozenCoefficients as Record<string, unknown>).cG as Record<
        string,
        unknown
      >
    ).f64Value = -0;
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(invalid)[0],
    ).toContain("invalid_number:");

    const cycle =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        string,
        unknown
      >;
    cycle.loop = cycle;
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(cycle)[0],
    ).toContain("cycle_forbidden:");

    const huge =
      cloneNhm2SphericalBosonStarV2RenormalizationCounterterms() as unknown as Record<
        string,
        unknown
      >;
    huge.authority = "x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_COUNTERTERMS_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
        1,
    );
    expect(
      nhm2SphericalBosonStarV2RenormalizationCountertermsViolations(huge)[0],
    ).toContain("string_byte_limit:");
  });
});
