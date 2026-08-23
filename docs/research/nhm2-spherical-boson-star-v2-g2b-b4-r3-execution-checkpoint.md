# NHM2 spherical boson-star v2 G2B-B4-R3 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot predictor/path reconciliation binding  
Current maturity: tested and byte-pinned authority-neutral diagnosis  
Target maturity: independently audited successor runner binding  
Required frozen inputs: B4-R3 decision, producer/tests, B4-R1 payloads, B4-R2 failure, policy/interfaces and Linux runtime  
Required evidence: sole offline invocation, actual-root path rehashes, origin words, exclusive self-hashed receipt  
Stop/fail criteria: first source/runtime/interface/path/word/collision/write/readback mismatch  
Explicit non-goals: payload mutation, grid generation, continuation/Newton solve, retry, retune or authority  
Downstream gate unlocked: separately sealed fresh-output four-grid successor only after audited `PASS`

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R3 parent decision | 5,402 | `5cca41bfec505738de377dcb25b3f56fb9db44015707ed48340899c20f9fbe10` |
| reconciliation producer | 16,853 | `c27c1c21bbeb679af1cb36c8e84d92231bcae884f6d5449c26f112760d17996b` |
| preexecution tests | 4,052 | `22a45cd931b7a8d48fe703286112f16400962099588e12d50b687ba66f9d761f` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The host battery passed `7/7`. It proves the frozen policy requires the λ=`2^-5` output to act as caller predictor for target `2^-16`, verifies the continuation/Newton interface does not require predictor-target origin equality, independently reproduces all origin words at MPFR256 and MPFR512, rehashes all six payloads through actual successor paths, and confirms no grid/solver surface is imported or invoked.

## Sole execution command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R3_EXECUTION_TOKEN=5cca41bfec505738de377dcb25b3f56fb9db44015707ed48340899c20f9fbe10 `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r3_predictor_path_reconciliation.py --execute-once
```

The output root must be absent immediately before invocation. The command may run once. A PASS creates only one authority-neutral receipt and authorizes preparation—not execution—of a separately sealed four-grid successor.
