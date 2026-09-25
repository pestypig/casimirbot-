# AR-2B2 owner result intake progress — 2026-09-24

The authenticated `POST /api/account/session/agent-connections/room-missions/result-source`
caller takes an exact room mission ID/revision and steering event reference. It
requires an active owner account link and present owner membership, checks the
current mission before and after the server-only encrypted result evidence
read, and returns only a nonterminal source receipt. It does not return result
text, initiate Ask, publish to the room, or share the owner's Codex account.

The real owner HTTP dispatch fixture exercises this route after the exact task
acknowledges steering and submits the result. It denies an unsigned caller,
guest caller, wrong room, wrong mission revision, missing result, revoked
speaker consent and revoked mission. The focused voice handoff suite passed
23/23; the server build, Ask discipline quick check, environment-harness docs
audit and diff whitespace check passed. The build retained four unrelated
duplicate-key/case warnings. No paid provider call was made.

This is owner source inspection only. A guest does not gain access to the
private task result. Member-authorized evidence re-entry into a room Ask turn,
the completed solver/route-product gate, room publication, installed/domain
verification and live multi-member acceptance remain open.
