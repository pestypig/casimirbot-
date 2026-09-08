# Whole-sphere resonance at the existing xenon normalization

Exploratory S1 research, September 7, 2026. This tests the existing 300 MeV virtual mediator nuclear component, preserving the frozen sphere and its matched carbon amplitude.

In the short-range uniform-density approximation, the sphere potential is V(r)=n_C W_C for r<R and zero outside, where W_C=-2.9308573e-8 GeV^-2 is the previously computed forward carbon potential integral. This replaces independent carbon collisions with an optical potential for the entire rigid sphere. It is a conditional static material approximation, not a complete response model. The [virtual-channel source](https://arxiv.org/html/0903.3396) motivates the original interaction; it does not establish this material approximation.

Define z=R sqrt(2 mu n_C |W_C|), using the dark-particle/sphere reduced mass. Matching the regular zero-energy solution sin(z*r/R) to the exterior r-a gives a/R=1-tan(z)/z. The first s-wave threshold pole occurs at z=pi/2. This is the finite attractive square-well resonance condition, consistent with the [resonant-scattering analysis](https://arxiv.org/abs/2101.00142).

The unchanged benchmark gives z=0.00393830 and a/R=-5.17011e-6, far from the first pole. Independent numerical integration of the radial equation agrees with the weak-well series to below 1e-12 absolute in a/R. Thus this specific approximation contains no hidden near-threshold whole-sphere resonance at the xenon-normalized coupling.

The first threshold would require |W_C| about 0.00466247 GeV^-2, a factor 159082 larger. Since the existing virtual kernel scales as alpha_eff squared at fixed mediator and gap, the formal coupling multiplier is 398.85. Its perturbative xenon rate would scale by 2.53e10. **That last quantity is a scaling diagnostic, not an event forecast:** the original nuclear approximation, external constraints and incident transport would all require revalidation after such a change. The new point is not admitted or fitted.

Decision: do not pursue a slow whole-sphere resonance by retaining the current xenon spectrum and silently increasing the local interaction. Further work on this branch needs a derived additional material channel or a different fully matched microscopic model. The result applies to the nuclear optical-potential component only; it does not exclude all collective or electronic mechanisms. No coherence signal, experimental validation or goal completion follows.
