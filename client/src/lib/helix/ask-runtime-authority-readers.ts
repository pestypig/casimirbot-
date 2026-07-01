import type { TheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";
import { isTheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";

import type { HelixWorkstationAction } from "@/lib/workstation/workstationActionContract";
import { coerceText } from "@/lib/helix/ask-value-normalization";

export function readAgentLoopAuditRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function readAgentLoopAuditArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function hasHelixAskBackendEntrypointTurnId(turnId: string | null | undefined): boolean {
  const normalized = coerceText(turnId).trim();
  if (!normalized) return false;
  return /^ask[:/]/i.test(normalized) || /(?:^|:)ask:[0-9a-z-]+(?:$|:)/i.test(normalized);
}

export function extractAskLevelTheoryReflection(value: unknown): TheoryContextReflectionV1 | null {
  const record = readAgentLoopAuditRecord(value);
  if (!record) return null;
  const directReceipt = readAgentLoopAuditRecord(record.theory_context_reflection_tool_receipt);
  if (isTheoryContextReflectionV1(directReceipt?.reflectionV1)) return directReceipt.reflectionV1;
  const directArtifact = readAgentLoopAuditRecord(record.artifact_v1);
  if (isTheoryContextReflectionV1(directArtifact?.reflectionV1)) return directArtifact.reflectionV1;
  const ledger = Array.isArray(record.current_turn_artifact_ledger) ? record.current_turn_artifact_ledger : [];
  for (const item of ledger) {
    const artifact = readAgentLoopAuditRecord(item);
    if (!artifact || artifact.kind !== "helix_theory_context_reflection_tool_receipt") continue;
    const payload = readAgentLoopAuditRecord(artifact.payload);
    const artifactV1 = readAgentLoopAuditRecord(payload?.artifact_v1);
    if (isTheoryContextReflectionV1(artifactV1?.reflectionV1)) return artifactV1.reflectionV1;
    if (isTheoryContextReflectionV1(payload?.reflectionV1)) return payload.reflectionV1;
  }
  return null;
}

export function normalizeHelixRuntimeActionKey(value: unknown): string {
  return coerceText(value).trim().toLowerCase().replace(/[/:]+/g, ".").replace(/\s+/g, "_");
}

export function readHelixDecisionCapabilityKeys(value: unknown): string[] {
  const record = readAgentLoopAuditRecord(value);
  if (!record) return [];
  const directKeys = [
    record.chosen_capability,
    record.selected_capability,
    record.capability_key,
    record.executed_action_key,
    record.action_key,
    record.tool_key,
    record.tool_name,
  ]
    .map(normalizeHelixRuntimeActionKey)
    .filter(Boolean);
  const nestedKeys = [
    record.agent_step_decision,
    record.initial_agent_step_decision,
    record.tool_call,
    record.next_action,
    record.selected_action,
    record.action,
  ].flatMap(readHelixDecisionCapabilityKeys);
  return [...directKeys, ...nestedKeys];
}

export function readHelixGatewayCapabilityKeys(value: unknown): string[] {
  const record = readAgentLoopAuditRecord(value);
  if (!record) return [];
  const debug = readAgentLoopAuditRecord(record.debug);
  const gatewayResultSources = [
    record.workstation_gateway_call_results,
    record.workstation_gateway_results,
    debug?.workstation_gateway_call_results,
    debug?.workstation_gateway_results,
  ];
  return gatewayResultSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .flatMap((entry) => {
      const result = readAgentLoopAuditRecord(entry);
      if (result?.ok !== true) return [];
      return [
        result?.capability_id,
        result?.capabilityId,
        result?.gateway_admission && readAgentLoopAuditRecord(result.gateway_admission)?.requested_capability,
      ];
    })
    .map(normalizeHelixRuntimeActionKey)
    .filter(Boolean);
}

export function collectHelixAgentSelectedCapabilities(...sources: unknown[]): string[] {
  const selected = new Set<string>();
  const add = (value: unknown): void => {
    readHelixDecisionCapabilityKeys(value).forEach((key) => selected.add(key));
  };
  sources.forEach((source) => {
    const record = readAgentLoopAuditRecord(source);
    if (!record) return;
    const debug = readAgentLoopAuditRecord(record.debug);
    [
      record.agent_step_decision,
      record.initial_agent_step_decision,
      record.observation_review,
      record.runtime_authority_audit,
      debug?.agent_step_decision,
      debug?.initial_agent_step_decision,
      debug?.observation_review,
      debug?.runtime_authority_audit,
    ].forEach(add);
    [record.agent_runtime_loop, debug?.agent_runtime_loop, record.agent_step_loop, debug?.agent_step_loop].forEach((loop) => {
      const loopRecord = readAgentLoopAuditRecord(loop);
      const iterations = Array.isArray(loopRecord?.iterations)
        ? loopRecord?.iterations
        : Array.isArray(loopRecord?.steps)
          ? loopRecord?.steps
          : [];
      iterations.forEach(add);
    });
    readHelixGatewayCapabilityKeys(record).forEach((key) => selected.add(key));
  });
  return [...selected].filter(Boolean);
}

export function readHelixWorkstationActionRuntimeKeys(action: HelixWorkstationAction | Record<string, unknown>): string[] {
  const record = readAgentLoopAuditRecord(action);
  if (!record) return [];
  const panelId = normalizeHelixRuntimeActionKey(record.panel_id);
  const actionId = normalizeHelixRuntimeActionKey(record.action_id);
  const actionName = normalizeHelixRuntimeActionKey(record.action);
  const keys = new Set<string>();
  if (panelId && actionId) {
    keys.add(`${panelId}.${actionId}`);
    keys.add(`${panelId}/${actionId}`);
  }
  if (panelId && actionName === "open_panel") {
    keys.add(`${panelId}.open`);
    keys.add(`${panelId}.open_panel`);
  }
  if (panelId && actionName === "focus_panel") {
    keys.add(`${panelId}.focus`);
    keys.add(`${panelId}.focus_panel`);
  }
  if (actionName === "restore_view_state") {
    keys.add("workstation.restore_view_state");
    keys.add("workstation/restore_view_state");
  }
  if (panelId && actionName) keys.add(`${panelId}.${actionName}`);
  if (actionId) keys.add(actionId);
  if (actionName) keys.add(actionName);
  return [...keys].map(normalizeHelixRuntimeActionKey).filter(Boolean);
}
