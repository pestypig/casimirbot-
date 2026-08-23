Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R11-R1 diagnostic execution checkpoint
Current maturity: frozen and eligible for one invocation
Target maturity: immutable terminal-equivalence diagnosis receipt
Required frozen inputs: exact R11 evidence, R11-R1 packet/wrapper/tests and image
Required evidence: hashes, 5/5 host/Linux tests and absent fresh root
Stop/fail criteria: any mismatch, partial output or typed R11-R1 error
Explicit non-goals: R11 retry, B4-R10 retry, Newton/continuation or retune
Downstream gate unlocked: branch closure or one supported successor class

# B4-R11-R1 execution checkpoint

| Role | Bytes | SHA-256 |
|---|---:|---|
| repair packet | 1,691 | `d733536b8b6eed50ec2f809662799c986cb205120c76c9046bc6c069d944ef13` |
| wrapper | 4,574 | `84c0282178dc1e20ea7ad2fd5b5e26b270ca0bc3957fec26a444b692725ee159` |
| no-candidate tests | 1,638 | `9a89e7339416db919524df83e6dd63cb8b0ac37ce13fdb193605c43b6c58e2d8` |
| frozen R11 source | 18,449 | `7ef946fe2e08dc9f04da1a22b7b7245ce95f284bca7431f6fac4a9a3be3d4de7` |

The admitted image is
`sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`.
The fresh R11-R1 output root must be absent immediately before invocation.

The sole command is:

```powershell
docker run --rm --network none -e PYTHONDONTWRITEBYTECODE=1 -v "${PWD}:/workspace" -w /workspace sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r11_r1_terminal_equivalence_diagnosis.py
```

No retry is permitted. Any result or typed error is terminal for this diagnostic
family and leaves B4-R10 immutable.
