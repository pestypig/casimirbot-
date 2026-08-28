import {
  HELIX_LOCAL_SUPERVISOR_POST_BIND_VERIFICATION_SCHEMA,
  helixLocalSupervisorPostBindVerificationSchema,
  type HelixLocalSupervisorOriginSelection,
  type HelixLocalSupervisorPostBindVerification,
  type HelixLocalSupervisorStatus,
} from "@shared/helix-local-supervisor";

const exactLoopbackOrigin = (value: string): string => {
  const parsed = new URL(value);
  const port = Number(parsed.port);
  if (
    parsed.protocol !== "http:" ||
    parsed.hostname !== "127.0.0.1" ||
    !parsed.port ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65_535 ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== value
  ) {
    throw new Error("Post-bind verification requires an exact loopback origin.");
  }
  return parsed.origin;
};

type FailureReason = Exclude<
  HelixLocalSupervisorPostBindVerification["reason"],
  "bound_instance_verified"
>;

const failure = (
  reason: FailureReason,
  atomicBindClaimed: boolean,
): HelixLocalSupervisorPostBindVerification =>
  helixLocalSupervisorPostBindVerificationSchema.parse({
    schema: HELIX_LOCAL_SUPERVISOR_POST_BIND_VERIFICATION_SCHEMA,
    decision: "fail_closed",
    reason,
    verified_origin: null,
    service_instance_ref: null,
    atomic_bind_claimed: atomicBindClaimed,
    credential_included: false,
    private_network_endpoint_included: false,
    workspace_path_included: false,
    process_identity_included: false,
    account_identity_included: false,
    content_role: "local_supervisor_post_bind_verification_not_authority",
    answer_authority: false,
    terminal_eligible: false,
  });

export const verifyHelixLocalSupervisorPostBind = (input: {
  expectedWorkspaceRef: string;
  selection: HelixLocalSupervisorOriginSelection;
  observedOrigin: string;
  atomicBindClaimed: boolean;
  listenerPresent: boolean;
  status: HelixLocalSupervisorStatus | null;
}): HelixLocalSupervisorPostBindVerification => {
  if (!/^workspace:[a-f0-9]{64}$/u.test(input.expectedWorkspaceRef)) {
    throw new Error("Expected workspace reference is invalid.");
  }
  const observedOrigin = exactLoopbackOrigin(input.observedOrigin);
  if (input.selection.decision !== "start" || !input.selection.selected_origin) {
    return failure("selection_not_start", input.atomicBindClaimed);
  }
  if (input.selection.selected_origin !== observedOrigin) {
    return failure("selected_origin_mismatch", input.atomicBindClaimed);
  }
  if (!input.atomicBindClaimed) {
    return failure("atomic_bind_not_claimed", false);
  }
  if (!input.listenerPresent) {
    return failure("listener_missing", true);
  }
  const status = input.status;
  if (!status) {
    return failure("invalid_status", true);
  }
  if (status.workspace_ref !== input.expectedWorkspaceRef) {
    return failure("workspace_mismatch", true);
  }
  if (!status.ready) {
    return failure("supervisor_not_ready", true);
  }
  if (!status.one_instance_enforced ||
      status.supervisor_mode !== "external_keyed_launcher") {
    return failure("supervisor_not_enforcing", true);
  }
  if (
    status.credential_included ||
    status.private_endpoint_included ||
    status.workspace_path_included ||
    status.process_identity_included ||
    status.account_identity_included
  ) {
    return failure("status_exposure_violation", true);
  }
  return helixLocalSupervisorPostBindVerificationSchema.parse({
    schema: HELIX_LOCAL_SUPERVISOR_POST_BIND_VERIFICATION_SCHEMA,
    decision: "ready",
    reason: "bound_instance_verified",
    verified_origin: observedOrigin,
    service_instance_ref: status.service_instance_ref,
    atomic_bind_claimed: true,
    credential_included: false,
    private_network_endpoint_included: false,
    workspace_path_included: false,
    process_identity_included: false,
    account_identity_included: false,
    content_role: "local_supervisor_post_bind_verification_not_authority",
    answer_authority: false,
    terminal_eligible: false,
  });
};
