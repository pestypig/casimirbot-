import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_ARTIFACT_ID =
  "casimir_formal_artifact_family_audit" as const;
export const CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_SCHEMA_VERSION =
  "casimir_formal_artifact_family_audit/v1" as const;
export const CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_HASH_DOMAIN =
  "casimir-formal-artifact-family-audit/v1" as const;

export const CASIMIR_FORMAL_PROPERTY_KINDS = [
  "real_typed_expression_witness",
  "declared_wave_speed_bound",
  "zero_gradient_diffusive_flux",
  "equal_state_wave_zero",
  "wave_sum_state_jump_identity",
  "equal_state_left_fluctuation_zero",
  "equal_state_right_fluctuation_zero",
  "conditional_flux_jump_fluctuation_identity",
  "constant_state_left_reconstruction",
  "constant_state_right_reconstruction",
  "affine_left_reconstruction_identity",
  "affine_right_reconstruction_identity",
  "reconstruction_reversal_symmetry",
] as const;
export type CasimirFormalPropertyKindV1 =
  (typeof CASIMIR_FORMAL_PROPERTY_KINDS)[number];

export const CASIMIR_FORMAL_CLAIM_CEILINGS = [
  "definition_well_typed",
  "declared_algebraic_identity",
  "local_consistency_identity",
] as const;
export type CasimirFormalClaimCeilingV1 =
  (typeof CASIMIR_FORMAL_CLAIM_CEILINGS)[number];

export const CASIMIR_FORMAL_DENIED_PROMOTIONS = [
  "mathematical_hyperbolicity",
  "pde_solution",
  "complete_numerical_solver",
  "implementation_correctness",
  "floating_point_correctness",
  "numerical_stability",
  "numerical_convergence",
  "empirical_validation",
  "physical_truth",
] as const;
export type CasimirFormalDeniedPromotionV1 =
  (typeof CASIMIR_FORMAL_DENIED_PROMOTIONS)[number];

export type CasimirFormalAuditedSourceArtifactV1 = {
  logicalPath: string;
  sha256: string;
  sizeBytes: number;
};

export type CasimirFormalArtifactFamilyCaseV1 = {
  caseId: string;
  formulation: "standard" | "hyperbolic_divergence_cleaning";
  dimensions: 1 | 2 | 3;
  specification: CasimirFormalAuditedSourceArtifactV1;
  formalSource: CasimirFormalAuditedSourceArtifactV1 & {
    moduleName: string;
    imports: string[];
    theoremCount: number;
  };
  implementationSource: CasimirFormalAuditedSourceArtifactV1 & {
    numericModel: "c_ieee754_binary64";
    entrypointStatus: "placeholder_noop";
    formalRefinementStatus: "unassessed";
  };
};

export type CasimirFormalAuditedTheoremV1 = {
  theoremId: string;
  caseId: string;
  moduleName: string;
  theoremName: string;
  logicalPath: string;
  sourceRange: {
    startLine: number;
    endLine: number;
  };
  declarationSha256: string;
  propositionSourceSha256: string;
  propertyKind: CasimirFormalPropertyKindV1;
  claimCeiling: CasimirFormalClaimCeilingV1;
  deniedPromotions: CasimirFormalDeniedPromotionV1[];
  replay: {
    status: "blocked";
    observedTheoremTypeSha256: null;
    blockers: (
      | "formal_environment_unpinned"
      | "import_closure_unpinned"
      | "semantic_binding_missing"
      | "observed_theorem_type_missing"
    )[];
  };
};

export type CasimirFormalArtifactFamilyAuditV1 = {
  artifactId: typeof CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_SCHEMA_VERSION;
  auditId: string;
  artifactSha256: string;
  repository: {
    producerId: string;
    uri: string;
    commitSha: string;
    selectedSourceTreeSha256: string;
    canonicalByteSource: "git_blob";
    selectedArtifactCount: number;
  };
  environment: {
    leanImportsObserved: string[];
    leanVersion: null;
    dependencyLockSha256: null;
    importClosureSha256: null;
    replayEligible: false;
  };
  cases: CasimirFormalArtifactFamilyCaseV1[];
  theorems: CasimirFormalAuditedTheoremV1[];
  authority: {
    outputRole: "formal_artifact_family_source_audit";
    sourceAdmissionAuthority: true;
    formalPropositionChecked: false;
    scientificAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
  };
};

