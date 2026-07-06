import * as React from "react";
import type { HelixAccountSessionStatus } from "@shared/helix-account-session";
import type {
  HelixWorkspaceMemoryArtifact,
  HelixWorkspaceMemoryRegistrySnapshot,
} from "@shared/helix-workspace-memory-registry";
import type {
  HelixProfileStorageEntry,
  HelixProfileStorageSnapshot,
  HelixProfileStorageWriteReceipt,
} from "@shared/helix-profile-storage";
import { useWorkspaceMemoryRegistryStore } from "@/store/useWorkspaceMemoryRegistryStore";

const PROFILE_SYNC_INTERVAL_MS = 12000;
const PROFILE_SYNC_DEBOUNCE_MS = 1200;
const DESKTOP_LAYOUT_STORAGE_KEY = "desktop-windows-v2";
const LIVE_SOURCE_ENDPOINT_STORAGE_KEY = "helix.worldEventSourceEndpoint";
const LIVE_SOURCE_LABEL_STORAGE_KEY = "helix.worldEventSourceLabel";
const VISUAL_CAPTURE_ROUTE_STORAGE_KEY = "helix.liveAnswer.visualCaptureRoutes.v1";
const FRUITION_CALCULATOR_STORAGE_KEY = "fruition-calculator:v1";
export const HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT =
  "helix-profile-storage-attach-consent";
const PROFILE_ATTACH_CONSENT_KEY_PREFIX = "helix.profileStorage.attachConsent:";

const byteLength = (value: string): number => {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).byteLength;
  }
  return value.length * 2;
};

const safeLocalStorageGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeLocalStorageRemove = (key: string): boolean => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export function profileStorageAttachConsentKey(profileId: string): string {
  return `${PROFILE_ATTACH_CONSENT_KEY_PREFIX}${profileId}`;
}

export function isProfileStorageAttachConsentGranted(profileId: string | null | undefined): boolean {
  if (!profileId?.trim()) return false;
  return safeLocalStorageGet(profileStorageAttachConsentKey(profileId.trim())) === "1";
}

export function grantProfileStorageAttachConsent(profileId: string | null | undefined): boolean {
  if (!profileId?.trim()) return false;
  const granted = safeLocalStorageSet(profileStorageAttachConsentKey(profileId.trim()), "1");
  if (granted) {
    window.dispatchEvent(new CustomEvent(HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT, {
      detail: { profileId: profileId.trim(), granted: true },
    }));
  }
  return granted;
}

export function revokeProfileStorageAttachConsent(profileId: string | null | undefined): boolean {
  if (!profileId?.trim()) return false;
  const revoked = safeLocalStorageRemove(profileStorageAttachConsentKey(profileId.trim()));
  if (revoked) {
    window.dispatchEvent(new CustomEvent(HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT, {
      detail: { profileId: profileId.trim(), granted: false },
    }));
  }
  return revoked;
}

export function shouldSaveProfileStorageSnapshot(input: {
  profileId: string | null | undefined;
  registry: HelixWorkspaceMemoryRegistrySnapshot;
}): boolean {
  if (!input.profileId?.trim()) return false;
  if (!isProfileStorageAttachConsentGranted(input.profileId)) return false;
  return profileEligibleArtifacts(input.registry, input.profileId.trim()).length > 0;
}

async function fetchAccountStatus(signal?: AbortSignal): Promise<HelixAccountSessionStatus | null> {
  const response = await fetch("/api/account/session", { signal });
  if (!response.ok) return null;
  return response.json();
}

function syntheticDesktopLayoutArtifact(profileId: string): HelixWorkspaceMemoryArtifact | null {
  const value = safeLocalStorageGet(DESKTOP_LAYOUT_STORAGE_KEY);
  if (value == null) return null;
  return {
    schema: "helix.workspace_memory_registry.v1",
    artifact_id: "workstation-layout:desktop",
    artifact_type: "workstation_layout",
    owner_scope: "profile",
    storage_backend: "localStorage",
    sync_status: "profile_synced",
    profile_id: profileId,
    chat_session_id: null,
    title: "Desktop layout",
    storage_key: DESKTOP_LAYOUT_STORAGE_KEY,
    path_ref: `storage://localStorage/${DESKTOP_LAYOUT_STORAGE_KEY}`,
    size_bytes: byteLength(value),
    quota_bytes: null,
    updated_at: new Date().toISOString(),
  };
}

