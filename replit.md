# Casimir Effect Simulation Tool

## Overview
This web-based application simulates the Casimir effect, allowing users to configure simulations, generate geometry files, and visualize results. It integrates with the SCUFF-EM computational electromagnetics package for calculations across various geometries (sphere, parallel plates, bowl). The long-term vision is a comprehensive research platform supporting dynamic effects, array physics, and integration with SCUFF-EM binaries and the Einstein Toolkit. The project also lays the foundation for advanced studies, including warp bubble research using pre-configured "Needle Hull" simulations and interactive exploration of design parameters.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **UI**: shadcn/ui (Radix UI) and Tailwind CSS.
- **State Management**: React Query.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Visualization**: Recharts for data display, WebGL for 3D spacetime curvature visualization, Canvas for Casimir Tile Grid.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Build Tool**: Vite (dev) and esbuild (prod).
- **Real-time**: WebSocket for simulation updates.
- **File Management**: Local filesystem for simulation files.

### Data Storage
- **Development**: In-memory `Map`.
- **Production**: Drizzle ORM configured for PostgreSQL, with PostgreSQL session store.
- **Shared Schemas**: Zod for type safety.

## Replit Deployment Notes (Local vs Deploy)
Use this section to keep deploy behavior aligned with local testing.

### Why "Cannot GET /desktop" Happens
- The SPA fallback (`dist/public/index.html`) is mounted inside **bootstrap** (after validation + route registration).
- If bootstrap **fails** or is **deferred**, Express has no static handler yet → `Cannot GET /desktop`.

### Deploy Command (Known-Good)
Use build + dist server with static assets.

**Build command (Replit deploy/preview):**
```
bash -lc "VITE_HELIX_ASK_JOB_TIMEOUT_MS=600000 npm run build && node scripts/deploy-clean.cjs && npm prune --omit=dev"
```

**Run command (Replit deploy/preview):**
```
env NODE_ENV=production PORT=5000 HOST=0.0.0.0 NOISEGEN_STORAGE_BACKEND=replit FAST_BOOT=0 REMOVE_BG_PYTHON_BIN=python \
SKIP_MODULE_INIT=0 DEFER_ROUTE_BOOT=0 HEALTH_READY_ON_LISTEN=0 \
VITE_HELIX_ASK_MAX_TOKENS=4096 VITE_HELIX_ASK_CONTEXT_TOKENS=4096 \
LLM_LOCAL_CONTEXT_TOKENS=4096 LLM_LOCAL_MAX_TOKENS=2048 \
HELIX_ASK_JOB_TIMEOUT_MS=600000 LLM_LOCAL_SPAWN_TIMEOUT_MS=600000 \
HELIX_ASK_BELIEF_UNSUPPORTED_MAX=0.95 HELIX_ASK_JOB_STALE_MS=1200000 \
ENABLE_ESSENCE_PROPOSALS=0 ENABLE_ESSENCE_JOBS=0 \
node dist/index.js
```

Notes:
- `VITE_HELIX_ASK_JOB_TIMEOUT_MS` is **build-time** only; it is now inlined via Vite `define`. Rebuild to change it.
- `HELIX_ASK_BELIEF_UNSUPPORTED_MAX=0.95` relaxes the belief gate for general questions (prevents the “weakly reflected” fallback).
- Set `HELIX_ASK_BELIEF_GATE=0` only for short-term debugging.
- `SKIP_MODULE_INIT=0` keeps physics modules initialized (recommended for the warp pipeline).

### Helix Ask Timeouts (Build vs Runtime)
These are three separate controls and all must be aligned:
- **Client UI timeout (build-time):** `VITE_HELIX_ASK_JOB_TIMEOUT_MS` in the build command. This controls when the browser shows “Request timed out.”
- **Server job timeout (runtime):** `HELIX_ASK_JOB_TIMEOUT_MS` in the run command. This controls when the server marks a job as failed.
- **LLM spawn timeout (runtime):** `LLM_LOCAL_SPAWN_TIMEOUT_MS` in the run command. This controls how long the model process can take.

