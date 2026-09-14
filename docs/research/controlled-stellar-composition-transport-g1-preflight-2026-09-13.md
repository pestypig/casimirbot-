Program gate: G1 — real calibrated solar baseline
Workstream: runtime readiness recheck
Capability or component: Docker startup before image verification
Current maturity: reduced_order_diagnostic
Target maturity: calibrated_baseline, not attained by this preflight
Required frozen inputs: G1 runtime v1 configuration and 25,000,000,000-byte capacity threshold
Required evidence: free-space measurement, responding Linux engine, pinned image identity
Stop/fail criteria: runtime startup failure or unavailable image identity
Explicit non-goals: Docker factory reset, data deletion, calibration retuning, solver or physical acceptance
Downstream gate unlocked: none

# G1 runtime preflight — September 13, 2026

This is a runtime-recovery observation, not a new science execution or a
replacement for the immutable attempt-1 result. G1 remains open and G2 blocked.

- C: free space at this preflight: 42,764,390,400 bytes; capacity threshold met.
- Docker data disk previously located at
  `C:\Users\dan\AppData\Local\Docker\wsl\disk\docker_data.vhdx`.
- Docker client: 28.3.2, selected context `desktop-linux`.
- Initial Linux-engine query failed because its named pipe was absent.
- WSL listed `docker-desktop` as stopped, version 2.
- Requested normal startup with `docker desktop start --timeout 45`.
- Docker backend log at `2026-09-13T17:24:17Z` reported a startup crash:
  `starting services: initializing Inference manager`, followed by inability
  to remove/access `AppData\Local\Docker\run\dockerInference`:
  `The file cannot be accessed by the system.`

Evidence source: local Docker host log
`C:\Users\dan\AppData\Local\Docker\log\host\com.docker.backend.exe.log`.
The underlying reason for that file-access failure has not been established.

Preflight outcome: **runtime blocked; storage threshold satisfied**.
No image was pulled, no MESA model ran, and no science tolerances were changed.
No data deletion or factory reset was attempted. Next work is bounded Docker
startup diagnosis and non-destructive recovery, followed by image identity
verification and a new versioned G1 science attempt when prerequisites pass.

## Subsequent non-destructive recovery

After owner authorization for Docker repair, confirmed no Docker processes
were running and the Docker WSL distribution was stopped. Inspected the exact
`Docker\run` directory: it contained only two zero-byte socket reparse entries,
`dockerInference` and `userAnalyticsOtlpHttp.sock`. Renamed this directory to
`run.pre-recovery-20260913`, preserving its contents, and requested normal
startup with `docker desktop start --detach`. The separate WSL data directory
was not moved or deleted. No factory reset, reinstall, or settings edit occurred.

After initialization, `docker info` returned server `28.3.2`, OS `linux`,
16 CPUs, and `8,207,880,192` bytes of memory. The image inventory was accessible;
`docker ps` listed no running containers at that check. This supersedes the
startup blocker above, not the historical observation. The working diagnosis
is a stale runtime-socket obstruction; the underlying Windows cause is not
proven. Similar reports exist in the
[Docker issue tracker](https://github.com/docker/desktop-feedback/issues/460).

Recovery outcome: Linux engine responding. No MESA execution or calibrated
baseline is established. Retain the socket backup until later cleanup is
explicitly authorized; it is not a backup of Docker's images or volumes.
