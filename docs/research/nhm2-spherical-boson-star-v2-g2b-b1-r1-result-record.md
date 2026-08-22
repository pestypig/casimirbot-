# NHM2 spherical-boson-star v2 G2B-B1-R1 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: repaired initializer origin-representation admission  
Current maturity: immutable first in-memory B1-R1 result  
Target maturity: authenticated deterministic payload evidence  
Required frozen inputs: B1 failure/source and B1-R1 diagnosis/source  
Required evidence: exact six-payload hashes, repaired barrier and authority locks  
Stop/fail criteria: preserve first result without retry or persistence  
Explicit non-goals: candidate solve, payload publication, retune or authority  
Downstream gate unlocked: B1-R2 independent reproduction and exclusive persistence

## Result

`PASS` for the narrowly repaired initializer representation boundary.

The sole B1-R1 invocation preserved the B1 failure, reproduced its exact origin
deviation, required the terminal RNDN word `000000000000f03f`, and then
materialized the complete six-payload inventory in memory. No candidate solve
or filesystem output occurred.

| Ordinal | Payload | SHA-256 | Bytes |
| ---: | --- | --- | ---: |
| 0 | `scalars.f64le` | `da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1` | 72 |
| 1 | `coefficients/core_L2_u.f64le` | `0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb` | 1,024 |
| 2 | `coefficients/core_L2_V.f64le` | `ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c` | 1,024 |
| 3 | `coefficients/tail_H.f64le` | `5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1` | 256 |
| 4 | `coefficients/tail_Q.f64le` | `5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1` | 256 |
| 5 | `initializer/core_L2_join_barrier.f64le` | `23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9` | 32 |

Aggregate size: `2,664` bytes.  
Canonical in-memory receipt self hash:
`5d8d66da56daf03d530cd9e3ddcb618549b39a883ebca0c16140fd471451781a`.

## Frozen implementation bindings

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| B1 packet | `f76682d88435f3a6256f402bccb9ffca27afe28dce1ccb810a08609cf97e8291` | 6,573 |
| failed B1 source | `09c191ff5be53ce3829e97f9ce13659544d5856dbcaf470402157e786c72f724` | 25,304 |
| B1-R1 diagnosis packet | `1a300324068fb48fcd7cd245332b89910db997a11e4353197442be044d4fabdc` | 2,579 |
| B1-R1 source | `b96124285781c00a9f884fb162591c5f7bc6817081e6ddd74e2e41cab5ca3e1e` | 14,481 |

## Chronology and locks

- B1-R1 invocation count: one.
- Candidate solve count: zero.
- Payload persistence count: zero.
- Retry/retune count: zero.
- Runtime loaded-byte identity authenticated: false.
- Runtime-disjoint replay authority: false.
- Candidate, proof, execution, replay, pair-agreement, lamp, Theory Graph,
  physical, propulsion and transport authority: false.

This result authorizes no consumer by itself. A separately frozen B1-R2 packet
must independently reproduce every byte, verify the receipt, and use exclusive
write/readback if the payloads are to become an initializer instance.
