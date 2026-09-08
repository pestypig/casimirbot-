# Captured dark photon: neutral-carbon elastic screen

Exploratory conditional response calculation, 2026-09-07. The measurable-in-both goal remains open. This is the first response check for the [captured-dark-photon definition](casimir-dp-captured-dark-photon-definition-2026-09-07.md), not a population model or an experimental exclusion.

## Source and normalization

Carbon Cromer-Mann coefficients are taken from the IUCr core dictionary: [a1](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_a1.html), [a2](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_a2.html), [a3](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_a3.html), [a4](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_a4.html), [b1](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_b1.html), [b2](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_b2.html), [b3](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_b3.html), [b4](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_b4.html), and [c](https://www.iucr.org/__data/iucr/cifdic_html/3_orig/CORE_DIC/Iatom_type_scat.Cromer_Mann_c.html). These are isolated-atom coefficients, not a measured diamond response.

Use f(s)=sum a_i exp(-b_i s^2)+c and s=q/(4 pi hbar c), in inverse angstrom. Since f(0)=5.9992, explicitly set F_e=6f/f(0). The 1.00013335 correction enforces neutrality; retaining the raw offset would manufacture a low-q charge. Evaluate 1-F_e/6 with expm1 to avoid cancellation. The inferred electron rms radius is 0.0812145 nm. Do not extend the constant-term fit to arbitrarily large q.

## Conditional calculation

For a point carbon nucleus, the neutral-to-bare charge factor is S=1-F_e/6. The rigid, uniform sphere and isotropic directional average give the vector-exchange weight

`q dq / (q^2 + m_A'^2)^2 * F_sphere(qR)^2 * [1-sinc(q d)]`.

The table divides its integral multiplied by S^2 by the same bare integral. It is not the earlier magnetic-dipole kernel. Couplings and flux cancel only in this conditional ratio. Kinematics must support the entire stated interval; no velocity distribution is claimed. Apparatus radius and separation are read from the hash-frozen stage4-2r configuration.

| qR cutoff | Maximum q (eV) | Neutral / bare integral |
|---|---:|---:|
| 1 | 0.71417 | 1.00258e-16 |
| 10 | 7.14170 | 5.44690e-14 |
| 80 | 57.13364 | 3.14142e-12 |

The 10 and 100 MeV mediator results agree at displayed precision because both are effectively contact interactions over these intervals. The large suppression makes a bare-nucleus estimate inappropriate for this local channel. Changing the cutoff changes the partial integral; this is not a convergence claim or a bound on all momentum transfers.

## Decision and next work

Do not claim enhanced captured density yields a measurable signal without the neutral response and a linked capture/transport calculation. The remaining decisive response issue is whether bonded-solid, incoherent or inelastic channels materially change the result, with energy deposition and visibility computed together. Surface charge would require an actual charge specification and control, not a fitted replacement for neutrality. These channels are omitted here, so this result does not reject the full dark-photon model.

No absolute decoherence, LZ accepted count, joint allowed point, detector significance or physical viability is established. No local residual measurement exists in this packet. The next comparison must retain the user's measurable-in-both criterion while enforcing these response restrictions.

Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-dark-photon-carbon-screen-2026-09-07.py`. The companion JSON records assumptions and numbers. Checks cover input hash, exact neutrality, small-q scaling, quadrature tightening and the monotonic endpoint upper bound on each weighted ratio. These are numerical checks, not material-model validation.
