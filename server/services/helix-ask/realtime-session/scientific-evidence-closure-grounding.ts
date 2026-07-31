import crypto from "node:crypto";

import {
  canonicalizeCasimirSpecValueV1,
} from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  HELIX_SCIENTIFIC_EVIDENCE_CLOSURE_GROUNDING_IDENTITY_SCHEMA,
  type HelixScientificEvidenceClosureGroundingIdentityV1,
} from "@shared/contracts/helix-scientific-evidence-closure-grounding.v1";
import {
  SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_HASH_DOMAIN,
  scientificEvidenceClosurePacketV1Schema,
} from "@shared/contracts/scientific-evidence-closure-packet.v1";

const SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA =
  "casimir.scientific_evidence_closure.observation.v1" as const;
const SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_KIND =
  "scientific_evidence_closure_observation" as const;
const SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY =
  "scientific-evidence-closure.evaluate" as const;

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordLike
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const packetHash = (value: unknown): string =>
  crypto
    .createHash("sha256")
    .update(canonicalizeCasimirSpecValueV1(value))
    .digest("hex");

const artifactAliases = (
  entry: RecordLike,
  payload: RecordLike | null,
): string[] =>
  unique([
    readString(entry.artifact_id),
    readString(payload?.artifact_id),
    readString(entry.provider_gateway_observation_ref),
    readString(payload?.provider_gateway_observation_ref),
    ...readStringArray(entry.provider_gateway_packet_refs),
    ...readStringArray(payload?.provider_gateway_packet_refs),
  ]);

const observationFromArtifact = (
  entry: RecordLike,
  payload: RecordLike | null,
): RecordLike | null => {
  const direct = payload;
  const nestedObservation = readRecord(payload?.observation);
  const nestedResult = readRecord(payload?.result);
  const resultObservation = readRecord(nestedResult?.observation);
  return [direct, nestedObservation, resultObservation].find(
    (candidate) =>
      readString(candidate?.schema) ===
      SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
  ) ?? direct;
};

const looksLikeScientificClosureArtifact = (
  entry: RecordLike,
  payload: RecordLike | null,
  observation: RecordLike | null,
): boolean => {
  const values = unique([
    readString(entry.kind),
    readString(payload?.kind),
    readString(entry.capability_id),
    readString(payload?.capability_id),
    readString(payload?.capability_key),
    readString(observation?.schema),
  ]);
  return values.includes(SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_KIND) ||
    values.includes(SCIENTIFIC_EVIDENCE_CLOSURE_EVALUATE_CAPABILITY) ||
    values.includes(SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA);
};

export type ScientificEvidenceClosureGroundingProjectionResult = {
  identities: HelixScientificEvidenceClosureGroundingIdentityV1[];
  failureCode:
    | "scientific_closure_grounding_identity_invalid"
    | "scientific_closure_grounding_identity_ambiguous"
    | null;
};

/**
 * Reads only selected, current-turn ledger artifacts. This does not select
 * evidence or grant answer authority; it projects the identity and claim
 * ceiling of closure evidence already selected by the canonical solver.
 */
