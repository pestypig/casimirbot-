import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildSummaryShape, resolveSourcesForTest } from "../scripts/helix-decision-run";

const tempDirs: string[] = [];

function mkDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-decision-run-"));
  tempDirs.push(dir);
  return dir;
}

function writeJson(root: string, relPath: string, value: Record<string, unknown>): void {
  const filePath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

afterEach(() => {
  delete process.env.HELIX_DECISION_ROOT;
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("helix decision run source resolution", () => {
  it("resolves newest discovered artifacts when overrides are absent", () => {
    const dir = mkDir();
    process.env.HELIX_DECISION_ROOT = dir;

    writeJson(dir, "reports/helix-self-tune-gate-summary.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "reports/helix-self-tune-casimir.json", { verdict: "PASS", integrityOk: true });
    writeJson(dir, "artifacts/experiments/helix-step4-heavy-rerun/new/summary.json", {
      metrics: { relation_packet_built_rate: 0.97 },
      provenance: { gate_pass: true },
    });
    writeJson(dir, "artifacts/experiments/helix-step4-heavy-rerun/new/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "artifacts/experiments/helix-step4-ab-rerun/t02/run/summary.json", {
      summary_schema_version: 2,
      variant: "helix_t02_run",
    });
    writeJson(dir, "artifacts/experiments/helix-step4-ab-rerun/t035/run/summary.json", {
      summary_schema_version: 2,
      variant: "helix_t035_run",
    });

    const resolved = resolveSourcesForTest({});
    expect(resolved.heavy).toContain("helix-step4-heavy-rerun/new/summary.json");
    expect(resolved.recommendation).toContain("helix-step4-heavy-rerun/new/recommendation.json");
    expect(resolved.ab_t02).toContain("helix-step4-ab-rerun/t02/run/summary.json");
    expect(resolved.ab_t035).toContain("helix-step4-ab-rerun/t035/run/summary.json");
  });

  it("uses explicit source overrides with highest precedence", () => {
    const dir = mkDir();
    process.env.HELIX_DECISION_ROOT = dir;

    writeJson(dir, "custom/narrow.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "custom/heavy.json", { metrics: { relation_packet_built_rate: 0.99 }, provenance: { gate_pass: true } });
    writeJson(dir, "custom/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "custom/ab-t02.json", { summary_schema_version: 2, variant: "helix_t02_override" });
    writeJson(dir, "custom/ab-t035.json", { summary_schema_version: 2, variant: "helix_t035_override" });
    writeJson(dir, "custom/casimir.json", { verdict: "PASS", integrityOk: true });

    const resolved = resolveSourcesForTest({
      narrow: "custom/narrow.json",
      heavy: "custom/heavy.json",
      recommendation: "custom/recommendation.json",
      ab_t02: "custom/ab-t02.json",
      ab_t035: "custom/ab-t035.json",
      casimir: "custom/casimir.json",
    });

    expect(resolved).toEqual({
      narrow: "custom/narrow.json",
      heavy: "custom/heavy.json",
      recommendation: "custom/recommendation.json",
      ab_t02: "custom/ab-t02.json",
      ab_t035: "custom/ab-t035.json",
      casimir: "custom/casimir.json",
    });
  });
});

describe("helix decision run summary", () => {
  it("returns stable machine-readable summary shape", () => {
    const summary = buildSummaryShape({
      ok: true,
      decision: "GO",
      blockers: [],
      selected_sources: {
        narrow: "reports/helix-self-tune-gate-summary.json",
        heavy: "artifacts/heavy/summary.json",
        recommendation: "artifacts/heavy/recommendation.json",
        ab_t02: "artifacts/ab/t02/summary.json",
        ab_t035: "artifacts/ab/t035/summary.json",
        casimir: "reports/helix-self-tune-casimir.json",
      },
      commands: [{ name: "decision:package", cmd: "npm run helix:decision:package", status: 0 }],
    });

    expect(summary.ok).toBe(true);
    expect(summary.decision).toBe("GO");
    expect(Array.isArray(summary.blockers)).toBe(true);
    expect(summary.selected_sources.heavy).toContain("summary.json");
    expect(summary.commands[0].status).toBe(0);
  });
});
