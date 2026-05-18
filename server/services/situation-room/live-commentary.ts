import crypto from "node:crypto";
import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerEnvironmentMode,
  LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_COMMENTARY_PROPOSAL_SCHEMA,
  HELIX_LIVE_COMMENTARY_CANDIDATE_SCHEMA,
  HELIX_LIVE_COMMENTARY_DELIVERY_RECEIPT_SCHEMA,
  HELIX_LIVE_COMMENTARY_SESSION_SCHEMA,
  HELIX_LIVE_COMMENTARY_TRACE_STEP_SCHEMA,
  type LiveCommentaryCadence,
  type LiveCommentaryCandidate,
  type LiveCommentaryCandidateDecision,
  type LiveCommentaryDeliveryReceipt,
  type LiveCommentaryDecision,
  type LiveCommentaryProposal,
  type LiveCommentarySession,
  type LiveCommentaryTraceStep,
  type LiveCommentaryTraceStepKind,
} from "@shared/helix-live-commentary";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { getCompanionPolicy } from "./companion-policy-engine";
import { decideVoiceOutputAction } from "./voice-lane-decision-center";

const sessionsByEnvironment = new Map<string, LiveCommentarySession>();
const candidatesByEnvironment = new Map<string, LiveCommentaryCandidate[]>();
const proposalsByEnvironment = new Map<string, LiveCommentaryProposal[]>();
const deliveriesByEnvironment = new Map<string, LiveCommentaryDeliveryReceipt[]>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => typeof value === "string" ? value.trim() : "").filter(Boolean)));

const normalizeCadence = (value?: string | null): LiveCommentaryCadence => {
  if (
    value === "off" ||
    value === "milestones_only" ||
    value === "anomalies_and_milestones" ||
    value === "windowed_companion" ||
    value === "active_dialogue" ||
    value === "continuous_debug"
  ) {
    return value;
  }
  return "milestones_only";
};

const normalizeVoiceMode = (value?: string | null): LiveAnswerEnvironmentMode | null => {
  if (
    value === "text_only" ||
    value === "voice_on_confirm" ||
    value === "critical_voice" ||
    value === "direct_address_only"
  ) {
    return value;
  }
  return null;
};

const getLineValue = (environment: LiveAnswerEnvironment, key: string): string | null =>
  environment.lines.find((line: LiveAnswerLineState) => line.key === key)?.value?.trim() || null;

const commentarySubgoalForPreset = (environment: LiveAnswerEnvironment): string => {
  if (environment.preset === "calculator_prime_stream") return "Detect prime milestones without surfacing routine candidate checks.";
  if (environment.preset === "physics_stability_tracker") return "Watch stability, residual, and anomaly lines for meaningful changes.";
  if (environment.preset === "minecraft_run_monitor") return "Watch risk, progress, and next-check lines for useful user-facing updates.";
  return "Watch compact live lines and surface only meaningful changes.";
};

