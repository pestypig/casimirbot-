import crypto from "node:crypto";
import { helixReasoningSteeringEventProjectionSchema, type HelixReasoningTaskBindingProjection,
  type HelixReasoningSteeringDelivery } from "@shared/helix-reasoning-task-binding";
import type { DurableSteeringRecord } from "./durable-steering-contract";

export function projectDurableSteering(row: DurableSteeringRecord, binding: HelixReasoningTaskBindingProjection, now: Date) {
  if (binding.pairing_id !== row.pairingId || binding.authenticated_profile_ref !== row.ownerProfileId ||
      binding.helix_conversation_id !== row.chatId || binding.run_id !== (row.environment?.runId ?? null)) throw new Error("steering_scope_mismatch");
  return helixReasoningSteeringEventProjectionSchema.parse({ schema: "helix.reasoning_steering_event.v1",
    steering_event_ref: row.id, reasoning_binding_id: binding.reasoning_binding_id, binding_epoch: binding.binding_epoch,
    cursor: row.cursor, client_event_ref: row.request.clientEventRef, origin: row.request.origin,
    delivery_state: row.acknowledgedAt ? "acknowledged" : now.getTime() >= Date.parse(row.expiresAt) ? "expired" : "pending",
    instruction_sha256: crypto.createHash("sha256").update(row.request.instructionText).digest("hex"),
    instruction_length: row.request.instructionText.length, created_at: row.createdAt, expires_at: row.expiresAt,
    acknowledged_at: row.acknowledgedAt, advisory_only: true, execution_requested: false, evidence_satisfied: false,
    provider_thread_content_included: false, hidden_reasoning_included: false, answer_authority: false, terminal_eligible: false });
}
export function deliverDurableSteering(row: DurableSteeringRecord, binding: HelixReasoningTaskBindingProjection, now: Date): HelixReasoningSteeringDelivery {
  return { event: projectDurableSteering(row, binding, now), instruction_text: row.request.instructionText,
    content_role: row.request.origin === "agent_submitted" ? "agent_steering_advisory_not_execution" : "operator_steering_advisory_not_execution",
    raw_provider_content_included: false, hidden_reasoning_included: false };
}
