# NHM2 spherical-boson-star v2 G2B-M5-R1 execution checkpoint

Program gate: G2B-M5-R1 — exact projection evidence completion  
Workstream: lambda-zero proof-center recovery  
Capability or component: independent coefficient and residual admission  
Current maturity: preregistered, implemented, tested, not executed  
Target maturity: independently verified core-duty pass or falsifier  
Required frozen inputs: M5 source/receipt, M3 receipt, frozen solve engine  
Required evidence: exact nu replay, coefficient hashes, residual equality  
Stop/fail criteria: sole execution terminal; no retry, repair, or retune  
Explicit non-goals: projection rerun, full branch proof, authority  
Downstream gate unlocked: G2B replacement classical proof attempt

## Frozen identities

- M5-R1 packet:
  `6e349dae9c89e2341c48ecd52a0134eff53401b24e6ffc5b936ec8bd478c48cf`
  / 2,246 bytes.
- One-shot independent verifier:
  `bf36631bd4a44aea64cf6db9f863fb39f8c33f3819fbe2bbbb912104f92de16f`
  / 17,038 bytes.
- Focused specification:
  `8d3a82a011214e69e00ff8e6b1c9c7aae3481f4c33cff36f51e6fc949dadb8ce`
  / 3,765 bytes.
- Immutable M5 receipt:
  `0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf`
  / 309,486 bytes; self-hash
  `646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d`.
- Frozen MPFR solve engine:
  `85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de`
  / 32,381 bytes.

## Pre-execution gates

- M5-R1 focused tests: 7/7 PASS.
- M5/M4/M3/M2 focused predecessor tests: 30/30 PASS.
- All six stored coefficient wires independently rehash at exact sizes.
- The verifier owns its exact-rational Chebyshev and compactification logic and
  does not import M5's projected-residual helper.
- AST, line-length, diff, pin, self-hash, and output-absence checks: PASS.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m5_r1_independent_admission.py --execute-once
```

The verifier may replay only the two frozen nonlinear solves needed to bind
`nu`; it may not rematerialize the full state or rerun the projection. It writes
one create-new PASS or falsifier receipt. All authority remains false.
