import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";
import { buildSummaryShape, resolveSourcesForTest } from "../scripts/helix-decision-run";

const tempDirs: string[] = [];
const repoRoot = process.cwd();
const req = createRequire(import.meta.url);
const tsxCli = path.join(path.dirname(req.resolve("tsx")), "cli.mjs");

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

  it("fails when heavy and recommendation are from different run dirs", () => {
    const dir = mkDir();
    process.env.HELIX_DECISION_ROOT = dir;

    writeJson(dir, "reports/helix-self-tune-gate-summary.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "reports/helix-self-tune-casimir.json", { verdict: "PASS", integrityOk: true });
    writeJson(dir, "custom/heavy/summary.json", { metrics: { relation_packet_built_rate: 0.99 }, provenance: { gate_pass: true } });
    writeJson(dir, "custom/reco/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "custom/t02/summary.json", { summary_schema_version: 2, variant: "helix_t02_override" });
    writeJson(dir, "custom/t035/summary.json", { summary_schema_version: 2, variant: "helix_t035_override" });

    expect(() =>
      resolveSourcesForTest({
        heavy: "custom/heavy/summary.json",
        recommendation: "custom/reco/recommendation.json",
        narrow: "reports/helix-self-tune-gate-summary.json",
        ab_t02: "custom/t02/summary.json",
        ab_t035: "custom/t035/summary.json",
        casimir: "reports/helix-self-tune-casimir.json",
      }),
    ).toThrow(/source_pair_mismatch:heavy_recommendation/);
  });

  it("uses explicit source overrides with highest precedence", () => {
    const dir = mkDir();
    process.env.HELIX_DECISION_ROOT = dir;

    writeJson(dir, "custom/narrow.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "custom/heavy/heavy.json", { metrics: { relation_packet_built_rate: 0.99 }, provenance: { gate_pass: true } });
    writeJson(dir, "custom/heavy/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "custom/t02/ab-t02.json", { summary_schema_version: 2, variant: "helix_t02_override" });
    writeJson(dir, "custom/t035/ab-t035.json", { summary_schema_version: 2, variant: "helix_t035_override" });
    writeJson(dir, "custom/casimir.json", { verdict: "PASS", integrityOk: true });

    const resolved = resolveSourcesForTest({
      narrow: "custom/narrow.json",
      heavy: "custom/heavy/heavy.json",
      recommendation: "custom/heavy/recommendation.json",
      ab_t02: "custom/t02/ab-t02.json",
      ab_t035: "custom/t035/ab-t035.json",
      casimir: "custom/casimir.json",
    });

    expect(resolved).toEqual({
      narrow: "custom/narrow.json",
      heavy: "custom/heavy/heavy.json",
      recommendation: "custom/heavy/recommendation.json",
      ab_t02: "custom/t02/ab-t02.json",
      ab_t035: "custom/t035/ab-t035.json",
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



  it("writes summary on successful package+validate path", () => {
    const dir = mkDir();
    const binDir = path.join(dir, "bin");
    fs.mkdirSync(binDir, { recursive: true });

    const npmShim = `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "${path.join(dir, "npm-invocations.log")}" 
if [[ "$*" == *"helix:decision:package"* ]]; then
  mkdir -p "${path.join(dir, "reports")}";
  cat > "${path.join(dir, "reports/helix-decision-package.json")}" <<'JSON'
{"decision":{"value":"GO","hard_blockers":[]}}
JSON
  exit 0
fi
if [[ "$*" == *"helix:decision:validate"* ]]; then
  cat > "${path.join(dir, "reports/helix-decision-validate.json")}" <<'JSON'
{"ok":true}
JSON
  exit 0
fi
exit 0
`;
    fs.writeFileSync(path.join(binDir, "npm"), npmShim, { mode: 0o755 });

    writeJson(dir, "custom/narrow.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "custom/heavy/summary.json", { metrics: { relation_packet_built_rate: 0.99 }, provenance: { gate_pass: true } });
    writeJson(dir, "custom/heavy/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "custom/t02/summary.json", { summary_schema_version: 2, variant: "helix_t02_override" });
    writeJson(dir, "custom/t035/summary.json", { summary_schema_version: 2, variant: "helix_t035_override" });
    writeJson(dir, "custom/casimir.json", { verdict: "PASS", integrityOk: true });

    const out = spawnSync(
      process.execPath,
      [
        tsxCli,
        path.join(repoRoot, "scripts/helix-decision-run.ts"),
        "--fresh",
        "false",
        "--narrow",
        "custom/narrow.json",
        "--heavy",
        "custom/heavy/summary.json",
        "--recommendation",
        "custom/heavy/recommendation.json",
        "--ab-t02",
        "custom/t02/summary.json",
        "--ab-t035",
        "custom/t035/summary.json",
        "--casimir",
        "custom/casimir.json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          HELIX_DECISION_ROOT: dir,
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
        },
      },
    );

    expect(out.status).toBe(0);
    const summaryPath = path.join(dir, "reports/helix-decision-run-summary.json");
    expect(fs.existsSync(summaryPath)).toBe(true);

    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8")) as {
      ok: boolean;
      decision: string;
      commands: Array<{ name: string }>;
    };
    expect(summary.ok).toBe(true);
    expect(summary.decision).toBe("GO");
    expect(summary.commands.some((command) => command.name === "decision:package")).toBe(true);
    expect(summary.commands.some((command) => command.name === "decision:validate")).toBe(true);
  });
  it("stops on package failure with machine-readable blocker and no validate fallback", () => {
    const dir = mkDir();
    const binDir = path.join(dir, "bin");
    fs.mkdirSync(binDir, { recursive: true });

    const npmShim = `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "${path.join(dir, "npm-invocations.log")}" 
if [[ "$*" == *"helix:decision:package"* ]]; then
  exit 11
fi
if [[ "$*" == *"helix:decision:validate"* ]]; then
  exit 99
fi
exit 0
`;
    fs.writeFileSync(path.join(binDir, "npm"), npmShim, { mode: 0o755 });

    writeJson(dir, "custom/narrow.json", { strict_gates: { runtime_fallback_answer: 0 } });
    writeJson(dir, "custom/heavy/summary.json", { metrics: { relation_packet_built_rate: 0.99 }, provenance: { gate_pass: true } });
    writeJson(dir, "custom/heavy/recommendation.json", { decision_grade_ready: true });
    writeJson(dir, "custom/t02/summary.json", { summary_schema_version: 2, variant: "helix_t02_override" });
    writeJson(dir, "custom/t035/summary.json", { summary_schema_version: 2, variant: "helix_t035_override" });
    writeJson(dir, "custom/casimir.json", { verdict: "PASS", integrityOk: true });

    const out = spawnSync(
      process.execPath,
      [
        tsxCli,
        path.join(repoRoot, "scripts/helix-decision-run.ts"),
        "--fresh",
        "false",
        "--narrow",
        "custom/narrow.json",
        "--heavy",
        "custom/heavy/summary.json",
        "--recommendation",
        "custom/heavy/recommendation.json",
        "--ab-t02",
        "custom/t02/summary.json",
        "--ab-t035",
        "custom/t035/summary.json",
        "--casimir",
        "custom/casimir.json",
      ],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          HELIX_DECISION_ROOT: dir,
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
        },
      },
    );

    expect(out.status).toBe(1);
    const summary = JSON.parse(fs.readFileSync(path.join(dir, "reports/helix-decision-run-summary.json"), "utf8")) as {
      blockers: string[];
      commands: Array<{ name: string }>;
    };
    expect(summary.blockers).toContain("decision_package_blocker:package_generation_failed");
    expect(summary.commands.some((command) => command.name === "decision:validate")).toBe(false);

    const calls = fs.readFileSync(path.join(dir, "npm-invocations.log"), "utf8");
    expect(calls).toContain("run helix:decision:package --");
    expect(calls).not.toContain("run helix:decision:validate -- --package reports/helix-decision-package.json");
  });
});
