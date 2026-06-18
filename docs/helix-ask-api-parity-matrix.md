# Helix Ask API Parity Matrix

The API parity harness tests Helix Ask through the same top-level API surface used by the UI. It is not an answer route, not a private agent loop, and not a replacement for Codex-owned sampling, tool execution, approval, sandboxing, or terminal completion.

## Goal

Catch deterministic short-circuiting from normal Ask turns:

```txt
prompt -> source target -> route candidates -> admitted tools -> actual tools
-> observations -> finalizer -> route authority -> poison audit -> terminal authority
```

A probe passes only when:

```txt
debug_export_available = true
terminal_authority_ok = true
route_authority_ok = true
unexpected_tool_calls = []
short_circuit_risk_flags = []
poison_audit.ok = true does not mask route_authority_ok = false
```

Identity-split scenarios are the exception to the completed-solver-path
expectation: they may intentionally require `completed_solver_path = false`
when `helix.live_source_identity_audit.v1` records a non-ok diagnosis. They must
still avoid mutating tools and forbidden terminal artifacts.

For hard source-targeted prompts, a missing route product contract is a failure. Contextual tool verbs, screen text, historical tool mentions, negated commands, future commands, and status questions must not create mutating tool calls unless the prompt is an affirmative operator command.

## Matrix

The first parity pack is defined in `server/services/helix-ask/api-parity-matrix.ts`.

```txt
visual_content_active_source
visual_content_negated_cadence
procedure_epoch_interval_status
affirmative_cadence_control
contextual_click
live_source_identity_active_bound
live_source_identity_wrong_environment
live_source_identity_missing_environment_source
live_source_identity_no_situation_run
live_source_identity_no_field_evaluations
live_source_identity_stale_interpretation
```

Disabled follow-up scenarios:

```txt
screen_text_start_button
historical_tool_mention
live_source_identity_fresh_unbound
```

`screen_text_start_button` currently needs an input-integrity policy split for screen text that names UI controls. `historical_tool_mention` needs a prior-debug-export seed.
`live_source_identity_fresh_unbound` is present as a frontier scenario, but the
current explicit visual route auto-binds that topology before final audit
capture. The raw audit invariant is covered by
`server/__tests__/helix.ask.live-source-identity-audit.test.ts` until the route
stops mutating the topology ahead of audit capture.

The live-source identity group checks:

```txt
active_environment_id
active_environment_source_id
active_visual_producer_id
active_visual_producer_source_id
freshest_visual_source_id
freshest_visual_source_environment_id
freshest_visual_observation_ref
freshest_visual_analysis_job_id
selected_situation_run_id
selected_observation_refs
field evaluation availability
interpretation availability
```

The expected non-ok diagnoses are not answers. They prove why a visual turn is
not yet eligible to answer from capture evidence.

## Running Against A Live Server

Use the operator's normal keyed localhost server with the test harness enabled.
Do not start a new development server from an agent shell solely to test
agent/LLM-backed behavior unless the user explicitly asks for that process. The
agent shell may not have the provider keys, tenant headers, auth state, browser
state, or workstation bindings needed to exercise the same model path as the
user's normal session.

Operator-started server example:

```powershell
$env:ENABLE_HELIX_TEST_HARNESS="1"; npm run dev:agi:5050
```

After the server is running, the agent may run:

```bash
npm run helix:ask:api-parity
```

For the cross-tool Codex-parity agent-spine rail smoke, run:

```bash
npm run helix:ask:live-spine-smoke
```

That probe uses the same operator-started server and writes full Ask responses,
debug exports, and per-turn rail summaries. It checks the recurring spine
contract:

```txt
requested/visible capability -> selected/admitted/executed capability
-> observation -> re-entry -> goal satisfaction -> terminal authority
-> visible projection
```

It currently covers calculator, workspace status, docs locate, repo search,
internet search/config, live-source mail, runtime capability catalog, negated
tool mentions, visual capture, and the image-lens visual alias.
Dry-run output exposes explicit coverage tags for these acceptance families:

