# NHM2 spherical boson-star v2 G2B-B4 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot integrated four-grid execution checkpoint  
Current maturity: tested and byte-pinned preexecution implementation  
Target maturity: exact first-prerequisite or first-math failure receipt, otherwise bounded four-grid PASS  
Required frozen inputs: B4 packet, runner, tests, B1-R2 instance, B3 runtime image and all runner-enforced bindings  
Required evidence: sole command, exclusive output, terminal receipt and zero work after the first failure  
Stop/fail criteria: output collision or first prerequisite/runtime/initializer/grid/solve/pair/persistence failure  
Explicit non-goals: repair during execution, retry, retune, candidate admission, replay/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: result record; vacuum-continuation work only if terminal status is `PASS`

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4 packet | 4,867 | `2da6aeb214e67183cb65b9c5bee2b5f29d9dd6f2dd352b92510d444332ea1df7` |
| integrated runner | 39,362 | `f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f` |
| preexecution tests | 6,292 | `d9c8b339603c5137a4a976a591d902b5d58a0bbd0882924230d425b7475e7337` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The tests passed `7/7` both on the host and inside the exact admitted image with networking disabled. They do not call the continuation solver. Their scalar-ABI falsifier observed that the persisted payload does not satisfy two mandatory bit-identity checks in the frozen initializer evaluator:

| Field | Recomputed word | Payload word |
|---|---|---|
| `N0` | `40485fa24bc6145c` | `40485fa24bc6145b` |
| `sigma` | `40025ff41467e26d` | `3fe815d49929ae09` |

This checkpoint does not reinterpret or repair those observations. The production invocation remains necessary to bind the admitted runtime, all exact inputs, and the fail-closed disposition into the sole terminal artifact. Because prerequisite validation precedes grid generation, a repeated mismatch must produce zero grid and zero solve attempts.

## Sole execution command

From the canonical repository root, with `$repo` equal to that resolved root:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_EXECUTION_TOKEN=2da6aeb214e67183cb65b9c5bee2b5f29d9dd6f2dd352b92510d444332ea1df7 `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_integrated_four_grid_runner.py
```

The output root must be absent immediately before invocation. The command may run once. Exit `0` is bounded PASS, exit `3` is an authenticated mathematical/prerequisite FAIL returned normally, and exit `2` is a typed runner failure. Any result leaves all authority locks false.
