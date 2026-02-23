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



  it("parses voice provider governance defaults and env overrides", () => {
    const defaults = resolveStartupConfig({}, "development");
    expect(defaults.voiceGovernance.providerMode).toBe("allow_remote");
    expect(defaults.voiceGovernance.providerAllowlist).toEqual([]);
    expect(defaults.voiceGovernance.commercialMode).toBe(false);
    expect(defaults.voiceGovernance.managedProvidersEnabled).toBe(true);
    expect(defaults.voiceGovernance.localOnlyMissionMode).toBe(true);

    const configured = resolveStartupConfig(
      {
        VOICE_PROVIDER_MODE: "local_only",
        VOICE_PROVIDER_ALLOWLIST: "local-chatterbox,remote-a, remote-b",
        VOICE_COMMERCIAL_MODE: "1",
        VOICE_MANAGED_PROVIDERS_ENABLED: "0",
        VOICE_LOCAL_ONLY_MISSION_MODE: "false",
      },
      "development",
    );

    expect(configured.voiceGovernance.providerMode).toBe("local_only");
    expect(configured.voiceGovernance.providerAllowlist).toEqual([
      "local-chatterbox",
      "remote-a",
      "remote-b",
    ]);
    expect(configured.voiceGovernance.commercialMode).toBe(true);
    expect(configured.voiceGovernance.managedProvidersEnabled).toBe(false);
    expect(configured.voiceGovernance.localOnlyMissionMode).toBe(true);
  });



  it("exposes deterministic managed/local mode state from explicit flags", () => {
    const configured = resolveStartupConfig(
      {
        VOICE_PROVIDER_MODE: "allow_remote",
        VOICE_MANAGED_PROVIDERS_ENABLED: "true",
        VOICE_LOCAL_ONLY_MISSION_MODE: "0",
      },
      "development",
    );

    expect(configured.voiceGovernance.providerMode).toBe("allow_remote");
    expect(configured.voiceGovernance.managedProvidersEnabled).toBe(true);
    expect(configured.voiceGovernance.localOnlyMissionMode).toBe(false);
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
  const backlogWithToe089 = {
    ...backlog,
    tickets: [
      ...(Array.isArray(backlog?.tickets) ? backlog.tickets : []),
      {
        id: "TOE-089-external-integrations-lane-promotion",
        tree_owner: "external-integrations",
        required_tests: [
          "tests/startup-config.spec.ts",
          "tests/external-integrations-contract.spec.ts",
        ],
      },
    ],
  };

  it("passes for current manifest", () => {
    const checklistTests = [
      "tests/startup-config.spec.ts",
      "tests/theory-checks.spec.ts",
      "tests/external-integrations-contract.spec.ts",
    ];
    const errors = validateManifest(manifest, backlogWithToe089, checklistTests, repoRoot);

    expect(errors).toEqual([]);
  });



  it("registers TOE-089 external integrations lane contract in primitive manifest", () => {
    const primitive = manifest.primitives.find(
      (entry: { primitive_id?: string }) =>
        entry.primitive_id === "TOE-089-external-integrations-lane-promotion",
    );

    expect(primitive).toBeTruthy();
    expect(primitive?.tree_owner).toBe("external-integrations");
    expect(primitive?.tests).toContain("tests/external-integrations-contract.spec.ts");
  });

  it("fails for missing links and dangling test references", () => {
    const checklistTests = [
      "tests/startup-config.spec.ts",
      "tests/theory-checks.spec.ts",
      "tests/external-integrations-contract.spec.ts",
    ];
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
