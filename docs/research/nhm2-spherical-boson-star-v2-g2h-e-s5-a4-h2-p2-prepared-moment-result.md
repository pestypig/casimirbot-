Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P2 prepared beta-moment cache
Current maturity: candidate-neutral exact-equivalence and local-performance PASS; no scientific execution or proof
Target maturity: H2-P3 deterministic ordinal-preserving subpanel parallelism
Required frozen inputs: frozen executable `0afc791e...b73`, 512-bit Arb arithmetic, order 128, 13 jets, 43 elementary convolutions, unchanged finite-binomial moment loops, v1 oracle entrypoints, and every authority lock
Required evidence: manufactured and order-128 `arb_equal` comparisons, identical result/failure fields, frozen/prepared NDJSON equivalence, bounded exponent-2 timing, exact image/executable identities, independent evidence audit, regression fixtures, and current math/WARP/Casimir verification
Stop/fail criteria: any differing Arb value, counter, failure detail, schedule or authority lock; changed equation, precision or moment formula; selected-member ingress; positive sampling; candidate root/token/authorization creation; or mutation of either preserved H2 execution
Explicit non-goals: coverage/hull caching, workspace pooling, subpanel parallelism, a new moment recurrence, frozen-candidate evaluation, scientific authorization, C08 completion, G3, SI/metric, lanes, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: H2-P3 deterministic subpanel parallelism; cloud scaling remains H2-P4 and requires a separately bounded runtime action

# H2-P2 prepared-moment result

Status date: August 27, 2026.

## Verdict

H2-P2 passes. The additive prepared path computes the unchanged 129-by-129
beta-moment table once per subpanel and reuses it across all 43 jet pairings.
The v1 bivariate and jet entrypoints remain callable as the oracle.

The manufactured comparator passed 8/8. The order-128 comparator established
`arb_equal` for every coefficient and remainder, exact result-field equality,
and the unchanged 43-convolution inventory. Frozen/prepared calibration NDJSON
also matched after excluding only the two preregistered timing fields.

No candidate was loaded or evaluated. Positive samples, candidate roots,
authorization surfaces, handler linkage and every authority remain zero/false.
The two preserved serial H2 runs were not changed.

## Evidence and identities

The immutable evidence root is
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p2-prepared-moment-v2-20260827`.

| Evidence | SHA-256 or identity |
| --- | --- |
| Frozen baseline executable | `0afc791ec06d1d9870f77b4a0cc95460a3d0dca61a103e47a106e9415c2b2b73` |
| Prepared executable | `3a6a7aa460bb6b44fed62d2396d7de4d706a6e8ef6cbc78cc537dc3e3c76b442` |
| Prepared image | `sha256:e11f9cb7890b385f17ec14b7b451086ec5fb6103b0724906bfe902965ebf0758` |
| Manufactured fixture executable | `594db4c8ae3974129c3d5e2df9e73b72526b528b2d2b7617df64ce4c81a3b22b` |
| Order-128 fixture executable | `139b513d15bff20cbb2cba5137a358de75a679e1a5690871e54b64290a68e033` |
| H2-P2 receipt | `f2504306841e08440d2f046a3bf3a86c7c8151197e678f49e4046addb79faf24` |
| Evidence inventory | `8cfe49c52d7f3471e1cd51b20631d455b1c3ef8958a76e9e7c668882f192a865` |
| Manufactured result | `b64f3505a3cee5ade6459f5ecbc3c2eefbd021f934285a6c0a8848c9eb41d2eb` |
| Order-128 result | `d7bd2c5c79880e97b6d6a5a4886d25167a0e61047642ce5e3beae966eb74c172` |
| Calibration equivalence | `155b39984256a695b181194e12665187145ec69f090438bc9c7a30689599e51c` |
| Independent audit | `393d941443d3f1ce10587969ff627361564a4ffbf1b447ea988e825522eb3478` at 19/19 PASS |

The additive implementation source identities are:

- bivariate header `b5caffda...35b5` and source `917a7df7...d295`;
- jet header `11cfa704...e6a9` and source `1982953e...79a`;
- manufactured equivalence fixture `95c60f6a...3b9a`;
- order-128 equivalence fixture `7699966b...55e8`;
- prepared calibration Docker definition `3b31f9a2...13e1`;
- evidence runner `1f875e05...ba68` and independent auditor
  `ed1620df...189e`.

## Numerical equivalence

| Gate | Result |
| --- | --- |
| Manufactured valid and invalid paths | 8/8 PASS |
| Order-128 coefficients and 13 remainders | all `arb_equal` |
| Order-128 result/counter fields | exact equality |
| Logical elementary convolutions | unchanged at 43 |
| Frozen/prepared exponent-zero NDJSON | exact semantic equality |
| Prepared exponent-0/1/2 schedule | 1, 3, 7 cumulative subpanels and 43, 129, 301 convolutions |
| Existing bivariate fixture | 19/19 PASS |
| Existing jet fixture | 17/17 PASS |
| Existing selector fixture | 23/23 PASS |
| Evidence audit | 19/19 PASS |

Counters continue to describe the frozen mathematical inventory. Cache reuse
does not reduce the reported 16,641 logical beta moments per elementary
convolution.

## Performance result

The order-128 same-process comparison measured:

```text
oracle:    26.801 s
prepared:   2.625 s
speedup:   10.2099x
```

That exceeds the preregistered H2-P2 target of 4x. The prepared exponent-2
calibration completed seven subpanels in 19.704 seconds:

| Exponent | Panels in row | Row time |
| ---: | ---: | ---: |
| 0 | 1 | 3.073 s |
| 1 | 2 | 5.447 s |
| 2 | 4 | 11.183 s |

Its observed mean is 2.8149 seconds per subpanel. A naive serial projection is
still about 4.27 days per selector or 8.54 days for two selectors. Prepared
reuse therefore removes the dominant repeated calculation but does not by
itself meet the desired turnaround.

## Next gate and Google Cloud

The next proper goal is H2-P3: evaluate independent subpanels concurrently,
store each result by frozen ordinal, and reduce results serially in original
ordinal order. Refinement candidates remain sequential and first-failure
precedence must remain unchanged.

Google Cloud is useful after that implementation exists. H2-P4 should calibrate
1/2/4/8/16-thread behavior on a suitably sized temporary VM. The existing
`c4-standard-2` class has only two vCPUs and cannot establish the required
16-thread scaling curve. No VM was started, stopped or modified by H2-P2.

Cloud use remains a candidate-neutral performance action, not scientific
execution. A fresh billable VM action or change of machine class requires an
explicit bounded authorization and an immutable command/output receipt.

## Current-head verification

- H2-P1 Python equivalence tests: 4/4 PASS.
- H2-P2 manufactured comparator: 8/8 PASS.
- H2-P2 independent evidence audit: 19/19 PASS.
- Existing bivariate, jet and selector fixtures: 19/19, 17/17 and 23/23 PASS.
- Math-stage validation: 323 entries, PASS.
- Required WARP suite: 18 files and 179 tests, PASS.
- Casimir adapter: run `2533`, `PASS/GREEN`, no first failure or deltas;
  certificate `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity true.

These gates validate the candidate-neutral implementation result only. They do
not establish an H2 proof result or any physical authority.
