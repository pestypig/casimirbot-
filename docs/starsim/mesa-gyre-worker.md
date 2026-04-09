# Star-Sim MESA/GYRE Worker

`star-sim-v1` now supports two heavy lanes behind an async worker path:

- `structure_mesa`
- `oscillation_gyre`

## Runtime Modes

Control the runtime per solver with environment variables:

- `STAR_SIM_MESA_RUNTIME=mock|docker|wsl|disabled`
- `STAR_SIM_GYRE_RUNTIME=mock|docker|wsl|disabled`
- `STAR_SIM_ENABLE_LIVE_BENCHMARKS=1`
- `STAR_SIM_MESA_IMAGE=<container image>`
- `STAR_SIM_GYRE_IMAGE=<container image>`
- `STAR_SIM_MESA_COMMAND=<stdin-json -> stdout-json command>`
- `STAR_SIM_GYRE_COMMAND=<stdin-json -> stdout-json command>`
- `STAR_SIM_WSL_DISTRO=<distro>`
- `STAR_SIM_DOCKER_BIN=<docker binary>`
- `STAR_SIM_WSL_BIN=<wsl binary or direct launcher>`
- `STAR_SIM_DOCKER_LAUNCH_MODE=wrapper|direct`
- `STAR_SIM_WSL_LAUNCH_MODE=wrapper|direct`
- `STAR_SIM_WORKER_TIMEOUT_MS=<ms>`
- `STAR_SIM_JOB_CONCURRENCY=<n>`
- `STAR_SIM_JOB_MAX_ATTEMPTS=<n>`
- `STAR_SIM_CACHE_TTL_MS=<ms>`
- `STAR_SIM_ARTIFACT_ROOT=<path>`

Current implementation notes:

- `mock` is the only executable runtime in normal CI.
- `docker` and `wsl` are opt-in command runtimes. They only execute when live benchmarks are enabled, the image/command configuration is present, and the runtime passes a readiness probe.
- `disabled` means sync requests can only serve cached artifacts.

On Windows, prefer `docker` or `wsl` for future real MESA/GYRE execution. Do not assume a direct native Windows install path.

## Benchmark Scope

The live runtime path is benchmark-scoped, not general any-star solving.

Supported benchmark ids currently include:

- `simplex_solar_calibration`
- `astero_gyre_solar_like`

Requests may provide `benchmark_case_id` explicitly. If they do not, `star-sim-v1` only runs live execution when a deterministic benchmark mapping exists. Unsupported live requests return `benchmark_required` or `out_of_domain` instead of guessing.

Live runtime results only earn `research_sim` when all of the following are true:

- the request resolved to a supported benchmark
- the runtime actually executed a live solver command
- required artifacts were produced
- benchmark validation passed

Mock output stays below `research_sim` even when it reuses the same lane names.

## Live Runtime JSON Protocol

`docker` and `wsl` runners must consume JSON on stdin and emit JSON on stdout. The protocol is intentionally structured so the route layer does not scrape text logs.

Input payload fields include:

- `schema_version: "star-sim-runtime/1"`
- `lane_id`
- `cache_key`
- `benchmark_case_id`
- `physics_flags`
- `target`
- `canonical_observables`
- `requested_lanes`
- `evidence_refs`

`oscillation_gyre` inputs also include:

- `structure_cache_key`
- `structure_claim_id`
- `structure_summary`

Output payload fields for a successful live benchmark run include:

- `schema_version: "star-sim-runtime-result/1"`
- `execution_mode: "live_benchmark"`
- `live_solver: true`
- `solver_version`
- `benchmark_case_id`
- lane-specific summaries such as `structure_summary`, `synthetic_observables`, or `mode_summary`
- `artifact_payloads`
- `live_solver_metadata`

Artifact payloads are persisted into the heavy-lane cache and validated before they are accepted as a successful live result.

## Direct Launch Mode

