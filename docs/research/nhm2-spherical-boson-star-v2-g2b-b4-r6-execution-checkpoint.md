# NHM2 spherical boson-star v2 G2B-B4-R6 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot no-solve mechanism-separation benchmark  
Current maturity: tested and byte-pinned authority-neutral benchmark producer  
Target maturity: independently audited unique-family or explicit stop decision  
Required frozen inputs: B4-R6 packet/producer/tests, immutable B4-R4 state, B4-R5 receipt and evaluator sources  
Required evidence: exact sole command, exclusive receipt, four coordinate diagnostics, equilibration, MPFR256 reconstruction and localization measures  
Stop/fail criteria: output collision or first binding, reconstruction, factor, MPFR, persistence or audit mismatch  
Explicit non-goals: Newton/continuation/candidate solve, trial update, retry, retune, candidate/proof/lane/lamp/physical authority  
Downstream gate unlocked: at most one separately sealed successor proposal only when one frozen mechanism family is unique

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R6 packet | 7,297 | `8c9880df19fa22b659e658f3229bca67f732958d02c40e90a58741316aad477b` |
| benchmark producer | 27,212 | `6b9b7aa7f0e0831531b1c378d2cf38496363cf24491cc0a2c5c63e5b5be6c7ca` |
| preexecution tests | 6,741 | `c55045cfbbee8ccb38c228026ee1077b19ca893ebfe876cd545447309c262281` |
| B4-R4 terminal state | 1,544 | `972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c` |
| B4-R5 receipt | 20,509 | `645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The host and admitted-image tests must pass without evaluating the frozen
endpoint. They rehash every frozen input, independently recompute the B4-R5
self-hash, inspect the producer AST to exclude solver/update calls, exercise
the coordinate and equilibration transforms and every decision family, and
preserve all authority locks. The exclusive output root must be absent before
the sole command.

## Sole benchmark command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R6_EXECUTION_TOKEN=8c9880df19fa22b659e658f3229bca67f732958d02c40e90a58741316aad477b `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r6_mechanism_separation.py
```

The benchmark command may run once. The B4-R4 and B4-R5 inputs must remain
byte-identical and the B4-R6 output root must be absent immediately before
invocation. Exit `0` means an authority-neutral benchmark receipt was
persisted; exit `2` means a typed `BLOCKED` prerequisite or reconstruction
failure. Neither outcome solves or updates a candidate, retries B4-R4, or
changes any proof, lane, lamp, physical, propulsion, or transport authority.
