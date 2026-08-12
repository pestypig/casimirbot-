# CasimirBot desktop app readiness baseline

Date: 2026-08-11  
Status: active implementation goal, Phase 0  
Change classification: presentation/host capability architecture and resource governance

## Decision

CasimirBot will keep one shared React/Helix product and add a Windows-first
native host. The site remains the hosted product and release/download surface.
The desktop host adds only capabilities that require local trust: loopback
service control, credential vault access, device-agent control, native updates,
workspace access, and Codex MCP registration.

Screen conformance and host authority are separate. Existing mobile-device
detection continues to choose a suitable layout. The new runtime-surface
contract identifies `web`, `pwa`, or `desktop_native` without using viewport,
URL, or user-agent signals as authority.

Runtime capabilities are renderer presentation hints and fail closed until a
future typed native preload handshake explicitly declares them. Shared account
policy and server-side workstation-tool enforcement remain the access boundary.

## Repository preservation gate

Baseline at goal start:

- HEAD: `8a4ac055d632`; `HEAD...origin/main` is `0 0`.
- Tracked status entries: 173.
- Untracked status entries: 116.
- Tracked files now matched by ignore rules: 5,639.
- The worktree contains unrelated active Helix, connector, physics, test, and
  documentation work and must not be reset, mass-staged, or folded into the app
  work.

Before installer packaging, create a dedicated hygiene stream that classifies:

1. product source, contracts, and tests;
2. canonical evidence and small integrity manifests;
3. reproducible generated output;
4. local state, caches, temporary binaries, and debug captures;
5. secrets or credential-adjacent material;
6. large immutable research/release artifacts that belong in a release store,
   LFS, or object storage.

Packaging must use an explicit allowlist from a clean checkout. It must never
copy the repository wholesale or infer release contents from current Git
tracking alone.

## Atlas evidence

Required Atlas sequence completed before this patch:

- `npm run atlas:build`: 45,451 nodes and 114,225 edges.
- `atlas:why environment-connector.probe`: identifies the probe contract and
  seven direct test consumers across platform, conformance, pairing, broker,
  Codex-native, runtime-approval, and workstation-gateway surfaces.
- `atlas:trace environment-connector.probe --upstream`: points to the shared
  workstation-tool contract index and Minecraft shared-live-room runbook.
- `atlas:why/trace runtime-memory-governor`: identifies host and process memory
  admission, Ask-turn admission, wake-service, and runtime-governor tests.
- `atlas:why/trace mobile-device-detection`: identifies the existing shared
  layout signal resolver and its deterministic test.

There was no canonical/recovery app-runtime pair, so Atlas first-divergence did
not apply to this foundational contract.

## Host resource envelope

Goal-start Task Manager equivalent snapshot:

```txt
physical total: 15.78 GiB
physical free:   4.59 GiB
physical used:   70.9%
commit used:     17.63 GiB
commit limit:    29.26 GiB
commit ratio:    60.3%
```

The Atlas build was run alone with a 3,072 MiB V8 old-space ceiling. During the
run, physical free memory remained 3.86 GiB and commit remained 63.7%; its Node
process tree used approximately 0.92 GiB working set and 1.02 GiB private bytes.

Ongoing work follows `docs/runbooks/helix-runtime-memory-operating-envelope.md`:

- only one heavy build or Vitest worker tree at a time;
- use one worker for targeted tests;
- use the 1,536 MiB low-memory server profile for combined Helix work;
- monitor both physical availability and Windows commit headroom;
- do not start a duplicate keyed server, browser, tunnel, or game process;
- stop only the exact worker tree that crosses the run threshold;
- treat `host_memory_limit` and `host_commit_pressure` as typed capacity
  failures, never agent answers.

For unattended development commands, pause before launch when commit headroom
is below 4 GiB. During a command, stop its exact process tree if physical free
memory approaches 1.5 GiB or commit approaches 85%, then diagnose narrowly.
These conservative development thresholds do not replace the product runtime
governor's hard and soft boundaries.

## Delivery gates

1. Reproducible clean-checkout web/server build with an explicit packaging
   allowlist.
