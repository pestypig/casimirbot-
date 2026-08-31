Program gate: G8 — environment-harness release evaluation
Workstream: Public-user Shared GPT Live Room semantic MCP configuration
Capability or component: Shared Live Room settings, lifecycle, privacy, runtime, floor, media, visual ingress, and membership controls
Lifecycle stage: tool admission; secondary stages are effect execution, evidence normalization, evidence re-entry, and presentation
Reaction timescale: none for configuration and lifecycle requests; interactive for browser-owned media and floor state
Authority owner: the signed-in participant owns their consent and membership; the room owner owns runtime reservation and room closure; the browser/native host owns WebRTC devices and provider session binding; Helix owns policy, identity, admission, idempotency, receipts, and post-state projection; Codex owns intent interpretation, tool selection, re-entry, follow-up reasoning, and completion
Current maturity: deterministically verified for authority-reducing own-consent revocation, exact-epoch speaking-floor inspection/release, and signed-delegation own-consent grant/speaking-floor acquire; native signer and trusted installed-client conversation binding remain unverified external acceptance
Target maturity: deterministically verified semantic MCP parity for every host-independent public room setting, with explicit native-host handoffs for browser-owned effects
Required evidence: semantic family inventory; UI/MCP shared-handler parity; public account and OAuth admission; exact effect and confirmation class; idempotency and replay; nonterminal receipts; post-state projection; adversarial grant/revoke tests; public UI and MCP conformance audits; focused deterministic tests; keyed installed acceptance only after deterministic closure
Explicit non-goals: DOM clicking; browser automation as the room configuration contract; model-supplied profile, participant, session, invite, or credential identity; exposing invite codes, realtime session identifiers, media tracks, source bearers, pairing material, private endpoints, hidden reasoning, or terminal-answer authority; private sampling, retry, approval, compaction, or completion loops
Downstream gate unlocked: a new user can ask an attached Codex client to inspect and safely reduce room sharing authority now, while later settings graduate through one uniform semantic capability framework instead of per-button automation

# EH-G8 Shared Live Room MCP configuration v1

## Outcome

Shared GPT Live Room configuration is a semantic domain surface, not a remote
control protocol for React components. Browser UI routes and MCP adapters must
call the same control service and domain handler. Each operation is classified
by the authority it changes, receives a closed input schema, derives identity
from the authenticated principal, and emits a typed nonterminal receipt plus a
fresh post-state projection.

The implemented slices are `room.consent.revoke`, `room.floor.inspect`,
`room.floor.release`, `room.consent.grant`, and `room.floor.acquire`, published through MCP as
`helix_room_consent_revoke`, `helix_room_floor_inspect`, and
`helix_room_floor_release`. Consent revocation can disable any combination of the calling
participant's six consent fields. It cannot set a field to `true`, cannot edit
another participant, and cannot infer consent from the prompt or a UI label.
The mutation is caller-idempotent, reconciles runtime/visual consent, and
returns `authority_delta=reduced_only`.

Floor inspection returns only the bounded owner, epoch, and lease projection.
Floor release derives the participant and runtime from authenticated state and
requires the exact inspected epoch, so a stale call cannot release a later
floor. It is state-idempotent and returns a nonterminal post-state receipt.

Consent grant and floor acquire require
`helix.shared_live_room_mcp_delegation_receipt/v1`. The Ed25519-signed receipt
has the distinct `casimirbot.shared_live_room_mcp` audience and binds the exact
authenticated MCP client, conversation thread, account session/type/profile,
room, capability, and canonical sealed request. It expires within five minutes
and is consumed once through a database uniqueness ledger keyed by both receipt
and request ID. Missing signer trust, durable replay storage, or trusted
conversation identity fails closed before the shared handler mutates state.

## Uniform semantic capability framework

Every room operation must declare this tuple before it can be agent-callable:

```text
semantic capability id
public UI control family
authenticated authority owner
account feature and OAuth scopes
closed semantic input
effect class
affirmative-intent requirement
confirmation or delegation policy
idempotency/replay policy
real shared handler id and version
typed receipt schema
post-state verification
secret/raw-content exclusion
re-entry and terminal-authority negatives
```

Several buttons may project one capability. One button may expose different
operations depending on state. Static button text or a handler name never
creates authority. A control receives an explicit capability binding only when
every operation reachable from that control satisfies the same authority
contract; otherwise the control remains `blocked_pending_contract` while its
safe semantic subset can still be independently discoverable through MCP.

## Public room setting audit

