import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 } from "../shared/contracts/nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_BRANCH_BVP_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-branch-bvp.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2RenormalizationPrescription,
  isNhm2SphericalBosonStarV2RenormalizationPrescriptionV1,
  nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations,
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

describe("NHM2 spherical boson-star v2 renormalization prescription v1", () => {
  it("has stable canonical bytes, a domain-separated digest and a hostile singleton validator", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256,
    ).toBe("0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_SIZE_BYTES,
    ).toBe(10670);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_SHA256);
    expect(
      isNhm2SphericalBosonStarV2RenormalizationPrescriptionV1(
        cloneNhm2SphericalBosonStarV2RenormalizationPrescription(),
      ),
    ).toBe(true);
    expect(
      deepFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION),
    ).toBe(true);
  });

  it("exact-pins the candidate plan, v2 freeze, branch BVP and base science DAG", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_BINDING_PINS;
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
    expect(NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256).toBe(
      pins.scienceDerivationDagSha256,
    );
  });

  it("fixes one complex field as exactly two canonically normalized real scalars", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
    expect(contract.complexAsTwoRealNormalization).toMatchObject({
      complexFieldDefinition: "Phi=(phi1+i*phi2)/sqrt(2)",
      realFieldOrder: ["phi1", "phi2"],
      canonicalRealScalarCount: 2,
      eachRealScalarCanonicalFactorOneHalf: true,
      fieldJacobianOrAdditionalMultiplicityAllowed: false,
      multiplicityMustBeAppliedExactlyOnce: true,
    });
    expect(contract.twoPointAndParametrixNormalization).toMatchObject({
      totalComplexAsTwoRealKernel: "S_C(x,y)=S_1(x,y)+S_2(x,y)",
      perRealSymmetricParametrix: "H_S=Re(H^+_ell)",
      totalSmoothRemainder: "K_C=S_C-2*H_S",
      perRealParametrixMultiplicity: 2,
      smoothW0AddedToParametrix: false,
      relativeFactorAmbiguous: false,
    });
  });

  it("freezes P, ell, the Hadamard parametrix and all three transport recurrences", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
    expect(contract.geometricAndOperatorConventions).toMatchObject({
      curvatureCouplingXi: { exact: "0", value: 0 },
      kleinGordonOperator: "P=-Box+mu^2",
      hadamardLength: { expression: "ell=mu^-1", exact: "1/mu" },
      curvatureAndParallelPropagatorConventionDerivationPacketBinding: null,
    });
    expect(
      contract.twoPointAndParametrixNormalization.perRealWightmanParametrix,
    ).toBe(
      "H^+_ell=lim_(epsilon_down_to_0)[1/(8*pi^2)]*[u/sigma_epsilon+sum_(n>=0)(v_n*sigma^n*log(sigma_epsilon/ell^2))]",
    );
    expect(contract.hadamardTransportRecurrences).toMatchObject({
      uTransport: "2*u_;alpha*sigma^;alpha+(Box(sigma)-4)*u=0_with_[u]=1",
      v0Transport: "-P(u)+2*v0_;alpha*sigma^;alpha+(Box(sigma)-2)*v0=0",
      vnTransport:
        "-P(v_n)+2*(n+1)*v_(n+1);alpha*sigma^;alpha+((n+1)*Box(sigma)+2*n*(n+1))*v_(n+1)=0_for_n>=0",
      executableRecurrenceImplementation: null,
      recurrenceExecuted: false,
    });
  });

  it("freezes the symmetric Moretti operator at eta=1/3 before coincidence", () => {
    const operator =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION.symmetricPointSplitOperator;
    expect(operator.familyFormula).toBe(
      "D^(eta)_ab(z;x,y)=(1/2)*(I_a^{a'}(z,x)*I_b^{b'}(z,y)*nabla^x_{a'}*nabla^y_{b'}+I_a^{a'}(z,y)*I_b^{b'}(z,x)*nabla^y_{a'}*nabla^x_{b'})-(1/2)*g_ab(z)*(g^{cd}(z)*I_c^{c'}(z,x)*I_d^{d'}(z,y)*nabla^x_{c'}*nabla^y_{d'}+mu^2)+(eta/2)*g_ab(z)*(P_x+P_y)",
    );
    expect(operator).toMatchObject({
      etaDimensionRule: "eta_D=D/(2*(D+2))",
      etaNumerator: 1,
      etaDenominator: 3,
      selectedOperator: "D^(1/3)_ab",
      derivativesActBeforeCovariantCoincidence: true,
      conservationRuntimeVerified: false,
    });
  });

  it("keeps the improved and DF routes exclusive and freezes massive-minimal v1", () => {
    const routes =
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION.frozenPrescriptionRoutes;
    expect(routes.selectedImprovedMoretti.formula).toBe(
      "<T_ab>_ren=[D^(1/3)_ab*K_C]+Theta_ab",
    );
    expect(routes.exclusiveDecaniniFolacciAlternative).toMatchObject({
      canonicalOperator: "D^(0)_ab",
      v1: "v1=mu^4/8-mu^2*R/24+Box(R)/120+R^2/288-R_cd*R^cd/720+R_cdef*R^cdef/720",
      formula: "<T_ab>_ren=[D^(0)_ab*K_C]+(1/(2*pi^2))*g_ab*v1+Theta_ab",
      explicitV1CoefficientIsTotalComplex: true,
      formulaEquivalenceDerivationPacketBinding: null,
      formulaEquivalenceReplayed: false,
    });
    expect(routes).toMatchObject({
      exactOneRoutePerEvaluationRequired: true,
      cumulativeUseOfBothRoutesAllowed: false,
      explicitV1MayBeAddedToImprovedOperator: false,
      alternativeIsEquivalenceCrosscheckNotAdditionalTerm: true,
    });
  });

  it("freezes only the Z_lambda,3 n=3 duty and cancels c-number shifts only after centering", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
    expect(contract.subtractionDuty).toMatchObject({
      regulatorSymbol: "Z_lambda,3",
      subtractionOrderSymbol: "n=3",
      subtractionOrder: 3,
      regulatorScaleSequenceDefinedHere: false,
      algorithmDefinedHere: false,
      implementationBinding: null,
      executed: false,
    });
    expect(contract.connectedNoiseBoundary).toMatchObject({
      centeredOperator: "t_ab=T_ab_ren-omega(T_ab_ren)*1",
      cNumberCountertermsCancelExactlyAfterCentering: true,
      cNumberCountertermsInjectedIntoNumericalNoiseKernel: false,
      onlyCNumberCountertermsMayBeRemovedByThisRule: true,
      stateDependentConnectedTermsMayBeDropped: false,
      noiseExecutionObserved: false,
    });
  });

  it("has no reverse counterterm import and leaves derivation, execution, lamps and physical claims locked", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION;
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-spherical-boson-star-v2-renormalization-prescription.v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(source).not.toMatch(
      /from\s+["'][^"']*renormalization-counterterms\.v1["']/,
    );
    expect(contract.finiteCountertermInterface).toMatchObject({
      dependencyDirection:
        "renormalization_counterterms_exact_binds_this_prescription_never_the_reverse",
      countertermBinding: null,
      reverseImportOrBindingAllowed: false,
    });
    expect(contract.futureDerivationPacketRequirements).toMatchObject({
      primarySourceByteEntries: null,
      derivationEntries: null,
      serverReplayReceipt: null,
      independentAgreementReceipt: null,
      complete: false,
    });
    expect(
      Object.values(contract.executionBoundary).every((value) => !value),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_AUTHORITY_LOCKS,
      ).every((value) => !value),
    ).toBe(true);
  });

  it("rejects drift, proxies, accessors, symbols, invalid numbers, cycles and oversized strings", () => {
    const drift =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        string,
        unknown
      >;
    (
      drift.frozenPrescriptionRoutes as Record<string, unknown>
    ).cumulativeUseOfBothRoutesAllowed = true;
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(drift),
    ).toContain("spherical_v2_renormalization_prescription_semantic_drift");

    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(
        new Proxy(
          cloneNhm2SphericalBosonStarV2RenormalizationPrescription(),
          {},
        ),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const accessor =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        string,
        unknown
      >;
    Object.defineProperty(accessor, "authority", {
      get: () =>
        "canonical_formula_convention_only_no_source_or_execution_authority",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(
        accessor,
      )[0],
    ).toContain("object_entry_surface:");

    const symbolKey =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        PropertyKey,
        unknown
      >;
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(
        symbolKey,
      )[0],
    ).toContain("object_surface:");

    const invalid =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        string,
        unknown
      >;
    (
      invalid.geometricAndOperatorConventions as Record<string, unknown>
    ).spacetimeDimension = -0;
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(invalid)[0],
    ).toContain("invalid_number:");

    const cycle =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        string,
        unknown
      >;
    cycle.loop = cycle;
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(cycle)[0],
    ).toContain("cycle_forbidden:");

    const huge =
      cloneNhm2SphericalBosonStarV2RenormalizationPrescription() as unknown as Record<
        string,
        unknown
      >;
    huge.authority = "x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_RENORMALIZATION_PRESCRIPTION_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
        1,
    );
    expect(
      nhm2SphericalBosonStarV2RenormalizationPrescriptionViolations(huge)[0],
    ).toContain("string_byte_limit:");
  });
});
