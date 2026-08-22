# NHM2 Spherical Boson-Star v2 G2B-M1-R3 Representation Diagnosis

Program gate: G2B-M1-R3 — ODE-jet interpolation and mode-count diagnosis

Workstream: versioned classical-branch repair review

Capability or component: exact quintic-Hermite center classifier plus fixed
128/256/512-mode projection ladder

Current maturity: immutable converged R2 center whose cubic and 128-mode
classifiers miss the rail by factors 3.84 and 4.43

Target maturity: one content-addressed decision selecting a minimal fixed
representation successor or a terminal representation falsifier

Required frozen inputs: R2 receipt
`7ce7b119143af8cc66c46b5a2a489e35d9ba11e374b3591a69c12aa255a637b4`;
unchanged binary64 mesh/state/parameters; unchanged ODE; point `x=1/128`;
rail `1/10^10`; factor-four selection margin; origin and tail rules

Required evidence: exact-rational endpoint second derivatives from the frozen
ODE; exact quintic Hermite jet/residual; fixed 128/256/512 DCT-I projections;
exact coefficient-word residuals; reconstruction/join screens; deterministic
lowest-mode selection; immutable receipt; no solve or retune

Stop/fail criteria: any R2 drift; candidate solve; modified state words;
result-derived mode; changed point/rail/physics; nonfinite codec; omitted failed
ordinal; output collision; authority promotion

Explicit non-goals: another MPFR solve; changing center bytes; accepting proof;
tail-mode repair; later proof duties; candidate, lamp, physical, propulsion, or
transport authority

Downstream gate unlocked: one minimal versioned quintic/mode-count proof-center
codec, or a higher-precision representation review if no fixed ordinal passes

Change class: finite representation diagnosis; no authority

## Frozen center interpolation

At each mesh endpoint derive the second derivatives from the unchanged ODE:

```text
uSecond = 2*(V-nu)*u - 2*uPrime/x
VSecond = u^2 - 2*VPrime/x
```

On the unique interval containing `x=1/128`, construct the exact degree-5
Hermite polynomial matching value, first derivative, and derived second
derivative at both endpoints. Evaluate its exact Schrödinger residual with the
unchanged normalization. This is a representation diagnosis over immutable
words, not a new solve.

## Frozen projection ladder

Project the same quintic profile with DCT-I mode counts exactly
`[128,256,512]`, in order. Every ordinal runs. Coefficients remain binary64 and
the exact residual evaluator consumes their exact dyadic words. Origin and tail
extensions remain unchanged.

An ordinal is eligible only if:

```text
exact quintic center residual <= 1/4 * 10^-10
exact projected residual <= 1/4 * 10^-10
node reconstruction <= 2^-40
join reconstruction <= 2^-28
endpoint reconstruction <= 2^-40
```

Select the lowest eligible mode count. If the quintic center itself fails,
return `QUINTIC_CENTER_REPRESENTATION_FAILED`. If it passes but no projection
ordinal passes, return `BINARY64_PROJECTION_PRECISION_SUCCESSOR_REQUIRED`.
Otherwise return `QUINTIC_MODE_SUCCESSOR_SELECTED` with the lowest eligible
mode count. No result may add, remove, or reorder an ordinal.
