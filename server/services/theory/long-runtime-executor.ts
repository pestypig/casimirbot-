import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";
import { getTheoryRuntimeEntrypoint } from "../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_LONG_EXECUTION_IDS } from "../../../shared/theory/runtime-execution-policy";
import {
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "./theory-runtime-run-request-manifest";
import { readWarpNhm2RuntimeArtifacts } from "./warp-nhm2-artifact-adapters";
import type {
  TheoryRuntimeCommandV1,
  TheoryRuntimeExecutionResult,
  TheoryRuntimeSpawnExecutor,
} from "./runtime-adapters";
import { appendBoundedTheoryRuntimeOutput } from "./runtime-output-buffer";

export const LONG_RUNTIME_EXECUTION_ALLOWLIST = THEORY_RUNTIME_LONG_EXECUTION_IDS;

export type LongTheoryRuntimeId = (typeof LONG_RUNTIME_EXECUTION_ALLOWLIST)[number];

export type ExecuteLongTheoryRuntimeRequestInput = {
  requestId: string;
  projectRoot?: string;
  outputDirectory: string;
  execute: true;
  timeoutMs?: number;
  generatedAt?: string;
};

export type ExecuteLongTheoryRuntimeRequestResult = {
  requestId: string;
  runtimeId: LongTheoryRuntimeId;
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  receiptV1: TheoryRuntimeReceiptV1;
};

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function scriptFromEntrypointCommand(command: string | null): string | null {
  const match = command?.match(/^npm\s+run\s+(.+)$/);
  return match?.[1]?.trim() ?? null;
}

function isAllowedLongRuntimeId(runtimeId: string): runtimeId is LongTheoryRuntimeId {
  return LONG_RUNTIME_EXECUTION_ALLOWLIST.includes(runtimeId as LongTheoryRuntimeId);
}

function assertOutputDirectoryInsideProject(projectRoot: string, outputDirectory: string): string {
  const resolved = path.resolve(projectRoot, outputDirectory);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Long runtime outputDirectory must resolve inside the project root.");
  }
  return resolved;
}

function buildLongRuntimeCommand(input: {
  runtimeId: LongTheoryRuntimeId;
  projectRoot: string;
  timeoutMs?: number;
}): TheoryRuntimeCommandV1 {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  const script = scriptFromEntrypointCommand(entrypoint?.command ?? null);
  if (!entrypoint || !script) throw new Error(`Runtime ${input.runtimeId} does not have a fixed npm script command.`);
  return {
    command: npmCommand(),
    args: ["run", "-s", script],
    cwd: input.projectRoot,
    npmScript: script,
    timeoutMs: Math.min(input.timeoutMs ?? entrypoint.timeoutPolicy.fullMs, entrypoint.timeoutPolicy.fullMs),
  };
}

async function defaultSpawnExecutor(command: TheoryRuntimeCommandV1): Promise<TheoryRuntimeExecutionResult> {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGTERM");
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
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        exitCode: code,
        stdout,
        stderr,
        timedOut: false,
        error: code === 0 ? null : `Runtime command exited with code ${code}.`,
      });
    });
  });
}

