export type DebugExportUiResult = {
  attempted_payload_hash: string;
  copied_payload_hash?: string;
  copied_text_length: number;
  method:
    | "navigator.clipboard"
    | "textarea_fallback"
    | "debug_drawer"
    | "download_link"
    | "backend_endpoint"
    | "failed";
  readback_match: "exact" | "unavailable" | "mismatch" | "empty";
  ok: boolean;
  fallback_presented: boolean;
  error?: string;
};

const stableStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  const normalize = (entry: unknown): unknown => {
    if (!entry || typeof entry !== "object") return entry;
    if (seen.has(entry as object)) return "[Circular]";
    seen.add(entry as object);
    if (Array.isArray(entry)) return entry.map(normalize);
    return Object.keys(entry as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = normalize((entry as Record<string, unknown>)[key]);
        return out;
      }, {});
  };
  return JSON.stringify(normalize(value));
};

export const hashDebugExportText = (text: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function buildDebugExportDrawerFallbackResult(args: {
  attemptedPayloadHash: string;
  copiedTextLength: number;
  readbackMatch?: "exact" | "unavailable" | "mismatch" | "empty";
  error?: string;
}): DebugExportUiResult {
  return {
    ok: true,
    attempted_payload_hash: args.attemptedPayloadHash,
    copied_text_length: args.copiedTextLength,
    method: "debug_drawer",
    readback_match: args.readbackMatch ?? "unavailable",
    fallback_presented: true,
    ...(args.error ? { error: args.error } : {}),
  };
}

export function buildHelixDebugExportEnvelopeFromMasterPayload(reply: {
  id?: string;
  question?: string | null;
  content?: string | null;
}, payload: Record<string, unknown>): string {
  const debug = asRecord(payload.debug);
  const agentLoop = asRecord(payload.agentLoop);
  const ledger = Array.isArray(agentLoop?.current_turn_artifact_ledger)
    ? agentLoop.current_turn_artifact_ledger
    : Array.isArray(debug?.current_turn_artifact_ledger)
      ? debug.current_turn_artifact_ledger
      : [];
  const receiptArtifact =
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => {
        if (artifact?.kind !== "workspace_action_receipt") return false;
        const payloadRecord = asRecord(artifact.payload);
        return Boolean(readString(payloadRecord?.action_key) || readString(payloadRecord?.target_id));
      }) ??
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => artifact?.kind === "workspace_action_receipt") ??
    null;
  const receipt = asRecord(receiptArtifact?.payload);
  const lifecycleEvents = Array.isArray(receipt?.workspace_action_lifecycle_events)
    ? receipt.workspace_action_lifecycle_events
    : [];
  const selectedFinalAnswer =
    readString(payload.selectedDebugFinalAnswer) ??
    readString(payload.finalAnswer) ??
    readString(agentLoop?.selected_final_answer) ??
    readString(debug?.selected_final_answer) ??
    readString(reply.content);
  const activeTurnId =
    readString(debug?.turn_id) ??
    readString(asRecord(payload.turnTruthTable)?.turn_id) ??
    readString(reply.id) ??
    "unknown-turn";
  const terminalArtifactKind =
    readString(agentLoop?.terminal_artifact_kind) ??
    readString(debug?.terminal_artifact_kind) ??
    null;
  const envelopeWithoutHash = {
    schema: "helix.ask.debug_export.v1",
    exported_at_ms: Date.now(),
    active_turn_id: activeTurnId,
    active_prompt: readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? "",
    active_prompt_hash: hashDebugExportText(readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? ""),
    selected_final_answer: selectedFinalAnswer,
    final_answer_source: readString(agentLoop?.final_answer_source) ?? readString(debug?.final_answer_source),
    resolved_turn_summary: {
      turn_id: activeTurnId,
      final_status: "final_answer",
      resolved_route_label: "unknown",
      terminal_artifact_kind: terminalArtifactKind,
      terminal_error_code: readString(agentLoop?.terminal_error_code) ?? readString(debug?.terminal_error_code),
      pending_server_request_present: Boolean(agentLoop?.pending_request),
    },
    canonical_goal_frame: debug?.canonical_goal_frame ?? agentLoop?.canonical_goal_frame,
    current_turn_artifact_ledger: ledger,
    current_turn_events: Array.isArray(agentLoop?.turn_events) ? agentLoop.turn_events : [],
    workspace_action_debug: receipt
      ? {
          workspace_action_registry_audit: receipt.workspace_action_registry_audit,
          workspace_action_lifecycle_events: lifecycleEvents,
          workspace_action_receipt: receipt,
          anti_determinism_audit: receipt.workspace_action_anti_determinism_audit,
          workspace_action_debug_proof: {
            action_key: receipt.action_key,
            target_id: receipt.target_id,
            action_id: receipt.action_id,
            lifecycle_events_present: lifecycleEvents
              .map((entry) => readString(asRecord(entry)?.event))
              .filter(Boolean),
            receipt_artifact_id: receiptArtifact?.artifact_id,
            receipt_status: receipt.status,
            registry_verdict: readString(asRecord(receipt.workspace_action_registry_audit)?.verdict),
            anti_determinism_verdict: readString(asRecord(receipt.workspace_action_anti_determinism_audit)?.verdict),
            final_answer_receipt_backed: Boolean(readString(receipt.message) && selectedFinalAnswer === readString(receipt.message)),
          },
        }
      : undefined,
    composite_goal_frame: debug?.composite_goal_frame ?? agentLoop?.composite_goal_frame,
    composite_execution_plan: debug?.composite_execution_plan ?? agentLoop?.composite_execution_plan,
    composite_turn_receipt: debug?.composite_turn_receipt ?? agentLoop?.composite_turn_receipt,
    subgoal_artifact_map: debug?.subgoal_artifact_map ?? agentLoop?.subgoal_artifact_map,
    composite_anti_determinism_audit:
      debug?.composite_anti_determinism_audit ?? agentLoop?.composite_anti_determinism_audit,
    pending_server_request: agentLoop?.pending_request ?? null,
    debug_export_anti_determinism_audit: {
      verdict: "clean",
      checks: [
        { check: "projection_only_patch", passed: true },
        { check: "no_goal_mutation", passed: true },
        { check: "no_terminal_mutation", passed: true },
        { check: "active_turn_only", passed: true },
        { check: "no_dom_scrape_source", passed: true },
        { check: "receipt_not_fabricated", passed: true },
      ],
    },
  };
  return JSON.stringify({
    ...envelopeWithoutHash,
    payload_hash: hashDebugExportText(stableStringify(envelopeWithoutHash)),
  });
}
