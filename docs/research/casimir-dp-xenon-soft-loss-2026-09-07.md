# Soft collisions versus resolvable recoils

Exploratory S1 diagnostic, September 7, 2026. Same 300 g/cm² Xe column,
100 GeV particle, 10 MeV mediator and scale 3.9 as the opacity audit.

Total opacity is not a multiple-pulse efficiency. The inherited Helm/Born
cross section gives the following initial-speed moments:

| Speed, km/s | Total optical depth | Depth above 5.4 keV | Initial-speed loss / incident kinetic energy |
| --- | --- | --- | --- |
| 98.77 | 14.24 | 0 | 1.864 |
| 150 | 6.354 | 0.1795 | 0.4632 |
| 250 | 2.306 | 0.08364 | 0.06995 |
| 400 | 0.9014 | 0.03311 | 0.01088 |
| 601.12 | 0.3991 | 0.01466 | 0.002136 |
| 776 | 0.2395 | 0.008800 | 0.0007690 |

Thresholds of 1, 5.4, 14 and 50 keV are bookkeeping cuts on individual true
nuclear recoil energy. They are not asserted LZ pulse thresholds, efficiencies
or discrimination boundaries. The script verifies monotonically decreasing
integrals as the threshold rises and records all threshold coefficients.

At 150 km/s, most physical collisions are below the 5.4 keV diagnostic cut.
Counting every collision as a vetoed multiple scatter would therefore be
unjustified. Multiple individually small recoils could also combine into
detectable light or charge; pulse timing and position must be modeled.

At 98.77 km/s, the initial-speed first moment predicts 10.12 keV loss while
the incident kinetic energy is only 5.428 keV. This is not a physical energy
loss prediction: it demonstrates failure of holding speed fixed across the
column. At 150 km/s the moment is already 46% of the incident energy.

The required next kernel must update energy and direction after each
collision and retain the recoil list for selection. Neither exp(-total tau)
as a universal acceptance nor a thin-target low-energy count solves that
problem. These diagnostics do not rescue or exclude the candidate, supply
captured density, or establish local measurability. They specify why the
detector propagation must be completed before interpreting its spectrum.

Python and JSON preserve the inherited source hash and explicit assumptions.
No experimental threshold or detector-response calibration is added here.
