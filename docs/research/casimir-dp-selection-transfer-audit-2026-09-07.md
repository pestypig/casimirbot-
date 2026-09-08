# Low-energy selection and veto-transfer audit — 2026-09-07

Exploratory S1 source audit. This addresses application of the conditional
36,000–38,000 low-single-collision bound coefficient to measured samples.
It does not apply an efficiency multiplier or claim experimental exclusion.

## Authenticated public information

Source: [LZ extended-window paper, Data Analysis and supplementary sections .1–.2](https://arxiv.org/html/2609.02823v1).
Retrieved September 7, 2026. The paper describes the predecessor search as
having >50% NR acceptance over 5.4–55 keV. Its extended-window Fig. S2 gives a
50% low-energy crossing at 5.4 keV. The quoted 96% average covers 14–250 keV,
not our 5.4–10-keV bound interval. The fiducial mass is 4.71 +/- 0.08 tonnes;
boundaries depend on position. Events are divided into science, prompt-veto,
and delayed-veto samples and fitted jointly. Signal/background rates are
related between samples by tagging parameters. The likelihood uses S1c and
log10(S2c). Random prompt/delayed veto coincidences are 0.01%/2.86% for unrelated
TPC signals. Those probabilities do not characterize a particle that itself
interacts in the veto systems.

## Consequences derived for our model

The publication rules out treating the low-energy region as generically blind.
It does not establish an event-by-event acceptance floor for an arbitrary
transported population. An energy-only efficiency averaged over a calibration
or signal distribution is not necessarily a lower bound over interaction
position, correlated activity, time, and reconstruction state.

Our slab bound counts one physical nuclear collision in its chosen xenon
column. It does not require a reconstructed vertex inside the actual fiducial
contour, or absence of energy deposits in surrounding volumes. Therefore
multiplying its estimated coefficient by 0.5 is not yet justified. Nor is the
large conditional rate rescued by asserting an arbitrary small efficiency.
Both operations would replace missing transport/response evidence with an
assumption chosen after seeing the result.

Veto activity is also not simply disappearance. A common scattering model
must predict where its events go among the three analysis samples. A signal
removed from the science sample can remain testable in the veto samples.
The paper's background tagging relations must not be copied unchanged onto
our particle model. Its recoil composition, times, and multiple interactions
can produce different sample rates and different observable shapes.

## Required common forward calculation

Let h denote the complete incoming-particle history through the apparatus,
including energy transfers, positions and times. For sample j and observables
x=(S1c, log10(S2c)), calculate

`d lambda_j / dx = exposure * integral dh [incident-history rate_theta(h) * R_j(x|h)]`.

Theta must be shared with the diamond calculation. The history rate includes
source normalization, overburden, and the microscopic interaction; R_j includes
reconstruction, fiducial selection, thresholds and veto categorization. Its
integral need not sum to one over the three retained samples: failed cuts are
an explicit fourth outcome. Define samples disjointly and conserve probability
including that outcome. Model-generated correlated veto activity belongs in h,
not in an independently fitted rejection factor.

To use the analytic inequality, first restrict its incident/vertex domain to
one supported by actual geometry. Then either evaluate response there, or
establish a minimum relevant acceptance over that entire restricted domain.
An energy-averaged efficiency does not meet that requirement. A candidate
should be rejected only through an authenticated event allowance or likelihood,
with the model's sample transfer and uncertainties included.

## Status and next discriminating input

The missing item is now precisely identified: position- and history-dependent
transfer into the analysis samples, rather than a generic claim of unknown
low-energy sensitivity. Prioritize actual geometry and sample transfer before
further tuning the high-energy raw count. No release tables were newly obtained
in this audit, and no published likelihood was reconstructed. The local
coherence population and Born-validity requirements remain unresolved.

Documentation validation is not a detector simulation or physics certificate.
