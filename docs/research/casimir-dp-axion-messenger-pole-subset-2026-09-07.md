Program gate: S1 — axion matching prerequisites.
Workstream: Finite neutral messenger input counterterms.
Capability or component: Pole/mixing/tadpole subtraction and spacelike propagator insertion.
Current maturity: Leading neutral two-point subset.
Target maturity: Evaluated contribution in the declared scalar input scheme.
Required frozen inputs: Scalar reference, messenger parameters and canonical apparatus.
Required evidence: Loop integral check, six subtraction conditions and inverse-propagator derivative.
Stop/fail criteria: Do not treat a subset as the full messenger correction or use potential curvature as a pole mass.
Explicit non-goals: Full broken-vacuum calculation, electroweak input conversion, Yukawa matching or total-rate update.
Downstream gate unlocked: One explicit counterterm contribution is available for full matching.

# Evaluating the neutral messenger pole contribution

This packet implements the [scalar input prescription](casimir-dp-axion-scalar-input-scheme-2026-09-07.md) for the leading neutral heavy-light two-point and tadpole subset. It uses the authenticated [field-threshold integral](casimir-dp-axion-field-threshold-2026-09-07.md), retaining full external momentum dependence below the messenger threshold. The role of pole, tadpole and field matching is discussed generally by [Braathen, Goodsell and Slavich](https://link.springer.com/article/10.1140/epjc/s10052-019-7093-9); the calculations here are our model-specific subset.

## Scope and conventions

Keep terms of leading order yL^2 or yR^2 in the symmetric-background heavy-light loop, with yu=0, MU=mu=2 TeV. The neutral loop couples directly to h and A; it has no direct radial coupling at this order. Rotate the h contribution using the prescribed tree scalar mixing. The Higgs-background tadpole follows from the leading quadratic potential term: T_h/v=dmH2=-PiH(0), with T_s=0.

For this isolated contribution take delta v=delta f=0. This excludes, rather than computes, the messenger contribution to the GF/electroweak input conversion. Higher powers of the electroweak background, other particle loops, fermion and vertex corrections are also excluded. No claim is made that all omitted terms are smaller than every small counterterm listed below.

Use inverse propagator p^2-Mtree^2+Pi_loop-delta M^2. All quantities below are finite after MS-bar subtraction. Independent MS-bar coupling counterterms have no finite piece; field residues are not set to unity by a separate finite redefinition.

## Six counterterms

Let R=[[c,-s],[s,c]], pstar^2=(mh^2+mr^2)/2, and P(p^2)=PiH(p^2). In the tree mass basis the required finite mass counterterm matrix is

```
Kmass = [[c^2 P(mh^2), cs P(pstar^2)],
         [cs P(pstar^2), s^2 P(mr^2)]]
K = transpose(R) Kmass R.
```

The interaction-basis potential counterterms follow from the two tadpoles and four mass/mixing conditions:

```
delta lambdaH = [Khh-P(0)]/(2 v^2)
delta muHS = Khs/v
delta muH2 = delta lambdaH v^2 + f delta muHS - P(0)
delta mS2 = Kss
delta t = -f Kss - v^2 delta muHS/2
delta mA2 = PiA(ma^2).
```

The finite neutral-subset values are:

| Counterterm | Value |
|---|---:|
| delta lambdaH | 4.91157534e-5 |
| delta muHS | 0.00182667481 GeV |
| delta muH2 | 6082.78518 GeV^2 |
| delta mS2 | 0.000165450875 GeV^2 |
| delta t | -55.4100779 GeV^3 |
| delta mA2 | -3.11258657 GeV^2 |

These preserve the selected input conditions to this perturbative order. They are not observable mass shifts. In particular, a nonzero dependent muHS counterterm is allowed even though its reference tree value is zero. The radial matrix entry can receive a counterterm through the mixed pole prescription without a direct radial messenger loop.

## Why the zero-momentum approximation is insufficient here

At mu=MU and z=p^2/MU^2, the finite scalar integral has the independent closed form

`B0(p^2;MU^2,0) = 2 + (1-z) log(1-z)/z`,

with limit B0(0)=1. Direct quadrature agrees with this form. Comparing the full momentum increment P(p^2)-P(0) with p^2 P'(0):

| p^2 (GeV^2) | Full increment (GeV^2) | Fraction of increment missed by linear term |
|---:|---:|---:|
| 15625 | 5.95226361 | 0.260% |
| 507812.5 | 209.822055 | 8.04% |
| 1000000 | 447.691692 | 15.13% |

The percentages concern this loop's momentum-dependent increment, not the full mass, full self-energy or scattering rate. They justify retaining the complete momentum function for the heavy pole in this subset.

## Contribution at spacelike momentum

Define Sren(p^2)=diag(P(p^2),0)-K and G0(Q)=[Mtree^2+Q^2 I]^-1. The first-order corrected Euclidean propagator is

`G(Q) = G0(Q) + G0(Q) Sren(-Q^2) G0(Q)`.

With the tree interaction-basis vertices held fixed, the relative scalar exchange correction is `(G0 Sren G0)_hs/(G0)_hs`. It is -1.73839208e-4 at Q=0 and -1.73839205e-4 at Q=0.246 GeV, approximately -0.01738% in amplitude. The pseudoscalar propagator-only correction `[PiA(-Q^2)-PiA(ma^2)]/(Q^2+ma^2)` is approximately -1.945367e-7 over this interval.

These are signed amplitude contributions, not event-rate corrections or an uncertainty band. The same functions would enter both target calculations. They must be combined with consistently matched vertices, input conversions and other contributions before updating totals. Do not add the previous field-normalization correction separately to this propagator insertion: its momentum dependence is already present in Pi. A consistent change of field convention would instead transform vertices and propagators together.

## Checks and remaining work

The [script](casimir-dp-axion-messenger-pole-subset-2026-09-07.py) authenticates both its integral source and input-scheme JSON and executes only the archived definitions. The [output](casimir-dp-axion-messenger-pole-subset-2026-09-07.json) passes three checks: the closed integral against quadrature, all six renormalization conditions, and the first-order propagator insertion against a symmetric derivative of the exact matrix inverse. The inverse test checks the perturbative term; it is not a resummed prediction.

The next missing pieces include broken-background corrections and the neutral messenger's corresponding vertex/fermion matching, together with the excluded electroweak input conversion. This packet evaluates a defined contribution; it does not close the entire scalar or messenger sector. Existing joint forecasts are unchanged and the goal remains active.
