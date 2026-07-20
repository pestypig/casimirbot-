import { createHash } from "node:crypto";
import path from "node:path";

import {
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
  type Nhm2PrimaryComparisonProjectionManifestV1,
  nhm2PrimaryComparisonProjectionManifestViolations,
} from "../../../shared/contracts/nhm2-primary-comparison-projection.v1";
import type {
  Nhm2PrimaryRawOutputFilesystemVerification,
  Nhm2PrimaryRawOutputVerifiedFile,
} from "./nhm2-primary-raw-output-filesystem-verifier";

export const NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_ARTIFACT_ID =
  "nhm2.primary_comparison_projection_assessment" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_CONTRACT_VERSION =
  "nhm2_primary_comparison_projection_assessment/v1" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_ARTIFACT_ID =
  "nhm2.primary_comparison_projection_freeze_admission" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_CONTRACT_VERSION =
  "nhm2_primary_comparison_projection_freeze_admission/v1" as const;

export type Nhm2PrimaryComparisonProjectionFreezeAdmissionV1 = {
  artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_CONTRACT_VERSION;
  registrationId: string;
  candidateId: string;
  primaryRunId: string;
  independentRequestId: string;
  independentRunId: string;
  independentPlanSha256: string;
  projectionManifestSha256: string;
  registeredAt: string;
  independentExecutionNotBefore: string;
  authority: "server_owned_pre_spawn_store";
};

export type Nhm2PrimaryComparisonProjectionAssessmentV1 = {
  artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_CONTRACT_VERSION;
  generatedAt: string;
  status: "not_ready";
  source: {
    manifestArtifactId: string | null;
    manifestContractVersion: string | null;
    manifestSha256: string | null;
    rawFilesystemVerificationObserved: boolean;
    rawFilesystemVerificationBoundToProjectionManifest: boolean;
    rawManifestSha256: string | null;
    rawInputClosureSha256: string | null;
    rawVerifiedFileInventorySha256: string | null;
  };
  structuralAssessment: {
    exactNineFields: boolean;
    exactComponentOrderAndUnits: boolean;
    exactPrimitiveSourceLineage: boolean;
    exactProjectionAndUncertaintyDerivations: boolean;
    float64OutputMetadataBound: boolean;
    orderedDomainMetadataBound: boolean;
    identityBoundToRawRun: boolean;
    freezeAdmissionBound: boolean;
    outputFilesystemReadbackPerformed: false;
    orderedDomainFilesystemReadbackPerformed: false;
    serverOwnedProjectionReplayPerformed: false;
  };
  fields: Array<{
    ordinal: number;
    fieldId: string;
    status: "not_ready";
    rawSourceBindingsMatchVerifiedPackage: boolean;
    outputMetadataStructurallyValid: boolean;
    orderedDomainMetadataStructurallyValid: boolean;
    uncertaintyMetadataStructurallyValid: boolean;
    serverOwnedOperatorReplayPerformed: false;
    blockers: string[];
  }>;
  primaryComparisonProjectionReady: false;
  blockers: string[];
  claimBoundary: {
    diagnosticComparisonInputOnly: true;
    metadataAssessmentIsNotArrayReplay: true;
    independentComparisonStillRequired: true;
    empiricalReceiptsStillRequired: true;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
  };
};

export type Nhm2PrimaryComparisonProjectionAssessorDependencies = {
  /** Must load from a server-owned pre-spawn store, never from producer JSON. */
  loadFreezeAdmission: (
    registrationId: string,
  ) => Promise<Nhm2PrimaryComparisonProjectionFreezeAdmissionV1 | null>;
  now?: () => Date;
};

const SHA256 = /^[a-f0-9]{64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isNullableSha256 = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && SHA256.test(value));

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) =>
          Buffer.compare(Buffer.from(left), Buffer.from(right)),
        )
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }
  return value;
};

