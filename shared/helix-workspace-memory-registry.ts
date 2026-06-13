export const HELIX_WORKSPACE_MEMORY_REGISTRY_SCHEMA =
  "helix.workspace_memory_registry.v1" as const;

export type HelixWorkspaceMemoryArtifactType =
  | "workstation_note"
  | "helix_chat_session"
  | "helix_chat_layout"
  | "workstation_session_draft"
  | "workstation_panel_scroll";

export type HelixWorkspaceMemoryOwnerScope =
  | "browser_guest"
  | "profile"
  | "surface_session_only";

export type HelixWorkspaceMemoryStorageBackend =
  | "localStorage"
  | "sessionStorage"
  | "profile_server";

export type HelixWorkspaceMemorySyncStatus =
  | "local_only"
  | "profile_candidate"
  | "profile_synced";

export type HelixWorkspaceMemoryArtifact = {
  schema: typeof HELIX_WORKSPACE_MEMORY_REGISTRY_SCHEMA;
  artifact_id: string;
  artifact_type: HelixWorkspaceMemoryArtifactType;
  owner_scope: HelixWorkspaceMemoryOwnerScope;
  storage_backend: HelixWorkspaceMemoryStorageBackend;
  sync_status: HelixWorkspaceMemorySyncStatus;
  profile_id: string | null;
  chat_session_id: string | null;
  title: string | null;
  storage_key: string;
  path_ref?: string | null;
  size_bytes?: number | null;
  quota_bytes?: number | null;
  updated_at: string;
};

export type HelixWorkspaceMemoryRegistrySnapshot = {
  schema: typeof HELIX_WORKSPACE_MEMORY_REGISTRY_SCHEMA;
  artifacts: HelixWorkspaceMemoryArtifact[];
  profile_ready_artifact_count: number;
  local_only_artifact_count: number;
  session_only_artifact_count: number;
};
