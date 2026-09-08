# Broader four-quark matching on the evolved candidate

Exploratory snapshot, September 7, 2026. Previous turn showed that the evolved tensor is not fully in the tested family and directly evaluated its explicit-mt remainder. This packet evaluates the complete qq1/qq3 finite VddLL expression on the full tensors, including terms without explicit mt. It changes no physical input or model-admission status.

## Result

Replacing the selected qq finite terms with the broader library qq expression changes the partial imaginary kaon coefficient from **2.73772303756e-15** to **2.71679818396e-15 GeV^-2**, a **-0.764316%** shift.

| Finite imaginary matching contribution, GeV^-2 | Selected | Broader expression |
|---|---:|---:|
| qq1 | -2.369961407e-20 | -6.645536775e-18 |
| qq3 | -7.093872613e-19 | -1.501240370e-17 |
| Sum | -7.330868754e-19 | -2.165794048e-17 |

The difference is -2.09248536033e-17 GeV^-2. This supersedes using the earlier probe-specific remainder as a proxy for the full candidate qq response. It does not supersede the physical limitations of the overall calculation or establish a new flavor bound.

## Inputs and calculation

The full evolved qq tensors use the preceding restricted boundary, quartic-current insertion and top-self/QCD trajectory. Rotate all doublet indices to the up basis, evaluate the library VddLL expression, subtract the zero-coefficient result, rotate the four external indices back, and convert H=-L. The library loop mass is configured to 162.6 GeV through the already audited in-memory change; no installed code is modified.

Matching inputs are MW=80.379 GeV, GF=1/(sqrt(2) 246.2^2)=1.16656489969e-5 GeV^-2, alpha_s=0.108 and the library parameter value alpha_e=0.00781860828772. The last is an explicit diagnostic input, not a newly extracted coupling or a completed electroweak scheme conversion. The loop Higgs mass remains the library's 125 GeV value. Merely configuring the top mass does not perform a pole-to-running conversion.

The broader expression comes from the authenticated library implementing [Dekens–Stoffer matching](https://arxiv.org/abs/1908.05295). The selected comparator follows [Endo, Kitahara and Ueda](https://arxiv.org/pdf/1811.04961) and the archived tensor prescription. Current and qu finite terms are still the selected expressions, while the tree coefficient is counted once. The difference replaces qq finite matching; it is not added on top of the same contribution twice.

## Checks

The [script](casimir-dp-axion-full-qq-matching-2026-09-07.py) authenticates the trajectory and matching-definition chains. The [JSON](casimir-dp-axion-full-qq-matching-2026-09-07.json) records inputs, complex operator responses and all checks. Because the isolated qq response is linear, it is evaluated with numerical amplification factors 1e4 and 1e5 and divided back afterward to reduce SM-subtraction cancellation. The largest relative difference is below 4.5e-11. Individual qq responses sum to the combined result, and the previous selected total is reproduced before replacement. All checks and the separate root-leaf documentation check pass.

## Remaining limits and next work

This is broader **finite qq matching**, not complete electroweak evolution or a full kaon observable. The SM trajectory still imposes other couplings zero, and the UV boundary omits terms required for a complete matching calculation. The extracted formula includes finite conventions that must be carried consistently into the low-energy treatment. No total uncertainty can be inferred from this isolated shift.

Next extend the running with explicit electroweak/Higgs inputs and compare the resulting matching-scale dependence, keeping this broader qq expression and its input ledger fixed. Then reconcile full UV and low-energy matching before updating the joint parameter screen. Xenon and local-coherence predictions remain unchanged; the shared-model goal stays active.
