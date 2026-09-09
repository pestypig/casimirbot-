Program gate: G8
Workstream: CS1/CS4 ordinary packaged session recovery
Capability or component: Native-backed encrypted profile snapshots
Lifecycle stage: evidence normalization
Reaction timescale: backup and application restart
Authority owner: authenticated profile storage policy and existing native credential broker
Current maturity: specified
Target maturity: deterministically verified
Required evidence: packaged configuration reproduction, encrypted backup/restore, profile isolation, failure rejection and later EXE rehearsal
Explicit non-goals: no quota increase, plaintext fallback, restored binding authority or ET6 promotion
Downstream gate unlocked: none

The previous EXE restart left only a newly created empty local chat visible.
The local database snapshot contains zero `helix_account_profile_storage`
rows, and the packaged service reports repeated profile-snapshot POST 413s.
These observations do not establish quota exhaustion: the route maps every
failed write receipt, including encryption failure, to 413.

Source inspection identified a packaged configuration gap. The host constructs
an allowlisted service environment with the native credential broker but no
`HELIX_PROFILE_STORAGE_ENCRYPTION_KEY`. Profile storage ignored the native
broker and required that separate key in production. A focused test reproduced
failure to save even a small empty-chat snapshot under production settings
with a real native broker and no profile master key. This is deterministic
configuration reproduction; the running process's secret environment was not
read or printed.

Classification: evidence normalization / profile persistence. Profile storage
now uses the existing authenticated native broker to wrap a random per-snapshot
AES-256-GCM key. The profile ID and format purpose are authenticated data for
both wrapped key and snapshot. Only the small per-snapshot key crosses the
broker, preserving its request-size limit; existing profile quotas still govern
snapshot size. The protected master key stays in the native host. Partial or
invalid broker configuration fails closed. Legacy explicitly keyed and local
development snapshots retain their previous encryption path.

The database retains encrypted content and blank entry-value metadata. The
new native envelope is versioned separately from legacy snapshots. Reading a
native envelope requires the broker and authenticates the requested profile;
it cannot fall back to a development key.

Focused tests: **14/14 passed** across native profile storage (2), existing
profile storage (2), and renderer profile synchronization (10). Tests cover:

- Exact empty-chat identity and content round-trip through actual HTTP broker
  and pg-mem profile store, with blank plaintext entry metadata.
- A snapshot larger than the broker's request limit, wrapped through the small
  key request, followed by broker restart and supported retired-key rotation.
- Foreign-profile decryption, modified ciphertext, invalid broker token and
  missing broker rejection.
- Existing configured quota rejection and profile restore/sync behavior.

The renderer suite initially failed one pre-existing byte-format expectation:
the chat store already normalizes token/message counters and adds an empty
binding map during restore. Its assertion now verifies the complete normalized
saved state, preserving all expected original identity and message content.
No renderer production behavior changed in this patch.

This repair is not yet loaded in the running EXE. It cannot retrospectively
reconstruct the old local chat from an absent profile snapshot. The old chat's
origin-scoped browser storage has not been deleted or copied. Safe ordinary
local-chat recovery and a subsequent packaged backup/restart rehearsal remain
required. No binding consent was synthesized and no old active binding was
restored as authority. CS1–CS4 remain incomplete, CS5 is not complete, ET6 remains
unpassed, and NAV1 remains gated.
