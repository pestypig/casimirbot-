Program gate: G8 — environment-harness release evaluation
Workstream: Brokerage reactive simulation and provider-neutral resident-controller transfer
Capability or component: `resident.brokerage.simulated_execution.v1` bounded simulated-execution controller and watchdog
Lifecycle stage: source admission → evidence normalization → resident proposal → local simulation admission/execution → receipt → semantic re-entry
Reaction timescale: `bounded_reflex` for local simulated state only; short semantic replanning and durable strategy selection remain Runtime Codex responsibilities
Authority owner: the signed-in developer owns activation and the simulated bankroll; Helix owns identity, leases, freshness, risk admission and interruption; the paper ledger owns simulated effects; Runtime Codex owns intent and strategy interpretation
Current maturity: deterministically verified
Target maturity: integrated accepted
Required evidence: frozen profile and strategy-manifest hashes; ordered quote identity and freshness; no-look-ahead replay; deterministic ranking and abstention; idempotent simulated effects; fill/slippage/partial-fill model; watchdog interruption; restart/reconnect; semantic wake and exact Codex re-entry; operator-visible trace; zero Robinhood mutation calls
Explicit non-goals: no Minecraft Paper server use, no Fabric action reuse, no provider order review or mutation, no unattended live trading, no approval inference, no options, margin, crypto, extended-hours trading, HFT or exchange-parity claim, profitability guarantee, private model loop or receipt-authored answer
Downstream gate unlocked: evidence that the generic governed controller protocol supports reactive brokerage simulation; live trading retains the separate attended review, exact approval, at-most-once placement, reconciliation and protective-exit gates

# EH-G8 brokerage reactive simulation controller v1

## Purpose and dependency position

This packet specifies the next brokerage profile behind the environment
harness rule:

> One generic governed resident-controller protocol, with unique versioned
> controller profiles for each environment and capability.

Minecraft uses Fabric for its accepted Player Embodiment execution lane. The
word `paper` in this packet means only CasimirBot's local simulated brokerage
ledger. The brokerage controller reuses the generic lease, observation,
proposal, arbiter, receipt, interruption, reset and semantic-re-entry
lifecycle; it reuses no Minecraft sensor, target, combat or Fabric action
vocabulary.

G8 is active. This packet is permitted as representative post-G7 integration:
it depends on the already live-accepted Robinhood read plane and market
observer, and it introduces no provider mutation. It does not replace the G8
installed-node convergence evidence or advance the attended tiny-live path.

Change classification: `tool admission`, `evidence normalization`, `evidence
re-entry` and operator `presentation`. Runtime Codex sampling, generic tool
execution, approvals, session lifecycle and terminal completion remain
Codex-owned.

## Control split

| Component | Owns | Must not own |
| --- | --- | --- |
| Runtime Codex | User intent, admitted strategy selection, finite manifest revision, interpretation, replanning and explanation | Per-quote sampling loop, direct ledger mutation, live-order authority or terminal claims from receipts |
| Reactive simulation controller | Bounded state, deterministic predicates, candidate ranking, proposal timing, abstention and compact causal evidence | Durable goals, new symbols or actions, risk-policy expansion, provider calls or answers |
| Paper-risk arbiter and ledger | Deterministic admission, cash reservation, simulated orders/fills/positions, idempotency and postconditions | Robinhood orders, inferred intent or strategy invention |
| Watchdog | Freshness/gap/epoch/lease/invariant/loss checks, simulated kill switch, interruption and escalation | Entry selection, profit seeking, provider cancellation or liquidation |
| Helix/CasimirBot | Identity, room binding, capability scope, provenance, effect ceilings, replay, evidence re-entry and terminal eligibility | Private model loop or substitute answer composition |

## Frozen profile vocabulary

The initial profile ID is `resident.brokerage.simulated_execution.v1` with
reaction requirement `bounded_reflex`. Its finite proposals are:

- `propose_simulated_limit_entry`;
- `propose_simulated_entry_cancel`;
- `propose_simulated_risk_reducing_exit`;
- `activate_simulated_kill_switch`;
- `abstain`; and
- `request_semantic_replan`.

