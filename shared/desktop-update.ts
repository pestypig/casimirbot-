export const DESKTOP_UPDATE_STATE_SCHEMA_VERSION = 1 as const;

export const DESKTOP_UPDATE_PHASES = [
  "unavailable",
  "idle",
  "checking",
  "available",
  "downloading",
  "downloaded",
  "error",
] as const;

export type DesktopUpdatePhase = (typeof DESKTOP_UPDATE_PHASES)[number];

export type DesktopUpdateState = Readonly<{
  schemaVersion: typeof DESKTOP_UPDATE_STATE_SCHEMA_VERSION;
  phase: DesktopUpdatePhase;
  currentVersion: string;
  availableVersion: string | null;
  progressPercent: number | null;
  errorCode: string | null;
  canCheck: boolean;
  canDownload: boolean;
  canInstall: boolean;
}>;

export const parseDesktopUpdateState = (
  value: unknown,
): DesktopUpdateState | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DesktopUpdateState>;
  if (
    candidate.schemaVersion !== DESKTOP_UPDATE_STATE_SCHEMA_VERSION ||
    !DESKTOP_UPDATE_PHASES.includes(candidate.phase as DesktopUpdatePhase) ||
    typeof candidate.currentVersion !== "string" ||
    (candidate.availableVersion !== null &&
      typeof candidate.availableVersion !== "string") ||
    (candidate.progressPercent !== null &&
      (typeof candidate.progressPercent !== "number" ||
        !Number.isFinite(candidate.progressPercent) ||
        candidate.progressPercent < 0 ||
        candidate.progressPercent > 100)) ||
    (candidate.errorCode !== null && typeof candidate.errorCode !== "string") ||
    typeof candidate.canCheck !== "boolean" ||
    typeof candidate.canDownload !== "boolean" ||
    typeof candidate.canInstall !== "boolean"
  ) {
    return null;
  }
  return Object.freeze(candidate as DesktopUpdateState);
};
