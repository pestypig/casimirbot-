# ET6 preflight handoff — 2026-09-05 21:30 UTC

This is a readiness snapshot, not authorization or an ET6 acceptance claim.
No new run, claim, gameplay lease or movement was created for this handoff.

| Prerequisite | Status | Evidence and remaining action |
| --- | --- | --- |
| Packaged EXE identity | Verified | Host 24236 and service 32224 resolve to `apps/desktop/release-et6-expiry-readiness-20260905-2118/win-unpacked/CasimirBot.exe`. Runtime manifest SHA-256 remains `bc70d5869f1ec774eb85de557cd55eceda9a5ab2623bcb53318187094cf7b9d1`. |
| Service readiness | Verified | Ready receipt: origin `http://127.0.0.1:58816`, ready at 21:20:54.144Z. Authenticated MCP presence reached service `service_instance:33bd5202b5de4bd95ae9e358e114e828` at 21:30:41.234Z. |
| Same-task presence | Verified, short-lived | `codex-continuation:et6-minecraft-capacity-20260903-main`; expires 21:33:41.234Z. Refresh during active work, not as gameplay permission. |
| Independent external task identity | Blocked | Presence explicitly reports client-declared continuation and native-desktop client identity. This is not independent external-provider task proof. |
| Full environment transport | Not currently revalidated | Trusted transport recovery succeeded earlier; its finite lease is not presumed current. Recover through existing governed delegation when needed, without asking for a plugin reconnect by default. |
| Exact chat/run association | Blocked | Previous binding returned `reasoning_binding_not_found`. No fresh human-approved association is proven. Inspect selected chat and exact task/run preview before requesting approval. |
| Finite environment run | Blocked | Prior run `run_c7929dcb-70ca-4dcf-89f4-f21e0bbb0958` expired at 20:55:53.974Z; packaged inspection now truthfully reports `run_expired`. Prepare a fresh run only when user-present acceptance can proceed. |
| Gameplay authority | Blocked | Last authenticated inspection reported the existing authority expired at 21:15:00Z. Do not infer renewal from device trust or transport recovery. |
| Connector readiness and safe perception | Blocked | Last authenticated observation: authority inactive, no admitted manifest, no fresh heartbeat, controls not asserted. Client 34040 and server 1868 are still running, which alone does not establish readiness. Re-establish current identity/manifest and fresh bounded perception before dispatch. |
| Actual EXE approval control | Not tested in this handoff | No current native screenshot/navigation proof. Do not promise a single available click based on source code or old screenshots. Reveal and inspect the actual control before asking the user. |
| Capacity capture | Partially prepared, not live-rehearsed | Existing `scripts/helix-environment-capacity-report.ts` validates `environment.capacity_capture.v1`, reports missing measurements and exits 2 for incomplete qualification. Reporter existence is not proof that live measurements are captured. |
| Voice/manual acceptance | Not tested | Reserve actual voice and manual interruption for user-present testing; synthetic or typed events remain separately labelled. |

## Next execution order

1. Narrow capacity-report verification passed: five tests in
   `server/__tests__/helix.environment-capacity-report.test.ts`. Review the measurement inputs next;
   do not dispatch gameplay or manufacture sample values to fill gaps.
2. When the user returns, refresh same-task presence and governed transport,
   prepare finite run/authority through their proper consent paths, and recover
   connector identity, manifest, heartbeat and fresh perception.
3. Show the exact selected task, Helix chat, room and run in the actual EXE.
   Request the human-only association only after verifying that its prerequisites
   and control are available. Authentication, if needed, is a separate step.
4. Revalidate the resulting binding and independent provider identity, then run
   the full rolling capacity/lifecycle battery. User approval is not completion.

Prior immutable evidence: `2026-09-05-et6-expiry-readiness-package.json`,
`2026-09-05-et6-expiry-readiness-live.json`,
`2026-09-05-et6-trusted-transport-recovery.json`, and
`2026-09-05-et6-readiness-build-followup.json` in this directory.