const sha256Semantic = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(`${domain}\n`, "utf8")
    .update(JSON.stringify(stable(value)), "utf8")
    .digest("hex");

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)),
  );

const portableRelative = (root: string, absolute: string): string =>
  path.relative(root, absolute).split(path.sep).join("/");

const verifiedFileInventoryEntry = (
  file: Nhm2PrimaryRawOutputVerifiedFile,
) => ({
  familyId: file.descriptor.familyId,
  semanticRole: file.descriptor.semanticRole,
  fileId: file.descriptor.fileId,
  path: file.descriptor.path,
  declaredSha256: file.descriptor.sha256,
  observedSha256: file.observedSha256,
  declaredSizeBytes: file.descriptor.sizeBytes,
  observedSizeBytes: file.observedSizeBytes,
  representation: file.descriptor.representation,
});

export const computeNhm2PrimaryRawVerifiedFileInventorySha256 = (
  verification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >,
): string =>
  sha256Semantic(
    "nhm2-primary-raw-verified-file-inventory/v1",
    [...verification.files]
      .sort((left, right) =>
        Buffer.compare(
          Buffer.from(left.descriptor.path),
          Buffer.from(right.descriptor.path),
        ),
      )
      .map(verifiedFileInventoryEntry),
  );

export const computeNhm2PrimaryComparisonProjectionManifestSemanticSha256 = (
  manifest: Nhm2PrimaryComparisonProjectionManifestV1,
): string =>
  sha256Semantic("nhm2-primary-comparison-projection-manifest/v1", manifest);

