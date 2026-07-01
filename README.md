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

## What To Look At First

| Area | Why it matters | Entry points |
| --- | --- | --- |
| Helix Ask + Live Answer loop | Primary user and agent interface. Handles prompt interpretation, tool admission, evidence re-entry, terminal authority, streamed debug, and the visible answer. | `server/routes/agi.plan.ts`, `docs/helix-ask-agentic-loop-current-overview.md`, `docs/helix-ask-codex-loop-discipline.md`, `npm run helix:ask:regression:light` |
| Agent runtime adapters | Provider edge for Codex Workstation Mode and future selectable agents. Keeps each runtime's invocation/protocol glue outside Helix Ask policy and workstation truth. | `server/services/helix-ask/agent-providers/`, `server/services/helix-ask/workstation-tool-gateway/`, `shared/helix-agent-runtime.ts`, `docs/helix-ask-codex-loop-discipline.md` |
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

```bash
npm install
npm run dev:agi:5050
```

The development server runs Express with Vite middleware. Open:

- Desktop workstation: http://localhost:5050/desktop
- Mobile panels: http://localhost:5050/mobile

Do not start a separate Vite server for normal development; the dev scripts
already wire the API and UI together. Use `npm run dev` for the default port or
`npm run dev:agi:5050` for the AGI-enabled 5050 workflow.

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
$env:HULL_MODE="1"
$env:HULL_ALLOW_HOSTS=""
$env:LLM_HTTP_BASE=""
$env:OPENAI_API_KEY=""
$env:ELEVENLABS_API_KEY=""