Every proposal passes through the existing deterministic paper-risk admission
and ledger. The controller cannot call `review_equity_order`,
`place_equity_order`, `cancel_equity_order`, any live reconciliation path, or
any transfer, option, crypto or liquidation capability. The provider-mutation
vocabulary is the empty set.

## Strategy-manifest boundary

Runtime Codex may create or select a finite manifest only through an admitted
strategy-definition route. The frozen manifest binds at least:

```text
strategy_manifest_id
strategy_artifact_hash
controller_profile_id
owner_profile_id
room_id
environment_binding_id
connection_id
paper_account_id
producer_epoch_ref
allowed_symbols
required_quote_fields
observation_schedule
maximum_quote_age_ms
entry_predicates
candidate_ranking
entry_limit_policy
protective_exit_policy
maximum_notional_cents
maximum_estimated_risk_cents
maximum_open_positions
daily_loss_limit_cents
regular_session_only
manifest_expires_at
reset_policy
```

The first manifest should contain one broad cash-equity canary symbol and the
existing conservative risk ceilings. Strategy quality is evaluated separately
from safety and lifecycle correctness. Changing any predicate, ranking rule,
symbol, timing rule or risk value produces a new manifest hash and requires a
fresh lease; a running controller cannot rewrite itself.

## Ordered market observation contract

Each accepted observation records event time, provider observation time,
CasimirBot arrival time and controller processing time, plus source output
hash, producer epoch, sequence/revision and bid/ask/last fields actually
available. A later authenticated adapter may deliver a stream, but the first
installed path may use bounded Robinhood MCP quote polling.

The controller must:

- reject stale, future, duplicate-under-new-identity, out-of-order or
  superseded-epoch observations;
- never infer a missing bid, ask, sequence or session state;
- require a fresh authoritative snapshot after a retention gap or reconnect;
- use only observations available at the decision's event-time frontier; and
- emit an explicit degraded-latency or gap result instead of claiming smooth
  real-time control.

This is a seconds-scale reactive environment target unless measured evidence
supports a tighter budget. It is not an HFT, exchange-colocation or exchange-
parity claim.

## Simulation fidelity

The local ledger remains the only execution plane. Deterministic fixtures must
cover bid/ask-aware limit eligibility, configurable latency and slippage,
partial fills, unfilled and rejected orders, cancellation races, gap-through-
stop behavior, regular-session boundaries and fractional rounding. Every
effect binds the manifest hash, triggering observation revision, proposal ID,
arbiter decision, ledger effect ID and postcondition receipt.

Historical replay must preserve the original observation order and hide future
events. Live-data shadow mode uses current admitted observations but exposes no
Robinhood order tool. The same input trace, manifest and simulator artifact
must reproduce the same decisions and ledger effects.

Profit or loss is an evaluation measurement, never acceptance authority. The
primary acceptance metrics are observation-to-decision latency, stale/gap
rejection, duplicate-effect count, watchdog response, invariant preservation,
restart recovery, evidence completeness and Codex re-entry fidelity.

## Watchdog and interruption

The watchdog is independent of entry ranking. It activates the simulated kill
switch, releases the controller lease when required, and emits one causal
escalation on:

- stale quotes or missed observation deadline;
- sequence gap, reconnect without snapshot, or producer-epoch rotation;
- expired strategy or controller lease;
- cash, position, order, risk or idempotency invariant failure;
- daily-loss or consecutive-loss boundary;
- unresolved simulated effect beyond its deadline;
- manual override; or
- Emergency Stop.

It may prevent new simulated risk and admit already-defined risk-reducing
simulation cleanup. It cannot contact Robinhood to cancel or liquidate a real
position.

## Codex and operator reporting

Raw quote cadence does not wake Codex. The existing semantic monitor emits only
material changes: candidate admitted/rejected for a new reason, simulated order
or fill transition, position/risk change, watchdog intervention, data gap,
manifest expiry, or requested semantic replan. Each item remains an observation
with `answer_authority=false` and must re-enter the exact Runtime Codex task
before Codex may revise strategy or answer.

