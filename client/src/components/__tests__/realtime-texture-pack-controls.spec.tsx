// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
} from "@shared/helix-account-session";
import {
  buildRealtimeTexturePackSessionState,
  buildRealtimeTexturePackConfig,
  type RealtimeTexturePackProjectionFrameV1,
} from "@shared/realtime-texture-pack";

const mocks = vi.hoisted(() => ({
  policy: null as unknown,
  start: vi.fn(),
  stop: vi.fn(),
  getState: vi.fn(),
  createController: vi.fn(),
}));

vi.mock("@/lib/workstation/accountCapabilityPolicy", () => ({
  HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT: "helix:account-capability-policy",
  readCachedAccountCapabilityPolicy: () => mocks.policy,
  fetchAccountCapabilityPolicy: async () => mocks.policy,
}));

vi.mock("@/lib/helix/realtimeTexturePack", () => ({
  createRealtimeTexturePackPreviewController: (dependencies: {
    onState?: (state: unknown) => void;
    onFrame?: (frame: unknown) => void;
    onConfig?: (config: unknown) => void;
  }) => {
    mocks.createController(dependencies);
    const idle = buildRealtimeTexturePackSessionState({ sessionId: "texture-session:test" });
    mocks.getState.mockReturnValue(idle);
    mocks.start.mockImplementation(async () => {
      dependencies.onConfig?.(buildRealtimeTexturePackConfig({
        sessionId: "texture-session:test",
        sourceId: "texture-source:test",
        sourceSurface: "window",
      }));
      const projection = {
        schema: "casimir.realtime_texture_pack.projection_frame.v1",
        projection_frame_id: "projection:test",
        request_id: "request:test",
        session_id: "texture-session:test",
        source_frame_id: "source-frame:test",
        source_captured_at: "2026-08-27T18:00:00.000Z",
        projection_completed_at: "2026-08-27T18:00:00.010Z",
        projection_image_data_url: "data:image/jpeg;base64,cHJldmlldw==",
        provider_id: "local_passthrough",
        provider_model: "local_copy_v1",
        authoritative: false,
        authority_class: "non_authoritative_projection",
        interpolated: false,
      } satisfies RealtimeTexturePackProjectionFrameV1;
      const state = {
        ...idle,
        status: "previewing" as const,
        capture_active: true,
        last_source_frame_id: projection.source_frame_id,
        last_projection_frame_id: projection.projection_frame_id,
        frame_age_ms: 10,
      };
      dependencies.onFrame?.(projection);
      dependencies.onState?.(state);
      return state;
    });
    mocks.stop.mockImplementation(() => ({ ...idle, status: "stopped" }));
    return { start: mocks.start, stop: mocks.stop, getState: mocks.getState };
  },
}));

import RealtimeTexturePackControls from "../workstation/RealtimeTexturePackControls";

describe("RealtimeTexturePackControls", () => {
  beforeEach(() => {
    mocks.policy = HELIX_DEVELOPER_ACCOUNT_POLICY;
    mocks.start.mockReset();
    mocks.stop.mockReset();
    mocks.getState.mockReset();
    mocks.createController.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    delete window.casimirDesktop;
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the frozen local-only baseline and starts a consented preview", async () => {
    render(<RealtimeTexturePackControls />);

    expect(screen.getByText("Local passthrough — no image API connected")).toBeInTheDocument();
    expect(screen.getByText("1 fps")).toBeInTheDocument();
    expect(screen.getByText("512 × 288")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show overlay" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reveal original" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Texture style preset"), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText("Texture custom prompt"), { target: { value: "moonlit ink" } });
    fireEvent.click(screen.getByRole("button", { name: "Choose game/window" }));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith({
      presetId: "custom",
      customPrompt: "moonlit ink",
    }));
    expect(await screen.findByAltText("Realtime Texture Pack local preview")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,cHJldmlldw==",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not expose capture controls to public user accounts", async () => {
    mocks.policy = HELIX_USER_ACCOUNT_POLICY;
    render(<RealtimeTexturePackControls />);

    expect(await screen.findByTestId("realtime-texture-pack-locked")).toHaveTextContent(
      "reserved for developer mode",
    );
    expect(screen.queryByRole("button", { name: "Choose game/window" })).not.toBeInTheDocument();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("stops the local controller when the panel unmounts", () => {
    const view = render(<RealtimeTexturePackControls />);
    view.unmount();
    expect(mocks.stop).toHaveBeenCalledWith("panel_unmounted");
  });

  it("sends the latest projection through the native overlay bridge", async () => {
    const showOverlay = vi.fn(async () => ({}));
    const updateFrame = vi.fn(async () => ({ overlay_visible: true }));
    const revealOriginal = vi.fn(async () => ({}));
    const stopOverlay = vi.fn(async () => ({}));
    window.casimirDesktop = {
      getRuntimeSnapshot: vi.fn(async () => ({})),
      showRealtimeTexturePackOverlay: showOverlay,
      updateRealtimeTexturePackFrame: updateFrame,
      revealRealtimeTexturePackOriginal: revealOriginal,
      stopRealtimeTexturePackOverlay: stopOverlay,
    };
    render(<RealtimeTexturePackControls />);

    fireEvent.click(screen.getByRole("button", { name: "Choose game/window" }));
    await screen.findByAltText("Realtime Texture Pack local preview");
    const showButton = screen.getByRole("button", { name: "Show overlay" });
    await waitFor(() => expect(showButton).toBeEnabled());
    fireEvent.click(showButton);

    await waitFor(() => expect(showOverlay).toHaveBeenCalledTimes(1));
    expect(updateFrame).toHaveBeenCalledWith(expect.objectContaining({
      authority_class: "non_authoritative_projection",
    }));
    expect(screen.getByRole("button", { name: "Reveal original" })).toBeEnabled();
  });

  it("keeps agent harness control off until the developer enables its session lease", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, commands: [] }),
    } as Response);
    render(<RealtimeTexturePackControls />);

    const harnessToggle = screen.getByLabelText("Enable agent harness control");
    expect(harnessToggle).toBeDisabled();
    expect(screen.getByTestId("realtime-texture-pack-agent-harness-status")).toHaveTextContent(
      "Off — user control only",
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose game/window" }));
    await screen.findByAltText("Realtime Texture Pack local preview");
    await waitFor(() => expect(harnessToggle).toBeEnabled());
    fireEvent.click(harnessToggle);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/agi/realtime-texture-pack/harness/poll",
      expect.objectContaining({ method: "POST" }),
    ));
    const pollCall = fetchMock.mock.calls.find(([path]) => String(path).endsWith("/harness/poll"));
    expect(JSON.parse(String((pollCall?.[1] as RequestInit)?.body))).toMatchObject({
      session_id: "texture-session:test",
      allowed_actions: ["show_overlay", "reveal_original", "stop"],
      client_state: { capture_active: false, overlay_visible: false },
    });
  });
});
