import { describe, expect, it } from "vitest";

import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-primary-raw-content-policy.v1";
import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import {
  NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
  NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
  NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-primary-producer-bundle.v1";
import {
  NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_COVERAGE_SHA256,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_ROLE_COUNT,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_ROLE_COUNT,
  NHM2_PRIMARY_RAW_SOLVER_SUITE_MANIFEST_PROTOCOL,
  computeNhm2PrimaryRawSolverSuiteEnrollmentSemanticSha256,
  isNhm2PrimaryRawSolverSuiteEnrollmentV1,
  nhm2PrimaryRawSolverSuiteEnrollmentViolations,
  validateNhm2PrimaryRawSolverSuiteEnrollmentV1,
  type Nhm2PrimaryRawSolverSuiteArtifactRefV1,
  type Nhm2PrimaryRawSolverSuiteEnrollmentV1,
} from "../shared/contracts/nhm2-primary-raw-solver-suite-enrollment.v1";

const sha = (digit: string): string => digit.repeat(64);

const artifact = (
  suffix: string,
  digest: string,
): Nhm2PrimaryRawSolverSuiteArtifactRefV1 => ({
  artifactId: `nhm2.${suffix}`,
  contractVersion: `nhm2_${suffix}/v1`,
  relativePath: `enrollment/${suffix}.v1.bin`,
  sha256: digest,
  sizeBytes: 256,
});

const fixture = (): Nhm2PrimaryRawSolverSuiteEnrollmentV1 => {
  const enrollment = {
    artifactId: NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION,
    generatedAt: "2026-07-20T16:00:00.000Z",
    enrollmentId: "nhm2-primary-raw-suite-v1",
    planRole: "primary_numerical",
    contentPolicy: {
      artifactId: NHM2_PRIMARY_RAW_CONTENT_POLICY_ARTIFACT_ID,
      contractVersion: NHM2_PRIMARY_RAW_CONTENT_POLICY_CONTRACT_VERSION,
      sha256: NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
      familyDagOrdering: NHM2_PRIMARY_RAW_OUTPUT_FAMILY_DAG_ORDERING,
      familyCount: NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_FAMILY_COUNT,
      roleCount: NHM2_PRIMARY_RAW_SOLVER_SUITE_EXPECTED_ROLE_COUNT,
      coverageSha256: NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_COVERAGE_SHA256,
    },
    familyCoverage: NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE.map(
      (family) => ({
        familyId: family.familyId,
        parentFamilyIds: [...family.parentFamilyIds],
        semanticRoles: [...family.semanticRoles],
        kernelEnrollmentIds: ["external-primary-suite-v1"],
      }),
    ),
    kernelEnrollments: [
      {
        enrollmentId: "external-primary-suite-v1",
        kernelKind: "external",
        producerMode: "external_binary",
        solver: {
          solverId: "primary-raw-external-suite",
          implementationId: "primary-raw-external-suite-linux-x64",
          version: "1.0.0",
        },
        target: { platform: "linux", architecture: "x64" },
        sourceClosure: {
          closureId: "primary-raw-external-source-v1",
          semanticSha256: sha("5"),
          entryCount: 24,
          aggregateBytes: 8192,
          ledger: artifact("primary_raw_source_ledger", sha("1")),
        },
        toolchain: {
          toolchainId: "primary-raw-external-toolchain-v1",
          semanticSha256: sha("6"),
          ledger: artifact("primary_raw_toolchain_ledger", sha("2")),
        },
        executable: artifact("primary_raw_executable", sha("3")),
        environment: {
          environmentId: "primary-raw-linux-x64-environment-v1",
          semanticSha256: sha("7"),
          lock: artifact("primary_raw_environment_lock", sha("4")),
        },
        claimBoundary: {
          administrativeEnrollmentOnly: true,
          pinnedIdentityOnly: true,
          executionAuthorized: false,
          outputAcceptedWithoutServerReplay: false,
          scientificAuthority: false,
        },
      },
    ],
    primaryProducerBundle: {
      bundleId: "nhm2-primary-producer-bundle-v1",
      sourceSnapshotSha256: sha("8"),
      bundle: {
        ...artifact("primary_producer_bundle", sha("9")),
        artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_ARTIFACT_ID,
        contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_SCHEMA_VERSION,
        relativePath: "enrollment/primary-producer-bundle.v1.mjs",
      },
      buildMetadata: {
        ...artifact("primary_producer_bundle_build", sha("a")),
        artifactId: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_ARTIFACT_ID,
        contractVersion: NHM2_PRIMARY_PRODUCER_BUNDLE_BUILD_CONTRACT_VERSION,
        relativePath: "enrollment/primary-producer-bundle-build.v1.json",
      },
    },
    rawOutputProtocol: {
      protocol: NHM2_PRIMARY_RAW_SOLVER_SUITE_MANIFEST_PROTOCOL,
      manifest: {
        artifactId: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
        contractVersion: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
        relativePath: "primary-raw-output-manifest.v1.json",
      },
      dataFilesDeclaredBeforeManifest: true,
      manifestWrittenLast: true,
      manifestExcludedFromDataFileInventory: true,
      unlistedFilesForbidden: true,
      extraDirectoriesForbidden: true,
      inventoryReopenedByServer: true,
    },
    publication: {
      authority: "server_only",
      governedRootId: "nhm2-primary-raw-run-root",
      governedRootPolicy: artifact(
        "primary_raw_governed_root_policy",
        sha("b"),
      ),
      governedRootResolvedByServer: true,
      callerSuppliedRootAllowed: false,
      publicationOutsideGovernedRootAllowed: false,
      symlinkOrReparseTraversalAllowed: false,
      publishAfterServerReplayOnly: true,
    },
    executionBoundary: {
      administrativeEnrollmentOnly: true,
      runtimeWiringIncluded: false,
      executionAuthorized: false,
      syntheticFallbackAllowed: false,
      repositoryScriptFallbackAllowed: false,
      kernelOutputTrustedWithoutServerReplay: false,
    },
    claimLocks: {
      rawSuiteExecuted: false,
      rawManifestProduced: false,
      diagnosticAdmissibilityEstablished: false,
      theoryModelValidated: false,
      theoryClosureEstablished: false,
      formalProofEstablished: false,
      empiricalValidationEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      certifiedSpeedEstablished: false,
    },
  } as Omit<Nhm2PrimaryRawSolverSuiteEnrollmentV1, "semanticSha256">;

  return {
    ...enrollment,
    semanticSha256:
      computeNhm2PrimaryRawSolverSuiteEnrollmentSemanticSha256(enrollment),
  };
};

const clone = (): Nhm2PrimaryRawSolverSuiteEnrollmentV1 =>
  structuredClone(fixture());

const rehash = (
  enrollment: Nhm2PrimaryRawSolverSuiteEnrollmentV1,
): Nhm2PrimaryRawSolverSuiteEnrollmentV1 => {
  enrollment.semanticSha256 =
    computeNhm2PrimaryRawSolverSuiteEnrollmentSemanticSha256(enrollment);
  return enrollment;
};

describe("NHM2 primary raw solver-suite enrollment", () => {
  it("binds the canonical nine-family, 107-role policy without granting authority", () => {
    expect(
      NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_FAMILY_COVERAGE,
    ).toHaveLength(9);
    expect(NHM2_PRIMARY_RAW_SOLVER_SUITE_CANONICAL_ROLE_COUNT).toBe(107);

    const enrollment = fixture();
    expect(validateNhm2PrimaryRawSolverSuiteEnrollmentV1(enrollment)).toEqual({
      contractVersion:
        NHM2_PRIMARY_RAW_SOLVER_SUITE_ENROLLMENT_CONTRACT_VERSION,
      schemaValid: true,
      semanticHashValid: true,
      canonicalPolicyBound: true,
      exactFamilyRoleCoverage: true,
      kernelsPinned: true,
      publicationLocked: true,
      claimsLocked: true,
      executionAuthority: false,
      scientificAuthority: false,
      violations: [],
    });
    expect(isNhm2PrimaryRawSolverSuiteEnrollmentV1(enrollment)).toBe(true);
  });

  it("rejects policy-hash, role-cardinality, DAG, or semantic-role drift", () => {
    const policyDrift = clone();
    policyDrift.contentPolicy.sha256 = sha("c");
    policyDrift.contentPolicy.roleCount = 106;
    rehash(policyDrift);
    expect(
      nhm2PrimaryRawSolverSuiteEnrollmentViolations(policyDrift),
    ).toContain("content_policy_binding_invalid");

    const coverageDrift = clone();
    coverageDrift.familyCoverage[3].parentFamilyIds = [];
    coverageDrift.familyCoverage[3].semanticRoles[0] = "invented_role";
    rehash(coverageDrift);
    expect(
      nhm2PrimaryRawSolverSuiteEnrollmentViolations(coverageDrift),
    ).toContain("family_dag_or_roles_invalid:full_apparatus_source_tensor");
  });

  it("requires pinned external or formal kernels and exact family assignment", () => {
    const kernel = clone();
    kernel.kernelEnrollments[0].kernelKind = "formal";
    kernel.kernelEnrollments[0].sourceClosure.semanticSha256 = "bad";
    kernel.kernelEnrollments[0].environment.lock.sha256 =
      kernel.kernelEnrollments[0].executable.sha256;
    kernel.familyCoverage[0].kernelEnrollmentIds = ["unknown-kernel"];
    rehash(kernel);

    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(kernel)).toEqual(
      expect.arrayContaining([
        "kernel_identity_invalid:/kernelEnrollments/0",
        "kernel_source_closure_invalid:/kernelEnrollments/0",
        "kernel_artifact_hashes_not_distinct:/kernelEnrollments/0",
        "family_kernel_binding_unknown:semiclassical_state:unknown-kernel",
      ]),
    );

    const none = clone();
    none.kernelEnrollments = [];
    rehash(none);
    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(none)).toContain(
      "kernel_enrollments_missing",
    );
  });

  it("pins primary producer bundle identity and rejects aliases", () => {
    const enrollment = clone();
    enrollment.primaryProducerBundle.bundle.artifactId = "nhm2.wrong_bundle";
    enrollment.primaryProducerBundle.buildMetadata.sha256 =
      enrollment.primaryProducerBundle.bundle.sha256;
    rehash(enrollment);

    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(enrollment)).toEqual(
      expect.arrayContaining([
        "artifact_identity_invalid:/primaryProducerBundle/bundle",
        "primary_producer_bundle_artifacts_not_distinct",
      ]),
    );
  });

  it("enforces manifest-last closed inventory and server-only publication", () => {
    const enrollment = clone() as any;
    enrollment.rawOutputProtocol.manifestWrittenLast = false;
    enrollment.rawOutputProtocol.unlistedFilesForbidden = false;
    enrollment.publication.authority = "caller";
    enrollment.publication.callerSuppliedRootAllowed = true;
    enrollment.publication.governedRootPolicy.relativePath = "../policy.json";
    rehash(enrollment);

    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(enrollment)).toEqual(
      expect.arrayContaining([
        "raw_output_protocol_invalid",
        "publication_boundary_invalid",
        "artifact_path_invalid:/publication/governedRootPolicy",
      ]),
    );
  });

  it("forbids synthetic/runtime fallback and keeps every claim false", () => {
    const runtime = clone();
    runtime.executionBoundary.runtimeWiringIncluded = true as false;
    runtime.executionBoundary.syntheticFallbackAllowed = true as false;
    rehash(runtime);
    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(runtime)).toContain(
      "execution_boundary_invalid",
    );

    for (const key of Object.keys(fixture().claimLocks)) {
      const enrollment = clone() as any;
      enrollment.claimLocks[key] = true;
      rehash(enrollment);
      expect(
        nhm2PrimaryRawSolverSuiteEnrollmentViolations(enrollment),
      ).toContain("claim_locks_invalid");
    }
  });

  it("rejects stale semantic hashes, unknown fields, and unsafe paths", () => {
    const stale = clone();
    stale.kernelEnrollments[0].solver.version = "1.0.1";
    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(stale)).toContain(
      "descriptor_semantic_sha256_mismatch",
    );

    const extra = clone() as any;
    extra.runtimeRoute = "/api/run";
    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(extra)).toEqual([
      "descriptor_shape_invalid",
    ]);
    expect(validateNhm2PrimaryRawSolverSuiteEnrollmentV1(extra)).toMatchObject({
      schemaValid: false,
      claimsLocked: false,
    });

    const unsafe = clone();
    unsafe.kernelEnrollments[0].executable.relativePath =
      "enrollment/latest/solver";
    rehash(unsafe);
    expect(nhm2PrimaryRawSolverSuiteEnrollmentViolations(unsafe)).toContain(
      "artifact_path_invalid:/kernelEnrollments/0/executable",
    );
  });
});
