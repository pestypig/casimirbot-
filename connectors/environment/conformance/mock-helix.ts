import type {
  HelixEnvironmentConnectorProbeResult,
} from "../contract/v1";
import type { ConnectorLease, ConnectorFetch } from "../sdk/typescript";

type Submitted = {
  probeAttemptId: string;
  result: HelixEnvironmentConnectorProbeResult;
};

export class MockHelixConnectorEndpoint {
  readonly submitted: Submitted[] = [];
  private readonly pending: ConnectorLease[] = [];

  enqueue(lease: ConnectorLease): void {
    this.pending.push(structuredClone(lease));
  }

  readonly fetch: ConnectorFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    if (init?.headers) {
      const authorization = new Headers(init.headers).get("authorization");
      if (authorization !== "Bearer helix_env_device_mock_credential_123456") {
        return Response.json(
          { message: "device_credential_invalid" },
          { status: 401 },
        );
      }
    }
    if (url.pathname.endsWith("/device/probes/pending")) {
      const lease = this.pending.shift();
      return Response.json({ leases: lease ? [lease] : [] });
    }
    if (url.pathname.endsWith("/device/probes/result")) {
      const submission = JSON.parse(String(init?.body ?? "{}")) as {
        probe_attempt_id?: unknown;
        result?: unknown;
      };
      this.submitted.push({
        probeAttemptId: String(submission.probe_attempt_id),
        result: submission.result as HelixEnvironmentConnectorProbeResult,
      });
      return Response.json({ ok: true });
    }
    if (url.pathname.endsWith("/device/heartbeat")) {
      return Response.json({ ok: true, health: "online" });
    }
    return Response.json({ message: "route_not_found" }, { status: 404 });
  };
}

