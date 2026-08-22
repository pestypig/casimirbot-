# NHM2 spherical-boson-star v2 G2B-B2 runtime admission result

Program gate: G2B — replacement classical proof attempt  
Workstream: frozen four-grid classical branch  
Capability or component: authenticated integrated-runner runtime admission  
Current maturity: initializer instance persisted; production runtime not admitted  
Target maturity: one admitted Linux x86_64/glibc full-fenv execution runtime  
Required frozen inputs: final branch policy, radial-primary source closure, B1-R2 initializer persistence receipt  
Required evidence: source/toolchain/executable/runtime identities, loader closure, preexecution preseal, and exact execution command  
Stop/fail criteria: the first missing runtime identity or frozen-platform mismatch is terminal before any branch solve  
Explicit non-goals: Windows diagnostic execution, solver retuning, alternate initializer, candidate admission, Theory Graph or physical authority  
Downstream gate unlocked: none; a separately authenticated Linux runtime packet is required  

Date: 2026-08-22  
Result: **BLOCKED BEFORE SOLVER EXECUTION**

## Frozen inputs reached

The immutable M5-R1 entry representation has been materialized and persisted by
the B1-R2 packet. Its persistence receipt is:

- path:
  `artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/persistence-receipt.json`;
- raw SHA-256:
  `b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424`;
- raw size: `2092` bytes;
- receipt self-hash:
  `207922166d28f02c44da29a115f439d6e4185d8f48681c8416e0d53bd1ccdf5c`.

This closes the initializer-instance prerequisite only. It grants no candidate
execution or runtime authority.

The integrated finite radial source graph is frozen by
`shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts`.
That contract states:

- production source target:
  `linux_x86_64_glibc_full_fenv`;
- admission requires Linux, x86_64/amd64, a 64-bit pointer ABI, and the required
  glibc floating-point-environment symbols;
- unsupported platform/libc/architecture disposition: fail closed at import;
- the Windows control path is implemented but is not the frozen source target;
- approved toolchain, executable, runtime, preexecution preseal, execution
  command, execution receipt, and independent replay bindings remain absent in
  that predecessor contract.

The final branch-selection successor closes the candidate node schedule at
`N=[64,96,128,256]` and the cross-grid policy. It does not turn a Windows
diagnostic runtime into the required Linux production runtime.

## Read-only host observation

The admission probe performed no solver, candidate, output-root, registry, or
Casimir action. It observed:

- host OS: `Microsoft Windows 10.0.26200`;
- host architecture: `X64`;
- Python platform/architecture/pointer width: `win32`, `AMD64`, `64`;
- WSL distributions: only `docker-desktop`, state `Stopped`, WSL version `2`;
- Docker client: `28.3.2`, context `desktop-linux`;
- initial Docker server: absent; the Linux-engine named pipe did not exist.

A bounded recovery probe started the already-installed Docker Desktop
`4.43.2.199162` executable (raw SHA-256
`cfbcfb36d44bb858fd74b6aede60509e82406174057019d8184a5f86f68cc610`,
`4156848` bytes) without installing or downloading anything. WSL briefly
reported `docker-desktop` running, but the Linux engine remained in `starting`,
returned HTTP 500 for the version/info API, and then returned to `stopped`.
No locally cached image could be admitted or even enumerated through a healthy
engine. No image pull, build, container, or numerical process was attempted.

The Docker error log identifies the proximate failure, rather than leaving it
as an unexplained API error:

- WSL bootstrap failed while synchronizing `docker-wsl-cli.iso` into the
  Docker data disk with `input/output error`;
- Docker then failed to write its telemetry cache with
  `There is not enough space on the disk`;
- the engine terminated before exposing a usable Docker API.

The host `C:` volume had approximately `5.57 GiB` free at that observation.
The Docker WSL virtual disks themselves were approximately `395 MiB`
(`docker_data.vhdx`) and `200 MiB` (`ext4.vhdx`) on the host, so no large cached
image was available to remove through a healthy engine. The ordinary user temp
directory contained only about `219 MiB` of top-level files. No unrelated user
file, recycle-bin content, Docker virtual disk, or cache was deleted, and no
Docker factory reset was attempted.

There is therefore no admitted Linux execution environment on this workstation
for the frozen radial source target.

## First-failure disposition

The active G2B packet orders failures before execution. The first unresolved
execution prerequisite is:

`approved_toolchain_executable_and_runtime_binding_absent`

with the additional observed platform mismatch:

`frozen_linux_x86_64_glibc_full_fenv_runtime_not_available`

No N=64, N=96, N=128, or N=256 branch solve was invoked. No alternate platform,
initializer, solver, tolerance, schedule, predictor, retry, or retune was used.
Cross-grid convergence was not evaluated because no four-grid states exist.

## Required successor

The next honest packet must provision and authenticate a Linux x86_64/glibc
runtime without accepting caller-supplied paths or hashes as authority. Before
any solve it must bind at least:

1. the exact eleven-source radial closure and the integrated-runner source;
2. Python, gmpy2/MPFR/GMP where used, loader, libc, and transitive runtime bytes;
3. toolchain/interpreter/executable identities and the floating-point
   environment conformance observation;
4. the B1-R2 initializer persistence receipt and exact six payload bytes;
5. the final branch-selection and cross-grid contracts;
6. one no-retune command and an exclusive output root in a preexecution seal.

Only after that packet passes may the integrated runner invoke the four solves
in frozen order. A Windows-only diagnostic run would not repair this blocker and
must not be substituted for the authenticated result.

The immediate workstation prerequisite is enough safely reclaimable disk space
for the Docker/WSL Linux engine to bootstrap, or an independently provisioned
Linux x86_64 environment. Cleanup selection is outside this proof packet because
the observed large allocations are not owned by the G2B workstream.

All candidate, execution, replay, diagnostic-lamp, physical-viability,
propulsion, and transport authority remains false.
