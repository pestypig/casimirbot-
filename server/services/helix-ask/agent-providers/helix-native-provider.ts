import type { HelixAgentProvider } from "./types";

export const helixNativeProvider: HelixAgentProvider = {
  id: "helix",
  label: "Helix Ask Native",
  permissionProfile: {
    id: "helix-native",
    label: "Helix native governed runtime",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: true,
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  async runTurn() {
    throw new Error("helix_native_provider_delegates_to_existing_agi_plan_handler");
  },
};
