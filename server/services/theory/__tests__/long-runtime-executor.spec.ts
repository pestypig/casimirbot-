import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import {
  createTheoryRuntimeRunRequestManifest,
  readTheoryRuntimeRunRequestStatus,
} from "../theory-runtime-run-request-manifest";
import {
  executeLongTheoryRuntimeRequest,
  type ExecuteLongTheoryRuntimeRequestInput,
} from "../long-runtime-executor";
import type { TheoryRuntimeExecutionResult } from "../runtime-adapters";

let tempRoot: string;

const successfulExecution: TheoryRuntimeExecutionResult = {
  startedAt: "2026-05-29T00:00:00.000Z",
  completedAt: "2026-05-29T00:00:01.000Z",
  durationMs: 1000,
  exitCode: 0,
  stdout: "ok",
  stderr: "",
  timedOut: false,
  error: null,
};

async function writeFixture(relativePath: string, contents: string): Promise<void> {
  const absolutePath = path.join(tempRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, contents, "utf8");
}

async function createAlphaRequest(requestId = "request:alpha") {
  return createTheoryRuntimeRunRequestManifest({
    runtimeId: "nhm2.shift_lapse.alpha_sweep",
    graphId: "nhm2-theory-badge-graph",
    badgeIds: ["nhm2.qei.sampling_window"],
    requestedScope: "sweep",
    requestId,
    projectRoot: tempRoot,
    generatedAt: "2026-05-29T00:00:00.000Z",
  });
}

function execInput(overrides: Partial<ExecuteLongTheoryRuntimeRequestInput> = {}): ExecuteLongTheoryRuntimeRequestInput {
  return {
    requestId: "request:alpha",
    projectRoot: tempRoot,
    outputDirectory: "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep",
    execute: true,
    generatedAt: "2026-05-29T00:00:02.000Z",
    ...overrides,
  };
}

beforeEach(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "long-runtime-executor-"));
});

afterEach(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

describe("executeLongTheoryRuntimeRequest", () => {
  it("runs the allowlisted alpha sweep through a fixed npm command and parses receipts", async () => {
    await createAlphaRequest();
    const result = await executeLongTheoryRuntimeRequest(execInput(), {
      spawnExecutor: async (command) => {
        expect(command.command).toMatch(/^npm(\.cmd)?$/);
        expect(command.args).toEqual(["run", "-s", "warp:full-solve:nhm2-shift-lapse:alpha-sweep"]);
        await writeFixture("artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/run.json", JSON.stringify({
          gates: {
            source_closure: "pass",
            certificate_integrity: "pass",
            observer_audit: "pass",
          },
          alpha: 0.2,
          sourceClosureResidual: 0,
          certificate: { integrity: "pass" },
          observerAudit: { status: "pass" },
        }));
        return successfulExecution;
      },
    });
    const status = await readTheoryRuntimeRunRequestStatus({ requestId: "request:alpha", projectRoot: tempRoot });

    expect(result.receiptV1.status).toBe("completed");
    expect(result.receiptV1.outputs.artifacts.some((artifact) => artifact.includes("alpha-sweep/run.json"))).toBe(true);
    expect(result.receiptV1.claimBoundary.promotionAllowed).toBe(false);
    expect(isTheoryRuntimeReceiptV1(result.receiptV1)).toBe(true);
    expect(status?.status).toBe("completed");
    expect(status?.heartbeat.stage).toBe("completed");
  });

  it("rejects long runtime execution without an allowlisted runtime", async () => {
    await createTheoryRuntimeRunRequestManifest({
      runtimeId: "warp.full_solve.campaign",
      graphId: "nhm2-theory-badge-graph",
      badgeIds: ["nhm2.closure.source_residual"],
      requestedScope: "full",
      requestId: "request:warp",
      projectRoot: tempRoot,
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    await expect(
      executeLongTheoryRuntimeRequest(execInput({ requestId: "request:warp" }), {
        spawnExecutor: async () => successfulExecution,
      }),
    ).rejects.toThrow(/not allowlisted/i);
  });

  it("returns timeout receipts and updates heartbeat on timeout", async () => {
    await createAlphaRequest();
    const result = await executeLongTheoryRuntimeRequest(execInput(), {
      spawnExecutor: async () => ({
        ...successfulExecution,
        completedAt: "2026-05-29T00:00:10.000Z",
        durationMs: 10_000,
        exitCode: null,
        timedOut: true,
        error: "timeout",
      }),
    });
    const status = await readTheoryRuntimeRunRequestStatus({ requestId: "request:alpha", projectRoot: tempRoot });

    expect(result.receiptV1.status).toBe("timeout");
    expect(result.receiptV1.claimBoundary.promotionAllowed).toBe(false);
    expect(result.receiptV1.outputs.missingSignals).toContain("runtime_timeout");
    expect(status?.status).toBe("timeout");
    expect(status?.heartbeat.stage).toBe("timeout");
  });

  it("fails closed when process succeeds but expected outputs are missing", async () => {
    await createAlphaRequest();
    const result = await executeLongTheoryRuntimeRequest(execInput(), {
      spawnExecutor: async () => successfulExecution,
    });

    expect(result.receiptV1.status).toBe("not_run");
    expect(result.receiptV1.outputs.artifacts).toHaveLength(0);
    expect(result.receiptV1.outputs.missingSignals).toContain("source_closure_missing");
    expect(result.receiptV1.claimBoundary.promotionAllowed).toBe(false);
  });

  it("rejects output directories outside the project root", async () => {
    await createAlphaRequest();

    await expect(
      executeLongTheoryRuntimeRequest(execInput({ outputDirectory: "../outside" }), {
        spawnExecutor: async () => successfulExecution,
      }),
    ).rejects.toThrow(/inside the project root/i);
  });
});
