import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES,
} from "../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_FIELD_ARRAY_EXTERNAL_KERNEL_INTEGRATION,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_OUTPUT_ROLE,
} from "../../../shared/contracts/nhm2-independent-field-array-manifest.v1";
import {
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA,
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS,
  type Nhm2IndependentNumericalReplicationRequiredFieldId,
} from "../../../shared/contracts/nhm2-independent-numerical-replication.v1";
import {
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  type Nhm2PrimaryComparisonProjectionRawSourcePolicyV1,
  type Nhm2PrimaryComparisonProjectionRawSourceUse,
} from "../../../shared/contracts/nhm2-primary-comparison-projection.v1";
import {
  NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION,
  NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES,
  type Nhm2ExternalNumericalKernelOutputObservationV1,
} from "./nhm2-external-numerical-kernel-executor";
import {
  NHM2_INDEPENDENT_NUMERICAL_EXECUTION_OBSERVATION_VERSION,
  type Nhm2IndependentNumericalExecutionObservationV1,
} from "./nhm2-independent-numerical-replication-executor";

export const NHM2_INDEPENDENT_NUMERICAL_CONTENT_ASSESSMENT_VERSION =
  "nhm2_independent_numerical_content_assessment/v1" as const;

const MAX_ASSESSMENT_OUTPUT_BYTES = 256 * 1024 * 1024;
const REQUIRED_OUTPUT_ROLES = [
  ...NHM2_EXTERNAL_NUMERICAL_KERNEL_POLICIES.independent_numerical_replication
    .requiredOutputRoles,
] as const;

type PrimaryRawSourceRequirement = {
  readonly familyId: Nhm2PrimaryComparisonProjectionRawSourcePolicyV1["familyId"];
  readonly semanticRole: string;
  readonly uses: readonly Nhm2PrimaryComparisonProjectionRawSourceUse[];
};

/**
 * Read-only assessment projection of the canonical primitive lineage policy.
 * The projection contract is the sole authority: this map preserves its field
 * order, raw-source order, family/role pairs, and declared uses without adding
 * derived or comparison-only producer roles. It does not authorize a
 * projection or comparison today.
 */
export const NHM2_INDEPENDENT_NUMERICAL_PRIMARY_SOURCE_REQUIREMENTS: Readonly<
  Record<
    Nhm2IndependentNumericalReplicationRequiredFieldId,
    readonly PrimaryRawSourceRequirement[]
  >
> =
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.reduce<
    Record<
      Nhm2IndependentNumericalReplicationRequiredFieldId,
      readonly PrimaryRawSourceRequirement[]
  >
  >((requirements, fieldPolicy) => {
    requirements[fieldPolicy.fieldId] = fieldPolicy.rawSources;
    return requirements;
  }, {} as Record<
    Nhm2IndependentNumericalReplicationRequiredFieldId,
    readonly PrimaryRawSourceRequirement[]
  >);

export type Nhm2IndependentNumericalContentAssessmentStatus =
  "not_evaluable";

export type Nhm2IndependentNumericalContentAssessmentOutputReadbackV1 = {
  role: string;
  relativePath: string;
  declaredSha256: string;
  observedSha256: string | null;
  declaredSizeBytes: number;
  observedSizeBytes: number | null;
  status: "verified_opaque_output" | "not_verified";
  blockers: string[];
};

