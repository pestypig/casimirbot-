# DKIST ViSP Observable Contract Notes

DKIST ViSP flare observables are represented as coordinate-aware records with uncertainty, masks, provenance, and context-image linkage.

## Required Observable Elements

- line windows (for example Ca II H 396.8 nm and H epsilon 397.0 nm),
- flare phase and ribbon segment context,
- helioprojective location,
- baseline subtraction record,
- response/PSF metadata for forward-model comparisons,
- guardrailed origin hypotheses.

## External Conventions Bridged by CasimirBot

- Astropy NDData and related astronomy tooling uses mask semantics where `True` indicates invalid values.
- IMAS diagnostic IDS validity fields typically use integer validity codes (`0` and `1` valid; negatives invalid).
- CasimirBot normalizes both into canonical `valid_mask` semantics where `true` means usable data.

## Sources

- Astropy NDData mask semantics: https://docs.astropy.org/en/stable/nddata/nddata.html
- IMAS diagnostic validity code examples: https://imas-data-dictionary.readthedocs.io/en/4.1.1/generated/ids/magnetics.html
- DKIST spectral lines metadata package: https://docs.dkist.nso.edu/projects/spectral-lines/en/latest/index.html
- DKIST Python tools dataset/axis examples: https://docs.dkist.nso.edu/projects/python-tools/en/v1.9.1/tutorial/3_the_dataset.html
