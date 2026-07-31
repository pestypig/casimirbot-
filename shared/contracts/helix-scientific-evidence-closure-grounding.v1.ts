export const HELIX_SCIENTIFIC_EVIDENCE_CLOSURE_GROUNDING_IDENTITY_SCHEMA =
  "helix.scientific_evidence_closure_grounding_identity.v1" as const;

/**
 * Bounded identity projection for a closure packet selected by the completed
 * Ask solver. It is safe for Realtime audit/presentation because it contains
 * no raw tool output and carries the packet's claim ceiling explicitly.
 */
export type HelixScientificEvidenceClosureGroundingIdentityV1 = {
  schema: typeof HELIX_SCIENTIFIC_EVIDENCE_CLOSURE_GROUNDING_IDENTITY_SCHEMA;
  observation_ref: string;
  observation_schema: "casimir.scientific_evidence_closure.observation.v1";
  packet_id: string;
  packet_artifact_sha256: string;
  turn_id: string;
  plan_id: string;
  manifest_id: string;
  orientation_id: string;
  selected_badge_ids: string[];
  status: "satisfied" | "failed" | "blocked";
  canonical_within_enrollment: boolean;
  evidence_class: "synthetic_computational";
  maximum_claim: "bounded synthetic comparison within the exact enrolled case";
  establishes: string[];
  does_not_establish: string[];
  integrity_verified: true;
  current_turn_binding_verified: true;
  selected_as_terminal_support: true;
  source_authority: false;
  semantic_authority: false;
  theory_authority: false;
  empirical_authority: false;
  physical_authority: false;
  implementation_correctness_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
