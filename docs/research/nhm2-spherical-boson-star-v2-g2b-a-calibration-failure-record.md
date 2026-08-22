# NHM2 Spherical Boson-Star v2 G2B-A Calibration Failure Record

Program gate: G2B-A — higher-accuracy global-center calibration

Workstream: versioned classical-branch repair review

Capability or component: immutable record of the preregistered binary64
calibration hard stop

Current maturity: executed once; stopped at the first hard failure; no receipt
was produced

Target maturity: closed binary64 calibration gate with one evidence-selected
high-precision successor class

Required frozen inputs: active packet raw
`4d9a68bcfc14c2d570d0a7800774e9a2a429e0cda46dd3053301d9b13a954808` /
4,101; source raw
`511f50453f0c4146eae98895b2b1f7c35808a63dcfcb5dc8bf2f849160afbf07` /
15,318; focused spec raw
`aa8945ff8fea63a4a03ec1061a76cb9047542de561820463498a62394fba52cc` /
4,590; absent fixed output before execution

Required evidence: exact sole command, process result, first typed failure,
output absence after failure, no later ordinal, no retry, unchanged rail and
authority locks

Stop/fail criteria: any attempt to infer unpersisted solver internals, execute a
later ordinal, retry the ladder, add a fourth binary64 configuration, weaken the
rail, or promote authority

Explicit non-goals: a successful calibration receipt; a replacement center;
an inference that every possible binary64 method fails; proof, candidate,
lamp, physical, propulsion, or transport authority

Downstream gate unlocked: G2B-M1 high-precision global-center implementation
review

Change class: immutable failure evidence; no authority

## Executed command

The sole preregistered command was executed once:

```text
C:/Python313/python.exe -I -B -W error \
  tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_g2b_a_accuracy_calibration.py
```

The process ran for approximately 18.5 seconds and exited nonzero while
executing fixed ordinal 0. The first typed failure was:

```text
g2b_a_global_primary_dependency.GlobalRootAttemptError:
global_root_screen_failed:solver_status
```

The fixed output remains absent:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
g2b-a-global-center-accuracy-calibration-v1.json
```

The implementation called the frozen primary screen before it constructed a
calibration observation. Consequently, no content-addressed failure receipt,
solver status integer, terminal node count, or state bytes were persisted. It
would be dishonest to reconstruct those missing values from the exception.
This is a receipt-completeness limitation of the calibration implementation,
not authorization to rerun it.

## Chronology-preserving decision

The active packet states that a solver exception or hard failure terminates the
calibration. Therefore:

- ordinal 0 ran once and hit the typed solver-status hard stop;
- ordinals 1 and 2 did not run;
- the command was not retried;
- no configuration was selected;
- no center was replaced;
- the equation, boundary conditions, point `x=1/128`, mode count, and frozen
  `1/10^10` rail are unchanged;
- all candidate, proof, lamp, physical, propulsion, and transport authority
  remains false.

This result closes only the preregistered tighter-`solve_bvp` ladder. It does
not prove that every binary64 algorithm is impossible. Under the packet's
frozen successor rule, the smallest justified new numerical class is an
MPFR256 or equivalently rigorous spectral global-center implementation.