The operator trace shows the same ordered observation revision, manifest hash,
proposal, arbiter outcome, simulated effect, watchdog state, cursor and receipt
seen through MCP. It excludes credentials, account numbers, raw provider
payloads, private prompts and hidden reasoning.

## Staged build and acceptance

1. **R0 — Contract and replay.** Add strict profile, manifest, observation,
   proposal, watchdog and receipt schemas plus a deterministic historical
   no-look-ahead replay fixture.
2. **R1 — Simulation arbiter integration.** Route proposals through the
   existing paper-risk and paper-execution stores; prove idempotency, cash and
   risk invariants, partial/unfilled behavior and zero provider calls.
3. **R2 — Resident scheduler and watchdog.** Add a finite lease-bound local
   scheduler, quote-age/gap supervision, manual override, Emergency Stop and
   resource release on every terminal path. Do not add a private Codex loop.
4. **R3 — Live-input shadow.** Consume installed, owner-private Robinhood quote
   observations through bounded polling, record measured latency and run
   simulation only through multiple regular-hours sessions.
5. **R4 — Semantic re-entry.** Project material decisions through the existing
   monitor cursor, prove acknowledgement, restart/reconnect, stale-epoch
   rejection and exact Runtime Codex re-entry without duplicate simulated
   effects or competing terminal text.
6. **R5 — Cross-surface acceptance.** Correlate the workstation and MCP traces
   for at least three consecutive observe-decide-simulate-observe cycles, one
   watchdog intervention, one Codex strategy revision and clean control
   release.

R0 through R2 are deterministically verified and the finite R3 polling and
qualification machinery is implemented. R3-A is the next eligible live-
acceptance assignment; later stages require the named prior-stage evidence and
must not be bundled into one unreviewed increment.

## Frozen G8 continuation ladder — 2026-09-03

This ladder decomposes the remaining R3–R5 work without creating another
program gate or a competing roadmap. Each stage is a bounded work assignment.
Its evidence must be reviewed before the next stage begins. Full Harness
connection, read-source availability, or simulated profitability cannot
self-promote maturity or grant provider mutation authority.

### R3-A — Installed read-source preflight

Start one finite profile-owned Full Harness lease and verify the current
Robinhood OAuth connection, exact owner-private room binding, producer epoch,
environment binding and read-only provider catalog during regular market
hours. Admit one normalized quote containing the required bid, ask, last,
prior-close and market-session fields, with truthful provider-event or
arrival-proxy timing. The terminal preflight must prove current identity,
source freshness, secret exclusion, `provider_mutation_calls=0`, no simulated
effect and clean lease release.

Exit evidence: one sanitized installed-source receipt and one terminal
preflight report whose hashes bind the same connection, room, profile,
producer epoch, environment binding and quote revision. Typed provider
unavailability remains an honest retryable stop and does not advance R3-A.

### R3-B — First regular-hours live shadow

Run one finite simulation-only shadow session from the installed read source.
Record arrival cadence, observation-to-decision latency, degraded timing,
source gaps, watchdog state, simulated proposals/effects and postconditions.
The session must terminate and archive restart-safe evidence with zero provider
mutation, zero duplicate effects and no unresolved simulated reservation.

Exit evidence: one complete identity-matched regular-hours session archive.
This is measured live-input evidence, but one market date cannot qualify R3.

### R3-C — Second-date qualification

On a distinct regular-market date, run another finite identity-matched shadow
session. Across the qualifying sessions, demonstrate one bounded restart or
reconnect recovery and one safe freshness, gap or watchdog intervention. Seal
the canonical multi-session qualification archive with measured timing,
explicit gaps, terminal state and `provider_mutation_calls=0`.

Exit evidence: the existing qualification surface returns
`ready_for_maturity_review=true` for at least two complete sessions containing
processed regular-hours observations on at least two distinct market dates.
Because the archive has `maturity_authority=false`, a human-reviewed update to
this work program is still required before R3 may be called `live accepted`.

