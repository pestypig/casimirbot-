# Dark-photon LZ, gamma, boson-star and Casimir-DP audit

Date: September 25, 2026. This is a reproducible scale and kinematics audit of the recent explicit dark-photon model; it is not a reproduction of the authors' signal or likelihood fits.

## Why this paper advances the candidate screen

Yamashita's model is the clearest current bridge between **two** of the target observations: a 420 GeV vector dark-matter particle `X` annihilates to `W+W-` with a velocity-dependent Sommerfeld enhancement, and a nearly degenerate vector partner `V` gives an endothermic `X + nucleus -> V + nucleus` channel. The paper reports freeze-out, halo and dwarf rates of `1.9e-26`, `2.7e-24` and `6.5e-26 cm³/s`; it normalizes the xenon spectrum to about one event in the 225–271 keV region. This makes it a strong **LZ-plus-Galactic-continuum comparator**, not a dark-matter detection or a completed four-observable model.

The supplied Totani analysis instead reports a 0.5–0.8 TeV `b b̄` fit with `(5–8)e-25 cm³/s`. The new paper's 420 GeV, `W+W-` benchmark is a different mass, final state and velocity-dependent rate; its halo rate is 3.4–5.4 times the quoted Totani `b b̄` rate. Those rates cannot be compared as a fit without folding the channel yields, halo profile and velocity dependence through the same gamma likelihood. The dark-photon paper does not explain the separate 43.2 GeV cluster-line claim.

## Recomputed kinematic and structure checks

Using the paper's own `v_esc = 544 km/s`, `v_Earth = 220 km/s`, `mX = 420 GeV` and `delta = 316 keV` gives a maximum lab speed of `764 km/s`. For Xe-136, the inelastic threshold is `763.95 km/s`, and the corresponding maximum accessible gap is `316.04 keV`: the benchmark sits essentially at the xenon kinematic endpoint. For C-12, the same transition needs `2284 km/s`, about three times the paper's speed support; the maximum C-12 gap is only `35.36 keV`. The specified ground-state upscatter is therefore closed on the carbon target relevant to the interferometer's material channel.

The partner `V` does not survive to the present: the paper gives `tauV ≈ 3 microseconds` for `V -> X gamma`. This removes its possible present-day exothermic downscatter population. The direct-detection mediator `phi'` is arranged to couple `X` off-diagonally and mix with the Higgs; the paper explicitly says an additional discrete symmetry is still needed to forbid dangerous diagonal terms and leaves that construction for future work. Under the model as specified, there is no demonstrated elastic or carbon-open mechanism to produce a measurable Casimir-DP response.

The particle content also does not supply the repository's `1e-17 eV` boson-star field: `X` is 420 GeV and both light mediators are 400 MeV. As a **counterfactual scale check only**, the free complex-Proca result `Mmax ≈ 1.058 MPlanck²/mX` gives about `6.7e8 kg` (`3.37e-22 Msun`), roughly `1.2e28` below the illustrative Sgr A* boson-star mass. The formula assumes a complex, charge-carrying Proca field; the paper's parity-stabilized dark photon does not itself specify that boson-star completion. A real-field soliton, strong self-interaction or added ultralight component needs a separate model and solve.

## Compatibility decision

Promote this paper to the **leading LZ-plus-gamma particle comparator**, ahead of the IDM branch for those two observables because it supplies one explicit mass and an explicit velocity-dependent annihilation mechanism. Do not promote it to the four-observable bosonic prediction branch: (1) it has no Sgr A*-scale star solution; (2) its specified carbon transition is kinematically closed and `V` is absent today; (3) the necessary discrete symmetry is not constructed; and (4) its gamma and LZ claims have not been independently fit with public likelihoods. To preserve the four-observable goal, the next model must either embed `X` in a demonstrated ultralight-star sector or add a distinct cold star-forming component, and must derive a carbon/material response without reopening the excluded diagonal xenon channel.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-dark-photon-four-channel-audit-2026-09-25.py`; the adjacent [JSON](casimir-dp-yamashita-dark-photon-four-channel-audit-2026-09-25.json) records the inputs, derived speed thresholds, conditional Proca scaling and validity limits.

Sources: [Yamashita, dark-photon LZ plus Galactic gamma model](https://arxiv.org/html/2609.02868v2); [Totani, Galactic halo continuum analysis](https://arxiv.org/html/2507.07209); [Proca-star free-field mass scale](https://arxiv.org/abs/1508.05395); [repository's four-observable branch verdict](casimir-dp-four-observable-branch-verdict-2026-09-25.md).
