import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/runtime/runtime-composer-fallback-text.ts");

describe("Helix Ask runtime composer fallback text extraction boundary", () => {
  it("keeps scholarly and internet fallback text builders out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/runtime/runtime-composer-fallback-text");
    expect(routeSource).not.toMatch(/const\s+buildHelixScholarlyResearchFallbackText\s*=\s*\(args/);
    expect(routeSource).not.toMatch(/const\s+buildHelixInternetSearchFallbackText\s*=\s*\(args/);
    expect(routeSource).toMatch(/export\s+const\s+__testHelixScholarlyFinalFallback\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixScholarlyResearchFallbackText\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixInternetSearchFallbackText\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });
});
