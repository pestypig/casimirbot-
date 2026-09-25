# AR-2B2 private Live-room/external-task association qualification — 2026-09-24

**Verdict: deterministically verified for the developer-only private
association path.** This is not AR-2 live assisted-room acceptance or a
room-visible answer.

| Requirement | Current evidence | Boundary |
| --- | --- | --- |
| Current Live room speaker, session and consent | Real Realtime ingress and backend-consumer fixtures reject wrong runtime/session, expired floor and revoked consent. | Acoustic identity is not certified. |
| Explicit owner selection and revision | Authenticated room owner selects/revokes one exact task; mission ID and monotonic revision are persisted. | Selection alone never dispatches. |
| Affirmative dispatch | Owner HTTP handoff checks exact transcript hash, room/session, captured speaker, current mission and selected task before queuing advisory steering. | No environment effect or model wake is inferred. |
| Exact task pickup and revocation | MCP read/ack checks authenticated client, continuation, chat, run, binding epoch, mission revision and captured consent. Revoked room events yield text-free cursor markers; ack still denies. | Cursor/ack is receipt evidence only. |
| Correlated return | A real MCP client submits one encrypted bounded result for the acknowledged event. Same-content replay is idempotent; changed content and foreign task fail. The MCP receipt excludes result text and answer authority. | Submission does not publish a room answer. |
| Owner source intake | Authenticated owner HTTP route rechecks present room membership, account link, current mission and private result source, before and after read; unsigned, guest, wrong-room/revision, revoked-consent and revoked-mission cases fail. | Guest access to the owner's private task/model output is not granted. |

The integrated positive fixture performs owner HTTP dispatch → real MCP task
read → MCP acknowledgement → MCP result submission → owner HTTP source intake,
then proves mission revocation denies another result call. The five-file
room/steering/result suite passed **67/67**. The separate MCP exact-continuation
test passed. `npm run build:server` passed with four unrelated duplicate-key/case
warnings. The environment-harness docs audit, Ask discipline quick check and
diff whitespace check passed. No paid provider call was made.

**Remaining AR-2 work:** no member-authorized Ask evidence re-entry or
completed solver/route-product gate exists for this external result; no
room-visible external-task terminal answer is qualified. The installed EXE,
domain/Replit path, reconnect after process restart, and controlled live
Dan/Sam/Alex multi-member reasoning scenario remain unverified. The selected
paid no-model collaboration offer is unchanged; this experimental path does
not share a customer's Codex subscription or authorize assisted-room pricing.
