import crypto from "node:crypto";
import {
  HELIX_WORKSPACE_OS_AUTHORITY_REASON,
  HELIX_WORKSPACE_OS_STATUS_SCHEMA,
  buildHelixWorkspaceOsAuthority,
  summarizeHelixWorkspaceOsCapabilities,
  withHelixWorkspaceOsAuthority,
  type HelixWorkspaceOsCapabilityRecord,
  type HelixWorkspaceOsCapabilityStatus,
  type HelixWorkspaceOsHealthCheck,
  type HelixWorkspaceOsMode,
  type HelixWorkspaceOsRuntimeStatus,
  type HelixWorkspaceOsStatus,
  type HelixWorkspaceOsSurface,
} from "@shared/helix-workspace-os-status";
import type {
  HelixClientCapability,
  HelixClientCapabilityAction,
  HelixClientCapabilityActionStatus,
} from "@shared/helix-client-capability-action";
import type { HelixClientCapabilityAdoption } from "@shared/helix-client-capability-adoption";
import type { HelixSituationSourceStatus } from "@shared/helix-situation-source-capability";
import type { HelixSourceBindingState } from "@shared/helix-source-binding-status";
import type { HelixWorkstationAffordance } from "@shared/helix-workstation-affordance";
import type { EnvironmentSourceAvailabilityLabel } from "../situation-room/environment-source-availability-projector";
import {
  WORKSPACE_ACTION_REGISTRY,
  WORKSTATION_AFFORDANCES,
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  type WorkspaceActionRegistryEntry,
} from "@shared/workstation-dynamic-tools";
import {
  WORKSTATION_SHELL_CAPABILITIES,
  WORKSTATION_SHELL_CAPABILITY_CONTRACT_VERSION,
  type WorkstationShellCapabilityDefinition,
} from "@shared/workstation-shell-capabilities";
import { HELIX_WORKSTATION_TASK_MANAGER_SCHEMA } from "@shared/helix-workstation-task-manager";
import { listClientCapabilityActions } from "../client-capabilities/client-action-queue";
import { listClientCapabilityAdoptions } from "../client-capabilities/client-adoption-store";
import { readSituationSourceCapabilities } from "../situation-room/situation-source-capability-store";
import { listSourceBindingStatuses } from "../situation-room/source-binding-status-store";
import { listEnvironmentSourceAvailabilities } from "../situation-room/environment-source-availability-projector";
import { runtimeMemoryGovernor } from "../runtime/runtime-memory-governor";

const DEFAULT_THREAD_ID = "helix-ask:desktop";
const REDACTED = "[redacted]";

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown, maxLength = 220): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(/(?:api[_-]?key|token|secret|password)=\S+/gi, `$1=${REDACTED}`)
    .replace(/[A-Za-z0-9._~+/=-]{48,}/g, REDACTED)
    .slice(0, maxLength);
};

const idPart = (value: unknown): string => {
  const cleaned = cleanString(value, 80);
  if (!cleaned) return "unknown";
  if (/[\\/]/.test(cleaned)) return `hashed_${hashShort(cleaned)}`;
  return cleaned.replace(/[^a-z0-9_.:-]+/gi, "_");
};

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values
    .map((value: string | null | undefined) => cleanString(value, 120))
    .filter((value: string | null): value is string => Boolean(value))));

const latest = <T>(values: readonly T[]): T | null => values.length ? values[values.length - 1] : null;

const healthForStatus = (status: HelixWorkspaceOsCapabilityStatus): HelixWorkspaceOsHealthCheck => {
  if (status === "available" || status === "bound") return "ok";
  if (status === "error" || status === "blocked") return "failed";
  if (status === "unknown") return "unknown";
  return "degraded";
};

const makeRecord = (
  record: Omit<HelixWorkspaceOsCapabilityRecord, "authority">,
): HelixWorkspaceOsCapabilityRecord =>
  withHelixWorkspaceOsAuthority({
    ...record,
    last_health_check: record.last_health_check ?? healthForStatus(record.status),
    evidence_refs: unique(record.evidence_refs ?? []),
    receipt_refs: unique(record.receipt_refs ?? []),
  });

