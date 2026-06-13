import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { workspaceOsRouter } from "../../../routes/workspace-os";
import { buildHelixWorkspaceStorageStatus } from "../workspace-storage-status";

const buildApp = () => {
  const app = express();
  app.use("/api/workspace-os", workspaceOsRouter);
  return app;
};

describe("Workspace OS storage status", () => {
  it("reports read-only storage planes without raw content", async () => {
    const status = await buildHelixWorkspaceStorageStatus(
      { thread_id: "storage:test", room_id: "room:test" },
      {
        now: () => new Date("2026-06-12T12:00:00.000Z"),
        env: {
          WORKSPACE_PROFILE_STORAGE_QUOTA_BYTES: "1048576",
          WORKSPACE_APP_STORAGE_QUOTA_BYTES: "2097152",
          WORKSPACE_BROWSER_LOCAL_STORAGE_SOFT_LIMIT_BYTES: "5242880",
        },
      },
    );
    const serialized = JSON.stringify(status);

    expect(status.schema_version).toBe("helix.workspace_storage_status.v1");
    expect(status.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(status.records.every((record) =>
      record.authority.assistant_answer === false &&
      record.authority.raw_content_included === false &&
      record.authority.terminal_eligible === false
    )).toBe(true);
    expect(status.records.find((record) => record.artifact_id === "profile.server")).toMatchObject({
      quota_bytes: 1048576,
      missing_reason: "no_existing_profile_storage_size_accessor",
      diagnostics: expect.objectContaining({
        raw_profile_content_included: false,
      }),
    });
    expect(status.records.find((record) => record.artifact_id === "replit.app_storage")).toMatchObject({
      quota_bytes: 2097152,
      diagnostics: expect.objectContaining({
        raw_object_content_included: false,
      }),
    });
    expect(serialized).not.toContain("SECRET");
    expect(serialized).not.toMatch(/[A-Za-z]:\\\\|C:\\Users/);
  });

  it("serves sanitized storage route JSON", async () => {
    const response = await request(buildApp())
      .get("/api/workspace-os/storage/status?thread_id=storage%3Atest")
      .expect(200);

    expect(response.body.schema_version).toBe("helix.workspace_storage_status.v1");
    expect(response.body.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(Array.isArray(response.body.records)).toBe(true);
  });
});
