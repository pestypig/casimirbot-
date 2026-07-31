# Local runtime memory optimization audit — 2026-07-29

## Verdict

The low-memory runtime is suitable for the intended local Minecraft/Helix
development loop on this machine. In the clean representative concurrent run,
the keyed static workstation, Fabric server, headless Minecraft player,
connector traffic, and a real multi-tool Codex turn retained 3,654 MiB minimum
available physical memory and ended with paging at zero. The server averaged
978 MiB private memory and settled at 979 MiB. This is 49.6% below the original
1,944 MiB keyed-workstation settled result and clears the required 35%
reduction. It is slightly above the 800–900 MiB stretch range.

The result does not justify running a production Vite build concurrently with
Minecraft. Vite itself reached about 3.8 GiB private memory during this audit
and temporarily drove available memory below 1 GiB. That is a build-time
operator constraint, not the runtime budget.

## Hardware and method

- Windows 11 Home 10.0.26200
- 15.78 GiB physical memory
- 16 logical processors
- Keyed server launched only through `start-myapp-for-codex`
- Process-tree private bytes and working set from Windows process APIs
- Node RSS/heap from `/api/runtime/memory`
- Available/committed memory and paging from Windows performance counters
- Three-second samples, JSONL/CSV evidence, and Task Manager-style process
  attribution

The profiler records listener descendants separately from tracked Node,
browser/WebView, Codex, Java, and Javaw processes. Private bytes are the primary
server ownership measure; RSS and heap explain allocator/cache behavior.
Available memory and paging decide whether the complete machine can sustain the
workload.

## Representative measurements

| Workload | Server private average | Peak | Settled | Minimum available | Paging average / final |
|---|---:|---:|---:|---:|---:|
| Original keyed Vite workstation | 1,669 MiB | 2,030 MiB | 1,944 MiB | 3,411 MiB | 232 / 0 pages/s |
| Static server, no UI | 837 MiB | 1,517 MiB | 798 MiB | 5,019 MiB | 16 / 0 pages/s |
| Low-memory keyed settled | 778 MiB | 1,360 MiB | 763 MiB | 3,086 MiB | 43 / 1,124 pages/s |
| First Fabric/player/live probe | 1,324 MiB | 1,669 MiB | 1,480 MiB | 2,628 MiB | 455 / 4,081 pages/s |
| Optimized browser + Fabric + player + live probe | 978 MiB | 1,076 MiB | 979 MiB | 3,654 MiB | 89 / 0 pages/s |
| Clean rebuilt account workstation, accumulated local DB | 1,370 MiB | 1,605 MiB | 1,548 MiB | 5,367 MiB | 24 / 3 pages/s |

Primary acceptance evidence:

- `artifacts/performance/local-runtime-memory/optimized-keyed-browser-fabric-player-live-probe-20260729-200043/summary.json`
- `artifacts/minecraft-situation-live/performance-goal-final-20260729/`
- `artifacts/performance/local-runtime-memory/final-clean-keyed-account-workstation-20260729-201837/summary.json`

One later full-stack capture overlapped the production build and is intentionally
excluded from the acceptance budget:
`final-incremental-snapshot-keyed-browser-fabric-player-probe-20260729-201054`.
It is retained as evidence of the build-time pressure boundary.

## Attribution and changes

1. Vite middleware/HMR was the largest avoidable startup owner. `npm run dev`
   now selects the prebuilt static low-memory profile; `npm run dev:hmr`
   remains available when live client development is required.
2. The global Luma provider had been polling the large physics pipeline even
   when no physics panel was visible. It now observes cached pipeline data
   without initiating fetches. Visible physics panels still fetch normally.
3. Browser performance telemetry was reduced from one-second to ten-second
   delivery. Account-panel status refresh was reduced from five to fifteen
   seconds; mutations and the manual refresh button still refresh immediately.
4. Local pg-mem persistence no longer serializes after every mutation. It
   coalesces writes for five idle seconds with a bounded thirty-second maximum,
   writes compact JSON atomically, retains the required 24-hour ingress
   idempotency window, and refreshes only mutated tables after the first
   snapshot. A real room cleanup refreshed 9/39 tables in 444 ms.
5. Startup and post-task/persistence idle GC are enabled only in the
   low-memory profile. A representative tool turn reclaimed heap from
   1,018 to 353 MiB in 241 ms; cleanup persistence reclaimed 890 to 344 MiB
   in 237 ms. GC does not run while governed runtime tasks are active.
6. The profiling harness now follows wall-clock sample deadlines rather than
   adding endpoint latency to every interval.

No capability, freshness rule, evidence, terminal-authority rule, developer
surface, or current-turn observation was removed. Production PostgreSQL and the
explicit HMR/full development profile retain their prior behavior.

## Functional and latency evidence

- Inventory/status turn: PASS, 55.7 s; health, hunger, effects, armor, and
  inventory re-entered as current-turn evidence; no credential leak.
- Threat/hazard turn: PASS, 59.5 s; nearby creeper, zombie, and magma block
  re-entered and produced an authoritative compound answer; no credential leak.
- Fabric manifest admission, probe polling, room closure, source revocation, and
  private connector-config reset: PASS.
- Static production client and server build: PASS.
- Helix discipline quick check: PASS; this change is local lifecycle/persistence
  optimization, not a source-identity or continuation-policy change.

The static profile trades HMR for a required client build after UI edits.
Deferred local fallback durability can lag by at most 30 seconds; graceful
shutdown drains pending work where the host forwards the signal. The first
post-start account/provider projection still costs roughly 0.6–1.6 seconds
under pg-mem. A heavily accumulated local fallback snapshot also produced a
66-second synthetic local-profile sign-in while the profiler was polling.
That is the largest remaining local-only latency owner. It does not occur on
the production PostgreSQL path, but future work should move high-volume ingress
idempotency storage out of pg-mem or add an indexed sidecar before treating
pg-mem as a long-lived production-like database.

## Confidence and remaining budgets

- Static keyed server without UI: high confidence, about 0.75–0.85 GiB settled.
- Keyed account workstation: medium confidence, about 1.0–1.6 GiB depending on
  accumulated pg-mem history and V8 reserved heap.
- Fabric + headless player + connector + one live tool turn: high confidence
  that this 16 GiB host retains more than 3.5 GiB available in the clean
  representative run.
- Production build: high confidence it requires a separate 3.5–4.0 GiB burst;
  stop Minecraft or build before launching the full local stack.
- Real graphical modded Minecraft was not measured in this branch; reserve an
  additional 3–5 GiB according to the selected pack and Java allocation.

The 800–900 MiB stretch goal remains realistic for server-only/static idle, but
not for a long-lived pg-mem database plus visible account workstation. The
essential 1 GiB machine-headroom requirement passed. Casimir verification was
not applicable because no warp/GR, constraint, certificate, or proof-maturity
surface changed.
