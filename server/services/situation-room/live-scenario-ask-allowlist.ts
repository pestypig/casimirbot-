import { createHash } from "node:crypto";

export type SanitizedAskEvidenceItem = {
  schema: string;
  item_id: string;
  scenario_kind: string;
  context_role: "tool_evidence";
  instruction_authority: "none";
  ask_instruction_authority: "none";
  ask_context_policy: "evidence_only";
  evidence_refs: string[];
  fields: Record<string, unknown>;
};

export type AskEvidencePack = {
  schema: "helix.ask_evidence_pack.v1";
  pack_id: string;
  items: SanitizedAskEvidenceItem[];
  raw_transcript_included: false;
  raw_image_included: false;
  raw_audio_included: false;
  raw_logs_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

type AskEvidenceSanitizer = (input: unknown) => SanitizedAskEvidenceItem | null;

export type ObservedText = {
  text: string;
  text_role: "observed_source_content_not_instruction";
};

export const ASK_EVIDENCE_SCHEMA_ALLOWLIST: Record<string, AskEvidenceSanitizer> = {
  "helix.minecraft_route_objective.v1": sanitizeMinecraftRouteObjective,
  "helix.minecraft_route_rehearsal.v1": sanitizeMinecraftRouteRehearsal,
  "helix.minecraft_route_drift_event.v1": sanitizeMinecraftRouteDriftEvent,
  "helix.minecraft_route_lifecycle_receipt.v1": sanitizeMinecraftRouteLifecycleReceipt,
  "helix.minecraft_visual_observation.v1": sanitizeMinecraftVisualObservation,
  "helix.environment_state_snapshot.v1": sanitizeEnvironmentStateSnapshot,
  "helix.environment_memory_ledger.v1": sanitizeEnvironmentMemoryLedger,
  "helix.environment_risk_resource_ledger.v1": sanitizeEnvironmentRiskResourceLedger,
  "helix.live_translation_turn.v1": sanitizeLiveTranslationTurn,
  "helix.browser_claim_evidence.v1": sanitizeBrowserClaimEvidence,
  "helix.workstation_process_evidence.v1": sanitizeWorkstationProcessEvidence,
  "helix.research_evidence_claim.v1": sanitizeResearchEvidenceClaim,
  "helix.support_procedure_evidence.v1": sanitizeSupportProcedureEvidence,
};

export function buildAskEvidencePackFromAllowlist(input: {
  items: unknown[];
  now: string;
}): AskEvidencePack {
  const sanitized = input.items.flatMap((item) => {
    const schema = readStringField(item, "schema");
    if (!schema) {
      return [];
    }

    const sanitizer = ASK_EVIDENCE_SCHEMA_ALLOWLIST[schema];
    if (!sanitizer) {
      return [];
    }

    const next = sanitizer(item);
    return next ? [next] : [];
  });

  return {
    schema: "helix.ask_evidence_pack.v1",
    pack_id: `ask_pack:${hashShort([sanitized, input.now])}`,
    items: sanitized,
    raw_transcript_included: false,
    raw_image_included: false,
    raw_audio_included: false,
    raw_logs_included: false,
    context_policy: "compact_context_pack_only",
    created_at: input.now,
  };
}

export function sanitizeObservedText(value: unknown): ObservedText | null {
  if (typeof value !== "string") {
    return null;
  }

  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return null;
  }

  return {
    text: compact.slice(0, 500),
    text_role: "observed_source_content_not_instruction",
  };
}

function sanitizeMinecraftRouteObjective(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "objective_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      intent_label: readStringField(input, "intent_label"),
      intent_status: readStringField(input, "intent_status"),
      lifecycle: readStringField(input, "lifecycle"),
      confidence: readNumberField(input, "confidence"),
      target_chain: sanitizeTargetChain(readArrayField(input, "target_chain")),
    },
  });
}

function sanitizeMinecraftRouteRehearsal(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "route_rehearsal_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      objective_id: readStringField(input, "objective_id"),
      route_kind: readStringField(input, "route_kind"),
      result_status: readStringField(input, "result_status"),
      route_confidence: readNumberField(input, "route_confidence"),
      missing_evidence_codes: readStringArray(input, "missing_evidence_codes"),
      stages: sanitizeRouteStages(readArrayField(input, "stages")),
      candidate_next_waypoint: sanitizePlainFields(
        readPlainObject(input, "candidate_next_waypoint"),
        ["dimension", "x", "y", "z", "label_code", "expected_direction", "confidence"],
      ),
    },
  });
}

