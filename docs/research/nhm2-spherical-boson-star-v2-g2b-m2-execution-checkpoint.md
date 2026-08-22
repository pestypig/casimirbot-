# NHM2 spherical-boson-star v2 G2B-M2 execution checkpoint

Program gate: G2B-M2 — MPFR-native proof representation  
Workstream: lambda-zero center recovery  
Capability or component: one-shot high-precision center and spectral codec  
Current maturity: preregistered, implemented, tested, not executed  
Target maturity: immutable pass or terminal falsifier receipt  
Required frozen inputs: M2 packet, M1 engine, R3 receipt  
Required evidence: exact solve/refinement/center/projection chronology  
Stop/fail criteria: sole execution terminal; no retry, retune, or added ordinal  
Explicit non-goals: candidate admission, proof authority, lamp or physical claims  
Downstream gate unlocked: remaining G2B duties only after exact pass

## Frozen identities

- M2 packet:
  `465901e7e6ba9aaf3c35df5d8ac0e4a6f3b2941068298892c262b25ac34a2bfa`
  / 4,235 bytes.
- One-shot source:
  `8d6bf64423005a007257c2e6d1f64011eead9f02b65bb5401712205a60288f99`
  / 29,644 bytes.
- Focused specification:
  `0c8dff250bc12a06277bac965bfaa3ab61d3beebc2ada4f80e81c31d7ff338f5`
  / 5,122 bytes.
- Audited M1 engine:
  `85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de`
  / 32,381 bytes.
- Immutable R3 raw receipt:
  `a38707c616f19160f3b0ea923d86657f487d198c9a7b6a0cfbe506dde2213387`
  / 9,818 bytes; self-hash `85638ae9944b0ea60e7290174d8ebf615d7385803b83afe9644fb0676bbdb3af`.

## Pre-execution gates

- M2 focused tests: 8/8 PASS.
- M1 engine focused tests: 10/10 PASS.
- AST, line-length, static threshold/binary64-surface, and diff checks: PASS.
- One-shot output path: absent.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m2_mpfr_native_proof_representation.py --execute-once
```

The command may write only the create-new M2 receipt. It grants no candidate,
execution, proof, diagnostic-lamp, physical, propulsion, or transport authority.
