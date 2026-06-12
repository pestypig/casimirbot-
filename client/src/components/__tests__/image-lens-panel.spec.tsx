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
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/agi/situation/visual-frame/latest")) {
      return new Response(JSON.stringify({
        ok: true,
        active_source: {
          source_id: "visual_source:active",
          environment_id: "environment:active",
          pipeline_id: "pipeline:active",
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/api/agi/situation/visual-source/start")) {
      return new Response(JSON.stringify({
        ok: true,
        source: {
          source_id: "visual_source:image_lens_manual",
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/api/agi/situation/visual-frame/analyze")) {
      const body = JSON.parse(String(init?.body ?? "{}"));
      return new Response(JSON.stringify({
        ok: true,
        evidence: {
          frame_id: "visual_frame:crop",
          evidence_id: "visual_evidence:crop",
          summary: "Analyzed crop frame summary.",
          visual_observer_profile_id: "visual_observer:active",
          visual_observer_profile_title: "Active shade",
          visual_prompt_hash: "prompt:active",
          source_id: body.source_id,
        },
        live_source_chunk: {
          chunk_id: "live_chunk:crop",
        },
        live_source_analysis_jobs: [
          { job_id: "analysis_job:crop" },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false, error: "unexpected_url" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe("ImageLensPanel", () => {
  it("starts as a top image workspace with a central add affordance", () => {
    render(<ImageLensPanel />);

    expect(screen.getByText("Image Lens")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose image file" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open live answer/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("LaTeX candidate")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("x")).not.toBeInTheDocument();
  });

  it("shows the Live Answer shortcut only after a crop frame is sent", async () => {
    const events: Array<CustomEvent> = [];
    const handler = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener("open-helix-panel", handler);
    try {
      render(<ImageLensPanel />);
      expect(screen.queryByRole("button", { name: /open live answer/i })).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Image URL"), { target: { value: TEST_IMAGE_URL } });
      fireEvent.click(screen.getByRole("button", { name: /load url/i }));
      const image = await screen.findByAltText("Image source");
      Object.defineProperty(image, "naturalWidth", { value: 200, configurable: true });
      Object.defineProperty(image, "naturalHeight", { value: 100, configurable: true });
      fireEvent.load(image);
      fireEvent.click(screen.getByRole("button", { name: /send crop frame/i }));

      await waitFor(() => expect(screen.getByRole("button", { name: /open live answer/i })).toBeInTheDocument());
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
      expect(screen.getByText(/Claim boundary: visual crop observation only; not answer authority\./i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /confirm candidate/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Analyzed crop frame summary/i)).toBeInTheDocument();
      expect(useDocumentImageRegionStore.getState().receipts).toHaveLength(1);
      const receipt = useDocumentImageRegionStore.getState().receipts[0];
      expect(receipt?.crop.bboxPx).toEqual({ x: 10, y: 10, width: 50, height: 40 });
      expect(receipt?.extraction.latexCandidate).toBeUndefined();
      const producer = useVisualSourceCaptureStore.getState().producers["visual_source:active"];
      expect(producer).toBeTruthy();
      expect(producer?.frame_history).toHaveLength(1);
      expect(producer?.frame_history?.[0]?.summary).toBe("Analyzed crop frame summary.");
      expect(producer?.frame_history?.[0]?.evidence_id).toBe("visual_evidence:crop");
      expect(liveEvents[0]?.detail.entry.tool).toBe("image-lens.visual_frame");
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
    expect(text).toMatch(/observation only \/ not answer authority/i);
    expect(text).not.toMatch(/\bvalidated\b/i);
    expect(text).not.toMatch(/\bviable\b/i);
    expect(text).not.toMatch(/\bcertified\b/i);
    expect(text).not.toMatch(/\bproves\b/i);
  });
});
