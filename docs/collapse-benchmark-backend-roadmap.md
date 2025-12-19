# Collapse Benchmark Backend Roadmap (Relativity-Safe)

Build a backend “benchmark layer” that treats *collapse* as an engineering-time **commit event** with:
- a **rate / timescale** `tau` (how often a commit can happen), and
- a **causal footprint** bounded by relativity: `L_present <= c * tau`,
and reports its diagnostics in the same curvature units (`kappa`, `m^-2`) used elsewhere (e.g., `kappaDrive/kappaBody`).

This is **not** a claim of faster-than-light signaling or a literal objective-collapse physics simulator. It is a
relativity-safe way to model/benchmark commit/selection behavior inside simulations.

## End goal
- Given a simulation state (initially: summary stats; later: lattice volumes), compute:
  - `tau_ms` (collapse/commit timescale),
  - `p_trigger = 1 - exp(-dt/tau)` (hazard per timestep),
  - `L_present_m = min(r_c_m, c * tau_s)` (local “now” footprint),
  - `kappa_present = 1 / L_present_m^2` (a curvature-unit diagnostic),
  - optional ratios vs existing guardrails (e.g., `kappa_drive / kappa_present`).
- Provide a repeatable benchmark harness (CLI + JSON manifests) and an HTTP API so UI/panels can display the numbers.
- Keep everything deterministic (seeded) so results are comparable across machines and over time.

## Current state (already in repo)
- Star coherence backend already exposes collapse-ish telemetry:
  - `shared/star-telemetry.ts` includes `dp_tau_estimate_ms` and `collapse_pressure`.
  - `server/services/star/service.ts` computes `dp_tau_estimate_ms` from a heuristic DP-like energy proxy.
  - `modules/policies/coherence-governor.ts` consumes `dp_tau_estimate_ms` to steer collapse/branch/continue policy.
- “Collapse” also exists as **prompt/embedding selection** (not physics):
  - `server/services/mixer/collapse.ts` (deterministic selection/mix strategies).
- Warpfield system already produces lattice assets + hashes for provenance:
  - card export sidecars include lattice blobs and sha256s; replay metadata exists but full rehydration is pending.
- Canonical speed-of-light constants exist on both sides:
  - client: `client/src/physics/constants.ts` (`c`)
  - server: `server/utils/physics-const-safe.ts` (`C`)

## Decisions to lock before building
- What is `tau` in v1?
  - Option A: operator-provided `tau_ms` (pure benchmark dial).
  - Option B: derived from star telemetry `dp_tau_estimate_ms` (session-scoped).
  - Option C: derived from field/lattice metrics (later phase).
- What is `r_c_m` (correlation length) in v1?
  - Option A: hull/bubble geometry proxy (e.g., `minAxis/2`).
  - Option B: lattice-derived correlation length (later phase).
- What do we mean by “kappa for collapse”?
  - Recommended: `kappa_present = 1 / L_present^2` (pure diagnostic in `m^-2`).
  - Optional: also report `kappa_tau = 1 / (c*tau)^2` even when `r_c` is smaller.
- Is the backend only *diagnostic*, or does it also drive a commit event selection in the simulation loop?
  - Start diagnostic-only (safer); add commit hooks later if needed.

## Phased plan with completion checks

### Phase 0 — Contracts + naming (avoid “collapse” collisions) [x]
- [x] Define shared terminology: `collapse_benchmark` = commit/selection benchmark, not quantum signaling.
- [x] Add `shared/collapse-benchmark.ts` with Zod schemas (`CollapseBenchmarkInput`, `CollapseBenchmarkResult`).
- [x] Include explicit provenance / audit fields (`schema_version`, `data_cutoff_iso`, `tau_source`, `r_c_source`, `features_hash`, `inputs_hash`).
- [x] Decide where results-of-record live: return JSON for v1; envelope/report persistence later.
- DoD: a single JSON payload can be validated and round-tripped through schema parsing.

### Phase 1 — Core benchmark math + determinism [x]
- [x] Implement core math: `p_trigger`, `L_present`, `kappa_present`.
- [x] Add deterministic trigger helper (`seed`, `stepIndex` -> uniform `u`, trigger flag).
- [x] Add unit tests (edge cases, determinism, invariants, fuzz/property ranges).
- DoD: `npm test` covers the math + determinism invariants.

