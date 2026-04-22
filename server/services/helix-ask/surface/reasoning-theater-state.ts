import crypto from "node:crypto";

import type { HelixAskTraceEvent } from "./response-debug-payload";

export type HelixAskReasoningTheaterPhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";

export type HelixAskReasoningTheaterStance = "winning" | "contested" | "losing" | "fail_closed";

export type HelixAskReasoningTheaterArchetype =
  | "ambiguity"
  | "missing_evidence"
  | "coverage_gap"
  | "contradiction"
  | "overload";

export type HelixAskReasoningTheaterCertaintyClass =
  | "confirmed"
  | "reasoned"
  | "hypothesis"
  | "unknown";

export type HelixAskReasoningTheaterSuppressionReason =
  | "context_ineligible"
  | "dedupe_cooldown"
  | "mission_rate_limited"
  | "voice_rate_limited"
  | "voice_budget_exceeded"
  | "voice_backend_error"
  | "missing_evidence"
  | "contract_violation"
  | "agi_overload_admission_control";

export type HelixAskReasoningTheaterStateV1 = {
  contract_version: "reasoning_theater.v1";
  trace_id: string;
  mission_id?: string;
  event_id?: string;
  phase: HelixAskReasoningTheaterPhase;
  archetype: HelixAskReasoningTheaterArchetype;
  certainty_class: HelixAskReasoningTheaterCertaintyClass;
  suppression_reason: HelixAskReasoningTheaterSuppressionReason | null;
  telemetry: {
    evidence_gate_ok: boolean | null;
    coverage_ratio: number | null;
    evidence_claim_ratio: number | null;
    belief_unsupported_rate: number | null;
    belief_contradictions: number | null;
    ambiguity_term_count: number;
    graph_block_ratio: number | null;
    graph_cross_tree_ratio: number | null;
    alignment_margin: number | null;
    alignment_decision: "PASS" | "BORDERLINE" | "FAIL" | null;
    event_latency_ms_p95: number | null;
    suppression_active: boolean;
    proof_verdict: "PASS" | "FAIL" | null;
    certificate_integrity_ok: boolean | null;
  };
  indices: {
    momentum: number;
    ambiguity_pressure: number;
    battle_index: number;
  };
  stance: HelixAskReasoningTheaterStance;
  scenario_id: string;
  seed: number;
  ts: string;
};

const SUPPRESSION_REASON_ORDER: HelixAskReasoningTheaterSuppressionReason[] = [
  "context_ineligible",
  "dedupe_cooldown",
  "mission_rate_limited",
  "voice_rate_limited",
  "voice_budget_exceeded",
  "voice_backend_error",
  "missing_evidence",
  "contract_violation",
  "agi_overload_admission_control",
];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const clampSigned = (value: number, min = -1, max = 1): number => Math.max(min, Math.min(max, value));
const toFixed3 = (value: number): number => Number(value.toFixed(3));

const coerceString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const coerceBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const coerceNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const coerceRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const coerceStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const normalizeAlignmentDecision = (value: unknown): "PASS" | "BORDERLINE" | "FAIL" | null => {
  const text = coerceString(value)?.toUpperCase() ?? "";
  if (text === "PASS" || text === "BORDERLINE" || text === "FAIL") return text;
  return null;
};

const normalizeProofVerdict = (value: unknown): "PASS" | "FAIL" | null => {
  const text = coerceString(value)?.toUpperCase() ?? "";
  if (text === "PASS" || text === "FAIL") return text;
  return null;
};

