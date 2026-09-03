# CasimirBot

CasimirBot is a Helix Ask research workstation for reasoning against bounded
mathematical and physical frameworks. Its main surface is an agent loop that can
converse with a user, call deterministic workstation tools, inspect evidence,
and reflect on theory traces that range from first principles through runnable
simulation presets and verification gates.

The project is not a claim of a working propulsion device. It is research and
simulation software for making physical claims harder to overstate: every
serious answer should be grounded in runnable code, citations, measurements,
artifacts, uncertainty boundaries, and verification receipts.

In practice, CasimirBot gives Helix Ask a structured reference model of reality:
observational lanes for measured or simulated systems, theoretical lanes for
first-principles and derived math, and workstation tools that let the agent use
those lanes without treating any receipt as a final answer by itself.

## Agent And Tool Contract (Read First)

All Helix Ask tools and runtime adapters follow one lifecycle:

```text
intent -> admission -> execution -> observation -> runtime re-entry -> terminal decision
```

Remember these rules:

- Codex owns conversational reasoning, tool choice among admitted capabilities,
  retries, observation review, and the terminal candidate.
- Helix owns source and tool admission, evidence identity and provenance,
  observation normalization, route products, proof gates, and terminal
  eligibility.
- The client projects the server-authoritative lifecycle. Panel state, receipts,
  route labels, debug data, and continuation summaries are never answer
  authority.
- The latest assistant answer is bounded conversational context, not permission
  to run a tool or proof that a hard evidence requirement is satisfied.
- Asking to see, cite, explain, or return command text, syntax, an example, or a
  mechanics document is not an operator request to execute that command. Tool
  admission must preserve the prompt's execution intent instead of expanding a
  lexical action word into a new mutating goal.
- A tool result must re-enter the runtime before it can support a final answer.
  Hard workflows with missing identity or evidence fail closed with a typed
  recovery path.
- Verified current-turn lifecycle events outrank stale compatibility snapshots
  for factual runtime questions such as whether a tool executed or an
  observation re-entered Codex. A repairable evidence or answer-quality
  rejection returns to Codex as a typed observation with its gate, stable
  reason codes, and evidence refs; deterministic rails never compose substitute
  prose. Hard permission, identity, provenance, integrity, and exhausted-repair
  boundaries still fail closed with their exact reasons.
- Keep observation transport distinct from result success: a blocked or failed
  observation can re-enter Codex and support an accurate failure explanation
  without authorizing a claim that the requested action succeeded.
- Re-entry is cross-checked by exact observation ref across the capability-lane
  event, provider bridge, canonical runtime lifecycle, and terminal audit. If
  any one rail says re-entered while another says not executed, the turn is an
  adapter projection contradiction; agreement between two stale summaries is
  not proof that the lifecycle is healthy.
- Voice presentation is downstream from terminal authority. A completed
  model-direct answer may be spoken without tool evidence; an answer that
  claims workstation or source grounding must carry current-turn observation
  evidence. Preliminary tool guesses never decide that distinction.
- Selecting Codex as the runtime means it receives substantive non-local turns;
  it does not force GPT Realtime to wait. Model-answerable turns use parallel
  conversation, while requests that require fresh workstation evidence,
  explicit tool work, or a durable goal wait for the runtime result.
- After canonical terminal selection, Helix emits one tool-neutral
  `helix.terminal_grounding_authority.v1` audit bound to the Ask turn, terminal
  artifact, answer hash, and selected evidence refs. GPT Realtime and other
  presentation lanes validate that authority; they do not re-run tool-specific
  grounding logic or become a second terminal boundary.
- No model-authored "read aloud", relevance, or success tag grants speech
  authority. Relay admission is deterministic server policy over the bound
  terminal artifact, grounding authority, freshness, supersession, and
  transport lifecycle.

This ownership and lifecycle are frozen. Tool implementations may be repaired
to conform, but must not introduce a competing planner, model loop, retry
system, context format, or terminal path. The normative specifications are
`docs/helix-ask-codex-loop-discipline.md`,
`docs/architecture/helix-ask-canonical-turn-lifecycle.md`,
`docs/helix-ask-turn-solver-spine.md`, and
`docs/helix-ask-api-parity-matrix.md`. The repeatable diagnostic procedure is
`docs/helix-ask-readiness-debug-loop.md`.

Environment-harness development additionally follows
`docs/helix-environment-harness-work-program-v1.md`. That document is the sole
current source for the active program gate, dependency order,
capability-specific maturity, required evidence, and work-packet vocabulary.
Product and architecture documents define what the system means; dated audits
retain immutable evidence; neither maintains a competing current roadmap.

### Adapter parity and first-divergence debugging

When Codex appears to finish a grounded tool workflow but Helix shows a
failure, an older receipt, or different prose, do not tune the prompt first.
Audit one current-turn identity chain:

```text
prompt -> model requests -> admitted executions -> normalized observations
-> observation re-entry -> Codex candidate -> route-product materialization
-> terminal single writer -> visible/API/voice presentation
```

Compare exact turn, call, artifact, candidate, and support references plus text
hashes. Stop at the first mismatch. The differential audit is an observer: it
may identify `adapter_projection_contradiction`, `hard_evidence_boundary`, or
`hard_policy_boundary`, but it must never approve, rewrite, reject, or replace
an answer.