function failedExecutionReceipt(input: {
  runtimeId: LongTheoryRuntimeId;
  graphId: string;
  badgeIds: string[];
  command: TheoryRuntimeCommandV1;
  execution: TheoryRuntimeExecutionResult;
  status: "failed" | "timeout";
  generatedAt?: string;
}): TheoryRuntimeReceiptV1 {
  const entrypoint = getTheoryRuntimeEntrypoint(input.runtimeId);
  return buildTheoryRuntimeReceiptV1({
    generatedAt: input.generatedAt,
    receiptId: `runtime:${input.runtimeId}:long-execution:${Date.now().toString(36)}`,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    command: `npm run ${input.command.npmScript}`,
    args: {
      adapter: "long_runtime_executor",
      stdout: input.execution.stdout,
      stderr: input.execution.stderr,
    },
    status: input.status,
    outputs: {
      artifacts: [],
      scalars: {},
      units: {},
      gates: {
        runtime_execution: input.status === "timeout" ? "not_ready" : "fail",
      },
      missingSignals: [input.status === "timeout" ? "runtime_timeout" : "runtime_execution_failed"],
      warnings: [
        input.execution.error ?? `Long runtime ${input.status}.`,
        "No claim promotion is allowed from failed or timed-out runtime execution.",
      ],
    },
    provenance: {
      gitSha: null,
      startedAt: input.execution.startedAt,
      completedAt: input.execution.completedAt,
      durationMs: input.execution.durationMs,
    },
    claimBoundary: {
      currentTier: entrypoint?.claimBoundary.currentTier ?? "diagnostic",
      maximumTier: entrypoint?.claimBoundary.maximumTier ?? "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: [
        ...(entrypoint?.claimBoundary.promotionRequires ?? []),
        input.status === "timeout" ? "runtime_timeout" : "runtime_execution_failed",
      ],
    },
  });
}

export async function executeLongTheoryRuntimeRequest(
  input: ExecuteLongTheoryRuntimeRequestInput,
  options: {
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    manageTerminalStatus?: boolean;
  } = {},
): Promise<ExecuteLongTheoryRuntimeRequestResult> {
  if (input.execute !== true) throw new Error("Long runtime execution requires explicit execute: true.");
  const request = await readTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot: input.projectRoot,
  });
  if (!request) throw new Error(`Runtime request manifest ${input.requestId} was not found.`);
  if (!isAllowedLongRuntimeId(request.runtimeId)) {
    throw new Error(`Runtime ${request.runtimeId} is not allowlisted for long execution.`);
  }

  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const outputDirectory = assertOutputDirectoryInsideProject(projectRoot, input.outputDirectory);
  await fs.mkdir(outputDirectory, { recursive: true });

  const command = buildLongRuntimeCommand({
    runtimeId: request.runtimeId,
    projectRoot,
    timeoutMs: input.timeoutMs,
  });

  await updateTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot,
    status: "running",
    updatedAt: input.generatedAt,
    heartbeat: {
      stage: "running",
      message: `Running fixed runtime command: npm run ${command.npmScript}`,
      progress: null,
    },
  });

  const execution = await (options.spawnExecutor ?? defaultSpawnExecutor)(command);
  if (execution.timedOut || execution.exitCode !== 0) {
    const status = execution.timedOut ? "timeout" : "failed";
    if (options.manageTerminalStatus !== false) {
      await updateTheoryRuntimeRunRequestStatus({
        requestId: input.requestId,
        projectRoot,
        status,
        updatedAt: execution.completedAt ?? input.generatedAt,
        heartbeat: {
          stage: status,
          message: execution.error ?? `Runtime ${status}.`,
          progress: 1,
        },
      });
    }
    return {
      requestId: input.requestId,
      runtimeId: request.runtimeId,
      command,
      execution,
      receiptV1: failedExecutionReceipt({
        runtimeId: request.runtimeId,
        graphId: request.graphId,
        badgeIds: request.badgeIds,
        command,
        execution,
        status,
        generatedAt: input.generatedAt,
      }),
    };
  }

  if (options.manageTerminalStatus !== false) {
    await updateTheoryRuntimeRunRequestStatus({
      requestId: input.requestId,
      projectRoot,
      status: "completed",
      updatedAt: execution.completedAt ?? input.generatedAt,
      heartbeat: {
        stage: "completed",
        message: "Long runtime process completed; reading artifacts with fail-closed adapter.",
        progress: 1,
      },
    });
  }
  const receiptV1 = await readWarpNhm2RuntimeArtifacts({
    runtimeId: request.runtimeId,
    graphId: request.graphId,
    badgeIds: request.badgeIds,
    projectRoot,
    generatedAt: input.generatedAt,
  });

  return {
    requestId: input.requestId,
    runtimeId: request.runtimeId,
    command,
    execution,
    receiptV1,
  };
}