2. Shared runtime-surface capability contract and deterministic tests.
3. Sandboxed Windows native shell using `127.0.0.1` and an ephemeral port,
   never the server's general `0.0.0.0` default. Desktop server mode now
   forces IPv4 loopback and fails startup closed without a strong per-launch
   session secret. Its HTTP middleware and `/ws` upgrade verifier require that
   secret, which must remain in the future native main process and be injected
   into loopback traffic without renderer projection.
4. Read-only Device Check using the existing environment-probe identity,
   pairing, lease, observation, and provenance contracts.
5. Thin Codex MCP/plugin integration; no private sampling, generic tool loop,
   approval lifecycle, compaction, or terminal completion implementation.
6. Signed immutable installer/update artifacts with rollback and source commit
   identity; public updates never execute `git pull`.
7. Developer remains the full workstation superset; user accounts receive only
   stabilized panels and tools through existing server-side policy.

## Verification posture

The initial presentation contract did not require the Casimir gate. The later
desktop release slice now changes CI/release integrity semantics, so its handoff
requires a Casimir adapter `PASS`, a non-empty certificate hash, integrity OK,
and successful training-trace export. That gate is separate from the focused
desktop tests and must not be inferred from an unsigned local directory pack.

Keyed Helix and Codex parity testing is deferred until the local MCP/device
capability is executable. At that point, acceptance must compare one exact
natural prompt through prompt, admission, execution, normalized observation,
observation re-entry, provider candidate, route product, terminal writer, and
visible presentation before broad batteries are attempted.

## Native-host scaffold evidence

The Windows-first host now lives under `apps/desktop` with an independent
package manifest so installer tooling does not rewrite the already-modified
root `package.json` or lockfile. The native main process reserves an ephemeral
loopback port, generates a 256-bit secret, launches the compiled server in
desktop mode, injects the secret only for the exact loopback origin, and exposes
only a typed capability snapshot through a sandboxed preload bridge.
The service child inherits only an explicit Windows process-environment
allowlist and disables repository `.env` loading, preventing unrelated provider
or developer credentials from crossing into the native service implicitly.

The packaging manifest and staging script use an explicit allowlist. The first
desktop bundle attempt failed closed on development-only Vite/Babel and native
dependency edges. The production bundle now replaces the unreachable Vite
branch with a fail-closed stub and bundles the service graph, leaving `sharp`
as its only required top-level external. `sharp` and `electron-updater` are
exact production dependencies in the isolated desktop lockfile. The v2 runtime
manifest hashes the service, client tree, and lockfile and records
`dependencyClosureStatus=staged_verified`. The fresh production renderer is now
staged as 601 allowlisted files. The built tree, staged tree, and v2 runtime
manifest independently converge on client-tree SHA-256
`2fdc0b4e1d33b6ab7add3bc2fbebd425b9872efc7842edd6cd95478707c98bcf`.
This proves local build/stage freshness and package closure; it is not a signed
release verdict.

## Device Check v1 evidence

The first native utility is a read-only Device Check projection over the
existing environment-connector device, installation, package, binding,
admission, credential-metadata, and probe contracts. It is owner-scoped and
optionally room-scoped. The response deliberately excludes credential values,
device public keys, producer epochs, raw observations, and answer authority.
Sticky database `online` state is projected as effectively offline once its
last contact is stale, and stable blocker codes explain why a probe is not
ready.

The developer workstation now registers a responsive Device Check panel that
uses the same endpoint on desktop and web layouts. It remains outside the
public `user` allowlist while the native dependency closure and end-to-end
probe path are unfinished. Its cards expose status, freshness, binding,
admission, non-secret credential metadata, capabilities, and blockers; refresh
is manual to keep background load low.

Deterministic verification completed for this slice:

- desktop session, startup, runtime-surface, mobile detection, and Device Check
  service tests: 23 passing;
- Device Check renderer test: 1 passing after adding the explicit React binding
  required by the repository's test transform;
- server production build: passing with four pre-existing duplicate-key/case
  warnings outside this change;
