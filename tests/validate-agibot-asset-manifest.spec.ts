import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("AGIBOT asset manifest validator", () => {
  it("passes deterministic validator", async () => {
    const result = await execa("npx", ["tsx", "scripts/validate-agibot-asset-manifest.ts"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("PASS agibot_asset_manifest");
  });
});
