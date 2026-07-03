import type { HelixInterimVoiceCalloutReceiptV1 } from "@shared/contracts/helix-interim-voice-callout.v1";

export function createInterimVoiceCalloutReceiptStore(input: {
  limit: number;
}) {
  const receiptById = new Map<string, HelixInterimVoiceCalloutReceiptV1>();
  const limit = Math.max(1, Math.floor(input.limit));

  const prune = () => {
    while (receiptById.size > limit) {
      const firstKey = receiptById.keys().next().value;
      if (!firstKey) break;
      receiptById.delete(firstKey);
    }
  };

  return {
    get(receiptId: string): HelixInterimVoiceCalloutReceiptV1 | null {
      return receiptById.get(receiptId) ?? null;
    },

    set(receipt: HelixInterimVoiceCalloutReceiptV1): void {
      receiptById.set(receipt.receiptId, receipt);
      prune();
    },

    values(): HelixInterimVoiceCalloutReceiptV1[] {
      return Array.from(receiptById.values());
    },

    list(inputList: {
      requestId?: string | null;
      limit?: number;
    } = {}): HelixInterimVoiceCalloutReceiptV1[] {
      const listLimit = Math.max(1, Math.min(inputList.limit ?? 50, limit));
      return Array.from(receiptById.values())
        .filter((entry) => !inputList.requestId || entry.requestId === inputList.requestId)
        .slice(-listLimit);
    },

    clear(): void {
      receiptById.clear();
    },
  };
}
