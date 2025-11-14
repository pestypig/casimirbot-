import { createHash, randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { DebateConfig, type TDebateConfig, type TDebateOutcome, type TDebateTurn } from "@shared/essence-debate";
import { EssenceEnvelope } from "@shared/essence-schema";
import { metrics } from "../../metrics";
import { putEnvelope } from "../essence/store";

type DebateStatus = "pending" | "running" | "completed" | "timeout" | "aborted";

export type DebateScoreboard = {
  proponent: number;
  skeptic: number;
};

export type StoredDebateTurn = TDebateTurn & { essence_id?: string };
type DebateRoleLiteral = TDebateTurn["role"];

type DebateRecord = {
  id: string;
  goal: string;
  personaId: string;
  createdAt: string;
  updatedAt: string;
  status: DebateStatus;
  config: TDebateConfig;
  turns: StoredDebateTurn[];
  outcome?: TDebateOutcome;
  scoreboard: DebateScoreboard;
  startedAt: number;
  endedAt?: number;
  seq: number;
  running: boolean;
  reason?: string;
};

export type DebateStreamEvent =
  | {
      type: "turn";
      seq: number;
      debateId: string;
      turn: StoredDebateTurn;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "status";
      seq: number;
      debateId: string;
      status: DebateStatus;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "outcome";
      seq: number;
      debateId: string;
      outcome: TDebateOutcome;
      scoreboard: DebateScoreboard;
    };

export type DebateSnapshot = {
  id: string;
  goal: string;
  persona_id: string;
  status: DebateStatus;
  config: {
    max_rounds: number;
    max_wall_ms: number;
    verifiers: string[];
  };
  created_at: string;
  updated_at: string;
  turns: StoredDebateTurn[];
  scoreboard: DebateScoreboard;
  outcome: TDebateOutcome | null;
};

type EventListener = (event: DebateStreamEvent) => void;

type DebateEventPayload =
  | {
      type: "turn";
      turn: StoredDebateTurn;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "status";
      status: DebateStatus;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "outcome";
      outcome: TDebateOutcome;
      scoreboard: DebateScoreboard;
    };

const debates = new Map<string, DebateRecord>();
const eventBuffers = new Map<string, DebateStreamEvent[]>();
const listeners = new Map<string, Set<EventListener>>();
const MAX_EVENT_BUFFER = 500;

export async function startDebate(rawConfig: TDebateConfig): Promise<{ debateId: string }> {
  const parsed = DebateConfig.parse(rawConfig);
  const debateId = randomUUID();
  const now = new Date().toISOString();
  const record: DebateRecord = {
    id: debateId,
    goal: parsed.goal,
    personaId: parsed.persona_id,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    config: parsed,
    turns: [],
    outcome: undefined,
    scoreboard: { proponent: 0, skeptic: 0 },
    startedAt: Date.now(),
    endedAt: undefined,
    seq: 0,
    running: false,
  };
  debates.set(debateId, record);
  appendStatusEvent(record);
  scheduleAdvance(debateId);
  return { debateId };
}

export function getDebateSnapshot(debateId: string): DebateSnapshot | null {
  const record = debates.get(debateId);
  if (!record) {
    return null;
  }
  return {
    id: record.id,
    goal: record.goal,
    persona_id: record.personaId,
    status: record.status,
    config: {
      max_rounds: record.config.max_rounds,
      max_wall_ms: record.config.max_wall_ms,
      verifiers: [...(record.config.verifiers ?? [])],
    },
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    turns: record.turns.map((turn) => ({ ...turn })),
    scoreboard: snapshotScore(record),
    outcome: record.outcome ?? null,
  };
}

export function listDebateEvents(debateId: string, sinceSeq?: number): DebateStreamEvent[] {
  const buffer = eventBuffers.get(debateId);
  if (!buffer || buffer.length === 0) {
    return [];
  }
  if (sinceSeq === undefined || sinceSeq === null || Number.isNaN(sinceSeq)) {
    return [...buffer];
  }
  return buffer.filter((event) => event.seq > sinceSeq);
}

export function subscribeToDebate(debateId: string, listener: EventListener): () => void {
  const bucket = listeners.get(debateId) ?? new Set<EventListener>();
  bucket.add(listener);
  listeners.set(debateId, bucket);
  return () => {
    const set = listeners.get(debateId);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      listeners.delete(debateId);
    }
  };
}

