import type { HelixLocalSupervisorStatus } from
  "@shared/helix-local-supervisor";

export type HelixLocalSupervisorAttachmentDecision = Readonly<{
  decision: "attach" | "start" | "fail_closed";
  reason:
    | "compatible_workspace_service"
    | "no_listener"
    | "supervisor_not_ready"
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
  return { decision: "attach", reason: "compatible_workspace_service" };
};
