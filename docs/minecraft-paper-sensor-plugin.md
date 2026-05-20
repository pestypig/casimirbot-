# Helix Paper Sensor Plugin MVP

`minecraft/helix-paper-sensor` is a separate Paper plugin project. It does not live inside the Node/TypeScript server tree.

The plugin is a read-only environment sensor:

- posts a Helix environment source manifest on enable
- posts heartbeat artifacts on a scheduler
- posts compact `environment_state_snapshot` world events every 100 ticks
- bursts snapshots after salient Bukkit events
- polls Helix for read-only probes
- returns probe results without commands or world mutation
- refuses to start when `execution_enabled: true`
- never serializes raw NBT

World reads are performed on Paper's main server thread. HTTP upload, manifest, heartbeat, and probe result posts use Java `HttpClient` asynchronously.

Build:

```powershell
gradle -p minecraft/helix-paper-sensor build
```

The built JAR is:

```txt
minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.1.0.jar
```
