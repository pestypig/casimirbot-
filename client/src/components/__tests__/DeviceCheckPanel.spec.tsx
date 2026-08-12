// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://127.0.0.1:43123/desktop"}
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_PANELS } from "@/pages/helix-core.panels";
import { RuntimeSurfaceProvider } from "@/lib/runtime/RuntimeSurfaceProvider";
import { DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION } from "@shared/runtime-surface";
import { DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION } from "@shared/codex-plugin";

describe("Device Check panel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete window.casimirDesktop;
  });

  it("loads from the mobile-ready developer registry and renders a credential-free device observation", async () => {
    const panel = HELIX_PANELS.find((entry) => entry.id === "device-check");
    expect(panel).toBeDefined();
    expect(panel?.mobileReady).toBe(true);
    expect(panel?.endpoints).toContain(
      "GET /api/agi/environment-connectors/devices",
    );

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        schema: "helix.environment_connector.device_check_list.v1",
        generated_at: "2026-08-11T19:00:00.000Z",
        devices: [
          {
            schema: "helix.environment_connector.device_check.v1",
            device_id: "connector_device:test",
            installation_id: "connector_installation:test",
            package_id: "com.casimirbot.minecraft.fabric",
            package_version: "1.0.0",
            trust_classification: "first_party",
            security_review_state: "approved",
            installation_status: "active",
            device_status: "active",
            health: "online",
            freshness: "fresh",
            last_contact_at: "2026-08-11T18:59:45.000Z",
            last_contact_age_ms: 15_000,
            stale_after_ms: 120_000,
            paired_at: "2026-08-11T18:00:00.000Z",
            environment_binding_id: "connector_binding:test",
            binding_status: "active",
            adapter_admission_status: "active",
            room_id: "room:test",
            source_id: "source:test",
            world_id: "world:test",
            domain_adapter: "minecraft.fabric",
            capability_ids: ["com.casimirbot.minecraft.inventory.check"],
            credential_status: "active",
            credential_expires_at: "2026-09-10T19:00:00.000Z",
            probe_ready: true,
            blocking_reasons: [],
            content_role: "device_health_observation_not_assistant_answer",
            credential_included: false,
            device_public_key_included: false,
            producer_epoch_included: false,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        ],
        content_role: "device_health_observations_not_assistant_answer",
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await panel!.loader();
    render(<loaded.default />);

    expect(await screen.findByTestId("device-check-card-connector_device:test")).toBeDefined();
    expect(screen.getByText("com.casimirbot.minecraft.fabric")).toBeDefined();
    expect(screen.getByText("Online")).toBeDefined();
    expect(screen.getByText("Ready")).toBeDefined();
    expect(screen.getByText("No credentials projected")).toBeDefined();
    expect(screen.getByTestId("device-check-runtime-surface").textContent).toBe(
      "Web service",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agi/environment-connectors/devices",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
  });

  it("shows the native Codex boundary but keeps install locked until OAuth is verified", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        schema: "helix.environment_connector.device_check_list.v1",
        generated_at: "2026-08-11T19:00:00.000Z",
        devices: [],
        content_role: "device_health_observations_not_assistant_answer",
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => ({
        schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
        surface: "desktop_native",
        serviceOrigin: window.location.origin,
        capabilities: {
          nativeBinaryUpdate: false,
          localServiceControl: true,
          localWorkspaceAccess: false,
          codexMcpRegistration: false,
          secureCredentialVault: false,
          deviceAgentControl: false,
        },
      })),
      getCodexPluginState: vi.fn(async () => ({
        schemaVersion: DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION,
        pluginName: "casimirbot-device-check",
        marketplaceName: "casimirbot-local",
        status: "blocked",
        authentication: "on_install",
        connection: "oauth_protected_https_mcp",
        blockedReason: "production_oauth_unverified",
      })),
    });

    const panel = HELIX_PANELS.find((entry) => entry.id === "device-check")!;
    const loaded = await panel.loader();
    render(
      <RuntimeSurfaceProvider>
        <loaded.default />
      </RuntimeSurfaceProvider>,
    );

    expect(
      await screen.findByText(/production OAuth discovery is not verified/i),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Open in Codex" })).toBeDisabled();
  });

  it("opens the verified Codex surface only after the native user click", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        schema: "helix.environment_connector.device_check_list.v1",
        generated_at: "2026-08-11T19:00:00.000Z",
        devices: [],
        content_role: "device_health_observations_not_assistant_answer",
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    })) as unknown as typeof fetch);
    const openCodexPlugin = vi.fn(async () => undefined);
    window.casimirDesktop = Object.freeze({
      getRuntimeSnapshot: vi.fn(async () => ({
        schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
        surface: "desktop_native",
        serviceOrigin: window.location.origin,
        capabilities: {
          nativeBinaryUpdate: false,
          localServiceControl: true,
          localWorkspaceAccess: false,
          codexMcpRegistration: true,
          secureCredentialVault: false,
          deviceAgentControl: false,
        },
      })),
      getCodexPluginState: vi.fn(async () => ({
        schemaVersion: DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION,
        pluginName: "casimirbot-device-check",
        marketplaceName: "casimirbot-local",
        status: "ready",
        authentication: "on_install",
        connection: "oauth_protected_https_mcp",
        blockedReason: null,
      })),
      openCodexPlugin,
    });

    const panel = HELIX_PANELS.find((entry) => entry.id === "device-check")!;
    const loaded = await panel.loader();
    render(
      <RuntimeSurfaceProvider>
        <loaded.default />
      </RuntimeSurfaceProvider>,
    );

    const button = await screen.findByRole("button", { name: "Open in Codex" });
    expect(button).toBeEnabled();
    expect(openCodexPlugin).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(openCodexPlugin).toHaveBeenCalledOnce());
  });
});
