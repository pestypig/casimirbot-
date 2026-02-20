import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests/fixtures/helix-decision/base");
const tempDirs: string[] = [];
const req = createRequire(import.meta.url);
const tsxCli = path.join(path.dirname(req.resolve("tsx")), "cli.mjs");

function mk(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-decision-"));
  tempDirs.push(dir);
  for (const file of fs.readdirSync(fixtureRoot)) {
    fs.copyFileSync(path.join(fixtureRoot, file), path.join(dir, file));
  }
  fs.mkdirSync(path.join(dir, "reports"), { recursive: true });
  fs.mkdirSync(path.join(dir, "schemas"), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, "schemas/helix-decision-package.schema.json"),
    path.join(dir, "schemas/helix-decision-package.schema.json"),
  );
  return dir;
}

function writeJson(filePath: string, value: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function basePackage() {
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
      { path: "narrow.json", exists: true, sha256: "x", size_bytes: 1, mtime_iso: new Date().toISOString() },
    ],
    decision: { value: "GO", hard_blockers: [], reasoning: [] },
    report_paths: { json: "reports/helix-decision-package.json", markdown: "reports/helix-decision-package.md" },
  };
}

function runTsx(cwd: string, scriptRel: string, args: string[] = [], env: NodeJS.ProcessEnv = {}): SpawnSyncReturns<string> {
  const out = spawnSync(process.execPath, [tsxCli, path.join(repoRoot, scriptRel), ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  if (out.error) {
    throw new Error(`failed_to_start_child:${scriptRel}:${out.error.message}\nstdout:${out.stdout}\nstderr:${out.stderr}`);
  }
  return out;
}

function runValidator(cwd: string) {
  return runTsx(cwd, "scripts/helix-decision-validate.ts", ["--package", "pkg.json"]);
}

function writePackageFixtureSet(root: string) {
  writeJson(path.join(root, "reports/helix-self-tune-gate-summary.json"), {
    precheck_run_id: "narrow-run",
    strict_gates: {
      runtime_fallback_answer: 0,
      runtime_tdz_intentStrategy: 0,
      runtime_tdz_intentProfile: 0,
    },
  });

  writeJson(path.join(root, "reports/helix-self-tune-casimir.json"), {
    verdict: "PASS",
    integrityOk: true,
    traceId: "trace-1",
    runId: "run-1",
    certificateHash: "hash-1",
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-heavy-rerun/run-new/summary.json"), {
    run_id: "heavy-run-new",
    metrics: {
      relation_packet_built_rate: 0.98,
      relation_dual_domain_ok_rate: 0.98,
      report_mode_correct_rate: 0.99,
      citation_presence_rate: 1,
      stub_text_detected_rate: 0,
    },
    provenance: {
      gate_pass: true,
      branch: "unknown",
      head: "unknown",
      originMain: null,
      aheadBehind: null,
      warnings: [],
    },
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-heavy-rerun/run-new/recommendation.json"), {
    decision_grade_ready: true,
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-heavy-rerun/run-old/summary.json"), {
    run_id: "heavy-run-old",
    metrics: {
      relation_packet_built_rate: 0.98,
      relation_dual_domain_ok_rate: 0.98,
      report_mode_correct_rate: 0.99,
      citation_presence_rate: 1,
      stub_text_detected_rate: 0,
    },
    provenance: {
      gate_pass: true,
      branch: "unknown",
      head: "unknown",
      originMain: null,
      aheadBehind: null,
      warnings: [],
    },
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-heavy-rerun/run-old/recommendation.json"), {
    decision_grade_ready: true,
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-ab-rerun/t02/run/summary.json"), {
    summary_schema_version: 2,
    variant: "helix_t02_run",
    run_id: "ab-t02-run",
    novel_response_rate: 0.9,
    novel_response_rate_by_family: { relation: 0.9, repo_technical: 0.9, ambiguous_general: 0.9 },
  });

  writeJson(path.join(root, "artifacts/experiments/helix-step4-ab-rerun/t035/run/summary.json"), {
    summary_schema_version: 2,
    variant: "helix_t035_run",
    run_id: "ab-t035-run",
    novel_response_rate: 0.9,
    novel_response_rate_by_family: { relation: 0.9, repo_technical: 0.9, ambiguous_general: 0.9 },
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("helix decision validate", () => {
  it("portable tsx invocation starts child process", () => {
    const dir = mk();
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(basePackage(), null, 2));
    const out = runValidator(dir);
    expect(typeof out.status).toBe("number");
    expect(out.error).toBeUndefined();
  });

  it("valid package passes", () => {
    const dir = mk();
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(basePackage(), null, 2));
    const out = runValidator(dir);
    expect(out.status).toBe(0);
  });

  it("schema failure path is machine-readable", () => {
    const dir = mk();
    const pkg = basePackage();
    // @ts-expect-error test invalid payload
    delete pkg.report_paths;
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("schema_validation_failed");
    expect(`${out.stdout}${out.stderr}`).toContain("schema_error:/:should have required property 'report_paths'");
  });

  it("missing artifact fails", () => {
    const dir = mk();
    const pkg = basePackage();
    pkg.gates[0].source_path = "missing.json";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("source_path_missing");
  });

  it("fake EXISTS fails", () => {
    const dir = mk();
    const pkg = basePackage();
    pkg.artifacts.push({ path: "not-there.json", exists: true, sha256: null, size_bytes: null, mtime_iso: null });
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("artifact_exists_true_but_missing");
  });

  it("novelty-from-wrong-source fails", () => {
    const dir = mk();
    fs.writeFileSync(path.join(dir, "wrong-novelty.json"), JSON.stringify({ foo: "bar" }));
    const pkg = basePackage();
    pkg.novelty.t02.source_path = "wrong-novelty.json";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("novelty_wrong_source_format");
  });

  it("provenance mismatch fails in decision_grade", () => {
    const dir = mk();
    const pkg = basePackage();
    pkg.git.branch = "feature/other";
    fs.writeFileSync(path.join(dir, "pkg.json"), JSON.stringify(pkg, null, 2));
    const out = runValidator(dir);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("decision_grade_git_provenance_mismatch");
  });
});

describe("helix decision package", () => {
  it("fails fast when required sources cannot be resolved", () => {
    const dir = mk();
    const out = runTsx(dir, "scripts/helix-decision-package.ts", ["--narrow", "narrow.json", "--casimir", "casimir.json"]);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("required_source_unresolved:heavy");
  });

  it("auto-discovery chooses newest valid candidate", () => {
    const dir = mk();
    writePackageFixtureSet(dir);
    const oldPath = path.join(dir, "artifacts/experiments/helix-step4-heavy-rerun/run-old/summary.json");
    const newPath = path.join(dir, "artifacts/experiments/helix-step4-heavy-rerun/run-new/summary.json");
    const now = Date.now();
    fs.utimesSync(oldPath, new Date(now - 60_000), new Date(now - 60_000));
    fs.utimesSync(newPath, new Date(now), new Date(now));

    const out = runTsx(dir, "scripts/helix-decision-package.ts");
    expect(out.status).toBe(0);

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "reports/helix-decision-package.json"), "utf8"));
    const heavyGate = pkg.gates.find((g: { name: string }) => g.name === "relation_packet_built_rate");
    expect(heavyGate.source_path).toContain("run-new/summary.json");
  });

  it("explicit CLI source override beats discovery", () => {
    const dir = mk();
    writePackageFixtureSet(dir);
    writeJson(path.join(dir, "custom-heavy-summary.json"), {
      run_id: "custom-heavy",
      metrics: {
        relation_packet_built_rate: 0.98,
        relation_dual_domain_ok_rate: 0.98,
        report_mode_correct_rate: 0.99,
        citation_presence_rate: 1,
        stub_text_detected_rate: 0,
      },
      provenance: { gate_pass: true, branch: "unknown", head: "unknown", originMain: null, aheadBehind: null, warnings: [] },
    });
    writeJson(path.join(dir, "custom-heavy-recommendation.json"), { decision_grade_ready: true });

    const out = runTsx(dir, "scripts/helix-decision-package.ts", [
      "--heavy",
      "custom-heavy-summary.json",
      "--heavy-recommendation",
      "custom-heavy-recommendation.json",
    ]);

    expect(out.status).toBe(0);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "reports/helix-decision-package.json"), "utf8"));
    const heavyGate = pkg.gates.find((g: { name: string }) => g.name === "relation_packet_built_rate");
    expect(heavyGate.source_path).toBe("custom-heavy-summary.json");
  });

  it("heavy/recommendation pair mismatch fails", () => {
    const dir = mk();
    writePackageFixtureSet(dir);
    writeJson(path.join(dir, "detached/recommendation.json"), { decision_grade_ready: true });
    const out = runTsx(dir, "scripts/helix-decision-package.ts", ["--heavy-recommendation", "detached/recommendation.json"]);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("required_source_pair_mismatch:heavy_recommendation");
  });

  it("ab source mismatch fails with invalid shape", () => {
    const dir = mk();
    writePackageFixtureSet(dir);
    const out = runTsx(dir, "scripts/helix-decision-package.ts", ["--ab-t02", "artifacts/experiments/helix-step4-ab-rerun/t035/run/summary.json"]);
    expect(out.status).not.toBe(0);
    expect(`${out.stdout}${out.stderr}`).toContain("required_source_invalid_shape:ab-t02");
  });

  it("explicit env source overrides discovery when coherent", () => {
    const dir = mk();
    writePackageFixtureSet(dir);

    writeJson(path.join(dir, "custom/runA/summary.json"), {
      run_id: "custom-heavy-a",
      metrics: {
        relation_packet_built_rate: 0.98,
        relation_dual_domain_ok_rate: 0.98,
        report_mode_correct_rate: 0.99,
        citation_presence_rate: 1,
        stub_text_detected_rate: 0,
      },
      provenance: { gate_pass: true, branch: "unknown", head: "unknown", originMain: null, aheadBehind: null, warnings: [] },
    });
    writeJson(path.join(dir, "custom/runA/recommendation.json"), { decision_grade_ready: true });

    const out = runTsx(dir, "scripts/helix-decision-package.ts", [], {
      HEAVY: "custom/runA/summary.json",
      HEAVY_RECOMMENDATION: "custom/runA/recommendation.json",
    });
    expect(out.status).toBe(0);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "reports/helix-decision-package.json"), "utf8"));
    const heavyGate = pkg.gates.find((g: { name: string }) => g.name === "relation_packet_built_rate");
    expect(heavyGate.source_path).toBe("custom/runA/summary.json");
  });
});
