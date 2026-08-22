# NHM2 spherical-boson-star v2 G2B-M3 result record

Program gate: G2B-M3 — fixed local-center refinement ladder  
Workstream: lambda-zero center recovery  
Capability or component: MPFR256 prefix integration and exact local jet  
Current maturity: completed authenticated local-center pass  
Target maturity: immutable center selection for projection successor  
Required frozen inputs: M3 packet/source/spec, M2 receipt/source, M1 engine  
Required evidence: four observations, three comparisons, independent self-hash  
Stop/fail criteria: no rerun, new ordinal, threshold change, or projection here  
Explicit non-goals: proof-center promotion, candidate/lamp/physical authority  
Downstream gate unlocked: G2B-M4 MPFR-native projection ladder

## Immutable result

- Raw SHA-256:
  `38bb7bb9cf52f0f0008442f9c8c212279f85d9d323eab69b66ec1eea061fa88d`.
- Raw size: 18,479 bytes.
- Length-delimited self-hash:
  `198f65decd9fe7616a523a066d80898b582fdf630921bafaa9557858a5aeb212`.
- Independent self-hash recomputation: exact match; unsigned canonical size
  18,396 bytes.
- Decision: `MPFR_LOCAL_CENTER_SELECTED`.
- Selected substeps per output interval: 256.
- Four center observations and three adjacent comparisons are present.
- No projection, candidate solve, or retune: true.
- Every authority lock: false.

| Substeps | Exact normalized residual | Ratio to `1e-10` rail |
| ---: | ---: | ---: |
| 32 | `6.7378299210077095e-18` | `6.73783e-8` |
| 64 | `5.3027896644605796e-19` | `5.30279e-9` |
| 128 | `1.4223150326308631e-19` | `1.42232e-9` |
| 256 | `1.1797617789895095e-19` | `1.17976e-9` |

The 32/64 and 64/128 jet comparisons failed the unchanged `2^-60` selection
condition by factors approximately 28.140 and 1.759. The 128/256 comparison
passed at approximately 0.109953 times that limit. Because all ordinals and
comparisons were frozen and executed, selecting 256 is preregistered selection,
not post-result retuning.

This passes only the local center representation. The exact projected
Schrödinger residual remains unevaluated and must pass independently before the
G2 proof-center core duty can reopen.