const rawBindingBlockers = (input: {
  manifest: Nhm2PrimaryComparisonProjectionManifestV1;
  verification: Nhm2PrimaryRawOutputFilesystemVerification | null;
}): {
  blockers: string[];
  fieldMatches: boolean[];
  inventorySha256: string | null;
} => {
  const blockers: string[] = [];
  const fieldMatches = NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map(
    () => false,
  );
  if (input.verification == null || input.verification.verified !== true) {
    blockers.push("primary_raw_filesystem_verification_missing_or_failed");
    return { blockers, fieldMatches, inventorySha256: null };
  }
  const verification = input.verification;
  const raw = verification.manifest;
  const projected = input.manifest;
  const inventorySha256 =
    computeNhm2PrimaryRawVerifiedFileInventorySha256(verification);
  const expectedRelativeManifest = portableRelative(
    verification.runRootRealPath,
    verification.manifestPath,
  );
  if (
    expectedRelativeManifest.startsWith("..") ||
    expectedRelativeManifest === "" ||
    projected.rawPackage.manifestRelativePath !== expectedRelativeManifest
  ) {
    blockers.push("raw_manifest_relative_path_mismatch");
  }
  if (projected.rawPackage.manifestSha256 !== verification.manifestSha256)
    blockers.push("raw_manifest_sha256_mismatch");
  if (projected.rawPackage.contentPolicySha256 !== raw.contentPolicy.sha256)
    blockers.push("raw_content_policy_sha256_mismatch");
  if (
    projected.rawPackage.inputClosureSha256 !== raw.inputClosure.closureSha256
  )
    blockers.push("raw_input_closure_sha256_mismatch");
  if (projected.rawPackage.verifiedFileInventorySha256 !== inventorySha256)
    blockers.push("raw_verified_file_inventory_sha256_mismatch");
  const identityMismatches: string[] = [];
  const pairs: Array<[string, unknown, unknown]> = [
    ["candidate_id", projected.identity.candidateId, raw.identity.candidateId],
    ["lane_id", projected.identity.laneId, raw.identity.laneId],
    [
      "selected_profile_id",
      projected.identity.selectedProfileId,
      raw.identity.selectedProfileId,
    ],
    ["chart_id", projected.identity.chartId, raw.identity.chartId],
    [
      "primary_request_id",
      projected.identity.primaryRequestId,
      raw.execution.requestId,
    ],
    ["primary_run_id", projected.identity.primaryRunId, raw.execution.runId],
    [
      "primary_receipt_id",
      projected.identity.primaryReceiptId,
      raw.execution.receiptId,
    ],
    [
      "primary_runtime_id",
      projected.identity.primaryRuntimeId,
      raw.execution.runtimeId,
    ],
    [
      "primary_solver_id",
      projected.identity.primarySolverId,
      raw.execution.solver.solverId,
    ],
    [
      "primary_source_commit",
      projected.identity.primarySourceCommitSha,
      raw.execution.sourceCommitSha,
    ],
    [
      "candidate_manifest_input",
      projected.identity.candidateManifest.inputId,
      raw.identity.candidateManifest.inputId,
    ],
    [
      "candidate_manifest_sha",
      projected.identity.candidateManifest.sha256,
      raw.identity.candidateManifest.sha256,
    ],
    [
      "chart_input",
      projected.identity.chartDefinition.inputId,
      raw.identity.chartDefinition.inputId,
    ],
    [
      "chart_sha",
      projected.identity.chartDefinition.sha256,
      raw.identity.chartDefinition.sha256,
    ],
    [
      "units_input",
      projected.identity.units.inputId,
      raw.identity.units.inputId,
    ],
    ["units_sha", projected.identity.units.sha256, raw.identity.units.sha256],
    [
      "normalization_input",
      projected.identity.normalization.inputId,
      raw.identity.normalization.inputId,
    ],
    [
      "normalization_sha",
      projected.identity.normalization.sha256,
      raw.identity.normalization.sha256,
    ],
  ];
  for (const [label, observed, expected] of pairs) {
    if (observed !== expected) identityMismatches.push(label);
  }
  if (identityMismatches.length > 0)
    blockers.push(
      ...identityMismatches.map((entry) => `raw_identity_mismatch:${entry}`),
    );

  const filesByKey = new Map(
    verification.files.map((file) => [
      `${file.descriptor.familyId}:${file.descriptor.semanticRole}`,
      file,
    ]),
  );
  for (const [index, field] of projected.fields.entries()) {
    let matches = true;
    for (const source of field.rawSources) {
      const file = filesByKey.get(`${source.familyId}:${source.semanticRole}`);
      if (
        file == null ||
        source.fileId !== file.descriptor.fileId ||
        source.path !== file.descriptor.path ||
        source.sha256 !== file.observedSha256 ||
        source.sha256 !== file.descriptor.sha256 ||
        source.sizeBytes !== file.observedSizeBytes ||
        source.sizeBytes !== file.descriptor.sizeBytes
      ) {
        matches = false;
        blockers.push(
          `raw_source_binding_mismatch:${field.fieldId}:${source.familyId}:${source.semanticRole}`,
        );
      }
    }
    fieldMatches[index] = matches;
  }
  return { blockers, fieldMatches, inventorySha256 };
};

