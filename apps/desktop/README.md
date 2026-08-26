# CasimirBot desktop host

This directory is the isolated Windows-first native host. It does not own the
Helix/Codex reasoning loop, tool admission, evidence authority, approvals, or
terminal completion.

## Current alpha boundary

- The native main process generates a 256-bit per-launch session secret.
- It starts the existing compiled server with desktop mode forced onto
  `127.0.0.1` and a reserved ephemeral port.
- The secret is passed only in the child environment and is redacted from
  forwarded service logs.
- The child inherits only a small Windows process environment allowlist and is
  explicitly forbidden from loading the repository `.env`; provider and
  pairing credentials are not inherited into the desktop service.
- A private developer pilot may inherit `HELIX_DEVELOPER_PROFILE_IDS` as an
  exact identity-policy allowlist. It is not a password or bearer credential,
  does not create an account, and cannot replace first-run profile creation in
  the desktop-local account store. Without an exact match, production remains
  `user`.
- The local pg-mem snapshot is pinned beneath Electron's per-user `userData`
  directory, outside the installed runtime tree. Atomic streaming writes are
  immediate so a Windows child-process shutdown cannot strand deferred state.
- Electron injects the secret only into HTTP and WebSocket requests whose exact
  origin matches the selected loopback service.
- The sandboxed renderer receives only a typed runtime/capability snapshot via
  preload IPC. It never receives the session secret.
- The host includes a pinned, SHA-256-verified OpenAI `tunnel-client` binary and
  its Apache-2.0 license. The binary is fetched only from the pinned official
  release during the build and is re-hashed after staging and packaging.
- A user-entered tunnel ID and restricted runtime API key are encrypted with
  Electron `safeStorage` for the current Windows account. Neither value enters
  the service child, renderer state, argv, checked-in profiles, or logs.
- The supervised tunnel receives only the runtime key, tunnel ID, and an
  ephemeral desktop-session header reference in its child environment. That
  header is scoped by `tunnel-client` to the exact loopback Device Check MCP
  origin. The local admin UI binds to an ephemeral loopback port.
- Tunnel `ready` means the official `/readyz` probe passed after a successful
  control-plane poll; process launch alone is reported as `starting` or
  `degraded`. App shutdown stops the exact supervised tunnel child.
- Window creation denies popups and navigation away from the local origin.
- The Electron session denies browser permission checks/requests, device
  permissions, and renderer-initiated downloads. Signed updates use only the
  main-process updater.

## Runtime surfaces

The packaged application is now a first-class local Helix Ask smoke surface,
but it remains separate from both the repository's provider-keyed debug server
and the OpenAI MCP tunnel:

- **Packaged desktop:** the EXE owns an ephemeral loopback compiled service,
  its per-launch session boundary, the desktop-local profile database, and the
  Helix Ask renderer. Use this for installed startup, account policy, one
  natural runtime-agent prompt, and local Device Check.
- **Keyed repository runtime:** the opaque `start-myapp-for-codex` launcher owns
  the canonical source checkout and live provider configuration. Use this for
  live provider, Realtime, Shared Live Room, connector, and browser/API parity.
- **Desktop MCP tunnel:** the app supervises the pinned OpenAI client and
  exposes only owner-scoped, read-only Device Check to a supported external
  OpenAI surface. It is not the full Helix Ask runtime.

### Convergence target

The product target is one installed CasimirBot node with two primary views of
the same governed work:

- the packaged CasimirBot UI uses the private local API and event stream; and
- Codex or another authorized reasoning client uses the node's MCP facade.

The EXE is the signed host and service supervisor, not the MCP tool by itself.
Both surfaces must resolve the same durable `run_id`, lifecycle facts,
observations, evidence references, cancellation state, serialized execution
lease, and terminal product. They may not create separate answer writers or
competing mutation paths. Hidden reasoning remains private to the reasoning
client; shared lifecycle events and supported products remain inspectable.

This is not the current alpha claim. Today the packaged tunnel exposes only
Device Check, while the opaque repository launcher owns provider-keyed live
testing. A future delivery packet must add native provider enrollment,
full governed catalog publication, managed MCP reconnect/catalog refresh, and
cross-surface run projection before the packaged app can claim complete parity.

Keep these authorization classes separate during that convergence:

1. model-provider authorization belongs to the native CasimirBot provider
   broker and is never copied into Codex MCP configuration;
2. MCP client authorization is a short-lived, least-scope OAuth/PKCE or device
   grant to CasimirBot and cannot become provider authority; and
3. environment credentials remain inside their exact connector or provider
   adapter and never enter model-visible observations.

Normal users must not edit `start-myapp-for-codex`, a replacement command file,
or process arguments to supply keys. The production analogue is a signed
native bootstrap that reads OS-protected credentials, starts exactly one
private service, passes only ephemeral secret handles to bounded children, and
supports enrollment, validation, revocation, rotation, crash recovery, and
sanitized health reporting. Headless deployments may use an approved secret
store reference, never a raw key in argv, logs, chat, MCP results, debug
exports, or repository configuration.

