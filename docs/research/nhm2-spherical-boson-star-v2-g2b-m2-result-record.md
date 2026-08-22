# NHM2 spherical-boson-star v2 G2B-M2 result record

Program gate: G2B-M2 — MPFR-native proof representation  
Workstream: lambda-zero center recovery  
Capability or component: one-shot high-precision center and spectral codec  
Current maturity: completed authenticated numerical failure  
Target maturity: immutable first-failure record and successor review input  
Required frozen inputs: M2 packet/source/spec, M1 engine, R3 receipt  
Required evidence: raw and self hashes, chronology, first-failure stage  
Stop/fail criteria: no rerun, threshold change, retry, or projection after failure  
Explicit non-goals: candidate admission, proof pass, lamp or physical authority  
Downstream gate unlocked: G2B-M2-R1 refinement/evidence consistency review

## Immutable result

- Raw SHA-256:
  `9ab9ef772af00e7d2b130eb3319058a70514389995fdda5099985b1088087df8`.
- Raw size: 3,020 bytes.
- Length-delimited self-hash:
  `bd0dcd77a870c412d1211507be3ea56f8c7a3cf027125a84a158c16e873bc448`.
- Independent self-hash recomputation: exact match; unsigned canonical size
  2,937 bytes.
- Decision: `MPFR_NATIVE_SOLVE_OR_REFINEMENT_FAILED`.
- First failure: `g2b_m2_center_refinement_disagreement` at
  `center_materialization`.
- Projection did not run; selected mode is absent.
- No candidate solve and no retune: true.
- Every authority lock: false.

Both fixed nonlinear solve refinements completed their unchanged four-entry
chronologies. Their final maximum matching residuals were approximately
`5.3544e-76` and `3.5408e-76`, respectively. The failure therefore occurred
after nonlinear convergence, during the preregistered comparison of the 16- and
32-substep local quintic jets against `2^-60`.

## Evidence limitation

The failure receipt identifies the exact stage and typed condition but does not
persist the three local jets or the maximum disagreement magnitude because the
exception was raised before the success payload was assembled. M2 is still a
valid terminal `FAIL`, but it is not sufficient evidence for selecting a new
numeric threshold. A successor must persist every completed observation before
applying its decision rule, including observations that fail.

No M2 rerun is allowed. Any further calculation requires a separately versioned,
preregistered successor justified by a read-only consistency review rather than
by guessing the missing magnitude.
