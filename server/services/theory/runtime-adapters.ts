import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryCompoundRunV1 } from "../../../shared/contracts/theory-compound-run.v1";
import {
  getTheoryRuntimeEntrypoint,
  findTheoryRuntimeEntrypointsForBadge,
  THEORY_RUNTIME_ENTRYPOINTS,
} from "../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_SMALL_EXECUTION_IDS } from "../../../shared/theory/runtime-execution-policy";
import { resolveEvidenceArtifacts } from "./evidence-artifact-resolver";
import { appendBoundedTheoryRuntimeOutput } from "./runtime-output-buffer";
import { terminateTheoryRuntimeProcessTree } from "./runtime-process-tree";

export type TheoryRuntimeAdapterInput = {
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  projectRoot?: string;
  timeoutMs?: number;
  generatedAt?: string;
};

export type TheoryRuntimeAdapterSolveScope =
  | "scalar_only"
  | "runtime_trace_only"
  | "scalar_and_runtime"
  | "all_available";

export type TheoryRuntimeCommandV1 = {
  command: string;
  args: string[];
  cwd: string;
  npmScript: string;
  timeoutMs: number;
  env?: Record<string, string>;
  inheritProcessEnv?: boolean;
  launcherBindings?: Array<{
    role:
      | "node_runtime"
      | "typescript_loader"
      | "producer_source"
      | "standalone_bundle";
    path: string;
    sha256: string;
    sizeBytes?: number;
  }>;
};

export type TheoryRuntimeExecutionResult = {
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error: string | null;
};

export type TheoryRuntimeSpawnExecutor = (
  command: TheoryRuntimeCommandV1,
) => Promise<TheoryRuntimeExecutionResult>;

export type TheoryRuntimeAdapterParseInput = TheoryRuntimeAdapterInput & {
  execution: TheoryRuntimeExecutionResult;
};

export type TheoryRuntimeAdapterReceiptInput = TheoryRuntimeAdapterParseInput & {
  parsedReceipt: TheoryRuntimeReceiptV1;
};

export type TheoryRuntimeAdapter = {
  runtimeId: string;
  canRun: (input: TheoryRuntimeAdapterInput) => boolean;
  buildCommand: (input: TheoryRuntimeAdapterInput) => TheoryRuntimeCommandV1;
  parseArtifacts: (input: TheoryRuntimeAdapterParseInput) => Promise<TheoryRuntimeReceiptV1>;
  toReceipt: (input: TheoryRuntimeAdapterReceiptInput) => TheoryRuntimeReceiptV1;
};

export const SMALL_RUNTIME_ADAPTER_IDS = THEORY_RUNTIME_SMALL_EXECUTION_IDS;

export type SmallTheoryRuntimeAdapterId = (typeof SMALL_RUNTIME_ADAPTER_IDS)[number];