Successful lifecycle facts are monotonic across projections. In particular, a
successful lane observation that later re-enters provider reasoning must remain
`lane_executed=true` at the re-entry stage. A regression to false is
`capability_lane_execution_regressed_at_reentry`, an adapter projection defect;
it is not evidence that Codex failed to execute the tool.

Use a direct Codex reference run when it is possible to give Codex the same
prompt, capability descriptions, observations, and permission boundary. Record
its proposed actions, retries, and final synthesis, then compare that trace with
the Helix run. Direct success is evidence that the adapter introduced the
divergence; it is not permission to bypass identity, authorization, provenance,
freshness, scientific-units/claim-maturity, route-product, or terminal-eligibility
gates.

For a new environment capability, this comparison is the required development
order rather than an optional final diagnostic:

1. Let reference Codex operate the consented test environment directly and
   establish whether the requested game/program operation is practically
   possible. Record public actions, observations, preconditions,
   postconditions, retries, and bounded failure modes; do not export hidden
   reasoning or credentials.
2. Convert the successful procedure into provider-neutral capability arguments,
   observation schemas, verification criteria, cancellation behavior, and
   authority requirements. Do not encode the example prompt or one successful
   command sequence as adapter reasoning.
3. Expose that capability to the runtime agent, then repeat the same natural
   prompt and equivalent starting state through Helix.
4. Attribute the first divergence. Direct failure is a mechanics, connector,
   capability-documentation, or environment-access problem. Direct success
   followed by Helix failure is an affordance-exposure, admission, execution,
   normalization, re-entry, continuation, terminal-projection, or presentation
   problem.

Helix terminal eligibility is a policy/evidence gate, not the final semantic
reasoner. It may pass through the exact supported Codex candidate, re-enter a
repairable rejection into Codex, or fail closed at a genuine hard boundary. It
must not silently rewrite the candidate, invent a different goal, or let a
stale deterministic projection overrule verified current-turn execution and
re-entry facts.

Failed attempts stay in immutable provenance and debug history. A prior failed
read/observe/verify attempt stops blocking only when strictly later current-turn
evidence proves the same required subgoal succeeded. The final Codex candidate
must still cover the required observations, pass route and quality gates, and
receive Helix terminal authority. Mutating attempts are never silently
superseded.

### Keyed and memory-bounded agent testing

Tests that require provider keys, Shared Live Room state, GPT Realtime, or the
real workstation account must use the configured keyed server. With explicit
user or repository authorization, Codex Desktop may invoke only this opaque
launcher:

```powershell
& 'C:\Users\dan\.local\bin\start-myapp-for-codex.cmd' '<canonical-workspace-path>'
```

Do not read or patch the launcher, inspect credential-bearing environment
variables, print secret-bearing command lines, or start the keyed server by a
different command. Wait for `[express] app ready`, then verify
`/api/account/session`, `/api/helix/pipeline`, and
`/api/agi/agent-providers`; confirm the configured Codex provider is launchable
without exposing credentials. Keep the reported local URL and exact turn/room
identity through the test.

On a memory-constrained workstation, prefer the compiled-client `npm run dev`
profile over HMR, run focused tests before broad batteries, and allow only one
heavy build or Vitest worker tree at a time. Monitor total committed memory and
the relevant process working sets without printing process command lines or
environment blocks. Do not launch duplicate Helix, Fabric, browser, or build
processes. If a test stalls, identify and stop only its exact worker tree; keep
the keyed server and game connector alive when they remain healthy. Record OS
memory pressure separately from a reproducible product failure. Direct game or
server-console probes are useful preflight evidence, but end-to-end agent
acceptance still requires the same prompt to succeed through the Helix Ask/API
or UI route.

## Research Paper Evidence Workflow

Paper workflows use the shared agent/tool lifecycle and deepen evidence only
while the user's request requires it:

```text
paper lookup
-> accessible full text or PDF page
-> text, math, or image candidate
-> exact evidence promotion when supported
-> graph/calculator/postulate handoff when requested
-> provenance-aware answer
```

Users should be able to ask naturally, for example, "Find me a paper about
magnetars," then "Get the PDF," then "What equations are available here?" The
runtime chooses useful next steps; Helix verifies source identity, admission,
and evidence depth. Metadata is not full text, OCR is not an exact equation,
and a receipt is never a scientific conclusion.

Workflow Demo Lab may suggest editable next prompts, but suggestions and demo
progress are non-terminal. Typed observations, not assistant prose, advance an
evidence stage. For keyed live validation against an already-running server:

```bash
npm run helix:ask:scholarly-pdf-workbench
```

Use `npm run helix:ask:scholarly-pdf-workbench -- --dry-run` to print the prompt
sequence without contacting a server. Tool-specific contracts live under
`docs/helix-ask/workstation-tool-contracts/`.

## What To Look At First

