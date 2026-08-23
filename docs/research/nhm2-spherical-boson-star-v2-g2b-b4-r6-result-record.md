# NHM2 spherical boson-star v2 G2B-B4-R6 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: no-solve mechanism-separation benchmark  
Current maturity: independently audited terminal diagnostic `PASS`  
Target maturity: bounded scientific review without successor selection  
Required frozen inputs: sealed B4-R6 packet/checkpoint, immutable B4-R4 state, B4-R5 receipt and evaluator sources  
Required evidence: authenticated sole receipt and producer-independent host/Linux replay  
Stop/fail criteria: any receipt, input, reconstruction, threshold, decision, mutation or authority mismatch  
Explicit non-goals: successor selection, Newton/continuation execution, retry, retune, candidate/proof/lane/lamp/physical authority  
Downstream gate unlocked: bounded scientific review only; no candidate solve

## Verdict

The sole admitted offline Linux benchmark completed with status `PASS`. Its
preregistered decision is:

```text
MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR
```

This is a valid terminal diagnostic result, not a candidate-solve pass. Scaling
and first-interior discretization/localization both cross their frozen triggers.
Because two mechanism families are active, B4-R6 forbids choosing a numerical
successor from this evidence.

## Authenticated evidence

| Item | Value |
|---|---|
| Packet SHA-256 | `8c9880df19fa22b659e658f3229bca67f732958d02c40e90a58741316aad477b` |
| Admitted image | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |
| Receipt bytes | 12,503 |
| Receipt raw SHA-256 | `e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2` |
| Receipt self-hash | `0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001` |
| Independent audit | 6/6 host and 6/6 admitted Linux |
| Independent audit source | 12,477 bytes, `eae10ef8f714eefe2f102f2d2eb1dd4f803d24170e41b6ac7f0319363511ec38` |
| Math registry | 318 entries, validation `OK` |
| Required WARP suite | 18/18 files, 179/179 tests |
| Casimir verification | run 2440, `PASS`, certificate `GREEN` |
| Certificate hash | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, integrity `true` |

The output root contains exactly `receipt.json`. The audit independently
reopens every source/input binding, recomputes canonical and domain-separated
self-hashes, reconstructs the frozen N=64 endpoint, replays all four coordinate
factors and power-of-two equilibration, replays the 256-bit Chebyshev spectrum
and first-interior statistic, and derives the same trigger and stop decision.

## Frozen mechanism results

| Family | Trigger | Evidence |
|---|---:|---|
| Coordinate boundary | false | Direct `w`, `q=1-w`, and `nu=(w^2-1)/2` have essentially the same unscaled U-diagonal spread near `1.34264e13`; log-gap is worse near `8.40e24`. No unique bounded coordinate separates. |
| Scaling/conditioning | true | Direct-`w` U-diagonal spread falls from about `1.34264e13` to `52.7721`, a factor about `2.54422e11`; equilibrated pivot growth is about `0.970918`. |
| Precision | false | MPFR256 residual disagreement is about `7.85e-15`; Jacobian disagreement divided by matrix maximum is about `1.73e-16`. Both are below the frozen `2^-40` trigger. |
| Spectral parity | false | High-tail/total is about `0.0549`, but even/odd high-tail ratio is about `1.08545`, inside the frozen parity interval. |
| First-interior localization | true | Node-1 unused-constraint magnitude is about `1908.18` times the median interior magnitude, above the frozen factor-16 trigger. |

The data therefore reject coordinate-only and precision-only explanations. They
support a strong conditioning defect and a distinct boundary-localized
formulation/discretization defect, but B4-R6 contains no causal interaction test
that can decide whether one is upstream of the other. Selecting equilibration
alone or a discretization change alone would be post-result tuning.

## Mutation and authority record

No candidate solve, Newton call, continuation, Armijo trial, state update,
accepted trial, B4-R4 retry, or retune occurred. Candidate admission and vacuum
work remain false. Proof, execution, 68-file lane, replay, pair-agreement,
diagnostic-lamp, Theory Graph, joint geometry/state, physical, propulsion, and
transport authority all remain false.

## Authorized next state

G2B remains active but enters bounded scientific review. The review may use
read-only analysis to preregister a causal separation experiment for the
interaction between equilibration and first-node localization. It may not pick
a successor, rerun B4-R4, change thresholds, or execute another candidate solve
without a new versioned packet whose decision rules are frozen before results.
