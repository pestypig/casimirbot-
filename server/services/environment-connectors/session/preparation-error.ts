import { HelixReasoningTaskBindingError } from "../../local-supervisor/reasoning-task-binding-store";
import { isEnvironmentDurableGoalError } from "../goals/durable-goal-store";
import { isRoomEnvironmentSubjectError } from "../subjects/subject-binding-store";
import { isEnvironmentActionAuthorityError } from "../actions/authority-store";
import type { readyUpEnvironmentSession } from "./ready-up-session";
import { PairingStorageError } from "../../local-supervisor/pairing-ledger-repository";
import { PairingDestinationRegistrationError } from "../../local-supervisor/pairing-destination-registration";
import { HelixLocalSupervisorCoordinationError } from "../../local-supervisor/local-supervisor-coordination";
import { HelixAgentApiServiceError } from "../../helix-agent-api/errors";
import { BindingVerificationError } from "../../local-supervisor/binding-verification-error";

type Repairs = Awaited<ReturnType<typeof readyUpEnvironmentSession>>["repairs"];
export type EnvironmentPreparationPhase = "request_validation" | "account_context" |
  "task_target" | "task_binding" | "run_association" | "room_membership" |
  "goal_lookup" | "environment_lookup" | "subject_refresh" | "goal_creation" |
  "perception_probe" | "readiness_inspection" | "session_recovery";

/** Sanitized partial setup facts, not rollback, readiness or gameplay proof. */
export class EnvironmentSessionPreparationError extends Error {
  readonly status: number;
  readonly projection;
  constructor(error: unknown, repairs: Repairs, uncertain: boolean,
    selection?: { room_id: string }, failurePhase?: EnvironmentPreparationPhase) {
    super("Environment session preparation did not complete.");
    const bindingError = error instanceof HelixReasoningTaskBindingError ||
      error instanceof PairingStorageError || error instanceof PairingDestinationRegistrationError ||
      error instanceof HelixLocalSupervisorCoordinationError || error instanceof HelixAgentApiServiceError ||
      error instanceof BindingVerificationError;
    const environmentError = isEnvironmentDurableGoalError(error) ||
      isRoomEnvironmentSubjectError(error) || isEnvironmentActionAuthorityError(error);
    this.status = bindingError ? error.status : environmentError ? error.statusCode : 500;
    this.projection = {
      schema: "helix.environment_session_error.v1" as const, ok: false as const,
      error: bindingError || environmentError ? error.code : "environment_session_preparation_failed",
      ...(failurePhase ? { failure_phase: failurePhase } : {}),
      ...(error instanceof BindingVerificationError ? {
        binding_failure_phase: error.phase, binding_failure_reason: error.reason,
      } : {}),
      repairs: repairs.map(repair => ({ ...repair })), partial_effects_unknown: uncertain,
      ...(selection ? { selection } : {}),
      readiness_confirmed: false as const, execution_authority: false as const,
      answer_authority: false as const, assistant_answer: false as const,
      terminal_eligible: false as const, credential_included: false as const,
    };
  }
}
