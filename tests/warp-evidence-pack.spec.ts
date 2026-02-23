import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";

describe("warp evidence pack determinism", () => {
  it("produces deterministic bundle bytes for same inputs", () => {
    execSync("npm run warp:evidence:pack -- --out artifacts/evidence-a.json --first-fail FordRomanQI --claim-tier reduced-order", { stdio: "pipe" });
    execSync("npm run warp:evidence:pack -- --out artifacts/evidence-b.json --first-fail FordRomanQI --claim-tier reduced-order", { stdio: "pipe" });
    const a = fs.readFileSync("artifacts/evidence-a.json", "utf8");
    const b = fs.readFileSync("artifacts/evidence-b.json", "utf8");
    expect(a).toBe(b);
  });
});
