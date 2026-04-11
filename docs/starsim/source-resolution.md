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

Solar note:
- `server/modules/starsim/sources/adapters/solar-observed.ts` now provides a scaffolded solar observed-source normalizer for future Sun-only baseline work
- for Sun requests, the resolver now merges fixture/static `solar_observed` inputs for both Phase 0 interior closure and observed cycle context
- `solar_baseline_support` now includes `closure_diagnostics` for convection-zone depth, envelope helium, low-degree mode support, and neutrino vector completeness
- `solar_baseline_support` also includes `cycle_diagnostics` for cycle indices, magnetogram linkage, active-region context, and advisory irradiance continuity
- `solar_baseline_support` also includes `eruptive_diagnostics` for flare coverage, CME coverage, irradiance continuity, and optional source-region linkage
- Sun resolves now also emit `solar_reference_pack_id`, `solar_reference_pack_version`, `solar_reference_pack_ref`, `solar_product_registry_id`, `solar_product_registry_version`, `solar_product_registry_ref`, `solar_consistency_diagnostics`, `solar_provenance_diagnostics`, `solar_baseline_signature`, `previous_solar_baseline_ref`, and `solar_baseline_repeatability`
- each solar diagnostic check now carries anchor provenance plus `reference_doc_ids` so operators can distinguish evidence drift from `reference_basis_changed`
- the active Sun calibration basis now loads from `data/starsim/solar-reference-pack.v1.json`, not embedded TypeScript literals
- the active Sun evidence/product basis now loads from `data/starsim/solar-product-registry.v1.json`, and populated solar sections carry explicit `source_product_id`, `source_product_family`, and `source_doc_ids`
- this solar path stays separate from the Gaia/Astra/LAMOST/TASOC/TESS resolver stack used for ordinary stellar requests
- the new solar schema/domain scaffold is still separate from the current `solar_like_main_sequence_live` source-resolution workflow and does not imply full-Sun solver closure
