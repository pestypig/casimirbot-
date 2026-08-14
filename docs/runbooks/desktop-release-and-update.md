# CasimirBot desktop release and update runbook

## Boundary

The Windows desktop host is a packaging, local-service, and presentation
boundary. It does not own model sampling, generic tool execution, approvals,
sandboxing, compaction, agent orchestration, Helix terminal authority, or answer
authority. Codex integration has two explicit paths: an outbound-only OpenAI
Secure MCP Tunnel for the private developer pilot and the OAuth-protected HTTPS
MCP plugin for public release. The per-launch loopback secret never enters
updater metadata or Codex settings.

The desktop service listens only on `127.0.0.1`, requires a 256-bit per-launch
secret on HTTP and WebSocket requests, and receives a small environment
allowlist. The renderer receives capabilities, update state, user-invoked
update actions, read-only Codex-plugin readiness, and redacted tunnel lifecycle
state through origin-checked IPC; it never receives the desktop secret or a
stored runtime key. The user explicitly supplies a tunnel ID and restricted
runtime key, and can start, stop, inspect, or forget that private connection.
The separate public-plugin write boundary remains a click that opens a fixed
`codex://plugins/...` installation deep link. The host does not edit Codex
configuration or handle an OAuth bearer token.
The Electron session denies browser permission checks/requests, device
permissions, and renderer-initiated downloads. The signed updater remains the
only native download path.

The child has no hosted `DATABASE_URL`. Its pg-mem snapshot must resolve to
`<Electron userData>/state/helix-local-pg-mem.json`, never to the packaged
`resources/runtime` working directory. Persistence stays in immediate mode so
each mutation completes the atomic streaming snapshot before returning; do not
switch the Windows package to deferred writes without a verified graceful
child-shutdown handshake.

That private database does not inherit website or repository password rows. A
fresh EXE login therefore requires **Create profile** before **Sign in**. For a
private developer pilot, provision the exact intended identity in
`HELIX_DEVELOPER_PROFILE_IDS`; the desktop host may pass that policy value but
must not pass local-password hashes, provider secrets, or a default developer
identity. Missing or non-matching policy remains `user`. In production, session
cookies remain `Secure` everywhere except the exact guarded desktop-host
loopback lane, where HTTP is intentional and every request is already bound to
the native per-launch secret.

## Packaged desktop Helix Ask developer smoke

The installed application is a supported local-first operator surface for the
alpha. It is not the same process as the provider-keyed repository runtime. The
EXE starts its own compiled service on a reserved ephemeral loopback port,
injects the per-launch desktop session header into exact-origin renderer
requests, and owns shutdown of that service. It does not invoke or absorb the
opaque `start-myapp-for-codex` launcher.

The desktop environment allowlist intentionally excludes `OPENAI_API_KEY`,
repository `.env` values, injected provider tokens, and pairing credentials.
It does not copy a provider auth store into the packaged runtime. It retains
the Windows paths needed to locate an installed Codex binary, whose client may
use its own user-account boundary. A Helix Ask turn may therefore reach a
bounded installed-Codex compatibility path, but the visible answer alone does
not prove which transport ran. Do not broaden the allowlist to turn this smoke
into a provider-keyed test.

Run the smoke as follows:

1. Apply the workstation memory envelope below and remove only verified
   duplicate CasimirBot, tunnel, keyed-server, build, or test-worker trees.
2. Launch the installed shortcut or exact installed EXE and require the
   sanitized desktop Ready state.
3. Create or sign in to the intended desktop-local profile. Confirm developer
   policy only for an exact trusted developer identity.
4. Open Helix Ask, choose the intended runtime, and submit one natural prompt.
5. Copy the exact visible turn's debug export. Record the selected runtime,
   Codex launchability, native bridge status, compatibility/fallback transport,
   observation re-entry, route-product materialization, and terminal-authority
   result. Never record hidden reasoning, tokens, provider auth state, or the
   desktop session secret.
6. Report `codex_app_server`, `codex_exec`, `helix_native`, or `typed_failure`
   from that evidence. A `codex_exec` completion is useful packaged-desktop
   evidence but is not native app-server parity. A typed failure does not become
   provider acceptance because the UI rendered normally.
7. Exercise Device Check as a separate read-only smoke. Do not claim OpenAI MCP
   tunnel parity unless a supported external OpenAI surface invoked that tool.
8. Close CasimirBot and verify the exact compiled-service and supervised tunnel
   process trees exit. Record memory before, peak, and after.

Use the keyed opaque-launcher plus browser/API workflow in
`docs/helix-ask-readiness-debug-loop.md` when live provider keys, Shared Live
Rooms, GPT Realtime, environment-source capture, or exact browser parity are in
scope. Use the packaged desktop smoke for installed-host and normal operator
experience. Neither result substitutes for the other.

