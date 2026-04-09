# StarSim Source Resolution

`star-sim-v1` now has a source-resolution entry point at `POST /api/star-sim/v1/resolve`.

Purpose:
- resolve a supported solar-like target into the existing `star-sim-v1` request sections
- preserve deterministic source-selection provenance
- stop before heavy solver execution

Current source stack:
- `gaia_dr3` for identity, astrometry, and base photometry
- `sdss_astra` as the preferred spectroscopy source
- `lamost_dr10` as spectroscopy fallback
- `tasoc` as the preferred seismic-summary source
- `tess_mast` as the seismic-summary fallback and time-series product reference source

Fetch modes:
- `fixture` for deterministic CI/local fixture playback
- `live` for live catalog resolution
- `cache_only` to require an existing cached source artifact
- `disabled` to suppress source fetches
- `cache` appears on returned results when the resolver serves a verified cached artifact

Current live-source behavior:
- Gaia DR3 has a built-in live TAP path
- SDSS Astra and LAMOST DR10 support live mode through configured JSON endpoints or proxies
- live and fixture artifacts are stored in separate cache namespaces
- cache identity includes fetch mode, adapter version, and runtime endpoint identity

Relevant env vars:
- `STAR_SIM_SOURCE_FETCH_MODE`
- `STAR_SIM_GAIA_DR3_MODE`
- `STAR_SIM_SDSS_ASTRA_MODE`
- `STAR_SIM_LAMOST_DR10_MODE`
- `STAR_SIM_TESS_MAST_MODE`
- `STAR_SIM_TASOC_MODE`
- `STAR_SIM_SOURCE_TIMEOUT_MS`
- `STAR_SIM_SOURCE_USER_AGENT`
- `STAR_SIM_GAIA_DR3_ENDPOINT`
- `STAR_SIM_SDSS_ASTRA_ENDPOINT`
- `STAR_SIM_LAMOST_DR10_ENDPOINT`
- `STAR_SIM_TESS_MAST_ENDPOINT`
- `STAR_SIM_TASOC_ENDPOINT`

Current policy:
- explicit user overrides win by default
- `source_policy.strict_catalog_resolution=true` lets catalog values override manual fields when source data are available
- catalog preference defaults to `gaia_dr3 -> sdss_astra -> lamost_dr10 -> tasoc -> tess_mast`
- `source_hints.preferred_catalogs` and `source_hints.allow_fallbacks` can narrow or widen that order deterministically
- for seismic summaries, `tasoc` beats `tess_mast` when both provide candidates

Artifacts:
- source-resolution cache lives under `artifacts/research/starsim/sources/<cache-key>/`
- the cache stores:
  - the original resolution request
  - the resolved request draft
  - the selection manifest
  - the resolution response
  - copied raw source payloads

Important limitations:
- Gaia DR3 live fetch is built in, but Astra/LAMOST live mode currently expects a configured endpoint or proxy that returns structured JSON
- TESS/MAST and TASOC integration in this patch ingest existing summary products only; they do not derive seismic parameters from raw light curves
- `/api/star-sim/v1/resolve` now exposes `oscillation_gyre_ready` plus an oscillation-domain preview, but it still does not execute the solver lane
- source enrichment does not raise solver maturity by itself
- the supported live physics domain is still the existing solar-like main-sequence envelope