Minecraft Fabric loopback launch and join is intentionally identical in the
localhost browser and packaged EXE. Their shared lifecycle card calls the same
server executor and emits the same
`helix.minecraft.workstation_launch_receipt.v1` receipt. The packaged runtime
stages only the fixed `scripts/helix-minecraft-launch-fabric-loopback.ps1`
provider; it does not grant the renderer a process API, arbitrary executable
selection, shell access, launcher credentials, or Minecraft account material.
Codex may request the same capability only through the trusted confirmation-
bound workstation gateway.

The packaged service does not inherit `OPENAI_API_KEY` or load the repository
`.env`. It can locate the installed Codex binary through the allowed Windows
user paths, so an exact-turn debug export must identify whether a successful
prompt used native `codex_app_server`, compatibility `codex_exec`, Helix
Native, or a typed failure. Never infer the provider transport from the prose
alone and never add provider credentials to the desktop environment allowlist
to force a result.

The repeatable packaged-app procedure and evidence requirements live in
`docs/runbooks/desktop-release-and-update.md`; the surface-selection decision
and keyed/browser comparison live in
`docs/helix-ask-readiness-debug-loop.md`.

Build the root client and desktop host before launching in development. The
desktop host command builds its own production service bundle:

```powershell
npm run build:client
npm --prefix apps/desktop run build:host
```

After `build:host`, the deterministic boundary smoke test can verify the
compiled child without loading `.env` or starting a keyed provider. It uses a
disposable per-test state root, proves a public owner session is persisted, and
confirms Device Check remains policy-closed until its user release gate opens:

```powershell
npm --prefix apps/desktop run smoke:service-boundary
```

After directory packaging, launch the exact unpacked application against a
disposable local-drive `--user-data-dir`, verify its one loopback listener and
isolated Electron profile, monitor the workstation thresholds, and clean only
that exact process tree and temporary root. The override rejects relative and
UNC paths and is intended for contained diagnostics/portable testing. Snapshot
creation after a real database mutation is covered by
`smoke:service-boundary`:

```powershell
npm --prefix apps/desktop run smoke:packaged-launch
```

Use the explicit bounded compiler path for the isolated host:

```powershell
node --max-old-space-size=512 apps/desktop/node_modules/typescript/bin/tsc -p apps/desktop/tsconfig.json --noEmit
```

Before preparing a commit, run the read-only slice audit:

```powershell
npm --prefix apps/desktop run release:audit-slice
```

It identifies whole-file desktop candidates, shared integration files that
require hunk review, and unrelated worktree changes that must remain untouched.
It never stages files. The exact slice manifest hash is carried into runtime and
release manifests so the reviewed boundary is part of release identity.

## Release gate

`build:host` produces a desktop-specific service bundle and disables the
development-only Vite middleware at build time. `sharp` is the only required
top-level service package left external, and it shares the desktop app's exact
lockfile with `electron-updater`. `stage:runtime` remains allowlist-only and now
records the service, client tree, and lockfile hashes with
`dependencyClosureStatus: staged_verified`.

The production workflow refuses to build unless the version tag, clean commit,
runtime manifest, exact dependency lock, signing inputs, and Casimir adapter are
present. It then verifies Authenticode, `latest.yml` SHA-512 values, and the
Casimir certificate before a protected GitHub environment can publish. The
runtime and release manifests must also match the source
`release-slice.v1.json` SHA-256. Copying
the root `node_modules`, repository, `.local`, `.tmp`, artifacts, simulations,
or credentials into the installer remains forbidden.

The renderer validates the preload snapshot against the exact current
`127.0.0.1` origin before enabling presentation hints. Failed handshakes leave
all native capabilities disabled. A private developer pilot can reach the
OAuth-protected, read-only Device Check MCP through OpenAI Secure MCP Tunnel.
The public plugin remains a separate production path and stays locked until its
Auth0 and Codex acceptance gate passes. Neither path copies the per-launch
desktop session secret into Codex configuration.

The desktop account-link lane uses a separate Auth0 Native public client with
S256 PKCE and the registered `casimirbot://oauth/callback` protocol. The
renderer receives only a validated authorization URL and sanitized completion
receipt. The authorization code, PKCE verifier, access token, and provider
subject remain in the app-only host/service boundary and are never persisted or
sent to Codex. No Auth0 client secret belongs in the app.

No session keeps the public `user` policy, but the owner-scoped Device Check
still requires a signed-in profile or the explicit guest Shared Live Room flow.
The desktop host does not synthesize an identity or elevate that account gate.
The installed app intentionally does not copy website or repository password
credentials into its private per-user database. On a fresh installation, use
**Create profile** once before **Sign in**. A developer pilot receives developer
policy only when that new profile's exact ID, verified email, or provider
subject is present in the trusted `HELIX_DEVELOPER_PROFILE_IDS` configuration.
The guarded HTTP loopback host is the sole production lane permitted to use a
non-`Secure` session cookie; normal production HTTP remains unable to retain a
session.

The updater is deliberately user-driven: checking, downloading, and restarting
to install are separate native IPC actions. Automatic downloads, install-on-
quit, web installers, and downgrades are disabled. See
`docs/runbooks/desktop-release-and-update.md` for release and rollback steps.
