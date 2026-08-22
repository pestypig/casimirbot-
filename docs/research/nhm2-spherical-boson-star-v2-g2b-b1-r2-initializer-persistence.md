# NHM2 spherical-boson-star v2 G2B-B1-R2 initializer persistence

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: exact-byte initializer reproduction and persistence  
Current maturity: B1-R1 in-memory payload PASS; no initializer instance  
Target maturity: exclusively persisted and rehashed authority-neutral initializer instance  
Required frozen inputs: B1-R1 packet/source/result and six expected payload hashes  
Required evidence: exact reproduction, exclusive write, readback, persistence receipt  
Stop/fail criteria: existing output root or first source/hash/write/readback mismatch  
Explicit non-goals: numerical-policy change, candidate solve, replay independence or authority  
Downstream gate unlocked: integrated four-grid execution packet

## Authorization and fixed output

This packet authorizes exactly one reproduction of the sealed B1-R1
materializer and one exclusive persistence attempt at:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b1-r1-initializer-v1/
```

The root must not exist before the attempt. Existing, partial, symlinked, or
unexpected output is terminal evidence; it must not be deleted or overwritten
within this packet.

## Frozen expected result

| Ordinal | Path | SHA-256 | Bytes |
| ---: | --- | --- | ---: |
| 0 | `scalars.f64le` | `da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1` | 72 |
| 1 | `coefficients/core_L2_u.f64le` | `0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb` | 1,024 |
| 2 | `coefficients/core_L2_V.f64le` | `ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c` | 1,024 |
| 3 | `coefficients/tail_H.f64le` | `5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1` | 256 |
| 4 | `coefficients/tail_Q.f64le` | `5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1` | 256 |
| 5 | `initializer/core_L2_join_barrier.f64le` | `23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9` | 32 |

Expected aggregate payload size: `2,664`.  
Expected materialization receipt self hash:
`5d8d66da56daf03d530cd9e3ddcb618549b39a883ebca0c16140fd471451781a`.

Frozen predecessor bindings:

- B1-R1 source `b96124285781c00a9f884fb162591c5f7bc6817081e6ddd74e2e41cab5ca3e1e` / 14,481.
- B1-R1 result record `ead2c8f0a02a009a0657fe45a716aeb1ebbd49e35a5e14fb92eb7d4c8b7fd97c` / 3,076.

## Chronology

1. Rehash the packet, B1-R1 source and B1-R1 result record.
2. Require the output root to be absent and its parent to be an ordinary
   directory inside the repository artifact boundary.
3. Invoke B1-R1 once and require its status, receipt self hash, inventory,
   sizes and six raw hashes to equal the frozen result above.
4. Create the output root and exact `coefficients` and `initializer`
   subdirectories exclusively.
5. Write every payload using exclusive creation, flush and `fsync`.
6. Write the canonical materialization `receipt.json` exclusively.
7. Reopen and rehash every payload and `receipt.json`.
8. Write a canonical length-delimited self-hashed `persistence-receipt.json`
   last, recording the successful readback.

No caller-controlled path, provider, payload, hash, runtime, callback or
receipt is accepted. The persisted bytes are an authority-neutral initializer
instance only. Runtime-disjoint replay, candidate execution, proof acceptance,
lamps and physical claims remain false.
