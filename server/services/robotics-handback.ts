import { getTrainingTraceExport } from "./observability/training-trace-store.js";
import { runPickPlaceBenchmark } from "./robotics-benchmark.js";

export type RoboticsHandbackBundle = {
  generatedAt: string;
  benchmark: ReturnType<typeof runPickPlaceBenchmark>;
  benchmarkTraceCount: number;
  benchmarkTraceIds: string[];
  replayLinkage: {
    movementEpisodeCount: number;
    replaySummaryCount: number;
    certificateRefs: string[];
  };
  openRisks: string[];
  nextRung: string[];
  runbookRef: string;
};

const OPEN_RISKS: string[] = [
  "clock2_planning_drift",
  "client_server_trace_schema_drift",
  "robotics_certificate_hardware_gap",
  "seed_capture_nondeterminism",
  "memory_latency_coupling",
];

const NEXT_RUNG: string[] = [
  "clock2_budget_telemetry",
  "canonical_robotics_certificate_signer",
  "hardware_in_loop_pick_place_fixture",
  "operator_threshold_tuning_runbook",
  "ci_trace_export_versioning",
];

export const buildRoboticsHandbackBundle = (): RoboticsHandbackBundle => {
  const benchmark = runPickPlaceBenchmark();
  const traces = getTrainingTraceExport({ limit: 200 }).filter(
    (entry) => entry.traceId === benchmark.traceId,
  );
  const movementEpisodes = traces.filter((entry) => entry.payload?.kind === "movement_episode");
  const replaySummaries = traces.filter(
    (entry) => entry.payload?.kind === "trajectory_replay_summary",
  );
  const certificateRefs = Array.from(
    new Set(
      traces
        .flatMap((entry) => [entry.certificate?.certificateHash, entry.certificate?.certificateId])
        .filter((value): value is string => Boolean(value)),
    ),
  );
  return {
    generatedAt: new Date().toISOString(),
    benchmark,
    benchmarkTraceCount: traces.length,
    benchmarkTraceIds: traces.map((entry) => entry.id),
    replayLinkage: {
      movementEpisodeCount: movementEpisodes.length,
      replaySummaryCount: replaySummaries.length,
      certificateRefs,
    },
    openRisks: OPEN_RISKS,
    nextRung: NEXT_RUNG,
    runbookRef: "docs/robotics-threshold-tuning-runbook.md",
  };
};