const classifyDelta = (delta: LiveAnswerEnvironmentDelta): {
  reason: LiveCommentaryProposal["reason"];
  priority: LiveCommentaryProposal["priority"];
  decision: LiveCommentaryDecision;
  text: string;
  routine: boolean;
} => {
  const environment = delta.environment_snapshot;
  const latestSummary = environment.latest_evaluation?.summary ?? environment.latest_summary;
  const latestPrime = getLineValue(environment, "latest_prime");
  const candidate = getLineValue(environment, "current_candidate");
  const gap = getLineValue(environment, "gap");
  const lastTest = getLineValue(environment, "last_test") ?? latestSummary;
  const anomaly = getLineValue(environment, "anomaly");
  const residual = getLineValue(environment, "residual");
  const stabilityWindow = getLineValue(environment, "stability_window");
  const equationInterpretation = getLineValue(environment, "interpretation");
  const latestResult = getLineValue(environment, "latest_result");

  if (environment.preset === "calculator_equation_interpreter" && equationInterpretation) {
    return {
      reason: "milestone",
      priority: "info",
      decision: "show_text",
      text: `Equation live source: ${equationInterpretation}${latestResult ? ` Result: ${latestResult}.` : ""}`,
      routine: false,
    };
  }

  if (environment.preset === "calculator_prime_stream" && /prime\s+\d+\s+found/i.test(latestSummary)) {
    return {
      reason: "prime_found",
      priority: "info",
      decision: "show_text",
      text: `Prime stream: ${latestPrime ?? candidate ?? "a new prime"} was found${gap ? `; gap ${gap}` : ""}.`,
      routine: false,
    };
  }
  if (environment.preset === "physics_stability_tracker" && anomaly && !/no anomaly/i.test(anomaly)) {
    return {
      reason: "anomaly_detected",
      priority: "warn",
      decision: "show_text",
      text: `Physics tracker: ${anomaly}${residual ? ` Residual ${residual}.` : ""}`,
      routine: false,
    };
  }
  if (environment.preset === "physics_stability_tracker" && stabilityWindow && /stable/i.test(stabilityWindow)) {
    return {
      reason: "stability_reached",
      priority: "info",
      decision: "show_text",
      text: `Physics tracker: stability window updated. ${stabilityWindow}`,
      routine: false,
    };
  }
  if (delta.reason === "windowed_summary" || (delta.window_count && delta.window_count > 1 && delta.source_event_count && delta.source_event_count >= 5)) {
    return {
      reason: "window_summary",
      priority: "info",
      decision: "show_text",
      text: `Live environment: ${latestSummary}`,
      routine: false,
    };
  }
  return {
    reason: "suppressed_routine",
    priority: "info",
    decision: "silent_keep_in_context",
    text: environment.preset === "calculator_prime_stream"
      ? `Prime stream: ${lastTest}`
      : `Live environment: ${latestSummary}`,
    routine: true,
  };
};

