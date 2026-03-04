# Helix Ask Reasoning Theater Spec (v1)

Status: draft  
Spec ID: `helix.ask.reasoning_theater.v1`

## Purpose

Define a deterministic, symbolic UI layer that turns Helix Ask reasoning telemetry into an accessible "battle against ambiguity" stageplay without weakening existing policy, evidence, or replay guarantees.

This spec is additive. It does not replace:
- `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/mission-go-board-spec.md`

## Product intent

1. Convert internal reasoning quality signals into visual metaphors users can read at a glance.
2. Preserve scientific/evidence posture while making uncertainty legible and intuitive.
3. Keep effects generative and composable so the UI can represent many states, not fixed scenes.

## Non-goals

1. No gamified scoring that overrides actual verifier outcomes.
2. No certainty inflation in voice/text because visuals look "confident."
3. No hidden inference or covert context capture.

## Existing signal sources (v1)

Reasoning Theater must only use already emitted, replay-safe fields.

Primary sources:
1. Helix Ask debug payload (`reply.debug`):
   - `evidence_gate_ok`
   - `coverage_ratio`
   - `evidence_claim_ratio`
   - `belief_unsupported_rate`
   - `belief_contradictions`
   - `ambiguity_terms`
   - `graph_congruence_diagnostics`
   - `arbiter_mode`
   - `alignment_gate_decision` and alignment metrics (when present)
2. Live events (`live_events`, tool log stream):
   - `tool`
   - `stage`
   - `text`
   - `durationMs`
3. Operator/mission overlays:
   - `classification` (`info|warn|critical|action`)
   - suppression labels (`context_ineligible`, `dedupe_cooldown`, `mission_rate_limited`, etc.)
4. Proof envelope:
   - `proof.verdict` (`PASS|FAIL`)
   - certificate hash
   - `integrityOk`

## Derived state schema

```ts
type TheaterPhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";

type TheaterStance = "winning" | "contested" | "losing" | "fail_closed";

type TheaterArchetype =
  | "ambiguity"
  | "missing_evidence"
  | "coverage_gap"
  | "contradiction"
  | "overload";

type ReasoningTheaterStateV1 = {
  contract_version: "reasoning_theater.v1";
  trace_id: string;
  mission_id?: string;
  event_id?: string;
  phase: TheaterPhase;
  archetype: TheaterArchetype;
  certainty_class: "confirmed" | "reasoned" | "hypothesis" | "unknown";
  suppression_reason:
    | null
    | "context_ineligible"
    | "dedupe_cooldown"
    | "mission_rate_limited"
    | "voice_rate_limited"
    | "voice_budget_exceeded"
    | "voice_backend_error"
    | "missing_evidence"
    | "contract_violation"
    | "agi_overload_admission_control";
  telemetry: {
    evidence_gate_ok: boolean | null;
    coverage_ratio: number | null;
    evidence_claim_ratio: number | null;
    belief_unsupported_rate: number | null;
    belief_contradictions: number | null;
    ambiguity_term_count: number;
    graph_block_ratio: number | null;
    graph_cross_tree_ratio: number | null;
    alignment_margin: number | null;
    alignment_decision: "PASS" | "BORDERLINE" | "FAIL" | null;
    event_latency_ms_p95: number | null;
    suppression_active: boolean;
    proof_verdict: "PASS" | "FAIL" | null;
    certificate_integrity_ok: boolean | null;
  };
  indices: {
    momentum: number; // 0..1
    ambiguity_pressure: number; // 0..1
    battle_index: number; // -1..1
  };
  stance: TheaterStance;
  scenario_id: string; // deterministic hash key
  seed: number; // deterministic render seed
  ts: string;
};
```

## Scoring model (deterministic)

### Normalization helpers

```text
clamp01(x) = min(1, max(0, x))
to01_bool(b) = b ? 1 : 0
nz(x, fallback) = finite(x) ? x : fallback
```

### Input transforms

