/* @vitest-environment jsdom */

import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HelixWorkspaceMemoryRegistrySnapshot } from "@shared/helix-workspace-memory-registry";
import {
  buildProfileStoragePayload,
  getProfileStorageSyncStatus,
  grantProfileStorageAttachConsent,
  HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT,
  isProfileStorageAttachConsentGranted,
  profileStorageAttachConsentKey,
  revokeProfileStorageAttachConsent,
  shouldSaveProfileStorageSnapshot,
  useProfileStorageSync,
} from "../profileStorageSync";
import { useWorkspaceMemoryRegistryStore } from "@/store/useWorkspaceMemoryRegistryStore";

const profileId = "user:test-profile";
const emptyRegistry = (): HelixWorkspaceMemoryRegistrySnapshot => ({
  schema: "helix.workspace_memory_registry.v1",
  artifacts: [],
  local_only_artifact_count: 0,
  profile_ready_artifact_count: 0,
  session_only_artifact_count: 0,
});

const registryWithProfileCandidate = (): HelixWorkspaceMemoryRegistrySnapshot => ({
  schema: "helix.workspace_memory_registry.v1",
  artifacts: [{
    schema: "helix.workspace_memory_registry.v1",
    artifact_id: "artifact:chat",
    artifact_type: "helix_chat_session",
    owner_scope: "browser_guest",
    storage_backend: "localStorage",
    sync_status: "profile_candidate",
    profile_id: null,
    chat_session_id: "chat:test",
    title: "Browser chat",
    storage_key: "agi-chat-sessions-v1",
    updated_at: "2026-07-06T12:00:00.000Z",
  }],
  local_only_artifact_count: 0,
  profile_ready_artifact_count: 1,
  session_only_artifact_count: 0,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  useWorkspaceMemoryRegistryStore.setState({ artifacts: {} });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function ProfileStorageSyncHarness() {
  useProfileStorageSync();
  return null;
}

describe("profile storage sync consent", () => {
  it("does not save browser-local profile candidates until attach consent is granted", () => {
    const registry = registryWithProfileCandidate();

    expect(isProfileStorageAttachConsentGranted(profileId)).toBe(false);
    expect(shouldSaveProfileStorageSnapshot({ profileId, registry })).toBe(false);

    grantProfileStorageAttachConsent(profileId);

    expect(isProfileStorageAttachConsentGranted(profileId)).toBe(true);
    expect(shouldSaveProfileStorageSnapshot({ profileId, registry })).toBe(true);
  });

  it("uses per-profile consent and can revoke a browser attachment", () => {
    const registry = registryWithProfileCandidate();
    grantProfileStorageAttachConsent(profileId);

    expect(window.localStorage.getItem(profileStorageAttachConsentKey(profileId))).toBe("1");
    expect(shouldSaveProfileStorageSnapshot({ profileId: "user:other", registry })).toBe(false);

    revokeProfileStorageAttachConsent(profileId);

    expect(window.localStorage.getItem(profileStorageAttachConsentKey(profileId))).toBeNull();
    expect(shouldSaveProfileStorageSnapshot({ profileId, registry })).toBe(false);
  });

  it("announces consent changes so the sync hook can retry immediately", () => {
    const seen: Array<{ profileId: string; granted: boolean }> = [];
    window.addEventListener(HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT, ((event: CustomEvent) => {
      seen.push(event.detail);
    }) as EventListener);

    grantProfileStorageAttachConsent(profileId);
    revokeProfileStorageAttachConsent(profileId);

    expect(seen).toEqual([
      { profileId, granted: true },
      { profileId, granted: false },
    ]);
  });

  it("captures linked-source local settings as profile artifacts after consent", () => {
    window.localStorage.setItem("helix.worldEventSourceEndpoint", "https://source.example/events");
    window.localStorage.setItem("helix.worldEventSourceLabel", "Minecraft world");
    window.localStorage.setItem("helix.liveAnswer.visualCaptureRoutes.v1", JSON.stringify(["live_answer", "image_lens"]));
    grantProfileStorageAttachConsent(profileId);

    expect(shouldSaveProfileStorageSnapshot({ profileId, registry: emptyRegistry() })).toBe(true);

    const payload = buildProfileStoragePayload(emptyRegistry(), profileId);
    expect(payload.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        artifact_id: "linked-source:live-answer-world-event-endpoint",
        artifact_type: "linked_source",
        storage_key: "helix.worldEventSourceEndpoint",
      }),
      expect.objectContaining({
        artifact_id: "linked-source:live-answer-world-event-label",
        artifact_type: "linked_source",
        storage_key: "helix.worldEventSourceLabel",
      }),
      expect.objectContaining({
        artifact_id: "linked-source:live-answer-visual-capture-routes",
        artifact_type: "linked_source",
        storage_key: "helix.liveAnswer.visualCaptureRoutes.v1",
      }),
    ]));
    expect(payload.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        storage_key: "helix.worldEventSourceEndpoint",
        value: "https://source.example/events",
      }),
      expect.objectContaining({
        storage_key: "helix.worldEventSourceLabel",
        value: "Minecraft world",
      }),
    ]));
  });

  it("does not create linked-source artifacts for absent local settings", () => {
    grantProfileStorageAttachConsent(profileId);

    expect(shouldSaveProfileStorageSnapshot({ profileId, registry: emptyRegistry() })).toBe(false);
    expect(buildProfileStoragePayload(emptyRegistry(), profileId)).toMatchObject({
      artifacts: [],
      entries: [],
    });
  });

  it("captures saved procedure expressions as remembered profile artifacts after consent", () => {
    const savedProcedureState = JSON.stringify({
      state: {
        currentExpression: {
          schema: "fruition.procedure_expression.v1",
          artifactId: "fruition_procedure_expression",
          expression: "direct_observation -> constrained_action",
          terms: [],
          operators: [],
        },
        history: [],
      },
      version: 0,
    });
    window.localStorage.setItem("fruition-calculator:v1", savedProcedureState);
    grantProfileStorageAttachConsent(profileId);

    expect(shouldSaveProfileStorageSnapshot({ profileId, registry: emptyRegistry() })).toBe(true);

    const payload = buildProfileStoragePayload(emptyRegistry(), profileId);
    expect(payload.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        artifact_id: "remembered-procedure:fruition-calculator",
        artifact_type: "remembered_procedure",
        storage_key: "fruition-calculator:v1",
      }),
    ]));
    expect(payload.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        storage_key: "fruition-calculator:v1",
        value: savedProcedureState,
        artifact_ids: ["remembered-procedure:fruition-calculator"],
      }),
    ]));
  });

  it("keeps a browser-local pending sync queue when profile backup fails and clears it after retry", async () => {
    vi.useFakeTimers();
    window.localStorage.setItem("agi-chat-sessions-v1", JSON.stringify([{ id: "chat:test" }]));
    useWorkspaceMemoryRegistryStore.getState().upsertArtifact({
      artifact_id: "artifact:chat",
      artifact_type: "helix_chat_session",
      owner_scope: "browser_guest",
      storage_backend: "localStorage",
      sync_status: "profile_candidate",
      profile_id: null,
      chat_session_id: "chat:test",
      title: "Browser chat",
      storage_key: "agi-chat-sessions-v1",
      updated_at: "2026-07-06T12:00:00.000Z",
    });
    grantProfileStorageAttachConsent(profileId);

    let failBackup = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/account/session") {
        return new Response(JSON.stringify({
          session: { profile: { profile_id: profileId } },
          account_policy: {},
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "/api/account/profile-storage/snapshot" && init?.method === "POST") {
        if (failBackup) {
          return new Response(JSON.stringify({ ok: false, message: "Server unavailable." }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ ok: true, message: "Saved." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === "/api/account/profile-storage/snapshot") {
        return new Response(JSON.stringify({
          schema: "helix.profile_storage_snapshot.v1",
          profile_id: profileId,
          storage_backend: "profile_server",
          entries: [],
          artifacts: [],
          total_entry_bytes: 0,
          quota_bytes: 1024,
          updated_at: null,
          raw_profile_content_included: true,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({}), { status: 404, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(ProfileStorageSyncHarness));
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(getProfileStorageSyncStatus(profileId)).toMatchObject({
      pending: true,
      pendingEntryCount: 1,
      lastError: "Server unavailable.",
    });

    failBackup = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13_500);
    });

    expect(getProfileStorageSyncStatus(profileId)).toMatchObject({
      pending: false,
      pendingEntryCount: 0,
      lastError: null,
    });
  });
});
