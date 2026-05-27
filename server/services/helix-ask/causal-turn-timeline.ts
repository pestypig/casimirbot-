import type {
  HelixCausalTurnEvent,
  HelixCausalTurnStage,
  HelixCausalTurnTimeline,
  HelixCausalTurnProducer,
} from "@shared/helix-causal-turn-timeline";
import { HELIX_CAUSAL_TURN_TIMELINE_SCHEMA } from "@shared/helix-causal-turn-timeline";
import { buildHelixRouteLabelConsistencyAudit } from "./route-label-consistency-audit";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const textHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const artifactId = (artifact: unknown): string | null => {
  const record = readRecord(artifact);
  const payload = readRecord(record?.payload);
  return readString(record?.artifact_id) ?? readString(payload?.artifact_id);
};

const artifactKind = (artifact: unknown): string | null => {
  const record = readRecord(artifact);
  const payload = readRecord(record?.payload);
  return readString(record?.kind) ?? readString(payload?.kind) ?? readString(payload?.schema);
};

const artifactText = (artifact: unknown): string | null => {
  const record = readRecord(artifact);
  const payload = readRecord(record?.payload) ?? record;
  return readString(payload?.text) ?? readString(payload?.answer_text) ?? readString(payload?.visible_text);
};

const artifactRefsByKind = (payload: RecordLike, pattern: RegExp): string[] =>
  readArray(payload.current_turn_artifact_ledger)
    .filter((artifact) => pattern.test([artifactKind(artifact), artifactId(artifact)].filter(Boolean).join(" ")))
    .map(artifactId)
    .filter((ref): ref is string => Boolean(ref));

const latestArtifactRefByKind = (payload: RecordLike, pattern: RegExp): string | null => {
  const refs = artifactRefsByKind(payload, pattern);
  return refs[refs.length - 1] ?? null;
};

const inferFallbackRule = (text: string | null): {
  rule_id: string;
  source_file: string;
  matched_text_hash: string;
} | null => {
  if (!text) return null;
  if (/proton has about 1836 times the electron/i.test(text)) {
    return {
      rule_id: "model_only_fallback.electron_proton_comparison",
      source_file: "server/routes/agi.plan.ts",
      matched_text_hash: textHash("electron proton charge mass"),
    };
  }
  if (/An electron is a fundamental subatomic particle/i.test(text)) {
    return {
      rule_id: "model_only_fallback.generic_electron",
      source_file: "server/routes/agi.plan.ts",
      matched_text_hash: textHash("electron"),
    };
  }
  return null;
};

export function appendHelixCausalTurnEvent(input: {
  payload: RecordLike;
  event: Omit<HelixCausalTurnEvent, "schema" | "turn_id" | "sequence" | "assistant_answer" | "raw_content_included">;
}): RecordLike {
  const turnId = readString(input.payload.turn_id) ?? "unknown";
  const existing = readRecord(input.payload.causal_turn_timeline);
  const events = readArray(existing?.events) as HelixCausalTurnEvent[];
  const event: HelixCausalTurnEvent = {
    schema: "helix.causal_turn_event.v1",
    turn_id: turnId,
    sequence: events.length + 1,
    assistant_answer: false,
    raw_content_included: false,
    ...input.event,
  };
  input.payload.causal_turn_timeline = {
    schema: HELIX_CAUSAL_TURN_TIMELINE_SCHEMA,
    turn_id: turnId,
    events: [...events, event],
    integrity: {
      ok: true,
      missing_created_by_event_refs: [],
      terminal_without_selected_event: false,
      visible_without_terminal_event: false,
      stale_route_label_detected: false,
      deterministic_fallback_without_rule_id: false,
    },
    assistant_answer: false,
    raw_content_included: false,
  } satisfies HelixCausalTurnTimeline;
  return input.payload;
}

export function annotateArtifactWithCausalEvent<T extends RecordLike>(
  artifact: T,
  eventId: string,
): T & { created_by_event_id: string } {
  const payload = readRecord(artifact.payload);
  return {
    ...artifact,
    created_by_event_id: eventId,
    ...(payload ? { payload: { ...payload, created_by_event_id: eventId } } : {}),
  } as T & { created_by_event_id: string };
}

