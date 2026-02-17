# Helix Ask Proof Packet RFC (P0)

## Current Pipeline Map

1. Query normalization + intent/profile selection.
2. Deterministic retrieval planning (query hints, repo/doc search, graph/doc blocks).
3. Evidence scaffold generation (deterministic path, optional LLM evidence cards).
4. Answer synthesis (single-LLM primary path with answer-contract fill/repair stages).
5. Post-processing (format enforcement, citation/source sanitization, sparse-section repairs).
6. Debug/telemetry emission (timeline, gates, fallback markers).

P0 observation from crossover ablation: transport/runtime failures dominated outcomes, so infrastructure and parse failures must be split for meaningful quality analysis.

## Option A (Default Target Design): Proof Packet + Structured Narrator (Single Call)

### P0 architecture target
- Keep one request call.
- Build an internal `proof packet` object:
  - question
  - normalized evidence list with stable evidence IDs
  - structured answer contract schema v1
- Narrator renders user-facing text strictly from the structured contract + evidence IDs.
- Deterministic citation renderer maps `evidenceIds -> citation strings`.

### P0 scope (this patch)
- Feature-flagged skeleton only (`HELIX_ASK_PROOF_PACKET_P0=1`), no default flip.
- Defines types/schema and deterministic citation mapping utility.
- Adds typed fail reasons and fail class split (`infra_fail` vs `parse_fail`).

## Option C Fallback Design: Tagged Section Fallback

If Option A contract/render quality is unsafe, switch to deterministic tagged output:

- `[answer.summary]`
- `[answer.claims]`
- `[answer.sources]`

This gives parse-stable, replayable fallback with explicit section boundaries.

### Fallback routing rule (P0)
- Guarded by `HELIX_ASK_OPTION_C_FALLBACK=1` and `HELIX_ASK_PROOF_PACKET_P0=1`.
- Only hooks in as a reversible fallback path; does not alter defaults.

## Concrete Gate Thresholds

P0 gate thresholds to evaluate Option A promotion:

- `infra_fail_rate <= 1.0%`
- `parse_fail_rate <= 2.0%` (conditioned on successful transport only)
- `successful_samples_only.crossover_completeness_mean >= current_adaptive - 1.0%`
- `successful_samples_only.claim_support_ratio_mean >= 0.70`
- `p95_latency_increase <= 15%` vs `D_current_adaptive`
- `LOW_EVIDENCE_UTILIZATION <= 5%` of successful samples

Promotion requires all thresholds green across 2 consecutive runs.

## Rollout Phases

1. **Phase 0 (this patch)**
   - Add schemas/types, fail taxonomy, metrics split, fallback hook.
   - No behavior flip by default.
2. **Phase 1 (dark launch)**
   - Enable `HELIX_ASK_PROOF_PACKET_P0=1` in non-prod/experiment envs.
   - Collect infra/parse split + failure signatures.
3. **Phase 2 (canary)**
   - Enable for small traffic slice.
   - Monitor thresholds and top failure signatures.
4. **Phase 3 (default switch)**
   - Promote Option A default only if thresholds pass consistently.
   - Keep Option C as hard safety fallback.

## Risk Register

- **R1: Schema drift between narrator and contract**
  - Mitigation: strict v1 schema + typed fail reason `SCHEMA_ERROR`.
- **R2: Validation over-rejection**
  - Mitigation: classify `VALIDATION_FAIL`, keep deterministic fallback path.
- **R3: Low evidence utilization in fluent text**
  - Mitigation: explicit `LOW_EVIDENCE_UTILIZATION` fail reason + gate.
- **R4: Runtime instability dominates quality signal**
  - Mitigation: `infra_fail_rate` tracked separately from parse failures.
- **R5: Rollout risk from behavior flips**
  - Mitigation: feature flags, no default flips in P0.
