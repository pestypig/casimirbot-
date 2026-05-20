import type {
  HelixEnvironmentManifestProbeType,
  HelixEnvironmentSnapshotSection,
  HelixEnvironmentSourceManifest,
  HelixEnvironmentSourceModality,
} from "@shared/helix-environment-source-manifest";
import { getEnvironmentSourceHeartbeat, projectEnvironmentSourceHeartbeatStatus } from "./environment-source-heartbeat-store";
import { getEnvironmentSourceManifest, listEnvironmentSourceManifests } from "./environment-source-registry";

export type EnvironmentSourceAvailabilityLabel =
  | "available"
  | "limited"
  | "degraded"
  | "stale"
  | "auth_error"
  | "oversized_payload"
  | "unavailable"
  | "policy_blocked";

export type EnvironmentSourceAvailability = {
  source_id: string;
  room_id: string;
  domain: string;
  domain_adapter: string;
  availability: EnvironmentSourceAvailabilityLabel;
  summary: string;
  missing_modalities: string[];
  missing_snapshot_sections: string[];
  missing_probe_types: string[];
  heartbeat_status: string;
  diagnostics: {
    manifest: "registered" | "missing";
    heartbeat: string;
    snapshot: string;
    probes: string[];
    execution: "disabled";
    sensor_scope: string;
    reason?: string | null;
    suggested_fix?: string | null;
    last_error?: string | null;
  };
  strong_rehearsal: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export function projectEnvironmentSourceAvailability(input: {
  sourceId: string;
  now?: string;
  requiredModalities?: HelixEnvironmentSourceModality[];
  requiredSnapshotSections?: HelixEnvironmentSnapshotSection[];
  requiredProbeTypes?: HelixEnvironmentManifestProbeType[];
}): EnvironmentSourceAvailability {
  const manifest = getEnvironmentSourceManifest(input.sourceId);
  if (!manifest) {
    return {
      source_id: input.sourceId,
      room_id: "unknown",
      domain: "unknown",
      domain_adapter: "unknown",
      availability: "unavailable",
      summary: "No environment source manifest is registered.",
      missing_modalities: input.requiredModalities ?? [],
      missing_snapshot_sections: input.requiredSnapshotSections ?? [],
      missing_probe_types: input.requiredProbeTypes ?? [],
      heartbeat_status: "missing",
      diagnostics: {
        manifest: "missing",
        heartbeat: "missing",
        snapshot: "unknown",
        probes: [],
        execution: "disabled",
        sensor_scope: "unknown",
        reason: "No manifest has been registered.",
      },
      strong_rehearsal: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return projectManifestAvailability({
    manifest,
    now: input.now,
    requiredModalities: input.requiredModalities,
    requiredSnapshotSections: input.requiredSnapshotSections,
    requiredProbeTypes: input.requiredProbeTypes,
  });
}

export function projectManifestAvailability(input: {
  manifest: HelixEnvironmentSourceManifest;
  now?: string;
  requiredModalities?: HelixEnvironmentSourceModality[];
  requiredSnapshotSections?: HelixEnvironmentSnapshotSection[];
  requiredProbeTypes?: HelixEnvironmentManifestProbeType[];
}): EnvironmentSourceAvailability {
  const manifest = input.manifest;
  const requiredModalities = input.requiredModalities ?? ["environment_state"];
  const requiredSnapshotSections = input.requiredSnapshotSections ?? ["actor_state", "inventory_state"];
  const requiredProbeTypes = input.requiredProbeTypes ?? [];
  const heartbeat = getEnvironmentSourceHeartbeat(manifest.source_id);
  const heartbeatStatus = projectEnvironmentSourceHeartbeatStatus({ heartbeat, now: input.now });
  const missingModalities = requiredModalities.filter((entry) => !manifest.modalities.includes(entry));
  const missingSections = requiredSnapshotSections.filter((entry) => !manifest.supported_snapshot_sections.includes(entry));
  const missingProbes = requiredProbeTypes.filter((entry) => !manifest.supported_probe_types.includes(entry));
  const policyBlocked =
    manifest.execution_policy.may_execute_live_actions !== false ||
    manifest.sensor_scope_policy.privileged_state_requires_caveat !== true;
  const active = heartbeatStatus === "active" || heartbeatStatus === "degraded";
  const runtime = heartbeat?.runtime_status;
  const authError = (runtime?.auth_failure_count ?? 0) > 0 || heartbeatStatus === "error" && runtime?.last_error === "auth_error";
  const oversizedPayload = (runtime?.oversized_payload_count ?? 0) > 0 || /payload/i.test(String(runtime?.last_error ?? ""));
  const baseReady = missingModalities.length === 0 && missingSections.length === 0;
  const strongRehearsal = baseReady && missingProbes.length === 0 && requiredProbeTypes.length > 0 && active;
  const availability: EnvironmentSourceAvailabilityLabel = policyBlocked
    ? "policy_blocked"
    : authError
      ? "auth_error"
      : oversizedPayload
        ? "oversized_payload"
    : !active
      ? heartbeatStatus === "stale" ? "stale" : "unavailable"
      : heartbeatStatus === "degraded"
        ? "degraded"
        : baseReady && missingProbes.length === 0
          ? "available"
        : baseReady
          ? "limited"
          : "unavailable";
  const reason = availability === "auth_error"
    ? "Heartbeat reports authentication failure."
    : availability === "oversized_payload"
      ? "Heartbeat reports oversized payloads or 413 responses."
      : availability === "degraded"
        ? "Heartbeat is active, but runtime status is degraded."
        : availability === "stale"
          ? "No recent heartbeat is available."
          : availability === "limited"
            ? "Snapshots are active, but requested probes are unsupported."
            : null;
  return {
    source_id: manifest.source_id,
    room_id: manifest.room_id,
    domain: manifest.domain,
    domain_adapter: manifest.domain_adapter,
    availability,
    summary: availability === "available"
      ? "Manifest and heartbeat support the requested rehearsal space."
      : availability === "degraded"
        ? "Heartbeat is active, but the source reports degraded runtime health."
      : availability === "limited"
        ? "Snapshots are active, but one or more requested probe types are unsupported."
        : availability === "auth_error"
          ? "Source authentication failed."
        : availability === "oversized_payload"
          ? "Source snapshots are oversized or being skipped."
        : availability === "stale"
          ? "Source heartbeat is stale."
          : availability === "policy_blocked"
            ? "Source policy blocks this rehearsal space."
            : "Source is not currently available.",
    missing_modalities: missingModalities,
    missing_snapshot_sections: missingSections,
    missing_probe_types: missingProbes,
    heartbeat_status: heartbeatStatus,
    diagnostics: {
      manifest: "registered",
      heartbeat: heartbeatStatus,
      snapshot: heartbeat?.latest_snapshot_ts ?? "unknown",
      probes: manifest.supported_probe_types,
      execution: "disabled",
      sensor_scope: manifest.sensor_scope_policy.default_scope,
      reason,
      suggested_fix: availability === "oversized_payload"
        ? "Reduce local_map radius, max_local_blocks, crop radius, or entity caps."
        : availability === "auth_error"
          ? "Check the plugin bearer token and Helix source token scope."
          : null,
      last_error: runtime?.last_error ?? null,
    },
    strong_rehearsal: strongRehearsal,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function listEnvironmentSourceAvailabilities(input?: {
  roomId?: string | null;
  now?: string;
}): EnvironmentSourceAvailability[] {
  return listEnvironmentSourceManifests({ roomId: input?.roomId ?? null }).map((manifest) =>
    projectManifestAvailability({
      manifest,
      now: input?.now,
      requiredModalities: ["environment_state"],
      requiredSnapshotSections: ["actor_state", "inventory_state"],
      requiredProbeTypes: ["route_feasibility", "reachability", "inventory_check"],
    })
  );
}
