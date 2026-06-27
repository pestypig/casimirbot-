import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/capability-catalog-summary.ts");

describe("Helix Ask capability catalog summary extraction boundary", () => {
  it("keeps capability help summary construction out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/capability-catalog-summary");
    expect(routeSource).toContain("createAskTurnCapabilityHelpSummaryBuilder({");
    expect(routeSource).not.toMatch(/const\s+buildAskTurnCapabilityHelpSummary\s*=\s*\(workspaceSnapshot/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnCapabilityHelpSummaryBuilder\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
