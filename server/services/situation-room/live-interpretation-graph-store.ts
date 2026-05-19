import crypto from "node:crypto";
import {
  HELIX_LIVE_INTERPRETATION_GRAPH_SCHEMA,
  type HelixLiveInterpretationGraph,
} from "@shared/helix-live-interpretation-graph";
import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveInterpretationRun } from "@shared/helix-live-interpretation-run";
import type { HelixLiveInterpretationValidationArtifact } from "@shared/helix-live-interpretation-validation-artifact";
import type { HelixLiveInterpretationWorkerRun } from "@shared/helix-live-interpretation-worker-run";

const graphsByRun = new Map<string, HelixLiveInterpretationGraph>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function updateLiveInterpretationGraph(input: {
  interpretationRun: HelixLiveInterpretationRun;
  hypotheses: HelixLiveInterpretationHypothesis[];
  workerRuns?: HelixLiveInterpretationWorkerRun[];
  artifacts?: HelixLiveInterpretationValidationArtifact[];
  now?: string;
}): HelixLiveInterpretationGraph {
  const now = input.now ?? new Date().toISOString();
  const existing = graphsByRun.get(input.interpretationRun.interpretation_run_id);
  const nodes = Array.from(new Set([
    ...(existing?.nodes ?? []),
    input.interpretationRun.interpretation_run_id,
    input.interpretationRun.first_scene_epoch_id,
    input.interpretationRun.current_scene_epoch_id,
    ...(input.workerRuns ?? []).map((entry) => entry.interpretation_worker_run_id),
    ...(input.artifacts ?? []).map((entry) => entry.validation_artifact_id),
    ...input.hypotheses.map((entry) => entry.hypothesis_id),
  ]));
  const edges = [
    ...(existing?.edges ?? []),
    {
      from: input.interpretationRun.interpretation_run_id,
      to: input.interpretationRun.first_scene_epoch_id,
      relation: "seeded_by" as const,
    },
    ...(input.workerRuns ?? []).map((entry) => ({
      from: entry.interpretation_worker_run_id,
      to: entry.scene_epoch_id,
      relation: "observed_in" as const,
    })),
    ...(input.artifacts ?? []).map((entry) => ({
      from: entry.validation_artifact_id,
      to: entry.interpretation_worker_run_id,
      relation: entry.artifact_type === "gate_block" ? "blocked_by_gate" as const : "emitted_by" as const,
      weight: entry.confidence ?? null,
      metadata: { artifact_type: entry.artifact_type },
    })),
    ...input.hypotheses.flatMap((entry) => [
      ...(entry.supports ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "supports" as const })),
      ...(entry.supports ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "reinforces" as const })),
      ...(entry.contradicts ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "contradicts" as const })),
      ...(entry.supersedes ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "supersedes" as const })),
      ...(entry.status === "expired" ? [{ from: entry.hypothesis_id, to: entry.hypothesis_id, relation: "expires" as const }] : []),
      ...((input.artifacts ?? [])
        .filter((artifact) =>
          artifact.payload.hypothesis_id === entry.hypothesis_id ||
          artifact.payload.output_hypothesis_id === entry.hypothesis_id
        )
        .map((artifact) => ({ from: entry.hypothesis_id, to: artifact.validation_artifact_id, relation: "derived_from" as const }))),
    ]),
  ].filter((edge, index, all) =>
    index === all.findIndex((candidate) =>
      candidate.from === edge.from && candidate.to === edge.to && candidate.relation === edge.relation
    )
  );
  const graph: HelixLiveInterpretationGraph = {
    schema: HELIX_LIVE_INTERPRETATION_GRAPH_SCHEMA,
    graph_id: existing?.graph_id ?? `live_interpretation_graph:${hashShort(input.interpretationRun.interpretation_run_id)}`,
    interpretation_run_id: input.interpretationRun.interpretation_run_id,
    situation_run_id: input.interpretationRun.situation_run_id,
    thread_id: input.interpretationRun.thread_id,
    nodes,
    edges,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  graphsByRun.set(input.interpretationRun.interpretation_run_id, graph);
  return graph;
}

export function listLiveInterpretationGraphs(input: {
  interpretationRunId?: string | null;
  situationRunId?: string | null;
} = {}): HelixLiveInterpretationGraph[] {
  return Array.from(graphsByRun.values())
    .filter((entry) => !input.interpretationRunId || entry.interpretation_run_id === input.interpretationRunId)
    .filter((entry) => !input.situationRunId || entry.situation_run_id === input.situationRunId);
}

export function resetLiveInterpretationGraphsForTest(): void {
  graphsByRun.clear();
}
