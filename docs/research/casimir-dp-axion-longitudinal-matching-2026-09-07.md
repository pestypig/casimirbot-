Program gate: S1 — common-kernel matching.
Workstream: Axion-portal alternative.
Capability or component: Nucleon coefficients and approximate C13 longitudinal response.
Current maturity: Conditional analytic and numerical diagnostic.
Target maturity: Independently normalized common target kernel.
Required frozen inputs: Canonical apparatus unchanged; versioned primary sources.
Required evidence: Current conventions, spin traces, independent oscillator integration.
Stop/fail criteria: No missing C13 table treated as zero; no transverse response substitution.
Explicit non-goals: Joint rate admission, experimental fit, exact nuclear structure or loop clearance.
Downstream gate unlocked: Xe longitudinal-response normalization and common-halo integration; S1 remains open.

# Axion matching: what can be carried between targets

## Primary-source convention

[Bishara et al., 1707.06998v2](https://arxiv.org/html/1707.06998v2), equations 25 and 107–111, define the pseudoscalar form factor for a quark density multiplied by its quark mass. The portal instead couples to the density without that mass. Thus gbar_u = F_P^u/m_u, not F_P^u and not the induced axial form factor F_P'. At leading one-body order both pion and eta poles contribute. Non-pole constants and higher-order corrections are separate inputs. The source supplies axial isovector and octet combinations used below; its quark-mass convention must accompany any absolute matching.

Using Q as positive spatial momentum, isospin symmetry and a common nucleon mass, the resulting LO coefficients are

    gbar_u^(p,n)(Q) = mN B0 [ +/- gA/(mpi^2+Q^2)
                                  + Delta8/(3(meta^2+Q^2)) ].
    d4^(p,n)(Q) = gchi gu gbar_u^(p,n)(Q)/(ma^2+Q^2).

Here gA=1.2723, Delta8=0.583; the diagnostic uses neutral mpi=0.13498 GeV, meta=0.547862 GeV and mN=0.939 GeV. B0=2.7 and 3.0 GeV are explicitly selected sensitivity inputs, not an authenticated uncertainty interval. B0 and gu must ultimately refer to the same quark renormalization convention. No non-pole constants are fitted to force agreement.

At Q=246 MeV, B0=2.7 yields (gbar_p,gbar_n)=(42.33,-39.60); B0=3.0 gives (47.04,-44.00). This reproduces the scale and opposite signs of the representative matching in the [axion proposal](https://arxiv.org/html/2609.04186v1), but not its exact parameter provenance. At Q=0 the first pair becomes (178.68,-175.40). Freezing the high-Q coefficients down to local momenta is therefore incorrect, although the finite low-Q coefficients do not remove O6's explicit momentum suppression.

## Independent C13 approximation

Treat C13 as a closed C12 core plus one neutron in a harmonic-oscillator p1/2 orbital. This is a deliberately approximate nuclear model, not an empirical response table. Set the momentum along z and y=(Qb/(2 hbar c))^2. Projecting the neutron spin into the nuclear J=1/2 subspace gives

    P [Sn_z exp(iQz/hbar c)] P = kL(Q) Jz,
    kL(Q) = -(1+2y) exp(-y)/3.

For the M=+1/2 spinor, the spin-up p_z orbital has probability 1/3 and the spin-down p_(+1) orbital probability 2/3. Their spatial matrix elements are respectively (1-2y)exp(-y) and exp(-y). Their difference gives kL; axial symmetry makes the longitudinal off-diagonal elements zero. The adjacent script checks this with independent Cartesian Gaussian quadrature at five momenta and three oscillator lengths, with maximum absolute error 1.67e-16.

The earlier transverse factor is kT=-(1-2y)exp(-y)/3. Its zero at y=1/2 is absent in kL. Reusing it for O6 would manufacture an artificial carbon response zero. Both reduce to -1/3 at Q=0; the squared response is then 1/9 of a free neutron's at the same Q and coefficient. Oscillator lengths 1.4–2.0 fm are a sensitivity family, not a quantified nuclear-model confidence band. Center-of-mass oscillator corrections, core polarization and two-body currents remain outside this approximation.

For unpolarized, independent nuclear spins, amplitudes from different nuclei have vanishing spin cross terms. Thus this channel sums C13 responses proportional to their number, without a sphere-wide N-squared scalar enhancement. This statement assumes the initial independent unpolarized spin state; it does not cover deliberately correlated spin preparations. C12's leading elastic one-body spin channel is zero, not its entire response to the full model.

## Absolute free-particle normalization anchor

With relativistic interaction d4 (chi-bar i gamma5 chi)(N-bar i gamma5 N), the reduced nonrelativistic potential is

    V = -d4 (Schi dot Q)(SN dot Q)/(mchi mN).
    spin-average |V|^2 = d4^2 Q^4/(16 mchi^2 mN^2).
    d sigma/dQ^2 = spin-average |V|^2/(4 pi v^2).

Natural units and standard relativistic external-state normalization are used. An explicit two-spin matrix trace verifies the second line for two momentum directions. For the elastic C13 approximation, replace the neutron spin by kL J; the spin average acquires kL squared, while the carbon reduced mass sets the recoil kinematics. The denominator mN belongs to the nucleon-current reduction and must not be replaced by the carbon mass. This is an anchor for checking nuclear-response conventions, not yet an integrated local decoherence result.

## Scalar companion: independently checked, still an extra parameter

The axion model also permits radial-mode/Higgs mixing. At small mixing, including both exchanged mass eigenstates gives

    C_SI = gchi (fN mN/v) sin(theta) cos(theta)
                         * (1/mh^2 - 1/mrho^2)
           approximately lambda_PhiH mchi fN mN/(mh^2 mrho^2).

The cancellation of f and the heavy-light mass difference follows from gchi=mchi/f and theta approximately lambda_PhiH f v/(mrho^2-mh^2). With lambda=0.1, mchi=400 GeV, mrho=1 TeV, mh=125 GeV and fN=0.3, the resulting nucleon cross section is 5.657e-47 cm^2, consistent with the source's order estimate. This reproduces a tree coefficient, not an experimental exclusion curve. The quartic is not fixed by the pseudoscalar event normalization. A joint model must declare it and include its scalar contribution in both targets; it cannot be adjusted only in the local experiment. Loop-induced scalar terms remain uncomputed, so choosing this quartic zero does not establish a complete scalar null.

## Status and replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-longitudinal-matching-2026-09-07.py`. Five checks pass; adjacent JSON retains the numerical inputs and outputs. These checks establish the stated approximations and normalization anchor, not LZ likelihood validity or a detectable local signal. Next: authenticate Xe longitudinal-response normalization against this anchor, integrate both targets with one halo and coefficient set, and expose the scalar quartic and loop uncertainty separately. The pending apparatus hold/confinement input is not assumed. The overall prediction-model goal remains active.
