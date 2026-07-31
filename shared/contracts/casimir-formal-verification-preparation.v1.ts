import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";
import {
  CASIMIR_FORMAL_CLAIM_CEILINGS,
  CASIMIR_FORMAL_DENIED_PROMOTIONS,
  CASIMIR_FORMAL_PROPERTY_KINDS,
  type CasimirFormalClaimCeilingV1,
  type CasimirFormalDeniedPromotionV1,
  type CasimirFormalPropertyKindV1,
} from "./casimir-formal-artifact-family-audit.v1";

export const CASIMIR_FORMAL_VERIFICATION_PREPARATION_ARTIFACT_ID =
  "casimir_formal_verification_preparation_receipt" as const;
export const CASIMIR_FORMAL_VERIFICATION_PREPARATION_SCHEMA_VERSION =
  "casimir_formal_verification_preparation_receipt/v1" as const;
export const CASIMIR_FORMAL_VERIFICATION_PREPARATION_HASH_DOMAIN =
  "casimir:formal-verification-preparation:v1" as const;

export const CASIMIR_FORMAL_PREPARATION_REQUIREMENT_CODES = [
  "formal_preparation_profile_id_required",
  "authoritative_evidence_artifacts_required",
  "authoritative_procedure_artifact_required",
  "authoritative_procedure_artifact_not_admitted",
  "authoritative_procedure_artifact_ambiguous",
  "procedure_id_required",
  "procedure_sha256_required",
  "procedure_integrity_invalid",
  "semantic_admission_artifact_required",
  "semantic_admission_artifact_not_admitted",
  "semantic_admission_artifact_ambiguous",
  "semantic_admission_integrity_invalid",
  "artifact_generation_receipt_required",
  "artifact_generation_receipt_not_admitted",
  "artifact_generation_receipt_ambiguous",
  "artifact_generation_receipt_integrity_invalid",
  "formal_source_admission_artifact_required",
  "formal_source_admission_artifact_not_admitted",
  "formal_source_admission_artifact_ambiguous",
  "formal_source_admission_integrity_invalid",
  "formal_claim_selection_required",
  "formal_claim_selection_invalid",
  "formal_theorem_selection_required",
  "formal_theorem_selection_unregistered",
  "formal_theorem_type_digest_required",
  "semantic_to_lean_binding_required",
  "semantic_to_lean_binding_unregistered",
  "formal_import_closure_required",
  "formal_environment_policy_catalog_unconfigured",
  "formal_environment_policy_unregistered",
  "formal_sandbox_executor_catalog_unconfigured",
  "formal_sandbox_executor_capability_required",
  "formal_sandbox_executor_capability_unregistered",
  "formal_graph_snapshot_required",
  "formal_source_root_unconfigured",
  "formal_evidence_identity_mismatch",
] as const;

export type CasimirFormalPreparationRequirementCodeV1 =
  (typeof CASIMIR_FORMAL_PREPARATION_REQUIREMENT_CODES)[number];

export type CasimirFormalPreparationMissingRequirementV1 = {
  code: CasimirFormalPreparationRequirementCodeV1;
  message: string;
  repairAction:
    | "select_developer_profile"
    | "retrieve_authoritative_evidence"
    | "select_claim"
    | "select_registered_theorem"
    | "register_semantic_binding"
    | "register_environment_policy"
    | "register_sandbox_executor"
    | "register_import_closure"
    | "register_graph_snapshot"
    | "configure_source_root";
};

