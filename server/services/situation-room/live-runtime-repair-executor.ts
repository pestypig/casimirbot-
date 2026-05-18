import crypto from "node:crypto";
import {
  HELIX_LIVE_RUNTIME_REPAIR_RECEIPT_SCHEMA,
  type HelixLiveRuntimeRepairReceipt,
} from "@shared/helix-live-runtime-repair-receipt";
import type { HelixLiveRuntimeRepairPlan } from "@shared/helix-live-runtime-repair-plan";
import { runDueLiveSourceAnalysisJobs } from "./live-source-analysis-job-executor";
import { runVisualCadenceAcceptance } from "./visual-cadence-acceptance-runner";
import { createSituationThreadBinding } from "./thread-binding-store";
import { listLiveSourceProducers, setLiveSourceProducerStatus } from "./live-source-chunk-buffer";
import { setVisualProducerCadence } from "./live-source-producer-binding";
import { recordSourceBindingRepairAccepted } from "./source-binding-status-ledger";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

type WorldBindingSource = {
  room_id: string;
  source_id: string;
  world_id: string;
} | null;

export function executeLiveRuntimeRepair(input: {
  plan: HelixLiveRuntimeRepairPlan;
  selectedActionId?: string | null;
  worldBindingSource?: WorldBindingSource;
}): HelixLiveRuntimeRepairReceipt {
  const selectedActionId = input.selectedActionId ?? input.plan.selected_action_id ?? null;
  const producer = input.plan.producer_id
    ? listLiveSourceProducers().find(
        (entry: { producer_id: string; source_id: string }) =>
          entry.producer_id === input.plan.producer_id || entry.source_id === input.plan.producer_id,
      ) ?? null
    : null;
  const before = input.plan.producer_id ? runVisualCadenceAcceptance({ producerId: input.plan.producer_id }) : null;
  const refs: string[] = [];
  let ok = false;
  let summary = "No repair action was selected.";
  let nextRequiredAction: string | null = null;
  if (selectedActionId === "run_due_analysis") {
    const executions = runDueLiveSourceAnalysisJobs({ threadId: input.plan.thread_id });
    ok = executions.some((entry: { ok?: boolean }) => entry.ok);
    refs.push(
      ...(executions
        .map((entry: { job?: { job_id?: string | null } | null }) => entry.job?.job_id)
        .filter(Boolean) as string[]),
    );
    summary = `Ran ${executions.length} due analysis job${executions.length === 1 ? "" : "s"}.`;
    nextRequiredAction = ok ? "rerun_acceptance" : "inspect_analysis_jobs";
  } else if (selectedActionId === "rerun_acceptance") {
    ok = Boolean(before);
    summary = before ? `Reran visual cadence acceptance: ${before.ok ? "passed" : "blocked"}.` : "No producer was available for acceptance.";
    nextRequiredAction = before?.next_required_action ?? null;
  } else if (selectedActionId === "resume_visual_producer" && input.plan.producer_id) {
    const resumed = setLiveSourceProducerStatus({
      sourceId: producer?.source_id ?? input.plan.producer_id,
      threadId: input.plan.thread_id,
      status: "active",
    });
    ok = Boolean(resumed);
    refs.push(resumed?.producer_id ?? input.plan.producer_id);
    summary = ok ? "Visual producer resumed." : "Visual producer could not be resumed.";
    nextRequiredAction = ok ? "rerun_acceptance" : "grant_visual_capture_permission";
  } else if (selectedActionId === "reduce_visual_cadence" && input.plan.producer_id) {
    const cadence = setVisualProducerCadence({
      threadId: input.plan.thread_id,
      sourceId: producer?.source_id ?? input.plan.producer_id,
      cadenceMs: 30_000,
      captureMode: "interval",
      status: "waiting_for_client",
    });
    ok = true;
    refs.push(cadence.producer.producer_id, cadence.receipt.receipt_id);
    summary = "Reduced visual producer cadence to 30 seconds.";
    nextRequiredAction = "rerun_acceptance";
  } else if (selectedActionId === "attach_world_event_source_to_thread") {
    if (!input.worldBindingSource) {
      ok = false;
      summary = "No exact world-event source was available to attach.";
      nextRequiredAction = "send_world_event";
    } else {
      const receipt = createSituationThreadBinding({
        room_id: input.worldBindingSource.room_id,
        source_id: input.worldBindingSource.source_id,
        world_id: input.worldBindingSource.world_id,
        thread_id: input.plan.thread_id,
        mode: "standby_receipts",
        append_policy: "salient_only",
      });
      ok = receipt.ok;
      refs.push(receipt.binding?.binding_id ?? input.worldBindingSource.source_id);
      if (receipt.ok) {
        const transition = recordSourceBindingRepairAccepted({
          source_id: input.worldBindingSource.source_id,
          thread_id: input.plan.thread_id,
          modality: "world_event",
          reason: "live runtime repair attached exact world-event source to thread",
          evidence_refs: [receipt.binding?.binding_id ?? input.worldBindingSource.source_id],
        });
        refs.push(transition.transition_id);
      }
      summary = receipt.ok ? "Attached exact world-event source to Helix thread." : receipt.message ?? "World-event source attach failed.";
      nextRequiredAction = receipt.ok ? "rerun_acceptance" : "check_world_source_ids";
    }
  } else if (
    selectedActionId === "grant_visual_capture_permission" ||
    selectedActionId === "capture_frame_now" ||
    selectedActionId === "configure_vision_provider" ||
    selectedActionId === "attach_audio_or_transcript_source"
  ) {
    ok = false;
    summary = `${selectedActionId} requires user permission or external configuration.`;
    nextRequiredAction = selectedActionId;
  }
  const after = input.plan.producer_id ? runVisualCadenceAcceptance({ producerId: input.plan.producer_id }) : null;
  return {
    schema: HELIX_LIVE_RUNTIME_REPAIR_RECEIPT_SCHEMA,
    repair_receipt_id: `live_runtime_repair_receipt:${hashShort([input.plan.repair_plan_id, selectedActionId, Date.now()])}`,
    repair_plan_id: input.plan.repair_plan_id,
    thread_id: input.plan.thread_id,
    selected_action_id: selectedActionId as any,
    ok,
    summary,
    tool_observation_refs: refs,
    acceptance_before: before,
    acceptance_after: after,
    next_required_action: nextRequiredAction,
    assistant_answer: false,
    raw_content_included: false,
  };
}
