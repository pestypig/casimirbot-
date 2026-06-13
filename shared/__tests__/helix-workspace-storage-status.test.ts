import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA,
  sortHelixWorkspaceStorageRecords,
  summarizeHelixWorkspaceStorage,
  withHelixWorkspaceStorageAuthority,
  type HelixWorkspaceStorageRecord,
} from "../helix-workspace-storage-status";

const record = (
  overrides: Partial<Omit<HelixWorkspaceStorageRecord, "authority">>,
): HelixWorkspaceStorageRecord =>
  withHelixWorkspaceStorageAuthority({
    artifact_id: "artifact.default",
    label: "Default",
    artifact_type: "unknown",
    owner_scope: "unknown",
    storage_backend: "unknown",
    sync_status: "unknown",
    status: "unknown",
    path_ref: "storage://unknown",
    size_bytes: null,
    approximate: true,
    observed: false,
    ...overrides,
  });

describe("helix workspace storage status contract", () => {
  it("keeps diagnostic authority defaults on storage rows", () => {
    const row = record({
      artifact_id: "storage:notes",
      label: "Notes",
      storage_backend: "localStorage",
      size_bytes: 42.8,
      quota_bytes: 100,
      usage_ratio: 0.428,
      observed: true,
    });

    expect(HELIX_WORKSPACE_STORAGE_STATUS_SCHEMA).toBe("helix.workspace_storage_status.v1");
    expect(row.size_bytes).toBe(43);
    expect(row.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      terminal_ineligible_reason: "workspace_storage_status_is_diagnostic_only",
    });
  });

  it("sorts and summarizes storage records by observed bytes", () => {
    const rows = [
      record({
        artifact_id: "small",
        label: "Small",
        storage_backend: "localStorage",
        size_bytes: 100,
        observed: true,
      }),
      record({
        artifact_id: "large",
        label: "Large",
        storage_backend: "sessionStorage",
        size_bytes: 900,
        observed: true,
      }),
      record({
        artifact_id: "unknown",
        label: "Unknown",
        size_bytes: null,
      }),
    ];

    expect(sortHelixWorkspaceStorageRecords(rows).map((row) => row.artifact_id)).toEqual([
      "large",
      "small",
      "unknown",
    ]);
    expect(summarizeHelixWorkspaceStorage(rows, 2000)).toMatchObject({
      artifact_count: 3,
      observed_artifact_count: 2,
      unknown_artifact_count: 1,
      total_observed_bytes: 1000,
      largest_artifact_id: "large",
      local_storage_bytes: 100,
      session_storage_bytes: 900,
      usage_ratio: 0.5,
      pressure: "normal",
    });
  });
});
