# Executed partial thermal diamond coefficient

Exploratory conditional calculation. No captured density, allowed parameter point, measurable overlap or LZ likelihood is established.

The companion Python script executes [pinned DarkELF](https://github.com/tongylin/DarkELF/tree/352149fb53b614adbac6ee242045c56be25aad29), following the source audit. It verifies the revision, tracked working-tree cleanliness and frozen apparatus hash. Run with Python UTF-8 mode and the source directory as its argument. No upstream package edits or installation were needed.

## Explicit specification

Dark matter mass 100 GeV; mediator mass 10 MeV; reference proton cross section 1e-38 cm^2; number density exactly 1/cm^3. The cross section is a normalization, not an externally allowed benchmark. The untruncated isotropic Maxwell particle distribution has assumed temperature 300 or 5000 K in the target rest frame. Its mean inverse speed is 2 exp[-(vmin/v0)^2]/(sqrt(pi) v0), where v0^2=2kT/mchi. This replaces the package halo function; the package halo cutoff wrapper is not used.

Integrate only q from the package qBZ=3472.824 eV to 100 keV and energy from 0.18 to 0.60 eV. This is a deliberately partial domain, not a claimed converged all-q or all-energy integral. The upstream C_ld function switches from a tabulated phonon expansion to its impulse approximation at its own material-dependent threshold. The minimum requested phonon order is two. Missing carbon dielectric-table warnings concern omitted channels and remain limitations.

## Results

| Assumed particle temperature | Partial rate per kg-year | Mean events in frozen 0.25 s hold |
|---|---:|---:|
| 300 K | 11.66935 | 2.86082e-23 |
| 5000 K | 2.88528e6 | 7.07346e-18 |

The last grid refinement, 256 to 512 points on each integration axis, changes these values by 0.2732% and 0.000515%, respectively. Positive integrands and rates were checked. Grid refinement does not bound phonon-table truncation, approximation errors, finite-temperature material effects or omitted response domains.

Under the independent, isotropic and translationally equivalent-branch assumptions in the prior source audit, these mean events approximate this channel's coherence exponent within 0.023%. For general anisotropic or history-changing scattering that conversion must be recomputed.

At fixed normalization, a formal density rescaling to the frozen DP comparator exponent would require about 1.03e21/cm^3 or 4.17e15/cm^3, respectively. These are algebraic scale comparisons only: the linear approximation, supply, capture, thermal state and constraints have not been shown to permit them. They are not total-signal required densities because omitted channels could contribute. The DP comparator itself is a forecast, not a measured residual or qualified detection threshold.

## Next comparison

This executes the previously missing local coefficient and shows strong dependence on particle temperature. Next match the reference proton cross section and finite mediator to the xenon spectrum coefficient, then assess whether capture can supply the local distribution while preserving the fast xenon-capable flux. Keep both temperatures conditional until transport determines them. Do not promote either as a shared prediction model.
