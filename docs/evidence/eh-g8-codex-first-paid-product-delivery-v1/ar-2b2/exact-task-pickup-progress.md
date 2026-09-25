# AR-2B2 exact-task pickup progress — 2026-09-24

This is component evidence under the [AR-2B2 packet](../../../work-packets/eh-g8-ar2b2-live-room-mission-ingress-v1.md). It does not qualify Live-to-task dispatch, a current mission revision, an external-task decision return or live assisted-room acceptance.

The real MCP `helix_reasoning_steering_read` and `helix_reasoning_steering_acknowledge` callers now require the explicit continuation, conversation, mission and run. Their server-derived authenticated MCP client/session and caller-supplied selection must match the active binding and epoch before text is returned or acknowledgement is written. Durable pairing access rechecks the task association and accepted grant during queue operations. The unit test covers two continuations sharing a client session; the real MCP test covers a second registered task on the same MCP client, for which the supervisor currently issues a different client session. An acknowledgement remains a transport receipt without answer or execution authority.

Verification in the current checkout:

| Check | Result |
| --- | --- |
| `reasoning-task-binding-store.test.ts` | 14 passed; wrong continuation, chat, mission, run, epoch and revoke deny pickup/ack. |
| Exact-task MCP test | Passed; a second registered task on the same MCP client, wrong chat/mission/run and valid pickup/ack were exercised through real tools. The second task has a distinct supervisor client session. |
| Durable invitation MCP test | Passed; wrong chat/mission/run deny pickup/ack before the valid accepted-pairing exchange. |
| Full two-file Vitest run | 49 passed, 2 failed. Both failures are separate public UI catalog expectations in the same MCP test file: one human-only control is no longer catalogued, and the expected control count is 101 while current catalog reports 103. Neither test exercises reasoning steering. |
| `npm run build:server` | Passed with four existing duplicate-key/case warnings outside the changed files. |
| `npm run helix:ask:discipline:quick` | Static check passed; the broad dirty checkout reports existing provider and terminal-risk warnings that this local-supervisor/MCP patch did not change. |
| `npm run helix:environment-harness:docs-audit` | Passed, G8 active. |
| `git diff --check` | No whitespace errors; Git printed line-ending conversion warnings for the current working tree. |

Remaining AR-2B2 work: select and pin one room mission principal and its server-authored revision; attach the current room/runtime/speaker/consent and selected binding to each finalized handoff; submit through durable steering with current consent checks; authenticate and correlate the task's returned decision to that exact handoff and revision; and separately verify the installed/domain and controlled live journey. No provider API call, native action, billing or deployment was performed here.
