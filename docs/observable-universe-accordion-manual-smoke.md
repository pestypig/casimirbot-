# Observable Universe Accordion Manual Smoke

Use this runbook after the mounted panel is available in a browser.

## Current Governance Result

- The shared catalog contract currently marks only `alpha-cen-a` as ETA-selectable.
- `proxima` and `barnard` remain visible but render-only until an explicit NHM2 accordion artifact bundle is registered for them.

## Smoke Steps

1. Open the Helix panel named `Observable Universe Accordion`.
2. Confirm the visible nearby catalog order is:
   - `Alpha Centauri A`
   - `Proxima Centauri`
   - `Barnard's Star`
3. Confirm the active ETA target control is read-only and displays `Alpha Centauri A`.
4. Confirm there is no ETA target selector while only one shared-catalog target is ETA-selectable.
5. Click `Alpha Centauri A` and confirm the details card shows:
   - ETA fields
   - support policy
   - evidence target
   - boundary/default comparison artifact paths
6. Click `Proxima Centauri` and confirm the details card shows:
   - render-only support badge
   - support reason
   - no ETA years
   - no driving profile
7. Click `Barnard's Star` and confirm it remains render-only with no ETA fields.
8. Confirm map markers preserve sky direction and only the contract-backed entry shows a remapped radius marker.

## Future Check

- If a second nearby target is ever promoted to ETA-selectable in the shared catalog contract, rerun this smoke and confirm the active ETA target selector appears and switches details between only the shared-catalog ETA-selectable entries.
