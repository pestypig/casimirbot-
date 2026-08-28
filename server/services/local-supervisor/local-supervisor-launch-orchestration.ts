import {
  HELIX_LOCAL_SUPERVISOR_LAUNCH_ORCHESTRATION_SCHEMA,
  helixLocalSupervisorLaunchOrchestrationSchema,
  type HelixLocalSupervisorLaunchOrchestration,
  type HelixLocalSupervisorOriginSelection,
  type HelixLocalSupervisorStatus,
} from "@shared/helix-local-supervisor";
import {
  selectHelixLocalSupervisorOrigin,
  type HelixLocalSupervisorOriginCandidate,
} from "./local-supervisor-origin-selection";
import { verifyHelixLocalSupervisorPostBind } from
  "./local-supervisor-post-bind-verification";

export type HelixProtectedStartResult = Readonly<{
  observedOrigin: string;
  atomicBindClaimed: boolean;
  listenerPresent: boolean;
  status: HelixLocalSupervisorStatus | null;
}>;

export type HelixLocalSupervisorLaunchAdapter = Readonly<{
  inspectCandidate: (
    origin: string,
    signal: AbortSignal,
  ) => Promise<Omit<HelixLocalSupervisorOriginCandidate, "origin">>;
  startProtected: (
    selection: HelixLocalSupervisorOriginSelection,
    signal: AbortSignal,
  ) => Promise<HelixProtectedStartResult>;
}>;

type FailureStage = Exclude<
  HelixLocalSupervisorLaunchOrchestration["settled_stage"],
  "complete"
>;
type FailureReason = Exclude<
  HelixLocalSupervisorLaunchOrchestration["reason"],
  "verified_owned_instance_attached" | "bound_instance_started"
>;

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
    throw new Error("Launch orchestration requires exact loopback origins.");
  }
  return parsed.origin;
};

const raceAbort = async <T>(
  operation: Promise<T>,
  signal: AbortSignal,
): Promise<T> => {
  if (signal.aborted) throw new Error("orchestration_deadline_exceeded");
  return await new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new Error("orchestration_deadline_exceeded"));
    signal.addEventListener("abort", aborted, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener("abort", aborted);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", aborted);
        reject(error);
      },
    );
  });
};

const receipt = (value: Pick<HelixLocalSupervisorLaunchOrchestration,
  "decision" | "settled_stage" | "reason" | "selected_origin" |
  "service_instance_ref" | "retryable"> & {
    candidate_count: number;
    deadline_ms: number;
  }): HelixLocalSupervisorLaunchOrchestration =>
  helixLocalSupervisorLaunchOrchestrationSchema.parse({
    schema: HELIX_LOCAL_SUPERVISOR_LAUNCH_ORCHESTRATION_SCHEMA,
    ...value,
    credential_included: false,
    private_network_endpoint_included: false,
    workspace_path_included: false,
    process_identity_included: false,
    account_identity_included: false,
    content_role: "local_supervisor_launch_orchestration_not_authority",
    answer_authority: false,
    terminal_eligible: false,
  });

const failure = (input: {
  stage: FailureStage;
  reason: FailureReason;
  candidateCount: number;
  deadlineMs: number;
  retryable: boolean;
}): HelixLocalSupervisorLaunchOrchestration => receipt({
  decision: "fail_closed",
  settled_stage: input.stage,
  reason: input.reason,
  selected_origin: null,
  service_instance_ref: null,
  candidate_count: input.candidateCount,
  deadline_ms: input.deadlineMs,
  retryable: input.retryable,
});

