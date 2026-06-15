import type {
  RuntimeAdmissionDecision,
  RuntimePressureLevel,
  RuntimeTaskLease,
} from "../runtime/runtime-memory-governor";

export type HelixAskTurnAdmissionRoute = "/ask/turn" | "/ask/turn/stream" | "/ask";

export type HelixAskTurnAdmissionQueueReason =
  | "session_busy"
  | "instance_capacity"
  | "memory_soft_pressure";

export type HelixAskTurnAdmissionRejectReason =
  | "memory_hard_pressure"
  | "queue_full";

export type HelixAskTurnAdmission =
  | {
      status: "admitted";
      turn_id: string;
      lease_id: string;
      pressure_level: Exclude<RuntimePressureLevel, "hard_pressure">;
      active_workloads: number;
      max_active_workloads: number;
      session_id: string;
      assistant_answer: false;
      terminal_eligible: false;
      raw_content_included: false;
      release: (outcome?: Parameters<RuntimeTaskLease["release"]>[0]) => void;
    }
  | {
      status: "queued";
      turn_id: string;
      queue_position: number;
      retry_after_ms: number;
      reason: HelixAskTurnAdmissionQueueReason;
      pressure_level: Exclude<RuntimePressureLevel, "hard_pressure">;
      active_workloads: number;
      max_active_workloads: number;
      session_id: string;
      assistant_answer: false;
      terminal_eligible: false;
      raw_content_included: false;
    }
  | {
      status: "rejected";
      turn_id: string;
      reason: HelixAskTurnAdmissionRejectReason;
      retry_after_ms?: number;
      pressure_level: "hard_pressure";
      active_workloads: number;
      max_active_workloads: number;
      session_id: string;
      assistant_answer: false;
      terminal_eligible: false;
      raw_content_included: false;
    };