export type CasimirFormalVerificationPreparationReceiptV1 = {
  artifactId: typeof CASIMIR_FORMAL_VERIFICATION_PREPARATION_ARTIFACT_ID;
  schemaVersion:
    typeof CASIMIR_FORMAL_VERIFICATION_PREPARATION_SCHEMA_VERSION;
  generatedAt: string;
  preparedRequestId: string;
  sourceTurnId: string;
  disposition: "ready" | "blocked";
  requestedBindings: {
    procedureArtifactRef: string | null;
    procedureId: string | null;
    procedureSha256: string | null;
    semanticAdmissionArtifactRef: string | null;
    artifactGenerationArtifactRef: string | null;
    formalSourceAdmissionArtifactRef: string | null;
    claimId: string | null;
    formalArtifactId: string | null;
    theoremName: string | null;
    theoremTypeSha256: string | null;
    semanticToLeanBindingId: string | null;
    semanticToLeanBindingSha256: string | null;
    environmentPolicyId: string | null;
    sandboxExecutorCapabilityId: string | null;
  };
  admittedBindings: {
    procedureArtifactRef: string | null;
    semanticAdmissionArtifactRef: string | null;
    artifactGenerationArtifactRef: string | null;
    formalSourceAdmissionArtifactRef: string | null;
    claimId: string | null;
    claimPropositionSha256: string | null;
    graphSnapshotSha256: string | null;
    formalArtifactId: string | null;
    formalSourceSha256: string | null;
    formalArtifactAuditSha256: string | null;
    theoremDeclarationSha256: string | null;
    theoremPropositionSourceSha256: string | null;
    theoremPropertyKind: CasimirFormalPropertyKindV1 | null;
    theoremClaimCeiling: CasimirFormalClaimCeilingV1 | null;
    theoremDeniedPromotions: CasimirFormalDeniedPromotionV1[];
    theoremTypeSha256: string | null;
    semanticToLeanBindingId: string | null;
    semanticToLeanBindingSha256: string | null;
    importClosureSha256: string | null;
    environmentPolicySha256: string | null;
    sandboxExecutorCapabilityId: string | null;
    sandboxExecutorCapabilitySha256: string | null;
  };
  missingRequirements: CasimirFormalPreparationMissingRequirementV1[];
  preparedSealedInputSha256: string | null;
  authority: {
    evidenceOnly: true;
    serverOwnedPreparation: true;
    executesLean: false;
    executesTools: false;
    validatesScientificTruth: false;
    validatesSemanticEquivalence: false;
    proofAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
  receiptSha256: string;
};

const SHA256 = /^[a-f0-9]{64}$/;

export async function computeCasimirFormalVerificationPreparationReceiptSha256V1(
  receipt: Omit<
    CasimirFormalVerificationPreparationReceiptV1,
    "receiptSha256"
  >,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_VERIFICATION_PREPARATION_HASH_DOMAIN,
    value: receipt,
  });
}

