# NHM2 spherical boson-star v2 G2B-B4-R5 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot read-only terminal-Newton diagnosis  
Current maturity: tested and byte-pinned diagnostic producer  
Target maturity: independently audited mechanism classification and successor decision  
Required frozen inputs: B4-R5 packet/producer/tests, immutable B4-R4 endpoint and frozen evaluator/LU sources  
Required evidence: exact sole command, exclusive receipt, reconstruction identity and independent audit  
Stop/fail criteria: output collision or first binding/replay/solve/trial/persistence mismatch  
Explicit non-goals: Newton/continuation execution, accepted trial, B4-R4 retry, retune, candidate/proof/lane/lamp/physical authority  
Downstream gate unlocked: at most one separately versioned successor proposal when the frozen decision supports it

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R5 packet | 6,986 | `ca29bf1462524800db82372ccf7f40c2d603e94d83d788664df50eae47b11a45` |
| diagnostic producer | 25,338 | `ef0814e2877b168506efa5f946ecf56cbaf74362506a3ee6cf7edcf82d9cb829` |
| preexecution tests | 4,810 | `4f9b6acdc885c9e1afbe6520b319215c3a23b0f19792f4327175b6075d261940` |
| B4-R4 terminal receipt | 2,739 | `4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204` |
| B4-R4 terminal state | 1,544 | `972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The host and admitted-image tests must pass without importing a solver or
evaluating the endpoint. They rehash every frozen input, inspect the producer
AST to exclude calls to Newton/continuation chronology, verify exact row labels,
exercise every frozen decision family, preserve all authority locks, and require
the production root to be absent.

## Sole diagnostic command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R5_EXECUTION_TOKEN=ca29bf1462524800db82372ccf7f40c2d603e94d83d788664df50eae47b11a45 `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r5_terminal_newton_diagnosis.py
```

The diagnostic command may run once. The B4-R4 root must remain byte-identical
and the B4-R5 output root must be absent immediately before invocation. Exit `0`
means a reconstructed and classified diagnostic `PASS`; exit `2` means a typed
`BLOCKED` prerequisite or reconstruction failure. Neither outcome changes
B4-R4's numerical `FAIL` or any authority lock.
