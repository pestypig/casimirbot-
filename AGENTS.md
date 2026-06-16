# AGENTS

## Canonical working root

The authoritative CasimirBot checkout is this Desktop repository:

`C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot`

Do not infer the working root from matching filenames, a clean git status, or a
`Documents\Codex\...` chat folder. If multiple CasimirBot checkouts are found,
patch this Desktop checkout unless the user explicitly names another path. If
the current shell is outside this root, either run commands with an explicit
`-C`/`--prefix` target or ask the user before editing.

This repo uses `WARP_AGENTS.md` for warp-physics constraints and required tests.
Always read and follow those requirements when working on warp/GR features.
For deterministic G4 debugging workflow, also follow `AGENT_PLAYBOOK.md`.

## Casimir verification gate

Run Casimir verification when the patch touches warp/GR physics, adapter
contracts, constraint packs, training-trace export/capture, certificate
semantics, CI/release verification, or code that claims physical viability,
proof maturity, or certified gate status. Report the PASS verdict plus
certificate hash/integrity status when this gate applies.

For ordinary UI, copy, documentation, test-only, or non-physics application
patches, prefer the relevant local unit/build checks instead of spending a
server-backed Casimir verify run. Do not present skipped Casimir verification as
proof of adapter or certificate integrity.

When the gate applies:

1) Propose the patch (diff) as usual.
2) Run the verifier using the adapter endpoint.
3) If the verdict is FAIL:
   - fix the first failing HARD constraint
   - re-run verification
   - repeat until PASS
4) Do not claim completion unless you have a PASS and (when required by policy)
   a certificate hash with integrity OK.

### Verification call (adapter)
- Endpoint: `POST /api/agi/adapter/run`
- Expect: `verdict`, `firstFail`, `deltas`, and artifact refs.

### Trace export (for training/analytics)
- Endpoint: `GET /api/agi/training-trace/export` (JSONL)

## Training data lifecycle
The training data pipeline is always present (trace capture -> gates -> export).
Do not rebuild infrastructure per patch; re-run exports only when you want fresh
datasets. A PASS Casimir verify confirms gate integrity at that moment but does
not replace training data checks or guarantee future patches remain valid.

### Auth + tenant isolation (when enabled)
- If `ENABLE_AGI_AUTH=1` or `AGI_TENANT_REQUIRED=1`, include:
  - `Authorization: Bearer <token>`
  - `X-Tenant-Id` (or `X-Customer-Id`)

### CI enforcement
- GitHub Actions workflow: `.github/workflows/casimir-verify.yml`

## Math maturity (informal)
- Treat math as staged: exploratory -> reduced-order -> diagnostic -> certified.
- Match claims and checks to maturity; don’t over-claim results from early stages.

## Ideology references
When a user asks for ideology references, anchor to the base of the ideology tree
(`docs/ethos/ideology.json`) and use the relevant branches to relate wisdom to
the scenario presented for advice.

## Mission-control context pack (voice + Go Board work)
When touching mission-overwatch, voice-callout, or Go Board workflows, read these
files before proposing changes:
- `docs/BUSINESS_MODEL.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`

## Helix Ask readiness debug loop (routing/scaffold/fallback changes)
When touching Helix Ask routing, frontier scaffolds, fallback behavior, output
cleaning, or ideology narrative contracts, use:
- `docs/helix-ask-readiness-debug-loop.md`

## Helix Ask / Codex loop discipline (required for agent-loop changes)
When touching Helix Ask agent-loop, source-target, route admission,
tool-admission, live-source, workstation-action, route-product, terminal
authority, loop-parity, debug-export, or Ask API behavior, also read and follow:
- `docs/helix-ask-codex-loop-discipline.md`
- `docs/helix-ask-turn-solver-spine.md`
- `docs/helix-ask-api-parity-matrix.md`

Patch-time contract:
- Classify the change before editing as `prompt interpretation`, `intent
  arbitration`, `source admission`, `tool admission`, `evidence normalization`,
  `evidence re-entry`, `follow-up reasoning`, `terminal authority`,
  `presentation`, or Codex-owned runtime behavior.
- Codex owns model sampling, generic tool execution, tool-result re-entry,
  retries, approvals, sandboxing, compaction, session lifecycle, subagent
  orchestration, and terminal completion. Do not recreate those in Helix Ask.
- Helix Ask owns prompt interpretation policy, intent arbitration,
  source-target admission, evidence identity, provenance, proof gates,
  route/product contracts, route authority, terminal eligibility, and debug
  traces.
- Routes are proposed procedures, not conclusions. Receipts are observations,
  not answers. Classifiers generate hypotheses, not authority. Only the
  completed solver path can answer.
- Every debug Ask turn must expose `ask_turn_solver_trace` and route-first hard
  gates must fail closed as typed failures for hard source-targeted or complex
  prompts.
- If present, use the ignored local Codex reference checkout at
  `external/openai-codex-compare` for grep/diff comparisons. Do not commit or
  mutate it as part of Helix Ask patches.
- Use `npm run helix:ask:discipline:quick` as a cheap static classifier when
  touching Helix Ask-sensitive surfaces. Do not treat the full discipline guard
  as a universal handoff gate; run targeted tests for the contract actually
  changed. Use `npm run helix:ask:discipline:full` only when live-source
  identity or continuation behavior changed.
- Lexical cues in user text are not execution. Contextual, negated, historical,
  future, quoted, or screen-visible tool/control words must not admit mutating
  tools unless the prompt is an affirmative operator command.
- Receipts, live-card projections, process graphs, client projections, and
  panel-generated text are not answer authority unless the route-product
  contract explicitly allows that terminal product.
- Reject or flag changes that implement a private sampling loop, private tool
  execution runtime, sandbox/approval lifecycle, session compaction, subagent
  orchestration, or terminal completion machinery.
- Every shortcut-like rule must include adversarial tests for contextual,
  negated, future/conditional, historical, quoted/screen-visible, and mixed
  intent prompts.
- For applicable Helix Ask changes, choose the narrowest meaningful verification
  path and report any disabled/frontier scenarios separately:
  `npm run helix:ask:discipline:quick` for static changed-file classification
  and shortcut-risk scanning;
  `npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks`
  for prompt interpretation, lexical/tool cue, shortcut, mixed-intent, or
  source-admission changes;
  `npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks`
  for Ask API, route-product, loop-parity, and terminal-authority contract
  changes;
  `npm run helix:ask:api-parity` for parity against an already-running keyed
  local server; and
  `npm run helix:ask:discipline:full` for live-source identity or continuation
  changes.

Agent expectations for readiness loop:
- Run contract battery + variety battery and report probability scorecard.
- Treat Casimir verification as a hard gate for completion claims only when the
  patch touches its verification scope: warp/GR, adapter, constraint-pack,
  training-trace, certificate, CI/release, or proof-maturity surfaces.
- Include prompt/output/verdict evidence for representative pass and fail cases.

Mission-control expectations:
- Keep voice certainty no stronger than text certainty.
- Favor event-driven low-noise callouts over long narration.
- Preserve deterministic error/fail reasons for replay and operator trust.
- Keep local-first ownership assumptions explicit when discussing deployment.
