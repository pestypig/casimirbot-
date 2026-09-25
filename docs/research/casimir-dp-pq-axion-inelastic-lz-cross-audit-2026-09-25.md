# Cross-audit: PQ axion plus inelastic electroweak dark matter for LZ

Date: September 25, 2026. Literature compatibility note; not a validation of the LZ candidate or of a shared boson-star model.

## Why this paper matters to our goal

Visinelli's revised paper, arXiv:2609.02807v3 (September 18), is a concrete two-component construction: a QCD axion supplies the missing dark-matter abundance, while a subdominant pseudo-Dirac electroweak doublet can produce an endothermic xenon recoil through its off-diagonal weak neutral current. The PQ sector also generates the doublet's small Majorana splitting. It is therefore a useful external comparator for our multicomponent bookkeeping and for keeping abundance generation distinct from detector scattering.

The revision must be tracked by version. The current v3 gives kinematic reference points at `M_D = 297.0, 396.4, 549.7 GeV`, `delta_chi = 304–343 keV`, and thermal local fractions `xi_chi = 0.073–0.250`, each normalized to about one event. These are not spectral best fits: the spectra peak below the candidate's reconstructed recoil energy and are not folded through the LZ energy response or full S1–S2 likelihood. More decisively, v3 reports that the entire displayed standard-thermal one-event branch is excluded by the adopted IceCube solar `W+W-` limit under its assumptions. A prior arXiv version or an abstract describing only the one-event rate is not the current constraint picture.

## What transfers to the repository, and what does not

The paper's PQ scale is `v_S = 4.4e11 GeV` and, in its stated KSVZ normalization, the physical axion decay constant is `f_a = v_S`. The standard QCD-axion mass relation gives `m_a ≈ 5.7 micro-eV * (1e12 GeV/f_a) ≈ 1.30e-5 eV`. That is approximately `1.3e12` times the repository's `1e-17 eV` free complex-scalar star benchmark. A free-field Kaup-mass rescaling would give about `6.5e-6 solar masses`, but that number is only a scale comparison: QCD-axion self-interactions and the formation/stability branch differ, so it is not a solved QCD axion-star mass.

Thus the paper does not identify the QCD axion that fills its abundance with our ultralight boson-star field. Its scattering state is a fermionic electroweak doublet, not the boson-star condensate; the QCD axion's role is cosmological abundance, not the xenon collision. The paper contains no Casimir-DP coherence observable or gravitational-residual mechanism. It supplies a valid *two-component architecture comparator*, not the requested single shared mechanism.

For indirect searches, its halo annihilation flux scales as `xi_chi^2`, which is about `0.0053–0.063` across the quoted fractions relative to a full-density component at fixed annihilation microphysics. Solar capture is different: once capture-annihilation equilibrium is reached its neutrino signal scales linearly with the local fraction. This explains why reducing the WIMP abundance can suppress gamma-ray intensity yet still fail the paper's solar-neutrino constraint. Our gamma-ray likelihood work must not substitute for the solar capture gate.

## Consequence for the active prediction model

Keep three fields/roles explicit in any candidate continuation:

1. the repository's ultralight complex scalar, whose charge, self-interactions, formation history, and star solution remain under study;
2. a QCD axion, if a PQ completion is used to provide part of the cosmic abundance (mass scale set by the PQ scale and anomaly normalization);
3. the heavy inelastic scattering component, with its own density fraction, halo phase-space distribution, nuclear response, and direct/solar/indirect constraints.

Do not identify component 1 with component 2 without replacing the mass, potential, abundance evolution, and stellar calculation and demonstrating a stable solution. Do not treat the one-event normalization as independent of the same local fraction used by IceCube or gamma-ray predictions.

## Best next work

Use arXiv:2609.02807v3 as a regression target for a small independent consistency notebook: reproduce the QCD axion mass from `f_a`, the WIMP thermal fraction, the `xi` and `xi^2` scaling, and the published IceCube exclusion assumptions. Then compare that benchmark against our existing heavy-IDM halo-fold implementation and record where our TNG50 2000-03-09 velocity epoch and LZ's 2023 event epoch prevent a valid event-specific comparison. Only after that should we test an alternate heavy-sector model or nonstandard cosmology; changing the halo fraction alone cannot preserve both the LZ normalization and the solar constraint.

This is a diagnostic lead, not an endorsement of the model or an update to NHM2 boson-star status. The LZ event remains a single candidate with 2.6 sigma global background-only tension, not a dark-matter discovery.

Sources: [Visinelli, arXiv:2609.02807v3](https://arxiv.org/html/2609.02807); [Di Luzio et al., QCD axion mass relation](https://doi.org/10.1140/epjc/s10052-019-6683-x); [LZ Collaboration, arXiv:2609.02823](https://arxiv.org/abs/2609.02823); [LZ HEPData release](https://doi.org/10.17182/hepdata.182472.v1).
