// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImageLensPanel from "@/components/workstation/ImageLensPanel";
import { HELIX_ASK_LIVE_EVENT_BUS_EVENT } from "@/lib/helix/liveEventsBus";
import { useDocumentImageRegionStore } from "@/store/useDocumentImageRegionStore";
import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";

const initialRegionState = useDocumentImageRegionStore.getState();
const initialVisualState = useVisualSourceCaptureStore.getState();
const TEST_IMAGE_URL = "data:image/png;base64,iVBORw0KGgo=";

beforeEach(() => {
  useDocumentImageRegionStore.setState(initialRegionState, true);
  useVisualSourceCaptureStore.setState(initialVisualState, true);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("ImageLensPanel", () => {
  it("starts as a top image workspace with a central add affordance", () => {
    render(<ImageLensPanel />);

    expect(screen.getByText("Image Lens")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose image file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open live answer/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("LaTeX candidate")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("x")).not.toBeInTheDocument();
  });

  it("points users to the Live Answer panel instead of duplicating shade UI", () => {
    const events: Array<CustomEvent> = [];
    const handler = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener("open-helix-panel", handler);
    try {
      render(<ImageLensPanel />);
      fireEvent.click(screen.getByRole("button", { name: /open live answer/i }));
      expect(events[0]?.detail).toEqual({ id: "live-answer-environment" });
    } finally {
      window.removeEventListener("open-helix-panel", handler);
    }
  });

  it("sends a crop frame to Live Answer visual source receipts", async () => {
    const liveEvents: Array<CustomEvent> = [];
    const handler = (event: Event) => liveEvents.push(event as CustomEvent);
    window.addEventListener(HELIX_ASK_LIVE_EVENT_BUS_EVENT, handler);
    try {
      render(<ImageLensPanel />);

      fireEvent.change(screen.getByLabelText("Image URL"), { target: { value: TEST_IMAGE_URL } });
      fireEvent.click(screen.getByRole("button", { name: /load url/i }));

      const image = await screen.findByAltText("Image source");
      Object.defineProperty(image, "naturalWidth", { value: 200, configurable: true });
      Object.defineProperty(image, "naturalHeight", { value: 100, configurable: true });
      Object.defineProperty(image, "getBoundingClientRect", {
        value: () => ({ left: 10, top: 20, width: 200, height: 100, right: 210, bottom: 120 }),
        configurable: true,
      });
      fireEvent.load(image);

      fireEvent.click(screen.getByRole("button", { name: /advanced/i }));
      fireEvent.change(await screen.findByLabelText("x"), { target: { value: "10" } });
      fireEvent.change(screen.getByLabelText("y"), { target: { value: "10" } });
      fireEvent.change(screen.getByLabelText("width"), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText("height"), { target: { value: "40" } });
      fireEvent.click(screen.getByRole("button", { name: /send crop frame/i }));

      await waitFor(() => expect(screen.getByText(/Crop frame sent to Live Answer visual source/i)).toBeInTheDocument());
      expect(screen.getByText(/Claim boundary: visual crop candidate only; not proof authority\./i)).toBeInTheDocument();
      expect(useDocumentImageRegionStore.getState().receipts).toHaveLength(1);
      const receipt = useDocumentImageRegionStore.getState().receipts[0];
      expect(receipt?.crop.bboxPx).toEqual({ x: 10, y: 10, width: 50, height: 40 });
      expect(receipt?.extraction.latexCandidate).toBeUndefined();
      expect(useVisualSourceCaptureStore.getState().producers[receipt!.visualSource.sourceId]).toBeTruthy();
      expect(liveEvents[0]?.detail.entry.tool).toBe("image-lens.region_receipt");
      expect(liveEvents[0]?.detail.entry.meta.terminal_eligible).toBe(false);
    } finally {
      window.removeEventListener(HELIX_ASK_LIVE_EVENT_BUS_EVENT, handler);
    }
  });

  it("keeps backend coordinate controls in the advanced drawer", async () => {
    render(<ImageLensPanel />);

    fireEvent.click(screen.getByRole("button", { name: /advanced/i }));

    expect(await screen.findByTestId("image-lens-advanced")).toBeInTheDocument();
    expect(screen.getByLabelText("x")).toBeInTheDocument();
    expect(screen.getByLabelText("Source kind")).toBeInTheDocument();
    expect(screen.queryByLabelText("LaTeX candidate")).not.toBeInTheDocument();
  });

  it("keeps UI copy inside the candidate and claim-boundary lane", () => {
    render(<ImageLensPanel />);

    const text = document.body.textContent ?? "";
    expect(text).toMatch(/candidate only \/ not proof authority/i);
    expect(text).not.toMatch(/\bvalidated\b/i);
    expect(text).not.toMatch(/\bviable\b/i);
    expect(text).not.toMatch(/\bcertified\b/i);
    expect(text).not.toMatch(/\bproves\b/i);
  });
});
