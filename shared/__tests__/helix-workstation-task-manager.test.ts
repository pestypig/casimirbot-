import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSTATION_TASK_MANAGER_SCHEMA,
  sortHelixWorkstationTaskManagerProcesses,
  summarizeHelixWorkstationTaskManager,
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
});