const extractSuppressionReason = (
  debugRecord: Record<string, unknown>,
  traceEvents: HelixAskTraceEvent[],
): HelixAskReasoningTheaterSuppressionReason | null => {
  const direct = coerceString(debugRecord.suppression_reason);
  if (direct && SUPPRESSION_REASON_ORDER.includes(direct as HelixAskReasoningTheaterSuppressionReason)) {
    return direct as HelixAskReasoningTheaterSuppressionReason;
  }
  for (let index = traceEvents.length - 1; index >= 0; index -= 1) {
    const event = traceEvents[index];
    const eventMeta = coerceRecord(event.meta);
    const eventSuppression = coerceString(eventMeta?.suppression_reason);
    if (
      eventSuppression &&
      SUPPRESSION_REASON_ORDER.includes(eventSuppression as HelixAskReasoningTheaterSuppressionReason)
    ) {
      return eventSuppression as HelixAskReasoningTheaterSuppressionReason;
    }
    const eventText = `${event.stage ?? ""} ${event.detail ?? ""} ${event.text ?? ""}`.toLowerCase();
    for (const candidate of SUPPRESSION_REASON_ORDER) {
      if (eventText.includes(candidate)) return candidate;
    }
  }
  return null;
};

const resolvePhase = (
  debugRecord: Record<string, unknown>,
  traceEvents: HelixAskTraceEvent[],
): HelixAskReasoningTheaterPhase => {
  const phases: Array<{ token: RegExp; phase: HelixAskReasoningTheaterPhase }> = [
    { token: /\b(observe|scout|triage|intake)\b/i, phase: "observe" },
    { token: /\b(plan|policy|routing|objective)\b/i, phase: "plan" },
    { token: /\b(retrieve|retrieval|search|repo search|collect)\b/i, phase: "retrieve" },
    { token: /\b(gate|alignment|coverage|evidence gate|quality floor)\b/i, phase: "gate" },
    { token: /\b(synth|assemble|composer|compose)\b/i, phase: "synthesize" },
    { token: /\b(verify|proof|certificate|integrity)\b/i, phase: "verify" },
    { token: /\b(execute|dispatch|action)\b/i, phase: "execute" },
    { token: /\b(finalization|finalize|debrief|answer ready|response_ready)\b/i, phase: "debrief" },
  ];
  const answerPath = coerceStringArray(debugRecord.answer_path).join(" ");
  for (let index = traceEvents.length - 1; index >= 0; index -= 1) {
    const event = traceEvents[index];
    const signal = `${event.stage ?? ""} ${event.detail ?? ""} ${event.tool ?? ""}`.trim();
    for (const candidate of phases) {
      if (candidate.token.test(signal)) return candidate.phase;
    }
  }
  for (const candidate of phases) {
    if (candidate.token.test(answerPath)) return candidate.phase;
  }
  return "observe";
};

const p95 = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const ordered = values.slice().sort((left, right) => left - right);
  const index = Math.min(ordered.length - 1, Math.ceil(0.95 * ordered.length) - 1);
  return ordered[index] ?? null;
};

