# Helix environment harness G6 progress audit — 2026-08-23

Program gate: G6 — Concurrent reasoning roles
Workstream: Provider-neutral environment perception and prospective planning around the principal Runtime Codex solver
Capability or component: Revision-bound supporting-role artifacts, stale arbitration, principal adoption, execution/result linkage, and terminal continuity
Lifecycle stage: evidence normalization → evidence re-entry → follow-up reasoning → tool admission → execution → measured observation re-entry → terminal authority → presentation
Reaction timescale: short semantic replanning and prospective durable planning; Fabric retains tick-scale viability
Authority owner: Runtime Codex owns semantic selection, replanning, and completion; Helix owns exact identity, freshness, provenance, arbitration eligibility, and terminal eligibility; Fabric owns the one admitted effect and measured postcondition
Current maturity: implemented
Target maturity: integrated accepted
Required evidence: retained deterministic and keyed traces proving exact revision identity, stale rejection before execution, one principal-selected effect, measured-result re-entry, completed solver continuity, single-writer presentation parity, and unchanged G1–G5 contracts
Explicit non-goals: learned controllers, FlyWire, generic resident-controller extraction, arbitrary command expansion, competing execution authorities, or second-domain transfer
Downstream gate unlocked: G7 — Second-domain transfer

## Verdict

G6 remains **active** at `implemented` maturity. The provider-neutral role and
execution chain is implemented and deterministically verified, and a retained
keyed natural Ask trace demonstrates the intended semantic result. The final
post-correction keyed replay did not complete because the configured Runtime
Codex API credit envelope was exhausted before the required role observation
could be produced. G7 therefore remains blocked.

This is an external replay dependency, not permission to weaken the acceptance
contract or substitute a deterministic test for a natural keyed journey.

## Proven implementation and deterministic evidence

- Shared G6 schemas bind exact goal, room, participant, environment, source,
  world, connector epoch, subject, authority, goal revision, observation
  revision, evidence references, producer role, expiry, and artifact hash.
- The append-only store retains role outputs, invalidations, principal
  dispositions, arbitration, execution links, and measured-result links.
- Currentness evaluation rejects stale/future revisions, expired outputs,
  cross-identity artifacts, and authority drift before action admission.
- Supporting roles remain nonterminal and cannot call tools or acquire mutation
  authority. Exactly one principal-adopted prospective output may enter the
  existing action path.
- Provider-neutral `com.casimirbot.environment.*` gateway observations now count
  as the `live_environment` itinerary family only after successful execution.
  This repairs the projection contradiction that previously reported a missing
  family after a successful G6 role inspection.

Verification completed on 2026-08-23:

| Gate | Result |
| --- | --- |
| Full Helix Ask discipline guard | passed |
| Prompt-solving prelude | 4/4 passed |
| Prompt adversarial shards | 31/31 applicable cases passed; 16 intentionally skipped |
| API parity fixed matrix | 15/15 passed |
| API parity procedural shards | 16/16 applicable cases passed; 60 intentionally skipped |
| Live-source continuation routing | 26/26 passed |
| Live-source identity audit | 9/9 passed |
| Production server build | passed with four unrelated existing duplicate-key/case warnings |
| G6 store, audit, MCP, lifecycle, and terminal-equivalence group | 99/99 passed |
| Focused G6 provider, terminal-writer, and workstation gateway regressions | 3/3 passed |
| G6 revision, identity, expiry, conflict, and poisoned-projection adversarial contract | 14/14 passed |
| Manual-override result and Emergency Stop readiness precedence | 2/2 focused cases passed |
| Environment-harness documentation audit | passed after this progress update |

The 99-test group includes six stream/UI/backend terminal-equivalence cases.
Voice was not active in the natural keyed room turn, so live voice delivery is
not an applicable acceptance surface for that turn; the deterministic
equivalence contract still requires voice certainty never to exceed the
canonical text candidate.

The dedicated G6 adversarial contract is
`server/services/environment-connectors/reasoning-roles/__tests__/environment-reasoning-role-contract.test.ts`.
It directly covers stale and future goal/observation revisions, room/world/epoch
and principal-turn drift, authority identity/policy rotation, authority and
output expiry, poisoned event hashes, contradictory adopted proposals, and an
attempt to revive an invalidated proposal. Existing action-path contracts remain
authoritative for manual input and Emergency Stop: a role selection does not
replace their cancellation/readiness precedence.

## Retained keyed evidence

The direct A1 trace is retained at:

- `artifacts/g6-concurrent-environment-reasoning/a1-live-latest.json`

It records the exact stale and revised observation identities, selection of
`g6.plan.revised`, one typed two-degree player-look effect, the execution link,
the measured-result link, and re-entry into principal turn
`g6-live-rebuilt-1787519539526-turn-1`.

The natural keyed Ask trace retained at:

- `artifacts/g6-concurrent-environment-reasoning/keyed-natural-ask-ask_g6-keyed-natural-1787527268120.json`

completed the Runtime Codex solver path and accurately reported stale rejection,
selection of `g6.plan.revised`, exactly one typed action, measured-result re-entry
into the same principal turn, and no new game action. Its downstream itinerary
projection nevertheless reported `live_environment` missing because it did not
recognize provider-neutral `com.casimirbot.environment.*` observations. That
trace is evidence of the defect and the grounded Codex answer, not post-fix
integrated acceptance.

The post-fix replay retained at:

- `artifacts/g6-concurrent-environment-reasoning/keyed-natural-ask-ask_g6-keyed-natural-1787530506778.json`

failed closed with `openai_api_credits_exhausted`. It did not execute another
game action and did not publish a false success answer. This proves accurate
typed failure behavior, but not the required post-fix natural keyed success.

## Exact closure replay still required

When Runtime Codex API credits are available, rerun the same no-action prompt
against the retained room and goal. G6 closes only if the resulting artifact
proves all of the following together:

1. `com.casimirbot.environment.reasoning_role.inspect` executes successfully and
   re-enters the principal solver.
2. The itinerary reports `complete: true`, observes `live_environment`, and has
   no missing observation family or capability.
3. The final answer identifies the stale invalidations, selects only
   `g6.plan.revised`, reports exactly one historical typed effect, and does not
   execute another action.
4. The measured-result link names the same principal turn and exact evidence
   reference as the retained A1 trace.
5. The completed solver path, terminal-authority writer, differential audit,
   API/text projection, and debug projection agree.
6. The focused G6 regressions and environment-harness documentation audit remain
   green.

Until that replay is retained, the active gate remains G6 and no second-domain
transfer work may claim G7 authority.
