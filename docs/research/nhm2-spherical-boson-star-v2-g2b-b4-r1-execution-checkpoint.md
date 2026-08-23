# NHM2 spherical boson-star v2 G2B-B4-R1 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: one-shot scalar-ABI successor persistence  
Current maturity: tested and byte-pinned parent repair implementation  
Target maturity: independently audited authority-neutral successor binding  
Required frozen inputs: B4-R1 packet, immutable B1 payloads/B4 failure, frozen definitions and admitted Linux runtime  
Required evidence: sole command, exclusive payloads, canonical self-hashed receipt and read-only audit  
Stop/fail criteria: first binding/runtime/semantic/word/collision/write/readback mismatch  
Explicit non-goals: grid solve, retry, retune, candidate admission, replay/lamp/physical/propulsion/transport authority  
Downstream gate unlocked: separately sealed fresh-output four-grid successor packet only after audited PASS

## Frozen implementation

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| B4-R1 parent decision | 5,497 | `4410fbf790bbea053106849c3a984f66b89d8968310ff967e7468a3572a702ec` |
| successor producer | 20,797 | `2528ad73567c4dbde4fcdcc1b113d5355764823b1d62a84f3ac0c542ec676179` |
| preexecution tests | 3,945 | `432db71ef2504f4f9ac4071e31b55a72ac427699e46901eee6358d0d1afebb57` |
| admitted Linux image | 47,156,614 | `sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1` |

The preexecution battery passed `8/8` on the host. It binds all parent evidence, validates both parent receipt self hashes, confirms exact binary scaling from the persisted `V1` word, reproduces the frozen nine corrected scalar words at MPFR256, independently reaches the same binary64 bins at MPFR512, and confirms context restoration. It creates no production artifact and imports no M5, B1 materializer, continuation, grid, or solver implementation.

The only byte replacement is `scalars.f64le`. Its frozen size is 72 bytes and its expected raw SHA-256 is `47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a`. The other five payloads must be byte-identical copies. The immutable B4 failure remains unchanged and no grid solve is authorized here.

## Sole execution command

From the canonical repository root, with `$repo` equal to that resolved root:

```powershell
docker run --rm --network none `
  -v "${repo}:/workspace" -w /workspace `
  -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 `
  -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  -e NHM2_G2B_B4_R1_EXECUTION_TOKEN=4410fbf790bbea053106849c3a984f66b89d8968310ff967e7468a3572a702ec `
  sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 `
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r1_scalar_abi_reconciliation.py --execute-once
```

The output root must be absent immediately before invocation. The command may run once. Any mismatch is terminal; the root is never deleted or reused. A PASS persists corrected bytes only, keeps every authority lock false, and unlocks preparation—not execution—of a separately sealed four-grid successor.
