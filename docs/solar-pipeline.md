# Solar Pipeline

## Overview
This repo tracks a deterministic solar spectrum + surface coherence pipeline. The pipeline is intended to be repeatable on fixtures and on full SOLAR-ISS / SOLAR-HRS datasets.

## Data Sources
- SOLAR-ISS spectrum: VizieR J/A+A/611/A1
- SOLAR-HRS spectra (disk-integrated, disk-center, mu grid): VizieR VI/159

## Dataset Placement
Expected paths:
- `datasets/solar/spectra/solar-iss/v1.1/spectrum.dat`
- `datasets/solar/spectra/solar-hrs/v1/Spectre_HR_LATMOS_Meftah_V1.txt`
- `datasets/solar/spectra/solar-hrs/v1/Spectre_HR_Disk_Center_LATMOS_Meftah_V1_1.txt`
- `datasets/solar/spectra/solar-hrs/v1/Spectre_HR_Solar_position_LATMOS_Meftah_V1_1.txt`

Fixture manifests:
- `datasets/solar/spectra/solar-spectra.manifest.json`
- `datasets/solar/solar-surface.fixture.json`

## Run the Pipeline
Use the one-shot script:

```bash
npm run solar:pipeline -- --help
```

Example on fixtures (no persistence):

```bash
npm run solar:pipeline -- --surface datasets/solar/solar-surface.fixture.json
```

Example with persistence (requires DB and storage configured):

```bash
npm run solar:pipeline -- --persist --surface datasets/solar/solar-surface.fixture.json
```

## Full Dataset Swap
When swapping fixtures for full datasets:
1) Replace files under `datasets/solar/spectra/...`.
2) Update `datasets/solar/spectra/solar-spectra.manifest.json` with byte counts and sha256 hashes.
3) Re-run the pipeline to refresh hashes and reports.

## Outputs
The script emits a JSON summary with:
- Spectrum inputs_hash and features_hash
- Model comparison hashes and best model selection
- Surface coherence hashes (if surface input is provided)