export const runHelixLocalSupervisorLaunchOrchestration = async (input: {
  expectedWorkspaceRef: string;
  candidateOrigins: readonly string[];
  deadlineMs: number;
  adapter: HelixLocalSupervisorLaunchAdapter;
}): Promise<HelixLocalSupervisorLaunchOrchestration> => {
  if (!/^workspace:[a-f0-9]{64}$/u.test(input.expectedWorkspaceRef)) {
    throw new Error("Expected workspace reference is invalid.");
  }
  if (!Number.isInteger(input.deadlineMs) ||
      input.deadlineMs < 100 || input.deadlineMs > 30_000) {
    throw new Error("Launch orchestration deadline must be 100-30000ms.");
  }
  if (input.candidateOrigins.length < 1 || input.candidateOrigins.length > 16) {
    throw new Error("Launch orchestration requires 1-16 candidates.");
  }
  const origins = input.candidateOrigins.map(exactLoopbackOrigin);
  if (new Set(origins).size !== origins.length) {
    throw new Error("Launch orchestration candidate origins must be unique.");
  }

  const signal = AbortSignal.timeout(input.deadlineMs);
  let candidates: HelixLocalSupervisorOriginCandidate[];
  try {
    candidates = await raceAbort(Promise.all(origins.map(async (origin) => ({
      origin,
      ...await input.adapter.inspectCandidate(origin, signal),
    }))), signal);
  } catch {
    return failure({
      stage: "inspection",
      reason: signal.aborted
        ? "orchestration_deadline_exceeded"
        : "candidate_inspection_failed",
      candidateCount: origins.length,
      deadlineMs: input.deadlineMs,
      retryable: true,
    });
  }

  const selection = selectHelixLocalSupervisorOrigin({
    expectedWorkspaceRef: input.expectedWorkspaceRef,
    candidates,
  });
  if (selection.decision === "fail_closed") {
    return failure({
      stage: "selection",
      reason: "selection_failed_closed",
      candidateCount: origins.length,
      deadlineMs: input.deadlineMs,
      retryable: selection.reason === "candidate_origins_exhausted",
    });
  }
  if (selection.decision === "attach") {
    const attached = candidates.find((candidate) =>
      candidate.origin === selection.selected_origin);
    if (!attached?.status) {
      return failure({
        stage: "selection",
        reason: "selection_failed_closed",
        candidateCount: origins.length,
        deadlineMs: input.deadlineMs,
        retryable: false,
      });
    }
    return receipt({
      decision: "attached",
      settled_stage: "complete",
      reason: "verified_owned_instance_attached",
      selected_origin: selection.selected_origin,
      service_instance_ref: attached.status.service_instance_ref,
      candidate_count: origins.length,
      deadline_ms: input.deadlineMs,
      retryable: false,
    });
  }

  let started: HelixProtectedStartResult;
  try {
    started = await raceAbort(
      input.adapter.startProtected(selection, signal),
      signal,
    );
  } catch {
    return failure({
      stage: "protected_start",
      reason: signal.aborted
        ? "orchestration_deadline_exceeded"
        : "protected_start_failed",
      candidateCount: origins.length,
      deadlineMs: input.deadlineMs,
      retryable: true,
    });
  }

  const verification = verifyHelixLocalSupervisorPostBind({
    expectedWorkspaceRef: input.expectedWorkspaceRef,
    selection,
    observedOrigin: started.observedOrigin,
    atomicBindClaimed: started.atomicBindClaimed,
    listenerPresent: started.listenerPresent,
    status: started.status,
  });
  if (verification.decision !== "ready" ||
      !verification.verified_origin || !verification.service_instance_ref) {
    return failure({
      stage: "post_bind",
      reason: "post_bind_verification_failed",
      candidateCount: origins.length,
      deadlineMs: input.deadlineMs,
      retryable: verification.reason !== "status_exposure_violation" &&
        verification.reason !== "workspace_mismatch",
    });
  }
  return receipt({
    decision: "started",
    settled_stage: "complete",
    reason: "bound_instance_started",
    selected_origin: verification.verified_origin,
    service_instance_ref: verification.service_instance_ref,
    candidate_count: origins.length,
    deadline_ms: input.deadlineMs,
    retryable: false,
  });
};
