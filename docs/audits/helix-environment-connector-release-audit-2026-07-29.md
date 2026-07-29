# Helix Environment Connector release audit — 2026-07-29

## Verdict

The local, read-only Minecraft environment-connector baseline is complete for
Fabric 1.21.8 and remains compatible with Paper 1.21.8. A real Fabric server,
real player, connector JAR, keyed Shared Live Room, and model-backed Helix Ask
turns were exercised together. Current observations re-entered the same
conversation before synthesis, and failures remained typed and fail-closed.

This is a release-ready local connector baseline, not a claim that every
Minecraft situation is observable. Command execution, pathfinding,
closed-container inspection, arbitrary NBT/scoreboard export, durable
account-to-player binding, and public OAuth/deployment interoperability remain
outside this release.

The retired `server/routes/agi.plan.ts` monolith was not extended. New
Minecraft prompt classification and source arbitration live in the extracted
Helix Ask service directory. The retired manual
`start_situation_goal_session` action was not reactivated.

## Architecture boundary

| Boundary | Result |
| --- | --- |
| Provider-neutral connector core | Shared Java core owns authenticated transport, manifests, heartbeats, polling, bounded retry, normalized probe envelopes, and secret-safe configuration. |
| Fabric host adapter | Thin Fabric 1.21.8 adapter reads server-owned game state and supports dedicated or integrated servers. |
| Paper host adapter | Existing Paper adapter remains a thin host implementation over the same connector core. |
| Northbound model surface | Helix exposes typed environment capabilities; Codex never receives the device address, source credential, room credential, or private routing details. |
| Authority | Codex owns reasoning and observation re-entry. Helix owns admission, exact source identity, provenance, freshness, and terminal eligibility. |
| Mutation boundary | Both Minecraft adapters are read-only. `execution_enabled` must remain false, and command execution is not advertised. |

## Live Fabric acceptance

The acceptance used a local Fabric 1.21.8 server, a headless player, the
production Fabric connector JAR, and a launcher-owned keyed CasimirBot server.
It covered the eight advertised probes:

1. actor status
2. inventory check
3. nearby entities
4. hazard check
5. local map summary
6. line of sight
7. crop state
8. reachability

Natural short, underspecified, follow-up, corrective, and itinerary-style turns
confirmed current-turn observation re-entry and final synthesis. Additional
checks proved:

- two online players without an exact actor binding return
  `target_ambiguous`;
- an unbound profile cannot use another profile's room;
- a stopped connector progresses from `probe_timeout` to `result_stale`;
- restarting the connector restores fresh observations;
- a closed chest returns `capability_unavailable` rather than inferred
  contents or a substituted capability;
- secrets and private routes do not appear in model output, MCP-style results,
  chat history, or acceptance exports.

Acceptance evidence is retained under:

```text
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v2
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v4
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v5
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v6
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-reentry-v8
artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-recovery
```

## Verification

- Connector and admission battery: 8 files, 113/113 passed.
- Environment capability-route battery: 59/59 passed.
- Live environment agent loop: 21/21 passed.
- Terminal single-writer battery: 76/76 passed.
- Minecraft situation-session routing: 5/5 passed.
- Legacy semantic-context fail-closed regressions: 2/2 passed.
- Prompt-solving benchmark: 35/35 passed.
- Ask API parity unit matrix: 31/31 passed.
- Full Helix Ask discipline:
  - prompt benchmark 35/35;
  - API parity matrix 31/31;
  - live continuation 26/26;
  - live-source identity audit 8/8;
  - production server build passed.
- Fabric Java 21 Gradle clean test/build: passed.
- Paper Java 21 Gradle clean test/JAR: passed.
- Real Paper 1.21.8 loopback: plugin load, manifest, heartbeat, snapshot,
  admitted read-only probe, forbidden-probe rejection, raw-NBT exclusion, and
  no-side-effects checks passed.

The keyed server was started only through the approved opaque
`start-myapp-for-codex` launcher. `/api/account/session`,
`/api/helix/pipeline`, and `/api/agi/agent-providers` returned HTTP 200.
Codex reported `enabled: true`, `launchable: true`, and was the default
provider.

The keyed legacy visual-source API parity fixture completed all 16 transports
but remains 1/16 procedurally. Its 15 failures reproduce the separately tracked
legacy `situation_run` identity/observation rail debt
(`rail_requested_observation_kinds_empty` plus missing live-source identity
diagnoses). This does not use the environment-connector room/probe path and was
not hidden by adding logic to the retired planning monolith.

Casimir adapter verification used the live endpoint and exported the server
training trace to `artifacts/training-trace.jsonl`:

- verdict: `PASS`
- first failure: none
- deltas: none
- certificate status: `GREEN`
- certificate integrity: `true`
- certificate hash:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`

## Release artifacts

### Fabric 1.21.8

```text
minecraft/helix-fabric-sensor/build/libs/HelixFabricSensor-0.1.0.jar
```

- size: `95,888` bytes
- SHA-256:
  `a646fbe3a800684bf334df916043401a76f63b37dc36cc25e324ece2a679897e`
- receipt:
  `minecraft/helix-fabric-sensor/helix-fabric-sensor-build-receipt.json`

### Paper 1.21.8

```text
minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.2.0.jar
```

- size: `139,169` bytes
- SHA-256:
  `4ac9d4f6cb2fa1964485d4b0e4e39cdc31eeb86578647b10137bed18b23770a2`
- receipt:
  `minecraft/helix-paper-sensor/helix-paper-sensor-build-receipt.json`

Both receipts match the current JAR bytes.

## Remaining limitations

- Closed-container contents are unavailable without a separately reviewed,
  explicitly privileged capability.
- Reachability is a bounded geometric check, not safe-route planning or
  pathfinding.
- Inventory detail does not yet fully normalize durability, enchantments, and
  arbitrary mod-specific component data.
- Crimson Curse integration is deliberately allowlisted to its documented
  `Mass`/`Points` state and deterministic phase mapping.
- Account-to-player identity is exact only when supplied by a trusted binding;
  otherwise actor selection fails closed when ambiguous.
- Public/cloud deployment, live asymmetric OAuth/account binding, and
  third-party hosting interoperability remain deployment acceptance work.
- The older visual `situation_run` keyed parity fixture remains separate
  lifecycle debt and is not evidence against the connector-specific Fabric
  acceptance.

## Probability scorecard

| Subsystem | Confidence |
| --- | ---: |
| Shared connector transport and exact probe correlation | 97% |
| Fabric 1.21.8 host integration | 96% |
| Paper 1.21.8 compatibility | 96% |
| Source identity, freshness, and evidence re-entry | 96% |
| Secret and private-route nonprojection | 98% |
| Fail-closed actor and capability handling | 97% |
| Natural multi-turn model use of current Minecraft evidence | 95% |
| Public OAuth and third-party deployment interoperability | Unverified |
| Command/action capability | Not implemented |
