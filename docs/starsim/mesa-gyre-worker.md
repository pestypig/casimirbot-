# Star-Sim MESA/GYRE Worker

`star-sim-v1` now supports two heavy lanes behind an async worker path:

- `structure_mesa`
- `oscillation_gyre`

## Runtime Modes

Control the runtime per solver with environment variables:

- `STAR_SIM_MESA_RUNTIME=mock|docker|wsl|disabled`
- `STAR_SIM_GYRE_RUNTIME=mock|docker|wsl|disabled`
- `STAR_SIM_MESA_IMAGE=<container image>` for future Docker wiring
- `STAR_SIM_GYRE_IMAGE=<container image>` for future Docker wiring
- `STAR_SIM_WORKER_TIMEOUT_MS=<ms>`
- `STAR_SIM_JOB_CONCURRENCY=<n>`
- `STAR_SIM_ARTIFACT_ROOT=<path>`

Current implementation notes:

- `mock` is the only executable runtime in CI and local tests.
- `docker` and `wsl` are reserved for real solver backends and currently fail explicitly if execution is attempted.
- `disabled` means sync requests can only serve cached artifacts.

On Windows, prefer `docker` or `wsl` for future real MESA/GYRE execution. Do not assume a direct native Windows install path.

## Routes

- `POST /api/star-sim/v1/run`
  Sync orchestration. Heavy lanes only return cached artifacts here. If uncached, the lane returns `status: unavailable` with `status_reason: async_job_required`.

- `POST /api/star-sim/v1/jobs`
  Enqueue an async job.

- `GET /api/star-sim/v1/jobs/:jobId`
  Poll job state.

- `GET /api/star-sim/v1/jobs/:jobId/result`
  Fetch the completed `star-sim-v1` response.

## Cache Layout

Artifacts are written under `artifacts/research/starsim/` by default.

- `mesa/<cache-key>/manifest.json`
- `mesa/<cache-key>/canonical-request.json`
- `mesa/<cache-key>/mesa-summary.json`
- `mesa/<cache-key>/model.gsm.h5.placeholder.json`
- `mesa/<cache-key>/lane-result.json`
- `gyre/<cache-key>/manifest.json`
- `gyre/<cache-key>/canonical-request.json`
- `gyre/<cache-key>/gyre-summary.json`
- `gyre/<cache-key>/lane-result.json`
- `jobs/<jobId>/request.json`
- `jobs/<jobId>/result.json`
- `jobs/<jobId>/manifest.json`

Cache keys are deterministic hashes of canonical observables plus solver-specific context. `oscillation_gyre` also includes the parent `structure_mesa` cache key.

## Maturity Semantics

- Mock runtime results are cached as fixture-backed orchestration outputs and use lower maturity than real external solver runs.
- Real external backends should only claim `research_sim` once the runtime path is actually wired and reproducible.
- `oscillation_gyre` must reference a `structure_mesa` parent claim. It must not fabricate a stand-alone seismic result without a structure artifact.
