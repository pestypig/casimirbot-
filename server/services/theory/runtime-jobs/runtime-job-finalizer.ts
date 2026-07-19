import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type {
  TheoryRuntimeRunRequestStatus,
  TheoryRuntimeRunRequestV1,
} from "../../../../shared/contracts/theory-runtime-run-request.v1";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import { updateTheoryRuntimeRunRequestStatus } from "../theory-runtime-run-request-manifest";
import { writeTheoryRuntimeJobReceipt } from "./runtime-job-store";

export function requestStatusForRuntimeReceipt(
  receipt: TheoryRuntimeReceiptV1,
): Extract<TheoryRuntimeRunRequestStatus, "completed" | "failed" | "timeout"> {
  if (receipt.status === "timeout" || receipt.execution?.timedOut) return "timeout";
  if (receipt.execution) {
    if (receipt.execution.exitCode !== 0) return "failed";
    return ["completed", "blocked", "not_run", "stale"].includes(receipt.status)
      ? "completed"
      : "failed";
  }
  if (receipt.status === "completed") return "completed";
  return "failed";
}

export async function persistAndFinalizeTheoryRuntimeJob(input: {
  requestId: string;
  receipt: TheoryRuntimeReceiptV1;
  projectRoot?: string;
}): Promise<TheoryRuntimeRunRequestV1> {
  // The receipt is committed first so clients can never observe a newly terminal
  // manifest whose structured result has not been published yet.
  await writeTheoryRuntimeJobReceipt(input);
  const status = requestStatusForRuntimeReceipt(input.receipt);
  const evidenceMessage = status === "completed" && input.receipt.status !== "completed"
    ? `Process completed; evidence receipt ${input.receipt.status}.`
    : input.receipt.outputs.warnings[0] ?? `Runtime ${status}.`;
  const { request } = await updateTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot: input.projectRoot,
    status,
    updatedAt: input.receipt.provenance.completedAt ?? input.receipt.generatedAt,
    heartbeat: {
      stage: status,
      message: evidenceMessage,
      progress: 1,
    },
  });
  return request;
}

export function buildInterruptedTheoryRuntimeReceipt(
  request: TheoryRuntimeRunRequestV1,
  generatedAt = new Date().toISOString(),
): TheoryRuntimeReceiptV1 {
  const entrypoint = getTheoryRuntimeEntrypoint(request.runtimeId);
  return buildTheoryRuntimeReceiptV1({
    generatedAt,
    receiptId: `runtime-interrupted:${request.requestId}`,
    runtimeId: request.runtimeId,
    graphId: request.graphId,
    badgeIds: request.badgeIds,
    command: entrypoint?.command ?? null,
    args: {
      adapter: "durable_runtime_job_recovery",
      interrupted_request_status: request.status,
    },
    status: "failed",
    outputs: {
      artifacts: [],
      scalars: {},
      units: {},
      gates: { runtime_execution: "fail" },
      missingSignals: ["runtime_process_interrupted"],
      warnings: [
        "The server no longer owns the process recorded by this running job; it was closed as interrupted instead of reporting false progress or silently rerunning it.",
      ],
    },
    provenance: {
      gitSha: null,
      startedAt: request.status === "running" ? request.updatedAt : null,
      completedAt: generatedAt,
      durationMs: null,
    },
    claimBoundary: {
      currentTier: request.claimBoundary.currentTier,
      maximumTier: request.claimBoundary.maximumTier,
      promotionAllowed: false,
      promotionBlockedBy: [
        ...request.claimBoundary.promotionRequires,
        "runtime_process_interrupted",
      ],
    },
  });
}