### Phase 2 — Backend API endpoints (benchmarks as a service) [x]
- [x] Router: `POST /api/benchmarks/collapse` returns `CollapseBenchmarkResult`.
- [x] Router: `POST /api/benchmarks/collapse/run` returns summary stats (trigger count, mean p, histograms).
- [x] Explain/audit endpoint returns resolved defaults + hashes.
- [x] Optional bridge endpoint: `GET /api/benchmarks/collapse/from-session?session_id=...&session_type=...` uses `dp_tau_estimate_ms` as default `tau_ms` (supports lattice summaries/sidecars + stale-hash guard).
- [x] Wire router into `server/routes.ts`.
- DoD: curl-able endpoints deterministic under fixed seed.

### Phase 3 — Warpfield/lattice integration (read real fields) [~]
- [x] Minimal field summary payload without uploading 3D textures: volume hash, voxel size, dims, coverage, optional shell radius estimate.
- [x] Shared `LatticeSummary` contract (generation-aware) so benchmarks bind to the current lattice; warn on stale/mismatched generation hash.
- [x] Adapter to derive default `r_c_m` from hull/lattice metadata (geometry proxy).
- [x] Optional server-side loader for exported lattice sidecars: load sidecar JSON metadata and derive summary from hashes/dims/coverage/band (cache-by-sha for full blobs pending).
- DoD: benchmark endpoints accept a lattice summary and emit `L_present_m` and `kappa_present` tied to that lattice generation. (Full texture ingestion and drive-magnitude stats remain future work.)

### Phase 4 — Curvature-unit coupling (shared yardstick) [x]
- [x] Define how curvature-unit outputs inform `tau` / `r_c` (shorter `tau` when instability rises).
- [x] Add optional `tau_estimator` mode (heuristic; benchmark-only).
- [x] Add tests/fixtures showing monotonic behavior (increasing instability -> shorter tau).
- DoD: `tau_ms` can be derived repeatably from a documented set of inputs.

### Phase 5 - Benchmark runner + CI regression [x]
- [x] Add CLI to load a manifest, run steps, and write JSON/CSV report with hashes and summary stats.
- [x] Add fixture manifest under `datasets/benchmarks/` (manual baseline + lattice-backed estimator case).
- [x] Add golden-report fixture + CI regression test (deterministic hashes; fails on drift/nondeterminism).
- DoD: one command produces a stable report and tests guard against regressions.

### Phase 6 - Codex prompting (automation recipes) [ ]
- [x] Document Codex prompt templates to trigger collapse benchmarks (manual inputs, session defaults, lattice sidecars).
  - **Manual inputs prompt (deterministic hash-bound run)**  
    ```
    Codex, hit {BASE_URL}/api/benchmarks/collapse with this JSON body (use curl -s and show me the response):
    {
      "schema_version": "collapse_benchmark/1",
      "dt_ms": 50,
      "tau_ms": 1000,
      "r_c_m": 0.25,
      "seed": "demo-seed",
      "lattice": {
        "lattice_generation_hash": "lattice:demo",
        "dims": [10,10,10],
        "voxel_size_m": 0.1,
        "coverage": 0.9
      }
    }
    Fail if the returned lattice_generation_hash differs from lattice:demo; expect deterministic JSON otherwise.
    ```
  - **Session defaults prompt (dp_tau_estimate_ms)**  
    ```
    Codex, call GET {BASE_URL}/api/benchmarks/collapse/from-session?session_id={ID}&session_type={TYPE}&dt_ms=50&r_c_m=0.3.
    If telemetry has no tau_ms, surface dp_tau_unavailable.
    Assert tau_source=session_dp_tau and p_trigger matches hazard(dt_ms, tau_ms) in the response; include the raw JSON.
    ```
  - **Lattice sidecar prompt (geometry-derived r_c_m)**  
    ```
    Codex, call GET {BASE_URL}/api/benchmarks/collapse/from-session with:
      session_id={ID}&session_type={TYPE}&dt_ms=40
      &lattice_sidecar_path=tests/fixtures/lattice.sidecar.fixture.json
      &expected_lattice_generation_hash=lattice:sidecar-fixture
    Expect r_c_source=geometry with lattice_generation_hash=lattice:sidecar-fixture bound; stale or mismatched hash should return 409.
    Return the JSON response.
    ```
