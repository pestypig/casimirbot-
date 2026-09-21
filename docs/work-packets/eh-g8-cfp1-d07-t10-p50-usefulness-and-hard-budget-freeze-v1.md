Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 hard-budget and usefulness freeze
Capability or component: T10 trial and P50 paid sponsor-term resource, enforcement and useful-journey profile
Lifecycle stage: source-bounded specification before CFP-3 implementation and CFP-4 signed installed execution
Reaction timescale: each first-party HTTP request, five-minute deliberate room lease, 120-second native action, seven-day trial and monthly paid term
Authority owner: Product owner delegates provisional validation limits; CFP-1 freezes tests; CFP-3 implements enforcement; CFP-4 executes installed cases; D11/D12 approve customer terms
Current maturity: specified
Target maturity: specified with independently reviewed numerical pass/fail fixtures for the hosted-workload and usefulness rows
Required evidence: D03 action freeze, T10/P50 route arithmetic, provider meter semantics, current source hashes, D07 envelope, independent fixture review and later CFP-3/4 execution
Explicit non-goals: no current enforcement, installed result, customer promise, final price, margin, qualified rights/privacy/tax return, provider/account mutation or stage promotion
Downstream gate unlocked: D07 hosted-workload and usefulness rows may advance to bounded policy after independent review; D07 itself remains open

# CFP-1 D07 T10/P50 usefulness and hard-budget freeze v1

## Profile identity and boundary

Freeze provisional validation profile
`cfp1.hosted_shared_action_budget.v1` for the selected first-party non-model
room and exact D03 shared action. PBT remains internal modeled-cost admission:
1,000 PBT equals the provisional `$1` trial variable-cost ceiling and 4,000 PBT
equals the provisional `$4` paid ceiling. These are not customer credits, model
tokens, overages or proof that the complete offer is viable.

