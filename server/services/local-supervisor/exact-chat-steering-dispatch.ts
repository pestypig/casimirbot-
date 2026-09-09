import { z } from "zod";
import { HelixReasoningTaskBindingError, type HelixReasoningTaskBindingStore } from "./reasoning-task-binding-store";

export const steeringDispatchSchema = z.object({
  reasoning_binding_id: z.string().trim().min(3).max(320),
  binding_epoch: z.number().int().positive(),
  client_event_ref: z.string().trim().min(3).max(320),
  origin: z.enum(["typed", "gpt_live_finalized"]),
  instruction_text: z.string().trim().min(1).max(4_000),
  expires_in_seconds: z.number().int().min(30).max(3_600).optional(),
}).strict();

export const exactChatSteeringDispatchSchema = steeringDispatchSchema.extend({
  helix_conversation_id: z.string().trim().min(3).max(320),
  run_id: z.string().trim().min(1).max(320).nullable(),
});

/** Normal exact-chat dispatch, shared without duplicating its target policy.
 * The caller must authenticate profileRef; request data cannot choose a principal.
 * This queues advisory steering only, never execution or an assistant answer.
 */
export function dispatchExactChatSteering(
  profileRef: string,
  request: unknown,
  store: Pick<HelixReasoningTaskBindingStore, "inspectCurrent" | "dispatch">,
) {
  const body = exactChatSteeringDispatchSchema.parse(request);
  return dispatchValidated(profileRef, body, store);
}

export const agentChatSteeringDispatchSchema = exactChatSteeringDispatchSchema.omit({ origin: true });

/** Adapter must authenticate this target and enforce its tool scope first.
 * Agent origin is assigned here; it cannot be supplied or disguised by input.
 */
export function dispatchAgentChatSteering(
  actor: Parameters<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>[0],
  request: unknown,
  store: Pick<HelixReasoningTaskBindingStore, "inspectCurrent" | "dispatch" | "verifyTaskAssociation">,
) {
  const body = agentChatSteeringDispatchSchema.parse(request);
  store.verifyTaskAssociation(actor);
  if (body.reasoning_binding_id !== actor.bindingId || body.binding_epoch !== actor.bindingEpoch ||
      body.helix_conversation_id !== actor.helixConversationId || body.run_id !== actor.runId) {
    throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
  }
  return dispatchValidated(actor.profileRef, { ...body, origin: "agent_submitted" }, store);
}

function dispatchValidated(
  profileRef: string,
  body: Omit<z.infer<typeof exactChatSteeringDispatchSchema>, "origin"> & {
    origin: "typed" | "gpt_live_finalized" | "agent_submitted";
  },
  store: Pick<HelixReasoningTaskBindingStore, "inspectCurrent" | "dispatch">,
) {
  const binding = store.inspectCurrent({ profileRef, helixConversationId: body.helix_conversation_id });
  if (binding.reasoning_binding_id !== body.reasoning_binding_id ||
      binding.binding_epoch !== body.binding_epoch || (binding.run_id ?? null) !== body.run_id) {
    throw new HelixReasoningTaskBindingError("reasoning_binding_identity_mismatch", 409);
  }
  const event = store.dispatch({ profileRef, bindingId: binding.reasoning_binding_id,
    bindingEpoch: binding.binding_epoch, clientEventRef: body.client_event_ref,
    origin: body.origin, instructionText: body.instruction_text,
    expiresInSeconds: body.expires_in_seconds });
  return { binding, event };
}
