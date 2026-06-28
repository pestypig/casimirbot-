import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  normalizeHelixAskTurnContractFamily,
  normalizeHelixAskTurnContractGroundingMode,
  selectHelixAskTurnContractPlannerFamily,
  selectHelixAskTurnContractRequestedGroundingMode,
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
    expect(routeSource).toContain("selectHelixAskTurnContractPlannerFamily(args.plannerPass?.output_family)");
    expect(routeSource).toContain("selectHelixAskTurnContractRequestedGroundingMode(");
    expect(routeSource).not.toContain("? normalizeHelixAskTurnContractFamily(args.plannerPass.output_family)");
    expect(routeSource).not.toContain("? normalizeHelixAskTurnContractGroundingMode(args.plannerPass.grounding_mode)");
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractFamily\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractGroundingMode\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractPlannerFamily\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractRequestedGroundingMode\s*=/);
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

  it("preserves planner family and requested grounding selectors", () => {
    expect(selectHelixAskTurnContractPlannerFamily("Recommendation_Decision")).toBe(
      "recommendation_decision",
    );
    expect(selectHelixAskTurnContractPlannerFamily(undefined)).toBeNull();
    expect(selectHelixAskTurnContractPlannerFamily("unknown")).toBeNull();
    expect(selectHelixAskTurnContractRequestedGroundingMode("Repo")).toBe("repo");
    expect(selectHelixAskTurnContractRequestedGroundingMode(undefined)).toBeNull();
    expect(selectHelixAskTurnContractRequestedGroundingMode("local")).toBeNull();
  });
});
