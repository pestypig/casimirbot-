import crypto from "node:crypto";

export type CodexProviderStageStatus =
  | "started"
  | "completed"
  | "failed"
  | "aborted";

export type CodexProviderStageEvent = {
  sequence: number;
  at_ms: number;
  elapsed_ms: number;
  stage: string;
  status: CodexProviderStageStatus;
  attempt: number | null;
  prompt_char_count: number | null;
  prompt_hash: string | null;
  output_char_count: number | null;
  output_hash: string | null;
  capability_request_marker_detected: boolean | null;
  capability_request_parsed: boolean | null;
  semantic_route_marker_detected: boolean | null;
  timed_out: boolean | null;
  killed: boolean | null;
  exit_code: number | null;
  fail_reason: string | null;
};

export type CodexProviderStageLedger = {
  schema: "helix.codex_provider_stage_ledger.v1";
  turn_id: string;
  started_at_ms: number;
  updated_at_ms: number;
  status: "running" | "completed" | "failed" | "aborted";
  compatibility_model_attempt_count: number;
  events: CodexProviderStageEvent[];
  observer_only: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const MAX_TURNS = 64;
const MAX_EVENTS_PER_TURN = 96;
const ledgers = new Map<string, CodexProviderStageLedger>();

const safeHash = (value: string): string | null =>
  value
    ? crypto.createHash("sha256").update(value).digest("hex").slice(0, 16)
    : null;

const cloneLedger = (
  ledger: CodexProviderStageLedger,
): CodexProviderStageLedger => ({
  ...ledger,
  events: ledger.events.map((event) => ({ ...event })),
});

const pruneLedgers = (): void => {
  while (ledgers.size > MAX_TURNS) {
    const oldestTurnId = ledgers.keys().next().value as string | undefined;
    if (!oldestTurnId) return;
    ledgers.delete(oldestTurnId);
  }
};

export const beginCodexProviderStageLedger = (
  turnId: string,
  nowMs = Date.now(),
): CodexProviderStageLedger => {
  const ledger: CodexProviderStageLedger = {
    schema: "helix.codex_provider_stage_ledger.v1",
    turn_id: turnId,
    started_at_ms: nowMs,
    updated_at_ms: nowMs,
    status: "running",
    compatibility_model_attempt_count: 0,
    events: [],
    observer_only: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  ledgers.delete(turnId);
  ledgers.set(turnId, ledger);
  pruneLedgers();
  return cloneLedger(ledger);
};

export const nextCodexCompatibilityModelAttempt = (turnId: string): number => {
  const ledger = ledgers.get(turnId) ?? beginCodexProviderStageLedger(turnId);
  const stored = ledgers.get(turnId) ?? ledger;
  stored.compatibility_model_attempt_count += 1;
  stored.updated_at_ms = Date.now();
  return stored.compatibility_model_attempt_count;
};

export const appendCodexProviderStageEvent = (input: {
  turnId: string;
  stage: string;
  status: CodexProviderStageStatus;
  attempt?: number | null;
  prompt?: string | null;
  output?: string | null;
  timedOut?: boolean | null;
  killed?: boolean | null;
  exitCode?: number | null;
  failReason?: string | null;
  capabilityRequestParsed?: boolean | null;
  nowMs?: number;
}): CodexProviderStageEvent => {
  const nowMs = input.nowMs ?? Date.now();
  if (!ledgers.has(input.turnId)) beginCodexProviderStageLedger(input.turnId, nowMs);
  const ledger = ledgers.get(input.turnId)!;
  const prompt = input.prompt ?? null;
  const output = input.output ?? null;
  const event: CodexProviderStageEvent = {
    sequence: ledger.events.length + 1,
    at_ms: nowMs,
    elapsed_ms: Math.max(0, nowMs - ledger.started_at_ms),
    stage: input.stage,
    status: input.status,
    attempt: input.attempt ?? null,
    prompt_char_count: prompt === null ? null : prompt.length,
    prompt_hash: prompt === null ? null : safeHash(prompt),
    output_char_count: output === null ? null : output.length,
    output_hash: output === null ? null : safeHash(output),
    capability_request_marker_detected:
      output === null ? null : output.includes("HELIX_CAPABILITY_LANE_REQUEST"),
    capability_request_parsed: input.capabilityRequestParsed ?? null,
    semantic_route_marker_detected:
      output === null ? null : output.includes("HELIX_SEMANTIC_ROUTE_PROPOSAL"),
    timed_out: input.timedOut ?? null,
    killed: input.killed ?? null,
    exit_code: input.exitCode ?? null,
    fail_reason: input.failReason ?? null,
  };
  ledger.events.push(event);
  if (ledger.events.length > MAX_EVENTS_PER_TURN) ledger.events.shift();
  ledger.updated_at_ms = nowMs;
  return { ...event };
};

export const completeCodexProviderStageLedger = (input: {
  turnId: string;
  status: "completed" | "failed" | "aborted";
  failReason?: string | null;
}): CodexProviderStageLedger | null => {
  const ledger = ledgers.get(input.turnId);
  if (!ledger) return null;
  // A process may settle after its caller has aborted. Preserve the client
  // boundary as the turn's terminal diagnostic status; a late failure or
  // completion is still appended as an event but must not erase the abort.
  if (ledger.status !== "aborted") ledger.status = input.status;
  ledger.updated_at_ms = Date.now();
  appendCodexProviderStageEvent({
    turnId: input.turnId,
    stage: "provider_turn",
    status: input.status,
    failReason: input.failReason ?? null,
  });
  return cloneLedger(ledger);
};

export const readCodexProviderStageLedger = (
  turnId: string,
): CodexProviderStageLedger | null => {
  const ledger = ledgers.get(turnId);
  return ledger ? cloneLedger(ledger) : null;
};

export const resetCodexProviderStageLedgersForTests = (): void => {
  ledgers.clear();
};
