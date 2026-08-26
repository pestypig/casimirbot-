Program gate: G2H — Tolman-VII proof implementation/preexecution
Workstream: authenticated classical control branch
Capability or component: primary no-candidate fixture harness v1
Current maturity: immutable fixture `FAIL` at primary fixture 5 of 7
Target maturity: truthful exact-rational/ball-layer fixture semantics
Required frozen inputs: build binding 0fb205307970527efacec1764edfcb76004e1441aea6ba565e24f69421b6a300
Required evidence: immutable partial root and typed first-failure diagnosis
Stop/fail criteria: reuse, deletion or reinterpretation of the v1 fixture root
Explicit non-goals: candidate evaluation, proof result, threshold change or authority promotion
Downstream gate unlocked: one G2H-R1 fixture-only implementation repair

# G2H fixture v1 failure

The fixture root `artifacts/research/nhm2/g2h-fixtures-v1` is immutable partial
evidence. Primary fixtures 1 through 4 pass. Fixture
`exact_rational_positive` fails, so chronology stops before primary fixtures 6
and 7 and before every independent fixture.

The source asked Arb to report the ball created from `1/5` as exact. Arb uses a
binary midpoint/radius enclosure; `1/5` is not a finite dyadic, so the enclosure
is positive but not exact. The intended two-layer duty is instead:

1. establish `1/5` exactly in FLINT's rational layer;
2. convert it to an outward Arb enclosure and establish strict positivity.

This is a no-candidate harness defect. Candidate evaluations remain zero, both
candidate roots remain absent, and all proof/downstream/physical authority is
false. The v1 root cannot be retried, deleted or completed.
