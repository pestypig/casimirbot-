# RayTracingMIS Service Integration

This turns the Alcubierre `mis-service` lane into a separate renderer process backed by the Unity project from:

- `https://github.com/ComputationallyBased/RayTracingMIS`

## Why this path

`RayTracingMIS` is a known MIS path-tracing implementation with explicit BVH + direct-light sampling logic.  
Using a separate process gives a clean boundary between:

- canonical metric/diagnostic generation in CasimirBot
- image synthesis in a dedicated renderer runtime

That is safer than treating generated UI shaders as scientific evidence.

## Setup

### One-command rollout (recommended)

```bash
npm run hull:mis:rollout
```

This does:
- clone/update RayTracingMIS
- install the bridge script into the Unity project
- start `hull:mis:service`
- start CasimirBot app (`dev:agi:5050`) with strict proxy env
- verify strict scientific-lane readiness and fail if fallback lane is active

If another app server is already running on the same URL, rollout validates that
existing process instead of starting a second one.

Optional flags:
- `--skip-prepare` (skip clone/bridge copy)
- `--doctor-only` (status check only; does not launch processes)
- `--allow-unity-not-ready` (debug only; not scientific lane)
- `--app-script <npm-script>` (override app start script)
- `--app-base-url <url>` (default `http://127.0.0.1:5050`)

### Manual steps

1. Clone the renderer project:

```bash
npm run hull:mis:clone
```

2. Install the bridge execute-method into the Unity project:

```bash
npm run hull:mis:install-bridge
```

3. Set Unity editor path (example on Windows):

```powershell
$env:RAYTRACINGMIS_UNITY_EDITOR="C:\Program Files\Unity\Hub\Editor\2022.3.72f1\Editor\Unity.exe"
```

4. Start the renderer service:

```bash
npm run hull:mis:service
```

The service exposes:

- `GET http://127.0.0.1:6061/api/helix/hull-render/status`
- `POST http://127.0.0.1:6061/api/helix/hull-render/frame`

5. Point CasimirBot proxy to the service and fail closed:

```powershell
$env:MIS_RENDER_SERVICE_URL="http://127.0.0.1:6061"
$env:MIS_RENDER_PROXY_STRICT="1"
```

With strict mode on, CasimirBot returns `502 mis_proxy_failed` if the service fails, instead of silently falling back.

## Service env variables

- `MIS_RENDER_SERVICE_HOST` (default `127.0.0.1`)
- `MIS_RENDER_SERVICE_PORT` (default `6061`)
- `RAYTRACINGMIS_PROJECT_DIR` (default `external/RayTracingMIS`)
- `RAYTRACINGMIS_UNITY_EDITOR` (required for Unity rendering)
- `RAYTRACINGMIS_SCENE` (default `Assets/Scenes/CornellBox2.unity`)
- `RAYTRACINGMIS_EXECUTE_METHOD` (default `CasimirBot.HullRenderBridge.RenderFromCli`)
- `RAYTRACINGMIS_TIMEOUT_MS` (default `90000`)
- `RAYTRACINGMIS_ALLOW_SYNTHETIC` (default off; set `1` only for non-scientific debug fallback)

## Scientific integrity policy

- Keep `MIS_RENDER_PROXY_STRICT=1` in scientific lane.
- Keep `RAYTRACINGMIS_ALLOW_SYNTHETIC` unset in scientific lane.
- Treat synthetic fallback as teaching/debug only.
