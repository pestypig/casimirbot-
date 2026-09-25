# B-L split-scalar LZ, carbon and boson-star screen

Date: September 24, 2026. This is a model-specific kinematic and free-field scale screen, not an LZ likelihood reconstruction or full model validation.

## Candidate

Okada and Seto's [gauged U(1)B-L scalar model](https://arxiv.org/html/2609.06909v1) is a concrete bosonic LZ candidate. Its complex scalar `phi_1=(S+iP)/sqrt(2)` splits into real states, with the off-diagonal derivative current `g_BL Z'_mu[(partial^mu S)P-S(partial^mu P)]`. The preprint reports a thermal-relic branch with multi-TeV `S`, `m_S approximately m_Z'/2`, `g_BL about 0.5`, and an inelastic nucleon cross section of order `1e-45 cm^2`. The LZ process is endothermic `S+N -> P+N`.

## Xenon and carbon kinematics

The accompanying [script](casimir-dp-bminusl-scalar-lz-carbon-screen-2026-09-24.py) and [JSON](casimir-dp-bminusl-scalar-lz-carbon-screen-2026-09-24.json) use a 1–5 TeV diagnostic mass grid and 100, 200 and 300 keV *physical gap* examples, interpreting the paper's stated order-100-keV scale as `m_P-m_S`. This convention is consequential: the 2026 paper writes `sqrt(m_P^2-m_S^2)=O(100 keV)`, while its older source uses `m_P-m_S`. See the [notation audit](casimir-dp-bminusl-splitting-notation-audit-2026-09-25.md) for the literal alternative, which gives sub-eV physical gaps and reopens endothermic carbon kinematics. The screen uses a 798 km/s speed cap and Xe-131 at the candidate's 248 keV recoil.

For endothermic scattering, the largest splitting that carbon-12 can absorb from an incident halo particle is `delta_C,max = 0.5 * mu_SC * v_max^2`. It is 39.2–39.5 keV over this mass grid. The same calculation allows the 248 keV xenon recoil for splittings up to 377–401 keV. So the paper's order-100-keV region can reach xenon while the light-state upscatter is closed on independent carbon. At splittings of 100, 200 and 300 keV, the minimum Xe speeds for that recoil are 431–461, 553–583 and 675–705 km/s; the carbon thresholds are 1,270–1,275, 1,795–1,803 and 2,199–2,209 km/s.

The fate of the heavier state `P` is a separate issue. If it survives in today's halo, `P+C -> S+C` is exothermic and carbon is kinematically open. The script therefore also calculates an intentionally generous ceiling with all local dark matter in `P`, `sigma_p*f_P=1e-45 cm^2`, carbon form factor squared set to one, maximum incident speed and decoherence no greater than two per collision:

| `m_S` | Release scan | Carbon recoil peak | Maximum `D` per frozen hold | Fraction of registered 1σ precision |
|---:|---:|---:|---:|---:|
| 1 TeV | 100–300 keV | 99–297 keV | `3.72e-27` | `6.40e-25` |
| 2 TeV | 100–300 keV | 99–298 keV | `1.88e-27` | `3.23e-25` |
| 3 TeV | 100–300 keV | 100–299 keV | `1.26e-27` | `2.16e-25` |
| 5 TeV | 100–300 keV | 100–299 keV | `7.56e-28` | `1.30e-25` |

The upper value in each row uses the 300 keV release, which maximizes the outgoing carbon recoil peak. Collision frequency uses the incident halo flux at the 798 km/s cap; the outgoing speed sets recoil kinematics, not incident flux. Even the all-`P`, maximally distinguishing independent-carbon case stays more than 24 orders below the registered precision. Thus the tree-level independent-carbon bridge is too small whether the halo contains only `S` or even the full assumed population in `P`, conditional on transferring the paper's nucleon normalization. This does not bound collective solid excitations, loop or two-vertex elastic amplitudes, or direct scalar couplings to the apparatus.

The calculation authenticates the frozen Stage-4.2R configuration SHA-256 and reads its mass, radius and hold time from the source JSON. The carbon rate is an isolated-nucleus contact estimate; no material response function is inferred.

## Boson-star and multicomponent implications

For a minimally coupled free scalar, the Kaup maximum is `M_max=0.633*M_Pl^2/m_S`. The 1–5 TeV mass grid gives `3.4e7–1.7e8 kg`, roughly `1e-29` of the Sgr A* mass scale used in the separate ultralight-field work. The B-L preprint supplies no boson-star solution or formation history. Self-interactions can change the free-field mass limit, but a viable star would require its own potential, stability, perturbativity and formation calculations.

A distinct ultralight field is therefore still needed for the star-scale role. I screened the symmetry-allowed quartic `kappa*|phi|^2*|phi_1|^2` for a `1e-17 eV` field. Requiring the one-loop threshold `delta(m_phi^2) approximately kappa*m_S^2/(16*pi^2)` not to exceed the ultralight mass squared gives a no-cancellation diagnostic `kappa <= 1.6e-56` at 1 TeV, falling to `6.3e-58` at 5 TeV. With the indicative conversion scaling `sigma*v approximately kappa^2/(64*pi*m_S^2)`, the equilibrium conversion rate at `T=m_S/20` is at most `5.2e-109` times the Hubble rate in this grid. Exact state-counting changes the prefactor, not the scale conclusion. This is not a formal exclusion: a protecting symmetry, tuned counterterm or nonthermal gravitational production would change the model and must be specified.

The B-L preprint discusses thermal annihilation and coannihilation, but this screen does not fit the separate 43 GeV line, the 0.5–0.8 TeV continuum interpretation, or the Galactic Center source-population analysis. Those are distinct astrophysical likelihoods. No gamma-ray prediction is transferred to the B-L candidate.

## Disposition

Rank the B-L split scalar as a concrete sourced heavy bosonic LZ candidate. Its shared tree-level xenon-to-independent-carbon signal is below the registered Casimir-DP precision even under the generous excited-state ceiling. A multicomponent light-star/heavy-recoil architecture remains the only current route spanning those mass scales, but it is not an admitted model: its cold and heavy populations, portal stability, gamma spectra and any distinct material response still lack a common prediction. The calculations do not evaluate or modify the selected NHM2 star candidate or frozen interferometer configuration.

The B-L paper's LZ and thermal-relic results remain preprint claims. This screen independently checks only the stated two-body kinematics, a conditional independent-carbon rate ceiling, a free-field mass scale and a no-cancellation portal diagnostic. Sources: [B-L scalar LZ preprint, arXiv:2609.06909](https://arxiv.org/html/2609.06909v1), [boson-star free-field review, arXiv:1202.5809](https://arxiv.org/html/1202.5809v5).
