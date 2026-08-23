# NHM2 spherical boson-star v2 G2B-B4-R1 scalar-ABI reconciliation

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: initializer scalar-role diagnosis and additive successor instance  
Current maturity: preregistered versioned parent repair after immutable B4 prerequisite failure  
Target maturity: independently audited authority-neutral successor payload binding  
Required frozen inputs: M5/M5-R1 evidence, immutable B1-R2 instance, immutable B4 failure, Newtonian seed definitions, primary materialization graph and unchanged initializer evaluator  
Required evidence: exact role provenance, fixed corrected scalar graph, expected binary64 words, exclusive persistence, self-hashed receipt and independent read-only audit  
Stop/fail criteria: first source/hash/role/formula/word/domain/collision/write/readback/audit mismatch; no retry, reinterpretation, solve, or retune  
Explicit non-goals: modifying B1/B4 evidence, rerunning M5, executing a grid or Newton solve, candidate admission, replay/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: separately sealed fresh-output four-grid successor only after exact PASS

## Classification

The B4 conflict is a B1 payload-construction defect, not an unresolved choice between two scientific definitions.

The frozen Newtonian seed defines

```text
C = integral_0^infinity x^2 u0(x)^2 dx = N0/(4*pi)
V0(x) = -C/x + exponentially small sourced correction
sigma = C/kappa - 1
```

The frozen operation policy uses `C` as tail-system unknown zero, as the Coulomb coefficient in `V=-C/x+E*Q`, and in the full-mass fixed-point row. The primary materialization graph requires `C` to be the accepted tail-unknown binary64 word and recomputes `N0`, `kappa`, `sigma`, `lambda`, `nu_star`, and `wSeed` in MPFR256 from the serialized `nu0` and `C` bits. The unchanged initializer evaluator implements the same graph.

M5 also kept the roles separate: it sets `mass=R^2*V'(R)`, uses `V=-mass/x`, uses `sigma=mass/kappa-1`, and supplies scalar amplitude independently as the join value `U`. The B1 packet alone collided those roles by naming

```text
M = R^2*V1
C = U*exp(kappa*R)/R^sigma
```

then placing the second quantity into the payload slot whose inherited semantic role is the Coulomb/mass coefficient. The scalar principal amplitude is already represented by `U` and the `H` lift; it is not a scalar-payload field.

This successor restores the pre-existing semantics. It introduces no new physical formula and changes no threshold, grid, coefficient, join value, or candidate identity.

## Frozen successor graph

Read only the six already persisted B1-R2 payloads. Do not import or invoke any M5 or B1 materializer.

1. Decode the old scalar words and `[U,U1,V,V1]` join words exactly.
2. Set `R=32` in isolated MPFR256 RNDN.
3. Recover the M5 Coulomb/mass word by `C64=get_d_RNDN(R^2*set_d(V1_64))`. Because `R^2=2^10`, scaling commutes exactly with binary rounding and recovers the binary64 word of M5's `R^2*V'(R)` mass.
4. Reinject `nu0_64`, `Vc_64`, and `C64`; compute the unchanged evaluator graph:

```text
kappa = sqrt(-2*nu0)
sigma = C/kappa - 1
N0 = 4*pi*C
lambda = 1/32
nu_star = lambda^2*nu0
wSeed = sqrt(1+2*nu_star)
```

5. Convert in exact scalar order `[nu0,Vc,N0,C,kappa,sigma,lambda,nu_star,wSeed]` with one RNDN barrier per field.
6. Copy the other five payload byte strings exactly from B1-R2 after rehashing them.

The expected corrected scalar words are frozen before persistence:

| Field | Big-endian binary64 word |
|---|---|
| `nu0` | `bfe626bcc563863f` |
| `Vc` | `bff577dc22559451` |
| `N0` | `4039ea32f7793312` |
| `C` | `40007f765a3009fd` |
| `kappa` | `3ff2d379a0d0a3e0` |
| `sigma` | `3fe815d49929ae09` |
| `lambda` | `3fa0000000000000` |
| `nu_star` | `bf4626bcc563863f` |
| `wSeed` | `3feffa75d60dd448` |

Expected `scalars.f64le` size: `72`.  
Expected corrected scalar raw SHA-256: `47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a`.

The legacy amplitude word `400f088c787f495b` is retained only as diagnosed evidence and is not serialized as successor `C`. The corrected `C` produces `V+C/R=-2^-56` from the separately rounded join words; that one-word join discrepancy is preserved by the existing C1 lift and is not rounded away or treated as exact equality.

## Persistence and authority

The sole output root is:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b4-r1-initializer-scalar-abi-v1/
```

It must be absent before the one authorized invocation. The producer writes all six payloads exclusively, flushes and rehashes them, and writes a canonical length-delimited self-hashed receipt last. A collision is terminal and the root must never be deleted or reused by this packet.

The receipt must bind the immutable B4 terminal self hash `b5c47be2bef48e1e9b6a55667a8d83f712bcd552e2b0fcb5939dfc24f5065b0b`, the unchanged evaluator raw hash `05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4`, every authoritative definition source, every input/output payload, the admitted Linux runtime, and all false authority locks.

This packet changes payload binding semantics only by restoring the already frozen `C` role. It grants no runtime, proof, execution, replay, candidate, lamp, physical, propulsion, or transport authority. A PASS may authorize preparation of a new four-grid packet with a new output root; it does not authorize that run itself.

