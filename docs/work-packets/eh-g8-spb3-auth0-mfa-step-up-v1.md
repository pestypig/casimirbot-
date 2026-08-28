Program gate: G8 — Environment-harness release evaluation
Workstream: EXE-first subscriptions, provider connections, and user-authorized agent capability
Capability or component: SPB-3 Auth0 MFA, one-purpose step-up receipts, and installed device/session security
Lifecycle stage: profile identity → fresh MFA proof → one-purpose receipt → exact device/session operation → consume or revoke
Reaction timescale: owner-attended authentication only; no autonomous retry or renewal
Authority owner: Auth0 owns factor enrollment and the signed authentication ceremony; the Casimir private service validates exact claims and owns receipt/device/session state; the installed native host owns the callback and usable receipt token; the profile owner completes MFA and confirms recovery or revocation; Runtime Codex may inspect sanitized readiness only
Current maturity: live accepted
Target maturity: live accepted on one installed Windows node with one passkey or authenticator-app TOTP factor
Required evidence: exact Auth0 issuer/client/callback binding; PKCE and nonce; signed ID-token validation; `acr`, `amr`, and `auth_time` freshness; one-purpose profile/session/device-bound receipts; expiry and one-use replay denial; restart invalidation; registered-device lifecycle; session listing and revocation; recovery fail-closed behavior; no factor, ID/access token, receipt token, recovery code, or provider secret in renderer, MCP, model, logs, process arguments, debug export, or room state; deterministic route/store/native/UI tests; and one owner-attended live enrollment, new-device, revoke, and recovery trace
Explicit non-goals: no Casimir-owned MFA factor store; no SMS-only high-risk authority; no agent completion of MFA; no web-only device acceptance; no provider credential enrollment; no payment, entitlement, top-up, refund, budget, billable lease, provider traffic, public MCP grant, signed-pilot, or G8-closure claim
Downstream gate unlocked: SPB-4 payment and entitlement work may consume a verified one-purpose step-up receipt without learning factor or identity-token material

# EH-G8 SPB-3 Auth0 MFA and fresh step-up v1

## Active stage

SPB-3 is complete and live accepted in the canonical EXE-first subscription
and provider-access broker packet. This packet records SPB-3 only. SPB-4 is
unblocked but has not started; SPB-5 through SPB-9 remain blocked.

## Frozen security contract

1. The installed host uses Authorization Code with PKCE and a per-request nonce.
2. The request asks Auth0 for the exact multi-factor ACR. An Auth0 Action or
   equivalent tenant policy must actually issue `amr: ["mfa"]`; the request
   parameter alone is not evidence.
3. The private service verifies the ID-token signature, issuer, native client
   audience, nonce, subject, expiry, `acr`, `amr`, and `auth_time`. It also
   verifies the API access token, required `openid` scope, and exact linked
   profile identity.
4. `auth_time` must fall within the configured short freshness window and may
   not be materially in the future.
   The native request carries that bounded `max_age` but not `prompt=login`, so
   Auth0 may reuse only a still-fresh primary SSO authentication while the
   exact-client Action independently forces a new MFA challenge for each
   one-purpose ceremony. The default window is five minutes and the admitted
   configuration range is 60 through 900 seconds.
5. A successful ceremony creates a random one-use token bound to one profile,
   account session, installed device, and enumerated purpose. Only its hash is
   stored by the private service. Only the Electron main process may receive
   the raw token, and it keeps it in volatile memory.
6. The renderer receives a sanitized receipt reference, purpose, creation and
   expiry timestamps, MFA state, and device/session projection. It never
   receives the usable token or Auth0 tokens/claims.
7. Consumption is atomic. Wrong purpose, profile, session, device, expiry,
   revocation, restart, or replay fails closed and records a sanitized event.
8. Device registration, recovery, and session revocation are themselves exact
   receipt-consuming operations. Revocation never removes the owner’s ability
   to sign in again and perform an Auth0-backed recovery ceremony.