| Area | Why it matters | Entry points |
| --- | --- | --- |
| Helix Ask + Live Answer loop | Primary user and agent interface. Handles prompt interpretation, tool admission, evidence re-entry, terminal authority, streamed debug, and the visible answer. | `server/services/helix-ask/`, `server/routes/agi.plan.ts` (retired compatibility wiring; do not grow), `docs/helix-ask-agentic-loop-current-overview.md`, `docs/helix-ask-codex-loop-discipline.md`, `npm run helix:ask:regression:light` |
| Environment harness work program | One current gate, dependency order, capability-specific maturity, evidence requirements, and bounded development work packets for Minecraft-first environment work. | `docs/helix-environment-harness-work-program-v1.md`, `npm run helix:environment-harness:docs-audit` |
| GPT Realtime + Codex handoff | Live voice can answer locally, converse while Codex reasons in parallel, or present a worker-grounded result without receiving workstation authority. Final relay grounding comes from the canonical terminal certificate, not a voice-owned tool evaluator. | `docs/architecture/voice-service-contract.md#gpt-realtime-grounded-worker-relay-additive`, `server/services/helix-ask/terminal-grounding-authority.ts`, `server/services/helix-ask/realtime-session/`, `shared/helix-terminal-grounding-authority.ts` |
| Agent runtime adapter | Provider edge for Codex Workstation Mode. Future providers must conform to the same edge and are not user options by default. | `server/services/helix-ask/agent-providers/`, `server/services/helix-ask/workstation-tool-gateway/`, `shared/helix-agent-runtime.ts`, `docs/helix-ask-codex-loop-discipline.md` |
| External agent API and MCP | Provider-neutral, tenant-owned durable runs for outside agents. REST and Streamable HTTP MCP share the same bounded completion, evidence, account-binding, and terminal-authority contract. | `docs/architecture/helix-agent-api-v1.md`, `server/services/helix-agent-api/`, `server/routes/helix-agent-api.ts`, `server/mcp/helix-mcp-server.ts` |
| Terminal product authority | Contract for turning admitted artifacts into one visible Ask answer. Covers product materializers, explicit route-product allowance, preview-vs-full-answer projection, and sidecar admission boundaries. | `docs/helix-ask-terminal-authority-contract.md`, `server/services/helix-ask/terminal-product-materializers.ts`, `server/services/helix-ask/terminal-authority-single-writer.ts`, `client/src/components/helix/ask-console/HelixAskVisibleFinalAnswerSelection.ts` |
| Account-based workstation access | Release boundary for profile sign-in. `developer` accounts see the full development workstation; no-sign-in and `user` accounts get the stable public subset enforced by server policy, with UI locks only as guidance. | `shared/helix-account-session.ts`, `server/services/helix-account/account-session-store.ts`, `server/routes/agi.workstation-tool-gateway.ts`, `AGENTS.md` |
| Workstation launch panels | User-facing capability surfaces. Launch panels expose docs, calculators, theory maps, stellar/solar simulators, NHM2 panels, notes, process graphs, and runtime diagnostics. | `client/src/pages/desktop.tsx`, `client/src/pages/helix-core.panels.ts`, `docs/helix-desktop-panels.md` |
| Workstation tool calls | Deterministic actions Helix Ask can request. Tools open panels, inspect docs, search repo evidence, run calculator paths, update notes, build context packs, and return typed observations. | `docs/helix-ask/workstation-tool-contracts/README.md`, `client/src/lib/workstation/panelCapabilities.ts`, `client/src/lib/workstation/panelActionAdapters.ts`, `client/src/store/useWorkstationActionExecutionStore.ts` |
| Theory congruence network | Canonical math architecture from first principles to laws, derived relations, runtime presets, calculator payloads, evidence refs, and claim boundaries. | `docs/architecture/theory-badge-graph-contract.md`, `shared/theory/helix-theory-badge-graph.ts`, `client/src/components/panels/TheoryBadgeGraphPanel.tsx` |
| Physics and observational presets | Simulation surfaces Helix Ask and the workstation can reason from, including stellar, solar, tokamak, Alcubierre/NHM2, Casimir, and equation-visualizer lanes. | `client/src/pages/helix-core.panels.ts`, `server/modules/starsim/`, `tools/`, `simulations/` |
| Verification gates | Hard checks for math maturity, physics guardrails, Casimir verification, trace export, and certificate integrity. | `WARP_AGENTS.md`, `MATH_STATUS.md`, `npm run math:validate`, `npm run casimir:verify` |

## Quick Start

Prerequisites:

- Node.js 20.x
- npm 10.x
- Optional: Python 3.11 for some physics and document tooling
- Optional: a Postgres `DATABASE_URL` for persistent hosted account, job, and
  workstation data. Without it, selected stores fall back to local or in-memory
  development behavior.

```bash
npm install
npm run build
npm run dev
```

The default development server runs Express against the prebuilt client to keep
the local Helix, browser, and Minecraft coexistence footprint bounded. Open:

- Desktop workstation: http://localhost:5173/desktop
- Mobile panels: http://localhost:5173/mobile

The configured keyed launcher supplies port 1522 and reports its own local URL;
use that reported URL for keyed-agent testing.

Use `npm run dev:hmr` when editing the client and hot-module replacement matters.
That command preserves the former Vite-middleware workflow and all developer
capabilities, but intentionally uses more memory after the workstation loads.
`npm run dev:agi:5050` remains the AGI-enabled Vite workflow on port 5050. Do
not start a separate Vite server; these scripts wire the API and UI together.
If `npm run dev` reports that `dist/public` is missing, run `npm run build`
instead of silently serving stale or incomplete client assets.

When this low-memory profile falls back to the local pg-mem database, it
coalesces disk snapshots for up to 30 seconds instead of serializing the full
fallback database after every mutation. Graceful shutdown flushes pending
changes. Production Postgres and the normal synchronous local persistence mode
are unchanged.

The normal development commands also enable the Account-panel Shared Live Rooms
experiment and guest room hosting for local two-browser testing. Production
deployments remain opt-in through `HELIX_PUBLIC_ROOMS_EXPERIMENT=1` and
`HELIX_GUEST_ROOM_CREATION=1`.

