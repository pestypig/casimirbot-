Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2C — external mission result to room answer
Capability or component: Owner-authorized result source, Ask re-entry and room terminal projection
Lifecycle stage: Source admission, evidence normalization, re-entry, terminal authority and presentation
Reaction timescale: Explicit room result explanation
Authority owner: Current room owner and captured speaker consent; Codex runtime; existing Ask terminal gates
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Real HTTP admission, exact private source read, fake-provider re-entry, solver/route-product gate, room projection and denial tests
Explicit non-goals: Paid provider calls, native effects, guest access to private results, new principal, three-member capacity, deployment or commercial acceptance
Downstream gate unlocked: Installed/domain and controlled multi-member AR-2 qualification after their remaining prerequisites

# Goal prompt

Use GPT-6 Astra at high reasoning. Implement the smallest vertical slice from
an exact AR-2B2 private external-task result to a newly admitted room Ask turn.
The current authenticated owner explicitly selects the result for room sharing.
Recheck room membership, account link, selected mission/revision, exact task,
acknowledged event and captured speaker consent. Treat the result as untrusted,
nonterminal evidence; preserve `unable` as a task outcome. Use Codex's existing
observation re-entry and the existing solver/route-product terminal gates before
publishing one attributable explanation. Recheck authority after reasoning.
Test cross-room/member access, missing/stale/revoked results, request replay,
missing re-entry and receipt-to-answer shortcuts without paid provider calls.

## Admission and caller freeze

The owner's continuation request admits this developer-only lane independently
of CFP-1 commercial closure. Classification: **source admission**, **evidence
normalization**, **evidence re-entry**, **terminal authority**, **presentation**.
The explanation does not revise the mission or dispatch an environment action.
Codex retains sampling, tools, continuation, session and terminal completion.

The first HTTP caller is JSON `POST /api/agi/ask/turn`, with an explicit
`room_mission_result` selection naming room, mission/revision, event, result and
request ID plus `share_with_room: true`. Server account policy must be developer;
the authenticated member must be the selected mission owner. This does not grant
guests access to the owner's private task. Server-derived turn identity binds
the selection, owner, room and question. Reserved result-turn identities cannot
be replayed through ordinary Ask, legacy Ask or streaming without admission.
Every retry revalidates current authority. A lost task presence remains a typed
failure; this packet does not invent durable permission after task completion.

Allowed implementation surfaces: the browser durable-access helper extracted
from `server/routes/agent-connections.ts`; a new room-result Ask admission
middleware and private request context under
`server/services/helix-ask/realtime-room/`; its composition in `server/index.ts`;
the `/ask/turn` join and solver boundary in `server/routes/agi.plan.ts`; the
workstation gateway manifest/executor, registry and trusted account context;
existing public terminal projection; their focused tests; this packet, evidence,
the launch guide and canonical program. Expand this list with a source-backed
reason before touching another surface.

The gateway performs the genuine source read and produces a normal nonterminal
observation. The existing trusted `reenteredWorkstationGatewayCallResults`
provider input carries it into Codex; public request fields cannot impersonate
that input. The explanation uses the existing read-only capability policy with
no extra admitted effects. The existing Ask solver gate must run for this path,
and final projection requires the exact observation's re-entry and current
authorization. No queue/result receipt can authorize publication by itself.

## Acceptance

Source-backed allowlist extension: the first integrated fixture showed that
`runtime_evidence` is intentionally mapped to repository-code evidence, causing
`missing_repo_observation` for a valid room task report. Add the explicit
`room_mission_result` source target in the shared source/product types and the
existing committed-route, route-product and solver source maps. This accurately
classifies the admitted source; it must not satisfy any repository or physical
environment evidence requirement. No prompt keyword grants access to it.

The captured-provider-input check also found that Codex's typed-observation
normalizer dropped this new capability's payload. Extend the existing mapping
and normalization guard in `agent-providers/codex-provider.ts`, with focused
normalization tests. This is evidence normalization only; it adds no sampling,
tool-execution or continuation runtime. Missing/malformed normalization must
remain a failure rather than letting a receipt stand in for model-visible text.

- [x] HTTP source admission and replay identity deny unsigned, nondeveloper,
  guest, wrong-room, mismatched result and stale/revoked authority before model use.
- [x] Real source read → normal observation → fake Codex follow-up → existing
  solver/route-product gate → attributable room projection passes.
- [x] Revocation during reasoning, missing exact re-entry, receipt-only terminal,
  provider failure and `unable` results do not become false success claims.
- [x] Focused regressions, Ask discipline checks, server build and docs audit pass.
- [x] Evidence records deterministic scope and remaining installed/live gaps.

## Qualification and next boundary

The [qualification record](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2c/room-result-answer-qualification.md)
records the final 82-case deterministic source/HTTP/MCP/provider/projection run,
including capture of the exact report in the fake-provider prompt. Earlier
broader Ask regressions passed 135/135. A fake-provider fixture verifies wiring
and authority checks; it does not establish live reasoning quality.

Next, use a bounded developer UI/installed integration packet to expose this
explicit owner sharing action and verify the exact EXE/server/domain versions.
Then admit controlled multi-member live evaluation under its existing budget,
consent and provider prerequisites. Neither step is closed by this API slice.
Full AR-2, G8/CFP-1 and the selected paid no-model offer remain unchanged.
