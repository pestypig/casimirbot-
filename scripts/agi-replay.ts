import type { AgiGateReport, AgiTrajectory } from "@shared/agi-refinery";
import type { TrainingTraceRecord } from "@shared/schema";
import { recordTrainingTrace, getTrainingTraceExport } from "../server/services/observability/training-trace-store";
import { evaluateTrajectoryGates } from "../server/services/agi/refinery-gates";
import { collectRefinerySummary } from "../server/services/agi/refinery-summary";

type ReplayArgs = {
  limit?: number;
  tenantId?: string;
  force?: boolean;
  emit?: boolean;
};

const parseArgs = (): ReplayArgs => {
  const args = process.argv.slice(2);
  const out: ReplayArgs = { emit: true };
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--limit") {
      out.limit = Number(args[i + 1]);
      i += 1;
    } else if (token === "--tenant") {
      out.tenantId = args[i + 1];
      i += 1;
    } else if (token === "--force") {
      out.force = true;
    } else if (token === "--no-emit") {
      out.emit = false;
    }
  }
  return out;
};

const extractPayload = (
  traces: TrainingTraceRecord[],
): {
  trajectories: Map<string, AgiTrajectory>;
  gates: Map<string, AgiGateReport>;
} => {
  const trajectories = new Map<string, AgiTrajectory>();
  const gates = new Map<string, AgiGateReport>();
  for (const trace of traces) {
    if (!trace.payload) continue;
    if (trace.payload.kind === "trajectory") {
      const data = trace.payload.data as AgiTrajectory;
      const key = data.traceId ?? data.id;
      trajectories.set(key, data);
    } else if (trace.payload.kind === "trajectory_gates") {
      const data = trace.payload.data as AgiGateReport;
      const key = data.traceId ?? data.trajectoryId ?? trace.traceId ?? trace.id;
      if (key) {
        gates.set(key, data);
      }
    }
  }
  return { trajectories, gates };
};

const args = parseArgs();
const traces = getTrainingTraceExport({ limit: args.limit, tenantId: args.tenantId });
const { trajectories, gates } = extractPayload(traces);
let evaluated = 0;

for (const trajectory of trajectories.values()) {
  const key = trajectory.traceId ?? trajectory.id;
  if (!args.force && gates.has(key)) {
    continue;
  }
  const gateReport = evaluateTrajectoryGates(trajectory);
  evaluated += 1;
  if (args.emit) {
    recordTrainingTrace({
      traceId: trajectory.traceId,
      pass: gateReport.accepted,
      deltas: [],
      metrics: {
        gate_accept: gateReport.accepted ? 1 : 0,
        evidence_count: trajectory.E?.length ?? 0,
      },
      source: { system: "agi-refinery", component: "replay", tool: "gates" },
      payload: { kind: "trajectory_gates", data: gateReport },
      notes: ["source=replay"],
    });
  }
}

const summary = collectRefinerySummary({ limit: args.limit, tenantId: args.tenantId });
if (args.emit) {
  recordTrainingTrace({
    pass: true,
    deltas: [],
    metrics: {
      replay_total: summary.total,
      replay_accepted: summary.accepted,
    },
    source: { system: "agi-refinery", component: "replay", tool: "summary" },
    payload: { kind: "trajectory_replay_summary", data: summary },
  });
}

console.log(
  JSON.stringify(
    {
      evaluated,
      total: summary.total,
      accepted: summary.accepted,
      acceptanceRate: summary.acceptanceRate,
      avgTokens: summary.avgTokens,
    },
    null,
    2,
  ),
);
