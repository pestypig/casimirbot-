import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSTATION_TASK_MANAGER_SCHEMA,
  sortHelixWorkstationTaskManagerProcesses,
  summarizeHelixWorkstationTaskManager,
  withHelixWorkstationBrowserPerformanceAuthority,
  withHelixWorkstationCommandReceiptAuthority,
  withHelixWorkstationTaskManagerAuthority,
  type HelixWorkstationTaskManagerProcess,
} from "../helix-workstation-task-manager";

const process = (
  overrides: Partial<Omit<HelixWorkstationTaskManagerProcess, "authority">>,
): HelixWorkstationTaskManagerProcess =>
  withHelixWorkstationTaskManagerAuthority({
    process_id: "process.default",
    label: "Default",
    kind: "unknown",
    status: "unknown",
    memory: {
      source: "unknown",
      approximate: true,
      observed: false,
      estimate_mib: null,
    },
    ...overrides,
  });

describe("helix workstation task manager contract", () => {
  it("keeps diagnostic authority defaults on every process row", () => {
    const row = process({
      process_id: "browser.renderer",
      label: "Browser renderer",
      kind: "browser_renderer",
      status: "active",
      memory: {
        source: "browser_performance_memory",
        approximate: true,
        observed: true,
        used_mib: 42.123,
      },
    });

    expect(HELIX_WORKSTATION_TASK_MANAGER_SCHEMA).toBe("helix.workstation_task_manager.v1");
    expect(row.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      terminal_ineligible_reason: "workstation_task_manager_status_is_diagnostic_only",
    });
    expect(row.memory.used_mib).toBe(42.1);
  });

  it("sorts observed memory before estimates and unknown rows", () => {
    const rows = sortHelixWorkstationTaskManagerProcesses([
      process({
        process_id: "panel.stage-play",
        label: "Stage Play",
        memory: {
          source: "stage_play_panel_projection",
          approximate: true,
          observed: false,
          estimate_mib: 256,
        },
      }),
      process({
        process_id: "browser.renderer",
        label: "Browser renderer",
        memory: {
          source: "browser_performance_memory",
          approximate: true,
          observed: true,
          used_mib: 32,
        },
      }),
      process({
        process_id: "panel.notes",
        label: "Notes",
        memory: {
          source: "browser_panel_registry",
          approximate: true,
          observed: false,
          estimate_mib: null,
        },
      }),
    ]);

    expect(rows.map((row) => row.process_id)).toEqual([
      "browser.renderer",
      "panel.stage-play",
      "panel.notes",
    ]);
  });

  it("summarizes observed, estimated, and unknown rows", () => {
    const rows = [
      process({
        process_id: "server.node",
        label: "Server",
        memory: {
          source: "runtime_governor",
          approximate: false,
          observed: true,
          used_mib: 100,
        },
      }),
      process({
        process_id: "panel.stage-play",
        label: "Stage Play",
        memory: {
          source: "stage_play_panel_projection",
          approximate: true,
          observed: false,
          estimate_mib: 96,
        },
      }),
      process({
        process_id: "panel.unknown",
        label: "Unknown",
        memory: {
          source: "unknown",
          approximate: true,
          observed: false,
          estimate_mib: null,
        },
      }),
    ];

    expect(summarizeHelixWorkstationTaskManager(rows, "normal")).toMatchObject({
      process_count: 3,
      observed_process_count: 1,
      estimated_process_count: 1,
      unknown_process_count: 1,
      total_observed_mib: 100,
      highest_process_id: "server.node",
      pressure_level: "normal",
      server_sample_included: true,
    });
  });

  it("keeps browser performance samples diagnostic-only", () => {
    const sample = withHelixWorkstationBrowserPerformanceAuthority({
      schema_version: "helix.workstation_browser_performance.v1",
      sampled_at: "2026-06-13T00:00:00.000Z",
      window_ms: 60000,
      fps: 42,
      average_frame_ms: 22,
      p95_frame_ms: 55,
      worst_frame_ms: 120,
      long_frame_count: 4,
      long_frame_ratio: 0.1,
      long_task_count: 1,
      long_task_total_ms: 75,
      dom_node_count: 1200,
      open_panel_count: 5,
      focused_panel_id: "workstation-task-manager",
      visibility_state: "visible",
      advisory_pressure: "degraded",
      interaction_event_count: 5,
      input_delay_p95_ms: 12,
      input_to_next_frame_p95_ms: 84,
      click_to_next_frame_p95_ms: 90,
      scroll_jank_count: 2,
      drag_jank_count: 1,
      active_interaction_kind: "scroll",
      active_panel_id: "workstation-task-manager",
      responsiveness_pressure: "degraded",
    });

    expect(sample.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(summarizeHelixWorkstationTaskManager([], "normal", sample)).toMatchObject({
      ui_fps: 42,
      ui_p95_frame_ms: 55,
      ui_long_frame_count: 4,
      ui_advisory_pressure: "degraded",
      ui_responsiveness_pressure: "degraded",
      ui_input_to_next_frame_p95_ms: 84,
    });
  });

  it("keeps command receipts diagnostic-only", () => {
    const receipt = withHelixWorkstationCommandReceiptAuthority({
      schema_version: "helix.workstation_command_receipt.v1",
      receipt_id: "receipt.test",
      command_id: "stage-play.copy_mail_loop_unified_trace",
      command_family: "clipboard",
      stage: "clipboard_write_succeeded",
      status: "succeeded",
      occurred_at: "2026-06-13T00:00:00.000Z",
      panel_id: "stage-play-badge-graph",
      latency_ms: 42,
      failure_reason: null,
    });

    expect(receipt.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
  });
});
