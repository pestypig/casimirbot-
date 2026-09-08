# Dark scalar portal: potential and force consistency map

Exploratory tree-level reconstruction for the new symmetric dark-scalar branch. Previous turn made progress by deriving its elastic Yukawa matrix and absent tree transition. This packet connects the portal mixing to the same scalar potential and ordinary force. It differs from the older even-portal matching construction; no earlier frozen packet is replaced.

For V=-muH^2|H|^2-muS^2|S|^2+lambdaH|H|^4+lambdaS|S|^4+lambdaHS|H|^2|S|^2, with H=(0,(v+h)/sqrt(2)) and S=(w+s)/sqrt(2), the tadpole conditions give muH^2=lambdaH*v^2+lambdaHS*w^2/2 and muS^2=lambdaS*w^2+lambdaHS*v^2/2. The radial Hessian is [[2lambdaH*v^2,lambdaHS*v*w],[lambdaHS*v*w,2lambdaS*w^2]].

For masses mh,ms and mixing theta, choose the field convention with positive off-diagonal entry. Then

- lambdaH=(mh^2 cos^2(theta)+ms^2 sin^2(theta))/(2v^2).
- lambdaS=(mh^2 sin^2(theta)+ms^2 cos^2(theta))/(2w^2).
- lambdaHS=(mh^2-ms^2)sin(theta)cos(theta)/(v*w).

Consequently 4lambdaH*lambdaS-lambdaHS^2=mh^2*ms^2/(v^2*w^2)>0. Both eigenvalues are positive at tree level. Reconstructing a tiny eigenvalue by subtracting large double-precision entries can lose accuracy, so the companion uses 80-digit arithmetic. These identities show what potential is required; they do not prove radiative stability or experimental viability.

For the symmetric branch the mass-derived diagonal dark coupling is yi=+-gap/(2w). Mixing supplies gN=(fN*mN/v)sin(theta), with illustrative fN=.3. The two scalar exchanges give C_iN(q)=yi*(fN*mN/v)sin(theta)cos(theta)*[1/(q^2+ms^2)-1/(q^2+mh^2)], up to field-sign conventions. The same gN generates an unscreened nucleon Yukawa force with range hbar*c/ms and strength alphaNN=gN^2/(4pi GN mN^2) relative to nucleon gravity. This is a nucleon proxy: real bulk-material charges need electron and binding contributions and material composition. No screening is assumed or established.

At v=246.2 GeV, w=500 GeV, mh=125 GeV and ms=1 eV, the range is 0.1973 micrometres. The determinant divided by the product of diagonal Hessian entries is 0.9846 at theta=1e-12, 7.106e-4 at 3e-10, 6.400e-7 at 1e-8 and 6.400e-15 at 1e-4. This is a tree matrix-cancellation diagnostic, not a naturalness exclusion. At theta=3e-10 the nucleon force proxy alphaNN is 1.5853e12. A large ratio to gravity is not itself an experimental exclusion at this short range.

## Constraint intake, not a completed recast

[Hardy and Lasenby](https://arxiv.org/abs/1611.05852) give a Higgs-portal stellar mixing bound of order 3e-10 below approximately 2 keV in their plasma treatment. The scan includes that value only as a dated diagnostic reference, not a declaration that it is currently allowed. [Balaji et al.](https://arxiv.org/abs/2205.01669) report stronger stellar limits in parts of this region with additional stellar transport assumptions. Their abstract numbers must not be treated as a mass-independent joint likelihood or transplanted without checking the detailed model. Force, stellar and laboratory constraints must use the same mass, coupling conventions and scalar spectrum.

The next quantitative step is to compare the sphere response required for a percent-scale effect with portal mixing and material-force predictions using these identities. Then audit the specific stellar/short-range-force inputs and gauge-loop corrections. The portal parameter may be varied as a shared model input, but cannot affect only the apparatus while its xenon/ordinary-matter effects are omitted. The absence of a tree scalar transition still does not establish total population survival.

Reproduce with `python docs/research/casimir-dp-dark-scalar-portal-potential-2026-09-07.py`. High-precision eigenvalues, determinant and positive quartic determinant are checked for the diagnostic points. Research root-leaf validation is separate. No runtime, GR, certificate or model-admission changes; goal remains active.
