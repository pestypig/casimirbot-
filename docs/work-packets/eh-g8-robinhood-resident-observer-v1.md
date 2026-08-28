Program gate: G8 — environment-harness release evaluation
Workstream: Robinhood shadow observation and provider-neutral resident-controller transfer
Capability or component: `resident.brokerage.market_observer.v1` deterministic paper observer and generic semantic-monitor projection
Lifecycle stage: source admission → evidence normalization → paper simulation → semantic delivery → later Codex re-entry
Reaction timescale: `monitor_only`; the profile has no provider mutation vocabulary
Authority owner: the signed-in profile owns the Robinhood connection and paper account; Helix owns binding, freshness, cursor and evidence admission; Runtime Codex owns interpretation
Current maturity: live accepted
Target maturity: integrated accepted
Required evidence: exact profile/connection/room/binding/account/producer identity; server-loaded quote provenance; deterministic paper receipt; no-change suppression; ordered monitor delivery; deduplication/acknowledgement/reconnect; credential and account-number exclusion; zero provider mutation; installed profile trace
Explicit non-goals: no unattended provider scanning, live order placement, cancellation, liquidation, approval inference, increased entry cap, private model loop, receipt-authored answer or native closed-task wake claim
Downstream gate unlocked: profile-scoped shadow/paper monitoring can qualify the separately approval-gated attended tiny-live path

# EH-G8 Robinhood resident observer v1

## Purpose

This packet is the first concrete second-domain use of the environment harness
rule: one generic governed resident-controller protocol with unique versioned
profiles for each environment and capability. It reuses the profile-scoped
semantic-monitor lease and cursor contract. It does not reuse Minecraft combat
rules, Fabric actions or Minecraft identity vocabulary.

The observer consumes one already-stored, fresh, owner-private Robinhood quote
observation. It runs the existing deterministic paper engine and emits a bounded
semantic receipt. It never calls a provider mutation tool. Runtime Codex may
interpret a delivered receipt only after it re-enters the exact continuation;
the receipt cannot answer or trade by itself.

## Profile contract

`resident.brokerage.market_observer.v1` is `monitor_only`. Its frozen response
vocabulary is limited to semantic facts about:

- simulated order fills;
- simulated positions opening, marking or closing;
- simulated stop triggers; and
- measured activation of the local paper risk kill switch.

The shared monitor maps those facts into the provider-neutral event families
`market`, `portfolio`, `orders`, `risk_control` and `paper_simulation`. A cycle
with no material paper change consumes no wake position.

The observer reloads the quote output hash, observation time and producer epoch
from the brokerage audit. It revalidates the active owner-private room binding
and requires the measured quote epoch to equal the current connection epoch.
The generic semantic projector then requires the exact monitor, profile, room,
environment binding, connection, paper account and producer epoch before it may
append one item to the monitor cursor.

## Deterministic implementation checkpoint — 2026-08-27

Implemented surfaces:

- `shared/trading/brokerage-market-observer.ts`
- `server/services/trading/brokerage-market-observer.ts`
- `server/services/environment-connectors/monitoring/brokerage-market-observer-semantic-source.ts`
- brokerage event-family extensions in `shared/helix-environment-monitor.ts`
- server-owned binding and producer provenance returned by the existing
  Robinhood connection/read evidence stores
- the separately admitted `helix.brokerage.paper_observer.process` OAuth
  permission and `helix_brokerage_paper_observer_process` MCP tool
- the owner-checked `helix_brokerage_robinhood_room_bind` MCP setup tool,
  limited by schema to the frozen Robinhood read-capability vocabulary and
  unable to expose credentials or admit provider mutation
- a brokerage-native durable-goal objective and the idempotent
  `helix_brokerage_resident_observer_bootstrap` MCP setup tool, which
  creates or reuses only a room-scoped paper ledger and binds the exact owner,
  private room, read binding, connection epoch, durable run and paper account
  before the generic monitor lease can be created

Focused evidence:

