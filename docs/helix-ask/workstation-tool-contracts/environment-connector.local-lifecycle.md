# Local Minecraft Fabric Lifecycle

Status: draft developer baseline.

Capability: `environment.minecraft.fabric_loopback.launch_and_join`

Observation schema: `helix.minecraft.local_lifecycle_observation.v1`

## Purpose

Give browser and packaged-EXE Helix sessions one identical developer-only way
to launch or reuse the prepared Minecraft Fabric client and join a listening
loopback server.

## Owner

Codex owns semantic selection and post-observation reasoning. Helix owns
developer policy, explicit confirmation, sealed arguments, idempotency, and
projection. The fixed lifecycle executor owns only the prepared launcher and
join-inbox sequence.

## Inputs

The only model-visible field is optional `address`, restricted to localhost,
127.0.0.1, or IPv6 loopback plus an optional valid port. No executable,
profile, file, shell command, remote host, credential, or environment identity
is caller-controlled.

## Observation

The executor returns nonterminal
`helix.minecraft.local_lifecycle_observation.v1` evidence describing whether
the server was reachable, the prepared client was reused or launched, and the
fixed join request was delivered. It is not proof that a player authenticated
or entered the world unless later game evidence shows that state.

Required non-answer flags:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
```

## Host Projection

Both browser and packaged EXE invoke the same server-side gateway action and
the same shared executor. Neither surface contains a private Minecraft launch
implementation.

## Visible Trace

The trace must show confirmation, gateway dispatch, executor outcome,
observation re-entry, and a later Codex synthesis. The lifecycle receipt is
never a terminal answer.

## Negative Admission Cases

Fail closed for non-developer accounts, absent or mismatched confirmation,
non-loopback addresses, arbitrary launch material, missing prepared assets,
unreachable local server, join-inbox failure, or changed sealed arguments.

## Tests

Primary coverage:

```txt
server/services/helix-ask/workstation-tool-gateway/__tests__/minecraft-local-lifecycle.test.ts
server/services/environment-connectors/installations/__tests__/minecraft-fabric-loopback-lifecycle.test.ts
server/routes/__tests__/minecraft-local-lifecycle-route.test.ts
```
