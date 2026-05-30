import type { TheoryRuntimeAdapter } from "./theory-runtime-adapter-types";

const theoryRuntimeAdapters = new Map<string, TheoryRuntimeAdapter>();

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`Theory runtime adapter ${field} must be a non-empty string.`);
}

function includesBadge(adapter: TheoryRuntimeAdapter, badgeId: string): boolean {
  return adapter.supportedBadgeIds.includes(badgeId);
}

export function registerTheoryRuntimeAdapter(adapter: TheoryRuntimeAdapter): TheoryRuntimeAdapter {
  assertNonEmpty(adapter.runtimeId, "runtimeId");
  assertNonEmpty(adapter.family, "family");
  assertNonEmpty(adapter.laneId, "laneId");
  if (theoryRuntimeAdapters.has(adapter.runtimeId)) {
    throw new Error(`Theory runtime adapter ${adapter.runtimeId} is already registered.`);
  }
  theoryRuntimeAdapters.set(adapter.runtimeId, adapter);
  return adapter;
}

export function getTheoryRuntimeAdapter(runtimeId: string): TheoryRuntimeAdapter | null {
  return theoryRuntimeAdapters.get(runtimeId) ?? null;
}

export function findTheoryRuntimeAdaptersForBadge(badgeId: string): TheoryRuntimeAdapter[] {
  if (!badgeId.trim()) return [];
  return listTheoryRuntimeAdapters().filter((adapter) => includesBadge(adapter, badgeId));
}

export function findTheoryRuntimeAdaptersForLane(laneId: string): TheoryRuntimeAdapter[] {
  if (!laneId.trim()) return [];
  return listTheoryRuntimeAdapters().filter((adapter) => adapter.laneId === laneId);
}

export function listTheoryRuntimeAdapters(): TheoryRuntimeAdapter[] {
  return Array.from(theoryRuntimeAdapters.values());
}

export function clearTheoryRuntimeAdapterRegistryForTests(): void {
  theoryRuntimeAdapters.clear();
}

export type { TheoryRuntimeAdapter } from "./theory-runtime-adapter-types";
export {
  THEORY_RUNTIME_ADAPTER_CAPABILITY_VALUES,
  type TheoryRuntimeAdapterCapability,
  type TheoryRuntimeAdapterInput,
} from "./theory-runtime-adapter-types";
