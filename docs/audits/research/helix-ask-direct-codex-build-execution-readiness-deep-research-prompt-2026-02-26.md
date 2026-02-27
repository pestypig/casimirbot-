# Helix Ask Direct Codex Build Execution Readiness Deep Research Prompt (2026-02-26)

Use this when repo context is attached and the objective is to decide whether the current plan set is immediately executable by Codex in strict, deterministic build mode.

## Integrated Findings Update (2026-02-26)

Companion assessment:
- `docs/audits/research/helix-ask-direct-codex-build-execution-readiness-assessment-2026-02-26.md`

Key findings to preserve in follow-on runs:
- readiness is currently `execute_with_guardrails` (not `execute_now`)
- strongest execution lane is evolution governance prompt packs with per-slice Casimir discipline
- highest-priority gaps are:
  - missing unified ownership+evolution Prompt 0..N execution pack
  - missing repo-wide proven certified-only promotion enforcement
  - missing machine-readable dependency DAG for the unified program

## Prompt (copy/paste)

```md
You are running a standalone deep research pass focused on direct Codex build execution readiness.
No code implementation unless explicitly requested.

Date context: February 26, 2026
Repository scope: pestypig/casimirbot-

## Objective (single measurable goal)
Determine whether the current Helix Ask ownership + evolution program is execution-ready for direct Codex autorun, and produce the minimal conversion pack needed to reach execution-ready status with deterministic gates.

## Repo Definitions (must use exactly)
- direct codex build execution readiness: a prompt pack is ready when it can be executed sequentially by Codex with deterministic outcomes, path-bounded edits, explicit checks, blocker policy, and required Casimir verification per patch.
- execution slice: one bounded prompt step with objective, allowed paths, required outputs, checks, and completion evidence.
- custody spine: Evidence envelope -> Claim node -> Promotion stage.
- promotion stage: exploratory -> reduced-order -> diagnostic -> certified.
- ownership maturity: Trainable -> Repeatable -> Portable -> Ownable.
- report-only mode: governance produces scored/verdict artifacts without production-blocking enforcement.
- enforce mode: production-affecting hard gates can block promotion or publish paths.

## Required Anchors (must read)
- AGENTS.md
- WARP_AGENTS.md
- package.json
- .github/workflows/casimir-verify.yml
- docs/architecture/helix-ask-natural-philosophy-gap-closure-playbook.md
- docs/ownership-maturity-ladder-v1.md
- docs/audits/research/ownership-maturity-utility-deep-research-2026-02-25.md
- reports/ownership-maturity-decision-matrix-2026-02-25.json
- reports/ownership-maturity-batch-prompts-2026-02-25.md
- docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md
- docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/audits/research/helix-ask-evolution-governance-hardening-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/audits/research/helix-ask-unified-ownership-evolution-operating-model-and-roadmap-2026-02-26.md
- docs/audits/research/helix-ask-ownership-evolution-unified-deep-research-prompt-2026-02-26.md
- docs/architecture/evolution-governance-contract.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md
- docs/helix-ask-flow.md
- docs/helix-ask-agent-policy.md
- docs/TRAINING-TRACE-API.md
- docs/runbooks/evolution-governance-operations-2026-02-23.md
- server/routes/evolution.ts
- server/services/evolution/patch-store.ts
- server/services/evolution/momentum.ts
- server/services/evolution/congruence-gate.ts
- server/services/evolution/trajectory.ts
- server/services/evolution/git-history.ts
- server/routes/voice.ts
- server/routes/mission-board.ts
- server/routes/training-trace.ts
- server/services/observability/training-trace-store.ts
- server/routes/knowledge.ts
- server/services/knowledge/corpus.ts
- server/routes/essence.ts
- server/services/essence/ingest-jobs.ts
- shared/evolution-schema.ts
- shared/schema.ts
- shared/helix-dottie-callout-contract.ts
- shared/callout-eligibility.ts
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/mission-overwatch/index.ts

## Required Resource Sweep
Before conclusions, run a repository sweep to discover additional candidate execution resources:
- existing codex-cloud autorun prompt packs
- readiness ledgers and closeout reports
- evolution and ownership reports
- tests for evolution/training-trace/voice/mission paths
Use discovered resources as secondary evidence.

## Research Tasks
1. Build an execution-readiness inventory of all relevant prompt packs, contracts, routes, tests, runbooks, and CI hooks.
2. Score current direct execution readiness using a deterministic rubric (defined below).
3. Compare the unified roadmap against the strongest existing execution packs in this repo and identify missing execution mechanics.
4. Produce an execution gap matrix with severity (`critical`, `high`, `medium`, `low`) and affected surfaces.
5. Produce a strict dependency DAG for conversion to direct autorun build steps.
6. Produce a converted execution plan template with Prompt 0..N slices, each containing:
   - objective
   - allowed paths
   - required changes
   - required checks/commands
   - blocker policy
   - per-slice reporting fields
7. Define report-only to enforce graduation gates specifically for Codex execution reliability.
8. Define adversarial tests that validate execution integrity (path-bound violations, nondeterminism, stale-read regressions, missing verification).
9. Define GO/NO-GO boundaries for immediate autorun launch.
10. Provide a 7-day stabilization plan and a 30-day execution hardening plan.

## Execution Readiness Rubric (must score)
Score each category 0-5, then compute weighted total out of 100:
- Slice boundedness (objective + allowed paths + constraints) weight 20
- Deterministic verification contract (tests + Casimir + typed failures) weight 20
- Artifact/reporting completeness (per-slice outputs + final closeout) weight 15
- Blocker and recovery protocol quality weight 15
- Dependency ordering clarity (DAG + prerequisites) weight 10
- CI and local parity (commands reproducible in both) weight 10
- Policy and safety alignment (ownership/promotion parity constraints) weight 10

Readiness bands:
- 85-100: execute_now
- 70-84: execute_with_guardrails
- 50-69: hold_report_only
- <50: insufficient_evidence

## Required Artifacts
- docs/audits/research/helix-ask-direct-codex-build-execution-readiness-2026-02-26.md
- reports/helix-ask-direct-codex-build-readiness-scorecard-2026-02-26.json
- reports/helix-ask-direct-codex-build-gap-matrix-2026-02-26.json
- reports/helix-ask-direct-codex-build-conversion-pack-2026-02-26.md
- reports/helix-ask-direct-codex-build-dependency-dag-2026-02-26.json
- reports/helix-ask-direct-codex-build-graduation-gates-2026-02-26.json

## Evidence and Claim Rules
- Tag every claim: `verified`, `inference`, or `missing_evidence`.
- For `verified` claims include exact repo paths.
- Separate current-state evidence from recommendations.
- If code/doc conflicts exist, resolve using this precedence:
  1) runtime code/contracts
  2) shared schemas/types
  3) architecture docs
  4) research docs

## Metrics + Gates (must include in output)
- execution slice completeness coverage = 1.0
- path-boundedness coverage = 1.0
- per-slice verification command coverage = 1.0
- Casimir-required step coverage = 1.0
- typed fail-reason coverage for hard blocks = 1.0
- replay determinism gate target >= 0.99
- promotion certified-only gate coverage = 1.0

## Allowed Decision Types
- execute_now
- execute_with_guardrails
- hold_report_only
- insufficient_evidence

## Constraints
- No invented citations.
- Do not overstate implementation status.
- Keep local-first custody explicit.
- Do not treat VI/ELBO gains as certification evidence.
- Do not replace existing Casimir verify requirement.

## Provenance Policy
If `main/origin` baseline is unavailable, continue on current HEAD and emit exact git provenance used (branch, commit, dirty state).

## Verification Block
Research-only unless explicitly asked to edit files.
If files are edited:
- POST /api/agi/adapter/run (constraint-pack repo-convergence)
- GET /api/agi/training-trace/export
- report: verdict, traceId, runId, certificateHash, integrityOk

## Final Response Format
1) Executive verdict and readiness band
2) Weighted rubric score table
3) Execution-readiness inventory
4) Gap matrix (severity ordered)
5) Code/doc/schema conflict list with precedence resolutions
6) Direct conversion plan (Prompt 0..N template)
7) Dependency DAG
8) Adversarial test plan
9) Report-only to enforce graduation gates
10) 7-day stabilization and 30-day hardening plan
11) Open questions and missing evidence
12) Artifact list with schema versions and validation commands
```
