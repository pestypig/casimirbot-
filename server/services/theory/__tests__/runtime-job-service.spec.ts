import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readTheoryRuntimeJob,
  readTheoryRuntimeResult,
  runQueuedTheoryRuntimeJobNow,
  startTheoryRuntimeJob,
} from "../runtime-jobs/runtime-job-service";
import { updateTheoryRuntimeRunRequestStatus } from "../theory-runtime-run-request-manifest";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_WORKSTATION_GRAPH_ID } from "../../../../shared/theory/runtime-execution-policy";

let tempRoot: string;
const solarBadgeIds = [...(getTheoryRuntimeEntrypoint("solar.manifest")?.ownedBadgeIds ?? [])];
beforeEach(async () => { tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "theory-runtime-job-")); });
afterEach(async () => { await fs.rm(tempRoot, { recursive: true, force: true }); });

describe("theory runtime job service", () => {
  it("persists an asynchronous request and terminal receipt with honest running progress", async () => {
    const queued = await startTheoryRuntimeJob({ runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: solarBadgeIds, requestedScope: "quick", projectRoot: tempRoot }, { deferExecution: true });
    expect(queued.request.status).toBe("queued");
    const terminal = await runQueuedTheoryRuntimeJobNow({
      requestId: queued.jobId,
      projectRoot: tempRoot,
      spawnExecutor: async () => ({ startedAt: "2026-07-14T12:00:00.000Z", completedAt: "2026-07-14T12:00:01.000Z", durationMs: 1000, exitCode: 1, stdout: "bounded output", stderr: "failed fixture", timedOut: false, error: "fixture failure" }),
    });
    expect(terminal.request.status).toBe("failed");
    expect(terminal.request.heartbeat.progress).toBe(1);
    expect(terminal.result.available).toBe(true);
    expect((await readTheoryRuntimeResult({ requestId: queued.jobId, projectRoot: tempRoot }))?.status).toBe("failed");
  });

  it("rejects unknown and registered-but-non-executable runtimes", async () => {
    await expect(startTheoryRuntimeJob({ runtimeId: "unknown", graphId: "graph", badgeIds: [], requestedScope: "quick", projectRoot: tempRoot })).rejects.toThrow(/not allowlisted/i);
    await expect(startTheoryRuntimeJob({ runtimeId: "warp.full_solve.campaign", graphId: "graph", badgeIds: [], requestedScope: "full", projectRoot: tempRoot })).rejects.toThrow(/not allowlisted/i);
  });

  it("rejects workstation arguments for fixed no-argument entrypoints", async () => {
    await expect(startTheoryRuntimeJob({ runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: solarBadgeIds, args: { shell: "whoami" }, requestedScope: "quick", projectRoot: tempRoot })).rejects.toThrow(/does not accept workstation arguments/i);
  });

  it("rejects client attempts to spoof graph, badge ownership, or execution scope", async () => {
    await expect(startTheoryRuntimeJob({ runtimeId: "solar.manifest", graphId: "spoofed", badgeIds: solarBadgeIds, requestedScope: "quick", projectRoot: tempRoot })).rejects.toThrow(/server-owned graph/i);
    await expect(startTheoryRuntimeJob({ runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: [], requestedScope: "quick", projectRoot: tempRoot })).rejects.toThrow(/badge ownership/i);
    await expect(startTheoryRuntimeJob({ runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: solarBadgeIds, requestedScope: "full", projectRoot: tempRoot })).rejects.toThrow(/server-owned scope/i);
  });

  it("resumes a durable queued request when it is read after worker state was lost", async () => {
    const queued = await startTheoryRuntimeJob(
      { runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: solarBadgeIds, requestedScope: "quick", projectRoot: tempRoot },
      { deferExecution: true },
    );
    let executionStarted = false;
    const spawnExecutor = async () => {
      executionStarted = true;
      return {
        startedAt: "2026-07-14T12:00:00.000Z",
        completedAt: "2026-07-14T12:00:01.000Z",
        durationMs: 1000,
        exitCode: 1,
        stdout: "",
        stderr: "resumed fixture",
        timedOut: false,
        error: "resumed fixture failure",
      };
    };

    const recovered = await readTheoryRuntimeJob({
      requestId: queued.jobId,
      projectRoot: tempRoot,
      spawnExecutor,
    });
    expect(recovered?.request.status).toBe("queued");

    let terminal = recovered;
    for (
      let attempt = 0;
      attempt < 30 && (!terminal?.result.available || !["completed", "failed", "timeout"].includes(terminal.request.status));
      attempt += 1
    ) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      terminal = await readTheoryRuntimeJob({ requestId: queued.jobId, projectRoot: tempRoot });
    }
    expect(executionStarted, JSON.stringify(terminal)).toBe(true);
    expect(terminal?.request.status).toBe("failed");
    expect(terminal?.result.available).toBe(true);
  });

  it("closes an orphaned running request with a structured interruption receipt", async () => {
    const queued = await startTheoryRuntimeJob(
      { runtimeId: "solar.manifest", graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID, badgeIds: solarBadgeIds, requestedScope: "quick", projectRoot: tempRoot },
      { deferExecution: true },
    );
    await updateTheoryRuntimeRunRequestStatus({
      requestId: queued.jobId,
      projectRoot: tempRoot,
      status: "running",
      heartbeat: { stage: "running", message: "Process belonged to a prior server.", progress: null },
    });

    const recovered = await readTheoryRuntimeJob({ requestId: queued.jobId, projectRoot: tempRoot });
    const receipt = await readTheoryRuntimeResult({ requestId: queued.jobId, projectRoot: tempRoot });

    expect(recovered?.request.status).toBe("failed");
    expect(recovered?.result.available).toBe(true);
    expect(receipt?.outputs.missingSignals).toContain("runtime_process_interrupted");
    expect(receipt?.claimBoundary.promotionAllowed).toBe(false);
  });
});