Developer room owners can generate a separate, read-only Minecraft source link
from a Shared Live Room. On a published full-stack deployment this gives the
Paper plugin a stable `https://casimirbot.com/api/room-ingress/v1/...` endpoint
and replaces a Cloudflare tunnel. Human invitations and source credentials are
deliberately separate. Source identity is server-generated, and the plugin
gates its sensor loops on admitted manifest evidence while retaining typed
retry/replay diagnostics. See
`docs/minecraft-room-source-ingress.md`.

The normal development commands keep the contract-only Helix Ask golden-path
scaffold disabled so keyed model and tool routes can run. Use
`npm run dev:golden-path` only when deliberately testing that scaffold.

### External Agent API and MCP

CasimirBot exposes one provider-neutral durable agent-run service through:

- REST at `/api/v1/agent-runs`;
- a stateless Streamable HTTP MCP endpoint at `/mcp`.

The MCP server's core durable-run tools are:

- `helix_run_start`;
- `helix_run_evidence_reenter`;
- `helix_run_continue`;
- `helix_run_inspect`;
- `helix_run_fetch_evidence`;
- `helix_run_list_events`;
- `helix_run_cancel`.

The authenticated MCP `tools/list` response is the source of truth for the
complete catalog, including any Shared Live Room tools. Each tool declares its
required OAuth scope, which is enforced again when the tool is called.

Starting a run creates durable state and returns an opaque `run_id`.
`helix_run_evidence_reenter` attaches only owner-scoped, integrity-checked MCP
observation references without executing a capability or model turn, and
`helix_run_continue` then advances that same run through a bounded, versioned
Ask turn. External results cannot bypass source admission, proof gates, or
canonical terminal-answer authority.

The Streamable HTTP catalog supplies input/output schemas, safety annotations,
and per-tool OAuth security schemes. Missing-scope calls return a typed MCP
reauthorization challenge instead of silently hiding the tool.

Both transports require a verified bearer principal, an exact Helix account
binding, and admitted OAuth and logical data scopes. The protected resource
fails closed when that configuration is incomplete. CasimirBot verifies tokens
as the OAuth protected resource; production still needs a compatible
authorization server with authorization code + PKCE, resource/audience
propagation, and an OpenAI-supported client-registration path.

An already signed-in CasimirBot user can inspect binding readiness with
`GET /api/account/session/agent-bindings` and revoke one of that profile's
opaque binding references with
`DELETE /api/account/session/agent-bindings/{binding_ref}`. These
cookie-authenticated management routes return sanitized projections: provider
subjects and bearer credentials are never included. Here `oauth_ready` means
only that the current Helix profile has an active CasimirBot binding; it does
not prove that the authorization server, client registration, token scopes, or
an outside provider connection are operational.

There is deliberately no public generic create-link or completion callback.
Binding creation requires a trusted authorization-server adapter that verifies
the external identity and then commits the provider link and exact
issuer/tenant binding through the internal account-link service. Selecting and
configuring that adapter remains a production deployment responsibility.

