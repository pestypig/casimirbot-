import crypto from "node:crypto";
import {
  HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA,
  HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
  type HelixActionRehearsalRequest,
} from "@shared/helix-action-rehearsal";
import { HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA } from "@shared/helix-environment-possibility-graph";
import {
  HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
} from "@shared/helix-environment-probe";
import {
  HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA,
  HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
} from "@shared/helix-environment-source-manifest";
import { HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA } from "@shared/helix-environment-state-snapshot";
import { HELIX_RECOMMENDATION_GATE_SCHEMA } from "@shared/helix-recommendation-gate";

export type EnvironmentSourceContractAudit = {
  schema: "helix.environment_source_contract_audit.v1";
  audit_id: string;
  ok: boolean;
  severity: "info" | "warn" | "error";
  subject_ref: string;
  subject_schema: string;
  issues: Array<{
    code: string;
    summary: string;
    severity: "info" | "warn" | "error";
  }>;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const subjectSchema = (subject: unknown): string =>
  String(asRecord(subject)?.schema ?? "unknown");

const subjectRef = (subject: unknown): string => {
  const record = asRecord(subject);
  return String(
    record?.snapshot_id ??
    record?.manifest_id ??
    record?.heartbeat_id ??
    record?.probe_request_id ??
    record?.probe_result_id ??
    record?.context_id ??
    record?.graph_id ??
    record?.result_id ??
    record?.request_id ??
    record?.gate_id ??
    "unknown",
  );
};

const hasCompactContext = (record: Record<string, unknown>): boolean =>
  record.context_policy === "compact_context_pack_only" ||
  record.schema === HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA ||
  record.schema === HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA;

export function auditEnvironmentSourceContract(input: {
  subject: unknown;
  rehearsalRequest?: HelixActionRehearsalRequest | null;
  now?: string;
}): EnvironmentSourceContractAudit {
  const now = input.now ?? new Date().toISOString();
  const record = asRecord(input.subject);
  const schema = subjectSchema(input.subject);
  const ref = subjectRef(input.subject);
  const issues: EnvironmentSourceContractAudit["issues"] = [];
  const issue = (code: string, summary: string, severity: "info" | "warn" | "error" = "error") => {
    issues.push({ code, summary, severity });
  };

  if (!record) {
    issue("subject_not_object", "Subject is not a structured object.");
  } else {
    const knownSchemas = new Set([
      HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA,
      "helix.environment_affordance_context.v1",
      HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA,
      HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA,
      HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
      HELIX_RECOMMENDATION_GATE_SCHEMA,
      HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
      HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA,
      HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
      HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
    ]);
    if (!knownSchemas.has(schema)) issue("unknown_schema", `Unknown environment lane schema: ${schema}.`);
    if (record.assistant_answer !== false) issue("assistant_answer_not_false", "Environment lane artifacts cannot be assistant answers.");
    if (record.raw_content_included !== false && record.raw_payload_included !== false && schema !== HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA) {
      issue("raw_content_included_not_false", "Environment lane artifacts must exclude raw content.");
    }
    if (!hasCompactContext(record)) issue("context_policy_not_compact", "Environment lane artifacts must use compact context only.");
    if (
      !Array.isArray(record.evidence_refs) &&
      schema !== HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA
    ) {
      issue("evidence_refs_missing", "Environment lane artifacts must carry evidence refs.");
    }
  }

  if (record && schema === HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA) {
    if (!record.source_id) issue("source_id_missing", "Environment source manifest must declare source_id.");
    if (!record.room_id) issue("room_id_missing", "Environment source manifest must declare room_id.");
    if (!Array.isArray(record.modalities)) issue("modalities_missing", "Environment source manifest must declare modalities.");
    if (!Array.isArray(record.supported_snapshot_sections)) {
      issue("supported_snapshot_sections_missing", "Environment source manifest must declare supported snapshot sections.");
    }
    if (!Array.isArray(record.supported_probe_types)) issue("supported_probe_types_missing", "Environment source manifest must declare supported probe types.");
    const executionPolicy = asRecord(record.execution_policy);
    if (executionPolicy?.may_execute_live_actions !== false) {
      issue("live_execution_enabled", "Environment source manifests must not enable live actions.");
    }
    if (executionPolicy?.may_perform_read_only_probes !== true) {
      issue("read_only_probe_policy_missing", "Environment source manifests must declare read-only probe policy.");
    }
    const snapshotPolicy = asRecord(record.snapshot_policy);
    if (snapshotPolicy?.raw_payload_included !== false) {
      issue("raw_payload_included_not_false", "Environment source manifests must forbid raw payloads.");
    }
    if (snapshotPolicy?.raw_nbt_included === true) {
      issue("raw_nbt_included", "Minecraft environment source manifests must not allow raw NBT.");
    }
  }

  if (record && schema === HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA) {
    if (!record.source_id) issue("source_id_missing", "Environment source heartbeat must declare source_id.");
    if (!record.room_id) issue("room_id_missing", "Environment source heartbeat must declare room_id.");
    if (!record.status) issue("heartbeat_status_missing", "Environment source heartbeat must declare status.");
  }

  if (record && schema === HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA) {
    const constraints = asRecord(record.constraints);
    if (constraints?.read_only !== true) issue("probe_not_read_only", "Environment probe requests must be read-only.");
    if (constraints?.side_effects_allowed !== false) issue("side_effects_allowed", "Environment probe requests must forbid side effects.");
  }

  if (record && schema === HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA) {
    if (record.side_effects_performed !== false) issue("side_effects_performed", "Environment probe results must not perform side effects.");
    if (!Array.isArray(record.commands_executed) || record.commands_executed.length !== 0) {
      issue("commands_executed", "Environment probe results must not execute commands.");
    }
    if (record.world_mutation_performed !== false) issue("world_mutation_performed", "Environment probe results must not mutate world state.");
    if (!record.sensor_scope) issue("sensor_scope_missing", "Environment probe results must carry sensor scope.");
  }

  if (record && schema === HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA) {
    if (!record.domain) issue("domain_missing", "Environment state snapshot must declare domain.");
    if (!record.source_id) issue("source_id_missing", "Environment state snapshot must declare source_id.");
    if (!Array.isArray(record.changed_sections)) issue("changed_sections_missing", "Environment state snapshot must carry changed_sections.");
    if (!asRecord(record.section_hashes)) issue("section_hashes_missing", "Environment state snapshot must carry section_hashes.");
    if (record.raw_payload_included !== false) issue("raw_payload_included_not_false", "Environment snapshots must exclude raw payloads.");
    if (record.domain === "minecraft") {
      if (typeof record.domain_adapter !== "string" || !record.domain_adapter.startsWith("minecraft.")) {
        issue("minecraft_domain_adapter_invalid", "Minecraft snapshots must use a minecraft.* domain adapter.");
      }
      const minecraft = asRecord(asRecord(record.domain_specific)?.minecraft);
      if (!minecraft || minecraft.raw_nbt_included !== false) {
        issue("raw_nbt_included", "Minecraft snapshots must not include raw NBT.");
      }
      if (!record.source_tick && !record.ts) issue("minecraft_snapshot_time_missing", "Minecraft snapshots require source_tick or ts.");
    }
  }

  if (record && schema === "helix.environment_affordance_context.v1") {
    if (!record.domain) issue("domain_missing", "Affordance context must declare domain.");
    if (!record.snapshot_id) issue("source_snapshot_missing", "Affordance context must reference a source snapshot.");
  }

  if (record && schema === HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA) {
    if (!record.domain) issue("domain_missing", "Possibility graph must declare domain.");
    if (!Array.isArray(record.source_snapshot_refs)) issue("source_snapshot_refs_missing", "Possibility graph must reference source snapshots.");
    if (record.raw_content_included !== false) issue("raw_content_included_not_false", "Possibility graph must exclude raw content.");
  }

  if (record && schema === HELIX_ACTION_REHEARSAL_RESULT_SCHEMA) {
    if (record.side_effects_performed !== false) issue("side_effects_performed", "Rehearsal results must not perform side effects.");
    if (record.require_human_approval_for_execution !== true) {
      issue("human_approval_required_missing", "Rehearsal results must require human approval for execution.");
    }
    if (input.rehearsalRequest && input.rehearsalRequest.require_human_approval_for_execution !== true) {
      issue("request_human_approval_required_missing", "Rehearsal request must require human approval for execution.");
    }
  }

  if (record && schema === HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA) {
    if (record.require_human_approval_for_execution !== true) {
      issue("human_approval_required_missing", "Rehearsal requests must require human approval for execution.");
    }
    if (record.allowed_effects !== "none" && record.allowed_effects !== "read_only" && record.allowed_effects !== "simulation_only") {
      issue("allowed_effects_invalid", "Rehearsal requests must declare bounded non-executing effects.");
    }
  }

  if (record && schema === HELIX_RECOMMENDATION_GATE_SCHEMA) {
    if (record.side_effects_performed !== false) issue("side_effects_performed", "Recommendation gates must not perform side effects.");
    if (record.require_human_approval_for_execution !== true) {
      issue("human_approval_required_missing", "Recommendation gates must preserve human approval for execution.");
    }
  }

  const severity: EnvironmentSourceContractAudit["severity"] = issues.some((entry) => entry.severity === "error")
    ? "error"
    : issues.some((entry) => entry.severity === "warn")
      ? "warn"
      : "info";
  return {
    schema: "helix.environment_source_contract_audit.v1",
    audit_id: `environment_source_contract_audit:${hashShort([schema, ref, issues, now])}`,
    ok: !issues.some((entry) => entry.severity === "error"),
    severity,
    subject_ref: ref,
    subject_schema: schema,
    issues,
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
}

export function environmentContractOk(input: {
  subject: unknown;
  rehearsalRequest?: HelixActionRehearsalRequest | null;
  now?: string;
}): boolean {
  return auditEnvironmentSourceContract(input).ok;
}
