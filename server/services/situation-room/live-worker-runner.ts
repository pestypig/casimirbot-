import type { HelixLiveWorkerLane } from "@shared/helix-live-worker-lane";
import type { HelixLiveWorkerRun } from "@shared/helix-live-worker-run";
import { getVisionProviderHealth } from "../vision/provider";
import { planLiveLineToolRequest } from "../helix-ask/live-line-tool-request-planner";
import { runLiveLineToolChainWithReceipt } from "../helix-ask/workstation-line-tool-chain-runner";
import { getLiveAnswerEnvironment } from "./live-answer-environment-store";
import { getVisualEvidenceHealth } from "./visual-evidence-health";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import { appendInterpretedEvent } from "./interpreted-event-log-store";
import { projectPresentStateCard } from "./present-state-card-projector";
import {
  completeLiveWorkerRun,
  getLiveWorkerLane,
  listLiveWorkerLanes,
  listLiveWorkerRuns,
  startLiveWorkerRun,
} from "./live-worker-lane-store";

const nowIso = (): string => new Date().toISOString();

const cooldownMs = 10_000;
const maxRunsPerMinute = 20;
const maxActiveWorkersPerThread = 4;

const shouldRunLane = (lane: HelixLiveWorkerLane, now: string): boolean => {
  if (lane.status !== "active") return false;
  const nextRunAt = lane.next_run_at ? Date.parse(lane.next_run_at) : 0;
  if (Number.isFinite(nextRunAt) && nextRunAt > Date.parse(now)) return false;
  const latestRun = listLiveWorkerRuns({ threadId: lane.thread_id, workerId: lane.worker_id, limit: 1 }).at(-1);
  if (!latestRun?.completed_at) return true;
  return Date.parse(now) - Date.parse(latestRun.completed_at) >= cooldownMs;
};

const workerEvent = (input: {
  lane: HelixLiveWorkerLane;
  run: HelixLiveWorkerRun;
  summary: string;
  validations?: string[];
  observations?: string[];
}): void => {
  appendInterpretedEvent({
    thread_id: input.lane.thread_id,
    room_id: getLiveAnswerEnvironment(input.lane.environment_id)?.room_id ?? null,
    source_family: "live_worker",
    kind: "agentic_review",
    title: `Worker lane ${input.lane.lane_key}`,
    summary: input.summary,
    evidence_refs: [...(input.validations ?? []), ...(input.observations ?? [])],
    related_artifact_ids: [input.lane.worker_id, input.run.run_id],
    model_invoked: false,
    deterministic: true,
    created_at: input.run.completed_at ?? nowIso(),
  });
};

const visualAnalysisWatchdog = (lane: HelixLiveWorkerLane, run: HelixLiveWorkerRun): HelixLiveWorkerRun => {
  const environment = getLiveAnswerEnvironment(lane.environment_id);
  const health = getVisualEvidenceHealth({
    threadId: lane.thread_id,
    roomId: environment?.room_id ?? null,
  });
  const provider = getVisionProviderHealth();
  const observations = [`visual_health:${health.status}`, `visual_provider:${provider.provider}:${provider.configured ? "configured" : "missing"}`];
  const validations: string[] = [];
  let status: HelixLiveWorkerRun["status"] = "completed";
  let summary = "Visual analysis worker found no repair work.";
  if (health.status === "analysis_ready") {
    validations.push(health.latest_evidence_id ?? "visual_analysis_ready");
    summary = "Latest visual frame already has compact visual evidence.";
  } else if (health.status === "no_source" || health.status === "permission_required" || health.status === "waiting_for_first_frame") {
    status = "suppressed";
    validations.push(health.next_required_action ?? health.status);
    summary = `Visual analysis is waiting on ${health.next_required_action ?? health.status}.`;
  } else if (!provider.configured || provider.provider === "none") {
    validations.push("vision_provider_missing");
    summary = "Vision provider is missing; latest frame cannot be described yet.";
  } else if (health.status === "frame_captured") {
    validations.push("visual_analysis_requires_client_frame_payload");
    summary = "Latest frame was captured, but analysis requires the browser client to submit the frame payload.";
  } else {
    validations.push("visual_analysis_failed");
    summary = "Visual analysis did not produce compact evidence; capture/analyze should be retried from the client.";
  }
  const completed = completeLiveWorkerRun({
    run,
    status,
    summary,
    observations,
    validations,
    updatedLineKeys: ["scene", "place", "activity", "missing_evidence", "next_check"],
  });
  workerEvent({ lane, run: completed, summary, validations, observations });
  return completed;
};