- native host/preload build: passing;
- isolated loopback process smoke: missing secret `401`, wrong secret `401`,
  correct secret `200`;
- client production build under a 2,048 MiB V8 ceiling: stopped at the heap
  limit while transforming roughly 4,800 modules;
- a single monitored 2,560 MiB retry progressed to roughly 7,000 transforms
  before reaching the same V8 heap limit. Just before exit, physical free
  memory was 1.66 GiB and commit was 70.2%; the process left no worker behind.
  A narrow replacement of two Lucide namespace imports with named imports was
  test-clean but did not materially reduce traversal because the client still
  imports the package barrel and broad workstation graph elsewhere. No 3 GiB
  retry was attempted on this workstation. The prior staged client runtime was
  not promoted as current after these failures.
- a later Lucide-only 2,560 MiB diagnostic was stopped by the operator guard
  when Vite reached approximately 2.63 GiB working set and physical free memory
  fell to 1.07 GiB. Commit remained 71.1%; only that exact Vite PID was stopped,
  and no Node worker remained;
- the production graph now direct-resolves 551 reached Lucide icons, the four
  used Drei exports, and Drei's exact `three-stdlib` OrbitControls dependency.
  Full Plotly is a lazy same-origin published browser asset pinned with SHA-384,
  while Mermaid remains a complete lazy same-origin ESM tree. This preserves
  capability while keeping those published vendor graphs outside Rollup;
- the final monitored client build passed with a 2,304 MiB V8 ceiling in
  42.37 seconds: 3,238 modules transformed, 374 chunks rendered, and 109 static
  runtime items copied. The latest active-build snapshot showed approximately
  2.17 GiB Vite working set, 2.04 GiB physical free memory, and 68.9% commit,
  above the 1.5 GiB/85% stop thresholds. The process exited cleanly;
- Plotly and Mermaid entry hashes match their package sources, all 103 Mermaid
  chunks are present, and the built/staged client tree hashes match the runtime
  manifest. Production import convergence tests pass 8/8 with one worker. The
  exact release workflow battery passes 21/21 across seven files under a
  768 MiB coordinator heap and one worker.

The workstation returned to 4.05 GiB physical free memory, 61.2% commit, and
zero Node processes after the successful build. A signed clean-runner build,
installer verification, and live Casimir adapter certificate remain separate
release gates.

## Native renderer handshake evidence

The shared renderer now consumes the preload's single read-only runtime-snapshot
call through an application-level provider. The value crossing IPC is treated
as untrusted: it must have the exact schema and capability keys, use an HTTP
`127.0.0.1` origin with an explicit port, and match the renderer's current
origin. Missing, widened, mismatched, rejected, or timed-out handshakes remain
on the web/PWA surface with every native capability false. Screen size remains
independent and continues to select responsive layout only.

Device Check uses that shared presentation state to identify `Web service`,
`Installed web app`, or `Desktop service`; it does not use the state as account
or tool authority. The isolated desktop dependency closure is installed and a
standalone strict TypeScript check passes. Shared runtime, updater, provider,
Device Check, and updater-panel verification currently totals 13 passing tests.

## Signed release and updater evidence

The native host now exposes a narrow, origin-checked update bridge. It disables
automatic download, install-on-quit, web installers, and downgrades. The
developer-only Desktop Updates panel requires separate operator actions to
check, download, and restart/install; its state is an observation and does not
enter Helix answer or terminal authority.

The tag-triggered Windows workflow uses a single 2.25 GiB client-build heap, exact
root/desktop lockfiles, a clean tag-to-commit preflight, mandatory signing
inputs, `forceCodeSigning`, Authenticode signer checks, `latest.yml` SHA-512 and
blockmap verification, and the Casimir adapter/certificate/training-trace gate.
Checkout, Node setup, artifact upload, and artifact download are pinned to the
full commit SHAs of reviewed official releases; checkout credentials are not
persisted.
Only an explicit artifact allowlist crosses into the protected
`desktop-production` publish job. Rollback is a forward version from
last-known-good source; asset replacement and updater downgrades are forbidden.
Raw adapter output and training-trace JSONL remain ephemeral on the runner and
are redirected away from the public job log; they do not enter any Actions
artifact. Only a sanitized receipt containing PASS/integrity state, certificate
hash, evidence hashes, and trace record count can cross the public release
allowlist. Durable raw-trace retention requires a separately configured
access-controlled evidence store.