const makeErrorRecord = (input: {
  capability_id: string;
  surface: HelixWorkspaceOsSurface;
  label: string;
  error: unknown;
}): HelixWorkspaceOsCapabilityRecord =>
  makeRecord({
    capability_id: input.capability_id,
    surface: input.surface,
    mode: "diagnostic",
    status: "error",
    label: input.label,
    failure_reason: cleanString(input.error instanceof Error ? input.error.message : String(input.error)) ?? "status_reader_failed",
    last_health_check: "failed",
    diagnostics: {
      source: "workspace_os_status_reader",
    },
  });

const CLIENT_CAPABILITY_DEFS: Record<
  HelixClientCapability,
  {
    capability_id: string;
    surface: HelixWorkspaceOsSurface;
    mode: HelixWorkspaceOsMode;
    label: string;
    fallbacks: string[];
  }
> = {
  visual_capture: {
    capability_id: "browser.visual_capture",
    surface: "browser",
    mode: "read_only",
    label: "Browser visual capture",
    fallbacks: ["screen.capture", "browser.tab_capture", "workstation.panel_focus"],
  },
  tab_audio_capture: {
    capability_id: "browser.tab_audio_capture",
    surface: "browser",
    mode: "read_only",
    label: "Browser tab audio capture",
    fallbacks: ["screen.capture", "visual_capture"],
  },
  microphone_capture: {
    capability_id: "microphone.capture",
    surface: "unknown",
    mode: "read_only",
    label: "Microphone capture",
    fallbacks: ["browser.tab_audio_capture"],
  },
  screen_capture: {
    capability_id: "screen.capture",
    surface: "screen",
    mode: "read_only",
    label: "Screen capture",
    fallbacks: ["browser.visual_capture", "browser.tab_capture"],
  },
  browser_tab_capture: {
    capability_id: "browser.tab_capture",
    surface: "browser",
    mode: "read_only",
    label: "Browser tab capture",
    fallbacks: ["browser.visual_capture", "screen.capture"],
  },
  local_file_pick: {
    capability_id: "filesystem.local_file_pick",
    surface: "filesystem",
    mode: "read_only",
    label: "Local file picker",
    fallbacks: [],
  },
  clipboard_read: {
    capability_id: "clipboard.read",
    surface: "clipboard",
    mode: "read_only",
    label: "Clipboard read",
    fallbacks: ["workstation.dynamic_actions"],
  },
  clipboard_write: {
    capability_id: "clipboard.write",
    surface: "clipboard",
    mode: "read_write",
    label: "Clipboard write",
    fallbacks: ["workstation.dynamic_actions"],
  },
  workstation_panel_focus: {
    capability_id: "workstation.panel_focus",
    surface: "workstation_action",
    mode: "execute",
    label: "Workstation panel focus",
    fallbacks: ["workstation.dynamic_actions"],
  },
};

const CLIENT_CAPABILITY_ORDER = Object.keys(CLIENT_CAPABILITY_DEFS) as HelixClientCapability[];

const statusFromClientAction = (
  action: HelixClientCapabilityAction | null,
  adoptionOk: boolean | null,
): HelixWorkspaceOsCapabilityStatus => {
  if (adoptionOk === false) return "error";
  if (adoptionOk === true) return "bound";
  if (!action) return "unknown";
  if (action.status === "failed") return "error";
  if (action.status === "expired") return "stale";
  if (action.status === "adopted" || action.status === "completed") return "available";
  if (action.requires_user_gesture || action.action === "request_permission") return "permission_required";
  if (action.status === "requested" || action.status === "delivered") return "waiting_for_client";
  return "unknown";
};