const freezeBlockers = (input: {
  manifest: Nhm2PrimaryComparisonProjectionManifestV1;
  manifestSha256: string;
  admission: Nhm2PrimaryComparisonProjectionFreezeAdmissionV1 | null;
  rawVerification: Nhm2PrimaryRawOutputFilesystemVerification | null;
}): string[] => {
  const blockers: string[] = [];
  const admission = input.admission;
  if (admission == null) return ["server_owned_freeze_admission_missing"];
  if (
    admission.artifactId !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_ARTIFACT_ID ||
    admission.contractVersion !==
      NHM2_PRIMARY_COMPARISON_PROJECTION_FREEZE_ADMISSION_CONTRACT_VERSION ||
    admission.authority !== "server_owned_pre_spawn_store"
  ) {
    blockers.push("server_owned_freeze_admission_contract_invalid");
  }
  const freeze = input.manifest.freeze;
  const pairs: Array<[string, unknown, unknown]> = [
    ["registration_id", freeze.registrationId, admission.registrationId],
    [
      "candidate_id",
      input.manifest.identity.candidateId,
      admission.candidateId,
    ],
    [
      "primary_run_id",
      input.manifest.identity.primaryRunId,
      admission.primaryRunId,
    ],
    [
      "independent_request_id",
      freeze.independentRequestId,
      admission.independentRequestId,
    ],
    ["independent_run_id", freeze.independentRunId, admission.independentRunId],
    [
      "independent_plan_sha256",
      freeze.independentPlanSha256,
      admission.independentPlanSha256,
    ],
    [
      "projection_manifest_sha256",
      input.manifestSha256,
      admission.projectionManifestSha256,
    ],
  ];
  for (const [label, observed, expected] of pairs) {
    if (observed !== expected)
      blockers.push(`freeze_admission_mismatch:${label}`);
  }
  const completed = Date.parse(freeze.projectionCompletedAt);
  const registered = Date.parse(admission.registeredAt);
  const notBefore = Date.parse(admission.independentExecutionNotBefore);
  if (![completed, registered, notBefore].every(Number.isFinite)) {
    blockers.push("freeze_interval_invalid");
  } else if (!(completed <= registered && registered < notBefore)) {
    blockers.push("projection_not_frozen_before_independent_run");
  }
  if (input.rawVerification?.verified === true) {
    const rawCompleted = Date.parse(
      input.rawVerification.manifest.execution.completedAt,
    );
    if (!Number.isFinite(rawCompleted) || rawCompleted > completed)
      blockers.push("projection_completed_before_raw_run");
  }
  return blockers;
};

/**
 * Creates the server-owned assessor. The default export below has no freeze
 * store installed and therefore cannot be promoted accidentally. Even a
 * structurally perfect producer manifest remains not-ready until a later
 * implementation performs filesystem readback and replays all nine operators
 * from the already verified raw primitives.
 */
