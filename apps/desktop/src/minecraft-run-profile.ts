import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  DESKTOP_MINECRAFT_RUN_PROFILE_SCHEMA,
  type DesktopMinecraftRunProfileState,
} from "../../../shared/desktop-minecraft-run-profile";
import { DESKTOP_LOCAL_MINECRAFT_PROFILES_RELATIVE_PATH } from
  "./service-environment";

const STORE_SCHEMA_V1 = "casimirbot.local_minecraft_run_profiles/1" as const;
const STORE_SCHEMA = "casimirbot.local_minecraft_run_profiles/2" as const;

type StoredProfile = {
  owner_profile_id: string;
  run_directory: string;
  player_game_directory: string | null;
  label: string;
};

const storePath = (userDataPath: string) => path.join(
  path.resolve(userDataPath),
  DESKTOP_LOCAL_MINECRAFT_PROFILES_RELATIVE_PATH,
);

const readProfiles = (userDataPath: string): StoredProfile[] => {
  const filePath = storePath(userDataPath);
  if (!existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
      schema?: unknown;
      profiles?: unknown;
    };
    if (!Array.isArray(parsed.profiles)) return [];
    if (parsed.schema === STORE_SCHEMA_V1) {
      return parsed.profiles.flatMap((entry) =>
        Boolean(entry) && typeof entry === "object" &&
        typeof (entry as StoredProfile).owner_profile_id === "string" &&
        typeof (entry as StoredProfile).run_directory === "string" &&
        typeof (entry as StoredProfile).label === "string"
          ? [{
              owner_profile_id: (entry as StoredProfile).owner_profile_id,
              run_directory: (entry as StoredProfile).run_directory,
              player_game_directory: null,
              label: (entry as StoredProfile).label,
            }]
          : []);
    }
    if (parsed.schema !== STORE_SCHEMA) return [];
    return parsed.profiles.filter((entry): entry is StoredProfile =>
      Boolean(entry) && typeof entry === "object" &&
      typeof (entry as StoredProfile).owner_profile_id === "string" &&
      typeof (entry as StoredProfile).run_directory === "string" &&
      ((entry as StoredProfile).player_game_directory === null ||
        typeof (entry as StoredProfile).player_game_directory === "string") &&
      typeof (entry as StoredProfile).label === "string");
  } catch {
    return [];
  }
};

const state = (entry?: StoredProfile): DesktopMinecraftRunProfileState =>
  Object.freeze({
    schema: DESKTOP_MINECRAFT_RUN_PROFILE_SCHEMA,
    configured: Boolean(entry),
    label: entry?.label ?? null,
    runDirectory: entry?.run_directory ?? null,
    playerGameDirectory: entry?.player_game_directory ?? null,
  });

export const inspectDesktopMinecraftRunProfile = (input: {
  userDataPath: string;
  ownerProfileId: string;
}): DesktopMinecraftRunProfileState => state(
  readProfiles(input.userDataPath).find(
    (entry) => entry.owner_profile_id === input.ownerProfileId,
  ),
);

export const saveDesktopMinecraftRunProfile = (input: {
  userDataPath: string;
  ownerProfileId: string;
  runDirectory: string;
}): DesktopMinecraftRunProfileState => {
  const selected = path.win32.resolve(input.runDirectory);
  if (
    !/^[A-Za-z]:[\\/]/u.test(input.runDirectory) ||
    input.runDirectory.startsWith("\\\\") ||
    selected === path.win32.parse(selected).root ||
    !existsSync(path.join(selected, "config")) ||
    !existsSync(path.join(selected, "server.properties"))
  ) throw new Error("minecraft_run_profile_invalid");
  const label = path.win32.basename(selected).slice(0, 120);
  const profiles = readProfiles(input.userDataPath).filter(
    (entry) => entry.owner_profile_id !== input.ownerProfileId,
  );
  const current = readProfiles(input.userDataPath).find(
    (entry) => entry.owner_profile_id === input.ownerProfileId,
  );
  const entry = {
    owner_profile_id: input.ownerProfileId,
    run_directory: selected,
    player_game_directory: current?.player_game_directory ?? null,
    label,
  };
  profiles.push(entry);
  const filePath = storePath(input.userDataPath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ schema: STORE_SCHEMA, profiles }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, filePath);
  return state(entry);
};

export const saveDesktopMinecraftPlayerGameDirectory = (input: {
  userDataPath: string;
  ownerProfileId: string;
  playerGameDirectory: string;
}): DesktopMinecraftRunProfileState => {
  const selected = path.win32.resolve(input.playerGameDirectory);
  if (
    !/^[A-Za-z]:[\\/]/u.test(input.playerGameDirectory) ||
    input.playerGameDirectory.startsWith("\\\\") ||
    selected === path.win32.parse(selected).root ||
    !existsSync(path.join(selected, "config")) ||
    !existsSync(path.join(selected, "mods"))
  ) throw new Error("minecraft_player_game_directory_invalid");
  const profiles = readProfiles(input.userDataPath);
  const current = profiles.find(
    (entry) => entry.owner_profile_id === input.ownerProfileId,
  );
  if (!current) throw new Error("minecraft_server_run_profile_required");
  const entry: StoredProfile = {
    ...current,
    player_game_directory: selected,
  };
  const updated = profiles.filter(
    (candidate) => candidate.owner_profile_id !== input.ownerProfileId,
  );
  updated.push(entry);
  const filePath = storePath(input.userDataPath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ schema: STORE_SCHEMA, profiles: updated }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, filePath);
  return state(entry);
};

export const clearDesktopMinecraftRunProfile = (input: {
  userDataPath: string;
  ownerProfileId: string;
}): DesktopMinecraftRunProfileState => {
  const profiles = readProfiles(input.userDataPath).filter(
    (entry) => entry.owner_profile_id !== input.ownerProfileId,
  );
  const filePath = storePath(input.userDataPath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ schema: STORE_SCHEMA, profiles }, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, filePath);
  return state();
};
