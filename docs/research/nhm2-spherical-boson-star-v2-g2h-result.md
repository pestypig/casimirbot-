Program gate: G2H — Tolman-VII proof implementation/preexecution
Workstream: authenticated classical and quantum control branch
Capability or component: two guarded source/runtime-disjoint proof images and inert G2H-E checkpoint
Current maturity: independently audited implementation `PASS`; candidate unexecuted
Target maturity: G2H closure with G2H-E eligible only for a separate explicit authorization decision
Required frozen inputs: G2G contract SHA-256 30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d and seven source digests
Required evidence: fixture receipts, final source/toolchain/image/executable binding, disjointness audit, inert proposal and current verification certificate
Stop/fail criteria: digest drift, candidate-root creation, candidate invocation, omitted first-failure record, shared forbidden runtime or authority promotion
Explicit non-goals: G2H-E execution, candidate proof/admission, G3, SI, 68-file lanes, lamp or physical claims
Downstream gate unlocked: G2H-E explicit one-shot authorization decision only

# G2H result: implementation closed without candidate execution

## Decision

`PASS_IMPLEMENTATION_PREEXECUTION_ONLY`.

G2H is closed. This decision establishes that two guarded proof programs and
their no-candidate evidence are present, byte-bound and independently audited.
It does not establish any classical or quantum proof duty and it does not
authorize G2H-E.

## Bound implementation evidence

| Evidence | Result |
| --- | --- |
| Current G2G contract | `30de966d...343d` |
| Historical superseded contract | `eaf9dac1...b433`, historical only |
| Scientific inputs | 7 PDFs, 3,578,561 bytes, composite `68d6e804...f3f3c` |
| Primary image | `sha256:d074caaa...03ae92` |
| Primary executable | 34,792 bytes, `3345e451...47128` |
| Independent image | `sha256:03102ead...dbb427`, one-layer scratch |
| Independent executable | 4,221,232 bytes, `c6f9c86d...1c6a87` |
| Final build binding | `37738d32...362a` |
| Build/disjointness/guard audit | 26/26 `PASS` |

The primary is C17 and uses the frozen FLINT/Arb/GMP/MPFR lineage. The
independent program is safe Rust targeting static musl; its final ELF has no
interpreter, no `DT_NEEDED` dependency and no primary arithmetic runtime marker.
The primary image extends the exact frozen fixture ancestry; the independent
runtime is a disjoint one-payload-layer scratch image.

Both programs rehash the contract, seven sources, authorization record and own
executable, enforce exact token and argument grammars, enforce exclusive output
roots, persist the fixed first-failure chronology and serialize all 18 duty IDs.
If the mandatory analytic-germ surface gate fails, every later duty receives an
explicit `INELIGIBLE_AFTER_FIRST_FAIL` record. No missing record can be read as
a pass.

## Fixture chronology

The v1 exact-layer fixture failure is immutable. The v2 repair is preserved as
a compile-time FLINT 2.9 API failure. The versioned v3 repair uses canonical
numerator/denominator rational identity and Arb containment rather than asking
an inexact enclosure to equal `1/5` exactly.

- primary synthetic fixtures: 7/7;
- independent synthetic fixtures: 7/7;
- immutable fixture manifest self-hash: `979cad4d...7c13`;
- producer-independent receipt audit: 13/13.

Only the synthetic fixture root exists. Both candidate evidence roots remain
absent and candidate evaluations remain zero.

## Inert G2H-E proposal

Proposal `bab85c21...b46e` freezes checkpoint `531fe27b...4e61`, raw token
`797cafb7...9ac7`, token hash `33524fdf...960a`, image identities, exact primary
then independent commands, authorization paths, output roots and create-new
invocation/log/result semantics. Proposal audit passes 14/14.

The token authorizes nothing by itself. The primary command is unavailable
until an exact seven-line `AUTHORIZED` record is separately issued. The
independent command is unavailable until primary completion and a new exact
eight-line authorization record binds the observed immutable primary manifest.
Any invocation marker, fixed-name container, root, `PASS`, `FAIL` or partial
output forbids retry, retune, deletion and alternate roots.

## Current-tree verification

Verification receipt SHA-256: `b71d32ca...aef42`.

- math stage: 318 entries, validation `PASS`;
- WARP: 18/18 files, 179/179 tests `PASS`;
- Casimir adapter: run 2461, verdict `PASS`, status `GREEN`;
- certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: `true`.

## Claim boundary

Candidate execution, candidate admission, every G2G proof duty, joint
geometry/state acceptance, SI execution, both 68-file lanes, replay agreement,
the diagnostic lamp, physical viability, propulsion and transport authority
all remain false. The sole active next gate is G2H-E's explicit authorization
decision; no execution is implied by G2H closure.
