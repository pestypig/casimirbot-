import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as reductionModule from "../nhm2-conformally-flat-needle-mean-rset-anomaly-reduction.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_AUTHORITY_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES,
  canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson,
  isNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionV1,
  nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations,
} from "../nhm2-conformally-flat-needle-mean-rset-anomaly-reduction.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-mean-rset-renormalization-convention.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION);

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
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

const defineHostileKey = (
  target: object,
  key: "__proto__" | "prototype" | "constructor",
): void => {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value: { executionAuthority: true },
    writable: true,
  });
};

describe("nhm2_conformally_flat_needle_mean_rset_anomaly_reduction/v1", () => {
  it("exports one deeply frozen blocked contract and no executable surface", () => {
    expect(
      Object.keys(reductionModule).filter((name) =>
        /^(?:build|create|issue|execute|run|replay|receipt|certify|promote)/i.test(
          name,
        ),
      ),
    ).toEqual([]);
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION),
    ).toBe(true);
  });

  it("holds literal content and full-contract pins under an independent canonicalizer", () => {
    const contentBinding = binding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content,
    );
    expect(contentBinding.sha256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SHA256,
    );
    expect(contentBinding.sizeBytes).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTENT_EXPECTED_SIZE_BYTES,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.contentBinding,
    ).toEqual(contentBinding);

    const contractBinding = binding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
    );
    expect(contractBinding.sha256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SHA256,
    );
    expect(contractBinding.sizeBytes).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_EXPECTED_SIZE_BYTES,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256,
    ).toBe(contractBinding.sha256);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES,
    ).toBe(contractBinding.sizeBytes);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CANONICAL_JSON,
    ).toBe(
      canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION),
    );
  });

  it("exact-binds scalar, observables, and mean-convention bytes", () => {
    const cases = [
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
        undefined,
        undefined,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_OBSERVABLES_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      ],
      [
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_MEAN_CONVENTION_EXPECTED_SIZE_BYTES,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SHA256,
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION_SIZE_BYTES,
      ],
    ] as const;

    for (const [
      value,
      expectedSha,
      expectedSize,
      reportedSha,
      reportedSize,
    ] of cases) {
      const actual = binding(value);
      expect(actual.sha256).toBe(expectedSha);
      expect(actual.sizeBytes).toBe(expectedSize);
      if (reportedSha != null) expect(reportedSha).toBe(expectedSha);
      if (reportedSize != null) expect(reportedSize).toBe(expectedSize);
    }
  });

  it("freezes the exact conformal curvature and reduced mean identities", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content;
    expect(content.exactConformalCurvatureReduction).toMatchObject({
      ricciTensor:
        "R_AB=-2*partial_A*partial_B(omega)-eta_AB*Box_eta(omega)+2*partial_A(omega)*partial_B(omega)-2*eta_AB*(partial_omega)^2",
      ricciScalar: "R=Omega^(-2)*(-6*Box_eta(omega)-6*(partial_omega)^2)",
      indexRaisingForCurvatureContractions: "use_g_inverse_not_eta_inverse",
      runtimeImplementationPresent: false,
    });
    expect(content.conformalAnomalyTensor).toMatchObject({
      tensorName: "conformalAnomalyK",
      formula:
        "conformalAnomalyK_AB=-R_A^C*R_BC+(2/3)*R*R_AB+(1/2)*g_AB*R_CD*R^CD-(1/4)*g_AB*R^2",
      traceIdentity: "g^AB*conformalAnomalyK_AB=R_AB*R^AB-(1/3)*R^2",
      mechanicallyDistinctFromMeanConventionFiniteWaldH3: true,
      equalsMeanConventionFiniteWaldVariationalH3: false,
      historicalH3NameRejected: true,
    });
    expect(content.meanConventionH1).toEqual({
      tensorName: "H1",
      formula:
        "H1_AB=2*nabla_A*nabla_B(R)-2*R*R_AB+g_AB*(-2*Box_g(R)+(1/2)*R^2)",
      traceIdentity: "g^AB*H1_AB=-6*Box_g(R)",
      sourceClass: "exactly_inherited_project_mean_convention",
    });
    expect(content.reducedMeanRset).toMatchObject({
      formula: "<T_AB>_ren=(conformalAnomalyK_AB-(1/6)*H1_AB)/(2880*pi^2)",
      traceIdentity:
        "g^AB*<T_AB>_ren=(Box_g(R)+R_AB*R^AB-(1/3)*R^2)/(2880*pi^2)",
      formulaExecutionAuthorized: false,
    });
  });

  it("mechanically prevents conformalAnomalyK from becoming variational H3", () => {
    const anomaly =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .conformalAnomalyTensor;
    const upstreamH3 =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_RENORMALIZATION_CONVENTION.content
        .finiteWaldAmbiguity.H3;
    expect(anomaly.tensorName).not.toBe("H3");
    expect(anomaly.formula).not.toBe(upstreamH3.formula);
    expect(anomaly.formula).not.toMatch(/nabla|Box|Riemann/);
    expect(upstreamH3.formula).toMatch(/nabla|Box/);
    expect(anomaly.meanConventionVariationalH3Pointer).toBe(
      "content.finiteWaldAmbiguity.H3",
    );
  });

  it("separates audited source facts from the blocked project derivation", () => {
    const audit =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .sourceAudit;
    expect(audit.sourceFacts).toMatchObject({
      arxivId: "1301.5002v3",
      sourceBytesLocation: "remote_unvendored",
      sourceArtifactSha256: null,
      sourceArtifactSizeBytes: null,
      sourceBytesVendored: false,
      sourceBytesVerified: false,
      authoritativeSourceBytes: false,
      authorizesFormulaExecution: false,
    });
    expect(audit.projectDerivation).toMatchObject({
      classification:
        "project_cross_source_derivation_not_verbatim_source_fact",
      independentSymbolicVerificationPresent: false,
      executionAuthority: false,
    });
    expect(audit.sourceFacts.equationAnchors).toEqual([
      "Eq.(1)",
      "Eqs.(5)-(13)",
      "Eqs.(20)-(23)",
    ]);
  });

  it("freezes uniqueness assumptions and all no-double-count/finite zeros", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content;
    expect(content.uniquenessAssumptions).toMatchObject({
      spacetimeTopology: "R^4",
      globallyConformalToMinkowski: true,
      conformalFactorStrictlyPositiveEverywhere: true,
      quantumState: "conformal_Minkowski_vacuum",
      flatSpaceRsetNormalization: "zero",
      boundaryCasimirContribution: "zero",
      topologicalContribution: "zero",
      additionalStateDependentConservedTracelessTensor: "zero",
      assumptionsAreRuntimeVerified: false,
    });
    expect(content.finiteRenormalizationAndNoDoubleCount).toMatchObject({
      cosmologicalCountertermCoefficient: 0,
      newtonCountertermCoefficient: 0,
      C1: 0,
      C2: 0,
      C3: 0,
      Theta_AB: "0",
      addMorettiImprovedDOneThirdResultAgain: false,
      addDecaniniFolacciT0Again: false,
      addExplicitGv1Again: false,
      addAnotherAnomalyTensorAgain: false,
    });
  });

  it("freezes the exact smear, cancellations, SI constants, and campaign placement", () => {
    const smear =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .exactSmearingConvention;
    expect(smear.oneDimensionalBump).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing
        .oneDimensionalBump,
    );
    expect(smear.oneDimensionalBump).toBe(
      "q(u)=exp(-u^2/(1-u^2)) for |u|<1 and q(u)=0 for |u|>=1",
    );
    expect(smear.denominator).toBe(
      "D_n=integral_[-1,1]^3 d^3u Q(u)*Omega(X_n(u))^4",
    );
    expect(smear.smearedMeanSI).toBe(
      "mean_n,hatAhatB^SI=(hbar*c)*(integral_[-1,1]^3 d^3u Q(u)*Omega(X_n(u))^2*<T_AB>_ren^geom)/D_n",
    );
    expect(smear).toMatchObject({
      timeFactorCancellation: "exact_for_static_Omega",
      spatialJacobianCancellation: "dx*dy*dz_cancels_exactly",
      individualSmearContainsOneOver64: false,
      campaignWeightOneOver64AppliedAfterIndividualSmears: true,
      centerPointSubstitutionAllowed: false,
    });
    expect(smear.siConversion).toEqual({
      formula: "hbar*c=h*c/(2*pi)",
      planckConstant: {
        symbol: "h",
        exactDecimal: "6.62607015e-34",
        unit: "J*s",
        exactBySI: true,
      },
      speedOfLight: {
        symbol: "c",
        exactInteger: "299792458",
        unit: "m/s",
        exactBySI: true,
      },
      roundedHbarLiteralAllowed: false,
    });
  });

  it("freezes structural +0, parity, support bounds, and exactly eight absolute classes", () => {
    const structure =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .sampleAndComponentStructure;
    expect(structure.intendedArrayShape).toEqual([64, 10]);
    expect(structure.timeSpaceComponents).toMatchObject({
      T01: "+0",
      T02: "+0",
      T03: "+0",
      numericalToleranceZeroForbidden: true,
    });
    expect(structure.parityUnderSampleSigns).toEqual({
      T00: "even",
      T11: "even",
      T12: "sign(sx*sy)",
      T13: "sign(sx*sz)",
      T22: "even",
      T23: "sign(sy*sz)",
      T33: "even",
    });
    expect(structure.absoluteCoordinateMultipliersPerAxis).toEqual([
      "1/5",
      "1/2",
    ]);
    expect(structure.absoluteSampleClassCount).toBe(2 ** 3);

    const support =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .supportAndDenominatorProof;
    expect(2187 / 2500).toBe(0.8748);
    expect(1 - 2187 / 2500).toBeCloseTo(313 / 2500, 15);
    expect((1 / 2) ** 2 / (1 - (1 / 2) ** 2)).toBe(1 / 3);
    expect(Math.exp(-1 / 3) ** 3).toBeCloseTo(Math.exp(-1), 15);
    expect(support).toMatchObject({
      supportSMaximum: "2187/2500",
      oneMinusSMinimum: "313/2500",
      productBumpLowerBoundOnCentralSubcube: "exp(-1)",
      centralSubcubeVolume: 1,
      omegaFourthLowerBound: 1,
      denominatorLowerBound: "D_n>=exp(-1)>0",
      proofIsRuntimeEvidence: false,
    });
  });

  it("pins exact flat/constant-Omega and constant-curvature algebra fixtures", () => {
    const fixtures =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content
        .exactAlgebraFixtures;
    expect(fixtures.flatOrConstantOmega).toEqual({
      premise: "Omega_is_any_positive_constant",
      omegaDerivatives: "0",
      R_AB: "0",
      R: "0",
      conformalAnomalyK_AB: "0",
      H1_AB: "0",
      meanRset_AB: "0",
      fixtureIsExecutionEvidence: false,
    });
    expect(fixtures.constantCurvature).toMatchObject({
      ricciSquared: "R_AB*R^AB=R^2/4",
      boxR: "0",
      conformalAnomalyK_AB: "-(R^2/48)*g_AB",
      H1_AB: "0",
      meanRset_AB: "-(R^2/(138240*pi^2))*g_AB",
      trace: "-R^2/(34560*pi^2)",
      fixtureIsExecutionEvidence: false,
    });

    // Exact common-denominator arithmetic, independent of the fixture strings.
    expect(-3 + 8 + 6 - 12).toBe(-1); // 48*K_AB/(R^2*g_AB)
    expect(48 * 2880).toBe(138240);
    expect(138240 / 4).toBe(34560);
    expect(3 - 4).toBe(-1); // 12*(Ricci^2/R^2 - 1/3)
  });

  it("keeps every execution and claim authority closed in blocker order", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content;
    expect(content.authority.firstBlocker).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_BLOCKERS[0],
    );
    expect(content.authority.blockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_BLOCKERS,
    );
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_AUTHORITY_LOCKS,
      ),
    ).toEqual([false, false, false, false, false, false]);
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CLAIM_LOCKS,
      ),
    ).toEqual([false, false, false, false, false, false]);
    expect(
      Object.values(content.implementationBoundary).every(
        (entry) => entry === false,
      ),
    ).toBe(true);
    expect(content.unresolvedExecutionFreeze.nullFieldExecutionAllowed).toBe(
      false,
    );
  });

  it("rejects exact-content drift and stale content bindings", () => {
    const formulaDrift = clone();
    formulaDrift.content.reducedMeanRset.formula =
      "<T_AB>_ren=conformalAnomalyK_AB/(2880*pi^2)";
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(formulaDrift),
    ).toContain("value_drift:/content/reducedMeanRset/formula");
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(formulaDrift),
    ).toContain("content_binding_invalid");

    const bumpDrift = clone();
    bumpDrift.content.exactSmearingConvention.oneDimensionalBump =
      "q(u)=exp(-1/(3*(1-u^2))) for |u|<1 and q(u)=0 for |u|>=1";
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(bumpDrift),
    ).toContain(
      "value_drift:/content/exactSmearingConvention/oneDimensionalBump",
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(bumpDrift),
    ).toContain("content_binding_invalid");

    const h3Confusion = clone();
    h3Confusion.content.conformalAnomalyTensor.tensorName = "H3";
    h3Confusion.content.conformalAnomalyTensor.historicalH3NameRejected = false;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(h3Confusion),
    ).toContain("conformal_anomaly_K_H3_separation_invalid");

    const sourceEscalation = clone();
    sourceEscalation.content.sourceAudit.sourceFacts.sourceBytesVendored = true;
    sourceEscalation.content.sourceAudit.sourceFacts.authorizesFormulaExecution = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(
        sourceEscalation,
      ),
    ).toContain("source_audit_authority_invalid");

    const executionEscalation = clone();
    executionEscalation.content.implementationBoundary.executorPresent = true;
    executionEscalation.content.claimLocks.executable = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(
        executionEscalation,
      ),
    ).toContain("blocked_nonexecution_authority_invalid");
  });

  it("rejects root and nested proxies before invoking a proxy trap", () => {
    let trapCalls = 0;
    const rootProxy = new Proxy(clone(), {
      get: () => {
        trapCalls += 1;
        throw new Error("proxy_get_must_not_run");
      },
      getOwnPropertyDescriptor: () => {
        trapCalls += 1;
        throw new Error("proxy_descriptor_must_not_run");
      },
      getPrototypeOf: () => {
        trapCalls += 1;
        throw new Error("proxy_prototype_must_not_run");
      },
      ownKeys: () => {
        trapCalls += 1;
        throw new Error("proxy_keys_must_not_run");
      },
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(rootProxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(() =>
      canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson(rootProxy),
    ).toThrow("Cannot canonicalize unsafe plain data: proxy_forbidden:/");
    expect(trapCalls).toBe(0);

    const nested = clone();
    nested.content.reducedMeanRset = new Proxy(nested.content.reducedMeanRset, {
      ownKeys: () => {
        trapCalls += 1;
        throw new Error("nested_proxy_keys_must_not_run");
      },
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(nested),
    ).toEqual(["proxy_forbidden:/content/reducedMeanRset"]);
    expect(trapCalls).toBe(0);
  });

  it("rejects accessors and hidden data without invoking getters", () => {
    let getterCalls = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "blocked_exact_anomaly_reduction_frozen_execution_unavailable";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(accessor),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
    expect(getterCalls).toBe(0);

    const arrayAccessor = clone();
    arrayAccessor.content.sampleAndComponentStructure.componentOrder =
      Array.from(
        arrayAccessor.content.sampleAndComponentStructure.componentOrder,
      );
    Object.defineProperty(
      arrayAccessor.content.sampleAndComponentStructure.componentOrder,
      "0",
      {
        configurable: true,
        enumerable: true,
        get: () => {
          getterCalls += 1;
          return "T00";
        },
      },
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(
        arrayAccessor,
      ),
    ).toEqual([
      "accessor_sparse_or_hidden_array_entry:/content/sampleAndComponentStructure/componentOrder/0",
    ]);
    expect(getterCalls).toBe(0);

    const hidden = clone();
    Object.defineProperty(hidden.content, "hiddenAuthority", {
      configurable: true,
      enumerable: false,
      value: true,
    });
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(hidden),
    ).toEqual([
      "accessor_or_hidden_property_forbidden:/content/hiddenAuthority",
    ]);
  });

  it("rejects symbols, forbidden keys, array side keys, sparse arrays, and prototypes", () => {
    const symbol = clone();
    symbol.content[Symbol("execution-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(symbol),
    ).toEqual(["symbol_key_forbidden:/content"]);

    for (const key of ["__proto__", "prototype", "constructor"] as const) {
      const hostile = clone();
      defineHostileKey(hostile.content.reducedMeanRset, key);
      expect(
        nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(hostile),
      ).toEqual([`forbidden_data_key:/content/reducedMeanRset/${key}`]);
    }

    const sideKey = clone();
    sideKey.content.sampleAndComponentStructure.componentOrder = Array.from(
      sideKey.content.sampleAndComponentStructure.componentOrder,
    );
    Object.defineProperty(
      sideKey.content.sampleAndComponentStructure.componentOrder,
      "4294967295",
      { configurable: true, enumerable: true, value: "authority" },
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(sideKey),
    ).toEqual([
      "array_keys_invalid:/content/sampleAndComponentStructure/componentOrder",
    ]);

    const sparse = clone();
    sparse.content.sampleAndComponentStructure.componentOrder = Array.from(
      sparse.content.sampleAndComponentStructure.componentOrder,
    );
    delete sparse.content.sampleAndComponentStructure.componentOrder[0];
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(sparse),
    ).toEqual([
      "array_keys_invalid:/content/sampleAndComponentStructure/componentOrder",
    ]);

    const inherited = Object.assign(
      Object.create({ executionAuthority: true }),
      clone(),
    );
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(inherited),
    ).toEqual(["non_plain_object:/"]);
  });

  it("rejects cycles, nonfinite values, negative zero, and non-JSON primitives", () => {
    const cyclic = clone();
    cyclic.content.loop = cyclic.content;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(cyclic),
    ).toEqual(["cycle_forbidden:/content/loop"]);

    for (const [number, violation] of [
      [
        Number.NaN,
        "nonfinite_number:/content/supportAndDenominatorProof/centralSubcubeVolume",
      ],
      [
        Number.POSITIVE_INFINITY,
        "nonfinite_number:/content/supportAndDenominatorProof/centralSubcubeVolume",
      ],
      [
        Number.NEGATIVE_INFINITY,
        "nonfinite_number:/content/supportAndDenominatorProof/centralSubcubeVolume",
      ],
      [
        -0,
        "negative_zero:/content/supportAndDenominatorProof/centralSubcubeVolume",
      ],
    ] as const) {
      const hostile = clone();
      hostile.content.supportAndDenominatorProof.centralSubcubeVolume = number;
      expect(
        nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(hostile),
      ).toEqual([violation]);
    }

    const bigint = clone();
    bigint.content.supportAndDenominatorProof.centralSubcubeVolume = 1n;
    expect(
      nhm2ConformallyFlatNeedleMeanRsetAnomalyReductionViolations(bigint),
    ).toEqual([
      "non_json_value:/content/supportAndDenominatorProof/centralSubcubeVolume",
    ]);
  });
});
