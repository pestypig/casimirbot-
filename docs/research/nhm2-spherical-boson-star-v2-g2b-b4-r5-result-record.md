# NHM2 spherical boson-star v2 G2B-B4-R5 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: read-only diagnosis of the persisted B4-R4 N=64 stage-0 endpoint  
Current maturity: independently audited diagnostic `PASS`; no successor uniquely justified  
Target maturity: bounded mechanism-separation benchmark before any successor proposal  
Required frozen inputs: exact B4-R4 terminal bytes, N=64 grid, square-system evaluator/Jacobian, deterministic LU and Newton policy  
Required evidence: endpoint replay, residual/constraint ranks, LU sensitivity proxies, all 25 Armijo classifications, monotonicity localization, self hash and independent audit  
Stop/fail criteria: first binding/replay/solve/trial mismatch; no update acceptance, continuation, retry or retune  
Explicit non-goals: treating diagnostic PASS as candidate PASS, extending Armijo, changing variables/precision/scaling, vacuum proof, candidate/lane/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: preparation of a separately sealed mechanism-separation benchmark, not a candidate successor

## Result

Diagnostic status: **PASS**. Successor decision:
**`NO_UNIQUE_SUCCESSOR_JUSTIFIED`**.

The exact B4-R4 endpoint, residual, unused constraint and sign/ordering metadata
replayed bit-for-bit. The diagnostic reconstructed the terminal Newton direction
without invoking Newton chronology or continuation. All 25 frozen Armijo trial
steps were rejected by the strict frequency domain before their merit could be
evaluated: each produced `w >= 1`.

This localizes the immediate stop condition but does not show which repair would
produce a legitimate solve. In particular, the receipt contains no evidence
that a longer backtracking schedule, a bounded frequency variable, higher
precision, row/column scaling, or a different discretization would pass the
residual, constraint, monotonicity and later-grid gates.

## Exact receipt

Output:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json
```

- size: `20,509` bytes;
- raw SHA-256:
  `645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52`;
- self hash:
  `0cfb59144cf29beb0da94852ee872455a56017cbe3fc690fd6cb24cd401ea406`;
- parent B4-R4 terminal self hash:
  `361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28`.

The output root contains exactly that one canonical JSON receipt.

## Mechanism evidence

| Quantity | Result |
|---|---:|
| endpoint `w` | `0.9999999999984018` |
| solved residual L∞ | `3.9006884704107466e-9` |
| solved residual L2 | `2.278660119442475e-8` |
| unused constraint L∞ | `1.5889862975902e-4` |
| Newton direction L∞ | `3.3302106416693695e-5` |
| `r^T Jp` | `-5.192291932937214e-16` (strict descent) |
| condition lower-bound proxy | `1.3087275118779897e11` |
| pivot growth | `1.0` |
| U-diagonal spread | `1.3426417202600844e13` |
| LU solve residual L∞ | `1.6854748933950578e-15` |
| monotonicity violations | `32` |
| Armijo domain rejections | `25/25` |
| merit-evaluable Armijo trials | `0/25` |

The first trial direction changes `w` positively by about
`3.311179600207215e-5`. The linear domain boundary lies at an alpha of about
`4.8266e-8`, between the frozen final `2^-24` step and `2^-25`. This observation
does not evaluate an extra trial and does not authorize extending the schedule.

The solved residual is dominated by the `Et_t` and `Etheta_theta` rows near
interior nodes 4–11. The unused constraint maximum is at the first interior
node. The `varphi` profile has 32 recorded adjacent increases, with a pronounced
even/odd oscillatory pattern. These facts, together with the U-diagonal spread,
mean the failure cannot honestly be attributed to the Armijo length alone.

Frozen trigger result:

| Trigger | Value |
|---|---|
| `EXTREME_LINEAR_SENSITIVITY` | true |
| `NODAL_MONOTONICITY_DEFECT` | true |
| `BINARY64_TRIAL_STAGNATION` | false |
| `UNUSED_CONSTRAINT_SEPARATION` | false |
| `NON_DESCENT_NEWTON_DIRECTION` | false |
| `ARMIJO_GLOBALIZATION_CONFLICT` | false |

`ARMIJO_GLOBALIZATION_CONFLICT` is false because no trial entered the merit
test. The preregistered rules therefore forbid a globalization or precision
successor proposal from this receipt alone.

## Independent audit

The independent audit imports neither the B4-R5 producer nor Newton or
continuation chronology. It separately:

- rehashes the receipt, its self hash and every source/input binding;
- rebuilds the N=64 endpoint map, analytic Jacobian and deterministic LU solve;
- reproduces the full direction hash, pivot sequence/factor diagnostics,
  residual/constraint rankings and strict-descent product;
- reconstructs all 25 trial `w` words and verifies every one is outside the
  strict domain;
- reproduces all 32 monotonicity violations, frozen triggers, decision and
  authority locks.

It passed `5/5` on the host and `5/5` in the admitted offline Linux image. Audit
source: 9,876 bytes, SHA-256
`d034a288c377f67d0cfb4f10d64bd961e47b9a47987970eae0d1f2d2b8e65fe5`.

## Verification handoff

- math registry: `318` entries, PASS;
- required WARP suite: `18/18` files and `179/179` tests, PASS;
- Casimir adapter constraint-pack run `2439`: `PASS/GREEN`, `firstFail=null`,
  no deltas;
- certificate hash:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: `true`.

The certificate covers the constraint-pack handoff only. It does not certify a
candidate solve, override `NO_UNIQUE_SUCCESSOR_JUSTIFIED`, or promote any
scientific or physical authority.

## Next bounded lead

The next proper operation is a mechanism-separation benchmark, not another
candidate execution. It should preregister algebraically explicit alternatives
and test them only at immutable diagnostic states:

1. direct `w` versus bounded weak-field frequency variables such as `1-w` and
   `(w^2-1)/2`, with exact analytic chain-rule columns;
2. unscaled versus preregistered row/column equilibration diagnostics;
3. binary64 versus MPFR residual/Jacobian reconstruction at the same bytes;
4. spectral even/odd and first-interior-node localization tests;
5. decision rules distinguishing coordinate-boundary obstruction, precision/
   conditioning loss and formulation/discretization defects.

It must not solve or continue a candidate. Only a separately sealed benchmark
result may justify one versioned successor proposal. B4-R4 remains `FAIL`, and
vacuum and every later authority remain locked.