## Build closure

`npm --prefix apps/desktop run build:host` creates the Electron main/preload
bundles, a production-only bundled service, and a receipt proving the service
hash and its sole required external package, `sharp`.

The production bundle replaces the unreachable development Vite branch with a
fail-closed stub. Optional integrations outside the standalone desktop
capability declaration remain unavailable until explicitly packaged.

`stage:runtime` copies only the compiled renderer, two boot-time policy inputs,
the repository marketplace plus `casimirbot-device-check` plugin, and the
pinned official Windows tunnel executable plus license. Its manifest hashes the
service, renderer tree, Codex marketplace tree, tunnel executable, and desktop
lockfile and must say `staged_verified`. The package verifier independently
re-hashes those payloads after Electron Builder copies them. The root
repository, root `node_modules`, secrets, local caches,
simulations, and prior artifacts are never staged.

The tunnel artifact manifest pins the exact official OpenAI GitHub release,
archive SHA-256, executable SHA-256, and license SHA-256. A mismatch fails the
build, staging, and packaged-tree checks. The runtime API key is encrypted for
the current Windows account with Electron `safeStorage`; it is not a build or
deployment secret. The supervised child receives it only through a narrow
environment. `OPENAI_ADMIN_KEY`, ambient `OPENAI_API_KEY`, database values,
Node options, and proxy credentials are not inherited. The desktop session
header uses `env:` indirection and is scoped by the official client to the exact
loopback MCP origin for runtime and OAuth discovery requests.

Tunnel readiness requires `/readyz` HTTP 200. A running process or `/healthz`
alone is insufficient. The tunnel exposes only `/mcp/device-check`; its OAuth
verifier and explicit account binding remain the owner/tenant boundary. Do not
replace that identity path with a synthesized desktop principal. Auth0 issuer,
audience, JWKS, client registration, and account binding remain deployment
configuration covered by `docs/runbooks/auth0-codex-device-check.md`.

The marketplace entry must remain `NOT_AVAILABLE` until
`https://casimirbot.com/.well-known/oauth-protected-resource/mcp/device-check`
returns valid protected-resource JSON that advertises the production Auth0
authorization server and only `helix.rooms.read`,
`https://casimirbot.com/mcp/device-check` advertises only
`helix_environment_device_check`, and that flow completes in Codex. Changing
the policy to `AVAILABLE` is a release-sensitive review action. The desktop host
treats a missing receipt, tree mismatch, manifest mismatch, or unavailable
policy as a closed capability.

Use `docs/runbooks/auth0-codex-device-check.md` for the Auth0 tenant,
account-link, least-privilege tool-catalog, and production conformance gate.

`build:host` also renders the tracked web Helix SVG into a validated 512x512 PNG
with Sharp. Electron Builder uses that generated asset for the application and
installer icon. The generated PNG remains ignored; do not fork the web and
desktop brand sources or substitute the known-flat legacy PNGs.

The production client keeps application capability intact while reducing
Rollup traversal: Lucide and the used Drei exports resolve to exact modules;
the full published Plotly browser bundle is loaded lazily from a same-origin
copied asset with SHA-384 integrity; and Mermaid's complete published minified
ESM tree remains lazy and same-origin. Do not replace these with remote CDNs,
partial Plotly bundles, or a reduced Mermaid diagram set.

## Workstation memory envelope

Use one heavy process tree at a time. Before each client or installer build,
record physical free memory, committed-memory percentage, and lingering Node
processes. Keep one Vitest worker. Pause before another heavy step if commit
headroom is below 4 GiB; terminate only the exact child tree if physical free
memory approaches 1.5 GiB or committed memory reaches 85%.

Before dependency-graph convergence, the full Vite client exhausted 2 GiB and
2.5 GiB heaps, and a later diagnostic was stopped when physical free memory fell
below the guard. The optimized clean client now passes with one 2,304 MiB Vite
heap. Keep that cap unless a measured graph change justifies another value. The
Windows release runner uses the same 2,304 MiB heap and fails closed if initial
physical headroom is under 4 GiB.

For the isolated Electron host, use the exact bounded compiler command:

```powershell
node --max-old-space-size=512 apps/desktop/node_modules/typescript/bin/tsc -p apps/desktop/tsconfig.json --noEmit
```

Do not substitute `npm --prefix apps/desktop exec tsc` from the repository root.
On this workstation that form resolved a broad compiler graph and exhausted
Node's approximately 4 GiB default heap. The exact project command above passed
within its 512 MiB limit.

## Production prerequisites

Configure the GitHub `desktop-production` environment with required reviewer
approval and configure these secrets:

