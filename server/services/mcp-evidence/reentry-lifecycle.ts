import {
  HELIX_MCP_EVIDENCE_REENTRY_RECORD_SCHEMA,
  HELIX_MCP_EVIDENCE_TERMINAL_ASSESSMENT_SCHEMA,
  helixMcpEvidenceObservationSchema,
  helixMcpEvidenceReentryRecordSchema,
  helixMcpEvidenceTerminalAssessmentSchema,
  type HelixMcpEvidenceClaimCeilingClass,
  type HelixMcpEvidenceObservation,
  type HelixMcpEvidenceReentryRecord,
  type HelixMcpEvidenceTerminalAssessment,
  type HelixMcpEvidenceTerminalFailureCode,
} from "@shared/contracts/helix-mcp-evidence-capability.v1";
import { helixMcpEvidenceSha256 } from "./observation";

export class HelixMcpEvidenceLifecycleError extends Error {
  constructor(readonly code:
    | "mcp_evidence_observation_not_found"
    | "mcp_evidence_observation_identity_conflict"
    | "mcp_evidence_observation_not_reentered") {
    super(code);
    this.name = "HelixMcpEvidenceLifecycleError";
  }
}

export class HelixMcpEvidenceReentryLedger {
  private readonly records = new Map<string, HelixMcpEvidenceReentryRecord>();

  publish(observation: HelixMcpEvidenceObservation, publishedAt: string): HelixMcpEvidenceReentryRecord {
    const parsed = helixMcpEvidenceObservationSchema.parse(observation);
    const existing = this.records.get(parsed.observation_ref);
    if (existing) {
      if (existing.tool_call_ref !== parsed.tool_call_ref) {
        throw new HelixMcpEvidenceLifecycleError("mcp_evidence_observation_identity_conflict");
      }
      return existing;
    }
    const record = helixMcpEvidenceReentryRecordSchema.parse({
      schema: HELIX_MCP_EVIDENCE_REENTRY_RECORD_SCHEMA,
      observation_ref: parsed.observation_ref,
      tool_call_ref: parsed.tool_call_ref,
      tool_result_published_at: publishedAt,
      reentered_turn_id: null,
      reentered_at: null,
      selected_for_reasoning: false,
      selected_for_terminal_support: false,
    });
    this.records.set(record.observation_ref, record);
    return record;
  }

  reenter(input: { observationRef: string; turnId: string; reenteredAt: string }): HelixMcpEvidenceReentryRecord {
    const existing = this.require(input.observationRef);
    if (existing.reentered_at !== null) return existing;
    return this.replace(existing.observation_ref, {
      ...existing,
      reentered_turn_id: input.turnId,
      reentered_at: input.reenteredAt,
    });
  }

  select(input: {
    observationRef: string;
    forReasoning?: boolean;
    forTerminalSupport?: boolean;
  }): HelixMcpEvidenceReentryRecord {
    const existing = this.require(input.observationRef);
    if (existing.reentered_at === null) {
      throw new HelixMcpEvidenceLifecycleError("mcp_evidence_observation_not_reentered");
    }
    return this.replace(existing.observation_ref, {
      ...existing,
      selected_for_reasoning: existing.selected_for_reasoning || input.forReasoning === true,
      selected_for_terminal_support:
        existing.selected_for_terminal_support || input.forTerminalSupport === true,
    });
  }

  get(observationRef: string): HelixMcpEvidenceReentryRecord | null {
    return this.records.get(observationRef) ?? null;
  }

  private require(observationRef: string): HelixMcpEvidenceReentryRecord {
    const record = this.get(observationRef);
    if (!record) throw new HelixMcpEvidenceLifecycleError("mcp_evidence_observation_not_found");
    return record;
  }

  private replace(
    observationRef: string,
    candidate: HelixMcpEvidenceReentryRecord,
  ): HelixMcpEvidenceReentryRecord {
    const parsed = helixMcpEvidenceReentryRecordSchema.parse(candidate);
    this.records.set(observationRef, parsed);
    return parsed;
  }
}

const CLAIM_RANK: Record<HelixMcpEvidenceClaimCeilingClass, number> = {
  metadata_only: 0,
  bounded_observation: 1,
  evidence_support: 2,
};

export const assessHelixMcpEvidenceTerminalGrounding = (input: {
  materialObservationRefs: string[];
  candidateSupportRefs: string[];
  selectedTerminalSupportRefs: string[];
  requiredClaimClasses: Readonly<Record<string, HelixMcpEvidenceClaimCeilingClass>>;
  acknowledgedUncertainties: string[];
  observations: ReadonlyMap<string, HelixMcpEvidenceObservation>;
  lifecycle: Pick<HelixMcpEvidenceReentryLedger, "get">;
  now: string;
}): HelixMcpEvidenceTerminalAssessment => {
  const failures = new Set<HelixMcpEvidenceTerminalFailureCode>();
  const candidateRefs = new Set(input.candidateSupportRefs);
  const selectedRefs = new Set(input.selectedTerminalSupportRefs);
  const acknowledged = new Set(input.acknowledgedUncertainties);

  for (const ref of new Set(input.materialObservationRefs)) {
    if (!ref.trim()) {
      failures.add("mcp_evidence_observation_ref_missing");
      continue;
    }
    if (!candidateRefs.has(ref)) failures.add("mcp_evidence_terminal_citation_missing");
    if (!selectedRefs.has(ref)) failures.add("mcp_evidence_observation_not_selected");
    const observation = input.observations.get(ref);
    if (!observation) {
      failures.add("mcp_evidence_observation_not_found");
      continue;
    }
    const record = input.lifecycle.get(ref);
    if (!record?.reentered_at) failures.add("mcp_evidence_observation_not_reentered");
    if (!record?.selected_for_terminal_support) {
      failures.add("mcp_evidence_observation_not_selected");
    }
    const parsed = helixMcpEvidenceObservationSchema.safeParse(observation);
    if (!parsed.success ||
        parsed.data.provenance.payload_sha256 !== helixMcpEvidenceSha256(parsed.data.payload)) {
      failures.add("mcp_evidence_observation_integrity_failed");
      continue;
    }
    if (parsed.data.freshness.state === "stale" ||
        (parsed.data.freshness.expires_at !== null &&
          new Date(parsed.data.freshness.expires_at).getTime() <= new Date(input.now).getTime())) {
      failures.add("mcp_evidence_observation_stale");
    }
    const required = input.requiredClaimClasses[ref];
    if (required && CLAIM_RANK[required] > CLAIM_RANK[parsed.data.claim_ceiling.class]) {
      failures.add("mcp_evidence_claim_ceiling_exceeded");
    }
    if (parsed.data.missing_or_uncertain.some((item) => !acknowledged.has(item))) {
      failures.add("mcp_evidence_unresolved_evidence_unacknowledged");
    }
  }

  return helixMcpEvidenceTerminalAssessmentSchema.parse({
    schema: HELIX_MCP_EVIDENCE_TERMINAL_ASSESSMENT_SCHEMA,
    terminal_eligible: failures.size === 0,
    selected_support_refs: Array.from(selectedRefs).sort(),
    failure_codes: Array.from(failures).sort(),
    assistant_answer: false,
    answer_authored: false,
  });
};
