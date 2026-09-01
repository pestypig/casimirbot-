Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8G persisted outer-accumulation arithmetic replay
Current maturity: authenticated P8F-C2-R1 decomposition result at 22/22 PASS
Target maturity: exact causal separation of elementary, within-panel and outer ordinal accumulation radii without numerical re-execution
Required frozen inputs: C2-R1 result audit `afda5b93...4c5c`, fixed 220-digit Arb decimal-ingress semantics, final radius/threshold, four slot sums, boundary-panel radius and nonboundary-panel radius sum
Required evidence: strict closed-interval comparisons, gap closure, rail relevance test, deterministic replay, self-test, independent definition audit, zero numerical or candidate activity
Stop/fail criteria: source-audit identity drift, non-closing radius decomposition, non-strict causal comparison, evidence mutation, numerical retry/retune, candidate ingress or authority promotion
Explicit non-goals: changing accumulation order, precision, width rail, selector schedule or equations; rerunning C2-R1; optimizing code; evaluating the frozen member; G3/SI/metric/lane work; or promoting candidate, proof, geometry/state, lamp, physical, propulsion or transport authority
Downstream gate unlocked: candidate-neutral P8H slot-3 factor-pairing and upstream enclosure diagnosis only; no numerical execution authority

# H2-P8G outer-accumulation evidence replay

Status date: August 31, 2026.

Status: **13/13 PASS / OUTER ACCUMULATION REAL BUT INSUFFICIENT FOR THE RAIL**.

This packet changes receipt semantics and program diagnosis only. It does not
change mathematical semantics, runtime authority, a frozen scientific input or
any candidate/proof authority.

## Why no new 65,536-panel run was needed

The authenticated C2-R1 record already persists all quantities needed for a
coarse exact separation:

```text
elementary radii
  -> within-panel four-term assembly
  -> ordinal accumulation of panel coefficient balls
  -> final coefficient radius
```

The total panel-radius sum is the closed-interval sum of the recorded boundary
panel radius and nonboundary-panel radius sum. Subtracting the elementary sum
from that quantity isolates the within-panel assembly gap. Subtracting it from
the final radius isolates the outer ordinal-accumulation gap. The two gaps
recompose to an interval overlapping the directly calculated final-minus-
elementary gap.

The replay uses the already audited one-midpoint-ulp interpretation of FLINT
`arb_get_str` output at fixed Decimal precision 220. It binds the exact source
audit SHA-256 before reading any value.

## Result

| Quantity | Strict interval result |
| --- | --- |
| within-panel assembly gap | `3.6704123566984589411...e-63` |
| outer ordinal-accumulation gap | `3.1628710170594769508...e-58` |
| total final-minus-elementary gap | `3.1629077211830439354...e-58` |
| outer share of that gap | `0.9999883954491238663...` |
| elementary sum / width threshold | `1.0256787639175509328...` |
| slot 3 alone / width threshold | strictly greater than `1` |

The outer accumulation accounts for more than 99.9988% of the *difference*
between the final radius and the elementary-radius sum. That makes it a real,
strictly separated arithmetic contribution.

It is not, however, a sufficient passing-result lead. Even removing the entire
outer gap leaves the elementary sum strictly above the unchanged width rail by
about 2.568%. More decisively, slot 3 alone remains strictly above the rail.
An outer-only accumulation rewrite therefore cannot make this representative
coefficient pass.

The exact classification is:

```text
P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL
```

## Bound implementation

The evidence-only replay is
`scripts/nhm2_g2h_e_s5_c08_h2_p8g_outer_accumulation_evidence_audit.py`,
SHA-256 `fe8f09f84330c51a773a34c042eb9677f7cd794c2ed01dacc9af0e969cb499f6`.
Its manufactured classifications pass 6/6. Applied once to the immutable
authenticated result, it passes 13/13 and emits receipt SHA-256
`c44bd6ed368b93dcd435077be6e98a7d4f33b9630142bad91ac9e3c96996764d`.

## Next lead

P8H should inspect the slot-3 pairing

```text
value_jet * second_jet(1,2)
```

and attribute its enclosure radius to the two operand hulls, prepared bivariate
moments, product/moment summation and remainder propagation. The diagnostic
must be candidate-neutral and equivalence-preserving. It must first establish
which upstream enclosure term can account for the required reduction; it may
not relax the width rail or rerun a scientific selector merely because slot 3
is large.

Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
transport authority remain false.

## Current-head verification

Math-stage validation passes 323/323. All 18 required WARP files pass with
179/179 tests. Root-to-leaf validation passes. Casimir adapter run 2595 is
`PASS/GREEN`, trace `adapter:6a0def76-ec2d-4c2f-b90e-71079cba43bf`, with
certificate `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true.