function makeEventFactory(turnId: string) {
  const events: HelixCausalTurnEvent[] = [];
  return {
    push(input: {
      stage: HelixCausalTurnStage;
      producer: HelixCausalTurnProducer;
      input_refs?: string[];
      output_refs?: string[];
      decision?: string;
      status?: HelixCausalTurnEvent["status"];
      reason_code?: string;
      route_label?: string | null;
      canonical_goal_kind?: string | null;
      source_target?: string | null;
      selected_capability?: string | null;
      fallback?: HelixCausalTurnEvent["fallback"];
      terminal?: HelixCausalTurnEvent["terminal"];
      rejected?: HelixCausalTurnEvent["rejected"];
      supersedes_event_ids?: string[];
      public_summary?: string;
    }): HelixCausalTurnEvent {
      const event: HelixCausalTurnEvent = {
        schema: "helix.causal_turn_event.v1",
        turn_id: turnId,
        event_id: `${turnId}:causal:${String(events.length + 1).padStart(3, "0")}:${input.stage}`,
        sequence: events.length + 1,
        stage: input.stage,
        producer: input.producer,
        timestamp_ms: Date.now(),
        input_refs: input.input_refs ?? [],
        output_refs: input.output_refs ?? [],
        decision: input.decision,
        status: input.status,
        reason_code: input.reason_code,
        route_label: input.route_label ?? undefined,
        canonical_goal_kind: input.canonical_goal_kind ?? undefined,
        source_target: input.source_target ?? undefined,
        selected_capability: input.selected_capability ?? undefined,
        fallback: input.fallback,
        terminal: input.terminal,
        rejected: input.rejected,
        supersedes_event_ids: input.supersedes_event_ids,
        public_summary: input.public_summary,
        assistant_answer: false,
        raw_content_included: false,
      };
      events.push(event);
      return event;
    },
    events,
  };
}