### R4 — Codex semantic re-entry acceptance

Project only material controller decisions and state changes through the exact
profile-scoped monitor continuation. Prove delivery and acknowledgement,
restart/reconnect continuity, stale-epoch rejection, one Runtime Codex
strategy revision and no duplicate simulated effect. Every observation and
receipt retains `answer_authority=false`; Runtime Codex remains the only
semantic replanning and terminal-answer authority.

Exit evidence: a sanitized exact-task trace connecting a material observation,
monitor cursor, acknowledgement, Codex revision, newly hashed finite manifest
or explicit abstention, and subsequent controller observation.

### R5 — Cross-surface integrated acceptance

Correlate the installed EXE, authenticated MCP surface and operator-visible
trace for at least three consecutive
observe → decide → simulate → observe cycles. Include one watchdog
intervention, one Codex strategy revision, restart-safe evidence, no duplicate
effects and clean release of monitor, controller, source and simulated-ledger
authority.

Exit evidence: one hash-bound installed-node acceptance artifact showing the
same identities, revisions, effects and terminal state across all three
surfaces. Only this stage may advance the packet to `integrated accepted`.

### Ordered handoff to attended tiny-live qualification

R5 does not arm or approve live trading. After R5 acceptance, the separate
`eh-g8-robinhood-attended-tiny-live-qualification-v1.md` packet governs any
real-money canary: refreshed real-account and provider-contract checks,
zero-exposure and minimum-notional verification, attended supervisor/dead-man
rehearsal, one exact user-approved entry no greater than $25, a separately
approved protective exit, reconciliation, zero-exposure closeout and archival.
The approximately $200 allocation remains an account ceiling rather than
standing order authority.

### Release-hardening follow-on

Tiny-live acceptance is not G8 release closure. A reviewer-approved signed
installer must subsequently repeat current-source start, restart, reconnect,
revocation, rollback and fail-closed recovery with credential separation and
consistent cross-surface status. This follow-on cannot weaken G1–G7 or infer
autonomous live-entry authority from a successful canary.

## R0 deterministic checkpoint — 2026-08-27

R0 is implemented and deterministically verified offline in:

- `shared/trading/brokerage-reactive-simulation.ts`;
- `fixtures/brokerage-reactive-simulation/spy-no-lookahead.v1.json`; and
- `shared/trading/__tests__/brokerage-reactive-simulation.spec.ts`.

The strict contracts freeze the local-only `bounded_reflex` profile, finite
response vocabulary, empty provider-mutation vocabulary, identity-bound and
expiring strategy manifest, ordered real-quote input, proposal-only simulated
responses, watchdog receipts, causal decision receipts and replay result. Real
quote observations are labelled `simulation_input_only`; they are not falsely
described as simulated market data. Every simulated proposal and receipt
retains zero provider calls, no live execution and no answer or terminal
authority.

The deterministic runner processes observations only in increasing sequence
and nondecreasing arrival order, records its event/arrival frontier and stops
at the first watchdog trip until a later stage supplies admitted fresh-snapshot
recovery. The fixture proves that appending a future quote cannot change any
prefix decision, exact replay is identical, cross-room identity fails before a
proposal, malformed chronology fails closed, and a retention/sequence gap
locks new simulated risk without creating Robinhood authority.

Offline verification:

```text
npx vitest run shared/trading/__tests__/brokerage-reactive-simulation.spec.ts \
  --pool=forks --maxWorkers=1

8/8 tests passed.
npm run typecheck passed.
npm run build:server passed with four pre-existing duplicate-key/case warnings.
npm run helix:ask:discipline:quick passed with classification:
tool admission, evidence normalization, evidence re-entry.
```

No keyed server, browser, Robinhood provider or port 1522 operation was used.
The current profile remains `specified`; R0 verification does not promote the
whole resident capability.

## R1 admission and reservation checkpoint — 2026-08-27

