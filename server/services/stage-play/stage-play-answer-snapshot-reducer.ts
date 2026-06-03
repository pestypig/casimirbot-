import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type {
  StagePlayBadgeEdgeV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeSourceRefV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";

export type AskTurnDebugExport = Record<string, unknown> & {
  schema?: "helix.ask.debug_export.v1" | string;
  active_turn_id?: string | null;
  backend_turn_id?: string | null;
  selected_final_answer?: string | null;
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  ask_turn_solver_trace?: Record<string, unknown> | null;
  terminal_answer_authority?: Record<string, unknown> | null;
  final_answer_draft?: Record<string, unknown> | null;
  current_turn_artifact_ledger?: unknown[];
};

export type BuildStagePlayAnswerSnapshotInput = {
  graph: StagePlayBadgeGraphV1;
  askTurnDebug?: AskTurnDebugExport | null;
  liveAnswerEnvironment?: LiveAnswerEnvironment | null;
  generatedAt?: string;
};

export type StagePlayAnswerSnapshotReducerOutput = {
  checkpointBadge: StagePlayBadgeV1;
  answerSnapshotBadge: StagePlayBadgeV1 | null;
  liveOutputBadge: StagePlayBadgeV1 | null;
  missingCheckBadge: StagePlayBadgeV1 | null;
  badges: StagePlayBadgeV1[];
  edges: StagePlayBadgeEdgeV1[];
};

type RecordLike = Record<string, unknown>;

const MODEL_AUTHORED_TERMINAL_KINDS = new Set([
  "direct_answer_text",
  "model_synthesized_answer",
]);

const MODEL_AUTHORED_FINAL_SOURCES = new Set([
  "final_answer_draft",
  "model_direct_answer",
]);

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const compactText = (value: string, limit = 520): string => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}...`;
};

const unwrapDebug = (value: AskTurnDebugExport | null | undefined): RecordLike | null => {
  if (!isRecord(value)) return null;
  const payload = isRecord(value.payload) ? value.payload : null;
  return payload?.schema === "helix.ask.debug_export.v1" ? payload : value;
};

const ledger = (debug: RecordLike | null): RecordLike[] =>
  Array.isArray(debug?.current_turn_artifact_ledger)
    ? debug.current_turn_artifact_ledger.map((entry) => isRecord(entry) ? entry : null).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const artifactKind = (artifact: RecordLike): string | null =>
  readString(artifact.kind) ?? readString(artifact.artifact_kind) ?? readString(isRecord(artifact.payload) ? artifact.payload.kind : null);

const artifactId = (artifact: RecordLike): string | null =>
  readString(artifact.artifact_id) ??
  readString(artifact.ref) ??
  readString(artifact.id) ??
  readString(isRecord(artifact.payload) ? artifact.payload.artifact_id : null);

const artifactPayload = (artifact: RecordLike): RecordLike =>
  isRecord(artifact.payload) ? artifact.payload : artifact;

const findLatestArtifactPayload = (debug: RecordLike | null, pattern: RegExp): { id: string | null; payload: RecordLike } | null => {
  const artifacts = ledger(debug);
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    const kind = artifactKind(artifact);
    const payload = artifactPayload(artifact);
    const schema = readString(payload.schema);
    if ((kind && pattern.test(kind)) || (schema && pattern.test(schema))) {
      return {
        id: artifactId(artifact) ?? artifactId(payload),
        payload,
      };
    }
  }
  return null;
};

const collectToolObservationRefs = (debug: RecordLike | null): string[] =>
  ledger(debug)
    .filter((artifact) => {
      const kind = artifactKind(artifact) ?? "";
      const payload = artifactPayload(artifact);
      const schema = readString(payload.schema) ?? "";
      return /live_environment_tool_observation|runtime_tool_call|agent_step_observation_packet|workstation_tool_evaluation|tool_evaluation/i.test(`${kind} ${schema}`);
    })
    .map((artifact) => artifactId(artifact) ?? readString(artifactPayload(artifact).observation_id))
    .filter((value): value is string => Boolean(value));

const solverTrace = (debug: RecordLike | null): RecordLike | null =>
  isRecord(debug?.ask_turn_solver_trace)
    ? debug.ask_turn_solver_trace
    : findLatestArtifactPayload(debug, /ask_turn_solver_trace|helix\.ask_turn_solver_trace\.v1/i)?.payload ?? null;

const finalArbitration = (trace: RecordLike | null): RecordLike | null =>
  isRecord(trace?.final_arbitration) ? trace.final_arbitration : null;

const terminalAuthority = (debug: RecordLike | null): RecordLike | null =>
  isRecord(debug?.terminal_answer_authority) ? debug.terminal_answer_authority : null;

const selectedTurnId = (debug: RecordLike | null, trace: RecordLike | null): string | null =>
  readString(trace?.turn_id) ??
  readString(debug?.active_turn_id) ??
  readString(debug?.backend_turn_id) ??
  readString(isRecord(debug?.resolved_turn_summary) ? debug.resolved_turn_summary.turn_id : null);

const selectedTraceRef = (trace: RecordLike | null, turnId: string | null): string | null =>
  readString(trace?.trace_id) ?? (turnId ? `${turnId}:ask_turn_solver_trace` : null);

const terminalArtifactKind = (debug: RecordLike | null, trace: RecordLike | null): string | null => {
  const arbitration = finalArbitration(trace);
  const authority = terminalAuthority(debug);
  return readString(arbitration?.terminal_artifact_kind) ??
    readString(debug?.terminal_artifact_kind) ??
    readString(isRecord(debug?.resolved_turn_summary) ? debug.resolved_turn_summary.terminal_artifact_kind : null) ??
    readString(authority?.terminal_artifact_kind);
};

const finalAnswerSource = (debug: RecordLike | null, trace: RecordLike | null): string | null => {
  const arbitration = finalArbitration(trace);
  const authority = terminalAuthority(debug);
  return readString(arbitration?.final_answer_source) ??
    readString(debug?.final_answer_source) ??
    readString(authority?.final_answer_source);
};

const selectedAnswerText = (debug: RecordLike | null): string | null => {
  const direct = readString(debug?.selected_final_answer);
  if (direct) return direct;
  const draft = isRecord(debug?.final_answer_draft) ? debug.final_answer_draft : null;
  const draftText = readString(draft?.answer_text) ?? readString(draft?.text) ?? readString(draft?.visible_text);
  if (draftText) return draftText;
  const latestDraft = findLatestArtifactPayload(debug, /final_answer_draft|helix\.final_answer_draft\.v1/i)?.payload;
  return readString(latestDraft?.answer_text) ?? readString(latestDraft?.text) ?? readString(debug?.answer_text) ?? readString(debug?.text);
};

const sourceWindowEvidenceRefs = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings([
    graph.graphId,
    ...graph.sourceWindow.latestObservationRefs,
    ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...(graph.sourceWindow.latestRawSessionBufferRefs ?? []),
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...graph.sourceWindow.sources.flatMap((source) => source.evidenceRefs),
  ]);

const sourceRefsFromEvidence = (evidenceRefs: string[]): StagePlayBadgeSourceRefV1[] =>
  evidenceRefs.map((id) => ({
    kind: "synthetic_evidence",
    id,
  }));

const badge = (input: Partial<StagePlayBadgeV1> & Pick<StagePlayBadgeV1, "id" | "title" | "plainMeaning" | "whyItMatters" | "kind" | "status">): StagePlayBadgeV1 => ({
  id: input.id,
  title: input.title,
  plainMeaning: input.plainMeaning,
  whyItMatters: input.whyItMatters,
  kind: input.kind,
  status: input.status,
  subjects: input.subjects ?? [],
  tags: input.tags ?? [],
  liveBindings: input.liveBindings ?? [],
  sourceRefs: input.sourceRefs ?? [],
  evidenceRefs: input.evidenceRefs ?? [],
  confidence: input.confidence ?? 0.5,
  missingEvidence: input.missingEvidence ?? [],
  reasonCodes: input.reasonCodes ?? [],
  dataTray: input.dataTray,
  checkpoint: input.checkpoint,
  output: input.output,
  intentModule: input.intentModule,
  admission: input.admission ?? "auto",
});

const edge = (input: Omit<StagePlayBadgeEdgeV1, "id">): StagePlayBadgeEdgeV1 => ({
  id: `edge:${input.from}:${input.relation}:${input.to}`,
  ...input,
});

const graphAnchorId = (graph: StagePlayBadgeGraphV1): string | null => {
  for (const id of ["procedural_binding.active", "stage_interpretation.current", "observer.live_sources"]) {
    if (graph.badges.some((badge) => badge.id === id)) return id;
  }
  return graph.badges[0]?.id ?? null;
};

const isModelAuthoredTerminal = (kind: string | null, source: string | null): boolean =>
  Boolean(
    (kind && MODEL_AUTHORED_TERMINAL_KINDS.has(kind)) ||
    (source && MODEL_AUTHORED_FINAL_SOURCES.has(source)),
  );

export function reduceStagePlayAnswerSnapshot(
  input: BuildStagePlayAnswerSnapshotInput,
): StagePlayAnswerSnapshotReducerOutput {
  const debug = unwrapDebug(input.askTurnDebug);
  const trace = solverTrace(debug);
  const turnId = selectedTurnId(debug, trace);
  const solverTraceRef = selectedTraceRef(trace, turnId);
  const terminalKind = terminalArtifactKind(debug, trace);
  const answerSource = finalAnswerSource(debug, trace);
  const answerText = selectedAnswerText(debug);
  const completedSolverPath = readBoolean(trace?.completed_solver_path) === true;
  const modelAuthored = isModelAuthoredTerminal(terminalKind, answerSource);
  const hasAnswerText = Boolean(answerText);
  const modelReviewed = completedSolverPath && modelAuthored && hasAnswerText;
  const generatedAt = input.generatedAt ?? input.graph.generatedAt;
  const askRefs = uniqueStrings([
    turnId,
    solverTraceRef,
    terminalKind,
    answerSource,
    readString(debug?.active_turn_id),
    readString(debug?.backend_turn_id),
  ]);
  const toolObservationRefs = collectToolObservationRefs(debug);
  const liveAnswerRefs = uniqueStrings([
    input.liveAnswerEnvironment?.environment_id,
    ...(input.liveAnswerEnvironment?.evidence_refs ?? []),
  ]);
  const evidenceRefs = uniqueStrings([
    ...sourceWindowEvidenceRefs(input.graph),
    ...toolObservationRefs,
    ...askRefs,
    ...liveAnswerRefs,
  ]);
  const sourceRefs = sourceRefsFromEvidence(evidenceRefs);

  const checkpointBadge = badge({
    id: "helix_ask.checkpoint.latest",
    title: "Helix Ask checkpoint",
    plainMeaning: modelReviewed
      ? "Helix Ask completed a model-reviewed checkpoint over this Stage Play graph."
      : "The latest Stage Play graph has not reached a model-reviewed Ask checkpoint.",
    whyItMatters: "The checkpoint separates source projection from a model-authored answer snapshot.",
    kind: "ask_checkpoint",
    status: modelReviewed ? "observed" : "missing_evidence",
    subjects: [turnId ?? "helix_ask"],
    tags: ["answer_snapshot_reducer", modelReviewed ? "model_reviewed" : "missing_checkpoint"],
    sourceRefs,
    evidenceRefs,
    confidence: modelReviewed ? 0.88 : 0.35,
    missingEvidence: modelReviewed ? [] : [
      completedSolverPath ? "A model-authored terminal artifact with answer text is required." : "Completed Ask solver path is required.",
    ],
    reasonCodes: [
      "stage_play_answer_snapshot_reducer",
      modelReviewed ? "completed_model_authored_checkpoint" : "missing_model_reviewed_checkpoint",
    ],
    dataTray: {
      title: "Latest Ask checkpoint",
      summary: modelReviewed
        ? "Completed solver path and model-authored terminal artifact are available."
        : "No completed model-reviewed checkpoint has been produced for this stage yet.",
      updatedAt: generatedAt,
      freshness: modelReviewed ? "fresh" : "missing",
      confidence: modelReviewed ? 0.88 : 0.35,
      evidenceRefs,
    },
    checkpoint: {
      askTurnId: turnId,
      solverTraceRef,
      terminalArtifactKind: terminalKind,
      finalAnswerSource: answerSource,
      modelReviewed,
    },
  });

  const answerSnapshotBadge = modelReviewed
    ? badge({
        id: "answer_snapshot.latest",
        title: "answer snapshot",
        plainMeaning: "Latest upheld answer text from a model-reviewed Ask checkpoint.",
        whyItMatters: "The answer snapshot is the first point where Stage Play can point to model-authored output instead of projection.",
        kind: "answer_snapshot",
        status: "observed",
        subjects: [turnId ?? "helix_ask"],
        tags: ["answer_snapshot_reducer", "model_reviewed", "answer_snapshot"],
        sourceRefs,
        evidenceRefs,
        confidence: 0.84,
        reasonCodes: ["stage_play_answer_snapshot_reducer", "answer_snapshot_from_model_authored_checkpoint"],
        dataTray: {
          title: "Upheld answer",
          summary: compactText(answerText ?? "Model-reviewed answer snapshot is available."),
          updatedAt: generatedAt,
          freshness: "fresh",
          confidence: 0.84,
          evidenceRefs,
        },
        output: {
          lineKey: "answer_snapshot",
          text: compactText(answerText ?? "Model-reviewed answer snapshot is available."),
          state: "model_reviewed",
          voiceEligible: false,
        },
      })
    : null;

  const liveOutputBadge = modelReviewed
    ? badge({
        id: "live_output.current",
        title: "live output",
        plainMeaning: "Current live output can display the model-reviewed answer snapshot.",
        whyItMatters: "Live output is display state backed by the reviewed answer snapshot, not a direct source projection.",
        kind: "live_output",
        status: "observed",
        subjects: [input.liveAnswerEnvironment?.environment_id ?? "live_answer"],
        tags: ["answer_snapshot_reducer", "model_reviewed", "live_output"],
        sourceRefs,
        evidenceRefs,
        confidence: 0.82,
        reasonCodes: ["stage_play_answer_snapshot_reducer", "live_output_from_answer_snapshot"],
        dataTray: {
          title: "Current live output",
          summary: "Live output is backed by the latest model-reviewed answer snapshot.",
          updatedAt: generatedAt,
          freshness: "fresh",
          confidence: 0.82,
          evidenceRefs,
        },
        output: {
          lineKey: "live_output",
          text: compactText(answerText ?? "Model-reviewed answer snapshot is available."),
          state: "model_reviewed",
          voiceEligible: false,
        },
      })
    : null;

  const missingCheckBadge = modelReviewed
    ? null
    : badge({
        id: "answer_snapshot.missing_check",
        title: "missing answer checkpoint",
        plainMeaning: "Stage Play has no completed model-reviewed answer snapshot for this checkpoint.",
        whyItMatters: "This prevents projected source state from being confused with final assistant guidance.",
        kind: "missing_evidence",
        status: "missing_evidence",
        subjects: [turnId ?? "helix_ask"],
        tags: ["answer_snapshot_reducer", "missing_check", "model_review_required"],
        sourceRefs,
        evidenceRefs,
        confidence: 0.72,
        missingEvidence: [
          "Completed Ask solver path",
          "Model-authored terminal artifact",
          "Selected final answer text",
        ].filter((item) =>
          item !== "Completed Ask solver path" || !completedSolverPath
        ).filter((item) =>
          item !== "Model-authored terminal artifact" || !modelAuthored
        ).filter((item) =>
          item !== "Selected final answer text" || !hasAnswerText
        ),
        reasonCodes: [
          "stage_play_answer_snapshot_reducer",
          completedSolverPath ? "solver_path_completed" : "solver_path_missing",
          modelAuthored ? "model_authored_terminal_present" : "model_authored_terminal_missing",
          hasAnswerText ? "answer_text_present" : "answer_text_missing",
        ],
        dataTray: {
          title: "Missing answer snapshot check",
          summary: "No model-reviewed answer snapshot is available; Stage Play projection remains non-final.",
          updatedAt: generatedAt,
          freshness: "missing",
          confidence: 0.72,
          evidenceRefs,
        },
      });

  const edges: StagePlayBadgeEdgeV1[] = [];
  const anchorId = graphAnchorId(input.graph);
  if (anchorId) {
    edges.push(edge({
      from: anchorId,
      to: checkpointBadge.id,
      relation: "feeds",
      label: "Stage Play graph feeds Ask checkpoint review",
      evidenceRefs,
      reasonCodes: ["stage_play_answer_snapshot_reducer"],
    }));
  }
  if (answerSnapshotBadge && liveOutputBadge) {
    edges.push(edge({
      from: checkpointBadge.id,
      to: answerSnapshotBadge.id,
      relation: "produces",
      label: "model-reviewed checkpoint produces answer snapshot",
      evidenceRefs,
      reasonCodes: ["model_reviewed_checkpoint_answer_snapshot"],
    }));
    edges.push(edge({
      from: answerSnapshotBadge.id,
      to: liveOutputBadge.id,
      relation: "produces",
      label: "answer snapshot produces current live output",
      evidenceRefs,
      reasonCodes: ["answer_snapshot_live_output"],
    }));
  } else if (missingCheckBadge) {
    edges.push(edge({
      from: checkpointBadge.id,
      to: missingCheckBadge.id,
      relation: "needs_check",
      label: "Ask checkpoint needs model-reviewed answer evidence",
      evidenceRefs,
      reasonCodes: ["missing_model_reviewed_answer_snapshot"],
    }));
  }

  const badges = [
    checkpointBadge,
    ...(answerSnapshotBadge ? [answerSnapshotBadge] : []),
    ...(liveOutputBadge ? [liveOutputBadge] : []),
    ...(missingCheckBadge ? [missingCheckBadge] : []),
  ];

  return {
    checkpointBadge,
    answerSnapshotBadge,
    liveOutputBadge,
    missingCheckBadge,
    badges,
    edges,
  };
}
