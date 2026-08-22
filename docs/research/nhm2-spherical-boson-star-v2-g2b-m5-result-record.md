# NHM2 spherical-boson-star v2 G2B-M5 result record

Program gate: G2B-M5 — sole tail exponent API repair and projection  
Workstream: lambda-zero proof-center recovery  
Capability or component: repaired MPFR tail evaluation and fixed projection  
Current maturity: immutable numerical PASS; independent admission pending  
Target maturity: independently admitted passing core-duty receipt  
Required frozen inputs: M5 source, M4 failure receipt, M3 selected center  
Required evidence: exact receipt rehash, coefficient bindings, residual replay  
Stop/fail criteria: no retry, retune, added mode, or omitted failed observation  
Explicit non-goals: candidate admission, full branch proof, lamp/physical authority  
Downstream gate unlocked: G2B-M5-R1 evidence-completeness replay

## Immutable result

The sole authorized M5 command completed once and wrote:

- raw receipt SHA-256
  `0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf`
  / 309,486 bytes;
- domain-separated receipt self-hash
  `646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d`;
- decision `MPFR_PROJECTION_SELECTED`;
- selected center substeps 256;
- selected projection modes 128;
- no first failure.

The independent receipt rehash matches. The selected M3 center is reproduced
byte-for-byte and retains exact normalized residual approximately
`1.179761779e-19`.

## Fixed projection observations

All preregistered modes completed and were eligible:

| Modes | Projected normalized residual | Node error | Join error | Endpoint error |
| ---: | ---: | ---: | ---: | ---: |
| 128 | `7.834343067764e-14` | `2.194428257803e-75` | `6.621337055208e-18` | `2.038135779002e-75` |
| 256 | `7.605883526113e-15` | `4.706825352526e-75` | `1.535556871194e-19` | `2.107225127443e-75` |
| 512 | `8.369643575185e-15` | `7.724340169234e-75` | `3.138524209817e-20` | `8.549806869544e-75` |

The unchanged projected-residual margin is `1/(4*10^10) = 2.5e-11`.
The fixed lowest-eligible rule therefore selects 128 modes without observing
or optimizing any additional mode.

## Evidence boundary and next gate

The receipt includes canonical dyadics plus raw hashes and sizes for every
coefficient vector. It does not directly include the exact eigenvalue `nu`
used by the projected-residual calculation. Consequently this record is a
numerical PASS but is not yet the independently admitted core-duty PASS.

G2B-M5-R1 must replay only the already-frozen nonlinear solve to recover and
bind `nu`, then use a separately implemented exact-rational Chebyshev evaluator
to recompute every coefficient binding and projected residual. It must not
rerun the projection, change any threshold, choose another mode, or promote any
authority. A mismatch is terminal evidence, not permission to tune.

Candidate, proof, execution, diagnostic-lamp, physical, propulsion, and
transport authority remain false.