- `WINDOWS_CSC_LINK`
- `WINDOWS_CSC_KEY_PASSWORD`
- `WINDOWS_PUBLISHER_NAME` (the exact certificate publisher identity)
- `CASIMIR_ADAPTER_VERIFY_URL`
- `CASIMIR_TRACE_EXPORT_URL` when it cannot be derived from the adapter URL
- `CASIMIR_VERIFY_TOKEN` and `CASIMIR_VERIFY_TENANT` when auth/tenant isolation
  is enabled

Never print or place signing material, adapter tokens, or connector credentials
in the repository, build logs, runtime manifest, update metadata, or release
notes.

## Safe release-slice convergence

The canonical checkout can contain unrelated research, Minecraft, Helix Ask,
and generated-document work. Never use `git add -A`, `git add .`, a repository
clean, or a bulk reset to prepare the desktop release.

Run this read-only audit first:

```powershell
npm --prefix apps/desktop run release:audit-slice
node apps/desktop/scripts/audit-release-slice.mjs --json
```

`apps/desktop/release-slice.v1.json` defines three boundaries:

- owned trees and exact files are eligible for whole-file review;
- shared integration files require hunk-by-hunk review because unrelated work
  can coexist in the same file;
- outside changes are reported but are never release-slice staging candidates.

The audit also fails if generated `build`, `dist`, `node_modules`, `release`, or
`runtime` output becomes tracked, if a credential-like certificate/key file
enters the owned slice, if a required file/marker disappears, or if a manifest
path is ambiguous. It does not modify the Git index. Review every owned file,
stage only explicit reviewed paths, stage shared files interactively by hunk,
then confirm `git diff --cached --name-only` contains nothing outside the
reviewed slice. Do not tag until a fresh checkout of that commit passes the
same audit with a clean status.

Runtime staging hashes the exact slice manifest. Preflight compares that hash
with source, and `release-manifest.json` plus `site-release-metadata.json` carry
it forward. A source commit alone is therefore insufficient if the reviewed
slice identity does not also match.

Device Check is owner-scoped. A fresh no-session workstation has the public
`user` policy but no owner identity, so it must sign in or explicitly enter the
guest Shared Live Room flow before connector rows can be listed. Do not bypass
that account boundary in the desktop host. In the current alpha, Device Check
also remains outside the `user` allowlist; the compiled boundary smoke expects
403 after creating a real public owner session. Change that expectation only
with the live connector/OAuth acceptance evidence required below.

## Local unsigned validation

Local directory packaging may validate closure before release credentials are
available:

```powershell
npm run build:client
npm --prefix apps/desktop run pack:dir
npm --prefix apps/desktop run smoke:packaged-launch
npm --prefix apps/desktop run verify:runtime-tree
npm --prefix apps/desktop run smoke:service-boundary
Get-AuthenticodeSignature apps/desktop/release/win-unpacked/CasimirBot.exe
```

When changing the plugin manifest, also run the installed plugin-creator
skill's `scripts/validate_plugin.py` against
`plugins/casimirbot-device-check`; do not copy a workstation-specific skill
path into release automation.

The packaged launch smoke proves profile containment and the loopback process
boundary through a pre-created, absolute local-drive `--user-data-dir`. It must
also prove that this isolated profile does not replace the installed app's
`casimirbot://` protocol ownership. Relative and UNC overrides fail closed. The service-boundary smoke separately
performs a real local-session mutation and proves that its atomic pg-mem
snapshot is created in disposable state without the per-launch secret.

The smoke must report missing/wrong/correct secret as `401/401/200` and the
release-status endpoint as closed in the isolated service environment. The
unpacked runtime manifest's client-tree hash must equal the independently
hashed built and staged renderer trees. Without release signing inputs,
Authenticode must be treated as `NotSigned`; never publish or link that local
directory pack from the site.

The tunnel-focused suite must also pass with one worker:

