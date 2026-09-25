# B−L carbon-open splitting versus the LZ xenon spectrum

Date: September 25, 2026. This is a selected true-energy spectrum screen. It does not reproduce the LZ event-level likelihood and does not constitute a statistical exclusion.

## Question

The B−L split-scalar proposal uses an endothermic `S + Xe -> P + Xe` transition. A physical splitting small enough to open `S + C-12 -> P + C-12` is the kinematic prerequisite for the proposed independent-carbon Casimir-DP bridge. Does that same parameter region retain a xenon spectrum compatible with the high-energy event?

## Calculation and result

The [script](casimir-dp-bminusl-carbon-open-xenon-spectrum-2026-09-25.py) calculates the contact spin-independent spectrum `dR/dE ∝ F_Helm²(E) η(v_min)` for Xe-131, using the inelastic `v_min` and a shifted truncated Maxwellian (`v0=220`, `vEarth=232`, `vesc=544 km/s`). It multiplies the true-energy spectrum by LZ's final WS ROI signal-efficiency curve, digitized from the official vector [Fig. S2](casimir-dp-lz-figS2-efficiency-source-2026-09-25.svg); the source file's SHA-256 is pinned in the script and JSON. Cross-section normalization cancels in the ratio.

The physical gap needed to open carbon within this SHM's speed support is 37.0–37.2 keV over the 1–5 TeV mass grid (`vesc + vEarth = 776 km/s`). This is lower than the prior 39.2–39.5 keV ceiling computed with a separate 798 km/s cap; that value remains an outer kinematic bound, not populated support in the selected halo distribution.

Across the carbon-open scan, the **selection-efficiency-folded true-energy** weight in 14–200 keV is **1.7×10³–2.5×10³ times** the weight in 225–270 keV. At the threshold edge, the ratio is 1.7×10³–2.2×10³. If the model normalization were set to one selected signal event in the 225–270 keV true-energy proxy band, it would predict order 10³ selected events in 14–200 keV. The large ratio remains after applying LZ's energy-dependent selection efficiency; it comes mainly from the inelastic SI/Helm spectrum and halo integral, not from using an average as a constant. The digitized curve has a 95.5% mean efficiency over 14–250 keV, consistent with LZ's stated 96%. The paper's underlying HEPData tables were not accessible in this environment, but Fig. S2 provides the plotted final signal efficiency directly.

LZ reports one NR-band event in a 2.84 tonne-year exposure, with 2.6σ global significance, in an analysis window of 5.4–270 keV. Its published local-significance table for the closest isoscalar inelastic SI operator `O1^s` gives 0.8σ at 100 keV splitting, 2.7σ at 200 keV, and 3.0σ at 300 keV for a 1 TeV mass. These larger gaps all close carbon upscattering. This independently indicates the same tradeoff, although the LZ fit is not a fit of the B−L model itself.

## Limits and disposition

The plotted efficiency is acceptance versus **true** recoil energy. This fold does not model recoil-energy resolution, migration into a reconstructed-energy band, the joint `{S1c, log10(S2c)}` signal density, or backgrounds. The 225–270 keV comparison band is only a broad proxy around the observed event at `248 ± 23(stat) ± 23(sys) keV`, not a reconstructed-energy fit.

This is a strong **shape-level conflict for the carbon-open contact SI branch**, not a statistical rejection. It is stronger than the prior response-free comparison because the official plotted NR selection efficiency is applied. The Helm approximation, SHM parameters, and B−L paper's `sqrt(mP²−mS²)` versus physical `mP−mS` ambiguity remain limitations. The next useful LZ step is a reconstructed-observable fold using NEST 2.4.5 plus analysis settings, or the released likelihood/templates if accessible. In parallel, test the B−L cross-section normalization against LZ's published `O1^s` limits and significance grid. Do not tune carbon-open couplings to the candidate before that check. Current evidence points to a physical tradeoff: high-splitting models better match LZ's high-energy preference, but close the proposed tree-level carbon bridge.

Reproduction: `python docs/research/casimir-dp-bminusl-carbon-open-xenon-spectrum-2026-09-25.py`. The script verifies the source SVG hash, parses the final WS ROI efficiency polyline, checks halo-tail behavior and carbon-open/closed classification under both 798 km/s and this SHM's 776 km/s support, and validates folded ratios. The JSON records all masses, splittings, assumptions, and limitations.

Sources: [LZ extended-window paper, arXiv:2609.02823](https://arxiv.org/html/2609.02823v1); [B−L split-scalar preprint, arXiv:2609.06909](https://arxiv.org/html/2609.06909v1).
