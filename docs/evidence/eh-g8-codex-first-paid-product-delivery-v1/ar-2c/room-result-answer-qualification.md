# AR-2C room result answer qualification — 2026-09-24

Status: deterministically verified for the developer API slice; no live or installed acceptance.

## Implemented path

The developer owner explicitly selects one exact room mission result for sharing
through JSON `POST /api/agi/ask/turn`. The request binds room, mission/revision,
steering event, result, request ID and question. Cookie-authenticated membership,
account link, exact selected task and captured speaker consent are checked
before source use and again after reasoning. Guests cannot fetch the owner's
private source through this caller. A deterministic turn identity permits an
identical authorized retry to reuse the completed response.

The real gateway source read produces an observation with a separate task
status (`completed` or `unable`). A successful source read does not assert that
the task achieved its goal. The bounded task report enters the existing Codex
provider through trusted server composition. The explanation receives no
additional admitted capabilities or environment effects. Existing provider
re-entry, solver, route-product and terminal-authority checks precede the
room-visible projection. The projector requires an additional private grant
bound to this exact owner/result explanation. The private source grant is bound
to the current turn. A fingerprint of the answer and its authority fields must
remain unchanged during the final asynchronous authorization check and before
publication.

The new `room_mission_result` source target is deliberate: the existing
`runtime_evidence` target requires repository-code evidence. Treating a task
report as that source produced `missing_repo_observation`; the implementation
now preserves the real source identity instead of relaxing repository checks.

The captured-provider-prompt assertion exposed a second issue: the new gateway
capability had no typed-observation normalization mapping, so its report text
was omitted even though gateway receipts existed. The new mapping now carries
the bounded report into Codex's existing normalized evidence input. Malformed,
stale-turn, altered-text, answer-authoritative or invalid-status observations
fail normalization. This fix adds no private model or tool-execution loop.

## Evidence and scope

The integrated fixture in
`server/services/helix-ask/realtime-room/__tests__/voice-handoff-authority.test.ts`
uses owner HTTP dispatch, an actual in-memory MCP client/server transport,
task acknowledgement and encrypted result storage, the normal Ask HTTP route,
the real Codex provider with its fake process transport, the existing solver,
and the real room terminal projector. It checks that the captured fake-provider
input contains the exact task report, then checks answer attribution, identical
retry, guest denial, a source denial after HTTP admission, and mission revocation.
The terminal text is authored by the fake provider; it is not copied from the
task-result receipt. This proves integration of the deterministic contracts,
not the quality of a live model's interpretation.

Representative prompt: `Explain the selected task report to this room.`
Fixture provider answer: `The selected task reports consistent mission constraints. This report does not verify movement or authorize a new action.`
Representative denial: the same request after mission revocation returns a
typed failure before provider use; it cannot publish another room answer.

| Check | Result |
| --- | --- |
| Final source, voice/MCP/HTTP, public projection and provider-normalization fixtures | [82/82 passed](focused-tests.json): source 40, voice/MCP/HTTP 24, public projection 10 and normalization 8. |
| Capability plan and lifecycle regressions | [83/83 passed](capability-regressions.json): plan 75 and lifecycle 8. |
| Broader Ask regression run | 135/135 passed before final normalization/fingerprint tightening: API parity 31, prompt benchmark 36, terminal equivalence 6, source 38 and voice 24. Final changes are covered by the focused rerun. |
| Agent-connections regression | 28/28 passed in the earlier 90-case focused run. |
| Ask discipline quick check | Passed. Heuristic warnings were reviewed against the source-admission/evidence/terminal-policy scope; no new sampling or execution runtime was added. |
| Server build | Passed; four existing warnings in unchanged demonstration, halobank-solar and starsim files. This is a server bundle, not an installed EXE qualification. |
| Final documentation audit | Passed: G8 active, six backlink files, seven canonical targets, 40 capability rows and 14 acceptance claims checked; no failures. |
| Scoped diff whitespace check | Passed. |

The contract/variety scorecard uses observed deterministic fixture pass
fractions only. Live multi-member success probability remains unmeasured.
No paid provider call, native action, deployment or subscription change was made.
The full room UI journey, installed EXE, domain/Replit deployment, restart and
reconnect, three-member capacity and controlled live Dan/Sam/Alex evaluation
remain separate AR-2 prerequisites. The selected paid no-model offer is unchanged.

This is non-physics application source/terminal-policy work; no physics adapter,
constraint pack, certificate or physical-maturity claim changed. Casimir
verification is not used as evidence for this path.

The [source manifest](source-manifest.json) fingerprints the implementation and
fixture files at this qualification. The working tree contains pre-existing
changes; this is a local source snapshot, not a clean release or deployment.
