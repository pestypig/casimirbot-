import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

describe("TOE progress tooling", () => {
  it("reports forest_owner_coverage_pct alongside toe_progress_pct", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "toe-progress-"));
    const backlogPath = path.join(tempDir, "core.json");
    const resultsDir = path.join(tempDir, "results");
    const snapshotPath = path.join(tempDir, "snapshot.json");
    const manifestPath = path.join(tempDir, "manifest.json");

    writeJson(backlogPath, {
      schema_version: "toe_cloud_ticket_backlog/1",
      tickets: [{ id: "TOE-TEST-001" }, { id: "TOE-TEST-002" }],
    });

    writeJson(path.join(resultsDir, "TOE-TEST-001.20260218-000000.json"), {
      schema_version: "toe_agent_ticket_result/1",
      ticket_id: "TOE-TEST-001",
      claim_tier: "certified",
      casimir: { verdict: "PASS", integrity_ok: true },
    });

    writeJson(manifestPath, {
      schema_version: "resolver_owner_coverage_manifest/1",
      high_priority_owners: ["owner-a"],
      owners: {
        "owner-a": { status: "covered_core" },
        "owner-b": { status: "unmapped" },
      },
    });

    execFileSync("npx", ["tsx", "scripts/compute-toe-progress.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TOE_BACKLOG_PATH: backlogPath,
        TOE_RESULTS_DIR: resultsDir,
        TOE_PROGRESS_SNAPSHOT_PATH: snapshotPath,
        RESOLVER_OWNER_COVERAGE_MANIFEST_PATH: manifestPath,
      },
      stdio: "pipe",
    });

    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    expect(snapshot.totals.toe_progress_pct).toBe(50);
    expect(snapshot.totals.forest_owner_coverage_pct).toBe(50);
  });

  it("fails validation when high-priority owners are unmapped", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "owner-coverage-"));
    const graphResolversPath = path.join(tempDir, "graph.json");
    const manifestPath = path.join(tempDir, "manifest.json");

    writeJson(graphResolversPath, {
      trees: [{ id: "owner-a" }, { id: "owner-b" }],
    });

    writeJson(manifestPath, {
      schema_version: "resolver_owner_coverage_manifest/1",
      high_priority_owners: ["owner-a"],
      owners: {
        "owner-a": { status: "unmapped" },
        "owner-b": { status: "covered_extension" },
      },
    });

    expect(() => {
      execFileSync("npx", ["tsx", "scripts/validate-resolver-owner-coverage.ts"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          RESOLVER_OWNER_COVERAGE_MANIFEST_PATH: manifestPath,
          GRAPH_RESOLVERS_PATH: graphResolversPath,
        },
        stdio: "pipe",
      });
    }).toThrow(/high-priority owners cannot be unmapped/);
  });
});