```text
evidence = to01_bool(evidence_gate_ok === true)
coverage = clamp01(nz(coverage_ratio, 0))
claim_support = clamp01(nz(evidence_claim_ratio, 0))
unsupported = clamp01(nz(belief_unsupported_rate, 1))
contradiction = clamp01(nz(belief_contradictions, 0) / 4)
ambiguity_load = clamp01(ambiguity_term_count / 8)
graph_health = clamp01(
  0.6 * (1 - nz(graph_block_ratio, 1)) +
  0.4 * nz(graph_cross_tree_ratio, 0)
)
alignment_health =
  alignment_decision == PASS ? 1 :
  alignment_decision == BORDERLINE ? 0.5 :
  alignment_decision == FAIL ? 0 : 0.5
suppression_penalty = suppression_active ? 1 : 0
latency_penalty = clamp01(nz(event_latency_ms_p95, 0) / 4000)
proof_pass = to01_bool(proof_verdict === "PASS")
integrity_penalty = certificate_integrity_ok === false ? 1 : 0
```

### Momentum

```text
momentum = clamp01(
  0.26 * evidence +
  0.22 * coverage +
  0.16 * claim_support +
  0.14 * graph_health +
  0.12 * alignment_health +
  0.10 * proof_pass
)
```

### Ambiguity pressure

```text
ambiguity_pressure = clamp01(
  0.24 * ambiguity_load +
  0.20 * unsupported +
  0.14 * contradiction +
  0.14 * (1 - coverage) +
  0.10 * suppression_penalty +
  0.10 * latency_penalty +
  0.08 * integrity_penalty
)
```

### Battle index and stance

```text
battle_index = clamp(-1, 1, momentum - ambiguity_pressure)
```

Override and stance rules:
1. `fail_closed` if:
   - `proof_verdict == FAIL`, or
   - `certificate_integrity_ok == false`, or
   - `suppression_reason in {missing_evidence, contract_violation}`
2. Else `winning` if `battle_index >= 0.25`
3. Else `losing` if `battle_index <= -0.25`
4. Else `contested`

## Generative scenario grammar

Axes (v1):
1. `phase`: 8 values
2. `archetype`: 5 values
3. `stance`: 4 values
4. `certainty_class`: 4 values
5. `mood_skin`: 7 values (existing Luma set)
6. `suppression_state`: 6 practical states (`none + top suppressors`)

Compositional count:
`8 * 5 * 4 * 4 * 7 * 6 = 26,880` base scenario combinations.

Scenario id and seed:
1. `scenario_id = sha1(trace_id|event_id|phase|archetype|stance|certainty|suppression).slice(0,16)`
2. `seed = first_32_bits(sha1(scenario_id))`

## Visual primitive mapping

Each frame uses deterministic primitive intensities:

1. `fog_density = clamp01(0.15 + 0.75 * ambiguity_pressure)`
2. `particle_rate = clamp01(0.10 + 0.80 * momentum)`
3. `shield_integrity = clamp01(momentum * (1 - ambiguity_pressure * 0.5))`
4. `glyph_entropy = clamp01(0.2 + 0.7 * ambiguity_pressure)`
5. `arc_clarity = clamp01(0.2 + 0.8 * graph_health)`
6. `pulse_hz = 0.8 + 1.4 * clamp01(abs(battle_index))`

Rendering rule:
- Effects are event-driven. Interpolate only on state transition, not on every token.

## Canonical encounters (first 12)

Each encounter is a reusable template with deterministic triggers.

1. `encounter.scout_lens`
   - Trigger: `phase=observe` and `ambiguity_term_count >= 2`
   - Meaning: unknown territory detected
   - Effect: thin fog, scanning rays, low particle rate
2. `encounter.fog_shred`
   - Trigger: `momentum rising` and `ambiguity_pressure falling`
   - Meaning: ambiguity is being resolved
   - Effect: fog tears, brighter arcs
3. `encounter.shield_crack`
   - Trigger: `evidence_gate_ok=false`
   - Meaning: evidence posture breached
   - Effect: shield fracture glyph and amber warning pulse
4. `encounter.lockpick_gap`
   - Trigger: `coverage_ratio < 0.55`
   - Meaning: missing context keys
   - Effect: locked nodes with key-slot highlights
5. `encounter.mirror_parry`
   - Trigger: `belief_contradictions > 0`
   - Meaning: contradictory claim collision
   - Effect: mirrored strikes, red split-line
