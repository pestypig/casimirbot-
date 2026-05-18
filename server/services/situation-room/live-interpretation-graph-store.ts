import crypto from "node:crypto";
import {
  HELIX_LIVE_INTERPRETATION_GRAPH_SCHEMA,
  type HelixLiveInterpretationGraph,
} from "@shared/helix-live-interpretation-graph";
import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveInterpretationRun } from "@shared/helix-live-interpretation-run";

const graphsByRun = new Map<string, HelixLiveInterpretationGraph>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function updateLiveInterpretationGraph(input: {
  interpretationRun: HelixLiveInterpretationRun;
  hypotheses: HelixLiveInterpretationHypothesis[];
  now?: string;
}): HelixLiveInterpretationGraph {
  const now = input.now ?? new Date().toISOString();
  const existing = graphsByRun.get(input.interpretationRun.interpretation_run_id);
  const nodes = Array.from(new Set([
    ...(existing?.nodes ?? []),
    ...input.hypotheses.map((entry) => entry.hypothesis_id),
  ]));
  const edges = [
    ...(existing?.edges ?? []),
    ...input.hypotheses.flatMap((entry) => [
      ...(entry.supports ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "supports" as const })),
      ...(entry.contradicts ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "contradicts" as const })),
      ...(entry.supersedes ?? []).map((target) => ({ from: entry.hypothesis_id, to: target, relation: "supersedes" as const })),
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
