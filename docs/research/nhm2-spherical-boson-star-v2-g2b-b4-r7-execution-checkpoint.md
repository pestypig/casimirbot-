# NHM2 spherical boson-star v2 G2B-B4-R7 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: no-solve scaling/boundary causal discriminator  
Current maturity: tested and byte-pinned authority-neutral review producer  
Target maturity: independently audited unique causal classification or unresolved stop  
Required frozen inputs: B4-R7 packet/producer/tests, immutable B4-R4 state, B4-R6 receipt and evaluator sources  
Required evidence: exact sole command, intervention cells, constraint normalizations, exclusive receipt and independent audit  
Stop/fail criteria: output collision or first binding, reconstruction, intervention, factor, normalization, persistence or audit mismatch  
Explicit non-goals: correction solve, Newton/continuation, trial, update, retry, retune, candidate/proof/lane/lamp/physical authority  
Downstream gate unlocked: at most one separately sealed proposal preparation after an exact supported classification

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R7 packet | 8,911 | `a389dde8a2557d7da3290b2fe8b7a6ba6edb7d9edb0cd6d6e10e67df51647b4f` |
| review producer | 22,188 | `7399be95aacbc24285721d6c0be652619bb3daf0b9dde50b577ac4527152cd9e` |
| preexecution tests | 7,080 | `6d4e7626730e621f7962851b892c31d44079e5d3a77c6030d800bec3b4d3f6c8` |
| B4-R4 terminal state | 1,544 | `972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c` |
| B4-R6 receipt | 12,503 | `e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

Host and admitted-image tests must pass without evaluating the endpoint. They
rehash every frozen input, independently recompute the B4-R6 self-hash, bind
the exact first/middle/last interventions, exercise normalization helpers and
all classification precedence, exclude solver/update/trial calls by AST, and
preserve all authority locks. The exclusive output root must be absent before
the sole command.

## Sole review command

From the canonical root, with `$repo` equal to its resolved path:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R7_EXECUTION_TOKEN=a389dde8a2557d7da3290b2fe8b7a6ba6edb7d9edb0cd6d6e10e67df51647b4f `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r7_causal_interaction_review.py
```

The review command may run once. B4-R4 and B4-R6 must remain byte-identical and
the B4-R7 output root must be absent immediately before invocation. Exit `0`
means an authority-neutral causal receipt was persisted; exit `2` means a typed
`BLOCKED` prerequisite or reconstruction failure. Neither outcome computes a
correction, updates a state, retries B4-R4, or changes any authority lock.
