Program gate: G1 — real calibrated solar baseline
Workstream: structural comparison and zero-transport run preparation
Capability or component: BiSON-13 sound-speed primary kernel term, trial inlist renderer, resource monitor decisions
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; tested non-running components
Required frozen inputs: author files received September 24, Table 3 v1, model-design v1, installed-provenance v1, initial inlist
Required evidence: source-hash, row and normalization checks; synthetic convolution and failure tests; three-parameter-only inlist diff; resource-stop tests
Stop/fail criteria: mismatched source hash, missing kernel support, nonfinite profile, unbound cross terms/BP04 reference/density source, resource-limit breach
Explicit non-goals: a full sound-speed or density acceptance operator, MESA execution, G1 closure, G2 admission
Downstream gate unlocked: none

# G1 sound-speed operator and run preparation v1

Date: September 24, 2026. Status: **primary-term diagnostic implemented; science execution disabled**.

The [sound-speed operator](../../ops/mesa/g1-preparation-v1/g1_sound_speed_operator.py)
loads the two locally retained author files only when their bytes match the
September 24 intake hashes. It checks the 76 solution rows, 2,701 × 77 kernel
array, 37 alternating Table 3 sound-speed rows and kernel normalization. Its
input is an explicitly supplied model-minus-BP04 `delta c^2/c^2` profile on
`r/R_sun`; it linearly interpolates that profile to the author radius grid
and trapezoid-integrates each signed averaging kernel. It returns the
published Sun-minus-BP04 solution, its quoted error, the model primary-term
prediction and their difference for the selected rows. The output always
reports `DIAGNOSTIC_PRIMARY_TERM_ONLY` and `admissionAllowed: false`.

The operator requires the supplied profile to cover the **entire** kernel
grid, approximately `0.006695899` to `1.001225 R_sun`. A conventional model
profile stopping at `1.0 R_sun` is rejected rather than silently
extrapolated. The outer-boundary mapping must be declared and validated
before a real model is compared. Cross-term kernels, the BP04 profile,
reference radius convention, density operator and systematic-error policy
remain unbound. None of the current outputs is a complete observational
residual or a G1 pass/fail decision.

The [trial renderer](../../ops/mesa/g1-preparation-v1/g1_trial_inlist.py)
checks the frozen initial inlist hash, validates the three preregistered
parameter bounds and returns a trial inlist in memory. Tests verify that its
only changed assignments are `initial_y`, `initial_z` and
`mixing_length_alpha`; no trial is written or executed. The
[preflight](../../ops/mesa/g1-preparation-v1/g1_bounded_launcher.py) now also
contains a pure first-stop decision for a future runtime monitor. It uses
conservative margins of 60 seconds, 500 MB of attempt output and 1 GB of
host free space ahead of the frozen two-hour, 5-GB and 20-GB hard limits.
No process monitor or Docker stop action is connected yet.

`python -m unittest discover -s ops/mesa/g1-preparation-v1 -p 'test_g1_*.py' -v`
passed the no-solver suite on this host. Synthetic checks cover constant,
linear and signed-lobe kernels, full-support failure and nonfinite inputs;
local source checks cover hashes, normalization and Table 3 selection.
Recomputed centers of gravity and quartiles match the author solution table
to its reported rounding precision, providing a direct file-pair check.
The author files remain ignored local artifacts pending reuse terms, so
their source-bound tests skip on machines without those bytes. The tests do
not replace an independent comparison against an authenticated BP04 model.
