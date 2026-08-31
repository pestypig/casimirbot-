Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8 exhaustion-data sufficiency review
Current maturity: authenticated `H2_PARENT_FAIL`; aggregate terminal evidence only
Target maturity: bounded causal-identifiability decision without numerical execution
Required frozen inputs: H2-P7 result packet, recovered raw evidence, exact P7 selector and ledger sources, passing 24/24 parent-result audit
Required evidence: source-to-record field trace, explicit identifiable/non-identifiable claims, additive-diagnostic boundary, current math/WARP/Casimir integrity
Stop/fail criteria: candidate evaluation, numerical rerun, retune, threshold/schedule/reduction change, inferred data not present in the record, evidence mutation or authority promotion
Explicit non-goals: making H2 pass, selecting a new refinement ceiling, running cloud or local compute, linking a scientific handler, beginning G3/SI/metric/lane work, or promoting any claim
Downstream gate unlocked: at most one candidate-neutral additive H2-P8A diagnostic-definition proposal; execution remains separately ineligible

# H2-P8 exhaustion-data sufficiency review

Status date: August 28, 2026.

Decision: **INSUFFICIENT PERSISTED DATA FOR CAUSAL SEPARATION**.

This is a source-and-receipt review. It executes no numerical selector and does
not modify the immutable H2-P7 failure.

## What P7 establishes

P7 establishes that the exact 16-thread selector visited all 17 frozen
power-of-two U-panel candidates and returned
`C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`. Its aggregate counts
are authenticated: 131,071 accumulated subpanels, 131,071 predecessor-jet
calls, 5,636,053 elementary convolutions and 5,746 width checks. This excludes
an infrastructure timeout and proves that no candidate in the fixed schedule
satisfied the selector's acceptance policy.

## Why the present record cannot identify the cause

The selector holds the 17 per-candidate width decisions in a local
`width_passes` array, evaluates each candidate, and then collapses exhaustion
to one failure enum
(`mini_boson_star_primary_c08_convolution_selector_v1.cpp:673-723`). The result
object retains only aggregate counters. The H2 ledger then accumulates those
counters (`mini_boson_star_primary_c08_h2_ledger_v1.cpp:350-362`) and maps the
selector failure to the combined terminal string
`C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION`
(`mini_boson_star_primary_c08_h2_ledger_v1.cpp:478-485`).

Consequently, the persisted evidence does not contain:

- the pass/fail bit for each of the 17 candidate widths;
- which jet, coefficient or term first failed a width predicate;
- the enclosure width and allowed bound at that failure;
- a normalized worst-width ratio or its trend across refinement;
- enough information to distinguish an insufficient U-panel ceiling from a
  non-contracting Volterra enclosure.

The aggregate `2^17 - 1` count proves complete schedule exhaustion, but it
cannot reconstruct any of those discarded values. Therefore no schedule
extension, threshold change, analytic reformulation or other numerical repair
is justified by P7 alone.

## Only eligible successor

The next eligible action is one candidate-neutral H2-P8A diagnostic-definition
proposal. It may add immutable observation fields for each already-computed
candidate—candidate index, panel count, width-pass bit, first failing
jet/coefficient/term, computed enclosure width, allowed width and worst
normalized ratio—plus an explicitly versioned terminal summary.

That definition must preserve the exact input, arithmetic, candidate schedule,
thresholds, reduction order, first-passing selection rule and fail-closed
semantics. It must first pass manufactured fixtures, exact-equivalence replay,
resource bounds, canonical serialization and an independent audit. It may not
authorize or imply a numerical execution. Any later observation run would need
a new output root and separate exact authorization and would remain
candidate-neutral.

That successor is now implemented and closed at fixture maturity in
[`nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8a-additive-diagnostic-definition.md`](./nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8a-additive-diagnostic-definition.md).
Its candidate-neutral fixture passes 17/17 twice, the predecessor regression
passes 31/31, and the corrected independent audit passes 40/40 with receipt
`94ee2a0c...b986`. The next eligible action is a P8B parent-diagnostic binding
proposal only; numerical execution remains separately ineligible.

## Authority boundary

P7 remains `H2_PARENT_FAIL`. P8 does not admit a boson-star candidate or prove
that one exists. Candidate, proof, geometry/state, lane, lamp, physical,
propulsion and transport authority remain false.
