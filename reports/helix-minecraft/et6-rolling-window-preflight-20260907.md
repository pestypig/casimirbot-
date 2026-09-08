# ET6 rolling-window preflight

The preceding goal turn recovered the exact successful root result. This turn checked the live successor context and the sensor contract to determine a valid next experiment.

## Observed boundaries

- Fresh frontier `environment_frontier:51d0a33f-6e15-4c56-a85c-283cecb0d9e9` returned `no_current_verified_checkpoint` after root completion. No successor was submitted against this unavailable context.
- Both spatial-region and perception-snapshot request contracts cap horizontal radius at seven blocks. A radius-16 spatial-region request was rejected by connector parameter validation before execution. The Fabric perception implementation independently clamps to seven; increasing only an MCP request cannot extend coverage.
- The native successor poll waits for an explicit checkpoint and its evidence-delivery fence. A one-second action completing with zero polls does not isolate a delivery regression.
- Checkpoint admission requires a fresh measured running workflow, exact plan identity, intact event hashes and current safety state. These gates must remain unchanged.

## Next controlled experiment

Prepare a finite non-mutating route wholly within fresh observed terrain, with an explicit early checkpoint and enough actual movement duration to measure the complete perception/frontier/submission round trip. A bounded turning route on the controlled platform can provide a longer measured moving window without pretending unobserved straight-ahead terrain is safe. Validate the entire route against current coverage before submission. Do not equate a larger timeout, stationary wait, repeated completed walks, or precomputed ungated successors with rolling acceptance.

Prepare caller-side successor construction before starting the root. Obtain each successor's fresh perception and native checkpoint identity, then submit through the same exact binding/run/authority/goal gates. Record rejection and elapsed latency if the root ends first. No successor submission or additional movement occurred in this preflight turn.

The controlled-course experiment does not replace the separately required unknown-world segment, changed-affordance replan, local intervention, steering interruption, reconnect, final revocation, or complete capacity measurements. ET6 remains incomplete; NAV1 remains gated.
