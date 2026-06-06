import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryPhysicsInventoryAuditReport } from "../theory-physics-inventory-audit";

const FIXTURE_FILE_PATHS = [
  "docs/knowledge/physics/tidal-bulge-response.md",
  "docs/knowledge/physics/tidal-quality-factor.md",
  "docs/architecture/granular-tidal-sunquake-bridge-plan.md",
  "docs/knowledge/solar-restoration.md",
  "docs/knowledge/red-giant-phase.md",
  "docs/knowledge/stellar-restoration-tree.json",
  "docs/knowledge/star-hydrostatic.md",
  "docs/audits/research/stellar-structure-nucleosynthesis-source-check-2026-03-25.md",
  "docs/research/starsim-fusion-benchmark-stage2-candidate.md",
  "docs/knowledge/physics/nanoflare-heating.md",
  "docs/knowledge/physics/flare-sunquake-timing-correlation.md",
  "data/starsim/solar-reference-pack.v1.json",
  "docs/knowledge/dp-collapse-tree.json",
  "docs/architecture/orch-or-time-crystal-research-packet.md",
];

describe("theory physics inventory audit", () => {
  it("finds repo-present physics domains that are not yet fully represented in the theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const report = buildTheoryPhysicsInventoryAuditReport({
      graph,
      filePaths: FIXTURE_FILE_PATHS,
      generatedAt: "2026-06-02T00:00:00.000Z",
    });
    const byId = new Map(report.domains.map((domain) => [domain.id, domain]));

    expect(byId.get("granular_tidal_love_number")?.status).toBe("represented");
    expect(byId.get("granular_tidal_love_number")?.missingBadgePrefixes).toEqual([]);
    expect(byId.get("granular_tidal_love_number")?.sampleRepoPaths).toContain(
      "docs/knowledge/physics/tidal-bulge-response.md",
    );
    expect(byId.get("solar_restoration_red_giant")?.status).toBe("represented");
    expect(byId.get("solar_reference_pack")?.status).toBe("represented");
    expect(byId.get("solar_flare_sunquake_nanoflare")?.status).toBe("represented");
    expect(byId.get("stellar_structure_nucleosynthesis")?.status).toBe("represented");
    expect(byId.get("dp_objective_collapse")?.status).toBe("represented");
    expect(byId.get("orch_or_microtubule_time_crystal")?.status).toBe("represented");
  });

  it("preserves claim boundary notes for recommended patch planning", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const report = buildTheoryPhysicsInventoryAuditReport({ graph, filePaths: FIXTURE_FILE_PATHS });
    const tidal = report.domains.find((domain) => domain.id === "granular_tidal_love_number");
    const solarRestoration = report.domains.find((domain) => domain.id === "solar_restoration_red_giant");

    expect(tidal?.claimBoundaryNote).toMatch(/material-response diagnostics/i);
    expect(tidal?.recommendedNextPatch).toMatch(/Love-number/i);
    expect(solarRestoration?.claimBoundaryNote).toMatch(/cannot imply feasible stellar intervention/i);
  });

  it("does not count vendored external paths as repo-owned physics inventory", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const report = buildTheoryPhysicsInventoryAuditReport({
      graph,
      filePaths: [
        "external/sunpy/sunpy/physics/nanoflare.py",
        "external/audiocraft/audiocraft/solvers/magnet.py",
      ],
    });

    expect(report.scannedRepoPathCount).toBe(0);
    expect(report.summary.notDetectedCount).toBe(report.domains.length);
  });
});
