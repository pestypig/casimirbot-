# NHM2 spherical-boson-star v2 G2B-M1-R3 execution checkpoint

Program gate: G2B-M1-R3 — ODE-jet interpolation and mode diagnosis  
Workstream: lambda-zero center recovery  
Capability or component: representation-only one-shot diagnostic  
Current maturity: preregistered and tested; not executed  
Target maturity: immutable representation diagnosis receipt  
Required frozen inputs: R2 center receipt, R3 packet, pinned M1 runner  
Required evidence: exact quintic-center residual and fixed 128/256/512 mode ladder  
Stop/fail criteria: first completed receipt is terminal; no rerun or retune  
Explicit non-goals: candidate solve, threshold change, proof authority, lamp authority  
Downstream gate unlocked: result-selected representation successor or terminal falsifier

## Frozen implementation

- R3 packet: `5bb03e7e908fe635878a5169f5021b95aaecf0c470ea9cca36f6743caec4b915`
  / 3,099 bytes.
- Diagnostic source:
  `7dd21ba883e200d96ee4037db3aa5e73bf62e8da4e1e9990de199595e8091ab9`
  / 15,380 bytes.
- Focused specification:
  `9191aeefb57a3968b97442554d0dcc4f227bdb96e5271fdde78ae3aaf76b671c`
  / 2,677 bytes.
- Focused test: 5/5 PASS under Python 3.13 isolated mode.
- AST parsing and maximum-line-length checks: PASS.
- Expected output path is absent before execution.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m1_r3_representation_diagnosis.py --execute-once
```

The diagnostic reads the immutable R2 receipt, performs no nonlinear solve, uses
the frozen ODE endpoint jets and fixed mode ladder, writes exclusively with
create-new semantics, and keeps candidate, proof, execution, diagnostic-lamp,
physical, propulsion, and transport authority false.
