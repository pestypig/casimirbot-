export type StartupConfig = {
  port: number;
  host: string;
  isDeploy: boolean;
  fallbackPort: number;
  sourcePort: string | undefined;
  sourceHost: string | undefined;
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
  };
};