The canonical public connection target is
`https://casimirbot.com/mcp`. Its human-readable discovery URL is
[`https://casimirbot.com/agent-access`](https://casimirbot.com/agent-access),
and its OAuth protected-resource metadata URL is
[`https://casimirbot.com/.well-known/oauth-protected-resource/mcp`](https://casimirbot.com/.well-known/oauth-protected-resource/mcp).
Finding the website through normal internet retrieval only lets a model read
public pages. It does not install, authorize, or invoke the MCP tools. A user,
application developer, ChatGPT plugin, Codex configuration, Gemini
configuration, or surrounding agent harness must explicitly add the endpoint
and complete OAuth before tool use.

The bundled Codex Device Check plugin intentionally uses the narrower
`https://casimirbot.com/mcp/device-check` endpoint and
[`https://casimirbot.com/.well-known/oauth-protected-resource/mcp/device-check`](https://casimirbot.com/.well-known/oauth-protected-resource/mcp/device-check).
That endpoint publishes only the read-only
`helix_environment_device_check` tool. Installing the desktop application can
provide all local software and open the Codex installation flow, but Codex must
still receive the user's explicit plugin-install and Auth0 consent. Broader
runtime controls require a separate capability profile and consent grant.

For ChatGPT development testing, enable Developer mode and add the public
`/mcp` URL under Settings → Plugins. Broad ChatGPT distribution still requires
a reviewed, published plugin; the local Codex MCP configuration is not shared
with ChatGPT.

Those URLs are the intended public configuration contract; this README is not
evidence that the production endpoint is deployed or has passed provider
conformance. See
[`docs/architecture/helix-agent-api-v1.md`](docs/architecture/helix-agent-api-v1.md)
for safe OpenAI and Gemini configuration shapes, request schemas,
authentication, idempotency, completion states, cancellation limits, and
deployment configuration.

Run `npm run mcp:provider-conformance` for a secret-redacted report. With no
credentials it checks public discovery and the unauthenticated OAuth challenge.
With `CASIMIRBOT_MCP_ACCESS_TOKEN`, and optionally `OPENAI_API_KEY` and
`GEMINI_API_KEY`, it also checks authenticated MCP metadata and one bounded
provider invocation per configured provider.

### Runtime Commands

Use these commands from the repository root during setup and deployment:

```bash
npm install
npm run build
npm start
```

For local AGI-enabled development on port 5050:

```bash
npm install
npm run dev:agi:5050
```

For a hosted shell such as Replit, pull the CasimirBot repository as the primary
app checkout, set the environment variables below, install dependencies, build,
and start the production server:

```bash
git pull
npm install
npm run build
npm start
```

The Codex runtime should be treated as a pinned dependency or sidecar checkout,
not merged into this app repository. CasimirBot owns the website, database,
sessions, workstation policy, and Helix Ask routes. Codex runtime integration
should enter through `server/services/helix-ask/agent-providers/` and the
workstation gateway, with any external checkout kept ignored and version-pinned.

### Local Runtime Environment

For Windows PowerShell local development, set runtime secrets and service
endpoints in the same terminal session before starting the server. Leave values
blank until you have your own local keys or URLs. Do not commit real secrets.

```powershell
$env:GOOGLE_CLIENT_ID=""
$env:VITE_GOOGLE_CLIENT_ID=""
$env:SESSION_SECRET=""

$env:DISCORD_BOT_TOKEN=""
$env:DISCORD_APPLICATION_ID=""
$env:PORT="5050"
$env:NODE_ENV="development"
$env:ENABLE_AGI="1"
$env:ENABLE_ESSENCE="1"
$env:LLM_POLICY="http"
$env:LLM_RUNTIME="http"
$env:HULL_MODE="0"
$env:HULL_OUTBOUND_GUARD="0"
$env:LLM_HTTP_BASE="https://api.openai.com"
$env:OPENAI_API_KEY=""
$env:ELEVENLABS_API_KEY=""

npm run dev
```

When `OPENAI_API_KEY` is configured, the same startup command also makes the
personal GPT Realtime session path available. Realtime still requires a visible
user start action and microphone consent. Signed-out and `user` accounts receive
the stable personal Live session; unfinished shared-room, visual-capture, and
advanced controls remain policy-gated while `developer` stays the superset. The
`HELIX_REALTIME_SESSION_*_ENABLED` variables are optional emergency overrides;
set an individual flag to `0` only when that Realtime layer must be disabled.

GPT Realtime uses the same `OPENAI_API_KEY` as the rest of the API-backed
runtime. There is no separate Realtime credential or override. The credential
and provider error body are never returned to the browser or written to debug
output.

`GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` should use the same Google OAuth
Web application client ID. `VITE_GOOGLE_CLIENT_ID` is intentionally exposed to
the browser; the other key and token values should remain private.

### Hosted Runtime Environment

For Replit or another hosted production server, keep secrets in the host's
secret manager. Prefer one `DATABASE_URL` instead of separate `PGHOST`,
`PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGPORT` values. Neon Postgres URLs
should include SSL, usually `sslmode=require`.

Minimum hosted values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
SESSION_SECRET=""
OPENAI_API_KEY=""
LLM_HTTP_BASE="https://api.openai.com"
ELEVENLABS_API_KEY=""

ENABLE_AGI=1
ENABLE_ESSENCE=1
LLM_POLICY=http
LLM_RUNTIME=http
HULL_MODE=0
HULL_OUTBOUND_GUARD=0
```

Optional account and integration values:

```bash
GOOGLE_CLIENT_ID=""
VITE_GOOGLE_CLIENT_ID=""
DISCORD_BOT_TOKEN=""
DISCORD_APPLICATION_ID=""
```

Do not print or paste real secret values into issue comments, chat logs, or
agent prompts. Share only redacted forms such as
`postgresql://USER:****@HOST/DATABASE?sslmode=require`.

### Replit Preview

Replit Preview should run the development server, not the production build:

```bash
npm run replit:dev
```

That command keeps the app on `0.0.0.0:${PORT:-5000}`, preserves Vite
middleware, and leaves the Helix Ask `/api/*` routes mounted. Do not use
`FAST_BOOT=1` for normal Helix Ask testing; it is only a frontend-shell escape
hatch and intentionally skips API route registration. Do not prune dev
dependencies for Preview, because Replit's Vite middleware needs the Replit Vite
plugins from `devDependencies`.

For Helix Ask's Codex runtime on Replit, use the committed wrapper instead of
pointing `CODEX_BIN` directly at the native Codex binary:

```bash
CODEX_BIN=/home/runner/workspace/scripts/replit-codex-wrapper.sh
```

The wrapper executes the native Codex CLI, but maps Replit's proxy credentials
into the environment names Codex expects:

```bash
OPENAI_BASE_URL=$LLM_HTTP_BASE
OPENAI_API_KEY=$LLM_HTTP_API_KEY
```

This keeps local development unchanged. On local machines, continue using the
normal `OPENAI_API_KEY` / `LLM_HTTP_BASE` shape shown above. Replit may also
carry legacy local-LLM secrets such as `LLM_LOCAL_*`; they can remain present,
but they are not required for the Replit Codex wrapper path.

Use the production path only for deployment or when you explicitly want the
compiled server:

```bash
npm run replit:build
npm run replit:start
```

If the Replit production build is memory-constrained, keep Preview on
`npm run replit:dev` and check that `curl -I http://127.0.0.1:5000` returns an
HTTP status. The production client build disables compressed-size reporting to
avoid spending memory on gzip-size calculation after bundling.

Hosted account persistence uses that same `DATABASE_URL`. Account profiles,
sessions, linked providers, and profile storage snapshots are migrated into the
`helix_accounts`, `helix_account_sessions`, `helix_account_linked_providers`,
and `helix_account_profile_storage` tables. Do not add separate `PGHOST` or
`PGUSER` style settings for this path; `server/db/client.ts` owns the full
connection string.

For local development without `DATABASE_URL`, the app uses a pg-mem fallback and
persists that fallback to `.cal/local-pg-mem.json` so workstation accounts,
password credentials, email recovery rows, profile saves, rooms, and connector
bindings survive server restarts. Override the file with
`HELIX_LOCAL_DB_PATH`, or set `HELIX_LOCAL_PG_MEM_PERSIST=0` only for disposable
memory-attribution or test runs. Large recent ingress/replay test corpora remain
inside the database's required idempotency window and can materially increase
the local process heap; do not disable persistence for normal room operation.

## High-Signal Runs

Start with the agent and workstation checks. They exercise the main user-facing
surface where the program is most capable.

```bash
npm run helix:ask:regression:light
npm run helix:ask:api-parity
npm run helix:ask:discipline:quick
```

Use these when validating the physical and theory-backed reference layers:

```bash
npm run physics:validate
npm run math:validate
npm run math:congruence:check
npm run casimir:verify
```

Representative preset and campaign lanes:

```bash
npm run starsim:solar:reference
npm run starsim:fusion:stage2-gate
npm run warp:full-solve:readiness
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
npm run nhm2:validate-observable-equation-map
```

For local product work:

```bash
npm run build
npm test
npm run hooks:install
```

`npm run hooks:install` configures local verification hooks before commits. Use
`SKIP_VERIFY=1` only for emergency bypasses.

## Architecture

```text
user prompt or operator action
  -> Helix Ask / Live Answer API
  -> route, source, and tool admission
  -> workstation tool or panel action
  -> typed observation, receipt, or artifact
  -> evidence re-enters the solver
  -> model synthesis
  -> route/product and terminal authority
  -> one visible answer, request for input, or typed failure
```

Main repo layers:

```text
client/ workstation UI and launch panels
server/ Express API, Helix Ask runtime, physics endpoints
shared/ schemas, theory contracts, workstation contracts
docs/ architecture, runbooks, audits, theory notes
tools/ scripts/ cli/ reproducible runners and validators
modules/ sim_core/ simulations/ numerical and physics code
artifacts/ reports/ generated evidence and verification outputs
```

## Core Systems

### Helix Ask And Live Answer

Helix Ask is the policy and evidence boundary around Codex Workstation Mode.
Codex is the user-facing runtime agent; internal or test runtimes must not be
silently substituted during a turn. Runtime-specific launch, streaming, and
protocol translation belongs under
`server/services/helix-ask/agent-providers/`.

Capability lanes and workstation tools may use different executors and typed
observation schemas, but they all conform to the lifecycle in **Agent And Tool
Contract (Read First)**. Their output is non-terminal until it re-enters Codex
and passes Helix terminal eligibility. Current lane implementation status
belongs in `docs/helix-ask-provider-capability-contracts.md`, not in this README.

Important paths (new lifecycle behavior belongs under `server/services/helix-ask/`;
`server/routes/agi.plan.ts` is retired compatibility wiring and should not grow):

- `server/routes/agi.plan.ts`
- `server/services/helix-ask/`
- `server/services/helix-ask/agent-providers/`
- `server/services/helix-ask/workstation-tool-gateway/`
- `server/services/helix-ask/capability-lanes/`
- `client/src/components/helix/HelixAskPill.tsx`
- `shared/helix-capability-lane.ts`
- `shared/helix-ask-*.ts`
- `shared/helix-agent-runtime.ts`
- `docs/helix-ask-provider-capability-contracts.md`
- `docs/helix-ask/workstation-tool-contracts/README.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-environment-harness-work-program-v1.md`
- `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`
- `docs/architecture/helix-environment-agent-reasoning-v1.md`
- `docs/architecture/voice-service-contract.md`

### Workstation Launch Panels

The workstation is the user-facing tool surface. Panels are registered once and
then become launchable through `/desktop`, the Helix Start launcher, taskbar
state, and panel-aware agent actions.

Current panel families include:

- Agent and operations: Essence Console, Task History, Debate View, Constraint
  Pack Policies, Contribution Workbench.
- Evidence and reflection: Docs Viewer, Universal Audit Tree, Math Maturity
  Tree, Theory Badge Graph, Moral Badge Graph.
- Calculation and theory: Scientific Calculator, Needle MK2 Calculator, NHM2
  Solve State, NHM2 Calibration + Proof, observable/equation tooling.
- Observational simulation: Star Watcher, Hydrostatic Equilibrium, Solar Globe,
  DeepMix Solar views, Tokamak Simulation, Stellar LSR Viewer.
- Warp and Casimir diagnostics: Drive Guards, Alcubierre Viewer, Spectrum
  Tuner, Casimir Tile Grid, QI Widget, Curvature Ledger, Vacuum Contract,
  Shift Vector, Direction Pad, Speed Capability.

Panel registration lives in `client/src/pages/helix-core.panels.ts`. Desktop
window registration is described in `docs/helix-desktop-panels.md`.

### Workstation Interface Language Contract

Account language changes are catalog-driven for static workstation UI. When a
panel adds or changes visible text, classify each string before it ships:

- Static catalog UI: panel titles, tabs, buttons, menus, presets, tooltips,
  empty states, fixed explanations, badge-card labels, and graph background
  labels belong in `client/src/lib/i18n/messages/source.ts` and every target
  catalog under `client/src/lib/i18n/messages/`.
- Dynamic translatable content: document excerpts, generated answers, retrieved
  evidence, runtime graph facts, and user-authored content should stay outside
  the static catalog and use translate-on-demand paths with provenance.
- Approved exact tokens: product names, math symbols, metric keys, IDs, and
  developer labels may remain exact only when the coverage/audit rules classify
  them as intentional.

New panels or new panel regions should also update
`scripts/audit-workstation-language-coverage.ts` so the workstation audit knows
which files contain static UI and which generated text is intentionally dynamic.

Before treating panel language coverage as complete, run:

```bash
npm run i18n:check
npm run --silent i18n:coverage
npm run i18n:workstation:audit
npx vitest run client/src/lib/i18n/__tests__/interfaceCatalog.spec.ts --pool=forks
```

The target state is: every target catalog has the same source IDs, coverage
reports `missingStrings: 0`, non-approved `exactEnglishStrings: 0`, the
workstation audit reports `unresolvedStaticUi: 0`, and any remaining dynamic
text is deliberately handled by translate-on-demand instead of hardcoded panel
copy.

### Workstation Tool Calls

Tool calls are not answer writers. They are evidence producers that return
typed observations and artifacts for the solver to use.

Current job-ready capability families include:

| Family | Typical actions | Authority boundary |
| --- | --- | --- |
| Docs and repo evidence | Open docs, search docs, locate sections, summarize or explain current documents, search repo concepts. | Evidence must be synthesized before becoming an answer. |
| Notes and clipboard | Create notes, append to notes, copy receipts, read or write clipboard state. | Receipts can confirm state changes, but explanations still pass through the solver. |
| Calculator and equations | Solve expressions, load theory payloads, run compound math traces. | Numeric results are observations until validated and explained. |
| Theory graph | Locate badges, build reflections, load compound runs, expose claim boundaries. | Reflection identifies relevant theory; it does not prove the final claim alone. |
| Ideology and ethos | Search ideology nodes, build context packs, compare motives to Moral/mission frameworks. | Context packs advise interpretation; they are not terminal authority. |
| Voice and live environment | Propose voice delivery, bind live answer environment, emit callout receipts. | Voice certainty must not exceed text certainty. |

Implementation anchors:

- `docs/helix-ask/workstation-tool-contracts/README.md`
- `client/src/lib/workstation/panelCapabilities.ts`
- `client/src/lib/workstation/panelActionAdapters.ts`
- `client/src/lib/workstation/launchPanelPolicy.ts`
- `client/src/store/useWorkstationNotesStore.ts`
- `client/src/store/useWorkstationWorkflowTimelineStore.ts`

### Theory Congruence Network

The canonical theory architecture is the typed theory badge graph. It describes
how first principles, laws, derived relations, simulation-specific equations,
diagnostic gates, runtime presets, source refs, calculator payloads, and claim
boundaries connect.

This is the mathematical congruence network the agent can reflect against. A
user can ask about an idea, and Helix Ask can locate the relevant theory region,
inspect uncertainty, load calculator payloads or runtime traces, and explain how
far the current runnable code supports the claim.

The older root-to-leaf manifests and audit DAG files remain compatibility and
verification scaffolding. They should not be presented as the main conceptual
UI model when explaining the current workstation.

Useful paths:

- `docs/architecture/theory-badge-graph-contract.md`
- `shared/contracts/theory-badge-graph.v1.ts`
- `shared/theory/helix-theory-badge-graph.ts`
- `shared/theory/theory-compound-run-builder.ts`
- `server/services/helix-ask/theory-context-reflection-tool.ts`
- `server/services/helix-ask/theory-congruence/solver-adapter.ts`
- `client/src/components/panels/TheoryBadgeGraphPanel.tsx`

### Observational And Theoretical Presets

CasimirBot organizes runnable reference surfaces into two broad kinds.

Observational presets are tied to measured, simulated, or environment-like
systems. Examples include star/solar workflows, tokamak simulation, stellar LSR
views, live-source bindings, repo/docs evidence, and panel state observations.
They help Helix Ask compare a prompt against phenomena that have measurements,
feeds, datasets, or reproducible simulator outputs.

Theoretical presets are tied to math structure and claim boundaries. Examples
include the theory badge graph, NHM2 full-solve rows, Alcubierre/Natario metric
lanes, Casimir/QI gates, GR constraint checks, equation visualizer presets, and
proof-pack/certificate artifacts. They help the agent ask what the math allows,
what is merely diagnostic, and what remains blocked.

The important point is that presets are reference surfaces for the agent and
the user. They are not independent conclusions.

### NHM2 And Warp Full-Solve Campaigns

NHM2 remains a major use case, but it is one use case inside the larger
workstation and theory framework. The lane is organized around selected-family
shift-lapse profiles, York-control proof packs, campaign runners, geometry
conformance, strict signal readiness, source closure, observer audits, and
full-loop audits.

Representative scripts:

```bash
npm run warp:full-solve:readiness
npm run warp:full-solve:canonical
npm run warp:full-solve:reference:refresh
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
npm run warp:full-solve:nhm2-shift-lapse:publish-source-closure
npm run warp:full-solve:nhm2-shift-lapse:publish-observer-audit
npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit
```

Useful docs and artifacts:

- `docs/nhm2-closed-loop.md`
- `docs/nhm2-audit-checklist.md`
- `docs/audits/research/selected-family/nhm2-shift-lapse/`
- `artifacts/research/full-solve/`

### Agent-Loop Verification

Use the quick guard plus the narrow test for the contract changed. Run the full
discipline gate for live-source identity or continuation changes:

```bash
npm run helix:ask:discipline:quick
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npm run helix:ask:discipline:full
npm run helix:ask:api-parity
```

For live agent/LLM-path parity, use the operator's already-keyed localhost
server. Agents should not start their own development server to prove model-path
behavior unless explicitly asked; if no suitable server is running, ask the user
to start the normal local server and then run the parity probe against it.

Broad-suite baseline failures do not replace isolated contract tests, but they
must be reported rather than silently ignored.

### Verification Layer

Verification keeps research claims tied to source files, scripts, generated
artifacts, certificates, traces, and policy gates. The current theory graph is
the conceptual model; the math graph, audit tree, root-to-leaf manifests, and
reports remain important verification and compatibility artifacts.

Key files:

- `WARP_AGENTS.md`
- `MATH_STATUS.md`
- `MATH_GRAPH.json`
- `math.evidence.json`
- `reports/math-report.json`
- `reports/math-report.md`
- `training-trace.jsonl`

Representative scripts:

```bash
npm run math:report
npm run math:validate
npm run math:trace
npm run validate:physics:root-leaf
npm run casimir:verify
```

## Repository Tour

| Path | Purpose |
| --- | --- |
| `client/` | React/Vite TypeScript workstation, Helix Ask UI, Launch panels, hooks, stores, and shared UI state. |
| `server/` | Express API, Helix Ask runtime, AGI routes, physics endpoints, energy pipeline, and telemetry services. |
| `shared/` | Cross-stack schemas, theory contracts, workstation contracts, and Helix Ask envelope types. |
| `docs/` | Architecture specs, runbooks, theory notes, audits, readiness loops, and workflow guidance. |
| `tools/` | Reproducible runners, validators, report builders, NHM2 utilities, and CI helpers. |
| `scripts/` | Campaign runners, probes, audits, sweep scripts, and local workflow automation. |
| `cli/` | Command-line research and validation entry points. |
| `modules/` | Shared physics and numerical modules. |
| `sim_core/` | Simulation core utilities. |
| `simulations/` | Static simulation cases and outputs. |
| `configs/` | Scenario, model, manifest, policy, and verification configuration. |
| `artifacts/` | Generated evidence, traces, rendered frames, bundles, campaign outputs, and release artifacts. |
| `reports/` | Generated math and verification reports. |
| `warp-web/` | Stand-alone research microsites and HTML experiments. |

## Environment

Common controls:

| Variable | Use |
| --- | --- |
| `ENABLE_AGI` | Enables AGI routes for Helix Ask and agentic workflows. |
| `ENABLE_ESSENCE` | Enables Essence-linked AGI runtime behavior used by the AGI dev scripts. |
| `ENABLE_AGI_AUTH` | Enables bearer-token requirements for AGI routes when configured. |
| `AGI_TENANT_REQUIRED` | Requires tenant/customer isolation headers for AGI routes when configured. |
| `ENABLE_REPO_TOOLS` | Exposes repo-safe helpers for read-only diffing and patch dry-runs. |
| `LLM_POLICY` | Selects the policy path for LLM-backed behavior. |
| `LLM_RUNTIME` | Selects the runtime path for LLM-backed behavior. |
| `LLM_HTTP_BASE` | HTTP model endpoint base URL when using an HTTP runtime. |
| `OPENAI_API_KEY` | Optional provider key for OpenAI-backed model calls. |
| `ELEVENLABS_API_KEY` | Optional provider key for voice delivery. |
| `HULL_MODE` | Legacy hull/runtime posture flag. It does not block outbound LLM or translation calls by itself. |
| `HULL_OUTBOUND_GUARD` | Optional explicit outbound allowlist guard. Set to `1` only when you want host allowlist enforcement. |
| `HULL_ALLOW_HOSTS` | Host allowlist used only when `HULL_OUTBOUND_GUARD=1`. |
| `PUMP_DRIVER` | Selects the pump driver; defaults to the mock driver. |
| `PUMP_LOG` | Logs pump duty updates when set to `1`. |

For a fuller environment guide, see `docs/ENVIRONMENT.md` and `.env.example`.

## Testing And CI-Style Checks

General product checks:

```bash
npm test
npm run typecheck
npm run build
npm run verify:local
npm run reports:ci
```

Targeted research and verification checks:

```bash
npm run casimir:verify:ci
npm run warp:promotion:readiness:check
npm run warp:integrity:check
npm run warp:render:congruence:check
npm run claims:disclaimer:check
```

Helix Ask-sensitive changes should also run the discipline guard or the relevant
prompt-solving/API parity tests described in `docs/helix-ask-codex-loop-discipline.md`.

## Observability

When the server is running:

- Prometheus metrics: `GET /metrics`
- AGI tool logs: `GET /api/agi/tools/logs?limit=50`
- AGI tool log stream: `GET /api/agi/tools/logs/stream`
- Ask turn debug export: `GET /api/agi/ask/turn/:turnId/debug-export`
- Training trace export: `GET /api/agi/training-trace/export`

Local Prometheus/Grafana:

```bash
docker compose -f docker-compose.observability.yml up
```

Prometheus runs on port `9090`; Grafana runs on port `3001` with the default
local credentials described in the compose setup.