| Semantic family | Representative public controls | MCP state | Required boundary |
| --- | --- | --- | --- |
| Room discovery | list rooms, open existing room, refresh | implemented | Membership-scoped read; bounded nonterminal observation. |
| Room creation | title, create room | implemented, feature-gated | Owner derived from principal; stable idempotency; existing confirmation policy retained. |
| Own presence | present/away | implemented | Caller participant only; no consent or transport authority. |
| Own consent revoke | six permission toggles when currently on | implemented in this packet | Literal `false` only; idempotent; shared UI/domain handler; runtime and visual reconciliation. |
| Own consent grant | six permission toggles when currently off | implemented; native acceptance pending | Signed one-use MCP delegation bound to account, room, exact fields/values, client/thread, and expiry. |
| Invite creation and join | create/copy invite, invite-code input, join | blocked pending secure delivery | Invite secret must remain outside model context; use an opaque owner-bound claim/delivery handle. |
| Runtime reservation | Connect room to GPT Live | specified | Owner-only model allowlist, idempotent reservation, readiness post-state; does not imply provider session binding. |
| Provider session binding | browser connection phase | native-host required | `realtimeSessionId` stays browser-owned and must never be a model argument or MCP receipt field. |
| Speaking floor release | release floor | implemented in this packet | Caller participant and exact inspected current epoch only; authority-reducing, state-idempotent receipt. |
| Speaking floor acquire | take floor | implemented; native/live transport acceptance pending | Present participant, microphone consent, runtime readiness, signed exact-input delegation, idempotency, and bounded lease receipt. |
| Audio/media bridge | connect/disconnect audio, resume playback | native-host required | Browser device permission, WebRTC tracks, autoplay, and media bridge ownership remain in the browser/native host. |
| Visual ingress | start/stop screen or camera capture, image lane | native-host required for capture; semantic revoke already covered | Device picker and pixels remain host-owned; MCP may later request a host prompt but cannot capture directly. |
| Leave or close | leave/switch room | blocked pending consequential-action confirmation | Participant leave versus owner close/revocation must be previewed distinctly and confirmed with a typed receipt. |
| Source and environment authority | source binding, World Authority, Player Embodiment | separately governed existing environment capabilities | Preserve source/subject identity, leases, confirmation, Emergency Stop, and typed environment receipts; do not fold into generic room settings. |

## Confirmation and delegation rule

The existing `helix.runtime_tool_confirmation_receipt/v1` is signed for the
workstation-tool-gateway audience. Treating it as an MCP approval would be an
audience-confusion bug. Authority-increasing MCP configuration therefore stays
admitted by the new MCP-specific receipt only when it provides:

- exact MCP client/task, account, room, capability, sealed input, and expiry;
- explicit user decision from a trusted first-party/native surface;
- one-use or bounded-use semantics with durable replay prevention;
- rejection after account/session change, room closure, one-time consumption,
  or expiry; and
- no implication of provider credentials, trading authority, media-device
  permission, or terminal-answer authority.

Authority-reducing operations may graduate earlier when they remain
owner-scoped, idempotent, and post-state verified.

## Deterministic acceptance for the implemented slices

1. A public-experiment `user` principal with `helix.rooms.manage` can discover
   and call `helix_room_consent_revoke`.
2. The MCP schema rejects `true`, an empty consent patch, unknown fields, and
   caller-supplied identity before the handler runs.
3. The service derives `profileId` from the principal and calls
   `patchOwnSharedRealtimeRoomConsent`, the same domain handler reached by the
   browser consent route.
4. Repeating the same idempotency key and validated request returns the durable
   receipt without a second consent mutation.
5. The receipt names exact changed fields, reports
   `authority_delta=reduced_only`, and preserves `assistant_answer=false`,
   `answer_authority=false`, `terminal_eligible=false`, and
   `raw_content_included=false`.
6. Runtime readiness and visual consent are reconciled after mutation.
7. No keyed server, browser, tunnel, provider session, or installed EXE is
   required for deterministic acceptance.
8. `room.floor.inspect` rechecks membership and returns the exact bounded floor
   epoch without granting floor authority.
9. `room.floor.release` derives participant/runtime identity, requires that
   epoch, leaves another or later floor unchanged, and returns the fresh room
   projection with `authority_delta=reduced_only`.
10. `room.consent.grant` accepts literal `true` only and invokes the same
    consent patch/reconciliation path as the first-party editor after exact
    signed-delegation verification.
11. `room.floor.acquire` invokes the same floor-claim handler as the public UI,
    rechecks presence, consent, runtime and host-transport role, and returns the
    bounded floor with `authority_delta=increased_bounded`.
12. Wrong audience, client, thread, account session, room, capability, sealed
    input, expiry, signature, or replay ledger state fails before mutation.
13. The public UI catalog remains 398 controls and now classifies the take and
    release floor controls as the two route-owned room controls (101 other room
    controls remain blocked); the public capability projection contains 42
    semantic groups.
14. MCP Evidence Conformance inventories 77 registrations / 71 unique tools /
    3 joined evidence capabilities / 68 intentional descriptor gaps. The two
    new mutation receipts remain nonterminal control artifacts, not evidence
    capability observations.

## Stop boundary

Stop deterministic implementation when the next proof requires browser device
permission, a live WebRTC/provider session, a trusted native delegation signer,
installed MCP catalog refresh, or an authenticated keyed server. Record the
exact missing host contract rather than substituting computer control or a
model-visible secret.

Current stop: the native EXE must issue the signed artifact and inject a
server-trusted Codex client/conversation binding into `createHelixMcpServer`.
Ordinary `/mcp` deliberately exposes the tools but returns
`room_mcp_delegation_identity_unavailable`; caller arguments cannot supply the
missing identity. Keyed server, browser, tunnel, provider-session, and installed
catalog acceptance are not claimed by this packet.
