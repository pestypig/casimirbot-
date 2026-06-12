import type { Nhm2BlockerLedgerArtifact } from "./nhm2-blocker-ledger.v1";
import type { Nhm2CoupledClosurePassCandidateArtifactV1 } from "./nhm2-coupled-closure-pass-candidate.v1";

export const NHM2_FULL_SOLVE_CLAIM_ADMISSION_CONTRACT_VERSION =
  "nhm2_full_solve_claim_admission/v1";

export const NHM2_FULL_SOLVE_CLAIM_ADMISSION_STATUS_VALUES = [
  "blocked",
  "diagnostic_closure_candidate",
  "reduced_order_numerical_candidate",
  "physical_claim_forbidden",
] as const;

export type Nhm2FullSolveClaimAdmissionStatus =
  (typeof NHM2_FULL_SOLVE_CLAIM_ADMISSION_STATUS_VALUES)[number];

export type Nhm2ReferenceRunValidationAdmissionLike = {
  artifactId?: "nhm2_reference_run_validation";
  schemaVersion?: "nhm2_reference_run_validation/v1";
  runId?: string;
  overallState?: "pass" | "review" | "fail";
  validationClaimAllowed?: false;
  adapterVerificationStatus?:
    | "pass"
    | "fail"
    | "blocked_infra_endpoint_unavailable"
    | "not_run"
    | "unknown";
};

export type Nhm2FullSolveClaimAdmissionArtifactRefsV1 = {
  coupledClosurePassCandidate: string | null;
  blockerLedger: string | null;
  fullLoopAudit: string | null;
  referenceRunValidation: string | null;
};

export type Nhm2FullSolveClaimAdmissionArtifactV1 = {
  contractVersion: typeof NHM2_FULL_SOLVE_CLAIM_ADMISSION_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  artifactRefs: Nhm2FullSolveClaimAdmissionArtifactRefsV1;
  admission: {
    status: Nhm2FullSolveClaimAdmissionStatus;
    diagnosticClosurePassed: boolean;
    numericalReliabilityPassed: boolean;
    reproducibilityPassed: boolean;
    referenceRunValidationPassed: boolean;
    blockerLedgerPassed: boolean;
    certificateGreen: boolean;
    physicalClaimAllowed: false;
    transportClaimAllowed: false;
  };
  blockers: string[];
  warnings: string[];
  claimBoundary: {
    diagnosticOnly: true;
    passCandidateIsNotPhysicalViability: true;
    physicalViabilityRequiresExternalValidation: true;
    transportClaimAllowed: false;
  };
};

export type BuildNhm2FullSolveClaimAdmissionInput = {
  generatedAt?: string | null;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  artifactRefs?: Partial<Nhm2FullSolveClaimAdmissionArtifactRefsV1> | null;
  coupledClosurePassCandidate?: Nhm2CoupledClosurePassCandidateArtifactV1 | null;
  blockerLedger?: Nhm2BlockerLedgerArtifact | null;
  fullLoopAudit?: Record<string, unknown> | null;
  referenceRunValidation?: Nhm2ReferenceRunValidationAdmissionLike | null;
};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getNested = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cursor, part) => asRecord(cursor)?.[part], value);

const uniq = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => asText(value))
        .filter((value): value is string => value != null),
    ),
  );

const certificateTextIsGreen = (value: string | null): boolean =>
  value != null && /admissible|green|pass/i.test(value);

const certificateTextIsBad = (value: string | null): boolean =>
  value != null && /fail|false|invalid|mismatch|missing|unknown|not_ok|not-ok/i.test(value);

const certificateIntegrityIsOk = (value: string | null): boolean =>
  value != null &&
  !certificateTextIsBad(value) &&
  /ok|true|pass|green|admissible|valid/i.test(value);

