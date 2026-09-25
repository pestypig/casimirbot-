# AR-2B2 ingress progress — 2026-09-21

This is component evidence for the [active goal](../../../work-packets/eh-g8-ar2b2-live-room-mission-ingress-v1.md).
It does not complete AR-2B2's external-task path or AR-2's live evaluation.

## Behavior implemented

- Final room transcripts require the exact active room/session runtime, a
  present floor holder and current microphone-to-model/transcript-to-room
  consent. A missing/expired floor is unavailable, not the host's speech.
- Private handoff context records the runtime and consent version/receipt.
  The backend rechecks account/session/thread, original participant, runtime
  and consent. A subsequent floor change does not relabel that participant.
- A guest requires the current room media bridge. Demotion to host-only
  transport invalidates a captured guest handoff; a poisoned guest floor
  cannot claim that the host microphone carries guest audio. The host can
  still explicitly take the floor through the existing room UI.
- The real HTTP caller returns 409
  `realtime_room_speaker_authority_unavailable` before creating a handoff on
  failed ingress. The Codex backend rejects a materialized room handoff with
  `realtime_room_handoff_authority_unavailable` before invoking the model if
  current authority is absent. No new terminal writer or model loop exists.
- Ordinary personal Realtime context remains supported. These changes grant
  no environment action and do not select or wake an external task.

## Verification

Focused tests cover real room persistence, runtime registry, HTTP ingress,
stored handoff materialization and backend consumption. Provider tests use
deterministic fixtures, not paid model calls. All 28 focused tests pass in
[tests.json](tests.json). The [full discipline check](discipline.log), server
build, canonical docs audit and diff whitespace check also pass. Seven changed
source/test files are pinned in [source hashes](source-manifest.json), verified
with zero mismatches. [Validation summary](validation.json) records the limits.

Representative deterministic cases:

| Input and current state | Observed assertion |
| --- | --- |
| "Please review the mission." with the exact session and consenting guest floor in an admitted bridge fixture | HTTP 200 with the same session/thread handoff; no answer claim |
| "This late speech must not become the host's." after floor release | HTTP 409, exact speaker-authority error, no additional stored handoff |
| Materialized room transcript whose provider session is absent | Codex provider rejects with status 409 and the handoff-authority code before model invocation |
| Captured guest context followed by bridge demotion | Guest authority rejected; an explicitly claimed host floor remains usable |

The bridge fixture exercises the registry and callers, not real peer audio.

Patch classification is source admission / tool admission. Whole-file static
classification flags the existing large Codex provider's terminal machinery;
the patch only awaits the authority check and rejects before model invocation.
Casimir verification does not apply: no physics, connector protocol, release
verifier, certificate or proof claim changed. The server build is not a
TypeScript type-check; the previous full-repository type-check exhausted the
default heap and has not been promoted to PASS.

## Remaining goal work

The selected external-task binding epoch, explicit mission/revision envelope,
durable pickup checks and authenticated decision return are still open. The
existing steering queue provides submitted/acknowledged states; those are not
an answer or evidence of completed reasoning. Do not expose a new dispatch
path until its current-consent and durable-consumption checks are connected.

The initial room still supports two humans. No installed EXE, domain/Replit,
live OpenAI session, three-human room, native effect or public launch was tested
by this patch. No offer, billing policy or deployment changed.

Floor attribution is not acoustic speaker verification. Overlap and delayed
transcripts after a floor switch remain live-acceptance cases. Rechecking a
captured participant does not authenticate previously unattributed audio or
retroactively withdraw data already sent to a provider.