npm run dev
```

`GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` should use the same Google OAuth
Web application client ID. `VITE_GOOGLE_CLIENT_ID` is intentionally exposed to
the browser; the other key and token values should remain private.

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

Helix Ask is the reasoning interface over the workstation. It interprets the
prompt, decides whether a tool or source is required, requests deterministic
workstation capabilities, receives typed observations, and synthesizes the
visible answer only after those observations re-enter the solver path.

The Live Answer path is replacing older observation-first surfaces as the place
where users see the answer lifecycle: progress events, tool receipts, debug
exports, and the final terminal artifact selected by authority gates.

Selectable agent runtimes must enter through provider adapters, not through
route-local grafts or workstation-specific forks. Each runtime speaks a
different protocol, so some adapter-specific glue is expected for launch,
streaming, tool-request translation, and final output normalization. Keep that
glue at the adapter edge. The shared Helix contract remains the source of truth:
capability manifests, permission/admission decisions, workstation gateway
observations, action receipts, evidence re-entry, terminal authority, debug
exports, and visible trace projection.

Adding another agent should normally mean adding a thin provider under
`server/services/helix-ask/agent-providers/` that consumes the same workstation
gateway contract. It should not require copying Helix Ask solver policy into the
agent, importing `server/routes/agi.plan.ts`, or giving the agent direct access
to panel internals, filesystem mutation, shell execution, or final-answer
authority.

#### Runtime Agents And Capability Lanes

The selectable Ask runtime is now modeled as a runtime agent provider. The
runtime provider owns the turn style and final candidate path, while Helix owns
capability admission, observation normalization, evidence re-entry, terminal
authority, and debug projection.

Keep these layers separate:

| Layer | Meaning | Current examples |
| --- | --- | --- |
| Runtime agent provider | The agent that owns the turn and produces the final candidate. | `helix` / Helix Ask Native, `codex` / Codex Workstation Mode |
| Capability lane | A governed class of service the runtime may request during a turn. Lane results are observations or receipts, not answers. | `workstation_tool_reference`, `utility_text`, `live_translation`, `visual_analysis` |
| Backend provider | The implementation that can fulfill a lane when that lane graduates from shadow/catalog mode. | Helix workstation gateway, OpenAI-compatible text/vision, Gemini translation, ElevenLabs voice |

The provider-neutral lane catalog lets Helix expose the same governed capability
surface to Helix Native, Codex Workstation Mode, and future runtime agents
without making any lane replace the root agent. A lane can help a runtime
delegate a subtask, such as translation, narration, visual analysis, or compact
classification, but its output must re-enter as a structured observation before
the selected runtime can use it in a final answer.

Current lane catalog:

| Lane | Family | Current status | Notes |
| --- | --- | --- | --- |
| `workstation_tool_reference` | Existing workstation gateway | `available` | Reference lane for the live gateway catalog; this is what Codex is using for `docs.search`, calculator, repo search, reflection, and panel projection receipts. |
| `utility_text` | Text inference | `dry_run` | Cataloged for small classification, extraction, normalization, and compact summary calls. |
| `interactive_text` | Text inference | `dry_run` | Cataloged for low-latency conversational or tool-backed text inference. |
| `deliberate_text` | Text inference | `dry_run` | Cataloged for higher-effort synthesis, planning, and consistency review. |
| `code_text` | Code inference | `dry_run` | Cataloged for code reasoning/review as text; no filesystem mutation authority. |
| `speech_to_text` | Speech to text | `dry_run` | Cataloged for future governed audio transcript observations. |
| `text_to_speech` | Text to speech | `dry_run` | Cataloged for narration/callout receipts; playback is not answer authority. |
| `live_translation` | Live translation | `unconfigured` | Intended for a translation backend such as Gemini realtime translation once keys/endpoints and receipt contracts are configured. |
| `visual_analysis` | Visual analysis | `dry_run` | Cataloged for future image/screen observations. |

This is intentionally additive. Existing workstation gateway calls continue to
work without routing through model/service lanes. Lane execution is still
shadow/catalog-only unless a later patch explicitly graduates a lane with
permission, backend configuration, observation schema, negative-admission tests,
and terminal-authority projection.

Important paths:

- `server/routes/agi.plan.ts`
- `server/services/helix-ask/`
- `server/services/helix-ask/agent-providers/`
- `server/services/helix-ask/workstation-tool-gateway/`
- `server/services/helix-ask/capability-lanes/`
- `server/services/helix-ask/agent-providers/runtime-adapter-contract.ts`
- `client/src/components/helix/HelixAskPill.tsx`
- `shared/helix-capability-lane.ts`
- `shared/helix-ask-*.ts`
- `shared/helix-agent-runtime.ts`
- `docs/helix-ask-provider-capability-contracts.md`
- `docs/helix-ask/workstation-tool-contracts/README.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-codex-loop-discipline.md`

### Workstation Launch Panels

The workstation is the user-facing tool surface. Panels are registered once and
then become launchable through `/desktop`, the Helix Start launcher, taskbar
state, and panel-aware agent actions.

Current panel families include:

- Agent and operations: Essence Console, Task History, Debate View, Constraint
  Pack Policies, Contribution Workbench.
- Evidence and reflection: Docs Viewer, Universal Audit Tree, Math Maturity
  Tree, Theory Badge Graph, Zen Badge Graph.
- Calculation and theory: Scientific Calculator, Needle MK2 Calculator, NHM2
  Solve State, NHM2 Calibration + Proof, observable/equation tooling.
- Observational simulation: Star Watcher, Hydrostatic Equilibrium, Solar Globe,
  DeepMix Solar views, Tokamak Simulation, Stellar LSR Viewer.
- Warp and Casimir diagnostics: Drive Guards, Alcubierre Viewer, Spectrum
  Tuner, Casimir Tile Grid, QI Widget, Curvature Ledger, Vacuum Contract,
  Shift Vector, Direction Pad, Speed Capability.

Panel registration lives in `client/src/pages/helix-core.panels.ts`. Desktop
window registration is described in `docs/helix-desktop-panels.md`.

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
| Ideology and ethos | Search ideology nodes, build context packs, compare motives to Zen/mission frameworks. | Context packs advise interpretation; they are not terminal authority. |
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

### Solver Contract

Every Ask route and workstation panel should preserve this rule of thumb:

```text
Routes are proposed procedures.
Classifiers are hypotheses.
Receipts are observations.
Only the completed solver path can answer.
```

The intended lifecycle is:

```text
prompt + context
-> prompt interpretation and intent arbitration
-> source and tool admission
-> capability or panel action, when admitted
-> typed receipt or observation
-> evidence re-entry into the model-facing turn
-> model-authored answer draft, user-input request, or typed failure
-> goal satisfaction, route authority, poison audit, and terminal authority
-> one visible final answer, request_user_input, or typed_failure
```

This keeps Helix Ask aligned with Codex-style tool use without recreating a
private Codex runtime. Helix owns prompt interpretation policy, evidence
identity, route/product contracts, proof gates, terminal eligibility, and debug
traces. It does not own generic model sampling, sandboxing, approvals, session
compaction, subagent orchestration, or terminal completion machinery.

For agent-loop changes, follow:

- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`

Representative checks:

```bash
npm run helix:ask:discipline:quick
npm run helix:ask:discipline
npm run helix:ask:api-parity
```

For live agent/LLM-path parity, use the operator's already-keyed localhost
server. Agents should not start their own development server to prove model-path
behavior unless explicitly asked; if no suitable server is running, ask the user
to start the normal local server and then run the parity probe against it.

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
| `HULL_MODE` | Enables hull/runtime modes used by some physics panels. |
| `HULL_ALLOW_HOSTS` | Host allowlist for hull/runtime integrations. |
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
