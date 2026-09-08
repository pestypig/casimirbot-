# Lower-recoil transport extension — 2026-09-07

Exploratory S1 calculation in the existing conditional silica slab. Frozen
apparatus and interaction inputs are unchanged. This is not a site model or
an accepted xenon spectrum.

The companion script extends the previous transport stopping rule from loss
of 200-keV xenon recoil capability to loss of 5.4-keV capability (98.77 km/s,
approximately). This diagnostic cutoff is not a hard detector threshold.
Particles stopped there are censored histories, not demonstrated captures.
The script hashes its weighted-transport dependency and retains collision
kinematics, termination checks, and likelihood weights. Exits are partitioned
into populations above and below the old capability cutoff.

## Results

At the reference strong-root coupling, 100,000 ordinary histories give forward
exit fraction 0.65083 +/- 0.00151 (sampling standard error). Of the incident
population, 0.40357 exits below the old speed cutoff and 0.24726 above it.
Thus the old termination removed substantial lower-energy transmitted flux.
The above-cut result agrees with the previous roughly 0.247 transport result;
no detector migration probability is inferred from this agreement.

At 3.9 times that coupling, two 500,000-history importance-sampling runs give
forward fractions 1.0031e-7 +/- 6.53e-9 and 8.4761e-8 +/- 4.44e-9. Their
above-old-cut fractions are 3.2347e-10 and 2.6474e-10. These preliminary
samples are dominated by lower-energy exits, but are not accuracy-qualified.

**Normalization diagnostic fails for the second proposal.** All-terminal
weight means should equal one for this fully supported, normalized proposal.
They are 0.8611 +/- 0.1234 and 0.7606 +/- 0.0462. The latter misses unity by
about 5.2 reported standard errors. This is evidence that estimated sampling
errors do not reliably cover the weight distribution in this regime; it is
not evidence that the interaction loses probability. Finite support is not
truncated by the positive proposal parameters. Rare large weights, or an
implementation issue not exposed by earlier controls, require investigation.
Do not pool these runs into a precise flux estimate or promote their apparent
agreement as convergence. Exit ESS values of 236 and 364 do not fix the
all-history normalization failure.

## Consequence and next action

The lower-energy extension is necessary, but detector folding must not hide
its sampling limitations. Next compare a mixture including the physical
sampling law, or independently stratify collision histories, and verify
normalization as well as the exit observables. Preserve the failed diagnostic
as evidence. Subsequent response work must also bound contributions below
5.4 keV rather than interpret this numerical cutoff as acceptance.

No coherence enhancement, accepted counts, exclusion, or measurable shared
parameter point is established. The local population-supply and experimental
background requirements remain independent prerequisites.
