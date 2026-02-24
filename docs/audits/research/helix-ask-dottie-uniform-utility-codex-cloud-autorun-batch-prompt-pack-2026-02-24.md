# Helix Ask x Dottie Uniform Utility Codex Cloud Autorun Batch Prompt Pack (2026-02-24)

Derived from:
- `docs/audits/research/helix-ask-dottie-uniform-utility-deep-research-package-2026-02-24.md`
- `docs/BUSINESS_MODEL.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/helix-ask-runtime-limitations.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`
- `docs/architecture/helix-ask-mission-systems-integration-plan.md`

## Baseline lock

Use current main head at run time:
- `origin/main@<resolve_at_start>`

At prompt start, always print:
- `git rev-parse --short HEAD`
- `git status --short --branch`

## Shared guardrails

```text
Hard constraints:
1) Preserve certainty parity: voice certainty must not exceed text certainty.
2) Preserve evidence posture: repo-attributed claims require evidence refs.
3) Keep voice event-driven, low-noise, rate-limited, and action-oriented.
4) Keep deterministic fail reasons stable across text/voice/board surfaces.
5) Keep local-first ownership posture explicit for production mission callouts.
6) Keep changes additive/non-breaking to /api/agi/ask and /api/voice/speak contracts.
7) No covert sensing: Tier 1 context remains explicit user-start only.
8) One commit per prompt scope.

Mandatory verification after each prompt:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verify FAIL:
- fix first failing HARD constraint
- rerun until PASS

Per-prompt report block:
- prompt_id
- files_changed
- behavior_delta
- tests_or_checks_run
- casimir_verdict
- casimir_firstFail
- casimir_certificateHash
- casimir_integrityOk
- commit_sha
- status (done|partial-blocked|blocked)
```

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Execute Prompt 0 through Prompt 9 in strict order. One commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-dottie-uniform-utility-deep-research-package-2026-02-24.md
- docs/audits/research/helix-ask-dottie-uniform-utility-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md
- docs/BUSINESS_MODEL.md
- docs/helix-ask-flow.md
- docs/helix-ask-agent-policy.md
- docs/helix-ask-runtime-limitations.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/architecture/helix-ask-mission-systems-integration-plan.md

Global rules:
1) Keep all changes additive/non-breaking.
2) Preserve certainty parity and evidence posture.
3) If blocked, ship max safe subset, mark partial-blocked/blocked, and continue.
4) Run required tests and Casimir verify for each prompt.
5) On Casimir FAIL, repair first HARD constraint and rerun.
6) Do not claim completion without final PASS and integrityOk=true.

Final deliverables:
- ordered commit table
- artifact existence table
- blocker list and GO/NO-GO decision
- final Casimir PASS block (verdict, firstFail, certificateHash, integrityOk)
```

## Prompt 0: Ledger + scope lock

```text
Objective:
Create execution ledger and lock scope for uniform utility implementation.

Allowed paths:
- reports/helix-ask-dottie-uniform-utility-ledger-2026-02-24.md (new)
- docs/audits/research/helix-ask-dottie-uniform-utility-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md

Requirements:
1) Add prompt tracker table for Prompt 0..9.
2) Record hard constraints and non-negotiables.
3) Record blocker policy.

Checks:
- casimir verify command
```

## Prompt 1: Prompt-style contract spec

```text
Objective:
Define machine-checkable prompt-style contract for text/voice/board parity.

Allowed paths:
- docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md (new)
- docs/architecture/voice-service-contract.md (additive clarification only)
- docs/architecture/mission-go-board-spec.md (additive clarification only)

Requirements:
1) Define enums for:
   - event_type
   - classification
   - certainty_class
   - suppression_reason
2) Define matrix:
   (tier, session_state, voice_mode, event_class, certainty) -> (format, max length, speak eligibility, suppression rule)
3) Define required template fields:
   - what_changed
   - why_it_matters
   - next_action
   - evidence_anchor
4) Define invariants:
   - voice certainty <= text certainty
   - repo-attributed voice claims require evidence refs

Checks:
- markdown lint/type consistency check if available
- casimir verify command
```

## Prompt 2: Reasoning pipeline bottleneck audit artifact

```text
Objective:
Produce explicit pipeline stage map and bottleneck register tied to current code.

Allowed paths:
- reports/helix-ask-dottie-pipeline-bottleneck-audit-2026-02-24.md (new)

