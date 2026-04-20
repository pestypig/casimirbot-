# Solar Ribbon Geometry Definition (Observable Contract)

`spatial_context` stores geometry and co-alignment context for flare spectra:

- frame: `Helioprojective`
- coordinates: `longitude_arcsec`, `latitude_arcsec`
- ribbon segmentation: `leading_edge`, `center`, `trailing_edge`, `mixed`
- context image refs and co-alignment refs

If unresolved spatial mixing is known, `unresolved_mixing_flag` must be recorded and paired with an explanatory note. This prevents silent over-interpretation of blended spectra.

## Sources

- DKIST/ViSP flare ribbon morphology discussion: https://link.springer.com/article/10.1007/s11207-026-02633-1
- DKIST + context-search tooling: https://docs.dkist.nso.edu/projects/python-tools/en/stable/tutorial/2_search_and_asdf_download.html
- SunPy helioprojective coordinates (observer-aware frame context): https://docs.sunpy.org/en/stable/api/sunpy.coordinates.Helioprojective.html
