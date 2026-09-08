# Nuclear response intake: missing data must not become a null prediction

September 6, 2026. Diagnostic source intake for the shared L10 model; frozen apparatus unchanged.

The previous operator audit was concrete progress: it established the contact interaction and nuclear-spin dependence. This follow-up checks a possible source for its missing nuclear responses.

## Finding and consequence

The [WimPyDD homepage](https://wimpydd.hepforge.org/) timed out during this attempt. This is an access observation, not evidence that its tables lack carbon-13. A distinct public program, [Kavanagh and Edwards' WIMpy_NREFT](https://github.com/bradkav/WIMpy_NREFT), was accessible. These are different programs; the latter is not an authenticated substitute for LZ's exact calculation.

We pinned WIMpy_NREFT to commit `50581c637069305a3def3865462ef1b4ed9a616d` and archived its nucleus inventory and two spin response modules with their MIT license. In that inventory carbon is carbon-12 only. The spin response dispatch tables contain xenon-129 and xenon-131 but no carbon-13. The response helpers return zero for an unrecognized isotope, as inspection of their initial conditional shows. This fallback must not be interpreted as a computed carbon-13 response.

| Input | Coverage in inspected snapshot | Consequence |
|---|---|---|
| Carbon-12 | Inventory present; spin response entries absent | Consistent with its leading elastic spin-zero channel, subject to operator scope |
| Carbon-13 | Inventory and both spin entries absent | Unknown response; reject a joint prediction using these tables alone |
| Xenon-129 and xenon-131 | Inventory and both spin entries present | Candidate inputs for independent validation; not yet LZ-equivalent |

The attached intake script parses dispatch assignments without executing upstream code. Its explicit coverage requirement raises `UNAVAILABLE_NUCLEAR_RESPONSE:C13`, and accepts the two inspected xenon isotopes at the coverage level. Three checks pass. Four archive SHA-256 values are enforced on replay; the JSON records source URLs and revision. Coverage is deliberately distinct from numerical correctness, operator convention and experimental acceptance.

## Next calculation requirements

1. Obtain or derive a documented carbon-13 transverse isoscalar spin response. A nuclear spin of one half does not make its nucleon spin content that of a free neutron. A single-particle nuclear model would be an explicitly labeled approximation, requiring uncertainty treatment before comparison.
2. Authenticate which archived module corresponds to the transverse response, its normalization, oscillator variable and proton/neutron-to-isoscalar convention. Reproduce the correlated O4/O6 longitudinal cancellation before integrating a xenon spectrum.
3. Compare the xenon response provenance with the density matrices and modifications cited by LZ. Keep any older-response diagnostic separate from the detector inference.
4. Only then combine the two targets with a common coefficient and the local dynamic spin/survival response. Missing carbon data cannot be filled with zero or a total-mass enhancement.

Replay: `python docs/research/casimir-dp-spin-response-intake-2026-09-06.py`. The same-name directory contains the source snapshot; the adjacent JSON records the check results. Atlas build, why and upstream trace against the canonical quantum-foam article succeeded before additions. No runtime, adapter, constraint or certificate changes; no physical-admissibility claim. S1 remains open and the research goal remains active.
