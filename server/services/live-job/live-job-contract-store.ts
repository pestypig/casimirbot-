import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";

export type StoredLiveJobContract = SituationRoomLiveJobContract & {
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
};

const contractsById = new Map<string, StoredLiveJobContract>();
const contractIdsByThread = new Map<string, string[]>();
const contractIdsByRoom = new Map<string, string[]>();

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const pushId = (index: Map<string, string[]>, key: string | null | undefined, id: string): void => {
  const normalizedKey = normalizeString(key);
  if (!normalizedKey) return;
  const current = index.get(normalizedKey) ?? [];
  index.set(normalizedKey, Array.from(new Set([...current, id])).slice(-500));
};

export function upsertLiveJobContract(input: {
  contract: SituationRoomLiveJobContract;
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
}): StoredLiveJobContract {
  const existing = contractsById.get(input.contract.contract_id);
  const contract: StoredLiveJobContract = {
    ...existing,
    ...input.contract,
    thread_id: normalizeString(input.thread_id) ?? existing?.thread_id ?? null,
    room_id: normalizeString(input.room_id) ?? existing?.room_id ?? null,
    environment_id: normalizeString(input.environment_id) ?? existing?.environment_id ?? null,
    assistant_answer: false,
    raw_content_included: false,
  };
  contractsById.set(contract.contract_id, contract);
  pushId(contractIdsByThread, contract.thread_id, contract.contract_id);
  pushId(contractIdsByRoom, contract.room_id, contract.contract_id);
  return contract;
}

export function getLiveJobContract(contractId: string): StoredLiveJobContract | null {
  return contractsById.get(contractId) ?? null;
}

export function listLiveJobContracts(input: {
  threadId?: string | null;
  roomId?: string | null;
  runtimeStatus?: SituationRoomLiveJobContract["runtime_status"] | string | null;
  selectedRecipe?: string | null;
  limit?: number;
} = {}): StoredLiveJobContract[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(500, Math.trunc(input.limit ?? 100))) : 100;
  const ids = input.threadId
    ? contractIdsByThread.get(input.threadId) ?? []
    : input.roomId
      ? contractIdsByRoom.get(input.roomId) ?? []
      : Array.from(contractsById.keys());
  return ids
    .map((id) => contractsById.get(id))
    .filter((entry): entry is StoredLiveJobContract => Boolean(entry))
    .filter((entry) => !input.runtimeStatus || entry.runtime_status === input.runtimeStatus)
    .filter((entry) => !input.selectedRecipe || entry.selected_recipe === input.selectedRecipe)
    .slice(-limit);
}

export function resetLiveJobContractStoreForTest(): void {
  contractsById.clear();
  contractIdsByThread.clear();
  contractIdsByRoom.clear();
}
