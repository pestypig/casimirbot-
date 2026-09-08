# Speed-dependent xenon opacity diagnostic

Exploratory S1 audit, September 7, 2026. The large raw lower-energy spectrum
requires a detector-transport check before interpreting counts.

Retain the previous diagnostic path column of 300 g/cm², natural Xe isotope
weights, 100 GeV incident mass, 10 MeV mediator and cross-section multiplier
3.9 times the old strong root. Integrate the inherited Born cross section
over all kinematically allowed nuclear recoils. Optical depth is the nuclear
number column times this total cross section.

| Speed, km/s | Helm optical depth | Fixed-speed probability of at least two scatters |
| --- | --- | --- |
| 42.51 | 59.86 | approximately 1 |
| 98.77 | 14.24 | 0.999990 |
| 150 | 6.354 | 0.9872 |
| 250 | 2.306 | 0.6706 |
| 400 | 0.9014 | 0.2280 |
| 601.12 | 0.3991 | 0.0613 |
| 776 | 0.2395 | 0.02449 |

The Poisson diagnostic uses P>=2=1-exp(-tau)(1+tau), assuming a straight path
and fixed speed. Real collisions change energy and direction. The numbers
are not multiple-S2 classification efficiencies: subthreshold scatters and
unresolved positions must be distinguished from resolvable extra pulses.
The chosen column is not an authenticated distribution of LZ chords.

The slow population is not optically thin in this column. Consequently the
preceding 4.6e8–8.5e8 raw low-energy integrals cannot be promoted to selected
single-scatter counts or an experimental exclusion. This does not rescue
the candidate: the actual low-energy selection and surviving high-energy
probability remain to be computed together. A single constant acceptance
cannot supply the missing energy-dependent transport.

Next prerequisite: propagate the saved incident histories through an explicit
xenon geometry, recording individual recoil energies and locations, then
apply authenticated pulse-resolution and selection rules. Preserve the
strong-Born validity limitation and do not retune the coupling to the lone
high-energy candidate. Captured density and local measurability are still
unresolved independently of this detector issue.

The script/JSON preserve the source hash, column and cross-section scale.
Point-charge integrals agree with their independent analytic form within
1e-8, and every Helm integral is below its point-charge counterpart. These
checks verify the conditional calculation, not the strong interaction's
physical validity or a full detector model.
