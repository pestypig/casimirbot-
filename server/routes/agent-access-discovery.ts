import { Router, type NextFunction, type Request, type Response } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveCasimirPublicBaseUrl } from "../services/public-base-url";
import { buildWorkstationEntryUrl } from "@shared/workstation-link-meta";

const DISCOVERY_CACHE_CONTROL = "public, max-age=300";

const MCP_CORE_TOOLS = [
  "helix_run_start",
  "helix_run_evidence_reenter",
  "helix_run_continue",
  "helix_run_inspect",
  "helix_run_fetch_evidence",
  "helix_run_list_events",
  "helix_run_cancel",
] as const;

type AgentAccessUrls = {
  agentAccess: string;
  manifest: string;
  mcp: string;
  rest: string;
  rooms: string;
  oauthProtectedResource: string;
  documentation: string;
  workstation: string;
  sitemap: string;
};

const agentAccessUrls = (): AgentAccessUrls => {
  const base = resolveCasimirPublicBaseUrl();
  return {
    agentAccess: `${base}/agent-access`,
    manifest: `${base}/agent-access.json`,
    mcp: `${base}/mcp`,
    rest: `${base}/api/v1/agent-runs`,
    rooms: `${base}/api/v1/rooms`,
    oauthProtectedResource:
      `${base}/.well-known/oauth-protected-resource/mcp`,
    documentation: `${base}/docs/architecture/helix-agent-api-v1.md`,
    workstation: buildWorkstationEntryUrl({
      baseUrl: base,
      search: "?panels=agent-access&focus=agent-access",
      entry: "workstation",
    }),
    sitemap: `${base}/sitemap.xml`,
  };
};

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );

const escapeXml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );

const setPublicDiscoveryHeaders = (res: Response): void => {
  res.setHeader("Cache-Control", DISCOVERY_CACHE_CONTROL);
  res.setHeader("X-Content-Type-Options", "nosniff");
};

type AgentAccessDiscoveryRouterDependencies = {
  readDocumentation?: () => Promise<string>;
};

const readAgentApiDocumentation = (): Promise<string> =>
  readFile(
    path.resolve(
      process.cwd(),
      "docs",
      "architecture",
      "helix-agent-api-v1.md",
    ),
    "utf8",
  );

