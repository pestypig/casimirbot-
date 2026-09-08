# Forward electron box: full-gap scalar denominator integrals

Exploratory matching infrastructure, September 7, 2026. This is a step toward the outstanding electron calculation, not a new physical rate or accepted model.

Use metric (+---), forward external momenta P=(M,0), p=(m_e,0), and internal excited mass M2=M+delta. Define denominator families D_A=l^2-m_A^2+i0 (squared), D_chi=(l+P)^2-M2^2+i0 and D_e=(l+s*p)^2-m_e^2+i0 with s=+1 or -1. These are explicit routing families; their physical diagram multiplicities and relative signs are not assigned here.

Combining denominators with mediator weight x, dark weight y and electron weight z, x+y+z=1, and shifting L=l+y*P+s*z*p gives

Delta_s = x*m_A^2 + y*(2*M*delta+delta^2) + (y*M+s*z*m_e)^2.

All terms are nonnegative for positive masses and positive splitting. In fact Delta cannot vanish anywhere on the compact simplex: vanishing first and second terms would require x=y=0, leaving z=1 and the positive electron mass term. Thus these zero-relative-velocity scalar families have no parameter-space denominator pole. This conclusion concerns these integrals only, not all physical amplitudes or finite-energy thresholds.

Define I_s = integral d^4l/[i*(2*pi)^4] 1/(D_A^2 D_chi D_e). Feynman parameterization and the convergent four-denominator loop integral give I_s=(1/(16*pi^2))*integral_0^1 dy integral_0^(1-y) dz x/Delta_s^2. The factor x is essential for the repeated mediator denominator. Dimensions are GeV^-4.

At the authenticated candidate M=100 GeV, m_A=0.3 GeV and delta=0.01 GeV, the two values are I_minus=0.00318723913654 and I_plus=0.00315777093714 GeV^-4. Direct y integration and y=t^2 integration agree within 9e-12 relative; integration warnings are errors in the script. Couplings have not been inserted.

The [Berlin-Kling matching framework, Appendix C](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74) motivates retaining scalar and spin-2 electron structures. This packet independently derives only the scalar denominator families and does not import its heavy-mediator expansion. The full Dirac/Majorana numerator algebra, diagram signs, gauge-completion checks and momentum-dependent operator matching remain required. In particular I_plus plus I_minus is not a physical amplitude, and neither integral can be squared and fed to a dielectric table as a signal prediction.

Next: evaluate the tensor numerator integrals in the same routing convention and recover an authenticated limit before reducing the electron operators. Frozen apparatus and xenon normalization remain unchanged; the shared-model goal remains active.
