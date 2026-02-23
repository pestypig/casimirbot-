export type VoiceGovernanceConfig = {
  providerMode: "local_only" | "allow_remote";
  providerAllowlist: string[];
  commercialMode: boolean;
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

const parseCommercialMode = (value: string | undefined): boolean => {
  const normalized = value?.trim();
  return normalized === "1" || normalized === "true";
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

  return {
    port,
    host,
    isDeploy,
    fallbackPort,
    sourcePort: env.PORT,
    sourceHost: env.HOST,
    voiceGovernance: {
      providerMode: parseProviderMode(env.VOICE_PROVIDER_MODE),
      providerAllowlist: parseCsvAllowlist(env.VOICE_PROVIDER_ALLOWLIST),
      commercialMode: parseCommercialMode(env.VOICE_COMMERCIAL_MODE),
    },
  };
};
