import { describe, expect, it } from "vitest";

import {
  computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256,
  isNhm2IndependentNumericalExecutionDescriptorV1,
  nhm2IndependentNumericalExecutionDescriptorViolations,
  validateNhm2IndependentNumericalExecutionDescriptorV1,
  type Nhm2IndependentNumericalExternalExecutionDescriptorV1,
} from "../shared/contracts/nhm2-independent-numerical-execution-descriptor.v1";

const sha = (digit: string): string => digit.repeat(64);

const artifact = (
  suffix: string,
  digest: string,
): Nhm2IndependentNumericalExternalExecutionDescriptorV1["toolchain"]["ledger"] => ({
  artifactId: `nhm2.${suffix}`,
  contractVersion: `nhm2_${suffix}/v1`,
  relativePath: `enrollment/${suffix}.v1.bin`,
  sha256: digest,
  sizeBytes: 128,
});

const fixture = (): Nhm2IndependentNumericalExternalExecutionDescriptorV1 => {
  const descriptor = {
    artifactId: "nhm2.independent_numerical_external_execution_descriptor",
    contractVersion:
      "nhm2_independent_numerical_external_execution_descriptor/v1",
    generatedAt: "2026-07-20T12:00:00.000Z",
    descriptorId: "independent-suite-linux-x64-v1",
    planRole: "independent_numerical",
    producerMode: "external_binary",
    solverFamily: "independent_replication_suite",
    solver: {
      solverId: "independent-suite",
      implementationId: "external-independent-implementation-v1",
      version: "1.0.0",
      independenceGroup: "external-laboratory-a",
    },
    approvedPolicy: {
      artifactId: "nhm2.independent_numerical_approved_toolchain_policy",
      contractVersion:
        "nhm2_independent_numerical_approved_toolchain_policy/v1",
      policyId: "independent-suite-linux-x64-policy-v1",
      semanticSha256: sha("1"),
      approvedAt: "2026-07-20T11:00:00.000Z",
      artifact: {
        ...artifact("independent_policy", sha("2")),
        artifactId: "nhm2.independent_numerical_approved_toolchain_policy",
        contractVersion:
          "nhm2_independent_numerical_approved_toolchain_policy/v1",
      },
    },
    target: { platform: "linux", architecture: "x64" },
    implementationSourceClosure: {
      closureId: "independent-suite-source-v1",
      closureSha256: sha("3"),
      entryCount: 12,
      aggregateBytes: 4096,
      ledger: artifact("independent_source_ledger", sha("4")),
    },
    toolchain: {
      ledger: artifact("independent_toolchain_ledger", sha("5")),
      executable: artifact("independent_executable", sha("6")),
    },
    environment: {
      lock: artifact("independent_environment_lock", sha("7")),
      allowlist: ["LANG", "OMP_NUM_THREADS"],
      values: { LANG: "C", OMP_NUM_THREADS: "1" },
    },
    primaryLineage: {
      solverId: "casimirbot-primary",
      implementationId: "casimirbot-primary-v2",
      solverDescriptorSha256: sha("8"),
      environmentLockSha256: sha("9"),
      producerBundleSha256: sha("a"),
      sourceClosureSha256: sha("b"),
    },
    claimBoundary: {
      administrativeEnrollmentOnly: true,
      serverPolicyAdmissionRequired: true,
      serverPresealRequired: true,
      externalProcessObservationIsNotScientificReplay: true,
      serverFieldLevelReplayRequired: true,
    },
    claimLocks: {
      descriptorEstablishesInstalledPolicy: false,
      descriptorEstablishesExecutableAvailability: false,
      independentImplementationLineageEstablished: false,
      independentContentLineageExclusionEstablished: false,
      independentNumericalReplicationReady: false,
      theoryClosureEstablished: false,
      empiricalValidationEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      certifiedSpeedEstablished: false,
    },
  } as Omit<
    Nhm2IndependentNumericalExternalExecutionDescriptorV1,
    "semanticSha256"
  >;
  return {
    ...descriptor,
    semanticSha256:
      computeNhm2IndependentNumericalExecutionDescriptorSemanticSha256(
        descriptor,
      ),
  };
};

const clone = (): Nhm2IndependentNumericalExternalExecutionDescriptorV1 =>
  structuredClone(fixture());