The refreshed local directory pack contains the same 601-file renderer and
client-tree hash as the staged manifest, including full Plotly and all 103
Mermaid chunks. The rebuilt compiled-service smoke passes missing/wrong/correct
secret as `401/401/200`. A hidden packaged launch produced exactly four
`CasimirBot.exe` processes and one listener on `127.0.0.1`; its exact process
tree was stopped with zero remainder. Authenticode correctly reports
`NotSigned`, so this directory pack is local validation evidence only and must
not be offered for download.

Local verification completed for the package closure:

- strict desktop TypeScript: PASS;
- desktop host/service build: PASS (four pre-existing server warnings);
- v2 runtime stage: `staged_verified`;
- loopback boundary smoke against the new service bundle: `401/401/200` PASS;
- unpacked Electron directory pack: PASS, including `electron-updater`, `sharp`,
  and the Windows x64 native image binary in the expected ASAR/unpacked paths;
- hidden packaged launch: four-process tree, one `127.0.0.1` listener, PASS;
  the exact process tree was stopped and no Node or CasimirBot process remained.

The local directory pack is intentionally unsigned (`NotSigned`) and therefore
is not a release artifact. A signed NSIS build, clean 3 GiB client build,
two-version updater exercise, production OAuth MCP authorization, and live
environment-connector Device Check remain acceptance gates.

## Thin Codex MCP/plugin evidence

The existing OAuth-protected Streamable HTTP MCP server now publishes
`helix_environment_device_check`. This is the thin Codex boundary; no sampling,
approval, retry, compaction, session, subagent, or terminal-completion runtime
was added to Helix. The tool:

- requires the existing `helix.rooms.read` OAuth scope and active Shared Live
  Room account policy;
- derives `ownerProfileId` from the verified OAuth principal and accepts only an
  optional typed room identifier;
- calls the same Device Check list builder used by the browser endpoint;
- declares read-only, non-destructive, idempotent, closed-world annotations;
- returns credentials/raw observations/public keys/answer authority as absent
  or false and remains non-terminal evidence for Codex follow-up reasoning.

The repository plugin at `plugins/casimirbot-device-check` points only to
`https://casimirbot.com/mcp`. The environment connector remains outbound-only,
and neither the desktop loopback origin nor its per-launch secret enters plugin
configuration. Plugin validation passes. Focused MCP scope, catalog,
owner-projection, reauthorization, and browser-route checks pass (7 tests), the
Device Check service checks pass (3 tests), the Helix discipline quick guard
passes with unrelated dirty-worktree warnings, and the production server build
passes with the same four pre-existing warnings.

The plugin was not installed and no personal marketplace was modified. Native
automatic registration and the `codexMcpRegistration` capability remain false
until a signed release can prove package identity and production OAuth/tool
discovery is exercised end to end.

## Website download acceptance surface

The public `/download` page now shares the runtime-surface contract instead of
inferring authority from screen dimensions. Web and PWA surfaces query a public
read-only release-status endpoint. `desktop_native` does not query for or show
its own installer; it opens the developer-only `Desktop Updates` panel. The
page remains responsive across viewport sizes, but viewport remains layout
only.

The endpoint is fail closed. A release is available only when deployment
configuration explicitly approves an exact SemVer and exact immutable GitHub
tag/asset path for `pestypig/casimirbot-`, with matching generated x64 filename,
installer SHA-256, Authenticode publisher, and Casimir `PASS` certificate hash
with integrity `OK`. Mutable `latest` URLs, mismatched versions, query/hash URL
variants, missing evidence, and partial configuration return only an
unavailable reason. Responses use `no-store` and do not leak rejected values.

