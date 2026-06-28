export const HELIX_AGENT_RUNTIME_IDS = ["helix", "codex"] as const;

export type HelixAgentRuntimeId = (typeof HELIX_AGENT_RUNTIME_IDS)[number];

export type HelixAgentRuntimeDescriptor = {
  id: HelixAgentRuntimeId;
  label: string;
  enabled: boolean;
  experimental: boolean;
  supports: {
    streaming: boolean;
    workstationTools: boolean;
    codeMutation: boolean;
  };
};
