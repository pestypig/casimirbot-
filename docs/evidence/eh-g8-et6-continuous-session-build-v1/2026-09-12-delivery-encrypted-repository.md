# Encrypted invitation delivery repository

O3/O5 prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: evidence normalization and persistence; no host dispatch enabled.

Added migration 091 and registered its table in the existing local snapshot set.
The separate delivery repository uses the existing vault interface and binds
ciphertext to owner, delivery identity and revision. It enforces one row per
owner/pairing, preserves the winning row on insert replay, and uses SQL revision
CAS for pending-to-unknown and unknown-to-delivered transitions. Immutable
identity/creation fields and forward transition/time checks precede writes.
Flush occurs on successful and conflicting writes; an explicit durability
barrier supports reconciliation after an unknown flush outcome.

Nine focused contract/repository tests pass. Repository tests use actual migrations,
pg-mem, real AES-GCM with ephemeral fixture keys, and the real pairing repository
for the parent row. They cover competing insert/CAS calls, reconstruction over
retained DB state, lost flush reply, replay preserving unknown state, owner read
isolation, identity rewrite/backward-transition rejection and wrong-key failure.
Provider message identity is absent from stored plaintext. No native key is used.

The existing independent-process steering recovery test also passes with the new
migration registered. This verifies no regression in that steering scenario; it
does not prove delivery rows survive a native process restart because it does not
insert one. Actual Postgres concurrency, mid-write crash and power loss remain
unverified. The repository is an internal storage primitive, not authentication.

No service factory, provider worker or public route invokes this repository yet.
The issuance-to-outbox crash gap and real-handler lost-provider-reply fixture
remain next work. No build/restart or production consent occurred. Full O1–O6,
CS1–CS4, CS5 completion and original ET6 acceptance remain outstanding.
