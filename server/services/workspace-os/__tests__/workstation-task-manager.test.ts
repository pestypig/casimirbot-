import { beforeEach, describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { workspaceOsRouter } from "../../../routes/workspace-os";
import {
  clearHelixWorkstationBrowserPerformanceDiagnosticsForTest,
  recordHelixWorkstationBrowserPerformanceSample,
  recordHelixWorkstationCommandReceipt,
} from "../browser-performance-status";
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
  beforeEach(() => {
    clearHelixWorkstationBrowserPerformanceDiagnosticsForTest();
  });

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

  it("folds sanitized browser responsiveness and command receipts into the snapshot", async () => {
    recordHelixWorkstationBrowserPerformanceSample({
      schema_version: "helix.workstation_browser_performance.v1",
      sampled_at: "2026-06-12T11:59:59.000Z",
      window_ms: 60000,
      fps: 28,
      average_frame_ms: 32,
      p95_frame_ms: 88,
      worst_frame_ms: 160,
      long_frame_count: 12,
      long_frame_ratio: 0.2,
      long_task_count: 3,
      long_task_total_ms: 180,
      dom_node_count: 2500,
      open_panel_count: 2,
      focused_panel_id: "stage-play-badge-graph",
      visibility_state: "visible",
      advisory_pressure: "degraded",
      interaction_event_count: 24,
      input_delay_p95_ms: 12,
      input_to_next_frame_p95_ms: 96,
      click_to_next_frame_p95_ms: 105,
      scroll_jank_count: 5,
      drag_jank_count: 2,
      active_interaction_kind: "scroll",
      active_panel_id: "stage-play-badge-graph",
      responsiveness_pressure: "degraded",
    }, new Date("2026-06-12T11:59:59.000Z"));
    recordHelixWorkstationCommandReceipt({
      command_id: "stage-play.copy_mail_loop_unified_trace",
      command_family: "clipboard",
      stage: "clipboard_write_succeeded",
      status: "succeeded",
      panel_id: "stage-play-badge-graph",
      latency_ms: 42,
    }, new Date("2026-06-12T11:59:59.500Z"));

    const snapshot = await buildHelixWorkstationTaskManagerSnapshot(
      { thread_id: "task-manager:test" },
      runtimeReaders(),
    );

    expect(snapshot.processes.find((process) => process.process_id === "browser.interaction_loop")).toMatchObject({
      status: "degraded",
      diagnostics: expect.objectContaining({
        input_to_next_frame_p95_ms: 96,
        active_interaction_kind: "scroll",
      }),
    });
    expect(snapshot.processes.find((process) => process.process_id === "workstation.command_reliability")).toMatchObject({
      status: "idle",
      diagnostics: expect.objectContaining({
        recent_receipt_count: 1,
        failed_receipt_count: 0,
      }),
    });
    expect(snapshot.summary).toMatchObject({
      browser_sample_included: true,
      ui_responsiveness_pressure: "degraded",
      ui_input_to_next_frame_p95_ms: 96,
      command_recent_receipt_count: 1,
      command_failed_receipt_count: 0,
    });
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

  it("accepts sanitized browser sample and command receipt routes", async () => {
    await request(buildApp())
      .post("/api/workspace-os/browser-performance/sample")
      .send({
        schema_version: "helix.workstation_browser_performance.v1",
        sampled_at: new Date().toISOString(),
        window_ms: 60000,
        fps: 30,
        average_frame_ms: 30,
        p95_frame_ms: 60,
        worst_frame_ms: 90,
        long_frame_count: 2,
        long_frame_ratio: 0.1,
        long_task_count: 1,
        long_task_total_ms: 55,
        dom_node_count: 2000,
        open_panel_count: 2,
        focused_panel_id: "stage-play-badge-graph",
        visibility_state: "visible",
        advisory_pressure: "degraded",
        input_to_next_frame_p95_ms: 84,
        responsiveness_pressure: "degraded",
      })
      .expect(202);

    await request(buildApp())
      .post("/api/workspace-os/command-reliability/receipt")
      .send({
        command_id: "stage-play.copy_mail_loop_unified_trace",
        command_family: "clipboard",
        stage: "clipboard_write_failed",
        status: "failed",
        failure_reason: "token=VERY_SECRET_COMMAND_TOKEN_SHOULD_NOT_LEAK_1234567890",
      })
      .expect(202);

    const taskManager = await request(buildApp())
      .get("/api/workspace-os/task-manager?thread_id=task-manager%3Atest")
      .expect(200);

    const serialized = JSON.stringify(taskManager.body);
    expect(taskManager.body.summary.browser_sample_included).toBe(true);
    expect(taskManager.body.summary.command_failed_receipt_count).toBe(1);
    expect(taskManager.body.authority.raw_content_included).toBe(false);
    expect(serialized).not.toContain("VERY_SECRET_COMMAND_TOKEN");
  });
});
