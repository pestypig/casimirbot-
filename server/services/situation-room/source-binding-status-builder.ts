import {
  HELIX_SOURCE_BINDING_STATUS_SCHEMA,
  type HelixSourceBindingStatus,
  type HelixSourceBindingStatusValue,
} from "@shared/helix-source-binding-status";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? value as Record<string, unknown> : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry: unknown) => readString(entry))
        .filter((entry: string | null): entry is string => Boolean(entry))
    : [];

export function buildSourceBindingStatuses(input: {
  activeSituationContext?: unknown;
  livePipelineReceipt?: unknown;
  worldEventThreadBindingCheck?: unknown;
  workspaceSnapshot?: unknown;
}): HelixSourceBindingStatus[] {
  const statuses: HelixSourceBindingStatus[] = [];
  const activeContext = readRecord(input.activeSituationContext);
  if (activeContext) {
    const status = readString(activeContext.status);
    const sourceBindingIds = readStringArray(activeContext.source_binding_ids);
    const sourceStatus: HelixSourceBindingStatusValue =
      status === "active" ? "bound" :
      status === "stale" ? "stale" :
      status === "unbound" ? "observed_unbound" :
      "missing";
    for (const sourceId of sourceBindingIds.length ? sourceBindingIds : ["active_situation_context"]) {
      statuses.push({
        schema: HELIX_SOURCE_BINDING_STATUS_SCHEMA,
        source_id: sourceId,
        thread_id: readString(activeContext.thread_id),
        environment_id: readString(activeContext.environment_id),
        situation_run_id: readString(activeContext.situation_run_id),
        modality: readStringArray(activeContext.active_modalities).join(",") || "unknown",
        status: sourceStatus,
        evidence_refs: [
          ...readStringArray(activeContext.latest_observation_refs),
          ...readStringArray(activeContext.latest_field_evaluation_refs),
          ...readStringArray(activeContext.latest_probe_result_refs),
          ...readStringArray(activeContext.latest_closure_refs),
        ].slice(0, 24),
        next_required_action: readString(activeContext.next_required_action),
        assistant_answer: false,
        raw_content_included: false,
      });
    }
  }
  const receipt = readRecord(input.livePipelineReceipt);
  const freshness = readRecord(receipt?.producer_freshness);
  if (receipt || freshness) {
    const readiness = readString(freshness?.readiness_state);
    const clientAdoption = readString(freshness?.client_adoption_status);
    const staleReason = readString(freshness?.stale_reason);
    const status: HelixSourceBindingStatusValue =
      clientAdoption === "adopted" || freshness?.client_adoption_ok === true ? "bound" :
      readiness === "waiting_for_client_adoption" || staleReason === "waiting_for_client_adoption" ? "client_adoption_pending" :
      staleReason ? "stale" :
      "missing";
    statuses.push({
      schema: HELIX_SOURCE_BINDING_STATUS_SCHEMA,
      source_id: readString(freshness?.source_id) ?? readString(receipt?.visual_producer_id) ?? "visual_source",
      thread_id: readString(freshness?.thread_id) ?? readString(receipt?.thread_id),
      environment_id: readString(receipt?.environment_id),
      situation_run_id: null,
      modality: "visual_frame",
      status,
      evidence_refs: [
        readString(freshness?.last_chunk_id),
        readString(freshness?.last_analysis_job_id),
        readString(freshness?.last_visual_evidence_id),
      ].filter((entry): entry is string => Boolean(entry)),
      next_required_action: readString(freshness?.next_required_action) ?? readString(receipt?.next_required_action),
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const worldCheck = readRecord(input.worldEventThreadBindingCheck);
  if (worldCheck) {
    const ok = worldCheck.ok === true;
    const reason = readString(worldCheck.latest_append_reason);
    statuses.push({
      schema: HELIX_SOURCE_BINDING_STATUS_SCHEMA,
      source_id: readString(worldCheck.source_id) ?? "source:minecraft-server",
      thread_id: readString(worldCheck.thread_id),
      environment_id: null,
      situation_run_id: null,
      modality: "world_event",
      status: ok ? "bound" : reason === "no_thread_context" ? "observed_unbound" : "stale",
      evidence_refs: readStringArray(worldCheck.evidence_refs),
      next_required_action: readString(worldCheck.next_required_action) ?? (ok ? null : "attach_world_event_source_to_thread"),
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const workspace = readRecord(input.workspaceSnapshot);
  const docPath = readString(workspace?.activeDocPath);
  if (docPath) {
    statuses.push({
      schema: HELIX_SOURCE_BINDING_STATUS_SCHEMA,
      source_id: docPath,
      thread_id: readString(workspace?.sessionId),
      environment_id: null,
      situation_run_id: null,
      modality: "document",
      status: workspace?.docContextValid === false ? "stale" : "bound",
      evidence_refs: [],
      next_required_action: workspace?.docContextValid === false ? "refresh_doc_context" : null,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  return statuses;
}
