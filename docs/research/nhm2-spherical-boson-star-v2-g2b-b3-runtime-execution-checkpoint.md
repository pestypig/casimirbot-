# NHM2 spherical-boson-star v2 G2B-B3 runtime execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: frozen four-grid classical branch  
Capability or component: Linux runtime loaded-byte admission  
Current maturity: implementation frozen and preexecution tests passing  
Target maturity: one exclusively persisted runtime manifest  
Required frozen inputs: B3 packet, image identity, probe source and focused test  
Required evidence: exact command output, canonical manifest, exclusive readback  
Stop/fail criteria: first command, input, platform, loader, libc, fenv, or output error  
Explicit non-goals: candidate solve, initializer evaluation, retune, replay or authority  
Downstream gate unlocked: integrated four-grid preexecution sealing  

This checkpoint changes receipt/runtime evidence only. It does not change any
mathematical semantics or claim status.

## Frozen bindings

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| B3 runtime packet | `a5b1e4d51263bf9a1d523c93ce7015dd9762ea9d867e560677f07f23374913b4` | 4,569 |
| Runtime probe source | `cd572f6778905507679da4a93a91370c357e5df3d03472b3299ce1f717cef1b1` | 8,271 |
| Focused runtime probe test | `0da250c27b19e6561ee2bf1f29dd2b052de886f4b446b96326abd44e8b403896` | 2,538 |
| Runtime Dockerfile | `7b378a347a14e8ddc66b5f13d4aa27de81bb92cd4da125381e97f16bc818ff4d` | 1,283 |
| Runtime requirements | `9ee7e73b1e5cb4ca2960a40959b1092627f202652ab2e02de765f2a613fa64fb` | 181 |

Immutable container image identity:
`sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1`.

## Preexecution evidence

- Focused runtime probe tests inside the immutable container: 3/3 PASS.
- Frozen binary64 environment tests inside the immutable container: 6/6 PASS.
- The fixed runtime output root is absent.
- The probe source binds and rehashes the B3 packet before platform inspection.
- The command has no network, package-install, candidate-solver, alternate path,
  retry, cleanup, deletion, or authority-promotion surface.

The sole authorized command remains exactly the command in the B3 packet. A
failure or partial fixed output becomes terminal evidence and is not retried or
removed within this packet.