export const createNhm2PrimaryComparisonProjectionAssessor =
  (dependencies: Nhm2PrimaryComparisonProjectionAssessorDependencies) =>
  async (input: {
    manifest: unknown;
    rawVerification: Nhm2PrimaryRawOutputFilesystemVerification | null;
  }): Promise<Nhm2PrimaryComparisonProjectionAssessmentV1> => {
    const now = dependencies.now?.() ?? new Date();
    const blockers: string[] = [];
    const manifestCandidate = input.manifest;
    const structuralViolations: string[] = [];
    if (manifestCandidate == null) {
      structuralViolations.push("projection_manifest_missing");
    } else {
      try {
        structuralViolations.push(
          ...nhm2PrimaryComparisonProjectionManifestViolations(
            manifestCandidate as Nhm2PrimaryComparisonProjectionManifestV1,
          ),
        );
      } catch {
        structuralViolations.push(
          "projection_manifest_structural_validation_failed",
        );
      }
    }

    let manifest =
      structuralViolations.length === 0
        ? (manifestCandidate as Nhm2PrimaryComparisonProjectionManifestV1)
        : null;
    let manifestSha256: string | null = null;
    if (manifest != null) {
      try {
        manifestSha256 =
          computeNhm2PrimaryComparisonProjectionManifestSemanticSha256(
            manifest,
          );
      } catch {
        structuralViolations.push("projection_manifest_semantic_hash_failed");
        manifest = null;
      }
    }
    blockers.push(...structuralViolations);

    // A missing projection manifest is an expected P0 state, not a reason to
    // discard the trusted raw-run observation. Keep observation and binding
    // distinct: raw provenance may be recorded while no projection manifest
    // exists to bind it. A malformed non-null manifest still gates all reads
    // of the raw-verification value so hostile producer objects cannot trigger
    // property access after structural rejection.
    let observedRawVerification: Extract<
      Nhm2PrimaryRawOutputFilesystemVerification,
      { verified: true }
    > | null = null;
    let observedRawInventorySha256: string | null = null;
    let observedRawManifestSha256: string | null = null;
    let observedRawInputClosureSha256: string | null = null;
    if (manifestCandidate == null || manifest != null) {
      try {
        if (input.rawVerification?.verified === true) {
          observedRawVerification = input.rawVerification;
          observedRawManifestSha256 = observedRawVerification.manifestSha256;
          observedRawInputClosureSha256 =
            observedRawVerification.manifest.inputClosure.closureSha256;
          if (
            !SHA256.test(observedRawManifestSha256) ||
            !SHA256.test(observedRawInputClosureSha256)
          ) {
            throw new Error("verified_raw_observation_hash_invalid");
          }
          observedRawInventorySha256 =
            computeNhm2PrimaryRawVerifiedFileInventorySha256(
              observedRawVerification,
            );
        }
      } catch {
        observedRawVerification = null;
        observedRawInventorySha256 = null;
        observedRawManifestSha256 = null;
        observedRawInputClosureSha256 = null;
        blockers.push("primary_raw_observation_assessment_failed");
      }
    }

    let rawAssessment: {
      blockers: string[];
      fieldMatches: boolean[];
      inventorySha256: string | null;
    } = {
      blockers: ["primary_raw_filesystem_verification_not_bound"],
      fieldMatches: NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map(
        () => false,
      ),
      inventorySha256: null,
    };
    let verifiedRawVerification: Extract<
      Nhm2PrimaryRawOutputFilesystemVerification,
      { verified: true }
    > | null = observedRawVerification;
    if (manifest != null) {
      try {
        rawAssessment = rawBindingBlockers({
          manifest,
          verification: input.rawVerification,
        });
        if (input.rawVerification?.verified === true) {
          verifiedRawVerification = input.rawVerification;
        }
      } catch {
        rawAssessment = {
          blockers: ["primary_raw_binding_assessment_failed"],
          fieldMatches: NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map(
            () => false,
          ),
          inventorySha256: null,
        };
      }
    }
    blockers.push(...rawAssessment.blockers);

    let freezeAdmission: Nhm2PrimaryComparisonProjectionFreezeAdmissionV1 | null =
      null;
    const freezeViolations: string[] = [];
    if (manifest != null && manifestSha256 != null) {
      try {
        freezeAdmission = await dependencies.loadFreezeAdmission(
          manifest.freeze.registrationId,
        );
      } catch {
        freezeViolations.push("server_owned_freeze_admission_load_failed");
      }
      if (freezeViolations.length === 0) {
        try {
          freezeViolations.push(
            ...freezeBlockers({
              manifest,
              manifestSha256,
              admission: freezeAdmission,
              rawVerification: verifiedRawVerification,
            }),
          );
        } catch {
          freezeViolations.push(
            "server_owned_freeze_admission_assessment_failed",
          );
        }
      }
    } else {
      freezeViolations.push("server_owned_freeze_admission_not_assessed");
    }
    blockers.push(...freezeViolations);
    blockers.push(
      "projection_output_filesystem_readback_not_implemented",
      "ordered_domain_filesystem_readback_not_implemented",
      "server_owned_projection_operator_replay_not_implemented",
      "primary_comparison_projection_publication_not_ready",
    );

    const fields = NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map(
      (policy, index) => {
        const prefix = `field_${index}`;
        const fieldViolations = structuralViolations.filter((entry) =>
          entry.startsWith(prefix),
        );
        const fieldMetadataStructurallyValid = manifest != null;
        return {
          ordinal: index + 1,
          fieldId: policy.fieldId,
          status: "not_ready" as const,
          rawSourceBindingsMatchVerifiedPackage:
            fieldMetadataStructurallyValid &&
            rawAssessment.fieldMatches[index] === true,
          outputMetadataStructurallyValid:
            fieldMetadataStructurallyValid &&
            !fieldViolations.some((entry) => entry.includes("output")),
          orderedDomainMetadataStructurallyValid:
            fieldMetadataStructurallyValid &&
            !fieldViolations.some((entry) => entry.includes("ordered_domain")),
          uncertaintyMetadataStructurallyValid:
            fieldMetadataStructurallyValid &&
            !fieldViolations.some((entry) => entry.includes("uncertainty")),
          serverOwnedOperatorReplayPerformed: false as const,
          blockers: uniqueSorted([
            ...fieldViolations,
            ...(fieldMetadataStructurallyValid
              ? []
              : [`${policy.fieldId}:projection_manifest_structurally_invalid`]),
            ...(rawAssessment.fieldMatches[index]
              ? []
              : [`${policy.fieldId}:verified_raw_source_binding_incomplete`]),
            `${policy.fieldId}:projection_output_filesystem_not_verified`,
            `${policy.fieldId}:ordered_domain_filesystem_not_verified`,
            `${policy.fieldId}:server_owned_projection_operator_not_replayed`,
          ]),
        };
      },
    );

    return {
      artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_ARTIFACT_ID,
      contractVersion:
        NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_CONTRACT_VERSION,
      generatedAt: now.toISOString(),
      status: "not_ready",
      source: {
        manifestArtifactId: manifest?.artifactId ?? null,
        manifestContractVersion: manifest?.contractVersion ?? null,
        manifestSha256,
        rawFilesystemVerificationObserved: observedRawVerification != null,
        rawFilesystemVerificationBoundToProjectionManifest:
          manifest != null &&
          verifiedRawVerification != null &&
          rawAssessment.blockers.length === 0,
        rawManifestSha256: observedRawManifestSha256,
        rawInputClosureSha256: observedRawInputClosureSha256,
        rawVerifiedFileInventorySha256:
          observedRawInventorySha256 ?? rawAssessment.inventorySha256,
      },
      structuralAssessment: {
        exactNineFields:
          manifest != null &&
          !structuralViolations.includes("field_count_invalid"),
        exactComponentOrderAndUnits:
          manifest != null &&
          !structuralViolations.some((entry) =>
            /component_(order|units)_invalid/.test(entry),
          ),
        exactPrimitiveSourceLineage:
          manifest != null &&
          !structuralViolations.some((entry) => entry.includes("raw_source")),
        exactProjectionAndUncertaintyDerivations:
          manifest != null &&
          !structuralViolations.some(
            (entry) =>
              entry.includes("projection_operator") ||
              entry.includes("uncertainty_derivation"),
          ),
        float64OutputMetadataBound:
          manifest != null &&
          !structuralViolations.some((entry) => entry.includes("_output_")),
        orderedDomainMetadataBound:
          manifest != null &&
          !structuralViolations.some((entry) =>
            entry.includes("ordered_domain"),
          ),
        identityBoundToRawRun:
          manifest != null &&
          verifiedRawVerification != null &&
          rawAssessment.blockers.length === 0,
        freezeAdmissionBound:
          freezeAdmission != null && freezeViolations.length === 0,
        outputFilesystemReadbackPerformed: false,
        orderedDomainFilesystemReadbackPerformed: false,
        serverOwnedProjectionReplayPerformed: false,
      },
      fields,
      primaryComparisonProjectionReady: false,
      blockers: uniqueSorted(blockers),
      claimBoundary: {
        diagnosticComparisonInputOnly: true,
        metadataAssessmentIsNotArrayReplay: true,
        independentComparisonStillRequired: true,
        empiricalReceiptsStillRequired: true,
        theoryClosureEstablished: false,
        physicalViabilityEstablished: false,
        transportEstablished: false,
        propulsionEstablished: false,
        routeEtaEstablished: false,
        certifiedSpeedEstablished: false,
      },
    };
  };