```powershell
npx vitest run tests/desktop-mcp-tunnel.spec.ts tests/desktop-host-security.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

It proves exact credential shapes, absence of ambient secret inheritance,
OS-bound vault lifecycle, state redaction, and tampered-binary fail closure.
Live `/readyz` and Codex tool-call evidence additionally require an authorized
Platform tunnel, a restricted runtime key whose only selected Platform API
permission is **Tunnels: Use** (the runtime Read + Use role), and the configured
Auth0/account-binding path; deterministic local tests do not substitute for
that external acceptance.

## Release procedure

1. Start from a clean commit whose desktop package version is intended.
2. Push the exact tag `desktop-v<version>`.
3. The `Desktop Release` workflow installs both lockfiles, performs the bounded
   client build, builds/stages the host, and runs focused tests.
4. Preflight verifies tag-to-commit identity, a clean checkout, source hashes,
   release-slice identity, dependency closure, signing inputs, and the adapter
   endpoint.
5. The workflow creates a signed NSIS installer and verifies Authenticode plus
   every updater SHA-512 in `latest.yml`; built, staged, and packaged renderer
   tree identities must match before signature verification proceeds.
6. The adapter must return `PASS`, a certificate hash, and `integrityOk: true`;
   training-trace export must succeed.
7. The workflow independently re-hashes the installer and combines the release
   manifest, Authenticode receipt, and sanitized Casimir gate receipt into
   `site-release-metadata.json`. This non-secret record contains the exact
   versioned URL and deployment variables; it is generated atomically and
   included in the publish allowlist.
8. The protected production environment can then publish the GitHub Release.

All GitHub-owned Actions in the signing workflow are pinned to full commit SHAs,
with the reviewed release version retained as a comment. Do not replace those
pins with mutable major tags. When updating an Action, resolve its official,
verified release commit, review the breaking changes, update the pin and comment
together, and rerun the workflow contract tests.

Do not reuse a tag or replace assets on an existing version. The site download
button must resolve only to an explicitly approved, immutable GitHub Release
asset, while the app uses the matching updater metadata generated by
electron-builder. Do not use GitHub's mutable `releases/latest/download` URL.

After the protected workflow publishes and its evidence has been reviewed,
review `site-release-metadata.json` from that exact release and configure the
website deployment with its `deploymentEnvironment` values:

- `DESKTOP_RELEASE_APPROVED=1`
- `DESKTOP_RELEASE_VERSION` (strict SemVer matching `desktop-v<version>`)
- `DESKTOP_RELEASE_DOWNLOAD_URL` (the exact versioned x64 NSIS asset URL)
- `DESKTOP_RELEASE_SHA256` (the installer's 64-hex SHA-256)
- `DESKTOP_RELEASE_PUBLISHER` (the verified Authenticode publisher)
- `DESKTOP_RELEASE_CASIMIR_CERTIFICATE_HASH` (the PASS certificate's 64-hex hash)
- `DESKTOP_RELEASE_PUBLISHED_AT` (optional ISO timestamp)

`GET /api/desktop-release/latest` fails closed unless every required value is
valid and the URL exactly matches this repository, version tag, and generated
installer filename. Invalid configuration returns no partial metadata. Remove
`DESKTOP_RELEASE_APPROVED` or set it to `0` to withdraw the site link without
changing an already-published updater feed. Inside `desktop_native`, `/download`
never presents an installer and routes the operator to `Desktop Updates`.
Do not hand-edit values when the generated record is available; its evidence
hashes bind the release manifest, Authenticode receipt, and sanitized Casimir
gate receipt used to derive the approval.

The raw adapter response and training-trace JSONL can contain internal
diagnostics. They remain ephemeral on the release runner, are not echoed into
the job log, and must never enter an Actions artifact, the public publish bundle,
or the GitHub Release. The public `casimir-gate-receipt.json` contains only the
PASS/integrity result, certificate hash, trace record count and SHA-256, and
adapter-response SHA-256. Those hashes preserve review linkage without
publishing raw observations. If a fresh trace needs long-term training or audit
retention, export it to a separately configured access-controlled evidence store;
a public-repository Actions artifact is not that store.

## Installed update behavior

The `Desktop Updates` developer panel presents explicit controls to check,
download, and restart/install. The app does not silently download, install on
quit, accept a web installer, or allow a downgrade. It uses generated
`app-update.yml` and `latest.yml`; do not call `setFeedURL` or accept a
renderer-supplied feed. Update state is an operator observation, not Helix
evidence or answer authority.

## Rollback

Never enable downgrades and never replace a published installer in place.

1. Mark the affected release as bad and stop linking it from the site.
2. Start from the last-known-good source on a new clean branch.
3. Apply the minimum forward fix and bump above the bad version.
4. Run the complete signed release workflow again.
5. Confirm a machine on the bad version installs the new forward version.

## Acceptance still required before public launch

- A clean Windows runner must complete the 2,304 MiB client build.
- The actual signing identity must pass Authenticode verification.
- A packaged installer must pass the loopback missing/wrong/correct-secret
  smoke cases.
- A two-version test must validate check, download, signature verification,
  restart/install, and forward rollback.
- The OAuth protected-resource endpoint must return discovery JSON rather than
  the site fallback, and the plugin must complete a real Codex authorization
  plus read-only Device Check against a live paired environment connector.
- The website download route must point only to the approved signed release.
- The website deployment approval metadata must match the signed installer,
  publisher, SHA-256, version tag, and Casimir PASS/OK certificate evidence.