const fullLoopReproducibilityPassed = (
  fullLoopAudit: Record<string, unknown> | null | undefined,
): boolean => {
  const section = asRecord(
    getNested(fullLoopAudit, [
      "sections",
      "uncertainty_perturbation_reproducibility",
    ]),
  );
  if (section == null) return false;
  const required = [
    "meshConvergenceOrder",
    "boundaryConditionSensitivity",
    "smoothingKernelSensitivity",
    "independentReproductionStatus",
    "artifactHashConsistencyStatus",
  ];
  if (required.some((field) => section[field] == null)) return false;
  if (asText(section.independentReproductionStatus) === "fail") return false;
  if (asText(section.artifactHashConsistencyStatus) === "mismatch") return false;
  return true;
};

const fullLoopCertificateGreen = (
  fullLoopAudit: Record<string, unknown> | null | undefined,
): boolean => {
  const certificate = asRecord(
    getNested(fullLoopAudit, ["sections", "certificate_policy_result"]),
  );
  if (certificate == null) return false;
  const status =
    asText(certificate.state) ??
    asText(certificate.status) ??
    asText(certificate.color);
  const integrity =
    asText(certificate.integrity) ??
    (typeof certificate.integrityOk === "boolean"
      ? String(certificate.integrityOk)
      : null);
  return certificateTextIsGreen(status) && certificateIntegrityIsOk(integrity);
};

const ledgerCertificateGreen = (
  ledger: Nhm2BlockerLedgerArtifact | null | undefined,
): boolean => {
  if (ledger == null) return false;
  const status = asText(ledger.certificatePolicy.certificateStatus);
  const integrity = asText(ledger.certificatePolicy.certificateIntegrity);
  return certificateTextIsGreen(status) && certificateIntegrityIsOk(integrity);
};

const defaultArtifactRefs = (
  refs: Partial<Nhm2FullSolveClaimAdmissionArtifactRefsV1> | null | undefined,
): Nhm2FullSolveClaimAdmissionArtifactRefsV1 => ({
  coupledClosurePassCandidate: refs?.coupledClosurePassCandidate ?? null,
  blockerLedger: refs?.blockerLedger ?? null,
  fullLoopAudit: refs?.fullLoopAudit ?? null,
  referenceRunValidation: refs?.referenceRunValidation ?? null,
});