export type Nhm2IndependentNumericalContentAssessmentV1 = {
  artifactId: "nhm2.independent_numerical_content_assessment";
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_CONTENT_ASSESSMENT_VERSION;
  generatedAt: string;
  status: Nhm2IndependentNumericalContentAssessmentStatus;
  source: {
    executionObservationContractVersion: string | null;
    candidateId: string | null;
    runId: string | null;
    kernelObservationContractVersion: string | null;
    kernelOutputInventorySha256: string | null;
  };
  filesystemReadback: {
    outputRoot: string | null;
    status: "verified_opaque_outputs" | "not_verified";
    expectedRoles: string[];
    outputs: Nhm2IndependentNumericalContentAssessmentOutputReadbackV1[];
  };
  schemaAssessment: {
    opaqueExecutorRolesOnly: true;
    typedFieldArrayManifestContractRegistered: true;
    typedFieldArrayManifestRoleObserved: boolean;
    primaryRawFilesystemVerificationBound: false;
    primaryComparisonProjectionManifestBound: false;
    independentFieldArrayBindingsPresent: false;
    sharedSampleDomainManifestBound: false;
    relativeLInfDenominatorPolicyFrozen: false;
    uncertaintyDerivationManifestBound: false;
    serverOwnedFloat64ReplayPerformed: false;
  };
  comparisons: Array<{
    ordinal: number;
    fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
    componentOrder: string[];
    primaryRawSourceRequirement: PrimaryRawSourceRequirement[];
    arraySchemaRequirement: {
      dtype: "float64";
      encoding: "raw_ieee754";
      endianness: "little";
      rank: 2;
      storageOrder: "row-major";
      shape: ["sample_count", number];
      finiteValuesRequired: true;
      pathSha256AndSizeRequired: true;
      primaryAndIndependentShapeEqualityRequired: true;
    };
    sampleDomainRequirement: {
      artifactIdContractVersionPathSha256AndSizeRequired: true;
      orderedRowIdentityRequired: true;
      coordinateTimeWorldlineOrObservableAxesRequired: true;
      sharedPrimaryIndependentDomainSha256Required: true;
      sampleCountMinimum: number;
      refinementLevelsMinimum: number;
      observedConvergenceOrderMinimum: number;
      domainCoverageFractionRequired: number;
    };
    metricRequirement: {
      metric: "relative_L_inf";
      comparator: "lte";
      tolerance: number;
      serverRecomputationRequired: true;
      denominatorAndZeroScalePolicyMustBeFrozen: true;
    };
    status: "not_evaluable";
    metricValue: null;
    blockers: string[];
  }>;
  requiredComparisonCount: number;
  recomputedComparisonCount: 0;
  maximumRelativeLInf: null;
  independentReplicationArtifact: null;
  independentNumericalReplicationReady: false;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    opaqueExternalOutputReadbackIsNotScientificReplay: true;
    fieldLevelScientificReplayRequired: true;
    passingIndependentReplicationArtifactMayBeEmitted: false;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
  };
};

const SHA256 = /^[a-f0-9]{64}$/;

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) =>
    Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
  );

const sameFilesystemPath = (left: string, right: string): boolean => {
  const normalize = (value: string): string => {
    const resolved = path.resolve(value);
    return process.platform === "win32" ? resolved.toLowerCase() : resolved;
  };
  return normalize(left) === normalize(right);
};

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const isPortableRelativePath = (value: string): boolean =>
  value.length > 0 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !path.posix.isAbsolute(value) &&
  value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );

