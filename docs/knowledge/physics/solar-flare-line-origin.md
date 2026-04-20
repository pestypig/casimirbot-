# Solar Flare Line-Origin Interpretation Guardrail

Solar flare line profiles in optically thick diagnostics (for example Ca II H) must not be over-interpreted as single-mechanism flow labels from profile decomposition alone.

The DKIST/ViSP C6.7 flare analysis reports that double-Gaussian descriptions can be useful but are not, by themselves, proof of unique mass-motion interpretation in optically thick lines. CasimirBot therefore stores origin as a hypothesis object with evidence refs and interpretation status instead of a single deterministic origin label.

## Contract Consequence

- Origin claims are encoded as `origin_hypotheses[]`.
- Each hypothesis carries `mechanism`, `layer_support`, `evidence_refs`, `confidence`, and `interpretation_status`.
- `interpretation_status` is tiered (`descriptive`, `suggestive`, `validated`) to prevent over-claiming.

## Sources

- Tamburri et al., 2026, DKIST/ViSP Ca II H and H epsilon flare spectroscopy: https://link.springer.com/article/10.1007/s11207-026-02633-1
- NSO summary of the same observational campaign and model mismatch notes: https://nso.edu/blog/new-solar-flare-observations-challenge-leading-theories/
