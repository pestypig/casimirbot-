# G2H-E-S5 A4 C08-003 Endpoint-Functional Producer Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-003 endpoint functional and terminal Banach-tail image
Current maturity: candidate-neutral implemented and independently fixture-audited
Target maturity: complete C08-003 slice inside the still-incomplete C08 producer
Required frozen inputs: acknowledged Borel growth/quadrature definition; C08-001 identity; frozen 64/96/128/256 state layout; 512-bit directed arithmetic
Required evidence: positive/vacuum manufactured fixtures; corruption, tail-bound, touching-zero, predecessor and root guards; deterministic pinned-runtime replay
Stop/fail criteria: wrong endpoint range, missing/nonfinite coefficient or tail image, tail radius beyond the order-8 norm, nonpositive endpoint, selected-member access, protected-root creation, or authority promotion
Explicit non-goals: C08-004 through C08-015 and C08-021; C08 handler integration; candidate evaluation/execution; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: continued candidate-neutral A4 work at C08-004; A5 remains locked

Date: August 24, 2026

## Decision

`PASS_CANDIDATE_NEUTRAL_IMPLEMENTATION_ONLY`

C08-003 now implements the acknowledged endpoint observable exactly for
manufactured inputs. For either chart and every frozen grid size it sums the
finite `tail_H` or `tail_Hbar` coefficient block at flat indices
`[6*N,7*N)`, adds the centered terminal Banach-tail endpoint image, and
requires the resulting `h0` ball to have a strictly positive lower endpoint.
The producer records the finite gradient of ones, exact-zero finite Hessian,
internal parameter derivative of one, and the infinite-tail operator-norm
contribution of one.

This is not a selected-member evaluation or a scientific proof result. The
fixture supplies only manufactured state storage; values outside the endpoint
block are indeterminate and remain unread.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_endpoint_v1.hpp` | `48b64bf3305e9eb368b4af570a20c8d518e52c600f36e31d1385779dbee3a175` |
| `mini_boson_star_primary_c08_endpoint_v1.cpp` | `b4f741e60e7c9660edb777e8297482843cd83a17dd0020380086d8ae3209994f` |
| `mini_boson_star_primary_c08_endpoint_fixture_v1.cpp` | `f1f0bccc765ca0363a937a8e733ab698f0c1d7493ea6bfa512364b349fb78317` |
| `Dockerfile.primary.mini-boson-c08-endpoint-fixture.v1` | `b434ceef9c97ec019f6ac7da800875fe67a60209b85a3c6c2a8dc9fa2869bc03` |
| `nhm2_g2h_e_s5_c08_endpoint_runtime_audit.py` | `c0e92672c85918c156da883d9188286e12d9e2b9ae10a64188144214a4505f0c` |
| fixture executable | `3d4eb5be5a643db02e091312c98b0cbee3885d56cf68bebddb17c2574a78252b` |

The fixture image is built from the already digest-pinned S4 builder and
runtime bases. Two independent rebuilds produced local image IDs
`sha256:94559054ef5b5906cb1f6ef213931e547f79f8876e49f0a60a66cfc3590e5c3b`
and
`sha256:6ce7cb7cd38959f6338a80273712aa1097074aa0630b544eae43ab4f9654f321`;
the fixture executable remained exactly
`3d4eb5be5a643db02e091312c98b0cbee3885d56cf68bebddb17c2574a78252b`.
The local fixture-image IDs are non-frozen build evidence, not an S5-E final
runtime seal; S5-E must separately bind the final runtime image.

## Evidence

- Endpoint fixture: `25/25 PASS`.
- Independent source/runtime audit: `41/41 PASS`.
- Parent exact definition audit: `64/64 PASS`.
- Parent cross-language replay: `27/27 PASS`.
- Exact parent acknowledgement gate: `ACKNOWLEDGEMENT_VALID`.
- Two isolated, offline, read-only fixture executions produced identical JSON.
- Maximum manufactured endpoint-coefficient reads: exactly `256`.
- Candidate evaluations: `0`.
- Positive parameter samples: `0`.
- Candidate roots, execution root, token, authorization and ledgers: absent.
- Scientific handler linked: `false`.
- Candidate, proof, geometry/state, lane, lamp, physical, propulsion and
  transport authority: `false`.

## Remaining boundary

C08-004 through C08-015 and C08-021 remain absent. The existing separately
audited C08-016 through C08-020 flat-remainder slice remains isolated. The C08
scientific handler is not linked, the dispatch matrix remains `0/19`, and no
instantiated selected-box witness or candidate summability proof exists.

## Current-head global verification

- Math report and stage validation: `323` entries, `PASS`.
- Required WARP battery: `18/18` files and `179/179` tests, `PASS`.
- Adapter run: `3`.
- Adapter verdict/status: `PASS/GREEN`.
- First failing hard constraint: `null`; fail reason `NONE`.
- Deltas: `[]`.
- Certificate SHA-256:
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.
- Certificate integrity: `true`.

These repository gates verify the current implementation/preflight surface.
They do not authorize a candidate run or promote any scientific or physical
claim.
