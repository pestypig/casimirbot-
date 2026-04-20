# Solar Cryo-NIRSP Fe XIII Observable

This document defines how Cryo-NIRSP Fe XIII observables are represented as first-class records:

- spectral cube contract preserving DKIST WCS axes,
- derived line-fit series for intensity, width, and Doppler metrics,
- wave-domain products (PSD and coherence) attached as separate observables.

## Required geometry and provenance

- helioprojective geometry refs and off-limb context
- dataset provenance refs
- explicit line identifiers (Fe XIII 1074 and 1079 nm windows)

The contract enforces geometry + provenance for Cryo-NIRSP entries, preventing anonymous line-fit arrays detached from location and observing context.

## Sources

- Cryo-NIRSP active-region coronal wave analysis: https://arxiv.org/html/2511.10880v1
- DKIST dataset dimensionality/WCS guidance: https://docs.dkist.nso.edu/projects/python-tools/en/latest/tutorial/3_dataset_dimensionality.html
- DKIST Cryo-NIRSP plotting examples: https://docs.dkist.nso.edu/projects/python-tools/en/stable/examples/example_cryo_plots.html
