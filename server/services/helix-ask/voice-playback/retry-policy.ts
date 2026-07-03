import crypto from "node:crypto";
import type {
  HelixInterimVoiceCalloutReceiptV1,
  HelixInterimVoiceCalloutRequestV1,
} from "@shared/contracts/helix-interim-voice-callout.v1";
import { runtimeMemoryGovernor } from "../../runtime/runtime-memory-governor";

const DEFAULT_RETRY_TTL_MS = 90_000;
const DEFAULT_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_JOBS_PER_THREAD = 5;

type InterimVoiceDeliveryRetryJob = {
  jobId: string;
  requestId: string;
  threadId: string;
  turnId: string;
  createdAtMs: number;
  nextRetryAtMs: number;
  expiresAtMs: number;
  retryCount: number;
  blockedReason: string;
  status: "queued_for_retry" | "awaiting_client_playback" | "expired" | "superseded" | "failed";
  latestReceiptId: string;
};

type BuildInterimVoiceReceipt = (input: {
  request: HelixInterimVoiceCalloutRequestV1;
  status: HelixInterimVoiceCalloutReceiptV1["status"];
  message?: string | null;
  utteranceId?: string | null;
  provider?: string | null;
  nextRetryAtMs?: number | null;
  retryCount?: number | null;
  blockedReason?: string | null;
}) => HelixInterimVoiceCalloutReceiptV1;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createInterimVoiceDeliveryRetryPolicy(input: {
  getRequestById: (requestId: string) => HelixInterimVoiceCalloutRequestV1 | null;
  buildReceipt: BuildInterimVoiceReceipt;
}) {
  const retryJobByRequestId = new Map<string, InterimVoiceDeliveryRetryJob>();

  const expireRetryJob = (
    job: InterimVoiceDeliveryRetryJob,
    request: HelixInterimVoiceCalloutRequestV1,
    status: "expired" | "superseded" = "expired",
  ): HelixInterimVoiceCalloutReceiptV1 => {
    job.status = status;
    const receipt = input.buildReceipt({
      request,
      status,
      message: status === "expired"
        ? "Interim voice callout retry expired before TTS capacity recovered."
        : "Interim voice callout retry was superseded by a newer delivery state.",
      retryCount: job.retryCount,
      blockedReason: job.blockedReason,
    });
    job.latestReceiptId = receipt.receiptId;
    retryJobByRequestId.delete(job.requestId);
    return receipt;
  };

  return {
    enqueueRetryJob(
      request: HelixInterimVoiceCalloutRequestV1,
      blockedReason: string,
    ): HelixInterimVoiceCalloutReceiptV1 {
      const nowMs = Date.now();
      const threadJobs = Array.from(retryJobByRequestId.values())
        .filter((job) => job.threadId === request.threadId && job.status === "queued_for_retry")
        .sort((a, b) => a.createdAtMs - b.createdAtMs);
      while (threadJobs.length >= MAX_RETRY_JOBS_PER_THREAD) {
        const oldest = threadJobs.shift();
        const oldRequest = oldest ? input.getRequestById(oldest.requestId) : null;
        if (oldest && oldRequest) {
          expireRetryJob(oldest, oldRequest, "superseded");
        } else if (oldest) {
          retryJobByRequestId.delete(oldest.requestId);
        }
      }
      const receipt = input.buildReceipt({
        request,
        status: "queued_for_retry",
        message: `Voice TTS admission blocked: ${blockedReason}; queued for retry.`,
        nextRetryAtMs: nowMs + DEFAULT_RETRY_DELAY_MS,
        retryCount: 0,
        blockedReason,
      });
      retryJobByRequestId.set(request.requestId, {
        jobId: `helix_interim_voice_delivery_job:${hashShort([request.requestId, nowMs])}`,
        requestId: request.requestId,
        threadId: request.threadId,
        turnId: request.turnId,
        createdAtMs: nowMs,
        nextRetryAtMs: nowMs + DEFAULT_RETRY_DELAY_MS,
        expiresAtMs: nowMs + DEFAULT_RETRY_TTL_MS,
        retryCount: 0,
        blockedReason,
        status: "queued_for_retry",
        latestReceiptId: receipt.receiptId,
      });
      return receipt;
    },

    retryQueuedDeliveries(inputRetry: {
      threadId?: string | null;
      turnId?: string | null;
      nowMs?: number;
      force?: boolean;
    } = {}): HelixInterimVoiceCalloutReceiptV1[] {
      const nowMs = inputRetry.nowMs ?? Date.now();
      const receipts: HelixInterimVoiceCalloutReceiptV1[] = [];
      for (const job of Array.from(retryJobByRequestId.values())) {
        if (inputRetry.threadId && job.threadId !== inputRetry.threadId) continue;
        if (inputRetry.turnId && job.turnId !== inputRetry.turnId) continue;
        if (job.status !== "queued_for_retry") continue;
        const request = input.getRequestById(job.requestId);
        if (!request) {
          retryJobByRequestId.delete(job.requestId);
          continue;
        }
        if (nowMs >= job.expiresAtMs) {
          receipts.push(expireRetryJob(job, request, "expired"));
          continue;
        }
        if (!inputRetry.force && nowMs < job.nextRetryAtMs) continue;
        const admission = runtimeMemoryGovernor.admitRuntimeTask({
          taskClass: "voice_tts",
          traceId: request.requestId,
          source: "helix.interim_voice_callout.retry",
        });
        if (!admission.admitted) {
          job.retryCount += 1;
          job.blockedReason = admission.reason;
          job.nextRetryAtMs = nowMs + Math.min(
            DEFAULT_RETRY_DELAY_MS * Math.max(1, job.retryCount + 1),
            30_000,
          );
          const receipt = input.buildReceipt({
            request,
            status: "queued_for_retry",
            message: `Voice TTS retry still blocked: ${admission.reason}.`,
            nextRetryAtMs: job.nextRetryAtMs,
            retryCount: job.retryCount,
            blockedReason: admission.reason,
          });
          job.latestReceiptId = receipt.receiptId;
          receipts.push(receipt);
          continue;
        }
        admission.lease?.release("completed");
        job.status = "awaiting_client_playback";
        const receipt = input.buildReceipt({
          request,
          status: "awaiting_client_playback",
          utteranceId: `interim_voice:${hashShort([request.requestId, "retry", job.retryCount])}`,
          message: "Interim voice callout accepted for client playback handoff after capacity retry; awaiting browser playback receipt.",
          retryCount: job.retryCount,
          blockedReason: job.blockedReason,
        });
        job.latestReceiptId = receipt.receiptId;
        retryJobByRequestId.delete(job.requestId);
        receipts.push(receipt);
      }
      return receipts;
    },

    reset(): void {
      retryJobByRequestId.clear();
    },
  };
}
