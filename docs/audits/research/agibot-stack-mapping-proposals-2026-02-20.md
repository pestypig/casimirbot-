# AGIBOT Stack Mapping Proposals (2026-02-20)

## Proposal table

| agibot_surface | casimirbot_target | integration_pattern | deterministic_gate | risk_level | phase | disconfirmation_trigger |
|---|---|---|---|---|---|---|
| Link-U-OS simulation/verification toolchain | AGI plan + replay workflows (`/api/agi`, runbooks) | ingest simulation evidence artifacts into lane-tagged trace corpus | Casimir PASS + replay equivalence on fixed scenario set | medium | P0 | replay equivalence drift exceeds threshold on same trace fixtures |
| Link-U-OS deployment/data recording | training trace export and incident replay artifacts | standardize recording envelopes to include lane and scenario metadata | trace schema completeness check + Casimir PASS | medium | P1 | required metadata fields missing in >1% of captured events |
| AimRT record/playback primitives | event-segmented timing schema + replay protocol | map runtime records to `logical_seq` and `seed_id` hooks | deterministic ordering invariant checks in replay | high | P0 | cannot enforce stable ordering in replicated incident playback |
| AimRT timer/executor semantics | concurrency regression lane tests | adopt deterministic substitutes for timing-sensitive execution paths | lane_timing_replay acceptance checks + Casimir PASS | medium | P1 | replay-only fixes fail under controlled jitter envelopes |
| X1 hardware/development artifacts | evidence-linked runbooks and risk backlog for hardware-adjacent claims | add artifact manifest with confidence tags and claim IDs | evidence completeness gate before runtime promotion | medium | P2 | manifest lacks provenance for critical hardware assumptions |
| X1 training/inference ecosystem links | model/agent evaluation lane inputs | create adapter for selected open benchmarks with pinned seeds | benchmark reproducibility gate + Casimir PASS | medium | P3 | benchmark reruns diverge materially with identical seeds |

## Sequencing summary

### Short-term proposals (P0/P1)

1. Link-U-OS simulation evidence ingestion into deterministic replay workflows.
2. AimRT playback/timer semantics crosswalk into event-segmented timing contract.
3. Deployment/recording envelope normalization for lane/scenario replay.

### Medium-term proposals (P2/P3)

1. X1 artifact manifest and provenance hardening.
2. X1-linked benchmark adapter with seed-pinned reproducibility gates.

## Notes

- These proposals are architecture-stage mappings and not physical viability claims.
- Promotion beyond diagnostic maturity requires acceptance-gate evidence from risk backlog execution.
