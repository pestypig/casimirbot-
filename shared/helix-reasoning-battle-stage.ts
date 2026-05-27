import type { HelixCausalTurnEvent } from "./helix-causal-turn-timeline";

export type ReasoningBattleTheaterStateV1 = {
  trace_id: string;
  scenario_id: string;
  suppression_reason: string | null;
  telemetry: {
    proof_verdict: "PASS" | "FAIL" | null;
    certificate_integrity_ok: boolean | null;
  };
};

export type ReasoningBattleLane = "orb" | "ambiguity" | "neutral" | "terminal";

export type ReasoningBattleBeatKind =
  | "orient"
  | "arm"
  | "strike"
  | "observe"
  | "clarify"
  | "support"
  | "gap"
  | "block"
  | "recoil"
  | "repair"
  | "settle"
  | "seal";

export type ReasoningBattleBeat = {
  id: string;
  source_event_id: string | null;
  sequence: number;
  lane: ReasoningBattleLane;
  kind: ReasoningBattleBeatKind;
  label: string;
  impact: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  progress_delta: number;
  pressure_delta: number;
  stage?: string;
  status?: string;
  reason_code?: string;
  ttl_ms: number;
  created_at_ms: number;
  raw_content_included: false;
};

export type ReasoningBattleVisualPrimitiveKind =
  | "slash"
  | "pulse"
  | "gate"
  | "notch"
  | "recoil"
  | "ring"
  | "spark"
  | "settle";

export type ReasoningBattleVisualPrimitive = {
  kind: ReasoningBattleVisualPrimitiveKind;
  lane: ReasoningBattleLane;
  direction: "forward" | "backward" | "center";
  intensity: 1 | 2 | 3;
  raw_content_included: false;
};

export type ReasoningBattleLiveEventEntry = {
  id?: string;
  text?: string;
  tool?: string;
  ts?: string | number;
  tsMs?: number;
  seq?: number;
  meta?: Record<string, unknown>;
};

type BeatDraft = {
  lane: ReasoningBattleLane;
  kind: ReasoningBattleBeatKind;
  label: string;
  impact: ReasoningBattleBeat["impact"];
  reasonCode?: string;
};

const MAX_REASONING_BATTLE_BEATS = 10;

