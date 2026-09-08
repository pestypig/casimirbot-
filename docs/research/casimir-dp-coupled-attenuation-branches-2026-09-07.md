# Coupled attenuation: two algebraic branches

Exploratory diagnostic. No joint population, accepted xenon event count or allowed parameter point is established.

Let a multiply the prior reference cross section at fixed mass and mediator. In the chosen silica column the uncollided raw high-window xenon contribution is C a exp(-tau0 a), with C=11240.0577 and tau0=0.0001660685. Solving for one raw event gives a=-W_k(-tau0/C)/tau0 on the two real Lambert-W branches. This varies detection probability and attenuation together, unlike rescaling shielding alone.

| Branch | Cross-section multiplier | Proton cross section at zero momentum (cm^2) | Silica optical depth | Uncollided fraction |
|---|---:|---:|---:|---:|
| Weak | 8.89675e-5 | 2.67683e-39 | 1.47747e-8 | 0.999999985 |
| Strong | 126927 | 3.81895e-30 | 21.0786 | 7.00933e-10 |

These are roots for the uncollided contribution only. At the strong root, scattered particles can still arrive with enough energy to produce xenon recoils. A one-event uncollided contribution therefore does not establish a one-event total prediction. The original low-energy spectral tension also persists for that uncollided component.

## Detector diagnostic

For a separately chosen 300 g/cm^2 Xe-131 column, the point-nucleus calculation gives strong-branch optical depth 0.0659971. The fixed-energy straight-track Poisson probability of at least two interactions is 0.00208432 per entering particle. This is not a detector single-scatter acceptance: energy changes, geometry, thresholds, finite nuclear form factors and detector reconstruction are omitted. It is also not the multiple-scatter fraction conditional on a high-energy recoil. The result does not justify assuming the detector is opaque, but does require a proper event-response treatment.

Matching sigma_p(0)=16 pi alpha_p^2 mu_p^2/mmed^4 yields effective alpha_p=1.49998e-6 on the strong branch. The point-Yukawa range-strength diagnostic 2 mu_Xe Z alpha_p/mmed is 0.89034. This is not a proof that the fast-scattering Born result fails; it signals that a uniformly weak-potential treatment, especially when extrapolated to low velocities, is not established. Check actual energy-dependent scattering before promoting the strong branch. The effective product alpha_p does not separately specify dark coupling and kinetic mixing, so their individual constraints remain to be applied.

## Decision

Keep the strong root as a conditional transport candidate rather than rejecting it merely for detector opacity or accepting it because it has an algebraic solution. The next discriminating calculation is the energy/direction distribution of collided particles in the same column, followed by actual overburden and detector folding. Capture and local temperature/density must be linked to that interaction. The weak root is a control unless another calculated local channel changes its coherence reach.

The companion script checks both roots by substitution, verifies the prior receipt hash and evaluates the Poisson tail stably with the incomplete gamma function. It does not validate the Born approximation, Earth model or detector acceptance. The measurable-in-both goal remains open.