const buildClientCapabilityRecords = (input: {
  threadId: string;
  actions: HelixClientCapabilityAction[];
  adoptions: HelixClientCapabilityAdoption[];
}): HelixWorkspaceOsCapabilityRecord[] =>
  CLIENT_CAPABILITY_ORDER.map((capability: HelixClientCapability) => {
    const def = CLIENT_CAPABILITY_DEFS[capability];
    const matchingActions = input.actions.filter((action: HelixClientCapabilityAction) => action.capability === capability);
    const matchingAdoptions = input.adoptions.filter((adoption: HelixClientCapabilityAdoption) => adoption.capability === capability);
    const action = latest(matchingActions);
    const adoption = latest(matchingAdoptions);
    const status = statusFromClientAction(action, adoption?.ok ?? null);
    const actionStatus: HelixClientCapabilityActionStatus | "none" = action?.status ?? "none";
    return makeRecord({
      capability_id: def.capability_id,
      surface: def.surface,
      mode: def.mode,
      status,
      label: def.label,
      source: "helix_client_capability_action",
      bound_target: adoption?.client_id ?? action?.target_client ?? null,
      failure_reason: adoption?.ok === false
        ? cleanString(adoption.error) ?? "client_capability_adoption_failed"
        : action?.status === "failed"
          ? "client_capability_action_failed"
          : null,
      missing_reason: action
        ? null
        : "no_client_capability_signal_registered",
      next_required_action: cleanString(adoption?.next_required_action) ?? (
        status === "waiting_for_client" || status === "permission_required" ? action?.action ?? "client_adoption_required" : null
      ),
      fallbacks: def.fallbacks,
      evidence_refs: action ? [action.action_request_id] : [],
      receipt_refs: adoption ? [adoption.adoption_id] : [],
      diagnostics: {
        thread_id: input.threadId,
        capability,
        latest_action_status: actionStatus,
        adoption_ok: adoption?.ok ?? null,
        requires_user_gesture: action?.requires_user_gesture ?? false,
      },
    });
  });

const mapSituationStatus = (status: HelixSituationSourceStatus): HelixWorkspaceOsCapabilityStatus => {
  if (status === "active") return "available";
  return status;
};

const mapBindingState = (state: HelixSourceBindingState): HelixWorkspaceOsCapabilityStatus => {
  if (state === "bound" || state === "repair_applied") return "bound";
  if (state === "pending_repair" || state === "repair_candidate") return "waiting_for_client";
  if (state === "blocked") return "blocked";
  if (state === "stale") return "stale";
  if (state === "detached" || state === "missing" || state === "observed_unbound") return "configured_missing";
  return "degraded";
};

const mapEnvironmentStatus = (status: EnvironmentSourceAvailabilityLabel): HelixWorkspaceOsCapabilityStatus => {
  if (status === "available") return "available";
  if (status === "limited" || status === "degraded" || status === "oversized_payload") return "degraded";
  if (status === "stale") return "stale";
  if (status === "auth_error" || status === "policy_blocked") return "blocked";
  return "configured_missing";
};

