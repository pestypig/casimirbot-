import type { HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { resolveTemporalPerceptionContext } from "../temporal-plans/temporal-perception-context";
import { TemporalPlanError } from "../temporal-plans/temporal-plan-error";

export type BoundSessionEvidenceInput = {
  context: Parameters<typeof resolveTemporalPerceptionContext>[0];
  binding: Parameters<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>[0];
};

/**
 * Shared read-only prerequisite for session preparation and temporal admission.
 * Reuses the authenticated binding store and exact goal/catalog/probe checks.
 * This does not repair state, grant authority, or prove overall session readiness.
 * Callers must still revalidate at their own admission/dispatch boundary.
 */
export async function readBoundSessionEvidence(
  input: BoundSessionEvidenceInput,
  bindingStore: Pick<HelixReasoningTaskBindingStore, "verifyTaskAssociation">,
) {
  if (input.context.profileId !== input.binding.profileRef ||
      input.context.runId !== input.binding.runId || !input.binding.runId) {
    throw new TemporalPlanError("temporal_plan_task_context_mismatch");
  }
  bindingStore.verifyTaskAssociation(input.binding);
  const context = await resolveTemporalPerceptionContext(input.context);
  // Presence, exact binding or revocation may change during asynchronous reads.
  const binding = bindingStore.verifyTaskAssociation(input.binding);
  return {
    context,
    binding,
    execution_authority: false as const,
    answer_authority: false as const,
    terminal_eligible: false as const,
  };
}
