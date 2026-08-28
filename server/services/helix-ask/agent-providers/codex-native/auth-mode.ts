import { spawnSync } from "node:child_process";
import {
  buildCodexSpawnCommand,
  resolveCodexBinary,
  type CodexBinaryResolution,
} from "./codex-binary";

export type HelixCodexAuthMode = "auto" | "chatgpt_session" | "api_key";
export type HelixCodexSelectedAuthMode = Exclude<HelixCodexAuthMode, "auto">;

export type HelixCodexAuthResolution = {
  schema: "helix.codex_auth_resolution.v1";
  requested_mode: HelixCodexAuthMode;
  selected_mode: HelixCodexSelectedAuthMode | null;
  status: "available" | "unavailable";
  credential_source: "codex_cached_chatgpt_session" | "openai_api_key_environment" | null;
  codex_home_strategy: "operator_default" | "helix_isolated" | null;
  preflight: "codex_login_status" | "environment_presence" | "not_run";
  reason: string | null;
  credential_material_exposed: false;
};

type ChatGptLoginStatus = "available" | "not_logged_in" | "unknown";

const readRequestedMode = (value: string | undefined): HelixCodexAuthMode => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "chatgpt" || normalized === "chatgpt_session" || normalized === "subscription") {
    return "chatgpt_session";
  }
  if (normalized === "api" || normalized === "api_key") return "api_key";
  return "auto";
};

export const resolveHelixCodexAuthSelection = (input: {
  requestedMode?: string;
  apiKeyAvailable: boolean;
  chatGptLoginStatus: ChatGptLoginStatus;
}): HelixCodexAuthResolution => {
  const requestedMode = readRequestedMode(input.requestedMode);
  if (requestedMode === "api_key") {
    return input.apiKeyAvailable
      ? {
          schema: "helix.codex_auth_resolution.v1",
          requested_mode: requestedMode,
          selected_mode: "api_key",
          status: "available",
          credential_source: "openai_api_key_environment",
          codex_home_strategy: "helix_isolated",
          preflight: "environment_presence",
          reason: null,
          credential_material_exposed: false,
        }
      : {
          schema: "helix.codex_auth_resolution.v1",
          requested_mode: requestedMode,
          selected_mode: null,
          status: "unavailable",
          credential_source: null,
          codex_home_strategy: null,
          preflight: "environment_presence",
          reason: "openai_api_key_missing",
          credential_material_exposed: false,
        };
  }

  if (input.chatGptLoginStatus === "available") {
    return {
      schema: "helix.codex_auth_resolution.v1",
      requested_mode: requestedMode,
      selected_mode: "chatgpt_session",
      status: "available",
      credential_source: "codex_cached_chatgpt_session",
      codex_home_strategy: "operator_default",
      preflight: "codex_login_status",
      reason: null,
      credential_material_exposed: false,
    };
  }
  if (requestedMode === "auto" && input.apiKeyAvailable) {
    return {
      schema: "helix.codex_auth_resolution.v1",
      requested_mode: requestedMode,
      selected_mode: "api_key",
      status: "available",
      credential_source: "openai_api_key_environment",
      codex_home_strategy: "helix_isolated",
      preflight: "environment_presence",
      reason: null,
      credential_material_exposed: false,
    };
  }
  return {
    schema: "helix.codex_auth_resolution.v1",
    requested_mode: requestedMode,
    selected_mode: null,
    status: "unavailable",
    credential_source: null,
    codex_home_strategy: null,
    preflight: "codex_login_status",
    reason:
      input.chatGptLoginStatus === "not_logged_in"
        ? "codex_chatgpt_session_not_logged_in"
        : "codex_login_status_unavailable",
    credential_material_exposed: false,
  };
};

const probeChatGptLoginStatus = (
  binary: CodexBinaryResolution,
): ChatGptLoginStatus => {
  if (!binary.launchable || !binary.resolved_bin) return "unknown";
  const command = buildCodexSpawnCommand(binary.resolved_bin, ["login", "status"]);
  const result = spawnSync(command.bin, command.args, {
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
    },
  });
  const status = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (/logged in using chatgpt/i.test(status)) return "available";
  if (/not logged in/i.test(status)) return "not_logged_in";
  return "unknown";
};

let cachedResolution: { cacheKey: string; expiresAt: number; value: HelixCodexAuthResolution } | null = null;

export const resolveHelixCodexAuth = (
  nowMs = Date.now(),
): HelixCodexAuthResolution => {
  const requestedMode = readRequestedMode(process.env.HELIX_CODEX_AUTH_MODE);
  const apiKeyAvailable = Boolean(process.env.OPENAI_API_KEY?.trim());
  const cacheKey = `${requestedMode}:${apiKeyAvailable ? "api" : "no-api"}`;
  if (cachedResolution?.cacheKey === cacheKey && cachedResolution.expiresAt > nowMs) {
    return cachedResolution.value;
  }
  const runningUnderTest =
    process.env.VITEST !== undefined || process.env.NODE_ENV === "test";
  const chatGptLoginStatus =
    requestedMode === "api_key" ||
    (runningUnderTest && requestedMode === "auto" && apiKeyAvailable)
      ? "unknown"
      : probeChatGptLoginStatus(resolveCodexBinary());
  const value = resolveHelixCodexAuthSelection({
    requestedMode,
    apiKeyAvailable,
    chatGptLoginStatus,
  });
  cachedResolution = { cacheKey, expiresAt: nowMs + 30_000, value };
  return value;
};

export const resetHelixCodexAuthCacheForTests = (): void => {
  cachedResolution = null;
};
