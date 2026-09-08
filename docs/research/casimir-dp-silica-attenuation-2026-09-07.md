# Fixed-coupling silica attenuation diagnostic

Exploratory calculation, not actual site transport. This tests the 100 GeV dark matter, 10 MeV mediator and matched proton cross section already used for diamond and xenon. The previous turn progressed by linking capture supply and surviving flux.

Choose a 4e5 g/cm^2 column of Si-28/O-16 silica, using a 60-u formula-unit mass. This is an explicit diagnostic column, not an authenticated LZ or coherence-apparatus overburden. Assume stationary independent point nuclei and Born elastic scattering. Electrons, inelastic response, geological layering and changes in direction are omitted.

At incident speed 776 km/s, the integrated point-nucleus cross section is

`sigma_A = sigma_p(0) Z^2 (mu_A/mu_p)^2 / [1+4 mu_A^2 v^2/mmed^2]`.

The matched zero-momentum proton normalization is 3.00877e-35 cm^2. The resulting Si and O cross sections are 2.51538e-32 and 8.10534e-33 cm^2. Multiplying by column populations yields optical depth 0.000166069 and uncollided fraction exp(-tau)=0.999833945. The first-order mean fractional kinetic-energy loss is 4.09172e-6; it is not a slowing-down solution for repeatedly scattered particles.

The uncollided component alone remains at its incident speed, independent of how collided particles redistribute. At source density 0.003/cm^3 it gives 11238 raw high-window xenon events in the prior exposure model. Producing one raw high-window event at this fixed coupling/source would require surviving fraction 8.89675e-5. Even the deliberately aggressive approximation that every collision removes a particle from the fast component would need optical depth 9.32724, far above the calculated column value.

Therefore the fixed benchmark cannot assume strong shielding in this column model. This is not a full-material upper bound on scattering, a detector likelihood or a site-specific exclusion. It does not exclude a smaller source abundance or a different coupling; either changes the coupled capture and count problem. In particular, simply multiplying coupling by the optical-depth shortfall does not solve the xenon normalization, because the detection cross section also increases.

The companion script checks the analytic cross section against direct recoil-energy integration for both species and verifies the shared coefficient hash. Documentation validation does not validate transport assumptions.

Next: if testing stronger coupling, solve the coupled uncollided-count equation before attempting a full transport calculation, and assess detector optical depth and Born validity there. Do not assume high-coupling shielding automatically preserves a single-scatter xenon interpretation or enough local coherence signal. The raw low-energy spectral excess and omitted diamond response remain unresolved.