export function getHelixCausalTurnTimeline(payload: RecordLike): HelixCausalTurnTimeline {
  const turnId = readString(payload.turn_id) ?? readString(readRecord(payload.canonical_goal_frame)?.turn_id) ?? "unknown";
  const factory = makeEventFactory(turnId);
  const routeAudit = buildHelixRouteLabelConsistencyAudit({ turnId, payload });
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const sourceTarget = readRecord(payload.source_target_intent);
  const agentStep = readRecord(payload.agent_step_decision);
  const modelDecision = readRecord(agentStep?.model_decision);
  const terminalWriter = readRecord(payload.terminal_authority_single_writer);
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const solver = readRecord(payload.solver_controller_decision);
  const coverage = readRecord(payload.compound_prompt_coverage_gate);
  const goal = readRecord(payload.goal_satisfaction_evaluation);
  const selectedCapability = readString(modelDecision?.chosen_capability) ?? readString(agentStep?.chosen_capability);
  const routeLabel = readString(payload.route_reason_code) ?? readString(payload.route);
  const directAnswerRef = latestArtifactRefByKind(payload, /direct_answer_text|helix\.direct_answer_text\.v1/);
  const finalDraftRef = latestArtifactRefByKind(payload, /final_answer_draft|helix\.final_answer_draft\.v1/);
  const toolObservationRefs = artifactRefsByKind(payload, /agent_step_observation_packet|workspace_action_receipt|workstation_tool_evaluation|tool_observation/);
  const repoEvidenceRefs = artifactRefsByKind(payload, /repo_code_evidence_observation|repo_search|repo_code/);
  const repoDocsSynthesisPacketRef = latestArtifactRefByKind(payload, /repo_docs_synthesis_packet|helix\.repo_docs_synthesis_packet\.v1/);
  const repoAnswerQualityGateRef = latestArtifactRefByKind(payload, /repo_answer_text_quality_gate|helix\.repo_answer_text_quality_gate\.v1/);
  const repoRepairRef = latestArtifactRefByKind(payload, /repo_evidence_synthesis_repair_observation|repo_docs_synthesis_repair/);
  const repoAnswerRef = latestArtifactRefByKind(payload, /repo_code_evidence_answer|helix\.repo_code_evidence_answer\.v1/);
  const modelStepSynthesizesRepoEvidence = Boolean(selectedCapability && /synthesize_from_repo_evidence/i.test(selectedCapability));

  factory.push({
    stage: "prompt_received",
    producer: "user",
    output_refs: ["active_prompt"],
    status: "succeeded",
  });
  if (canonicalGoal) {
    factory.push({
      stage: "goal_classified",
      producer: "prompt_interpreter",
      output_refs: ["canonical_goal_frame"],
      decision: readString(canonicalGoal.goal_kind) ?? undefined,
      canonical_goal_kind: readString(canonicalGoal.goal_kind),
      status: "succeeded",
    });
  }
  if (sourceTarget) {
    factory.push({
      stage: "source_target_decided",
      producer: "route_classifier",
      output_refs: ["source_target_intent"],
      decision: readString(sourceTarget.target_source) ?? readString(sourceTarget.target_kind) ?? undefined,
      source_target: readString(sourceTarget.target_source) ?? readString(sourceTarget.target_kind),
      status: "succeeded",
    });
  }
  if (routeLabel) {
    factory.push({
      stage: "route_label_set",
      producer: "route_classifier",
      output_refs: ["route_reason_code"],
      decision: routeLabel,
      route_label: routeLabel,
      status: routeAudit.stale_route_label_detected ? "superseded" : "succeeded",
      reason_code: routeAudit.stale_route_label_detected ? "stale_route_label" : undefined,
    });
  }
  if (payload.tool_surface_packet || payload.available_capabilities || payload.initial_available_capabilities) {
    factory.push({
      stage: "tool_surface_built",
      producer: "tool_surface_builder",
      input_refs: ["canonical_goal_frame"],
      output_refs: ["tool_surface_packet", "available_capabilities", "initial_available_capabilities"],
      status: "succeeded",
    });
  }
  if (repoEvidenceRefs.length > 0 && modelStepSynthesizesRepoEvidence) {
    factory.push({
      stage: "repo_evidence_observation_created",
      producer: "repo_retrieval",
      input_refs: ["repo_code.search_concept", "current_turn_artifact_ledger"],
      output_refs: repoEvidenceRefs,
      status: "succeeded",
    });
  }
  if (repoDocsSynthesisPacketRef || payload.repo_docs_synthesis_packet) {
    factory.push({
      stage: "repo_docs_synthesis_packet_created",
      producer: "repo_retrieval",
      input_refs: repoEvidenceRefs,
      output_refs: [repoDocsSynthesisPacketRef ?? "repo_docs_synthesis_packet"],
      status: "succeeded",
      public_summary: "Repo/docs evidence was compacted into a model-facing synthesis packet.",
    });
  }
  if (agentStep) {
    factory.push({
      stage: "model_step_decided",
      producer: "model",
      input_refs: ["available_capabilities", "current_turn_artifact_ledger"],
      output_refs: ["agent_step_decision"],
      decision: readString(modelDecision?.next_step) ?? readString(agentStep.next_step) ?? undefined,
      selected_capability: selectedCapability,
      model_step_capability: selectedCapability,
      status: "succeeded",
    });
  }
  if (directAnswerRef || finalDraftRef) {
    const directArtifact = readArray(payload.current_turn_artifact_ledger).find((artifact) => artifactId(artifact) === directAnswerRef);
    const fallback = inferFallbackRule(artifactText(directArtifact));
    if (fallback) {
      factory.push({
        stage: "deterministic_fallback_used",
        producer: "deterministic_fallback",
        input_refs: ["active_prompt"],
        output_refs: [directAnswerRef].filter((ref): ref is string => Boolean(ref)),
        status: "succeeded",
        reason_code: fallback.rule_id,
        fallback: {
          used: true,
          ...fallback,
          output_ref: directAnswerRef ?? undefined,
        },
      });
    }
    factory.push({
      stage: "model_answer_artifact_created",
      producer: fallback ? "deterministic_fallback" : "model",
      input_refs: ["agent_step_decision"],
      output_refs: [directAnswerRef, finalDraftRef].filter((ref): ref is string => Boolean(ref)),
      selected_capability: selectedCapability,
      status: "succeeded",
    });
  }
  if (toolObservationRefs.length > 0) {
    factory.push({
      stage: "tool_observation_created",
      producer: "runtime_tool",
      input_refs: ["runtime_tool_call", "workspace_action"],
      output_refs: toolObservationRefs,
      status: "succeeded",
      public_summary: "Tool/runtime results were recorded as observations, not terminal answers.",
    });
  }
  if (repoEvidenceRefs.length > 0) {
    if (!modelStepSynthesizesRepoEvidence) {
      factory.push({
        stage: "repo_evidence_observation_created",
        producer: "repo_retrieval",
        input_refs: ["agent_step_decision"],
        output_refs: repoEvidenceRefs,
        status: "succeeded",
      });
    }
  }
  if (coverage) {
    factory.push({
      stage: "coverage_gate_evaluated",
      producer: "coverage_gate",
      input_refs: [directAnswerRef, finalDraftRef, ...repoEvidenceRefs].filter((ref): ref is string => Boolean(ref)),
      output_refs: ["compound_prompt_coverage_gate"],
      decision: readString(coverage.decision) ?? (coverage.passed === true ? "PASS" : "FAIL_CLOSED"),
      status: coverage.passed === true ? "succeeded" : "blocked",
      reason_code: readString(coverage.reason) ?? undefined,
    });
  }
  if (payload.repo_answer_text_quality_gate || repoAnswerQualityGateRef) {
    const repoGate = readRecord(payload.repo_answer_text_quality_gate);
    const ok = repoGate?.ok === true;
    factory.push({
      stage: "quality_gate_evaluated",
      producer: "quality_gate",
      input_refs: [finalDraftRef, repoDocsSynthesisPacketRef, ...repoEvidenceRefs].filter((ref): ref is string => Boolean(ref)),
      output_refs: [repoAnswerQualityGateRef ?? "repo_answer_text_quality_gate"],
      decision: ok ? "PASS" : "FAIL_CLOSED",
      status: ok ? "succeeded" : "blocked",
      reason_code: readArray(repoGate?.violations).map(readString).filter(Boolean).join(",") || undefined,
    });
  }
  if (repoRepairRef || payload.repo_evidence_synthesis_repair_observation) {
    factory.push({
      stage: "repo_docs_synthesis_repair_observation_created",
      producer: "quality_gate",
      input_refs: [repoAnswerQualityGateRef ?? "repo_answer_text_quality_gate"],
      output_refs: [repoRepairRef ?? "repo_evidence_synthesis_repair_observation"],
      status: "blocked",
      public_summary: "Repo/docs synthesis failed quality checks and produced a targeted repair observation.",
    });
  }
  if (goal) {
    factory.push({
      stage: "goal_satisfaction_evaluated",
      producer: "goal_satisfaction",
      input_refs: ["current_turn_artifact_ledger", "compound_prompt_coverage_gate"],
      output_refs: ["goal_satisfaction_evaluation"],
      decision: readString(goal.next_decision) ?? readString(goal.satisfaction) ?? undefined,
      status: readString(goal.satisfaction) === "satisfied" ? "succeeded" : "blocked",
      reason_code: readString(goal.reason) ?? undefined,
    });
  }
  if (solver) {
    factory.push({
      stage: "solver_controller_decided",
      producer: "solver_controller",
      input_refs: ["goal_satisfaction_evaluation", "compound_prompt_coverage_gate", "terminal_answer_authority"],
      output_refs: ["solver_controller_decision"],
      decision: readString(solver.decision) ?? undefined,
      status: readString(solver.decision) === "allow_terminal" ? "succeeded" : "blocked",
      reason_code: readArray(solver.blocking_reasons).map(readString).filter(Boolean).join(",") || undefined,
    });
  }
  const payloadTerminalKind = readString(payload.terminal_artifact_kind);
  const authorityTerminalKind = readString(terminalAuthority?.terminal_artifact_kind);
  const writerTerminalKind = readString(terminalWriter?.selected_terminal_artifact_kind);
  const terminalErrorCode =
    readString(payload.terminal_error_code) ??
    readString(terminalAuthority?.terminal_error_code);
  const selectedKind = terminalErrorCode
    ? payloadTerminalKind ?? authorityTerminalKind ?? writerTerminalKind
    : writerTerminalKind ?? authorityTerminalKind ?? payloadTerminalKind;
  const selectedRef = readString(terminalWriter?.selected_terminal_artifact_ref) ??
    (selectedKind === "direct_answer_text" ? directAnswerRef : selectedKind === "model_synthesized_answer" ? finalDraftRef : null);
  if (selectedKind) {
    if (repoAnswerRef && selectedKind === "repo_code_evidence_answer") {
      factory.push({
        stage: "terminal_artifact_materialized",
        producer: "terminal_authority",
        input_refs: [finalDraftRef, repoAnswerQualityGateRef, repoDocsSynthesisPacketRef].filter((ref): ref is string => Boolean(ref)),
        output_refs: [repoAnswerRef],
        decision: "repo_code_evidence_answer",
        status: "succeeded",
      });
    }
    factory.push({
      stage: "terminal_artifact_selected",
      producer: "terminal_authority",
      input_refs: ["solver_controller_decision", selectedRef].filter((ref): ref is string => Boolean(ref)),
      output_refs: ["terminal_answer_authority", "terminal_authority_single_writer"].filter((ref) => Boolean(payload[ref])),
      decision: selectedKind,
      status: "succeeded",
      terminal: {
        selected_terminal_artifact_kind: selectedKind,
        selected_terminal_artifact_ref: selectedRef ?? undefined,
        visible_text_hash: readString(terminalAuthority?.terminal_text_hash) ?? undefined,
      },
      rejected: routeAudit.stale_route_label_detected
        ? [{ artifact_kind: "route_label", reason: "stale_route_label" }]
        : undefined,
    });
  }
  const visibleText = readString(payload.selected_final_answer) ?? readString(payload.answer) ?? readString(payload.text);
  if (visibleText) {
    factory.push({
      stage: "visible_response_written",
      producer: "terminal_authority",
      input_refs: ["terminal_answer_authority", selectedRef].filter((ref): ref is string => Boolean(ref)),
      output_refs: ["selected_final_answer", "answer", "text"],
      status: "succeeded",
      terminal: {
        selected_terminal_artifact_kind: selectedKind ?? undefined,
        selected_terminal_artifact_ref: selectedRef ?? undefined,
        visible_text_hash: textHash(visibleText),
      },
    });
  }
  factory.push({
    stage: "debug_export_written",
    producer: "debug_export",
    input_refs: ["causal_turn_timeline"],
    output_refs: ["debug_export"],
    status: "succeeded",
  });

  const missingCreatedByEventRefs = readArray(payload.current_turn_artifact_ledger)
    .filter((artifact) => {
      const record = readRecord(artifact);
      const scope = readString(record?.source_scope);
      return scope !== "prior_context" && scope !== "prior_turn_context" && scope !== "prior_artifact" && !readString(record?.created_by_event_id);
    })
    .map((artifact) => artifactId(artifact))
    .filter((ref): ref is string => Boolean(ref));
  const terminalWithoutSelectedEvent = Boolean(selectedKind && !factory.events.some((event) => event.stage === "terminal_artifact_selected"));
  const visibleWithoutTerminalEvent = Boolean(visibleText && !factory.events.some((event) => event.stage === "visible_response_written"));
  const deterministicFallbackWithoutRuleId = factory.events.some((event) =>
    event.stage === "deterministic_fallback_used" && !event.fallback?.rule_id
  );

  return {
    schema: HELIX_CAUSAL_TURN_TIMELINE_SCHEMA,
    turn_id: turnId,
    events: factory.events,
    integrity: {
      ok: !terminalWithoutSelectedEvent && !visibleWithoutTerminalEvent && !deterministicFallbackWithoutRuleId,
      missing_created_by_event_refs: missingCreatedByEventRefs,
      terminal_without_selected_event: terminalWithoutSelectedEvent,
      visible_without_terminal_event: visibleWithoutTerminalEvent,
      stale_route_label_detected: routeAudit.stale_route_label_detected,
      deterministic_fallback_without_rule_id: deterministicFallbackWithoutRuleId,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildHelixCausalTurnTimelineSummary(input: {
  payload: RecordLike;
  timeline: HelixCausalTurnTimeline;
}): RecordLike {
  const terminalEvent = [...input.timeline.events].reverse().find((event) => event.stage === "terminal_artifact_selected");
  const visibleEvent = [...input.timeline.events].reverse().find((event) => event.stage === "visible_response_written");
  const modelEvent = input.timeline.events.find((event) => event.stage === "model_step_decided");
  const fallbackEvent = input.timeline.events.find((event) => event.stage === "deterministic_fallback_used");
  return {
    outcome: readString(input.payload.terminal_error_code) ? "terminal_error" : "terminal_selected",
    terminal_event_id: terminalEvent?.event_id ?? null,
    visible_event_id: visibleEvent?.event_id ?? null,
    selected_terminal_artifact_kind: terminalEvent?.terminal?.selected_terminal_artifact_kind ?? null,
    selected_capability: modelEvent?.selected_capability ?? null,
    deterministic_fallback_used: Boolean(fallbackEvent),
    fallback_rule_id: fallbackEvent?.fallback?.rule_id ?? null,
    stale_route_label_detected: input.timeline.integrity.stale_route_label_detected,
    stale_route_label: input.timeline.integrity.stale_route_label_detected
      ? readString(input.payload.route_reason_code) ?? readString(input.payload.route)
      : null,
    superseded_by: input.timeline.integrity.stale_route_label_detected
      ? terminalEvent?.event_id ?? null
      : null,
  };
}