function syntheticLinkedSourceArtifacts(profileId: string): HelixWorkspaceMemoryArtifact[] {
  const updatedAt = new Date().toISOString();
  return [
    {
      key: LIVE_SOURCE_ENDPOINT_STORAGE_KEY,
      artifact_id: "linked-source:live-answer-world-event-endpoint",
      title: "Live answer world-event endpoint",
    },
    {
      key: LIVE_SOURCE_LABEL_STORAGE_KEY,
      artifact_id: "linked-source:live-answer-world-event-label",
      title: "Live answer world-event label",
    },
    {
      key: VISUAL_CAPTURE_ROUTE_STORAGE_KEY,
      artifact_id: "linked-source:live-answer-visual-capture-routes",
      title: "Live answer visual capture routes",
    },
  ].flatMap((entry): HelixWorkspaceMemoryArtifact[] => {
    const value = safeLocalStorageGet(entry.key);
    if (value == null || value.trim() === "") return [];
    return [{
      schema: "helix.workspace_memory_registry.v1",
      artifact_id: entry.artifact_id,
      artifact_type: "linked_source",
      owner_scope: "profile",
      storage_backend: "localStorage",
      sync_status: "profile_synced",
      profile_id: profileId,
      chat_session_id: null,
      title: entry.title,
      storage_key: entry.key,
      path_ref: `storage://localStorage/${entry.key}`,
      size_bytes: byteLength(value),
      quota_bytes: null,
      updated_at: updatedAt,
    }];
  });
}

function syntheticRememberedProcedureArtifacts(profileId: string): HelixWorkspaceMemoryArtifact[] {
  const value = safeLocalStorageGet(FRUITION_CALCULATOR_STORAGE_KEY);
  if (value == null || value.trim() === "") return [];
  return [{
    schema: "helix.workspace_memory_registry.v1",
    artifact_id: "remembered-procedure:fruition-calculator",
    artifact_type: "remembered_procedure",
    owner_scope: "profile",
    storage_backend: "localStorage",
    sync_status: "profile_synced",
    profile_id: profileId,
    chat_session_id: null,
    title: "Fruition procedure expressions",
    storage_key: FRUITION_CALCULATOR_STORAGE_KEY,
    path_ref: `storage://localStorage/${FRUITION_CALCULATOR_STORAGE_KEY}`,
    size_bytes: byteLength(value),
    quota_bytes: null,
    updated_at: new Date().toISOString(),
  }];
}

function profileEligibleArtifacts(
  registry: HelixWorkspaceMemoryRegistrySnapshot,
  profileId: string,
): HelixWorkspaceMemoryArtifact[] {
  const artifacts = registry.artifacts
    .filter((artifact) => artifact.storage_backend === "localStorage")
    .filter((artifact) =>
      artifact.sync_status === "profile_candidate" ||
      artifact.sync_status === "profile_synced",
    )
    .map((artifact) => ({
      ...artifact,
      owner_scope: "profile" as const,
      sync_status: "profile_synced" as const,
      profile_id: profileId,
      updated_at: artifact.updated_at || new Date().toISOString(),
    }));
  const desktopLayout = syntheticDesktopLayoutArtifact(profileId);
  return [
    ...artifacts,
    ...(desktopLayout ? [desktopLayout] : []),
    ...syntheticLinkedSourceArtifacts(profileId),
    ...syntheticRememberedProcedureArtifacts(profileId),
  ];
}

export function buildProfileStoragePayload(
  registry: HelixWorkspaceMemoryRegistrySnapshot,
  profileId: string,
): { entries: HelixProfileStorageEntry[]; artifacts: HelixWorkspaceMemoryArtifact[] } {
  const artifacts = profileEligibleArtifacts(registry, profileId);
  const artifactIdsByStorageKey = new Map<string, string[]>();
  for (const artifact of artifacts) {
    const ids = artifactIdsByStorageKey.get(artifact.storage_key) ?? [];
    ids.push(artifact.artifact_id);
    artifactIdsByStorageKey.set(artifact.storage_key, Array.from(new Set(ids)).sort());
  }
  const entries: HelixProfileStorageEntry[] = [];
  for (const [storageKey, artifactIds] of artifactIdsByStorageKey.entries()) {
    const value = safeLocalStorageGet(storageKey);
    if (value == null) continue;
    entries.push({
      storage_key: storageKey,
      storage_backend: "localStorage",
      value,
      size_bytes: byteLength(value),
      updated_at: new Date().toISOString(),
      artifact_ids: artifactIds,
    });
  }
  return {
    entries: entries.sort((left, right) => left.storage_key.localeCompare(right.storage_key)),
    artifacts: artifacts.sort((left, right) => left.artifact_id.localeCompare(right.artifact_id)),
  };
}

