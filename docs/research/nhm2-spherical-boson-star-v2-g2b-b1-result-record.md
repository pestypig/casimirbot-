# NHM2 spherical-boson-star v2 G2B-B1 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: M5-R1 entry binding and six-payload initializer successor  
Current maturity: immutable preregistered B1 failure  
Target maturity: exact first-failure evidence  
Required frozen inputs: B1 packet and its exact source/input bindings  
Required evidence: first failing invariant, exact mismatch, no downstream work  
Stop/fail criteria: record the first result without retry or repair  
Explicit non-goals: reinterpretation, changed invariant, candidate solve or authority  
Downstream gate unlocked: separately versioned B1-R1 representation diagnosis

## Result

`FAIL` at `g2b_b1_origin_normalization_failed`.

The preregistered materializer verified all bound packet, policy, M5, M5-R1,
runtime, receipt-schema, self-hash, selected-mode, exact coefficient-wire and
`nu` inputs. It converted the admitted 128-mode exact dyadics to the required
binary64 coefficient payload representation and then stopped at the first
frozen mathematical invariant, before emitting payloads or running a candidate.

Exact observed binary64-coefficient reconstruction at `rho=0`:

```text
u_payload(0) - 1
  = 10445944158304557
    / 324518553658426726783156020576256
  ~= 3.2189050643001064e-17
```

The exact MPFR sum is therefore not equal to one. Its one-time binary64 RNDN
conversion is nevertheless exactly `0x1.0000000000000p+0`. The M5 exact-dyadic
projection's separately recorded pre-payload endpoint error remains
`59 * 2^-254`; this record does not reinterpret either observation.

## Frozen bindings

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| B1 packet | `f76682d88435f3a6256f402bccb9ffca27afe28dce1ccb810a08609cf97e8291` | 6,573 |
| B1 materializer source | `09c191ff5be53ce3829e97f9ce13659544d5856dbcaf470402157e786c72f724` | 25,304 |
| M5-R1 admission raw | `41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83` | 12,888 |
| M5-R1 admission self hash | `c37c0a329765c558c99e559bfede6aed815244f372d289085953f7aed097d1a8` | receipt field |
| M5 projection raw | `0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf` | 309,486 |
| M5 projection self hash | `646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d` | receipt field |

## Chronology and locks

- Invocation count: one.
- Candidate solve count: zero.
- Payload persistence count: zero.
- Cross-grid evaluation count: zero.
- Retry/retune count: zero.
- Later B1 computations: not executed after the failed invariant.
- Candidate, proof, execution, replay, pair-agreement, lamp, Theory Graph,
  physical, propulsion and transport authority: false.

The B1 packet remains failed. Any alternative endpoint admission rule requires a
new versioned diagnosis and cannot overwrite this result.