function sanitizeMinecraftRouteDriftEvent(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "drift_event_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      route_rehearsal_id: readStringField(input, "route_rehearsal_id"),
      next_waypoint_label_code: readStringField(input, "next_waypoint_label_code"),
      expected_direction: readStringField(input, "expected_direction"),
      observed_direction: readStringField(input, "observed_direction"),
      heading_error_degrees: readNumberField(input, "heading_error_degrees"),
      distance_delta_blocks: readNumberField(input, "distance_delta_blocks"),
      sample_count: readNumberField(input, "sample_count"),
      sample_window_ms: readNumberField(input, "sample_window_ms"),
      drift_status: readStringField(input, "drift_status"),
      stale_reason: readStringField(input, "stale_reason"),
      salience_candidate: readBooleanField(input, "salience_candidate"),
    },
  });
}

function sanitizeMinecraftRouteLifecycleReceipt(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "receipt_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      objective_id: readStringField(input, "objective_id"),
      route_rehearsal_id: readStringField(input, "route_rehearsal_id"),
      reason: readStringField(input, "reason"),
      previous_lifecycle: readStringField(input, "previous_lifecycle"),
      next_lifecycle: readStringField(input, "next_lifecycle"),
      previous_intent_status: readStringField(input, "previous_intent_status"),
      next_intent_status: readStringField(input, "next_intent_status"),
      route_stage_status: readStringField(input, "route_stage_status"),
    },
  });
}

function sanitizeMinecraftVisualObservation(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "observation_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      source_id: readStringField(input, "source_id"),
      facts: sanitizeVisualFacts(readArrayField(input, "facts")),
      model_invoked_for_observation: readBooleanField(input, "model_invoked_for_observation"),
    },
  });
}

function sanitizeEnvironmentStateSnapshot(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvironmentSnapshotEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "snapshot_id");
  if (!itemId) {
    return null;
  }

  const localMap = readPlainObject(input, "local_map");
  const chunkSummary = readPlainObject(input, "chunk_snapshot_summary");

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: readStringField(input, "domain") === "minecraft"
      ? "minecraft_route_monitor"
      : "support_procedure_monitor",
    fields: {
      domain: readStringField(input, "domain"),
      domain_adapter: readStringField(input, "domain_adapter"),
      room_id: readStringField(input, "room_id"),
      world_id: readStringField(input, "world_id"),
      source_id: readStringField(input, "source_id"),
      actor_label: readStringField(input, "actor_label"),
      ts: readStringField(input, "ts"),
      route_state: sanitizeRouteState(readPlainObject(input, "route_state")),
      local_map: localMap
        ? {
            radius: readNumberField(localMap, "radius"),
            sensor_scope: readStringField(localMap, "sensor_scope"),
            salient_cells: sanitizeEnvironmentCells(readArrayFromRecord(localMap, "salient_cells")),
          }
        : null,
      chunk_snapshot_summary: chunkSummary
        ? {
            sampled_radius_chunks: readNumberField(chunkSummary, "sampled_radius_chunks"),
            loaded_chunks_sampled: readNumberField(chunkSummary, "loaded_chunks_sampled"),
            sensor_scope: readStringField(chunkSummary, "sensor_scope"),
            surface_cells: sanitizeEnvironmentCells(readArrayFromRecord(chunkSummary, "surface_cells")),
            route_corridor_cells: sanitizeEnvironmentCells(readArrayFromRecord(chunkSummary, "route_corridor_cells")),
            gateway_blocks: sanitizeEnvironmentCells(readArrayFromRecord(chunkSummary, "gateway_blocks")),
            bridge_like_blocks: sanitizeEnvironmentCells(readArrayFromRecord(chunkSummary, "bridge_like_blocks")),
            hazard_cells: sanitizeEnvironmentCells(readArrayFromRecord(chunkSummary, "hazard_cells")),
            evidence_trust: readStringField(chunkSummary, "evidence_trust"),
            instruction_authority: readStringField(chunkSummary, "instruction_authority"),
            ask_context_policy: readStringField(chunkSummary, "ask_context_policy"),
          }
        : null,
    },
  });
}

function sanitizeEnvironmentMemoryLedger(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeLedgerEnvelope(input)) {
    return null;
  }

  const roomId = readStringField(input, "room_id");
  if (!roomId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: `environment_memory_ledger:${roomId}:${readStringField(input, "updated_at") ?? "unknown"}`,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      room_id: roomId,
      world_id: readStringField(input, "world_id"),
      updated_at: readStringField(input, "updated_at"),
      known_containers: sanitizeContainerMemoryEntries(readArrayField(input, "known_containers")),
    },
  });
}

