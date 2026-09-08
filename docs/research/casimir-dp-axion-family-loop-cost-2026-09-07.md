# Scalar and heavy-gluon cost of the fixed-gu family

Exploratory snapshot, September 7, 2026. Extends the independently evolved messenger-coupling family without altering the reference model or apparatus. These are selected loop terms, not completed scattering amplitudes or an exclusion.

## Calculation

The [script](casimir-dp-axion-family-loop-cost-2026-09-07.py) authenticates the coupling-scan JSON and the archived potential/gluon derivations. With zero SM up Yukawa, define t=M^2+yL^2 v^2/2. At subtraction scale mu=M, the messenger contribution to the potential curvature is

`delta mA^2 = 3 yR^2 M^2 [1-ln(t/M^2)]/(4 pi^2)`.

For the heavy-eigenstate gluon terms, the convention is

`L = (alpha_s/pi) G^2 [Kaa a^2 + Kh h]`,

`Kaa = yR^2 M^2/(24 t^2)`, `Kh = yL^2 v/(24 t)`.

At every scanned point, high-precision differentiation of the two-eigenvalue Coleman-Weinberg potential independently checks the curvature; differentiation of the heavy eigenmass logarithm checks Kaa. Relative discrepancies are below 2e-16. The light eigenstate is retained in the potential and is not integrated out as a heavy state in the gluon coefficient.

## Results

| yL | Conditional kaon epsilon magnitude | Potential curvature (GeV²) | Kaa / reference | Kh / reference |
|---|---|---|---|---|
| 0.05 | 5.65675e-5 | 49.7863 | 16.0045 | 0.06252 |
| 0.10 | 2.26235e-4 | 12.4466 | 4.00091 | 0.25006 |
| 0.15 | 5.08899e-4 | 5.53181 | 1.77801 | 0.56257 |
| 0.20 | 9.04386e-4 | 3.11164 | 1 | 1 |

[JSON](casimir-dp-axion-family-loop-cost-2026-09-07.json) retains full precision and provenance. The near-constant product of the kaon magnitude and curvature reflects their opposing approximate yL² and 1/yL² dependencies in this family; it is not a universal model relation.

## Consequence for the two experiments

Preserving the leading gu does not preserve all loop contributions. At yL=0.10, the aa-gluon term increases about fourfold while the Higgs-gluon term falls to one quarter. Their previously established insertions have opposing potential signs, so scaling an entire xenon or carbon rate by either coefficient ratio would be invalid. Amplitudes and interference must be recomputed with both terms and the remaining scalar completion before interpreting any rate change.

The curvature is a scheme-specific zero-momentum potential contribution, not a pole-mass shift. Comparing it with the reference ma²=1 GeV² does not create a naturalness exclusion. An independent renormalized mass/counterterm is required to specify how the 1 GeV physical mediator is maintained along the family. Changing that choice changes the propagator and therefore both target predictions.

Next propagate the two selected gluon insertions through the common xenon/local response, with the mediator pole mass explicitly held as a conditional input and omitted matching terms retained as limitations. This will quantify the selected response change without claiming the full UV model is viable. Goal remains active.

Validation: independent potential and logarithmic-derivative checks pass. Root-leaf documentation validation is separate; no GR, certificate or runtime changes.
