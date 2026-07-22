import crypto from "node:crypto";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixTurnLifecycle } from "@shared/helix-turn-lifecycle";
import { createHelixTurnLifecycleRecorder } from "../runtime/turn-lifecycle";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";

type RecordLike = Record<string, unknown>;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry))))
    : [];

const resultObservationRefs = (result: HelixWorkstationGatewayCallResult): string[] =>
  Array.from(new Set([
    ...readStringArray(result.tool_lifecycle_trace.observation_refs),
    ...readStringArray(result.observation_packet.produced_artifact_refs),
    ...readStringArray(result.artifact_refs),
  ]));

export const buildCodexProviderTurnLifecycle = (input: {
  turnId: string;
  routeCommitId?: string | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  capabilityLaneObservationPackets?: HelixAgentStepObservationPacket[];
  providerReasoningReentry?: RecordLike | null;
  providerText: string;
  terminalArtifactKind?: string | null;
  terminalEligible: boolean;
  ok: boolean;
  terminalReasonCode?: string | null;
}): HelixTurnLifecycle => {
  const recorder = createHelixTurnLifecycleRecorder({
    turnId: input.turnId,
    scope: "helix_ask_turn",
  });
  let prior = recorder.append({
    kind: "turn.started",
    producer: "helix_adapter",
    status: "started",
  });

  if (input.routeCommitId) {
    prior = recorder.append({
      kind: "route.committed",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: prior.event_id,
      route_commit_id: input.routeCommitId,
    });
  }

  const reentryCompleted = input.providerReasoningReentry?.evidence_reentered === true;
  const reenteredObservationRefs = new Set([
    ...readStringArray(input.providerReasoningReentry?.input_observation_refs),
    ...readStringArray(input.providerReasoningReentry?.normalized_observation_refs),
  ]);
  const admittedCapabilities = new Set<string>();
  const rawToolObservations = [
    ...input.gatewayCallResults.map((result, index) => ({
      capabilityId:
        readString(result.gateway_admission.requested_capability) ??
        readString(result.capability_id) ??
        "unknown",
      callId:
        readString(result.tool_lifecycle_trace.tool_call_id) ??
        `${input.turnId}:gateway_tool_call:${index + 1}`,
      ok: result.ok === true,
      admitted: result.gateway_admission.admission_status === "admitted",
      rejected: result.gateway_admission.admission_status === "blocked",
      observationRefs: resultObservationRefs(result),
      reasonCode:
        readString(result.gateway_admission.blocked_reason) ??
        readString(result.error) ??
        "gateway_call_failed",
    })),
    ...(input.capabilityLaneObservationPackets ?? []).map((packet, index) => ({
      capabilityId: readString(packet.capability_key) ?? "unknown",
      callId: readString(packet.call_id) ?? `${input.turnId}:capability_lane_tool_call:${index + 1}`,
      ok: packet.status === "succeeded",
      admitted: true,
      rejected: false,
      observationRefs: readStringArray(packet.produced_artifact_refs),
      reasonCode:
        readString(packet.missing_requirements?.[0]?.code) ??
        (packet.status === "succeeded" ? null : `capability_lane_${packet.status}`),
    })),
  ];
  // Capability-lane gateway bridges expose both the delegated gateway result
  // and its observation packet. They describe one runtime call, not two calls.
  const toolObservations = Array.from(
    rawToolObservations.reduce((byCallId, observation) => {
      const prior = byCallId.get(observation.callId);
      if (!prior) {
        byCallId.set(observation.callId, observation);
        return byCallId;
      }
      prior.observationRefs = Array.from(new Set([
        ...prior.observationRefs,
        ...observation.observationRefs,
      ]));
      return byCallId;
    }, new Map<string, (typeof rawToolObservations)[number]>()).values(),
  );
  for (const observation of toolObservations) {
    const capabilityId = observation.capabilityId;
    if (observation.admitted && !admittedCapabilities.has(capabilityId)) {
      admittedCapabilities.add(capabilityId);
      prior = recorder.append({
        kind: "capability.admitted",
        producer: "helix_policy",
        status: "succeeded",
        causation_id: prior.event_id,
        capability_id: capabilityId,
      });
    }

    const callId = observation.callId;
    if (observation.rejected) {
      const rejected = recorder.append({
        kind: "capability.rejected",
        producer: "helix_policy",
        status: "blocked",
        causation_id: prior.event_id,
        capability_id: capabilityId,
        reason_code: observation.reasonCode ?? "capability_not_admitted",
      });
      prior = recorder.append({
        kind: "tool.call.rejected",
        producer: "helix_policy",
        status: "blocked",
        causation_id: rejected.event_id,
        call_id: callId,
        capability_id: capabilityId,
        observation_refs: observation.observationRefs,
        reason_code: observation.reasonCode ?? "tool_call_rejected",
      });
      continue;
    }
    const started = recorder.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      causation_id: prior.event_id,
      call_id: callId,
      capability_id: capabilityId,
    });
    const observationRefs = observation.observationRefs;
    const completed = recorder.append({
      kind: observation.ok ? "tool.call.completed" : "tool.call.failed",
      producer: "helix_adapter",
      status: observation.ok ? "succeeded" : "failed",
      causation_id: started.event_id,
      call_id: callId,
      capability_id: capabilityId,
      observation_refs: observationRefs,
      ...(observation.ok ? {} : { reason_code: observation.reasonCode ?? "tool_call_failed" }),
    });
    prior = completed;
    const exactObservationReentry =
      reentryCompleted &&
      observationRefs.length > 0 &&
      observationRefs.every((ref) => reenteredObservationRefs.has(ref));
    if (exactObservationReentry) {
      prior = recorder.append({
        kind: "observation.reentered",
        producer: "helix_adapter",
        status: "succeeded",
        causation_id: completed.event_id,
        call_id: callId,
        capability_id: capabilityId,
        observation_refs: observationRefs,
      });
    }
  }

  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: prior.event_id,
    message_sha256: crypto.createHash("sha256").update(input.providerText).digest("hex"),
  });
  const runtime = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_terminal_authority",
    status: input.terminalEligible ? "succeeded" : "blocked",
    causation_id: runtime.event_id,
    terminal_kind: input.terminalArtifactKind ?? "typed_failure",
    terminal_eligible: input.terminalEligible,
    ...(input.terminalEligible
      ? {}
      : { reason_code: input.terminalReasonCode ?? "terminal_authority_rejected" }),
  });
  const turnCompleted = input.ok && input.terminalEligible;
  recorder.append({
    kind: turnCompleted ? "turn.completed" : "turn.failed",
    producer: "helix_adapter",
    status: turnCompleted ? "succeeded" : "failed",
    causation_id: eligibility.event_id,
    terminal_kind: input.terminalArtifactKind ?? "typed_failure",
    terminal_eligible: input.terminalEligible,
    ...(turnCompleted ? {} : { reason_code: input.terminalReasonCode ?? "turn_failed" }),
  });

  return recorder.snapshot();
};
