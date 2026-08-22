# NHM2 Spherical Boson-Star v2 G2B-A Global-Center Accuracy Calibration

Program gate: G2B-A — higher-accuracy global-center calibration

Workstream: versioned classical-branch repair review

Capability or component: finite preregistered solver-accuracy ladder for the
lambda-zero global center

Current maturity: closed after fixed ordinal 0 hit the typed hard failure
`global_root_screen_failed:solver_status`; no calibration receipt or selected
configuration was produced, later ordinals did not run, and no retry occurred

Target maturity: achieved as an immutable hard-stop record selecting the
MPFR/spectral successor class without changing the rail

Required frozen inputs: G2-R1 receipt
`86633508a20c79b56d7ed0455102fd1c35f206e521dbda8e3e9d79b85aef243f`;
unchanged equations, boundary conditions, `epsilon=2^-12`, outer radius 32,
initial guess, normalization, point `x=1/128`, and rail `1/10^10`

Required evidence: three independently initialized solver observations in
fixed ordinal order; exact binary64 output words; exact-rational Hermite
residual at the frozen point; solver RMS/boundary/dense replay screens; node
counts; deterministic selection; immutable receipt; no-retune attestation

Stop/fail criteria: input or runtime drift; reused previous solution as a later
initializer; reordered/skipped configuration; solver exception; nonfinite or
negative-zero state; node-budget overflow; exact-evaluation failure; output
collision; changed equation, point, rail, or selection rule

Explicit non-goals: proof-center replacement; 128-mode projection; later proof
duties; branch execution; adaptive search; result-derived fourth configuration;
threshold relaxation; candidate, lamp, physical, propulsion, or transport
authority

Downstream gate unlocked: one versioned G2B global-center attempt proposal, or
an MPFR/spectral implementation proposal if binary64 is exhausted

Change class: exploratory diagnostic mathematics within one evidence-selected
successor class; no authority

## Frozen ladder

Run three fresh `scipy.integrate.solve_bvp` calculations. Every ordinal starts
from the same frozen 513-node analytic initial guess; no result initializes any
later ordinal.

| Ordinal | Solver tolerance | Maximum nodes | Dense replay points |
| ------: | ---------------: | ------------: | ------------------: |
|       0 |          `2^-36` |        65,537 |              16,385 |
|       1 |          `2^-40` |        65,537 |              16,385 |
|       2 |          `2^-44` |        65,537 |              16,385 |

All other numerical and physical choices remain those of the immutable v1
global-center proposal. Each solve must run even if an earlier ordinal passes,
unless a hard exception prevents producing an honest observation; such an
exception terminates the calibration.

## Frozen measurements

For every ordinal record:

1. solver status and node count;
2. maximum solver RMS residual;
3. maximum normalized dense replay residual on the fixed 16,385-point uniform
   mesh;
4. maximum boundary residual;
5. the exact-rational normalized cubic-Hermite Schrödinger residual at
   `x=1/128` using the same formula as G2-R1;
6. exact parameter and state binary64 words needed for replay.

## Frozen selection rule

A configuration is eligible only if all of the following hold:

```text
solver success
node count <= 65,537
maximum RMS residual <= its own solver tolerance
maximum boundary residual <= 2^-44
maximum dense replay residual <= 1/4 * 10^-10
exact Hermite residual at x=1/128 <= 1/4 * 10^-10
all original sign, monotonicity, origin, and tail screens pass
```

The factor-four margin is fixed before calibration so the later one-shot center
is not selected merely for touching the proof rail. If multiple configurations
are eligible, select the lowest ordinal. If none is eligible, binary64 is
exhausted for this successor review and the only authorized next class is an
MPFR256 or equivalently rigorous spectral global-center implementation.

Calibration does not create the replacement center. The selected configuration
must be copied unchanged into a separately reviewed one-shot G2B proposal with
its source/runtime/output bindings frozen before execution.

## Closed execution result

The sole command and first failure are recorded in
[`nhm2-spherical-boson-star-v2-g2b-a-calibration-failure-record.md`](./nhm2-spherical-boson-star-v2-g2b-a-calibration-failure-record.md).
Fixed ordinal 0 failed the primary solver-status screen. The stop rule
terminated the ladder before ordinals 1 and 2. The output remained absent, the
command was not retried, and no binary64 configuration was selected.

The active successor is therefore G2B-M1, a bounded implementation review for
an MPFR256 global-center solver. This is a change of numerical class explicitly
authorized by the frozen selection rule, not result-derived retuning.
