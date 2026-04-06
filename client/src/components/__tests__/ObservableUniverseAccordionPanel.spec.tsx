// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ObservableUniverseAccordionPanel from "@/components/ObservableUniverseAccordionPanel";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("ObservableUniverseAccordionPanel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a visible deferred state for nhm2 accessibility without a certified catalog ETA contract", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body ?? "{}")) as {
        accordionMode?: string;
      };
      if (requestBody.accordionMode === "nhm2_accessibility") {
        return jsonResponse({
          ok: false,
          projection: {
            status: "unavailable",
            accordionMode: "nhm2_accessibility",
            provenance_class: "deferred",
            contract_badge: "deferred",
            reason:
              "NHM2 accordion access remains deferred because no certified catalog ETA projection contract is available.",
            metadata: {
              missionTimeEstimatorReady: true,
              missionTimeComparisonReady: false,
            },
          },
        });
      }

      return jsonResponse({
        ok: true,
        projection: {
          status: "computed",
          accordionMode: requestBody.accordionMode ?? "raw_distance",
          provenance_class:
            requestBody.accordionMode === "sr_accessibility" ? "proxy" : "inferred",
          contract_badge:
            requestBody.accordionMode === "sr_accessibility"
              ? "accordion_sr_accessibility/v1"
              : "accordion_raw_distance/v1",
          entries: [],
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<ObservableUniverseAccordionPanel />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "nhm2_accessibility" }));

    await waitFor(() => {
      expect(screen.getByTestId("accordion-deferred-copy")).toHaveTextContent(
        /certified catalog eta projection contract/i,
      );
    });

    expect(screen.getByText(/warp_catalog_eta_projection\/v1/i)).toBeInTheDocument();

    const requestedModes = fetchMock.mock.calls.map((call) => {
      const init = call[1] as RequestInit | undefined;
      const requestBody = JSON.parse(String(init?.body ?? "{}")) as {
        accordionMode?: string;
      };
      return requestBody.accordionMode;
    });
    expect(requestedModes).toContain("raw_distance");
    expect(requestedModes).toContain("nhm2_accessibility");
  });
});