const SMALL_RUNTIME_ID_SET = new Set<string>(SMALL_RUNTIME_ADAPTER_IDS);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function windowsNpmCliPath(): string | null {
  const candidates = [
    process.env.npm_execpath?.trim() ?? "",
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  return candidates.find((candidate) =>
    candidate && path.basename(candidate).toLowerCase() === "npm-cli.js" && existsSync(candidate)
  ) ?? null;
}

export function buildTheoryRuntimeNpmInvocation(script: string): Pick<TheoryRuntimeCommandV1, "command" | "args"> {
  const windows = process.platform === "win32";
  const npmCliPath = windows ? windowsNpmCliPath() : null;
  return {
    // Node 24 rejects direct shell:false spawning of .cmd shims on Windows
    // with EINVAL. Prefer the installed npm CLI through the current Node
    // executable, with a fixed cmd.exe fallback for non-standard installs.
    command: npmCliPath ? process.execPath : windows ? (process.env.ComSpec?.trim() || "cmd.exe") : "npm",
    args: npmCliPath
      ? [npmCliPath, "run", "-s", script]
      : windows
        ? ["/d", "/s", "/c", "npm.cmd", "run", "-s", script]
        : ["run", "-s", script],
  };
}

function includesRuntime(scope: TheoryRuntimeAdapterSolveScope): boolean {
  return scope === "runtime_trace_only" || scope === "scalar_and_runtime" || scope === "all_available";
}

function scriptFromEntrypointCommand(command: string | null): string | null {
  const match = command?.match(/^npm\s+run\s+(.+)$/);
  return match?.[1]?.trim() ?? null;
}

function isRegisteredRuntime(runtimeId: string): boolean {
  return THEORY_RUNTIME_ENTRYPOINTS.some((entrypoint) => entrypoint.runtimeId === runtimeId);
}

function assertRuntimeAllowed(runtimeId: string): void {
  if (!isRegisteredRuntime(runtimeId)) {
    throw new Error(`Runtime ${runtimeId} is not registered in THEORY_RUNTIME_ENTRYPOINTS.`);
  }
  if (!SMALL_RUNTIME_ID_SET.has(runtimeId)) {
    throw new Error(`Runtime ${runtimeId} is not enabled for small adapter execution.`);
  }
}

function claimBoundaryForRuntime(runtimeId: string) {
  const entrypoint = getTheoryRuntimeEntrypoint(runtimeId);
  return {
    currentTier: entrypoint?.claimBoundary.currentTier ?? "diagnostic",
    maximumTier: entrypoint?.claimBoundary.maximumTier ?? "diagnostic",
    promotionAllowed: false,
    promotionBlockedBy: [
      ...(entrypoint?.claimBoundary.promotionRequires ?? []),
      "runtime_receipt_requires_human_review",
    ],
  };
}

function failedReceipt(input: TheoryRuntimeAdapterInput & {
  status: "failed" | "timeout" | "blocked";
  warnings: string[];
  execution?: TheoryRuntimeExecutionResult | null;
}): TheoryRuntimeReceiptV1 {
  const now = input.generatedAt ?? new Date().toISOString();
  return buildTheoryRuntimeReceiptV1({
    generatedAt: now,
    receiptId: `runtime:${input.runtimeId}:${Date.now().toString(36)}`,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    command: getTheoryRuntimeEntrypoint(input.runtimeId)?.command ?? null,
    args: {
      adapter: "small_runtime_adapter",
      stdout: input.execution?.stdout ?? "",
      stderr: input.execution?.stderr ?? "",
    },
    status: input.status,
    outputs: {
      artifacts: [],
      scalars: {},
      units: {},
      gates: {},
      missingSignals: input.status === "blocked" ? ["runtime_not_allowed"] : ["runtime_receipt_unavailable"],
      warnings: input.warnings,
    },
    provenance: {
      gitSha: null,
      startedAt: input.execution?.startedAt ?? null,
      completedAt: input.execution?.completedAt ?? null,
      durationMs: input.execution?.durationMs ?? null,
    },
    claimBoundary: claimBoundaryForRuntime(input.runtimeId),
  });
}

function buildSmallRuntimeCommand(input: TheoryRuntimeAdapterInput): TheoryRuntimeCommandV1 {
  assertRuntimeAllowed(input.runtimeId);
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  const script = scriptFromEntrypointCommand(entrypoint?.command ?? null);
  if (!entrypoint || !script) {
    throw new Error(`Runtime ${input.runtimeId} does not have a runnable npm script command.`);
  }
  if (!/^[A-Za-z0-9:_-]+$/.test(script)) {
    throw new Error(`Runtime ${input.runtimeId} resolved to an unsafe npm script name.`);
  }
  const invocation = buildTheoryRuntimeNpmInvocation(script);
  return {
    ...invocation,
    cwd: path.resolve(input.projectRoot ?? process.cwd()),
    npmScript: script,
    timeoutMs: Math.min(input.timeoutMs ?? entrypoint.timeoutPolicy.smallMs, entrypoint.timeoutPolicy.fullMs),
  };
}

export async function executeTheoryRuntimeCommand(command: TheoryRuntimeCommandV1): Promise<TheoryRuntimeExecutionResult> {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(command.command, command.args, {
        cwd: command.cwd,
        env:
          command.inheritProcessEnv === false
            ? { ...(command.env ?? {}) }
            : command.env
              ? { ...process.env, ...command.env }
              : process.env,
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        windowsHide: true,
      });
    } catch (error) {
      resolve({
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        exitCode: null,
        stdout: "",
        stderr: "",
        timedOut: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      void terminateTheoryRuntimeProcessTree(child).then(() => {
        resolve({
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - started,
          exitCode: null,
          stdout,
          stderr,
          timedOut: true,
          error: `Runtime command timed out after ${command.timeoutMs}ms.`,
        });
      });
    }, command.timeoutMs);
    child.stdout?.on("data", (chunk) => {
      stdout = appendBoundedTheoryRuntimeOutput(stdout, chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr = appendBoundedTheoryRuntimeOutput(stderr, chunk);
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        exitCode: null,
        stdout,
        stderr,
        timedOut: false,
        error: error.message,
      });
    });
    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        exitCode,
        stdout,
        stderr,
        timedOut: false,
        error: exitCode === 0 ? null : `Runtime command exited with ${exitCode}.`,
      });
    });
  });
}

