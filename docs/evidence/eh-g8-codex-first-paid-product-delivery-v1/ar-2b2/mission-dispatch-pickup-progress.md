# AR-2B2 mission dispatch and pickup progress — 2026-09-24

The authenticated browser route `/session/agent-connections/room-missions/dispatch-handoff`
is an explicit owner action. It reads the server-retained Realtime handoff and
private captured speaker, compares the exact transcript hash/length, checks
the owner's live room membership, current Realtime session and speaker consent,
then resolves the owner-selected mission's exact task. Ordinary transcript
finalization alone does not dispatch to that external task.

The steering queue now retains a private room/mission/handoff/consent/task
envelope. The durable pairing path encrypts it in the existing steering row and
includes it in the immutable request digest. The public event projection omits
the envelope. At the MCP task read and acknowledgement path, both the
in-memory and durable queue access recheck the exact task association, current
mission revision and captured speaker consent before releasing text or
acknowledging. A revoked mission or consent fails closed. The route receipt
does not claim provider pickup, answer or terminal authority.

The focused four-file run passed **65/65** tests: real owner HTTP dispatch,
changed-text and guest denial, empty queue before affirmative dispatch,
in-memory pickup/ack refusal after consent and mission revocation, encrypted
durable envelope persistence and refusal after revoke, and old personal
steering behavior. `npm run build:server`, the environment-harness docs audit,
and the Helix Ask discipline quick check passed. The build retains four
unrelated duplicate-key/case warnings; the discipline check reports existing
provider-file warnings. A scoped TypeScript program over the changed route,
steering code and voice test reported **0 diagnostics in those files**. The
whole-repository `tsc --noEmit` is not green: the first run exceeded Node's
4 GB heap, and the 8 GB retry emitted extensive errors across unrelated
desktop, CLI and tool files. The scoped result does not claim repository-wide
type safety. No paid provider call was made.

This is a deterministic component result. It does not prove an installed EXE
or domain route, a live external Codex task receiving the instruction, or a
task-authenticated decision return. The only correlated response today is a
steering acknowledgement, which remains receipt evidence and cannot become a
room answer. Full AR-2 and the selected no-model paid offer remain unchanged.
Current task reads fail closed on a revoked room event; a long queue containing
such events still needs a safe skip/tombstone policy to let later unrelated
steering advance without releasing revoked text.
