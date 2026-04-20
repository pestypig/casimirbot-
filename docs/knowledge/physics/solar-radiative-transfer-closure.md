# Solar Radiative-Transfer Closure (Flare Diagnostics)

Solar flare spectral observables in this lane are diagnostic-tier comparisons between measured line morphology and forward-modeled line morphology. They are not treated as certified inversion products.

## Practical Closure Rules

1. Optically thick line interpretations require baseline-aware subtraction metadata.
2. Forward-model comparison records must include response/PSF context before residuals are promoted.
3. Layer support may be multi-layer (`upper_chromosphere`, `lower_chromosphere`, etc.) rather than a single formation-height scalar.

## Why

The DKIST/ViSP flare analysis highlights:

- spatially variable asymmetries across the flare ribbon,
- model mismatch in Ca II H red wing behavior,
- and H epsilon width sensitivity to deeper layers, not only upper chromosphere.

Those findings force closure metadata to be explicit for baseline subtraction, model convolution, and layered interpretation.

## Sources

- DKIST/ViSP flare paper (Tamburri et al., 2026): https://link.springer.com/article/10.1007/s11207-026-02633-1
- NSO summary: https://nso.edu/blog/new-solar-flare-observations-challenge-leading-theories/
