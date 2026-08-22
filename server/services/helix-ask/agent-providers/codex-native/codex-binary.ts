import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export type CodexBinaryResolution = {
  launchable: boolean;
  reason: string | null;
  resolved_bin: string | null;
  args: string[];
};

const CODEX_LAUNCH_PROBE_TIMEOUT_MS = 10_000;

const DEFAULT_CODEX_ARGS = [
  "exec",
  "--sandbox",
  "read-only",
  "--skip-git-repo-check",
  "--color",
  "never",
] as const;

const readBooleanEnv = (
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const moduleRequire = createRequire(import.meta.url);

export const readCodexArgs = (): string[] => {
  const configured = process.env.CODEX_ARGS;
  if (configured === undefined || !configured.trim()) {
    return [...DEFAULT_CODEX_ARGS];
  }
  return configured
    .split(/\s+/)
    .map((entry: string) => entry.trim())
    .filter(Boolean);
};

const fileExists = (candidate: string): boolean => {
  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    try {
      fs.accessSync(candidate, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
};

const isPathLikeCommand = (value: string): boolean =>
  value.includes("/") || value.includes("\\") || path.isAbsolute(value);

const resolveFromPath = (command: string): string[] => {
  const pathValue = process.env.PATH ?? process.env.Path ?? "";
  const extensions =
    process.platform === "win32"
      ? ["", ...String(process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")]
      : [""];
  const candidates: string[] = [];
  for (const entry of pathValue.split(path.delimiter)) {
    const directory = entry.trim();
    if (!directory) continue;
    for (const extension of extensions) {
      const candidate = path.join(
        directory,
        command.endsWith(extension.toLowerCase()) || command.endsWith(extension)
          ? command
          : `${command}${extension.toLowerCase()}`,
      );
      if (fileExists(candidate)) candidates.push(candidate);
    }
  }
  return candidates;
};

const resolveFromWindowsApps = (): string[] => {
  if (process.platform !== "win32" && !process.env.CODEX_WINDOWS_APPS_DIR)
    return [];
  const windowsAppsDir =
    process.env.CODEX_WINDOWS_APPS_DIR ??
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "WindowsApps");
  let entries: string[];
  try {
    entries = fs.readdirSync(windowsAppsDir);
  } catch {
    return [];
  }
  const matchingDirs = entries
    .filter((entry: string) => /^OpenAI\.Codex_/i.test(entry))
    .sort()
    .reverse();
  const candidates: string[] = [];
  for (const entry of matchingDirs) {
    const base = path.join(windowsAppsDir, entry, "app", "resources");
    for (const filename of ["codex.exe", "codex"]) {
      const candidate = path.join(base, filename);
      if (fileExists(candidate)) candidates.push(candidate);
    }
  }
  return candidates;
};

const resolveFromCodexInstallLocation = (
  installLocation: string | null,
): string[] => {
  if (!installLocation) return [];
  return [
    path.join(installLocation, "app", "resources", "codex.exe"),
    path.join(installLocation, "app", "resources", "codex"),
    path.join(installLocation, "resources", "codex.exe"),
    path.join(installLocation, "resources", "codex"),
    path.join(installLocation, "codex.exe"),
    path.join(installLocation, "codex"),
  ].filter(fileExists);
};

const resolveFromLocalNpmPackage = (): string[] => {
  if (readBooleanEnv(process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN, false))
    return [];
  let moduleResolvedBin: string | null = null;
  try {
    moduleResolvedBin = moduleRequire.resolve("@openai/codex/bin/codex.js");
  } catch {
    // Fall through to the repository-relative compatibility candidates.
  }
  return [
    ...(moduleResolvedBin ? [moduleResolvedBin] : []),
    path.join(
      process.cwd(),
      "node_modules",
      "@openai",
      "codex",
      "bin",
      "codex.js",
    ),
    path.join(
      process.cwd(),
      "node_modules",
      ".bin",
      process.platform === "win32" ? "codex.cmd" : "codex",
    ),
  ].filter(fileExists);
};

export const resolveCodexDesktopInstallCandidates = (
  localAppData = readString(process.env.LOCALAPPDATA),
): string[] => {
  if (!localAppData) return [];
  const binDir = path.join(localAppData, "OpenAI", "Codex", "bin");
  let versionDirectories: Array<{ path: string; modifiedAtMs: number }> = [];
  try {
    versionDirectories = fs
      .readdirSync(binDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const directory = path.join(binDir, entry.name);
        let modifiedAtMs = 0;
        try {
          modifiedAtMs = fs.statSync(directory).mtimeMs;
        } catch {
          // A concurrently replaced app directory is simply not a candidate.
        }
        return { path: directory, modifiedAtMs };
      })
      .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs);
  } catch {
    return [];
  }

  return [
    ...versionDirectories.flatMap((entry) => [
      path.join(entry.path, "codex.exe"),
      path.join(entry.path, "codex"),
    ]),
    path.join(binDir, "codex.exe"),
    path.join(binDir, "codex"),
  ].filter(fileExists);
};

export const buildCodexSpawnCommand = (
  resolvedBin: string,
  args: string[],
): { bin: string; args: string[] } => {
  if (/[/\\]@openai[/\\]codex[/\\]bin[/\\]codex\.js$/i.test(resolvedBin)) {
    return {
      bin: process.execPath,
      args: [resolvedBin, ...args],
    };
  }
  return {
    bin: resolvedBin,
    args,
  };
};

export const appendCodexModelPolicyArgs = (
  args: readonly string[],
  policy: { model?: string | null; reasoningEffort?: string | null },
): string[] => {
  const next = [...args];
  const model = readString(policy.model);
  const reasoningEffort = readString(policy.reasoningEffort);
  if (model) next.push("--model", model);
  if (reasoningEffort) {
    next.push(
      "-c",
      `model_reasoning_effort=${JSON.stringify(reasoningEffort)}`,
    );
  }
  return next;
};

const CODEX_COMPATIBILITY_ISOLATION_ARGS = [
  "--ignore-user-config",
  "-c",
  "features.remote_plugin=false",
  "-c",
  "features.apps=false",
  "-c",
  'model_provider="helix_openai_api"',
  "-c",
  'model_providers.helix_openai_api={ name = "Helix OpenAI API", base_url = "https://api.openai.com/v1", env_key = "OPENAI_API_KEY", wire_api = "responses" }',
] as const;

/**
 * The compatibility process is a Helix-owned model step, not a nested Codex
 * desktop session. Keep it independent of the operator's personal plugins,
 * apps, MCP registry, and user configuration while retaining the explicit
 * read-only sandbox and model policy supplied by the provider. The custom
 * provider is intentional: ignored user config still resolves built-in OpenAI
 * authentication from CODEX_HOME. Helix uses its keyed server credential via
 * env_key instead, without persisting that credential into the isolated home.
 */
export const appendCodexCompatibilityIsolationArgs = (
  args: readonly string[],
): string[] => {
  const next = [...args];
  if (!next.includes("--ignore-user-config")) {
    next.push("--ignore-user-config");
  }
  for (
    let index = 1;
    index < CODEX_COMPATIBILITY_ISOLATION_ARGS.length;
    index += 2
  ) {
    const flag = CODEX_COMPATIBILITY_ISOLATION_ARGS[index];
    const value = CODEX_COMPATIBILITY_ISOLATION_ARGS[index + 1];
    if (flag === "-c" && value && !next.includes(value)) {
      next.push(flag, value);
    }
  }
  return next;
};

export const resolveCodexCompatibilityHome = (
  input: {
    configuredHome?: string | null;
    workingDirectory?: string;
  } = {},
): string => {
  const workingDirectory = input.workingDirectory ?? process.cwd();
  const configuredHome = readString(
    input.configuredHome ?? process.env.HELIX_CODEX_COMPATIBILITY_HOME,
  );
  return configuredHome
    ? path.resolve(workingDirectory, configuredHome)
    : path.join(workingDirectory, ".cal", "helix-codex-compatibility-home");
};

const resolveFromWindowsAppxPackage = (): string[] => {
  const configuredInstallLocation = readString(
    process.env.CODEX_APPX_INSTALL_LOCATION,
  );
  if (configuredInstallLocation) {
    return resolveFromCodexInstallLocation(configuredInstallLocation);
  }
  if (process.platform !== "win32") return [];

  try {
    const powershellBin = path.join(
      process.env.SystemRoot ?? "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    const output = execFileSync(
      fileExists(powershellBin) ? powershellBin : "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "$ErrorActionPreference = 'SilentlyContinue';",
          "$pkg = Get-AppxPackage -Name 'OpenAI.Codex' |",
          "Sort-Object Version -Descending |",
          "Select-Object -First 1;",
          "if ($pkg -and $pkg.InstallLocation) {",
          "  [Console]::Out.Write($pkg.InstallLocation)",
          "}",
        ].join(" "),
      ],
      {
        encoding: "utf8",
        timeout: 2_000,
        windowsHide: true,
        env: {
          PATH: process.env.PATH,
          Path: process.env.Path,
          SystemRoot: process.env.SystemRoot,
          ProgramFiles: process.env.ProgramFiles,
        },
      },
    );
    return resolveFromCodexInstallLocation(output.trim());
  } catch {
    return [];
  }
};

