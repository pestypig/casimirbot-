Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and binding repair
Capability or component: durable consented pairing, exact-task delivery and deterministic workflow testing
Lifecycle stage: source admission; presentation; evidence re-entry
Reaction timescale: human-paced pairing, bounded delivery and immediate revocation
Authority owner: human approves scope; authenticated provider owns task identity/lifecycle; Helix owns pairing and environment authority
Current maturity: specified
Target maturity: deterministically verified prerequisite and separately evidenced packaged rehearsal
Required evidence: complete state-transition matrix, real-handler deterministic tests, production isolation negatives, native interaction and exact delivery/ack trace
Explicit non-goals: no private model loop, provider impersonation, production consent automation, credential reuse across audiences, CFP commercial dispatch, ET6 substitution or NAV1 unlock
Downstream gate unlocked: none until the parent CS1-CS4 exits are independently evidenced

# Fluent harness onboarding and pairing plan

This is an implementation plan requested on 2026-09-08, not evidence that the
proposed behavior exists. The sole active-stage authority is the
[environment work program](../helix-environment-harness-work-program-v1.md).
It supplements [the continuous-session packet](eh-g8-et6-continuous-session-build-v1.md)
and preserves every CS1-CS4 exit and the CS5 handoff. Reuse
[PNA3.5](eh-g8-pna3-5-finite-agent-onboarding-recovery-v1.md); its earlier component
evidence does not prove this new workflow. Do not dispatch the separately gated
[CFP-2 commercial onboarding candidate](eh-g8-cfp2-external-client-onboarding-v1.md).
This repair is independently authorized within the current CS prerequisite scope.

## Problem established by inspection

Presence is a task-associated heartbeat, currently capped at 180 seconds.
The binding UI removes its verified-run selection when that heartbeat expires.
Claim creation requires active presence; claims default to 120 seconds and cap
at 300 seconds. Consequently the operator races the development agent's turn
boundary. Refreshing presence and observing an enabled accessibility node is
not evidence of a successful human click, accepted claim or functioning session.

The current claim field lacks a dedicated copy button. Binding state is held
in memory and tied to the service instance, so restart invalidates the pairing.
Existing native profile persistence does not by itself persist this binding.
The repeated live checkbox report remains unresolved; preserve that evidence.

## Platform patterns and limits

