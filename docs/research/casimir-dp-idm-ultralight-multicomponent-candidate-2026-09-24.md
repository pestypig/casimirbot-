# IDM plus ultralight boson-star field: minimal multicomponent candidate

Date: September 24, 2026. Exploratory model definition and failure screen for the shared dark-sector goal. This is not an implementation change to the selected NHM2 boson-star candidate, an LZ fit, a certified field solution, or an experiment-ready prediction.

## Candidate definition

Use two distinct bosonic fields because the scale screen already rules out using the same free-field constituent for both an Sgr A*-scale boson star and a xenon nuclear recoil:

- φ is a complex, ultralight scalar with benchmark mass `m_phi ~ 1e-17 eV` and repulsive self-coupling. Its purpose is to form gravitationally bound boson stars.
- `H_2` is the `Z_2`-odd inert electroweak doublet. Its lightest neutral real state `H` is stable; the nearly degenerate state `A` supplies endothermic `H + N -> A + N` scattering.

The renormalizable extension must include both Higgs-sector portals allowed by these symmetries:

\[
\mathcal L_\phi=|\partial_\mu\phi|^2-m_{\phi,0}^2|\phi|^2-\lambda_\phi|\phi|^4-\lambda_{\phi1}|\phi|^2H_1^\dagger H_1-\kappa|\phi|^2H_2^\dagger H_2.
\]

