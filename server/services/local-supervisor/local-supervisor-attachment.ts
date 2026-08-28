import type { HelixLocalSupervisorStatus } from
  "@shared/helix-local-supervisor";

export type HelixLocalSupervisorAttachmentDecision = Readonly<{
  decision: "attach" | "start" | "fail_closed";
  reason:
    | "compatible_workspace_service"
    | "no_listener"
    | "supervisor_not_ready"
    | "supervisor_not_enforcing"
    | "status_exposure_violation"
    | "workspace_mismatch"
    | "invalid_status";
}>;

export const decideHelixLocalSupervisorAttachment = (input: {
  expectedWorkspaceRef: string;
  status: HelixLocalSupervisorStatus | null;
  listenerPresent: boolean;
}): HelixLocalSupervisorAttachmentDecision => {
  if (!input.listenerPresent) {
    return { decision: "start", reason: "no_listener" };
  }
  if (!input.status) {
    return { decision: "fail_closed", reason: "invalid_status" };
  }
  if (input.status.workspace_ref !== input.expectedWorkspaceRef) {
    return { decision: "fail_closed", reason: "workspace_mismatch" };
  }
  if (!input.status.ready) {
    return { decision: "fail_closed", reason: "supervisor_not_ready" };
  }
  if (!input.status.one_instance_enforced ||
      (input.status.supervisor_mode !== "desktop_single_instance" &&
       input.status.supervisor_mode !== "external_keyed_launcher")) {
    return { decision: "fail_closed", reason: "supervisor_not_enforcing" };
  }
  if (
    input.status.credential_included ||
    input.status.private_endpoint_included ||
    input.status.workspace_path_included ||
    input.status.process_identity_included ||
    input.status.account_identity_included
  ) {
    return { decision: "fail_closed", reason: "status_exposure_violation" };
  }
  return { decision: "attach", reason: "compatible_workspace_service" };
};
