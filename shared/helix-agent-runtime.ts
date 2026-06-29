export const HELIX_AGENT_RUNTIME_IDS = ["helix", "codex", "future"] as const;

export type HelixAgentRuntimeId = (typeof HELIX_AGENT_RUNTIME_IDS)[number];

export type HelixAgentPermissionProfile = {
  id: "helix-native" | "read-observe" | "read-observe-act";
  label: string;
  allows: {
    observe: boolean;
    read: boolean;
    act: boolean;
    write: boolean;
    shell: boolean;
    codeMutation: boolean;
  };
};

export type HelixAgentRuntimeDescriptor = {
  id: HelixAgentRuntimeId;
  label: string;
  enabled: boolean;
  experimental: boolean;
  permission_profile: HelixAgentPermissionProfile;
  runtime_status?: {
    launchable: boolean;
    reason: string | null;
    resolved_bin: string | null;
    args: string[];
  };
  supports: {
    streaming: boolean;
    workstationTools: boolean;
    codeMutation: boolean;
  };
};
