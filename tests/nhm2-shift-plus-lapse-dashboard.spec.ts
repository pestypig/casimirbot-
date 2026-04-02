import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildShiftPlusLapseDashboardPayload } from "../scripts/warp-shift-plus-lapse-dashboard";

const findPanel = (payload: any, panelId: string) =>
  payload.panels?.find((panel: any) => panel.panelId === panelId);

const findRow = (panel: any, rowId: string) =>
  panel?.rows?.find((row: any) => row.rowId === rowId);

describe("nhm2 shift-plus-lapse dashboard companion", () => {
  let payload: any;

  beforeAll(async () => {
    payload = await buildShiftPlusLapseDashboardPayload();
  }, 30000);

  it("builds all required dashboard panel groups", () => {
    expect(payload).toEqual(
      expect.objectContaining({
        artifactId: "nhm2_shift_plus_lapse_dashboard",
        dashboardId: "nhm2_unit_lapse_vs_mild_shift_plus_lapse_dashboard",
        dashboardStatus: "available",
        comparisonId: "nhm2_unit_lapse_vs_mild_shift_plus_lapse",
      }),
    );
    expect(payload.recommendedReadingOrder).toEqual([
      "proof_status_panel",
      "cabin_gravity_panel",
      "wall_safety_panel",
      "precision_panel",
    ]);
    expect(findPanel(payload, "proof_status_panel")).toBeTruthy();
    expect(findPanel(payload, "cabin_gravity_panel")).toBeTruthy();
    expect(findPanel(payload, "wall_safety_panel")).toBeTruthy();
    expect(findPanel(payload, "precision_panel")).toBeTruthy();
    expect(payload.renderedCardReadingOrder).toEqual([
      "dashboard_overview",
      "proof_status",
      "cabin_gravity",
      "wall_safety",
      "precision_provenance",
    ]);
  });

  it("keeps every visible metric row units-and-badge explicit", () => {
    const cabinPanel = findPanel(payload, "cabin_gravity_panel");
    const wallPanel = findPanel(payload, "wall_safety_panel");
    const rows = [...(cabinPanel?.rows ?? []), ...(wallPanel?.rows ?? [])];

    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const row of rows) {
      expect(row).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          units: expect.any(String),
          badgeId: expect.any(String),
          badgeIds: expect.any(Array),
          baselineSourceKind: expect.any(String),
          generalizedSourceKind: expect.any(String),
        }),
      );
    }

    expect(findRow(cabinPanel, "alphaGradientVec_m_inv")).toEqual(
      expect.objectContaining({
        units: "1/m",
        badgeId: "mixed_source",
        crossCaseSourceMismatch: true,
      }),
    );
    expect(findRow(wallPanel, "betaOutwardOverAlphaWallMax")).toEqual(
      expect.objectContaining({
        units: "dimensionless",
        badgeId: "wall_safety_brick_derived",
        crossCaseSourceMismatch: false,
      }),
    );
  });

  it("keeps proof status explicit and separate from cabin and wall diagnostics", () => {
    const proofPanel = findPanel(payload, "proof_status_panel");
    const cabinPanel = findPanel(payload, "cabin_gravity_panel");
    const wallPanel = findPanel(payload, "wall_safety_panel");
    const proofSurfaceRow = findRow(proofPanel, "authoritative_proof_surface");
    const branchStatusRow = findRow(proofPanel, "branch_status");

    expect(proofPanel.sectionNote).toContain("Lane A remains authoritative");
    expect(proofSurfaceRow).toEqual(
      expect.objectContaining({
        badgeId: "lane_a_unchanged",
        generalizedValue: "lane_a_eulerian_comoving_theta_minus_trk",
      }),
    );
    expect(branchStatusRow).toEqual(
      expect.objectContaining({
        badgeId: "reference_only",
        generalizedValue: "reference_only_mild_shift_plus_lapse",
      }),
    );
    expect(cabinPanel.sectionNote).toContain("local lapse diagnostics");
    expect(wallPanel.sectionNote).toContain("brick-derived");
  });

  it("carries provenance warnings and comparison semantics through unchanged", () => {
    const precisionPanel = findPanel(payload, "precision_panel");
    const mismatchRow = findRow(precisionPanel, "crossCaseSourceMismatchCount");
    const parityRow = findRow(precisionPanel, "wallSafetySourceParity");

    expect(payload.provenanceWarnings).toHaveLength(5);
    expect(payload.comparisonSemantics).toEqual(
      expect.objectContaining({
        crossCaseSourceMismatchCount: 5,
        wallSafetySourceParity: true,
        cabinGravityUsesAnalyticCompanion: true,
      }),
    );
    expect(mismatchRow).toEqual(
      expect.objectContaining({
        generalizedValue: 5,
        badgeId: "source_mismatch",
      }),
    );
    expect(parityRow).toEqual(
      expect.objectContaining({
        badgeId: "wall_safety_brick_derived",
        generalizedValue: "brick_float32_direct",
      }),
    );
  });

  it("emits a rendered card family with the overview card as primary", () => {
    const artifactPath = path.join(
      process.cwd(),
      "artifacts",
      "research",
      "full-solve",
      "nhm2-shift-plus-lapse-dashboard-latest.json",
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const proofPanel = findPanel(artifact, "proof_status_panel");
    const precisionPanel = findPanel(artifact, "precision_panel");

    expect(artifact.dashboardStatus).toBe("available");
    expect(artifact.dashboardLayoutVersion).toBe("v2_measured_card_family");
    expect(artifact.renderedCardFamilyStatus).toBe("generated");
    expect(artifact.primaryRenderedCardId).toBe("dashboard_overview");
    expect(artifact.renderedCardStatus).toBe("generated_primary_overview");
    expect(artifact.renderedCardPath).toBe(
      "artifacts/research/full-solve/rendered/comparison_panel/2026-04-01/nhm2_shift_lapse-comparison_panel-dashboard_overview-card.png",
    );
    expect(artifact.renderedCardHash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact.renderedCardCategory).toBe("comparison_panel");
    expect(artifact.renderedCardRole).toBe("presentation");
    expect(artifact.renderedCardLayoutVersion).toBe("v2_measured_card_family");
    expect(artifact.layoutBudget).toEqual(
      expect.objectContaining({
        dynamicCardHeight: true,
        measuredTextRenderer: "@napi-rs/canvas.measureText",
      }),
    );
    expect(artifact.badgeLegend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ badgeId: "lane_a_unchanged" }),
        expect.objectContaining({ badgeId: "reference_only" }),
        expect.objectContaining({ badgeId: "raw_brick" }),
        expect.objectContaining({ badgeId: "analytic_companion" }),
        expect.objectContaining({ badgeId: "mixed_source" }),
        expect.objectContaining({ badgeId: "source_mismatch" }),
        expect.objectContaining({ badgeId: "wall_safety_brick_derived" }),
        expect.objectContaining({ badgeId: "unresolved" }),
      ]),
    );
    expect(findRow(proofPanel, "branch_status")).toEqual(
      expect.objectContaining({
        badgeId: "reference_only",
      }),
    );
    expect(
      findRow(precisionPanel, "baselineDirectPipelineNestedProvenance"),
    ).toEqual(
      expect.objectContaining({
        baselineValue: "unresolved_gravity_gradient",
        badgeId: "unresolved",
      }),
    );
    expect(artifact.renderedCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cardId: "dashboard_overview",
          sectionSource: "dashboard_summary",
          primary: true,
        }),
        expect.objectContaining({
          cardId: "proof_status",
          sectionSource: "proof_status_panel",
          primary: false,
        }),
        expect.objectContaining({
          cardId: "cabin_gravity",
          sectionSource: "cabin_gravity_panel",
          primary: false,
        }),
        expect.objectContaining({
          cardId: "wall_safety",
          sectionSource: "wall_safety_panel",
          primary: false,
        }),
        expect.objectContaining({
          cardId: "precision_provenance",
          sectionSource: "precision_panel",
          primary: false,
        }),
      ]),
    );
    for (const card of artifact.renderedCards) {
      expect(card.hash).toMatch(/^[a-f0-9]{64}$/);
      const cardPath = path.join(process.cwd(), card.path);
      expect(fs.existsSync(cardPath)).toBe(true);
      expect(fs.statSync(cardPath).size).toBeGreaterThan(0);
    }
    expect(artifact.legacyMonolithicCardStatus).toBe("deprecated_not_generated");
    const legacyCardPath = path.join(process.cwd(), artifact.legacyMonolithicCardPath);
    expect(fs.existsSync(legacyCardPath)).toBe(false);
  });

  it("publishes the rendered card family into render taxonomy as comparison_panel entries without transport inheritance", () => {
    const taxonomyPath = path.join(
      process.cwd(),
      "artifacts",
      "research",
      "full-solve",
      "render-taxonomy-latest.json",
    );
    const taxonomyArtifact = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
    const entries = taxonomyArtifact.renderEntries.filter((render: any) =>
      `${render.renderId}`.startsWith(
        "nhm2_shift_lapse:comparison_panel:diagnostics_dashboard:",
      ),
    );
    expect(entries.map((entry: any) => entry.variant).sort()).toEqual([
      "cabin_gravity",
      "dashboard_overview",
      "precision_provenance",
      "proof_status",
      "wall_safety",
    ]);
    expect(entries).toHaveLength(5);
    for (const entry of entries) {
      expect(entry).toEqual(
        expect.objectContaining({
          renderCategory: "comparison_panel",
          renderRole: "presentation",
          fieldId: "diagnostics_dashboard",
          baseImagePolicy: "diagnostic_card_canvas",
          baseImageSource: "none",
          inheritsTransportContext: false,
          contextCompositionMode: "none",
        }),
      );
    }
    expect(
      taxonomyArtifact.fieldFamilies.find(
        (family: any) => family.fieldId === "diagnostics_dashboard",
      ),
    ).toEqual(
      expect.objectContaining({
        defaultCategory: "comparison_panel",
        defaultRole: "presentation",
      }),
    );
  });
});