export const buildNhm2FullSolveClaimAdmission = (
  input: BuildNhm2FullSolveClaimAdmissionInput,
): Nhm2FullSolveClaimAdmissionArtifactV1 => {
  const coupled = input.coupledClosurePassCandidate ?? null;
  const ledger = input.blockerLedger ?? null;
  const validation = input.referenceRunValidation ?? null;
  const fullLoopAudit = input.fullLoopAudit ?? null;

  const diagnosticClosurePassed = coupled?.summary.passCandidate === true;
  const referenceRunValidationPassed = validation?.overallState === "pass";
  const blockerLedgerPassed = ledger?.overallState === "pass";
  const reproducibilityPassed =
    ledger?.reproducibilityBlockers.status === "pass" ||
    fullLoopReproducibilityPassed(fullLoopAudit);
  const certificateGreen =
    ledgerCertificateGreen(ledger) || fullLoopCertificateGreen(fullLoopAudit);
  const numericalReliabilityPassed =
    diagnosticClosurePassed &&
    referenceRunValidationPassed &&
    blockerLedgerPassed &&
    reproducibilityPassed &&
    certificateGreen;

  const blockers = uniq([
    coupled == null ? "coupled_closure_pass_candidate_missing" : null,
    coupled != null && !diagnosticClosurePassed
      ? "diagnostic_closure_pass_candidate_false"
      : null,
    coupled != null && !diagnosticClosurePassed
      ? coupled.summary.firstBlocker
      : null,
    validation == null ? "reference_run_validation_missing" : null,
    validation != null && !referenceRunValidationPassed
      ? `reference_run_validation_not_pass:${validation.overallState ?? "unknown"}`
      : null,
    ledger == null ? "blocker_ledger_missing" : null,
    ledger != null && !blockerLedgerPassed
      ? `blocker_ledger_not_pass:${ledger.overallState}`
      : null,
    !reproducibilityPassed ? "reproducibility_not_pass" : null,
    !certificateGreen ? "certificate_not_green_or_integrity_unknown" : null,
    "external_physical_validation_missing",
  ]);

  const warnings = uniq([
    "pass_candidate_is_not_physical_viability",
    "transport_claim_forbidden_without_external_validation",
    validation?.adapterVerificationStatus != null &&
    validation.adapterVerificationStatus !== "pass"
      ? `adapter_verification_status:${validation.adapterVerificationStatus}`
      : null,
  ]);

  const status: Nhm2FullSolveClaimAdmissionStatus =
    coupled == null || !diagnosticClosurePassed
      ? "blocked"
      : numericalReliabilityPassed
        ? "reduced_order_numerical_candidate"
        : "diagnostic_closure_candidate";

  return {
    contractVersion: NHM2_FULL_SOLVE_CLAIM_ADMISSION_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: input.laneId ?? ledger?.laneId ?? coupled?.laneId ?? "nhm2_shift_lapse",
    selectedProfileId:
      input.selectedProfileId ??
      ledger?.selectedProfileId ??
      coupled?.selectedProfileId ??
      "unknown",
    runId: input.runId ?? ledger?.runId ?? coupled?.runId ?? validation?.runId ?? "unknown",
    artifactRefs: defaultArtifactRefs(input.artifactRefs),
    admission: {
      status,
      diagnosticClosurePassed,
      numericalReliabilityPassed,
      reproducibilityPassed,
      referenceRunValidationPassed,
      blockerLedgerPassed,
      certificateGreen,
      physicalClaimAllowed: false,
      transportClaimAllowed: false,
    },
    blockers,
    warnings,
    claimBoundary: {
      diagnosticOnly: true,
      passCandidateIsNotPhysicalViability: true,
      physicalViabilityRequiresExternalValidation: true,
      transportClaimAllowed: false,
    },
  };
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isArtifactRefs = (
  value: unknown,
): value is Nhm2FullSolveClaimAdmissionArtifactRefsV1 => {
  const record = asRecord(value);
  return (
    record != null &&
    ["coupledClosurePassCandidate", "blockerLedger", "fullLoopAudit", "referenceRunValidation"].every(
      (key) => record[key] === null || typeof record[key] === "string",
    )
  );
};

export const isNhm2FullSolveClaimAdmissionArtifact = (
  value: unknown,
): value is Nhm2FullSolveClaimAdmissionArtifactV1 => {
  const record = asRecord(value);
  const admission = asRecord(record?.admission);
  const boundary = asRecord(record?.claimBoundary);
  return (
    record != null &&
    record.contractVersion === NHM2_FULL_SOLVE_CLAIM_ADMISSION_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    typeof record.laneId === "string" &&
    typeof record.selectedProfileId === "string" &&
    typeof record.runId === "string" &&
    isArtifactRefs(record.artifactRefs) &&
    admission != null &&
    NHM2_FULL_SOLVE_CLAIM_ADMISSION_STATUS_VALUES.includes(
      admission.status as Nhm2FullSolveClaimAdmissionStatus,
    ) &&
    typeof admission.diagnosticClosurePassed === "boolean" &&
    typeof admission.numericalReliabilityPassed === "boolean" &&
    typeof admission.reproducibilityPassed === "boolean" &&
    typeof admission.referenceRunValidationPassed === "boolean" &&
    typeof admission.blockerLedgerPassed === "boolean" &&
    typeof admission.certificateGreen === "boolean" &&
    admission.physicalClaimAllowed === false &&
    admission.transportClaimAllowed === false &&
    isStringArray(record.blockers) &&
    isStringArray(record.warnings) &&
    boundary?.diagnosticOnly === true &&
    boundary.passCandidateIsNotPhysicalViability === true &&
    boundary.physicalViabilityRequiresExternalValidation === true &&
    boundary.transportClaimAllowed === false
  );
};
