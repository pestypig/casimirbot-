Program gate: G1 — real calibrated solar baseline
Workstream: structural-observation comparison design
Capability or component: BiSON-13 sound-speed and density comparison operator
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; source-bound comparison design only
Required frozen inputs: G1 acceptance-design v1, structural-source v1, tracked BiSON-13 Table 3, frozen MESA baseline design
Required evidence: numerical resolution/operator data, reference-model mapping, radial support and systematic-error policy
Stop/fail criteria: missing operator data, incompatible mode-set substitution, invented covariance, post-result support or tolerance changes
Explicit non-goals: stellar evolution, calibration admission, G2 admission, actuator feasibility, proof of solar lifetime extension
Downstream gate unlocked: none

# G1 structural comparison method decision v1

Status: `BLOCK_SOURCE_BINDING`; method routes defined, neither source-bound.
Date: September 19, 2026.

## What is already downloaded

The tracked [BiSON-13 Table 3](../../configs/research/controlled-stellar-composition-transport-g1-bison13-table3.v1.csv)
contains 37 absolute inferred sound-speed and density values, with separate
radial grids and marginal propagated-frequency errors. Its PDF/HTML cross-check
and hashes are recorded in the [source-validation packet](./controlled-stellar-composition-transport-g1-source-validation-v1.md).
This is real numerical observational material, not a fixture. It is also not
a set of 37 independent, exact-radius measurements of the solar interior.

[Basu et al. (2009), Section III](https://arxiv.org/html/0905.0651v2)
defines the inversion result as a localized *average* of a structural
perturbation. The reported radius is the averaging kernel's second quartile;
the first-to-third-quartile span describes its resolution. The paper shows
selected kernels but does not tabulate the complete per-row kernels in Table 3.
It uses BP04 as the main inversion reference, separate kernel pairs for sound
speed and density, and a surface-term treatment. Its density discussion also
identifies systematic differences between mode sets despite small quoted
statistical errors. Consequently, point interpolation of a new model onto
Table 3 radii is a **diagnostic visualization**, not the frozen G1 structural
acceptance operator.

[Vinyoles et al. (2017), Sections 3.1–3.2](https://arxiv.org/pdf/1611.09867)
performed fresh BiSON-13-based sound-speed inversions using each solar model
as the reference. Their error budget distinguishes frequency, inversion
parameter and reference-model effects; their model covariance is obtained
from model ensembles. They explicitly identify treating inversion errors at
different radii as uncorrelated as an assumption. Their numerical likelihood,
30-point selection, and model covariance cannot be transplanted unchanged to
our new MESA candidate, and that publication does not supply a density
acceptance product for this G1 design.

## Admissible routes to a comparison operator

| Route | Required source-bound material | Operator and checks |
| --- | --- | --- |
| A. Reproduce the published fixed-reference inversion | Full numerical BiSON-13 averaging and cross-term kernels or original inversion weights/mode kernels; BP04 structural profile; frequency-error propagation and surface-term conventions; density mass constraint; exact radius normalization and reliable support | Apply the published linearized operator to candidate-minus-BP04 structure, including cross-term and resolution effects. Reproduce the published Table 3 inference for a reference/known case before evaluating an unknown candidate. Quantify linearization and reference-model sensitivity. |
| B. Re-invert the observed frequencies | The exact BiSON-13 low-degree and matching MDI-1 higher-degree mode lists with errors and activity corrections; mode-identification and selection rules; inversion implementation, reference-model inputs and tuning rules | Freeze the SOLA/RLS procedure before candidate results; invert against each candidate or a declared model ensemble; retain resulting kernels, positions, widths, cross terms, covariance/error propagation and reference-model sensitivity. Compare both sound speed and density on a preregistered support. |

The [BiSON official results portal](https://bison.ph.bham.ac.uk/portal/results)
links a published 8640-day quiet-Sun frequency dataset. It is a potentially
useful *different* source, not an automatic substitute for the 4752-day
BiSON-13 mode set used in Basu et al. (2009). Likewise, a public MDI mode
catalog is not automatically the exact contemporaneous MDI-1 selection.
Either substitution requires a new observation-source version and an explicit
scientific review, not a silent replacement of this table's lineage.

## Error and decision policy to freeze before a model run

For either route, retain the separate sound-speed and density vectors, their
radial/window operators, frequency/statistical uncertainties, inversion
parameter sensitivity, reference-model sensitivity and model numerical error.
Declare whether these are bounded systematics or sampled distributions; do
not combine them in quadrature or manufacture a covariance without evidence.
Overlap of neighboring kernels means the 37 rows cannot be counted as 37
independent confirmations. The current G1 componentwise three-width rule is
only evaluable after the width definition and comparison space are frozen in
a **new** acceptance/source manifest version. No global p-value is authorized
by Table 3 alone.

Before unblocking structural admission, a reviewer must verify: (1) original
mode-set or kernel identity and hashes; (2) BP04/reference-radius and units
mapping; (3) numerical reproduction/closure of the selected operator;
(4) fixed radial support and exclusions; (5) both structural quantities;
(6) a systematic-error budget separate from Table 3 marginal errors; and
(7) a preregistered pass/fail rule. Missing any item retains
`BLOCK_SOURCE_BINDING`. A future model may be run for an explicitly labeled
engineering or exploratory purpose, but it cannot pass the complete G1
solar-calibration gate on a point-interpolation plot.

## Current disposition

No full kernel/weight product or exact re-inversion input bundle has been
bound in the repository. Targeted primary-paper and archive searches found
the Table 3 profile and methodological description, not a verified numerical
operator for all rows. A subsequent [public frequency-source audit](./controlled-stellar-composition-transport-g1-frequency-source-audit-v1.md)
found a retrievable 2024 solar-mode catalog and public inversion software,
but the catalog's updated mode set does not establish identity with the
2009 Table 3 inputs. This is a statement about **current binding**, not a
claim that the data do not exist. The next source task is to obtain an
author/archive kernel package for Route A, or a provenance-complete frequency
and inversion package for Route B. No external contact was made in this packet.
Until one route is source-bound and independently checked, the structural
manifest remains `BLOCK_SOURCE_BINDING`, `launchAllowed: false` and
`admissionAllowed: false`.
