// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_UPDATE_STATE_SCHEMA_VERSION } from "@shared/desktop-update";
import DesktopUpdatePanel from "../DesktopUpdatePanel";

vi.mock("@/lib/runtime/RuntimeSurfaceProvider", () => ({
  useRuntimeSurface: () => ({
    surface: "desktop_native",
    nativeHandshake: "ready",
    capabilities: {
      nativeBinaryUpdate: true,
      localServiceControl: true,
      localWorkspaceAccess: false,
      codexMcpRegistration: false,
      secureCredentialVault: false,
      deviceAgentControl: false,
    },
  }),
}));

const available = {
  schemaVersion: DESKTOP_UPDATE_STATE_SCHEMA_VERSION,
  phase: "available",
  currentVersion: "0.1.0",
  availableVersion: "0.1.1",
  progressPercent: null,
  errorCode: null,
  canCheck: true,
  canDownload: true,
  canInstall: false,
} as const;

describe("DesktopUpdatePanel", () => {
  afterEach(() => {
    cleanup();
    delete window.casimirDesktop;
    vi.restoreAllMocks();
  });

  it("uses only the native bridge for an explicit update download", async () => {
    const downloadUpdate = vi.fn(async () => ({
      ...available,
      phase: "downloading",
      progressPercent: 0,
      canCheck: false,
      canDownload: false,
    }));
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(),
      getUpdateState: vi.fn(async () => available),
      checkForUpdates: vi.fn(async () => available),
      downloadUpdate,
      installUpdate: vi.fn(async () => available),
      onUpdateState: vi.fn(() => () => undefined),
    });

    render(<DesktopUpdatePanel />);
    expect(await screen.findByText("Available version 0.1.1")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    expect(downloadUpdate).toHaveBeenCalledTimes(1);
  });
});
