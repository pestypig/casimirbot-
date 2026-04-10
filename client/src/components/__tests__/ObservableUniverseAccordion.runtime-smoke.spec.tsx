// @vitest-environment jsdom
import React from "react";
import express from "express";
import request from "supertest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_PANELS } from "@/pages/helix-core.panels";
import {
  getObservableUniverseAccordionDefaultActiveEtaCatalogEntry,
  getObservableUniverseAccordionVisibleNearbyCatalog,
} from "@shared/observable-universe-accordion-catalog.v1";
import { helixRelativisticMapRouter } from "../../../../server/routes/helix/relativistic-map";

const buildRuntimeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/relativistic-map", helixRelativisticMapRouter);
  return app;
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

describe("observable universe accordion runtime smoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mounts from the Helix panel registry and renders the mixed nearby catalog through the live route", async () => {
    const app = buildRuntimeApp();
    const visibleCatalog = getObservableUniverseAccordionVisibleNearbyCatalog();
    const defaultActiveEntry =
      getObservableUniverseAccordionDefaultActiveEtaCatalogEntry();
    const panelRef = HELIX_PANELS.find(
      (panel) => panel.id === "observable-universe-accordion",
    );
    expect(panelRef).toBeDefined();

    const fetchBridge = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : new URL(input.url, "http://codex.local").pathname;

      expect(url).toBe("/api/helix/relativistic-map/project");
      expect(init?.method).toBe("POST");

      const payload =
        typeof init?.body === "string" && init.body.length > 0
          ? JSON.parse(init.body)
          : {};

      const response = await request(app)
        .post(url)
        .set("Content-Type", "application/json")
        .send(payload);

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.body,
      } as Response;
    });

    vi.stubGlobal("fetch", fetchBridge);

    const loadedPanel = await panelRef!.loader();
    const ObservableUniverseAccordionConnectedPanel = loadedPanel.default;

    renderWithQueryClient(<ObservableUniverseAccordionConnectedPanel />);

    expect(
      await screen.findByTestId("observable-universe-accordion-map"),
    ).toBeDefined();
    const catalogRows = await screen.findAllByTestId(
      /observable-universe-accordion-catalog-row-/,
    );
    expect(catalogRows).toHaveLength(visibleCatalog.length);
    visibleCatalog.forEach((entry, index) => {
      expect(catalogRows[index]).toHaveTextContent(entry.label);
    });
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-alpha-cen-a"),
    ).toHaveTextContent("contract-backed ETA");
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-proxima"),
    ).toHaveTextContent("render-only");
    expect(
      screen.getByTestId("observable-universe-accordion-support-badge-barnard"),
    ).toHaveTextContent("render-only");
    expect(screen.getByTestId("observable-universe-accordion-active-target")).toHaveTextContent(
      defaultActiveEntry?.label ?? "Alpha Centauri A",
    );
    expect(
      screen.queryByTestId("observable-universe-accordion-active-target-selector"),
    ).toBeNull();

    fireEvent.click(
      screen.getByTestId("observable-universe-accordion-map-entry-barnard"),
    );

    const details = await screen.findByTestId(
      "observable-universe-accordion-entry-details",
    );
    expect(within(details).getByText("Barnard's Star")).toBeDefined();
    expect(
      within(details).getAllByText(/no explicit NHM2 accordion trip-estimate artifact/i).length,
    ).toBeGreaterThan(0);
    expect(within(details).queryByText("ETA years")).toBeNull();
    expect(within(details).queryByText("Driving profile")).toBeNull();
    expect(fetchBridge).toHaveBeenCalled();
  });
});
