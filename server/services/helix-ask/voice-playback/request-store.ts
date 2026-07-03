import type { HelixInterimVoiceCalloutRequestV1 } from "@shared/contracts/helix-interim-voice-callout.v1";

export function createInterimVoiceCalloutRequestStore(input: {
  limit: number;
}) {
  const requestById = new Map<string, HelixInterimVoiceCalloutRequestV1>();
  const limit = Math.max(1, Math.floor(input.limit));

  const prune = () => {
    while (requestById.size > limit) {
      const firstKey = requestById.keys().next().value;
      if (!firstKey) break;
      requestById.delete(firstKey);
    }
  };

  return {
    get(requestId: string): HelixInterimVoiceCalloutRequestV1 | null {
      return requestById.get(requestId) ?? null;
    },

    set(request: HelixInterimVoiceCalloutRequestV1): void {
      requestById.set(request.requestId, request);
      prune();
    },

    values(): HelixInterimVoiceCalloutRequestV1[] {
      return Array.from(requestById.values());
    },

    list(inputList: {
      threadId?: string | null;
      turnId?: string | null;
      limit?: number;
    } = {}): HelixInterimVoiceCalloutRequestV1[] {
      const listLimit = Math.max(1, Math.min(inputList.limit ?? 50, limit));
      return Array.from(requestById.values())
        .filter((entry) => !inputList.threadId || entry.threadId === inputList.threadId)
        .filter((entry) => !inputList.turnId || entry.turnId === inputList.turnId)
        .slice(-listLimit);
    },

    clear(): void {
      requestById.clear();
    },
  };
}