const sourceHealthWatchdog = (lane: HelixLiveWorkerLane, run: HelixLiveWorkerRun): HelixLiveWorkerRun => {
  const environment = getLiveAnswerEnvironment(lane.environment_id);
  const capabilities = buildSituationSourceCapabilities({
    threadId: lane.thread_id,
    roomId: environment?.room_id ?? null,
  });
  const missing = capabilities.filter((capability) => capability.status === "configured_missing").map((capability) => capability.modality);
  const stale = capabilities.filter((capability) => capability.status === "stale").map((capability) => capability.modality);
  const summary = stale.length > 0
    ? `Source health worker found stale modalities: ${stale.join(", ")}.`
    : missing.length > 0
      ? `Source health worker found missing optional modalities: ${missing.join(", ")}.`
      : "Source health worker found active source fidelity.";
  const completed = completeLiveWorkerRun({
    run,
    status: "completed",
    summary,
    observations: capabilities.map((capability) => `${capability.modality}:${capability.status}`),
    validations: [...missing.map((entry) => `missing:${entry}`), ...stale.map((entry) => `stale:${entry}`)],
    updatedLineKeys: ["missing_evidence", "next_check"],
  });
  workerEvent({ lane, run: completed, summary, validations: completed.validations, observations: completed.observations });
  return completed;
};

const presentStateSynthesisWorker = (lane: HelixLiveWorkerLane, run: HelixLiveWorkerRun): HelixLiveWorkerRun => {
  const card = projectPresentStateCard({ threadId: lane.thread_id });
  const summary = `Present-state synthesis refreshed ${card.lines.length} line(s).`;
  const completed = completeLiveWorkerRun({
    run,
    status: "completed",
    summary,
    observations: [card.card_id],
    validations: [card.present_state_synthesis?.synthesis_id ?? "present_state_synthesis"],
    updatedLineKeys: card.lines.map((line) => line.key),
  });
  workerEvent({ lane, run: completed, summary, validations: completed.validations, observations: completed.observations });
  return completed;
};

