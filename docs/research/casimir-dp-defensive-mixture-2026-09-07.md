# Bounded-weight transport mixture — 2026-09-07

Exploratory S1 numerical-method evidence. This follows the failed normalization
diagnostic in the lower-recoil transport packet. It does not change the frozen
apparatus, microscopic interaction, chosen slab, or local population budget.

## Estimator

Let P be the physical stopped-history distribution and Q the biased history
proposal already implemented. Draw equal fixed numbers independently from P
and Q. For both groups use w = P/(P/2 + Q/2). If the earlier likelihood log
ratio is l = log(P/Q), compute w = 2 exp[-logaddexp(0,-l)]. Consequently
0 <= w <= 2. Average the two component means; their independent variances
combine with a factor of one quarter. Component means need not equal one.
Only their pooled all-history mean must equal one in expectation.

The companion script evaluates the same Q likelihood along both ordinary and
biased histories, including terminal free flights. Changing the sampling law
does not change that likelihood evaluation. It pins the earlier weighted
source hash, checks replacement identities, retains kinematics and termination,
and asserts bounded weights. The stop remains loss of 5.4-keV xenon capability;
this is a numerical cutoff, not detector acceptance or gravitational capture.

## Executed evidence

Two ordinary 100,000-history control groups reproduce a forward exit fraction
0.65272 +/- 0.00106 at the reference strong-root coupling. Normalization is
exactly one because P=Q in this control.

At 3.9 times the reference coupling, each mixture uses 500,000 ordinary and
500,000 biased histories:

| Proposal rate/recoil bias | Pooled normalization | Forward fraction | Above old 200-keV capability |
| --- | --- | --- | --- |
| 0.70 / 0.50 | 0.999946 +/- 0.000219 | (1.1081 +/- 0.1325)e-7 | (2.7694 +/- 0.2046)e-10 |
| 0.65 / 0.60 | 1.000093 +/- 0.000242 | (1.3470 +/- 0.2047)e-7 | (3.5960 +/- 0.7638)e-10 |

Errors are empirical sampling standard errors, not confidence guarantees or
physical uncertainty bands. Normalization residuals are 0.25 and 0.38 such
errors. This supports the diagnosis that the earlier all-history failure was
poor weight-tail coverage; it does not independently prove every transport
implementation detail.

The ordinary components observe no exits at the stronger coupling. Their
reported zero sample variance is not proof of zero exit probability or a
useful rare-event uncertainty bound. Exit estimates come from the biased
components. Their exit ESS values are only 70 and 43; in the second run one
history carries about 13.4% of exit weight. Bounded absolute weights protect
normalization but do not ensure small relative error for a probability near
1e-7. Neither agreement of the two estimates nor normalization qualifies the
rare spectrum as converged.

## Interpretation and next dependency

The earlier failure is mitigated for total probability without silently
renormalizing samples. The evidence still suggests predominantly lower-energy
transmission in this conditional model. A physical spectrum comparison needs
energy-resolved variance control, not only a total exit estimate. Preserve
these mixtures as a control while accumulating energy-bin diagnostics or
using independently checked splitting/stratification. Detector folding must
also address censored lower-energy histories and authenticated LZ response.

No accepted xenon counts, fitted shared cause, experimental exclusion, or
measurable local coherence prediction follows from this method check.