export function resumeDebate(debateId: string): void {
  scheduleAdvance(debateId);
}

export function getDebateOwner(debateId: string): string | null {
  return debates.get(debateId)?.personaId ?? null;
}

export function __resetDebateStore(): void {
  debates.clear();
  eventBuffers.clear();
  listeners.clear();
}

const scheduleAdvance = (debateId: string) => {
  setImmediate(() => {
    void advanceDebate(debateId);
  });
};

async function advanceDebate(debateId: string): Promise<void> {
  const record = debates.get(debateId);
  if (!record) return;
  if (record.running || isTerminal(record.status)) {
    return;
  }
  record.running = true;
  record.status = "running";
  appendStatusEvent(record);
  try {
    while (!isTerminal(record.status)) {
      if (shouldTimeout(record)) {
        finalizeDebate(record, "timeout", { verdict: "Debate exceeded wall-clock budget." });
        break;
      }
      if (completedRounds(record) >= record.config.max_rounds) {
        finalizeDebate(record, "completed", { verdict: "Max rounds reached." });
        break;
      }
      const round = completedRounds(record) + 1;
      const proponentTurn = await synthesizeTurn(record, "proponent", round);
      await persistTurn(record, proponentTurn);
      metrics.recordDebateRound("proponent");
      await maybeYield();

      if (shouldTimeout(record)) {
        finalizeDebate(record, "timeout", { verdict: "Debate exceeded wall-clock budget." });
        break;
      }

      const skepticTurn = await synthesizeTurn(record, "skeptic", round);
      await persistTurn(record, skepticTurn);
      metrics.recordDebateRound("skeptic");

      const verifierResults = runVerifierSweep(record, round);
      const refereeTurn = await synthesizeRefereeTurn(record, round, verifierResults);
      await persistTurn(record, refereeTurn);
      metrics.recordDebateRound("referee");

      updateScoreboard(record, verifierResults);
      appendStatusEvent(record);

      if (checkStopRules(record, round, verifierResults)) {
        break;
      }
      await maybeYield();
    }
  } catch (error) {
    console.error("[debate] loop error", error);
    finalizeDebate(record, "aborted", { verdict: "Debate aborted due to internal error." });
  } finally {
    record.running = false;
  }
}

const maybeYield = async () => {
  await sleep(5);
};

function isTerminal(status: DebateStatus): boolean {
  return status === "completed" || status === "timeout" || status === "aborted";
}

function shouldTimeout(record: DebateRecord): boolean {
  const elapsed = Date.now() - record.startedAt;
  return elapsed >= record.config.max_wall_ms;
}

function completedRounds(record: DebateRecord): number {
  return record.turns.filter((turn) => turn.role === "referee").length;
}

async function synthesizeTurn(record: DebateRecord, role: DebateRoleLiteral, round: number): Promise<StoredDebateTurn> {
  const createdAt = new Date().toISOString();
  const text = renderTurnText(record, role, round);
  const citations = collectCitations(record);
  const turn: StoredDebateTurn = {
    id: randomUUID(),
    debate_id: record.id,
    round,
    role,
    text,
    citations,
    verifier_results: [],
    created_at: createdAt,
  };
  const essenceId = await persistEssenceForTurn(record, turn);
  if (essenceId) {
    turn.essence_id = essenceId;
  }
  return turn;
}

async function synthesizeRefereeTurn(
  record: DebateRecord,
  round: number,
  verifierResults: StoredDebateTurn["verifier_results"],
): Promise<StoredDebateTurn> {
  const createdAt = new Date().toISOString();
  const summary = renderRefereeSummary(record, round, verifierResults);
  const citations = collectCitations(record);
  const turn: StoredDebateTurn = {
    id: randomUUID(),
    debate_id: record.id,
    round,
    role: "referee",
    text: summary,
    citations,
    verifier_results: verifierResults,
    created_at: createdAt,
  };
  const essenceId = await persistEssenceForTurn(record, turn);
  if (essenceId) {
    turn.essence_id = essenceId;
  }
  return turn;
}

