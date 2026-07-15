import { buildTheoryRuntimeJobSnapshotV1, type TheoryRuntimeJobSnapshotV1 } from "../../../../shared/contracts/theory-runtime-job.v1";
import type { TheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryRuntimeRunRequestV1 } from "../../../../shared/contracts/theory-runtime-run-request.v1";

export function projectTheoryRuntimeJob(
  request: TheoryRuntimeRunRequestV1,
  receipt: TheoryRuntimeReceiptV1 | null,
): TheoryRuntimeJobSnapshotV1 {
  const failed = request.status === "failed" || request.status === "timeout" || request.status === "cancelled";
  return buildTheoryRuntimeJobSnapshotV1({
    jobId: request.requestId,
    request,
    result: {
      available: Boolean(receipt),
      receiptId: receipt?.receiptId ?? null,
      errorCode: failed && !receipt ? `runtime_${request.status}` : null,
      errorMessage: failed && !receipt ? request.heartbeat.message : null,
    },
  });
}
