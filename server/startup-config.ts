export type VoiceGovernanceConfig = {
  providerMode: "local_only" | "allow_remote";
  providerAllowlist: string[];
  commercialMode: boolean;
  managedProvidersEnabled: boolean;
  localOnlyMissionMode: boolean;
};

export type StartupConfig = {
  port: number;
  host: string;
  isDeploy: boolean;
  fallbackPort: number;
  sourcePort: string | undefined;
  sourceHost: string | undefined;
  voiceGovernance: VoiceGovernanceConfig;
};

const parseProviderMode = (value: string | undefined): "local_only" | "allow_remote" => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "local_only") return "local_only";
  return "allow_remote";
};

const parseCsvAllowlist = (value: string | undefined): string[] => {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
};

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value?.trim()) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return defaultValue;
};

const parsePositivePort = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
};

export const resolveStartupConfig = (env: NodeJS.ProcessEnv, appEnv: string): StartupConfig => {
  const fallbackPort = appEnv === "production" ? 5000 : 5173;
  const isDeploy =
    env.REPLIT_DEPLOYMENT === "1" ||
    env.REPLIT_DEPLOYMENT === "true" ||
    env.DEPLOYMENT === "1" ||
    env.DEPLOYMENT === "true";

  const port = parsePositivePort(env.PORT) ?? fallbackPort;
  const host = env.HOST?.trim() ? env.HOST.trim() : "0.0.0.0";
  const providerMode = parseProviderMode(env.VOICE_PROVIDER_MODE);
  const managedProvidersEnabled = parseBooleanFlag(env.VOICE_MANAGED_PROVIDERS_ENABLED, true);
  const localOnlyMissionMode = parseBooleanFlag(env.VOICE_LOCAL_ONLY_MISSION_MODE, true);

  return {
    port,
    host,
    isDeploy,
    fallbackPort,
    sourcePort: env.PORT,
    sourceHost: env.HOST,
    voiceGovernance: {
      providerMode,
      providerAllowlist: parseCsvAllowlist(env.VOICE_PROVIDER_ALLOWLIST),
      commercialMode: parseBooleanFlag(env.VOICE_COMMERCIAL_MODE, false),
      managedProvidersEnabled,
      localOnlyMissionMode: providerMode === "local_only" ? true : localOnlyMissionMode,
    },
  };
};
