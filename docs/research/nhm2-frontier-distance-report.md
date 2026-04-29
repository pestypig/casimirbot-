# NHM2 Frontier Distance From 0p995

- status: generator-backed report with explicit methodology
- source generator: `scripts/research/run-nhm2-lapse-alpha-sweep.ts`
- frontier ledger: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-frontier-distance-latest.json`
- anchor profile: `stage1_centerline_alpha_0p995_v1`

## Claim Boundary
The `stage1_centerline_alpha_0p995_v1` profile remains the confirmed full-pass anchor unless a newer full-loop artifact proves otherwise.

Lower-alpha rows are expected clocking targets until their own NHM2 full-loop artifacts pass.

The current strategy is to revalidate outward from `0p995`, locate the lowest full-pass alpha, then bisect toward `0p7000`.

## Research Context
- ADM / 3+1 lapse-shift formalism provides formalism context only: https://arxiv.org/abs/gr-qc/0405109 and https://arxiv.org/abs/gr-qc/0703035.
- Alcubierre and Natario provide warp metric context only: https://arxiv.org/abs/gr-qc/0009013 and https://arxiv.org/abs/gr-qc/0110086.
- Quantum inequality and energy-condition papers provide limitation and uncertainty language only: https://arxiv.org/abs/gr-qc/9702026 and https://arxiv.org/abs/2105.03079.
- NHM2 repository artifacts are required for project-specific pass, validated, frontier, and full-loop claims.

## Research Anchor Map
| Source | What it supports here | What it does not support |
|---|---|---|
| ADM, `The Dynamics of General Relativity` | 3+1 split context: spatial slices, lapse-like clock separation, shift-like coordinate transport bookkeeping. | It does not validate any NHM2 alpha row. |
| Gourgoulhon, `3+1 Formalism and Bases of Numerical Relativity` | Modern numerical-relativity language for lapse, shift, foliation, and evolution bookkeeping. | It does not prove the CasimirBot metric or gates. |
| Alcubierre, `The warp drive: hyper-fast travel within general relativity` | Historical warp-metric context and why warp claims require GR-style metric accounting. | It does not validate bounded-lapse NHM2 profiles. |
| Natario, `Warp Drive With Zero Expansion` | Comparison context for warp geometries that avoid a naive expansion framing. | It does not validate NHM2 transport or lapse decomposition. |
| Pfenning and Ford, `The unphysical nature of Warp Drive` | Constraint and uncertainty language around warp-drive stress-energy limitations. | It does not decide the project-specific full-loop audit. |
| Santiago, Schuster, Visser, `Generic warp drives violate the null energy condition` | Limitation language for generic warp-drive energy-condition concerns. | It does not invalidate or validate a specific NHM2 artifact by itself. |

## Methodology Summary
The report uses the research anchors for formalism and caution, then uses the repository full-pass anchor for the actual numbers.

The method is:

1. Start from 3+1-style bookkeeping.
2. Treat the NHM2 centerline as a bounded-lapse clocking profile.
3. Freeze the coordinate mission time.
4. Freeze the shift / transport schedule.
5. Vary only `centerlineAlpha = centerlineDtauDt = alpha`.
6. Compute the expected target with `tau_expected(alpha) = alpha * coordinateTimeS`.
7. Keep that result as `expected_not_validated` until full-loop artifacts pass.

## Step 1: 3+1 Bookkeeping
In 3+1 language, the metric bookkeeping separates coordinate evolution into a lapse-like clocking part and a shift-like spatial transport part.

For NHM2 sweep reporting, the practical bookkeeping is:

```text
coordinate mission clock: t
onboard proper clock: tau
centerline lapse clock ratio: d_tau/dt = alpha
shift / transport schedule: fixed
```

This is why the sweep changes `alpha`, not a local SR velocity parameter.

The report does not use:

```text
beta = sqrt(1 - alpha^2)
gamma = 1 / sqrt(1 - beta^2)
```

That would turn the lapse sweep back into a velocity sweep, which is not the NHM2 experimental question.

## Step 2: Centerline Proper-Time Integral
The general clocking relation used by the report is:

```text
d_tau = alpha(t) dt
```

Integrate over the coordinate mission:

```text
tau = integral alpha(t) dt
```

For the flat centerline target used in this sweep:

```text
alpha(t) = alpha_constant
```

So:

```text
tau_expected(alpha)
  = integral alpha_constant dt
  = alpha_constant * integral dt
  = alpha * coordinateTimeS
