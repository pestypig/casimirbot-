# Shared electron contact interaction: xenon versus diamond

Date: 2026-09-07. Conditional cross-experiment rate comparison; no new confidence limit.

A matched momentum-independent electron-density operator can be tested without knowing its microscopic coefficient: both covered diamond decoherence and xenon electron counts scale as W squared. Their ratio cancels W. This check therefore tests whether the simple contact-density route is worth pursuing for a measurable shared signal.

Use the preceding unit-contact diamond calibration and the authenticated atomic xenon K response. Fold W=1 GeV^-2 through the released [XENON1T S2 response](https://github.com/XENON1T/s2only_data_release), using the published 186 eV cutoff, 356770 kg-day exposure, and fixed 165.3-271.7 PE interval. No ROI optimization is performed. The result is 104802.457 events per unit W squared in that interval. The fold compares 512/1024 integration grids and enforces its existing one-percent numerical refinement criterion.

The release's reference-model allowance of 24.8 events corresponds nominally to W=0.01538297 GeV^-2. At that same coefficient the covered diamond exponent is 2.60933e-23 with local-field effects, or 3.34956e-23 without. The allowance is not a newly derived model-specific confidence limit. Its role here is a rate-scale comparison; ordinary statistical or interpolation refinements cannot be presumed to bridge the roughly 21-order mismatch to the theoretical DP comparator.

Conversely, formal scaling to D=0.02951146 gives about 2.80e22 xenon ROI events in the local-field calculation. This is not a physically valid forecast at that enormous coupling: attenuation, multiple scattering and weak-response assumptions could fail. The useful comparison is the small-coefficient result near the xenon reference count, not extrapolating a huge unattenuated event rate into a claimed exclusion.

The argument assumes the same unattenuated 100 GeV mono-speed population at both experiments, the same density operator coefficient, and the covered bulk/atomic responses. It excludes neither specially transported populations nor momentum-dependent, subgap, surface or multi-density mechanisms. Such alternatives require a new calculation rather than inheriting this ratio. The diamond DP comparator is a forecast, not measured experimental sensitivity.

Decision: demote a simple constant single-electron-density contact channel as a route to measurable overlap under these assumptions. Detailed matching of that channel alone is now lower priority: a viable bridge must demonstrate a different momentum/energy response or population mechanism quantitatively. The current virtual candidate remains unvalidated, and this comparison does not solve its full two-insertion material response.

The companion fold and cross-check scripts authenticate response inputs and record output hashes. They preserve the frozen apparatus, original xenon nuclear normalizations and prior dated packets.
