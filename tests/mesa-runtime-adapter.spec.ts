import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runStarSimMesaRuntimeAdapter } from "../server/modules/starsim/external/mesa-runtime-adapter";
import { sha256Buffer } from "../server/modules/starsim/external/mesa-hash-manifest";

const basePolicy = {
  runtimeKind: "local" as const,
  mesaCommand: "import-declared-mesa-output",
  outputDirectory: "reports",
  allowFixtureFallback: false as const,
  requireInlistHash: true,
  requireProfileHash: true,
  requireHistoryHash: true,
  requireRunLogHash: true,
  integrationTestMode: true,
  importOnly: true,
  inputs: {
    inlistProjectPath: "ops/mesa/solar-reference/inlist_project",
    inlistSolarPath: "ops/mesa/solar-reference/inlist_solar_reference",
  },
  outputs: {
    profilePath: "ops/mesa/solar-reference/profile_solar_reference.data",
    historyPath: "ops/mesa/solar-reference/history_solar_reference.data",
  },
};

describe("MESA runtime adapter", () => {
  it("disabled runtime returns unavailable by throwing", () => {
    expect(() =>
      runStarSimMesaRuntimeAdapter(
        { ...basePolicy, runtimeKind: "disabled" as const },
        join(tmpdir(), "mesa-disabled.json"),
      ),
    ).toThrow(/disabled/);
  });

  it("fixture_only is rejected by the MESA repro tool", () => {
    expect(() =>
      runStarSimMesaRuntimeAdapter(
        { ...basePolicy, runtimeKind: "fixture_only" as const },
        join(tmpdir(), "mesa-fixture.json"),
      ),
    ).toThrow(/fixture_only/);
  });

  it("local runtime fails clearly when declared output is unavailable", () => {
    expect(() =>
      runStarSimMesaRuntimeAdapter(
        {
          ...basePolicy,
          outputs: { ...basePolicy.outputs, profilePath: "missing/profile.data" },
        },
        join(tmpdir(), "mesa-missing.json"),
      ),
    ).toThrow(/profile output/);
  });

  it("docker runtime fails clearly when declared Docker output is unavailable", () => {
    expect(() =>
      runStarSimMesaRuntimeAdapter(
        {
          ...basePolicy,
          runtimeKind: "docker" as const,
          outputs: { profilePath: "missing/profile.data", historyPath: "missing/history.data" },
        },
        join(tmpdir(), "mesa-docker-missing.json"),
      ),
    ).toThrow(/profile output/);
  });

  it("imports declared outputs without fixture fallback", () => {
    const out = join(mkdtempSync(join(tmpdir(), "mesa-runtime-")), "report.json");
    const result = runStarSimMesaRuntimeAdapter(basePolicy, out);
    expect(result.status).toBe("imported");
    expect(result.hashes.entries.profile.hash).toBeTruthy();
    expect(result.hashes.entries.runLog.hash).toBeTruthy();
  });

  it("hash helper is deterministic", () => {
    expect(sha256Buffer("abc")).toBe(sha256Buffer("abc"));
    expect(sha256Buffer("abc")).not.toBe(sha256Buffer("abcd"));
  });
});
