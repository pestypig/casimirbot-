import {
  HELIX_SYNTHETIC_REACHABILITY_CAPABILITY,
  type HelixEnvironmentConnectorProbeResult,
} from "../../contract/v1";
import {
  createSucceededProbeResult,
  type ConnectorLease,
} from "../../sdk/typescript";

export const handleSyntheticReachabilityLease = (
  lease: ConnectorLease,
  fixture: { reachable: boolean; distance: number },
  now: Date = new Date(),
): HelixEnvironmentConnectorProbeResult => {
  if (
    lease.capability_id !== HELIX_SYNTHETIC_REACHABILITY_CAPABILITY ||
    lease.capability_request.capability_id !==
      HELIX_SYNTHETIC_REACHABILITY_CAPABILITY
  ) {
    throw new Error("synthetic_capability_mismatch");
  }
  const summary = fixture.reachable
    ? `The synthetic target is reachable at distance ${fixture.distance}.`
    : "The synthetic target is not reachable.";
  return createSucceededProbeResult({
    request: lease.capability_request,
    summary,
    result: {
      result_summary: summary,
      reachable: fixture.reachable,
      distance: fixture.distance,
    },
    now,
  });
};