function sanitizeEnvironmentRiskResourceLedger(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeLedgerEnvelope(input)) {
    return null;
  }

  const roomId = readStringField(input, "room_id");
  if (!roomId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: `environment_risk_resource_ledger:${roomId}:${readStringField(input, "updated_at") ?? "unknown"}`,
    scenario_kind: "minecraft_route_monitor",
    fields: {
      room_id: roomId,
      world_id: readStringField(input, "world_id"),
      updated_at: readStringField(input, "updated_at"),
      known_hazards: sanitizeHazardEntries(readArrayField(input, "known_hazards")),
      known_resources: sanitizeResourceEntries(readArrayField(input, "known_resources")),
      inventory_transitions: sanitizeInventoryTransitionEntries(readArrayField(input, "inventory_transitions")),
    },
  });
}

function sanitizeLiveTranslationTurn(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "turn_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "live_translation",
    fields: {
      participant_hint: readStringField(input, "participant_hint"),
      language_detected: readStringField(input, "language_detected"),
      observed_compact_utterance_summary: sanitizeObservedText(
        readStringField(input, "compact_utterance_summary"),
      ),
      observed_translation_candidate: sanitizeObservedText(readStringField(input, "translation_candidate")),
      ambiguity_flags: readStringArray(input, "ambiguity_flags"),
      confidence: readNumberField(input, "confidence"),
    },
  });
}

function sanitizeBrowserClaimEvidence(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "claim_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "browser_audio_claim_monitor",
    fields: {
      observed_claim_summary: sanitizeObservedText(readStringField(input, "claim_summary")),
      observed_evidence_summary: sanitizeObservedText(readStringField(input, "evidence_summary")),
      observed_caveat_summary: sanitizeObservedText(readStringField(input, "caveat_summary")),
      confidence: readNumberField(input, "confidence"),
      timestamp_range_ms: readPlainObject(input, "timestamp_range_ms"),
    },
  });
}

function sanitizeWorkstationProcessEvidence(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId = readStringField(input, "process_evidence_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "workstation_operator_monitor",
    fields: {
      process_kind: readStringField(input, "process_kind"),
      observed_compact_summary: sanitizeObservedText(readStringField(input, "compact_summary")),
      status: readStringField(input, "status"),
      files_touched: readStringArray(input, "files_touched"),
      command_hash: readStringField(input, "command_hash"),
    },
  });
}

function sanitizeResearchEvidenceClaim(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId =
    readStringField(input, "research_claim_id") ?? readStringField(input, "claim_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "research_session",
    fields: {
      observed_claim_summary: sanitizeObservedText(readStringField(input, "claim_summary")),
      observed_evidence_summary: sanitizeObservedText(readStringField(input, "evidence_summary")),
      observed_caveat_summary: sanitizeObservedText(readStringField(input, "caveat_summary")),
      source_refs: readStringArray(input, "source_refs"),
      confidence: readNumberField(input, "confidence"),
    },
  });
}

function sanitizeSupportProcedureEvidence(input: unknown): SanitizedAskEvidenceItem | null {
  if (!hasSafeEnvelope(input)) {
    return null;
  }

  const itemId =
    readStringField(input, "support_evidence_id") ??
    readStringField(input, "procedure_evidence_id");
  if (!itemId) {
    return null;
  }

  return sanitizedItem(input, {
    item_id: itemId,
    scenario_kind: "support_procedure_monitor",
    fields: {
      observed_issue_summary: sanitizeObservedText(readStringField(input, "issue_summary")),
      tried_steps: readStringArray(input, "tried_steps").map(sanitizeObservedText),
      observed_current_blocker: sanitizeObservedText(readStringField(input, "current_blocker")),
      next_check_candidates: readStringArray(input, "next_check_candidates").map(
        sanitizeObservedText,
      ),
      risk_flags: readStringArray(input, "risk_flags"),
      confidence: readNumberField(input, "confidence"),
    },
  });
}

