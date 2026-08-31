import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const STORE_SCHEMA_V1 = "casimirbot.local_minecraft_run_profiles/1" as const;
const STORE_SCHEMA = "casimirbot.local_minecraft_run_profiles/2" as const;
const MAX_STORE_BYTES = 64 * 1024;

type StoreEntry = Readonly<{
  owner_profile_id: string;
  run_directory: string;
  player_game_directory?: string | null;
  label: string;
}>;

const exactLocalWindowsDirectory = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length > 1_024) return null;
  const trimmed = value.trim();
  if (!/^[A-Za-z]:[\\/]/u.test(trimmed) || trimmed.startsWith("\\\\")) {
    return null;
  }
  const resolved = path.win32.resolve(trimmed);
  if (resolved === path.win32.parse(resolved).root) return null;
  return resolved;
};

export const resolveProfileOwnedMinecraftRunDirectory = async (input: {
  ownerProfileId: string;
  storePath?: string | null;
}): Promise<string | null> => {
  const ownerProfileId = input.ownerProfileId.trim();
  const storePath = input.storePath?.trim();
  if (!ownerProfileId || !storePath) return null;
  const storeStat = await stat(storePath).catch(() => null);
  if (!storeStat?.isFile() || storeStat.size <= 0 || storeStat.size > MAX_STORE_BYTES) {
    return null;
  }
  const parsed = JSON.parse(await readFile(storePath, "utf8")) as {
    schema?: unknown;
    profiles?: unknown;
  };
  if (
    (parsed.schema !== STORE_SCHEMA && parsed.schema !== STORE_SCHEMA_V1) ||
    !Array.isArray(parsed.profiles)
  ) {
    return null;
  }
  const matches = parsed.profiles.filter((candidate): candidate is StoreEntry => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return false;
    }
    const entry = candidate as Record<string, unknown>;
    const expectedKeys = parsed.schema === STORE_SCHEMA ? 4 : 3;
    return Object.keys(entry).length === expectedKeys &&
      entry.owner_profile_id === ownerProfileId &&
      typeof entry.label === "string" &&
      entry.label.trim().length > 0 &&
      entry.label.length <= 120 &&
      exactLocalWindowsDirectory(entry.run_directory) !== null;
  });
  if (matches.length !== 1) return null;
  const runDirectory = exactLocalWindowsDirectory(matches[0].run_directory);
  if (!runDirectory) return null;
  const [directory, config, properties] = await Promise.all([
    stat(runDirectory).catch(() => null),
    stat(path.join(runDirectory, "config")).catch(() => null),
    stat(path.join(runDirectory, "server.properties")).catch(() => null),
  ]);
  return directory?.isDirectory() && config?.isDirectory() && properties?.isFile()
    ? runDirectory
    : null;
};

export const resolveProfileOwnedMinecraftPlayerGameDirectory = async (input: {
  ownerProfileId: string;
  storePath?: string | null;
}): Promise<string | null> => {
  const ownerProfileId = input.ownerProfileId.trim();
  const storePath = input.storePath?.trim();
  if (!ownerProfileId || !storePath) return null;
  const storeStat = await stat(storePath).catch(() => null);
  if (!storeStat?.isFile() || storeStat.size <= 0 || storeStat.size > MAX_STORE_BYTES) {
    return null;
  }
  const parsed = JSON.parse(await readFile(storePath, "utf8")) as {
    schema?: unknown;
    profiles?: unknown;
  };
  if (parsed.schema !== STORE_SCHEMA || !Array.isArray(parsed.profiles)) {
    return null;
  }
  const matches = parsed.profiles.filter((candidate): candidate is StoreEntry => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return false;
    }
    const entry = candidate as Record<string, unknown>;
    return Object.keys(entry).length === 4 &&
      entry.owner_profile_id === ownerProfileId &&
      typeof entry.label === "string" &&
      entry.label.trim().length > 0 &&
      entry.label.length <= 120 &&
      exactLocalWindowsDirectory(entry.run_directory) !== null &&
      exactLocalWindowsDirectory(entry.player_game_directory) !== null;
  });
  if (matches.length !== 1) return null;
  const gameDirectory = exactLocalWindowsDirectory(
    matches[0].player_game_directory,
  );
  if (!gameDirectory) return null;
  const [directory, config, mods] = await Promise.all([
    stat(gameDirectory).catch(() => null),
    stat(path.join(gameDirectory, "config")).catch(() => null),
    stat(path.join(gameDirectory, "mods")).catch(() => null),
  ]);
  return directory?.isDirectory() && config?.isDirectory() && mods?.isDirectory()
    ? gameDirectory
    : null;
};
