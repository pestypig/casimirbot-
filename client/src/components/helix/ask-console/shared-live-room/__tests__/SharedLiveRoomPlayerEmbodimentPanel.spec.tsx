/** @vitest-environment jsdom */

import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS } from
  "@shared/helix-minecraft-player-capabilities";
import { SharedLiveRoomPlayerEmbodimentPanel } from
  "../SharedLiveRoomPlayerEmbodimentPanel";

const roomId = "shared_realtime_room:player-ui";
const environmentId = "environment_binding:player-ui";
const participantId = "shared_realtime_participant:owner";

const environment = {
  environment_binding_id: environmentId,
  room_source_binding_id: "room_source_binding:player-ui",
  room_id: roomId,
  source_id: "source:room-ingress:player-ui",
  world_id: "minecraft:local:player-ui",
  domain: "minecraft",
  domain_adapter: "minecraft.fabric_mod.v1",
  source_label: "Local Fabric 1.21.8",
  connection_status: "active",
  latest_observed_at: "2026-08-05T22:00:00.000Z",
  capability_ids: [],
  subject_directory: null,
  self_subject_binding: {
    status: "active",
    subject_ref: "environment_subject:player-ui",
    subject_label: "DatDamPig",
  },
  identity_assignment: "active",
} as never;

const sourceBinding = {
  binding_id: "room_source_binding:player-ui",
  domain_adapter: "minecraft.fabric_mod.v1",
  source_label: "Local Fabric 1.21.8",
} as never;

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const authorityReceipt = (
  authority: unknown = null,
  connectorReadiness: unknown[] = [],
) => ({
  schema: "helix.environment_action.authority_receipt.v1",
  ok: true,
  error: null,
  message: authority
    ? "Player-action authority configured."
    : "No player-action authority is configured.",
  authority,
  authorities: authority ? [authority] : [],
  connector_readiness: connectorReadiness,
  action_credential_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Shared Live Room Player Embodiment controls", () => {
  it("creates a finite exact-capability lease and a separately scoped client pairing", async () => {
    let authority: Record<string, unknown> | null = null;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.endsWith("/action-authorities") && init?.method === "PUT") {
          const request = JSON.parse(String(init.body));
          authority = {
            schema: "helix.environment_action.authority.v1",
            action_authority_id: "environment_action_authority:player-ui",
            environment_binding_id: environmentId,
            room_source_binding_id: sourceBinding.binding_id,
            room_id: roomId,
            source_id: "source:room-ingress:player-ui",
            world_id: "minecraft:local:player-ui",
            adapter_profile_id: "game.minecraft.player.fabric.v1",
            domain_adapter: request.domain_adapter,
            participant_id: request.participant_id,
            subject_binding_id: "environment_subject_binding:player-ui",
            allowed_capability_ids: request.allowed_capability_ids,
            autonomy_mode: request.autonomy_mode,
            manual_override_policy: request.manual_override_policy,
            status: "active",
            policy_version: 1,
            issued_at: "2026-08-05T22:00:00.000Z",
            expires_at: request.expires_at,
            revoked_at: null,
            credential_included: false,
            content_role: "environment_action_authority_not_assistant_answer",
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          };
          return jsonResponse(authorityReceipt(authority));
        }
        if (url.endsWith("/action-authorities")) {
          return jsonResponse(authorityReceipt(
            authority,
            authority
              ? [{
                action_authority_id: authority.action_authority_id,
                state: "awaiting_manifest",
                ready_for_actions: false,
                heartbeat_received_at: null,
                manual_input_detected: false,
              }]
              : [],
          ));
        }
        if (url.endsWith("/connector-pairings") && init?.method === "POST") {
          return jsonResponse({
            schema: "helix.connector_pairing_receipt.v1",
            ok: true,
            error: null,
            message: "Player-action pairing code created.",
            pairing: {
              pairing_id: "connector_pairing:player-ui",
              expires_at: "2099-01-01T00:10:00.000Z",
            },
            pairing_code: "ABCD-6789",
            pairing_command: "/helix-player pair ABCD-6789",
            pairing_code_shown_once: true,
            credential_included: false,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          });
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SharedLiveRoomPlayerEmbodimentPanel
        roomId={roomId}
        environment={environment}
        selfParticipantId={participantId}
        sourceBinding={sourceBinding}
        isOwner
      />,
    );

    await screen.findByText("Minecraft Player Embodiment");
    const save = screen.getByRole("button", { name: "Save player authority" });
    expect(save.hasAttribute("disabled")).toBe(true);
    fireEvent.click(
      screen.getByLabelText(
        "Acknowledge Minecraft player control for Local Fabric 1.21.8",
      ),
    );
    fireEvent.click(save);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).endsWith("/action-authorities") &&
          init?.method === "PUT",
      );
      expect(call).toBeTruthy();
      const body = JSON.parse(String(call?.[1]?.body));
      expect(body.participant_id).toBe(participantId);
      expect(body.domain_adapter).toBe("minecraft.fabric_client.v1");
      expect(body.allowed_capability_ids).toEqual([
        ...HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS,
      ]);
      expect(body.autonomy_mode).toBe("approved_capabilities");
      expect(body.manual_override_policy).toBe("cancel");
      expect(Date.parse(body.expires_at)).toBeGreaterThan(Date.now());
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Pair player client in game" }),
    );
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).endsWith("/connector-pairings") &&
          init?.method === "POST",
      );
      const body = JSON.parse(String(call?.[1]?.body));
      expect(body).toMatchObject({
        purpose: "rotate",
        binding_id: sourceBinding.binding_id,
        domain_adapter: "minecraft.fabric_mod.v1",
        action_credential_requested: true,
        action_authority_id: "environment_action_authority:player-ui",
      });
      expect(body.command_credential_requested).toBeUndefined();
    });
    expect(await screen.findByText("/helix-player pair ABCD-6789")).toBeTruthy();
    expect(screen.getByText(/restart Minecraft completely/i)).toBeTruthy();
    expect(screen.getByText(/run \/helix-player status/i)).toBeTruthy();
    expect(screen.getByText(/delivered directly to the client companion/i))
      .toBeTruthy();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("bearer_token");
  });

  it("distinguishes configured authority from a manifest-and-heartbeat-ready client", async () => {
    const authority = {
      schema: "helix.environment_action.authority.v1",
      action_authority_id: "environment_action_authority:ready-ui",
      environment_binding_id: environmentId,
      room_source_binding_id: sourceBinding.binding_id,
      room_id: roomId,
      source_id: "source:room-ingress:player-ui",
      world_id: "minecraft:local:player-ui",
      adapter_profile_id: "game.minecraft.player.fabric.v1",
      domain_adapter: "minecraft.fabric_client.v1",
      participant_id: participantId,
      subject_binding_id: "environment_subject_binding:player-ui",
      allowed_capability_ids: [...HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS],
      autonomy_mode: "approved_capabilities",
      manual_override_policy: "cancel",
      status: "active",
      policy_version: 1,
      issued_at: "2026-08-05T22:00:00.000Z",
      expires_at: "2099-01-01T00:00:00.000Z",
      revoked_at: null,
      credential_included: false,
      content_role: "environment_action_authority_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const connectorReadiness = {
      schema: "helix.environment_action.connector_readiness.v1",
      action_authority_id: authority.action_authority_id,
      state: "ready",
      ready_for_actions: true,
      manifest_admitted: true,
      manifest_received_at: "2026-08-05T22:00:01.000Z",
      declared_capability_count: 13,
      available_control_engines: ["native_fabric"],
      heartbeat_status: "active",
      heartbeat_fresh: true,
      heartbeat_received_at: "2026-08-05T22:00:02.000Z",
      heartbeat_max_age_ms: 30_000,
      active_workflow_count: 0,
      controls_asserted: false,
      manual_input_detected: false,
      emergency_stop_latched: false,
      blocking_reason: null,
      credential_included: false,
      content_role:
        "environment_action_connector_readiness_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(
        authorityReceipt(authority, [connectorReadiness]),
      )),
    );

    render(
      <SharedLiveRoomPlayerEmbodimentPanel
        roomId={roomId}
        environment={environment}
        selfParticipantId={participantId}
        sourceBinding={sourceBinding}
        isOwner
      />,
    );

    expect(await screen.findByText("client ready")).toBeTruthy();
    expect(
      screen.getByText(/Client ready: 13 declared capabilities via native_fabric/i),
    ).toBeTruthy();
    expect(screen.getByText("authority active")).toBeTruthy();
    expect(JSON.stringify(connectorReadiness)).not.toContain("credential_id");
    expect(JSON.stringify(connectorReadiness)).not.toContain("manifest_id");
  });

  it("does not overlap authority refreshes while an earlier request remains pending", async () => {
    vi.useFakeTimers();
    let resolveInitial: ((response: Response) => void) | null = null;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => {
        resolveInitial = resolve;
      }))
      .mockResolvedValue(jsonResponse(authorityReceipt()));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <SharedLiveRoomPlayerEmbodimentPanel
        roomId={roomId}
        environment={environment}
        selfParticipantId={participantId}
        sourceBinding={sourceBinding}
        isOwner
      />,
    );

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInitial?.(jsonResponse(authorityReceipt()));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(9_999);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
