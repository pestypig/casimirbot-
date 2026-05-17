import crypto from "node:crypto";
import {
  HELIX_LIVE_RUNTIME_REPAIR_PLAN_SCHEMA,
  type HelixLiveRuntimeRepairActionId,
  type HelixLiveRuntimeRepairPlan,
  type HelixLiveRuntimeRepairProblemKind,
} from "@shared/helix-live-runtime-repair-plan";
import type { HelixLiveSourceProducerFreshness } from "@shared/helix-live-source-producer-freshness";
import type { HelixVisualCadenceAcceptanceCheck, HelixVisualCadenceAcceptanceResult } from "@shared/helix-visual-cadence-acceptance";

type WorldBindingCheckLike = {
  ok?: boolean;
  latest_append_reason?: string | null;
  next_required_action?: string | null;
  latest_source?: {
    room_id: string;
    source_id: string;
    world_id: string;
  } | null;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const action = (input: {
  action_id: HelixLiveRuntimeRepairActionId;
  requires_user_permission: boolean;
  can_run_automatically: boolean;
  summary: string;
}): HelixLiveRuntimeRepairPlan["recommended_actions"][number] => input;

const problemFromFreshness = (freshness?: HelixLiveSourceProducerFreshness | null): HelixLiveRuntimeRepairProblemKind | null => {
  if (!freshness || freshness.is_fresh) return null;
  if (freshness.stale_reason === "visual_capture_permission_required") return "missing_permission";
  if (freshness.stale_reason === "waiting_for_client_adoption") return "visual_no_chunks";
  if (freshness.stale_reason === "client_adopted_waiting_for_chunk") return "visual_no_chunks";
  if (freshness.stale_reason === "client_action_failed") return "visual_no_chunks";
  if (freshness.stale_reason === "client_stream_ended") return "missing_permission";
  if (freshness.stale_reason === "waiting_for_client_stream") return freshness.next_required_action === "client_adopt_visual_producer" ? "visual_no_chunks" : "missing_permission";
  if (freshness.stale_reason === "no_chunk_after_two_cadence_windows") return freshness.last_chunk_id ? "visual_stale" : "visual_no_chunks";
  if (freshness.stale_reason === "analysis_pending_or_failed") return "visual_analysis_pending";
  if (freshness.stale_reason === "routing_gap") return "card_not_updated";
  return "visual_stale";
};

const actionsForProblem = (problem: HelixLiveRuntimeRepairProblemKind): HelixLiveRuntimeRepairPlan["recommended_actions"] => {
  if (problem === "missing_permission") {
    return [
      action({
        action_id: "grant_visual_capture_permission",
        requires_user_permission: true,
        can_run_automatically: false,
        summary: "Ask the browser user to grant visual capture permission.",
      }),
    ];
  }
  if (problem === "visual_stale" || problem === "visual_no_chunks") {
    return [
      action({
        action_id: "client_adopt_visual_producer",
        requires_user_permission: false,
        can_run_automatically: false,
        summary: "Ask the browser client to adopt the server-side visual producer cadence.",
      }),
      action({
        action_id: "capture_frame_now",
        requires_user_permission: true,
        can_run_automatically: false,
        summary: "Capture a fresh frame from the active browser stream.",
      }),
      action({
        action_id: "restart_visual_producer",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Restart the interval loop if the client has adopted the producer but chunks are not flowing.",
      }),
      action({
        action_id: "resume_visual_producer",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Mark the visual producer active if a client stream is already confirmed.",
      }),
    ];
  }
  if (problem === "visual_analysis_pending" || problem === "visual_analysis_failed") {
    return [
      action({
        action_id: "run_due_analysis",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Run queued analysis jobs for the live-source chunks.",
      }),
      action({
        action_id: "rerun_acceptance",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Rerun visual cadence acceptance after analysis.",
      }),
    ];
  }
  if (problem === "vision_provider_missing") {
    return [
      action({
        action_id: "configure_vision_provider",
        requires_user_permission: true,
        can_run_automatically: false,
        summary: "Configure OpenAI vision provider credentials before analysis can produce descriptions.",
      }),
    ];
  }
  if (problem === "world_event_no_thread_context") {
    return [
      action({
        action_id: "attach_world_event_source_to_thread",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Attach the exact observed world-event source to this Helix thread.",
      }),
    ];
  }
  if (problem === "analysis_backpressure") {
    return [
      action({
        action_id: "reduce_visual_cadence",
        requires_user_permission: false,
        can_run_automatically: true,
        summary: "Reduce visual cadence to relieve analysis backpressure.",
      }),
    ];
  }
  return [
    action({
      action_id: "rerun_acceptance",
      requires_user_permission: false,
      can_run_automatically: true,
      summary: "Rerun acceptance to refresh runtime diagnostics.",
    }),
  ];
};

export function planLiveRuntimeRepair(input: {
  threadId: string;
  pipelineId?: string | null;
  environmentId?: string | null;
  producerId?: string | null;
  freshness?: HelixLiveSourceProducerFreshness | null;
  acceptance?: HelixVisualCadenceAcceptanceResult | null;
  worldBindingCheck?: WorldBindingCheckLike | null;
  providerMissing?: boolean;
}): HelixLiveRuntimeRepairPlan {
  let problem: HelixLiveRuntimeRepairProblemKind =
    input.providerMissing
      ? "vision_provider_missing"
      : problemFromFreshness(input.freshness) ?? "card_not_updated";
  if (input.worldBindingCheck && !input.worldBindingCheck.ok) {
    problem = input.worldBindingCheck.latest_append_reason === "no_thread_context" || input.worldBindingCheck.next_required_action === "attach_world_event_source"
      ? "world_event_no_thread_context"
      : "world_event_stale";
  }
  if (input.acceptance && !input.acceptance.ok) {
    const failedNames = input.acceptance.checks.filter((check: HelixVisualCadenceAcceptanceCheck) => !check.ok).map((check: HelixVisualCadenceAcceptanceCheck) => check.name);
    if (failedNames.includes("latest_chunk_has_analysis_job") || failedNames.includes("latest_job_has_output_or_failure")) {
      problem = "visual_analysis_pending";
    } else if (failedNames.includes("two_increasing_chunks")) {
      problem = "visual_no_chunks";
    }
  }
  const recommendedActions = actionsForProblem(problem);
  const selected = recommendedActions.find((entry: HelixLiveRuntimeRepairPlan["recommended_actions"][number]) => entry.can_run_automatically)?.action_id ?? recommendedActions[0]?.action_id ?? null;
  return {
    schema: HELIX_LIVE_RUNTIME_REPAIR_PLAN_SCHEMA,
    repair_plan_id: `live_runtime_repair_plan:${hashShort([input.threadId, input.pipelineId, input.producerId, problem, Date.now()])}`,
    thread_id: input.threadId,
    pipeline_id: input.pipelineId ?? null,
    environment_id: input.environmentId ?? null,
    producer_id: input.producerId ?? null,
    diagnostic_refs: [
      input.freshness?.last_chunk_id,
      input.freshness?.last_analysis_job_id,
      input.freshness?.last_visual_evidence_id,
      input.acceptance?.producer_id,
      input.worldBindingCheck?.latest_source?.source_id,
    ].filter(Boolean) as string[],
    problem_kind: problem,
    recommended_actions: recommendedActions,
    selected_action_id: selected,
    assistant_answer: false,
    raw_content_included: false,
  };
}