## Admitted purposes

- `device_register`
- `device_recover`
- `device_revoke`
- `session_revoke`
- `provider_connection_change`
- `payment_change`
- `usage_ceiling_raise`
- `billable_session_arm`
- `high_scope_agent_bind`

SPB-3 exercises device registration, device revocation, recovery, and session
revocation. The other purposes are schema-frozen for later consumers but do
not enable their SPB-4 through SPB-7 operations.

## Deterministic implementation evidence — 2026-08-27

- The installed host now creates and persists an opaque Windows device ID,
  passes it only to the private child service, validates an exact Auth0
  Authorization Code + PKCE + nonce request, and requires a native purpose
  confirmation before opening the system browser.
- The private service validates the signed access and ID tokens, exact issuer,
  API audience, native-client audience, subject, nonce, `openid` scope, MFA
  ACR, `amr` containing `mfa`, and a five-minute-or-shorter `auth_time` window.
- One-use receipts are random, stored only as hashes, bound to one profile,
  account session, installed device, purpose, and target, and fail closed for
  expiry, replay, revocation, crossed bindings, and service restart.
- Migration `070_installed_security_devices` and the installed security store
  provide sanitized registration, device revoke, recovery generation, session
  list, other-session revoke state, and a bounded owner-visible security
  activity trace. The local snapshot allowlist retains device registration,
  revocation, and recovery generation across EXE restarts; the current session
  remains governed by the ordinary sign-out path.
- The native Device & Security UI exposes owner-auth-required controls only to
  the developer policy. Public/no-session access does not expose the panel;
  the renderer and Runtime Codex receive only sanitized readiness and cannot
  start or complete MFA, receive the usable receipt, or mutate device/session
  state.
- The consolidated SPB-3 battery passes 16 files and 91 tests covering claims,
  scope, freshness, binding, replay, expiry, restart, device/session lifecycle,
  durable device revoke/recovery state, private routes, account policy, UI
  accessibility, native URL admission, stable device identity, child
  environment, exact Auth0 Native-client/ACR Action admission, and
  release-slice integrity.
- Desktop TypeScript, server and production-client builds, packaged host build,
  release-slice audit, environment-harness documentation audit, packaged
  runtime-tree verification, and private loopback service smoke pass.

This evidence established deterministic maturity before the owner-attended
installed trace below. It did not by itself establish live acceptance.

## Live acceptance evidence — 2026-08-27 through 2026-08-28

- Auth0 discovery, exact issuer, HTTPS authorization/token endpoints, configured
  JWKS identity, and two active RSA signing keys were verified without reading
  or retaining a bearer or identity token.
- One installed-EXE device-registration ceremony completed authorization-code
  exchange and signed-token verification, then failed closed as
  `mfa_required`. No receipt or installed-device row was created. This proves
  the tenant did not yet issue the required MFA ACR/AMR; it is negative live
  evidence, not acceptance.
- Authenticator-app TOTP is now enabled in the development Auth0 tenant. The
  tenant still uses the `Never` global policy so ordinary clients are not
  broadened. The reviewed exact-client/one-ACR post-login Action is sealed at
  `auth0/actions/casimirbot-post-login.cjs`, saved, and deployed. The Post Login
  flow reports `All changes are live` with `CasimirBot Signed Tenant Claim`
  between User Logged In and Token Issued. Deterministic Action tests cover the
  exact native client and exact sole MFA ACR plus wrong-client, missing,
  additional, and scalar-ACR fail-closed cases.
- Auth0 labels TOTP as a Pro MFA capability and the tenant is currently inside
  a time-limited trial. A production tier decision remains an explicit release
  dependency; no payment or billing configuration was added.