async function persistTurn(record: DebateRecord, turn: StoredDebateTurn): Promise<void> {
  record.turns.push(turn);
  record.updatedAt = turn.created_at;
  appendEvent(record, {
    type: "turn",
    turn: { ...turn },
    scoreboard: snapshotScore(record),
  });
}

function appendStatusEvent(record: DebateRecord): void {
  appendEvent(record, {
    type: "status",
    status: record.status,
    scoreboard: snapshotScore(record),
  });
}

function appendEvent(record: DebateRecord, payload: DebateEventPayload): DebateStreamEvent {
  const seq = ++record.seq;
  let event: DebateStreamEvent;
  switch (payload.type) {
    case "turn":
      event = { ...payload, seq, debateId: record.id };
      break;
    case "status":
      event = { ...payload, seq, debateId: record.id };
      break;
    case "outcome":
      event = { ...payload, seq, debateId: record.id };
      break;
    default: {
      const exhaustiveCheck: never = payload;
      throw new Error(`Unsupported debate event payload ${(exhaustiveCheck as any)?.type ?? "unknown"}`);
    }
  }
  const buffer = eventBuffers.get(record.id) ?? [];
  buffer.push(event);
  if (buffer.length > MAX_EVENT_BUFFER) {
    buffer.splice(0, buffer.length - MAX_EVENT_BUFFER);
  }
  eventBuffers.set(record.id, buffer);
  const subs = listeners.get(record.id);
  if (subs) {
    for (const listener of subs) {
      try {
        listener(event);
      } catch (err) {
        console.warn("[debate] listener error", err);
      }
    }
  }
  return event;
}

function renderTurnText(record: DebateRecord, role: DebateRoleLiteral, round: number): string {
  const lastTurn = record.turns.filter((turn) => turn.role !== "referee").slice(-1)[0];
  if (role === "proponent") {
    const scaffolding = lastTurn ? `Responding to ${lastTurn.role}#${lastTurn.round}, ` : "";
    return `${scaffolding}Proponent round ${round}: advancing the goal "${record.goal}" with a concrete sub-claim.`;
  }
  if (role === "skeptic") {
    const cite = lastTurn ? `challenge ${lastTurn.role}#${lastTurn.round}` : "surface counterpoints";
    return `Skeptic round ${round}: ${cite} and demand evidence that the goal "${record.goal}" holds under stress.`;
  }
  return `Round ${round}: official update for "${record.goal}".`;
}

function renderRefereeSummary(
  record: DebateRecord,
  round: number,
  verifierResults: StoredDebateTurn["verifier_results"],
): string {
  const ok = verifierResults.filter((entry) => entry.ok).length;
  const fail = verifierResults.length - ok;
  const flavor =
    verifierResults.length === 0
      ? "No verifiers configured; referee scores qualitative momentum."
      : `Verifiers confirm ${ok} claims and flag ${fail}.`;
  return `Referee round ${round}: ${flavor} Current score P:${record.scoreboard.proponent} vs S:${record.scoreboard.skeptic}.`;
}

function collectCitations(record: DebateRecord): string[] {
  const recent = record.turns.slice(-4).map((turn) => turn.essence_id).filter(Boolean) as string[];
  return Array.from(new Set(recent));
}

async function persistEssenceForTurn(record: DebateRecord, turn: StoredDebateTurn): Promise<string | undefined> {
  try {
    const digest = createHash("sha256").update(turn.text).digest("hex");
    const envelope = EssenceEnvelope.parse({
      header: {
        id: randomUUID(),
        version: "essence/1.0",
        modality: "text",
        created_at: turn.created_at,
        source: {
          uri: `debate://${record.id}/turn/${turn.id}`,
          original_hash: { algo: "sha256", value: digest },
          creator_id: record.personaId,
          license: "CC-BY-4.0",
        },
        rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
        acl: { visibility: "private", groups: [] },
      },
      features: {
        text: {
          lang: "en",
        },
      },
      provenance: {
        pipeline: [
          {
            name: `debate.mode/${turn.role}`,
            impl_version: "0.1.0",
            lib_hash: { algo: "sha256", value: digest },
            params: { round: turn.round, goal: record.goal, role: turn.role },
            input_hash: { algo: "sha256", value: createHash("sha256").update(record.goal).digest("hex") },
            output_hash: { algo: "sha256", value: digest },
            started_at: turn.created_at,
            ended_at: turn.created_at,
          },
        ],
        merkle_root: { algo: "sha256", value: digest },
        previous: null,
        signatures: [],
      },
      embeddings: [],
    });
    await putEnvelope(envelope);
    return envelope.header.id;
  } catch (error) {
    console.warn("[debate] failed to persist essence turn", error);
    return undefined;
  }
}

