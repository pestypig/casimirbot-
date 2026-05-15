import { describe, expect, it } from "vitest";
import {
  applyWorkstationProcessGraphEvent,
  buildWorkstationProcessGraphSnapshot,
  createInitialWorkstationProcessGraphState,
} from "../processGraphReducer";

describe("workstation process graph snapshot", () => {
  it("returns a deterministic read-only artifact shape", () => {
    const withJob = applyWorkstationProcessGraphEvent(createInitialWorkstationProcessGraphState("session:test"), {
      type: "job.started",
      jobId: "job-1",
      label: "Translate source",
      traceId: "trace-job",
      panelId: "situation-room-pipelines",
      ts: "2026-05-15T10:00:00.000Z",
    });
    const snapshot = buildWorkstationProcessGraphSnapshot(withJob, { maxNodes: 20 });

    expect(snapshot).toMatchObject({
      kind: "workstation_process_graph_snapshot",
      schemaVersion: "helix.workstation.process_graph.snapshot/v1",
      sessionId: "session:test",
    });
    expect(snapshot.summary.activeJobs).toBe(1);
    expect(snapshot.nodes.some((node) => node.kind === "job" && node.jobId === "job-1")).toBe(true);
  });
});
