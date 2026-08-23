# NHM2 spherical boson-star v2 G2B-B4-R3 result record

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: lowest-stage predictor semantics and actual-root payload paths  
Current maturity: independently audited authority-neutral `PASS`  
Target maturity: separately sealed fresh-output four-grid successor  
Required frozen inputs: branch policy, evaluator, continuation/Newton interfaces, B4-R1 payloads and immutable B4-R2 evidence  
Required evidence: exact identity-predictor decision, origin words, path/hash closure, offline receipt and independent audit  
Stop/fail criteria: first binding/formula/interface/path/word/runtime/audit mismatch; no grid or solve  
Explicit non-goals: payload rescaling, B4-R2 mutation, grid/continuation/Newton execution, retry, retune or authority  
Downstream gate unlocked: preparation of a separately sealed fresh-output four-grid successor

## Result

Status: **PASS**.

The frozen policy uniquely resolves the factor-64 observation. It requires the same λ=`2^-5` initializer output to be used as caller predictor for the first target `A=2^-16`, then continued through `A=2^-10`. The continuation interface accepts that caller state unchanged and supplies the target amplitude separately to Newton. Newton imposes the target through its residual row and does not require predictor-target origin equality before solving.

Therefore the supported successor transformation is `IDENTITY_NO_BYTE_CHANGES`. The B4-R2 assertion demanding that the predictor already equal `2^-16` is an extra invariant contradicted by the frozen chronology. It may be removed; λ, the amplitude schedule, fields, coefficients, scalar values, tail/join bytes, grids, solvers, thresholds and chronology may not be changed.

## Exact evidence

Output root:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/
  g2b-b4-r3-initializer-predictor-binding-v1/
```

Receipt:

- size: `5,971` bytes;
- raw SHA-256: `e5f22ce8fd9814d55395d1ea585c650a412520ccccaa1c51be072d2f68dcfd5b`;
- self hash: `c067e2109f1aeba8bb3f1329d3ddf3c6db8663e1c35c4e35d443d86a896738d3`;
- decision: `IDENTITY_PREDICTOR_AND_ACTUAL_ROOT_PATHS_UNIQUELY_SUPPORTED`;
- grid generated: `false`;
- Newton executed: `false`;
- four-grid execution authorized: `false`.

Independent MPFR512 reconstruction agrees with the primary MPFR256 words:

| Quantity | Binary64 word |
|---|---|
| Newtonian core `u(0)` | `3ff0000000000000` |
| physical predictor `varphi(0)=2^-10` | `3f50000000000000` |
| first Newton target `2^-16` | `3ef0000000000000` |
| terminal target `2^-10` | `3f50000000000000` |
| predictor `F0(0)` | `bf5577dc22559451` |
| predictor `F1(0)` | `3f5577dc22559451` |
| predictor `w` | `3feffa75d60dd448` |

## Path repair

All six payload bindings now emit paths derived from the actual B4-R1 initializer root. The receipt's independent audit opened each emitted path and reproduced its recorded size/hash. No legacy B1 path remains in the ordered payload inventory.

The future runner must use:

```text
(INITIALIZER_ROOT.relative_to(ROOT)/payload_relative_path).as_posix()
```

and re-open that exact path before receipt creation. This closes the B4-R2 replay-path defect without copying or mutating a payload.

## Audit and authority

Preexecution passed `7/7` on host and admitted Linux. The separate read-only audit passed `5/5` on host and Linux without importing the producer. B4-R2 remains immutable.

Candidate admission, proof duties, execution, replay, joint geometry/state, 68-file lanes, Theory Graph lamps, physical viability, propulsion and transport authority remain false. This result unlocks only preparation of a separately sealed fresh-output four-grid successor.

## Current-tree verification

- math registry: `318` entries, PASS;
- WARP suite: `18/18` files and `179/179` tests, PASS;
- Casimir adapter run `2438`: `PASS/GREEN`;
- certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- certificate integrity: `true`.

The certificate verifies the constraint-pack handoff only and does not authorize the next four-grid execution or promote any scientific/physical claim.
