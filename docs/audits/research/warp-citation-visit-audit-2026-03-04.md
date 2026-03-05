# Warp Citation Visit Audit (2026-03-04)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope
- Citation source set: `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`
- Source IDs covered: `SRC-001` to `SRC-065`

## Method
- `range_get`: direct URL visit with redirect-following and byte-range fetch (content-type/status captured).
- `doi_metadata`: DOI transform request (`Accept: application/vnd.citationstyles.csl+json`) used when publisher pages block raw fetch.
- `repo_local`: commit-tracked local file readability check.
- Visit artifacts: `tmp/source_visit/citation-visit-results-recovered.csv` and `tmp/source_visit/citation-visit-results-recovered.json`

## Result Summary
- total_sources: 65
- visited_yes: 65
- blocked_or_error: 0
- direct_content_visits(range_get): 60
- doi_metadata_fallback_visits: 4
- local_repo_visits: 1

## Per-Source Visit Matrix

| source_id | source_class | visit_method | http_code | visited | effective_url |
|---|---|---|---:|---|---|
| SRC-001 | standard | range_get | 200 | yes | https://www.asme.org/codes-standards/find-codes-standards/assessing-credibility-of-computational-modeling-through-verification-and-validation-application-to-medical-devices |
| SRC-002 | standard | range_get | 200 | yes | https://www.asme.org/codes-standards/find-codes-standards/verification-validation-and-uncertainty-quantification-terminology-in-computational-modeling-and-simulation |
| SRC-003 | standard | range_get | 200 | yes | https://www.asme.org/codes-standards/publications-information/verification-validation-uncertainty |
| SRC-004 | standard | range_get | 200 | yes | https://standards.nasa.gov/standard/nasa/nasa-std-7009 |
| SRC-005 | standard | range_get | 200 | yes | https://www.bipm.org/documents/20126/2071204/JCGM_100_2008_E.pdf |
| SRC-006 | standard | range_get | 200 | yes | https://www.bipm.org/documents/20126/2071204/JCGM_101_2008_E.pdf |
| SRC-007 | primary | range_get | 200 | yes | https://journals.aps.org/prd/abstract/10.1103/PhysRevD.53.5496 |
| SRC-008 | primary | range_get | 200 | yes | https://journals.aps.org/prd/abstract/10.1103/PhysRevD.58.084010 |
| SRC-009 | primary | range_get | 200 | yes | https://journals.aps.org/prd/abstract/10.1103/PhysRevD.17.1477 |
| SRC-010 | primary | range_get | 200 | yes | https://journals.aps.org/prd/abstract/10.1103/PhysRevD.109.104056 |
| SRC-011 | primary | range_get | 200 | yes | https://link.springer.com/article/10.1007/s10714-025-03352-x |
| SRC-012 | primary | range_get | 200 | yes | https://www.cambridge.org/core/books/quantum-fields-in-curved-space/95376B0CAD78EE767FCD6205F8327F4C |
| SRC-013 | primary | range_get | 206 | yes | https://press.uchicago.edu/ucp/books/book/chicago/Q/bo3684008.html |
| SRC-014 | preprint | range_get | 206 | yes | https://arxiv.org/abs/2406.01498 |
| SRC-015 | preprint | range_get | 206 | yes | https://arxiv.org/abs/2512.17789 |
| SRC-016 | primary | range_get | 200 | yes | https://www.nature.com/articles/nature07610?error=cookies_not_supported&code=d38fd730-dd1c-4f3a-b1ae-09d698d50011 |
| SRC-017 | primary | doi_metadata | 200 | yes | https://api.crossref.org/v1/works/10.1016%2Fj.physleta.2024.130162/transform |
| SRC-018 | preprint | range_get | 206 | yes | https://arxiv.org/abs/2601.00483 |
| SRC-019 | secondary | doi_metadata | 200 | yes | https://api.crossref.org/v1/works/10.1063%2F5.0218274/transform |
| SRC-020 | secondary | range_get | 200 | yes | https://journals.aps.org/ |
| SRC-021 | primary | range_get | 200 | yes | https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.119.264801 |
| SRC-022 | primary | range_get | 200 | yes | https://journals.aps.org/prab/abstract/10.1103/PhysRevSTAB.17.012001 |
| SRC-023 | primary | range_get | 200 | yes | https://iopscience.iop.org/article/10.1088/0953-2048/26/10/102001 |
| SRC-024 | secondary | range_get | 206 | yes | https://epaper.kek.jp/ipac2023/ |
| SRC-025 | secondary | range_get | 200 | yes | https://en.wikipedia.org/wiki/Microwave_cavity |
| SRC-026 | secondary | range_get | 200 | yes | https://en.wikipedia.org/wiki/Superconducting_radio_frequency |
| SRC-027 | secondary | range_get | 200 | yes | https://www.researchgate.net/publication/252864445_The_Q_disease''_in_Superconducting_Niobium_RF_Cavities |
| SRC-028 | secondary | range_get | 206 | yes | https://proceedings.jacow.org/IPAC2012/papers/weppc002.pdf |
| SRC-029 | standard | range_get | 200 | yes | https://ieeexplore.ieee.org/document/9120376/ |
| SRC-030 | primary | range_get | 200 | yes | https://ieeexplore.ieee.org/document/5340196/ |
| SRC-031 | primary | doi_metadata | 200 | yes | https://api.crossref.org/v1/works/10.1016%2Fj.nima.2012.12.096/transform |
| SRC-032 | preprint | range_get | 206 | yes | https://arxiv.org/abs/2511.23254 |
| SRC-033 | secondary | range_get | 200 | yes | https://en.wikipedia.org/wiki/White_Rabbit_Project |
| SRC-034 | secondary | range_get | 200 | yes | https://www.white-rabbit.tech/ieee1588-standard/ |
| SRC-035 | standard | range_get | 206 | yes | https://www.nist.gov/publications/comparison-and-uncertainties-standards-cd-afm-microscope-tip-width-calibration |
| SRC-036 | primary | range_get | 206 | yes | https://nvlpubs.nist.gov/nistpubs/jres/102/4/j24vil.pdf |
| SRC-037 | primary | range_get | 200 | yes | https://pmc.ncbi.nlm.nih.gov/articles/PMC9813222/ |
| SRC-038 | primary | range_get | 200 | yes | https://pmc.ncbi.nlm.nih.gov/articles/PMC9951250/ |
| SRC-039 | primary | range_get | 206 | yes | https://arxiv.org/abs/1604.00601 |
| SRC-040 | standard | range_get | 200 | yes | https://www.iso.org/standard/66235.html |
| SRC-041 | primary | range_get | 206 | yes | https://nvlpubs.nist.gov/nistpubs/jres/099/jresv99n2p191_a1b.pdf |
| SRC-042 | preprint | range_get | 206 | yes | https://arxiv.org/abs/1812.09157 |
| SRC-043 | standard | range_get | 200 | yes | https://www.iso.org/standard/56237.html |
| SRC-044 | standard | range_get | 200 | yes | https://www.iso.org/standard/66235.html |
| SRC-045 | primary | range_get | 206 | yes | https://www.nist.gov/publications/measurement-and-uncertainty-calibration-standard-sem |
| SRC-046 | primary | range_get | 206 | yes | https://www.nist.gov/publications/procedure-calibrating-magnification-scanning-electron-microscope-using-nbs-srm-484 |
| SRC-047 | primary | range_get | 206 | yes | https://www.nist.gov/publications/high-accuracy-critical-dimension-metrology-using-scanning-electron-microscope |
| SRC-048 | primary | range_get | 206 | yes | https://www.nist.gov/publications/transmission-electron-microscope-calibration-methods-critical-dimension-standards |
| SRC-049 | secondary | range_get | 206 | yes | https://standards.iteh.ai/catalog/standards/iso/6fe9c3700b5b4cafa270ebe7419de1aa/iso-19749-2021 |
| SRC-050 | standard | range_get | 206 | yes | https://rrr.bam.de/RRR/Content/EN/Downloads/Reference-Procedures/11_spectroscopic-ellipsometry-se.pdf?__blob=publicationFile |
| SRC-051 | primary | doi_metadata | 200 | yes | https://api.crossref.org/v1/works/10.1103%2FPhysRevD.51.4277/transform |
| SRC-052 | primary | range_get | 206 | yes | https://arxiv.org/abs/gr-qc/9805024 |
| SRC-053 | primary | range_get | 206 | yes | https://arxiv.org/abs/gr-qc/9812032 |
| SRC-054 | primary | range_get | 206 | yes | https://arxiv.org/abs/2301.01698 |
| SRC-055 | primary | range_get | 206 | yes | https://arxiv.org/abs/math-ph/0501073 |
| SRC-056 | primary | range_get | 206 | yes | https://arxiv.org/abs/gr-qc/0208045 |
| SRC-057 | standard | repo_local | 200 | yes | docs/audits/research/warp-qei-worldline-primer-2026-03-04.md |
| SRC-058 | primary | range_get | 206 | yes | https://arxiv.org/pdf/gr-qc/0512118.pdf |
| SRC-059 | standard | range_get | 200 | yes | https://raw.githubusercontent.com/in-toto/docs/v1.0/in-toto-spec.md |
| SRC-060 | standard | range_get | 200 | yes | https://raw.githubusercontent.com/in-toto/attestation/v1.0/spec/v1.0/statement.md |
| SRC-061 | secondary | range_get | 200 | yes | https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/ |
| SRC-062 | preprint | range_get | 206 | yes | https://arxiv.org/abs/1705.05982 |
| SRC-063 | preprint | range_get | 206 | yes | https://arxiv.org/abs/2406.08058 |
| SRC-064 | primary | range_get | 200 | yes | https://arxiv.org/abs/gr-qc/9706006 |
| SRC-065 | standard | range_get | 200 | yes | https://www.netlib.org/quadpack/ |

## Notes
- `SRC-017`, `SRC-019`, `SRC-031`, and `SRC-051` required DOI-metadata fallback due publisher bot/paywall restrictions on raw page fetch.
- Several stale URLs in the citation pack were corrected to stable/working endpoints in this pass.
- `SRC-059` and `SRC-060` were ingested from version-pinned GitHub raw spec paths to keep provenance-schema extraction deterministic.
- `SRC-062` and `SRC-063` were ingested via arXiv full-text PDFs to support equation-level extraction in SRF and Casimir sign-transition lanes.
- `SRC-064` and `SRC-065` were ingested to close the worldline-sampler convention lane (Flanagan normalization form and QUADPACK Gauss-Kronrod integration contract).

## Traceability
- owner: `research-governance`
- generated_on: `2026-03-04`
- commit_pin_context: `e240431948598a964a9042ed929a076f609b90d6`
