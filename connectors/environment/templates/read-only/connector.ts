import {
  HELIX_SYSTEM_CLOCK_READ_CAPABILITY,
} from "../../contract/v1";
import {
  HelixEnvironmentConnectorClient,
  createSucceededProbeResult,
} from "../../sdk/typescript";

export const runReadOnlyConnectorOnce = async (
  client: HelixEnvironmentConnectorClient,
): Promise<"idle" | "handled"> => {
  const [lease] = await client.poll(1);
  if (!lease) return "idle";
  if (
    lease.capability_id !== HELIX_SYSTEM_CLOCK_READ_CAPABILITY ||
    lease.capability_request.arguments.clock !== "monotonic"
  ) {
    throw new Error("capability_not_implemented");
  }
  const uptimeMs = Math.max(0, Math.floor(process.uptime() * 1_000));
  await client.submit(
    lease,
    createSucceededProbeResult({
      request: lease.capability_request,
      summary: `The connector process has been active for ${uptimeMs} ms.`,
      result: {
        result_summary:
          `The connector process has been active for ${uptimeMs} ms.`,
        uptime_ms: uptimeMs,
      },
    }),
  );
  return "handled";
};

