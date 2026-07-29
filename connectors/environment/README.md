# Helix Environment Connectors

This tree is the provider-neutral southbound connector ecosystem. Connectors
make outbound HTTPS requests to Helix, poll only for capabilities approved for
their paired device, and return structured observations. They never receive a
room-source bearer, reasoning-provider credential, user chat, private network
route, terminal product, or authority to choose a run or turn.

The release boundary contains three distinct capability classes:

- `observe` is passive evidence and never initiates work.
- `probe` is an on-demand, read-only inspection.
- `act` is reserved for a later permission and approval system.

This version implements `probe` only. `actions/` on the server remains a
reserved namespace, and every connector response must report that no commands
or environment mutations were performed.

Directory roles:

- `contract/v1` re-exports the canonical shared TypeScript contracts; it is not
  an independently edited schema copy.
- `sdk/typescript` and `sdk/java` contain transport and result helpers.
- `templates/read-only` is the minimal starting point for a connector.
- `examples/synthetic` is an isolation fixture.
- `examples/system-clock` is the first real non-game connector.
- `conformance` contains the mock Helix transport, fixtures, and golden report.

Pairing is outbound-only: a connector generates an Ed25519 device key, proves
possession, displays a short-lived user code, waits for the user to approve an
account/room/capability set, proves possession again, and receives a scoped
device credential exactly once. QR codes and user-visible pairing text contain
only the verification URI and code, never a credential.

## Keyed live acceptance

`npm run helix:environment-connectors:live-acceptance` is a zero-network dry
run unless all three explicit loopback/network/mutation switches are enabled:

```text
HELIX_ENVIRONMENT_CONNECTOR_ACCEPTANCE_NETWORK=1
HELIX_ENVIRONMENT_CONNECTOR_ACCEPTANCE_ALLOW_MUTATION=1
HELIX_ENVIRONMENT_CONNECTOR_ACCEPTANCE_ALLOW_LOOPBACK_HTTP=1
```

When keyed startup is required in Codex Desktop, invoke the configured opaque
launcher at `C:\Users\dan\.local\bin\start-myapp-for-codex.cmd` with the
canonical workspace path as its only argument. Transporting that exact
invocation through the shell tool is the approved action, not an alternate
server-start command. Do not inspect the launcher or credential-bearing
environment variables, and do not print or persist secrets.

The harness always verifies the southbound room, source, manifest, heartbeat,
pairing, health, and poll lifecycle. When a legitimate access token is supplied
through `HELIX_ENVIRONMENT_CONNECTOR_ACCEPTANCE_ACCESS_TOKEN` (or the shared
room/MCP acceptance token variables), it additionally starts and binds a
durable external Agent API run, dispatches the exact Minecraft inventory
capability, concurrently services the resulting connector lease, submits a
typed read-only observation, and requires current-turn evidence re-entry,
post-observation reasoning, and Helix terminal authority. The token and device
credential remain memory-only and are redacted from every report and error.

The authenticated lane also requires deployment admission for the logical
`bound_room_environment_probe` database scope and the token's existing
`helix.rooms.read`, run, and room-management grants. Missing OAuth metadata,
token, binding, scope, or account policy remains a typed failure or skipped
deployment limitation; the harness never manufactures a principal or bypasses
the protected-resource boundary.