```

This produces the expected target. It is not a pass claim.

## Step 3: Confirm the 0p995 Anchor Coherence
Confirmed anchor values:

```text
profileId = stage1_centerline_alpha_0p995_v1
alpha_anchor = 0.995
coordinateTimeS = 137755965.9171795
properTimeS_artifact = 137067186.0875936
properMinusCoordinateS_artifact = -688779.8295859098
```

Expected proper time from the method:

```text
properTimeS_expected
  = alpha_anchor * coordinateTimeS
  = 0.995 * 137755965.9171795
  = 137067186.0875936 s
```

Expected proper-minus-coordinate:

```text
properMinusCoordinateS_expected
  = properTimeS_expected - coordinateTimeS
  = 137067186.0875936 - 137755965.9171795
  = -688779.8295859098 s
```

Equivalent direct form:

```text
properMinusCoordinateS_expected
  = (alpha_anchor - 1) * coordinateTimeS
  = (0.995 - 1) * 137755965.9171795
  = -688779.8295859098 s
```

Anchor result:

```text
properTimeS_artifact ~= properTimeS_expected
properMinusCoordinateS_artifact ~= properMinusCoordinateS_expected
```

So the `0p995` artifact is coherent with the report's clocking target law.

## Step 4: Derived Target Equations
For any target alpha:

```text
T = coordinateTimeS
alpha = centerlineAlpha = centerlineDtauDt
```

Expected proper time:

```text
properTimeS_expected = alpha * T
```

Expected proper-minus-coordinate:

```text
properMinusCoordinateS_expected = (alpha - 1) * T
```

Expected saved time:

```text
savedTimeS_expected = T - properTimeS_expected
savedTimeS_expected = (1 - alpha) * T
```

Expected saved days:

```text
savedDays_expected = savedTimeS_expected / 86400
```

Expected subjective efficiency:

```text
subjectiveEfficiency_expected = coordinateTimeS / properTimeS_expected
subjectiveEfficiency_expected = T / (alpha * T)
subjectiveEfficiency_expected = 1 / alpha
```

Saved-time multiple versus the `0p995` anchor:

```text
savedTimeMultipleVs0p995
  = ((1 - alpha) * T) / ((1 - 0.995) * T)
  = (1 - alpha) / 0.005
```

## Step 5: Worked Solve for 0p7000
The current frontier target is:

```text
profileId = stage1_centerline_alpha_0p7000_v1
alpha = 0.7000
T = 137755965.9171795 s
```

Expected proper time:

```text
properTimeS_expected
  = 0.7000 * 137755965.9171795
  = 96429176.1420256 s
```

Expected proper-minus-coordinate:

```text
properMinusCoordinateS_expected
  = (0.7000 - 1) * 137755965.9171795
  = -41326789.7751539 s
```

Expected saved days:

```text
savedDays_expected
  = 41326789.7751539 / 86400
  = 478.319326 days
```

Expected subjective efficiency:

```text
subjectiveEfficiency_expected
  = 1 / 0.7000
  = 1.428571429x
```

Saved-time multiple versus `0p995`:

```text
savedTimeMultipleVs0p995
  = (1 - 0.7000) / 0.005
  = 60x
```

Interpretation:

```text
0p7000 is a strong expected clocking target.
It remains runtime-blocked unless selected transport and full-loop audit complete.
```

## Step 6: Worked Solve for 0p5000
The deep exploratory target is:

```text
profileId = stage1_centerline_alpha_0p5000_v1
alpha = 0.5000
T = 137755965.9171795 s
```

Expected proper time:

```text
properTimeS_expected
  = 0.5000 * 137755965.9171795
  = 68877982.9585898 s
```

Expected proper-minus-coordinate:

```text
properMinusCoordinateS_expected
  = (0.5000 - 1) * 137755965.9171795
  = -68877982.9585898 s
```

Expected saved days:

```text
savedDays_expected
  = 68877982.9585898 / 86400
  = 797.198877 days