6. `encounter.chain_relay`
   - Trigger: `graph_cross_tree_ratio >= 0.5` and `graph_block_ratio <= 0.3`
   - Meaning: coherent cross-tree linkage
   - Effect: chain-light bridges between clusters
7. `encounter.sandstorm_overload`
   - Trigger: suppression is `agi_overload_admission_control` or high latency penalty
   - Meaning: runtime pressure
   - Effect: turbulent particles and muted palette
8. `encounter.cooldown_echo`
   - Trigger: suppression in `{dedupe_cooldown, mission_rate_limited}`
   - Meaning: low-noise guard active
   - Effect: brief echo ring then intentional silence
9. `encounter.clarify_fallback`
   - Trigger: `arbiter_mode=clarify` or `alignment_decision=FAIL`
   - Meaning: fail-closed clarification required
   - Effect: forward motion halted, single pointer toward next evidence
10. `encounter.last_mile_gate`
    - Trigger: `phase=verify` and `proof_verdict=null`
    - Meaning: verification in progress
    - Effect: narrowing corridor, synchronized pulse
11. `encounter.certificate_bloom`
    - Trigger: `proof_verdict=PASS` and `certificate_integrity_ok=true`
    - Meaning: verified closure
    - Effect: bloom burst, stabilized clear field
12. `encounter.fail_closed_seal`
    - Trigger: `proof_verdict=FAIL` or `certificate_integrity_ok=false`
    - Meaning: hard stop and explicit reason
    - Effect: sealing glyph, desaturated palette, fail label pinned

## Contract and safety bindings

1. Visual state must never increase certainty class.
2. Visual "victory" effects are forbidden unless:
   - `proof_verdict=PASS`
   - `certificate_integrity_ok=true`
3. If suppression is active, show suppression label verbatim.
4. Any repo-attributed state claim in theater overlays must include evidence refs or be downgraded to `hypothesis`.

## UX behavior rules

1. Keep execution log and debug inspector as source of truth.
2. Theater overlay is supplemental and can be toggled.
3. Use low-motion fallback for reduced-motion preference.
4. Preserve deterministic replay:
   - same event sequence -> same scenario ids, same suppression labels, same stance transitions.

## Integration points

1. `client/src/components/helix/HelixAskPill.tsx`
   - derive `ReasoningTheaterStateV1` from `reply.debug`, `liveEvents`, and proof block.
2. `client/src/pages/desktop.tsx`
   - shared derivation path for desktop Helix Ask.
3. Mission board stream
   - map `classification`, `certaintyClass`, and suppression reasons into theater overlays.
4. Voice callouts
   - use theater state only as presentational context; never as certainty source.

## Implementation phases

### Phase A (read-only overlay)
1. Implement state derivation util with unit tests.
2. Render one active encounter card + primitive meters.
3. Keep debug + proof blocks visible and unchanged.

### Phase B (generative assembler)
1. Add deterministic template selection from `configs/helix-reasoning-theater.v1.json`.
2. Compose particle/fog/arc layers with seeded variance.
3. Add replay harness asserting deterministic template picks.

### Phase C (mission-board binding)
1. Drive encounter transitions from mission events.
2. Surface suppression reasons and cooldowns as first-class overlay labels.
3. Add callout parity checks to prevent certainty drift.

## Minimum test matrix

1. Determinism:
   - fixed input trace yields identical scenario ids and stance transitions.
2. Certainty parity:
   - visual state cannot promote certainty beyond text/voice contract.
3. Fail-closed:
   - `proof_verdict=FAIL` forces `stance=fail_closed`.
4. Suppression mapping:
   - each suppression reason maps to stable overlay tag.
5. Accessibility:
   - reduced motion mode preserves semantic state without particle animation.

## Readiness scorecard extension

Add two theater-specific metrics to existing readiness runs:
1. `P(theater_state_matches_debug_truth)` target `>= 0.99`
2. `P(replay_same_trace_same_scenario_id)` target `= 1.00`

## Acceptance criteria (v1)

1. Theater overlay is generated for every Helix Ask reply with debug payload.
2. At least one canonical encounter triggers for each major failure class:
   - ambiguity, evidence miss, coverage miss, contradiction, overload.
3. PASS/FAIL/integrity states are represented exactly and deterministically.
4. No policy contract violations introduced for voice/text parity.

