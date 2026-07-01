export type HelixAskVoiceTimelineBuildInfo = {
  clientBuild: string;
  clientMode: "dev" | "prod";
  serverService: string | null;
  serverVersion: string | null;
  serverGitSha: string | null;
  serverBuildTime: string | null;
  fetchedAtMs: number | null;
  error: string | null;
};

const cleanVersionText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export function buildHelixAskVoiceTimelineInitialBuildInfo(args: {
  clientBuild: string;
  isDev: boolean;
}): HelixAskVoiceTimelineBuildInfo {
  return {
    clientBuild: args.clientBuild,
    clientMode: args.isDev ? "dev" : "prod",
    serverService: null,
    serverVersion: null,
    serverGitSha: null,
    serverBuildTime: null,
    fetchedAtMs: null,
    error: null,
  };
}

export function applyHelixAskVoiceTimelineVersionPayload(
  current: HelixAskVoiceTimelineBuildInfo,
  payload: {
    service?: unknown;
    version?: unknown;
    gitSha?: unknown;
    buildTime?: unknown;
  },
  fetchedAtMs: number,
): HelixAskVoiceTimelineBuildInfo {
  return {
    ...current,
    serverService: cleanVersionText(payload.service),
    serverVersion: cleanVersionText(payload.version),
    serverGitSha: cleanVersionText(payload.gitSha),
    serverBuildTime: cleanVersionText(payload.buildTime),
    fetchedAtMs,
    error: null,
  };
}

export function applyHelixAskVoiceTimelineVersionError(
  current: HelixAskVoiceTimelineBuildInfo,
  error: unknown,
  fetchedAtMs: number,
): HelixAskVoiceTimelineBuildInfo {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "version_unavailable";
  return {
    ...current,
    fetchedAtMs,
    error: message,
  };
}
