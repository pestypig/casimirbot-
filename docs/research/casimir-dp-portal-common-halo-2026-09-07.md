# Common halo: matched heavy xenon and local scalar envelope

Program gate: S1 — consistent incident distributions and response components.
Workstream: Matched scalar halo integration.
Capability or component: Direction-dependent inverse-speed tensor for local coherence.
Current maturity: Conditional common-halo component comparison.
Target maturity: Remove mono-speed mismatch without suppressing direction dependence.
Required frozen inputs: Authenticated xenon contact spectrum and rigid-sphere kernel; canonical apparatus/comparator unchanged.
Required evidence: Distribution normalization, independent inverse-speed moment, tensor trace and refinement.
Stop/fail criteria: No upper envelope labeled observed contraction; no unattenuated halo declared an established local distribution.
Explicit non-goals: Full light-channel xenon response, exact chamber propagation, transport, trap admission or complete joint fit.
Downstream gate unlocked: Incident transport and response-validity audit; S1 remains open.

## Result

The heavy xenon component and local scalar envelope now use the same six shifted halo distributions and the same declared tree parameters. For the central halo and 1 TeV dark matter, the local homogeneous-vacuum rigid-sphere envelope is D <= 0.0210593 for separation parallel to the halo boost axis and D <= 0.0323057 perpendicular to it. These are upper envelopes, not predictions of percent-level measured contraction or evidence of agreement with DP.

The same parameter point still predicts only 0.000228 raw heavy-component xenon recoils in 200–270 keV. The near numerical value of one local envelope to the frozen DP comparator supplies no fit or validation: the scalar force problem remains, and the full xenon light channel and detector response are incomplete.

## Local kernel and directional moment

The [finite-sphere packet](casimir-dp-portal-finite-sphere-force-envelope-2026-09-06.md) retained the exact separation factor for one transverse beam. For a common anisotropic halo, apply the valid inequality

    1-J0(q d_perp) <= q^2 d^2 sin^2(beta)/4.

This makes a conservative factorized envelope with spatial kernel

    J = d^2/4 integral q^3 dq F(q)^2/(q^2+m_light^2)^2,

and directional inverse-speed moment

    T(d_hat) = integral d^3v f_lab(v) [1-(v_hat.d_hat)^2]/v.

The local envelope is proportional to J T, density_chi/mass_chi, hold and (alpha B)^2. The finite radius remains in F; close impact parameters are included within this rigid elastic eikonal model. The additional separation inequality slightly loosens the previous transverse kernel: J = 0.0969405663 micrometres squared versus approximately 0.0953291 for its exact-separation counterpart. Positive omitted momentum-tail bounds are retained.

Let t be the velocity direction cosine relative to the halo boost vector. The truncated Galactic Gaussian becomes

    f_lab proportional to exp[-(v^2+vE^2+2 v vE t)/v0^2],
    t <= (vesc^2-v^2-vE^2)/(2 v vE).

Integrate the allowed angular range directly. For separation parallel to the boost axis, the weight is 1-t^2; for a perpendicular separation, azimuthal averaging gives (1+t^2)/2. Their moments satisfy T_parallel + 2 T_perpendicular = 2 eta, where eta is the usual inverse-speed integral. Arbitrary orientation gamma relative to the boost axis gives T = T_parallel cos^2(gamma) + T_perpendicular sin^2(gamma). No isotropic incident distribution is substituted for the shifted halo.

The central halo parameters are (v0, vesc, vE) = (238, 544, 250.2) km/s; inherited alternatives vary v0, escape speed and boost magnitude. They are diagnostic variations, not a statistical confidence region or a complete annual/daily modulation model. A laboratory direction and time-dependent orientation are still needed for a modulation prediction.

## Same-distribution component table

| Dark-matter mass (GeV) | Heavy Xe raw wide window | Heavy Xe raw 200–270 keV | Local D envelope, parallel | Local D envelope, perpendicular |
|---:|---:|---:|---:|---:|
| 100 | 1.63862 | 0.0000675661 | 0.210593 | 0.323057 |
| 200 | 0.951861 | 0.000360028 | 0.105297 | 0.161529 |
| 1000 | 0.208237 | 0.000228043 | 0.0210593 | 0.0323057 |

The xenon wide window is 5.4–269.9 keV, using the prior isotope/Helm calculation and 2.84 tonne-year exposure. These are true recoil counts before detector reconstruction and efficiency. Local values are bounds within a homogeneous-vacuum rigid-sphere model, not detected events. The [JSON results](casimir-dp-portal-common-halo-2026-09-07.json) record all 18 halo/mass cases and tensor moments.

At 1 TeV, imposing the earlier hypothetical 10 kHz thin-plate curvature allowance would rescale these local envelopes to approximately 8.35e-8 parallel and 1.28e-7 perpendicular, retaining the separate weak-source force assumptions. This does not declare such a trap present. The force-related qualifications of the original scalar point are unchanged by averaging velocities.

## Validity and next work

This calculation removes an incident-distribution mismatch between component calculations. It does not establish that an unattenuated Galactic distribution reaches the sphere or survives passage through the hypothetical chamber. The inherited eikonal kernel is formally averaged down to zero speed; convergence of the inverse-speed integral is not proof of its physical validity for arbitrarily slow particles. Refraction from scalar mass shifts, reflection, deflection, collisions and gravitational focusing require separate review. The shared parameters must predict those effects too.

The chamber can modify propagation, and the material can have internal response channels. Neither is bounded by a rigid vacuum envelope merely because its integral is finite. The actual branch trajectories and accepted-shot definition are likewise unresolved. In particular the classical force audit is not waived by this upper envelope reaching the order of the DP comparator.

Four checks pass when running `C:\Python313\python.exe docs/research/casimir-dp-portal-common-halo-2026-09-07.py`: full distribution normalization, independent speed-only inverse moment, tensor trace identity and increased angular/velocity resolution. Maximum inverse-speed discrepancy is 3.49e-9; refinement changes the moments by at most 2.26e-9 relatively. The code authenticates inputs and loads parent definitions without rerunning their output loops.

Next audit transport and low-speed validity before treating this common incident distribution as a local prediction. The hold/trap question remains pending, and the overall goal remains active with S1 open.
