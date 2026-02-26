# Unified Ownership + Evolution Deep Research Prompt (2026-02-26)

Use this as a standalone deep research prompt when repository context is attached.
Scope is Helix Ask ownership utility + evolution governance + patch momentum + force-matrix operator model + VI/ELBO uncertainty lane.

## Prompt (copy/paste)

```md
You are running a standalone deep research pass (analysis + architecture + execution planning; no code implementation).

Date context: February 26, 2026
Repository scope: pestypig/casimirbot-
Primary objective: produce a cohesive, decision-grade plan that unifies ownership maturity, evolution governance, patch momentum, and uncertainty-aware training into one deployable utility roadmap.

## Objective (single measurable goal)
Deliver an integrated operating model where:
1) production-facing knowledge promotion is verification-gated,
2) patch momentum and drift are measured deterministically with replayable artifacts,
3) uncertainty-aware lanes (including VI/ELBO-style diagnostics) are captured without over-claiming certification.

## Repo Definitions (must use exactly)
- ownership maturity: Trainable -> Repeatable -> Portable -> Ownable with explicit gates and adversarial checks.
- custody spine: Evidence envelope -> Claim node -> Promotion stage.
- promotion stage: exploratory -> reduced-order -> diagnostic -> certified.
- objective-first situational awareness: objective/gap/suppression state is structured, replayable, and operator-inspectable.
- patch momentum: deterministic vector over scope/subsystem/coupling/test/uncertainty components.
- interaction-matrix transform model: asymmetric subsystem force matrix that projects likely evolution hotspots.
- probabilistic lane: optional uncertainty-aware path where ELBO/calibration are diagnostic signals, not certification by themselves.

## Required Anchors (must read)
- docs/ownership-maturity-ladder-v1.md
- docs/audits/research/ownership-maturity-utility-deep-research-2026-02-25.md
- reports/ownership-maturity-decision-matrix-2026-02-25.json
- reports/ownership-maturity-batch-prompts-2026-02-25.md
- docs/audits/research/helix-ask-evolution-governance-framework-2026-02-23.md
- docs/audits/research/helix-ask-evolution-governance-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/audits/research/helix-ask-evolution-governance-hardening-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/architecture/evolution-governance-contract.md
- docs/helix-ask-flow.md
- docs/helix-ask-agent-policy.md
- docs/architecture/voice-service-contract.md
- docs/architecture/mission-go-board-spec.md
- docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md
- docs/TRAINING-TRACE-API.md
- server/routes/voice.ts
- server/routes/mission-board.ts
- server/routes/training-trace.ts
- server/services/observability/training-trace-store.ts
- server/routes/essence.ts
- server/services/essence/ingest-jobs.ts
- server/routes/knowledge.ts
- server/services/knowledge/corpus.ts
- shared/helix-dottie-callout-contract.ts
- shared/callout-eligibility.ts
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/mission-overwatch/index.ts

## Research Tasks
1. Build a strict current-state matrix across backend, compute/training, and UI using only repo evidence.
2. Reconcile ownership ladder and evolution governance into one unified control loop (ingest -> momentum -> congruence -> promotion).
3. Evaluate patch momentum + interaction-matrix model viability as deterministic operator tooling, including hotspot classes (hot/warm/cold) and typed fail semantics.
4. Evaluate uncertainty-aware lane design:
   - where VI/ELBO metrics should live in manifests/traces,
   - what calibration metrics are required,
   - what promotion blocks are mandatory when uncertainty quality regresses.
5. Specify the 3-pass operator rhythm for evolution UI (simulate -> clear -> draw) and map it to existing Helix Ask components.
6. Define additive API/data contracts required to operationalize the unified model without breaking existing routes.
7. Produce 30/60/90 + batch execution plan with adversarial tests per batch.
8. Compare with external primary-source patterns (supply-chain provenance, policy-as-code, provenance standards, reproducibility, durable agent ops) and identify where this repo’s approach is stricter/different.
9. Produce explicit GO/NO-GO boundaries:
   - what can be claimed now,
   - what cannot be claimed until evidence exists.
10. Provide kill criteria and rollback conditions if determinism/promotion safety objectives are not met.

## Explicit Out-of-Scope / Anti-goals (required)
- Do not claim full L4 ownability without demonstrated L3 portability + certified-only promotion enforcement.
- Do not claim multimodal verification completeness when endpoints/jobs are placeholder or heuristic.
- Do not replace Casimir verify; treat unified governance as additive.
- Do not introduce cloud-only mandatory dependencies for core custody path.

## Batch Dependency Graph (required)
Define a strict dependency DAG that states prerequisites per batch.
Minimum ordering:
1) manifests + policy decision log
2) evidence/claim registry
3) promotion gate
4) force-matrix/hotspot operator surface
5) probabilistic (VI/ELBO) diagnostic lane
6) hardening (bundle integrity/signing)
For each batch provide:
- `depends_on`
- `blocks`
- `exit_criteria`

## Ownership and Decision Authority (required)
For every batch define:
- DRI (role/team),
- approver (who can move report-only -> enforce),
- rollback authority,
- escalation path when gates conflict.

## Runtime/Budget/SLO Envelope (required)
Provide explicit envelopes:
- compute budget (CPU/GPU minutes per cycle),
- storage budget (trace/evidence retention and rotation),
- latency SLOs (gate compute and UI refresh),
- availability SLO for verification surfaces.
Include fail-closed degradation behavior when budgets are exceeded.

## Data Governance: Privacy, License, Redaction (required)
Specify policy for:
- prompt/user-data minimization and redaction in traces,
- license/rights propagation through evidence envelopes,
- retention classes and deletion guarantees by artifact type,
- handling external provider outputs in local-first custody mode.

## Migration, Backfill, and Rollback Strategy (required)
Define:
- how legacy traces/claims are mapped to new schemas,
- backfill safety checks and idempotency strategy,
- rollback plan preserving replayability and reason-code continuity,
- cutover plan (dual-write/report-only window before enforce).

## Artifact Schema Contracts + Validation Commands (required)
In addition to artifact paths, require:
- schema version for each output artifact,
- validation command(s) per artifact (for example JSON schema/contract checks),
- deterministic hash/signature fields where applicable.

## Source-of-Truth Precedence (required)
When code and docs conflict, require explicit precedence order:
1) runtime behavior and enforced contracts in code
2) shared schemas/types
3) architecture docs
4) research docs
The output must list every detected conflict with a resolution note.

## Baseline Benchmark/Holdout Pack (required)
Define a fixed benchmark pack for repeatability:
- representative scenarios across voice/mission/knowledge/evidence lanes,
- deterministic seeds/timestamps where applicable,
- acceptance tolerances and replay receipts,
- breach handling (promotion block + diff artifact emission).

## Report-only -> Enforce Graduation Criteria (required)
Define measurable graduation gates:
- minimum stability window,
- false-positive/false-negative tolerance bounds,
- replay determinism threshold compliance duration,
- operator override/audit trail requirements.
No enforce rollout without explicit pass on all graduation gates.

## Required Artifacts
- docs/audits/research/helix-ask-ownership-evolution-unified-deep-research-2026-02-26.md
- reports/helix-ask-ownership-evolution-unified-decision-matrix-2026-02-26.json
- reports/helix-ask-ownership-evolution-unified-batch-prompts-2026-02-26.md
- reports/helix-ask-ownership-evolution-unified-dependency-dag-2026-02-26.json
- reports/helix-ask-ownership-evolution-unified-runtime-envelope-2026-02-26.json
- reports/helix-ask-ownership-evolution-unified-graduation-gates-2026-02-26.json

## Evidence and Claim Rules
- Every factual claim must be tagged:
  - Tag: verified (directly supported by repo evidence)
  - Tag: inference (reasoned recommendation)
  - Tag: missing_evidence (cannot be proven from required anchors)
- For every verified claim, include at least one exact repo path citation.
- Separate current-state facts from proposed architecture in different sections.

## Metrics + Gates (must include in output)
- voice/text certainty parity violations: target 0 (hard gate)
- repo-attributed claims without evidence refs: target 0 (hard gate)
- replay determinism rate for policy decisions: target >= 0.99
- suppression reason stability under replay: target >= 0.999
- certified-only promotion compliance: target 1.0 (hard gate)
- promotion rejection typed-reason coverage: target 1.0 (hard gate)
- ELBO decomposition metric coverage on probabilistic lanes: target 1.0
- posterior-collapse detection coverage on probabilistic lanes: target 1.0

## Allowed Decision Types
- go_bounded
- no_go_l4_claims
- hold_report_only
- insufficient_evidence

## Constraints
- No invented citations.
- Use primary sources for technical comparisons.
- Do not overstate implementation status.
- Keep deterministic fail-reason semantics explicit.
- Treat local-first custody as a first-class requirement.
- Do not treat ELBO improvement alone as certification evidence.

## Provenance Policy
If main/origin baseline is unavailable, continue on current HEAD and emit a provenance warning with exact git state used.

## Verification block
This is a research-only run unless explicitly asked to edit files.
If files are edited, include Casimir verification block:
- POST /api/agi/adapter/run (constraint-pack repo-convergence)
- GET /api/agi/training-trace/export
- Report: verdict, traceId, runId, certificateHash, integrityOk.

## Final Response Format
1) Executive verdict (GO/NO-GO boundaries)
2) Current-state matrix (exists_now | partial_or_stub | missing)
3) Unified architecture proposal (backend/compute/UI/governance)
4) Out-of-scope and anti-goals
5) Dependency DAG and batch ordering
6) Patch momentum + force-matrix operationalization
7) VI/ELBO uncertainty lane policy and gates
8) Runtime/budget/SLO envelope
9) Data governance (privacy/license/redaction)
10) Migration/backfill/rollback plan
11) Report-only -> enforce graduation gates
12) 30/60/90 + batch plan with adversarial tests
13) KPI table with thresholds
14) Risk register + kill criteria
15) External comparison with citations
16) Open questions and missing evidence
17) Artifact list and paths + schema versions + validation commands
```