The first R1 slice binds an R0 decision to the exact stored quote hash,
producer epoch, manifest, paper account and resolved no-earnings observation
before it may reach the existing paper-risk engine. An accepted risk decision
uses a deterministic client-order identity to reserve a local simulated limit
entry through the existing paper-execution store. A rejected decision returns
evidence only. A watchdog trip, account mismatch, quote replacement or entry-
parameter drift fails before paper-ledger mutation.

Implementation and focused evidence:

- `server/services/trading/brokerage-reactive-simulation-arbiter.ts`;
- `server/services/trading/__tests__/brokerage-reactive-simulation-arbiter.test.ts`;
- the decision receipt's exact `source_output_hash` and
  `producer_epoch_ref` bindings in
  `shared/trading/brokerage-reactive-simulation.ts`; and
- the reused earnings-evidence boundary exported by
  `server/services/trading/paper-observer-canary-stage.ts`.

Offline verification passed 13/13 R0 plus R1 focused tests and 15/15 existing
market-observer, paper-canary and paper-risk regression tests. The server build
passed with the same four unrelated duplicate-key/case warnings. Every new
receipt fixes `provider_order_tool_calls_made=0`,
`provider_mutation_attempted=false`, `live_order_execution_enabled=false`,
`answer_authority=false` and `terminal_eligible=false`.

## R1 deterministic completion — 2026-08-27

R1 now extends the existing paper ledger rather than creating a competing
simulator. Migration `068_paper_reactive_partial_fills` adds a strict per-order
`quote_touch_v1` execution model, cumulative quantity and notional state, and
multiple observation-keyed fills. An active partially filled entry retains the
existing database status `open` and projects the explicit derived
`fill_state=partially_filled`; this preserves legacy order-status constraints
while making partial state unambiguous.

The deterministic model enforces quote-touch eligibility, causal latency,
original-order fill fractions and adverse buy-side slippage capped by the
limit price. Legacy paper orders without a model retain full quote-touch
behavior. Reservation accounting releases only unused cash, updates one
position cumulatively, and exact observation replay cannot duplicate a fill.
Cancellation is transactional: a completed fill wins without a refund, while
a cancellation committed before observation processing wins and prevents a
fill.

The developer-only governed route
`POST /api/agi/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/proposals/admit`
requires exact signed-in owner, connection, private room, paper account,
manifest, quote hash, producer epoch and earnings-observation identity. The
full authenticated brokerage fixture proves accepted admission, local
reservation, partial and complete fills, unfilled causal input, both
cancellation outcomes, restart-safe migration and zero provider-order calls.
It also proves receipts remain simulated observations with no answer or
terminal authority.

Verification passed:

- 34/34 focused R0/R1 contract, migration, execution-model, arbiter,
  evidence, observer and risk tests;
- 5/5 authenticated brokerage route cases, including the accepted governed
  R1 route and real pg-mem ledger transitions;
- the compiled server build, with four unrelated existing duplicate-key/case
  warnings; and
- a changed-surface TypeScript scan with no errors in the R1 files.

Repository-wide typecheck remains blocked by unrelated existing errors outside
this slice; it is not claimed as passing. R2 may now add the finite lease-bound
resident scheduler and independent watchdog without adding a private Codex
loop.

Keyed installed-node verification after migration 068 on port 1522 returned
HTTP 200 for the
account-session, Helix pipeline and agent-provider readiness endpoints. The
required Casimir adapter gate run `2556` returned `PASS`, certificate status `GREEN`,
integrity `true`, and certificate hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
This proves repository/adapter gate integrity at that run; the authenticated
route fixture, not the Casimir certificate, supplies the brokerage fill trace.

## R2 finite scheduler and watchdog checkpoint — 2026-08-27

R2 adds a durable finite controller lifecycle without adding live-input polling
or another reasoning runtime. Migration
`069_brokerage_reactive_controller_runs` persists the exact manifest-bound
controller lease, hash-chained events, idempotent observation cycles and
controller-to-paper-order effect links. The scheduler advances only an
already-normalized observation submitted through the governed developer route;
Robinhood polling remains R3 and Runtime Codex remains the only semantic
planner.

