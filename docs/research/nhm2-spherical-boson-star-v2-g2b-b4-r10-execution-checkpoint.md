Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R10 exact command and byte-identity checkpoint
Current maturity: preexecution checkpoint only; execution unauthorized
Target maturity: independently cleared one-shot execution prerequisite
Required frozen inputs: R9 proposal, R10 implementation/tests/audit/packet, image
Required evidence: byte hashes, exact token/command, absent exclusive output root
Stop/fail criteria: any binding, image, environment, command or root mismatch
Explicit non-goals: execution now, retry, retune, candidate/proof/lamp authority
Downstream gate unlocked: separate human authorization of exactly one attempt

# NHM2 spherical-boson-star v2 G2B-B4-R10 execution checkpoint

Execution is not authorized by this checkpoint. This document only freezes the
bytes and command that a later, explicit authorization would be allowed to use.

## Bound preexecution files

| role | bytes | SHA-256 |
|---|---:|---|
| implementation | 36,712 | `3957ebe50cf036a673547af5e32817d0cdb545b4a593ee479971539dcadd6b0a` |
| focused_tests | 3,920 | `05d3459f2d64686112a383a49823abdc0ab130045ebc51ebd55a4acb1efd41a7` |
| independent_audit | 5,437 | `f531f61589f22359177bf9049eda58417207fbe0b1fd78ccc533e0a73baa83b5` |
| implementation_packet | 6,148 | `4822a669abe9dabd0c6db7aad917f9c637fbe7a0e40f9d7fc5086327dc7996da` |

The implementation independently reopens the 27 B4-R9 frozen dependencies.
The checkpointed admitted image is:

```text
sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1
```

The fixed execution token is:

```text
b1c408e2c3a3dbc48ceee5da6998ced66579bce65bc324ffb6dbc98857c36d20
```

It is the SHA-256 of the R10 token domain, the frozen R9 primitive-source hash,
and the frozen R10 output-root identity. It is an identity lock, not authority.

## Exact future command

From the canonical repository root, the only eligible future command is:

```text
docker run --rm --network none -e PYTHONHASHSEED=0 -e PYTHONDONTWRITEBYTECODE=1 -e NHM2_G2B_IMAGE_ID=sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 -e NHM2_G2B_B4_R10_EXECUTION_TOKEN=b1c408e2c3a3dbc48ceee5da6998ced66579bce65bc324ffb6dbc98857c36d20 -v "${PWD}:/workspace" -w /workspace sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r10_equilibrated_four_grid_successor.py
```

No argument, network mode, environment change, alternate mount, image tag,
source change, or alternate output root is allowed. Before any authorization,
the output root must still be absent as both file and symlink:

```text
artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1
```

An authorization would permit one attempt only. Any created prefix is immutable
evidence, including a failure prefix. It may not be removed or reused for a
retry.
