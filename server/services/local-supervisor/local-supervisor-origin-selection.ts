import {
  HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA,
  helixLocalSupervisorOriginSelectionSchema,
  type HelixLocalSupervisorOriginSelection,
  type HelixLocalSupervisorStatus,
} from "@shared/helix-local-supervisor";

export type HelixLocalSupervisorOriginCandidate = Readonly<{
  origin: string;
  occupancy: "free" | "listener";
  ownership: "none" | "verified_owned" | "foreign_or_unknown";
  status: HelixLocalSupervisorStatus | null;
}>;

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
    throw new Error("Local supervisor candidates must be exact uncredentialed HTTP 127.0.0.1 origins on ports 1024-65535.");
  }
  return parsed.origin;
};

const enforcingMode = (status: HelixLocalSupervisorStatus): boolean =>
  status.one_instance_enforced &&
  (status.supervisor_mode === "desktop_single_instance" ||
    status.supervisor_mode === "external_keyed_launcher");

export const selectHelixLocalSupervisorOrigin = (input: {
  expectedWorkspaceRef: string;
  candidates: readonly HelixLocalSupervisorOriginCandidate[];
}): HelixLocalSupervisorOriginSelection => {
  if (!/^workspace:[a-f0-9]{64}$/u.test(input.expectedWorkspaceRef)) {
    throw new Error("Expected workspace reference is invalid.");
  }
  if (input.candidates.length < 1 || input.candidates.length > 16) {
    throw new Error("Local supervisor selection requires 1-16 candidates.");
  }

  const seen = new Set<string>();
  const candidates = input.candidates.map((candidate) => {
    const origin = exactLoopbackOrigin(candidate.origin);
    if (seen.has(origin)) {
      throw new Error("Local supervisor candidates must be unique.");
    }
    seen.add(origin);
    return { ...candidate, origin };
  });

  const contradictoryOwned = candidates.filter((candidate) => {
    if (candidate.ownership !== "verified_owned") return false;
    const status = candidate.status;
    return (
      candidate.occupancy !== "listener" ||
      !status ||
      status.workspace_ref !== input.expectedWorkspaceRef ||
      !status.ready ||
      !enforcingMode(status) ||
      status.credential_included ||
      status.private_endpoint_included ||
      status.workspace_path_included ||
      status.process_identity_included ||
      status.account_identity_included
    );
  });
  if (contradictoryOwned.length > 0) {
    return helixLocalSupervisorOriginSelectionSchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA,
      decision: "fail_closed",
      reason: "verified_ownership_contradiction",
      selected_origin: null,
      candidate_count: candidates.length,
      foreign_or_unknown_listener_count: candidates.filter((candidate) =>
        candidate.ownership === "foreign_or_unknown").length,
      caller_ownership_receipt_required: true,
      atomic_bind_claim_required: true,
      post_start_status_verification_required: true,
      credential_included: false,
      private_network_endpoint_included: false,
      workspace_path_included: false,
      process_identity_included: false,
      account_identity_included: false,
      content_role: "local_supervisor_origin_selection_not_authority",
      answer_authority: false,
      terminal_eligible: false,
    });
  }

  const owned = candidates.filter((candidate) =>
    candidate.ownership === "verified_owned");
  if (owned.length > 1) {
    return helixLocalSupervisorOriginSelectionSchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA,
      decision: "fail_closed",
      reason: "multiple_verified_owned_instances",
      selected_origin: null,
      candidate_count: candidates.length,
      foreign_or_unknown_listener_count: candidates.filter((candidate) =>
        candidate.ownership === "foreign_or_unknown").length,
      caller_ownership_receipt_required: true,
      atomic_bind_claim_required: true,
      post_start_status_verification_required: true,
      credential_included: false,
      private_network_endpoint_included: false,
      workspace_path_included: false,
      process_identity_included: false,
      account_identity_included: false,
      content_role: "local_supervisor_origin_selection_not_authority",
      answer_authority: false,
      terminal_eligible: false,
    });
  }

  const foreignCount = candidates.filter((candidate) =>
    candidate.ownership === "foreign_or_unknown").length;
  const receipt = (value: Pick<HelixLocalSupervisorOriginSelection,
    "decision" | "reason" | "selected_origin">): HelixLocalSupervisorOriginSelection =>
    helixLocalSupervisorOriginSelectionSchema.parse({
      schema: HELIX_LOCAL_SUPERVISOR_ORIGIN_SELECTION_SCHEMA,
      ...value,
      candidate_count: candidates.length,
      foreign_or_unknown_listener_count: foreignCount,
      caller_ownership_receipt_required: true,
      atomic_bind_claim_required: true,
      post_start_status_verification_required: true,
      credential_included: false,
      private_network_endpoint_included: false,
      workspace_path_included: false,
      process_identity_included: false,
      account_identity_included: false,
      content_role: "local_supervisor_origin_selection_not_authority",
      answer_authority: false,
      terminal_eligible: false,
    });

  if (owned.length === 1) {
    return receipt({
      decision: "attach",
      reason: "verified_owned_instance_ready",
      selected_origin: owned[0].origin,
    });
  }

  const free = candidates.find((candidate) =>
    candidate.occupancy === "free" &&
    candidate.ownership === "none" &&
    candidate.status === null);
  if (free) {
    return receipt({
      decision: "start",
      reason: foreignCount > 0
        ? "foreign_listener_skipped"
        : "free_loopback_origin",
      selected_origin: free.origin,
    });
  }

  return receipt({
    decision: "fail_closed",
    reason: "candidate_origins_exhausted",
    selected_origin: null,
  });
};