export const projectScientificEvidenceClosureGroundingIdentities = (input: {
  payload: RecordLike;
  debug: RecordLike | null;
  turnId: string;
  selectedEvidenceRefs: string[];
}): ScientificEvidenceClosureGroundingProjectionResult => {
  const selectedRefs = new Set(input.selectedEvidenceRefs);
  if (selectedRefs.size === 0) return { identities: [], failureCode: null };

  const ledger = [
    ...(Array.isArray(input.payload.current_turn_artifact_ledger)
      ? input.payload.current_turn_artifact_ledger
      : []),
    ...(Array.isArray(input.debug?.current_turn_artifact_ledger)
      ? input.debug.current_turn_artifact_ledger
      : []),
  ];
  const identitiesByObservationRef = new Map<
    string,
    HelixScientificEvidenceClosureGroundingIdentityV1
  >();

  for (const rawEntry of ledger) {
    const entry = readRecord(rawEntry);
    if (!entry) continue;
    const payload = readRecord(entry.payload);
    const aliases = artifactAliases(entry, payload);
    const selectedAliases = aliases.filter((alias) => selectedRefs.has(alias));
    if (selectedAliases.length === 0) continue;
    const observation = observationFromArtifact(entry, payload);
    if (!looksLikeScientificClosureArtifact(entry, payload, observation)) continue;
    const entryTurnId = readString(entry.turn_id);
    const sourceScope = readString(entry.source_scope);
    if (
      entryTurnId !== input.turnId ||
      sourceScope !== "current_turn" ||
      !observation ||
      readString(observation.schema) !==
        SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA ||
      observation.current_turn_evidence !== true ||
      readString(observation.current_turn_id) !== input.turnId ||
      observation.terminal_eligible !== false ||
      observation.assistant_answer !== false
    ) {
      return {
        identities: [],
        failureCode: "scientific_closure_grounding_identity_invalid",
      };
    }

    const parsedPacket = scientificEvidenceClosurePacketV1Schema.safeParse(
      observation.closure_packet,
    );
    if (!parsedPacket.success) {
      return {
        identities: [],
        failureCode: "scientific_closure_grounding_identity_invalid",
      };
    }
    const packet = parsedPacket.data;
    const { artifactSha256, ...withoutHash } = packet;
    const expectedHash = packetHash({
      domain: SCIENTIFIC_EVIDENCE_CLOSURE_PACKET_HASH_DOMAIN,
      value: withoutHash,
    });
    if (
      artifactSha256 !== expectedHash ||
      packet.turnBinding.turnId !== input.turnId ||
      packet.authority.canonicalWithinEnrollment !==
        (packet.status === "satisfied") ||
      packet.authority.closureAxesChecked !== (packet.status === "satisfied")
    ) {
      return {
        identities: [],
        failureCode: "scientific_closure_grounding_identity_invalid",
      };
    }

    const observationRef = selectedAliases.sort()[0];
    const identity: HelixScientificEvidenceClosureGroundingIdentityV1 = {
      schema:
        HELIX_SCIENTIFIC_EVIDENCE_CLOSURE_GROUNDING_IDENTITY_SCHEMA,
      observation_ref: observationRef,
      observation_schema: SCIENTIFIC_EVIDENCE_CLOSURE_OBSERVATION_SCHEMA,
      packet_id: packet.packetId,
      packet_artifact_sha256: packet.artifactSha256,
      turn_id: input.turnId,
      plan_id: packet.turnBinding.planId,
      manifest_id: packet.enrollment.manifestId,
      orientation_id: packet.enrollment.orientationId,
      selected_badge_ids: [...packet.enrollment.selectedBadgeIds],
      status: packet.status,
      canonical_within_enrollment:
        packet.authority.canonicalWithinEnrollment,
      evidence_class: packet.authority.evidenceClass,
      maximum_claim: packet.claimBoundary.maximumClaim,
      establishes: [...packet.claimBoundary.establishes],
      does_not_establish: [...packet.claimBoundary.doesNotEstablish],
      integrity_verified: true,
      current_turn_binding_verified: true,
      selected_as_terminal_support: true,
      source_authority: false,
      semantic_authority: false,
      theory_authority: false,
      empirical_authority: false,
      physical_authority: false,
      implementation_correctness_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const existing = identitiesByObservationRef.get(observationRef);
    if (
      existing &&
      existing.packet_artifact_sha256 !== identity.packet_artifact_sha256
    ) {
      return {
        identities: [],
        failureCode: "scientific_closure_grounding_identity_ambiguous",
      };
    }
    identitiesByObservationRef.set(observationRef, identity);
  }

  return {
    identities: Array.from(identitiesByObservationRef.values()).sort(
      (left, right) => left.observation_ref.localeCompare(right.observation_ref),
    ),
    failureCode: null,
  };
};
