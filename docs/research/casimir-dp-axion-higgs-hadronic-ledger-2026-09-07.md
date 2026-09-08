# Gluon bookkeeping and one-body hadronic sensitivity

Exploratory research, September 7, 2026. This narrows what remains missing in the [assembled model](casimir-dp-axion-assembled-subsets-2026-09-07.md); it does not complete renormalization or promote the model.

## Included versus missing

The Higgs-like factor f_N=0.3 in the tree and triangle packets represents the **total** scalar nucleon coupling. At leading order, writing S as the light-flavor scalar sum gives f_N=S+(2/9)(1-S). The second term already represents the three heavy-quark flavors through gluons. The illustrative LO decomposition of 0.3 is S=0.1 and heavy contribution 0.2; this is algebraic bookkeeping, not an extraction of measured sigma terms. Adding that heavy term again would spuriously multiply the purely Higgs-like scalar rate by 2.7778.

The up-quark pseudoscalar box is separate. Its nonuniversal quark coefficient and genuinely additional hard-gluon matching must be computed with explicit operator conventions and subtraction of contributions reproduced by the effective theory. Neither the full Higgs f_N factor nor the heavy-quark low-energy theorem can be used to turn a light-up-quark box into its missing gluon coefficient. See [Hill and Solon's operator matching framework](https://arxiv.org/html/1409.8290).

| Contribution | Present convention | Remaining task |
|---|---|---|
| Tree radial/Higgs exchange | Total Higgs-like f_N | Refined hadronic input and finite-Q nuclear response |
| Higgs-like scalar triangles | Same total f_N | Parameter/field renormalization and other diagrams |
| Up-only scalar/twist box | Separate sigma terms and prescribed-scale PDFs | Justified matching, additional hard gluons, finite Q |
| Nuclear two-body scalar currents | Absent from independent-nucleus calculation | Target-specific response; no automatic shared effective shift |

## Published input sensitivity

[Hoferichter et al., equation 9](https://arxiv.org/html/1708.02245v2) gives the one-body value 0.307(18), including perturbative heavy-quark corrections. Their combined 0.308(18) additionally includes nuclear two-body effects; it is not substituted here. These are explicitly 2017 inputs, not a claim to the latest global determination.

Our scan uses the one-body central value and endpoints, retaining the old 0.3 baseline. It rescales the tree and Higgs-like triangle amplitudes together while holding the separate box sigma terms and PDFs fixed. It retains amplitude interference and the shared proton/neutron coefficients for both targets. Because the hadronic inputs can be correlated, this isolated sensitivity scan is **not a joint confidence interval**. No apparatus input or microscopic coupling is retuned.

| One-body f_N | Raw full-window xenon events | Independent-free-nucleus local exponent upper estimate |
|---|---:|---:|
| 0.289 | 1.31891 | 2.02403e-29 |
| 0.300, archived baseline | 1.37450 | 2.17972e-29 |
| 0.307 | 1.41096 | 2.28183e-29 |
| 0.325 | 1.50857 | 2.55520e-29 |

Counts use 2.84 tonne-years and true recoil energies 5.4–269.9 keV before detector folding. The central high-window expectation is 0.0373141 for 200–269.9 keV. All rows inherit the prescribed box scale, contact approximation and incomplete-loop limitations. The local estimate is not a bound on all solid-state channels and does not imply a boundary contrast. Its enormous separation from the frozen DP comparator persists.

The [script](casimir-dp-axion-higgs-hadronic-ledger-2026-09-07.py) authenticates and loads parent definitions without rerunning archived outputs. Its [JSON](casimir-dp-axion-higgs-hadronic-ledger-2026-09-07.json) records four passing checks: LO decomposition, heavy-flavor counting, baseline recovery and monotone sensitivity. Root/leaf documentation validation passes. Next matching work must calculate only the genuinely additional gluon terms and preserve this ledger.
