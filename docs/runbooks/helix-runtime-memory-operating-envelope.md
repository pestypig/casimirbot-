# Helix Runtime Memory Operating Envelope

Status: local development and combined Minecraft/Helix test contract.

## Purpose

The low-memory profile must let a real Helix turn finish while preventing that
turn from exhausting either the Node V8 heap or the host operating system's
commit limit. Physical free memory alone is not a sufficient Windows admission
signal.

The protected combined workload is:

```txt
Minecraft client
+ Fabric server
+ browser/shared live room
+ keyed CasimirBot server
+ environment observations and Helix agent synthesis
```

## Application Envelope

`npm run dev` selects `dev:low-memory`. That profile intentionally omits Vite
middleware, enables bounded idle/startup collection, uses deferred local
database persistence, and gives V8 a 1536 MiB old-space ceiling.

The runtime governor clamps every configured heap admission limit below the
actual V8 heap limit. The default safety reserve is 384 MiB. Raising a governor
environment variable above that safe ceiling therefore cannot make an unsafe
turn admissible.

Host admission uses two separate signals:

1. Physical availability from Node's `os.freemem()`.
2. Commit limit, committed bytes, and commit headroom from a cached platform
   sampler (`wmic` on Windows and `/proc/meminfo` on Linux).

General runtime-governor defaults remain:

```txt
hard minimum free commit: 2048 MiB
soft minimum free commit: 4096 MiB
hard maximum commit ratio: 92%
soft maximum commit ratio: 82%
sample interval: 5 seconds
stale after: 30 seconds
```

The explicit `dev:low-memory` combined-test profile uses a narrower process
heap and a measured single-turn envelope:

```txt
hard minimum free commit: 1024 MiB
soft minimum free commit: 2048 MiB
hard maximum commit ratio: 96%
soft maximum commit ratio: 90%
```

This is not a guard bypass. A turn still fails closed at either hard boundary,
and the reduced V8 ceiling prevents the local server from treating the general
2 GiB heap budget as available on a 16 GiB combined Minecraft workstation.

The same profile coalesces local pg-mem persistence for 60 seconds, with a
five-minute maximum delay and a graceful-shutdown flush. Mutations to tables
outside the durable local snapshot no longer dirty all snapshot tables. This
keeps the 50+ MiB development snapshot from blocking connector heartbeats or
Ask streams while still retaining room/source/identity state on an orderly
server restart.

A low-memory Windows server also requires current commit telemetry. Missing or
stale telemetry fails closed rather than allowing a turn based only on free
physical RAM.

Hard commit pressure returns a non-authoritative Ask admission artifact with:

```txt
reason: host_commit_pressure
runtime_reason: host_commit_pressure
host_commit: safe numeric snapshot
assistant_answer: false
terminal_eligible: false
```

This is an actionable capacity failure, not an agent answer and not a soft
lock. The client may retry only after commit headroom recovers.

## Crash Evidence

Runtime diagnostics are installed before normal server operation. Node fatal
reports are written beneath `.cal/runtime-crash-reports`; environment variables
are excluded. A bounded JSONL event ledger records uncaught-exception metadata
and process exits without retaining credentials. Fatal V8 reporting also emits
the report filename on stderr so the opaque keyed launcher can retain visible
exit evidence without revealing secrets.

Do not add an `uncaughtException` recovery handler. A fatal or corrupt process
must exit; diagnostics should explain the exit, not keep unsafe state alive.

## Windows Pagefile Prerequisite

Application admission cannot increase the Windows commit limit. On a 16 GiB
machine, a manually capped pagefile below 3 GiB leaves insufficient commit
headroom for the protected combined workload even when Task Manager reports
several GiB of free physical RAM.

Before combined-load acceptance:

1. Enable a system-managed pagefile, or configure a deliberate larger maximum.
2. Restart Windows if the pagefile configuration requires it.
3. Confirm the commit limit increased and at least 4 GiB of commit headroom is
   available before starting the keyed server.
4. Do not treat a larger pagefile as the application fix; governor and fatal
   diagnostics remain required.

Changing pagefile policy is an operator-owned system action. CasimirBot must
observe and report the resulting capacity but must not silently mutate that OS
setting.

## Acceptance Sequence

1. Run the host-commit parser, runtime-governor, and Ask-admission unit tests
   with one worker.
2. Run targeted TypeScript and diff-hygiene checks.
3. Run the Helix Ask quick discipline check and API parity unit matrix.
4. Start the keyed server only through the configured opaque launcher.
5. Verify account session, Helix pipeline, agent providers, and runtime-memory
   snapshots without printing credentials.
6. Start Minecraft client and Fabric server, open the shared live room, and run
   repeated environment-backed turns.
7. Require successful observation re-entry and authoritative terminal answers,
   or the typed `host_commit_pressure` failure. Node termination, a hidden tool
   request, indefinite pending state, or silent restart fails acceptance.
8. Retain peak heap, RSS, commit ratio, commit headroom, exit evidence, and turn
   outcomes in the audit artifact.

The profile is not release-ready until repeated representative turns survive
this combined workload without Node termination or soft locks.