```text
npx vitest run shared/__tests__/helix-environment-monitor.spec.ts \
  server/services/trading/__tests__/brokerage-market-observer.test.ts \
  server/services/environment-connectors/monitoring/__tests__/brokerage-market-observer-semantic-source.test.ts \
  server/services/environment-connectors/monitoring/__tests__/environment-monitor-store.test.ts \
  --pool=forks --maxWorkers=1

24/24 tests passed.
```

The server build also passes. The full repository typecheck was stopped after a
bounded five-minute interval under concurrent Node memory pressure and produced
no diagnostic before termination; that is not counted as pass evidence.

The thin MCP adapter now requires room read, environment read and the dedicated
paper-observer processing permission. Missing only the dedicated permission
fails before the deterministic observer runner is invoked. Its tool annotation
is intentionally not read-only because it may mutate local simulated paper
state, while its typed output still proves `provider_mutation_attempted=false`
and `live_order_execution_enabled=false`.

Additional focused evidence:

```text
npx vitest run server/mcp/__tests__/helix-mcp-brokerage-paper-observer.test.ts \
  server/mcp/__tests__/helix-mcp-brokerage-read.test.ts \
  --pool=forks --maxWorkers=1

4/4 tests passed.
```

The room-native bootstrap increment adds a focused 15-test contract battery:

```text
npx vitest run shared/__tests__/helix-environment-durable-goal.spec.ts \
  server/services/environment-connectors/brokerage/__tests__/brokerage-resident-bootstrap.test.ts \
  server/mcp/__tests__/helix-mcp-brokerage-resident-bootstrap.test.ts \
  server/mcp/__tests__/helix-mcp-brokerage-paper-observer.test.ts \
  --pool=forks --maxWorkers=1

15/15 tests passed.
npm run build:server passed with four pre-existing duplicate-key/case warnings.
```

The 2026-08-27 installed retry expanded that battery to 29 focused tests and
added a real `pg-mem` identity-query fixture. It caught and repaired an
installed-only SQL divergence: a correlated private-member-count subquery was
accepted by PostgreSQL-shaped mocks but rejected by the local persistence
engine. The resolver now uses an explicit grouped join.

The bootstrap requires room read/manage, environment read, agent-run write and
the dedicated paper-observer processing permission. It admits no new OAuth
scope. The simulated paper account is the durable goal's local-only
`action_authority_id`; that identity does not represent Robinhood provider
order authority. The exact run must already be owned by the same profile,
actively bound to the same private room and unexpired.

This checkpoint is `implemented`, not `deterministically verified`. The exact
authorization scope and thin MCP route now exist, but the installed-product
trace still needs a durable-run/monitor identity, persistent receipt,
acknowledged cursor, reconnect without duplicate processing or wake, revocation
and stale-epoch failure. The separate processing scope preserves the rule that
local simulated mutation must not be smuggled under the existing read-only
brokerage OAuth scope even though it cannot move money.

The provider-neutral monitor persistence battery now includes one brokerage-
native integrated lifecycle using the actual `EnvironmentMonitorStore` and
brokerage semantic source. It proves exact-bound lease replay, one semantic
wake, reconnect deduplication without a second cursor or wake, stale producer-
epoch rejection, acknowledgement with no pending replay, revocation and
post-revocation fail-closed behavior. The focused store battery passes 6/6.
This is deterministic service evidence only; the installed OAuth/MCP process
trace below remains required before maturity can advance.

## Installed acceptance checkpoint — 2026-08-27

The profile-native client now pins Codex MCP OAuth to the already allowlisted
loopback callback port `8766`. A fresh installed Codex process completed the
seven-scope Auth0 recovery and returned `g8-monitor` readiness with no missing
scope, while excluding bearer, credential, subject and raw-claim content. The
same fresh catalog exposed `helix_brokerage_resident_observer_bootstrap`.

The owner-private acceptance room contained one active owner participant. The
installed client then created durable run
`run_5e461dbc-bb55-4fc6-92ca-8eff8efa55bd` and active room binding
`agent_room_binding:0c2b89b3-baf8-4297-961d-40f682129e68`. The run's frozen
constraints prohibit provider mutation, live orders and money movement.

