export const MORAL_REFLECTION_MEDIATION_PACKET_ARTIFACT_ID =
  "moral_reflection_mediation_packet" as const;
export const MORAL_REFLECTION_MEDIATION_PACKET_SCHEMA_VERSION =
  "moral_reflection_mediation_packet/v1" as const;

export const MORAL_REFLECTION_OBJECTIVE_SOURCE_OPTIONS = [
  "person_declared",
  "person_inferred",
  "role_prescribed",
  "institutionally_incentivized",
  "mutually_reinforced",
  "unknown",
] as const;

export type MoralReflectionObjectiveSourceV1 =
  (typeof MORAL_REFLECTION_OBJECTIVE_SOURCE_OPTIONS)[number];

export type MoralReflectionMediationStepIdV1 =
  | "observation_claim_boundary"
  | "objective_source_attribution"
  | "instrumentalization_ledger"
  | "perspective_power_and_asymmetry"
  | "developmental_freedom"
  | "ai_mediated_judgment";

export type MoralReflectionMediationStepV1 = {
  id: MoralReflectionMediationStepIdV1;
  question: string;
  priority: "primary" | "supporting" | "available";
  relevanceReasons: string[];
  supportingDomainIds: string[];
  supportingTensionIds: string[];
  missingEvidence: string[];
};

export type MoralReflectionMediationPacketV1 = {
  artifactId: typeof MORAL_REFLECTION_MEDIATION_PACKET_ARTIFACT_ID;
  schemaVersion: typeof MORAL_REFLECTION_MEDIATION_PACKET_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  purpose: string;
  objectiveSourceOptions: MoralReflectionObjectiveSourceV1[];
  objectiveSourceStatus: "unresolved";
  evidenceOrderBoundary: {
    kind: "moral_scenario_ready" | "external_verification_first" | "theory_ideology_bridge_first";
    reason: string;
    requiredBeforeStrongClaim: string[];
    advisory_only: true;
  };
  steps: MoralReflectionMediationStepV1[];
  synthesisProtocol: string[];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    agent_executable: false;
    diagnostic_only: true;
    evidence_only: true;
    no_moral_verdict: true;
    no_intent_inference: true;
    no_character_identity_claim: true;
    no_legitimacy_inference: true;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateMoralReflectionMediationPacketV1(value: unknown): string[] {
  if (!isRecord(value)) return ["Moral reflection mediation packet must be an object"];
  const issues: string[] = [];
  if (value.artifactId !== MORAL_REFLECTION_MEDIATION_PACKET_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== MORAL_REFLECTION_MEDIATION_PACKET_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (typeof value.generatedAt !== "string" || !value.generatedAt.trim()) issues.push("generatedAt must be non-empty");
  if (typeof value.reflectionId !== "string" || !value.reflectionId.trim()) issues.push("reflectionId must be non-empty");
  if (!Array.isArray(value.steps) || value.steps.length !== 6) issues.push("steps must contain the six mediation steps");
  else value.steps.forEach((step, index) => {
    if (!isRecord(step)) {
      issues.push(`steps[${index}] must be an object`);
      return;
    }
    if (step.priority !== "primary" && step.priority !== "supporting" && step.priority !== "available") {
      issues.push(`steps[${index}].priority is invalid`);
    }
    if (!Array.isArray(step.relevanceReasons) || step.relevanceReasons.some((entry) => typeof entry !== "string")) {
      issues.push(`steps[${index}].relevanceReasons must be strings`);
    }
  });
  if (!Array.isArray(value.objectiveSourceOptions) ||
      MORAL_REFLECTION_OBJECTIVE_SOURCE_OPTIONS.some((option) => !value.objectiveSourceOptions?.includes(option))) {
    issues.push("objectiveSourceOptions must contain all supported attribution states");
  }
  if (value.objectiveSourceStatus !== "unresolved") issues.push("objectiveSourceStatus must remain unresolved");
  if (!isRecord(value.evidenceOrderBoundary)) {
    issues.push("evidenceOrderBoundary must be an object");
  } else {
    if (!["moral_scenario_ready", "external_verification_first", "theory_ideology_bridge_first"]
      .includes(String(value.evidenceOrderBoundary.kind))) issues.push("evidenceOrderBoundary.kind is invalid");
    if (value.evidenceOrderBoundary.advisory_only !== true) issues.push("evidenceOrderBoundary must remain advisory-only");
    if (!Array.isArray(value.evidenceOrderBoundary.requiredBeforeStrongClaim)) {
      issues.push("evidenceOrderBoundary.requiredBeforeStrongClaim must be an array");
    }
  }
  if (!Array.isArray(value.synthesisProtocol) || value.synthesisProtocol.length < 5) {
    issues.push("synthesisProtocol must contain the mediation disciplines");
  }
  if (!isRecord(value.authority)) {
    issues.push("authority must be an object");
  } else {
    for (const field of ["assistant_answer", "raw_content_included", "terminal_eligible", "agent_executable"] as const) {
      if (value.authority[field] !== false) issues.push(`authority.${field} must be false`);
    }
    for (const field of [
      "diagnostic_only",
      "evidence_only",
      "no_moral_verdict",
      "no_intent_inference",
      "no_character_identity_claim",
      "no_legitimacy_inference",
    ] as const) {
      if (value.authority[field] !== true) issues.push(`authority.${field} must be true`);
    }
  }
  return issues;
}
