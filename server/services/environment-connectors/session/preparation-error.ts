import { HelixReasoningTaskBindingError } from "../../local-supervisor/reasoning-task-binding-store";
import { isEnvironmentDurableGoalError } from "../goals/durable-goal-store";
import { isRoomEnvironmentSubjectError } from "../subjects/subject-binding-store";
import { isEnvironmentActionAuthorityError } from "../actions/authority-store";
import type { readyUpEnvironmentSession } from "./ready-up-session";

type Repairs = Awaited<ReturnType<typeof readyUpEnvironmentSession>>["repairs"];

/** Sanitized partial setup facts, not rollback, readiness or gameplay proof. */
export class EnvironmentSessionPreparationError extends Error {
  readonly status: number;
  readonly projection;
  constructor(error: unknown, repairs: Repairs, uncertain: boolean,
    selection?: { room_id: string }) {
    super("Environment session preparation did not complete.");
    const bindingError = error instanceof HelixReasoningTaskBindingError;
    const environmentError = isEnvironmentDurableGoalError(error) ||
      isRoomEnvironmentSubjectError(error) || isEnvironmentActionAuthorityError(error);
    this.status = bindingError ? error.status : environmentError ? error.statusCode : 500;
    this.projection = {
      schema: "helix.environment_session_error.v1" as const, ok: false as const,
      error: bindingError || environmentError ? error.code : "environment_session_preparation_failed",
      repairs: repairs.map(repair => ({ ...repair })), partial_effects_unknown: uncertain,
      ...(selection ? { selection } : {}),
      readiness_confirmed: false as const, execution_authority: false as const,
      answer_authority: false as const, assistant_answer: false as const,
      terminal_eligible: false as const, credential_included: false as const,
    };
  }
}