export function upsertLiveCommentarySession(input: {
  environment: LiveAnswerEnvironment;
  cadence?: string | null;
  status?: "active" | "paused" | "stopped";
  voice_mode?: string | null;
  now?: string;
}): LiveCommentarySession {
  const now = input.now ?? new Date().toISOString();
  const existing = sessionsByEnvironment.get(input.environment.environment_id);
  const cadence = normalizeCadence(input.cadence ?? existing?.cadence);
  const session: LiveCommentarySession = {
    schema: HELIX_LIVE_COMMENTARY_SESSION_SCHEMA,
    session_id: existing?.session_id ?? `live_commentary:${hashShort([input.environment.thread_id, input.environment.environment_id], 18)}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    objective: input.environment.objective,
    status: input.status ?? existing?.status ?? "active",
    cadence,
    voice_mode: normalizeVoiceMode(input.voice_mode) ?? existing?.voice_mode ?? input.environment.mode,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    last_commentary_turn_id: existing?.last_commentary_turn_id ?? null,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
  sessionsByEnvironment.set(session.environment_id, session);
  return session;
}

export function listLiveCommentarySessions(): LiveCommentarySession[] {
  return Array.from(sessionsByEnvironment.values()).sort((a: LiveCommentarySession, b: LiveCommentarySession) => b.updated_at.localeCompare(a.updated_at));
}

export function getLiveCommentarySessionForEnvironment(environmentId: string): LiveCommentarySession | null {
  return sessionsByEnvironment.get(environmentId) ?? null;
}

export function listLiveCommentaryProposals(environmentId?: string | null): LiveCommentaryProposal[] {
  if (environmentId) return proposalsByEnvironment.get(environmentId) ?? [];
  return Array.from(proposalsByEnvironment.values()).flat().sort((a: LiveCommentaryProposal, b: LiveCommentaryProposal) => b.ts.localeCompare(a.ts));
}

export function listLiveCommentaryCandidates(environmentId?: string | null): LiveCommentaryCandidate[] {
  if (environmentId) return candidatesByEnvironment.get(environmentId) ?? [];
  return Array.from(candidatesByEnvironment.values()).flat().sort((a: LiveCommentaryCandidate, b: LiveCommentaryCandidate) => b.created_at.localeCompare(a.created_at));
}

export function listLiveCommentaryDeliveries(environmentId?: string | null): LiveCommentaryDeliveryReceipt[] {
  if (environmentId) return deliveriesByEnvironment.get(environmentId) ?? [];
  return Array.from(deliveriesByEnvironment.values()).flat().sort((a: LiveCommentaryDeliveryReceipt, b: LiveCommentaryDeliveryReceipt) => b.ts.localeCompare(a.ts));
}

const buildDeliveryReceipt = (proposal: LiveCommentaryProposal): LiveCommentaryDeliveryReceipt => {
  const session = sessionsByEnvironment.get(proposal.environment_id) ?? null;
  const outputDecision = decideVoiceOutputAction({
    policy: getCompanionPolicy(proposal.thread_id),
    classification: null,
    environment: null,
    environmentMode: session?.voice_mode ?? null,
    commentary: proposal,
    cooldownOk: true,
  });
  const isVoiceConfirm = outputDecision.action === "voice_on_confirm";
  const isText = outputDecision.action === "show_text" || proposal.decision === "show_text";
  const isVoiceNow = outputDecision.action === "voice_now";
  return {
    schema: HELIX_LIVE_COMMENTARY_DELIVERY_RECEIPT_SCHEMA,
    delivery_id: `live_commentary_delivery:${hashShort([proposal.proposal_id, proposal.decision, proposal.ts], 18)}`,
    proposal_id: proposal.proposal_id,
    thread_id: proposal.thread_id,
    environment_id: proposal.environment_id,
    delivered: isText || isVoiceNow,
    channel: isVoiceNow ? "voice" : isText ? "ui_text" : isVoiceConfirm ? "voice_on_confirm" : "none",
    reason: isText
      ? "delivered"
      : isVoiceNow
        ? "delivered"
      : isVoiceConfirm
        ? "awaiting_confirmation"
        : outputDecision.reason === "voice_output_disabled"
          ? "voice_not_enabled"
        : "silent_keep_in_context",
    evidence_refs: proposal.evidence_refs,
    audio_event_id: null,
    ts: proposal.ts,
  };
};

const storeDeliveryReceipt = (receipt: LiveCommentaryDeliveryReceipt): LiveCommentaryDeliveryReceipt => {
  deliveriesByEnvironment.set(receipt.environment_id, [
    ...(deliveriesByEnvironment.get(receipt.environment_id) ?? []),
    receipt,
  ].slice(-80));
  return receipt;
};

const buildTraceStep = (input: {
  proposalId: string;
  session: LiveCommentarySession;
  delta: LiveAnswerEnvironmentDelta;
  kind: LiveCommentaryTraceStepKind;
  label: string;
  summary: string;
  status?: "completed" | "skipped";
  index: number;
  now: string;
}): LiveCommentaryTraceStep => ({
  schema: HELIX_LIVE_COMMENTARY_TRACE_STEP_SCHEMA,
  step_id: `live_commentary_step:${hashShort([input.proposalId, input.kind, input.index], 14)}`,
  proposal_id: input.proposalId,
  session_id: input.session.session_id,
  thread_id: input.session.thread_id,
  environment_id: input.session.environment_id,
  delta_id: input.delta.delta_id,
  kind: input.kind,
  label: input.label,
  summary: input.summary,
  status: input.status ?? "completed",
  evidence_refs: uniqueStrings(input.delta.evidence_refs).slice(-12),
  model_invoked: false,
  deterministic: true,
  context_policy: "compact_context_pack_only",
  raw_logs_included: false,
  ts: input.now,
});

const buildTraceSteps = (input: {
  proposalId: string;
  session: LiveCommentarySession;
  delta: LiveAnswerEnvironmentDelta;
  decision: LiveCommentaryDecision;
  classification: ReturnType<typeof classifyDelta>;
  shouldSurface: boolean;
  now: string;
}): LiveCommentaryTraceStep[] => {
  const environment = input.delta.environment_snapshot;
  const latestSummary = environment.latest_evaluation?.summary ?? environment.latest_summary;
  const changedLines = input.delta.changed_line_keys.length > 0
    ? input.delta.changed_line_keys.join(", ")
    : "status";
  const deliverySummary =
    input.decision === "show_text"
      ? "Deliver as a UI text commentary card."
      : input.decision === "voice_on_confirm"
        ? "Prepare voice text but wait for explicit confirmation."
        : "Keep the update in context without user-facing delivery.";
  const stepInputs: Array<Omit<Parameters<typeof buildTraceStep>[0], "index">> = [
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "goal_frame",
      label: "Goal",
      summary: input.session.objective,
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "subgoal_assigned",
      label: "Current subgoal",
      summary: commentarySubgoalForPreset(environment),
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "source_observed",
      label: "Observed",
      summary: `${input.delta.reason}; ${input.delta.source_event_count ?? 1} compact source event(s) in the current window.`,
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "line_updated",
      label: "Line update",
      summary: `${changedLines}: ${latestSummary}`,
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "evaluation_question",
      label: "Evaluation question",
      summary: "Should this live update become commentary for the user?",
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "evaluation_result",
      label: "Evaluation result",
      summary: input.shouldSurface
        ? `${input.classification.reason} passes the ${input.session.cadence} commentary cadence.`
        : `${input.classification.reason} does not pass the ${input.session.cadence} commentary cadence.`,
      status: input.shouldSurface ? "completed" : "skipped",
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "commentary_proposed",
      label: "Commentary proposal",
      summary: input.classification.text,
      status: input.decision === "silent_keep_in_context" ? "skipped" : "completed",
      now: input.now,
    },
    {
      proposalId: input.proposalId,
      session: input.session,
      delta: input.delta,
      kind: "delivery_decided",
      label: "Delivery decision",
      summary: deliverySummary,
      status: input.decision === "silent_keep_in_context" ? "skipped" : "completed",
      now: input.now,
    },
  ];
  return stepInputs.map((step, index: number) => buildTraceStep({ ...step, index }));
};

export function buildLiveCommentaryProposal(input: {
  delta: LiveAnswerEnvironmentDelta;
  cadence?: string | null;
  now?: string;
}): { session: LiveCommentarySession; proposal: LiveCommentaryProposal } {
  const now = input.now ?? input.delta.ts;
  const environment = input.delta.environment_snapshot;
  const session = upsertLiveCommentarySession({
    environment,
    cadence: input.cadence,
    now,
  });
  const classification = classifyDelta(input.delta);
  const cadence = session.cadence;
  const shouldSurface =
    session.status === "active" &&
    cadence !== "off" &&
    (
      cadence === "continuous_debug" ||
      cadence === "active_dialogue" ||
      (!classification.routine && cadence === "milestones_only") ||
      (!classification.routine && cadence === "anomalies_and_milestones") ||
      (classification.reason === "window_summary" && cadence === "windowed_companion")
    );
  const decision: LiveCommentaryDecision =
    !shouldSurface
      ? "silent_keep_in_context"
      : environment.mode === "voice_on_confirm"
        ? "voice_on_confirm"
        : "show_text";
  const userVisible = decision === "show_text" || decision === "voice_on_confirm";
  const proposalId = `live_commentary_proposal:${hashShort([session.session_id, input.delta.delta_id, cadence, classification.text], 18)}`;
  const candidateDecision: LiveCommentaryCandidateDecision =
    !shouldSurface
      ? "suppress"
      : environment.mode === "voice_on_confirm"
        ? "voice_on_confirm"
        : "show_text";
  const candidate: LiveCommentaryCandidate = {
    schema: HELIX_LIVE_COMMENTARY_CANDIDATE_SCHEMA,
    candidate_id: `live_commentary_candidate:${hashShort([session.session_id, input.delta.delta_id, cadence, classification.text], 18)}`,
    environment_id: session.environment_id,
    thread_id: session.thread_id,
    source_event_ids: uniqueStrings(environment.lines.flatMap((line: LiveAnswerLineState) => line.source_event_ids ?? [])).slice(-24),
    line_keys: input.delta.changed_line_keys,
    trigger:
      classification.reason === "prime_found" || classification.reason === "stability_reached"
        ? "milestone"
        : classification.reason === "anomaly_detected"
          ? "anomaly"
          : classification.reason === "window_summary"
            ? "window_summary"
            : "line_update",
    text: classification.text,
    rationale: shouldSurface
      ? `${classification.reason} passed ${cadence} commentary policy.`
      : `${classification.reason} suppressed by ${cadence} commentary policy.`,
    priority: classification.priority,
    mode: cadence,
    decision: candidateDecision,
    evidence_refs: uniqueStrings(input.delta.evidence_refs).slice(-24),
    model_invoked: false,
    deterministic: true,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
    created_at: now,
  };
  candidatesByEnvironment.set(session.environment_id, [
    ...(candidatesByEnvironment.get(session.environment_id) ?? []),
    candidate,
  ].slice(-80));
  const traceSteps = buildTraceSteps({
    proposalId,
    session,
    delta: input.delta,
    decision,
    classification,
    shouldSurface,
    now,
  });
  const proposal: LiveCommentaryProposal = {
    schema: HELIX_LIVE_COMMENTARY_PROPOSAL_SCHEMA,
    proposal_id: proposalId,
    session_id: session.session_id,
    thread_id: session.thread_id,
    environment_id: session.environment_id,
    delta_id: input.delta.delta_id,
    turn_id: null,
    decision,
    priority: classification.priority,
    text: classification.text,
    voice_text: decision === "voice_on_confirm" ? classification.text : null,
    reason: shouldSurface && classification.routine ? "continuous_debug" : classification.reason,
    cadence,
    evidence_refs: uniqueStrings(input.delta.evidence_refs).slice(-24),
    dedupe_key: `live_commentary:${session.environment_id}:${classification.reason}:${hashShort(classification.text, 8)}`,
    cooldown_ms: classification.routine ? 5000 : 15000,
    model_invoked: false,
    deterministic: true,
    user_visible: userVisible,
    trace_steps: traceSteps,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
    ts: now,
  };
  proposalsByEnvironment.set(session.environment_id, [
    ...(proposalsByEnvironment.get(session.environment_id) ?? []),
    proposal,
  ].slice(-80));
  return { session, proposal };
}

export function appendVisibleLiveCommentaryTurn(input: {
  session: LiveCommentarySession;
  proposal: LiveCommentaryProposal;
  delta: LiveAnswerEnvironmentDelta;
  route?: "/ask" | "/ask/conversation-turn";
  sessionId?: string | null;
  traceId?: string | null;
}): { turn_id: string; item_ids: string[] } {
  const route = input.route ?? "/ask";
  const ts = input.proposal.ts;
  const turnId = `live_commentary_turn:${hashShort([input.session.thread_id, input.proposal.proposal_id], 16)}`;
  const observationItemId = `live_commentary_observation:${hashShort([turnId, "delta"], 12)}`;
  const proposalItemId = `live_commentary_proposal:${hashShort([turnId, "proposal"], 12)}`;
  appendHelixThreadEvent({
    route,
    event_type: "turn_started",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    turn_kind: "auxiliary",
    meta: {
      kind: "live_commentary",
      visibility: "standby_trace",
      environment_id: input.session.environment_id,
      cadence: input.session.cadence,
      model_invoked: false,
      context_policy: "compact_context_pack_only",
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_started",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    item_id: observationItemId,
    item_type: "toolObservation",
    item_status: "in_progress",
    item_stream: "observation",
    meta: {
      kind: "live_commentary_delta_observation",
      model_invoked: false,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_completed",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    item_id: observationItemId,
    item_type: "toolObservation",
    item_status: "completed",
    item_stream: "observation",
    observation_ref: {
      schema: "helix.live_commentary_delta_observation.v1",
      delta_id: input.delta.delta_id,
      environment_id: input.delta.environment_id,
      changed_line_keys: input.delta.changed_line_keys,
      evidence_refs: input.delta.evidence_refs,
      raw_logs_included: false,
      context_role: "observation_not_assistant_answer",
    },
    meta: {
      kind: "live_commentary_delta_observation",
      model_invoked: false,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_started",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    item_id: proposalItemId,
    item_type: "validation",
    item_status: "in_progress",
    item_stream: "observation",
    meta: {
      kind: "live_commentary_proposal",
      primary_user_visible: input.proposal.user_visible,
      model_invoked: false,
      decision: input.proposal.decision,
      cadence: input.proposal.cadence,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_completed",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    item_id: proposalItemId,
    item_type: "validation",
    item_status: "completed",
    item_stream: "observation",
    observation_ref: {
      ...input.proposal,
      turn_id: turnId,
      context_role: "observation_not_assistant_answer",
      safe_for_future_context: true,
    },
    meta: {
      kind: "live_commentary_proposal",
      primary_user_visible: input.proposal.user_visible,
      model_invoked: false,
      decision: input.proposal.decision,
      cadence: input.proposal.cadence,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "turn_completed",
    thread_id: input.session.thread_id,
    turn_id: turnId,
    session_id: input.sessionId ?? input.session.thread_id,
    trace_id: input.traceId ?? null,
    turn_kind: "auxiliary",
    meta: {
      kind: "live_commentary",
      visibility: "standby_trace",
      decision: input.proposal.decision,
      model_invoked: false,
    },
    ts,
  });
  sessionsByEnvironment.set(input.session.environment_id, {
    ...input.session,
    last_commentary_turn_id: turnId,
    updated_at: ts,
  });
  const proposals = proposalsByEnvironment.get(input.session.environment_id) ?? [];
  proposalsByEnvironment.set(input.session.environment_id, proposals.map((proposal: LiveCommentaryProposal) =>
    proposal.proposal_id === input.proposal.proposal_id ? { ...proposal, turn_id: turnId } : proposal,
  ));
  return { turn_id: turnId, item_ids: [observationItemId, proposalItemId] };
}

export function recordLiveCommentaryForDelta(input: {
  delta: LiveAnswerEnvironmentDelta;
  cadence?: string | null;
  appendThread?: boolean;
  sessionId?: string | null;
  traceId?: string | null;
}): {
  session: LiveCommentarySession;
  proposal: LiveCommentaryProposal;
  delivery: LiveCommentaryDeliveryReceipt;
  turn_id?: string | null;
} {
  const { session, proposal } = buildLiveCommentaryProposal({
    delta: input.delta,
    cadence: input.cadence,
  });
  const delivery = storeDeliveryReceipt(buildDeliveryReceipt(proposal));
  const shouldAppendThread = input.appendThread !== false && (proposal.user_visible || proposal.cadence === "continuous_debug");
  const turn = !shouldAppendThread
    ? null
    : appendVisibleLiveCommentaryTurn({
        session,
        proposal,
        delta: input.delta,
        sessionId: input.sessionId,
        traceId: input.traceId,
      });
  return {
    session: getLiveCommentarySessionForEnvironment(session.environment_id) ?? session,
    proposal,
    delivery,
    turn_id: turn?.turn_id ?? null,
  };
}

export function resetLiveCommentary(): void {
  sessionsByEnvironment.clear();
  candidatesByEnvironment.clear();
  proposalsByEnvironment.clear();
  deliveriesByEnvironment.clear();
}