`wrapper` launch mode runs the configured command inside `docker run ... sh -lc` or `wsl ... bash -lc`.

`direct` launch mode executes the configured launcher binary directly with the configured command as its first argument. This is mainly useful for local shims and tests. Example:

```powershell
$env:STAR_SIM_ENABLE_LIVE_BENCHMARKS = "1"
$env:STAR_SIM_MESA_RUNTIME = "wsl"
$env:STAR_SIM_GYRE_RUNTIME = "wsl"
$env:STAR_SIM_WSL_LAUNCH_MODE = "direct"
$env:STAR_SIM_WSL_BIN = "$($PSHOME.Replace('\\WindowsPowerShell\\v1.0',''))\\node.exe"
$env:STAR_SIM_MESA_COMMAND = "C:\\path\\to\\live-runtime-runner.cjs"
$env:STAR_SIM_GYRE_COMMAND = "C:\\path\\to\\live-runtime-runner.cjs"
```

For real Windows deployments, `docker` or real `wsl` wrapper mode remains the expected path.

## Runtime Fingerprints

Each heavy-lane cache key includes:

- `runtime_mode`
- `runtime_fingerprint`
- `artifact_schema_version`
- lane solver manifest

`runtime_fingerprint` separates artifact namespaces across:

- `mock:<fixture-pack-hash>`
- `docker:<image+command-hash>`
- `wsl:<distro+command-hash>`
- `disabled:<solver-hash>`

Mock and live runtimes must never share the same cache key or cache directory.

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

Each cache manifest records:

- `artifact_schema_version`
- `runtime_mode`
- `runtime_fingerprint`
- `created_at`
- optional `expires_at`
- lane solver manifest
- per-file SHA-256 hashes

Cache reads verify file hashes before returning a hit. Corrupt, incomplete, stale, or incompatible artifacts are treated as cache misses.

Live benchmark runs may also persist runtime-produced files such as:

- `solver_metadata`
- `model_artifact`
- `mode_table`

Those runtime artifact kinds are part of benchmark validation.

## Cache Invalidation

- `STAR_SIM_CACHE_TTL_MS` marks artifacts stale after their manifest `expires_at`.
- Changing `artifact_schema_version`, `runtime_fingerprint`, or the lane solver manifest moves the request onto a new cache key.
- Sync `/v1/run` surfaces cache state through lane fields such as `cache_status`, `cache_status_reason`, and `artifact_integrity_status`.

## Maturity Semantics

- Mock runtime results are cached as fixture-backed orchestration outputs and use lower maturity than real external solver runs.
- Live external benchmark backends should only claim `research_sim` once benchmark validation passes.
- A live run that finishes but misses its tolerance envelope fails with `benchmark_validation_failed` and is not cached as a successful artifact.
- `oscillation_gyre` must reference a `structure_mesa` parent claim. It must not fabricate a stand-alone seismic result without a structure artifact.

## Benchmark Validation

Each supported benchmark carries:

- a tolerance profile id
- required artifact kinds
- per-metric tolerance checks

The lane result exposes `benchmark_validation` with:

- `passed`
- `tolerance_profile`
- `checked_metrics`
- `notes`

This validates benchmark agreement for the narrow supported benchmark case. It is not a blanket claim that arbitrary-star science is solved.

## Job Dedupe And Recovery

- `POST /api/star-sim/v1/jobs` computes a stable job fingerprint from the canonical request plus heavy-lane runtime identities.
- Duplicate queued/running submissions return the existing job with `deduped: true`.
- Job manifests are persisted under `jobs/<jobId>/manifest.json`.
- On process restart, persisted `queued` or `running` jobs are reclassified as `abandoned` with `status_reason: orphaned_after_restart`.
- Worker exits/timeouts use bounded retries controlled by `STAR_SIM_JOB_MAX_ATTEMPTS`.
- If a worker-backed lane returns `status: failed`, the job is marked failed rather than silently reported as a successful run.
