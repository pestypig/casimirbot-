# NHM2 spherical boson-star v2 G2B-B4-R2 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot corrected-initializer four-grid execution  
Current maturity: tested and byte-pinned additive successor  
Target maturity: authenticated first-failure receipt or bounded four-grid `PASS`  
Required frozen inputs: B4-R2 packet/wrapper/tests, immutable B4, B4-R1 initializer and admitted Linux runtime  
Required evidence: exact sole command, exclusive output, terminal chronology and independent audit  
Stop/fail criteria: output collision or first prerequisite/grid/solve/pair/persistence failure  
Explicit non-goals: algorithm/grid/threshold changes, retry, retune, later proofs or authority promotion  
Downstream gate unlocked: separately sealed vacuum-continuation packet only after exact four-grid `PASS`

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R2 packet | 3,641 | `ef8c9167bee5d5dcc265fbe0217baaf8a7d2868cfa62e7186997788868579f72` |
| integrated runner | 8,885 | `1bb93cc367e6c5b0e48ab57e041a14f9e209630653b14a148ac4b09c915884ab` |
| immutable B4 spine | 39,362 | `f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f` |
| preexecution tests | 3,486 | `9762285b6c471d959db1ac47d302b47ab8e7e0c98cd8465dd83e596497051d68` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The host battery passed `7/7` without creating the production root. It independently validates the corrected receipt/inventory, confirms every scalar recomputation bit, proves the additive configuration preserves node counts, amplitude schedule, thresholds and authority locks, and rehashes the immutable B4 failure and execution spine.

## Sole execution command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R2_EXECUTION_TOKEN=ef8c9167bee5d5dcc265fbe0217baaf8a7d2868cfa62e7186997788868579f72 `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r2_integrated_four_grid_successor.py
```

The output root must be absent immediately before invocation. The command may run once. Exit `0` means bounded four-grid PASS, exit `3` means an authenticated mathematical FAIL, and exit `2` means a typed prerequisite/runner failure. All outcomes keep every authority lock false.
