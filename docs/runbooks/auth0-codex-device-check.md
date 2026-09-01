# Auth0 + Codex Device Check release runbook

## Intended user experience

1. The user installs the signed CasimirBot desktop application.
2. The user selects **Connect to Codex** in CasimirBot.
3. Codex opens the packaged `casimirbot-device-check` plugin and asks the user
   to install it.
4. Codex opens Auth0 Universal Login and asks for the least-privilege
   `helix.rooms.read` grant plus the non-capability `offline_access` session
   continuity scope.
5. Codex can call only `helix_environment_device_check` at
   `https://casimirbot.com/mcp/device-check`.

The installer supplies all CasimirBot software. Plugin installation and OAuth
consent remain explicit Codex/user actions. CasimirBot never edits Codex
configuration, handles Codex session tokens, or embeds the Codex runtime.

## Auth0 tenant profile

- Create an Auth0 API with identifier `https://casimirbot.com/mcp`.
- Use signed RS256 access tokens and publish the tenant JWKS.
- Define the API permission `helix.rooms.read`.
- Enable Auth0's manual Client ID Metadata Document registration and import the
  OpenAI-hosted CIMD URL presented for this MCP client.
- Grant that client user-delegated access to `helix.rooms.read` only.
- Enable **Allow Offline Access** for the exact Auth0 API and allow the exact
  public Codex MCP client to request `offline_access`. Verify that an initial
  authorization-code exchange returns a refresh token to Codex. The refresh
  token remains in the external client's credential custody and must never be
  copied into CasimirBot, a chat, logs, or acceptance evidence.
- Configure Universal Login and a test user that is allowed to receive that
  permission.
- Create a separate **Native** Auth0 application for CasimirBot desktop account
  linking. Register `casimirbot://oauth/callback` as its allowed callback URL,
  keep token endpoint authentication at `none`, and do not issue or package a
  client secret. This public client is distinct from OpenAI's CIMD registration.
- Include a signed tenant identity through a reviewed Auth0 Action using the
  exact collision-resistant claim configured by
  `HELIX_AGENT_OAUTH_TENANT_CLAIM` (recommended:
  `https://casimirbot.com/tenant_id`). Auth0 currently documents that
  third-party CIMD clients do not support Organizations, so do not base the
  OpenAI CIMD flow on an `organization` parameter or assume `org_id` exists.

Do not use an Auth0 Management API token as an MCP access token. Do not place
tenant administration credentials, client secrets, authorization codes, or
bearer tokens in Git, the desktop package, updater metadata, logs, or the
plugin.

### Native fresh-MFA step-up Action

SPB-3 uses the reviewed Action source at
`auth0/actions/casimirbot-post-login.cjs`. Its public tenant and Native-client
identifiers must exactly match the deployment profile. Enable exactly the
approved owner factor, deploy the Action in the post-login flow, and retain the
existing signed tenant claim behavior. The Action forces MFA only when the
exact Native/public client requests exactly the multi-factor ACR. It disables
remembered-browser bypass for that ceremony. Ordinary MCP and website logins
do not trigger this branch. These pinned identifiers are not credentials; do
not add a client secret to the Native/public application.

The Auth0 tenant must actually issue `acr` equal to
`http://schemas.openid.net/pape/policies/2007/06/multi-factor` and `amr`
containing `mfa`. A successful password or social login, an `acr_values`
request, or an enabled dashboard checkbox alone is not acceptance evidence.
Verify the installed EXE receives a fresh token with those claims and a valid
`auth_time`, then complete device register, restart, revoke, recovery, and
other-session revoke as separate one-purpose ceremonies.

The native authorization request uses a bounded `max_age` (five minutes by
default, configurable only from 60 through 900 seconds) and does not send
`prompt=login`. Auth0 may therefore reuse a primary SSO authentication only
while its signed `auth_time` remains inside that window. The exact-client Action
still forces a new MFA challenge with remembered-browser bypass disabled for
every one-purpose request. This avoids asking for the password before every
TOTP without treating an old primary login or a prior MFA receipt as fresh.

Factor-plan labels are a deployment dependency. If the chosen TOTP, WebAuthn,
or passkey factor is available only during a trial or on a paid Auth0 tier,
record that as a production deployment blocker; do not silently fall back to
SMS, disable MFA, or broaden the Action to every client.

## G2 local Codex CLI full-action client

The environment-harness A1 route is distinct from Device Check and desktop
account linking. It needs the full local `/mcp` resource plus explicitly
delegated `helix.rooms.read`, `helix.environment_actions.read`, and
`helix.environment_actions.write` scopes.

Prefer one pre-registered Auth0 **Native/public** client over enabling
tenant-wide dynamic client registration:

- callback base: `http://127.0.0.1:8766/callback`;
- allowed callback URL: the full Codex-derived URI
  `http://127.0.0.1:8766/callback/<server-specific-callback-id>`;
- authorization-code flow with PKCE `S256`;
- token endpoint authentication method `none`;
- no client secret;
- API audience equal to the resource advertised by local
  `/.well-known/oauth-protected-resource/mcp`;
- only the three G2 scopes above for this acceptance client.

For the G2 direct-local acceptance route, Codex uses the exact MCP transport URL
as its RFC 8707 resource indicator. Register a separate Auth0 API whose
identifier is exactly `http://127.0.0.1:1522/mcp`, with only the three G2 scopes
listed above. In non-production only, the keyed server accepts that exact
port-derived loopback audience in addition to its configured canonical
audience. Production continues to accept only the configured canonical
audience; never add a wildcard, arbitrary host, or arbitrary caller-selected
audience. The guarded packaged-desktop tunnel remains a separate release path.

Credential-free discovery preflight:

```powershell
npx tsx scripts/helix-codex-mcp-oauth-preflight.ts `
  --base-url http://127.0.0.1:1522 `
  --callback-port 8766 `
  --out artifacts/g2-fluid-parity/a1-oauth-preflight.json
```

Codex treats `mcp_oauth_callback_url` as a base and appends a stable
server-specific callback ID. Auth0 requires exact redirect matching and does
not support a wildcard in the path. After creating the public client, run one
Codex MCP login, obtain the derived `redirect_uri` from the authorization URL
or the Auth0 callback-mismatch tenant log, validate that it is the expected
loopback host/port and one opaque path segment, and register that full exact
URI. Do not register `callback/*`.

Then rerun the preflight with both `--oauth-client-id <public-client-id>` and
`--derived-callback-url <full-derived-uri>`. A ready result proves metadata,
scopes, PKCE and callback shape only; it does not prove user consent, token
audience, account binding, or an MCP action.

Configure the local Codex profile with the public Client ID and resource, then
use the fixed callback for login:

```powershell
node node_modules/@openai/codex/bin/codex.js mcp add casimirbot_local `
  --url http://127.0.0.1:1522/mcp `
  --oauth-client-id <public-client-id>

node node_modules/@openai/codex/bin/codex.js mcp login casimirbot_local `
  --scopes helix.rooms.read,helix.environment_actions.read,helix.environment_actions.write `
  -c mcp_oauth_callback_port=8766 `
  -c 'mcp_oauth_callback_url="http://127.0.0.1:8766/callback"'
```

Do not pass `--oauth-resource` for this profile. CasimirBot's protected-resource
metadata is the single RFC 8707 resource authority. Supplying the same resource
again through a Codex override can serialize duplicate `resource` parameters;
Auth0 then rejects the request because the resource is an array rather than one
string.

The login and subsequent A1 call remain explicit user/Codex actions. The
preflight never registers a client, opens a browser, obtains a token, modifies
Codex configuration, or performs an environment action.

### G8 semantic-monitor client scope

The G8 M3 installed-client course extends the G2 action profile with exactly
`helix.agent_runs.write`. The monitor is bound to a server-validated durable
run, so advertising monitor tools while issuing only the three G2 scopes makes
interactive login appear successful but causes `helix_run_start` to fail with
`insufficient_scope`.

Before asking an operator to consent, define `helix.agent_runs.write` on the
Auth0 API whose identifier is exactly `http://127.0.0.1:1522/mcp`, grant that
permission to the same local Native/public client and test user, and run:

```powershell
npx tsx scripts/helix-codex-mcp-oauth-preflight.ts `
  --base-url http://127.0.0.1:1522 `
  --callback-port 8766 `
  --capability-profile g8-monitor `
  --oauth-client-id <public-client-id> `
  --derived-callback-url <full-derived-uri>
```

The resulting `required_scopes` must contain the three G2 scopes plus
`helix.agent_runs.write`. The authorization request and the issued bearer token
must both contain that same four-scope bundle. A successful callback alone is
not sufficient evidence: make one sanitized `helix_run_start` scope probe and
stop on `insufficient_scope` instead of sending the user through another
identical login or restart sequence. Do not substitute a developer session,
reuse an unrelated run, or weaken the monitor's run-binding requirement.

## CasimirBot deployment configuration

Configure these values only in the deployment secret/configuration store:

