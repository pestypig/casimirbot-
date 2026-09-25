# AR-2B2 revoked room steering queue progress — 2026-09-24

The exact MCP task read now emits a cursor-bearing `revoked` marker with an
empty `instruction_text` and `room_mission_suppressed_not_instruction` role
when a room-linked event's selected mission or captured speaker consent is no
longer current. It only suppresses the two typed revocation outcomes; a task
identity mismatch, storage failure or other error still fails the read. The
original event is not acknowledged, and the task's acknowledgement and result
submission continue to reject the revoked authority. The marker allows a
later valid event to be read in the same page or after that cursor.

The in-memory owner HTTP dispatch fixture and the encrypted durable steering
fixture both verify revocation, absence of instruction text, later ordinary
steering, and cursor advancement. The five-file room/steering/result suite
passed 66/66. `npm run build:server`, `npm run
helix:ask:discipline:quick`, the environment-harness docs audit, and
`git diff --check` passed. The build retained four warnings in unrelated
files. No paid provider call was made.

This is task pickup liveness, not a room terminal answer. The marker retains
the event's existing cursor and metadata; it never reauthorizes the room event.
Installed/runtime and live multi-member acceptance remain unverified.
