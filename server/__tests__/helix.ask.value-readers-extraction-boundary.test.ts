import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { readAskTurnString } from "../services/helix-ask/value-readers";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/value-readers.ts");

describe("Helix Ask value readers extraction boundary", () => {
  it("keeps the primitive string reader out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/value-readers");
    expect(routeSource).not.toMatch(/const\s+readAskTurnString\s*=\s*\(value/);
    expect(serviceSource).toMatch(/export\s+const\s+readAskTurnString\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves string trim/null behavior", () => {
    expect(readAskTurnString(" value ")).toBe("value");
    expect(readAskTurnString("   ")).toBeNull();
    expect(readAskTurnString(42)).toBeNull();
    expect(readAskTurnString(null)).toBeNull();
  });
});
