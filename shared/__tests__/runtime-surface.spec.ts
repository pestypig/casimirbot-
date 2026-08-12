import { describe, expect, it } from "vitest";
import {
  DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
  parseDesktopRuntimeSnapshot,
  resolveRuntimeCapabilities,
  resolveRuntimeSurface,
} from "../runtime-surface";

describe("runtime surface", () => {
  it("keeps browser and installed PWA surfaces distinct from a native host", () => {
    expect(resolveRuntimeSurface({})).toBe("web");
    expect(resolveRuntimeSurface({ standaloneDisplayMode: true })).toBe("pwa");
    expect(resolveRuntimeSurface({ nativeBridgeReady: true })).toBe("desktop_native");
  });

  it("gives a completed native handshake precedence over browser display mode", () => {
    expect(
      resolveRuntimeSurface({
        nativeBridgeReady: true,
        standaloneDisplayMode: true,
      }),
    ).toBe("desktop_native");
  });

  it("does not let web or PWA declarations enable host-native features", () => {
    for (const surface of ["web", "pwa"] as const) {
      expect(
        resolveRuntimeCapabilities(surface, {
          nativeBinaryUpdate: true,
          localWorkspaceAccess: true,
          deviceAgentControl: true,
        }),
      ).toEqual({
        nativeBinaryUpdate: false,
        localServiceControl: false,
        localWorkspaceAccess: false,
        codexMcpRegistration: false,
        secureCredentialVault: false,
        deviceAgentControl: false,
      });
    }
  });

  it("fails native features closed until each one is explicitly declared", () => {
    expect(
      resolveRuntimeCapabilities("desktop_native", {
        localServiceControl: true,
        secureCredentialVault: true,
      }),
    ).toEqual({
      nativeBinaryUpdate: false,
      localServiceControl: true,
      localWorkspaceAccess: false,
      codexMcpRegistration: false,
      secureCredentialVault: true,
      deviceAgentControl: false,
    });
  });

  it("accepts only an exact desktop snapshot for the rendering loopback origin", () => {
    expect(
      parseDesktopRuntimeSnapshot(
        {
          schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
          surface: "desktop_native",
          serviceOrigin: "http://127.0.0.1:43123",
          capabilities: {
            nativeBinaryUpdate: false,
            localServiceControl: true,
            localWorkspaceAccess: false,
            codexMcpRegistration: false,
            secureCredentialVault: false,
            deviceAgentControl: false,
          },
        },
        "http://127.0.0.1:43123",
      ),
    ).toMatchObject({
      schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      surface: "desktop_native",
      serviceOrigin: "http://127.0.0.1:43123",
      capabilities: { localServiceControl: true },
    });
  });

  it("rejects forged, non-loopback, mismatched, and widened snapshots", () => {
    const valid = {
      schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      surface: "desktop_native",
      serviceOrigin: "http://127.0.0.1:43123",
      capabilities: {
        nativeBinaryUpdate: false,
        localServiceControl: true,
        localWorkspaceAccess: false,
        codexMcpRegistration: false,
        secureCredentialVault: false,
        deviceAgentControl: false,
      },
    };

    expect(parseDesktopRuntimeSnapshot(valid, "http://127.0.0.1:43124")).toBeNull();
    expect(
      parseDesktopRuntimeSnapshot(
        { ...valid, serviceOrigin: "https://casimirbot.com" },
        "https://casimirbot.com",
      ),
    ).toBeNull();
    expect(
      parseDesktopRuntimeSnapshot(
        { ...valid, capabilities: { ...valid.capabilities, deviceAgentControl: "yes" } },
        valid.serviceOrigin,
      ),
    ).toBeNull();
    expect(
      parseDesktopRuntimeSnapshot(
        { ...valid, unexpectedAuthority: true },
        valid.serviceOrigin,
      ),
    ).toBeNull();
  });
});
