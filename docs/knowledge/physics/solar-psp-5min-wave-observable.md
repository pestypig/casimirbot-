# Solar PSP 5-Minute Wave Observable

Heliospheric wave observables are encoded as in-situ PSD records with explicit RTN/geometry context:

- instrument (for example Parker Solar Probe),
- frame (`RTN`),
- heliocentric distance in solar radii,
- frequency-band evidence and significance fields,
- polarization and dominant-component metadata.

## Rationale

The PSP study reports highly Alfvénic wave trains near 3.1 to 3.2 mHz with finite duration and perihelion geometry context. CasimirBot stores those as hypothesis-supporting observables rather than as direct one-to-one mappings to any single remote spectral feature.

## Source

- Parker Solar Probe in situ 5-minute oscillation paper: https://arxiv.org/html/2511.10906v1
