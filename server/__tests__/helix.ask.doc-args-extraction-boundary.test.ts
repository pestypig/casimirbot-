import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { extractAskTurnDocPathArgs } from "../services/helix-ask/doc-args";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/doc-args.ts");

describe("Helix Ask doc args extraction boundary", () => {
  it("keeps doc path argument extraction out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/doc-args");
    expect(routeSource).not.toMatch(/const\s+extractAskTurnDocPathArgs\s*=\s*\(transcript/);
    expect(serviceSource).toMatch(/export\s+const\s+extractAskTurnDocPathArgs\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves doc path extraction behavior", () => {
    expect(
      extractAskTurnDocPathArgs("Read docs/research/nhm2-current-status-whitepaper-2026-05-02.md, then ./notes/a.txt and docs/research/nhm2-current-status-whitepaper-2026-05-02.md"),
    ).toEqual(["docs/research/nhm2-current-status-whitepaper-2026-05-02.md", "./notes/a.txt"]);
    expect(extractAskTurnDocPathArgs("no explicit path here")).toEqual([]);
  });
});