function createSmallRuntimeAdapter(runtimeId: SmallTheoryRuntimeAdapterId): TheoryRuntimeAdapter {
  return {
    runtimeId,
    canRun: (input) => input.runtimeId === runtimeId && SMALL_RUNTIME_ID_SET.has(input.runtimeId),
    buildCommand: buildSmallRuntimeCommand,
    parseArtifacts: async (input) => {
      const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
      if (!entrypoint) {
        return failedReceipt({
          ...input,
          status: "blocked",
          warnings: [`Runtime ${input.runtimeId} is not registered.`],
          execution: input.execution,
        });
      }
      if (input.execution.timedOut) {
        return failedReceipt({
          ...input,
          status: "timeout",
          warnings: [input.execution.error ?? "Runtime command timed out."],
          execution: input.execution,
        });
      }
      if (input.execution.exitCode !== 0) {
        return failedReceipt({
          ...input,
          status: "failed",
          warnings: [input.execution.error ?? "Runtime command failed.", input.execution.stderr].filter(Boolean),
          execution: input.execution,
        });
      }
      const evidence = await resolveEvidenceArtifacts({
        runtimeId: input.runtimeId,
        graphId: input.graphId,
        badgeIds: input.badgeIds,
        command: entrypoint.command,
        outputArtifactGlobs: entrypoint.outputArtifactGlobs,
        sourceRefs: entrypoint.sourceRefs,
        projectRoot: input.projectRoot,
        generatedAt: input.generatedAt,
      });
      return evidence.receiptV1;
    },
    toReceipt: (input) => {
      const warnings = unique([
        ...input.parsedReceipt.outputs.warnings,
        ...(input.execution.stderr ? [`stderr: ${input.execution.stderr}`] : []),
      ]);
      return buildTheoryRuntimeReceiptV1({
        ...input.parsedReceipt,
        generatedAt: input.parsedReceipt.generatedAt,
        args: {
          ...input.parsedReceipt.args,
          adapter: "small_runtime_adapter",
          npmScript: scriptFromEntrypointCommand(getTheoryRuntimeEntrypoint(input.runtimeId)?.command ?? null),
          stdout: input.execution.stdout,
        },
        outputs: {
          ...input.parsedReceipt.outputs,
          warnings,
        },
        provenance: {
          ...input.parsedReceipt.provenance,
          startedAt: input.execution.startedAt,
          completedAt: input.execution.completedAt,
          durationMs: input.execution.durationMs,
        },
        claimBoundary: {
          ...input.parsedReceipt.claimBoundary,
          promotionAllowed: false,
          promotionBlockedBy: unique([
            ...input.parsedReceipt.claimBoundary.promotionBlockedBy,
            "runtime_receipt_requires_human_review",
          ]),
        },
      });
    },
  };
}

export const THEORY_RUNTIME_ADAPTERS: TheoryRuntimeAdapter[] = SMALL_RUNTIME_ADAPTER_IDS.map((runtimeId) =>
  createSmallRuntimeAdapter(runtimeId),
);

