import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/solver-controller-payload-adapter.ts");

describe("Helix Ask solver-controller payload adapter extraction boundary", () => {
  it("keeps the solver-controller payload adapter implementation out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/solver-controller-payload-adapter");
    expect(routeSource).not.toMatch(/const\s+applySolverControllerDecisionForPayload\s*=\s*\(input:\s*\{/);
    expect(serviceSource).toMatch(/const\s+applySolverControllerDecisionForPayload\s*=\s*\(input:\s*ApplySolverControllerDecisionForPayloadInput\)/);
    expect(serviceSource).toMatch(/export\s+const\s+createSolverControllerPayloadAdapter\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
