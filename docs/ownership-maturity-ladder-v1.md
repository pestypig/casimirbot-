# Ownership Maturity Ladder (v1)

Date: 2026-02-25  
Status: draft

## One sentence
Trainable is a capability; ownable is a product. This ladder defines how Helix Ask and Dot systems move from isolated model runs to local, auditable, falsifiable custody.

## Intent
- Build a local-first AI custody model where capabilities are installable, replayable, and governable.
- Keep claims and outputs tied to evidence, deterministic fail reasons, and promotion gates.
- Unify code, image, audio, and prompt flows under one reproducible input/output contract.

## Problem framing
The team has demonstrated fast lane execution (for example, rapid voice training runs), but repeatedly encountered non-model blockers:
- environment and dependency drift
- optional stack brittleness and bootstrap fragility
- weight/license governance checks
- GPU/runtime mismatch between runs
- branch or SHA mismatch during cloud training
- gate timing and service-readiness coupling
- artifact export/import friction
- missing observability artifacts for replay/debug

These are ownership failures, not core model failures.

## Ownership stack
Ownability requires custody across all layers:
1. Inputs: weights, data, prompts, code, configs, licenses.
2. Environment: dependency lock, toolchain, runtime assumptions, seeds.
3. Orchestration: job ordering, readiness checks, retry/fail-closed behavior.
4. Artifact supply chain: manifests, hashes, signatures, provenance continuity.
5. Evaluation and verification: deterministic metrics, gates, certificates.
6. Runtime: memory/latency/hardware envelope, offline continuity.
7. Operability: install, update, rollback, clear failure diagnostics.
8. Continual learning loop: trace capture, replay, claim promotion controls.

## Maturity ladder
Levels are cumulative: Trainable -> Repeatable -> Portable -> Ownable.

### L1 Trainable
Definition:
- A lane can complete at least once and produce a usable artifact.

Acceptance gates:
- One known golden-path run completes end-to-end.
- Artifact + minimal run metadata are persisted.
- Failure points are detectable by stage.

Required artifacts:
- `run_manifest.json` (minimal)
- produced bundle/checkpoint
- lane logs

Adversarial check:
- Fresh-environment rerun can fail, but failure must be explicit and stage-bounded.

### L2 Repeatable
Definition:
- Same inputs and repo revision reproduce outcomes within defined tolerance.

Acceptance gates:
- Dependencies are pinned (lockfile and/or image digest).
- Inputs are immutable/content-addressed.
- Seed/config hash are recorded; known nondeterminism is declared.
- Replay-safe traces are emitted for each run.
- Post-run verification is automated.
- Governance checks fail closed with deterministic reason codes.

Required artifacts:
- enriched `run_manifest.json` with SHA, env lock, input hashes, metrics
- trace export bundle (for replay and comparison)
- verification report and certificate metadata

Adversarial check:
- Repeatability breach blocks promotion and records both traces for diff.

### L3 Portable
Definition:
- Repeatable lanes run across supported machines without hidden manual steps.

Acceptance gates:
- Deterministic bootstrap/install path exists.
- Supported hardware classes and fallbacks are explicit.
- Export/import preserves manifest and integrity chain.
- Runtime smoke test ships with each bundle.

Required artifacts:
- portable bundle format with manifest, hashes, license/provenance fields
- import/install command path
- local smoke test receipt

Adversarial check:
- Bundle transfer to a clean target preserves integrity and passes smoke test.

### L4 Ownable
Definition:
- Core capability runs locally with auditable policy, promotion controls, and rollback.

Acceptance gates:
- Local-first core operation (no mandatory external dependency for core path).
- Policy and governance checks are embedded and auditable.
- Deterministic update/pin/rollback workflow exists.
- Integrity failures are blocked with stable reason codes.
- Promotion to production knowledge is gated by verification policy.

Required artifacts:
- local model/claim registry
- promotion ledger/dashboard (or deterministic report)
- custodian policy pack for learn/promote/quarantine decisions

Adversarial check:
- Tampered bundle import is blocked and logged with deterministic failure classification.

## Multimodal unification contract
The shared custody spine is:
1. Evidence envelope
2. Claim node
3. Promotion stage

### 1) Evidence envelope
Each input, regardless of modality, must carry:
- content hash and source URI/reference
- modality (`code|image|audio|prompt|text|video`)
- extraction/computation stage
- timestamps, tool lineage, and trace linkage
- evidence references used for downstream claims

### 2) Claim node
Claims are represented as tree/DAG nodes with:
- statement and dependency links
- supporting evidence anchors
- explicit falsification hooks
- uncertainty and maturity metadata

### 3) Promotion stage
Claims move through:
- exploratory -> reduced-order -> diagnostic -> certified

Policy:
- only certified claims with integrity OK are promotion-eligible for production surfaces
- lower-tier claims remain non-promoted context

## Helix Ask and mission-overwatch linkage
Objective-first situational awareness is treated as an ownership feature, not only UX behavior.

Required behavior:
- objective and gap state are structured and replayable
- callout emit/suppress outcomes are deterministic and inspectable
- voice certainty is never stronger than text certainty
- repo-attributed claims require evidence parity

Operational result:
- operators can inspect what changed, why it mattered, what action was requested, and why callouts were spoken or suppressed

## Lane declaration contract (minimum)
Each lane must declare:
- current maturity level
- next target level
- acceptance gates
- required test/verify commands
- known nondeterminism/tolerances
- promotion policy and deterministic fail reasons

Suggested lane coverage:
- voice training and serving
- mission-overwatch objective/gap pipeline
- multimodal ingest/enrichment
- claim graph promotion and knowledge publication

## Initial rollout plan
1. Publish this ladder and map each active lane to current level.
2. Add per-lane manifests and replay-safe evidence receipts where missing.
3. Wire promotion policy so non-certified outputs cannot silently enter production knowledge surfaces.

## Out of scope (v1)
- replacing existing API contracts
- claiming current multimodal loop as fully implemented
- asserting certified status without passing verification gate requirements
