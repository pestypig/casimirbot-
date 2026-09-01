Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C2-R1 fixed-context decimal-ingress repair
Current maturity: v2 audit immutable 20/22 FAIL from premature Decimal rounding; additive v3 implemented and self-tested 4/4; capture not evaluated by v3
Target maturity: exact 80-digit Arb rendering replay and immutable causal classification
Required frozen inputs: v2 reader `33e66049...ec2b4`, v2 failure `cf031c80...6b9ff`, v3 reader `2b4fe456...58a09`, fixed precision 220 and unchanged evidence/decision bindings
Required evidence: independent definition audit, long-midpoint fixture, exact source hashes, one immutable capture audit and false authority locks
Stop/fail criteria: changing the one-ulp rule, using default Decimal precision, fitted tolerance, capture mutation, numerical retry/retune, candidate activity or authority promotion
Explicit non-goals: changing output/scientific semantics, rerunning C2-R1, candidate evaluation, G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: only the preregistered P8G lead named by a v3 PASS; no execution authority

# H2-P8F-C2-R1 fixed-context decimal repair

Status: **FROZEN ADDITIVE DEFINITION / SELF-TEST 4/4 PASS / CAPTURE NOT YET EVALUATED**.

The v2 reader correctly added FLINT's documented one-midpoint-ulp conversion
uncertainty, but constructed the interval before entering the existing
220-digit replay context. Python Decimal therefore rounded the 80-digit
renderings at its default 28-digit precision. The immutable v2 receipt fails
only ratio and slot-sum replay, again selecting nothing.

The additive reader
`scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v3.py` is exactly 3,304
bytes with SHA-256
`2b4fe456654b5d46b8d528d90785772f32e4b19a347135b784a7472c2e258a09`.
It rehashes frozen v2 SHA-256
`33e660490990ba3c94c4d260d427552c5d0b4385751b52e7bd0f2222ebaec2b4`
and changes only the context in which midpoint±(radius+ulp) endpoints are
constructed: fixed Decimal precision 220. The one-ulp rule, 13 evidence hashes,
identities, all other checks and the preregistered comparison order are
unchanged. Its long 81-digit-midpoint fixture rejects default-context loss.

Any v3 audit failure selects nothing. A PASS remains diagnostic and
candidate-neutral; every candidate, proof, geometry/state, lane, lamp,
physical, propulsion and transport authority remains false.
