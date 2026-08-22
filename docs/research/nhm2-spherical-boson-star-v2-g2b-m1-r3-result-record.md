# NHM2 spherical-boson-star v2 G2B-M1-R3 result record

Program gate: G2B-M1-R3 — ODE-jet interpolation and mode diagnosis  
Workstream: lambda-zero center recovery  
Capability or component: immutable representation diagnosis  
Current maturity: completed authenticated calculation-only falsifier  
Target maturity: closed gate with a uniquely selected successor class  
Required frozen inputs: R2 center, R3 packet, R3 diagnostic source  
Required evidence: exact receipt rehash and all fixed ladder outcomes  
Stop/fail criteria: no rerun, no added ordinal, no threshold or center change  
Explicit non-goals: candidate admission, proof pass, lamp or physical authority  
Downstream gate unlocked: G2B-M2 MPFR-native proof representation

## Immutable result

- Receipt raw SHA-256: `a38707c616f19160f3b0ea923d86657f487d198c9a7b6a0cfbe506dde2213387`.
- Receipt raw size: 9,818 bytes.
- Length-delimited self-hash:
  `85638ae9944b0ea60e7290174d8ebf615d7385803b83afe9644fb0676bbdb3af`.
- Independent self-hash recomputation: exact match; unsigned canonical size
  9,735 bytes.
- Decision: `QUINTIC_CENTER_REPRESENTATION_FAILED`.
- Selected mode count: null.
- No candidate solve and no retune: true.
- Every authority lock: false.

The exact quintic-center normalized residual is approximately
`6.1487168294336712e-10`, or 6.149 times the unchanged `1e-10` rail and
24.595 times the preregistered factor-four margin.

| Modes | Exact projected residual | Rail ratio | Eligible |
| ---: | ---: | ---: | :---: |
| 128 | `4.4041603339408967e-10` | 4.404 | no |
| 256 | `1.8201478671207028e-8` | 182.015 | no |
| 512 | `3.0487397629068597e-8` | 304.874 | no |

All node, join, and endpoint reconstruction screens passed. Increasing the
binary64 DCT-I mode count worsened the differentiated residual, so neither
higher polynomial order over the same rounded state words nor a larger
binary64 mode count is an eligible repair.

## Causal diagnosis

At the frozen point, the enclosing mesh interval has width approximately
`1.8939278025519729e-4`. The scale `2^-52 / h^2` is approximately
`6.1903240864e-9`. Differentiating nearby binary64 state words twice is therefore
ill-conditioned relative to the `1e-10` rail. This is consistent with the
observed residuals while the upstream MPFR nonlinear matching residual remains
near `3.54e-76`.

The next justified class is a separately versioned MPFR-native observation and
projection codec. It must preserve the ODE, branch, point, normalization, rail,
and failure chronology; it must not infer a pass by defining the second
derivative from the residual equation itself.
