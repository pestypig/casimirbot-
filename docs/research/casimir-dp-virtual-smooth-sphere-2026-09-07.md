# Xenon-normalized virtual smooth-sphere contribution

Date: 2026-09-07. Exploratory nuclear-only component, not a total diamond prediction.

Current-state inspection confirmed the virtual nuclear match supplies W_C(0)=-1.5359447e-7 GeV^-2. Preserve its 10 MeV mediator/gap, 100 GeV incident mass, speed 776 km/s, density 0.003/cm3 and normalization to one raw high-window xenon recoil. Approximate the frozen diamond sphere as a smooth distribution of N=1.5519585e10 identical carbon nuclear amplitudes. No Gaussian massless-atom overlap correction is imported.

For W_sphere(q)=N W_C(0) F(qR), F(x)=3 j1(x)/x, the Born decoherence exponent is

D = n v t (hbar c) squared N squared W_C(0) squared / (2 pi v squared R squared) times integral_0^infinity dx x F(x) squared [1-sinc(x d/R)].

Use consistent natural units for R and W, cm units for incident flux and cross-section conversion, and the frozen hold 0.25 s. The prefactor is 1.56009e-30. Integrating x from zero through 1000 gives D=1.48731554e-30; the omitted positive tail is bounded by 1.40596e-35 within the continuum model. Unit and half-unit integration segments agree to better than 1e-9 in the dimensionless integral.

For the tail, abs(j1(x))<=1/x+1/x squared and 1-sinc<=2 give integral_L^infinity <=9/L squared+12/L cubed+4.5/L fourth. A separate loose all-momentum bound uses abs(j1(x))<=x/3 below x=1, and the preceding bound above one; the integral is at most 26.5, giving D<=4.13424e-29. These are mathematical bounds on this contact-amplitude continuum component, not material bounds on all channels. Extending to infinite q is a bounding device for the model; it does not authenticate nuclear or lattice extrapolation.

The uniform potential estimate gives a central eikonal phase 2.24e-13, so macroscopic large-phase saturation is not the obstruction in this component. The frozen DP comparator is about 0.0295; the smooth-sphere virtual contribution is vastly smaller. A nonzero forward amplitude and a favorable soft shape were insufficient once the common nuclear normalization was fixed.

Limitations remain the local-gap approximation, uniform nuclear charge model, constant W_C, omitted electrons and two-density response, discrete lattice and inelastic final states. Thus do not claim zero total diamond signal or a global exclusion of virtual-state models. The large raw lower-energy xenon ratio also remains unresolved at detector level.

Decision: this short-range smooth coherent component cannot meet the user's measurable-overlap priority. Next screen whether any justified non-continuum or electronic contribution can materially change the joint prediction; otherwise demote this benchmark and move to a different specified interaction. Do not adjust its local normalization independently.

Matching Python/JSON reproduce the exponent, tail bound and phase check, authenticate the frozen configuration and record the nuclear source hash. No GR or certificate authority changed.