[Replit's current publishing documentation](https://docs.replit.com/billing/deployment-pricing)
defines one CPU-second as 18 compute units and one GB-second of memory as two
compute units. Its [database billing documentation](https://docs.replit.com/billing/about-usage-based-billing)
states that a production database stays active for five minutes after its last
request. The profile therefore bounds raw work and database union time before
applying the dated private account-rate table. Private provider rates, invoices
and account identifiers remain outside this repository.

The first-party HTTP request must return an admitted, denied or pending receipt
within five seconds. It must not keep a server request open for the separate
120-second local native-effect deadline. Delayed native results use finite
status retrieval or an independently bounded notification, each charged to the
same term.

## Frozen provisional hard ceilings

| Bound | T10 trial | P50 paid |
| --- | ---: | ---: |
| Term | 7 continuous days | 1 monthly paid term |
| PBT allowance / modeled variable-cost ceiling | 1,000 / `$1` | 4,000 / `$4` |
| Verified successful effects | 10 | 50 |
| Room / guest / connected program | 1 / 1 / 1 | 1 / 1 / 1 |
| Deliberate room-lease admissions | 12 | 60 |
| Duration of each deliberate lease | 5 minutes | 5 minutes |
| Maximum room-caused database union, including one five-minute tail per disjoint lease | 120 minutes | 600 minutes |
| Ordinary hosted API requests | 100 | 300 |
| Protected stop/revoke/status/remedy requests | 20 | 30 |
| Request body | 32 KiB | 32 KiB |
| Response body | 128 KiB | 128 KiB |
| Ordinary hosted egress | 25 MiB | 100 MiB |
| Protected-path egress reserve | 5 MiB | 10 MiB |
| Sponsor-attributable retained application data | 5 MiB | 25 MiB |
| First-party HTTP work deadline | 5 seconds | 5 seconds |
| Conservative reservation per hosted request | 20 vCPU-seconds + 40 GiB-seconds | 20 vCPU-seconds + 40 GiB-seconds |
| Total CPU reservation, ordinary plus protected | 2,400 vCPU-seconds | 6,600 vCPU-seconds |
| Total memory reservation, ordinary plus protected | 4,800 GiB-seconds / 5,153.9607552 provider GB-seconds | 13,200 GiB-seconds / 14,173.3920768 provider GB-seconds |
| Total compute-unit ceiling | 53,508 | 147,147 |
| Native D03 action deadline | 120 seconds | 120 seconds |
| Concurrent mutating guest requests | 1 | 1 |
| Concurrent unresolved native effects | 1 | 1 |

The per-request reservation uses the four-vCPU/eight-GiB maximum deployment
allocation observed in the [dated Replit deployment read](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-replit-deployment-and-usage-recheck-115.md)
as the selected validation configuration for the full five-second HTTP
deadline. The internal memory ceiling remains in GiB-seconds, while the
provider meter uses decimal GB-seconds. The term compute ceilings follow:

```text
trial_cpu    = (100 + 20) × 4 × 5 = 2,400 vCPU-seconds
per_request_memory = (8 GiB × 1.073741824 GB/GiB) × 5
                   = 42.94967296 GB-seconds
trial_memory_internal = (100 + 20) × 8 × 5
                      = 4,800 GiB-seconds
trial_memory_provider = 120 × 42.94967296
                      = 5,153.9607552 GB-seconds
trial_CU = ceil(18 × 2,400 + 2 × 5,153.9607552)
         = 53,508

paid_cpu     = (300 + 30) × 4 × 5 = 6,600 vCPU-seconds
paid_memory_internal = (300 + 30) × 8 × 5
                     = 13,200 GiB-seconds
paid_memory_provider = 330 × 42.94967296
                     = 14,173.3920768 GB-seconds
paid_CU = ceil(18 × 6,600 + 2 × 14,173.3920768)
        = 147,147
```

The private dated rate screen places these compute and database ceilings below
the provisional PBT money ceilings. That screen does not yet bound request,
egress, storage, base/free-personal, support, distribution, account tax or
other D07 rows; the aggregate economics remain open.

`Protected` capacity is restricted to owner stop, grant/offer revoke, safe
native release, status/reconciliation after ordinary-budget exhaustion or
during an active safety/remedy incident, and an accepted customer-remedy route.
Normal result reads, polling and action-completion inspection consume the
100/300 ordinary request budgets. Ordinary room, invite, offer, action, polling
or new-effect traffic cannot spend protected capacity. Protected work is still
recorded and costed in the cohort envelope.

Before admitting each new effect, retain until terminal settlement at least one
protected stop/control request and one protected status/reconciliation request,
including each request's response, CPU, memory and egress reservations. Neither
ordinary work nor another unresolved effect may borrow that retained reserve.
If it cannot be preserved, deny before grant consumption or native release. If
incident traffic later exhausts the larger protected pool, fail closed on new
effects and escalate the incident; never remove the independently reachable
local Emergency Stop or native control-release path.

The retained-data ceiling includes all sponsor-attributable room, membership,
invite, share, offer/grant, request, idempotency, result, effect-counter, PBT
and permitted history data. Any mandatory security, legal or financial record
excluded from that ceiling needs a separately bounded fixed-cost and D11
retention row before D07 closure.

## T10 useful-journey acceptance

T10 is reviewably useful by specification only when the frozen CFP-3/4 fixture
requires all of the following:

1. The exact D03 action succeeds 10 of 10 times at trial hours `0`, `12`, `30`,
   `48`, `72`, `96`, `120`, `144`, `156` and `167`.
2. Every success has the exact native postcondition, requester/owner
   attribution, zero locomotion and no duplicate native effect.
3. The full account, Start Trial, room, invite, local share, per-effect fresh
   target observation, owner pre-grant, guest request, result, lease and expiry
   journey fits 100 ordinary requests, 12 leases, 25 MiB ordinary egress,
   5 MiB retained data and 1,000 PBT.
4. The ten-success browser portion remains exactly 40 calls under the current
   route contract. Target acquisition counts against the 100-request ceiling
   whenever it reaches the hosted service; if it is proven local, record that
   fact and its connector work separately.
5. Host and guest reauthenticate during the trial without resetting the trial,
   effect, lease, request or PBT revisions.
6. One server restart after effect five preserves every durable term, request,
   effect and budget revision. A process-local limiter reset adds no capacity.
7. One same-key retry returns the original request identity/status, settles no
   work twice and creates no second native effect.
8. At hour 168, a new action denies before native release while protected
   stop/revoke/status and otherwise permitted free personal use remain.
9. After lease expiry, backgrounded and closed tabs create no routine
   room-origin database request. An explicit eligible return rechecks identity,
   membership, sponsor, program visibility and resource admission.
10. No CasimirBot-funded model or voice provider call occurs.

The T10 waste variant's first 12 admitted leases may include the ten successful
visits and two costed failure/denial visits. Intentional visits 13 through 30
are expected lease-exhaustion denials before ordinary room work, but each still
consumes its actual ordinary admission-request work and PBT. The fixture must
report whether all 18 denials plus earlier work fit the 100-request and 1,000-PBT
ceilings; denial is never zero-cost. Do not claim that the same exhausted run
also demonstrates later successful effects; use the clean T10 run for the
ten-success useful journey.

## P50 useful-journey acceptance

P50 is reviewably useful by specification only when:

1. Fifty exact D03 effects succeed across 25 visits, two per visit, with the
   same postcondition, attribution, zero-locomotion and no-duplicate rules.
2. The successful browser portion remains 175 calls; the complete ordinary
   route, including target acquisition where hosted, five pre-native denials,
   five accepted no-effect attempts, room/identity work, replay and return,
   stays within 300 requests and 60 leases.
3. Failed, denied, duplicate and uncertain work is costed but consumes none of
   the 50 verified-success counter. At most one unresolved native effect exists.
4. Restart, idempotent replay, suspended-room return and a late-term effect
   preserve all term counters. Room recreation does not reset capacity.
5. Effect 51 denies before native release.
6. The full journey remains within 4,000 PBT and every hard ceiling above.

Prepared exact-action acceptance is 10/10 and 50/50. A changed target,
external mutation, source disconnect or connector failure is a typed visible
non-success. It may trigger the separately reviewed remedy but cannot be
discarded to manufacture a passing success rate.

## Deterministic denial and remedy fixtures

CFP-3 must prove these cases before CFP-4 runs the signed installed cohort:

- ordinary request 101/301, lease 13/61 and effect 11/51 deny before dispatch;
- any reservation that would exceed PBT, CPU, memory, request, egress, storage,
  response-size, concurrency or deadline denies before dispatch;
- a pre-dispatch admission/denial receipt returns within five seconds;
- a native action unresolved at 120 seconds becomes `outcome_unknown`, is not
  replayed and retains its one unresolved-effect reservation until accepted
  reconciliation;
- two simultaneous requests against one grant yield at most one native effect;
- tab activity, poll or heartbeat cannot renew an expired five-minute lease;
- ordinary-budget exhaustion preserves the protected path;
- an out-of-range or non-focusable target returns
  `stationary_target_not_ready` with no locomotion;
- sponsor handoff suspends the first-cohort D03 action. Handoff is a
  denial/remedy fixture, not a positive usefulness case, until a separate
  sponsor-not-program-owner profile passes D03/D07/D11/D12 and CFP-3/4; and
- direct API/MCP/service bypass, stale term/grant/source/connector revision and
  wrong actor/room/program/target each cause zero unauthorized native effects.

## Stage ownership and current-source contradiction

CFP-1/D03 owns action identity, target, grant and native semantics. CFP-1/D07
owns this budget profile and usefulness fixture. CFP-3.COMMERCE owns durable
sponsor-term PBT and resource counters, protected reserve and deployment guard;
CFP-3.LICENSE supplies current term and sponsor revision; CFP-3.SHARED-ACTION
atomically reserves resources, consumes the one-use owner grant and settles
native evidence; the room owner enforces lease suspension and cessation of
passive database work. CFP-4 executes T10/P50 on the signed installed cohort.
D11/D12 approve retention, remedies, disclosures and final commercial terms.

Current source implements none of the proposed `helix.hosted_room.*`,
`helix.hosted_guest_action.*`, `/api/agi/hosted/v1`, sponsor-term PBT or
verified-effect counters. Current process-local rate limits cannot satisfy this
profile across two instances or restart. That is expected CFP-3 implementation
work, not evidence against freezing the CFP-1 fixture.

## Source identity

Repository HEAD was `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93` with concurrent
working-tree changes. Audited working-byte SHA-256 values:

| Input | SHA-256 |
| --- | --- |
| D03 conditional freeze | `EB1E57340DC6A349A73D2CDF18CEFA6D53BA6CBDC6E5FF9C075B01A2E256B28C` |
| D07 workload | `C51E7DD4A828AEA9CB698BC713EA334AF6D566D8557242DF07362B1F7D2A972C` |
| D07 conservative envelope | `C266ACEC06AE01B33427084CFE90F39EE2C6278E0DE048493A3106C1E6139F95` |
| Provisional term | `2CF1D12A5F188CDAA5CC92068004D13FAE4A8D6BD9FF5B821C16FBD947AB02A7` |
| PBT contract | `31515F28C4D0889E8F4A573E0B724D0DCC3A799DDAE75EB02F5AE09AA9A0B7E7` |
| First-party API contract | `D69A69A651DC2B1EF665AD765C1A0D54BA5441F50924C16AA2C37FE73AC68543` |
| Shared room route | `548890E74C067136B5AAB53C6F9861CA70C55A537C44144BB433B2BBA1291B41` |
| Environment action route | `EB04093AD0D0A8D8F0A15C89DA77C114A4ABF491F2913B1274567CB1C75D8BD0` |
| Process-local limiter | `C776F07656C60AEBA48B037243A1D8B710FD1A1250020580D5BA932866DC2180` |
| Action broker | `8F59C420CBB813FB52532B9C11384C908B38A20CEC8C0F72812CB5DD7C0C93BA` |

After independent review, this packet may change the D07 `Hosted workload` and
`T10/P50 usefulness` rows from `missing` to `bounded_policy`. It cannot make
them `bounded` until the final owner selection and complete D07/D11 conditions
pass. CFP-3/4 execution failure reopens D07/D12. D07 and CFP-1 remain open.