function hash32(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function clampImpact(value: number): ReasoningBattleBeat["impact"] {
  if (value <= -3) return -3;
  if (value === -2) return -2;
  if (value === -1) return -1;
  if (value === 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  return 3;
}

function readStatusText(event: HelixCausalTurnEvent): string {
  return [event.status, event.reason_code, event.decision, event.public_summary]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function hasRejectedReason(event: HelixCausalTurnEvent, reason: string): boolean {
  return (event.rejected ?? []).some((entry) => entry.reason === reason);
}

function isBlockedOrFailed(event: HelixCausalTurnEvent): boolean {
  return event.status === "blocked" || event.status === "failed";
}

function isPassLike(event: HelixCausalTurnEvent): boolean {
  const statusText = readStatusText(event);
  return event.status === "succeeded" || /\b(pass|passed|satisfied|covered|ok)\b/i.test(statusText);
}

function classifyCausalEvent(event: HelixCausalTurnEvent): BeatDraft | null {
  const statusText = readStatusText(event);
  if (event.raw_content_included !== false || event.assistant_answer !== false) return null;
  if (
    event.status === "superseded" ||
    hasRejectedReason(event, "stale_route_label") ||
    /\bstale[_\s-]?route\b/i.test(statusText)
  ) {
    return {
      lane: "ambiguity",
      kind: "recoil",
      label: "stale",
      impact: -2,
      reasonCode: event.reason_code ?? "stale_route_label",
    };
  }

  switch (event.stage) {
    case "prompt_received":
      return { lane: "neutral", kind: "orient", label: "ask", impact: 0 };
    case "goal_classified":
      return { lane: "orb", kind: "orient", label: "orient", impact: 1 };
    case "source_target_decided":
      return { lane: "orb", kind: "orient", label: "route", impact: 1 };
    case "route_label_set":
      return { lane: "orb", kind: "orient", label: "route", impact: 1 };
    case "tool_surface_built":
      return { lane: "orb", kind: "arm", label: "tools", impact: 1 };
    case "model_step_requested":
    case "model_step_decided":
      return { lane: "orb", kind: "strike", label: "choose", impact: 1 };
    case "runtime_tool_call_validated":
    case "runtime_tool_dispatched":
      return { lane: "orb", kind: "arm", label: "tool", impact: 1 };
    case "tool_observation_created":
      return { lane: "orb", kind: "observe", label: "tool", impact: 2 };
    case "repo_evidence_observation_created":
      return { lane: "orb", kind: "support", label: "evidence", impact: 2 };
    case "repo_docs_synthesis_packet_created":
      return { lane: "orb", kind: "support", label: "packet", impact: 1 };
    case "repo_docs_synthesis_repair_observation_created":
      return { lane: "orb", kind: "repair", label: "repair", impact: 1 };
    case "coverage_gate_evaluated":
      if (isBlockedOrFailed(event) || /\b(missing|gap|blocked|failed)\b/i.test(statusText)) {
        return { lane: "ambiguity", kind: "gap", label: "gap", impact: -2 };
      }
      return isPassLike(event) ? { lane: "orb", kind: "support", label: "covered", impact: 2 } : null;
    case "quality_gate_evaluated":
      if (isBlockedOrFailed(event) || /\b(blocked|failed|rejected)\b/i.test(statusText)) {
        return { lane: "ambiguity", kind: "block", label: "blocked", impact: -2 };
      }
      return isPassLike(event) ? { lane: "orb", kind: "clarify", label: "quality", impact: 1 } : null;
    case "goal_satisfaction_evaluated":
      if (isBlockedOrFailed(event) || /\b(unsatisfied|missing|failed|blocked)\b/i.test(statusText)) {
        return { lane: "ambiguity", kind: "gap", label: "unsatisfied", impact: -2 };
      }
      return /\bsatisfied\b/i.test(statusText) || isPassLike(event)
        ? { lane: "orb", kind: "support", label: "satisfied", impact: 2 }
        : null;
    case "solver_controller_decided":
      if (isBlockedOrFailed(event) || /\b(blocked|hold|failed)\b/i.test(statusText)) {
        return { lane: "ambiguity", kind: "block", label: "hold", impact: -2 };
      }
      return { lane: "neutral", kind: "clarify", label: "decide", impact: 0 };
    case "terminal_artifact_materialized":
    case "terminal_artifact_selected":
      return { lane: "terminal", kind: "settle", label: "settle", impact: 2 };
    case "terminal_candidate_rejected":
      return { lane: "ambiguity", kind: "block", label: "reject", impact: -2 };
    case "projection_mismatch_checked":
      if (isBlockedOrFailed(event) || /\b(mismatch|failed|false)\b/i.test(statusText)) {
        return { lane: "ambiguity", kind: "recoil", label: "mismatch", impact: -3 };
      }
      return { lane: "orb", kind: "clarify", label: "matched", impact: 1 };
    case "visible_response_written":
      return { lane: "terminal", kind: "settle", label: "final", impact: 1 };
    default:
      return null;
  }
}

function makeBeat(input: {
  draft: BeatDraft;
  sourceEventId: string | null;
  sequence: number;
  stage?: string;
  status?: string;
  reasonCode?: string;
  createdAtMs: number;
  traceKey: string;
  theaterScenarioId?: string;
}): ReasoningBattleBeat {
  const reasonCode = input.reasonCode ?? input.draft.reasonCode;
  const impact = clampImpact(input.draft.impact);
  const idSource = [
    input.traceKey,
    input.sourceEventId ?? "synthetic",
    input.sequence,
    input.stage ?? "",
    input.status ?? "",
    reasonCode ?? "",
    input.draft.lane,
    input.draft.kind,
    input.draft.label,
    input.theaterScenarioId ?? "",
  ].join("|");
  return {
    id: `reasoning-battle:${hash32(idSource)}`,
    source_event_id: input.sourceEventId,
    sequence: input.sequence,
    lane: input.draft.lane,
    kind: input.draft.kind,
    label: input.draft.label,
    impact,
    progress_delta: impact > 0 ? impact : 0,
    pressure_delta: impact < 0 ? Math.abs(impact) : 0,
    stage: input.stage,
    status: input.status,
    reason_code: reasonCode,
    ttl_ms: 1400 + Math.abs(impact) * 160,
    created_at_ms: input.createdAtMs,
    raw_content_included: false,
  };
}

function liveEventTimestampMs(event: ReasoningBattleLiveEventEntry, fallbackMs: number): number {
  if (typeof event.tsMs === "number" && Number.isFinite(event.tsMs)) return event.tsMs;
  if (typeof event.ts === "number" && Number.isFinite(event.ts)) return event.ts;
  if (typeof event.ts === "string") {
    const parsed = Date.parse(event.ts);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallbackMs;
}

function classifyLiveEvent(event: ReasoningBattleLiveEventEntry): BeatDraft | null {
  const metaStage = typeof event.meta?.stage === "string" ? event.meta.stage : "";
  const metaStatus = typeof event.meta?.status === "string" ? event.meta.status : "";
  const text = [event.tool, metaStage, metaStatus, event.text].filter(Boolean).join(" ").toLowerCase();
  if (/\b(stale[_\s-]?route|projection mismatch|terminal_artifact_forbidden|contract_violation)\b/i.test(text)) {
    return { lane: "ambiguity", kind: "seal", label: "sealed", impact: -3 };
  }
  if (/\b(missing evidence|coverage gap|gap)\b/i.test(text)) {
    return { lane: "ambiguity", kind: "gap", label: "gap", impact: -2 };
  }
  if (/\b(blocked|failed|error|rejected)\b/i.test(text)) {
    return { lane: "ambiguity", kind: "block", label: "blocked", impact: -2 };
  }
  if (/\b(evidence|citation|anchor)\b/i.test(text)) {
    return { lane: "orb", kind: "support", label: "evidence", impact: 2 };
  }
  if (event.tool || /\b(tool|observation)\b/i.test(text)) {
    return { lane: "orb", kind: "observe", label: "tool", impact: 2 };
  }
  if (/\b(decision|choose|selected)\b/i.test(text)) {
    return { lane: "orb", kind: "strike", label: "choose", impact: 1 };
  }
  if (/\b(final|terminal|settle)\b/i.test(text)) {
    return { lane: "terminal", kind: "settle", label: "settle", impact: 1 };
  }
  return null;
}

function buildTheaterStateHardStopBeats(input: {
  theaterState: ReasoningBattleTheaterStateV1 | null | undefined;
  traceKey: string;
  nowMs: number;
  nextSequence: number;
}): ReasoningBattleBeat[] {
  const state = input.theaterState;
  if (!state) return [];
  const beats: ReasoningBattleBeat[] = [];
  if (state.telemetry.proof_verdict === "FAIL" || state.telemetry.certificate_integrity_ok === false) {
    beats.push(
      makeBeat({
        draft: { lane: "ambiguity", kind: "seal", label: "sealed", impact: -3, reasonCode: "proof_or_integrity_failed" },
        sourceEventId: null,
        sequence: input.nextSequence,
        stage: "proof_envelope",
        status: "failed",
        reasonCode: "proof_or_integrity_failed",
        createdAtMs: input.nowMs,
        traceKey: input.traceKey,
        theaterScenarioId: state.scenario_id,
      }),
    );
  }
  if (state.suppression_reason === "missing_evidence" || state.suppression_reason === "contract_violation") {
    beats.push(
      makeBeat({
        draft: {
          lane: "ambiguity",
          kind: state.suppression_reason === "missing_evidence" ? "gap" : "seal",
          label: state.suppression_reason === "missing_evidence" ? "gap" : "sealed",
          impact: -3,
          reasonCode: state.suppression_reason,
        },
        sourceEventId: null,
        sequence: input.nextSequence + beats.length,
        stage: "reasoning_theater_state",
        status: "blocked",
        reasonCode: state.suppression_reason,
        createdAtMs: input.nowMs,
        traceKey: input.traceKey,
        theaterScenarioId: state.scenario_id,
      }),
    );
  }
  return beats;
}

export function buildReasoningBattleBeats(input: {
  timelineEvents: HelixCausalTurnEvent[];
  liveEvents: ReasoningBattleLiveEventEntry[];
  theaterState?: ReasoningBattleTheaterStateV1 | null;
  previousBeatIds?: Set<string>;
  nowMs?: number;
}): ReasoningBattleBeat[] {
  const nowMs = input.nowMs ?? 0;
  const timelineEvents = [...(input.timelineEvents ?? [])].sort((left, right) => left.sequence - right.sequence);
  const traceKey =
    timelineEvents[0]?.turn_id ??
    input.theaterState?.trace_id ??
    input.theaterState?.scenario_id ??
    "helix-reasoning-battle";
  const beats: ReasoningBattleBeat[] = [];

  for (const event of timelineEvents) {
    const draft = classifyCausalEvent(event);
    if (!draft) continue;
    beats.push(
      makeBeat({
        draft,
        sourceEventId: event.event_id,
        sequence: event.sequence,
        stage: event.stage,
        status: event.status,
        reasonCode: event.reason_code,
        createdAtMs: event.timestamp_ms ?? nowMs,
        traceKey,
        theaterScenarioId: input.theaterState?.scenario_id,
      }),
    );
  }

  if (beats.length === 0) {
    for (const [index, event] of (input.liveEvents ?? []).entries()) {
      const draft = classifyLiveEvent(event);
      if (!draft) continue;
      const sequence = typeof event.seq === "number" && Number.isFinite(event.seq) ? event.seq : index + 1;
      beats.push(
        makeBeat({
          draft,
          sourceEventId: event.id ?? null,
          sequence,
          stage: typeof event.meta?.stage === "string" ? event.meta.stage : "live_event",
          status: typeof event.meta?.status === "string" ? event.meta.status : undefined,
          reasonCode: typeof event.meta?.reason_code === "string" ? event.meta.reason_code : undefined,
          createdAtMs: liveEventTimestampMs(event, nowMs),
          traceKey,
          theaterScenarioId: input.theaterState?.scenario_id,
        }),
      );
    }
  }

  beats.push(
    ...buildTheaterStateHardStopBeats({
      theaterState: input.theaterState,
      traceKey,
      nowMs,
      nextSequence: (beats[beats.length - 1]?.sequence ?? 0) + 1,
    }),
  );

  const deduped = new Map<string, ReasoningBattleBeat>();
  for (const beat of beats) {
    if (input.previousBeatIds?.has(beat.id)) continue;
    deduped.set(beat.id, beat);
  }
  return [...deduped.values()]
    .sort((left, right) => left.sequence - right.sequence)
    .slice(-MAX_REASONING_BATTLE_BEATS);
}

export function reasoningBattleBeatClassName(
  beat: Pick<ReasoningBattleBeat, "lane" | "kind">,
  reducedMotion = false,
): string {
  const laneClass =
    beat.lane === "orb"
      ? "reasoning-battle-pop--orb border-emerald-200/35 bg-emerald-300/10 text-emerald-100"
      : beat.lane === "ambiguity"
        ? "reasoning-battle-pop--ambiguity border-rose-200/35 bg-rose-300/10 text-rose-100"
        : beat.lane === "terminal"
          ? "reasoning-battle-pop--terminal border-cyan-200/35 bg-cyan-300/10 text-cyan-100"
          : "reasoning-battle-pop--neutral border-slate-200/25 bg-white/5 text-slate-200";
  const motionClass = reducedMotion ? "reasoning-battle-pop--static" : "reasoning-battle-pop--float";
  return `reasoning-battle-pop reasoning-battle-pop--${beat.kind} ${laneClass} ${motionClass}`;
}

export function reasoningBattleBeatPrimitive(
  beat: Pick<ReasoningBattleBeat, "kind" | "lane" | "impact">,
): ReasoningBattleVisualPrimitive {
  const intensity = (Math.max(1, Math.min(3, Math.abs(beat.impact))) || 1) as 1 | 2 | 3;
  const direction =
    beat.lane === "ambiguity" ? "backward" : beat.lane === "terminal" ? "center" : "forward";
  const primitiveKind: ReasoningBattleVisualPrimitiveKind =
    beat.kind === "strike"
      ? "slash"
      : beat.kind === "support" || beat.kind === "observe" || beat.kind === "clarify"
        ? "pulse"
        : beat.kind === "gap"
          ? "notch"
          : beat.kind === "block"
            ? "gate"
            : beat.kind === "recoil"
              ? "recoil"
              : beat.kind === "seal"
                ? "ring"
                : beat.kind === "settle"
                  ? "settle"
                  : beat.kind === "repair" || beat.kind === "arm"
                    ? "spark"
                    : "pulse";
  return {
    kind: primitiveKind,
    lane: beat.lane,
    direction,
    intensity,
    raw_content_included: false,
  };
}