The first bootstrap created only local simulated paper account
`paper_account:5987d75e-299d-4226-806e-d999f5ba381e` with 20,000 cents. It did
not create a durable goal because the running installed node still had the
pre-repair correlated query loaded. A same-input replay reproduced the typed
retryable failure without creating a duplicate paper account. This is
first-divergence evidence, not live acceptance. The running node must load the
grouped-join repair before goal/monitor delivery acceptance continues. No
provider mutation or live-order surface was called.

## Next acceptance slice

1. Add the narrow processing permission to the development Auth0 API/client and
   prove the installed client receives it without any live-trading permission.
2. Completed in code: bind a brokerage-native durable goal to the exact
   profile, private room binding, connection, paper account, producer epoch and
   owner-scoped run, then create its finite generic monitor lease.
3. Completed in code: expose thin MCP adapters for bootstrap and cycle
   processing; do not create a scheduler or private Codex loop in Helix.
4. Prove installed fresh delivery, no-change suppression, acknowledgement, process
   reconnect without duplicate paper processing or wake, revocation and stale
   epoch failure.
5. Only after that deterministic trace, run installed-profile shadow acceptance
   with real read observations and simulated state transitions.

## Installed material-change acceptance — 2026-08-27

The patched keyed installed node completed the remaining profile-scoped shadow
acceptance without invoking any Robinhood mutation surface:

- durable run `run_7d6261f8-0ff0-4ff7-b956-246ab5f702f6`, room binding
  `agent_room_binding:82482cd2-369a-433e-96cb-8eb5442cb155`, durable goal
  `environment_durable_goal:4b9c5519-ece4-4886-95e8-93c7c0acc230` and the
  existing owner-scoped paper account were recovered idempotently;
- monitor `environment_monitor:9b046d52-86a4-4659-84ee-ff0693b16f52`
  retained the exact profile, MCP client continuation, private room, binding,
  connection, paper-account subject/world and producer epoch identities;
- a fresh installed `get_equity_quotes` read produced observation
  `brokerage_observation:da402327-608b-4bad-9c58-d0b88f9e9dec`; the local paper
  canary then emitted `paper_order_filled`, `paper_position_marked` and
  `paper_position_opened` under observer cycle
  `brokerage_observer_cycle:5166b1692b5d209b5814a886c51eb17a62e535a915574e4838a016e96ed4bcc5`;
- semantic delivery advanced the monitor exactly once from cursor `0` to `1`.
  A separate Codex process read the compact batch and acknowledged cursor `1`;
- after a keyed-node restart, exact replay of the now-stale source observation
  returned the same observer-cycle identity and disposition `duplicate`. The
  monitor remained cursor `1/1` with one delivered wake and reported the exact
  duplicate evidence ref;
- a separate reconnect request returned the same monitor ID, cursor state, wake
  count and original `2026-08-27T18:51:30.332Z` expiry. It did not extend the
  lease;
- the installed UI closed the simulated position, leaving zero open paper
  positions and live orders locked;
- revocation at `2026-08-27T18:30:53.383Z` preserved cursor `1/1`. A fresh
  post-revocation read returned `lease_inactive`, zero items and no wake;
- every installed receipt reported `provider_mutation_attempted=false`,
  `live_order_execution_enabled=false`, credential/raw-event exclusion and no
  answer or terminal authority.

The trace exposed and repaired a replay-order regression: an exact previously
processed observation was initially rejected after its quote freshness window
elapsed. Paper processing now resolves an already-committed exact receipt before
requiring fresh evidence for a new effect, while the observer still reloads the
stored output hash and rejects a superseded producer epoch. New stale evidence
continues to fail closed. The delayed-replay route fixture and the integrated
monitor-store stale-epoch fixture preserve both sides of that boundary.

The staging helper is developer-only, caps its local paper canary at $25 by
schema, requires exact fresh quote and resolved no-earnings evidence, and uses
integer basis-point arithmetic for the +50 bps entry buffer and 100 bps stop.
Its focused three-test battery proves identity failure, rejected-risk
non-submission and simulation-only accepted staging.

This exact resident market-observer profile is therefore `live accepted` for
real read observations plus local simulated state. It does not accept a live
brokerage supervisor, autonomous scanning, live orders, strategy quality,
profitability or a terminal Helix Ask answer.
