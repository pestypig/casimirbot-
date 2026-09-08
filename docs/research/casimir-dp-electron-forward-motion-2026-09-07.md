# On-shell electron motion in the forward vector loop

Exploratory approximation check, September 7, 2026. No frozen input or candidate parameter changes.

Generalize the previous forward spin-average to P=(M,0), p=(E,0,0,p_e), E=sqrt(m_e^2+p_e^2). Divide external spin averages by 2M and 2E. Let w=P dot p, A=P dot l and B=p dot l. The contracted numerator is

N_s(l)=[4w^2+4w(sA+B)+2s*w*l^2+2s*A*B-2s*B*M^2-2s*M*delta*B-2A*m_e^2+2M*delta*m_e^2]/(M*E).

Direct gamma traces at six seeded moving-electron routing points agree with this polynomial within 1.89e-15 relative. After the parameter shift, Q=yP+s*z*p, Delta=x*m_A^2+y*(2M*delta+delta^2)+Q^2. Substitute l=-Q in the numerator and add the integrated quadratic correction -5s*w/(M*E*Delta), with weight x/(16*pi^2). This reduces to the preceding rest integrand at p_e=0; the script verifies recovery and quadrature stability.

For electron momenta 3, 30 and 100 keV/c, forward normalized trace ratios to rest are 1.00000573, 1.00057334 and 1.00642305. These are sampled on-shell motion checks at zero momentum transfer, not bounds on a material response or a continuous momentum interval. Binding, nonzero transfer, spin response and completed Majorana matching remain unresolved. The changing 2E normalization is included consistently; these are not ratios of Lorentz-invariant amplitudes with different external normalizations.

The [multi-channel material framework](https://arxiv.org/html/1910.08092) distinguishes particle operators from the target response. Our calculation does not turn an on-shell electron into a bound electron merely by assigning a momentum. Nevertheless, the modest sampled changes support continuing the low-energy operator expansion rather than assuming a large hidden enhancement from electron motion alone. Next check nonforward kinematics and identify the response operators before convolution. No measurable shared signal is admitted.