- The profile owner enrolled authenticator-app TOTP and completed a fresh
  `device_register` ceremony in the installed EXE. The durable device row is
  bound to the installed Windows device ID and the sanitized
  `installed_device_registered` event records only an opaque device reference;
  it explicitly reports that no usable receipt, identity token, or factor
  detail was included.
- After an EXE restart, the same device remained `active`, the current installed
  session remained current, and the registered-device event remained visible
  in Device & Security. This is the packet's one-node new-device/restart trace;
  no second or simulated device identity was substituted.
- A separately confirmed and separately authenticated `session_revoke`
  ceremony changed only the older profile session to `signed_out`. The current
  installed session and installed device remained active, and the sanitized
  `installed_session_revoked` event contained only an opaque session reference.
- A third separately confirmed and authenticated `device_revoke` ceremony
  changed the installed device to `revoked` without signing out the current
  session. The revoked row and sanitized `installed_device_revoked` event
  survived an EXE restart, a fresh NSIS build, and reinstall. The installed
  `CasimirBot.exe` and `resources/app.asar` SHA-256 hashes exactly matched the
  packaged `win-unpacked` artifacts after synchronization.
- Live use exposed an avoidable first-factor loop: the native request combined
  `max_age=0` with `prompt=login`, so every one-purpose TOTP ceremony also
  repeated the password login. The installed build now omits `prompt=login`
  and sends the configured bounded `max_age` (300 seconds by default; admitted
  range 60 through 900). Auth0 may reuse only a primary SSO authentication
  whose signed `auth_time` remains inside that window, while the exact-client
  Action still forces fresh MFA with remembered-browser bypass disabled for
  every purpose. Server validation of `auth_time`, ACR, AMR, nonce, identity,
  scope, and receipt binding is unchanged and fail-closed.
- The profile owner completed a separately confirmed and Auth0-authenticated
  `device_recover` ceremony. The previously revoked device returned to
  `active`, `revoked_at` cleared, and the durable recovery generation advanced
  to `1`. The sanitized `installed_device_recovered` event contains only the
  opaque device reference and explicitly excludes a usable receipt, identity
  token, and factor detail.
- A post-recovery EXE restart preserved the active device, recovery generation
  `1`, current active session, separately signed-out older session, and all four
  sanitized lifecycle events: registration, other-session revocation, device
  revocation, and device recovery.
- Opening Account & Sessions after restart restored the ordinary native/local
  profile session. That convenience is not MFA authority: only the dedicated
  Auth0 step-up callback can mint a one-purpose receipt after exact signed-claim
  validation, and the account panel never receives that usable receipt.
- A post-acceptance process-argument audit found zero sensitive-pattern hits
  across all running CasimirBot processes. Renderer projections and persisted
  event payloads continued to report `usable_receipt_included=false`,
  `identity_token_included=false`, and `factor_detail_included=false`.

The reviewed Action is deployed, the 16-file/91-test deterministic battery
passes, and registration, restart/new-device, other-session revoke, device
revoke, recovery-generation increment, and post-recovery restart now have
owner-attended installed-EXE evidence. SPB-3 is therefore `live accepted` on
one installed Windows node. This promotion enables no payment, entitlement,
provider enrollment, provider traffic, public MCP grant, or billable authority.
Auth0 production-tier selection for TOTP remains a release dependency for a
public pilot and does not transfer this development-tenant evidence to SPB-4.

## Stop/fail criteria

- Auth0 configuration or tenant policy does not return a signed MFA claim.
- A request parameter, account checkbox, remembered browser, refresh token, or
  prior login is treated as fresh MFA evidence.
- Any bearer, ID/access token, raw one-use receipt token, factor detail, or
  recovery code reaches renderer/model-visible state.
- A receipt can be reused, repurposed, crossed between profiles/sessions/devices,
  consumed after expiry/revocation/restart, or consumed non-atomically.
- A public website or public-user account can operate installed-device security.
- Deterministic evidence is promoted to live Auth0 or signed-device acceptance.