const withLaunchProbe = (
  resolution: CodexBinaryResolution,
): CodexBinaryResolution => {
  if (!resolution.launchable || !resolution.resolved_bin) return resolution;
  const probeCommand = buildCodexSpawnCommand(resolution.resolved_bin, [
    "--version",
  ]);
  const probe = spawnSync(probeCommand.bin, probeCommand.args, {
    encoding: "utf8",
    timeout: CODEX_LAUNCH_PROBE_TIMEOUT_MS,
    windowsHide: true,
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CODEX_HOME: process.env.CODEX_HOME,
    },
  });

  if (probe.error || probe.status === null) {
    return {
      ...resolution,
      launchable: false,
      reason:
        probe.error?.name === "TimeoutError"
          ? "codex_binary_probe_timeout"
          : "codex_binary_not_spawnable",
    };
  }

  if (probe.status !== 0) {
    return {
      ...resolution,
      launchable: false,
      reason: "codex_binary_not_spawnable",
    };
  }

  return resolution;
};

export const resolveFirstLaunchableCodexBinary = (
  candidates: readonly string[],
  args: string[],
): CodexBinaryResolution | null => {
  const seen = new Set<string>();
  let firstFailure: CodexBinaryResolution | null = null;
  for (const candidate of candidates) {
    const identity =
      process.platform === "win32" ? candidate.toLowerCase() : candidate;
    if (seen.has(identity) || !fileExists(candidate)) continue;
    seen.add(identity);
    const resolution = withLaunchProbe({
      launchable: true,
      reason: null,
      resolved_bin: candidate,
      args,
    });
    if (resolution.launchable) return resolution;
    firstFailure ??= resolution;
  }
  return firstFailure;
};

