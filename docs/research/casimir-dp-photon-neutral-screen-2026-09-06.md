# Photon-mediated dipole: neutral-target soft-charge screen

September 6, 2026. Exploratory channel calculation; no experimental admission. The preceding halo packet made progress by testing the contact-spin shared prediction over a common speed distribution. This packet opens the physically distinct photon-mediated magnetic-dipole lead.

## Interaction and distinction

For a Dirac spin-half particle with magnetic moment mu_chi, [Barger, Keung and Marfatia, equation 4](https://arxiv.org/pdf/1007.4345) give both charge and magnetic nuclear terms. The charge contribution is

\[
\frac{d\sigma}{dE_R}=\frac{\alpha\mu_\chi^2Z^2}{E_R}
\left(1-\frac{E_R}{2m_Av^2}-\frac{E_R}{m_\chi v^2}\right)|G_E(q)|^2.
\]

Its soft limit has d sigma/d(q²) proportional to 1/q². This differs from the previously audited contact L10 interaction: the photon propagator and electromagnetic target currents must be retained. The cited formula does not license using bare nuclear charge for a neutral macroscopic object at arbitrarily small q.

## Explicit static target approximation

Assume each carbon atom has a pointlike nuclear charge and a spherical Gaussian electron distribution of rms radius a, with normalized form factor f_e(q)=exp[-q²a²/(6 hbar²)]. This is an analytic assumption, not a measured diamond electron density. Neutrality gives the single-atom charge amplitude Z[1-f_e(q)], rather than Z alone.

For uniformly distributed atom centers in a sphere, the rigid charge amplitude in this approximation is N_atoms Z[1-f_e(q)] F_sphere(qR/hbar). Its low-q charge factor vanishes as q²a²/(6 hbar²), so its squared amplitude adds four powers of q relative to the unscreened expression. This cancellation follows directly from the assumed neutral charge distribution. Bonding, polarization and a nonzero surface charge require a different target response.

Let x=qR/hbar. For isotropic incident directions, a constant branch separation d, and the leading soft dipole-charge term, the partial coherence integral is

\[
I(X,a)=\int_0^X\frac{2dx}{x}F_{sphere}(x)^2
\left[1-e^{-x^2a^2/(6R^2)}\right]^2
\left[1-\operatorname{sinc}(xd/R)\right].
\]

Then D_soft=flux times hold times alpha mu_chi² (hbar*c)² N_atoms² Z² I, with compatible units. Only this soft charge channel is calculated. The recoil corrections in the source cross section are neglected in this leading soft limit; a complete rate must restore kinematics and specify the incident mass and speeds.

## Numerical result

Using the frozen R=276.302 nm and d=250 nm, X=80 corresponds to q=57.134 eV/c. Ratios below compare the neutral integral to the same integral with the electron cancellation removed:

| Assumed electron rms radius | Neutral / bare soft-charge coherence integral, qR/hbar<=80 |
|---|---:|
| 0.05 nm | 2.117e-15 |
| 0.10 nm | 3.388e-14 |
| 0.15 nm | 1.715e-13 |

Thus treating the sphere as bare nuclei overstates this partial soft-charge contribution by about 13–15 orders of magnitude in these examples. The radius sweep is illustrative, not an experimental uncertainty interval.

**The cutoff is a channel definition, not a kinematic cutoff or an all-q upper bound.** The screened integral continues to grow between X=10 and X=80 even though the bare integral has nearly saturated. Consequently we must not infer that the screened full rate is negligible by extrapolating this partial ratio. At larger q, atomic and crystal structure, independent scattering and electronic excitations need explicit treatment. A hard xenon recoil also probes a different momentum range; applying this soft screening factor to its nucleus would be incorrect.

## Next leads within this interaction

The next substantive possibilities are the magnetic response, inelastic electronic response and non-neutral surface response. They must share mu_chi with the xenon prediction but cannot inherit the bare-charge sphere kernel. Any proposed surface-charge contribution also requires an actual charge-state input and ordinary electromagnetic background controls. None of these inputs authorize changing the frozen apparatus or claiming a gravitational mechanism.

Replay: `python docs/research/casimir-dp-photon-neutral-screen-2026-09-06.py`. Five checks pass: neutrality, the quadratic low-q amplitude, quartic radius scaling, suppression and monotonic partial integration. JSON preserves nine radius/cutoff cases and the frozen-config hash. Atlas build/why/upstream trace succeeded before additions; root-leaf documentation validation passed. Research-only changes; no runtime, adapter, constraint or certificate modification. S1 and the user goal remain active.
