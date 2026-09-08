# Forward vector-box rest-spin trace

Exploratory matching calculation, September 7, 2026. This extends the scalar denominator packet without changing the candidate or admitting an electron rate.

Retain its (+---) metric and routing k=P+l, h=p+s*l, with external rest momenta P=(M,0), p=(m,0) and s=+/-1. Normalize each spin-averaged external bilinear by 2 times its rest mass. The vector numerator tensors are

T_chi^(mu nu) = Tr[(slash(P)+M) gamma^mu (slash(k)+M+delta) gamma^nu]/(4M),

T_e^(mu nu) = Tr[(slash(p)+m) gamma^mu (slash(h)+m) gamma^nu]/(4m).

Contracting both indices with the metric gives the polynomial

N_s(l) = 2m(2M+delta) + [s(2M-2delta)+2m] l0 + 4s l0^2 - 2s |l_vector|^2.

Explicit 4x4 gamma matrices at sixteen seeded four-momenta verify the polynomial within 7.1e-16 relative (with unit denominator floor). This is an average of the forward amplitude's diagonal spin entries, not the spin-averaged squared scattering amplitude; spin-dependent terms are not recovered by squaring this trace.

With Q0=yM+s*z*m and Delta from the scalar packet, tensor integration replaces l0 by -Q0 and l^mu*l^nu by Q^mu*Q^nu - g^(mu nu)*Delta/2, relative to the scalar 1/Delta^2 integrand. This follows from the convergent four-dimensional loop moments. Consequently the parameter integrand, before the common 1/(16*pi^2), is

x * { [2m(2M+delta) - (s(2M-2delta)+2m)*Q0 + 4s*Q0^2]/Delta^2 - 5s/Delta }.

The 300 MeV candidate gives normalized routing integrals +0.0649602759738 (s=-1) and -0.0637218736497 (s=+1), in GeV^-2 before couplings. Direct and squared-coordinate quadratures agree within 5.5e-12 relative. Their signs and near cancellation reinforce why neither diagram can be promoted independently or squared before the physical amplitude is assembled.

This calculation uses the metric contraction of vector propagator numerators. It does not yet prove gauge independence, fix Majorana diagram multiplicities, assign physical relative diagram signs, separate all low-energy operators or include nonzero external momentum. The [Berlin-Kling Appendix C framework](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74) remains the intended known-limit comparison; it has not been recovered by this packet. Next resolve those amplitude conventions and verify that limit before material folding. No physical rate, sensitivity or complete shared model is claimed.
