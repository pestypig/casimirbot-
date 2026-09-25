# B−L common-parameter xenon/carbon closure screen

Date: September 25, 2026. This is a reproducible coupling-and-kinematics comparison, not a B−L-specific LZ likelihood fit.

## Shared parameters

The B−L preprint gives an off-diagonal derivative interaction, the contact SI cross section in Eq. 15, a resonant branch `mZ' ≈ 2 mS`, and a representative `gBL ≈ 0.5`. Using those same values, `sigma_n = mu_n² gBL⁴/(16 pi mZ'⁴)` gives `9.51e-46 cm²` at `mS=2.3 TeV, mZ'=4.6 TeV`; solving Eq. 15 for `sigma_n=1e-45 cm²` gives `mS=2.271 TeV`. The calculation and mass sweep are in the [script](casimir-dp-bminusl-common-parameter-closure-2026-09-25.py) and [JSON](casimir-dp-bminusl-common-parameter-closure-2026-09-25.json).

For the selected SHM (`v0=220`, `vEarth=232`, `vesc=544 km/s`), the maximum lab-frame support is 776 km/s. At this multi-TeV mass, endothermic C-12 upscattering requires a physical gap below about 37.3 keV; gaps of 100–300 keV, used in the B−L paper's interpretation, close carbon. The separate 798 km/s cap used in prior design screens would give a ceiling around 39.4 keV, but it is not the maximum of this selected SHM distribution.

## LZ comparison

The LZ result supplies local-significance scans for the closest comparator, isoscalar inelastic SI `O1^s`, at 1 and 4 TeV. At both masses, the local significance is 0 at the tabulated 0 and 50 keV splittings; it rises to 2.7 at 200 keV and 3.0 at 300 keV. The carbon-open region ends below 37.3 keV, so the tabulated points that favor the high-energy event are all carbon-closed. Do not interpolate the significance curve or call these values a B−L-specific fit.

This comparison is consistent with the preceding efficiency-folded spectrum screen: under the contact SI/Helm approximation, a carbon-open splitting produces much more selected low-energy xenon weight than weight near the candidate event. Together, the results make the independent-carbon/tree-level B−L bridge a poor route to a *shared* LZ-plus-Casimir-DP signal. They do not rule out the B−L dark-matter model as an explanation for xenon alone, nor do they constrain a different collective solid response.

## Limits and next gate

The preprint's mass/splitting notation is still ambiguous: it writes `sqrt(mP²−mS²)=O(100 keV)`, while the physical gap needed for recoil kinematics is `mP−mS`. The scan assumes `mZ'=2mS`, `gBL=0.5`, and treats Eq. 15 as the per-nucleon SI normalization. LZ's `O1^s` result is only the closest published comparator; there is no direct profile likelihood for this B−L model in the material inspected. The HEPData numeric tables remain unavailable behind the access challenge, though paper tables and vector figures are public.

Next, use the published 90% coupling interval for `O1^s` as a digitized cross-check at 1 TeV and the exact tabulated significance grid at 4 TeV; preserve the model-specific cross-section normalization and do not infer a 2.3 TeV interval from either endpoint. An exact recast needs the numeric `O01s` table or likelihood templates. The present result is already sufficient to rank the shared-channel pursuit: high-splitting xenon-compatible kinematics conflict with the small splitting needed for independent-carbon upscatter. Any attempt to retain both observables now needs a different operator or a derived collective material response, plus the same-parameter lifetime/population accounting.

Reproduction: `python docs/research/casimir-dp-bminusl-common-parameter-closure-2026-09-25.py`.

Sources: [B−L model preprint, Eqs. 14–15](https://arxiv.org/html/2609.06909v1); [LZ paper, Table S8 and inelastic-SI interpretation](https://arxiv.org/html/2609.02823v1).
