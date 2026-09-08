# Casimir–DP / xenon: detector-efficiency and atomic-data audit

Date: 2026-09-06 America/New_York; retrieval receipts use UTC (2026-09-07).

Status: conditional research diagnostic. No new experimental evidence, likelihood fit, updated xenon RDF calculation, physical-admissibility claim, or change to the frozen candidate.

## Result

The frozen 100-nm white-noise Diósi model still predicts an extremely weak xenon radiation companion. Weighting the existing atomic spectrum with an authenticated historical XENONnT efficiency table gives **1.01363 × 10⁻⁵ per tonne-year** between 1 and 29.87665 keV, assuming reconstructed energy equals emitted photon energy. This is 80.58% of the emitted count in that same band. It is a limited response diagnostic, not the 2026 collaboration analysis.

An independent upper envelope limits the entire additive-atom model to **2.85425 × 10⁻⁴ emitted photons per tonne-year in 1–140 keV**, at the same smearing length and noise normalization. Atomic refinements alone cannot turn this branch into an appreciable event rate. This conclusion does not cover a new medium-wide coherent-emission mechanism, changed noise spectrum, changed coupling, or changed smearing length.

The original LZ anomaly concerns a nuclear-recoil-like event; these calculations concern emitted photons and predominantly electronic energy deposition. They supply a cross-experiment test of a specified collapse generator, not an identification of the LZ interaction. The originating LZ paper does not establish dark-matter detection. See the [LZ analysis](https://arxiv.org/html/2609.02823v1) and the separate mechanism-bridge packet below.

## Inputs and reproducibility

Canonical local inputs remain `docs/research/casimir-dp-quantum-foam-study.md` and `configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json`. This packet inherits the source-emission calculation and constants from `docs/research/casimir-dp-xenon-constituent-radiation-diagnostics-2026-09-06.json`; it does not refit them.

The [official XENONnT public release](https://zenodo.org/records/7992017) provides a ZIP archive with reconstructed-energy efficiency, selected 1–30-keV data, and a best-fit background table. Its readme identifies the efficiency as total efficiency versus reconstructed recoil energy. The archive has no full response matrix or complete 1–140-keV likelihood. The [later collapse analysis](https://arxiv.org/html/2506.05507v2) includes updated selection/event-building efficiency and background treatment; its reported efficiency correction changes the DP result by about 6%. We therefore do not substitute the older release for that analysis.

Saved inputs are under `docs/research/casimir-dp-xenon-response-inputs-2026-09-06/`:

- Original `xenonnt-2022-public-data.zip`, retaining the collaboration readme.
- Exact `efficiency.txt` and `readme.txt` members, without table edits.
- `provenance.json`, containing URLs, retrieval time, publisher checksum, independent hashes, and availability observations.

Archive publisher MD5 and local MD5 both equal `fab7d9ea3e9b3a2d8ba837554d3bf315`; SHA-256 is `589d80b3f2606a9e1d9d1b54d5d5e760308e9aa98bdaec90e498814b1703d920`. Hash agreement verifies downloaded bytes against the publisher's checksum; it is not a physics certificate.

## What the efficiency calculation does

Let s(E) denote the emitted photon spectrum in photons/(tonne-year keV). The calculation evaluates

\[
I_{\rm diagnostic}=\int_1^{29.8766547} s(E)\,\epsilon_{2022}(E)\,dE.
\]

This sets E_rec = E_photon, assumes full energy deposition, and permits at most one selected event per source photon. A real prediction requires photon transport/escape and an energy-response kernel. In general,

\[
N_A=T\int dE\,s(E)\int_A dE_{\rm rec}\,
P(E_{\rm rec}\mid E)\epsilon(E_{\rm rec}),
\]

where T is exposure in tonne-years, the response has units keV⁻¹ and integrates to at most one, and 0 ≤ ε ≤ 1. The source rate and the response must describe compatible geometry and fiducial mass.

| Quantity | Value |
|---|---:|
| Published efficiency rows | 787 |
| Actual table coverage | 0.1–29.8766547178 keV |
| Calculation coverage, without extrapolation | 1–29.8766547178 keV |
| Emitted photons in calculation band / tonne-year | 1.2579307970 × 10⁻⁵ |
| Historical-efficiency-weighted diagnostic / tonne-year | 1.0136297725 × 10⁻⁵ |
| Weighted / emitted in the same band | 0.8057913638 |
| Existing source model, emitted 1–140 keV / tonne-year | 3.3521378075 × 10⁻⁵ |
| Atomic upper envelope, emitted 1–140 keV / tonne-year | 2.8542490757 × 10⁻⁴ |

Interpolation is piecewise linear. Simpson integration is split at every efficiency knot; doubling the subdivisions changes the weighted integral by 8.01 × 10⁻¹⁴ relatively. This checks numerical integration, not response accuracy.

The response expression gives a useful inequality: the accepted contribution from photons originating in a specified true-energy band cannot exceed the emitted population of that band. Energy migration can move photons into a reconstructed-energy window, but cannot multiply their total count under the one-event assumption. The 1–140-keV envelope does **not** bound contributions from source photons outside that band, external material, or multiple-event processes omitted here.

## New atomic data: accessible theory, unavailable numerical release

The [August atomic-correlation preprint](https://arxiv.org/html/2608.07205v1) uses isolated-atom radial distributions and neglects medium correlations. Its particle-density approximation also omits exchange/Coulomb correlations. Its advertised [data record](https://doi.org/10.5281/zenodo.21234978) reports restricted access and exposes no files through the public API; its [code URL](https://github.com/simonemanti/collapse) returned 404, as did the repository API. These observations do not establish why access is unavailable.

The same paper defines electron radial and ordered-pair distributions normalized to N_e and N_e(N_e−1). Equation 39 requires clarification of its summation convention: an extra factor two with unrestricted orbital indices would conflict with that normalization. This is an implementation ambiguity, not an asserted correction to the authors. Its hydrogenic pair-distance example provides an accessible independent fixture:

\[
p(r)=\frac{r^2}{6}(3+6r+4r^2)e^{-2r},\qquad
\int p(r)dr=1,\quad \langle r\rangle=35/16.
\]

Here r is in atomic units. Numerical integration reproduces both identities. This fixture is not a replacement xenon RDF.

Our ingestion contract, derived from counting distinct ordered electron pairs, is

\[
P(r)=\sum_a n_a(n_a-1)p_{aa}(r)
+2\sum_{a<b} n_an_bp_{ab}(r),\quad \int p_{ab}(r)dr=1.
\]

For the inherited xenon occupations this gives 310 same-orbital and 2,552 cross-orbital ordered pairs, totaling 2,862 = 54 × 53. Combining the self, nuclear–electron, and electron-pair terms gives the formal neutral-charge cancellation 54² + 54 − 2·54² + 2,862 = 0 when all pair kernels equal one. This is an algebraic check, not a claim that the semiclassical spectrum is valid down to zero energy at fixed smearing length.

An authenticated Xe table must satisfy these normalization and multiplicity checks before replacing the clamped-distance approximation. The newer atomic paper does not by itself supply a liquid-xenon calculation.

## Why atomic corrections have limited room here

This is our bound within the inherited additive-atom emission model. The dimensionless charge structure is a sum of ordered terms z_i z_j K_ij. For the Gaussian/sinc DP kernel, |K_ij| ≤ 1; averaging over normalized nonnegative pair distributions preserves that bound. Xenon has 54 proton charges and 54 electron charges, so

\[
|S(E)|\le\left(\sum_i|z_i|\right)^2=108^2=11,664.
\]

Using the inherited positive emission prefactor and integrating 1/E gives the envelope in the table. It is only 8.5147 times the clamped-distance integrated prediction. Within these assumptions, uncertainty about atomic radii and their distributions cannot bridge orders of magnitude to an order-one event per tonne-year. Correlations between different atoms introduce additional terms and need their own derivation; this bound must not be presented as covering them.

## Consequences for the bridge research

1. **Radiation branch:** retain as a consistency calculation for the frozen white-noise DP generator. It presently offers no plausible count-level explanation of the LZ nuclear-recoil-like anomaly. Do not retune R0 to the anomaly and then call that a prediction of the existing proposal.
2. **Scattering branch:** this remains a separate lead requiring a specified dark-sector interaction, its nuclear/electron couplings, and a common momentum-transfer distribution for xenon recoils and local decoherence. The first bridge packet identified the xenon/carbon endothermic-threshold mismatch. An event-fitting coupling cannot be inferred from this radiation calculation.
3. **Coherence branch:** the local experiment probes the low-frequency noise and spatial mass distribution. A xenon radiation comparison probes a different spectral regime. A colored-noise extension must specify one spectrum across both regimes; gravity's presence in the apparatus does not identify that spectrum or its physical origin.
4. **Next input needed:** for a numerical RDF update, obtain an openly released or otherwise authorized Xe distribution and resolve pair-count conventions. For a detector inference, obtain the applicable response, efficiency, background/nuisance model and likelihood. The historical efficiency table alone does not support a new confidence limit.

No author contact, access request, or external message was sent. These missing inputs limit the possible inference; they do not prevent the bounded audit above.

## Verification and replay

Run from the canonical repository root:

```text
python docs/research/casimir-dp-xenon-response-rdf-replay-2026-09-06.py
```

The offline replay writes only `docs/research/casimir-dp-xenon-response-rdf-diagnostics-2026-09-06.json`. All 12 checks passed: publisher checksum, efficiency ordering/range/interpolation, count inequalities, quadrature convergence, source-model replay, hydrogenic normalization/mean, xenon pair count, formal neutrality and frozen-configuration hash. The source and input hashes are recorded in that JSON.

Atlas build/why/upstream trace completed before additions; `npm run validate:physics:root-leaf` passed afterward. This packet adds research documentation, an offline numerical diagnostic and source data; it does not alter runtime physics, adapter contracts, constraints, certificate semantics or candidate maturity. No server Casimir verification was run, and no certificate or physical verification is claimed.

Related packets:

- `docs/research/casimir-dp-lz-mechanism-bridge-research-2026-09-06.md`
- `docs/research/casimir-dp-xenon-constituent-radiation-followup-2026-09-06.md`