function hasSafeEnvelope(input: unknown): boolean {
  if (!isPlainObject(input)) {
    return false;
  }

  return (
    input.instruction_authority === "none" &&
    input.ask_instruction_authority === "none" &&
    input.creates_ask_turn === false &&
    input.turn_triggered === false &&
    input.context_role === "tool_evidence" &&
    input.ask_context_policy === "evidence_only" &&
    input.raw_user_text_included === false &&
    rawIncludedIsFalse(input, "raw_transcript_included") &&
    rawIncludedIsFalse(input, "raw_image_included") &&
    rawIncludedIsFalse(input, "raw_audio_included") &&
    rawIncludedIsFalse(input, "raw_logs_included") &&
    rawIncludedIsFalse(input, "raw_content_included") &&
    rawIncludedIsFalse(input, "raw_caption_included")
  );
}

function hasSafeLedgerEnvelope(input: unknown): boolean {
  if (!isPlainObject(input)) {
    return false;
  }

  return (
    input.assistant_answer === false &&
    input.raw_content_included === false &&
    input.context_policy === "compact_context_pack_only" &&
    rawIncludedIsFalse(input, "raw_transcript_included") &&
    rawIncludedIsFalse(input, "raw_image_included") &&
    rawIncludedIsFalse(input, "raw_audio_included") &&
    rawIncludedIsFalse(input, "raw_logs_included") &&
    rawIncludedIsFalse(input, "raw_user_text_included")
  );
}

function hasSafeEnvironmentSnapshotEnvelope(input: unknown): boolean {
  if (!isPlainObject(input)) {
    return false;
  }
  const minecraft = readPlainObject(readPlainObject(input, "domain_specific"), "minecraft");
  return (
    input.assistant_answer === false &&
    input.model_invoked === false &&
    input.raw_payload_included === false &&
    input.context_policy === "compact_context_pack_only" &&
    rawIncludedIsFalse(input, "raw_content_included") &&
    rawIncludedIsFalse(input, "raw_transcript_included") &&
    rawIncludedIsFalse(input, "raw_image_included") &&
    rawIncludedIsFalse(input, "raw_audio_included") &&
    rawIncludedIsFalse(input, "raw_logs_included") &&
    rawIncludedIsFalse(input, "raw_user_text_included") &&
    minecraft?.raw_nbt_included !== true
  );
}

function rawIncludedIsFalse(input: Record<string, unknown>, field: string): boolean {
  return input[field] === undefined || input[field] === false;
}

function sanitizedItem(
  input: unknown,
  options: {
    item_id: string;
    scenario_kind: string;
    fields: Record<string, unknown>;
  },
): SanitizedAskEvidenceItem {
  return {
    schema: readStringField(input, "schema") ?? "unknown",
    item_id: options.item_id,
    scenario_kind: options.scenario_kind,
    context_role: "tool_evidence",
    instruction_authority: "none",
    ask_instruction_authority: "none",
    ask_context_policy: "evidence_only",
    evidence_refs: readStringArray(input, "evidence_refs"),
    fields: stripNullish(options.fields),
  };
}

function sanitizeTargetChain(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .map((target) =>
      sanitizePlainFields(target, [
        "label_code",
        "dimension",
        "x",
        "y",
        "z",
        "target_type",
        "evidence_layer",
        "confidence",
      ]),
    );
}

function sanitizeRouteStages(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .map((stage) =>
      sanitizePlainFields(stage, [
        "stage_code",
        "from_dimension",
        "to_dimension",
        "target_type",
        "route_basis",
        "reachable_confidence",
        "risk",
        "missing_evidence_codes",
      ]),
    );
}

function sanitizeVisualFacts(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .map((fact) =>
      sanitizePlainFields(fact, [
        "kind",
        "value",
        "direction",
        "item_id",
        "x",
        "y",
        "z",
        "confidence",
      ]),
    );
}

function sanitizeRouteState(value: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) return null;
  if (
    value.instruction_authority !== undefined &&
    value.instruction_authority !== "none"
  ) return null;
  return sanitizePlainFields(value, [
    "active_objective_id",
    "latest_rehearsal_id",
    "latest_drift_event_id",
    "route_status",
    "policy_surface_status",
    "latest_lifecycle_receipt_id",
    "route_lifecycle_status",
    "route_intent_status",
    "current_stage_label",
    "updated_at",
    "instruction_authority",
    "ask_context_policy",
    "raw_content_included",
  ]);
}

function sanitizeEnvironmentCells(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .slice(0, 96)
    .map((entry) => ({
      ...sanitizePlainFields(entry, [
        "cell_ref",
        "cell_type",
        "tags",
        "sensor_scope",
      ]),
      position: sanitizePosition(readPlainObject(entry, "position")),
    }));
}

function sanitizePosition(value: Record<string, unknown> | null): Record<string, unknown> | null {
  return sanitizePlainFields(value, ["x", "y", "z"]);
}