```txt
calculator
docs
repo_code
workspace_status
live_source_mail
internet_search
visual_capture
image_lens
capability_catalog
negated_contextual_tool_mentions
```

The normalized rail also records `admission_proof_source`, `admission_proven`,
`required_observation_kinds_for_requested_capability`,
`observed_artifact_supports_requested_capability`, `reentry_proof_source`, and
`reentry_proven`, `terminal_authority_proof_source`,
`terminal_authority_proven`, `visible_projection_source`, and
`visible_projection_proven` so selected/executed capability progress cannot be
counted unless an admission rail exists, a satisfied requested-capability goal
cannot hide behind an unrelated observation, `reentered` means the debug mirror
can name the proof that evidence re-entered the solver, and selected/visible
terminal kinds cannot be counted unless their authority and projection sources
are named. The normalized status fields must also agree: a rail is complete only
when both `rail_status` and `codex_parity_class` say `complete`; otherwise the
debug is classified as a stale or inconsistent mirror.

The browser/UI debug parity harness also checks that copied UI debug exports
contain the same normalized rail table and that its selected terminal kind
matches the visible terminal kind and terminal authority with source-backed
terminal/projection proof fields.

For the broader workstation/tool-chain regression matrix, run:

```bash
npm run helix:ask:tool-chain-matrix
```

That probe also uses the operator-started server. It writes Ask responses,
debug exports, per-scenario probe results, and a normalized matrix summary for
tool-backed turns across calculator, docs, repo, workspace, live environment,
internet-search/config, and visual/tool aliases. Before running scenarios it
preflights the Ask turn debug-export endpoint. If the endpoint is unreachable or
not mounted, the probe writes a blocked summary instead of reporting misleading
tool-chain failures.

Both live probes support dry-run inspection without server access:

```bash
npm run helix:ask:live-spine-smoke -- --dry-run
npm run helix:ask:tool-chain-matrix -- --dry-run
```

For any rail marked `complete`, the API probe, live spine smoke, tool-chain
matrix probe, and UI debug harness also treat the answer envelope as part of the
same projection contract. A complete rail fails if the response still carries a
`terminal_error_code`, a `typed_failure` terminal/source, a non-`final_answer`
status, or no visible final answer text. This catches regressions where debug
mirrors look complete while the user-visible/API terminal answer still says the
turn failed.

If no suitable keyed server is already running, report live parity as blocked and
ask the user to start the normal localhost server. Static and unit parity tests
may still run without a live server when they do not require provider secrets.

Useful environment variables:

```txt
HELIX_ASK_BASE_URL=http://127.0.0.1:5050
HELIX_ASK_API_PARITY_OUT=artifacts/helix-ask-api-parity
HELIX_ASK_API_PARITY_SCENARIOS=visual_content_negated_cadence,affirmative_cadence_control
HELIX_ASK_API_PARITY_INCLUDE_DISABLED=1
HELIX_ASK_LIVE_SPINE_OUT=artifacts/helix-ask-live-spine-smoke
HELIX_ASK_LIVE_SPINE_SCENARIOS=calculator_explicit,capability_catalog_runtime
HELIX_ASK_TOOL_CHAIN_OUT=artifacts/helix-ask-tool-chain-matrix
HELIX_ASK_TOOL_CHAIN_SCENARIOS=negated_docs_open,auntie_dottie_repo
HELIX_ASK_TOOL_CHAIN_TIMEOUT_MS=240000
HELIX_ASK_TOOL_CHAIN_FAIL_ON_WARN=1
HELIX_ASK_TOOL_CHAIN_DRY_RUN=1
```

Each scenario writes:

```txt
seed.json
ask-response.json
debug-export.json
probe-result.json
```

The run writes `summary.json` and `summary.md`.

## Boundary

Codex owns the generic runtime loop. Helix Ask owns source-target admission, evidence normalization, route product contracts, proof gates, route authority, terminal eligibility, and presentation discipline.

The parity harness is only a debug observer over that contract.
