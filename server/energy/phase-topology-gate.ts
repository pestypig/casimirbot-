import type { Nhm2PhaseTopologyArtifact } from "../../shared/contracts/nhm2-phase-topology.v1.ts";

type TopologyGateState = {
  overallStatus?: "NOMINAL" | "WARNING" | "CRITICAL";
  nhm2PhaseTopology?: Nhm2PhaseTopologyArtifact;
  topologyGuardrail?: {
    status: "fail";
    reason: string;
  };
};

export function applyNhm2PhaseTopologyGate<T extends TopologyGateState>(
  state: T,
  gateEnabled = process.env.NHM2_PHASE_TOPOLOGY_GATE === "1",
): T {
  if (!gateEnabled || state.nhm2PhaseTopology?.status !== "fail") {
    return state;
  }

  if (state.overallStatus !== "CRITICAL") {
    state.overallStatus = "WARNING";
  }
  state.topologyGuardrail = {
    status: "fail",
    reason: "phase topology fail; sector strobe not admissible for certified strobe-pattern claim",
  };

  return state;
}
