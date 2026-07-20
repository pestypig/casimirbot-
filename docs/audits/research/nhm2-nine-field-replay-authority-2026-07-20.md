# NHM2 Nine-Field Replay Authority (2026-07-20)

## Verdict

The nine-field comparison surface is frozen, but no production path currently
has authority to clear the independent-replay blockers. The existing
`nhm2_independent_numerical_replication/v1` artifact remains producer-authored
diagnostic metadata. It must not be made conditionally authoritative by adding
a caller-supplied receipt or by deleting its four server-replay blockers.

NHM2 physical viability, transport, propulsion, route ETA, and certified-speed
claims remain false.

## Frozen comparison surface

The replay covers exactly nine ordered field families and 50 component streams:

1. full apparatus symmetric source tensor (10 components);
2. renormalized semiclassical tensor (10);
3. covariant-conservation divergence vector (4);
4. continuous-observer minimum energy density (1);
5. sampled QEI bound and margin (3);
6. constraint, backreaction, stability, and causality outputs (7);
7. finite-temperature finite-geometry traction and force gradient (4);
8. mechanical displacement, stress, fatigue, pull-in, and control energy (5);
9. six preregistered falsifiable observables (6).

All arrays must be raw little-endian IEEE-754 binary64, rank two, row-major,
finite, exactly sized, and bound to the frozen component order and units.

For field `f`, component `c`, primary values `P`, and independent values `I`,
the current primary-reference metric is:

```text
S_fc = max(Z_fc, max_i abs(P_fic))
D_fc = max_i abs(I_fic - P_fic)
R_fc = D_fc / S_fc
R_f  = max_c R_fc
R    = max_f R_f
```

Every field must satisfy `R_f <= 0.1`. There is no averaging, uncertainty
subtraction, or omitted outlier. A deterministic tie uses the lowest row
ordinal and then frozen component order.

When finite `D_fc / S_fc` overflows binary64, the kernel records
`ratioOverflowed: true`, saturates the reported diagnostic value at
`Number.MAX_VALUE`, and returns a numerical failure. Overflow therefore cannot
turn a real zero-reference mismatch into `not_ready` or a pass.

## False-pass hazards closed in this checkpoint

- Producer-selectable `Z_fc` values could manufacture agreement by inflating
  the denominator. The manifest now requires `Number.MIN_VALUE`, the least
  positive binary64 value, as a non-tunable technical divide-by-zero guard.
  This is not a physical scale.
- A synthetic domain shared by grid, mode, observer, worldline, surface, FEA,
  and observable families could conceal semantic mismatch. The manifest now
  requires nine field-specific domain bindings.

These restrictions are intentionally conservative. A future physically
derived absolute-error policy may supersede the technical floor only through a
new pre-run candidate contract and immutable semantic hash.

## Replay-foundation hardening in this checkpoint

- The bounded reader enforces a local, absolute, non-root run directory; exact
  recursive inventory; portable and case-fold-safe paths; regular single-link
  files; POSIX no-follow/nonblocking opens; exact size and SHA-256; double
  replay; unchanged filesystem identity; and finite little-endian float64
  scanning.
- Reader metadata is frozen, retained memory is capped, and mutable returned
  byte buffers are explicitly non-authoritative. Any downstream authority path
  must recompute their hashes at consumption.
- The metric kernel accepts only its in-process immutable policy, recomputes
  both array hashes synchronously, rejects shared-memory buffers, requires
  equal primary and independent ordered-row hashes, canonicalizes signed zero,
  and keeps every theory and physical claim false.
- The replay-receipt schema is deliberately authority-neutral. Structural
  validation cannot prove server origin, filesystem readback, numerical
  agreement, theory closure, or physical viability.

## Required authority chain

1. A server-owned primary projector must reopen verified primitive outputs,
   execute all nine declared operators, and publish arrays, uncertainty arrays,
   ordered domains, and its manifest last.
2. The independent preseal must enumerate the field manifest and every sidecar
   before process launch. Post-run manifest-selected paths are forbidden.
3. A secure reader must enforce path containment, no aliases or links, exact
   inventory, bounded handle reads, unchanged file identity, exact hashes and
   sizes, and finite little-endian decoding.
4. A server-owned replay kernel must recompute every component and field metric
   from the verified bytes.
5. The replay receipt must be written outside producer authority and rebuilt
   from filesystem bytes by the closure evaluator. Receipt status is never
   trusted by itself.

## Blocker mapping

The existing blockers clear independently:

- `server_owned_float64_array_readback_recomputation_receipt_missing` only
  after an immutable receipt equals the evaluator rebuild;
- `server_replay_primary_comparison_projection_manifest_binding_missing` only
  after the primary operator replay and its transitive inventory are verified;
- `server_replay_independent_field_array_manifest_binding_missing` only after
  the exact presealed independent manifest and sidecars are verified;
- `server_replay_all_nine_field_comparisons_not_recomputed` only after exactly
  nine unique ordered fields and all 50 component streams are recomputed.

A complete, well-bound replay above tolerance is a numerical failure. Missing,
malformed, stale, aliased, mutable, or unbound evidence remains `not_ready`.
Even a passing numerical replay is only one prerequisite for theory closure and
does not establish an experimental or physical mechanism.

## Current production frontier

The primary projection finalizer is still assessment-only and emits no arrays.
The independent external executor still admits three opaque output roles, so
typed manifest sidecars cannot yet enter its exact inventory. The current
checkpoint therefore implements prerequisites without opening a production
passing branch.

The current primary raw/projection v1 policies also do not encode enough
executable layout information to derive all nine outputs honestly. Missing
facts include mode offsets, stencil and boundary maps, surface/mode indexing,
mechanical constitutive and node data, executable dynamics formulas, and
observable normalization. A server projector must therefore remain
`not_ready` until a versioned operator policy supplies those facts.

The next safe implementation milestone is:

1. a pre-run independent inventory of exactly 29 typed outputs: one field
   manifest, nine arrays, nine field-specific domains, nine per-field
   derivation bundles, and one frozen relative-L-infinity policy artifact;
2. explicit reference scopes for verified-primary, sealed-input, and
   independent-output paths;
3. a primary raw/projection v2 operator contract followed by a manifest-last
   server projector; and
4. a server replay service that rebuilds its receipt from both exact
   inventories before any closure blocker can clear.

## Verification evidence

- New manifest/reader/kernel/receipt suites: 152/152 tests passed.
- Adjacent projection, independent-replay, and closure suites: 83/83 tests
  passed.
- Scoped strict TypeScript, ESLint, Prettier, and `git diff --check`: passed.
- Math-stage registry: 186 entries, validation passed.
- Repository atlas rebuild: passed.
- Required WARP battery: 18/18 files, 179/179 tests passed.
- Physics root-to-leaf manifest validation: passed.
- Lean: 7 jobs built; `nhm2_pre_experimental_claim_locks` reports no axioms.
- Live Casimir adapter run `2283`: PASS, certificate SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity OK.

The live adapter result verifies the governed repository constraint pack and
certificate integrity. It is not an NHM2 physical-solve result and does not
alter any blocked NHM2 claim.