type AuditWithoutHash = Omit<
  CasimirFormalArtifactFamilyAuditV1,
  "artifactSha256"
>;

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT_SHA = /^[a-f0-9]{40}$/;
const safeRelativePath = (value: string): boolean =>
  value.length > 0 &&
  !value.startsWith("/") &&
  !/^[a-zA-Z]:[\\/]/.test(value) &&
  !value.split(/[\\/]/).includes("..");

export async function computeCasimirFormalArtifactFamilyAuditSha256V1(
  value: AuditWithoutHash,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_HASH_DOMAIN,
    value,
  });
}

export async function buildCasimirFormalArtifactFamilyAuditV1(
  value: AuditWithoutHash,
): Promise<CasimirFormalArtifactFamilyAuditV1> {
  return {
    ...value,
    artifactSha256:
      await computeCasimirFormalArtifactFamilyAuditSha256V1(value),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export async function validateCasimirFormalArtifactFamilyAuditV1(
  value: unknown,
): Promise<string[]> {
  const issues: string[] = [];
  if (!isRecord(value)) return ["audit must be an object"];
  if (value.artifactId !== CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (
    value.schemaVersion !==
    CASIMIR_FORMAL_ARTIFACT_FAMILY_AUDIT_SCHEMA_VERSION
  )
    issues.push("schemaVersion is invalid");
  if (typeof value.artifactSha256 !== "string" || !SHA256.test(value.artifactSha256))
    issues.push("artifactSha256 must be lowercase SHA-256");

  const audit = value as unknown as CasimirFormalArtifactFamilyAuditV1;
  if (
    !isRecord(audit.repository) ||
    !COMMIT_SHA.test(audit.repository.commitSha ?? "") ||
    !SHA256.test(audit.repository.selectedSourceTreeSha256 ?? "") ||
    audit.repository.canonicalByteSource !== "git_blob"
  ) {
    issues.push("repository pin must use a commit, selected-tree hash, and git blobs");
  }
  if (
    !isRecord(audit.environment) ||
    audit.environment.replayEligible !== false ||
    audit.environment.leanVersion !== null ||
    audit.environment.dependencyLockSha256 !== null ||
    audit.environment.importClosureSha256 !== null
  ) {
    issues.push("unpinned environment must remain replay-ineligible");
  }
  if (!Array.isArray(audit.cases) || audit.cases.length === 0)
    issues.push("cases must be non-empty");
  if (!Array.isArray(audit.theorems) || audit.theorems.length === 0)
    issues.push("theorems must be non-empty");

  const caseIds = new Set<string>();
  const artifactPaths = new Set<string>();
  let artifactCount = 0;
  for (const entry of Array.isArray(audit.cases) ? audit.cases : []) {
    if (caseIds.has(entry.caseId)) issues.push(`duplicate caseId: ${entry.caseId}`);
    caseIds.add(entry.caseId);
    for (const artifact of [
      entry.specification,
      entry.formalSource,
      entry.implementationSource,
    ]) {
      artifactCount += 1;
      if (
        !safeRelativePath(artifact.logicalPath) ||
        !SHA256.test(artifact.sha256) ||
        !Number.isSafeInteger(artifact.sizeBytes) ||
        artifact.sizeBytes <= 0
      ) {
        issues.push(`invalid source artifact: ${artifact.logicalPath}`);
      }
      if (artifactPaths.has(artifact.logicalPath))
        issues.push(`duplicate source artifact: ${artifact.logicalPath}`);
      artifactPaths.add(artifact.logicalPath);
    }
    if (entry.formalSource.theoremCount <= 0)
      issues.push(`case has no audited theorems: ${entry.caseId}`);
    if (
      entry.implementationSource.entrypointStatus !== "placeholder_noop" ||
      entry.implementationSource.formalRefinementStatus !== "unassessed"
    ) {
      issues.push(`implementation authority is overstated: ${entry.caseId}`);
    }
  }
  if (audit.repository?.selectedArtifactCount !== artifactCount)
    issues.push("selectedArtifactCount does not match cases");

  const theoremIds = new Set<string>();
  const theoremCountByCase = new Map<string, number>();
  for (const theorem of Array.isArray(audit.theorems) ? audit.theorems : []) {
    if (theoremIds.has(theorem.theoremId))
      issues.push(`duplicate theoremId: ${theorem.theoremId}`);
    theoremIds.add(theorem.theoremId);
    theoremCountByCase.set(
      theorem.caseId,
      (theoremCountByCase.get(theorem.caseId) ?? 0) + 1,
    );
    if (
      !caseIds.has(theorem.caseId) ||
      !safeRelativePath(theorem.logicalPath) ||
      !artifactPaths.has(theorem.logicalPath) ||
      !SHA256.test(theorem.declarationSha256) ||
      !SHA256.test(theorem.propositionSourceSha256) ||
      !Number.isSafeInteger(theorem.sourceRange?.startLine) ||
      !Number.isSafeInteger(theorem.sourceRange?.endLine) ||
      theorem.sourceRange.startLine <= 0 ||
      theorem.sourceRange.endLine < theorem.sourceRange.startLine
    ) {
      issues.push(`invalid theorem source binding: ${theorem.theoremId}`);
    }
    if (!CASIMIR_FORMAL_PROPERTY_KINDS.includes(theorem.propertyKind))
      issues.push(`invalid theorem property: ${theorem.theoremId}`);
    if (!CASIMIR_FORMAL_CLAIM_CEILINGS.includes(theorem.claimCeiling))
      issues.push(`invalid theorem claim ceiling: ${theorem.theoremId}`);
    if (
      CASIMIR_FORMAL_DENIED_PROMOTIONS.some(
        (promotion) => !theorem.deniedPromotions.includes(promotion),
      )
    ) {
      issues.push(`theorem is missing denied promotions: ${theorem.theoremId}`);
    }
    if (
      theorem.propertyKind === "real_typed_expression_witness" &&
      theorem.claimCeiling !== "definition_well_typed"
    ) {
      issues.push(`real witness exceeds its claim ceiling: ${theorem.theoremId}`);
    }
    if (
      theorem.replay?.status !== "blocked" ||
      theorem.replay.observedTheoremTypeSha256 !== null ||
      ![
        "formal_environment_unpinned",
        "import_closure_unpinned",
        "semantic_binding_missing",
        "observed_theorem_type_missing",
      ].every((blocker) =>
        theorem.replay.blockers.includes(
          blocker as CasimirFormalAuditedTheoremV1["replay"]["blockers"][number],
        ),
      )
    ) {
      issues.push(`theorem replay must remain fail-closed: ${theorem.theoremId}`);
    }
  }
  for (const entry of Array.isArray(audit.cases) ? audit.cases : []) {
    if ((theoremCountByCase.get(entry.caseId) ?? 0) !== entry.formalSource.theoremCount)
      issues.push(`theoremCount does not match audit: ${entry.caseId}`);
  }
  const authority = audit.authority;
  if (
    !isRecord(authority) ||
    authority.sourceAdmissionAuthority !== true ||
    authority.formalPropositionChecked !== false ||
    authority.scientificAuthority !== false ||
    authority.numericalAuthority !== false ||
    authority.empiricalAuthority !== false ||
    authority.physicalAuthority !== false ||
    authority.assistantAnswer !== false ||
    authority.terminalEligible !== false
  ) {
    issues.push("authority boundary is invalid");
  }

  if (typeof value.artifactSha256 === "string") {
    const { artifactSha256: _artifactSha256, ...withoutHash } =
      value as unknown as CasimirFormalArtifactFamilyAuditV1;
    const expected =
      await computeCasimirFormalArtifactFamilyAuditSha256V1(withoutHash);
    if (value.artifactSha256 !== expected)
      issues.push("artifactSha256 does not match canonical audit payload");
  }
  return issues;
}
