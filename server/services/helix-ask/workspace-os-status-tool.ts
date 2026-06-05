import type {
  HelixWorkspaceOsCapabilityRecord,
  HelixWorkspaceOsStatus,
} from "@shared/helix-workspace-os-status";
import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
} from "./workspace-os-status-intent";
import { getHelixWorkspaceOsStatus } from "../workspace-os/workspace-os-status";

export const HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA =
  "helix.workspace_os_status_observation.v1" as const;

const NON_OK_STATUSES = new Set([
  "blocked",
  "configured_missing",
  "degraded",
  "error",
  "permission_required",
  "stale",
  "stopped",
  "unknown",
  "waiting_for_client",
]);

export type HelixWorkspaceOsStatusObservation = {
  schema: typeof HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA;
  capability_key: typeof HELIX_WORKSPACE_OS_STATUS_CAPABILITY;
  status_schema_version: HelixWorkspaceOsStatus["schema_version"];
  generated_at: string;
  thread_id?: string | null;
  room_id?: string | null;
  summary: HelixWorkspaceOsStatus["summary"];
  runtime?: HelixWorkspaceOsStatus["runtime"];
  capability_count: number;
  noteworthy_capabilities: Array<Pick<
    HelixWorkspaceOsCapabilityRecord,
    | "capability_id"
    | "surface"
    | "mode"
    | "status"
    | "label"
    | "source"
    | "bound_target"
    | "last_health_check"
    | "last_verified_at"
    | "failure_reason"
    | "missing_reason"
    | "next_required_action"
    | "fallbacks"
    | "evidence_refs"
    | "receipt_refs"
    | "authority"
  >>;
  authority: HelixWorkspaceOsStatus["authority"];
  terminal_eligible: false;
  post_tool_model_step_required: true;
  assistant_answer: false;
  raw_content_included: false;
};

const selectNoteworthyCapabilities = (
  status: HelixWorkspaceOsStatus,
  capabilityIds: readonly string[] = [],
): HelixWorkspaceOsStatusObservation["noteworthy_capabilities"] => {
  const requestedIds = new Set(capabilityIds.map((id) => id.trim()).filter(Boolean));
  const selected = status.capabilities.filter((capability) =>
    requestedIds.has(capability.capability_id) ||
    NON_OK_STATUSES.has(capability.status) ||
    capability.capability_id === "runtime.memory" ||
    capability.capability_id === "api.helix",
  );
  const fallback = selected.length > 0 ? selected : status.capabilities.slice(0, 12);
  return fallback.slice(0, 24).map((capability) => ({
    capability_id: capability.capability_id,
    surface: capability.surface,
    mode: capability.mode,
    status: capability.status,
    label: capability.label,
    source: capability.source,
    bound_target: capability.bound_target,
    last_health_check: capability.last_health_check,
    last_verified_at: capability.last_verified_at,
    failure_reason: capability.failure_reason,
    missing_reason: capability.missing_reason,
    next_required_action: capability.next_required_action,
    fallbacks: capability.fallbacks,
    evidence_refs: capability.evidence_refs,
    receipt_refs: capability.receipt_refs,
    authority: capability.authority,
  }));
};

export const buildWorkspaceOsStatusObservation = (input: {
  status: HelixWorkspaceOsStatus;
  capabilityIds?: readonly string[];
}): HelixWorkspaceOsStatusObservation => ({
  schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  status_schema_version: input.status.schema_version,
  generated_at: input.status.generated_at,
  thread_id: input.status.thread_id ?? null,
  room_id: input.status.room_id ?? null,
  summary: input.status.summary,
  runtime: input.status.runtime,
  capability_count: input.status.capabilities.length,
  noteworthy_capabilities: selectNoteworthyCapabilities(input.status, input.capabilityIds ?? []),
  authority: input.status.authority,
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const executeWorkspaceOsStatusTool = async (input: {
  thread_id?: string | null;
  room_id?: string | null;
  capability_ids?: readonly string[];
}): Promise<{
  status: HelixWorkspaceOsStatus;
  observation: HelixWorkspaceOsStatusObservation;
}> => {
  const status = await getHelixWorkspaceOsStatus({
    thread_id: input.thread_id,
    room_id: input.room_id,
  });
  return {
    status,
    observation: buildWorkspaceOsStatusObservation({
      status,
      capabilityIds: input.capability_ids ?? [],
    }),
  };
};
