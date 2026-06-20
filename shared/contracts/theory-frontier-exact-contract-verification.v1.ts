export const THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_ARTIFACT_ID =
  "theory_frontier_exact_contract_verification" as const;

export const THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_SCHEMA_VERSION =
  "theory_frontier_exact_contract_verification/v1" as const;

export const THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION =
  "theory_frontier_exact_contract/v1" as const;

export type TheoryFrontierExactContractCheckedRequirementsV1 = {
  validCandidateContract: boolean;
  completeFirstPrinciplesPath: boolean;
  dimensionalChecks: boolean;
  equationAndVariableMappings: boolean;
  requiredObservables: boolean;
  uncertaintyBudget: boolean;
  falsificationChecks: boolean;
  evidenceProvenance: boolean;
  activeClaimBoundaries: boolean;
  nonTerminalBoundary: boolean;
};

export type TheoryFrontierExactContractRequirementKeyV1 =
  keyof TheoryFrontierExactContractCheckedRequirementsV1;

export type TheoryFrontierExactContractRequirementDetailV1 = {
  requirement: TheoryFrontierExactContractRequirementKeyV1;
  status: "passed" | "failed";
  evidenceRefs: string[];
  notes: string[];
};

export type TheoryFrontierExactContractVerificationV1 = {
  artifactId: typeof THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_ARTIFACT_ID;
  schemaVersion: typeof THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_SCHEMA_VERSION;
  verifierVersion: typeof THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION;
  candidateId: string | null;
  exactContractSatisfied: boolean;
  promotionAllowed: false;
  validatesTheory: false;
  solvesPhysicalMechanism: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  issues: string[];
  checkedRequirements: TheoryFrontierExactContractCheckedRequirementsV1;
  requirementDetails: TheoryFrontierExactContractRequirementDetailV1[];
};

export type BuildTheoryFrontierExactContractVerificationV1Input = Omit<
  TheoryFrontierExactContractVerificationV1,
  | "artifactId"
  | "schemaVersion"
  | "verifierVersion"
  | "promotionAllowed"
  | "validatesTheory"
  | "solvesPhysicalMechanism"
  | "assistant_answer"
  | "terminal_eligible"
  | "raw_content_included"
  | "requirementDetails"
> & {
  requirementDetails?: TheoryFrontierExactContractRequirementDetailV1[];
};

const CHECKED_REQUIREMENT_KEYS = [
  "validCandidateContract",
  "completeFirstPrinciplesPath",
  "dimensionalChecks",
  "equationAndVariableMappings",
  "requiredObservables",
  "uncertaintyBudget",
  "falsificationChecks",
  "evidenceProvenance",
  "activeClaimBoundaries",
  "nonTerminalBoundary",
] as const;

