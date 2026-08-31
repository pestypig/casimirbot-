export const DESKTOP_MINECRAFT_RUN_PROFILE_SCHEMA =
  "casimir_desktop_minecraft_run_profile/2" as const;

export type DesktopMinecraftRunProfileState = Readonly<{
  schema: typeof DESKTOP_MINECRAFT_RUN_PROFILE_SCHEMA;
  configured: boolean;
  label: string | null;
  runDirectory: string | null;
  playerGameDirectory: string | null;
}>; 

export const parseDesktopMinecraftRunProfileState = (
  value: unknown,
): DesktopMinecraftRunProfileState | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== 5 ||
    record.schema !== DESKTOP_MINECRAFT_RUN_PROFILE_SCHEMA ||
    typeof record.configured !== "boolean" ||
    (record.label !== null && typeof record.label !== "string") ||
    (record.runDirectory !== null && typeof record.runDirectory !== "string") ||
    (record.playerGameDirectory !== null &&
      typeof record.playerGameDirectory !== "string")
  ) return null;
  if (record.configured !== (record.label !== null && record.runDirectory !== null)) {
    return null;
  }
  return record as DesktopMinecraftRunProfileState;
};