Retain the full inert-doublet potential from the [IDM benchmark paper](https://arxiv.org/abs/2609.06571), including its exact `Z_2`, neutral splitting, charged partner, and Higgs portal λL. Impose a separate global `U(1)_phi` symmetry, with φ carrying unit charge. Along the φ-H2 direction, boundedness requires λφ and λ2 positive and `kappa > -2 sqrt(lambda_phi lambda_2)` in this normalization; an analogous condition applies to λφ1 and λ1, together with the full inert-doublet copositivity conditions. Positive portal couplings avoid these mixed-direction lower-bound issues.

The Higgs portal `lambda_phi1` is also allowed; after electroweak symmetry breaking it shifts the ultralight mass by approximately `lambda_phi1*v^2/2`. For `m_phi = 1e-17 eV`, avoiding a cancellation against the bare mass requires `|lambda_phi1| <= 3.3e-57`. The IDM benchmark's charged and neutral masses plus λL imply `lambda3 ~ 0.584`. A one-loop naturalness estimate then gives a threshold correction `delta(m_phi^2) ~ kappa*m_H^2/(16*pi^2)`, suggesting `|kappa| <= 1.4e-56` if this correction is not canceled. Portal mixing can also feed `lambda_phi1` at a parametric scale `delta(lambda_phi1) ~ kappa*lambda3/(16*pi^2)`. These are no-cancellation diagnostics, not mathematical exclusions: exact coefficients depend on matching and renormalization, and a tuned counterterm or extra protecting symmetry changes the conclusion. However, a shift symmetry that protects the ultralight mass also has to be reconciled with the non-derivative portal needed for pair conversion.

The `kappa` portal gives a real interaction between the components: `H H <-> φ φ*` and analogous `A` and `H±` conversions. It can therefore change heavy-state freeze-out and the eventual φ abundance. It is not a free license to assign independent densities to the two fields. If κ is set to zero, the fields simply coexist and the proposal loses its dynamical population link. If ultralight-mass naturalness is required without cancellations, the indicated tiny portal is unlikely to establish significant thermal conversion; a symmetry-protected completion must be specified before selecting this as the population bridge.

There is also a phase-space mismatch: **thermal pair conversion does not make the cold φ condensate needed for boson stars.** For H-H conversion near a standard WIMP freeze-out temperature `T ~ m_H/20 = 54 GeV`, each ultralight daughter is born with momentum of order `m_H = 1080 GeV`. If it then free streams and the expansion is adiabatic, entropy conservation gives

\[
p_{\phi,0}=p_{\phi,*}\frac{T_{\gamma,0}}{T_*}\left(\frac{g_{*s,0}}{g_{*s,*}}\right)^{1/3}.
\]

Using `T_gamma,0 = 2.348e-4 eV`, `g_*s,0 = 3.91`, and the conservative high-temperature value `g_*s,* = 106.75`, the [reproducible screen](casimir-dp-idm-lz-bridge-screen-2026-09-24.py) gives `p_phi,0 ~ 1.56e-3 eV`, or about `1.6e14` times the `1e-17 eV` rest mass. These converted quanta remain highly relativistic today; they are not a cold halo or a boson-star seed. The estimate assumes free streaming after production. Later scattering, entropy injection, or nonstandard expansion changes it and must be modeled explicitly. A cold boson-star field therefore needs a separate low-momentum coherent production mechanism, such as an initial field displacement, whose amplitude/charge is another cosmological input. The portal can change the H relic abundance while producing dark radiation, but by itself it does not predict the cold-star fraction.

As a separate cold-field benchmark, I added a [homogeneous misalignment abundance screen](casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py) for a free quadratic component, using `3H(T_osc)=m_phi`. For `m_phi=1e-17 eV`, it starts oscillating near `T_osc=116 keV`; a canonical real-component displacement of `4.81e15 GeV` gives the full observed DM density in the harmonic homogeneous approximation. The required amplitude scales as `sqrt(f_phi)`: `4.81e14 GeV` for a 1% global component and `1.52e15 GeV` for 10%. If local fractions followed global fractions, these cases would scale the LZ heavy-particle rate by 0.99 or 0.90 respectively—but the published IDM abundance/profile must be recalculated, and halo clustering can make local fractions differ. This is only a mean-field abundance normalization. It does not show that perturbations form a boson star, and this real-component, zero-charge estimate does not specify the conserved U(1) charge required for a stationary complex boson star.

## The first quantitative obstruction: the abundance budget

The cited IDM LZ profile point reports `m_H = 1080 GeV`, δ = 369 keV, λL = −1.92×10−4, and ΩHh² = 0.12014; the same paper adopts ΩDMh² = 0.1198 ± 0.0012. Thus this benchmark already uses essentially the full standard-cosmology dark-matter abundance. A significant φ-star component requires a new coupled Boltzmann/reheating calculation that reduces the H abundance while retaining enough present-day unbound H to produce the LZ rate. At fixed halo velocities and cross section, reducing H's local density by a factor `f_H` reduces the xenon event expectation by `f_H`; the one-event profile point cannot be retained by assumption.

The free-field scaling screen gives `M_max ~ 8.46e6 M_sun` at `m_phi = 1e-17 eV`, but this is only an order-of-magnitude scale check. The cited EHT model's accretion image and the repository's selected star solution are not reproduced by that formula. Use the exact canonical boson-star gate before making a structural or imaging claim. A TeV H field instead has a free-field maximum star mass of order `1e8 kg`, so the two roles cannot be exchanged in the minimal free-field limit.

## What this minimal model can and cannot connect

| Observable | Minimal-model contribution | Missing evidence or immediate failure condition |
|---|---|---|
| Boson-star structure | φ's mass and self-coupling set a boson-star family. | Need a stable solution, formation history, conserved-charge budget, and mass function. A free-field scaling check is not a numerical solution. |
| LZ xenon recoil | H-to-A endothermic `Z` exchange; IDM paper's profile point is near the halo speed endpoint. | Full LZ response/likelihood is unavailable to the paper's authors; the local H density must be predicted after adding φ. |
| Casimir-DP | The same inelastic Z channel is closed on independent C-12 at halo support; the fixed Higgs-elastic channel gives `D <= 7e-19` under a deliberately generous contact/coherence ceiling. | A non-Higgs loop, collective excitation, or direct φ apparatus coupling would be a new computed channel, not part of the existing bridge. |
| Milky Way continuum | TeV H annihilation into electroweak final states could yield continuum photons. | Compute branching spectra, halo morphology, relic-dependent rate, and dwarf constraints. The reported 0.5–0.8 TeV b-bbar interpretation is not a fit to this model. |
| Cluster 43.2 GeV line | No narrow-line mechanism is specified. | For `m_H ~ 1 TeV`, the direct γγ line is at the DM mass scale, not 43.2 GeV; the minimal model needs an additional cascade state/channel to make that line. |

The 43.2 GeV cluster-line claim, the Milky Way diffuse continuum interpretation, and the Galactic Center source-population analysis are distinct data products, not a common annihilation likelihood. The φ field has no direct photon operator in this minimal renormalizable model. Adding one changes the candidate and introduces new stellar, cosmological, and laboratory constraints.

## Decision and next model gate

This two-field Lagrangian is the best **architecture** for testing the user's intended connection, because it assigns the star and detector roles to fields with compatible masses and supplies an explicit possible population-conversion vertex. It is not yet a defensible parameter point: κ, λφ, initial asymmetries, thermal history, and the present-day H/φ fractions are undetermined, and the current LZ profile abundance leaves almost no room for an additional standard φ component.

The next gate is one common cosmological calculation, not a joint signal fit: specify a protecting mechanism and renormalization condition for `m_phi`, choose a φ self-interaction admitted by a stable star solution, set portal couplings without tuning to individual observations, evolve H/A/H± and φ number/charge densities through freeze-out and any condensation era, and predict ΩH, Ωφ, and local unbound-H flux together. Reject parameter points that overproduce total dark matter, erase the needed LZ H population, destabilize the star, or violate IDM direct/indirect constraints. Only survivors should be passed into gamma spectra and xenon likelihoods. The Casimir-DP simple IDM channels already sit many orders below the design precision, so a useful interferometer prediction would need a separately justified φ, loop, or material-excitation response.

## Evidence links

- [IDM LZ interpretation, arXiv:2609.06571v1](https://arxiv.org/abs/2609.06571).
- [Boson-star free-field scaling review, arXiv:1202.5809v5](https://arxiv.org/abs/1202.5809).
- [Particle Data Group Big-Bang Cosmology review](https://pdg.lbl.gov/2023/reviews/rpp2022-rev-bbang-cosmology.pdf): entropy-conservation and relativistic-species redshift framework used in the momentum estimate.
- [Misalignment amplitude script and JSON](casimir-dp-ultralight-condensate-abundance-screen-2026-09-24.py).
- [Reproducible IDM threshold, elastic-ceiling, and quartic/naturalness screen](casimir-dp-idm-lz-bridge-screen-2026-09-24.py) with [JSON output](casimir-dp-idm-lz-bridge-screen-2026-09-24.json).
- [Bosonic compatibility and mass-scale screen](casimir-dp-bosonic-compatibility-screen-2026-09-24.md).
- [IDM xenon/carbon and Higgs-elastic screen](casimir-dp-idm-lz-bridge-audit-2026-09-24.md).
- [Frozen Stage-4.2R configuration](../../configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json).

Status: proposed multicomponent model skeleton; no portal value or population fraction selected, no coupled cosmological calculation, no stable new star solution, and no shared four-observable prediction. The overall goal remains active.
