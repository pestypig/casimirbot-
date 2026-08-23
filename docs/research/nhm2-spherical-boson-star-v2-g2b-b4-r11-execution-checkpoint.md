Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R11 no-solve diagnostic checkpoint
Current maturity: frozen and eligible for one diagnostic invocation
Target maturity: immutable terminal-equivalence diagnosis receipt
Required frozen inputs: exact packet, producer, tests and admitted Linux image
Required evidence: hashes, absent exclusive root, focused host/Linux tests
Stop/fail criteria: any hash/root/runtime mismatch or partial diagnostic output
Explicit non-goals: B4-R10 retry, Newton/continuation, retune or authority promotion
Downstream gate unlocked: branch closure or one supported successor class

# B4-R11 execution checkpoint

The following three files are frozen:

| Role | Bytes | SHA-256 |
|---|---:|---|
| packet | 4,156 | `0efdd26ff1447b1ebb146c125445bca8a647bd3aa543fad7a991ba552eb79129` |
| diagnostic | 18,449 | `7ef946fe2e08dc9f04da1a22b7b7245ce95f284bca7431f6fac4a9a3be3d4de7` |
| no-candidate tests | 1,552 | `e8a152de6f29b5a25656e7557a4bb2638f31622f7a02630629fd1bcdc768c006` |

The admitted offline runtime remains
`sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`.
The exclusive output root must be absent immediately before invocation.

After host and admitted-Linux 5/5 no-candidate tests pass, the sole command is:

```powershell
docker run --rm --network none -e PYTHONDONTWRITEBYTECODE=1 -v "${PWD}:/workspace" -w /workspace sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1 tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r11_terminal_equivalence_diagnosis.py
```

PASS, a typed error, or a partial receipt becomes evidence. The command cannot
be retried under this checkpoint. It cannot modify or reinterpret B4-R10.