Focused download verification passes 11/11 across the server resolver/route and
responsive view. It covers default unavailable state, three invalid release
classes, strict schema acceptance, response headers, native installer hiding,
preload-bridge lookup suppression, web approved-link projection, and client
error fail-closed behavior. The shared schema also independently rejects a
widened download origin, so browser validation does not rely only on the server
resolver. The complete focused desktop-release battery passes 32/32 across nine
files with a 768 MiB coordinator and one worker.

The final renderer rebuilt under the 2,304 MiB cap in 41.90 seconds, transformed
3,240 modules, rendered 376 chunks, and copied 109 vendor items. Its observed
late-build snapshot was approximately 2.04 GiB Vite working set, 2.16 GiB
physical free memory, and 68.6% commit, above the stop thresholds. The current
built, staged, and unpacked package trees each contain 603 files and independently
match runtime-manifest SHA-256
`2061c0e444a83f28113d0cc741fa3802103fb42dc401d2a6e2e9d6e04e5f24a6`.
The rebuilt compiled-service smoke passes `401/401/200` and confirms the release
endpoint fails closed behind the loopback secret. A hidden packaged launch
produced four processes and one `127.0.0.1` listener; the exact tree was stopped
with zero remainder. Authenticode remains `NotSigned`, as expected locally.

These are local contract and packaging checks only: no signed installer has
been published or linked, and the live Casimir adapter, production OAuth MCP,
live connector, and two-version updater acceptance gates remain pending.

## Live release-readiness audit

The local checkout and its `origin/main` tracking ref both resolve to
`8a4ac055d6321295f5af7d23c1b9f89742489693` with no ahead/behind delta. The
public GitHub API reports the same `main` SHA and no releases, including no
`desktop-v*` release. This confirms that the new site endpoint must remain
closed.

The checkout is not a release source yet: HEAD has no tag, tracked changes are
present, nothing is staged, and 201 untracked files exist across the user's
larger dirty worktree. Release preparation must isolate and review the intended
desktop slice without mass-staging or discarding unrelated work.

Safe presence checks found no configured values on this workstation for the
Windows signing identity/key, keyed Casimir adapter or trace export, production
OAuth issuer/JWKS/provider, database-backed live connector, or website desktop
release approval metadata. Consequently:

- signed NSIS and Authenticode acceptance cannot run locally;
- Casimir `PASS`, certificate hash/integrity, and trace export cannot be claimed;
- real Codex OAuth discovery/tool execution and a live paired Device Check
  cannot be exercised;
- two-version updater and forward-rollback testing have no signed versions;
- the website remains fail closed by design.

These are external-state prerequisites, not implementation test failures. The
next release cycle begins by reviewing and committing the intended slice on a
clean branch, configuring the protected `desktop-production` secrets, and
pushing an exact `desktop-v<version>` tag. Only after the workflow publishes and
its evidence is reviewed should deployment set `DESKTOP_RELEASE_APPROVED=1`
with the exact immutable asset metadata.

## Deterministic website approval record

The signed workflow no longer depends on manually transcribing independent
release values. After Authenticode, updater hashes, Casimir PASS/integrity, and
training-trace export succeed, it atomically generates
`site-release-metadata.json`. The generator independently re-hashes the exact
x64 installer and requires the official repository, matching SemVer tag and
filename, clean source-commit identity, staged dependency closure, runtime and
updater metadata hashes, matching valid signer receipt/thumbprint, and a 64-hex
Casimir certificate hash with integrity OK.

The record contains the exact browser-valid release status, non-secret website
deployment variables, and hashes of the release manifest, Authenticode receipt,
and sanitized Casimir gate receipt. It joins the explicit protected publish
allowlist and GitHub Release assets. The raw adapter response and training trace
do not. Eleven focused fixtures cover receipt sanitization/hash binding, raw
workflow evidence non-persistence, empty and malformed trace rejection, invalid
certificate rejection, tampered installer, foreign repository, mismatched tag,
failed Casimir integrity, and wrong-publisher rejection. The record does not
activate the website by itself; protected deployment review remains required.

## Desktop brand asset closure

