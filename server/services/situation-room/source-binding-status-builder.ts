import {
  type HelixSourceBindingStatus,
} from "@shared/helix-source-binding-status";
import { helixEvidenceSourceKindForModality } from "@shared/helix-evidence-source-kind";
import {
  listSourceBindingStatuses,
  upsertSourceBindingStatus,
} from "./source-binding-status-store";

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
    const statusRefs = readStringArray(activeContext.source_binding_status_refs);
    const existing = statusRefs
      .map((ref: string) => listSourceBindingStatuses({ threadId: readString(activeContext.thread_id), limit: 200 })
        .find((entry: HelixSourceBindingStatus) => entry.status_id === ref || `source_binding_status:${entry.status_id.replace(/^source_binding_status:/, "")}` === ref))
      .filter((entry: HelixSourceBindingStatus | undefined): entry is HelixSourceBindingStatus => Boolean(entry));
    if (existing.length > 0) {
      statuses.push(...existing);
    }
  }
  const receipt = readRecord(input.livePipelineReceipt);
  const freshness = readRecord(receipt?.producer_freshness);
  if (receipt || freshness) {
    const readiness = readString(freshness?.readiness_state);
    const clientAdoption = readString(freshness?.client_adoption_status);
    const staleReason = readString(freshness?.stale_reason);
    const state =
      clientAdoption === "adopted" || freshness?.client_adoption_ok === true ? "bound" :
      readiness === "waiting_for_client_adoption" || staleReason === "waiting_for_client_adoption" ? "client_adoption_pending" :
      staleReason ? "stale" :
      "missing";
    statuses.push(upsertSourceBindingStatus({
      source_id: readString(freshness?.source_id) ?? readString(receipt?.visual_producer_id) ?? "visual_source",
      thread_id: readString(freshness?.thread_id) ?? readString(receipt?.thread_id) ?? "helix-ask:desktop",
      environment_id: readString(receipt?.environment_id),
      modality: "visual_frame",
      state: state === "client_adoption_pending" ? "pending_repair" : state,
      latest_chunk_refs: [
        readString(freshness?.last_chunk_id),
        readString(freshness?.last_analysis_job_id),
        readString(freshness?.last_visual_evidence_id),
      ].filter((entry): entry is string => Boolean(entry)),
      terminal_eligible: state === "bound",
      terminal_ineligible_reason: readString(freshness?.next_required_action) ?? readString(receipt?.next_required_action),
    }));
  }
  const worldCheck = readRecord(input.worldEventThreadBindingCheck);
  if (worldCheck) {
    const ok = worldCheck.ok === true;
    const reason = readString(worldCheck.latest_append_reason);
    statuses.push(upsertSourceBindingStatus({
      source_id: readString(worldCheck.source_id) ?? "source:minecraft-server",
      thread_id: readString(worldCheck.thread_id) ?? "helix-ask:desktop",
      modality: "world_event",
      state: ok ? "bound" : reason === "no_thread_context" ? "observed_unbound" : "stale",
      latest_observation_refs: readStringArray(worldCheck.evidence_refs),
      terminal_eligible: ok,
      terminal_ineligible_reason: readString(worldCheck.next_required_action) ?? (ok ? null : "attach_world_event_source_to_thread"),
    }));
  }
  const workspace = readRecord(input.workspaceSnapshot);
  const docPath = readString(workspace?.activeDocPath);
  if (docPath) {
    statuses.push(upsertSourceBindingStatus({
      source_id: docPath,
      thread_id: readString(workspace?.sessionId) ?? "helix-ask:desktop",
      source_kind: helixEvidenceSourceKindForModality("document_context"),
      modality: "document_context",
      state: workspace?.docContextValid === false ? "stale" : "bound",
      terminal_eligible: workspace?.docContextValid !== false,
      terminal_ineligible_reason: workspace?.docContextValid === false ? "refresh_doc_context" : null,
    }));
  }
  return statuses;
}
