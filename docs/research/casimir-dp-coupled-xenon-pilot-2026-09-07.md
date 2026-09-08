# Coupled rock exits and xenon collision histories

Exploratory S1 pilot, September 7, 2026. No LZ pulse-selection claim.

The two strong-scale weighted rock samples supply Xe entry speeds, positive
direction cosines and likelihood weights. Each sampled far exit receives
one independent xenon collision history using the energy-updating Helm
null-collision kernel. The entry angle is preserved; it is not reset to
normal incidence. Uniform planar illumination and infinite slabs remain
assumptions. There is no extra 1/cos factor on the incident crossing flux:
the longer oblique path is handled inside the Xe simulation.

The incident crossing normalization is n*v_initial*(mass_exposure/column),
using n=0.003/cm³, v_initial=776 km/s and the inherited 365-day year. In
the no-rock, first-order limit, crossings times column times the high-band
cross section reproduces the earlier normalization to relative tolerance
1e-12. This provides an independent check of area, number-column and exposure
conventions. Coupling and population density are unchanged.

| Rock run | Simulated Xe entries | Histories with a 5.4–200 keV recoil | Histories with exactly one recoil above 5.4 keV |
| --- | --- | --- | --- |
| 2 | 10465 | (2.38 +/- 0.66)e8 | (2.38 +/- 0.66)e8 |
| 3 | 7425 | (1.72 +/- 0.44)e8 | (1.51 +/- 0.39)e8 |

Numbers are exposure-normalized true-recoil predicates, not detected counts.
The exactly-one predicate includes all energies above 5.4 keV and permits
additional smaller recoils. Such smaller deposits can still change S1/S2,
produce separate pulses, or alter selection. No actual acceptance is assigned.

Empirical errors retain importance weights and the sampled Xe outcome per
rock history. Effective sizes for these predicates are only about 13–15;
largest individual shares are 12–17%. Unsampled tails remain a limitation.
Neither run samples a 200–269.9 keV Xe recoil. JSON marks that result
unresolved and leaves its error null; it is not a zero prediction and does
not replace the earlier conditional high-energy integral.

This pilot shows that energy-updating transport and rejecting multiple
individual recoils above a diagnostic threshold do not automatically remove
the large low-energy population in this model. It does not establish an
experimental exclusion. Pulse response, real geometry, strong-Born validity
and the high-energy rare-event estimator remain unresolved. The candidate
also still lacks a supplied captured density and measurable local prediction.

The NPZ retains Xe recoil lists, final states, entry weights and the mapping
to original rock histories. JSON hashes both source and input archive and
records the normalization check. Per-history energy conservation agrees to
better than 1.5e-13 keV. Continue with a detector-response audit before any
claim that threshold predicates correspond to LZ single-scatter acceptance.
