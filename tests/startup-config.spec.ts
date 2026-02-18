import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveStartupConfig } from "../server/startup-config";
import { validateManifest } from "../scripts/validate-agent-context-checklist";

describe("resolveStartupConfig", () => {
  it("uses PORT/HOST as-is and does not force deploy overrides", () => {
    const cfg = resolveStartupConfig(
      {
        NODE_ENV: "production",
        REPLIT_DEPLOYMENT: "1",
        PORT: "4312",
        HOST: "0.0.0.0",
      },
      "production",
    );

    expect(cfg.isDeploy).toBe(true);
    expect(cfg.port).toBe(4312);
    expect(cfg.host).toBe("0.0.0.0");
  });

  it("falls back to environment default ports when PORT is invalid", () => {
    const prod = resolveStartupConfig({ PORT: "abc" }, "production");
    const dev = resolveStartupConfig({ PORT: "0", HOST: " " }, "development");

    expect(prod.port).toBe(5000);
    expect(dev.port).toBe(5173);
    expect(dev.host).toBe("0.0.0.0");
  });
});

describe("warp primitive manifest validation", () => {
  const repoRoot = process.cwd();
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, "configs/warp-primitive-manifest.v1.json"), "utf8"),
  );
  const backlog = JSON.parse(
    readFileSync(
      join(repoRoot, "docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json"),
      "utf8",
    ),
  );

  it("passes for current manifest", () => {
    const checklistTests = ["tests/startup-config.spec.ts", "tests/theory-checks.spec.ts"];
    const errors = validateManifest(manifest, backlog, checklistTests, repoRoot);

    expect(errors).toEqual([]);
  });

  it("fails for missing links and dangling test references", () => {
    const checklistTests = ["tests/startup-config.spec.ts", "tests/theory-checks.spec.ts"];
    const badManifest = {
      schema_version: "warp_primitive_manifest/1",
      primitives: [
        {
          primitive_id: "TOE-010-unified-primitive-manifest",
          tree_owner: "math",
          policy_source: { path: "WARP_AGENTS.missing" },
          evaluator: { path: "scripts/validate-agent-context-checklist.ts" },
          tests: ["tests/startup-config.spec.ts", "tests/does-not-exist.spec.ts"],
        },
      ],
    };

    const errors = validateManifest(badManifest, backlog, checklistTests, repoRoot);
    expect(errors.some((entry) => entry.includes("policy_source.path does not exist"))).toBe(true);
    expect(errors.some((entry) => entry.includes("test path does not exist"))).toBe(true);
  });
});