Optional:
- **Job reaper window (runtime):** `HELIX_ASK_JOB_STALE_MS` to clean up orphaned jobs after restarts.

Legacy (local) command:
```
npm run build
env REPLIT_DEPLOYMENT=1 NODE_ENV=production PORT=5000 HOST=0.0.0.0 \
NOISEGEN_STORAGE_BACKEND=replit FAST_BOOT=0 REMOVE_BG_PYTHON_BIN=python \
SKIP_MODULE_INIT=0 DEFER_ROUTE_BOOT=0 HEALTH_READY_ON_LISTEN=0 \
node dist/index.js
```

### Known-Good Checklist (Preview/Deploy)
- Build completes and `dist/index.js` exists.
- Bundle contains the baked timeout:
  - `rg -n "180000|600000|1200000" dist/public/assets/*.js`
- `/` responds `200` quickly (health check passes).
- Helix Ask completes a long question (< 10 minutes) with `HELIX_ASK_JOB_TIMEOUT_MS=600000`.
- If UI times out, confirm job status with:
  - `curl -s http://localhost:5000/api/agi/ask/jobs/<JOB_ID> | jq .`
- If deploy health checks fail on `/` during heavy startup (model hydration), re-run the deploy.
  - If it persists, you can temporarily add `ROOT_LIVENESS_ALWAYS=1` to force a fast 200 on `/` (but it disables the root redirect).

### Helix Ask Job Persistence Notes
- The client first uses `/api/agi/ask/jobs` and polls `/api/agi/ask/jobs/:jobId`. If the job API returns 404/405, it falls back to synchronous `/api/agi/ask`.
- Jobs persist in Postgres when `DATABASE_URL` is set; otherwise they use an in-memory store (lost on restart).
- Orphaned jobs (server restart mid-run) are now reaped automatically. Control the window with:
  - `HELIX_ASK_JOB_STALE_MS` (defaults to `HELIX_ASK_JOB_TIMEOUT_MS`)
- The poller now extends its deadline to the job `expiresAt` (TTL), so long jobs can complete even if they exceed the client default.
- If UI times out but the server finished, check:
  - `curl -s http://localhost:5000/api/agi/ask/jobs/<JOB_ID>`
  - If status is `completed`, the UI likely stopped polling (stale bundle or poller errors).
Notes:
- **Avoid** `DEFER_ROUTE_BOOT=1` in deploy; it can serve requests before bootstrap, causing 404s.
- `SKIP_MODULE_INIT=0` is recommended for full physics initialization.
- Replit forces port **5000**; if already in use, the server will exit with a clear error.

### Runtime Artifacts (LLM Hydration)
The deployment pulls model/index/llama-cli from Replit Object Storage at boot. Run this **only when artifacts change**
(model, LoRA, code-lattice.json, llama-cli) or if object storage is wiped:
```
npx tsx scripts/upload-runtime-artifacts.ts
```
Then copy the printed `LLM_LOCAL_*` entries into **Publishing** environment variables and republish.
If Helix Ask throws `spawn ... llama-cli ENOENT`, the deployment did not receive these envs.
If logs show `spawn ... llama-cli ENOENT` **but** the file exists, the binary is likely dynamically linked against
`/nix/store/.../ld-linux...` (missing in deploy). Fix by uploading a **statically linked** llama CLI:
- Build in Replit nix shell with musl + static + OpenMP disabled, then copy `build-musl/bin/llama-completion` to
  `.cache/llm/llama-build/bin/llama-cli` and re-upload.
- Keep `LLM_LOCAL_CMD_OBJECT_KEY=llama-cli`, update `LLM_LOCAL_CMD_SHA256` to the new hash from the upload script.
- If deploy logs show `llama-cli sha256 mismatch`, the artifact uploaded but Publishing secrets still hold the old
  `LLM_LOCAL_CMD_SHA256`. Update it to the new value and republish.

