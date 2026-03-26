# HaloBank Solar Diagnostic Datasets Source Check

Date: 2026-03-25

## Purpose

This audit records the dataset-specific sources used to move the HaloBank solar diagnostic lanes from Earth-only or synthetic examples toward source-backed replay and non-Earth comparison profiles.

## Planetary Figure Comparison Profiles

### Earth reference

- NASA GSFC / NSSDC Earth Fact Sheet
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
  - Used for the Earth reference mass/radius/flattening context.
- NASA GSFC, "Nutation and Precession"
  - https://earth.gsfc.nasa.gov/geo/multimedia/nutation-and-precession
  - Used for the paired Sun/Moon forcing interpretation and precession/nutation context.

### Mercury congruence profile

- NASA GSFC / NSSDC Mercury Fact Sheet
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html
  - Used for Mercury mass, radius, and spin context.
- Verma and Margot, "Mercury's gravity, tides, and spin from MESSENGER radio science data"
  - https://arxiv.org/abs/1608.01360
  - Used for the pinned Mercury gravity/tide falsifier target, including the reported degree-2 gravity coefficients and `k2 = 0.464 +- 0.023`.
- Goossens et al., Mercury tides and interior constraints review
  - https://ntrs.nasa.gov/api/citations/20220012959/downloads/Goossens.tidal.STI.pdf
  - Used for Mercury interior-constraint framing and MESSENGER-era gravity/tide context.
- Gomes, Folonier, and Ferraz-Mello, "Rotation and figure evolution in the creep tide theory. A new approach and application to Mercury"
  - https://arxiv.org/abs/1910.12990
  - Used for the caution that Mercury's measured flattenings sit well above the output of simple tidal-theory closures, which is why the profile is now treated as a hard falsifier.

Inference note:
- Mercury is being used as the primary non-Earth executable congruence profile because the same body is already present in the Mercury precession lane.
- The current low-order proxy no longer closes against the pinned Verma-Margot target; it now fails intentionally on `J2` closure and therefore acts as a meaningful Mercury falsifier rather than a broad comparison pass.

### Mars calibration profile

- NASA GSFC / NSSDC Mars Fact Sheet
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
  - Used for Mars mass, radius, and rotation inputs.
- Konopliv et al., Mars gravity and tidal Love number
  - https://doi.org/10.1029/2020GL090568
  - Used for Mars reference `J2` and `k2`.

### Jupiter stress-test profile

- NASA GSFC / NSSDC Jupiter Fact Sheet
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html
  - Used for Jupiter mass, radius, and rotation inputs.
- Wahl, Hubbard, and Militzer
  - https://doi.org/10.1016/j.icarus.2016.09.011
  - Used for giant-planet figure/tide semantics.

## Stellar Observables Replay Series

### Authoritative landing pages

- NSO helioseismic parameter archive
  - https://nso.edu/data/nisp-data/helioseismology/helioseismic-parameters/
- NSO MRV1Z mode-frequency archive
  - https://nso.edu/data/nisp-data/helioseismology-mrv1z/
- GONG month/date lookup table
  - https://gong.nso.edu/data/DMAC_documentation/gongmonths.html
- SILSO monthly total sunspot number data file
  - https://www.sidc.be/SILSO/DATA/SN_m_tot_V2.0.txt

### Exact GONG MRV1Z files used in the replay

- https://gong2.nso.edu/ftp/TSERIES/v1z/199801/mrv1z980120/mrv1z980120.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/199901/mrv1z990115/mrv1z990115.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200001/mrv1z000110/mrv1z000110.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200101/mrv1z010104/mrv1z010104.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200202/mrv1z020204/mrv1z020204.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200301/mrv1z030130/mrv1z030130.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200501/mrv1z050119/mrv1z050119.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200601/mrv1z060114/mrv1z060114.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/200801/mrv1z080104/mrv1z080104.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/201001/mrv1z100129/mrv1z100129.txt.Z
- https://gong2.nso.edu/ftp/TSERIES/v1z/201201/mrv1z120119/mrv1z120119.txt.Z

### Replay-construction rule

- Helioseismic shifts are the weighted mean of GONG MRV1Z `l=0, n=17..23` mode frequencies relative to the 1998-01 baseline window.
- Magnetic activity values are the official SILSO monthly total sunspot numbers for the matching GONG month.

## Result

- `planetary_figure_diagnostic` is now source-backed beyond Earth and explicitly uses Mercury as the primary non-Earth executable congruence target.
- The vectors route now discloses `601` Mimas and `607` Hyperion as hybrid diagnostic state sources instead of silently presenting them as pure kernel-bundle vectors.
- Saturn-moon potato-shape profiles are now executable through a synthetic diagnostic state source for Mimas and Hyperion, while remaining clearly separated from kernel ephemeris support.
- `stellar_observables_diagnostic` now supports an actual GONG+SILSO replay series instead of relying only on synthetic arrays.
- Both lanes remain diagnostic. Neither is promoted to certified geodesy, stellar inversion, collapse, or consciousness claims.

## Saturn-Moon Potato-Shape Anchors

- NASA NSSDC, Saturnian Satellite Fact Sheet
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html
- JPL Solar System Dynamics, Planetary Satellite Physical Parameters
  - https://ssd.jpl.nasa.gov/sats/phys_par/sep.html
- NASA Technical Report 19880067580, "Internal structure and shape of Mimas."
  - https://ntrs.nasa.gov/citations/19880067580
- Rambaux et al., "The rotation of Mimas."
  - https://doi.org/10.1051/0004-6361/201117558
- Hyperion - 13-day rotation from Voyager data
  - https://ntrs.nasa.gov/citations/19840053934
- Thomas et al., "Hyperion's sponge-like appearance."
  - https://pubmed.ncbi.nlm.nih.gov/17611535/
- NASA Science, Hyperion
  - https://science.nasa.gov/saturn/moons/hyperion/

Current implementation limit:
- Saturn moon state vectors are exposed through a synthetic diagnostic orbit source, not a kernel ephemeris, so the profiles are executable while remaining explicitly diagnostic.