export async function validateCasimirFormalVerificationPreparationReceiptIntegrityV1(
  value: unknown,
): Promise<string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["preparation_receipt_invalid"];
  }
  const receipt =
    value as CasimirFormalVerificationPreparationReceiptV1;
  const issues: string[] = [];
  const missingRequirements = Array.isArray(receipt.missingRequirements)
    ? receipt.missingRequirements
    : [];
  if (
    receipt.artifactId !==
    CASIMIR_FORMAL_VERIFICATION_PREPARATION_ARTIFACT_ID
  ) {
    issues.push("preparation_artifact_id_invalid");
  }
  if (
    receipt.schemaVersion !==
    CASIMIR_FORMAL_VERIFICATION_PREPARATION_SCHEMA_VERSION
  ) {
    issues.push("preparation_schema_version_invalid");
  }
  if (
    !receipt.generatedAt ||
    !Number.isFinite(Date.parse(receipt.generatedAt))
  ) {
    issues.push("preparation_generated_at_invalid");
  }
  if (!receipt.preparedRequestId || !receipt.sourceTurnId) {
    issues.push("preparation_identity_missing");
  }
  if (!["ready", "blocked"].includes(receipt.disposition)) {
    issues.push("preparation_disposition_invalid");
  }
  if (!Array.isArray(receipt.missingRequirements)) {
    issues.push("preparation_missing_requirements_invalid");
  } else {
    const knownCodes = new Set<string>(
      CASIMIR_FORMAL_PREPARATION_REQUIREMENT_CODES,
    );
    for (const requirement of missingRequirements) {
      if (
        !knownCodes.has(requirement.code) ||
        !requirement.message ||
        !requirement.repairAction
      ) {
        issues.push("preparation_missing_requirement_invalid");
        break;
      }
    }
  }
  if (
    receipt.disposition === "ready" &&
    (missingRequirements.length > 0 ||
      !receipt.preparedSealedInputSha256 ||
      !SHA256.test(receipt.preparedSealedInputSha256))
  ) {
    issues.push("ready_preparation_not_closed");
  }
  if (
    receipt.disposition === "blocked" &&
    missingRequirements.length === 0
  ) {
    issues.push("blocked_preparation_missing_reason");
  }
  const admitted = receipt.admittedBindings;
  if (!admitted || typeof admitted !== "object") {
    issues.push("preparation_admitted_bindings_invalid");
  } else {
    const auditedFields = [
      admitted.formalArtifactAuditSha256,
      admitted.theoremDeclarationSha256,
      admitted.theoremPropositionSourceSha256,
    ];
    const hasAuditedTheorem = auditedFields.some((entry) => entry !== null);
    if (
      hasAuditedTheorem &&
      (auditedFields.some(
        (entry) => typeof entry !== "string" || !SHA256.test(entry),
      ) ||
        !admitted.formalArtifactId ||
        !admitted.formalSourceSha256 ||
        !SHA256.test(admitted.formalSourceSha256) ||
        !admitted.theoremPropertyKind ||
        !CASIMIR_FORMAL_PROPERTY_KINDS.includes(
          admitted.theoremPropertyKind,
        ) ||
        !admitted.theoremClaimCeiling ||
        !CASIMIR_FORMAL_CLAIM_CEILINGS.includes(
          admitted.theoremClaimCeiling,
        ) ||
        !Array.isArray(admitted.theoremDeniedPromotions) ||
        CASIMIR_FORMAL_DENIED_PROMOTIONS.some(
          (promotion) =>
            !admitted.theoremDeniedPromotions.includes(promotion),
        ))
    ) {
      issues.push("preparation_audited_theorem_binding_invalid");
    }
    if (
      !hasAuditedTheorem &&
      (admitted.theoremPropertyKind !== null ||
        admitted.theoremClaimCeiling !== null ||
        (Array.isArray(admitted.theoremDeniedPromotions) &&
          admitted.theoremDeniedPromotions.length > 0))
    ) {
      issues.push("preparation_partial_theorem_audit_binding");
    }
    const semanticBindingFields = [
      admitted.semanticToLeanBindingId,
      admitted.semanticToLeanBindingSha256,
      admitted.theoremTypeSha256,
    ];
    const hasSemanticBinding = semanticBindingFields.some(
      (entry) => entry !== null,
    );
    if (
      hasSemanticBinding &&
      (typeof admitted.semanticToLeanBindingId !== "string" ||
        !admitted.semanticToLeanBindingId.trim() ||
        typeof admitted.semanticToLeanBindingSha256 !== "string" ||
        !SHA256.test(admitted.semanticToLeanBindingSha256) ||
        typeof admitted.theoremTypeSha256 !== "string" ||
        !SHA256.test(admitted.theoremTypeSha256))
    ) {
      issues.push("preparation_partial_semantic_to_lean_binding");
    }
    const sandboxBindingFields = [
      admitted.sandboxExecutorCapabilityId,
      admitted.sandboxExecutorCapabilitySha256,
    ];
    const hasSandboxBinding = sandboxBindingFields.some(
      (entry) => entry !== null,
    );
    if (
      hasSandboxBinding &&
      (typeof admitted.sandboxExecutorCapabilityId !== "string" ||
        !admitted.sandboxExecutorCapabilityId.trim() ||
        typeof admitted.sandboxExecutorCapabilitySha256 !== "string" ||
        !SHA256.test(admitted.sandboxExecutorCapabilitySha256))
    ) {
      issues.push("preparation_partial_sandbox_executor_binding");
    }
  }
  if (
    receipt.authority?.evidenceOnly !== true ||
    receipt.authority?.serverOwnedPreparation !== true ||
    receipt.authority?.executesLean !== false ||
    receipt.authority?.executesTools !== false ||
    receipt.authority?.validatesScientificTruth !== false ||
    receipt.authority?.validatesSemanticEquivalence !== false ||
    receipt.authority?.proofAuthority !== false ||
    receipt.authority?.assistantAnswer !== false ||
    receipt.authority?.terminalEligible !== false ||
    receipt.authority?.postToolModelStepRequired !== true
  ) {
    issues.push("preparation_authority_invalid");
  }
  if (!SHA256.test(receipt.receiptSha256)) {
    issues.push("preparation_receipt_sha256_invalid");
  } else {
    const { receiptSha256: _ignored, ...unsigned } = receipt;
    const expected =
      await computeCasimirFormalVerificationPreparationReceiptSha256V1(
        unsigned,
      );
    if (expected !== receipt.receiptSha256) {
      issues.push("preparation_receipt_sha256_mismatch");
    }
  }
  return issues;
}
