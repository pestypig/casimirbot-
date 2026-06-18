import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const TSX_CLI = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const LIVE_SPINE_SMOKE_SCRIPT = path.join(process.cwd(), "scripts", "helix-ask-live-spine-smoke.ts");

const runLiveSpineSmoke = (extraEnv: Record<string, string>, args: string[] = []) =>
  spawnSync(process.execPath, [TSX_CLI, LIVE_SPINE_SMOKE_SCRIPT, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: "utf8",
    timeout: 20_000,
  });

describe("helix-ask-live-spine-smoke", () => {
  it("dry-runs the required convergence scenario pack without touching the live server", () => {
    const result = runLiveSpineSmoke({}, ["--dry-run"]);
    expect(result.status).toBe(0);

    const summary = JSON.parse(result.stdout);
    const scenarioIds = summary.scenarios.map((scenario: { id: string }) => scenario.id);
    expect(summary.ok).toBe(true);
    expect(summary.dry_run).toBe(true);
    expect(scenarioIds).toEqual(
      expect.arrayContaining([
        "calculator_explicit",
        "workspace_status_explicit",
        "docs_locate_explicit",
        "repo_search_explicit",
        "internet_search_config_or_complete",
        "live_source_mail_observation_or_fail_closed",
        "capability_catalog_runtime",
        "negated_calculator_context",
        "visual_capture_current_screen",
        "image_lens_alias",
      ]),
    );
  });

  it("fails closed as a preflight block when the Ask turn API is unreachable", () => {
    const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "helix-live-spine-smoke-"));
    const result = runLiveSpineSmoke({
      HELIX_ASK_BASE_URL: "http://127.0.0.1:1",
      HELIX_ASK_LIVE_SPINE_OUT: outputRoot,
      HELIX_ASK_LIVE_SPINE_SCENARIOS: "capability_catalog_runtime",
      HELIX_ASK_LIVE_SPINE_TIMEOUT_MS: "1000",
    });

    expect(result.status).toBe(1);
    const summary = JSON.parse(result.stdout);
    expect(summary).toMatchObject({
      schema: "helix.ask_live_spine_smoke_summary.v1",
      ok: false,
      blocked: true,
      blocked_reason: "ask_turn_api_unreachable",
      counts: {
        pass: 0,
        fail: 0,
        warn: 1,
      },
      preflight: {
        ok: false,
        status: 0,
        reason: "ask_turn_api_unreachable",
      },
      results: [],
    });

    const summaryPath = path.join(summary.output_dir, "summary.json");
    const markdownPath = path.join(summary.output_dir, "summary.md");
    expect(fs.existsSync(summaryPath)).toBe(true);
    expect(fs.existsSync(markdownPath)).toBe(true);

    const persisted = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    expect(persisted.blocked_reason).toBe("ask_turn_api_unreachable");
    expect(fs.readFileSync(markdownPath, "utf8")).toContain("preflight: blocked (ask_turn_api_unreachable)");
  });
});