```text
CASIMIR_PUBLIC_BASE_URL=https://casimirbot.com
HELIX_AGENT_OAUTH_ISSUER=https://<tenant>.<region>.auth0.com/
HELIX_AGENT_OAUTH_AUDIENCE=https://casimirbot.com/mcp
HELIX_AGENT_OAUTH_JWKS_URL=https://<tenant>.<region>.auth0.com/.well-known/jwks.json
HELIX_AGENT_OAUTH_PROVIDER=auth0
HELIX_AGENT_OAUTH_ALGORITHMS=RS256
HELIX_AGENT_OAUTH_TENANT_CLAIM=https://casimirbot.com/tenant_id
HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID=<public-native-client-id>
HELIX_AGENT_OAUTH_LINK_SCOPE=openid profile helix.friends_parties
HELIX_FRIENDS_PARTIES_COORDINATION_ORIGIN=https://casimirbot.com
HELIX_AGENT_ALLOWED_HOSTS=casimirbot.com
HELIX_AGENT_ALLOWED_ORIGINS=https://casimirbot.com
```

The provider alias must exactly match the alias persisted by the trusted
account-link adapter. The token subject and signed tenant must map to an active
CasimirBot profile and active agent binding; a valid Auth0 token alone is not
account admission.

`helix.friends_parties` is a first-party coordination-session scope, not an
MCP tool or environment-action scope. The exact Native/public client may
exchange that verified proof for a domain `HttpOnly` session whose database
expiry is capped by the access-token expiry. The installed native broker holds
that cookie only in memory and proxies only `/api/agi/friends-parties`; it does
not return the Auth0 bearer or domain cookie to the renderer, loopback service,
model, logs, or durable state. If the exact HTTPS coordination origin, scope,
native client, or broker grant is absent, the installed Friends & Parties route
fails closed.

For the installed desktop pilot, the native host overrides
`CASIMIR_PUBLIC_BASE_URL` with the exact per-launch `127.0.0.1` service origin.
That private metadata URL is intentional: `tunnel-client` fetches it on the
device and OpenAI Secure MCP Tunnel rewrites the protected-resource URL to the
public endpoint for the same tunnel. Production HTTP is admitted only when the
native host sets `CASIMIR_DESKTOP_HOST=1`, the host is exactly `127.0.0.1`, and
an explicit port is present. Auth0 remains publicly reachable. The website
deployment keeps the canonical `https://casimirbot.com` value.

## Trusted desktop account-link adapter gate

The desktop source includes the dedicated Auth0 Native/PKCE adapter around the
existing single-use account-link store. Before public enablement, validate its
deployment profile and live flow. The adapter must:

- begin from an authenticated same-origin CasimirBot session;
- use hashed, expiring, single-use state and PKCE;
- validate the exact Auth0 issuer, API audience, subject, signed tenant, and
  provider alias before completing the link;
- commit the provider link and agent binding transactionally to the current
  CasimirBot profile;
- never accept caller-supplied identity fields as authority;
- never persist or project access tokens, refresh tokens, authorization codes,
  or raw callback credentials.

The renderer starts the link from the current cookie-authenticated profile. The
Electron host admits only the configured Auth0 `/authorize` URL, Windows returns
the exact custom-protocol callback to the app, and the host relays it to the
loopback service under the per-launch desktop session secret. The service
exchanges the code with PKCE, verifies the API access token against the exact
issuer/audience/JWKS/tenant claim, and only then consumes the binding intent.

Source presence and deterministic tests do not satisfy this gate. Record a live
successful link, denial, wrong-state callback, wrong-tenant token, and app
restart/expired-intent case against the release Auth0 tenant.

The existing sanitized binding status endpoint may confirm that a binding is
active, but `oauth_ready: true` does not prove the external OAuth flow works.

## Conformance gate

Keep `.agents/plugins/marketplace.json` at `NOT_AVAILABLE` until all checks pass:

- `GET /.well-known/oauth-protected-resource/mcp/device-check` returns JSON
  with the canonical audience, the exact Auth0 issuer, the single capability
  scope `helix.rooms.read`, and the non-capability session-continuity scope
  `offline_access`.
- Auth0 issues a refresh token when Codex requests the advertised
  `offline_access` scope, Codex retains it across an app restart, and a harmless
  Device Check succeeds without another login. `offline_access` is never
  accepted as tool, environment, mutation, answer, or terminal authority.
- An unauthenticated request to `/mcp/device-check` returns a `401` challenge
  whose `resource_metadata` points to that narrow metadata URL.
- Authenticated `initialize` and `tools/list` return exactly
  `helix_environment_device_check`.
- Missing scope, wrong audience, wrong issuer, wrong tenant, wrong subject,
  revoked binding, and locked account policy all fail closed.
- A valid owner-scoped request returns only the bounded Device Check projection
  and no credentials, device public keys, raw observations, assistant answer,
  or terminal-eligible content.
- The signed desktop package passes its marketplace integrity receipt and opens
  the Codex install surface only from a user click.

Only after the deployed flow passes should release review change the plugin
policy to `AVAILABLE`, refresh the plugin cache-buster, rebuild the signed
installer, and repeat the packaged launch and Codex consent test.
