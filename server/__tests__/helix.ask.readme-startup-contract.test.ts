import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";

const README_DEV_SCRIPTS = ["dev", "dev:agi", "dev:agi:5050", "dev:agi:5173"] as const;

describe("Helix Ask README startup contract", () => {
  it("keeps normal README development commands on the live model/tool route", () => {
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");

    expect(readme).toContain("npm run dev");
    expect(readme).toContain("npm run dev:agi:5050");
    for (const scriptName of README_DEV_SCRIPTS) {
      expect(packageJson.scripts[scriptName]).toContain("HELIX_ASK_GOLDEN_PATH_RUNTIME=0");
      expect(packageJson.scripts[scriptName]).not.toContain("HELIX_ASK_GOLDEN_PATH_RUNTIME=1");
    }
  });

  it("keeps contract-only scaffold startup explicit", () => {
    expect(packageJson.scripts["dev:golden-path"]).toContain("HELIX_ASK_GOLDEN_PATH_RUNTIME=1");
  });
});
