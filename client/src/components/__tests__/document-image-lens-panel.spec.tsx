// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentImageLensPanel from "@/components/workstation/DocumentImageLensPanel";
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

describe("DocumentImageLensPanel", () => {
  it("creates a candidate receipt and publishes it as a visual source frame", async () => {
    const liveEvents: Array<CustomEvent> = [];
    const handler = (event: Event) => liveEvents.push(event as CustomEvent);
    window.addEventListener(HELIX_ASK_LIVE_EVENT_BUS_EVENT, handler);
    try {
      render(<DocumentImageLensPanel />);

      fireEvent.change(screen.getByLabelText("Image URL"), { target: { value: TEST_IMAGE_URL } });
      fireEvent.click(screen.getByRole("button", { name: /load url/i }));

      const image = await screen.findByAltText("Document source");
      Object.defineProperty(image, "naturalWidth", { value: 200, configurable: true });
      Object.defineProperty(image, "naturalHeight", { value: 100, configurable: true });
      fireEvent.load(image);

      fireEvent.change(screen.getByLabelText("x"), { target: { value: "5" } });
      fireEvent.change(screen.getByLabelText("y"), { target: { value: "6" } });
      fireEvent.change(screen.getByLabelText("width"), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText("height"), { target: { value: "40" } });
      fireEvent.change(screen.getByLabelText("LaTeX candidate"), { target: { value: "T_{00}=\\rho" } });
      fireEvent.click(screen.getByRole("button", { name: /create candidate receipt/i }));

      await waitFor(() => expect(screen.getByText(/candidate receipt created/i)).toBeInTheDocument());
      expect(screen.getByText(/Claim boundary: OCR candidate only; not proof authority\./i)).toBeInTheDocument();
      expect(useDocumentImageRegionStore.getState().receipts).toHaveLength(1);
      const receipt = useDocumentImageRegionStore.getState().receipts[0];
      expect(receipt?.crop.bboxPx).toEqual({ x: 5, y: 6, width: 50, height: 40 });
      expect(receipt?.extraction.latexCandidate).toBe("T_{00}=\\rho");
      expect(useVisualSourceCaptureStore.getState().producers[receipt!.visualSource.sourceId]).toBeTruthy();
      expect(liveEvents[0]?.detail.entry.tool).toBe("document-image-lens.region_receipt");
      expect(liveEvents[0]?.detail.entry.meta.terminal_eligible).toBe(false);
    } finally {
      window.removeEventListener(HELIX_ASK_LIVE_EVENT_BUS_EVENT, handler);
    }
  });

  it("keeps UI copy inside the candidate and claim-boundary lane", () => {
    render(<DocumentImageLensPanel />);

    const text = document.body.textContent ?? "";
    expect(text).toMatch(/candidate only \/ not proof authority/i);
    expect(text).not.toMatch(/\bvalidated\b/i);
    expect(text).not.toMatch(/\bviable\b/i);
    expect(text).not.toMatch(/\bcertified\b/i);
    expect(text).not.toMatch(/\bproves\b/i);
  });
});