The independent one-second watchdog scans active local controllers even when no
API request arrives. It trips on lease, controller deadline, manifest,
observation deadline, unresolved-effect, paper-invariant, kill-switch,
daily-loss and consecutive-loss boundaries. Observation admission separately
trips on stale quote, sequence gap, retention gap and producer-epoch change.
Manual override and Emergency Stop use the same terminal release path. Every
terminal path releases the controller lease, locks new simulated risk, cancels
any still-open controller-owned simulated entry, refunds its unused local
reservation and records exact causal evidence. It cannot call a Robinhood
review, placement, cancellation, reconciliation or other mutation tool.

The governed routes are:

```text
POST /api/agi/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers
GET  /api/agi/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId
POST /api/agi/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId/observations/process
POST /api/agi/brokerage-connections/:connectionId/rooms/:roomId/reactive-simulation/controllers/:controllerRunId/control
```

Deterministic evidence passed 26 focused R0/R1/R2 contract, migration, arbiter,
paper-execution and authenticated brokerage-route tests. The authenticated
fixture demonstrated start, one admitted simulated entry, exact replay without
a duplicate effect, reservation cleanup on manual override, retention-gap
shutdown with fresh-snapshot requirement, Emergency Stop and a watchdog-only
deadline trip. Every receipt retained zero provider-order calls, no provider
mutation, no live execution and no answer or terminal authority. The compiled
server build passed with the same four unrelated existing duplicate-key/case
warnings.

The keyed node restarted on port 1522 with migration 069 and returned HTTP 200
for account-session, Helix pipeline and agent-provider readiness. The new route
was present and failed an unauthenticated status probe closed with HTTP 401.
Casimir adapter constraint-pack run `2559` returned `PASS`, certificate status
`GREEN`, integrity `true`, and certificate hash
`d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`.
The authenticated route fixture—not the certificate or unauthenticated keyed
probe—supplies the positive controller/effect evidence.

R3 may now consume installed owner-private Robinhood quote observations in
simulation-only shadow mode and measure real delivery latency. R3 must not add
provider mutation, infer stream/exchange parity, or collapse R4 semantic
re-entry and R5 cross-surface acceptance into the same assignment.

## R3 deterministic live-input bridge checkpoint — 2026-08-27

R3 now has an implemented finite owner-private polling bridge around the
official Robinhood `get_equity_quotes` read surface. A shadow session binds one
active R2 controller, exact owner, private room, connection, producer epoch,
environment binding, paper account, manifest hash and allowed symbol. Its poll
interval must remain inside the frozen manifest schedule, its poll budget must
equal the controller's remaining cycle budget, and its deadline cannot outlive
the controller deadline or lease.

The bridge is source transport, not a model loop. Each due poll performs one
sanitized read-only provider call, requires explicit bid, ask, last, prior-close
and market-session fields, normalizes one causal R2 observation, and sends it
through the existing simulated controller and paper-risk arbiter. It never
admits a provider-order tool. Provider event time is used only when present in
the normalized quote; otherwise the receipt truthfully records
`arrival_proxy` and marks provider-to-arrival and end-to-end latency as
unavailable rather than inventing them.

Migration `071_brokerage_reactive_live_shadow` persists finite sessions,
in-flight claims and completed poll receipts. A restart recovery scan turns an
abandoned in-flight read into one typed source failure after the bounded stale
interval. Exhausting the source failure budget trips the R2 controller,
activates the local simulated kill switch and releases its lease. A missing
poll followed by another read is therefore handled by the observation-deadline
or sequence-gap watchdog instead of silently presenting a continuous stream.

Implemented surfaces:

- `shared/trading/brokerage-reactive-live-shadow.ts`;
- `server/services/trading/brokerage-reactive-live-shadow-store.ts`;
- `server/services/trading/brokerage-reactive-live-shadow-evidence-store.ts`;
- `server/db/migrations/071_brokerage_reactive_live_shadow.ts`;
- `server/db/migrations/072_brokerage_reactive_shadow_acceptance.ts`;
- developer-only start/status/manual-poll/stop, sanitized evidence-ledger and
  multi-session qualification-archive routes under the existing authenticated
  brokerage controller API; and