export const resolveCodexBinary = (): CodexBinaryResolution => {
  const args = readCodexArgs();
  const configured = readString(process.env.CODEX_BIN);

  if (configured) {
    const configuredCandidates = isPathLikeCommand(configured)
      ? [configured]
      : resolveFromPath(configured);
    return (
      resolveFirstLaunchableCodexBinary(configuredCandidates, args) ?? {
        launchable: false,
        reason: "codex_binary_not_found",
        resolved_bin: null,
        args,
      }
    );
  }

  let firstFailure: CodexBinaryResolution | null = null;
  const tryCandidates = (
    candidates: readonly string[],
  ): CodexBinaryResolution | null => {
    const resolution = resolveFirstLaunchableCodexBinary(candidates, args);
    if (resolution?.launchable) return resolution;
    firstFailure ??= resolution;
    return null;
  };

  const localPackage = tryCandidates(resolveFromLocalNpmPackage());
  if (localPackage) return localPackage;
  const pathBinary = tryCandidates(resolveFromPath("codex"));
  if (pathBinary) return pathBinary;
  if (process.env.CODEX_WINDOWS_APPS_DIR) {
    const configuredWindowsApps = tryCandidates(resolveFromWindowsApps());
    if (configuredWindowsApps) return configuredWindowsApps;
  }
  if (process.env.CODEX_APPX_INSTALL_LOCATION) {
    const configuredAppxPackage = tryCandidates(
      resolveFromWindowsAppxPackage(),
    );
    if (configuredAppxPackage) return configuredAppxPackage;
  }
  const desktopInstall = tryCandidates(resolveCodexDesktopInstallCandidates());
  if (desktopInstall) return desktopInstall;
  if (!process.env.CODEX_APPX_INSTALL_LOCATION) {
    const appxPackage = tryCandidates(resolveFromWindowsAppxPackage());
    if (appxPackage) return appxPackage;
  }
  if (!process.env.CODEX_WINDOWS_APPS_DIR) {
    const windowsApps = tryCandidates(resolveFromWindowsApps());
    if (windowsApps) return windowsApps;
  }

  return (
    firstFailure ?? {
      launchable: false,
      reason: "codex_binary_not_found",
      resolved_bin: null,
      args,
    }
  );
};