const hashRegularFile = async (input: {
  root: string;
  output: Nhm2ExternalNumericalKernelOutputObservationV1;
}): Promise<Nhm2IndependentNumericalContentAssessmentOutputReadbackV1> => {
  const blockers: string[] = [];
  let observedSha256: string | null = null;
  let observedSizeBytes: number | null = null;
  const result = () => ({
    role: input.output.role,
    relativePath: input.output.relativePath,
    declaredSha256: input.output.sha256,
    observedSha256,
    declaredSizeBytes: input.output.sizeBytes,
    observedSizeBytes,
    status: blockers.length === 0
      ? ("verified_opaque_output" as const)
      : ("not_verified" as const),
    blockers: uniqueSorted(blockers),
  });

  if (!isPortableRelativePath(input.output.relativePath)) {
    blockers.push(`output_path_invalid:${input.output.role}`);
    return result();
  }
  if (!SHA256.test(input.output.sha256)) {
    blockers.push(`output_declared_sha256_invalid:${input.output.role}`);
  }
  if (
    !Number.isSafeInteger(input.output.sizeBytes) ||
    input.output.sizeBytes < 0
  ) {
    blockers.push(`output_declared_size_invalid:${input.output.role}`);
  }
  const absolutePath = path.resolve(
    input.root,
    ...input.output.relativePath.split("/"),
  );
  if (!isInside(input.root, absolutePath)) {
    blockers.push(`output_path_escape:${input.output.role}`);
    return result();
  }
  try {
    const before = await fs.lstat(absolutePath);
    if (before.isSymbolicLink() || !before.isFile()) {
      blockers.push(`output_not_regular_file:${input.output.role}`);
      return result();
    }
    if (before.nlink !== 1) {
      blockers.push(`output_hardlink_forbidden:${input.output.role}`);
      return result();
    }
    if (before.size > MAX_ASSESSMENT_OUTPUT_BYTES) {
      blockers.push(`output_assessment_byte_limit_exceeded:${input.output.role}`);
      return result();
    }
    const realPath = await fs.realpath(absolutePath);
    if (!sameFilesystemPath(realPath, absolutePath) || !isInside(input.root, realPath)) {
      blockers.push(`output_realpath_mismatch:${input.output.role}`);
      return result();
    }
    const digest = createHash("sha256");
    let byteCount = 0;
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(absolutePath);
      stream.on("data", (chunk: Buffer) => {
        byteCount += chunk.byteLength;
        if (byteCount > MAX_ASSESSMENT_OUTPUT_BYTES) {
          stream.destroy(new Error("assessment_byte_limit_exceeded"));
          return;
        }
        digest.update(chunk);
      });
      stream.on("error", reject);
      stream.on("end", resolve);
    });
    const after = await fs.lstat(absolutePath);
    if (
      after.isSymbolicLink() ||
      !after.isFile() ||
      after.nlink !== 1 ||
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      byteCount !== after.size
    ) {
      blockers.push(`output_changed_during_assessment:${input.output.role}`);
      return result();
    }
    observedSizeBytes = byteCount;
    observedSha256 = digest.digest("hex");
    if (observedSizeBytes !== input.output.sizeBytes) {
      blockers.push(`output_size_mismatch:${input.output.role}`);
    }
    if (observedSha256 !== input.output.sha256) {
      blockers.push(`output_sha256_mismatch:${input.output.role}`);
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    blockers.push(
      code === "ENOENT"
        ? `output_missing:${input.output.role}`
        : code === "assessment_byte_limit_exceeded"
          ? `output_assessment_byte_limit_exceeded:${input.output.role}`
          : `output_read_failed:${input.output.role}`,
    );
  }
  return result();
};

const verifyOutputRoot = async (
  root: string,
): Promise<{ root: string | null; blockers: string[] }> => {
  const blockers: string[] = [];
  if (!path.isAbsolute(root) || root.includes("\0")) {
    return { root: null, blockers: ["kernel_output_root_invalid"] };
  }
  const resolved = path.resolve(root);
  try {
    const stat = await fs.lstat(resolved);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      blockers.push("kernel_output_root_not_regular_directory");
      return { root: null, blockers };
    }
    const realPath = await fs.realpath(resolved);
    if (!sameFilesystemPath(realPath, resolved)) {
      blockers.push("kernel_output_root_realpath_mismatch");
      return { root: null, blockers };
    }
    return { root: resolved, blockers };
  } catch {
    return { root: null, blockers: ["kernel_output_root_unreadable"] };
  }
};

const fieldBlockers = (
  fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId,
): string[] => [
  `${fieldId}:primary_raw_filesystem_verification_not_bound`,
  `${fieldId}:primary_comparison_projection_manifest_missing`,
  `${fieldId}:primary_array_path_sha256_size_shape_component_binding_missing`,
  `${fieldId}:independent_array_path_sha256_size_shape_component_binding_missing`,
  `${fieldId}:shared_sample_domain_manifest_missing`,
  `${fieldId}:shared_sample_domain_sha256_missing`,
  `${fieldId}:relative_l_inf_denominator_and_zero_scale_policy_missing`,
  `${fieldId}:uncertainty_derivation_binding_missing`,
  `${fieldId}:server_owned_float64_comparison_not_recomputed`,
];