export type HelixAskTurnAdmissionSnapshot = {
  schema: "helix.ask_turn_admission.snapshot.v1";
  active_workloads: number;
  max_active_workloads: number;
  queued_turn_count: number;
  max_queue_depth: number;
  active_sessions: Array<{
    session_id: string;
    turn_id: string;
    route: HelixAskTurnAdmissionRoute;
    admitted_at_ms: number;
  }>;
  queued_turns: Array<{
    session_id: string;
    turn_id: string;
    route: HelixAskTurnAdmissionRoute;
    reason: HelixAskTurnAdmissionQueueReason;
    queued_at_ms: number;
    queue_position: number;
  }>;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

type ActiveAskTurn = {
  sessionId: string;
  turnId: string;
  route: HelixAskTurnAdmissionRoute;
  admittedAtMs: number;
  runtimeLease: RuntimeTaskLease;
};

type QueuedAskTurn = {
  sessionId: string;
  turnId: string;
  route: HelixAskTurnAdmissionRoute;
  reason: HelixAskTurnAdmissionQueueReason;
  queuedAtMs: number;
};

const activeTurnsBySession = new Map<string, ActiveAskTurn>();
const queuedTurns: QueuedAskTurn[] = [];

const readPositiveIntegerEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const maxQueueDepth = (): number => readPositiveIntegerEnv("HELIX_ASK_QUEUE_MAX", 24);

const maxActiveWorkloads = (): number =>
  readPositiveIntegerEnv(
    "HELIX_ASK_ACTIVE_FULL_WORKLOADS_MAX",
    readPositiveIntegerEnv("HELIX_ASK_CONCURRENCY_MAX", 1),
  );

const retryAfterMsForReason = (reason: HelixAskTurnAdmissionQueueReason | HelixAskTurnAdmissionRejectReason): number => {
  if (reason === "session_busy") return 1500;
  if (reason === "instance_capacity") return 3000;
  if (reason === "memory_soft_pressure") return 5000;
  return 10000;
};

const sanitizeSessionId = (value: string | null | undefined): string =>
  value && value.trim() ? value.trim().slice(0, 180) : "helix-ask:anonymous";

const queuePositionForTurn = (sessionId: string, turnId: string): number =>
  queuedTurns.findIndex((turn) => turn.sessionId === sessionId && turn.turnId === turnId) + 1;

const enqueue = (input: {
  sessionId: string;
  turnId: string;
  route: HelixAskTurnAdmissionRoute;
  reason: HelixAskTurnAdmissionQueueReason;
  pressureLevel: Exclude<RuntimePressureLevel, "hard_pressure">;
}): HelixAskTurnAdmission => {
  const existing = queuedTurns.find(
    (turn) => turn.sessionId === input.sessionId && turn.turnId === input.turnId,
  );
  if (!existing) {
    queuedTurns.push({
      sessionId: input.sessionId,
      turnId: input.turnId,
      route: input.route,
      reason: input.reason,
      queuedAtMs: Date.now(),
    });
  }
  const queuePosition = queuePositionForTurn(input.sessionId, input.turnId);
  return {
    status: "queued",
    turn_id: input.turnId,
    queue_position: queuePosition > 0 ? queuePosition : queuedTurns.length,
    retry_after_ms: retryAfterMsForReason(input.reason),
    reason: input.reason,
    pressure_level: input.pressureLevel,
    active_workloads: activeTurnsBySession.size,
    max_active_workloads: maxActiveWorkloads(),
    session_id: input.sessionId,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const reject = (input: {
  sessionId: string;
  turnId: string;
  reason: HelixAskTurnAdmissionRejectReason;
}): HelixAskTurnAdmission => ({
  status: "rejected",
  turn_id: input.turnId,
  reason: input.reason,
  retry_after_ms: retryAfterMsForReason(input.reason),
  pressure_level: "hard_pressure",
  active_workloads: activeTurnsBySession.size,
  max_active_workloads: maxActiveWorkloads(),
  session_id: input.sessionId,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const reserveHelixAskTurnAdmission = (input: {
  sessionId?: string | null;
  turnId: string;
  route: HelixAskTurnAdmissionRoute;
  runtimeAdmission: RuntimeAdmissionDecision;
}): HelixAskTurnAdmission => {
  const sessionId = sanitizeSessionId(input.sessionId);
  const maxActive = maxActiveWorkloads();

  if (
    !input.runtimeAdmission.admitted &&
    (input.runtimeAdmission.pressureLevel === "hard_pressure" ||
      input.runtimeAdmission.action === "reject_memory_pressure")
  ) {
    input.runtimeAdmission.lease?.release("rejected");
    return reject({ sessionId, turnId: input.turnId, reason: "memory_hard_pressure" });
  }

  if (activeTurnsBySession.has(sessionId)) {
    input.runtimeAdmission.lease?.release("rejected");
    if (queuedTurns.length >= maxQueueDepth()) {
      return reject({ sessionId, turnId: input.turnId, reason: "queue_full" });
    }
    return enqueue({
      sessionId,
      turnId: input.turnId,
      route: input.route,
      reason: "session_busy",
      pressureLevel: input.runtimeAdmission.pressureLevel === "hard_pressure" ? "soft_pressure" : input.runtimeAdmission.pressureLevel,
    });
  }

  if (activeTurnsBySession.size >= maxActive) {
    input.runtimeAdmission.lease?.release("rejected");
    if (queuedTurns.length >= maxQueueDepth()) {
      return reject({ sessionId, turnId: input.turnId, reason: "queue_full" });
    }
    return enqueue({
      sessionId,
      turnId: input.turnId,
      route: input.route,
      reason: "instance_capacity",
      pressureLevel: input.runtimeAdmission.pressureLevel === "hard_pressure" ? "soft_pressure" : input.runtimeAdmission.pressureLevel,
    });
  }

  if (!input.runtimeAdmission.admitted || !input.runtimeAdmission.lease) {
    input.runtimeAdmission.lease?.release("rejected");
    if (queuedTurns.length >= maxQueueDepth()) {
      return reject({ sessionId, turnId: input.turnId, reason: "queue_full" });
    }
    const reason: HelixAskTurnAdmissionQueueReason =
      input.runtimeAdmission.pressureLevel === "soft_pressure"
        ? "memory_soft_pressure"
        : "instance_capacity";
    return enqueue({
      sessionId,
      turnId: input.turnId,
      route: input.route,
      reason,
      pressureLevel: input.runtimeAdmission.pressureLevel === "hard_pressure" ? "soft_pressure" : input.runtimeAdmission.pressureLevel,
    });
  }

  queuedTurns.splice(
    0,
    queuedTurns.length,
    ...queuedTurns.filter((turn) => !(turn.sessionId === sessionId && turn.turnId === input.turnId)),
  );
  activeTurnsBySession.set(sessionId, {
    sessionId,
    turnId: input.turnId,
    route: input.route,
    admittedAtMs: Date.now(),
    runtimeLease: input.runtimeAdmission.lease,
  });

  let released = false;
  const release = (outcome?: Parameters<RuntimeTaskLease["release"]>[0]): void => {
    if (released) return;
    released = true;
    const active = activeTurnsBySession.get(sessionId);
    if (active?.turnId === input.turnId) {
      activeTurnsBySession.delete(sessionId);
    }
    input.runtimeAdmission.lease?.release(outcome);
  };

  return {
    status: "admitted",
    turn_id: input.turnId,
    lease_id: input.runtimeAdmission.lease.id,
    pressure_level: input.runtimeAdmission.pressureLevel === "hard_pressure" ? "soft_pressure" : input.runtimeAdmission.pressureLevel,
    active_workloads: activeTurnsBySession.size,
    max_active_workloads: maxActive,
    session_id: sessionId,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    release,
  };
};

export const buildHelixAskTurnAdmissionPayload = (input: {
  admission: Exclude<HelixAskTurnAdmission, { status: "admitted" }>;
}): Record<string, unknown> => ({
  ok: false,
  response_type: input.admission.status === "queued" ? "queued" : "capacity_rejected",
  final_status: input.admission.status === "queued" ? "pending_input" : "final_failure",
  terminal_artifact_kind: "ask_turn_admission",
  final_answer_source: "ask_turn_admission",
  route_reason_code: `ask_turn_admission / ${input.admission.reason}`,
  route: `ask_turn_admission / ${input.admission.status}`,
  text:
    input.admission.status === "queued"
      ? `Ask turn queued: ${input.admission.reason}.`
      : `Ask turn rejected: ${input.admission.reason}.`,
  answer:
    input.admission.status === "queued"
      ? `Ask turn queued: ${input.admission.reason}.`
      : `Ask turn rejected: ${input.admission.reason}.`,
  turn_id: input.admission.turn_id,
  sessionId: input.admission.session_id,
  ask_turn_admission: {
    ...input.admission,
    schema: "helix.ask_turn_admission.v1",
  },
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const getHelixAskTurnAdmissionSnapshot = (): HelixAskTurnAdmissionSnapshot => ({
  schema: "helix.ask_turn_admission.snapshot.v1",
  active_workloads: activeTurnsBySession.size,
  max_active_workloads: maxActiveWorkloads(),
  queued_turn_count: queuedTurns.length,
  max_queue_depth: maxQueueDepth(),
  active_sessions: Array.from(activeTurnsBySession.values()).map((turn) => ({
    session_id: turn.sessionId,
    turn_id: turn.turnId,
    route: turn.route,
    admitted_at_ms: turn.admittedAtMs,
  })),
  queued_turns: queuedTurns.map((turn, index) => ({
    session_id: turn.sessionId,
    turn_id: turn.turnId,
    route: turn.route,
    reason: turn.reason,
    queued_at_ms: turn.queuedAtMs,
    queue_position: index + 1,
  })),
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const resetHelixAskTurnAdmissionForTests = (): void => {
  activeTurnsBySession.clear();
  queuedTurns.length = 0;
};