describe("NHM2 independent external execution descriptor", () => {
  it("accepts a fully bound external-binary enrollment while granting no authority", () => {
    const descriptor = fixture();
    const result =
      validateNhm2IndependentNumericalExecutionDescriptorV1(descriptor);

    expect(result).toEqual({
      contractVersion:
        "nhm2_independent_numerical_external_execution_descriptor/v1",
      schemaValid: true,
      semanticHashValid: true,
      primaryLineageDistinct: true,
      claimsLocked: true,
      executionAuthority: false,
      scientificAuthority: false,
      violations: [],
    });
    expect(isNhm2IndependentNumericalExecutionDescriptorV1(descriptor)).toBe(
      true,
    );
  });

  it("requires the external-binary producer and governed independent solver family", () => {
    const descriptor = clone() as any;
    descriptor.producerMode = "repository_script";
    descriptor.solverFamily = "casimirbot";

    expect(
      nhm2IndependentNumericalExecutionDescriptorViolations(descriptor),
    ).toContain("descriptor_identity_invalid");
  });

  it("binds the approved policy, target, source closure, toolchain, and environment", () => {
    const descriptor = clone() as any;
    descriptor.approvedPolicy.semanticSha256 = "bad";
    descriptor.approvedPolicy.artifact.artifactId =
      "nhm2.shadow_approved_policy";
    descriptor.target.architecture = "";
    descriptor.implementationSourceClosure.entryCount = 0;
    descriptor.toolchain.executable.relativePath =
      descriptor.toolchain.ledger.relativePath;
    descriptor.environment.allowlist.reverse();

    const violations =
      nhm2IndependentNumericalExecutionDescriptorViolations(descriptor);
    expect(violations).toEqual(
      expect.arrayContaining([
        "approved_policy_binding_invalid",
        "approved_policy_artifact_identity_invalid",
        "target_binding_invalid",
        "source_closure_binding_invalid",
        "toolchain_paths_not_distinct",
        "environment_values_invalid",
      ]),
    );
  });

  it("rejects primary solver, implementation, environment, source, and toolchain aliases", () => {
    const descriptor = clone();
    descriptor.solver.solverId = descriptor.primaryLineage.solverId;
    descriptor.solver.implementationId =
      descriptor.primaryLineage.implementationId;
    descriptor.solver.independenceGroup = descriptor.primaryLineage.solverId;
    descriptor.implementationSourceClosure.closureSha256 =
      descriptor.primaryLineage.sourceClosureSha256;
    descriptor.environment.lock.sha256 =
      descriptor.primaryLineage.environmentLockSha256;
    descriptor.toolchain.ledger.sha256 =
      descriptor.primaryLineage.producerBundleSha256;
    descriptor.toolchain.executable.sha256 =
      descriptor.primaryLineage.solverDescriptorSha256;

    const result =
      validateNhm2IndependentNumericalExecutionDescriptorV1(descriptor);
    expect(result.primaryLineageDistinct).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        "independent_solver_id_not_distinct",
        "independent_implementation_id_not_distinct",
        "independence_group_not_distinct",
        "independent_source_closure_aliases_primary_lineage",
        "independent_environment_lock_aliases_primary_lineage",
        "independent_toolchain_ledger_aliases_primary_lineage",
        "independent_executable_aliases_primary_lineage",
      ]),
    );
  });

  it("rejects stale semantic hashes and unknown keys", () => {
    const stale = clone();
    stale.solver.version = "1.0.1";
    expect(
      nhm2IndependentNumericalExecutionDescriptorViolations(stale),
    ).toContain("descriptor_semantic_sha256_mismatch");

    const extra = clone() as any;
    extra.unreviewedAuthority = true;
    expect(
      nhm2IndependentNumericalExecutionDescriptorViolations(extra),
    ).toEqual(["descriptor_shape_invalid"]);
    expect(
      validateNhm2IndependentNumericalExecutionDescriptorV1(extra).claimsLocked,
    ).toBe(false);
  });

  it("does not project claim locks from an invalid or flat shadow schema", () => {
    const flatShadow = {
      artifactId: "nhm2.independent_numerical_external_execution_descriptor",
      contractVersion:
        "nhm2_independent_numerical_external_execution_descriptor/v1",
      planRole: "independent_numerical",
      producerMode: "external_binary",
      solverId: "flat-shadow-solver",
      implementationId: "flat-shadow-implementation",
      approvedPolicyId: "flat-shadow-policy",
      claimLocks: structuredClone(fixture().claimLocks),
    };

    expect(
      validateNhm2IndependentNumericalExecutionDescriptorV1(flatShadow),
    ).toMatchObject({
      schemaValid: false,
      claimsLocked: false,
      executionAuthority: false,
      scientificAuthority: false,
      violations: ["descriptor_shape_invalid"],
    });
  });

  it("rejects unsafe paths and policy approval after descriptor generation", () => {
    const descriptor = clone();
    descriptor.approvedPolicy.approvedAt = "2026-07-20T12:00:01.000Z";
    descriptor.toolchain.executable.relativePath = "../solver";

    expect(
      nhm2IndependentNumericalExecutionDescriptorViolations(descriptor),
    ).toEqual(
      expect.arrayContaining([
        "approved_policy_binding_invalid",
        "artifact_path_invalid:/toolchain/executable",
      ]),
    );
  });

  it("keeps every claim lock false", () => {
    for (const key of Object.keys(fixture().claimLocks)) {
      const descriptor = clone() as any;
      descriptor.claimLocks[key] = true;
      expect(
        nhm2IndependentNumericalExecutionDescriptorViolations(descriptor),
      ).toContain("claim_locks_invalid");
    }
  });
});
