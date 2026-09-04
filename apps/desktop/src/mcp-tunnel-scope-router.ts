import http from "node:http";
import type { AddressInfo } from "node:net";
import type { DesktopMcpTunnelScope } from
  "../../../shared/desktop-mcp-tunnel";

const READ_ONLY_SCOPE =
  "local_supervisor_coordination_and_device_check" as const;

const isLoopback = (address: string | undefined): boolean =>
  address === "127.0.0.1" ||
  address === "::1" ||
  address === "::ffff:127.0.0.1";

const targetPath = (
  requestUrl: string,
  scope: DesktopMcpTunnelScope,
): string | null => {
  const parsed = new URL(requestUrl, "http://127.0.0.1");
  const suffix = parsed.search;
  if (parsed.pathname === "/mcp") {
    return `${scope === "full_helix_agent"
      ? "/mcp"
      : "/mcp/local-supervisor-coordination"}${suffix}`;
  }
  if (parsed.pathname === "/.well-known/oauth-protected-resource/mcp") {
    return `${scope === "full_helix_agent"
      ? "/.well-known/oauth-protected-resource/mcp"
      : "/.well-known/oauth-protected-resource/mcp/local-supervisor-coordination"}${suffix}`;
  }
  return null;
};

const forwardedHeaders = (
  headers: http.IncomingHttpHeaders,
): http.OutgoingHttpHeaders => {
  const result: http.OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (
      value === undefined ||
      name === "host" ||
      name === "connection" ||
      name === "proxy-connection" ||
      name === "keep-alive" ||
      name === "transfer-encoding" ||
      name === "upgrade"
    ) continue;
    result[name] = value;
  }
  return result;
};

export type DesktopMcpTunnelScopeRouter = Readonly<{
  origin: string;
  getScope: () => DesktopMcpTunnelScope;
  setScope: (scope: DesktopMcpTunnelScope) => void;
  close: () => Promise<void>;
}>;

export const startDesktopMcpTunnelScopeRouter = async (input: {
  runtimeOrigin: string;
  initialScope?: DesktopMcpTunnelScope;
}): Promise<DesktopMcpTunnelScopeRouter> => {
  const runtime = new URL(input.runtimeOrigin);
  if (
    runtime.protocol !== "http:" ||
    runtime.hostname !== "127.0.0.1" ||
    !runtime.port ||
    runtime.pathname !== "/" ||
    runtime.username ||
    runtime.password ||
    runtime.search ||
    runtime.hash
  ) throw new Error("desktop_mcp_scope_router_runtime_invalid");

  let scope = input.initialScope ?? READ_ONLY_SCOPE;
  const server = http.createServer((request, response) => {
    if (!isLoopback(request.socket.remoteAddress)) {
      response.writeHead(403, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: false, error: "loopback_required" }));
      return;
    }
    const path = targetPath(request.url ?? "/", scope);
    if (!path) {
      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: false, error: "route_not_found" }));
      return;
    }
    const upstream = http.request({
      protocol: runtime.protocol,
      hostname: runtime.hostname,
      port: runtime.port,
      method: request.method,
      path,
      headers: forwardedHeaders(request.headers),
    }, (upstreamResponse) => {
      response.writeHead(
        upstreamResponse.statusCode ?? 502,
        forwardedHeaders(upstreamResponse.headers),
      );
      upstreamResponse.pipe(response);
    });
    upstream.on("error", () => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(502, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: false, error: "upstream_unavailable" }));
    });
    request.on("aborted", () => upstream.destroy());
    request.pipe(upstream);
  });
  server.on("clientError", (_error, socket) => socket.destroy());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address() as AddressInfo;
  let closed = false;
  return Object.freeze({
    origin: `http://127.0.0.1:${address.port}`,
    getScope: () => scope,
    setScope: (nextScope) => {
      scope = nextScope;
    },
    close: async () => {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()),
      );
    },
  });
};
