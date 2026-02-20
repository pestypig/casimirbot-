# Event-Segmented Timing and Replay Contract v1

## Objective

Define deterministic replay semantics that separate physical timing from logical ordering while preserving backward compatibility with existing trace consumers.

## Required trace fields

For timing/concurrency-sensitive events, record the following fields:

- `monotonic_ts`: physical monotonic timestamp used for latency and jitter interpretation.
- `logical_seq`: deterministic sequence key used for replay ordering.
- `scenario_id`: scenario grouping identifier for run context.
- `seed_id`: deterministic seed identifier for pseudo-random sources.
- `lane_id`: execution lane owner (`lane_evidence`, `lane_knowledge_binding`, `lane_timing_replay`, `lane_codex_workflow`, `lane_risk_governance`).

## Time model

1. **Physical time (`monotonic_ts`)**
   - not used as sole ordering authority,
   - may vary within bounded jitter.

2. **Logical time (`logical_seq`)**
   - canonical replay order key,
   - must be strictly monotone within `(scenario_id, lane_id)`.

## Replay ordering rules

1. Primary sort key: `(scenario_id, lane_id, logical_seq)`.
2. Tie-breaker key: `monotonic_ts` ascending.
3. If still tied, use deterministic stable event id/hash.
4. Cross-lane merge during replay must preserve each lane's internal `logical_seq` monotonicity.

## Nondeterminism policy boundaries

Must be fixed for deterministic replay:

- seed-driven randomness (`seed_id`),
- recorded event order (`logical_seq`),
- external input snapshots referenced by event id.

May vary within bounded policy windows:

- wall-clock duration,
- retry timing where order invariants are unchanged,
- non-semantic telemetry (e.g., CPU, memory spikes).

## Backward compatibility contract

- Existing trace consumers that do not recognize the new fields must continue to parse events without failure.
- Producers may emit these fields as additive metadata.
- Consumers should default missing fields to compatibility mode:
  - `logical_seq`: derive from ingestion order,
  - `scenario_id`: `default-scenario`,
  - `seed_id`: `unknown-seed`,
  - `lane_id`: `lane_unknown`.

## Validation checklist

- replay of identical input snapshot produces stable logical ordering,
- missing new fields does not break legacy parser path,
- lane-specific events remain order-stable under concurrent scheduling.

## Operationalization

Incident capture and replay workflow details are documented in `docs/runbooks/rare-bug-replay-and-lane-debugging-2026-02-20.md`.
- AimRT replay/timer integration candidates and disconfirmation triggers are tracked in `docs/audits/research/agibot-stack-mapping-proposals-2026-02-20.md`.
