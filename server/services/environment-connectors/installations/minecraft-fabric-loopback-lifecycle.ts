import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  helixMinecraftLocalLifecycleReceiptSchema,
  helixMinecraftLocalLifecycleRequestSchema,
  type HelixMinecraftLocalLifecycleReceipt,
  type HelixMinecraftLocalLifecycleRequest,
} from "@shared/helix-minecraft-local-lifecycle";

const execFileAsync = promisify(execFile);
const SCRIPT_RELATIVE_PATH = path.join(
  "scripts",
  "helix-minecraft-launch-fabric-loopback.ps1",
);
const MAX_OUTPUT_BYTES = 64 * 1024;
const EXECUTION_TIMEOUT_MS = 190_000;

export class MinecraftLocalLifecycleError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message = code,
  ) {
    super(message);
    this.name = "MinecraftLocalLifecycleError";
  }
}

export type MinecraftLocalLifecycleRunner = (input: {
  address: string;
  signal?: AbortSignal;
}) => Promise<HelixMinecraftLocalLifecycleReceipt>;

const powershellPath = (): string => {
  const windowsRoot = process.env.SystemRoot?.trim() || process.env.WINDIR?.trim();
  if (!windowsRoot || !path.win32.isAbsolute(windowsRoot)) {
    throw new MinecraftLocalLifecycleError(
      "minecraft_windows_runtime_unavailable",
      503,
    );
  }
  return path.win32.join(
    windowsRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
};

const lifecycleScriptPath = (): string => {
  const runtimeRoot = path.resolve(process.cwd());
  const candidate = path.resolve(runtimeRoot, SCRIPT_RELATIVE_PATH);
  const relative = path.relative(runtimeRoot, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new MinecraftLocalLifecycleError(
      "minecraft_lifecycle_script_path_invalid",
      503,
    );
  }
  return candidate;
};

export const parseMinecraftLocalLifecycleReceipt = (
  stdout: string,
): HelixMinecraftLocalLifecycleReceipt => {
  const lines = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const candidate: unknown = JSON.parse(lines[index]);
      const parsed = helixMinecraftLocalLifecycleReceiptSchema.safeParse(candidate);
      if (parsed.success) return parsed.data;
    } catch {
      // PowerShell can emit bounded startup progress before its JSON receipt.
    }
  }
  throw new MinecraftLocalLifecycleError(
    "minecraft_lifecycle_receipt_missing",
    502,
  );
};

const normalizeFailure = (error: unknown): MinecraftLocalLifecycleError => {
  if (error instanceof MinecraftLocalLifecycleError) return error;
  const record = error && typeof error === "object"
    ? (error as { stderr?: unknown; message?: unknown; code?: unknown })
    : null;
  const combined = [record?.stderr, record?.message]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
  const typed = /\b(minecraft_[a-z0-9_]+)\b/iu.exec(combined)?.[1];
  const code = typed ?? "minecraft_local_lifecycle_unavailable";
  const statusCode = code.endsWith("_required") || code.endsWith("_invalid")
    ? 400
    : code.includes("memory_ceiling") || code.includes("already_running")
      ? 409
      : 503;
  return new MinecraftLocalLifecycleError(code, statusCode);
};

const defaultRunner: MinecraftLocalLifecycleRunner = async (input) => {
  if (process.platform !== "win32") {
    throw new MinecraftLocalLifecycleError(
      "minecraft_windows_runtime_required",
      503,
    );
  }
  const scriptPath = lifecycleScriptPath();
  try {
    await access(scriptPath);
  } catch {
    throw new MinecraftLocalLifecycleError(
      "minecraft_lifecycle_script_missing",
      503,
    );
  }
  try {
    const result = await execFileAsync(
      powershellPath(),
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-Address",
        input.address,
      ],
      {
        cwd: process.cwd(),
        windowsHide: true,
        timeout: EXECUTION_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        signal: input.signal,
        encoding: "utf8",
      },
    );
    return parseMinecraftLocalLifecycleReceipt(result.stdout);
  } catch (error) {
    throw normalizeFailure(error);
  }
};

let activeExecution: Promise<HelixMinecraftLocalLifecycleReceipt> | null = null;

export const executeMinecraftFabricLoopbackLifecycle = async (input: {
  request?: Partial<HelixMinecraftLocalLifecycleRequest>;
  runner?: MinecraftLocalLifecycleRunner;
  signal?: AbortSignal;
} = {}): Promise<HelixMinecraftLocalLifecycleReceipt> => {
  const parsed = helixMinecraftLocalLifecycleRequestSchema.safeParse(
    input.request ?? {},
  );
  if (!parsed.success) {
    throw new MinecraftLocalLifecycleError(
      "minecraft_loopback_address_required",
      400,
    );
  }
  if (activeExecution) {
    throw new MinecraftLocalLifecycleError(
      "minecraft_local_lifecycle_busy",
      409,
    );
  }
  const execution = (input.runner ?? defaultRunner)({
    address: parsed.data.address,
    signal: input.signal,
  });
  activeExecution = execution;
  try {
    return await execution;
  } catch (error) {
    throw normalizeFailure(error);
  } finally {
    if (activeExecution === execution) activeExecution = null;
  }
};