export function getTheoryRuntimeAdapter(runtimeId: string): TheoryRuntimeAdapter | null {
  return THEORY_RUNTIME_ADAPTERS.find((adapter) => adapter.runtimeId === runtimeId) ?? null;
}

export function buildTheoryRuntimeCommand(input: TheoryRuntimeAdapterInput): TheoryRuntimeCommandV1 {
  const adapter = getTheoryRuntimeAdapter(input.runtimeId);
  if (!adapter || !adapter.canRun(input)) {
    assertRuntimeAllowed(input.runtimeId);
    throw new Error(`No adapter can run runtime ${input.runtimeId}.`);
  }
  return adapter.buildCommand(input);
}

export async function runTheoryRuntimeAdapter(
  input: TheoryRuntimeAdapterInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
  } = {},
): Promise<TheoryRuntimeReceiptV1> {
  const adapter = getTheoryRuntimeAdapter(input.runtimeId);
  if (!adapter || !adapter.canRun(input)) {
    return failedReceipt({
      ...input,
      status: "blocked",
      warnings: [`Runtime ${input.runtimeId} is not enabled for small adapter execution.`],
      execution: null,
    });
  }

  let command: TheoryRuntimeCommandV1;
  try {
    command = adapter.buildCommand(input);
  } catch (error) {
    return failedReceipt({
      ...input,
      status: "blocked",
      warnings: [error instanceof Error ? error.message : "Runtime command rejected."],
      execution: null,
    });
  }

  const execution = await (options.spawnExecutor ?? executeTheoryRuntimeCommand)(command);
  const parsedReceipt = await adapter.parseArtifacts({ ...input, execution });
  return adapter.toReceipt({ ...input, execution, parsedReceipt });
}

export function attachRuntimeReceiptToCompoundRun(
  run: TheoryCompoundRunV1,
  receipt: TheoryRuntimeReceiptV1,
): TheoryCompoundRunV1 {
  const ownedBadgeIds = new Set(receipt.badgeIds);
  return {
    ...run,
    rows: run.rows.map((row) =>
      ownedBadgeIds.has(row.badgeId) || row.kind === "runtime" || row.kind === "evidence"
        ? {
            ...row,
            runtimeReceiptV1: receipt,
            sweepRunV1: row.sweepRunV1 ?? null,
            status:
              receipt.status === "completed"
                ? "computed"
                : receipt.status === "timeout" || receipt.status === "failed"
                  ? "failed"
                  : "blocked",
            warnings: unique([...row.warnings, ...receipt.outputs.warnings]),
          }
        : row,
    ),
  };
}

export async function runSmallRuntimeAdaptersForCompoundRun(
  input: {
    run: TheoryCompoundRunV1;
    scope: TheoryRuntimeAdapterSolveScope;
    projectRoot?: string;
    timeoutMs?: number;
    generatedAt?: string;
  },
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
  } = {},
): Promise<TheoryCompoundRunV1> {
  if (!includesRuntime(input.scope)) return input.run;
  const runtimeIds = unique(
    input.run.rows
      .flatMap((row) => findTheoryRuntimeEntrypointsForBadge(row.badgeId))
      .map((entrypoint) => entrypoint.runtimeId)
      .filter((runtimeId) => SMALL_RUNTIME_ID_SET.has(runtimeId)),
  );
  let nextRun = input.run;
  for (const runtimeId of runtimeIds) {
    const entrypoint = getTheoryRuntimeEntrypoint(runtimeId);
    const receipt = await runTheoryRuntimeAdapter(
      {
        runtimeId,
        graphId: input.run.graphId,
        badgeIds: entrypoint?.ownedBadgeIds.filter((badgeId) =>
          input.run.rows.some((row) => row.badgeId === badgeId),
        ) ?? [],
        projectRoot: input.projectRoot,
        timeoutMs: input.timeoutMs,
        generatedAt: input.generatedAt,
      },
      options,
    );
    nextRun = attachRuntimeReceiptToCompoundRun(nextRun, receipt);
  }
  return nextRun;
}
