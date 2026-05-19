# AGENTS

This repo uses `WARP_AGENTS.md` for warp-physics constraints and required tests.
Always read and follow those requirements when working on warp/GR features.
For deterministic G4 debugging workflow, also follow `AGENT_PLAYBOOK.md`.

## Required: Casimir verification gate for any patch

All agents must run this verification for every patch and report the PASS
verdict plus certificate hash/integrity status in the response.

When you make any code/config change:

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
- `docs/helix-ask-api-parity-matrix.md`

Patch-time contract:
- Classify the change as `runtime-adapter`, `evidence-lane`,
  `retrieval-gate`, `proof-policy`, `live-source`, `presentation`, or
  Codex-owned runtime behavior before editing.
- Codex owns generic sampling loops, tool execution, retries, approval,
  sandboxing, compaction, session lifecycle, subagent orchestration, and
  terminal turn completion. Do not recreate those in Helix Ask.
- Helix Ask may add source-target admission, evidence identity, provenance,
  proof gates, route/product contracts, terminal eligibility, and debug traces.
- Lexical cues in user text are not execution. Contextual, negated, historical,
  future, quoted, or screen-visible tool/control words must not admit mutating
  tools unless the prompt is an affirmative operator command.
- Receipts, live-card projections, process graphs, client projections, and
  panel-generated text are not answer authority unless the route-product
  contract explicitly allows that terminal product.
- For applicable Helix Ask changes, run the API parity test or live-server
  parity probe and report any disabled/frontier scenarios separately:
  `npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks`
  or `npm run helix:ask:api-parity`.

Agent expectations for readiness loop:
- Run contract battery + variety battery and report probability scorecard.
- Treat Casimir verification as a hard gate for completion claims.
- Include prompt/output/verdict evidence for representative pass and fail cases.

Mission-control expectations:
- Keep voice certainty no stronger than text certainty.
- Favor event-driven low-noise callouts over long narration.
- Preserve deterministic error/fail reasons for replay and operator trust.
- Keep local-first ownership assumptions explicit when discussing deployment.