Requirements:
1) Stage map with files, IO, deterministic contract, and failure modes.
2) Bottleneck register with severity and unblock action.
3) Top 5 blockers by impact/effort.
4) Instrumentation gaps and required metrics.
5) No speculative claims without code/doc evidence.

Checks:
- cite file:line anchors for each blocker
- casimir verify command
```

## Prompt 3: Deterministic template library (docs + shared schema)

```text
Objective:
Define deterministic callout template library and reason taxonomy.

Allowed paths:
- docs/architecture/helix-ask-dottie-callout-templates.v1.md (new)
- shared/ (schema/types only if needed and additive)
- tests/ (new focused contract tests)

Requirements:
1) Add canonical templates for callout/briefing/debrief.
2) Add stable suppression and failure reason labels.
3) Ensure templates enforce bounded lengths and evidence anchors.

Checks:
- run focused new tests
- casimir verify command
```

## Prompt 4: Certainty parity enforcement tests

```text
Objective:
Add automated tests enforcing voice/text certainty parity and evidence requirements.

Allowed paths:
- tests/ (new parity and evidence tests)
- client/src/components/helix/HelixAskPill.tsx (only if required for parity state exposure)
- server/services/mission-overwatch/*.ts (only if required for deterministic reasons)

Requirements:
1) Add tests proving no voice output exceeds text certainty class.
2) Add tests proving missing evidence suppresses repo-attributed callouts.
3) Add tests proving deterministic suppression reasons on replay.

Checks:
- run targeted vitest suite
- casimir verify command
```

## Prompt 5: Admission control and overload deterministic behavior

```text
Objective:
Close queue/backpressure bottlenecks with deterministic overload envelopes.

Allowed paths:
- server/routes.ts
- server/routes/agi.plan.ts
- server/services/helix-ask/job-store.ts
- tests/ (new overload/rate-limit tests)

Requirements:
1) Add explicit admission control for /api/agi/* under overload.
2) Return deterministic 429 envelopes with stable reason labels.
3) Preserve existing ask/jobs behavior and compatibility.

Checks:
- run focused overload tests
- casimir verify command
```

## Prompt 6: Time-to-event and timer update contract wiring

```text
Objective:
Introduce first-class timer update semantics aligned to mission board.

Allowed paths:
- server/routes/mission-board.ts
- server/services/mission-overwatch/*.ts
- client/src/lib/mission-overwatch/index.ts
- tests/mission-board*.spec.ts

Requirements:
1) Add timer entity/update rules with deterministic fields.
2) Add timer-derived callout eligibility rules.
3) Ensure debrief/event records link back to timer source events.

Checks:
- run mission board + salience tests
- casimir verify command
```

## Prompt 7: Micro-debrief closure loop

```text
Objective:
Make micro-debrief an operational loop, not just a generated artifact.

Allowed paths:
- server/services/mission-overwatch/micro-debrief.ts
- server/services/mission-overwatch/dottie-orchestrator.ts
- server/routes/mission-board.ts
- tests/mission-overwatch*.spec.ts

Requirements:
1) Link trigger event -> operator action/ack -> outcome status -> debrief closure.
2) Persist deterministic derived_from references.
3) Keep debrief low-noise and action-oriented.

Checks:
- run focused debrief loop tests
- casimir verify command
```

## Prompt 8: Unified implementation backlog + rollout plan

```text
Objective:
Publish action-ready backlog and rollout plan from implemented state.

Allowed paths:
- reports/helix-ask-dottie-uniform-utility-gap-backlog-2026-02-24.md (new)
- docs/research/helix-ask-dottie-uniform-utility-rollout-30-60-90-2026-02-24.md (new)

Requirements:
1) Prioritize P0/P1/P2 work with owner, risk, acceptance test.
2) Include kill criteria and rollback triggers.
3) Include KPI instrumentation plan for parity/noise/latency.

Checks:
- docs consistency pass
- casimir verify command
```

## Prompt 9: Final closure and handoff package

```text
Objective:
Produce final decision-ready handoff package and verification ledger.

Allowed paths:
- reports/helix-ask-dottie-uniform-utility-final-handoff-2026-02-24.md (new)
- reports/helix-ask-dottie-uniform-utility-ledger-2026-02-24.md

Requirements:
1) Summarize commits, deltas, remaining blockers.
2) Publish GO/NO-GO by capability area.
3) Attach final Casimir PASS metadata.

Checks:
- final full targeted test sweep
- casimir verify command
```
