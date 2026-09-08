Program gate: S1 — common-interaction screening.
Workstream: Cross-model prediction review and prioritization.
Capability or component: Local-to-xenon comparison and next model-completion target.
Current maturity: Conditional component predictions; no admitted complete model.
Target maturity: Evidence-based priority with explicit alternative outcomes.
Required frozen inputs: Archived axion assembly and absorption source-form outputs; canonical apparatus.
Required evidence: Same parameters for both targets, response scope and normalization checks.
Stop/fail criteria: No fit to one candidate, no partial-response bound promoted to full material response.
Explicit non-goals: No new coupling tuning, detector exclusion, mechanics assumption or goal completion.
Downstream gate unlocked: None; prioritize missing model evidence while S1 remains open.

# Shared-ratio review after absorption response work

The preceding turn made progress by locating transport references and specifying the response needed to test the conditional KamLAND acceptance ceiling. No verified response matrix is currently available from the inspected sources. The overall goal can continue through the other model-completion work.

## Comparison independent of a common rate normalization

For each archived parameter row define Rupper=Dupper/NXe, where NXe is expected raw xenon counts in 2.84 t yr and Dupper is that calculation's conditional local upper estimate over the canonical hold. The xenon counts use the studied wide recoil window; all exclusive absorption lines in these rows fall inside it. This is a comparison of upper estimates, not an exact decoherence forecast.

| Component model | Rows inspected | Range of Rupper |
|---|---:|---:|
| Axion portal plus assembled scalar subsets | 48 | 3.5673e-30 to 2.7499e-29 |
| Exclusive nuclear absorption | 6 | 1.8232e-26 to 2.7545e-25 |

The ranges span chosen halo, portal and response prescriptions, not confidence intervals. The axion calculation assumes independent free nuclei and incomplete scalar matching. The absorption ratio excludes nuclear breakup and full solid response. No sum of the rows supplies an all-channel bound.

If both rates multiply by a common positive factor x, their ratio is unchanged. This statement is algebraic. It does not assert that varying one UV parameter multiplies every diagram identically, or that arbitrary x remains within Born, transport and perturbative validity. In particular an axion portal-quartic change affects scalar and spin contributions differently; those changes are handled by the separate archived rows, not by treating the quartic as a universal scale.

The normalized upper estimates remain tiny even for one expected raw xenon event. That wording is a unit comparison, not a fit to the observed candidate. No assumption NXe=1 is made in the calculations. It follows that merely changing a common normalization cannot create a favorable local-to-xenon relationship within these response assumptions. Large extrapolations to the DP comparator would leave model validity unchecked and are not performed.

## Current model decisions

1. **Axion reference:** retain as the concrete small-local-signal candidate. Next substantive target is closing its finite-momentum scalar matching, hard gluon terms and counterterm specification at a justified common scale. The assembled subset is not the finished UV model. Detector likelihood and material response remain necessary afterward.
2. **Absorption:** retain the calculated spectra and conditional KamLAND acceptance requirement as a constraint/discriminator branch. Additional progress now requires a qualified full final-state detector response or a genuinely independent external constraint; more arithmetic on the same acceptance ceiling will not establish exclusion.
3. **Extended scalar field:** retain as the route that could change boundary-dependent local behavior. Actual branch dynamics/confinement and medium response are prerequisites. The unreported trap specification is not replaced by the apparatus switching or RF frequencies, and no percent-level result is admitted.
4. **Neutrino and seasonal alternatives:** keep the escaped-particle suppression and timing/free-carbon null results as competing diagnostics. They do not inherit a local positive signal from their xenon motivation.

Two distinct research outcomes remain possible: a satisfactory shared interaction may predict an inaccessible local signal, or a different admissible mechanism may predict a measurable effect. The user has been invited to indicate which review emphasis is more useful; neither outcome is presumed experimentally established. Until that preference arrives, the concrete axion reference remains the default completion target, consistent with the existing work program.

For every homogeneous multiplicative scattering model, the canonical four-cell cancellation under unchanged histories remains decisive: absolute D is not automatically a boundary-dependent residual. A measured dependence on boundary controls would therefore require a modeled change in the interaction, medium, trajectories or ordinary apparatus backgrounds before being attributed to one of these mechanisms.

The [script](casimir-dp-shared-ratio-review-2026-09-07.py) and [JSON](casimir-dp-shared-ratio-review-2026-09-07.json) hash-check both archives and inspect all 54 rows. Three checks pass: positive ratios, recovery of parent upper estimates, and cancellation of a common rate scale. `npm run validate:physics:root-leaf` passes. These are comparison checks, not new nuclear or detector validation. The user-requested goal remains active and S1 is not promoted.
