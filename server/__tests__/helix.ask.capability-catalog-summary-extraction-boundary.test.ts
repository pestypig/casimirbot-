import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createAskTurnCapabilityHelpSummaryBuilder } from "../services/helix-ask/capability-catalog-summary";

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

  it("explains scholarly candidate selection, parseability checks, and selective Image Lens escalation", () => {
    const buildSummary = createAskTurnCapabilityHelpSummaryBuilder({
      normalizeDocPath: () => null,
      resolveWorkspaceNoteTitle: () => null,
      buildCapabilityCatalogObservation: () => ({
        active_dynamic_tool_count: 4,
        information_reflection: [],
        utility: [],
        explicit_reflection_families: [],
        explicit_utility_families: [],
      }),
      workstationToolAlignmentCapability: "workstation.inspect_tool_alignment",
      liveSyntheticDataReflectionCapability: "live-source.inspect_synthetic_data",
    });

    const summary = buildSummary(
      null,
      "Does your tool for research papers pick parseable papers, or check what is openable and then use Image Lens?",
    );

    expect(summary).toContain("scholarly-research.lookup_papers");
    expect(summary).toContain("scholarly-research.fetch_full_text");
    expect(summary).toContain("does not assume every candidate is parseable");
    expect(summary).toContain("Image Lens");
    expect(summary).toContain("should not become answer evidence");
  });
});