```

Expected subjective efficiency:

```text
subjectiveEfficiency_expected
  = 1 / 0.5000
  = 2.000000000x
```

Saved-time multiple versus `0p995`:

```text
savedTimeMultipleVs0p995
  = (1 - 0.5000) / 0.005
  = 100x
```

Interpretation:

```text
0p5000 is the clean 2x subjective-efficiency target.
It is not a validated NHM2 result unless every intermediate and full-loop gate passes.
```

## Expected Target Table
| profileTag | alpha | expectedProperTimeS | expectedSavedDays | expectedSubjectiveEfficiency | savedTimeMultipleVs0p995 |
|---|---:|---:|---:|---:|---:|
| 0p995 | 0.995 | 137067186.087594 | 7.971989 | 1.005025126 | 1.000 |
| 0p9800 | 0.980 | 135000846.598836 | 31.887955 | 1.020408163 | 4.000 |
| 0p9500 | 0.950 | 130868167.621321 | 79.719888 | 1.052631579 | 10.000 |
| 0p9000 | 0.900 | 123980369.325462 | 159.439775 | 1.111111111 | 20.000 |
| 0p8500 | 0.850 | 117092571.029603 | 239.159663 | 1.176470588 | 30.000 |
| 0p8000 | 0.800 | 110204772.733744 | 318.879551 | 1.250000000 | 40.000 |
| 0p7500 | 0.750 | 103316974.437885 | 398.599438 | 1.333333333 | 50.000 |
| 0p7300 | 0.730 | 100561855.119541 | 430.487393 | 1.369863014 | 54.000 |
| 0p7250 | 0.725 | 99873075.289955 | 438.459382 | 1.379310345 | 55.000 |
| 0p7200 | 0.720 | 99184295.460369 | 446.431371 | 1.388888889 | 56.000 |
| 0p7150 | 0.715 | 98495515.630783 | 454.403360 | 1.398601399 | 57.000 |
| 0p7100 | 0.710 | 97806735.801197 | 462.375349 | 1.408450704 | 58.000 |
| 0p7050 | 0.705 | 97117955.971612 | 470.347337 | 1.418439716 | 59.000 |
| 0p7000 | 0.700 | 96429176.142026 | 478.319326 | 1.428571429 | 60.000 |
| 0p6500 | 0.650 | 89541377.846167 | 558.039214 | 1.538461538 | 70.000 |
| 0p6000 | 0.600 | 82653579.550308 | 637.759101 | 1.666666667 | 80.000 |
| 0p5500 | 0.550 | 75765781.254449 | 717.478989 | 1.818181818 | 90.000 |
| 0p5000 | 0.500 | 68877982.958590 | 797.198877 | 2.000000000 | 100.000 |

## Ladder Groups
- `confirmed_revalidation_ladder`: `0p995 -> 0p7300`
- `frontier_bisection_ladder`: `0p7250 -> 0p7000`
- `deep_exploratory_ladder`: `0p6500 -> 0p5000`

## Pass/Fail Methodology
The expected target table answers only:

```text
If this profile preserves the same coordinate mission and a flat centerline d_tau/dt = alpha, what should the onboard clock read?
```

The full NHM2 pass/fail path asks:

```text
Did selected transport complete?
Did the full-loop audit artifact write?
Is the artifact fresh?
Does properTimeS / coordinateTimeS match alpha?
Does properMinusCoordinateS match (alpha - 1) * coordinateTimeS?
Does shift-vs-lapse decomposition close?
Does lapseTrackedFraction stay near 1?
Does betaOverAlphaMax remain tiny?
Does wallHorizonMargin remain passing?
Do stress, curvature, invariant, citation, and promotion gates pass?
```

Only if those checks pass can a row move from:

```text
clockingTargetState = expected_not_validated
```

to:

```text
clockingTargetState = expected_and_validated
validationState = evidence_viable
```

## Interpretation
- A row with `validationState=evidence_viable` has earned repository-measured evidence under the current full-loop gates.
- A row with `validationState=runtime_blocked` has not reached the evidence question yet.
- A row with `validationState=planned` or `skipped_after_blocker` remains an expected target only.
- Literature references constrain wording and uncertainty; they do not validate an NHM2 profile.

