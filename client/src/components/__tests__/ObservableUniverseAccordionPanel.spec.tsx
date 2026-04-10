// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ObservableUniverseAccordionConnectedPanel, {
  ObservableUniverseAccordionPanel,
} from "../ObservableUniverseAccordionPanel";
import { buildObservableUniverseAccordionEtaProjection } from "@shared/observable-universe-accordion-projections";
import { OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY } from "@shared/observable-universe-accordion-projections-constants";
import { buildObservableUniverseAccordionEtaSurface } from "@shared/observable-universe-accordion-surfaces";

const readJson = (relativePath: string): unknown =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8"));

const buildSurface = () => {
  const projection = buildObservableUniverseAccordionEtaProjection({
    boundaryArtifact: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceBoundaryArtifactPath,
    ),
    defaultMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceDefaultMissionTimeComparisonArtifactPath,
    ),
    supportedFloorMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceSupportedFloorMissionTimeComparisonArtifactPath,
    ),
    supportedBandCeilingReferenceMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceSupportedBandCeilingReferenceArtifactPath,
    ),
    evidenceFloorMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
    ),
  });
  if (!projection) throw new Error("expected observable universe ETA projection");
  return buildObservableUniverseAccordionEtaSurface({
    contract: projection,
    catalog: [
      { id: "alpha-cen-a", label: "Alpha Centauri A", position_m: [1, 0, 0] },
      { id: "proxima", label: "Proxima Centauri", position_m: [0, 1, 0] },
      { id: "barnard", label: "Barnard's Star", position_m: [0, 0, 1] },
    ],
    estimateKind: "proper_time",
  });
};

const buildSurfaceWithMultipleContractBackedEntries = () => {
  const surface = buildSurface();
  if (surface.status !== "computed") {
    throw new Error("expected computed surface");
  }

  const primaryEntry = surface.entries.find(
    (entry): entry is Extract<(typeof surface.entries)[number], { etaSupport: "contract_backed" }> =>
      entry.etaSupport === "contract_backed",
  );
  const renderOnlyEntry = surface.entries.find(
    (entry): entry is Extract<(typeof surface.entries)[number], { etaSupport: "render_only" }> =>
      entry.id === "proxima" && entry.etaSupport === "render_only",
  );

  if (!primaryEntry || !renderOnlyEntry) {
    throw new Error("expected contract-backed and render-only entries");
  }

  return {
    ...surface,
    entries: [
      primaryEntry,
      {
        ...renderOnlyEntry,
        etaSupport: "contract_backed" as const,
        etaSupportReason: "explicit_contract_target" as const,
        outputPosition_m: [0, primaryEntry.mappedRadius_m, 0] as [number, number, number],
        mappedRadius_m: primaryEntry.mappedRadius_m,
        estimateKind: "proper_time" as const,
        estimateSeconds: primaryEntry.estimateSeconds + 86_400,
        estimateYears: primaryEntry.estimateYears + 0.1,
        drivingProfileId: primaryEntry.drivingProfileId,
        drivingCenterlineAlpha: primaryEntry.drivingCenterlineAlpha,
        withinSupportedBand: true,
        sourceArtifactPath: primaryEntry.sourceArtifactPath,
        renderOnlyReason: null,
      },
    ],
  };
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ObservableUniverseAccordionPanel", () => {
  it("shows the mixed catalog and lets the user inspect a render-only star without fabricated ETA fields", () => {
    render(<ObservableUniverseAccordionPanel surface={buildSurface()} />);

    expect(
      screen.getAllByText("stage1_centerline_alpha_0p8200_v1").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("stage1_centerline_alpha_0p8000_v1").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("stage1_centerline_alpha_0p7700_v1").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("0.03")).toBeDefined();
    expect(screen.getByText("manually_reviewed_static_band")).toBeDefined();
    expect(screen.getByTestId("observable-universe-accordion-map")).toBeDefined();
    expect(screen.getByTestId("observable-universe-accordion-active-target")).toHaveTextContent(
      "Alpha Centauri A",
    );
    expect(
      screen.queryByTestId("observable-universe-accordion-active-target-selector"),
    ).toBeNull();
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-alpha-cen-a"),
    ).toHaveTextContent("contract-backed ETA");
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-proxima"),
    ).toHaveTextContent("render-only");
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-barnard"),
    ).toHaveTextContent("render-only");

    const details = screen.getByTestId("observable-universe-accordion-entry-details");
    expect(within(details).getByText("Alpha Centauri A")).toBeDefined();
    expect(within(details).getByText("ETA years")).toBeDefined();
    expect(within(details).getByText("Driving profile")).toBeDefined();
    expect(within(details).getByText("Support policy")).toBeDefined();
    expect(
      within(details).getByText("artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json"),
    ).toBeDefined();

    fireEvent.click(
      screen.getByTestId("observable-universe-accordion-catalog-row-proxima"),
    );

    expect(within(details).getByText("Proxima Centauri")).toBeDefined();
    expect(
      within(details).getAllByText(/does not register an explicit NHM2 trip-estimate artifact/i)
        .length,
    ).toBeGreaterThan(0);
    expect(within(details).queryByText("ETA years")).toBeNull();
    expect(within(details).queryByText("Driving profile")).toBeNull();
    expect(
      within(details).getByText("canonical-only marker; no ETA remap applied"),
    ).toBeDefined();
  });

  it("shows fail-closed deferred state when contract data is missing", () => {
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: null,
      catalog: [{ id: "alpha-cen-a", position_m: [1, 0, 0] }],
      estimateKind: "proper_time",
    });
    render(<ObservableUniverseAccordionPanel surface={surface} />);

    expect(screen.getByText(/fail-closed \/ deferred/i)).toBeDefined();
    expect(
      screen.getByText(/stays fail-closed instead of substituting SR output/i),
    ).toBeDefined();
  });

  it("keeps the active target read-only when extra contract-backed entries are not eta-selectable in the shared catalog", () => {
    render(
      <ObservableUniverseAccordionPanel
        surface={buildSurfaceWithMultipleContractBackedEntries()}
      />,
    );

    expect(
      screen.queryByTestId("observable-universe-accordion-active-target-selector"),
    ).toBeNull();
    expect(screen.getByTestId("observable-universe-accordion-active-target")).toHaveTextContent(
      "Alpha Centauri A",
    );
  });

  it("loads the accordion surface from the real route path in the connected panel", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        projection: buildSurface(),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithQueryClient(<ObservableUniverseAccordionConnectedPanel />);

    expect(
      await screen.findByTestId("observable-universe-accordion-entry-details"),
    ).toBeDefined();
    expect(
      screen.getByTestId("observable-universe-accordion-active-target"),
    ).toHaveTextContent("Alpha Centauri A");
    expect(
      screen.queryByTestId("observable-universe-accordion-active-target-selector"),
    ).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/helix/relativistic-map/project",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("nearby_local_rest_small"),
      }),
    );
  });
});
