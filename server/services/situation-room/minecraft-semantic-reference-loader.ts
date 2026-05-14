import fs from "node:fs";
import path from "node:path";
import type { GameSemanticEntry } from "@shared/helix-game-semantic-dictionary";

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "docs/knowledge/minecraft");
const FILES = ["entities.json", "items.json", "blocks.json", "patterns.json"] as const;

let cachedEntries: GameSemanticEntry[] | null = null;

const normalizeId = (value: string): string => value.trim().toLowerCase();

const readEntriesFile = (fileName: string): GameSemanticEntry[] => {
  const filePath = path.join(KNOWLEDGE_DIR, fileName);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((entry: unknown): entry is GameSemanticEntry =>
    Boolean(entry) &&
    typeof entry === "object" &&
    (entry as GameSemanticEntry).schema === "helix.game_semantic_entry.v1" &&
    typeof (entry as GameSemanticEntry).entry_id === "string",
  );
};

export function loadMinecraftSemanticEntries(): GameSemanticEntry[] {
  if (cachedEntries) return cachedEntries;
  cachedEntries = FILES.flatMap((fileName: typeof FILES[number]) => readEntriesFile(fileName));
  return cachedEntries;
}

export function clearMinecraftSemanticReferenceCacheForTest(): void {
  cachedEntries = null;
}

export function findMinecraftSemanticEntries(queryRefs: string[]): GameSemanticEntry[] {
  const normalizedQueries = new Set(queryRefs.map(normalizeId));
  return loadMinecraftSemanticEntries().filter((entry: GameSemanticEntry) => {
    const ids = [
      entry.entry_id,
      entry.entry_id.replace("minecraft:entity/", "minecraft:"),
      entry.entry_id.replace("minecraft:item/", "minecraft:"),
      entry.entry_id.replace("minecraft:block/", "minecraft:"),
      entry.label,
      ...entry.categories,
      ...(entry.resources ?? []).map((resource: NonNullable<GameSemanticEntry["resources"]>[number]) => resource.item_id),
    ].map((id: string) => normalizeId(id));
    return ids.some((id: string) => normalizedQueries.has(id));
  });
}
