import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0, dirs.length)) rmSync(d, { recursive: true, force: true });
});

describe("voice weights manifest validator", () => {
  it("passes for example manifest", () => {
    const run = spawnSync("python", ["scripts/voice/verify_weights_manifest.py", "configs/voice/weights-manifest.example.json"], { encoding: "utf-8" });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("status=ok");
  });

  it("fails when required fields are missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "weights-manifest-"));
    dirs.push(dir);
    const manifest = join(dir, "manifest.json");
    writeFileSync(manifest, JSON.stringify({ model_id: "x" }));

    const run = spawnSync("python", ["scripts/voice/verify_weights_manifest.py", manifest], { encoding: "utf-8" });
    expect(run.status).not.toBe(0);
    expect(run.stdout).toContain("missing_field");
  });
});
