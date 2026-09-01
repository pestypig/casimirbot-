Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C2-R1 Arb decimal-ingress repair
Current maturity: v1 result audit immutable 20/22 FAIL; additive v2 parser implemented and self-tested 6/6; capture not evaluated by v2
Target maturity: documented-FLINT-semantics result audit and immutable causal classification
Required frozen inputs: v1 reader `c0b0196d...ee4b6`, v1 failure `43e55c50...81fb7`, v2 wrapper `33e66049...ec2b4`, exact capture hashes and FLINT `arb_get_str` default-flags contract
Required evidence: source-disjoint definition audit, one-ulp parser fixtures, unchanged 20 non-decimal checks, immutable v2 receipt and false authority locks
Stop/fail criteria: editing v1 evidence, fitted tolerance, more than one midpoint ulp, capture mismatch, replay failure, numerical retry/retune, candidate activity or authority promotion
Explicit non-goals: changing any scientific source/output, rerunning C2-R1, candidate evaluation, G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: only the preregistered P8G lead named by a v2 audit PASS; no execution authority

# H2-P8F-C2-R1 decimal-ingress repair

Status: **FROZEN ADDITIVE DEFINITION / SELF-TEST 6/6 PASS / CAPTURE NOT YET EVALUATED**.

The v1 result reader and its `20/22 FAIL` receipt remain immutable. Both failed
checks treated the printed midpoint as exact. The pinned producer instead calls
`arb_get_str(value, 80, 0)`. FLINT's primary documentation states that default
output is midpoint-correct to one unit in the last displayed decimal place and
that parsing the string back produces an interval containing the original:

- https://flintlib.org/doc/arb.html
- https://flintlib.org/doc/using.html#binary-and-decimal

The frozen v1 reader SHA-256 is
`c0b0196d7879f1e156cea6abeae6d5f216ac3f01e6f365affc81a459da8ee4b6`.
The additive reader
`scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v2.py` is exactly 4,012
bytes with SHA-256
`33e660490990ba3c94c4d260d427552c5d0b4385751b52e7bd0f2222ebaec2b4`.
It imports and rehashes the frozen v1 reader, changes only decimal ingress, and
sets a new audit schema. For printed midpoint `m` with decimal exponent `e` and
explicit radius `r`, it uses the closed interval

`[m - (r + 10^e), m + (r + 10^e)]`.

Exactly one midpoint ulp is added. No empirical tolerance or result-dependent
factor is allowed. All 13 evidence hashes, identities, chronology, progress,
isolation, work counts, authority locks, ratio/slot replay and strict causal
comparison rules remain those of frozen v1.

The v2 audit still selects nothing on any failed check. A PASS remains a
candidate-neutral diagnostic classification only; all candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority is
false.