- [x] Add example CLI invocations and curl snippets aligned with those prompts.
  - CLI (manifest runner to reproduce the CI golden locally):  
    ```
    npm run collapse:bench -- -m datasets/benchmarks/collapse-benchmark.fixture.json -o /tmp/collapse-report.json --csv /tmp/collapse-report.csv
    # emits JSON to stdout; also writes /tmp/collapse-report.json + /tmp/collapse-report.csv
    ```
  - Curl (manual body, deterministic lattice hash):  
    ```
    curl -s -X POST "$BASE_URL/api/benchmarks/collapse" -H "Content-Type: application/json" --data @- <<'EOF' | jq .
    {
      "schema_version": "collapse_benchmark/1",
      "dt_ms": 50,
      "tau_ms": 1000,
      "r_c_m": 0.25,
      "seed": "demo-seed",
      "lattice": {
        "lattice_generation_hash": "lattice:demo",
        "dims": [10,10,10],
        "voxel_size_m": 0.1,
        "coverage": 0.9
      }
    }
    EOF
    ```
  - Curl (session defaults, dp_tau_estimate_ms-backed):  
    ```
    curl -sG "$BASE_URL/api/benchmarks/collapse/from-session" \
      --data-urlencode "session_id={ID}" \
      --data-urlencode "session_type={TYPE}" \
      --data-urlencode "dt_ms=50" \
      --data-urlencode "r_c_m=0.3" | jq .
    ```
  - Curl (lattice sidecar, geometry-derived r_c_m, stale-hash guard):  
    ```
    curl -sG "$BASE_URL/api/benchmarks/collapse/from-session" \
      --data-urlencode "session_id={ID}" \
      --data-urlencode "session_type={TYPE}" \
      --data-urlencode "dt_ms=40" \
      --data-urlencode "lattice_sidecar_path=tests/fixtures/lattice.sidecar.fixture.json" \
      --data-urlencode "expected_lattice_generation_hash=lattice:sidecar-fixture" | jq .
    # expect HTTP 409 if expected_lattice_generation_hash does not match the sidecar's hash
    ```
- [x] Surface common failure cases (stale lattice hash, missing dp_tau, malformed sidecar) with suggested prompt wording.
  - Stale lattice hash (409): "If you get 409 stale_lattice_hash, reload the current lattice sidecar and set expected_lattice_generation_hash to its hash, or regenerate the sidecar before retrying."
  - Missing dp_tau in session telemetry: "If tau_ms is absent, return dp_tau_unavailable and ask for a session with dp_tau_estimate_ms populated (or supply tau_ms manually)."
  - Malformed sidecar / unreadable path (400): "If the sidecar cannot be parsed or found, surface the JSON parse/path error and ask for a valid lattice_sidecar_path (or switch to manual r_c_m)."
- [x] DoD: Codex users can copy a prompt and get a successful benchmark run or actionable error.

### Phase 7 - Codex prompting (autofix + regressions) [ ]
- [ ] Add Codex prompt flow to auto-run regression tests/goldens when modifying collapse codepaths.
- [ ] Include prompts to generate/update golden fixtures safely (behind explicit confirmation).
- [ ] Provide prompts for adding new lattice summaries or sidecars to tests/fixtures with provenance notes.
- [ ] DoD: Codex flows exist for “run tests”, “update golden”, and “add lattice fixture” without manual spelunking.

## Suggested output fields (v1)
- `tau_ms`, `dt_ms`, `p_trigger`
- `r_c_m`, `c_mps`, `L_present_m`
- `kappa_present_m2 = 1 / L_present_m^2`
- `schema_version`, `data_cutoff_iso`
- `tau_source`, `r_c_source`, `features_hash` / `inputs_hash`
- `seed`, `step_index`, `u`, `trigger`
- optional: `kappa_drive_m2`, `kappa_body_m2`, and ratios when available; `lattice_generation_hash` when lattice-backed
