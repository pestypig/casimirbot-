import type { HelixCapabilityLaneManifest } from "./helix-capability-lane";

export const HELIX_AGENT_RUNTIME_IDS = ["helix", "codex", "future"] as const;

export type HelixAgentRuntimeId = (typeof HELIX_AGENT_RUNTIME_IDS)[number];

export const isHelixAgentRuntimeId = (value: unknown): value is HelixAgentRuntimeId =>
  typeof value === "string" &&
  (HELIX_AGENT_RUNTIME_IDS as readonly string[]).includes(value);

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
  capability_lane_manifest?: HelixCapabilityLaneManifest;
  supports: {
    streaming: boolean;
    workstationTools: boolean;
    capabilityLanes?: boolean;
    capabilityLaneOneShot?: boolean;
    capabilityLaneSessions?: boolean;
    codeMutation: boolean;
  };
};
