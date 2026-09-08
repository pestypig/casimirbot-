# Axial elastic companion kernel: spin-zero charge response

Exploratory derivation. Previous goal turn made progress by tying the elastic companion to a two-state mass/current rotation. This packet derives its recoil kernel for a conserved spin-zero target current. Frozen apparatus and inelastic benchmark inputs are unchanged.

Define CA as the physical diagonal axial vertex coefficient times the target nucleon coupling and propagator, not a Majorana Lagrangian coefficient before identical-field factors. For a spin-zero target of charge Q and elastic form factor F, the amplitude is CA Q F [ubar(pprime) gamma_mu gamma5 u(p)](k+kprime)^mu. A one-half initial dark-spin average is included. There is no target spin average factor.

The trace contraction gives |M|^2/(CA^2 Q^2 F^2)=4(pprime dot J)(p dot J)-2 J^2(pprime dot p+mchi^2), J=k+kprime. In the elastic center-of-mass frame this reduces exactly to 8 pCM^2 s (1+cos(theta)). Dividing by 64 pi s pCM^2 gives d sigma/d qCM^2=CA^2 Q^2 F^2 [1-qCM^2/(4pCM^2)]/(4 pi). In the nonrelativistic target calculation, pCM=mu v and qCM agrees with the spatial momentum transfer to retained order:

`d sigma/d q^2 = CA(q)^2 Q^2 F(q)^2/(4 pi v^2) * vperp^2`,
`vperp^2 = v^2-q^2/(4 mu^2)`, with `0 <= q <= 2 mu v`.

For constant CA and F=1, sigma=CA^2 Q^2 mu^2 v^2/(2 pi). Compared with an elastic vector-vector contact of coefficient Cb, the total ratio is (CA/Cb)^2 v^2/2. This is not a ratio to the exothermic rate. The endpoint suppression is essential; a constant multiple of the prior inelastic kernel is incorrect.

The [niDM paper, section 5](https://arxiv.org/html/2405.08081v2#S5) identifies the axial-dark/vector-SM interaction and its nonrelativistic velocity/momentum responses. Its spinful nucleon coefficients and electromagnetic charge assignments are not substituted for a spin-zero baryonic target. The trace and normalization above are independently calculated here.

For the specified same-sign pilot a=gap/4, CA/Cb=a/sqrt((m+gap/2)^2-a^2). At 40 GeV CA=1.94854e-14 GeV^-2 and at 100 GeV CA=4.21156e-15 GeV^-2, using the archived transition contact normalization. At v=1e-3 the corresponding contact total ratios to equal-Cb elastic vector scattering are 1.97757e-17 and 9.49784e-19. These small contact ratios do not settle a light-mediator collective response.

For an isotropically orientation-averaged separation d, the conditional rigid-target coherence exponent to calculate next is

`D = hold * (rho_el/mchi) * integral dv f(v) v * integral_0^(4 mu^2 v^2) dq^2 (d sigma/dq^2) [1-sinc(q d)]`,

with c, hbar and area conversions restored consistently. A uniform sphere has F(q)=3[sin(qR)-qR cos(qR)]/(qR)^3 and Q fixed by its mass and charge model. The angular average must be identified explicitly; a directional halo and fixed branch orientation need a directional kernel. Ground and excited elastic channels use their consistent population fractions, whose sum cannot exceed the shared density. A light mediator requires renormalizing the same transition coupling against xenon; the archived contact Cb cannot simply be held fixed while varying mediator mass.

Limitations: rigid spin-zero elastic response only. Carbon-13 spin/magnetic response, internal solid excitations, dark Higgs and loop interactions, real-vector decays, Born validity and population evolution remain separate. The mass asymmetry is a pilot model input rather than an apparatus fit. No physical model admission or local predicted residual is claimed yet.

Reproduce with `python docs/research/casimir-dp-axial-elastic-kernel-2026-09-07.py`. Eighteen explicit gamma-matrix traces agree with the invariant expression to 5.93e-10 relative or better; an independent angular quadrature reproduces the contact total. Frozen input SHA is checked. Research root-leaf validation is separate from these physics checks. No runtime/GR/certificate changes.