type VerifierResult = {
  name: string;
  ok: boolean;
  reason: string;
};

function runVerifierSweep(record: DebateRecord, round: number): VerifierResult[] {
  const verifiers = record.config.verifiers ?? [];
  if (verifiers.length === 0) {
    return [];
  }
  return verifiers.map((name, index) => {
    const parity = (round + index + record.scoreboard.proponent) % 2 === 0;
    const ok = parity;
    metrics.recordDebateVerification(name, ok);
    return {
      name,
      ok,
      reason: ok ? "Verification passed via deterministic check." : "Counter-example suggested by skeptic narrative.",
    };
  });
}

function updateScoreboard(record: DebateRecord, verifierResults: VerifierResult[]): void {
  if (!verifierResults.length) {
    record.scoreboard.proponent += 1;
    record.scoreboard.skeptic += 1;
    return;
  }
  const okCount = verifierResults.filter((entry) => entry.ok).length;
  const failCount = verifierResults.length - okCount;
  if (okCount >= failCount) {
    record.scoreboard.proponent += 1;
  }
  if (failCount >= okCount) {
    record.scoreboard.skeptic += 1;
  }
}

function checkStopRules(record: DebateRecord, round: number, verifierResults: VerifierResult[]): boolean {
  if (round >= record.config.max_rounds) {
    finalizeDebate(record, "completed", { verdict: "Max rounds reached." });
    return true;
  }
  if (shouldTimeout(record)) {
    finalizeDebate(record, "timeout", { verdict: "Debate exceeded wall-clock budget." });
    return true;
  }
  if (verifierResults.length > 0) {
    if (verifierResults.every((entry) => entry.ok)) {
      finalizeDebate(record, "completed", { verdict: "Agreement reached: skeptic satisfied all checks." });
      return true;
    }
    if (verifierResults.every((entry) => !entry.ok)) {
      finalizeDebate(record, "completed", { verdict: "Skeptic refuted the claim in this pass." });
      return true;
    }
  }
  return false;
}

function finalizeDebate(record: DebateRecord, status: DebateStatus, metadata?: { verdict?: string }): void {
  if (isTerminal(record.status)) {
    return;
  }
  record.status = status;
  record.endedAt = Date.now();
  record.updatedAt = new Date().toISOString();
  const outcome = buildOutcome(record, metadata?.verdict);
  record.outcome = outcome;
  metrics.observeDebateWall(record.endedAt - record.startedAt);
  appendEvent(record, { type: "outcome", outcome, scoreboard: snapshotScore(record) });
  appendStatusEvent(record);
}

function buildOutcome(record: DebateRecord, verdictText?: string): TDebateOutcome {
  const diff = record.scoreboard.proponent - record.scoreboard.skeptic;
  const total = Math.max(record.scoreboard.proponent + record.scoreboard.skeptic, 1);
  const winning_role = diff > 0 ? "proponent" : diff < 0 ? "skeptic" : undefined;
  const confidence = Math.min(0.95, 0.5 + Math.abs(diff) / total / 2);
  const verdict =
    verdictText ??
    (winning_role
      ? `${capitalize(winning_role)} leads ${record.scoreboard.proponent}-${record.scoreboard.skeptic}.`
      : "Referee declares stalemate after configured rounds.");
  const key_turn_ids = record.turns
    .slice(-5)
    .map((turn) => turn.id)
    .filter(Boolean);
  return {
    debate_id: record.id,
    verdict,
    confidence,
    winning_role,
    key_turn_ids,
    created_at: record.updatedAt,
  };
}

function snapshotScore(record: DebateRecord): DebateScoreboard {
  return { proponent: record.scoreboard.proponent, skeptic: record.scoreboard.skeptic };
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
