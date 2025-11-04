# Helix Collapse Engine (HCE)

This document links the physics-derived control parameters to the concrete server and
client implementation. Use it as the reference point when verifying determinism,
energy stability, or wiring new interfaces.

## Deterministic core

- Integrator and branch sampling live in `server/services/hce-core.ts`.
- `evolveRun` advances the latent state with fixed sub-steps and stores the most
  recent frame (used for SSE replay).
- `deterministicFrameUniform` keeps branch selection repeatable across stream,
  `/measure`, and the audio pipeline.
- Property tests in `tests/hce-core.spec.ts` cover:
  - Deterministic replay (`seed` parity, identical audio packets).
  - Time step invariance (branch agreement when halving dt).
  - Bounded energy norm during long simulations.

## Audio worklet

- `client/src/audio/HelixNoise.worklet.ts` implements the deterministic noise
  engine. Peak bank updates crossfade (constant power) over ~20?ms.
- RNG identity is tied to `(seed, branch)` via XorShift32.
- Recording support (`record` message) lets the UI capture 10?s PCM for PSD
  estimates.

## SSE stream

- `/api/hce/stream` (server/routes/hce.ts) now batches frames at 15–20?Hz,
  provides heartbeats, and replays the last frame on reconnect.
- Backpressure is handled by pausing the producer until `res.drain` fires.

## Measurement determinism

- `/api/hce/measure` pulls the same uniform variate used by the stream so any
  client (UI, REST caller, tests) agrees on branch selection.
- Rate limiting: both `/measure` and `/stream` share a small in-memory token
  bucket (8 hits / 5?s and 6 hits / 10?s per IP).

## Sharing & permalinks

- `POST /api/hce/share` persists `{seed, params}` either to Postgres
  (`hce_runs` table) or an in-memory map when `DATABASE_URL` is absent.
- `GET /api/hce/share/:id` rehydrates the run; the client (`helix-observables.tsx`)
  plugs the payload into `configure` and restores UI state.

## Evidence metrics (Evidence tab)

Located in `client/src/pages/helix-observables.tsx` + `client/src/lib/hce-metrics.ts`:

- Mutual information curve vs weirdness `T` (discrete bins, log2).
- Branch dwell histogram (seconds ? ms for display).
- Welch PSD + Lorentzian fit to estimate peak amplitudes.
- CSV export includes MI rows and dwell samples.

Recording pipeline:

1. Worklet receives `record` message and streams 10?s PCM back through
   `postMessage`.
2. Buffer is optionally downsampled (8?kHz) before Welch.

## Luma + Noisegen hooks

- `server/routes/luma-hce.ts` exposes `/api/luma/ops/hce_explain`, translating
  branch selection into structured prose.
- Noisegen UI has a “Link Helix” toggle that forwards the latest Helix packet
  (seed, rc, tau, peaks) alongside generation requests. Packets persist in
  `localStorage` (`helix:lastPacket`).

## Schemas & clamps

- Zod clamps (`rc`, `tau`, peak bounds, etc.) live beside the HCE routes and are
  shared with permalink payloads.
- `shared/hce-types.ts` exposes the new audio packet shape (`type: "set"`) and
  is consumed by both server and client.

## Testing

- Vitest config now sits at the repo root (`vitest.config.ts`) with scripts:
  - `npm run test` ? `vitest run`
  - `npm run test:watch`
  - `npm run test:repo`

Run `npm run test:repo` from the workspace root to execute all spec files under
`tests/`.