- the one-second finite source scheduler started beside the independent R2
  watchdog.

Deterministic evidence covers exact quote normalization, missing field
rejection, provider-clock versus arrival-proxy timing, a complete measured
simulation-only poll, a missed-read watchdog path, interrupted-poll restart
recovery, resource release and zero provider mutation. The server build and
focused R0–R3 battery pass. This checkpoint does **not** claim R3 live
acceptance: installed owner-private polling and evidence across multiple
regular-hours sessions are still required. An after-hours probe, if run, is
source-contract evidence only and cannot substitute for those sessions.

The keyed installed node loaded migration `071`, reached ready on port `1522`,
and returned HTTP 200 for account-session, Helix-pipeline and agent-provider
health on 2026-08-27. The already-authorized owner-private room binding exposed
only the read surface with order execution disabled. Two bounded after-hours
read-only preflight attempts returned the typed operator message
`brokerage connection service is temporarily unavailable`; consequently no R3
shadow session or poll receipt was fabricated from that unavailable source.
The installed R3 status route was present and an unauthenticated probe failed
closed with HTTP 401.
Those attempts made no provider mutation or order call and do not advance R3
live maturity. A later regular-hours continuation must first regain the
installed read source and then collect the named multi-session evidence.

Casimir adapter constraint-pack run `2561` returned `PASS`, certificate status
`GREEN`, integrity `true`, and certificate hash
`d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`.
This certifies repository/adapter gate integrity for the implemented R3 bridge;
it is not evidence that Robinhood delivered a live quote.

The restart-safe acceptance surface now derives one canonical evidence hash
from each terminal session's persisted sanitized poll receipts, measured timing,
regular-market dates, source gaps and watchdog reactions. It can archive an
idempotent `qualified` packet only when at least two complete, identity-matched
finite sessions contain processed regular-hours observations on at least two
distinct market dates. The packet reports degraded timing explicitly and fixes
all provider mutation counters at zero. It has
`maturity_authority=false`, `canonical_maturity_updated=false` and only
`ready_for_maturity_review=true`; therefore fixtures, historical data or one
after-hours session cannot self-promote the work-program row. The installed
Robinhood source must still produce the exact evidence before this surface can
create a real R3 qualification archive.

The keyed installed node was restarted through the approved opaque launcher,
loaded migration `072`, reached `app ready` on port `1522`, and returned HTTP
200 for account-session, Helix-pipeline and agent-provider health. The new
qualification route was present and failed an unauthenticated probe closed with
HTTP 401. The expanded deterministic R0–R3 battery passed 33/33 tests. Casimir
adapter constraint-pack run `2563` returned `PASS`, certificate status `GREEN`,
integrity `true`, and certificate hash
`d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`.
These checks prove the installed evidence machinery and repository gate, not
the still-missing multi-day Robinhood observations.

A third bounded owner-authenticated after-hours continuation on 2026-08-27
verified that the connection and private-room binding still projected active,
all seven capabilities remained read-only and order execution remained
disabled. One `Verify read-only access` retry and one schema-only provider
contract preflight both returned the same typed operator result,
`brokerage connection service is temporarily unavailable`. The keyed server
remained healthy; no provider mutation, review, placement, cancellation or
money movement was attempted. Because the same provider/source-availability
condition has now persisted across three goal continuations and R3 requires
observations from at least two distinct regular-market dates, the live
acceptance goal is blocked on an external-state change. Resume with the same
goal when the provider MCP read surface is available during regular hours;
do not replace the missing receipts with fixtures or after-hours projections.

## Live-trading separation

Completion of this packet proves only reactive simulated execution and the
shared harness transfer. It cannot arm `helix:live-equity:tiny-v1`, approve a
review or place an order. A future live action still requires fresh provider
evidence, deterministic risk admission, an unexpired Robinhood review, exact
per-order user approval, at-most-once placement, reconciliation, attended
presence, a healthy supervisor and a separately approved protective exit.
