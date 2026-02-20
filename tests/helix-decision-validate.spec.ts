import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests/fixtures/helix-decision/base");
const tempDirs: string[] = [];

function mk(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-decision-"));
  tempDirs.push(dir);
  for (const file of fs.readdirSync(fixtureRoot)) {
    fs.copyFileSync(path.join(fixtureRoot, file), path.join(dir, file));
  }
  fs.mkdirSync(path.join(dir, "reports"), { recursive: true });
  return dir;
}

function basePackage(dir: string) {
  return {
    schema_version: "1.0.0",
    generated_at: new Date().toISOString(),
    evaluation_tier: "decision_grade",
    git: {
      branch: "main",
      head: "abc123",
      origin_main: "abc123",
      ahead_behind: { ahead: 0, behind: 0 },
    },
    runs: { narrow: "n", heavy: "h", ab_t02: "a", ab_t035: "b", casimir: "c" },
    gates: [
      { name: "provenance_gate_pass", value: true, threshold: true, comparator: "==", pass: true, source_path: "heavy-summary.json" },
      { name: "runtime_fallback_answer", value: 0, threshold: 0, comparator: "==", pass: true, source_path: "narrow.json" },
    ],
    novelty: {
      t02: {
        overall: 0.9,
        by_family: { relation: 0.9, repo_technical: 0.9, ambiguous_general: 0.9 },
        target: 0.82,
        pass: true,
        source_path: "ab-t02-summary.json",
      },
      t035: {
        overall: 0.9,
        by_family: { relation: 0.9, repo_technical: 0.9, ambiguous_general: 0.9 },
        target: 0.82,
        pass: true,
        source_path: "ab-t035-summary.json",
      },
    },
    provenance: { pass: true, blocked_reason: null, warnings: [] },
    casimir: {
      verdict: "PASS",
      traceId: "t",
      runId: "r",
      certificateHash: "hash",
      integrityOk: true,
      source_path: "casimir.json",
    },
    artifacts: [
      { path: "heavy-summary.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() },
      { path: "ab-t02-summary.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() },
      { path: "ab-t035-summary.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() },
      { path: "casimir.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() },
      { path: "narrow.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() }
    ],
    decision: { value: "GO", hard_blockers: [], reasoning: [] },
    report_paths: { json: "reports/helix-decision-package.json", markdown: "reports/helix-decision-package.md" },
  };
}

function runValidator(cwd: string) {
  return spawnSync(path.join(repoRoot, "node_modules/.bin/tsx"), [path.join(repoRoot, "scripts/helix-decision-validate.ts"), "--package", "pkg.json"], {
    cwd,
    encoding: "utf8",
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("helix decision validate", () => {
  it("valid package passes", () => {
    const dir = mk();
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(basePackage(dir), null, 2));
    const out = runValidator(dir);
    expect(out.status).toBe(0);
  });

  it("missing artifact fails", () => {
    const dir = mk();
    const pkg = basePackage(dir);
    pkg.gates[0].source_path = "missing.json";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("source_path_missing");
  });

  it("fake EXISTS fails", () => {
    const dir = mk();
    const pkg = basePackage(dir);
    pkg.artifacts.push({ path: "not-there.json", exists: true, sha256: null, size_bytes: null, mtime_iso: null });
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("artifact_exists_true_but_missing");
  });

  it("novelty-from-wrong-source fails", () => {
    const dir = mk();
    fs.writeFileSync(path.join(dir, "wrong-novelty.json"), JSON.stringify({ foo: "bar" }));
    const pkg = basePackage(dir);
    pkg.novelty.t02.source_path = "wrong-novelty.json";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("novelty_wrong_source_format");
  });

  it("provenance mismatch fails in decision_grade", () => {
    const dir = mk();
    const pkg = basePackage(dir);
    pkg.git.branch = "feature/other";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("decision_grade_git_provenance_mismatch");
  });
});