### 2026-01-29 Session Notes (LLM Hydration Debug)
- Root issue was intermittent `spawn ... llama-cli ENOENT` in deploy logs; local runs worked.
- We reordered hydration so `llama-cli` is fetched before model/lora/index.
- Added runtime artifact diagnostics (path/size/mode) and spawn diagnostics on error.
- Discovered `llama-cli` build does not accept `--stop`; added fallback to `--reverse-prompt` for stop sequences (optional override via `LLM_LOCAL_STOP_FLAG`).
- Publishing secret now set: `LLM_LOCAL_STOP_FLAG=--reverse-prompt`.
- Publishing secret `LLM_LOCAL_CMD` should be absolute: `/home/runner/workspace/.cache/llm/llama-build/bin/llama-cli`.
- `LLM_LOCAL_ARGS_BASE` is not set.
- Expected deploy log signals now:
  - `[runtime] downloading llama-cli from object storage`
  - `[runtime] llama-cli state path=... size=... mode=755`
  - `[runtime] llama-cli hydrated (...)`
  - `[runtime] artifact labels=llama-cli, index, lora, model`
  - `[runtime] index already hydrated (...)` can appear when cached.
- If ENOENT returns, grab lines starting with `[llm.local.spawn]` and the artifact state lines above.

### 2026-01-30 Session Notes (LLM Empty Output)
- `llama-cli` in this runtime is built **without `--jinja`**, so `--chat-template qwen2` fails.
- `--log-disable` causes **zero-byte stdout/stderr** even when the process exits 0.
- `-no-cnv` is required to avoid interactive conversation mode waiting on stdin.
- Fix: avoid `--chat-template qwen2`; set `LLM_LOCAL_LOG_DISABLE=0` or rely on the retry fallback that drops `--log-disable` on empty output.

### Local Prod-Like Verification
Run locally and confirm SPA fallback:
```
REPLIT_DEPLOYMENT=1 NODE_ENV=production SKIP_MODULE_INIT=0 DEFER_ROUTE_BOOT=0 node dist/index.js
curl -i http://127.0.0.1:5000/desktop
curl -i http://127.0.0.1:5000/does-not-exist
```
Expected: both return `200` with `index.html`.

### If Deploy Still 404s
Check deploy logs for:
- `[server] bootstrap failed`
- `ideology-verifiers validation failed`
- `Could not find the build directory`

Verify these exist in the deploy bundle:
- `dist/public/index.html`
- `docs/ethos/ideology.json`
- `configs/ideology-verifiers.json`
- `server/_generated/code-lattice.json`