const lineWorker = (lane: HelixLiveWorkerLane, run: HelixLiveWorkerRun): HelixLiveWorkerRun => {
  const environment = getLiveAnswerEnvironment(lane.environment_id);
  if (!environment) {
    return completeLiveWorkerRun({
      run,
      status: "failed",
      summary: "Live environment was not found for line worker.",
      validations: ["live_environment_not_found"],
    });
  }
  const target = environment.lines.find((line) => {
    if (lane.lane_key === "line_place") return line.key === "place" || line.key === "scene";
    if (lane.lane_key === "line_activity") return line.key === "activity";
    if (lane.lane_key === "line_structure") return line.key === "structure" || line.key === "evidence";
    if (lane.lane_key === "line_entities") return line.key === "entities" || line.key === "objects";
    if (lane.lane_key === "line_risk") return line.key === "risk";
    if (lane.lane_key === "line_missing_evidence") return line.key === "missing_evidence" || line.key === "uncertainty";
    if (lane.lane_key === "line_next_check") return line.key === "next_check" || line.key === "last_update";
    return false;
  });
  if (!target) {
    return completeLiveWorkerRun({
      run,
      status: "suppressed",
      summary: "No matching live-card line exists for this worker lane.",
      validations: ["line_not_found"],
    });
  }
  const request = planLiveLineToolRequest({
    threadId: environment.thread_id,
    environmentId: environment.environment_id,
    line: {
      key: target.key,
      label: target.label,
      value: target.value,
      evidence_refs: target.evidence_refs,
    },
  });
  if (!request || !lane.allowed_tools.includes(request.requested_tool)) {
    return completeLiveWorkerRun({
      run,
      status: "suppressed",
      summary: "Line worker found no allowed cognition tool for this line.",
      validations: ["no_allowed_line_tool"],
      updatedLineKeys: [target.key],
    });
  }
  const existingEvaluation = listLiveWorkerRuns({
    threadId: lane.thread_id,
    workerId: lane.worker_id,
    limit: 5,
  }).some((entry) => entry.tool_calls.some((call) => call.tool_id === request.requested_tool) && entry.status === "completed");
  if (existingEvaluation) {
    return completeLiveWorkerRun({
      run,
      status: "suppressed",
      summary: "Line worker suppressed duplicate recent check.",
      validations: ["dedupe_recent_line_check"],
      updatedLineKeys: [target.key],
    });
  }
  const result = runLiveLineToolChainWithReceipt({
    request,
    roomId: environment.room_id ?? null,
    sourceId: environment.source_ids[0] ?? null,
    limit: 40,
  });
  const summary = `Line worker ran ${request.requested_tool}: ${result.evaluation.summary}`;
  const completed = completeLiveWorkerRun({
    run,
    status: "completed",
    summary,
    toolCalls: [{
      tool_id: request.requested_tool,
      dynamic_tool_call_id: result.dynamic_tool_call.request_id,
      receipt_refs: [result.receipt.receipt_id],
    }],
    observations: [result.receipt.receipt_id],
    validations: [result.evaluation.evaluation_id],
    updatedLineKeys: [target.key],
  });
  workerEvent({ lane, run: completed, summary, validations: completed.validations, observations: completed.observations });
  return completed;
};

export function runLiveWorkerLane(input: {
  workerId: string;
  triggerReason?: string;
}): HelixLiveWorkerRun {
  const lane = getLiveWorkerLane(input.workerId);
  if (!lane) throw new Error("live_worker_lane_not_found");
  const run = startLiveWorkerRun({
    lane,
    triggerReason: input.triggerReason ?? "manual",
  });
  if (lane.lane_key === "visual_analysis") return visualAnalysisWatchdog(lane, run);
  if (lane.lane_key === "source_health") return sourceHealthWatchdog(lane, run);
  if (lane.lane_key === "present_state_synthesis") return presentStateSynthesisWorker(lane, run);
  if (lane.lane_key.startsWith("line_")) return lineWorker(lane, run);
  return completeLiveWorkerRun({
    run,
    status: "suppressed",
    summary: "Worker lane has no runner yet.",
    validations: ["runner_not_implemented"],
  });
}

export function runDueLiveWorkers(input: {
  threadId: string;
  environmentId?: string | null;
  triggerReason?: string;
  now?: string;
  maxRuns?: number;
}): HelixLiveWorkerRun[] {
  const now = input.now ?? nowIso();
  const runsLastMinute = listLiveWorkerRuns({ threadId: input.threadId, limit: 100 })
    .filter((run) => Date.parse(now) - Date.parse(run.started_at) < 60_000).length;
  if (runsLastMinute >= maxRunsPerMinute) return [];
  const due = listLiveWorkerLanes({
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    status: "active",
  }).filter((lane) => shouldRunLane(lane, now));
  const budget = Math.min(input.maxRuns ?? maxActiveWorkersPerThread, maxActiveWorkersPerThread, maxRunsPerMinute - runsLastMinute);
  const selected = due
    .filter((lane) => lane.lane_key !== "present_state_synthesis")
    .slice(0, Math.max(0, budget));
  return selected.map((lane) => runLiveWorkerLane({
    workerId: lane.worker_id,
    triggerReason: input.triggerReason ?? "due",
  }));
}
