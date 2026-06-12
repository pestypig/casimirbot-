import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { workspaceOsRouter } from "../../../routes/workspace-os";
import {
  buildHelixWorkstationTaskManagerSnapshot,
  type HelixWorkstationTaskManagerReaders,
} from "../workstation-task-manager";

const buildApp = () => {
  const app = express();
  app.use("/api/workspace-os", workspaceOsRouter);
  return app;
};

const runtimeReaders = (): Pick<
  HelixWorkstationTaskManagerReaders,
  "getRuntimeMemorySnapshot" | "getRuntimeTaskSnapshot" | "now"
> => ({
  now: () => new Date("2026-06-12T12:00:00.000Z"),
  getRuntimeMemorySnapshot: () => ({
    schema: "casimir.runtime_memory.v1",
    pid: 12345,
    memory: {
      heapUsedMiB: 128,
      heapTotalMiB: 256,
      rssMiB: 512,
      externalMiB: 12,
      arrayBuffersMiB: 6,
    },
    host: {
      freeMiB: 2048,
      totalMiB: 8192,
      freeRatio: 0.25,
    },
    pressureLevel: "normal",
    pressureReason: "ok",
    pressureBasis: {
      taskClass: "active_user_turn",
      reason: "headline_pressure_uses_active_user_turn_budget",
    },
    taskClassPressure: [],
    activeTasks: [
      {
        id: "task-token-VERY_SECRET_TASK_IDENTIFIER_SHOULD_NOT_LEAK_1234567890",
        taskClass: "stage_play_refresh",
        admittedAtMs: Date.parse("2026-06-12T11:59:58.000Z"),
      },
    ],
    pausedTasks: [],
    recentDecisions: [],
    limits: {
      maxHeapUsedMiB: 2048,
      maxRssMiB: 3200,
      resumeHeapUsedMiB: 1536,
      resumeRssMiB: 2400,
    },
  } as any),
  getRuntimeTaskSnapshot: () => ({
    schema: "casimir.runtime_tasks.v1",
    pid: 12345,
    pressureLevel: "normal",
    memory: {
      heapUsedMiB: 128,
      heapTotalMiB: 256,
      rssMiB: 512,
      externalMiB: 12,
      arrayBuffersMiB: 6,
    },
    host: {
      freeMiB: 2048,
      totalMiB: 8192,
      freeRatio: 0.25,
    },
    activeTasks: [
      {
        id: "task-token-VERY_SECRET_TASK_IDENTIFIER_SHOULD_NOT_LEAK_1234567890",
        taskClass: "stage_play_refresh",
        admittedAtMs: Date.parse("2026-06-12T11:59:58.000Z"),
      },
    ],
    pausedTasks: [],
    registeredPausableTasks: [],
    classes: [
      {
        taskClass: "stage_play_refresh",
        priority: 45,
        deferrable: true,
        pausable: true,
        maxConcurrent: 1,
        burstLimit: 12,
        burstWindowMs: 60000,
        burstUsed: 2,
        activeCount: 1,
        estimatedBurstMiB: 96,
      },
      {
        taskClass: "active_user_turn",
        priority: 90,
        deferrable: false,
        pausable: false,
        maxConcurrent: 4,
        burstLimit: 24,
        burstWindowMs: 60000,
        burstUsed: 0,
        activeCount: 0,
        estimatedBurstMiB: null,
      },
    ],
    recentDecisions: [
      {
        taskClass: "stage_play_refresh",
        action: "queue",
        admitted: false,
      },
    ],
    recentCompletions: [],
  } as any),
});

describe("Workspace OS task manager", () => {
  it("builds a read-only sorted runtime snapshot without leaking task ids", async () => {
    const snapshot = await buildHelixWorkstationTaskManagerSnapshot(
      { thread_id: "task-manager:test", room_id: "room:test" },
      runtimeReaders(),
    );
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.schema_version).toBe("helix.workstation_task_manager.v1");
    expect(snapshot.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(snapshot.processes.every((process) =>
      process.authority.assistant_answer === false &&
      process.authority.raw_content_included === false &&
      process.authority.terminal_eligible === false
    )).toBe(true);
    expect(snapshot.processes[0]).toMatchObject({
      kind: "server_runtime",
      memory: expect.objectContaining({
        observed: true,
        used_mib: 512,
      }),
    });
    expect(snapshot.processes.some((process) => process.kind === "runtime_task")).toBe(true);
    expect(snapshot.processes.find((process) => process.process_id === "runtime.task_class.stage_play_refresh")).toMatchObject({
      status: "active",
      memory: expect.objectContaining({
        observed: false,
        estimate_mib: 96,
      }),
      diagnostics: expect.objectContaining({
        queued_recent_decision_count: 1,
      }),
    });
    expect(snapshot.summary).toMatchObject({
      server_sample_included: true,
      browser_sample_included: false,
      pressure_level: "normal",
    });
    expect(serialized).not.toContain("VERY_SECRET_TASK_IDENTIFIER");
  });

  it("degrades gracefully when the runtime reader throws", async () => {
    const snapshot = await buildHelixWorkstationTaskManagerSnapshot(
      { thread_id: "task-manager:test" },
      {
        ...runtimeReaders(),
        getRuntimeMemorySnapshot: () => {
          throw new Error("reader failed token=VERY_SECRET_RUNTIME_TOKEN_SHOULD_NOT_LEAK_1234567890");
        },
      },
    );

    expect(snapshot.processes[0]).toMatchObject({
      process_id: "workspace_os.task_manager.runtime_reader_error",
      status: "degraded",
      authority: {
        terminal_eligible: false,
      },
    });
    expect(JSON.stringify(snapshot)).not.toContain("VERY_SECRET_RUNTIME_TOKEN");
  });

  it("serves sanitized route JSON", async () => {
    const response = await request(buildApp())
      .get("/api/workspace-os/task-manager?thread_id=task-manager%3Atest")
      .expect(200);

    expect(response.body.schema_version).toBe("helix.workstation_task_manager.v1");
    expect(response.body.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(Array.isArray(response.body.processes)).toBe(true);
  });
});

