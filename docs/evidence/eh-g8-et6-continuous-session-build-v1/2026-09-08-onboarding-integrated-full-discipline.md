# Integrated pairing full regression — passed with source drift recorded

The single `helix:ask:discipline:full` process, session 38434, completed with
exit 0 and `[helix:ask:discipline] passed` on 2026-09-08, approximately
21:47–22:06 local. It was polled continuously without restarting its worker tree.
Classification was `source admission`. No competing heavy build/test was run.

| Executed group | Passing cases |
| --- | ---: |
| Prompt prelude | 4 |
| Four adversarial shards | 31 |
| Fixed API contracts | 15 |
| Four API scenario shards | 16 |
| Continuation routing | 26 |
| Identity audit | 9 |
| Total | 101 |

Shard exclusions are not extra passes. The final server build passed with the
four previously recorded duplicate-key/case warnings. This run used isolated
test state, not a replacement for the user's keyed service.

The start/result JSON files in this directory record seven source hashes. Six
matched at completion; `server/mcp/helix-mcp-server.ts` did not. This task made no
runtime edits during the run. The dirty checkout contains concurrent changes,
which are preserved. Without the start file contents, the exact intervening diff
is not established here. Therefore this is a completed successful regression
run, **not a frozen-source acceptance claim** for the whole final checkout.

Current-file follow-up:

`npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/mcp/__tests__/helix-mcp-minecraft-action.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Initially passed 44 and failed one admission-error fixture before its expected
admission call. Inspection found a partial legacy binding-store test stub lacked
`resolveDurableBindingContext`, newly required by the access facade. Added an
explicit null durable context to that isolated legacy fixture; production code
and authority checks were not weakened. Then
`npx vitest run server/mcp/__tests__/helix-mcp-minecraft-action.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`
passed 16/16. The coordination suite had already passed 29/29 on the current file.

The follow-up narrows current-file regression risk but does not retroactively
freeze the full run. Package hashes and relevant current-source checks remain
required. No native/package session, automatic host delivery, CS3/CS4 movement,
original ET6 or final CS5 closure is established. The persistent goal stays active.