The desktop build now derives its icon from the tracked
`client/public/icons/helix-icon.svg`, the same source family used by the web
manifest. A deterministic Sharp step produces an ignored 512x512 PNG and fails
closed unless dimensions, format, finite entropy, and all three RGB ranges pass.
The current output reports entropy `4.377`; direct visual inspection shows the
Helix mark rather than the flat-blue legacy PNGs. Electron Builder consumed the
asset without its former default-icon warning, and the icon extracted back from
the packaged `CasimirBot.exe` matches the mark.

The icon-bearing package retains the 603-file renderer tree SHA-256
`2061c0e444a83f28113d0cc741fa3802103fb42dc401d2a6e2e9d6e04e5f24a6`, passes
the `401/401/200` plus closed-release smoke, and launches as four processes with
one loopback listener before exact-tree cleanup. The expanded focused release
battery passed 43/43 across eleven files at this earlier icon checkpoint.

## Deterministic release-slice convergence

The read-only `release:audit-slice` command now makes repository cleanup
actionable without touching the user's index. Its current PASS report identifies
66 whole-file desktop candidates, 15 shared files requiring hunk review, 311
outside changes that must remain untouched, and zero staged files. No generated
desktop output or certificate/key file is tracked in the slice. The manifest
SHA-256 is
`c1c1af7aebae14877de0256cc056c16e955b61dd599c39576f0f731cbbe77f6c`;
the current owned path-set SHA-256 is
`06a0ef60d8ea3cd73e162b8b7263444bd7a231633b76a4d53cbdd9a57150beab`
and the shared path-set SHA-256 is
`5dd69d9ae21b5786ae305acde87fd81d06999c3e9cb673d6a156cfe30f968ed1`.

Ten focused checks validate normalized exact paths, porcelain rename handling,
owned/shared/outside classification, generated-tree and credential-extension
rejection, runtime-slice identity, required markers, and before/after index identity. The manifest hash
is embedded in runtime staging, compared again by release preflight, carried in
the signed artifact manifest, and exposed by deterministic website metadata.
The release workflow runs the audit before its bounded build. The expanded
focused release battery now passes 84/84 across nineteen files with one worker.

The ignored staged runtime and refreshed unpacked package now carry byte-identical
runtime-manifest SHA-256
`0db2f573876f6d5c53bdcc9403be91023560334640bbae755d469a7786f45d0e`.
Built, staged, and packaged renderer trees each contain 603 files and retain
SHA-256 `2061c0e444a83f28113d0cc741fa3802103fb42dc401d2a6e2e9d6e04e5f24a6`.
The compiled-service boundary passes `401/401/200`, keeps the release endpoint
closed, writes a real public owner session only to disposable local state, and
keeps Device Check policy-closed. A hidden package launch produces four
processes, one loopback listener, and 17 files beneath the disposable local
drive user-data override, followed by exact-tree/profile cleanup with zero
remainder. Its latest observed minimum physical free memory was 3.74 GiB and
maximum commit was 64.6%, above the stop boundaries. Local Authenticode remains
`NotSigned`, so this is current local closure - not a publishable artifact.

## Device Check and native-session hardening

The Device Check projection now preserves fresh connector-reported `offline`
and `unknown` states instead of incorrectly promoting them to `online`. Both are
typed readiness blockers, and all database-derived enum projections plus the
final list are runtime-validated against the strict public schemas. Invalid
persisted state therefore fails closed before browser or MCP projection.

The Electron session now denies all browser permission checks/requests, device
permissions, and renderer-initiated downloads. Webviews, plugins, drag-drop
navigation, and spellcheck are explicitly disabled; safe-dialog protection is
enabled. Signed update retrieval remains in the origin-checked main-process
updater. Desktop host TypeScript passes with an explicit 512 MiB heap, and the
full desktop release battery passes 84 focused tests. An earlier
ambiguous `npm exec tsc` attempt broadened the compiler graph and exhausted the
default heap; it was discarded as a command/resource failure and replaced by
the exact project-bounded invocation now used in CI and the runbook.

