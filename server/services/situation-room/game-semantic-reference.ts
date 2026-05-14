import crypto from "node:crypto";
import {
  HELIX_GAME_SEMANTIC_LOOKUP_RECEIPT_SCHEMA,
  type GameSemanticEntry,
  type GameSemanticLookupReceipt,
} from "@shared/helix-game-semantic-dictionary";
import { findMinecraftSemanticEntries } from "./minecraft-semantic-reference-loader";

const receiptsByThread = new Map<string, GameSemanticLookupReceipt[]>();

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry: unknown) => String(entry ?? "").trim()).filter(Boolean)));

const summarizeEntries = (entries: GameSemanticEntry[]): string => {
  if (entries.length === 0) return "No semantic reference entries matched.";
  return entries
    .map((entry: GameSemanticEntry) => {
      const resources = (entry.resources ?? []).map((resource: NonNullable<GameSemanticEntry["resources"]>[number]) => `${resource.item_id} via ${resource.source}`).join(", ");
      const affordances = (entry.affordances ?? []).map((affordance: NonNullable<GameSemanticEntry["affordances"]>[number]) => affordance.affordance_id).join(", ");
      return `${entry.label} (${entry.entry_id}): ${resources || "no resource list"}${affordances ? `; affordances ${affordances}` : ""}`;
    })
    .join(" ");
};

export function lookupGameSemanticReference(input: {
  threadId: string;
  gameId: "minecraft" | string;
  queryRefs: string[];
  now?: string;
}): { receipt: GameSemanticLookupReceipt; entries: GameSemanticEntry[] } {
  const entries = input.gameId === "minecraft"
    ? findMinecraftSemanticEntries(input.queryRefs)
    : [];
  const queryRefs = uniqueStrings(input.queryRefs);
  const receipt: GameSemanticLookupReceipt = {
    schema: HELIX_GAME_SEMANTIC_LOOKUP_RECEIPT_SCHEMA,
    lookup_id: `game_semantic_lookup:${hashShort([input.threadId, input.gameId, queryRefs, entries.map((entry: GameSemanticEntry) => entry.entry_id)], 18)}`,
    thread_id: input.threadId,
    query_refs: queryRefs,
    matched_entry_ids: entries.map((entry: GameSemanticEntry) => entry.entry_id),
    compact_summary: summarizeEntries(entries),
    raw_reference_included: false,
    assistant_answer: false,
    ts: input.now ?? new Date().toISOString(),
  };
  const existing = receiptsByThread.get(input.threadId) ?? [];
  receiptsByThread.set(input.threadId, [...existing, receipt].slice(-200));
  return { receipt, entries };
}

export function listGameSemanticLookupReceipts(threadId: string): GameSemanticLookupReceipt[] {
  return [...(receiptsByThread.get(threadId) ?? [])];
}

export function clearGameSemanticLookupReceiptsForTest(): void {
  receiptsByThread.clear();
}
