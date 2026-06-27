import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/artifact-text.ts");

describe("Helix Ask artifact text extraction boundary", () => {
  it("keeps pure artifact text helpers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/artifact-text");
    expect(routeSource).not.toMatch(/const\s+normalizeAskTurnArtifactText\s*=\s*\(value/);
    expect(routeSource).not.toMatch(/const\s+readAskTurnArtifactTextByKind\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnInstructionOnlySummaryText\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeAskTurnArtifactText\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+readAskTurnArtifactTextByKind\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnInstructionOnlySummaryText\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
