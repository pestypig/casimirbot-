# Four-quark discrepancy decomposition

Exploratory snapshot, September 7, 2026. Previous turn found agreement for current probes and disagreement for the broader qq matching. This packet narrows that disagreement without changing the candidate.

## Finding

At the common 173 GeV mass and scale, the selected qq1 mixed-probe result agrees with the library's terms containing explicit top-mass dependence. For qq3, that group retains a finite difference. The logarithmic scale slopes of both explicit-top groups agree with the selected expression.

| Imaginary coefficient, GeV^-2 | qq1 mixed | qq3 mixed |
|---|---:|---:|
| Full library | 3.570161134e-13 | 7.408781798e-13 |
| Library terms with explicit mt | -2.176164273e-15 | 3.816859022e-13 |
| Library terms without explicit mt | 3.591922776e-13 | 3.591922776e-13 |
| Selected expression | -2.176164273e-15 | 5.766400694e-14 |
| Explicit-mt group minus selected | 1.45e-27 | 3.240218953e-13 |

The selected and explicit-mt logarithmic slopes are approximately **1.919310332e-13 GeV^-2** for both probes. The other group contributes another **2.314036017e-13 GeV^-2** to the slope. Thus the singlet comparison is reconciled at this algebraic level. The triplet difference is a finite remainder in this local scale test, not a failure of that tested logarithmic coefficient.

## Method and limits

The [script](casimir-dp-axion-qq-term-decomposition-2026-09-07.py) authenticates the previous comparison and library source. It partitions the additive VddLL expression into 1,215 terms containing the variable `mt` and 431 without it, preserving signs and original setup. Each group is evaluated with the same symmetric mixed up/top qq probe, followed by SM subtraction, external-index rotation and Hamiltonian sign conversion. Scale slopes use a centered difference in ln(mu) with step 0.001 and fixed masses/inputs.

The two groups reconstruct the full library coefficient to **3.2e-14 relative accuracy**. [JSON results](casimir-dp-axion-qq-term-decomposition-2026-09-07.json) preserve the values and reconstruction check. The physics root-leaf documentation check passes separately.

This is an **algebraic partition, not a gauge-invariant separation into diagrams or physical sectors**. Terms containing mt can include electroweak mass dependence beyond the selected top approximation, and algebraic rearrangement can move constants between groups. Agreement for qq1 does not certify arbitrary flavor tensors or a complete physical subset. The earlier alpha_s=0 check rules out QCD alone as the explanation; it does not resolve the remaining electroweak or finite-scheme contributions.

The two underlying calculations remain the selected matching of [Endo, Kitahara and Ueda](https://arxiv.org/pdf/1811.04961) and the general-flavor matching of [Dekens and Stoffer](https://arxiv.org/abs/1908.05295), as implemented in the authenticated library. This packet reports our decomposition of that implementation, not a new claim made by either source.

## Next action

Isolate the triplet finite remainder through its mass dependence and tensor contractions, and test whether it is outside the selected approximation or reflects a finite-convention/rotation error. Do not replace the candidate's qq correction with the probe remainder. The probe amplitude is algebraic, and the full calculation still needs consistent high-energy matching and observable conversion.

No joint xenon/coherence prediction or allowed parameter region changes. The shared-scattering goal remains active.