function sanitizeContainerMemoryEntries(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .filter((entry) =>
      entry.instruction_authority === "none" &&
      entry.ask_context_policy === "evidence_only" &&
      entry.raw_content_included === false
    )
    .map((entry) => ({
      ...sanitizePlainFields(entry, [
        "container_ref",
        "container_type",
        "contents_known",
        "contents_hash",
        "last_verified_at",
        "sensor_scope",
        "requires_caveat",
        "first_seen_at",
        "last_seen_at",
        "contents_last_verified_at",
        "memory_status",
      ]),
      contents_summary: sanitizeItemSummaries(readArrayFromRecord(entry, "contents_summary")),
    }));
}

function sanitizeHazardEntries(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .filter((entry) =>
      entry.instruction_authority === "none" &&
      entry.ask_context_policy === "evidence_only" &&
      entry.raw_content_included === false
    )
    .map((entry) =>
      sanitizePlainFields(entry, [
        "hazard_ref",
        "hazard_type",
        "severity",
        "sensor_scope",
        "first_seen_at",
        "last_seen_at",
        "observation_count",
        "peak_severity",
      ]),
    );
}

function sanitizeResourceEntries(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .filter((entry) =>
      entry.instruction_authority === "none" &&
      entry.ask_context_policy === "evidence_only" &&
      entry.raw_content_included === false
    )
    .map((entry) =>
      sanitizePlainFields(entry, [
        "resource_ref",
        "resource_type",
        "state",
        "amount",
        "sensor_scope",
        "first_seen_at",
        "last_seen_at",
        "observation_count",
        "last_known_state",
      ]),
    );
}

function sanitizeInventoryTransitionEntries(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .filter((entry) =>
      entry.instruction_authority === "none" &&
      entry.ask_context_policy === "evidence_only" &&
      entry.creates_ask_turn === false &&
      entry.turn_triggered === false &&
      entry.raw_user_text_included === false &&
      entry.raw_content_included === false
    )
    .map((entry) =>
      sanitizePlainFields(entry, [
        "transition_id",
        "event_type",
        "room_id",
        "world_id",
        "actor_id",
        "actor_label",
        "item_type",
        "count",
        "container_ref",
        "container_type",
        "status",
        "ts",
      ]),
    );
}

function sanitizeItemSummaries(value: unknown[]): unknown[] {
  return value
    .filter(isPlainObject)
    .map((entry) =>
      sanitizePlainFields(entry, [
        "item_ref",
        "item_type",
        "count",
        "slot",
        "display_name",
        "sensor_scope",
      ]),
    );
}

function sanitizePlainFields(
  value: Record<string, unknown> | null,
  allowedFields: string[],
): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  const next: Record<string, unknown> = {};
  for (const field of allowedFields) {
    const fieldValue = value[field];
    if (
      typeof fieldValue === "string" ||
      typeof fieldValue === "number" ||
      typeof fieldValue === "boolean" ||
      fieldValue === null
    ) {
      next[field] = fieldValue;
    } else if (Array.isArray(fieldValue)) {
      next[field] = fieldValue.filter(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean" ||
          item === null,
      );
    }
  }

  return next;
}

function readStringField(input: unknown, field: string): string | null {
  if (!isPlainObject(input)) {
    return null;
  }

  const value = input[field];
  return typeof value === "string" ? value : null;
}

function readNumberField(input: unknown, field: string): number | null {
  if (!isPlainObject(input)) {
    return null;
  }

  const value = input[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBooleanField(input: unknown, field: string): boolean | null {
  if (!isPlainObject(input)) {
    return null;
  }

  const value = input[field];
  return typeof value === "boolean" ? value : null;
}

function readStringArray(input: unknown, field: string): string[] {
  if (!isPlainObject(input)) {
    return [];
  }

  const value = input[field];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readArrayField(input: unknown, field: string): unknown[] {
  if (!isPlainObject(input)) {
    return [];
  }

  const value = input[field];
  return Array.isArray(value) ? value : [];
}

function readArrayFromRecord(input: Record<string, unknown>, field: string): unknown[] {
  const value = input[field];
  return Array.isArray(value) ? value : [];
}

function readPlainObject(input: unknown, field: string): Record<string, unknown> | null {
  if (!isPlainObject(input)) {
    return null;
  }

  const value = input[field];
  return isPlainObject(value) ? value : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stripNullish(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null && value !== undefined),
  );
}

function hashShort(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 12);
}
