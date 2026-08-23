# NHM2 spherical boson-star v2 G2B-B4-R4 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot four-grid execution with audited predictor/path corrections  
Current maturity: tested and byte-pinned additive successor  
Target maturity: authenticated first-failure receipt or bounded four-grid `PASS`  
Required frozen inputs: B4-R4 packet/wrapper/tests, immutable B4, B4-R1 initializer, B4-R3 decision and admitted Linux runtime  
Required evidence: exact sole command, exclusive output, terminal chronology and independent audit  
Stop/fail criteria: output collision or first prerequisite/grid/solve/pair/persistence failure  
Explicit non-goals: payload/algorithm/grid/threshold changes, retry, retune, later proofs or authority promotion  
Downstream gate unlocked: separately sealed vacuum-continuation packet only after exact four-grid `PASS`

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R4 packet | 4,380 | `cc4f81c0fb37bb84d35adb7bc84e3e9322d0f4b10186e0bb734d5d5afeba5acc` |
| integrated runner | 13,018 | `e60ecb4ddfaa1caf7a3b811554975ce5b9c53482e10f25bc9c901ac37d609027` |
| immutable B4 spine | 39,362 | `f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f` |
| preexecution tests | 4,358 | `84e6895f826bff1c847346de5ee671b88af41e99a1d95e7a297e6f61f9c86023` |
| B4-R1 receipt | 7,212 | `fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590` |
| B4-R3 receipt | 5,971 | `e5f22ce8fd9814d55395d1ea585c650a412520ccccaa1c51be072d2f68dcfd5b` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The host battery must pass without creating the production root. It validates
both prerequisite receipt self hashes and semantics, rehashes the exact payload
inventory, proves the sole source deletion exists exactly once in immutable B4,
materializes the unchanged `2^-10` predictor, emits/re-opens only actual-root
paths, and confirms frozen numerics and every authority lock are unchanged.

## Sole execution command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R4_EXECUTION_TOKEN=cc4f81c0fb37bb84d35adb7bc84e3e9322d0f4b10186e0bb734d5d5afeba5acc `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r4_integrated_four_grid_successor.py
```

The output root must be absent immediately before invocation. The command may run once.
Exit `0` means bounded four-grid PASS, exit `3` means an authenticated
mathematical FAIL, and exit `2` means a typed prerequisite/runner failure. All
outcomes keep every authority lock false.
