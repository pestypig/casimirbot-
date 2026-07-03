import type { HelixInterimVoiceCalloutReceiptV1 } from "@shared/contracts/helix-interim-voice-callout.v1";

export type NormalizedVoicePlaybackOutcomeStatus =
  | "delivered"
  | "failed"
  | "cancelled"
  | "suppressed"
  | "queued";

export function normalizeVoicePlaybackOutcomeStatus(
  value: string | null | undefined,
): NormalizedVoicePlaybackOutcomeStatus | null {
  if (
    value === "delivered" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "suppressed" ||
    value === "queued"
  ) {
    return value;
  }
  return null;
}

export function isClientVoicePlaybackOutcomeReceipt(
  receipt: HelixInterimVoiceCalloutReceiptV1,
): boolean {
  return receipt.delivery?.provider !== "helix_interim_voice_callout" &&
    (
      receipt.status === "queued" ||
      receipt.status === "awaiting_client_playback" ||
      receipt.status === "delivered" ||
      receipt.status === "failed" ||
      receipt.delivery?.playbackStatus === "client_confirmed" ||
      receipt.delivery?.blockedReason === "cancelled" ||
      receipt.delivery?.blockedReason === "suppressed"
    );
}

export function findLatestClientVoicePlaybackOutcomeReceipt(input: {
  receipts: Iterable<HelixInterimVoiceCalloutReceiptV1>;
  requestId: string;
}): HelixInterimVoiceCalloutReceiptV1 | null {
  const receipts = Array.from(input.receipts)
    .filter((receipt) =>
      receipt.requestId === input.requestId &&
      isClientVoicePlaybackOutcomeReceipt(receipt)
    );
  return receipts.at(-1) ?? null;
}

export function createVoicePlaybackOutcomeWaiterStore() {
  const waitersByRequestId = new Map<
    string,
    Set<(receipt: HelixInterimVoiceCalloutReceiptV1) => void>
  >();

  return {
    notify(receipt: HelixInterimVoiceCalloutReceiptV1): void {
      if (!isClientVoicePlaybackOutcomeReceipt(receipt)) return;
      const waiters = waitersByRequestId.get(receipt.requestId);
      if (!waiters?.size) return;
      waitersByRequestId.delete(receipt.requestId);
      for (const resolve of waiters) {
        resolve(receipt);
      }
    },

    wait(input: {
      requestId: string;
      timeoutMs: number;
      findLatest: () => HelixInterimVoiceCalloutReceiptV1 | null;
    }): Promise<HelixInterimVoiceCalloutReceiptV1 | null> {
      const existing = input.findLatest();
      if (existing) return Promise.resolve(existing);
      if (input.timeoutMs <= 0) return Promise.resolve(null);
      return new Promise((resolve) => {
        const waiter = (receipt: HelixInterimVoiceCalloutReceiptV1) => {
          clearTimeout(timer);
          resolve(receipt);
        };
        const waiters = waitersByRequestId.get(input.requestId) ?? new Set();
        waiters.add(waiter);
        waitersByRequestId.set(input.requestId, waiters);
        const timer = setTimeout(() => {
          const current = waitersByRequestId.get(input.requestId);
          current?.delete(waiter);
          if (current && current.size === 0) waitersByRequestId.delete(input.requestId);
          resolve(input.findLatest());
        }, input.timeoutMs);
      });
    },

    reset(): void {
      waitersByRequestId.clear();
    },
  };
}