/** Fail-closed production default until a server freeze store is installed. */
export const assessNhm2PrimaryComparisonProjection =
  createNhm2PrimaryComparisonProjectionAssessor({
    loadFreezeAdmission: async () => null,
  });

export const isNhm2PrimaryComparisonProjectionAssessmentV1 = (
  value: unknown,
): value is Nhm2PrimaryComparisonProjectionAssessmentV1 => {
  try {
    if (!isRecord(value)) return false;
    const source = value.source;
    const structural = value.structuralAssessment;
    const fields = value.fields;
    const claimBoundary = value.claimBoundary;
    if (
      !isRecord(source) ||
      !isRecord(structural) ||
      !Array.isArray(fields) ||
      !isRecord(claimBoundary)
    ) {
      return false;
    }

    const sourceValid =
      isNullableString(source.manifestArtifactId) &&
      isNullableString(source.manifestContractVersion) &&
      isNullableSha256(source.manifestSha256) &&
      typeof source.rawFilesystemVerificationObserved === "boolean" &&
      typeof source.rawFilesystemVerificationBoundToProjectionManifest ===
        "boolean" &&
      isNullableSha256(source.rawManifestSha256) &&
      isNullableSha256(source.rawInputClosureSha256) &&
      isNullableSha256(source.rawVerifiedFileInventorySha256);
    const structuralValid =
      typeof structural.exactNineFields === "boolean" &&
      typeof structural.exactComponentOrderAndUnits === "boolean" &&
      typeof structural.exactPrimitiveSourceLineage === "boolean" &&
      typeof structural.exactProjectionAndUncertaintyDerivations ===
        "boolean" &&
      typeof structural.float64OutputMetadataBound === "boolean" &&
      typeof structural.orderedDomainMetadataBound === "boolean" &&
      typeof structural.identityBoundToRawRun === "boolean" &&
      typeof structural.freezeAdmissionBound === "boolean" &&
      structural.outputFilesystemReadbackPerformed === false &&
      structural.orderedDomainFilesystemReadbackPerformed === false &&
      structural.serverOwnedProjectionReplayPerformed === false;
    const fieldsValid =
      fields.length ===
        NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.length &&
      fields.every((field, index) => {
        if (!isRecord(field)) return false;
        return (
          field.ordinal === index + 1 &&
          field.fieldId ===
            NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES[index].fieldId &&
          field.status === "not_ready" &&
          typeof field.rawSourceBindingsMatchVerifiedPackage === "boolean" &&
          typeof field.outputMetadataStructurallyValid === "boolean" &&
          typeof field.orderedDomainMetadataStructurallyValid === "boolean" &&
          typeof field.uncertaintyMetadataStructurallyValid === "boolean" &&
          field.serverOwnedOperatorReplayPerformed === false &&
          isStringArray(field.blockers)
        );
      });
    const claimBoundaryValid =
      claimBoundary.diagnosticComparisonInputOnly === true &&
      claimBoundary.metadataAssessmentIsNotArrayReplay === true &&
      claimBoundary.independentComparisonStillRequired === true &&
      claimBoundary.empiricalReceiptsStillRequired === true &&
      claimBoundary.theoryClosureEstablished === false &&
      claimBoundary.physicalViabilityEstablished === false &&
      claimBoundary.transportEstablished === false &&
      claimBoundary.propulsionEstablished === false &&
      claimBoundary.routeEtaEstablished === false &&
      claimBoundary.certifiedSpeedEstablished === false;

    return (
      value.artifactId ===
        NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_ARTIFACT_ID &&
      value.contractVersion ===
        NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_CONTRACT_VERSION &&
      isIsoTimestamp(value.generatedAt) &&
      value.status === "not_ready" &&
      value.primaryComparisonProjectionReady === false &&
      isStringArray(value.blockers) &&
      sourceValid &&
      structuralValid &&
      fieldsValid &&
      claimBoundaryValid
    );
  } catch {
    return false;
  }
};
