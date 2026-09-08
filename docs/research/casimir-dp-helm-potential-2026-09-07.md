# Helm-consistent potential audit — 2026-09-07

Exploratory S1 calculation. The coupling magnitude remains fixed at the prior
benchmark; neither nuclear radius nor coupling is retuned to obtain a pole.
This is a prerequisite for finite-speed calculations, not their completion.

## Construction and checks

Use Xe131 with the same Helm radius convention as the previous recoil kernel:
R=sqrt[(1.23 A^(1/3)-0.6)^2 + 7 pi^2 (0.52)^2/3 - 5 (0.9)^2] fm,
and Gaussian width s=0.9 fm. The radial charge density is a uniform ball of
radius R convolved with a normalized three-dimensional Gaussian. Its Fourier
transform is 3 j1(qR)/(qR) exp[-(qs)^2/2]. The companion script evaluates the
analytic radial convolution and verifies unit total charge plus agreement
with this transform at q/m_med=1,5,10,20.

In x=m_med*r units, for normalized density rho, the dimensionless potential is

`W(x)=4*pi/x * [exp(-x)*integral_0^x dy y*rho(y)*sinh(y) + sinh(x)*integral_x^infinity dy y*rho(y)*exp(-y)]`.

The finite central value follows by continuity. Outside the charge support,
the numerical calculation uses the exponentially decaying analytic tail.
The zero-energy equation is u''=sign*lambda*W*u, with lambda=1.7582883157
from the fixed coupling and the same mass-number approximation as the point
check. Extract a*m_med=x-u/u'. The zero-energy Born scattering length remains
sign*lambda because total charge remains one.

## Executed result

| Quantity | Point nucleus, prior packet | Extended Helm charge |
| --- | --- | --- |
| Attractive zero-energy pole strength | 1.67980777 | 1.73050265 |
| Attractive sigma/Born at zero energy | 287.1 | 2589.99 |
| Repulsive sigma/Born at zero energy | 0.3117 | 0.3144 |

Doubling the charge-potential grid from 12,001 to 24,001 points changes the
attractive scattering length by about 2.2e-7 relatively and the pole strength
by about 5.9e-9 absolutely. Charge normalization and Fourier checks pass.
These are numerical convergence checks, not physical uncertainty estimates.

Nuclear smearing brings the pole closer to this particular fixed benchmark;
it does not universally enhance scattering. Close to a pole, changes in
physical charge parameters or isotope mass can matter much more than the
numerical errors reported here. Do not describe the point-versus-Helm spread
as a measured uncertainty distribution.

## Consequence and next dependency

The point-nucleus result is insufficient for a nonperturbative xenon model.
A consistent real-space potential is now available whose Born transform
matches our recoil form factor. Next solve the finite-speed scattering problem,
check partial-wave convergence and weak-coupling recovery, and calculate
isotope-resolved differential rates before changing transport predictions.
Do not multiply existing LZ counts by 2589.99: this number is strictly a
zero-energy diagnostic. Atomic screening, diamond response, captured supply,
finite-speed behavior and detector response are not supplied by it.

No resonance-mediated capture rate, experimental exclusion, physical viability,
certified proof status or shared measurable parameter point is claimed.