### Key Features & Design Decisions
- **SCUFF-EM Integration**: Service layer for generating `.scuffgeo` files and executing simulations, including mesh management.
- **Real-time Feedback**: WebSocket-based progress and status updates during simulations.
- **Physics Integration**: Implements authentic SCUFF-EM physics, including Lifshitz formula, Proximity Force Approximation (PFA), and Matsubara formalism. Energy formatting uses exponential notation.
- **Modular Architecture**: Designed for expansion into dynamic Casimir effects, array physics, and advanced materials.
- **UI/UX**: Radar charts, traffic light systems, individual metric cards, interactive mesh visualization, and cross-section rendering.
- **Needle Hull Preset**: Pre-configured simulation for warp bubble research, incorporating geometric and physical parameters, amplification factors (geometric, Q-enhancement, Van-den-Broeck), and power mitigation.
- **Quality Assurance**: Unit tests, real-time UI validation, golden standards for regression testing, and convergence validation.
- **Target-Value Ledger Verification**: Verifies simulation results against research paper specifications for exotic mass and power using a traffic-light system.
- **Multi-Dimensional Design Explorer**: Interactive phase diagram (heatmap) for real-time exploration of viable design regions based on adjustable physics parameters and configurable constraint tolerances (power, mass, quantum safety). Supports ellipsoid geometry.
- **Live Energy Pipeline**: Step-by-step display of physics equations with real-time parameter substitution, showing calculation flow.
- **Operational Modes**: System for switching between predefined modes (e.g., Hover, Cruise, Emergency, Standby) with real-time calculations.
- **Documentation System**: Integrated access to research papers, physics guides, and API references.
- **3D Spacetime Curvature Visualization**: Real-time WebGL grid rendering of authentic Natário warp bubble deformation effects, with integration of operational modes. Features three orthogonal sheets displaying physics-accurate parameter mapping and York-time coloring.
- **Zen Long Toasts System**: Educational feedback providing theory explanations and philosophical reflections for UI interactions, with authentic physics context and wisdom quotes.
- **Luma Atmospheric System**: Cosmic guardian star background with whisper overlay system for enhanced user experience and contextual guidance.
- **Mission Start Portal**: Entry page at root `/` with mission profiles (Radiant Optimist, Engineer, Diplomat, Strategist) for progressive disclosure of content. Main application is at `/bridge`.
- **Enhanced UI Components**: Reusable Tooltip component and interactive AmplificationPanel displaying real-time multiplication chains (γ_geo × q_spoiling × γ_VdB) with live physics calculations.
- **Canvas-Based Casimir Tile Grid**: High-performance Canvas component for sector visualization with 60fps animation, physics-driven strobing, and real-time sector activation.
- **Strobing Physics Corrections**: Corrected fundamental strobing calculations for exotic mass and power, incorporating femtosecond burst duty and time-slicing mathematics. Includes transparency fields for active fraction, duty, and strobe frequency.
- **Sector-Aware Ford-Roman ζ Calculation**: Redesigned time-sliced strobing with sector scaling, ensuring consistent ζ calculation across modes and proper Ford-Roman compliance.
- **Role-Based Station System**: Personal workstation system for different mission profiles at `/station/role` with role-appropriate metrics, live physics data, and navigation.
- **Hull Geometry Accuracy**: Corrected hull radius calculations to use actual Needle Hull dimensions (1.007 km) for geometric time-scale calculations, ensuring scientific accuracy across all physics.
- **Visual-Physics Alignment**: Integrated authentic ellipsoidal needle hull geometry into 3D WebGL visualization, matching physics calculations.
- **Smooth Natário Ridge Fix**: Implemented smooth C¹-continuous transitions in physics sampler using softSign and soft wall envelope windowing to eliminate jagged visual artifacts in the warp bubble.
- **Paper-Backed Constants Module**: Comprehensive physics refactoring using authentic research constants (TOTAL_SECTORS=400, BURST_DUTY_LOCAL=0.01, Q_BURST=1e9, GAMMA_VDB=1e11, RADIAL_LAYERS=10, tile area=25 cm²) with "honest raw math" approach. Features paper-authentic tile census (~1.96 billion tiles), proper sector scheduling (2 live sectors for hover mode), and Ford-Roman compliance (ζ=0.02). Includes optional CRUISE_CALIBRATION=1 mode with two-knob system: qMechanical (power-only) and γ_VdB (mass-only) to hit exact paper targets (7.4 MW, 1405 kg) while maintaining authentic physics calculations. Complete audit system prevents parameter drift and ensures consistency across the entire energy pipeline.
- **Physics Accuracy Corrections**: Fixed critical calculation drift issues including: accurate active tiles calculation with proper 1% burst duty integration, corrected γ_VdB defaults (3.83e1 vs 2.86e5), physics-accurate Time-scale ratio (5.03e4 vs ~4k), epsilon tilt using computed values (5e-7) instead of hard fallbacks (0.012), and proper ζ computation from duty effective when pipeline values unavailable. Enhanced VisualProofCharts to use live pipeline data with fallback compatibility, ensuring all UI components reflect authentic server-driven physics values. Applied mode-aware power/mass fallbacks and fixed Time-Scale badge logic (TS > 1 = SAFE). Eliminated all hardcoded 0.012 epsilonTilt overrides in helix-core.tsx for WarpVisualizer and ShellOutlineVisualizer components.
- **WebGL Performance Optimizations**: Applied systematic optimizations to WarpEngine including corrected physics parameter defaults (γ_VdB=3.83e1), enhanced parameter change detection to avoid redundant WebGL calculations, proper cleanup methods with destroy() functionality for memory management, and fixed wall width calculation units by removing incorrect multipliers for accurate physics representation. Implemented performance improvements through parameter validation and optimized render loop.
- **Comprehensive Mode Policy System**: Implemented MODE_POLICY framework with per-mode power/mass targets that are automatically hit by scaling qMechanical (power-only) and γ_VdB (mass-only). Features smart sector scheduling with S_live resolution ('all'→400, specific numbers for precision), quantum-safety proxy with paper-tight Q_quantum=1e12, and Ford-Roman compliance monitoring. Modes: hover (83.3 MW, 1000 kg, all sectors), cruise (7.437 W, 1000 kg, 1 sector), emergency (297.5 MW, 1000 kg, all sectors), standby (0 MW, 0 kg, 0 sectors). Maintains authentic physics foundation while achieving exact research targets through calibrated two-knob approach.
- **Physics Parameter Consistency Fixes**: Eliminated duplicate MODE_UI table and qSpoilingFactor inconsistencies by using MODE_CONFIGS directly. Added explicit unit documentation (all P_target values in watts), exported PAPER constants for UI reference, and implemented development-time unit validation checks. Ensures consistent physics parameters across all system components.
- **Persistent Slice Preferences System**: Implemented global slice viewer preferences using localStorage and event bus pattern. Features useSlicePrefs hook for managing exposure (1-12), sigmaRange (2-12), diffMode, and showContours settings. Preferences persist across mode switches and browser sessions, with real-time broadcasting to other panels. Includes intuitive UI controls with sliders and toggles.
- **HelixCasimirAmplifier Integration**: Successfully integrated drop-in Helix Core visualizer component into HELIX-CORE page as dedicated physics pipeline visualization section. Component features complete Casimir energy amplification chain visualization with real-time displacement field heatmaps, power/mass ladder charts, physics cross-checks, and mode controls. Connects to live backend endpoints (/api/helix/metrics, /api/helix/pipeline, /api/helix/displacement, /api/helix/mode) for authentic pipeline-driven physics display.
- **Shared Light-Crossing Loop System**: Implemented unified physics-accurate clock synchronization using `useLightCrossingLoop` hook for all visual components. Features τ_LC constraint compliance, server sector synchronization, physics-accurate duty cycle calculations, and shared timeline state. ResonanceSchedulerTile now uses shared clock for perfect phase-locking with Casimir tile grid and other visual elements, ensuring consistent strobing behavior across the interface. Centralized in HelixCore component and distributed to both LightSpeedStrobeScale and HelixCasimirAmplifier components for perfect synchronization.
- **Time-Evolving Casimir Cavity Energy System**: Implemented physics-accurate cavity energy dynamics in HelixCasimirAmplifier using shared light-crossing loop. Features real-time cavity energy evolution respecting τ_LC and Q constraints, with ring-up/ring-down dynamics during ON/OFF windows. Displays live τ_LC, τ_Q, and U(t)/U∞ readouts plus visual energy bar with phase-locked ON/OFF indication. Uses cavity time constant τ_Q = Q/(πf) for authentic physics-based energy evolution synchronized to shared strobing timeline. Complete TypeScript type safety with extended EnergyPipelineState interface (qMechanical, sagDepth_nm, overallStatus fields), live hull geometry integration, and modern React event handling (onKeyDown vs deprecated onKeyPress).
- **Streamlined Cosmetic Control System**: Removed Slice Controls panel UI for cleaner interface. Cosmetic curvature control now available exclusively through browser console API `window.__warp_setCosmetic(level)` where 1=pure physics visualization and 10=current visual exaggeration. All visual amplifiers neutralized except cosmetic blending system. SliceViewer operates with fixed optimal defaults (exposure=6, sigmaRange=6, showContours=true, diffMode=false).

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Database ORM.
- **@tanstack/react-query**: Server state management.
- **react-hook-form**: Form handling and validation.
- **recharts**: Data visualization.
- **@radix-ui/***: UI primitives.
- **tailwindcss**: CSS framework.
- **class-variance-authority**: Component variants.
- **cmdk**: Command palette.
- **tsx**: TypeScript execution.
- **vite**: Frontend build tool.
- **esbuild**: JavaScript bundler.