const buildWorkstationActionRecords = (): HelixWorkspaceOsCapabilityRecord[] => {
  const records: HelixWorkspaceOsCapabilityRecord[] = [];
  const enabledRegistry = WORKSPACE_ACTION_REGISTRY.filter((entry: WorkspaceActionRegistryEntry) => entry.enabled);
  const confirmationCount = WORKSTATION_AFFORDANCES.filter((entry: HelixWorkstationAffordance) => entry.confirmation_policy !== "never").length;
  records.push(makeRecord({
    capability_id: "workstation.dynamic_actions",
    surface: "workstation_action",
    mode: "diagnostic",
    status: "available",
    label: "Workstation dynamic action registry",
    source: "shared_dynamic_tool_registry",
    evidence_refs: ["workstation_dynamic_tools", "workstation_affordances"],
    diagnostics: {
      dynamic_tool_count: WORKSTATION_DYNAMIC_TOOL_ACTIONS.length,
      affordance_count: WORKSTATION_AFFORDANCES.length,
      workspace_action_count: WORKSPACE_ACTION_REGISTRY.length,
      enabled_action_count: enabledRegistry.length,
      terminal_receipt_required_count: WORKSPACE_ACTION_REGISTRY.filter((entry: WorkspaceActionRegistryEntry) => entry.terminal_receipt_required).length,
      confirmation_required_count: confirmationCount,
    },
  }));

  for (const capability of WORKSTATION_SHELL_CAPABILITIES) {
    records.push(makeWorkstationShellCapabilityRecord(capability));
  }

  const byFamily = new Map<string, HelixWorkstationAffordance[]>();
  for (const affordance of WORKSTATION_AFFORDANCES) {
    byFamily.set(affordance.family, [...(byFamily.get(affordance.family) ?? []), affordance]);
  }
  for (const [family, affordances] of [...byFamily.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    records.push(makeRecord({
      capability_id: `workstation.actions.${idPart(family)}`,
      surface: "workstation_action",
      mode: "diagnostic",
      status: "available",
      label: `Workstation ${family.replace(/_/g, " ")} actions`,
      source: "workstation_affordance_registry",
      evidence_refs: affordances.slice(0, 8).map((entry: HelixWorkstationAffordance) => entry.affordance_id),
      diagnostics: {
        family,
        action_count: affordances.length,
        medium_or_high_risk_count: affordances.filter((entry: HelixWorkstationAffordance) => entry.risk !== "low").length,
        client_target_count: affordances.filter((entry: HelixWorkstationAffordance) => entry.execution_target === "client").length,
        server_target_count: affordances.filter((entry: HelixWorkstationAffordance) => entry.execution_target === "server").length,
        hybrid_target_count: affordances.filter((entry: HelixWorkstationAffordance) => entry.execution_target === "hybrid").length,
        terminal_receipts_required: true,
      },
    }));
  }
  return records;
};

const makeWorkstationShellCapabilityRecord = (
  capability: WorkstationShellCapabilityDefinition,
): HelixWorkspaceOsCapabilityRecord =>
  makeRecord({
    capability_id: capability.capability_id,
    surface: "workstation_action",
    mode: "diagnostic",
    status: "available",
    label: capability.label,
    source: "workstation_shell_capability_contract",
    fallbacks: capability.fallbacks,
    evidence_refs: [
      WORKSTATION_SHELL_CAPABILITY_CONTRACT_VERSION,
      capability.evidence_ref,
    ],
    diagnostics: {
      action_id: capability.action_id ?? null,
      supported_query_params: capability.supported_query_params,
      path_policy: capability.path_policy,
      passive_restore_emits_receipt: capability.passive_restore_emits_receipt,
      agent_triggered_emits_receipt: capability.agent_triggered_emits_receipt,
      agent_receipt_kind: capability.agent_receipt_kind ?? null,
      workspace_os_status_executes: capability.workspace_os_status_executes,
      raw_local_paths_allowed: false,
    },
  });

export type HelixWorkspaceOsStatusReaders = {
  listClientCapabilityActions: typeof listClientCapabilityActions;
  listClientCapabilityAdoptions: typeof listClientCapabilityAdoptions;
  readSituationSourceCapabilities: typeof readSituationSourceCapabilities;
  listSourceBindingStatuses: typeof listSourceBindingStatuses;
  listEnvironmentSourceAvailabilities: typeof listEnvironmentSourceAvailabilities;
  getRuntimeMemorySnapshot: typeof runtimeMemoryGovernor.getRuntimeMemorySnapshot;
  getRuntimeTaskSnapshot: typeof runtimeMemoryGovernor.getRuntimeTaskSnapshot;
  now: () => Date;
};

const DEFAULT_READERS: HelixWorkspaceOsStatusReaders = {
  listClientCapabilityActions,
  listClientCapabilityAdoptions,
  readSituationSourceCapabilities,
  listSourceBindingStatuses,
  listEnvironmentSourceAvailabilities,
  getRuntimeMemorySnapshot: runtimeMemoryGovernor.getRuntimeMemorySnapshot,
  getRuntimeTaskSnapshot: runtimeMemoryGovernor.getRuntimeTaskSnapshot,
  now: () => new Date(),
};

export async function buildHelixWorkspaceOsStatus(
  input: {
    thread_id?: string | null;
    room_id?: string | null;
  },
  readerOverrides: Partial<HelixWorkspaceOsStatusReaders> = {},
): Promise<HelixWorkspaceOsStatus> {
  const readers: HelixWorkspaceOsStatusReaders = {
    ...DEFAULT_READERS,
    ...readerOverrides,
  };
  const generatedAt = readers.now().toISOString();
  const threadId = cleanString(input.thread_id, 120) ?? DEFAULT_THREAD_ID;
  const roomId = cleanString(input.room_id, 120);
  const capabilities: HelixWorkspaceOsCapabilityRecord[] = [];
  let runtime: HelixWorkspaceOsRuntimeStatus | undefined;

  capabilities.push(makeRecord({
    capability_id: "api.helix",
    surface: "api",
    mode: "diagnostic",
    status: "available",
    label: "Helix API status route",
    source: "workspace_os_status_endpoint",
    last_verified_at: generatedAt,
    evidence_refs: [HELIX_WORKSPACE_OS_STATUS_SCHEMA],
  }));

  capabilities.push(makeRecord({
    capability_id: "dev_server.local",
    surface: "dev_server",
    mode: "diagnostic",
    status: "unknown",
    label: "Local dev server",
    source: "workspace_os_status_endpoint",
    missing_reason: "no_existing_dev_server_health_signal",
    next_required_action: "inspect_runtime_or_process_status",
  }));

  capabilities.push(makeRecord({
    capability_id: "workstation.task_manager",
    surface: "runtime_memory",
    mode: "read_only",
    status: "available",
    label: "Workstation Task Manager",
    source: "workspace_os_task_manager_endpoint",
    last_verified_at: generatedAt,
    fallbacks: ["runtime.memory", "workstation-process-graph.open"],
    evidence_refs: [HELIX_WORKSTATION_TASK_MANAGER_SCHEMA],
    diagnostics: {
      endpoint: "/api/workspace-os/task-manager",
      exposes_raw_process_command_lines: false,
      exposes_raw_dom_text: false,
      executes_task_control: false,
      browser_panel_memory_is_approximate: true,
    },
  }));

  try {
    const actions = readers.listClientCapabilityActions({ threadId });
    const adoptions = readers.listClientCapabilityAdoptions({ threadId });
    capabilities.push(...buildClientCapabilityRecords({ threadId, actions, adoptions }));
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.client_capabilities.error",
      surface: "browser",
      label: "Client capability status reader",
      error,
    }));
  }

  try {
    const sourceRead = readers.readSituationSourceCapabilities({ threadId, roomId });
    for (const source of sourceRead.capabilities) {
      capabilities.push(makeRecord({
        capability_id: `situation.source.${idPart(source.source_id)}`,
        surface: "situation_source",
        mode: "read_only",
        status: mapSituationStatus(source.status),
        label: `Situation source ${source.modality}`,
        source: source.modality,
        bound_target: source.room_id ?? source.thread_id,
        last_verified_at: source.last_event_ts ?? null,
        missing_reason: cleanString(source.missing_reason),
        next_required_action: cleanString(source.next_required_action),
        evidence_refs: [`situation_source:${idPart(source.source_id)}`],
        diagnostics: {
          source_id: idPart(source.source_id),
          thread_id: source.thread_id,
          room_id: source.room_id ?? null,
          modality: source.modality,
          contribution: source.contribution,
          fidelity_score: source.fidelity_score,
        },
      }));
    }
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.situation_sources.error",
      surface: "situation_source",
      label: "Situation source capability reader",
      error,
    }));
  }

  try {
    const statuses = readers.listSourceBindingStatuses({ threadId, limit: 100 });
    if (statuses.length === 0) {
      capabilities.push(makeRecord({
        capability_id: "source.bindings",
        surface: "situation_source",
        mode: "diagnostic",
        status: "unknown",
        label: "Source binding status",
        missing_reason: "no_source_binding_status_records",
        next_required_action: "bind_or_observe_source",
      }));
    }
    for (const status of statuses) {
      capabilities.push(makeRecord({
        capability_id: `source.binding.${idPart(status.status_id)}`,
        surface: "situation_source",
        mode: "diagnostic",
        status: mapBindingState(status.state),
        label: `Source binding ${status.source_kind}`,
        source: status.source_kind,
        bound_target: status.binding_id ?? status.situation_run_id ?? status.environment_id ?? null,
        last_verified_at: status.updated_at,
        missing_reason: status.terminal_eligible ? null : cleanString(status.terminal_ineligible_reason),
        evidence_refs: [
          ...status.latest_descriptor_refs,
          ...status.latest_observation_refs,
          ...status.latest_chunk_refs,
        ],
        receipt_refs: status.latest_ledger_refs,
        diagnostics: {
          source_id: idPart(status.source_id),
          source_kind: status.source_kind,
          modality: status.modality,
          replay_policy: status.replay_policy,
          source_binding_terminal_eligible: status.terminal_eligible,
          workspace_os_terminal_eligible: false,
        },
      }));
    }
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.source_bindings.error",
      surface: "situation_source",
      label: "Source binding status reader",
      error,
    }));
  }

  try {
    capabilities.push(...buildWorkstationActionRecords());
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.workstation_actions.error",
      surface: "workstation_action",
      label: "Workstation action registry reader",
      error,
    }));
  }

  try {
    const availabilities = readers.listEnvironmentSourceAvailabilities({ roomId, now: generatedAt });
    if (availabilities.length === 0) {
      capabilities.push(makeRecord({
        capability_id: "environment.sources",
        surface: "environment_source",
        mode: "read_only",
        status: "unknown",
        label: "Environment sources",
        missing_reason: "no_environment_source_manifest_registered",
        next_required_action: "register_environment_source_manifest",
      }));
    }
    for (const availability of availabilities) {
      capabilities.push(makeRecord({
        capability_id: `environment.source.${idPart(availability.source_id)}`,
        surface: "environment_source",
        mode: "read_only",
        status: mapEnvironmentStatus(availability.availability),
        label: `Environment source ${availability.domain}`,
        source: availability.domain_adapter,
        bound_target: availability.room_id,
        failure_reason: cleanString(availability.diagnostics.last_error),
        missing_reason: cleanString(availability.diagnostics.reason),
        next_required_action: cleanString(availability.diagnostics.suggested_fix),
        evidence_refs: [`environment_source:${idPart(availability.source_id)}`],
        diagnostics: {
          domain: availability.domain,
          availability: availability.availability,
          heartbeat_status: availability.heartbeat_status,
          strong_rehearsal: availability.strong_rehearsal,
          missing_modality_count: availability.missing_modalities.length,
          missing_snapshot_section_count: availability.missing_snapshot_sections.length,
          missing_probe_type_count: availability.missing_probe_types.length,
          execution: availability.diagnostics.execution,
          sensor_scope: availability.diagnostics.sensor_scope,
        },
      }));
    }
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.environment_sources.error",
      surface: "environment_source",
      label: "Environment source availability reader",
      error,
    }));
  }

  try {
    const memorySnapshot = readers.getRuntimeMemorySnapshot();
    const taskSnapshot = readers.getRuntimeTaskSnapshot();
    const recentDecisions: Array<{ action: string; admitted: boolean }> = Array.isArray(taskSnapshot.recentDecisions)
      ? taskSnapshot.recentDecisions
      : [];
    const queued = recentDecisions.filter((entry: { action: string; admitted: boolean }) => entry.action === "queue").length;
    const rejected = recentDecisions.filter((entry: { action: string; admitted: boolean }) => !entry.admitted && /^reject_/.test(entry.action)).length;
    runtime = {
      memory_pressure: taskSnapshot.pressureLevel,
      active_task_count: taskSnapshot.activeTasks.length,
      queued_task_count: queued,
      paused_background_task_count: taskSnapshot.pausedTasks.length,
      rejected_task_count: rejected,
      notes: [
        "runtime_memory_governor_remains_scheduler",
        "workspace_os_reports_status_only",
      ],
    };
    capabilities.push(makeRecord({
      capability_id: "runtime.memory",
      surface: "runtime_memory",
      mode: "diagnostic",
      status: taskSnapshot.pressureLevel === "normal"
        ? "available"
        : taskSnapshot.pressureLevel === "soft_pressure"
          ? "degraded"
          : "blocked",
      label: "Runtime memory governor",
      source: "runtime_memory_governor",
      last_verified_at: generatedAt,
      evidence_refs: [String(memorySnapshot.schema), String(taskSnapshot.schema)],
      diagnostics: {
        pressure_level: taskSnapshot.pressureLevel,
        active_task_count: taskSnapshot.activeTasks.length,
        paused_task_count: taskSnapshot.pausedTasks.length,
        registered_pausable_task_count: taskSnapshot.registeredPausableTasks.length,
        queued_recent_decision_count: queued,
        rejected_recent_decision_count: rejected,
      },
    }));
  } catch (error) {
    capabilities.push(makeErrorRecord({
      capability_id: "workspace_os.runtime_memory.error",
      surface: "runtime_memory",
      label: "Runtime memory governor reader",
      error,
    }));
  }

  return {
    schema_version: HELIX_WORKSPACE_OS_STATUS_SCHEMA,
    generated_at: generatedAt,
    thread_id: input.thread_id ?? null,
    room_id: input.room_id ?? null,
    capabilities,
    runtime,
    summary: summarizeHelixWorkspaceOsCapabilities(capabilities),
    authority: buildHelixWorkspaceOsAuthority(HELIX_WORKSPACE_OS_AUTHORITY_REASON),
  };
}

export async function getHelixWorkspaceOsStatus(input: {
  thread_id?: string | null;
  room_id?: string | null;
}): Promise<HelixWorkspaceOsStatus> {
  return buildHelixWorkspaceOsStatus(input);
}
