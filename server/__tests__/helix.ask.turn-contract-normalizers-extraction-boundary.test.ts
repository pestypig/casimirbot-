import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  normalizeHelixAskTurnContractFamily,
  normalizeHelixAskTurnContractGroundingMode,
  selectHelixAskTurnContractGroundingMode,
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
    expect(routeSource).toContain("selectHelixAskTurnContractGroundingMode({");
    expect(routeSource).not.toContain("const defaultGroundingMode: HelixAskTurnContractGroundingMode =");
    expect(routeSource).not.toContain("? normalizeHelixAskTurnContractFamily(args.plannerPass.output_family)");
    expect(routeSource).not.toContain("? normalizeHelixAskTurnContractGroundingMode(args.plannerPass.grounding_mode)");
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractFamily\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeHelixAskTurnContractGroundingMode\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractPlannerFamily\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractRequestedGroundingMode\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractGroundingMode\s*=/);
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

  it("preserves final grounding-mode precedence", () => {
    expect(
      selectHelixAskTurnContractGroundingMode({
        requiresRepoEvidence: true,
        intentDomain: "general",
        requestedGroundingMode: "open",
      }),
    ).toBe("repo");
    expect(
      selectHelixAskTurnContractGroundingMode({
        requiresRepoEvidence: false,
        intentDomain: "repo",
        requestedGroundingMode: "hybrid",
      }),
    ).toBe("repo");
    expect(
      selectHelixAskTurnContractGroundingMode({
        requiresRepoEvidence: false,
        intentDomain: "hybrid",
        requestedGroundingMode: null,
      }),
    ).toBe("hybrid");
    expect(
      selectHelixAskTurnContractGroundingMode({
        requiresRepoEvidence: false,
        intentDomain: "general",
        requestedGroundingMode: "repo",
      }),
    ).toBe("repo");
    expect(
      selectHelixAskTurnContractGroundingMode({
        requiresRepoEvidence: false,
        intentDomain: "falsifiable",
        requestedGroundingMode: null,
      }),
    ).toBe("open");
  });
});