/**
 * Reopens the executor-observed files and rechecks their content addresses.
 * The current fixed output roles are intentionally treated as opaque bytes:
 * the registered field-array manifest cannot yet bind its declared sidecars
 * through the kernel inventory. Consequently this function has no passing
 * branch and cannot emit nhm2_independent_numerical_replication/v1.
 */
export async function assessNhm2IndependentNumericalReplicationContent(input: {
  executionObservation: Nhm2IndependentNumericalExecutionObservationV1;
}): Promise<Nhm2IndependentNumericalContentAssessmentV1> {
  const observation = input.executionObservation;
  const kernel = observation.kernelObservation;
  const typedFieldArrayManifestRoleObserved =
    kernel?.outputs.some(
      (entry) =>
        entry.role === NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_OUTPUT_ROLE,
    ) === true;
  const blockers: string[] = [];
  let outputRoot: string | null = null;
  let outputs: Nhm2IndependentNumericalContentAssessmentOutputReadbackV1[] = [];

  if (
    observation.artifactId !== "nhm2.independent_numerical_execution_observation" ||
    observation.contractVersion !==
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_OBSERVATION_VERSION
  ) {
    blockers.push("execution_observation_contract_invalid");
  }
  if (
    observation.status !== "execution_observed_scientific_replay_required" ||
    kernel == null
  ) {
    blockers.push("successful_kernel_execution_observation_missing");
  } else {
    if (
      kernel.artifactId !== "nhm2.external_numerical_kernel_observation" ||
      kernel.contractVersion !== NHM2_EXTERNAL_NUMERICAL_KERNEL_OBSERVATION_VERSION ||
      kernel.lane !== "independent_numerical_replication" ||
      kernel.status !== "execution_observed_scientific_replay_required"
    ) {
      blockers.push("kernel_observation_contract_invalid");
    }
    const roleOrder = kernel.outputs.map((entry) => entry.role).sort();
    const expectedRoleOrder = [...REQUIRED_OUTPUT_ROLES].sort();
    if (JSON.stringify(roleOrder) !== JSON.stringify(expectedRoleOrder)) {
      blockers.push("opaque_output_role_set_not_exact");
    }
    if (
      new Set(kernel.outputs.map((entry) => entry.relativePath)).size !==
      kernel.outputs.length
    ) {
      blockers.push("opaque_output_paths_not_unique");
    }
    const rootVerification = await verifyOutputRoot(kernel.process.cwd);
    blockers.push(...rootVerification.blockers);
    outputRoot = rootVerification.root;
    if (outputRoot != null) {
      outputs = await Promise.all(
        kernel.outputs.map((output) =>
          hashRegularFile({ root: outputRoot!, output }),
        ),
      );
      blockers.push(...outputs.flatMap((entry) => entry.blockers));
    }
  }

  const comparisons = NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.map(
    (field, index) => ({
      ordinal: index + 1,
      fieldId: field.fieldId,
      componentOrder: [...field.componentOrder],
      primaryRawSourceRequirement:
        NHM2_INDEPENDENT_NUMERICAL_PRIMARY_SOURCE_REQUIREMENTS[
          field.fieldId
        ].map((source) => ({
          familyId: source.familyId,
          semanticRole: source.semanticRole,
          uses: [...source.uses],
        })),
      arraySchemaRequirement: {
        dtype: "float64" as const,
        encoding: "raw_ieee754" as const,
        endianness: "little" as const,
        rank: 2 as const,
        storageOrder: "row-major" as const,
        shape: ["sample_count" as const, field.componentOrder.length] as [
          "sample_count",
          number,
        ],
        finiteValuesRequired: true as const,
        pathSha256AndSizeRequired: true as const,
        primaryAndIndependentShapeEqualityRequired: true as const,
      },
      sampleDomainRequirement: {
        artifactIdContractVersionPathSha256AndSizeRequired: true as const,
        orderedRowIdentityRequired: true as const,
        coordinateTimeWorldlineOrObservableAxesRequired: true as const,
        sharedPrimaryIndependentDomainSha256Required: true as const,
        sampleCountMinimum:
          NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES[index]
            .minimumSampleCount,
        refinementLevelsMinimum:
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA
            .refinementLevels,
        observedConvergenceOrderMinimum:
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA
            .observedConvergenceOrder,
        domainCoverageFractionRequired:
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA
            .domainCoverageFraction,
      },
      metricRequirement: {
        metric: "relative_L_inf" as const,
        comparator: "lte" as const,
        tolerance:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES
            .field_level_outputs_agree_within_frozen_tolerances.threshold,
        serverRecomputationRequired: true as const,
        denominatorAndZeroScalePolicyMustBeFrozen: true as const,
      },
      status: "not_evaluable" as const,
      metricValue: null,
      blockers: fieldBlockers(field.fieldId),
    }),
  );

  blockers.push(
    NHM2_INDEPENDENT_FIELD_ARRAY_EXTERNAL_KERNEL_INTEGRATION.blocker,
    ...(typedFieldArrayManifestRoleObserved
      ? []
      : ["independent_field_array_manifest_role_not_observed"]),
    "primary_raw_filesystem_verification_not_bound_to_assessment",
    "primary_comparison_projection_manifest_not_bound",
    "independent_field_array_bindings_missing",
    "shared_sample_domain_manifest_missing",
    "relative_l_inf_denominator_and_zero_scale_policy_not_frozen",
    "uncertainty_derivation_manifest_missing",
    "all_nine_field_level_comparisons_not_recomputed",
    "independent_replication_artifact_not_emitted",
    ...comparisons.flatMap((entry) => entry.blockers),
  );

  const filesystemReadbackStatus =
    kernel != null &&
    outputRoot != null &&
    outputs.length === REQUIRED_OUTPUT_ROLES.length &&
    outputs.every((entry) => entry.status === "verified_opaque_output") &&
    !blockers.includes("opaque_output_role_set_not_exact") &&
    !blockers.includes("opaque_output_paths_not_unique")
      ? "verified_opaque_outputs"
      : "not_verified";

  return {
    artifactId: "nhm2.independent_numerical_content_assessment",
    contractVersion: NHM2_INDEPENDENT_NUMERICAL_CONTENT_ASSESSMENT_VERSION,
    generatedAt: new Date().toISOString(),
    status: "not_evaluable",
    source: {
      executionObservationContractVersion:
        typeof observation.contractVersion === "string"
          ? observation.contractVersion
          : null,
      candidateId: observation.candidate?.candidateId ?? null,
      runId: observation.plan?.runId ?? null,
      kernelObservationContractVersion: kernel?.contractVersion ?? null,
      kernelOutputInventorySha256: kernel?.outputInventorySha256 ?? null,
    },
    filesystemReadback: {
      outputRoot,
      status: filesystemReadbackStatus,
      expectedRoles: [...REQUIRED_OUTPUT_ROLES],
      outputs,
    },
    schemaAssessment: {
      opaqueExecutorRolesOnly: true,
      typedFieldArrayManifestContractRegistered: true,
      typedFieldArrayManifestRoleObserved,
      primaryRawFilesystemVerificationBound: false,
      primaryComparisonProjectionManifestBound: false,
      independentFieldArrayBindingsPresent: false,
      sharedSampleDomainManifestBound: false,
      relativeLInfDenominatorPolicyFrozen: false,
      uncertaintyDerivationManifestBound: false,
      serverOwnedFloat64ReplayPerformed: false,
    },
    comparisons,
    requiredComparisonCount:
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length,
    recomputedComparisonCount: 0,
    maximumRelativeLInf: null,
    independentReplicationArtifact: null,
    independentNumericalReplicationReady: false,
    blockers: uniqueSorted(blockers),
    claimBoundary: {
      diagnosticOnly: true,
      opaqueExternalOutputReadbackIsNotScientificReplay: true,
      fieldLevelScientificReplayRequired: true,
      passingIndependentReplicationArtifactMayBeEmitted: false,
      theoryClosureEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      certifiedSpeedEstablished: false,
      empiricalValidationEstablished: false,
    },
  };
}
