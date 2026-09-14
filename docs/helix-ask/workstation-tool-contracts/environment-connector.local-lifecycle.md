# Local Minecraft Fabric Lifecycle

Status: draft developer baseline.

Capability: `environment.minecraft.fabric_loopback.launch_and_join`

Observation schema: `helix.minecraft.local_lifecycle_observation.v1`

## Purpose

Give browser and packaged-EXE Helix sessions one identical developer-only way
to start or reuse the authenticated owner's saved Fabric server and prepared
client, then stage a loopback join. The bounded startup repair is tracked in
[the G8 saved-server packet](../../work-packets/eh-g8-cs-local-server-lifecycle-v1.md);
the parent CS exits and ET6 acceptance remain open.

## Owner

Codex owns semantic selection and post-observation reasoning. Helix owns
developer policy, explicit confirmation, sealed arguments, idempotency, and
projection. The fixed lifecycle executor owns the saved server's fixed Java/JAR
startup, prepared launcher and join-inbox sequence. No generic execution loop is
introduced. Server startup requires explicit workstation confirmation or current
saved installed-device trust; a Player Embodiment lease alone does not authorize
dedicated-server startup. Existing client restart admission remains separate.

## Inputs

The only model-visible field is optional `address`, restricted to localhost,
127.0.0.1, or IPv6 loopback plus an optional valid port. No executable,
profile, file, shell command, remote host, credential, or environment identity
is caller-controlled.

The native saved profile supplies both directories in one owner-scoped read.
The browser's read-only selection endpoint returns the configured loopback
address without paths or credentials; execution rechecks all configuration.
Existing EULA acceptance and exact case-sensitive Java property keys are required.
The fixed provider does not change EULA, server properties, PATH or profiles.
Sealed workstation approval uses the `v2-saved-server` domain, so an earlier
client-only approval cannot authorize the expanded startup operation.

## Observation

The executor returns nonterminal
`helix.minecraft.local_lifecycle_observation.v1` evidence describing whether
the server was reachable, the prepared client was reused or launched, and the
fixed join request was delivered. It is not proof that a player authenticated
or entered the world unless later game evidence shows that state.

Optional `server_lifecycle` carries the observed server PID/start time, observation
time, profile digest, loopback address and starting/listening/stopped status.
It is retained on a client failure and never described as current game admission.
A per-profile OS mutex and durable launch-intent/PID/start-time journal serialize
startup across service restarts. Timeout does not kill or replace the child;
retry reconciles the exact process. An uncertain launch outcome or unrelated
port owner rejects another spawn. No process is killed to acquire a port.

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
