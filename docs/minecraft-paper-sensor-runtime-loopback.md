# Minecraft Paper Sensor Runtime Loopback

This loopback proves that the built Paper plugin can wake up, register with Helix,
send heartbeats, send snapshots, poll read-only probes, post probe results, and
avoid raw NBT or side effects.

## Manual Runtime Check

1. Build the plugin:
   `gradle -p minecraft/helix-paper-sensor build`
2. Configure `plugins/HelixPaperSensor/config.yml` with the Helix endpoint and bearer token.
3. Copy `minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.1.0.jar` to the Paper server `plugins/` directory.
4. Start the Paper server.
5. Run `/helixsensor status`.
6. Verify the manifest in Helix with `GET /api/agi/environment/sources/source:minecraft-paper-plugin/status`.
7. Verify the heartbeat is active.
8. Verify an `environment_state_snapshot` batch arrives.
9. Run or enqueue a read-only probe such as `line_of_sight` or `inventory_check`.
10. Confirm the live answer card shows Minecraft availability and still waits for recommendation gate approval.

## Optional Loopback Script

The loopback script starts a local mock Helix receiver and can start a Paper server
when `PAPER_SERVER_JAR` points to a Paper server JAR:

```sh
PAPER_SERVER_JAR=/path/to/paper.jar npm run test:minecraft-paper-sensor-loopback
```

If `PAPER_SERVER_JAR` is missing, the script builds the plugin and prints a
non-passing certificate that explains the missing runtime prerequisite.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 401/403 | Wrong bearer token | Set `helix.bearer_token` to the Helix source token. |
| 413 | Payload too large | Reduce `local_map_radius`, `max_local_blocks`, crop radius, or entity caps. |
| No heartbeat | Endpoint unreachable or plugin disabled | Check `helix.enabled`, endpoint URL, tunnel, and firewall. |
| Snapshots skipped | Upload in flight or backoff active | Check `/helixsensor status` and reduce payload size. |
| Minecraft space limited | Manifest registered but probes unsupported | Verify supported probe types in the manifest. |
| Privileged language appears | Sensor scope bug | Check snapshot sections for `sensor_scope` and caveats. |
| Recommendation appears before rehearsal | Gate regression | Re-run environment recommendation gate tests. |

## Safety Boundary

The plugin remains read-only. Commands force status/heartbeat/snapshot/probe
diagnostics only; they never move actors, open containers, mutate blocks, run
server commands for Helix, or execute live actions.
