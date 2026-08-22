# NHM2 Spherical Boson-Star v2 G2B-M1 Execution Checkpoint

Program gate: G2B-M1 — MPFR256 global-center implementation review

Workstream: versioned classical-branch repair review

Capability or component: one-shot fixed MPFR256 multiple-shooting execution

Current maturity: proposal, engine, runner, and focused tests frozen; output
absent; no nonlinear successor solve executed

Target maturity: one immutable success or failure receipt

Required frozen inputs: one-shot proposal raw
`be3f5be7494375e646b2908f71024518b62075fbb72f8da3dc70e1725c222bb0` /
4,176; engine raw
`85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de` /
32,381; engine spec raw
`0e5367640f8bfc62e114a03ee56e2f6f4765f922ab510933ed666a96c002c8cf` /
9,654; runner raw
`550f35b86c62c634e84a5a693e4394f42e403f25cc890dcbb45d93b30322a2b7` /
20,818; runner spec raw
`dcfe1d75a6b0d13edac83e6cd36649c22e0587f35321ca9a5da17930ab24aa74` /
4,695; immutable center and runtime bindings named by those files

Required evidence: output absent; engine 10/10 PASS; runner 7/7 PASS under
isolated Python; AST and line limits; exact old-center Hermite and 128-mode
oracles reproduced; exclusive receipt; independent self-hash and result replay;
no-retune and false authority

Stop/fail criteria: any binding/test drift; existing output; changed command;
missing receipt; retry; changed method, schedule, threshold, projection, rail,
or authority

Explicit non-goals: a second run; proof or candidate acceptance; later
mathematical duties; lamp, physical, propulsion, or transport authority

Downstream gate unlocked: exactly the result-selected G2B proof-center or
codec/mode successor, or a terminal falsifier

Change class: one-shot exploratory diagnostic execution; no authority

## Pre-execution verification

- Fixed output
  `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-m1-mpfr256-global-center-v1.json`
  is absent.
- Engine focused suite: 10/10 PASS under `-I -B -W error`.
- Runner focused suite: 7/7 PASS under `-I -B -W error`.
- Both source/spec pairs parse as Python AST; maximum line lengths are 88, 83,
  88, and 87 respectively.
- The exact old-center Hermite oracle and exact frozen 128-mode polynomial
  oracle are reproduced bit-for-bit by the runner tests.
- Public candidate execution remains limited to the exact runner command below.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error \
  tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_g2b_m1_one_shot.py --execute-once
```

The command executes coarse and fine refinements once, each from the immutable
initializer. It writes a complete failure receipt on any caught failure. It may
not be rerun after the output exists or after inspecting the result.
