# AR-2B2 room mission selection progress — 2026-09-24

This is the second external-task component under the [AR-2B2 work packet](../../../work-packets/eh-g8-ar2b2-live-room-mission-ingress-v1.md). It does not establish Live transcript dispatch or a task-authenticated decision return.

Migration `092_room_external_mission` adds one durable selected principal per room. The authenticated browser route `/session/agent-connections/room-missions/select` checks the owner’s current room membership, active account link and exact bound task before saving the selection. The server assigns a stable room mission ID and monotonic revision. A retry with the same request returns the same row; a changed request or stale revision is rejected. The authenticated owner can revoke the saved mission even after leaving the room or losing the task connection. Neither route releases room speech, wakes a provider, executes an effect or grants answer authority.

Evidence from this checkout:

| Check | Result |
| --- | --- |
| `npx vitest run server/services/local-supervisor/__tests__/room-external-mission-store.test.ts server/routes/__tests__/agent-connections.test.ts --pool=forks` | 29 passed across both files; covers persistence, retry/revision/revoke, exact-task browser selection, wrong epoch/chat, forged continuation, guest denial and owner revoke. |
| `npm run build:server` | Passed after store and route implementation; four existing duplicate-key/case warnings remain in unrelated files. |
| `npm run helix:environment-harness:docs-audit` | Passed with G8 active and no maturity promotion. |
| `npm run helix:ask:discipline:quick` | Passed static classification; broad checkout warnings concern prior Helix provider changes, not this selection store. |

The saved association is preparation only. The current Realtime handoff does not yet carry its mission ID/revision or exact selected binding; the steering event has no room mission and speaker consent fields; and the MCP pickup path cannot revalidate a room mission it has not been given. A Live dispatch must remain unavailable until its stored event and pickup both recheck current room consent, exact task and mission revision. The existing public room result projector accepts already authorized Ask results, not an external task answer. A separate authenticated task return and terminal gate remain required. No provider API call, installed EXE, domain/Replit or live multi-member run was performed.

The store now also exposes `requireCurrent` for future dispatch/pickup callers.
It reads the committed row and rejects a revoked selection, changed revision,
or mismatched room/owner/binding/epoch/chat/mission/run. Its focused test passes
**2/2** including reselection and revoke. The server build passed with the
same unrelated warnings. This read check is not an atomic cross-store dispatch
transaction and does not itself deliver steering.
