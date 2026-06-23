import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/turn-finalizer.ts");

describe("Helix Ask turn finalizer extraction boundary", () => {
  it("keeps the turn finalizer implementation out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/turn-finalizer");
    expect(routeSource).not.toMatch(/const\s+finalizeHelixAskTurnPayload\s*=\s*\(args:\s*\{/);
    expect(serviceSource).toMatch(/const\s+finalizeHelixAskTurnPayload\s*=\s*\(args:\s*FinalizeHelixAskTurnPayloadInput\)/);
    expect(serviceSource).toMatch(/export\s+const\s+createHelixAskTurnFinalizer\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