The installed child no longer resolves its local pg-mem snapshot relative to
the packaged `resources/runtime` working directory. The host now projects one
explicit non-secret state path beneath Electron `userData`, while continuing to
drop `DATABASE_URL`, provider keys, `NODE_OPTIONS`, repository `.env` content,
and inherited path overrides. Persistence is immediate and uses the existing
atomic streaming snapshot writer, avoiding a deferred-write loss window on
Windows termination. This storage correction does not weaken identity: a
fresh no-session surface retains the public `user` policy, while owner-scoped
Device Check still requires a real profile session or the explicit guest-room
flow.

For contained packaged diagnostics, the host accepts a pre-created absolute
local-drive `--user-data-dir`, calls Electron `app.setPath` before startup, and
rejects relative or UNC paths. Four environment tests cover the secret/env
allowlist, per-user database derivation, missing-path rejection, and override
normalization. The production release workflow now launches the packaged tree
through this disposable boundary after verifying renderer identity.

The compiled service smoke uses a disposable OS temporary directory for its
database rather than touching the repository or packaged runtime. It creates a
real local owner session, verifies that the profile is persisted without the
per-launch boundary secret, and expects the current public Device Check route
to remain policy-closed with 403. The connector HTTP wrapper now preserves the
existing typed 401/403 Shared Live Room account errors instead of relabeling
them as an infrastructure 503; admission policy itself is unchanged. Opening
that route is still contingent on the live OAuth/connector acceptance gate,
not on native-host presence.

## Codex plugin packaging boundary

The repository now contains a valid `casimirbot-local` marketplace whose sole
entry is the existing read-only `casimirbot-device-check` plugin. Desktop
staging copies that exact marketplace and plugin into the packaged runtime and
adds an independent marketplace-tree SHA-256 to `runtime-manifest.json`.
Post-package verification compares staged and unpacked marketplace counts and
hashes in addition to the existing renderer comparison.

The native bridge exposes only status inspection and a user-invoked fixed
`codex://plugins/casimirbot-device-check` deep link containing the absolute
packaged marketplace path. It does not spawn the Codex CLI, use a shell, edit
`config.toml`, copy credentials, or take over Codex sampling/tool/terminal
authority. The renderer validates the exact status schema and disables the
action unless the main process has verified both the bundle receipt and an
`AVAILABLE` marketplace policy.

The production discovery check on 2026-08-11 returned the CasimirBot site HTML
with HTTP 200 at
`/.well-known/oauth-protected-resource/mcp`, not OAuth protected-resource JSON.
Accordingly the marketplace is deliberately `NOT_AVAILABLE`, the native
`codexMcpRegistration` capability remains false, and Device Check explains the
production OAuth blocker. Local manifest validation and the 512 MiB desktop
TypeScript check pass; real OAuth authorization, a paired live connector call,
and the signed-package acceptance gate remain pending.

The refreshed public plugin manual describes direct-map or `mcp_servers`
wrapping for `.mcp.json`, while the installed plugin-creator validator that
mirrors the current ingestion schema rejects those forms and requires
`mcpServers`. This slice retains the validator-passing form. Recheck that
contract with the current Codex release before changing the marketplace policy
to `AVAILABLE`.

The production runtime fingerprint identifies the active compiled artifact as
commit `e25693461e8fae9126e51d7579c118875a1b6bd3` from 2026-07-24. Current local
HEAD and `origin/main` both resolve to
`8a4ac055d6321295f5af7d23c1b9f89742489693`, twelve commits later. The deployed
range predates the 2,333-line external-agent/MCP route addition, including
`server/routes/agent-access-discovery.ts`; production is therefore serving the
SPA fallback for the discovery path, not rejecting current code.

A redeploy alone is necessary but may not be sufficient. The tracked Replit
configuration sets the canonical MCP audience, host, and origin but does not
contain an OAuth issuer, provider alias, or JWKS URL. Those values belong in
the deployment secret/configuration boundary. After a current production
artifact is deployed, acceptance must still prove discovery JSON, authorization
server metadata, `helix.rooms.read`, Codex authorization, account binding, and
one owner-scoped paired-device observation before the marketplace policy is
opened.
