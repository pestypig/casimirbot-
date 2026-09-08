# Virtual electron resolvent diagnostic

Date: 2026-09-07. Exploratory approximation check, not a field-theory matching result.

The preceding matching intake established why the published heavy-mediator electron formula cannot be used. This independent diagnostic tests a different shortcut: an instantaneous Yukawa potential with only positive-energy electron intermediate states. It preserves the authenticated xenon-normalized coupling product, 100 GeV dark mass, 10 MeV mediator and 10 MeV gap.

For an external electron at rest, the positive-energy Dirac projector between unit-normalized rest spinors supplies (E_p+m_e)/(2 E_p), where E_p=sqrt(p^2+m_e^2). Within this explicitly projected Hamiltonian, the forward second-order potential is

W(0) = -8 alpha^2 integral dp p^2/(p^2+m_A^2)^2 [(E_p+m_e)/(2 E_p)]/[delta+E_p-m_e+p^2/(2 M)].

This follows by inserting the positive-energy spectral projector in the resolvent and integrating the angular measure with U(p)=4 pi alpha/(p^2+m_A^2). The static-gap point-charge limit instead sets the projector to one and the denominator to delta, giving W(0)=-2 pi alpha^2/(delta m_A). A third comparison uses nonrelativistic electron recoil and unit projector. All three are diagnostic models, not mutually controlled approximations in this parameter regime.

| Intermediate treatment | W(0), GeV^-2 | Ratio to static-gap amplitude |
| --- | ---: | ---: |
| Static gap | -4.91663134e-9 | 1 |
| Nonrelativistic electron | -2.88518773e-10 | 0.0586822 |
| Positive-energy relativistic electron | -8.40075397e-10 | 0.1708640 |

The substitution p=m_A tan(t) integrates the full momentum interval. Split and unsplit quadratures agree within 1.4e-12 relative; the static result independently matches its analytic integral. These are numerical checks only.

The positive-energy model excludes mediator retardation/poles, pair sectors and the complete crossed-diagram contribution. Small m_A/M does not bound these omissions: delta/m_A=1, so the time dependence of virtual exchange cannot be discarded solely because the dark particle is heavy. No physical rate, upper bound on the full amplitude, or detector sensitivity follows from this table. In particular, squaring these numbers and folding an existing ELF would not repair the omitted matching.

Decision: neither the static-gap electron replacement nor a nonrelativistic electron resolvent is an adequate substitute for full matching. Keep the full gap-dependent box/crossed calculation as the next calculation; do not spend further work refining this toy. An eventual result must recover appropriate limiting cases and specify which one-electron and multi-constituent operators feed the material response. The reproducible Python/JSON record changes no frozen apparatus or physical-viability authority.
