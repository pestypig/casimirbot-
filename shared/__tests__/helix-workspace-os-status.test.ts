import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSPACE_OS_STATUS_SCHEMA,
  buildHelixWorkspaceOsAuthority,
  summarizeHelixWorkspaceOsCapabilities,
  withHelixWorkspaceOsAuthority,
  type HelixWorkspaceOsCapabilityRecord,
} from "../helix-workspace-os-status";

describe("Helix Workspace OS status contract", () => {
  it("uses a stable schema version and non-terminal authority defaults", () => {
    expect(HELIX_WORKSPACE_OS_STATUS_SCHEMA).toBe("helix.workspace_os.status.v1");
    expect(buildHelixWorkspaceOsAuthority()).toEqual({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      terminal_ineligible_reason: "workspace_os_status_is_diagnostic_only",
    });
  });

  it("adds non-terminal authority to capability records", () => {
    const record = withHelixWorkspaceOsAuthority({
      capability_id: "clipboard.read",
      surface: "clipboard",
      mode: "read_only",
      status: "unknown",
    });

    expect(record.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
  });

  it("summarizes status categories without making evidence terminal", () => {
    const capabilities: HelixWorkspaceOsCapabilityRecord[] = [
      withHelixWorkspaceOsAuthority({
        capability_id: "browser.tab_capture",
        surface: "browser",
        mode: "read_only",
        status: "available",
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "source.binding.visual",
        surface: "situation_source",
        mode: "diagnostic",
        status: "bound",
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "runtime.memory",
        surface: "runtime_memory",
        mode: "diagnostic",
        status: "degraded",
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "screen.capture",
        surface: "screen",
        mode: "read_only",
        status: "permission_required",
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "workspace_os.client.error",
        surface: "browser",
        mode: "diagnostic",
        status: "error",
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "dev_server.local",
        surface: "dev_server",
        mode: "diagnostic",
        status: "unknown",
      }),
    ];

    expect(summarizeHelixWorkspaceOsCapabilities(capabilities)).toEqual({
      available_count: 2,
      degraded_count: 1,
      blocked_count: 1,
      error_count: 1,
      unknown_count: 1,
    });
  });
});
