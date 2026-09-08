# Atmospheric Neutrino Flux Data

Atmospheric neutrino flux data for 7 neutrino experiment sites, covering energies from 10 MeV to 10 TeV.

## Sites

| Site | Description |
|------|-------------|
| JUNO | Jiangmen Underground Neutrino Observatory, China |
| SK | Super-Kamiokande, Japan |
| KM3NeT-ORCA | Oscillation Research with Cosmics in the Abyss, Mediterranean Sea |
| IceCube | IceCube Neutrino Observatory, South Pole |
| DUNE | Deep Underground Neutrino Experiment, USA |
| TRIDENT | Tropical Deep-sea Neutrino Telescope, South China Sea |
| CJPL | China Jinping Underground Laboratory |

## Directory Structure

Data is organized by site first, with physics scenarios as subdirectories:

```
<Site>/
  solar-min_without-muon-in-earth/   # Flux without muon propagation in Earth
  solar-min_with-muon-in-earth/      # Flux with muon propagation in Earth
```

### Scenarios

| Directory | Description |
|-----------|-------------|
| `solar-min_without-muon-in-earth/` | Solar minimum, atmospheric neutrino flux without muon propagation in the Earth |
| `solar-min_with-muon-in-earth/` | Solar minimum, atmospheric neutrino flux including muon propagation in the Earth |

## File Formats

Three format variants are provided for each site and category:

| Format | File pattern | Description |
|--------|-------------|-------------|
| **01-01** | `{site}-ally-01-01-solmin.d` | Average over all directions (1 zenith bin, 1 azimuthal bin) |
| **20-01** | `{site}-ally-20-01-solmin.d` | 20 zenith bins, averaged over all azimuthal angles (20 blocks) |
| **20-12** | `{site}-ally-20-12-solmin.d` | 20 zenith bins × 12 azimuthal bins (240 blocks) |

### File Format Specification

Each file is a plain text file organized in blocks. Each block consists of:

1. A header line describing the zenith and azimuthal range:  
   `average flux in [cosZ = X.XX -- Y.YY, phi_Az = XXX -- YYY]`
2. A column header line:  
   `Enu(GeV)   NuMu       NuMubar    NuE        NuEbar  (m^2 sec sr GeV)^-1`
3. Data lines with energy and fluxes in scientific notation:  
   `E  F(ν_μ)  F(ν̄_μ)  F(ν_e)  F(ν̄_e)`

### Zenith and Azimuthal Binning

**Zenith bins (cosZ):**

| Bin | cosZ range | Bin | cosZ range |
|-----|-----------|-----|-----------|
| 1 | [ 1.00,  0.90] | 11 | [ 0.00, -0.10] |
| 2 | [ 0.90,  0.80] | 12 | [-0.10, -0.20] |
| 3 | [ 0.80,  0.70] | 13 | [-0.20, -0.30] |
| 4 | [ 0.70,  0.60] | 14 | [-0.30, -0.40] |
| 5 | [ 0.60,  0.50] | 15 | [-0.40, -0.50] |
| 6 | [ 0.50,  0.40] | 16 | [-0.50, -0.60] |
| 7 | [ 0.40,  0.30] | 17 | [-0.60, -0.70] |
| 8 | [ 0.30,  0.20] | 18 | [-0.70, -0.80] |
| 9 | [ 0.20,  0.10] | 19 | [-0.80, -0.90] |
| 10 | [ 0.10,  0.00] | 20 | [-0.90, -1.00] |

cosZ = 1 corresponds to vertically downward, cosZ = -1 to vertically upward.

**Azimuthal bins (phi):** 12 bins of 30° each: [0,30], [30,60], ..., [330,360].

### Energy Grid

The flux is provided at 121 logarithmically-spaced energy points from 0.01 GeV (10 MeV) to 10,000 GeV (10 TeV).

### Flux Units

All fluxes are in units of **(m² sec sr GeV)⁻¹** (differential flux per unit solid angle).

## Usage

A Python example script is provided in `scripts/read_flux_data.py` for reading the data files:

```python
from read_flux_data import load_flux_file

# Load a 20-01 file
blocks, energy = load_flux_file('JUNO/solar-min_without-muon-in-earth/juno-ally-20-01-solmin.d')

# Each block contains: cosZ_low, cosZ_high, phi_low, phi_high, data
for block in blocks:
    print(f"cosZ=[{block['cosZ_low']:.2f}, {block['cosZ_high']:.2f}]")
    # block['data'] is a numpy array with columns: [E, NuMu, NuMubar, NuE, NuEbar]
```

## Reference

This dataset was computed using the atmospheric neutrino flux calculation framework with the IGRF-20 geomagnetic field model (solar minimum conditions).


