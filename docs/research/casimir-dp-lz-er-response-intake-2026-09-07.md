# LZ electron-recoil response intake — 2026-09-07

Exploratory source intake. The measurable-in-both goal remains active.

## Recovered inputs

The [primary paper](https://arxiv.org/html/2609.02823v1), detector description
and Tables S3–S4, supplies these numerical analysis settings:

- g1 = 0.110 ± 0.002 phd/photon; g2 = 34.5 ± 1.1 phd/electron.
- ER mean parameters m1 through m10: 12.31, 84.91, 0.5707, 2.804,
  34.04, 0, 82.57, 4.557, 0.2207, 0.1272.
- ER fluctuation tuples (A, mu, sigma, alpha):
  (0.03174, 2.588, 0.3627, -0.3583) and
  (0.06211, 5.2, 1.359, -2.599).

Equation 4 evaluates the sum of two skew-Gaussian terms at log10(total
quanta). These are ER settings; they do not replace the NR response mapping.
The table's default-field heading alone does not authenticate the analysis's
full field configuration. Gain errors alone do not specify response covariance.

## Consequence for the shared-model search

Some calibration inputs are public even though the complete analysis response
has not been imported. A new interaction must pass three separate conditions:
produce detectable coherence loss with the frozen apparatus and a stated
population budget; predict a compatible xenon spectrum with that same
parameter set; and survive external constraints. Matching one high-energy
count is insufficient. ER backgrounds and ER signals require their own
calibrated response when evaluating that spectrum.

Next dependency: authenticate these settings against the pinned NEST source
and the analysis wrapper, then obtain selection and nuisance information.
Existing transport histories also need extension below the true-energy
stopping threshold before reconstructed-energy migration can be evaluated.
Do not turn the quoted event energy uncertainty into an assumed Gaussian
kernel. This intake supplies no simulated acceptance, likelihood, exclusion,
or measurable shared-model point.

The previously evaluated 300 MeV benchmark stays low priority: its covered
material contributions do not approach the forecast coherence comparator.
A new candidate should first demonstrate a defensible route to measurable
coherence before receiving a detailed LZ response calculation.