| Primary source | Pattern to adopt | Limit of the analogy |
| --- | --- | --- |
| [Discord Invites 101](https://support.discord.com/hc/en-us/articles/208866998-Invites-101) | Visible expiry, usage limits and an obvious copy action | A harness invitation must remain single-use and exact-target scoped; copying a social invite is not authority to execute |
| [RFC 8628 device authorization](https://www.rfc-editor.org/rfc/rfc8628.html) | Independent invitation lifetime, explicit pending/denied/expired states and bounded polling with backoff | This is a UX/protocol reference, not a claim that custom pairing implements OAuth device authorization; browser-capable native sign-in should use the appropriate native OAuth flow |
| [RFC 9700 OAuth security BCP](https://www.rfc-editor.org/rfc/rfc9700.html) | Scoped, audience-restricted credentials and transaction-bound authorization; PKCE for applicable OAuth code flows | Do not invent token exchange or treat a ChatGPT token as a CasimirBot credential |
| [Codex App Server](https://learn.chatgpt.com/docs/app-server) | Supported thread listing/resumption and account lifecycle APIs can underpin an authorized task picker/delivery bridge | These APIs do not establish access to this already-running Codex Desktop task; prove that boundary before offering automatic delivery |

These are design inputs, not a certification or platform interoperability claim.
Proposed timeout values below are product choices, not values mandated by these
sources. Pin the actual supported provider API/version in implementation evidence.

## Intended user journey

1. Start the installed harness. Reuse valid account linking and device trust.
   Show sign-in only when that grant is actually absent or invalid.
2. Choose the supported AI application and an exact existing task from an
   authenticated task list. Show task title plus stable distinguishing context;
   never select a latest task silently or create a replacement task.
3. Review the Helix chat, optional exact room/run, pairing duration and allowed
   communication scope. One explicit human approval authorizes this pairing.
   GPT Live may explain or present that control, but cannot activate it.
4. Deliver automatically through a proven, consented provider bridge. If that
   capability is unavailable, show Copy invitation and an honest fallback;
   do not hide the limitation behind repeated reconnect instructions.
5. Display separate states: approved, delivery pending, delivered, accepted,
   connected/idle, unavailable, expired or revoked. Acceptance requires a reply
   authenticated as the approved destination; sending is not acceptance.
6. Run shared Ready up and expose only the next genuinely missing approval.
   Environment action consent is separate and remains finite. Existing healthy
   source/player/goal identities are reused.
7. On restart or temporary inactivity, recover the approved pairing and show
   availability truthfully. Do not ask for pairing again merely because a
   heartbeat expired. Reapprove only an expired/revoked grant or a material
   identity/scope change that the original approval did not cover.

Target: one pairing approval and zero manual copy/paste on the supported automatic
path after account access is established. Necessary provider OAuth and separate
environment consent remain visible and are counted separately.

## Identity, lifetime and persistence contract

Separate durable pairing identity from ephemeral service/client transport epochs.
An approved invitation stores issuer/profile, installation identity, authenticated
provider/client identity, exact task ID, Helix chat, optional exact room/run,
scope, consent-policy revision, created/expiry times, nonce and revocation state.
Titles are display metadata, never identity proof. A caller-supplied task ID or
possession of a copied code alone is insufficient to claim a pairing.

Multiple authenticated clients/tasks may have distinct presences. A host-owned
bridge may report connection availability from actual transport/lifecycle events;
it must not label an idle model as reasoning or synthesize external task presence.

Proposed invitation policy: 15-minute default, explicit 5/15/60-minute choices,
single successful consumption, revocable before acceptance. Proposed pairing
grant policy for this development design: explicit 1/8/24-hour choices, default
8 hours, maximum 24 hours. These require schema/contract changes and tests before
shipping; the previously authorized eight-hour test window is not their authority.
Environment leases, run budgets, source credentials and commercial grants retain
their own policies. Neither activity nor recovery silently extends any grant.

The UI can retain a reviewed exact task/run selection while the task is idle.
Creating an invitation while idle requires a previously authenticated durable
destination registration or fresh provider attestation, plus current owner/run
checks. Historical heartbeat data alone cannot authorize a new invitation.
If that proof is unavailable, explain the missing registration; do not pretend
that simply removing the disabled attribute repairs authentication.

Persist invitations and accepted pairings through the existing encrypted native
storage/database boundary. Store only hashed acceptance secrets where possible;
if repeat copying requires a recoverable secret, encrypt it with a narrowly
scoped native broker purpose, never export it in diagnostics. Stable destination
re-attestation permits a new service epoch without rotating the approved pairing.
Reject account/installation/target changes, missing native keys and revoked grants.

Claim consumption is atomic. Replaying the same authenticated acceptance returns
the same accepted result; it never creates another pairing. A competing target or
changed request fails. Replacement must validate the new target before invalidating
a healthy old binding. A timeout after a write is an unknown outcome: reconcile
by request ID before retrying; never blindly retry a consent mutation.

## Ordered implementation and exit tests

| Step | Work / principal files | Exit evidence |
| --- | --- | --- |
| O1: freeze contract and reproduce | shared presence/binding schemas; local-supervisor store tests; AgentConnectionSetup tests | Red fixture: approve pairing, let task go idle beyond 180 seconds, return within invitation lifetime and accept once; preserve exact selection. Also reproduce restart and input failures without live consent |
| O2: durable pairing core | reasoning-task-binding-store; reasoning-run-association; persistence using existing native encryption | Atomic issue/accept/revoke/recover matrix, finite deadlines, wrong-principal rejection, no environment grants; migrate legacy service-bound state explicitly without inventing consent |
| O3: provider bridge feasibility | existing MCP/native supervisor adapters; supported provider APIs only | Prove list, exact-target delivery and authenticated acceptance against an isolated provider fixture, then the actual supported host. If host access is unavailable, record the missing API; fallback does not close automatic-delivery acceptance |
| O4: coherent UI | AgentConnectionSetup, reasoningTaskBinding, existing guidance and Ready up surfaces | Task picker, duration, Copy invitation, clipboard failure recovery, visible pending/accepted/idle states; selections survive refresh; no countdown-driven consent loss; keyboard and pointer activation pass |
| O5: integrated deterministic suite | real routes/store/native broker plus isolated fake provider and environment | Complete matrix below passes through actual public handlers and rendered UI; no implementation-shaped mock response substitutes for persistence or binding logic |
| O6: packaged rehearsal | exact built EXE, renderer/service/companion manifest | Ordinary consent, automatic delivery, accept, one visible prompt, exact pickup/ack, idle and restart recovery; operator intervention/revoke and zero duplicate effects evidenced separately |

O1-O5 do not depend on a live user's repeated approval. O6 needs real production
consent only where the user must exercise the actual authority boundary. Keep the
current keyed service intact; tests must not replace it or borrow its credentials.

## Deterministic testability is a required deliverable

Human-only is an authorization policy for live operation, not a prohibition on
automated tests. The development agent must be able to test both allowed and
denied paths for every control, including controls forbidden to GPT Live.

Use test-process dependency injection for the authenticated human session,
provider identity/transport, clock, persistence and native credential broker.
Use isolated temporary data, fixture-only keys and a non-production environment
executor. Exercise the same production validation and route handlers. Fixture
principals never authenticate against a real account or service.

Run browser automation against the isolated rendered application to perform real
pointer/keyboard actions on fixture consent controls. Include layout hit testing,
occluding overlays, scrolling, focus, tab order and native checkbox activation;
fireEvent and accessibility-enabled assertions alone are insufficient. Browser
integration is distinct from the packaged native acceptance test.

Production routes expose no consent-bypass flag or debug mint-grant endpoint.
Test factories are test-only dependencies, absent from shipped registration and
bundles. Negative tests must show production rejects fixture credentials, headers,
unsigned human assertions and attempts by GPT Live/MCP to invoke human-only
controls. A developer account is not automatically a consent-bypass principal.
Debug inspection may reveal sanitized reasons, IDs, timing and state transitions,
but not secrets, hidden reasoning or another account's task data.

| Matrix | Deterministic cases and invariant |
| --- | --- |
| Timers | Just before/at/after invitation and pairing expiry; idle >180 seconds; clock skew; no renewal through read/poll/copy; action expiry independent |
| Identity | Two profiles, clients and tasks; same titles; wrong chat/run/epoch; replay from another device; absent/changed registration; no latest-task fallback |
| Consent | Human approve/deny; GPT Live and MCP direct-approval rejection; changed scope demands approval; revoke before/during accept and delivery |
| Idempotency | Double click, concurrent acceptance, duplicate/reordered delivery, lost reply after commit, retry conflict; one pairing and one visible prompt |
| Recovery | Renderer reload, service restart/new port, encrypted store restore, provider offline/return, revoked grant, corrupted store/key loss; recover or precise typed blocker |
| UI | Mouse and keyboard checkbox activation, copy success/denial/unavailable, narrow viewport, overlay hit targets, background/foreground, hung request/body, late response, retained selection |
| Automatic path | Authorized exact-target list/send/accept; provider API unavailable; no invented delivery/wake/acceptance; idempotent outbox state survives restart |
| Authority | Pairing/heartbeat/trust never grants gameplay; expired/revoked actions reject; stop releases controls; no action replay on reconnect |
| Isolation | Fixture grants fail in production; fixture hooks absent from package; model-origin consent rejected; no secrets in diagnostics |

All denial, expiry and recovery paths must remain testable without requiring an
agent to operate real human-only controls. Simulated consent proves validation
behavior; it does not prove genuine live consent or live movement capacity.

## Verification and handoff rules

Starting regression anchors (already executed together on 2026-09-08: 95 passing
tests, before this proposed design; they do not qualify it):

```powershell
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx client/src/lib/agent-access/__tests__/reasoningTaskBinding.spec.ts server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Add requirement IDs to new assertions and record exact commands for O1-O5 at
implementation. Run docs audit for this plan; discipline quick for sensitive
implementation and full when identity/continuation behavior changes. Run builds,
native typechecks and focused integration checks matching the actual diff.
Apply the repository Casimir gate only when its verification scope is touched;
do not claim adapter/certificate integrity from UI tests.

Measure consent-to-acceptance, automatic delivery latency, recovery time, manual
actions and duplicate counts. Initial acceptance budgets: no manual copy on the
supported bridge; online delivery observed within 10 seconds on the frozen local
fixture; restored UI state within 5 seconds after a fresh server observation;
zero duplicate acceptance/prompt/effects. Report wall time and human wait separately.
Do not count offline time as delivered or misreport transport availability as AI
pickup. Real host timing budgets must be frozen from measured capability, not
inferred from fixture timing.

Record component, browser integration, packaged native and live environment
evidence separately. A successful final rehearsal requires visible actual
selection, claim acceptance, prompt display, exact pickup and acknowledgement;
an enabled control or passing unit suite is insufficient. Preserve every original
CS3 successor/interruption/re-entry requirement and CS4 recovery criterion.
CS5 remains a requirement-by-requirement handoff; ET6 remains unpassed and NAV1 gated.
