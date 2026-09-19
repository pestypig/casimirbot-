Program gate: G1 — real calibrated solar baseline
Workstream: alternative seismic-source inventory
Capability or component: public mode-frequency and inversion-software route
Current maturity: reduced_order_diagnostic
Target maturity: reduced_order_diagnostic; candidate-source identification only
Required frozen inputs: G1 structural comparison method v1, structural-source v1, acceptance-design v1
Required evidence: source lineage, exact mode list and uncertainty semantics, reproducible inversion and kernel output
Stop/fail criteria: dataset identity mismatch, missing reference or kernel products, unreviewed replacement of BiSON-13 Table 3
Explicit non-goals: source replacement, model evolution, structural acceptance, G1 closure, external contact
Downstream gate unlocked: none

# G1 public frequency-source audit v1

Status: `CANDIDATE_FOUND_NOT_BOUND`; G1 remains `BLOCK_SOURCE_BINDING`.
Date: September 19, 2026.

The [Basu et al. (2009) BiSON-13 Table 3](https://arxiv.org/html/0905.0651v2)
already retained in the repository is an inferred sound-speed/density product.
This audit asks whether public *frequency* inputs could enable the separate
re-inversion route. It does not replace the Table 3 source or its frozen rule.

## Public candidate located

The [CDS/VizieR catalog J/A+A/681/A57 ReadMe](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/J/A%2BA/681/A57?format=html&tex=true)
identifies `dataset1.dat` as 2,186 global solar acoustic-mode frequencies with
degree, radial order, frequency and one-sigma frequency uncertainty. A
read-only VizieR `asu-tsv` query returned HTTP 200 and 2,186 numeric rows,
from `l=0, n=6, 972.6129 ± 0.002000 μHz` through an `l=250` row. This checks
that the numerical candidate is presently retrievable, not that its mode
lineage matches the frozen G1 source. No file was retained or hashed here.

[Buldgen et al. (2024), Section 2.1](https://arxiv.org/html/2308.13368)
states that its Dataset 1 combines the “optimal” Basu et al. (2009) dataset
with updated BiSON frequencies from Davies et al. (2014). The catalog also
lists a separate 2,156-frequency Dataset 2, but that second set was not
fetched in this audit. The 2024 Dataset 1 is therefore **not verified as the
exact BiSON-13/MDI-1 mode list** behind the 2009 Table 3. Its observed
frequencies must not be used to claim a reproduction of Table 3 or silently
replace the preregistered G1 observation source.

The [official InversionKit page](https://lira.obspm.fr/perso/daniel-reese/spaceinn/inversionkit/index.html)
offers source for a structural-inversion program, including version 2.2.
The maintainers warn that versions 1.0–1.3 contain structural-kernel errors,
corrected from 1.4 onward. The 2024 paper reports using InversionKit in an
*adapted configuration*; the public source alone does not bind that exact
configuration, the reference-model mode kernels, or a G1-ready uncertainty
and resolution product.

## Original-lineage checks

The [Basu et al. (2009) arXiv v2 source archive](https://arxiv.org/src/0905.0651v2)
was inspected in memory without extracting to the repository. Its 146,457-byte
gzip stream expands to a tar containing `ms.tex` and 18 PostScript figure
files, with no separate numerical frequency, inversion-weight or kernel data
file. The manuscript source and plotted curves are not a source-identical
numerical operator for all Table 3 rows. This archive check does not rule out
an independent author or observatory data deposit. The fetched archive's
SHA-256 was `aafcf6653c0b329e6796443cf621d87edf44fc6bf84920284e55a876b362742b`.

The original paper's Table 1 identifies BiSON-13 as 13-year,
asymmetric-profile, solar-cycle-corrected low-degree data and MDI-1 as the
Schou et al. 1998 set spanning `0 <= l <= 150`; its Section II describes
activity correction to the contemporaneous 360-day MDI interval. The
[Stanford JSOC MDI global-products catalog](http://jsoc.stanford.edu/MDI/MDI_Global.html)
does list archived `mdi.vw_V_sht_modes` and asymmetric-fit mode-product
series, with a 360-day processing path. This verifies an MDI archive route,
not the exact 1998 product revision or mode selection used in the Basu paper.
Later re-fits and updated products cannot be treated as byte-identical
historical inputs without a mode-by-mode identity check.

A [Bahcall BP2004 numerical model table](https://www.sns.ias.edu/~jnb/SNdata/Export/BP2004/bp2004stdmodel.dat)
is also public. Its header lists radius, density, pressure, temperature,
composition and luminosity, but not sound speed or `Gamma1`. The
[Basu paper's Table 2](https://arxiv.org/html/0905.0651v2) gives BP04's
radius, luminosity and composition conventions. This table is a possible
partial reference-model source; its identity with the exact inversion input
and the missing pulsation/EOS quantities still require verification. It is
not a substitute for the inversion kernels or frequencies. The fetched
132,540-byte table's SHA-256 was
`91916dea000579d0982fba8ee2d4ef599e0e5603413de6975e5994a9d4ac245a`;
it was inspected in memory, not retained as an accepted reference artifact.

## Source decision

| Question | Current answer |
| --- | --- |
| Are numerical solar frequencies publicly reachable? | Yes: 2,186 Dataset 1 rows were returned by CDS/VizieR. |
| Are they proven to be the exact 2009 BiSON-13 inversion inputs? | No: the 2024 paper explicitly incorporates 2014 updates. |
| Is a structural-inversion implementation publicly available? | Yes, but its validated configuration and required model kernels are not bound here. |
| Is a partial BP04 reference table publicly available? | Yes, but sound speed and `Gamma1` are not columns, and exact inversion-reference identity is unverified. |
| Can this unblock G1 structural acceptance now? | No. `comparisonOperator` remains null. |

## Next admissible work

First seek the original 2009 BiSON-13/MDI-1 mode bundle or full numerical
averaging/cross-term kernels from an authoritative archive or the authors.
An information request should name the 4752-day BiSON epoch, the solar-cycle
corrected frequencies and propagated uncertainties, the specific MDI-1
360-day mode table and selection, the BP04 reference profile, SOLA weights or
all averaging/cross-term kernels for the 37 Table 3 rows, and any retained
inversion-parameter, reference-model and inter-radius error diagnostics.
After this audit, an edited version of the
[author inquiry draft](./controlled-stellar-composition-transport-g1-author-data-request-draft-v1.md)
was sent on September 19, 2026 (Gmail message/thread ID
`1a0baab29db8a967`; `SENT`). No reply or source binding is recorded here.
If those cannot be obtained, the public 2024 frequency set provides a
plausible *new* observation lineage for Route B, but selecting it requires a
versioned source/acceptance redesign **before** evaluating candidate stellar
models. That redesign must retain both sound-speed and density constraints,
specify mode/reference identities and radial support, reproduce known
inversion behavior, and freeze systematic-error and numerical-resolution
rules. Discovery of public files alone does not satisfy any of those checks.

No model, inversion, download-to-repository, or external contact occurred in
this audit. The subsequent author inquiry is recorded above. Launch and
admission remain disabled.
