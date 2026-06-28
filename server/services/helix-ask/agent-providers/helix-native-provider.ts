import type { HelixAgentProvider } from "./types";

export const helixNativeProvider: HelixAgentProvider = {
  id: "helix",
  label: "Helix Ask Native",
  enabled: () => true,
  supports: {
    streaming: true,
    workstationTools: true,
    codeMutation: false,
  },
  async runTurn() {
    throw new Error("helix_native_provider_delegates_to_existing_agi_plan_handler");
  },
};
