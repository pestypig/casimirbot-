import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as conventionModule from "../nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
  isNhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1,
  nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations,
} from "../nhm2-conformally-flat-needle-connected-noise-distribution-convention.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";

const clone = (): any =>
  structuredClone(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
  );

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) =>
      isDeepFrozen((value as Record<PropertyKey, unknown>)[key], seen),
    )
  );
};

describe("nhm2_conformally_flat_needle_connected_noise_distribution_convention/v1", () => {
  it("exports one exact deeply frozen Stage-2 blocked contract and no authority issuer", () => {
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION,
      ),
    ).toBe(true);
    expect(
      Object.keys(conventionModule).filter((name) =>
        /^(?:build|create|issue|promote)/i.test(name),
      ),
    ).toEqual([]);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content,
    ).toMatchObject({
      maturity: "stage_2_diagnostic_contract_only",
      status: "blocked_pending_complete_distribution_execution_freeze",
      executionAdmissible: false,
    });
  });

  it("binds literal upstream-observables, content, and complete-contract bytes", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION;
    expect(contract.content.upstreamObservablesBinding).toMatchObject({
      canonicalSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
      exactUpstreamBytesRequired: true,
      semanticSubstitutionAllowed: false,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
    );
    expect(contract.contentBinding).toMatchObject(binding(contract.content));
    expect(contract.contentBinding).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_EXPECTED_SIZE_BYTES,
    );
  });

  it("records exact source versions and anchors while leaving every source byte artifact unbound", () => {
    const audit =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION
        .content.primarySourceAudit;
    expect(
      audit.sources.map(({ sourceVersion, equationAnchors, pageAnchors }) => ({
        sourceVersion,
        equationAnchors,
        pageAnchors,
      })),
    ).toEqual([
      {
        sourceVersion: "arXiv:gr-qc/0109048v2",
        equationAnchors: ["27-29", "33-43", "44", "47-53"],
        pageAnchors: [],
      },
      {
        sourceVersion: "arXiv:1301.2501v1",
        equationAnchors: ["2.1-2.6", "2.11"],
        pageAnchors: ["pp.16-17_discussion"],
      },
      {
        sourceVersion: "arXiv:1407.3907v1",
        equationAnchors: ["1", "6", "17-21"],
        pageAnchors: [],
      },
      {
        sourceVersion: "arXiv:gr-qc/0010019v2",
        equationAnchors: ["3.9-3.12", "3.21-3.25", "4.4-4.7"],
        pageAnchors: [],
      },
    ]);
    for (const source of audit.sources) {
      expect(source).toMatchObject({
        sourceArtifactSha256: null,
        sourceArtifactSizeBytes: null,
        authoritativelySelectedByteArtifact: false,
      });
    }
    expect(audit.primarySourceArtifactByteBindingsComplete).toBe(false);
    expect(audit.sourceAuditAloneAuthorizesExecution).toBe(false);
  });

  it("freezes the local-Wick star algebra, C_c-infinity test space, centered definition, and normalization crosswalk", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content;
    expect(content.algebraicDistributionConvention).toMatchObject({
      construction: "Moretti_extended_local_Wick_star_algebra",
      testFunctionSpace: "C_c^infinity(M)",
      product: "ordinary_algebra_multiplication",
      productSymbol: "juxtaposition",
      sourceStarDenotesInvolutionNotMultiplication: true,
      contractionKernel: "state_Wightman_two_point_boundary_value_distribution",
      productDefinedMicrolocallyBeforeSmearing: true,
      timeOrderedProduct: false,
      pointwiseOrdinaryFunctionMultiplication: false,
    });
    expect(content.centeredConnectedObservable).toMatchObject({
      centeredFluctuationDefinition: "t_ab(f)=T_ab(f)-omega(T_ab(f))*1",
      noiseDefinition: "N_abcd(f,h)=(1/2)*omega(t_ab(f)t_cd(h)+t_cd(h)t_ab(f))",
      centered: true,
      connected: true,
      symmetrized: true,
      symmetrizationFactorNumerator: 1,
      symmetrizationFactorDenominator: 2,
      productIsOrdinaryAlgebraMultiplication: true,
    });
    expect(content.noiseKernelNormalizationCrosswalk).toEqual({
      phillipsHuDefinition: "8*N_PH=<anticommutator(t,t)>",
      projectDefinition: "N_project=(1/2)*<anticommutator(t,t)>",
      exactRelation: "N_project=4*N_PH",
      projectToPhillipsHuFactor: 4,
      appliesToConnectedSymmetrizedNoiseOnly: true,
      changesHadamardTwoPointRelativeNormalization: false,
      changesMeanStressConvention: false,
    });
  });

  it("forbids termwise PV/delta arithmetic, Bates Eq. 2.11 execution, delta-squared, and invented contacts", () => {
    const boundary =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION
        .content.distributionProductBoundary;
    expect(boundary).toMatchObject({
      requiredInterpretation:
        "microlocal_Wightman_boundary_value_product_as_one_distribution",
      termwisePrincipalValueDeltaDecompositionAllowed: false,
      termwisePrincipalValueDeltaMultiplicationAllowed: false,
      deltaSquaredAllowed: false,
      batesEquation2_11ExecutionAllowed: false,
      batesEquation2_11Role: "primary_source_audit_anchor_only",
      independentlyAddedContactTermsAllowed: false,
      regulatorDependentContactsMayBeInvented: false,
      distributionalIdentityMayBeAssumedFromPointwiseAgreement: false,
    });
    expect(boundary.evaluationOrder).toEqual([
      "construct_the_ordinary_algebra_product_distribution",
      "center_and_symmetrize_the_algebra_observable",
      "pair_the_result_with_C_c^infinity(M)_test_functions",
    ]);
  });

  it("admits the current bumps only by semantic inference and applies conditional conformal factors at both points", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content;
    expect(content.currentBumpAdmission).toMatchObject({
      smearingId: "normalized_C_infinity_spacetime_product_bumps_v1",
      admittedTestFunctionSpace: "C_c^infinity(M)",
      admittedAsTestFunctions: true,
      admissionBasis: "source_audited_semantic_inference_only",
      exactProjectBumpNamedByPrimarySource: false,
      admissionIsNumericalRepresentationProof: false,
      admissionAuthorizesExecution: false,
    });
    expect(
      content.conditionalConformalLaw.coordinateCovariantComponents,
    ).toEqual({
      formula: "N_abcd(x,y)=Omega(x)^(-2)*Omega(y)^(-2)*Nbar_abcd(x,y)",
      omegaAppliedAtX: true,
      omegaAppliedAtY: true,
      factorOmegaAtSmearingCenterAllowed: false,
      replaceOmegaXAndOmegaYWithOneCenterValueAllowed: false,
      pointwiseFactorsAppliedBeforeSmearing: true,
      executionAllowed: false,
    });
    expect(content.conditionalConformalLaw.orthonormalTetradComponents).toEqual(
      {
        status: "inferred_from_coordinate_law_and_tetrad_scaling",
        formula:
          "N_hat(a)hat(b)hat(c)hat(d)(x,y)=Omega(x)^(-4)*Omega(y)^(-4)*Nbar_hat(a)hat(b)hat(c)hat(d)(x,y)",
        omegaAppliedAtX: true,
        omegaAppliedAtY: true,
        factorOmegaAtSmearingCenterAllowed: false,
        replaceOmegaXAndOmegaYWithOneCenterValueAllowed: false,
        directPrimarySourceQuotation: false,
        sourceAuditedSemanticInference: true,
        executionAllowed: false,
      },
    );
  });

  it("limits c-number cancellation to connected fluctuations and keeps every execution prerequisite null", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION.content;
    expect(content.renormalizationShiftBoundary).toMatchObject({
      centeredCancellation: "t'_ab(f)=T'_ab(f)-omega(T'_ab(f))*1=t_ab(f)",
      cancelsInConnectedFluctuation: true,
      cancelsInConnectedSymmetrizedNoise: true,
      cancelsInMeanStress: false,
      cancelsInUncenteredSecondMoment: false,
      licensesDroppingMeanLocalTerms: false,
      selectsMeanRenormalizationConvention: false,
      scope: "connected_fluctuation_only",
    });
    expect(content.unresolvedExecutionFreeze).toEqual({
      exactStressTensorOperator: null,
      hadamardWightmanRelativeNormalization: null,
      numericalBoundaryValueRepresentation: null,
      distributionalEquivalenceProof: null,
      primarySourceArtifactByteBindingSet: null,
      meanRenormalizationConvention: null,
      executionContract: null,
      executorIdentity: null,
      executionReceipt: null,
      allFieldsRequiredBeforeExecution: true,
      nullFieldExecutionAllowed: false,
    });
  });

  it("keeps every authority, lamp, ADM, physical, transport, propulsion, and certificate lock false", () => {
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_AUTHORITY_LOCKS,
      ),
    ).not.toContain(true);
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION
        .content.authority.blockers,
    ).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_BLOCKERS,
    );

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_AUTHORITY_LOCKS,
    )) {
      const value = clone();
      value.content.authority.locks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
          value,
        ),
        key,
      ).toContain("authority_must_remain_blocked");
    }
    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_DISTRIBUTION_CONVENTION_CLAIM_LOCKS,
    )) {
      const value = clone();
      value.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
          value,
        ),
        key,
      ).toContain("claim_locks_must_remain_false");
    }
  });

  it("rejects extra and missing keys at nested exact-contract boundaries", () => {
    const extra = clone();
    extra.content.primarySourceAudit.promoted = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        extra,
      ),
    ).toContain("extra_key:/content/primarySourceAudit/promoted");

    const missing = clone();
    delete missing.content.conditionalConformalLaw.coordinateCovariantComponents
      .omegaAppliedAtY;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        missing,
      ),
    ).toContain(
      "missing_key:/content/conditionalConformalLaw/coordinateCovariantComponents/omegaAppliedAtY",
    );
  });

  it("rejects proxies, accessors, symbols, forbidden keys, non-plain values, and cycles before comparison", () => {
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        new Proxy(clone(), {}),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      enumerable: true,
      get: () => "blocked_pending_complete_distribution_execution_freeze",
    });
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        accessor,
      ),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);

    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        symbol,
      ),
    ).toEqual(["symbol_key_forbidden:/content"]);

    const forbiddenKey = clone();
    Object.defineProperty(
      forbiddenKey.content.primarySourceAudit,
      "constructor",
      {
        enumerable: true,
        configurable: true,
        writable: true,
        value: { executionAdmissible: true },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        forbiddenKey,
      ),
    ).toEqual(["forbidden_data_key:/content/primarySourceAudit/constructor"]);

    const extraArrayKey = clone();
    Object.defineProperty(
      extraArrayKey.content.primarySourceAudit.sources,
      "4294967295",
      { configurable: true, enumerable: true, value: "hidden", writable: true },
    );
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        extraArrayKey,
      ),
    ).toEqual(["array_keys_invalid:/content/primarySourceAudit/sources"]);

    const inherited = Object.assign(Object.create({ promoted: true }), clone());
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        inherited,
      ),
    ).toEqual(["non_plain_object:/"]);

    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        cyclic,
      ),
    ).toEqual(["cycle_forbidden:/content/loop"]);
  });

  it("rejects attempts to invent source bytes, fill science gaps, execute unsafe formulas, center-factor Omega, or unlock execution", () => {
    const sourceBytes = clone();
    sourceBytes.content.primarySourceAudit.sources[0].sourceArtifactSha256 =
      "0".repeat(64);
    sourceBytes.content.primarySourceAudit.sources[0].sourceArtifactSizeBytes = 1;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        sourceBytes,
      ),
    ).toContain("primary_source_bytes_must_remain_unbound");

    const inventedOperator = clone();
    inventedOperator.content.unresolvedExecutionFreeze.exactStressTensorOperator =
      "proxy_operator";
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        inventedOperator,
      ),
    ).toContain("unresolved_execution_fields_must_remain_null");

    const batesExecution = clone();
    batesExecution.content.distributionProductBoundary.batesEquation2_11ExecutionAllowed = true;
    batesExecution.content.distributionProductBoundary.deltaSquaredAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        batesExecution,
      ),
    ).toContain("unsafe_distribution_recipe_forbidden");

    const centeredOmega = clone();
    centeredOmega.content.conditionalConformalLaw.coordinateCovariantComponents.factorOmegaAtSmearingCenterAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        centeredOmega,
      ),
    ).toContain(
      "value_drift:/content/conditionalConformalLaw/coordinateCovariantComponents/factorOmegaAtSmearingCenterAllowed",
    );

    const execute = clone();
    execute.content.executionAdmissible = true;
    execute.content.unresolvedExecutionFreeze.meanRenormalizationConvention =
      "silently_selected";
    expect(
      nhm2ConformallyFlatNeedleConnectedNoiseDistributionConventionViolations(
        execute,
      ),
    ).toEqual(
      expect.arrayContaining([
        "execution_must_remain_blocked",
        "unresolved_execution_fields_must_remain_null",
      ]),
    );
  });
});
