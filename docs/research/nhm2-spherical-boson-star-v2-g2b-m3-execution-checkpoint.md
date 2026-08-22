# NHM2 spherical-boson-star v2 G2B-M3 execution checkpoint

Program gate: G2B-M3 — fixed local-center refinement ladder  
Workstream: lambda-zero center recovery  
Capability or component: center-only MPFR256 prefix integration  
Current maturity: preregistered, implemented, tested, not executed  
Target maturity: immutable selected center or terminal convergence falsifier  
Required frozen inputs: M3 packet, M2-R1 review, M2 source/receipt, M1 engine  
Required evidence: four jets/residuals and three comparisons before decision  
Stop/fail criteria: sole execution terminal; no retry, retune, or added ordinal  
Explicit non-goals: projection, candidate admission, proof/lamp/physical authority  
Downstream gate unlocked: projection successor only after exact center pass

## Frozen identities

- M3 packet:
  `2eb9afaf3ad87a7f8baa658fdce5bb58329c35c3f58ffb071e4a05644a1c516e`
  / 2,279 bytes.
- M2-R1 review:
  `e6c18b093c66d3c2147005f7cbe159c5921cab35d45671091f5e488c63f929c6`
  / 2,487 bytes.
- One-shot source:
  `c116db73eb5ab438f4a1f3e4ce964795315e757ee78033552a8ffaf0a8ac3140`
  / 14,024 bytes.
- Focused specification:
  `5a7d7deddaf805a539f32e51df1a43abe86ec8d7b1421d0a152fa9472f101b92`
  / 5,450 bytes.
- Immutable M2 source:
  `8d6bf64423005a007257c2e6d1f64011eead9f02b65bb5401712205a60288f99`
  / 29,644 bytes.
- Immutable M2 receipt:
  `9ab9ef772af00e7d2b130eb3319058a70514389995fdda5099985b1088087df8`
  / 3,020 bytes; self-hash `bd0dcd77a870c412d1211507be3ea56f8c7a3cf027125a84a158c16e873bc448`.

## Pre-execution gates

- M3 focused tests: 8/8 PASS.
- M2 focused tests: 8/8 PASS.
- M1 engine focused tests: 10/10 PASS.
- AST, line-length, diff, exact-pin, topology, and static surface checks: PASS.
- One-shot output path: absent.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m3_local_center_refinement.py --execute-once
```

The command may write only the create-new M3 receipt. All candidate, execution,
proof, diagnostic-lamp, physical, propulsion, and transport authority remains
false.
