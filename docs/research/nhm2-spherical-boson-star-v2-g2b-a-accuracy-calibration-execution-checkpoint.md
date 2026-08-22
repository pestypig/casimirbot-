# NHM2 Spherical Boson-Star v2 G2B-A Calibration Execution Checkpoint

Program gate: G2B-A — higher-accuracy global-center calibration

Workstream: versioned classical-branch repair review

Capability or component: one-shot execution of the fixed three-ordinal
binary64 solver-accuracy ladder

Current maturity: ladder frozen; implementation and focused tests green; no
calibration solve executed

Target maturity: immutable selection receipt for a binary64 configuration or
MPFR/spectral successor class

Required frozen inputs: active packet raw
`4d9a68bcfc14c2d570d0a7800774e9a2a429e0cda46dd3053301d9b13a954808` /
4,101; source raw
`511f50453f0c4146eae98895b2b1f7c35808a63dcfcb5dc8bf2f849160afbf07` /
15,318; focused spec raw
`aa8945ff8fea63a4a03ec1061a76cb9047542de561820463498a62394fba52cc` /
4,590; G2-R1 receipt and frozen v1 source named by the packet

Required evidence: output absent before execution; focused 8/8 PASS; three
fresh initializations; exact fixed order; complete observations; independent
receipt and selected-result replay; false authority locks

Stop/fail criteria: any binding drift; existing output; changed ladder or
selection rule; solver/dependency/static failure; incomplete ordinal sequence;
receipt mismatch; any authority promotion

Explicit non-goals: adding a fourth configuration; replacing a center; changing
the rail, point, equations, boundary conditions, projection, or mode count;
later proof/branch duties; candidate, lamp, physical, propulsion, or transport
authority

Downstream gate unlocked: exactly one selected G2B center proposal or an
MPFR/spectral global-center implementation proposal

Change class: one-shot exploratory diagnostic execution; no authority

## Pre-execution state

- fixed output
  `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-a-global-center-accuracy-calibration-v1.json`
  is absent;
- focused suite: 8/8 PASS;
- source and spec AST: PASS;
- maximum line length: 85;
- NumPy `2.3.2`, SciPy `1.16.1`, and the frozen global source are bound;
- the three configurations are exactly `2^-36`, `2^-40`, and `2^-44`, all
  with maximum 65,537 nodes and independent frozen 513-node initialization;
- the selection safety limit is exactly one quarter of `1e-10`;
- every authority lock remains literal false.

## Sole authorized command

```text
C:/Python313/python.exe -I -B -W error \
  tools/nhm2-spherical-boson-star-v2-branch-proof/\
newtonian_lambda_zero_g2b_a_accuracy_calibration.py
```

The command executes every ordinal once in order. It may not stop at the first
passing observation, reuse a previous solution, add a configuration, or rerun
after inspecting the receipt.
