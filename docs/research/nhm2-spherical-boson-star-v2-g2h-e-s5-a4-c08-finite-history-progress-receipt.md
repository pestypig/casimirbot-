# G2H-E-S5 A4 C08-011c1 Finite-History Progress Receipt

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c1 append-only finite-ledger admission, scalar onset P-norm and weighted-history kernel
Current maturity: candidate-neutral implemented and independently source/runtime-audited partial C08-011c component; actual arbitrary-left-endpoint continuation provider absent
Target maturity: complete C08-011c with a versioned provider that actually extends accepted C08-006 through C08-010 models to `T=2*T0`
Required frozen inputs: acknowledged Borel definition `7dd4d30a...94737`; audited C08-010 ledger; audited C08-011b witness; exact onset schedule; 512-bit directed arithmetic
Required evidence: early-tail-before-provider chronology; canonical byte-identical prefix reuse; terminal ledger coverage; all 13 onset P-norm boxes; every directed weighted panel contribution and total; typed finite failure; corruption, determinism and root guards
Stop/fail criteria: treating a callback seam as finite continuation, prefix mutation, model shrink, incomplete terminal coverage, selected-member ingress, protected-root creation, or authority promotion
Explicit non-goals: claiming C08-011c or C08-011 complete; implementing C08-011d/e; selected-member evaluation; token/authorization/output-root creation; Rust/G3/SI/metric/lane work; authority promotion
Downstream gate unlocked: C08-011c2 arbitrary-left-endpoint validated successor-panel producer only

Date: August 25, 2026

## Decision

`PASS_PARTIAL_C08_011C1_HISTORY_ADMISSION_KERNEL_CONTINUATION_PROVIDER_UNBOUND`

The new candidate-neutral kernel now performs the parts of C08-011c that can be
closed without pretending that an arbitrary continuation panel already exists:

1. it admits only an exact C08-011b pass bound to the same frozen onset;
2. only then does it invoke a typed finite-continuation provider for
   `T=2*T0`;
3. it canonically serializes every ledger identity, model geometry, order,
   coefficient ball and remainder ball, verifies the complete preextension
   prefix byte-for-byte, and records before, reused-prefix and terminal SHA-256
   digests;
4. it independently replays the C08-010 ledger grammar and requires every
   returned ledger to cover `T`;
5. it evaluates all closed-face models at `T0`, hulling both sides of a shared
   face, then computes the exact displayed 16-term P-norm majorant for the value,
   three first and nine ordered-second state boxes;
6. it integrates each requested finite history panel in increasing chronology,
   using exact `h^(k+1)/(k+1)` moments for `sigma=0` and directed lower
   incomplete-gamma moments for strict `sigma>0`; coefficient and remainder
   magnitudes are accumulated without cancellation; and
7. it propagates a typed C08-006 through C08-010 finite failure without trying
   another onset.

## Bound implementation

| Artifact | SHA-256 |
| --- | --- |
| `mini_boson_star_primary_c08_finite_history_v1.hpp` | `542def46fc4be14bef0bd08f898756a2a0ffd24e3c69dd6fc6e7bd7de37d8abf` |
| `mini_boson_star_primary_c08_finite_history_v1.cpp` | `4046b63af437d24d5337e6c95cb9f6b95f55f6a8911c32071f9d906418886bb2` |
| `mini_boson_star_primary_c08_finite_history_fixture_v1.cpp` | `c428d5adb39ae89bec6da37f307b1c2bce1735208a09b7dee73796678e889204` |
| `Dockerfile.primary.mini-boson-c08-finite-history-fixture.v1` | `fe140761f19f193cb901a6bda969db4e17977fe1979a170f8195ae891c2661fe` |
| `nhm2_g2h_e_s5_c08_finite_history_runtime_audit.py` | `b2be74b378701ae6b9ff37ebbbbf20701100947e4b1a8e82f7729621f7db399c` |
| fixture executable | `aac2bbd82942704ed6450bbd11ae1a7f5912b35b86f299324d0eae2358ca20f9` |

The independent audit image is
`sha256:04920b362813f621e1581a6989f5c129069c302802c7b88b69b35b14ac0e264b`.
It is fixture evidence only.

## Evidence

- Manufactured append-only extension and onset/history fixture: `25/25 PASS`,
  byte-identical twice.
- Independent recursive source/runtime audit: `86/86 PASS`.
- C08-011b predecessor audit: `92/92 PASS`.
- Acknowledged-definition cross-language replay: `27/27 PASS`.
- The manufactured ledger grows from eight to twelve total models, produces 52
  onset state boxes and records 52 weighted panel/jet contributions.
- Corruption fixtures reject early-tail/onset mismatch, invalid onset, untyped
  provider failure, typed finite failure, prefix mutation, model shrink,
  terminal undercoverage, duplicate/missing scalar or history identities,
  touching-zero sigma, duplicate orientations and null outputs.
- Candidate evaluations, positive samples and selected-state reads remain zero.
- Candidate roots, execution ledgers, token and authorization remain absent.
- Scientific handler linked: false; every authority remains false.

## Exact remaining implementation gap

The audited C08-007/C08-009 v1 API accepts an origin-series input and target
endpoint only. Its implementation fixes every constructed positive panel's
left endpoint to `origin.t0` and initializes its constant Taylor coefficient
from the origin enclosure. It has no input for the complete accepted left-end
state ball at an arbitrary later panel and therefore cannot extend a ledger
beyond the first positive panel.

The provider exercised above is deliberately manufactured. It proves the
post-provider admission, prefix, onset and history mathematics, but it is not a
scientific continuation implementation. C08-011c remains incomplete.

The next eligible slice is a separately versioned C08-011c2 successor-panel
producer. It must consume the complete accepted left-end value/first/ordered-
second boxes, retain the existing exact equations and fixed order/halving/
Picard/convolution schedules, append one panel without recomputing its prefix,
and then drive that operation monotonically to `T`. This is an implementation
completion, not a new selector and not permission to read the frozen member.

## Authority boundary

This receipt changes proof-producer maturity only. It does not complete
C08-011c, C08-011, C08 or S5-A; it does not link a handler or authorize any
scientific execution; and it promotes no candidate, proof, geometry/state,
lane, lamp, physical, propulsion or transport authority.