export const buildHelixAskReasoningTheaterStateFromDebug = (args: {
  debugRecord: Record<string, unknown>;
  traceEvents: HelixAskTraceEvent[];
}): HelixAskReasoningTheaterStateV1 => {
  const { debugRecord, traceEvents } = args;
  const traceId = coerceString(debugRecord.trace_id) ?? "unknown-trace";
  const missionId = coerceString(debugRecord.mission_id) ?? undefined;
  const lastEvent = traceEvents[traceEvents.length - 1];
  const ts = coerceString(lastEvent?.ts) ?? new Date().toISOString();
  const eventId = coerceString(lastEvent?.meta?.event_id) ?? coerceString(lastEvent?.meta?.id) ?? undefined;

  const evidenceGateOk = coerceBoolean(debugRecord.evidence_gate_ok);
  const coverageRatio = coerceNumber(debugRecord.coverage_ratio);
  const evidenceClaimRatio = coerceNumber(debugRecord.evidence_claim_ratio);
  const beliefUnsupportedRate = coerceNumber(debugRecord.belief_unsupported_rate);
  const beliefContradictions = coerceNumber(debugRecord.belief_contradictions);
  const ambiguityTermCount = coerceStringArray(debugRecord.ambiguity_terms).length;
  const graphDiagnostics = coerceRecord(debugRecord.graph_congruence_diagnostics);
  const blockedEdges = coerceNumber(graphDiagnostics?.blockedEdges);
  const allowedEdges = coerceNumber(graphDiagnostics?.allowedEdges);
  const resolvedCrossTreeEdges = coerceNumber(graphDiagnostics?.resolvedCrossTreeEdges);
  const resolvedInTreeEdges = coerceNumber(graphDiagnostics?.resolvedInTreeEdges);
  const edgeTotal =
    (blockedEdges ?? 0) + (allowedEdges ?? 0) > 0 ? (blockedEdges ?? 0) + (allowedEdges ?? 0) : null;
  const graphBlockRatio = edgeTotal ? clamp01((blockedEdges ?? 0) / edgeTotal) : null;
  const resolvedTotal =
    (resolvedCrossTreeEdges ?? 0) + (resolvedInTreeEdges ?? 0) > 0
      ? (resolvedCrossTreeEdges ?? 0) + (resolvedInTreeEdges ?? 0)
      : null;
  const graphCrossTreeRatio = resolvedTotal
    ? clamp01((resolvedCrossTreeEdges ?? 0) / resolvedTotal)
    : null;

  const alignmentDecision = normalizeAlignmentDecision(debugRecord.alignment_gate_decision);
  const alignmentMetrics = coerceRecord(debugRecord.alignment_gate_metrics);
  const alignmentMargin = coerceNumber(alignmentMetrics?.margin);

  let proofVerdict = normalizeProofVerdict(debugRecord.proof_verdict);
  let certificateIntegrityOk = coerceBoolean(debugRecord.certificate_integrity_ok);
  if (!proofVerdict || certificateIntegrityOk === null) {
    for (let index = traceEvents.length - 1; index >= 0; index -= 1) {
      const eventMeta = coerceRecord(traceEvents[index]?.meta);
      const verification = coerceRecord(eventMeta?.verification);
      if (!proofVerdict) {
        proofVerdict = normalizeProofVerdict(verification?.proof_verdict);
      }
      if (certificateIntegrityOk === null) {
        certificateIntegrityOk = coerceBoolean(verification?.certificate_integrity_ok);
      }
      if (proofVerdict && certificateIntegrityOk !== null) break;
    }
  }

  const suppressionReason = extractSuppressionReason(debugRecord, traceEvents);
  const suppressionActive = suppressionReason !== null;
  const phase = resolvePhase(debugRecord, traceEvents);
  const eventLatencyMsP95 = p95(
    traceEvents
      .map((entry) => coerceNumber(entry.durationMs))
      .filter((value): value is number => value !== null),
  );

  const evidence = evidenceGateOk === true ? 1 : 0;
  const coverage = clamp01(coverageRatio ?? 0);
  const claimSupport = clamp01(evidenceClaimRatio ?? 0);
  const unsupported = clamp01(beliefUnsupportedRate ?? 1);
  const contradiction = clamp01((beliefContradictions ?? 0) / 4);
  const ambiguityLoad = clamp01(ambiguityTermCount / 8);
  const graphHealth = clamp01(
    0.6 * (1 - (graphBlockRatio ?? 1)) + 0.4 * (graphCrossTreeRatio ?? 0),
  );
  const alignmentHealth =
    alignmentDecision === "PASS" ? 1 : alignmentDecision === "BORDERLINE" ? 0.5 : alignmentDecision === "FAIL" ? 0 : 0.5;
  const suppressionPenalty = suppressionActive ? 1 : 0;
  const latencyPenalty = clamp01((eventLatencyMsP95 ?? 0) / 4000);
  const proofPass = proofVerdict === "PASS" ? 1 : 0;
  const integrityPenalty = certificateIntegrityOk === false ? 1 : 0;

  const momentum = clamp01(
    0.26 * evidence +
      0.22 * coverage +
      0.16 * claimSupport +
      0.14 * graphHealth +
      0.12 * alignmentHealth +
      0.10 * proofPass,
  );
  const ambiguityPressure = clamp01(
    0.24 * ambiguityLoad +
      0.2 * unsupported +
      0.14 * contradiction +
      0.14 * (1 - coverage) +
      0.1 * suppressionPenalty +
      0.1 * latencyPenalty +
      0.08 * integrityPenalty,
  );
  const battleIndex = clampSigned(momentum - ambiguityPressure);

  const failClosed =
    proofVerdict === "FAIL" ||
    certificateIntegrityOk === false ||
    suppressionReason === "missing_evidence" ||
    suppressionReason === "contract_violation";

  const stance: HelixAskReasoningTheaterStance = failClosed
    ? "fail_closed"
    : battleIndex >= 0.25
      ? "winning"
      : battleIndex <= -0.25
        ? "losing"
        : "contested";

  const archetype: HelixAskReasoningTheaterArchetype =
    suppressionReason === "missing_evidence" || evidenceGateOk === false
      ? "missing_evidence"
      : suppressionReason === "agi_overload_admission_control" ||
          suppressionReason === "mission_rate_limited" ||
          suppressionReason === "dedupe_cooldown" ||
          (eventLatencyMsP95 ?? 0) >= 3500
        ? "overload"
        : (beliefContradictions ?? 0) > 0
          ? "contradiction"
          : (coverageRatio ?? 0) > 0 && (coverageRatio ?? 0) < 0.55
            ? "coverage_gap"
            : "ambiguity";

  const certaintyClass: HelixAskReasoningTheaterCertaintyClass =
    proofVerdict === "PASS" && certificateIntegrityOk !== false
      ? "confirmed"
      : momentum >= 0.55 && ambiguityPressure <= 0.45
        ? "reasoned"
        : momentum >= 0.3
          ? "hypothesis"
          : "unknown";

  const scenarioHash = crypto
    .createHash("sha1")
    .update(
      [
        traceId,
        eventId ?? "",
        phase,
        archetype,
        stance,
        certaintyClass,
        suppressionReason ?? "none",
      ].join("|"),
    )
    .digest("hex");
  const scenarioId = scenarioHash.slice(0, 16);
  const seedHash = crypto.createHash("sha1").update(scenarioId).digest("hex").slice(0, 8);
  const seed = Number.parseInt(seedHash, 16) >>> 0;

  return {
    contract_version: "reasoning_theater.v1",
    trace_id: traceId,
    ...(missionId ? { mission_id: missionId } : {}),
    ...(eventId ? { event_id: eventId } : {}),
    phase,
    archetype,
    certainty_class: certaintyClass,
    suppression_reason: suppressionReason,
    telemetry: {
      evidence_gate_ok: evidenceGateOk,
      coverage_ratio: coverageRatio,
      evidence_claim_ratio: evidenceClaimRatio,
      belief_unsupported_rate: beliefUnsupportedRate,
      belief_contradictions: beliefContradictions,
      ambiguity_term_count: ambiguityTermCount,
      graph_block_ratio: graphBlockRatio === null ? null : toFixed3(graphBlockRatio),
      graph_cross_tree_ratio: graphCrossTreeRatio === null ? null : toFixed3(graphCrossTreeRatio),
      alignment_margin: alignmentMargin,
      alignment_decision: alignmentDecision,
      event_latency_ms_p95: eventLatencyMsP95,
      suppression_active: suppressionActive,
      proof_verdict: proofVerdict,
      certificate_integrity_ok: certificateIntegrityOk,
    },
    indices: {
      momentum: toFixed3(momentum),
      ambiguity_pressure: toFixed3(ambiguityPressure),
      battle_index: toFixed3(battleIndex),
    },
    stance,
    scenario_id: scenarioId,
    seed,
    ts,
  };
};

export const attachHelixAskReasoningTheaterStateToDebug = (args: {
  debugRecord: Record<string, unknown>;
  traceEvents: HelixAskTraceEvent[];
}): void => {
  const state = buildHelixAskReasoningTheaterStateFromDebug(args);
  args.debugRecord.reasoning_theater_state_v1 = state;
};
