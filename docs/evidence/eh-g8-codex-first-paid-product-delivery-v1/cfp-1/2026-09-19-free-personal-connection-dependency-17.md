# CFP-1 free personal connection dependency checkpoint — 2026-09-19

Status: source inspection for the selected free supported personal MCP offer.
This is a decision input, not installed acceptance, a cost measurement, or a
change to the [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md).
The [environment work program](../../../helix-environment-harness-work-program-v1.md)
remains the sole active-gate and maturity ledger. Source HEAD inspected:
`256554ca2637b2978a83616d9f9670069fdfd8c4`; the shared worktree also
contains uncommitted documentation and unrelated work. No runtime, account,
tunnel, payment, deployment or production setting changed for this checkpoint.

## What the current installation actually provides

| Path or dependency | Source evidence | CFP-1 implication |
| --- | --- | --- |
| Local service and profile state | `apps/desktop/src/main.ts:550–552,689–713` reserves a `127.0.0.1` port and spawns the packaged service there. `apps/desktop/src/service-environment.ts:201–215,252` points it at a local persisted database and publishes the per-launch loopback origin. | A local execution and storage base exists. This does not prove an ordinary user's external client can discover, authenticate to, or call the full MCP catalog. |
| Full MCP route and principal | `server/index.ts:738–775` mounts `/mcp` with the full scope set. `server/routes/helix-mcp.ts:172–194` chooses exact native desktop delegation when protected headers are present, otherwise bearer OAuth. `server/auth/helix-agent-principal.ts:403–456` requires a verified token and an explicit active account link; `:521–564` requires a live desktop session and loopback host for native delegation. | Direct loopback bearer access is a **candidate** for a same-host client, not a supported public connection profile. A web sign-in cookie alone is not an MCP bearer or native delegation. The client location, OAuth audience/issuer, account link and actual tool calls must be tested together. |
| Installed tunnel default | `apps/desktop/src/main.ts:1538–1553` enables a stable `/mcp` route through a loopback scope router. `apps/desktop/src/mcp-tunnel.ts:168–190` sends both scopes to that stable route when enabled; `apps/desktop/src/mcp-tunnel-scope-router.ts:20–28,72–90` forwards to full `/mcp` only for `full_helix_agent` and otherwise to `/mcp/local-supervisor-coordination`. `server/index.ts:695–738` mounts the coordination surface separately. | Tunnel Ready in the default scope is not full personal-tool readiness. The same public tunnel URL can route to different upstream catalogs; coordination shadow entries cannot be advertised as executable environment tools. |
| Full tunnel admission | `apps/desktop/src/main.ts:655–668`, `apps/desktop/src/mcp-tunnel-transition-executor.ts:52–59,127–132`, and `server/services/local-supervisor/desktop-mcp-tunnel-transition-store.ts:323–331` require a developer account for full mode. The [installed full-MCP packet](../../../work-packets/eh-g8-installed-exe-full-mcp-tunnel-v1.md) explicitly excludes ordinary-user full mode. | The present installed tunnel cannot establish the selected free personal journey for a normal `user`. **If the tunnel profile is selected**, CFP-2.PUBLIC needs a narrow ordinary-user personal mode. A selected direct-loopback profile instead needs its own qualified ordinary-user OAuth/client and source/effect path. Both preserve the developer superset and all independent owner/source/lease checks. |
| Published external-client setup | `client/src/lib/agent-access/agentAccessContent.ts:69–90,150–225` presents the public HTTPS Streamable HTTP MCP/OAuth profile. `apps/desktop/src/mcp-tunnel.ts:168–224` supervises a separate tunnel client using a tunnel ID and restricted runtime key. | A published remote URL and an installed private tunnel are different connection paths. The current setup copy does not qualify direct loopback as a customer profile or show a public full-tool tunnel. The exact supported client and route must be selected and measured. |
| Personal source and effect | [Personal/hosted boundary](../../../work-packets/eh-g8-cfp1-personal-hosted-capability-boundary-v1.md) maps the existing room-shaped source, subject, authority and Minecraft handlers. Current base `user` policy locks shared rooms/source ingress; some source creation requires a first-party session; local lifecycle launch is developer-only. | Transport alone cannot complete the personal task. The selected owner-only personal context and first-party setup route must pass with an ordinary account and no hosted subscription. |

## Decision needed before a free-connection promise

The product and MCP owners must select at least one **ordinary-user, full-tool
connection profile** for the first supported external client. The two paths to
test are: (A) an authenticated same-host loopback MCP connection, if the chosen
client can reach that installed node; and (B) a supervised remote-access tunnel
with an ordinary-user personal scope. Either may be selected if its actual
client/location, identity, catalog, effects, recovery and cost evidence passes.
Do not claim that A works merely because `/mcp` listens on loopback, or that B
works merely because the developer tunnel is Ready. A website `/mcp` endpoint
also needs a separate exact route to the user's local program and must not be
assumed to proxy the installed node.

For **each** proposed profile, record:

1. Exact signed artifact, installed node, external-client version/location,
   URL/transport and `tools/list` result. Distinguish full, coordination-only
   and shadow names. Confirm whether the client connects from the same machine
   or from a service that cannot address that loopback origin.
2. Fresh ordinary `user` login/account link, bearer or native delegation,
   scope set, consent, secret custody and renewal. Prove wrong profile, expired
   token, account switch and revoked-device denial without developer promotion.
3. Owner-only personal context/source creation, subject selection, observation,
   one rights-qualified bounded effect, stop, reconnect and supported restart.
   A never-subscribed and an expired-hosted account must both pass; neither may
   gain room membership or another owner's program authority.
4. Outage behavior: disconnect identity provider, domain/database and tunnel
   control plane separately. State which personal operations still work under
   independently valid local authority and which fail closed. Never describe
   the profile as offline until the installed outage cases pass.
5. Cost by active free user and by paying hosted room for identity, tunnel
   control/egress, cloud database, binary delivery/update and support. Capture
   actual provider plan/invoice or metering with date, volume and allocation;
   current source cannot establish a zero-cost personal path or the viability
   of either reported Stripe price.

The [hosted offer brief](../../../work-packets/eh-g8-cfp1-hosted-offer-owner-decision-brief-v1.md)
owns the price worksheet; this checkpoint supplies the personal connection
inputs. CFP-2.PUBLIC/ONBOARD owns ordinary-user implementation and installed
acceptance after CFP-1 closure. CFP-3.COMMERCE may charge for selected hosted
collaboration only, not for repairing a missing personal connection. The
technical Minecraft pilot, paid-room rights review and full G8 release evidence
remain separate.
