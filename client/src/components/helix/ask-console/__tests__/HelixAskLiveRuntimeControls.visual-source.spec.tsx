/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setVisualInputEnabled: vi.fn(() => true),
  runtime: {
    active: true,
    error: null as string | null,
    lifecycleState: "active" as const,
    microphoneEnabled: false,
    setMicrophoneEnabled: vi.fn(() => true),
    setVisualInputEnabled: vi.fn(() => true),
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    transportState: "active" as const,
    visualInputEnabled: false,
    visualInputError: null as string | null,
    visualInputFrameCount: 0,
    workerRelayStatus: null,
  },
}));

vi.mock("../useHelixAskLiveRuntimeSession", () => ({
  useHelixAskLiveRuntimeSession: () => mocks.runtime,
}));

import {
  buildHelixAskLiveRuntimeControlsModel,
  HelixAskLiveRuntimeControls,
} from "../HelixAskLiveRuntimeControls";

const model = buildHelixAskLiveRuntimeControlsModel({
  accountPolicy: {
    account_type: "developer",
    feature_flags: [],
    locked_features: [],
  },
  lifecycleState: "active",
  transportControllerState: "active",
});

describe("Helix Ask GPT Live Vision source coordination", () => {
  beforeEach(() => {
    mocks.runtime.visualInputEnabled = false;
    mocks.runtime.visualInputFrameCount = 0;
    mocks.runtime.setVisualInputEnabled.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("starts the selected visual source before enabling Live Vision", () => {
    const onVisualInputEnableRequested = vi.fn();
    render(
      <HelixAskLiveRuntimeControls
        model={model}
        onVisualInputEnableRequested={onVisualInputEnableRequested}
      />,
    );

    const vision = screen.getByRole("button", {
      name: "Share visual frames with GPT Live",
    });
    expect(vision).toHaveAttribute(
      "title",
      "Enable GPT Live Vision and start the selected Screen or Camera source with automatic 10-second captures",
    );

    fireEvent.click(vision);

    expect(onVisualInputEnableRequested).toHaveBeenCalledTimes(1);
    expect(mocks.runtime.setVisualInputEnabled).toHaveBeenCalledWith(true);
    expect(onVisualInputEnableRequested.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runtime.setVisualInputEnabled.mock.invocationCallOrder[0],
    );
  });

  it("does not restart capture when disabling Live Vision", () => {
    mocks.runtime.visualInputEnabled = true;
    mocks.runtime.visualInputFrameCount = 3;
    const onVisualInputEnableRequested = vi.fn();
    render(
      <HelixAskLiveRuntimeControls
        model={model}
        onVisualInputEnableRequested={onVisualInputEnableRequested}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Stop sharing visual frames with GPT Live",
    }));

    expect(onVisualInputEnableRequested).not.toHaveBeenCalled();
    expect(mocks.runtime.setVisualInputEnabled).toHaveBeenCalledWith(false);
  });

  it("explains that zero sent frames means Vision is waiting for a source", () => {
    mocks.runtime.visualInputEnabled = true;
    render(<HelixAskLiveRuntimeControls model={model} />);

    expect(screen.getByRole("button", {
      name: "Stop sharing visual frames with GPT Live",
    })).toHaveAttribute(
      "title",
      "GPT Live Vision is enabled and waiting for the selected Screen or Camera source; captures run automatically every 10 seconds (0 sent)",
    );
  });
});
