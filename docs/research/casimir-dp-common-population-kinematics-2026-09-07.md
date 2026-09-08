# Same-population elastic kinematic screen

Program gate: S1. Derived kinematic diagnostic; not a population-integrated exclusion.

The previous common-beam covariance calculation used a 1 TeV constituent. Here the bound is generalized to any particle mass and speed that can produce a representative 248 keV elastic recoil on xenon of mass 122 GeV. This is a conditional recoil scale, not a claim that LZ measured dark matter or that its reconstructed energy has zero uncertainty.

Elastic scattering requires q_Xe <= 2 mu_Xe v, with q_Xe=sqrt(2 m_Xe E_R)=0.245992 GeV. The frozen sphere is much heavier than xenon, so mu_sphere >= mu_Xe for every positive incident particle mass. Hence k_sphere=mu_sphere v >= q_Xe/2 for such incident particles.

For conditionally independent azimuths under the common-beam assumptions of the preceding packet, the pair covariance divided by the single-kick second moment is <q_soft^2>/(4 k_sphere^2). Consequently it cannot exceed <q_soft^2>/q_Xe^2. This is deliberately conservative and independent of the incident mass for this Xe-capable speed subset.

At q=hbar/(250 nm), the ratio is at most 1.02956e-17. For any momentum distribution confined to the earlier qR<=80 soft interval, it is at most 5.39439e-14. With 10,000 actual hits per burst, the fractional total-impulse second-moment enhancements are at most 1.02946e-13 and 5.39385e-10 respectively. These are not exact finite-separation contrast bounds. The small-phase approximation and isotropic beam averaging are needed to connect second moments to a quadratic coherence exponent.

Using the declared halo maximum speed 794.2 km/s additionally gives an elastic incident-mass threshold of 74.9517 GeV at this recoil and representative isotope mass. This threshold changes with the recoil energy, isotope and speed assumptions; it is not an experimentally inferred dark-matter mass.

## Decision and limits

Changing the incident mass cannot rescue shared-direction alignment for the same-speed elastic population capable of this hard recoil. Common direction remains distinct from correlated impact parameters or correlated transverse transfers. No actual number of sphere hits is supplied by this argument.

The bound does not apply indiscriminately to the entire velocity distribution: slower members of the same species can be incapable of the xenon recoil while contributing locally. Nor does it apply to energy-releasing inelastic reactions, different source populations, large-angle hard kicks, coherent force profiles or subsequent changes in target motion. Any such proposal must specify its population fractions and dynamics rather than transferring the elastic inequality to it.

Next priority: pursue a concrete interaction with an independently calculated low-speed or inelastic component if this statistical route is revisited. Do not continue optimizing mass within the now-screened hard-recoil-capable beam subset. The broader prediction-model goal remains open.

Validation: configuration hash, recoil-threshold recovery and the reduced-mass inequality across five masses passed in the accompanying script. These are kinematic checks, not detector-response or empirical-sensitivity validation.
