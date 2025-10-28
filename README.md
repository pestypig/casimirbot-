# CasimirBot

Warp-field research cockpit that pairs a Helix Core operations console with the supporting physics services, simulation assets, and archival "warp web" experiments. The repository contains both the real-time React client and the Express/TypeScript backend that brokers drive telemetry, curvature bricks, and pump controls.

## Features
- **Helix Core dashboard** - Modular panels for sector duty coordination, parametric sweeps, spectrum tuning, and live warp visualisation (see `client/src/pages/helix-core.tsx`).
- **Hull 3D renderer** - WebGL2 ray-marcher with curvature, sector, and overlay diagnostics driven by the shared hull store (`client/src/components/Hull3DRenderer.ts`).
- **Physics + scheduling services** - Energy pipeline modelling, curvature brick generation, and instrumentation endpoints implemented in the server (`server/energy-pipeline.ts`, `server/curvature-brick.ts`, `server/instruments/`).
- **Static research archives** - Halobank timeline and warp ledger microsites live under `warp-web/` with shared assets in `halobank-spore-timeline.js`.
- **Design documentation** - Patch plans, focused reports, and sweep design notes in `PATCH_PLAN.md`, `REPORT.md`, and `docs/`.

## Repository tour
- `client/` - React app (Vite + TypeScript) and component library. Hooks under `client/src/hooks/` expose energy and curvature pipelines, while shared stores live in `client/src/store/`.
- `server/` - Express server bootstrapped via `server/index.ts`, with feature modules in `server/energy-pipeline.ts`, `server/routes.ts`, and instrumentation helpers in `server/instruments/`.
- `modules/` - Physics engines and numerical tooling shared between client and server.
- `shared/` - Zod schemas (`shared/schema.ts`) consumed on both sides of the stack.
- `warp-web/` - Stand-alone HTML experiments and documentation pages.
- `docs/` - In-repo briefs for upcoming sweeps and feature work.
- `sim_core/` - Static calibration data (`phase_calibration.json`) bundled with the build.
- `.cal/` - Runtime calibration logs dropped by the phase calibration utilities (ignored by Git by default).

## Getting started
1. **Install prerequisites**
   - Node.js 20.x (the project uses native ESM and `tsx`)
   - npm 10.x (ships with Node 20)
   - Optional: Python 3.11 + `requests`, `numpy` for `tests/test_dynamic.py`
2. **Install dependencies**
   ```bash
   npm install
   ```

## Running locally
```bash
npm run dev
```

The dev script launches the Express server with Vite middleware. Visit [http://localhost:5173](http://localhost:5173) for the client UI; API routes mount under the same origin via Express.

### Useful npm scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start Express + Vite in development mode. |
| `npm run build` | Build the client via Vite and bundle the server with esbuild into `dist/`. |
| `npm start` | Serve the production build from `dist/`. |
| `npm test` | Run Vitest suites (`client/src/lib/warp-pipeline-adapter.test.ts`, component tests, etc.). |
| `npm run db:push` | Apply Drizzle schema changes to the configured database. |

## Testing
- **Unit & integration** - `npm test` executes Vitest suites co-located with the client/lib code.
- **Python physics checks** - `tests/test_dynamic.py` targets a running simulation service at `http://localhost:5000`. Activate your Python environment (see `pyproject.toml`) and run `pytest` when the simulator is available.

## Production build
```bash
npm run build
npm start
```

The build emits static client assets to `dist/public/` and bundles the server entry to `dist/index.js`. Ensure the `dist/public` directory is present before starting production mode.

## Environment controls
- `PUMP_DRIVER` - Set to `mock` (default) to use the in-process pump driver (`server/instruments/pump-mock.ts`); provide a custom driver identifier to integrate real hardware.
- `PUMP_LOG` - When `1`, logs pump duty updates to stdout.
- `PUMP_MOCK_SETTLE_MS`, `PUMP_MOCK_JITTER_MS` - Tune timing characteristics for the mock pump.
- `HELIX_PHASE_CALIB_JSON` - Override the path to the phase calibration JSON (`sim_core/phase_calibration.json` by default).
- `PHASE_CAL_DIR` - Directory for calibration logs (`.cal/phase-calibration-log.jsonl` when unset).

## Static research sites
The `warp-web/` directory contains HTML microsites (e.g. `km-scale-warp-ledger.html`) that reference the same JavaScript helpers used in the Helix Core client. Open the files directly in a browser or host them via `npm run dev` to leverage Express static serving.

## Contributing
1. Create a feature branch from `main`.
2. Run `npm run build` and `npm test` before pushing.
3. Keep large binaries and generated logs out of Git; calibration logs land in `.cal/` which is ignored by default.
