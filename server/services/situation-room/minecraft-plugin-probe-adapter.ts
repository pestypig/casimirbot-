import type { HelixEnvironmentProbeRequest, HelixEnvironmentProbeResult } from "@shared/helix-environment-probe";
import { HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA } from "@shared/helix-environment-probe";

export function buildBlockedMinecraftProbeResult(input: {
  request: HelixEnvironmentProbeRequest;
  summary: string;
  now?: string;
}): HelixEnvironmentProbeResult {
  const now = input.now ?? new Date().toISOString();
  return {
    schema: HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
    probe_result_id: `environment_probe_result:${input.request.probe_request_id}:blocked`,
    probe_request_id: input.request.probe_request_id,
    source_id: input.request.source_id,
    room_id: input.request.room_id,
    domain: input.request.domain,
    probe_type: input.request.probe_type,
    status: "blocked_by_policy",
    result_summary: input.summary,
    result: {},
    sensor_scope: "unknown",
    requires_caveat: true,
    side_effects_performed: false,
    commands_executed: [],
    world_mutation_performed: false,
    evidence_refs: input.request.evidence_refs,
    deterministic: true,
    model_invoked: false,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}