async function saveProfileStorageSnapshot(
  registry: HelixWorkspaceMemoryRegistrySnapshot,
  profileId: string,
  signal?: AbortSignal,
): Promise<HelixProfileStorageWriteReceipt | null> {
  const payload = buildProfileStoragePayload(registry, profileId);
  if (payload.entries.length === 0 && payload.artifacts.length === 0) return null;
  const response = await fetch("/api/account/profile-storage/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const body = await response.json();
  return body as HelixProfileStorageWriteReceipt;
}

async function loadProfileStorageSnapshot(signal?: AbortSignal): Promise<HelixProfileStorageSnapshot | null> {
  const response = await fetch("/api/account/profile-storage/snapshot", { signal });
  if (!response.ok) return null;
  return response.json();
}

function applyProfileStorageSnapshot(snapshot: HelixProfileStorageSnapshot): number {
  let applied = 0;
  const registry = useWorkspaceMemoryRegistryStore.getState();
  for (const entry of snapshot.entries) {
    if (entry.storage_backend !== "localStorage") continue;
    const existing = safeLocalStorageGet(entry.storage_key);
    if (existing === entry.value) continue;
    if (safeLocalStorageSet(entry.storage_key, entry.value)) {
      applied += 1;
    }
  }
  for (const artifact of snapshot.artifacts) {
    registry.upsertArtifact({
      ...artifact,
      owner_scope: "profile",
      sync_status: "profile_synced",
      profile_id: snapshot.profile_id,
    });
  }
  return applied;
}

function maybeReloadAfterRestore(profileId: string, appliedCount: number): void {
  if (appliedCount <= 0) return;
  const reloadKey = `helix.profileStorage.restoreReloaded:${profileId}`;
  try {
    if (window.sessionStorage.getItem(reloadKey) === "1") return;
    window.sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  } catch {
    // Browser storage reload coordination is best-effort.
  }
}

export function useProfileStorageSync(): void {
  const registrySnapshot = useWorkspaceMemoryRegistryStore((state) =>
    state.buildRegistrySnapshot(),
  );
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [attachConsentTick, setAttachConsentTick] = React.useState(0);
  const loadedProfileRef = React.useRef<string | null>(null);
  const lastPayloadRef = React.useRef<string>("");

  React.useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const status = await fetchAccountStatus(controller.signal);
        setProfileId(status?.session?.profile.profile_id ?? null);
      } catch {
        setProfileId(null);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, PROFILE_SYNC_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    const handleConsent = () => setAttachConsentTick((tick) => tick + 1);
    window.addEventListener(HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(HELIX_PROFILE_STORAGE_ATTACH_CONSENT_EVENT, handleConsent);
  }, []);

  React.useEffect(() => {
    if (!profileId || loadedProfileRef.current === profileId) return;
    const controller = new AbortController();
    loadedProfileRef.current = profileId;
    void loadProfileStorageSnapshot(controller.signal).then((snapshot) => {
      if (!snapshot || snapshot.profile_id !== profileId) return;
      const appliedCount = applyProfileStorageSnapshot(snapshot);
      maybeReloadAfterRestore(profileId, appliedCount);
    }).catch(() => {
      // Restore is best-effort; browser-local state remains authoritative until sync succeeds.
    });
    return () => controller.abort();
  }, [profileId]);

  React.useEffect(() => {
    if (!profileId) return;
    if (!shouldSaveProfileStorageSnapshot({ profileId, registry: registrySnapshot })) return;
    const payload = buildProfileStoragePayload(registrySnapshot, profileId);
    const comparable = JSON.stringify({
      profileId,
      entries: payload.entries.map((entry) => ({
        storage_key: entry.storage_key,
        size_bytes: entry.size_bytes,
        value: entry.value,
      })),
      artifacts: payload.artifacts.map((artifact) => ({
        artifact_id: artifact.artifact_id,
        storage_key: artifact.storage_key,
        size_bytes: artifact.size_bytes ?? null,
      })),
    });
    if (comparable === lastPayloadRef.current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void saveProfileStorageSnapshot(registrySnapshot, profileId, controller.signal).then((receipt) => {
        if (!receipt?.ok) return;
        lastPayloadRef.current = comparable;
        for (const artifact of payload.artifacts) {
          useWorkspaceMemoryRegistryStore.getState().upsertArtifact({
            ...artifact,
            owner_scope: "profile",
            sync_status: "profile_synced",
            profile_id: profileId,
          });
        }
      }).catch(() => {
        // Keep local browser persistence as the fallback when the server is unavailable.
      });
    }, PROFILE_SYNC_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [attachConsentTick, profileId, registrySnapshot]);
}
