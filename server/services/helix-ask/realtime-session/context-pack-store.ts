import type { HelixRealtimeStagePlayContextPackV1 } from
  "@shared/contracts/helix-realtime-stage-play.v1";

const MAX_CONTEXT_PACKS = 240;
const packsByHandoffId = new Map<string, HelixRealtimeStagePlayContextPackV1>();

export const storeRealtimeStagePlayContextPack = (input: {
  handoffId: string;
  contextPack: HelixRealtimeStagePlayContextPackV1;
}): void => {
  packsByHandoffId.set(input.handoffId, input.contextPack);
  if (packsByHandoffId.size <= MAX_CONTEXT_PACKS) return;
  const oldestHandoffId = packsByHandoffId.keys().next().value;
  if (typeof oldestHandoffId === "string") packsByHandoffId.delete(oldestHandoffId);
};

export const readRealtimeStagePlayContextPack = (
  handoffId: string,
): HelixRealtimeStagePlayContextPackV1 | null =>
  packsByHandoffId.get(handoffId) ?? null;

export const deleteRealtimeStagePlayContextPack = (handoffId: string): void => {
  packsByHandoffId.delete(handoffId);
};

export const resetRealtimeStagePlayContextPacksForTests = (): void => {
  packsByHandoffId.clear();
};