const defaultRequirementDetails = (
  checkedRequirements: TheoryFrontierExactContractCheckedRequirementsV1,
): TheoryFrontierExactContractRequirementDetailV1[] =>
  CHECKED_REQUIREMENT_KEYS.map((requirement) => ({
    requirement,
    status: checkedRequirements[requirement] ? "passed" : "failed",
    evidenceRefs: [],
    notes: [`${requirement}=${String(checkedRequirements[requirement])}`],
  }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function buildTheoryFrontierExactContractVerificationV1(
  input: BuildTheoryFrontierExactContractVerificationV1Input,
): TheoryFrontierExactContractVerificationV1 {
  return {
    artifactId: THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_ARTIFACT_ID,
    schemaVersion: THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_SCHEMA_VERSION,
    verifierVersion: THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION,
    candidateId: input.candidateId,
    exactContractSatisfied: input.exactContractSatisfied,
    promotionAllowed: false,
    validatesTheory: false,
    solvesPhysicalMechanism: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    issues: input.issues,
    checkedRequirements: input.checkedRequirements,
    requirementDetails: input.requirementDetails ?? defaultRequirementDetails(input.checkedRequirements),
  };
}

export function validateTheoryFrontierExactContractVerificationV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["exact contract verification must be an object"];

  if (value.artifactId !== THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_FRONTIER_EXACT_CONTRACT_VERIFICATION_SCHEMA_VERSION}`);
  }
  if (value.verifierVersion !== THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION) {
    issues.push(`verifierVersion must be ${THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION}`);
  }
  if (value.candidateId !== null && !isNonEmptyString(value.candidateId)) {
    issues.push("candidateId must be a non-empty string or null");
  }
  if (typeof value.exactContractSatisfied !== "boolean") {
    issues.push("exactContractSatisfied must be boolean");
  }
  if (value.promotionAllowed !== false) issues.push("promotionAllowed must be false");
  if (value.validatesTheory !== false) issues.push("validatesTheory must be false");
  if (value.solvesPhysicalMechanism !== false) issues.push("solvesPhysicalMechanism must be false");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");

  if (!Array.isArray(value.issues) || !value.issues.every((issue: unknown) => typeof issue === "string")) {
    issues.push("issues must be an array of strings");
  }
  if (!isRecord(value.checkedRequirements)) {
    issues.push("checkedRequirements must be an object");
  } else {
    for (const key of CHECKED_REQUIREMENT_KEYS) {
      if (typeof value.checkedRequirements[key] !== "boolean") {
        issues.push(`checkedRequirements.${key} must be boolean`);
      }
    }
    if (
      value.exactContractSatisfied === true &&
      CHECKED_REQUIREMENT_KEYS.some((key) => value.checkedRequirements[key] !== true)
    ) {
      issues.push("exactContractSatisfied requires every checked requirement to be true");
    }
  }

  if (!Array.isArray(value.requirementDetails)) {
    issues.push("requirementDetails must be an array");
  } else {
    const seenRequirements = new Set<string>();
    for (const [index, detail] of value.requirementDetails.entries()) {
      const prefix = `requirementDetails[${index}]`;
      if (!isRecord(detail)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!CHECKED_REQUIREMENT_KEYS.includes(detail.requirement as (typeof CHECKED_REQUIREMENT_KEYS)[number])) {
        issues.push(`${prefix}.requirement is invalid`);
      } else {
        seenRequirements.add(String(detail.requirement));
      }
      if (detail.status !== "passed" && detail.status !== "failed") {
        issues.push(`${prefix}.status must be passed or failed`);
      }
      if (!Array.isArray(detail.evidenceRefs) || !detail.evidenceRefs.every((entry: unknown) => typeof entry === "string")) {
        issues.push(`${prefix}.evidenceRefs must be an array of strings`);
      }
      if (!Array.isArray(detail.notes) || !detail.notes.every((entry: unknown) => typeof entry === "string")) {
        issues.push(`${prefix}.notes must be an array of strings`);
      }
      if (
        isRecord(value.checkedRequirements) &&
        CHECKED_REQUIREMENT_KEYS.includes(detail.requirement as (typeof CHECKED_REQUIREMENT_KEYS)[number])
      ) {
        const expectedStatus = value.checkedRequirements[detail.requirement as (typeof CHECKED_REQUIREMENT_KEYS)[number]]
          ? "passed"
          : "failed";
        if (detail.status !== expectedStatus) {
          issues.push(`${prefix}.status must match checkedRequirements.${String(detail.requirement)}`);
        }
      }
    }
    for (const key of CHECKED_REQUIREMENT_KEYS) {
      if (!seenRequirements.has(key)) issues.push(`requirementDetails must include ${key}`);
    }
  }

  if (value.exactContractSatisfied === true && Array.isArray(value.issues) && value.issues.length > 0) {
    issues.push("exactContractSatisfied requires issues to be empty");
  }

  return issues;
}

export function isTheoryFrontierExactContractVerificationV1(
  value: unknown,
): value is TheoryFrontierExactContractVerificationV1 {
  return validateTheoryFrontierExactContractVerificationV1(value).length === 0;
}
