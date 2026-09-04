Program gate: G2H-E-S5-A4 — candidate-neutral H2 continuation diagnosis
Workstream: P8P observer-progress turnaround calibration
Capability or component: P8P-R22 local gcloud checksum result
Current maturity: one official x64 package downloaded but frozen checksum belonged to x86 package
Target maturity: immutable first-failure evidence and corrected reuse-only successor
Required frozen inputs: R22 packet SHA-256 689f654dde9b6afde5ddbf07cb118ebe9ef153be0070f1e68830a498c0a4c4b9 and preserved downloaded archive
Required evidence: exact byte count, ZIP signature, observed SHA-256, current official x64 and x86 table bindings, zero extraction/authentication/cloud action
Stop/fail criteria: checksum mismatch is terminal and consumes R22; preserve archive, no deletion, extraction, retry or second download
Explicit non-goals: install, login, credential creation, Compute Engine action, upload, calculation, candidate evaluation, retuning, deletion or authority promotion
Downstream gate unlocked: separately frozen reuse-only x64 checksum correction; P8Q remains stopped

# H2-P8P-R22 checksum-misbinding result

Status date: September 3, 2026.

Status: **BLOCKED_PREEXECUTION_FROZEN_CHECKSUM_BOUND_TO_X86 / R22 EXHAUSTED**.

R22 was explicitly authorized under packet SHA-256
`689f654dde9b6afde5ddbf07cb118ebe9ef153be0070f1e68830a498c0a4c4b9`.
Its packet audit passed 18/18. The exact official URL was downloaded exactly
once to the exact R22 archive path.

Preserved local evidence:

- bytes: `101597540`
- leading 16 bytes: `504b0304140000000000000021000000` (ZIP local-file signature)
- SHA-256: `25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768`
- creation UTC: `2026-09-03T12:22:57.0027288Z`

Google's current versioned-archive table, last updated September 1, 2026,
binds the Windows x64 bundled-Python 583.0.0 package at 101.6 MB to observed
SHA-256 `25fe2511...92d768`. It binds the 98.8 MB x86 bundled-Python package to
R22's frozen expected SHA-256 `2394aa3f...1a155`. R22 therefore contained a
platform-row checksum misbinding; the downloaded x64 object matches Google's
current authoritative x64 row.

Source: <https://docs.cloud.google.com/sdk/docs/downloads-versioned-archives>

R22 stopped immediately on the frozen mismatch. No extraction, executable
launch, browser authentication or credential storage occurred. No Compute
Engine API call, upload, VM/disk/resource action, Docker action, build or
numerical process occurred. The downloaded archive is preserved in place; no
retry, second download, deletion or fallback occurred.

Candidate evaluations and positive samples remain zero. Candidate/scientific
roots, tokens and handler linkage remain absent. Candidate, proof,
geometry/state, lane, lamp, physical, propulsion and transport authority remain
false. Only `P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED` applies.
