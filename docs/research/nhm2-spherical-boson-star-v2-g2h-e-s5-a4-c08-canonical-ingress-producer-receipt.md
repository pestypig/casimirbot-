Program gate: G2H-E-S5 / A4
Workstream: authenticated classical and quantum control branch
Capability or component: acknowledged candidate-neutral C08-002 bounded canonical JSON/hash ingress
Current maturity: isolated primary implementation PASS; not handler-wired or candidate-instantiated
Target maturity: source-bound C08-002 producer suitable for continued C08 integration
Required frozen inputs: proposal `efbff4c1...efc48`; acknowledgement decision `ec623997...9280`; Borel contract `7dd4d30a...94737`; canonical identity `665b6d9d...7f520`
Required evidence: source identity; pinned offline Linux build; exact contract, boundary, corruption, Unicode and number fixtures; independent runtime audit; protected-root absence
Stop/fail criteria: unbounded allocation/recursion, canonical mismatch, selected-member or state ingress, positive sampling, root/token creation, chronology drift, or authority promotion
Explicit non-goals: C08-003 through C08-021; handler/record integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; any authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-003; A5 remains locked

# G2H-E-S5 A4 C08 canonical-ingress producer receipt

## Verdict

`PASS_CANDIDATE_NEUTRAL_PRIMARY_SUBCOMPONENT_ONLY`

This receipt closes only the isolated C08-002 canonical-ingress/hash module.
It does not close A4, implement the C08 scientific handler or authorize any
selected-member byte to be evaluated.

## Acknowledgement binding

The independently supplied exact statement is stored at SHA-256
`92ca4c820f879946911e111ca8e7f6c0524947a7e6bab6efa70183850cba53c1`.
Decision
`ec623997e0f84c05e3d60d66b7609882706b15c4f3643ac7b429f071516e9280`
passes the read-only gate as `ACKNOWLEDGEMENT_VALID` with candidate execution
authority false. It grants candidate-neutral implementation eligibility only.

## Bound implementation

| Role | SHA-256 |
| --- | --- |
| Header | `16a11dd810612a831649a5ae057011dc4ef4c864936fa80fc04aad358f8f2946` |
| Implementation | `380998de8d51289c06579b4dd4a730a73966db1d6c91427c048d8e498a0014ee` |
| Fixture entrypoint | `1889db7b2cf7bde99ec145856ba6f7883438b698e9e50c03af303ba9793bdeae` |
| Dockerfile | `e2944936a6cd7d5e50f26537a84f73e105836c170f0df7b597e834e8f58a7ce4` |
| Runtime audit | `c3170ce951c3b1847cab9ad39295d2dda966071be082c376c4a73d905f3d1f87` |
| Local audit image ID | `sha256:7a3adf9021a83a6c2af2f2186b6c637ca345bbb4bf5787e437d09927cedcf5b7` |
| Fixture executable | `7f7be65aca7ea82d7d78573216be094dd27e7d33ff68ab3738b1aa335edb21c4` |

The local image ID is recorded build evidence, not a frozen future checkpoint
runtime. The executable is reproducible across the observed rebuilds. S5-E
must separately bind the final checkpoint image and executable.

## Implemented semantics

- enforces 65,536-byte raw/canonical ceilings, depth 8, 1,024 value nodes,
  64 object members or array elements, 1,024-byte strings, 128-byte keys,
  65,536 cumulative decoded-string bytes and 64-byte number lexemes before
  allocation growth;
- rejects BOM, invalid UTF-8, malformed escapes, every unpaired surrogate,
  direct/escaped duplicate keys, empty/non-printable-ASCII contract keys,
  unsafe syntactic integers, nonfinite binary64 numbers and trailing values;
- canonicalizes printable-ASCII-key objects in UTF-16-equivalent order, uses
  minimal string escaping and ECMAScript shortest-number thresholds, including
  negative zero and finite underflow;
- reproduces the exact 54,972-byte Borel raw hash and the 49,780-byte
  domain-separated canonical hash `665b6d9d...7f520`;
- performs no file I/O, state-coefficient access, Arb scientific operation,
  positive sampling, output persistence or authority mutation.

## Fixture and audit evidence

The isolated digest-pinned Linux fixture passes 40/40 cases. Coverage includes
the exact contract, raw/canonical identities and measured footprint; byte,
depth, node, member, element, string, key, cumulative-string and number limits;
BOM/UTF-8/surrogate/duplicate/key corruption; raw mutation; JCS ordering,
escaping and number thresholds; safe underflow; null API rejection; and typed
failure identity.

The separate source/runtime audit passes 36/36. It verifies acknowledged
implementation eligibility, all exact source and definition hashes, fixed
resource constants, digest-pinned offline bases, two deterministic 40/40
invocations, executable identity, 32/32 exact-definition audit, 30/30
cross-language replay and protected-root absence before and after.

Candidate evaluations and positive samples remain zero. Both candidate roots,
the authorization token and execution-ledger directory remain absent. The
scientific handler is unlinked and every authority is false.

## Current-head verification

Math-stage validation reports 323 valid entries. All 17 files currently
required by `WARP_AGENTS.md` pass 175/175 tests. The explicit adapter invocation
returns run `2`, `PASS/GREEN`, `firstFail=null`, no deltas, and certificate
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
with integrity `true`. This verifies repository gate integrity only; it does
not establish a candidate proof or any physical claim.

## Remaining A4 work

C08-001 and C08-002 now have isolated candidate-neutral implementations;
C08-016 through C08-020 retain their earlier isolated flat-remainder evidence.
C08-003 through C08-015, C08-021 and the scientific handler remain absent. A4
therefore stays active and A5 remains ineligible.