const renderAgentAccessHtml = (urls: AgentAccessUrls): string => {
  const link = (url: string, label: string): string =>
    `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  const codeLink = (url: string): string =>
    `<code>${link(url, url)}</code>`;
  const tools = MCP_CORE_TOOLS
    .map((tool) => `<li><code>${escapeHtml(tool)}</code></li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agent Access | CasimirBot</title>
  <meta name="description" content="Connection information for CasimirBot's provider-neutral Helix external-agent service.">
  <link rel="canonical" href="${escapeHtml(urls.agentAccess)}">
  <link rel="alternate" type="application/json" href="${escapeHtml(urls.manifest)}" title="CasimirBot Agent Access metadata">
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; background: #07111f; color: #e6edf7; }
    body { margin: 0; }
    main { max-width: 880px; margin: 0 auto; padding: 3rem 1.25rem 5rem; }
    h1, h2 { line-height: 1.2; }
    h1 { font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: .5rem; }
    h2 { margin-top: 2.5rem; }
    p, li, td, th { line-height: 1.65; }
    a { color: #68d8ff; }
    code { overflow-wrap: anywhere; color: #b7f7d8; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #29405b; padding: .75rem; text-align: left; vertical-align: top; }
    .notice { border: 1px solid #3c6384; border-radius: .75rem; padding: 1rem; background: #0d2034; }
  </style>
</head>
<body>
<main>
  <header>
    <p>CasimirBot / Helix</p>
    <h1>Agent Access</h1>
    <p>Connection information for the provider-neutral CasimirBot external-agent harness.</p>
  </header>

  <section class="notice" aria-labelledby="connection-required">
    <h2 id="connection-required">An explicit connection is required</h2>
    <p>A model that retrieves this public page can read and cite it, but retrieval alone cannot invoke CasimirBot tools. A user, application developer, plugin, or surrounding agent harness must configure the MCP endpoint and authorize access.</p>
    <p>Credentials belong in the client's OAuth connection. Do not put access tokens or secrets in prompts or URLs.</p>
  </section>

  <section aria-labelledby="service-endpoints">
    <h2 id="service-endpoints">Service endpoints</h2>
    <table>
      <thead><tr><th>Surface</th><th>Canonical URL</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td>MCP</td><td>${codeLink(urls.mcp)}</td><td>OAuth-protected, stateless Streamable HTTP MCP requests.</td></tr>
        <tr><td>Durable-run REST API</td><td>${codeLink(urls.rest)}</td><td>OAuth-protected durable run lifecycle.</td></tr>
        <tr><td>Shared Live Room REST API</td><td>${codeLink(urls.rooms)}</td><td>OAuth-protected room, run-binding, and deferred source control.</td></tr>
        <tr><td>OAuth metadata</td><td>${codeLink(urls.oauthProtectedResource)}</td><td>Protected-resource discovery for authorization clients.</td></tr>
        <tr><td>API contract</td><td>${codeLink(urls.documentation)}</td><td>Run lifecycle, schemas, scopes, and safety boundaries.</td></tr>
        <tr><td>Workstation</td><td>${codeLink(urls.workstation)}</td><td>Human-facing connection and configuration surface.</td></tr>
        <tr><td>CasimirBot metadata</td><td>${codeLink(urls.manifest)}</td><td>Machine-readable links from this page; not a standards-defined manifest.</td></tr>
      </tbody>
    </table>
  </section>

  <section aria-labelledby="mcp-tools">
    <h2 id="mcp-tools">Core durable-run MCP tools</h2>
    <p>These are the stable run-lifecycle tools. The authenticated MCP <code>tools/list</code> response is the source of truth for the complete catalog, including Shared Live Room tools. Each tool declares its complete required OAuth scope set, which is enforced when called.</p>
    <ul>${tools}</ul>
  </section>

  <section aria-labelledby="run-model">
    <h2 id="run-model">Durable run model</h2>
    <p>Clients start a bounded run, retain its opaque <code>run_id</code>, and continue or inspect that same run. Results include structured status, evidence references, unresolved requirements, and recommended next actions.</p>
  </section>
</main>
</body>
</html>`;
};

const buildAgentAccessManifest = (urls: AgentAccessUrls) => ({
  metadata_kind: "casimirbot.agent_access",
  metadata_version: "1",
  standard: false,
  notice:
    "CasimirBot-specific discovery metadata; this is not an MCP, OAuth, OpenAPI, or provider-standard manifest.",
  name: "CasimirBot Helix external-agent harness",
  description:
    "A provider-neutral durable specialist-run and Shared Live Room control service exposed through REST and Streamable HTTP MCP.",
  canonical_url: urls.agentAccess,
  connection: {
    explicit_configuration_required: true,
    user_authorization_required: true,
    retrieval_only_clients_can_invoke: false,
  },
  mcp: {
    url: urls.mcp,
    transport: "streamable_http",
    session_model: "stateless_transport_with_durable_run_ids",
    authentication: "oauth_2_bearer",
    tools: MCP_CORE_TOOLS,
    tools_semantics: "core_tools; use authenticated MCP tools/list for the complete catalog; complete per-tool OAuth scope sets are enforced on invocation",
  },
  rest: {
    base_url: urls.rest,
    room_base_url: urls.rooms,
    api_version: "v1",
    authentication: "oauth_2_bearer",
  },
  oauth: {
    protected_resource_metadata_url: urls.oauthProtectedResource,
  },
  links: {
    human_discovery: urls.agentAccess,
    api_contract: urls.documentation,
    workstation: urls.workstation,
  },
});

export const createAgentAccessDiscoveryRouter = (
  dependencies: AgentAccessDiscoveryRouterDependencies = {},
): Router => {
  const router = Router();
  const readDocumentation =
    dependencies.readDocumentation ?? readAgentApiDocumentation;

  router.get(
    "/agent-access",
    (_req: Request, res: Response, next: NextFunction): void => {
      try {
        const urls = agentAccessUrls();
        setPublicDiscoveryHeaders(res);
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        );
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader(
          "Link",
          `<${urls.manifest}>; rel="alternate"; type="application/json"`,
        );
        res.status(200).type("html").send(renderAgentAccessHtml(urls));
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/agent-access.json",
    (_req: Request, res: Response, next: NextFunction): void => {
      try {
        const urls = agentAccessUrls();
        setPublicDiscoveryHeaders(res);
        res.setHeader("Link", `<${urls.agentAccess}>; rel="canonical"`);
        res.status(200).json(buildAgentAccessManifest(urls));
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/docs/architecture/helix-agent-api-v1.md",
    async (
      _req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const documentation = await readDocumentation();
        setPublicDiscoveryHeaders(res);
        res
          .status(200)
          .type("text/markdown")
          .send(documentation);
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/robots.txt",
    (_req: Request, res: Response, next: NextFunction): void => {
      try {
        const urls = agentAccessUrls();
        setPublicDiscoveryHeaders(res);
        res
          .status(200)
          .type("text/plain")
          .send(
            [
              "User-agent: *",
              "Allow: /",
              "Disallow: /api/",
              "Disallow: /mcp",
              "",
              `Sitemap: ${urls.sitemap}`,
              "",
            ].join("\n"),
          );
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/sitemap.xml",
    (_req: Request, res: Response, next: NextFunction): void => {
      try {
        const urls = agentAccessUrls();
        setPublicDiscoveryHeaders(res);
        res
          .status(200)
          .type("application/xml")
          .send(
            [
              '<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
              "  <url>",
              `    <loc>${escapeXml(urls.agentAccess)}</loc>`,
              "    <changefreq>weekly</changefreq>",
              "  </url>",
              "</urlset>",
              "",
            ].join("\n"),
          );
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};
