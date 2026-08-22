# NHM2 spherical-boson-star v2 G2B-M4 execution checkpoint

Program gate: G2B-M4 — selected-center MPFR-native projection  
Workstream: lambda-zero proof-center recovery  
Capability or component: full 256-substep state and fixed DCT-I ladder  
Current maturity: preregistered, implemented, tested, not executed  
Target maturity: immutable projected core-duty pass or terminal falsifier  
Required frozen inputs: M4 packet, M3 source/receipt, M2 codec, M1 engine  
Required evidence: byte-exact M3 replay and all fixed coefficient bindings  
Stop/fail criteria: sole execution terminal; no retry, retune, or added mode  
Explicit non-goals: candidate admission, proof/lamp/physical authority  
Downstream gate unlocked: remaining G2B duties only after exact projection pass

## Frozen identities

- M4 packet:
  `ab66dc59d4857df268efe84e46c3f0dfa6dea6474102df56aaa77eb7e81eb80d`
  / 2,377 bytes.
- One-shot source:
  `bc8789803aa6406464b977a777485848bf3f403dce53a89209acbdeb499c40ec`
  / 13,066 bytes.
- Focused specification:
  `df5e130943dc007b5bd6b204668135a5360dbd82aa12b8e1109b6bda1f3471cc`
  / 4,009 bytes.
- Selected M3 source:
  `c116db73eb5ab438f4a1f3e4ce964795315e757ee78033552a8ffaf0a8ac3140`
  / 14,024 bytes.
- Selected M3 receipt:
  `38bb7bb9cf52f0f0008442f9c8c212279f85d9d323eab69b66ec1eea061fa88d`
  / 18,479 bytes; self-hash `198f65decd9fe7616a523a066d80898b582fdf630921bafaa9557858a5aeb212`.

## Pre-execution gates

- M4 focused tests: 6/6 PASS.
- M3 focused tests: 8/8 PASS.
- M2 focused tests: 8/8 PASS.
- AST, line-length, diff, dependency-pin, replay-tamper, and static checks: PASS.
- One-shot output path: absent.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m4_mpfr_native_projection.py --execute-once
```

This run is expected to be substantially longer because it performs about two
million MPFR RK4 substeps before the full fixed projection ladder. It may write
only the create-new M4 receipt. All authority remains false.
