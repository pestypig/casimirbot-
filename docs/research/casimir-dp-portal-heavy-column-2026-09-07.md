# Heavy-contact column and stopping screen

Program gate: S1 — transport consistency.
Workstream: Known xenon-matched heavy component.
Capability or component: Elastic optical depth and leading stopping.
Current maturity: Conditional independent-nucleus column screen.
Target maturity: Separate calculable heavy attenuation from unresolved light transport.
Required frozen inputs: Authenticated CchiN and conditional xenon coefficient ceilings.
Required evidence: Nuclear normalization, column units and energy-transfer accounting.
Stop/fail criteria: No heavy-component transparency claimed for the full portal.
Explicit non-goals: Actual overburden reconstruction, light-medium response, captured population or experimental admission.
Downstream gate unlocked: Connected light-channel transport response; S1 remains open.

## Result

The matched heavy contact interaction cannot substantially attenuate the incident flux through the illustrative columns examined here. For 1 TeV dark matter and an A = 56 composition benchmark, its optical depth is 9.67e-20 through 0.29 g/cm2 and 2.33e-9 through 7e9 g/cm2. This result supports separating the heavy channel from the remaining light-sector transport question.

Even increasing C to the previous conditional xenon all-count ceiling leaves the largest optical depth among the 60 tested combinations at 4.7632e-4. That most extreme row uses A = 131, 1 TeV and the large column. This is not a precise Earth or LZ overburden calculation, and it does not bound electron, collective, inelastic or light-scalar channels.

## Model and columns

Use the same isoscalar scalar contact operator as the [xenon spectrum](casimir-dp-portal-contact-spectrum-2026-09-06.md), C = 1.8017705314e-10 GeV^-2. In the independent stationary-nucleus elastic model, setting the nuclear form factor to one gives

    sigma_A <= C^2 A^2 mu_chiA^2/pi,
    tau <= [Sigma/(A u)] sigma_A.

Sigma is mass per area, not volume density. The code uses u = 1.66053906892e-24 g and converts GeV^-2 to cm2. Nuclear masses are approximated by A times 0.93149410242 GeV. This is the same one-body scalar normalization, with a deliberately unsuppressed nuclear form factor; it is not a nuclear-QCD bound on every channel.

The light wall column 0.29 g/cm2 corresponds to a hypothetical 1 millimetre thickness at 2900 kg/m3. The large column 7e9 g/cm2 is an explicit stress benchmark only. It is not an authenticated trajectory through the Earth, a measured chamber inventory or an LZ site model. Compositions A = 12, 28, 56, 93 and 131 are separately tested pure-A approximations. Masses are 100, 200 and 1000 GeV. Couplings are the matched point and each mass's inherited conditional count ceiling, giving 60 rows.

The probability for at least one elastic collision is bounded by 1-exp(-tau). At these small optical depths, multiple scattering is negligible within this channel. The point-nucleus mean fractional kinetic-energy loss per collision is

    mean_loss_fraction = 2 mu_chiA^2/(mA mchi) <= 1/2.

Multiplying by tau gives the leading optically thin mean stopping fraction. A finite elastic nuclear form factor reduces the positive cross-section and energy-weighted integrals relative to this point-nucleus model; the same upper estimates are therefore conservative within that elastic approximation.

## Representative 1 TeV, A = 56 results

| C case | Column (g/cm2) | Optical depth upper | Leading mean energy-loss fraction upper |
|---|---:|---:|---:|
| Matched | 0.29 | 9.6723e-20 | 9.1151e-21 |
| Matched | 7e9 | 2.3347e-9 | 2.2002e-10 |
| Conditional Xe ceiling | 0.29 | 1.7530e-15 | 1.6520e-16 |
| Conditional Xe ceiling | 7e9 | 4.2314e-5 | 3.9877e-6 |

The coefficient ceiling retains its original assumptions: a nominal 50% acceptance floor and a conservative union-count screen, not the full LZ likelihood. Scaling this component to that ceiling does not establish a consistent full scalar model at the enlarged coefficient. The [JSON results](casimir-dp-portal-heavy-column-2026-09-07.json) include all rows and the exact Poisson probabilities.

## What remains in light transport

In a restored scalar medium the linear light vertex can vanish while the heavy contact and quadratic light vertices remain. Conversely, near an interface or in incompletely restored material, a nonzero background can permit light exchange. Neither regime is characterized by the heavy optical depth above.

For long-range scalar interactions, a smooth mean field and stochastic scattering from material fluctuations must also be distinguished. Treating every constituent's coherent forward amplitude as an independent random collision can double count the refraction already included in the background mass potential. A connected density response, along with the appropriate medium propagator and any quadratic-vertex channels, is needed for actual attenuation and energy transfer. Unknown material parameters must remain explicit rather than being absorbed into a fitted halo normalization.

The next transport task is therefore a medium-response/interaction audit for the light sector, with the known heavy component now quantitatively small under the specified columns. The apparatus force and trajectory requirements remain unresolved independently of particle transmission.

## Checks and status

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-heavy-column-2026-09-07.py`. Three consistency checks pass: all tested heavy optical depths are below 1e-3, per-collision mean fractional energy loss respects its kinematic bound, and collision probabilities do not exceed optical depths. These are limited checks of this component screen, not verification of all transport physics. The baseline and DP comparator are unchanged; S1 and the goal remain active.
