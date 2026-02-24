HEAD=d1c6a0db8132300f12672f749098e49896d92cc2
Date=2026-02-24 (America/New_York)

Target deliverables:
- `docs/audits/research/helix-dottie-method-benchmark-2026-02-24.md` (this report)
- `reports/helix-dottie-method-gap-backlog-2026-02-24.md`
- `reports/helix-dottie-method-decision-matrix-2026-02-24.json`

# Helix Ask x Dottie Method Benchmark 2026-02-24

Baseline lock note:
- `git fetch origin main && git checkout main && git pull --ff-only origin main` is `missing_evidence` for the research runtime where only GitHub connector access was used.
- HEAD alignment was evaluated against current main through connector compare semantics.

Evidence labels:
- `claim_status: verified`
- `claim_status: inference`
- `claim_status: missing_evidence`

## Executive verdict

Verdict: CONDITIONAL GO. (`claim_status: inference`)

Current architecture is directionally strong:
- Event-driven mission state.
- Deterministic suppression categories.
- Replay/debrief as first-class outputs.
- Voice as policy-governed action channel.

Primary conditions before production trust:
- Remove silent nondeterministic defaults (`Date.now()`, fallback timestamps/IDs).
- Remove policy drift risk across client/server policy copies.
- Strengthen evidence and parity defaults so they are non-optional in mission callouts.

## Why this remains the best practical path now

1. Existing stack already includes:
- Dedupe cooldowns and mission-level rate constraints.
- Typed suppression reasons contract.
- Mission-board event persistence and snapshot fold.
- Voice governance: local-first options, provider controls, budgets, breaker.
- Certainty/evidence parity logic for repo-attributed callouts.

2. This allows additive hardening without rewriting public surfaces:
- Keep `/api/mission-board/*` and `/api/voice/speak`.
- Tighten invariants, trace linkage, and deterministic replay.

## Weighted decision matrix summary

Rubric:
- Fit to event-driven ops: 25
- Determinism/replay trust: 25
- Operational maturity: 20
- Integration cost to current repo: 15
- Licensing/deployment safety: 15

Ranked approaches:
1. Deterministic workflow-history substrate (plus current edge contracts): **86/100** (`inference`)
2. Harden current in-repo method with strict determinism and parity defaults: **80/100** (`inference`)
3. Replayable event bus with durable consumers and idempotent projections: **78/100** (`inference`)

## Key bottlenecks (ranked)

1. Nondeterministic default IDs/timestamps in mission routes.
- Severity: P0
- Effort: S/M
- Risk: replay drift and trust erosion.

2. Evidence parity is opt-in (`repoAttributed`) instead of mission-safe default.
- Severity: P0
- Effort: S
- Risk: repo-attributed sounding callouts without evidence anchors.

3. Policy drift risk (eligibility logic duplicated in client and server layers).
- Severity: P1
- Effort: M
- Risk: mismatched suppress/emit behavior and confusing operator experience.

4. Voice budget/cooldown uses wall-clock only (`Date.now`), not replay timestamp.
- Severity: P1
- Effort: M
- Risk: cannot deterministically reproduce under replay.

5. Mission-board strict persistence mode missing.
- Severity: P0
- Effort: S
- Risk: silent fallback to memory in environments expecting durable store.

## 30/60/90 roadmap

### 30 days
- Require deterministic timestamps/IDs for Tier1 mission event ingestion.
- Default mission callouts to repo-attributed unless explicitly non-repo.
- Consolidate callout eligibility matrix into shared implementation.
- Add deterministic failure envelopes for missing required replay fields.

### 60 days
- Add policy snapshot endpoints for operator introspection.
- Add replay-safe time basis for voice policy evaluation.
- Persist trace linkage fields on mission-board events.

### 90 days
- Introduce deterministic orchestration substrate:
  - workflow history model, or
  - durable event stream with idempotent consumers.
- Keep existing API contracts as edge adapters.

## Kill criteria

1. Replay determinism fails after hardening.
2. Mission tempo SLOs cannot hold under realistic load.
3. Voice certainty/evidence parity violations appear in production traces.
4. Any critical path can drop events with no audit trail.

## First PR to open next

Title:
- `Make Tier1 mission/voice determinism non-optional`

Files:
- `server/routes/mission-board.ts`
- `server/routes/voice.ts`
- `tests/helix-dottie-replay-integration.spec.ts`
- `tests/generated/helix-dottie-situational.generated.spec.ts`
- `scripts/helix-dottie-situational-report.ts`

Intent:
1. Require Tier1 event `ts`.
2. Default mission callouts to `repoAttributed=true`.
3. Add replay-time policy clock input for voice suppression checks.
4. Extend situational report with explicit policy-trace correlation rows.

Validation:
```bash
npx vitest run \
  tests/generated/helix-dottie-situational.generated.spec.ts \
  tests/helix-dottie-replay-integration.spec.ts \
  tests/voice.routes.spec.ts \
  tests/mission-board.routes.spec.ts
```

Casimir gate:
```bash
npm run casimir:verify -- \
  --url http://127.0.0.1:5173/api/agi/adapter/run \
  --export-url http://127.0.0.1:5173/api/agi/training-trace/export \
  --trace-out artifacts/training-trace.jsonl \
  --trace-limit 200 \
  --ci
```

## Citation links used in research package

- https://temporal.io/
- https://community.temporal.io/t/workflow-determinism/4027
- https://docs.nats.io/nats-concepts/jetstream
- https://docs.nats.io/nats-concepts/jetstream/consumers
- https://docs.nats.io/using-nats/developer/anatomy
- https://docs.nats.io/using-nats/developer/develop_jetstream/consumers
- https://prometheus.io/docs/alerting/latest/alertmanager/
- https://prometheus.io/docs/alerting/latest/configuration/
- https://prometheus.io/docs/introduction/faq/
- https://docs.aws.amazon.com/step-functions/latest/dg/concepts-view-execution-details.html
- https://docs.aws.amazon.com/step-functions/latest/dg/cw-logs.html
- https://aws.amazon.com/about-aws/whats-new/2022/05/announcing-new-workflow-observability-features-aws-step-functions/
- https://support.pagerduty.com/main/docs/event-orchestration
- https://support.pagerduty.com/main/docs/event-management
- https://docs.stackstorm.com/sensors.html
- https://docs.stackstorm.com/orquesta/development/contributing.html
- https://opentelemetry.io/docs/concepts/context-propagation/
- https://opentelemetry.io/docs/languages/dotnet/logs/correlation/
- https://grafana.com/docs/oncall/latest/set-up/open-source/
- https://grafana.com/blog/grafana-oncall-maintenance-mode/
- https://grafana.com/licensing/
