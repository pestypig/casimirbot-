import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";
import { computeDecisionHash } from "../scripts/lib/helix-decision-bundle";

const repoRoot = process.cwd();
const req = createRequire(import.meta.url);
const tsxCli = path.join(path.dirname(req.resolve("tsx")), "cli.mjs");
const tempDirs: string[] = [];

function mkDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-bundle-"));
  tempDirs.push(dir);
  return dir;
}

function cpFixture(dir: string): void {
  const fixtureDir = path.join(repoRoot, "tests/fixtures/helix-decision-bundle");
  fs.mkdirSync(path.join(dir, "inputs"), { recursive: true });
  for (const name of ["narrow.json", "heavy-summary.json", "heavy-recommendation.json", "ab-t02.json", "ab-t035.json", "casimir.json"]) {
    fs.copyFileSync(path.join(fixtureDir, name), path.join(dir, "inputs", name));
  }
  fs.mkdirSync(path.join(dir, "schemas"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "schemas/helix-decision-bundle.schema.json"), path.join(dir, "schemas/helix-decision-bundle.schema.json"));
}

function writeNpmShim(dir: string): void {
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin, { recursive: true });
  const shim = path.join(bin, "npm");
  fs.writeFileSync(
    shim,
    `#!/usr/bin/env node
const fs=require('node:fs');const path=require('node:path');
const args=process.argv.slice(2).join(' ');
if(args.includes('helix:decision:package')){
 const reports=path.join(process.cwd(),'reports'); fs.mkdirSync(reports,{recursive:true});
 const pkg={evaluation_tier:'decision_grade',git:{branch:'main',head:'abc',origin_main:'def',ahead_behind:{ahead:0,behind:0}},thresholds:{a:1},gates:[{name:'g',pass:true}],novelty:{t02:{pass:true},t035:{pass:true}},provenance:{pass:true},casimir:{verdict:'PASS',integrityOk:true},decision:{value:'GO',hard_blockers:[]}};
 fs.writeFileSync(path.join(reports,'helix-decision-package.json'), JSON.stringify(pkg,null,2)); process.exit(0);
}
process.exit(0);
`,
    { mode: 0o755 },
  );
}

function run(dir: string, script: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [tsxCli, path.join(repoRoot, script), ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${path.join(dir, "bin")}${path.delimiter}${process.env.PATH ?? ""}` },
  });
}

afterEach(() => {
  while (tempDirs.length > 0) fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("helix decision bundle", () => {
  it("passes schema+verify for generated bundle", () => {
    const dir = mkDir();
    cpFixture(dir);
    writeNpmShim(dir);

    const gen = run(dir, "scripts/helix-decision-bundle.ts", [
      "--narrow", "inputs/narrow.json", "--heavy", "inputs/heavy-summary.json", "--heavy-recommendation", "inputs/heavy-recommendation.json", "--ab-t02", "inputs/ab-t02.json", "--ab-t035", "inputs/ab-t035.json", "--casimir", "inputs/casimir.json",
    ]);
    expect(gen.status).toBe(0);

    const verify = run(dir, "scripts/helix-decision-bundle-verify.ts", ["--bundle", "reports/helix-decision-bundle.json"]);
    expect(verify.status).toBe(0);

    const report = JSON.parse(fs.readFileSync(path.join(dir, "reports/helix-decision-bundle-verify.json"), "utf8"));
    expect(report.ok).toBe(true);
  });

  it("fails on digest mismatch", () => {
    const dir = mkDir();
    cpFixture(dir);
    writeNpmShim(dir);
    run(dir, "scripts/helix-decision-bundle.ts", ["--narrow", "inputs/narrow.json", "--heavy", "inputs/heavy-summary.json", "--heavy-recommendation", "inputs/heavy-recommendation.json", "--ab-t02", "inputs/ab-t02.json", "--ab-t035", "inputs/ab-t035.json", "--casimir", "inputs/casimir.json"]);
    fs.writeFileSync(path.join(dir, "inputs", "narrow.json"), "{\"tampered\":true}\n");
    const verify = run(dir, "scripts/helix-decision-bundle-verify.ts", ["--bundle", "reports/helix-decision-bundle.json"]);
    expect(verify.status).toBe(1);
    expect(verify.stdout).toContain("evidence_digest_mismatch");
  });

  it("fails on missing evidence", () => {
    const dir = mkDir();
    cpFixture(dir);
    writeNpmShim(dir);
    run(dir, "scripts/helix-decision-bundle.ts", ["--narrow", "inputs/narrow.json", "--heavy", "inputs/heavy-summary.json", "--heavy-recommendation", "inputs/heavy-recommendation.json", "--ab-t02", "inputs/ab-t02.json", "--ab-t035", "inputs/ab-t035.json", "--casimir", "inputs/casimir.json"]);
    fs.rmSync(path.join(dir, "inputs", "ab-t02.json"));
    const verify = run(dir, "scripts/helix-decision-bundle-verify.ts", ["--bundle", "reports/helix-decision-bundle.json"]);
    expect(verify.status).toBe(1);
    expect(verify.stdout).toContain("evidence_missing");
  });

  it("fails on decision hash mismatch", () => {
    const dir = mkDir();
    cpFixture(dir);
    writeNpmShim(dir);
    run(dir, "scripts/helix-decision-bundle.ts", ["--narrow", "inputs/narrow.json", "--heavy", "inputs/heavy-summary.json", "--heavy-recommendation", "inputs/heavy-recommendation.json", "--ab-t02", "inputs/ab-t02.json", "--ab-t035", "inputs/ab-t035.json", "--casimir", "inputs/casimir.json"]);
    const bundlePath = path.join(dir, "reports/helix-decision-bundle.json");
    const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    bundle.decision.decision_hash = "0".repeat(64);
    fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`);
    const verify = run(dir, "scripts/helix-decision-bundle-verify.ts", ["--bundle", "reports/helix-decision-bundle.json"]);
    expect(verify.status).toBe(1);
    expect(verify.stdout).toContain("decision_hash_mismatch");
  });

  it("hash is deterministic", () => {
    const payload = { b: 1, a: [2, { z: true, y: null }] };
    expect(computeDecisionHash(payload)).toBe(computeDecisionHash({ a: [2, { y: null, z: true }], b: 1 }));
  });
});
