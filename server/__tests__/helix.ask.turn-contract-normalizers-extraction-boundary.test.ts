import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  normalizeHelixAskTurnContractFamily,
  normalizeHelixAskTurnContractGroundingMode,
} from "../services/helix-ask/contracts/turn-contract-normalizers";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/contracts/turn-contract-normalizers.ts");

describe("Helix Ask turn-contract normalizers extraction boundary", () => {
  it("keeps turn-contract normalizers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-normalizers");
    expect(routeSource).not.toMatch(/const\s+normalizeHelixAskTurnContractFamily\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+normalizeHelixAskTurnContractGroundingMode\s*=\s*\(/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractFamily\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractGroundingMode\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves accepted family and grounding mode literals", () => {
    expect(normalizeHelixAskTurnContractFamily(" Mechanism_Process ")).toBe("mechanism_process");
    expect(normalizeHelixAskTurnContractFamily("unknown")).toBeNull();
    expect(normalizeHelixAskTurnContractGroundingMode("HYBRID")).toBe("hybrid");
    expect(normalizeHelixAskTurnContractGroundingMode("local")).toBeNull();
  });
});
